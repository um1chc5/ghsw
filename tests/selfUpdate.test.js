import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compareSemver } from '../lib/selfUpdate.js';

describe('selfUpdate compareSemver', () => {
  it('orders versions', () => {
    assert.equal(compareSemver('1.1.3', '1.1.2'), 1);
    assert.equal(compareSemver('1.1.2', '1.1.3'), -1);
    assert.equal(compareSemver('1.1.2', '1.1.2'), 0);
    assert.equal(compareSemver('2.0.0', '1.9.9'), 1);
  });
});
