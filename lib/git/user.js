import { run } from '../gh/run.js';

/**
 * @param {string} name
 * @param {string} email
 */
export function setGlobalUser(name, email) {
  const nameResult = run('git', ['config', '--global', 'user.name', name]);
  if (!nameResult.ok) {
    throw new Error(nameResult.stderr || 'Failed to set git user.name');
  }
  const emailResult = run('git', ['config', '--global', 'user.email', email]);
  if (!emailResult.ok) {
    throw new Error(emailResult.stderr || 'Failed to set git user.email');
  }
}

/**
 * @returns {{ name: string | null, email: string | null }}
 */
export function getGlobalUser() {
  const name = run('git', ['config', '--global', 'user.name']);
  const email = run('git', ['config', '--global', 'user.email']);
  return {
    name: name.ok ? name.stdout.trim() : null,
    email: email.ok ? email.stdout.trim() : null,
  };
}
