import { spawn, spawnSync } from 'node:child_process';

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ inheritStdio?: boolean, input?: string }} [opts]
 * @returns {{ ok: boolean, stdout: string, stderr: string, status: number | null }}
 */
export function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    input: opts.input,
    stdio: opts.inheritStdio ? 'inherit' : ['pipe', 'pipe', 'pipe'],
    shell: false,
  });

  if (result.error && result.error.code === 'ENOENT') {
    return {
      ok: false,
      stdout: '',
      stderr: `${command} not found`,
      status: null,
      missing: true,
    };
  }

  return {
    ok: result.status === 0,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status,
    missing: false,
  };
}

/**
 * Interactive command (login) that inherits stdio.
 * @param {string} command
 * @param {string[]} args
 * @returns {Promise<{ ok: boolean, status: number | null, missing: boolean }>}
 */
export function runInteractive(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
    });
    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        resolve({ ok: false, status: null, missing: true });
        return;
      }
      resolve({ ok: false, status: null, missing: false });
    });
    child.on('close', (status) => {
      resolve({ ok: status === 0, status, missing: false });
    });
  });
}
