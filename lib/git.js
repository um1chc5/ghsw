import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run } from './gh.js';

/**
 * Home directory override for tests via GHSW_GIT_HOME or HOMEDIR.
 * @returns {string}
 */
export function getHomeDir() {
  return process.env.GHSW_GIT_HOME || os.homedir();
}

/**
 * @returns {string}
 */
export function getGitconfigPath() {
  return path.join(getHomeDir(), '.gitconfig');
}

/**
 * @param {string} profileName
 * @returns {string}
 */
export function getProfileGitconfigPath(profileName) {
  return path.join(getHomeDir(), `.gitconfig-${profileName}`);
}

/**
 * Backup ~/.gitconfig to a timestamped .bak file.
 * @returns {string | null} backup path, or null if no gitconfig existed
 */
export function backupGitconfig() {
  const gitconfig = getGitconfigPath();
  if (!fs.existsSync(gitconfig)) {
    return null;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${gitconfig}.${stamp}.bak`;
  fs.copyFileSync(gitconfig, backupPath);
  return backupPath;
}

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

/**
 * @param {{ name: string, gitName: string, email: string }} profile
 */
export function writeProfileGitconfig(profile) {
  const filePath = getProfileGitconfigPath(profile.name);
  const contents = [
    '[user]',
    `\tname = ${profile.gitName}`,
    `\temail = ${profile.email}`,
    '[credential]',
    '\tuseHttpPath = true',
    '',
  ].join('\n');
  fs.writeFileSync(filePath, contents, 'utf8');
  return filePath;
}

/**
 * @param {string} profileName
 * @returns {boolean} true if deleted
 */
export function deleteProfileGitconfig(profileName) {
  const filePath = getProfileGitconfigPath(profileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

/**
 * Normalize folder to absolute path with trailing slash for gitdir:.
 * @param {string} folderPath
 * @returns {string}
 */
export function normalizeGitdir(folderPath) {
  let abs = path.resolve(folderPath);
  // On Windows git expects forward slashes in includeIf paths
  abs = abs.replace(/\\/g, '/');
  if (!abs.endsWith('/')) {
    abs += '/';
  }
  return abs;
}

/**
 * Read gitconfig text (empty string if missing).
 * @param {string} [filePath]
 */
export function readGitconfigText(filePath = getGitconfigPath()) {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Upsert includeIf for folder → ~/.gitconfig-<profileName>
 * Never duplicates; updates existing block for same gitdir in place.
 * @param {string} folderPath
 * @param {string} profileName
 * @param {{ skipBackup?: boolean }} [opts]
 */
export function upsertIncludeIf(folderPath, profileName, opts = {}) {
  const gitdir = normalizeGitdir(folderPath);
  const includePath = getProfileGitconfigPath(profileName);
  // Use path as git expects; quote for spaces
  const block = [
    `[includeIf "gitdir:${gitdir}"]`,
    `\tpath = ${includePath}`,
    '',
  ].join('\n');

  if (!opts.skipBackup) {
    backupGitconfig();
  }

  const gitconfigPath = getGitconfigPath();
  let text = readGitconfigText(gitconfigPath);

  // Match any includeIf whose gitdir equals this folder (flexible whitespace)
  const escaped = gitdir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockRe = new RegExp(
    `\\[includeIf\\s+"gitdir:${escaped}"\\][^\\[]*`,
    'i'
  );

  if (blockRe.test(text)) {
    text = text.replace(blockRe, block);
  } else {
    if (text && !text.endsWith('\n')) text += '\n';
    text += block;
  }

  fs.writeFileSync(gitconfigPath, text, 'utf8');
  return { gitdir, includePath, gitconfigPath };
}

/**
 * Remove includeIf blocks that point at ~/.gitconfig-<profileName>
 * @param {string} profileName
 * @param {{ skipBackup?: boolean }} [opts]
 * @returns {number} number of blocks removed
 */
export function removeIncludeIfForProfile(profileName, opts = {}) {
  const includePath = getProfileGitconfigPath(profileName);
  const normalizedInclude = includePath.replace(/\\/g, '/');
  const gitconfigPath = getGitconfigPath();
  let text = readGitconfigText(gitconfigPath);
  if (!text) return 0;

  if (!opts.skipBackup) {
    backupGitconfig();
  }

  // Split into sections starting with [
  const parts = text.split(/(?=^\[)/m);
  let removed = 0;
  const kept = [];

  for (const part of parts) {
    if (!part.trim()) continue;
    const isIncludeIf = /^\[includeIf\s+/i.test(part);
    const pointsHere =
      isIncludeIf &&
      (part.includes(includePath) ||
        part.replace(/\\/g, '/').includes(normalizedInclude));
    if (pointsHere) {
      removed += 1;
      continue;
    }
    kept.push(part);
  }

  fs.writeFileSync(gitconfigPath, kept.join(''), 'utf8');
  return removed;
}
