import inquirer from 'inquirer';
import chalk from 'chalk';
import { listProfiles } from './profiles.js';
import { icons } from './ui.js';

/** Sentinel: user chose "Back to menu". */
export const BACK = '__back__';

/**
 * @param {unknown} value
 */
export function isBack(value) {
  return value === BACK;
}

function backChoice(label = 'Back to menu') {
  return { name: `${icons.back}  ${label}`, value: BACK };
}

/**
 * @param {import('inquirer').Question} config
 * @returns {Promise<string | typeof BACK>}
 */
async function promptInput(config) {
  const { value } = await inquirer.prompt([
    {
      type: 'input',
      prefix: icons.arrow,
      ...config,
      // inquirer requires `name`; without it answers are undefined
      name: 'value',
      message: `${config.message} ${chalk.dim('(back)')}`,
      filter: (raw) => {
        const trimmed = String(raw).trim();
        if (
          trimmed.toLowerCase() === 'back' ||
          trimmed === '←' ||
          trimmed === 'b'
        ) {
          return BACK;
        }
        return trimmed;
      },
      validate: (v) => {
        if (v === BACK) return true;
        return config.validate ? config.validate(v) : true;
      },
    },
  ]);
  return value;
}

/**
 * @returns {Promise<import('./profiles.js').Profile | typeof BACK>}
 */
export async function promptAddProfile() {
  console.log(chalk.gray('\n  Fill in profile details:\n'));

  const name = await promptInput({
    message: chalk.cyan('Profile alias'),
    validate: (v) =>
      /^[a-zA-Z0-9_-]+$/.test(v)
        ? true
        : 'Use letters, numbers, _ or - only',
  });
  if (isBack(name)) return BACK;

  const gitName = await promptInput({
    message: chalk.cyan('Git user.name'),
    validate: (v) => (v ? true : 'Required'),
  });
  if (isBack(gitName)) return BACK;

  const email = await promptInput({
    message: chalk.cyan('Git user.email'),
    validate: (v) => (/.+@.+\..+/.test(v) ? true : 'Enter a valid email'),
  });
  if (isBack(email)) return BACK;

  const username = await promptInput({
    message: chalk.cyan('GitHub username'),
    validate: (v) => (v ? true : 'Required'),
  });
  if (isBack(username)) return BACK;

  return { name, gitName, email, username };
}

/**
 * @param {{ gitName: string, email: string }} current
 * @returns {Promise<{ gitName: string, email: string } | typeof BACK>}
 */
export async function promptEditProfile(current) {
  const gitName = await promptInput({
    message: chalk.cyan('Git user.name'),
    default: current.gitName,
    validate: (v) => (v ? true : 'Required'),
  });
  if (isBack(gitName)) return BACK;

  const email = await promptInput({
    message: chalk.cyan('Git user.email'),
    default: current.email,
    validate: (v) => (/.+@.+\..+/.test(v) ? true : 'Enter a valid email'),
  });
  if (isBack(email)) return BACK;

  return { gitName, email };
}

/**
 * @param {string} message
 * @param {boolean} [defaultValue=false]
 * @param {{ allowBack?: boolean }} [opts]
 * @returns {Promise<boolean | typeof BACK>}
 */
export async function confirm(message, defaultValue = false, opts = {}) {
  if (opts.allowBack) {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: chalk.yellow(message),
        prefix: icons.arrow,
        choices: [
          { name: 'Yes', value: true },
          { name: 'No', value: false },
          backChoice(),
        ],
      },
    ]);
    return choice;
  }

  const { ok } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ok',
      message: chalk.yellow(message),
      prefix: icons.arrow,
      default: defaultValue,
    },
  ]);
  return ok;
}

/**
 * @returns {Promise<string>} action id
 */
export async function promptMainMenu() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.bold('Main menu'),
      prefix: ' ',
      pageSize: 14,
      loop: false,
      choices: [
        { name: `${icons.switch}  Switch profile`, value: 'use' },
        { name: `${icons.status}  Current status`, value: 'current' },
        { name: `${icons.list}  List profiles`, value: 'list' },
        new inquirer.Separator(chalk.gray(' ── profiles ── ')),
        { name: `${icons.add}  Add profile`, value: 'add' },
        { name: `${icons.addLogin}  Add profile (force login)`, value: 'add-login' },
        { name: `${icons.link}  Link folder`, value: 'link' },
        { name: `${icons.test}  Test auth`, value: 'test' },
        { name: `${icons.edit}  Edit profile`, value: 'edit' },
        { name: `${icons.remove}  Remove profile`, value: 'remove' },
        new inquirer.Separator(chalk.gray(' ── app ── ')),
        { name: `${icons.update}  Update ghsw`, value: 'update' },
        new inquirer.Separator(),
        { name: `${icons.exit}  Exit`, value: 'exit' },
      ],
    },
  ]);
  return action;
}

/**
 * @param {string} [message]
 * @param {{ backLabel?: string }} [opts]
 * @returns {Promise<string | null | typeof BACK>}
 */
export async function promptSelectProfile(
  message = 'Select profile',
  opts = {}
) {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    return null;
  }
  const { name } = await inquirer.prompt([
    {
      type: 'list',
      name: 'name',
      message: chalk.bold(message),
      prefix: ' ',
      loop: false,
      choices: [
        backChoice(opts.backLabel || 'Back to menu'),
        new inquirer.Separator(),
        ...profiles.map((p) => ({
          name: `${chalk.white.bold(p.name)}  ${chalk.dim(`${p.username} · ${p.email}`)}`,
          value: p.name,
        })),
      ],
    },
  ]);
  return name;
}

/**
 * @param {{ backLabel?: string }} [opts]
 * @returns {Promise<string | typeof BACK>}
 */
export async function promptFolderPath(opts = {}) {
  const { folder } = await inquirer.prompt([
    {
      type: 'list',
      name: 'folder',
      message: chalk.bold('Folder to link'),
      prefix: ' ',
      loop: false,
      choices: [
        backChoice(opts.backLabel || 'Back'),
        new inquirer.Separator(),
        {
          name: `${chalk.cyan('Use current directory')}  ${chalk.dim(process.cwd())}`,
          value: process.cwd(),
        },
        { name: `${chalk.cyan('Enter custom path…')}`, value: '__custom__' },
      ],
    },
  ]);

  if (isBack(folder)) return BACK;
  if (folder !== '__custom__') return folder;

  const custom = await promptInput({
    message: chalk.cyan('Folder path'),
    default: process.cwd(),
    validate: (v) => (v ? true : 'Required'),
  });
  return custom;
}
