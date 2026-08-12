import inquirer from 'inquirer';
import { listProfiles } from './profiles.js';

/**
 * @returns {Promise<{ name: string, gitName: string, email: string, username: string }>}
 */
export async function promptAddProfile() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Profile name (alias, e.g. work / personal):',
      validate: (v) =>
        /^[a-zA-Z0-9_-]+$/.test(v.trim())
          ? true
          : 'Use letters, numbers, _ or - only',
    },
    {
      type: 'input',
      name: 'gitName',
      message: 'Git user.name (commit author name):',
      validate: (v) => (v.trim() ? true : 'Required'),
    },
    {
      type: 'input',
      name: 'email',
      message: 'Git user.email:',
      validate: (v) =>
        /.+@.+\..+/.test(v.trim()) ? true : 'Enter a valid email',
    },
    {
      type: 'input',
      name: 'username',
      message: 'GitHub username:',
      validate: (v) => (v.trim() ? true : 'Required'),
    },
  ]).then((answers) => ({
    name: answers.name.trim(),
    gitName: answers.gitName.trim(),
    email: answers.email.trim(),
    username: answers.username.trim(),
  }));
}

/**
 * @param {{ gitName: string, email: string }} current
 */
export async function promptEditProfile(current) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'gitName',
      message: 'Git user.name:',
      default: current.gitName,
      validate: (v) => (v.trim() ? true : 'Required'),
    },
    {
      type: 'input',
      name: 'email',
      message: 'Git user.email:',
      default: current.email,
      validate: (v) =>
        /.+@.+\..+/.test(v.trim()) ? true : 'Enter a valid email',
    },
  ]).then((answers) => ({
    gitName: answers.gitName.trim(),
    email: answers.email.trim(),
  }));
}

/**
 * @param {string} message
 * @param {boolean} [defaultValue=false]
 */
export async function confirm(message, defaultValue = false) {
  const { ok } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ok',
      message,
      default: defaultValue,
    },
  ]);
  return ok;
}

/**
 * Main interactive menu.
 * @returns {Promise<string>} action id
 */
export async function promptMainMenu() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      pageSize: 12,
      choices: [
        { name: 'Switch profile (use) — auth + git identity', value: 'use' },
        { name: 'Show current status', value: 'current' },
        { name: 'List profiles', value: 'list' },
        { name: 'Add profile (login if needed)', value: 'add' },
        { name: 'Add profile + force new login', value: 'add-login' },
        { name: 'Link folder to profile', value: 'link' },
        { name: 'Test profile auth', value: 'test' },
        { name: 'Edit profile name/email', value: 'edit' },
        { name: 'Remove profile', value: 'remove' },
        new inquirer.Separator(),
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);
  return action;
}

/**
 * Pick a saved profile by alias.
 * @param {string} [message]
 * @returns {Promise<string | null>} profile name or null if none
 */
export async function promptSelectProfile(message = 'Select a profile:') {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    return null;
  }
  const { name } = await inquirer.prompt([
    {
      type: 'list',
      name: 'name',
      message,
      choices: profiles.map((p) => ({
        name: `${p.name}  (${p.username} · ${p.email})`,
        value: p.name,
      })),
    },
  ]);
  return name;
}

/**
 * @returns {Promise<string>}
 */
export async function promptFolderPath() {
  const { folder } = await inquirer.prompt([
    {
      type: 'input',
      name: 'folder',
      message: 'Folder path to link:',
      default: process.cwd(),
      validate: (v) => (v.trim() ? true : 'Required'),
    },
  ]);
  return folder.trim();
}
