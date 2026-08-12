import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ghsw-git-'));
process.env.GHSW_GIT_HOME = tmp;

const {
  getGitconfigPath,
  getProfileGitconfigPath,
  normalizeGitdir,
  readGitconfigText,
  removeIncludeIfForProfile,
  upsertIncludeIf,
  writeProfileGitconfig,
} = await import('../lib/git.js');

describe('git includeIf', () => {
  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('writes profile gitconfig with useHttpPath', () => {
    const file = writeProfileGitconfig({
      name: 'work',
      gitName: 'Ada',
      email: 'ada@co.com',
    });
    const text = fs.readFileSync(file, 'utf8');
    assert.match(text, /name = Ada/);
    assert.match(text, /email = ada@co\.com/);
    assert.match(text, /useHttpPath = true/);
    assert.equal(file, getProfileGitconfigPath('work'));
  });

  it('upserts includeIf without duplicating', () => {
    const folder = path.join(tmp, 'repos', 'app');
    fs.mkdirSync(folder, { recursive: true });

    upsertIncludeIf(folder, 'work', { skipBackup: true });
    upsertIncludeIf(folder, 'work', { skipBackup: true });

    const text = readGitconfigText(getGitconfigPath());
    const matches = text.match(/\[includeIf "gitdir:/g) || [];
    assert.equal(matches.length, 1);

    const gitdir = normalizeGitdir(folder);
    assert.match(text, new RegExp(`gitdir:${gitdir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.match(text, /path = .*gitconfig-work/);
  });

  it('updates includeIf path when re-linking same folder to same profile', () => {
    const folder = path.join(tmp, 'repos', 'app');
    upsertIncludeIf(folder, 'work', { skipBackup: true });
    const text = readGitconfigText();
    assert.equal((text.match(/\[includeIf/g) || []).length, 1);
  });

  it('removes includeIf for profile', () => {
    writeProfileGitconfig({
      name: 'personal',
      gitName: 'Ada',
      email: 'a@b.com',
    });
    const folder = path.join(tmp, 'repos', 'side');
    fs.mkdirSync(folder, { recursive: true });
    upsertIncludeIf(folder, 'personal', { skipBackup: true });
    const removed = removeIncludeIfForProfile('personal', { skipBackup: true });
    assert.ok(removed >= 1);
    const text = readGitconfigText();
    assert.doesNotMatch(text, /gitconfig-personal/);
  });
});
