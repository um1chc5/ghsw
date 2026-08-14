import chalk from 'chalk';
import inquirer from 'inquirer';
import { BACK, backChoice, isBack, promptInput } from './common.js';

/**
 * Pick a repo to clone: from a list and/or manual entry.
 * @param {Array<{ nameWithOwner: string, description?: string | null, isPrivate?: boolean }>} [repos]
 * @returns {Promise<string | typeof BACK>}
 */
export async function promptCloneRepo(repos = []) {
  console.log(
    chalk.gray(`\n  Clone into: ${chalk.white(process.cwd())}\n`)
  );

  const choices = [
    backChoice('Back to menu'),
    new inquirer.Separator(),
  ];

  if (repos.length === 0) {
    choices.push(
      new inquirer.Separator(chalk.gray(' (no repos listed for this account) '))
    );
  } else {
    choices.push(
      new inquirer.Separator(chalk.gray(` ── ${repos.length} repos ── `)),
      ...repos.map((r) => {
        const lock = r.isPrivate ? chalk.yellow(' private') : chalk.gray(' public');
        const desc = r.description
          ? chalk.dim(` — ${String(r.description).slice(0, 48)}`)
          : '';
        return {
          name: `${chalk.white(r.nameWithOwner)}${lock}${desc}`,
          value: r.nameWithOwner,
        };
      })
    );
  }

  choices.push(
    new inquirer.Separator(),
    {
      name: `${chalk.cyan('Enter')} owner/name or URL…`,
      value: '__manual__',
    }
  );

  const { pick } = await inquirer.prompt([
    {
      type: 'list',
      name: 'pick',
      message: chalk.bold('Clone which repo?'),
      prefix: ' ',
      pageSize: 16,
      loop: false,
      choices,
    },
  ]);

  if (isBack(pick)) return BACK;
  if (pick !== '__manual__') return pick;

  return promptInput({
    message: chalk.cyan('Repo (owner/name or URL)'),
    validate: (v) => {
      if (!v) return 'Required';
      if (v.includes(' ')) return 'No spaces — use owner/name or a URL';
      return true;
    },
  });
}
