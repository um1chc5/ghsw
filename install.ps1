# install.ps1 — install ghsw (Windows)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Info($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "OK  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "!!  $msg" -ForegroundColor Yellow }

Write-Info "Checking Node.js (>= 18)..."
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Warn "Node.js not found."
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if ($winget) {
    Write-Info "Installing Node.js LTS via winget..."
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  } else {
    Write-Warn "Install Node from https://nodejs.org/ then re-run install.ps1"
    exit 1
  }
}

$ver = node -v
Write-Ok "Node $ver"

Write-Info "Checking GitHub CLI (gh)..."
$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
  Write-Warn "gh not found."
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if ($winget) {
    Write-Info "Installing GitHub CLI via winget..."
    winget install GitHub.cli --accept-package-agreements --accept-source-agreements
  } else {
    Write-Warn "Install gh from https://cli.github.com/"
    Write-Warn "Then: gh auth login --hostname github.com"
  }
} else {
  Write-Ok "gh found"
}

Write-Info "Installing ghsw globally with npm..."
Set-Location $Root
npm install
npm install -g .

Write-Ok "ghsw installed."
Write-Host ""
Write-Host "Next steps (second GitHub account example):"
Write-Host "  1. ghsw add            # prompts + gh auth login if needed"
Write-Host "  2. ghsw add --login    # force login for another account"
Write-Host "  3. ghsw use <name>     # switch auth + global git identity"
Write-Host "  4. ghsw link <name> C:\code\work-repo"
Write-Host ""
Write-Host "Verify:  ghsw --help; ghsw list"
