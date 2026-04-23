param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$GradleHome = "",
  [switch]$FixGit = $true,
  [switch]$FixGradle = $true,
  [switch]$KillJava
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "[fix-locks] $Message"
}

function Test-IsAdmin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Repair-GitLocks {
  param([string]$Root)
  $gitDir = Join-Path $Root ".git"
  if (-not (Test-Path $gitDir)) {
    Write-Step ".git directory not found, skipped."
    return
  }

  if (Test-IsAdmin) {
    Write-Step "Repairing .git permissions (admin)."
    try {
      & takeown /F $gitDir /R /D Y *> $null
    } catch {
      # best effort
    }
    try {
      & icacls $gitDir /reset /T /C *> $null
    } catch {
      # best effort
    }
  } else {
    Write-Step "Not admin. Skip ACL reset; only clean stale lock files."
  }

  $gitLocks = @(
    (Join-Path $gitDir "index.lock"),
    (Join-Path $gitDir "packed-refs.lock"),
    (Join-Path $gitDir "shallow.lock"),
    (Join-Path $gitDir "config.lock")
  )

  foreach ($lockPath in $gitLocks) {
    if (Test-Path $lockPath) {
      try {
        Remove-Item $lockPath -Force
        Write-Step "Removed $lockPath"
      } catch {
        Write-Step "Could not remove ${lockPath}: $($_.Exception.Message)"
      }
    }
  }
}

function Repair-GradleLocks {
  param([string]$Root, [string]$PrimaryGradleHome, [switch]$StopJava)
  $androidDir = Join-Path $Root "android"
  $gradlew = Join-Path $androidDir "gradlew.bat"
  $cacheRoots = @((Join-Path $Root ".gradle-local"), $PrimaryGradleHome) | Select-Object -Unique

  if ((Test-Path $gradlew) -and (Test-Path $androidDir)) {
    foreach ($gradleHomePath in $cacheRoots) {
      try {
        $env:GRADLE_USER_HOME = $gradleHomePath
        Push-Location $androidDir
        & .\gradlew.bat --stop *> $null
      } catch {
        # best effort
      } finally {
        Pop-Location
      }
    }
  }

  if ($StopJava) {
    Write-Step "Stopping java processes."
    Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  }

  foreach ($cacheRoot in $cacheRoots) {
    if (-not (Test-Path $cacheRoot)) {
      continue
    }
    Write-Step "Cleaning lock files in $cacheRoot"
    Get-ChildItem -Path $cacheRoot -Recurse -File -Filter *.lock -ErrorAction SilentlyContinue | ForEach-Object {
      try {
        Remove-Item $_.FullName -Force -ErrorAction Stop
      } catch {
        # best effort
      }
    }

    $transformsPath = Join-Path $cacheRoot "caches\8.14.3\transforms"
    if (Test-Path $transformsPath) {
      try {
        Remove-Item $transformsPath -Recurse -Force -ErrorAction Stop
        Write-Step "Removed transforms cache in $cacheRoot"
      } catch {
        # best effort
      }
    }
  }
}

Write-Step "Project root: $ProjectRoot"

if ([string]::IsNullOrWhiteSpace($GradleHome)) {
  $GradleHome = Join-Path $ProjectRoot ".gradle-local"
}

if ($FixGit) {
  Repair-GitLocks -Root $ProjectRoot
}
if ($FixGradle) {
  Repair-GradleLocks -Root $ProjectRoot -PrimaryGradleHome $GradleHome -StopJava:$KillJava
}

Write-Step "Done."
