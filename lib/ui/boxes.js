import chalk from 'chalk';
import boxen from 'boxen';
import gradient from 'gradient-string';

const brand = gradient(['#58a6ff', '#a371f7', '#f778ba']);

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
