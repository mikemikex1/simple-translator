param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "[fix-git-acl-admin] $Message"
}

function Test-IsAdmin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdmin)) {
  throw "Please run this script in an Administrator PowerShell."
}

$gitDir = Join-Path $ProjectRoot ".git"
if (-not (Test-Path $gitDir)) {
  throw ".git not found: $gitDir"
}

$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

Write-Step "Stopping git processes."
Get-Process git -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Step "Taking ownership of .git."
& takeown /F $gitDir /R /D Y | Out-Null

Write-Step "Resetting ACL and enabling inheritance."
& icacls $gitDir /reset /T /C | Out-Null
& icacls $gitDir /inheritance:e /T /C | Out-Null
& icacls $gitDir /grant "${currentUser}:(OI)(CI)F" /T /C | Out-Null

Write-Step "Removing stale lock files."
$lockNames = @("index.lock", "packed-refs.lock", "shallow.lock", "config.lock")
foreach ($name in $lockNames) {
  $lockPath = Join-Path $gitDir $name
  if (Test-Path $lockPath) {
    Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
  }
}

Write-Step "Done."
