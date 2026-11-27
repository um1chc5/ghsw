import { run, runInteractive } from './run.js';

export const HOST = 'github.com';

export function isGhInstalled() {
  const result = run('gh', ['--version']);
  return result.ok || (result.stdout || result.stderr).includes('gh version');
}

export function ghMissingMessage() {
  return [
    'GitHub CLI (gh) is not installed or not on PATH.',
    '',
    'Install it, then authenticate:',
    '  https://cli.github.com/',
    '  macOS:   brew install gh',
    '  Windows: winget install GitHub.cli',
    '  Linux:   see https://github.com/cli/cli/blob/trunk/docs/install_linux.md',
    '',
    'Then run:  gh auth login --hostname github.com',
    'Or use:    ghsw add   (will launch login if needed)',
  ].join('\n');
}

/**
 * Parse `gh auth status` output for github.com accounts.
 * @returns {{ installed: boolean, accounts: Array<{ username: string, active: boolean, host: string }>, raw: string }}
 */
export function authStatus() {
  if (!isGhInstalled()) {
    return { installed: false, accounts: [], raw: '' };
  }

  const result = run('gh', ['auth', 'status', '--hostname', HOST]);
  const raw = `${result.stdout}\n${result.stderr}`;
  const accounts = [];

  // Formats vary by gh version. Common patterns:
  // "✓ Logged in to github.com account USER (keyring)"
  // "  ✓ Active account: true"
  // Older: "Logged in to github.com as USER"
  const lines = raw.split(/\r?\n/);
  let current = null;

  for (const line of lines) {
    const loggedIn =
      line.match(/Logged in to\s+(\S+)\s+account\s+(\S+)/i) ||
      line.match(/Logged in to\s+(\S+)\s+as\s+(\S+)/i);
    if (loggedIn) {
      if (current) accounts.push(current);
      current = {
        host: loggedIn[1],
        username: loggedIn[2].replace(/[()]/g, ''),
        active: false,
      };
      continue;
    }
    if (current && /Active account:\s*true/i.test(line)) {
      current.active = true;
    }
  }
  if (current) accounts.push(current);

  // If only one account and none marked active, treat it as active
  if (accounts.length === 1 && !accounts.some((a) => a.active)) {
    accounts[0].active = true;
  }

  // Fallback: "github.com" block with "- username"
  if (accounts.length === 0) {
    const userMatch = raw.match(/github\.com[\s\S]*?(?:account|as)\s+(\S+)/i);
    if (userMatch) {
      accounts.push({
        host: HOST,
        username: userMatch[1].replace(/[()]/g, ''),
        active: true,
      });
    }
  }

  return { installed: true, accounts, raw };
}

/**
 * @param {string} username
 */
export function isUserLoggedIn(username) {
  const { accounts } = authStatus();
  return accounts.some(
    (a) => a.username.toLowerCase() === String(username).toLowerCase()
  );
}

/**
 * @param {string} username
 */
export function getActiveUsername() {
  const { accounts } = authStatus();
  const active = accounts.find((a) => a.active);
  return active?.username || accounts[0]?.username || null;
}

export async function authLogin() {
  if (!isGhInstalled()) {
    return { ok: false, missing: true };
  }
  return runInteractive('gh', ['auth', 'login', '--hostname', HOST]);
}

/**
 * @param {string} username
 */
export function authSwitch(username) {
  if (!isGhInstalled()) {
    return { ok: false, missing: true, stdout: '', stderr: ghMissingMessage() };
  }
  return run('gh', [
    'auth',
    'switch',
    '--hostname',
    HOST,
    '--user',
    username,
  ]);
}

/**
 * @param {string} username
 */
export function authLogout(username) {
  if (!isGhInstalled()) {
    return { ok: false, missing: true, stdout: '', stderr: ghMissingMessage() };
  }
  return run('gh', [
    'auth',
    'logout',
    '--hostname',
    HOST,
    '--user',
    username,
  ]);
}

/**
 * @returns {{ ok: boolean, login: string | null, raw: string, missing?: boolean }}
 */
export function apiUser() {
  if (!isGhInstalled()) {
    return { ok: false, login: null, raw: '', missing: true };
  }
  const result = run('gh', ['api', 'user', '--hostname', HOST]);
  if (!result.ok) {
    return {
      ok: false,
      login: null,
      raw: result.stderr || result.stdout,
      missing: false,
    };
  }
  try {
    const data = JSON.parse(result.stdout);
    return { ok: true, login: data.login || null, raw: result.stdout };
  } catch {
    return { ok: false, login: null, raw: result.stdout };
  }
}
