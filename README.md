# ghsw — GitHub Switcher

Manage **multiple GitHub accounts** with **HTTPS + token auth** via the [`gh`](https://cli.github.com/) CLI.  
No SSH keys required.

`ghsw use <profile>` switches **both**:

1. **Auth** — `gh auth switch` (active token / account)
2. **Git identity** — global `user.name` / `user.email`

---

## Requirements

- Node.js 18+
- [GitHub CLI (`gh`)](https://cli.github.com/) on PATH
- Git

---

## Install

### Mac / Linux

```bash
./install.sh
```

### Windows (PowerShell)

```powershell
.\install.ps1
```

### npm (any platform)

```bash
npm install -g .
# or from the package directory after npm install
```

---

## Quick start — interactive menu

Just run:

```bash
ghsw
```

You’ll get a selectable menu (arrow keys + Enter): switch, status, add, link, test, edit, remove, exit. After each action it returns to the menu.

Subcommands still work (`ghsw use work`, `ghsw list`, …).

### First account (menu or CLI)

```bash
ghsw                  # choose "Add profile"
# or:
ghsw add
ghsw use personal
ghsw current
ghsw test personal
```

---

## Adding a **second** GitHub account (guide)

You already have one account in `gh`. To add another:

### Option A — recommended (built into `ghsw add`)

```bash
ghsw add
```

1. Enter a profile alias (e.g. `work`), git name, email, and the **second** GitHub username.
2. If that username is **not** already logged in via `gh`, ghsw launches:

   ```bash
   gh auth login --hostname github.com
   ```

3. In the login flow:
   - Choose **HTTPS** (not SSH)
   - Authenticate as the **second** account (browser or token)
4. ghsw confirms via `gh auth status` and saves the profile.
5. Switch:

   ```bash
   ghsw use work
   ```

### Option B — force a new login anytime

```bash
ghsw add --login
```

Always opens `gh auth login`, even if some accounts already exist. Use this when adding another account on purpose.

### Option C — login with `gh` first, then save profile

```bash
gh auth login --hostname github.com
gh auth status
ghsw add          # will skip login if that username is already present
ghsw use work
```

### Verify both accounts

```bash
gh auth status
ghsw list
ghsw current
ghsw test work
ghsw test personal
```

---

## Commands

| Command | What it does |
|---------|----------------|
| `ghsw add [--login]` | Create profile; login via `gh` if needed |
| `ghsw use <name>` | Switch **auth + global git name/email** |
| `ghsw link <name> <folder>` | Per-folder commit identity via `includeIf` |
| `ghsw list` | List profiles |
| `ghsw current` | Active `gh` user + matching profile + global git |
| `ghsw test <name>` | Switch + `gh api user` sanity check |
| `ghsw edit <name>` | Update stored name/email |
| `ghsw remove <name>` | Remove profile (optional `gh auth logout`) |

Profiles live in `~/.ghsw/config.json`.

---

## How per-folder linking works

```bash
ghsw link work ~/code/company-app
```

ghsw:

1. Backs up `~/.gitconfig` to a timestamped `.bak`
2. Writes `~/.gitconfig-work` with `user.name`, `user.email`, and `credential.useHttpPath = true`
3. Adds (or updates in place) an `includeIf "gitdir:..."` block in `~/.gitconfig` for that folder

Inside that folder, **commits** pick up the linked profile’s name/email automatically.

### Caveat (important)

**`gh` token auth is global per switch.**  
Folder linking does **not** by itself change which GitHub account HTTPS push/pull uses.

For push/pull as that account, run:

```bash
ghsw use work
```

before operating in that folder (unless you have fully configured path-scoped HTTPS credentials).  
`credential.useHttpPath = true` in the generated gitconfig helps Git store credentials per repo path, but it does **not** replace `gh auth switch`.

---

## Auth model

| Layer | What switches it |
|-------|------------------|
| Commit author (`user.name` / `user.email`) | `ghsw use` (global) or `ghsw link` (per folder via `includeIf`) |
| HTTPS token / API (`gh`) | `ghsw use` → `gh auth switch` only |

This tool intentionally uses **HTTPS + `gh` tokens**, not SSH key swapping.

---

## Safety

- Confirms before `remove` and before `gh auth logout`
- Backs up `~/.gitconfig` before edits
- Repeated `ghsw link` on the same folder **updates** the existing `includeIf` block (no duplicates)
- Clear errors if `gh` is missing or unauthenticated

---

## Uninstall

```bash
npm uninstall -g ghsw
# optional: rm -rf ~/.ghsw
# optional: remove includeIf blocks / ~/.gitconfig-<profile> by hand or via ghsw remove
```
