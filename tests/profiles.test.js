import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ghsw-profiles-'));
process.env.GHSW_HOME = tmp;

const {
  addProfile,
  getProfile,
  listProfiles,
  loadConfig,
  removeProfile,
  updateProfile,
} = await import('../lib/profiles.js');

describe('profiles', () => {
  after(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('starts empty', () => {
    assert.deepEqual(loadConfig(), { profiles: [] });
    assert.equal(listProfiles().length, 0);
  });

  it('adds and gets a profile', () => {
    addProfile({
      name: 'work',
      gitName: 'Ada',
      email: 'ada@co.com',
      username: 'ada-work',
    });
    const p = getProfile('work');
    assert.equal(p.username, 'ada-work');
    assert.equal(getProfile('WORK').name, 'work');
  });

  it('rejects duplicate name', () => {
    assert.throws(() =>
      addProfile({
        name: 'work',
        gitName: 'X',
        email: 'x@y.com',
        username: 'other',
      })
    );
  });

  it('updates and removes', () => {
    updateProfile('work', { gitName: 'Ada L', email: 'ada@new.com' });
    assert.equal(getProfile('work').gitName, 'Ada L');
    removeProfile('work');
    assert.equal(getProfile('work'), undefined);
  });
});
