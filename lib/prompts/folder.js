import chalk from 'chalk';
import inquirer from 'inquirer';
import { BACK, backChoice, isBack, promptInput } from './common.js';

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
