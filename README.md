<p align="center">
  <img src="https://img.shields.io/badge/ghsw-GitHub%20Switcher-24292f?style=for-the-badge&logo=github&logoColor=white" alt="ghsw" />
</p>

<h1 align="center">ghsw</h1>

<p align="center">
  <strong>GitHub Switcher</strong> — jump between GitHub accounts in one command.<br/>
  HTTPS + <code>gh</code> token auth. No SSH keys. Interactive menu or classic CLI.
</p>

<p align="center">
  <a href="https://github.com/um1chc5/ghsw"><img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-brightgreen" alt="Platform" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white" alt="Node" /></a>
  <a href="https://cli.github.com/"><img src="https://img.shields.io/badge/requires-gh%20CLI-000000?logo=github" alt="gh CLI" /></a>
  <a href="./package.json"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License" /></a>
  <a href="https://github.com/um1chc5/ghsw"><img src="https://img.shields.io/badge/version-1.1.2-informational" alt="Version" /></a>
</p>

<p align="center">
  <a href="#-install">Install</a> ·
  <a href="#-quick-start">Quick start</a> ·
  <a href="#-commands">Commands</a> ·
  <a href="#-second-account-guide">Second account</a> ·
  <a href="#-how-it-works">How it works</a>
</p>

---

## Why ghsw?

Switching GitHub identities usually means juggling tokens, `git config`, and hoping you didn’t push as the wrong user.

**`ghsw use <profile>` does both at once:**

| Layer | What changes |
|-------|----------------|
| **Auth** | `gh auth switch` — active HTTPS token / account |
| **Git identity** | global `user.name` + `user.email` |

Optional **per-folder** links so commit author follows the repo you’re in.

---

## Features

- **Interactive app** — run `ghsw` and pick an action (arrow keys + Enter)
- **Instant switch** — auth + git identity in one step
- **Multi-account ready** — `add` / `add --login` walks you through a second `gh auth login`
- **Per-folder identity** — `link` via git `includeIf` (no duplicate blocks)
- **Safety nets** — confirms before remove/logout; timestamped `~/.gitconfig` backups
- **HTTPS-first** — built on the official `gh` CLI; no SSH key swapping

---

## Demo

```text
$ ghsw

ghsw — GitHub Switcher (HTTPS + gh)

? What do you want to do?
❯ Switch profile (use) — auth + git identity
  Show current status
  List profiles
  Add profile (login if needed)
  Add profile + force new login
  Link folder to profile
  Test profile auth
  Edit profile name/email
  Remove profile
 ──────────────
  Exit
```

```bash
$ ghsw use work
Switched to profile "work"
  GitHub:  your-work-user
  git:     Ada Lovelace <ada@company.com>
```

---

## Requirements

| Tool | Notes |
|------|--------|
| **Node.js** 18+ | Runtime |
| **[GitHub CLI (`gh`)](https://cli.github.com/)** | Auth backend (must be on `PATH`) |
| **Git** | Config + `includeIf` |

---

## Install

### npm (recommended)

Global CLI — use from anywhere:

```bash
npm install -g @um1chc5-aner/ghsw
```

Then:

```bash
ghsw
ghsw --help
```

> Command is still `ghsw`. Package name is scoped because npm blocks the unscoped name `ghsw`.

### From source (clone + install)

```bash
git clone https://github.com/um1chc5/ghsw.git
cd ghsw
```

**macOS / Linux (Ubuntu included)**

```bash
chmod +x install.sh
./install.sh
```

**Windows (PowerShell)**

```powershell
.\install.ps1
```

**npm (any platform)**

```bash
npm install
npm install -g .
```

Verify:

```bash
ghsw --help
ghsw          # interactive menu
```

---

## Quick start

### Interactive (recommended)

```bash
ghsw
```

Choose **Add profile** → fill name / email / GitHub username → complete `gh` login if needed → **Switch profile**.

### Classic CLI

```bash
ghsw add
ghsw use personal
ghsw current
ghsw test personal
```

---

## Second account guide

Already logged into one GitHub account? Add another:

### A — Recommended

```bash
ghsw add
# or from the menu: "Add profile (login if needed)"
```

1. Profile alias (e.g. `work`), git name, email, **second** GitHub username  
2. If that user isn’t in `gh` yet → launches `gh auth login --hostname github.com`  
3. Choose **HTTPS**, finish browser/token login as the second account  
4. Switch:

```bash
ghsw use work
```

### B — Force a new login

```bash
ghsw add --login
# menu: "Add profile + force new login"
```

### C — Login with `gh` first

```bash
gh auth login --hostname github.com
ghsw add          # skips login if username already present
ghsw use work
```

### Verify

```bash
gh auth status
ghsw list
ghsw current
ghsw test work
ghsw test personal
```

---

## Commands

| Command | Description |
|---------|-------------|
| `ghsw` | Open interactive menu |
| `ghsw menu` | Same as above |
| `ghsw add [--login]` | Create profile; login via `gh` if needed |
| `ghsw use <name>` | Switch **auth + global git name/email** |
| `ghsw link <name> <folder>` | Per-folder commit identity (`includeIf`) |
| `ghsw list` | List saved profiles |
| `ghsw current` | Active `gh` user + matching profile + global git |
| `ghsw test <name>` | Switch + `gh api user` check |
| `ghsw edit <name>` | Update stored name/email |
| `ghsw remove <name>` | Remove profile (optional `gh auth logout`) |

Profiles are stored in `~/.ghsw/config.json`.

---

## How it works

### Global switch

```bash
ghsw use work
```

1. `gh auth switch --hostname github.com --user <username>`  
2. `git config --global user.name` / `user.email` from the profile  

### Per-folder link

```bash
ghsw link work ~/code/company-app
```

1. Backs up `~/.gitconfig` → timestamped `.bak`  
2. Writes `~/.gitconfig-work` with `user.name`, `user.email`, `credential.useHttpPath = true`  
3. Upserts one `includeIf "gitdir:…"` block (no duplicates on re-link)  

Commits in that folder pick up the linked author automatically.

> [!IMPORTANT]
> **`gh` token auth is still global per switch.**  
> Folder linking does **not** alone change which account HTTPS push/pull uses.  
> Run `ghsw use <profile>` before push/pull for that account.  
> `credential.useHttpPath` helps path-scoped credentials; it does **not** replace `gh auth switch`.

### Auth model

| Concern | Switched by |
|---------|-------------|
| Commit author | `ghsw use` (global) or `ghsw link` (per folder) |
| HTTPS token / API | `ghsw use` → `gh auth switch` only |

---

## Safety

- Confirm before `remove` and before `gh auth logout`
- Timestamped backup of `~/.gitconfig` before edits
- Re-`link` updates the existing `includeIf` in place
- Clear setup hints if `gh` is missing or unauthenticated

---

## Uninstall

```bash
npm uninstall -g ghsw
# optional cleanup:
# rm -rf ~/.ghsw
# ghsw remove <name>   # or manually drop includeIf / ~/.gitconfig-<name>
```

---

## Release / npm publish

1. In Cursor, run the project skill **pump-version** (or say “pump version”).
2. Agent opens a PR that only bumps `package.json` (and README badge if needed).
3. **You** review and merge the PR into `master`.
4. Workflow [Publish to npm on merge](.github/workflows/publish-npm.yml) publishes `@um1chc5-aner/ghsw` if that version is not already on npm.

---

## License

MIT © [um1chc5](https://github.com/um1chc5)
