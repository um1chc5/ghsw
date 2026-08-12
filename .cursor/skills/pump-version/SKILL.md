---
name: pump-version
description: >-
  Bumps this package version, creates a release branch, commits package.json,
  pushes, and opens a PR to master for the owner to merge. Use when the user
  says "pump version", "bump version", "release PR", or wants a version bump
  PR without publishing locally. After merge, publish-npm.yml publishes to npm.
disable-model-invocation: false
---

# Pump version (release PR)

Owner-driven release for `@um1chc5-aner/ghsw`.

**You merge the PR.** Do not auto-merge. Do not push version bumps straight to `master` unless the user explicitly asks.

After merge to `master`, GitHub Actions workflow `.github/workflows/publish-npm.yml` publishes to npm (skips if that version already exists).

## When to use

User asks to: pump / bump version, cut a release PR, prepare npm publish.

## Defaults

- Bump type: **patch** (`1.1.1` → `1.1.2`) unless user says `minor` or `major`
- Base branch: `master`
- Release branch: `chore/v<new-version>` (e.g. `chore/v1.1.2`)
- Commit message: `chore(release): v<new-version>`
- PR title: `chore(release): v<new-version>`

## Steps (follow exactly)

1. **Preflight**
   - `git status` — working tree should be clean (or only unrelated WIP; if dirty with release-related files, stop and ask)
   - `git fetch origin`
   - Confirm on a clean checkout from latest `origin/master`

2. **Choose bump**
   - If user said patch / minor / major, use that
   - Else default **patch**
   - Read current version from `package.json`

3. **Create branch from master**
   ```bash
   git checkout master
   git pull origin master
   NEW_VER=$(node -p "
     const v=require('./package.json').version.split('.').map(Number);
     const kind='patch'; // replace with minor|major if requested
     if (kind==='major') { v[0]++; v[1]=0; v[2]=0; }
     else if (kind==='minor') { v[1]++; v[2]=0; }
     else { v[2]++; }
     v.join('.')
   ")
   # Prefer: npm version <patch|minor|major> --no-git-tag-version after checkout
   git checkout -b "chore/v${NEW_VER}"
   ```

   Prefer this sequence instead of hand-editing version:

   ```bash
   git checkout master && git pull origin master
   git checkout -b "chore/tmp-release"
   npm version patch --no-git-tag-version   # or minor / major
   NEW_VER=$(node -p "require('./package.json').version")
   git branch -m "chore/v${NEW_VER}"
   ```

4. **Also update README version badge** if it hardcodes a version (keep in sync with `package.json`).

5. **Commit**
   ```bash
   git add package.json README.md
   git commit -m "$(cat <<EOF
   chore(release): v${NEW_VER}

   EOF
   )"
   ```
   Only include README if the badge actually changed.

6. **Push + open PR**
   ```bash
   git push -u origin HEAD
   gh pr create --base master --title "chore(release): v${NEW_VER}" --body "$(cat <<EOF
   ## Summary
   - Bump package version to **v${NEW_VER}**

   ## After merge
   - Workflow **Publish to npm on merge** will publish \`@um1chc5-aner/ghsw@${NEW_VER}\` if that version is not already on npm.

   ## Test plan
   - [ ] Version in \`package.json\` is ${NEW_VER}
   - [ ] Owner reviews and merges
   - [ ] Confirm Actions publish run succeeds
   - [ ] \`npm view @um1chc5-aner/ghsw version\` shows ${NEW_VER}

   EOF
   )"
   ```

7. **Report to user**
   - New version
   - Branch name
   - PR URL
   - Remind: merge when ready → npm publish runs automatically

## Do not

- Do not merge the PR unless the user asks
- Do not run `npm publish` locally (CI owns publish)
- Do not recreate `.github/workflows/version-bump.yml`
- Do not force-push `master`

## If `gh` / push fails

- Switch GitHub auth to repo owner if needed: `gh auth switch --user um1chc5`
- Surface the error; do not invent a workaround that bypasses branch protection
