import inquirer from 'inquirer';
import chalk from 'chalk';
import { icons } from '../ui/icons.js';

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
        { name: `${icons.clone}  Clone repo`, value: 'clone' },
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
