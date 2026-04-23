param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$GradleHome = "",
  [switch]$SkipLockFix
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "[release-apk] $Message"
}

function Test-WritableDirectory {
  param([string]$Path)
  try {
    if (-not (Test-Path $Path)) {
      New-Item -ItemType Directory -Path $Path | Out-Null
    }
    $probe = Join-Path $Path ".write-test.tmp"
    New-Item -ItemType File -Path $probe -Force | Out-Null
    Remove-Item $probe -Force -ErrorAction SilentlyContinue
    return $true
  } catch {
    return $false
  }
}

function Resolve-GradleHome {
  param([string]$Root, [string]$Preferred)
  if (-not [string]::IsNullOrWhiteSpace($Preferred)) {
    return @($Preferred)
  }

  $candidates = @(
    (Join-Path $env:LOCALAPPDATA "SimpleTranslator\gradle-cache"),
    (Join-Path $Root ".gradle-local"),
    "C:\gradle-cache-st"
  ) | Select-Object -Unique

  return $candidates
}

$androidDir = Join-Path $ProjectRoot "android"
$gradlew = Join-Path $androidDir "gradlew.bat"
if (-not (Test-Path $gradlew)) {
  throw "gradlew.bat not found in $androidDir"
}

$androidPrefs = Join-Path $ProjectRoot ".android-prefs"
if (-not (Test-Path $androidPrefs)) {
  New-Item -ItemType Directory -Path $androidPrefs | Out-Null
}

$candidateHomes = Resolve-GradleHome -Root $ProjectRoot -Preferred $GradleHome
$lastExit = 1
$usedGradleHome = $null

foreach ($candidate in $candidateHomes) {
  if (-not (Test-WritableDirectory -Path $candidate)) {
    Write-Step "Skip unwritable cache path: $candidate"
    continue
  }

  $usedGradleHome = $candidate
  if (-not $SkipLockFix) {
    Write-Step "Running lock repair script. GradleHome=$candidate"
    & (Join-Path $PSScriptRoot "fix-locks.ps1") -ProjectRoot $ProjectRoot -GradleHome $candidate -FixGit -FixGradle
  }

  $env:GRADLE_USER_HOME = $candidate
  $env:ANDROID_PREFS_ROOT = $androidPrefs
  $env:NODE_ENV = "production"
  $env:GRADLE_OPTS = "-Dorg.gradle.workers.max=1 -Dkotlin.compiler.execution.strategy=in-process -Dorg.gradle.caching=false"

  Write-Step "Building release APK with cache: $candidate"
  Push-Location $androidDir
  try {
    & .\gradlew.bat assembleRelease --no-daemon --no-parallel --no-watch-fs
    $lastExit = $LASTEXITCODE
  } finally {
    Pop-Location
  }

  if ($lastExit -eq 0) {
    break
  }

  Write-Step "Build failed with cache $candidate (exit $lastExit), trying next cache path."
}

if ($lastExit -ne 0) {
  if ($usedGradleHome) {
    throw "assembleRelease failed with exit code $lastExit (last cache: $usedGradleHome)"
  }
  throw "assembleRelease failed: no writable cache path available."
}

$apkPath = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $apkPath)) {
  throw "Build reported success but APK not found: $apkPath"
}

$apk = Get-Item $apkPath
Write-Step "APK ready: $($apk.FullName)"
Write-Step ("Size: {0} MB" -f [math]::Round($apk.Length / 1MB, 2))
Write-Step "Updated: $($apk.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))"
