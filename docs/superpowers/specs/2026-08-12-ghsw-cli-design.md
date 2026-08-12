# ghsw (GitHub Switcher) Design

**Date:** 2026-08-12  
**Status:** Approved

## Goal

A cross-platform Node.js CLI (`ghsw`) that manages multiple GitHub account profiles using HTTPS + `gh` CLI token auth (not SSH), and switches identity instantly — globally via `ghsw use`, and per-folder git identity via `includeIf` links.

## Non-goals

- SSH key management
- Custom credential helper implementation
- Enterprise GitHub host switching beyond `github.com` (hostname fixed to `github.com` in v1)

## Architecture

Thin CLI wrapping:

1. **`gh` CLI** — login, switch, status, logout, API user check
2. **Git config** — global `user.name` / `user.email`, `includeIf` blocks, generated `~/.gitconfig-<profile>` files
3. **Local profile store** — `~/.ghsw/config.json`

```
cli.js  →  lib/prompts.js
        →  lib/profiles.js  (CRUD ~/.ghsw/config.json)
        →  lib/gh.js        (spawn gh commands)
        →  lib/git.js       (read/write gitconfig, backups)
```

## Profile model

Stored at `~/.ghsw/config.json`:

```json
{
  "profiles": [
    {
      "name": "work",
      "gitName": "Ada Lovelace",
      "email": "ada@company.com",
      "username": "ada-work"
    }
  ]
}
```

- `name` — profile alias used in CLI commands  
- `gitName` — maps to `git user.name`  
- `email` — maps to `git user.email`  
- `username` — GitHub login used with `gh auth switch --user`

## Commands

### `ghsw add [--login]`

1. Prompt for profile name, git name, email, GitHub username (inquirer).
2. Ensure `gh` is installed; else print install instructions and exit non-zero.
3. Parse `gh auth status` for `github.com`.
4. If `--login` **or** username is not already authenticated → run interactive `gh auth login --hostname github.com`.
5. Confirm account via `gh auth status`; save profile.
6. Print next steps (`ghsw use <name>`, optional `ghsw link`).

### `ghsw use <profile-name>`

1. Load profile or error if missing.
2. `gh auth switch --hostname github.com --user <username>`.
3. `git config --global user.name` / `user.email` from profile.
4. Print confirmation (auth user + git identity).

### `ghsw link <profile-name> <folder-path>`

1. Resolve folder to absolute path; ensure trailing semantics for `gitdir:` (`/path/to/folder/`).
2. Backup `~/.gitconfig` to timestamped `.bak` before edit.
3. Write/overwrite `~/.gitconfig-<profile-name>` with:

```
[user]
    name = ...
    email = ...
[credential]
    useHttpPath = true
```

4. Upsert a single `includeIf "gitdir:<abs>/"` block in `~/.gitconfig` pointing at that file — never duplicate; update in place if folder already linked.
5. Print caveat: folder auto-switches **commit identity** only; **`gh` token remains global** until `ghsw use <profile>`. `credential.useHttpPath` helps path-scoped HTTPS credentials but does not replace `gh auth switch`.

### `ghsw list`

Print all profiles (name, gitName, email, username).

### `ghsw current`

Run `gh auth status`, cross-reference active `github.com` user with profiles; also show global git `user.name` / `user.email`.

### `ghsw test <profile-name>`

Switch to profile (`use` behavior), then `gh api user --hostname github.com`, print returned `login`.

### `ghsw edit <profile-name>`

Prompt to update `gitName` and `email` (keep `name` / `username` unless we later add rename). Persist. If a generated `~/.gitconfig-<name>` exists, refresh name/email/`useHttpPath`.

### `ghsw remove <profile-name>`

Confirm. Remove from config; delete `~/.gitconfig-<name>` if present; remove matching `includeIf` blocks that pointed at that file; ask whether to run `gh auth logout --hostname github.com --user <username>`.

## Installers & packaging

- `package.json` with `"bin": { "ghsw": "./cli.js" }` and dependencies: `commander`, `chalk`, `inquirer`.
- `install.sh` (Mac/Linux): check Node + `gh`; install via package manager or print instructions; `npm install -g` from repo or symlink into PATH.
- `install.ps1` (Windows): same checks; winget/choco hints for Node/`gh`; npm global install.

## UX & safety

- Colored output via chalk; interactive prompts via inquirer; CLI via commander.
- Confirm before remove and before `gh auth logout`.
- Backup `~/.gitconfig` before any edit (timestamped `.bak`).
- Missing `gh` / unauthenticated: clear setup instructions, no stack traces.
- Never duplicate `includeIf` for the same folder path.

## Auth model (HTTPS)

- Tokens live in `gh`'s credential store.
- `ghsw use` switches the active account globally for `gh` and for git HTTPS when using gh as credential helper.
- Per-folder `includeIf` only changes commit author metadata (+ `credential.useHttpPath`).
- Document second-account flow: `ghsw add` (or `ghsw add --login`) → browser/device login → `ghsw use` / `ghsw link`.

## Testing strategy

- Unit-test profile CRUD and gitconfig upsert logic with temp dirs (no live `gh` required).
- Manual smoke: add, use, list, current, link, test, edit, remove (when `gh` available).
