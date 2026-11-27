import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * @param {Array<[string, string]>} rows
 */
export function kvTable(rows) {
  const table = new Table({
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
    style: { head: [], border: ['gray'] },
    colWidths: [18, Math.min(42, (process.stdout.columns || 80) - 22)],
    wordWrap: true,
  });
  for (const [k, v] of rows) {
    table.push([chalk.gray(k), v]);
  }
  console.log(table.toString());
}

/**
 * @param {import('../profiles/index.js').Profile[]} profiles
 * @param {string | null} [activeUsername]
 */
export function profileTable(profiles, activeUsername = null) {
  const table = new Table({
    head: [
      chalk.bold('Profile'),
      chalk.bold('GitHub'),
      chalk.bold('Git identity'),
      chalk.bold(''),
    ],
    style: { head: [], border: ['gray'] },
    colWidths: [12, 16, 28, 8],
    wordWrap: true,
  });

  for (const p of profiles) {
    const active =
      activeUsername &&
      p.username.toLowerCase() === activeUsername.toLowerCase();
    table.push([
      active ? chalk.green.bold(p.name) : chalk.white(p.name),
      chalk.hex('#58a6ff')(p.username),
      `${p.gitName}\n${chalk.dim(p.email)}`,
      active ? chalk.green('active') : '',
    ]);
  }
  console.log(table.toString());
}
