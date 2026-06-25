<#
.SYNOPSIS
  release-smoke-windows.ps1 - the Windows install gate.

.DESCRIPTION
  Verifies a *published* (or local) .exe the way a real Windows user's machine
  does: it runs Get-AuthenticodeSignature and fails unless the signature Status
  is Valid AND the signer certificate Subject identifies Ferrox Labs. A green run
  means SmartScreen / the OS sees a properly Authenticode-signed installer from
  the expected publisher, not an unsigned binary.

  This is the Windows mirror of scripts/release-smoke-macos.sh. It exists so an
  unsigned (or wrong-publisher) Windows installer becomes a hard release failure
  instead of a user discovery.

.PARAMETER Tag
  Download every .exe from the draft/published GitHub release for this tag
  (gh release download "<tag>" --pattern '*.exe') and check each one.

.PARAMETER Exe
  One or more local .exe paths to check instead of (or in addition to) a tag.

.EXAMPLE
  pwsh scripts/release-smoke-windows.ps1 -Tag v0.9.6-rc.2.1
  pwsh scripts/release-smoke-windows.ps1 -Exe .\out\Wayland-x.y.z-win-x64.exe

.NOTES
  Exit code: 0 = all exes pass, 1 = any check failed (do NOT publish/announce).
#>
[CmdletBinding()]
param(
  [string]$Tag = "",
  [string[]]$Exe = @()
)

$ErrorActionPreference = 'Stop'

# Subject substring the signer cert must contain to be accepted.
$ExpectedSubject = 'Ferrox Labs'

$exes = New-Object System.Collections.Generic.List[string]
foreach ($e in $Exe) { if ($e) { $exes.Add($e) } }

$workdir = $null
if ($Tag) {
  $workdir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString())
  New-Item -ItemType Directory -Path $workdir -Force | Out-Null
  Write-Host "==> Downloading exes for $Tag from the release (gh release download)..."
  gh release download "$Tag" --pattern '*.exe' --dir "$workdir" --clobber
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL: could not download exes for $Tag (is the release/draft present and gh authed?)." -ForegroundColor Red
    exit 1
  }
  Get-ChildItem -Path $workdir -Filter '*.exe' -File | ForEach-Object { $exes.Add($_.FullName) }
}

if ($exes.Count -eq 0) {
  Write-Host "FAIL: no exes to check. Pass -Tag <tag> or -Exe <path>." -ForegroundColor Red
  exit 1
}

$overallFail = 0

foreach ($path in $exes) {
  Write-Host ""
  Write-Host "================================================================"
  Write-Host "EXE: $path"
  Write-Host "================================================================"
  $exeFail = 0

  if (-not (Test-Path -LiteralPath $path)) {
    Write-Host "    FAIL  file not found" -ForegroundColor Red
    $overallFail = 1
    continue
  }

  $sig = Get-AuthenticodeSignature -LiteralPath $path

  # Status must be Valid.
  if ($sig.Status -eq 'Valid') {
    Write-Host "    PASS  Authenticode signature is Valid"
  } else {
    Write-Host "    FAIL  Authenticode signature status is '$($sig.Status)' (expected 'Valid')" -ForegroundColor Red
    if ($sig.StatusMessage) { Write-Host "          $($sig.StatusMessage)" }
    $exeFail = 1
  }

  # Signer cert Subject must identify Ferrox Labs.
  $subject = if ($sig.SignerCertificate) { $sig.SignerCertificate.Subject } else { '' }
  Write-Host "    Signer subject: $subject"
  if ($subject -and ($subject -like "*$ExpectedSubject*")) {
    Write-Host "    PASS  signer subject matches '$ExpectedSubject'"
  } else {
    Write-Host "    FAIL  signer subject does not match '$ExpectedSubject'" -ForegroundColor Red
    $exeFail = 1
  }

  if ($exeFail -ne 0) {
    Write-Host "  RESULT: FAIL - this exe is unsigned or signed by the wrong publisher." -ForegroundColor Red
    $overallFail = 1
  } else {
    Write-Host "  RESULT: PASS - validly signed by Ferrox Labs." -ForegroundColor Green
  }
}

if ($workdir -and (Test-Path -LiteralPath $workdir)) {
  Remove-Item -LiteralPath $workdir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
if ($overallFail -ne 0) {
  Write-Host "########################################################"
  Write-Host "# RELEASE SMOKE (Windows): FAIL - DO NOT PUBLISH/ANNOUNCE #"
  Write-Host "########################################################"
  exit 1
}
Write-Host "########################################################"
Write-Host "# RELEASE SMOKE (Windows): PASS - safe to publish      #"
Write-Host "########################################################"
exit 0
