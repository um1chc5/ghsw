import { run, runInteractive } from './run.js';
import { isGhInstalled } from './auth.js';

/**
 * Clone a GitHub repo into cwd via `gh repo clone`.
 * Uses the currently active gh auth account.
 * @param {string} repo - owner/name or URL
 * @returns {Promise<{ ok: boolean, missing?: boolean }>}
 */
export async function repoClone(repo) {
  if (!isGhInstalled()) {
    return { ok: false, missing: true };
  }
  // Clone into current working directory (gh creates ./<repo-name>)
  return runInteractive('gh', ['repo', 'clone', repo]);
}

/**
 * List repos the active account can access: owned, collaborator, and org.
 * `gh repo list` only returns owned repos, so invited/org repos are missing there.
 * @param {{ limit?: number, owner?: string }} [opts]
 * @returns {{ ok: boolean, missing?: boolean, repos: Array<{ nameWithOwner: string, description: string | null, isPrivate: boolean, updatedAt: string }>, raw?: string }}
 */
export function listRepos(opts = {}) {
  if (!isGhInstalled()) {
    return { ok: false, missing: true, repos: [] };
  }
  const limit = opts.limit ?? 80;

  // Optional: list one owner's repos (CLI-style)
  if (opts.owner) {
    const result = run('gh', [
      'repo',
      'list',
      opts.owner,
      '--limit',
      String(limit),
      '--json',
      'nameWithOwner,description,isPrivate,updatedAt',
    ]);
    if (!result.ok) {
      return {
        ok: false,
        missing: false,
        repos: [],
        raw: result.stderr || result.stdout,
      };
    }
    try {
      const repos = JSON.parse(result.stdout || '[]');
      return { ok: true, repos: Array.isArray(repos) ? repos : [] };
    } catch {
      return { ok: false, repos: [], raw: result.stdout };
    }
  }

  const query =
    'user/repos?affiliation=owner,collaborator,organization_member&per_page=100&sort=updated';
  const result = run('gh', [
    'api',
    query,
    '--jq',
    '.[] | {nameWithOwner: .full_name, description, isPrivate: .private, updatedAt: .updated_at}',
  ]);
  if (!result.ok) {
    return {
      ok: false,
      missing: false,
      repos: [],
      raw: result.stderr || result.stdout,
    };
  }

  const repos = [];
  const seen = new Set();
  for (const line of (result.stdout || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const row = JSON.parse(trimmed);
      const key = row.nameWithOwner;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      repos.push({
        nameWithOwner: key,
        description: row.description ?? null,
        isPrivate: Boolean(row.isPrivate),
        updatedAt: row.updatedAt || '',
      });
    } catch {
      // skip malformed line
    }
  }

  return { ok: true, repos: repos.slice(0, limit) };
}
