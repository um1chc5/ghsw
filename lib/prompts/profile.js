import chalk from 'chalk';
import inquirer from 'inquirer';
import { listProfiles } from '../profiles/index.js';
import { BACK, backChoice, isBack, promptInput } from './common.js';

/**
 * @returns {Promise<import('../profiles/index.js').Profile | typeof BACK>}
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
