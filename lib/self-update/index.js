import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../gh/run.js';

const PKG_NAME = '@um1chc5-aner/ghsw';

/**
 * @returns {{ name: string, version: string }}
 */
export function getLocalPackage() {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const pkgPath = path.join(dir, '..', '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return { name: pkg.name || PKG_NAME, version: pkg.version };
}

/**
 * Latest version on npm, or null if lookup fails.
 * @returns {string | null}
 */
export function getLatestVersion() {
  const result = run('npm', ['view', PKG_NAME, 'version']);
  if (!result.ok) return null;
  const ver = (result.stdout || '').trim();
  return ver || null;
}

/**
 * Compare semver-ish a vs b. Returns 1 if a>b, -1 if a<b, 0 if equal.
 * @param {string} a
 * @param {string} b
 */
export function compareSemver(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

/**
 * Globally install latest package from npm.
 * @returns {{ ok: boolean, stdout: string, stderr: string }}
 */
export function installLatestGlobal() {
  return run('npm', ['install', '-g', `${PKG_NAME}@latest`], {
    inheritStdio: true,
  });
}

export { PKG_NAME };
