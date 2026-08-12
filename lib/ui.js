import chalk from 'chalk';
import boxen from 'boxen';
import gradient from 'gradient-string';
import Table from 'cli-table3';
import ora from 'ora';

const brand = gradient(['#58a6ff', '#a371f7', '#f778ba']);

/** @type {Record<string, string>} */
export const icons = {
  switch: chalk.cyan('⇄'),
  status: chalk.green('◉'),
  list: chalk.blue('▤'),
  add: chalk.green('＋'),
  addLogin: chalk.yellow('⊕'),
  link: chalk.magenta('⧉'),
  test: chalk.cyan('✓'),
  edit: chalk.blue('✎'),
  remove: chalk.red('✕'),
  exit: chalk.gray('⏻'),
  github: chalk.hex('#58a6ff')('●'),
  git: chalk.hex('#f78166')('●'),
  profile: chalk.hex('#a371f7')('●'),
  arrow: chalk.gray('›'),
  back: chalk.gray('←'),
  dot: chalk.gray('·'),
};

const boxBase = {
  padding: 1,
  borderStyle: 'round',
  borderColor: 'gray',
};

/**
 * @param {{ showTagline?: boolean }} [opts]
 */
export function printBanner(opts = {}) {
  const title = brand('  ghsw  ');
  const tagline = chalk.gray('GitHub Switcher  ·  HTTPS + gh CLI');
  const lines = [title, '', tagline];
  if (opts.showTagline !== false) {
    lines.push(chalk.dim('Switch auth + git identity in one place'));
  }
  console.log(
    boxen(lines.join('\n'), {
      ...boxBase,
      borderColor: 'cyan',
      dimBorder: true,
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
    })
  );
}

export function divider() {
  console.log(chalk.gray('─'.repeat(Math.min(process.stdout.columns || 60, 60))));
}

/**
 * @param {string} title
 */
export function section(title) {
  console.log('');
  console.log(chalk.bold.white(` ${title}`));
  divider();
}

/**
 * @param {string} title
 * @param {string[]} [lines]
 */
export function success(title, lines = []) {
  const body = [chalk.green.bold(`✔ ${title}`), ...lines.map((l) => `  ${l}`)].join('\n');
  console.log(
    boxen(body, {
      ...boxBase,
      borderColor: 'green',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
    })
  );
}

/**
 * @param {string} title
 * @param {string[]} lines
 */
export function warnBox(title, lines) {
  const body = [chalk.yellow.bold(`⚠ ${title}`), ...lines.map((l) => `  ${l}`)].join('\n');
  console.log(
    boxen(body, {
      ...boxBase,
      borderColor: 'yellow',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
    })
  );
}

/**
 * @param {string} message
 */
export function errorBox(message) {
  console.error(
    boxen(chalk.red.bold('✖ Error\n\n') + chalk.red(message), {
      ...boxBase,
      borderColor: 'red',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
    })
  );
}

/**
 * @param {string} title
 * @param {string[]} lines
 */
export function infoBox(title, lines) {
  const body = [chalk.cyan.bold(title), ...lines.map((l) => `  ${l}`)].join('\n');
  console.log(
    boxen(body, {
      ...boxBase,
      borderColor: 'cyan',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
    })
  );
}

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
 * @param {import('./profiles.js').Profile[]} profiles
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

export function emptyState(message, hint) {
  console.log(
    boxen(
      [chalk.gray(message), '', chalk.dim(hint)].join('\n'),
      { ...boxBase, borderColor: 'gray', dimBorder: true }
    )
  );
}

export function goodbye() {
  console.log(chalk.gray('\n  See you next time.\n'));
}
