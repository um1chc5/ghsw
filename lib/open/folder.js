import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

/**
 * Open a folder in Cursor, VS Code, or the OS file manager.
 * @param {string} dir
 * @returns {{ ok: boolean, via?: string }}
 */
export function openFolder(dir) {
  if (!dir || !fs.existsSync(dir)) {
    return { ok: false };
  }

  /** @type {Array<[string, string[]]>} */
  const cmds =
    process.platform === 'win32'
      ? [
          ['cursor', [dir]],
          ['code', [dir]],
          ['explorer', [dir]],
        ]
      : process.platform === 'darwin'
        ? [
            ['cursor', [dir]],
            ['code', [dir]],
            ['open', [dir]],
          ]
        : [
            ['cursor', [dir]],
            ['code', [dir]],
            ['xdg-open', [dir]],
          ];

  for (const [cmd, args] of cmds) {
    const result = spawnSync(cmd, args, {
      stdio: 'ignore',
      windowsHide: true,
    });
    if (result.error?.code === 'ENOENT') continue;
    if (result.status === 0 || result.status === null) {
      return { ok: true, via: cmd };
    }
  }

  return { ok: false };
}
