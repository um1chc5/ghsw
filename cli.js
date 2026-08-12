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
  BACK,
  confirm,
  isBack,
  promptAddProfile,
  promptEditProfile,
  promptFolderPath,
  promptMainMenu,
  promptSelectProfile,
} from './lib/prompts.js';
import {
  emptyState,
  errorBox,
  goodbye,
  infoBox,
  kvTable,
  printBanner,
  printQuickStatus,
  profileTable,
  section,
  success,
  warnBox,
  withSpinner,
} from './lib/ui.js';

const program = new Command();

function fail(message) {
  errorBox(message);
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
async function applyProfile(profile) {
  return withSpinner(`Switching to ${profile.username}…`, async () => {
    const switched = authSwitch(profile.username);
    if (switched.missing) {
      throw new Error(ghMissingMessage());
    }
    if (!switched.ok) {
      throw new Error(
        [
          `Failed to switch gh auth to ${profile.username}.`,
          switched.stderr || switched.stdout,
          '',
          'Try: ghsw add --login',
        ].join('\n')
      );
    }
    setGlobalUser(profile.gitName, profile.email);
    return true;
  });
}

async function cmdAdd({ login = false, interactive = false } = {}) {
  if (!requireGh()) return;

  const answers = await promptAddProfile();
  if (isBack(answers)) return;

  const already = isUserLoggedIn(answers.username);

  if (login || !already) {
    infoBox('GitHub login', [
      `Account: ${chalk.bold(answers.username)}`,
      'Choose HTTPS in the gh prompt.',
      'Complete browser or token login.',
    ]);
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
    infoBox('Skipped login', [
      `"${answers.username}" is already in gh auth.`,
      'Use "Add profile (force login)" for another account.',
    ]);
  }

  if (!isUserLoggedIn(answers.username)) {
    const active = getActiveUsername();
    warnBox('Username not found in gh auth', [
      `Expected: ${answers.username}`,
      active ? `Active now: ${active}` : 'No active account detected.',
    ]);
    const proceed = await confirm('Save the profile anyway?', false, {
      allowBack: interactive,
    });
    if (isBack(proceed)) return;
    if (!proceed) {
      console.log(chalk.gray('  Aborted.'));
      return;
    }
  }

  addProfile(answers);
  success(`Profile "${answers.name}" saved`, [
    `GitHub  ${chalk.hex('#58a6ff')(answers.username)}`,
    `Git     ${answers.gitName} <${answers.email}>`,
    '',
    `Next: ${chalk.bold(`ghsw use ${answers.name}`)}`,
  ]);
}

async function cmdUse(profileName) {
  if (!requireGh()) return;
  const profile = getProfile(profileName);
  if (!profile) {
    fail(`Profile "${profileName}" not found.`);
    return;
  }
  try {
    await applyProfile(profile);
    success(`Active profile: ${profile.name}`, [
      `GitHub  ${chalk.hex('#58a6ff')(profile.username)}`,
      `Git     ${profile.gitName} <${profile.email}>`,
    ]);
  } catch (err) {
    fail(err.message || String(err));
  }
}

async function cmdLink(profileName, folderPath) {
  const profile = getProfile(profileName);
  if (!profile) {
    fail(`Profile "${profileName}" not found.`);
    return;
  }
  writeProfileGitconfig(profile);
  const { gitdir, includePath } = upsertIncludeIf(folderPath, profile.name);
  success(`Folder linked to "${profile.name}"`, [
    `Path    ${gitdir}`,
    `Config  ${includePath}`,
  ]);
  warnBox('Remember', [
    'Commit author auto-switches in this folder.',
    'gh auth is still global — run before push/pull:',
    chalk.bold(`  ghsw use ${profile.name}`),
  ]);
}

function cmdList() {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    emptyState('No profiles yet.', 'Choose "Add profile" from the menu.');
    return;
  }
  section('Saved profiles');
  const active = isGhInstalled() ? getActiveUsername() : null;
  profileTable(profiles, active);
}

function cmdCurrent() {
  if (!requireGh()) return;
  const status = authStatus();
  const active = getActiveUsername();
  const gitUser = getGlobalUser();
  const match = active
    ? listProfiles().find(
        (p) => p.username.toLowerCase() === active.toLowerCase()
      )
    : null;

  section('Current status');

  const ghRows = status.accounts.length
    ? status.accounts.map((a) => [
        a.active ? 'Active account' : 'Account',
        a.active
          ? chalk.green.bold(a.username)
          : chalk.white(a.username),
      ])
    : [['GitHub', chalk.yellow('Not authenticated')]];

  kvTable([
    ...ghRows,
    ['Git name', gitUser.name || chalk.gray('(unset)')],
    ['Git email', gitUser.email || chalk.gray('(unset)')],
    [
      'ghsw profile',
      match
        ? chalk.green(`${match.name} (${match.username})`)
        : active
          ? chalk.yellow(`unmapped (${active})`)
          : chalk.gray('(none)'),
    ],
  ]);
}

async function cmdTest(profileName) {
  if (!requireGh()) return;
  const profile = getProfile(profileName);
  if (!profile) {
    fail(`Profile "${profileName}" not found.`);
    return;
  }
  try {
    await applyProfile(profile);
    const result = await withSpinner('Verifying with gh api user…', () =>
      Promise.resolve(apiUser())
    );
    if (!result.ok) {
      fail(
        ['gh api user failed.', result.raw, '', 'Try: gh auth login'].join('\n')
      );
      return;
    }
    success(`Auth OK — ${profile.name}`, [
      `API user  ${chalk.hex('#58a6ff')(result.login)}`,
    ]);
  } catch (err) {
    fail(err.message || String(err));
  }
}

async function cmdEdit(profileName) {
  const profile = getProfile(profileName);
  if (!profile) {
    fail(`Profile "${profileName}" not found.`);
    return;
  }
  const fields = await promptEditProfile(profile);
  if (isBack(fields)) return;
  const updated = updateProfile(profile.name, fields);
  writeProfileGitconfig(updated);
  success(`Updated "${updated.name}"`, [
    `Git  ${updated.gitName} <${updated.email}>`,
  ]);
}

async function cmdRemove(profileName, { interactive = false } = {}) {
  const profile = getProfile(profileName);
  if (!profile) {
    fail(`Profile "${profileName}" not found.`);
    return;
  }
  const ok = await confirm(
    `Remove profile "${profile.name}" (${profile.username})?`,
    false,
    { allowBack: interactive }
  );
  if (isBack(ok)) return;
  if (!ok) {
    console.log(chalk.gray('  Aborted.'));
    return;
  }

  removeProfile(profile.name);
  deleteProfileGitconfig(profile.name);
  const n = removeIncludeIfForProfile(profile.name);
  success(`Removed "${profile.name}"`, [
    n > 0 ? `Cleaned ${n} includeIf block(s) from ~/.gitconfig` : 'Config cleaned.',
  ]);

  if (isGhInstalled()) {
    const doLogout = await confirm(
      `Also run gh auth logout for ${profile.username}?`,
      false,
      { allowBack: interactive }
    );
    if (isBack(doLogout)) return;
    if (doLogout) {
      const result = await withSpinner(`Logging out ${profile.username}…`, () =>
        Promise.resolve(authLogout(profile.username))
      );
      if (result.ok) {
        success(`Logged out ${profile.username}`, []);
      } else {
        fail(result.stderr || result.stdout || 'gh auth logout failed');
      }
    }
  }
}

async function needProfileName(message, backLabel = 'Back to menu') {
  const name = await promptSelectProfile(message, { backLabel });
  if (isBack(name)) return BACK;
  if (!name) {
    warnBox('No profiles', ['Add a profile first from the main menu.']);
    return null;
  }
  return name;
}

async function runLinkFlow() {
  let profileName = await needProfileName('Link profile');
  if (isBack(profileName) || !profileName) return;

  while (true) {
    const folder = await promptFolderPath({ backLabel: 'Back to profile list' });
    if (isBack(folder)) {
      profileName = await needProfileName('Link profile');
      if (isBack(profileName) || !profileName) return;
      continue;
    }
    await cmdLink(profileName, folder);
    return;
  }
}

async function runInteractive() {
  printBanner();

  while (true) {
    process.exitCode = 0;

    if (isGhInstalled()) {
      const active = getActiveUsername();
      const match = active
        ? listProfiles().find(
            (p) => p.username.toLowerCase() === active.toLowerCase()
          )
        : null;
      printQuickStatus(active, match?.name ?? null);
      console.log('');
    }

    const action = await promptMainMenu();
    console.log('');

    try {
      switch (action) {
        case 'exit':
          goodbye();
          return;
        case 'add':
          await cmdAdd({ login: false, interactive: true });
          break;
        case 'add-login':
          await cmdAdd({ login: true, interactive: true });
          break;
        case 'use': {
          const name = await needProfileName('Switch to');
          if (isBack(name) || !name) break;
          await cmdUse(name);
          break;
        }
        case 'link':
          await runLinkFlow();
          break;
        case 'list':
          cmdList();
          break;
        case 'current':
          cmdCurrent();
          break;
        case 'test': {
          const name = await needProfileName('Test profile');
          if (isBack(name) || !name) break;
          await cmdTest(name);
          break;
        }
        case 'edit': {
          const name = await needProfileName('Edit profile');
          if (isBack(name) || !name) break;
          await cmdEdit(name);
          break;
        }
        case 'remove': {
          const name = await needProfileName('Remove profile');
          if (isBack(name) || !name) break;
          await cmdRemove(name, { interactive: true });
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
  .version('1.1.1')
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
