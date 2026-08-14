import fs from 'node:fs';
import {
  backupGitconfig,
  getGitconfigPath,
  getProfileGitconfigPath,
  normalizeGitdir,
  readGitconfigText,
} from './paths.js';

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
