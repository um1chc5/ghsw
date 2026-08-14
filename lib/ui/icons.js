import chalk from 'chalk';

/** @type {Record<string, string>} */
export const icons = {
  switch: chalk.cyan('⇄'),
  status: chalk.green('◉'),
  list: chalk.blue('▤'),
  add: chalk.green('＋'),
  addLogin: chalk.yellow('⊕'),
  link: chalk.magenta('⧉'),
  clone: chalk.cyan('↓'),
  test: chalk.cyan('✓'),
  edit: chalk.blue('✎'),
  remove: chalk.red('✕'),
  update: chalk.green('⬆'),
  exit: chalk.gray('⏻'),
  github: chalk.hex('#58a6ff')('●'),
  git: chalk.hex('#f78166')('●'),
  profile: chalk.hex('#a371f7')('●'),
  arrow: chalk.gray('›'),
  back: chalk.gray('←'),
  dot: chalk.gray('·'),
};
