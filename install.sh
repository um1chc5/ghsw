#!/usr/bin/env bash
# install.sh — install ghsw (Mac/Linux)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

info()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()    { printf '\033[1;32mOK\033[0m  %s\n' "$*"; }
warn()  { printf '\033[1;33m!!\033[0m  %s\n' "$*"; }
fail()  { printf '\033[1;31mERR\033[0m %s\n' "$*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1
}

info "Checking Node.js (>= 18)..."
if ! need_cmd node; then
  warn "Node.js not found."
  if need_cmd brew; then
    info "Installing Node via Homebrew..."
    brew install node
  elif need_cmd apt-get; then
    info "Install Node with: curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs"
    fail "Please install Node.js, then re-run ./install.sh"
  else
    fail "Install Node.js from https://nodejs.org/ then re-run ./install.sh"
  fi
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  fail "Node.js 18+ required (found $(node -v))"
fi
ok "Node $(node -v)"

info "Checking GitHub CLI (gh)..."
if ! need_cmd gh; then
  warn "gh not found."
  if need_cmd brew; then
    info "Installing gh via Homebrew..."
    brew install gh
  else
    warn "Install gh from https://cli.github.com/ then authenticate:"
    warn "  gh auth login --hostname github.com"
    warn "Continuing with ghsw install; gh is required to use profiles."
  fi
else
  ok "gh $(gh --version | head -1)"
fi

info "Installing ghsw globally with npm..."
cd "$ROOT"
npm install
npm install -g .

ok "ghsw installed."
echo
echo "Next steps (second GitHub account example):"
echo "  1. ghsw add            # prompts + gh auth login if needed"
echo "  2. ghsw add --login    # force login for another account"
echo "  3. ghsw use <name>     # switch auth + global git identity"
echo "  4. ghsw link <name> ~/code/work-repo"
echo
echo "Verify:  ghsw --help && ghsw list"
