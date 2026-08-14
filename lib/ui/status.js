import chalk from 'chalk';
import ora from 'ora';
import { icons } from './icons.js';

/**
 * @template T
 * @param {string} text
 * @param {() => T | Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withSpinner(text, fn) {
  const spinner = ora({ text, color: 'cyan', spinner: 'dots' }).start();
  try {
    const result = await fn();
    spinner.succeed(chalk.green(text.replace(/\.\.\.$/, '')));
    return result;
  } catch (err) {
    spinner.fail(chalk.red(text.replace(/\.\.\.$/, '')));
    throw err;
  }
}

/**
 * Compact one-line status for menu header.
 * @param {string | null} activeUser
 * @param {string | null} profileName
 */
export function printQuickStatus(activeUser, profileName) {
  if (!activeUser) {
    console.log(chalk.gray(`  ${icons.dot} No active GitHub account`));
    return;
  }
  const profilePart = profileName
    ? chalk.green(profileName)
    : chalk.yellow('unmapped');
  console.log(
    `  ${icons.github} ${chalk.bold(activeUser)}  ${icons.dot}  profile: ${profilePart}`
  );
}
