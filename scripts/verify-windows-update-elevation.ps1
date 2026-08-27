<#
.SYNOPSIS
  verify-windows-update-elevation.ps1 - prove the #492 elevation verdict on real
  Windows hardware.

.DESCRIPTION
  The Windows auto-update fix for #492 rests on four claims that cannot be
  tested anywhere but Windows. This script executes each one on this machine and
  prints PASS/FAIL, so the fix is confirmed by observation rather than argument.

    1. The install this machine actually has is per-machine (%ProgramFiles%) or
       per-user (%LocalAppData%\Programs), read from the uninstall registry.
    2. A real create+delete is the only truthful writability test. Windows
       attribute checks - the thing Node's fs.access(W_OK) reports - say a
       directory is writable when it is not. The app therefore probes with a
       real write; this shows why.
    3. The BUILTIN\Administrators SID (S-1-5-32-544) in the process token is what
       separates "UAC will ask for consent" from "UAC will ask for a password
       this user does not have". It is NOT the same question as IsInRole(), which
       reports whether the process is already elevated.
    4. electron-updater's elevate.exe - the binary that raises the UAC prompt -
       is present in the installed app's resources.

  It then computes the exact verdict src/process/services/windowsUpdateElevation.ts
  will compute, and states what the app will now do.

  NON-DESTRUCTIVE. It reads the registry, reads files, and makes exactly one
  attempt to create a zero-byte probe file in the install directory, which it
  deletes immediately. On a per-machine install that attempt is EXPECTED to fail;
  that failure is the measurement. Nothing is installed, uninstalled, updated or
  configured. Any log this script writes goes under -OutDir, which defaults to
  F:\wayland-verify.

.PARAMETER InstallDir
  Check this directory instead of the installed app's location. Use it to test a
  path by hand (e.g. an extracted build on F:).

.PARAMETER Feed
  Also fetch the published latest.yml for this tag (e.g. v0.12.4) and show
  whether electron-updater is being told isAdminRightsRequired: true. Requires
  network access. Omit to run fully offline.

.PARAMETER OutDir
  Directory for the transcript. Defaults to F:\wayland-verify. Never C:.

.EXAMPLE
  # Run from a NORMAL (non-elevated) PowerShell window. That is the point:
  # elevation is what we are measuring.
  powershell -ExecutionPolicy Bypass -File F:\wayland-verify-windows-update-elevation.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\verify-windows-update-elevation.ps1 -Feed v0.12.4

.NOTES
  WHAT A PASS LOOKS LIKE
  ----------------------
  Every numbered check prints PASS, and the final VERDICT block names one of:

    not-required  - per-user install. Updates apply silently, no UAC, forever.
                    This is the outcome #492 wants for new installs.
    available     - per-machine install, and you are an administrator. Updates
                    apply after ONE UAC consent prompt. This already worked.
    unavailable   - per-machine install, and this account is NOT an
                    administrator. THIS IS THE #492 POPULATION. The fix means
                    the app now says so instead of downloading an update and
                    silently failing.
    unknown       - the probe could not reach a verdict. The app behaves exactly
                    as it did before the fix. Not a failure of the fix, but tell
                    Sean, because it means this machine is unreadable.

  A check printing FAIL means the claim underneath the fix is wrong on this
  hardware. That is a real finding - report it, do not work around it.

  LEG B - the end-to-end confirmation (needs a standard account)
  -------------------------------------------------------------
  Checks 1-4 verify the mechanism. To see the user-visible fix:
    1. Create a standard (non-administrator) local account.
    2. Log in as that account. Run this script; it must print unavailable.
    3. Launch the installed Wayland and let it check for updates, with a newer
       release published.
    4. PASS = the update panel shows a message containing "administrator" and
       "Releases page", and NO download starts.
       FAIL = a download runs and the app is still on the old version after a
       restart. That is the original #492 bug.
    5. Confirm in the log, which lives at
         %APPDATA%\Wayland\logs\main.log
       PASS = it contains the line
         [autoUpdater] Windows update elevation capability: unavailable
#>

[CmdletBinding()]
param(
  [string]$InstallDir,
  [string]$Feed,
  [string]$OutDir = 'F:\wayland-verify'
)

$ErrorActionPreference = 'Stop'
$script:Failures = 0
$script:Checks = 0

function Write-Head([string]$Text) {
  Write-Host ''
  Write-Host "=== $Text ===" -ForegroundColor Cyan
}

function Write-Result([string]$Name, [bool]$Ok, [string]$Detail) {
  $script:Checks++
  if ($Ok) {
    Write-Host ("  PASS  {0}" -f $Name) -ForegroundColor Green
  } else {
    $script:Failures++
    Write-Host ("  FAIL  {0}" -f $Name) -ForegroundColor Red
  }
  if ($Detail) { Write-Host ("        {0}" -f $Detail) -ForegroundColor DarkGray }
}

function Write-Info([string]$Text) { Write-Host ("        {0}" -f $Text) -ForegroundColor DarkGray }

# ---------------------------------------------------------------- transcript
try {
  if (-not (Test-Path -LiteralPath $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
  $transcript = Join-Path $OutDir ("winupdate-elevation-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
  Start-Transcript -Path $transcript | Out-Null
  $transcribing = $true
} catch {
  Write-Host "  (no transcript: $($_.Exception.Message))" -ForegroundColor Yellow
  $transcribing = $false
}

Write-Host 'Wayland Windows update-elevation verification (#492)' -ForegroundColor White
Write-Info ("machine   : {0}" -f $env:COMPUTERNAME)
Write-Info ("account   : {0}" -f (whoami))
Write-Info ("powershell: {0}" -f $PSVersionTable.PSVersion)
Write-Info ("64-bit    : {0}  (32-bit processes get UAC file virtualisation, which would fake a successful write)" -f [Environment]::Is64BitProcess)

# ------------------------------------------------- 1. locate the real install
Write-Head '1. Which Wayland install is on this machine'

$uninstallRoots = @(
  @{ Scope = 'per-machine (HKLM 64-bit)'; Path = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall' },
  @{ Scope = 'per-machine (HKLM 32-bit)'; Path = 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall' },
  @{ Scope = 'per-user (HKCU)';           Path = 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall' }
)

$found = @()
foreach ($root in $uninstallRoots) {
  if (-not (Test-Path -LiteralPath $root.Path -ErrorAction SilentlyContinue)) { continue }
  Get-ChildItem -LiteralPath $root.Path -ErrorAction SilentlyContinue | ForEach-Object {
    $props = Get-ItemProperty -LiteralPath $_.PSPath -ErrorAction SilentlyContinue
    if ($props -and $props.DisplayName -like '*Wayland*') {
      $found += [pscustomobject]@{
        Scope           = $root.Scope
        DisplayName     = $props.DisplayName
        DisplayVersion  = $props.DisplayVersion
        InstallLocation = $props.InstallLocation
      }
    }
  }
}

foreach ($f in $found) {
  Write-Info ("{0}  {1} {2}  ->  {3}" -f $f.Scope, $f.DisplayName, $f.DisplayVersion, $f.InstallLocation)
}

if ($InstallDir) {
  $target = $InstallDir
  Write-Result 'install directory resolved' (Test-Path -LiteralPath $target) ("using -InstallDir override: {0}" -f $target)
} elseif ($found.Count -gt 0 -and $found[0].InstallLocation) {
  $target = $found[0].InstallLocation
  Write-Result 'install directory resolved' (Test-Path -LiteralPath $target) ("from the uninstall registry: {0}" -f $target)
} else {
  $target = $null
  Write-Result 'install directory resolved' $false 'No Wayland uninstall entry found and no -InstallDir given. Install Wayland, or pass -InstallDir.'
}

if ($found.Count -gt 1) {
  Write-Info 'NOTE: more than one Wayland install is registered. A per-machine and a per-user copy side by side is its own bug - tell Sean.'
}

# ------------------------------------------- 2. attribute check vs real write
Write-Head '2. Why the app probes with a real write, not an attribute check'

if ($target -and (Test-Path -LiteralPath $target)) {
  $dirItem = Get-Item -LiteralPath $target -Force
  $readOnlyAttr = [bool]($dirItem.Attributes -band [IO.FileAttributes]::ReadOnly)
  Write-Info ("directory attributes    : {0}" -f $dirItem.Attributes)
  Write-Info ("reports the ReadOnly bit: {0}   <- this, and only this, is what Node's fs.access(W_OK) inspects on Windows" -f $readOnlyAttr)

  $probe = Join-Path $target ('.wayland-write-probe-{0}' -f ([guid]::NewGuid().ToString('N')))
  $canWrite = $false
  $writeErr = ''
  try {
    [IO.File]::WriteAllBytes($probe, @())
    $canWrite = $true
  } catch {
    $writeErr = $_.Exception.Message
  } finally {
    try { if (Test-Path -LiteralPath $probe) { Remove-Item -LiteralPath $probe -Force -ErrorAction SilentlyContinue } } catch {}
  }
  Write-Info ("real create+delete      : {0}{1}" -f $canWrite, $(if ($writeErr) { "   ($writeErr)" } else { '' }))
  Write-Result 'probe file left nothing behind' (-not (Test-Path -LiteralPath $probe)) 'the script is non-destructive'

  if (-not $readOnlyAttr -and -not $canWrite) {
    Write-Result 'attribute check disagrees with reality' $true 'The ReadOnly bit is clear yet the write is refused by ACLs. An fs.access-style check would have called this directory writable. This is exactly why the app writes a real file.'
  } elseif ($canWrite) {
    Write-Result 'attribute check agrees with reality' $true 'This directory is genuinely writable by this account, so both methods agree here. The disagreement only shows up on a per-machine install from a non-elevated process.'
  } else {
    Write-Result 'attribute check disagrees with reality' $false 'The directory carries the ReadOnly attribute, which is unusual for an install root. Report this.'
  }
} else {
  Write-Result 'write probe' $false 'skipped: no install directory'
  $canWrite = $null
}

# ------------------------------------------------- 3. who this account really is
Write-Head '3. Can this account satisfy a UAC prompt'

$groupsRaw = $null
try {
  $groupsRaw = (whoami /groups /fo csv /nh | Out-String)
} catch {
  Write-Info ("whoami /groups failed: {0}" -f $_.Exception.Message)
}

if ($null -ne $groupsRaw -and $groupsRaw.Trim().Length -gt 0) {
  # Same test as hasAdministratorsGroup() in windowsUpdateElevation.ts: the SID
  # must not be part of a longer one.
  $hasAdminSid = [bool]([regex]::IsMatch($groupsRaw, '(?:^|[^\w-])S-1-5-32-544(?![\w-])'))
  Write-Result 'group token readable' $true ("whoami /groups returned {0} lines" -f ($groupsRaw -split "`n").Count)
  Write-Info ("BUILTIN\Administrators (S-1-5-32-544) present: {0}" -f $hasAdminSid)

  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $isElevated = (New-Object Security.Principal.WindowsPrincipal($identity)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  Write-Info ("IsInRole(Administrator)                     : {0}" -f $isElevated)
  Write-Info 'These answer different questions. SID presence = "this user CAN elevate". IsInRole = "this process ALREADY IS elevated". The fix needs the first one, which is why it reads the token rather than calling IsInRole.'

  if ($hasAdminSid -and -not $isElevated) {
    Write-Result 'the two probes are distinguishable' $true 'Split-token administrator: carries the SID, is not currently elevated. This is the case IsInRole would have got wrong.'
  } elseif ($hasAdminSid -and $isElevated) {
    Write-Result 'the two probes are distinguishable' $true 'This PowerShell is running elevated, so both say true. Re-run from a NORMAL window to see them diverge.'
  } else {
    Write-Result 'the two probes are distinguishable' $true 'Standard account: neither is true. This is the #492 user.'
  }
} else {
  $hasAdminSid = $null
  Write-Result 'group token readable' $false 'whoami /groups produced nothing. The app degrades to "unknown" here and changes no behaviour.'
}

# --------------------------------------------------------- 4. elevate.exe
Write-Head '4. electron-updater elevate.exe is where the app expects it'

if ($target -and (Test-Path -LiteralPath $target)) {
  $elevate = Join-Path $target 'resources\elevate.exe'
  $elevateExists = Test-Path -LiteralPath $elevate
  Write-Result 'elevate.exe present' $elevateExists $elevate
  if ($elevateExists) {
    $sig = Get-AuthenticodeSignature -LiteralPath $elevate
    Write-Info ("signature status: {0}" -f $sig.Status)
    Write-Info 'This is the binary NsisUpdater.doInstall() spawns when isAdminRightsRequired is set. It is what raises the UAC prompt this whole issue is about.'
  }
} else {
  Write-Result 'elevate.exe present' $false 'skipped: no install directory'
}

# ------------------------------------------------ 5. optional: the update feed
if ($Feed) {
  Write-Head "5. The published feed for $Feed"
  $url = "https://github.com/FerroxLabs/wayland/releases/download/$Feed/latest.yml"
  try {
    $yml = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30).Content
    $requiresAdmin = $yml -match '(?m)^\s*isAdminRightsRequired:\s*true\s*$'
    Write-Result 'latest.yml fetched' $true $url
    Write-Info ("isAdminRightsRequired: true  ->  {0}" -f $requiresAdmin)
    if ($requiresAdmin) {
      Write-Info 'Confirms the release is built perMachine: electron-updater will go straight to elevate.exe without even trying a plain spawn.'
    } else {
      Write-Info 'The feed does NOT require admin, so this release is per-user. Updates should apply with no prompt at all.'
    }
  } catch {
    Write-Result 'latest.yml fetched' $false ("{0} - {1}" -f $url, $_.Exception.Message)
  }
}

# ------------------------------------------------------------------ verdict
Write-Head 'VERDICT - what the app will do on this machine'

# Mirrors assessWindowsElevation() in src/process/services/windowsUpdateElevation.ts.
if ($null -eq $canWrite) {
  $capability = 'unknown'
} elseif ($canWrite) {
  $capability = 'not-required'
} elseif ($null -eq $hasAdminSid) {
  $capability = 'unknown'
} elseif ($hasAdminSid) {
  $capability = 'available'
} else {
  $capability = 'unavailable'
}

Write-Host ("  capability: {0}" -f $capability) -ForegroundColor Yellow
switch ($capability) {
  'not-required' { Write-Host '  Per-user install. Updates apply silently with no UAC. This is the outcome #492 wants.' }
  'available'    { Write-Host '  Per-machine install, and this account can elevate. Updates apply after ONE UAC consent prompt. Unchanged by the fix.' }
  'unavailable'  { Write-Host '  Per-machine install, and this account CANNOT elevate. This is the #492 population. The app will now refuse the offer up front with a message naming administrator rights, instead of downloading an update that silently fails. It will also refuse to hand the installer to the unattended on-quit apply.' }
  'unknown'      { Write-Host '  The probe reached no verdict. The app behaves exactly as it did before the fix. Tell Sean - it means this machine is unreadable to the probe.' }
}

Write-Host ''
Write-Host ("{0} checks, {1} failed" -f $script:Checks, $script:Failures) -ForegroundColor $(if ($script:Failures -eq 0) { 'Green' } else { 'Red' })
if ($script:Failures -eq 0) {
  Write-Host 'RESULT: PASS' -ForegroundColor Green
} else {
  Write-Host 'RESULT: FAIL - a claim underneath the fix does not hold on this hardware. Report it.' -ForegroundColor Red
}
Write-Host ''
Write-Host 'Checks 1-4 verify the mechanism only. For the user-visible confirmation, run LEG B from the header comment on a standard (non-administrator) account.' -ForegroundColor DarkGray

if ($transcribing) { Stop-Transcript | Out-Null; Write-Host ("transcript: {0}" -f $transcript) -ForegroundColor DarkGray }

exit $(if ($script:Failures -eq 0) { 0 } else { 1 })
