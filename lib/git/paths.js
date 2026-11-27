import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
