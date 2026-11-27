import inquirer from 'inquirer';
import chalk from 'chalk';
import { icons } from '../ui/icons.js';

/** Sentinel: user chose "Back to menu". */
export const BACK = '__back__';

/**
 * @param {unknown} value
 */
export function isBack(value) {
  return value === BACK;
}

export function backChoice(label = 'Back to menu') {
  return { name: `${icons.back}  ${label}`, value: BACK };
}

/**
 * @param {import('inquirer').Question} config
 * @returns {Promise<string | typeof BACK>}
 */
export async function promptInput(config) {
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
