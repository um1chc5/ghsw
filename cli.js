#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import {
  addProfile,
  getProfile,
  listProfiles,
  removeProfile,
  updateProfile,
} from './lib/profiles.js';
import {
  apiUser,
  authLogin,
  authLogout,
  authStatus,
  authSwitch,
  getActiveUsername,
  ghMissingMessage,
  isGhInstalled,
  isUserLoggedIn,
} from './lib/gh.js';
import {
  deleteProfileGitconfig,
  getGlobalUser,
  removeIncludeIfForProfile,
  setGlobalUser,
  upsertIncludeIf,
  writeProfileGitconfig,
} from './lib/git.js';
import {
  confirm,
  promptAddProfile,
  promptEditProfile,
  promptFolderPath,
  promptMainMenu,
  promptSelectProfile,
} from './lib/prompts.js';

const program = new Command();

function fail(message) {
  console.error(chalk.red(message));
  process.exitCode = 1;
}

function requireGh() {
  if (!isGhInstalled()) {
    fail(ghMissingMessage());
    return false;
  }
  return true;
}

/**
 * @param {import('./lib/profiles.js').Profile} profile
 */
function applyProfile(profile) {
  const switched = authSwitch(profile.username);
  if (switched.missing) {
    fail(ghMissingMessage());
    return false;
  }
  if (!switched.ok) {
    fail(
      [
        `Failed to switch gh auth to ${profile.username}.`,
        switched.stderr || switched.stdout,
        '',
        'If this account is not logged in yet, run:',
        `  ghsw add --login`,
        'or:',
        `  gh auth login --hostname github.com`,
      ].join('\n')
    );
    return false;
  }
  setGlobalUser(profile.gitName, profile.email);
  return true;
}

async function cmdAdd({ login = false } = {}) {
  if (!requireGh()) return;

  const answers = await promptAddProfile();
  const already = isUserLoggedIn(answers.username);

  if (login || !already) {
    console.log(
      chalk.cyan(
        `\nLaunching gh auth login for GitHub user "${answers.username}"...\n` +
          '(Choose HTTPS, complete browser/token login for this account.)\n'
      )
    );
    const loginResult = await authLogin();
    if (loginResult.missing) {
      fail(ghMissingMessage());
      return;
    }
    if (!loginResult.ok) {
      fail('gh auth login did not complete successfully. Profile not saved.');
      return;
    }
  } else {
    console.log(
      chalk.gray(
        `GitHub user "${answers.username}" is already logged in via gh — skipping login.`
      )
    );
    console.log(
      chalk.gray('Tip: choose "Add profile + force new login" to add another account.\n')
    );
  }

  if (!isUserLoggedIn(answers.username)) {
    const active = getActiveUsername();
    console.log(
      chalk.yellow(
        `Warning: "${answers.username}" not found in gh auth status` +
          (active ? ` (active: ${active})` : '') +
          '.'
      )
    );
    const proceed = await confirm('Save the profile anyway?', false);
    if (!proceed) {
      console.log(chalk.gray('Aborted.'));
      return;
    }
  } else {
    console.log(chalk.green(`Confirmed: ${answers.username} is available in gh auth.`));
  }

  addProfile(answers);
  console.log(chalk.green(`\nProfile "${answers.name}" saved.`));
  console.log(`  Switch:  ${chalk.bold(`ghsw use ${answers.name}`)}`);
  console.log(`  Link:    ${chalk.bold(`ghsw link ${answers.name} /path/to/folder`)}`);
}

async function cmdUse(profileName) {
  if (!requireGh()) return;
  const profile = getProfile(profileName);
  if (!profile) {
    fail(`Profile "${profileName}" not found. Run: ghsw list`);
    return;
  }
  if (!applyProfile(profile)) return;
  console.log(chalk.green(`Switched to profile "${profile.name}"`));
  console.log(`  GitHub:  ${profile.username}`);
  console.log(`  git:     ${profile.gitName} <${profile.email}>`);
}

async function cmdLink(profileName, folderPath) {
  const profile = getProfile(profileName);
  if (!profile) {
    fail(`Profile "${profileName}" not found. Run: ghsw list`);
    return;
  }
  writeProfileGitconfig(profile);
  const { gitdir, includePath } = upsertIncludeIf(folderPath, profile.name);
  console.log(chalk.green(`Linked folder → profile "${profile.name}"`));
  console.log(`  gitdir:  ${gitdir}`);
  console.log(`  config:  ${includePath}`);
  console.log('');
  console.log(chalk.yellow('Important caveat:'));
  console.log(
    '  includeIf auto-switches commit author (user.name / user.email) in this folder.'
  );
  console.log('  gh CLI auth is still GLOBAL. For push/pull as this account, run:');
  console.log(chalk.bold(`    ghsw use ${profile.name}`));
  console.log(
    '  beforehand (unless HTTPS credentials are fully path-scoped via'
  );
  console.log(
    '  credential.useHttpPath + per-remote stored tokens — which this sets'
  );
  console.log('  in the profile gitconfig, but does not replace gh auth switch).');
}

function cmdList() {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    console.log(chalk.gray('No profiles yet. Choose "Add profile" from the menu.'));
    return;
  }
  for (const p of profiles) {
    console.log(chalk.bold(p.name));
    console.log(`  git:    ${p.gitName} <${p.email}>`);
    console.log(`  github: ${p.username}`);
  }
}

function cmdCurrent() {
  if (!requireGh()) return;
  const status = authStatus();
  const active = getActiveUsername();
  const gitUser = getGlobalUser();

  console.log(chalk.bold('gh auth (github.com)'));
  if (status.accounts.length === 0) {
    console.log(
      chalk.yellow('  Not authenticated. Run: gh auth login --hostname github.com')
    );
    console.log(chalk.gray('  Or choose "Add profile" in the menu.'));
  } else {
    for (const a of status.accounts) {
      const mark = a.active ? chalk.green('*') : ' ';
      console.log(
        `  ${mark} ${a.username}${a.active ? chalk.gray(' (active)') : ''}`
      );
    }
  }

  console.log(chalk.bold('\ngit global'));
  console.log(`  user.name:  ${gitUser.name || chalk.gray('(unset)')}`);
  console.log(`  user.email: ${gitUser.email || chalk.gray('(unset)')}`);

  console.log(chalk.bold('\nghsw profile'));
  if (active) {
    const match = listProfiles().find(
      (p) => p.username.toLowerCase() === active.toLowerCase()
    );
    if (match) {
      console.log(
        chalk.green(`  Active profile: ${match.name} (${match.username})`)
      );
    } else {
      console.log(
        chalk.yellow(
          `  Active gh user "${active}" has no saved ghsw profile. Choose "Add profile".`
        )
      );
    }
  } else {
    console.log(chalk.gray('  (none)'));
  }
}

async function cmdTest(profileName) {
  if (!requireGh()) return;
  const profile = getProfile(profileName);
  if (!profile) {
    fail(`Profile "${profileName}" not found. Run: ghsw list`);
    return;
  }
  if (!applyProfile(profile)) return;
  const result = apiUser();
  if (!result.ok) {
    fail(
      [
        'gh api user failed — auth may not be working.',
        result.raw,
        '',
        'Try: gh auth login --hostname github.com',
      ].join('\n')
    );
    return;
  }
  console.log(chalk.green(`Auth OK for profile "${profile.name}"`));
  console.log(`  API username: ${result.login}`);
}

async function cmdEdit(profileName) {
  const profile = getProfile(profileName);
  if (!profile) {
    fail(`Profile "${profileName}" not found. Run: ghsw list`);
    return;
  }
  const fields = await promptEditProfile(profile);
  const updated = updateProfile(profile.name, fields);
  writeProfileGitconfig(updated);
  console.log(chalk.green(`Updated profile "${updated.name}"`));
  console.log(`  git: ${updated.gitName} <${updated.email}>`);
}

async function cmdRemove(profileName) {
  const profile = getProfile(profileName);
  if (!profile) {
    fail(`Profile "${profileName}" not found. Run: ghsw list`);
    return;
  }
  const ok = await confirm(
    `Remove profile "${profile.name}" (${profile.username})?`,
    false
  );
  if (!ok) {
    console.log(chalk.gray('Aborted.'));
    return;
  }

  removeProfile(profile.name);
  deleteProfileGitconfig(profile.name);
  const n = removeIncludeIfForProfile(profile.name);
  console.log(chalk.green(`Removed profile "${profile.name}".`));
  if (n > 0) {
    console.log(
      chalk.gray(`  Removed ${n} includeIf block(s) from ~/.gitconfig`)
    );
  }

  if (isGhInstalled()) {
    const doLogout = await confirm(
      `Also run gh auth logout for ${profile.username}?`,
      false
    );
    if (doLogout) {
      const result = authLogout(profile.username);
      if (result.ok) {
        console.log(chalk.green(`Logged out ${profile.username} from gh.`));
      } else {
        fail(result.stderr || result.stdout || 'gh auth logout failed');
      }
    }
  }
}

async function needProfileName(message) {
  const name = await promptSelectProfile(message);
  if (!name) {
    console.log(chalk.yellow('No profiles yet. Choose "Add profile" first.'));
    return null;
  }
  return name;
}

/**
 * Interactive app: menu → action → back to menu until Exit.
 */
async function runInteractive() {
  console.log(chalk.bold('\nghsw') + chalk.gray(' — GitHub Switcher (HTTPS + gh)\n'));

  while (true) {
    process.exitCode = 0;
    const action = await promptMainMenu();
    console.log('');

    try {
      switch (action) {
        case 'exit':
          console.log(chalk.gray('Bye.'));
          return;
        case 'add':
          await cmdAdd({ login: false });
          break;
        case 'add-login':
          await cmdAdd({ login: true });
          break;
        case 'use': {
          const name = await needProfileName('Switch to which profile?');
          if (name) await cmdUse(name);
          break;
        }
        case 'link': {
          const name = await needProfileName('Link which profile?');
          if (!name) break;
          const folder = await promptFolderPath();
          await cmdLink(name, folder);
          break;
        }
        case 'list':
          cmdList();
          break;
        case 'current':
          cmdCurrent();
          break;
        case 'test': {
          const name = await needProfileName('Test which profile?');
          if (name) await cmdTest(name);
          break;
        }
        case 'edit': {
          const name = await needProfileName('Edit which profile?');
          if (name) await cmdEdit(name);
          break;
        }
        case 'remove': {
          const name = await needProfileName('Remove which profile?');
          if (name) await cmdRemove(name);
          break;
        }
        default:
          break;
      }
    } catch (err) {
      fail(err.message || String(err));
    }

    console.log('');
  }
}

program
  .name('ghsw')
  .description(
    'GitHub Switcher — manage multiple GitHub accounts via HTTPS + gh CLI (no SSH)\n' +
      'Run with no arguments for an interactive menu.'
  )
  .version('1.0.0')
  .action(async () => {
    await runInteractive();
  });

program
  .command('add')
  .description('Add a profile; login via gh if the account is not authenticated yet')
  .option('--login', 'Always run gh auth login (add a new account)')
  .action(async (opts) => {
    try {
      await cmdAdd({ login: Boolean(opts.login) });
    } catch (err) {
      fail(err.message || String(err));
    }
  });

program
  .command('use')
  .description('Switch active gh account + global git user.name/email')
  .argument('<profile-name>', 'Profile alias')
  .action(async (profileName) => {
    try {
      await cmdUse(profileName);
    } catch (err) {
      fail(err.message || String(err));
    }
  });

program
  .command('link')
  .description(
    'Per-folder git identity via includeIf (name/email + credential.useHttpPath)'
  )
  .argument('<profile-name>', 'Profile alias')
  .argument('<folder-path>', 'Folder to link')
  .action(async (profileName, folderPath) => {
    try {
      await cmdLink(profileName, folderPath);
    } catch (err) {
      fail(err.message || String(err));
    }
  });

program
  .command('list')
  .description('List saved profiles')
  .action(() => {
    try {
      cmdList();
    } catch (err) {
      fail(err.message || String(err));
    }
  });

program
  .command('current')
  .description('Show active gh account and matching ghsw profile')
  .action(() => {
    try {
      cmdCurrent();
    } catch (err) {
      fail(err.message || String(err));
    }
  });

program
  .command('test')
  .description('Switch to profile and verify auth via gh api user')
  .argument('<profile-name>', 'Profile alias')
  .action(async (profileName) => {
    try {
      await cmdTest(profileName);
    } catch (err) {
      fail(err.message || String(err));
    }
  });

program
  .command('edit')
  .description('Update stored git name/email for a profile')
  .argument('<profile-name>', 'Profile alias')
  .action(async (profileName) => {
    try {
      await cmdEdit(profileName);
    } catch (err) {
      fail(err.message || String(err));
    }
  });

program
  .command('remove')
  .description('Remove a profile (optional gh auth logout)')
  .argument('<profile-name>', 'Profile alias')
  .action(async (profileName) => {
    try {
      await cmdRemove(profileName);
    } catch (err) {
      fail(err.message || String(err));
    }
  });

program
  .command('menu')
  .description('Open the interactive menu')
  .action(async () => {
    await runInteractive();
  });

const args = process.argv.slice(2);
if (args.length === 0) {
  runInteractive().catch((err) => fail(err.message || String(err)));
} else {
  program.parseAsync(process.argv).catch((err) => {
    fail(err.message || String(err));
  });
}
