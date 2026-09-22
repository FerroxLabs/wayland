'use strict';

// Authenticode signing for the Windows binaries we stage into the packaged app.
//
// Smart App Control evaluates EVERY executable module a process loads, not just
// the installer that delivered it, and an unsigned file can never inherit the
// reputation of the certificate that signed its installer - it has to earn its
// own, from scratch, on every release. Our installer and Wayland.exe are signed;
// the third-party runtimes we spawn out of resources/ were deliberately left
// unsigned, so SAC blocks them (#914).
//
// The signing happens at STAGE time, before each binary's digest is recorded,
// exactly as signDarwinStagedBinary does, and for the same reason: the staged
// manifest and the packaged gate then record and compare the SAME post-signature
// bytes, so byte identity is preserved end to end instead of being downgraded to
// "signed by someone we trust". `win.signExts` then stops electron-builder
// signing these paths a second time during packaging, so the bytes cannot change
// after they were pinned.
//
// The upstream-provenance guarantee is unaffected: the download and checksum
// checks run against the upstream bytes BEFORE this signature is applied.
//
// bundled-bun is NOT signed here. Bun's published Windows binaries already carry
// a DigiCert-issued Authenticode signature (Codeblog CORP), so they are the one
// bundled executable SAC already accepts, and re-signing would replace the
// publisher's own attestation with ours while breaking the byte pin for nothing.

const { execFileSync } = require('child_process');

// Must match `win.azureSignOptions` in electron-builder.yml - the same Trusted
// Signing account signs the app and these staged binaries, so a drift between
// the two would ship an app whose nested binaries carry a different publisher.
// tests/unit/signWindowsStagedBinary.test.ts asserts the two agree.
const WINDOWS_PUBLISHER_NAME = 'Ferrox Labs, LLC';
const AZURE_TRUSTED_SIGNING = {
  endpoint: 'https://eus.codesigning.azure.net/',
  codeSigningAccountName: 'ferrox-labs-signing',
  certificateProfileName: 'ferroxlabs',
};

// Azure Trusted Signing leaf certificates are valid for ~3 days, so an RFC 3161
// timestamp is not optional: without it every signature we ship stops verifying
// within the week. These are electron-builder's own defaults for the same
// service (app-builder-lib windowsSignAzureManager.signFile).
const TIMESTAMP_RFC3161 = 'http://timestamp.acs.microsoft.com';
const TIMESTAMP_DIGEST = 'SHA256';
const FILE_DIGEST = 'SHA256';

/**
 * The Azure EnvironmentCredential the TrustedSigning module authenticates with,
 * or null when this build has none (local development, forks, PR builds without
 * secrets). All three variables are required: Azure.Identity's
 * EnvironmentCredential only activates when the full service-principal triple is
 * present, so a partial set would fail deep inside PowerShell instead of here.
 */
function resolveWindowsSigningCredentials(env = process.env) {
  const tenantId = String(env.AZURE_TENANT_ID || '').trim();
  const clientId = String(env.AZURE_CLIENT_ID || '').trim();
  const clientSecret = String(env.AZURE_CLIENT_SECRET || '').trim();
  if (!tenantId || !clientId || !clientSecret) return null;
  return { tenantId, clientId };
}

/** True when this build must not fall back to staging an unsigned binary. */
function windowsSignatureRequired(env = process.env) {
  return String(env.WAYLAND_REQUIRE_WINDOWS_SIGNATURE || '') === '1';
}

function powershellCommand(env = process.env) {
  return env.WAYLAND_POWERSHELL || 'pwsh';
}

/**
 * Sign one staged binary with Azure Trusted Signing and a secure timestamp, then
 * prove the result verifies as ours before any digest is taken.
 *
 * Returns true when the binary was signed, false when this build has no
 * credentials. Throws when signing was required and unavailable, or when signing
 * ran and did not produce a valid Ferrox Labs signature: a silently unsigned
 * binary is the whole bug this closes, and it would only resurface on a user's
 * machine as a Smart App Control block.
 */
function signWindowsStagedBinary(binaryPath, options = {}) {
  const execute = options.execFileSync || execFileSync;
  const env = options.env || process.env;
  const label = options.label || binaryPath;
  const required = options.required === undefined ? windowsSignatureRequired(env) : options.required;
  const credentials = options.credentials === undefined ? resolveWindowsSigningCredentials(env) : options.credentials;
  if (!credentials) {
    if (required) {
      throw new Error(
        `[sign-windows] refusing to stage ${label} unsigned: this build requires an Azure Trusted Signing ` +
          'credential (AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET) and has none'
      );
    }
    console.log(`[sign-windows] no Azure Trusted Signing credential for this build; leaving ${label} unsigned`);
    return false;
  }
  // Verbatim the parameter set electron-builder passes for `azureSignOptions`,
  // so a staged binary and the app executable are signed by the same call shape.
  const params = {
    Endpoint: AZURE_TRUSTED_SIGNING.endpoint,
    CertificateProfileName: AZURE_TRUSTED_SIGNING.certificateProfileName,
    CodeSigningAccountName: AZURE_TRUSTED_SIGNING.codeSigningAccountName,
    TimestampRfc3161: TIMESTAMP_RFC3161,
    TimestampDigest: TIMESTAMP_DIGEST,
    FileDigest: FILE_DIGEST,
    Files: binaryPath,
  };
  const paramsString = Object.entries(params)
    .map(([field, value]) => `-${field} '${String(value).replace(/'/g, "''")}'`)
    .join(' ');
  execute(
    powershellCommand(env),
    ['-NoProfile', '-NonInteractive', '-Command', `Invoke-TrustedSigning ${paramsString}`],
    { stdio: 'inherit' }
  );
  assertWindowsAuthenticodeSigned(binaryPath, { execFileSync: execute, env });
  console.log(`[sign-windows] signed ${label}`);
  return true;
}

/**
 * Throws unless the binary carries a valid Ferrox Labs Authenticode signature.
 *
 * The whole decision is made inside PowerShell and reported through the exit
 * code, the way assertDarwinDeveloperIdSigned leans on codesign's: a JS-side
 * parse of the printed status is one more place for a check to silently pass.
 * SimpleName is the certificate's CN, so this pins the publisher rather than
 * accepting any signature that happens to chain to a trusted root.
 */
function assertWindowsAuthenticodeSigned(binaryPath, options = {}) {
  const execute = options.execFileSync || execFileSync;
  const env = options.env || process.env;
  const publisher = options.publisherName || WINDOWS_PUBLISHER_NAME;
  const script = [
    "$ErrorActionPreference = 'Stop'",
    `$sig = Get-AuthenticodeSignature -LiteralPath '${binaryPath.replace(/'/g, "''")}'`,
    'if ($sig.Status -ne \'Valid\') { throw "Authenticode status $($sig.Status)" }',
    "if ($null -eq $sig.SignerCertificate) { throw 'no signer certificate' }",
    '$cn = $sig.SignerCertificate.GetNameInfo([System.Security.Cryptography.X509Certificates.X509NameType]::SimpleName, $false)',
    `if ($cn -ne '${publisher.replace(/'/g, "''")}') { throw "signed by $cn, expected ${publisher}" }`,
  ].join('; ');
  execute(powershellCommand(env), ['-NoProfile', '-NonInteractive', '-Command', script], { stdio: 'pipe' });
}

function isWindowsAuthenticodeSigned(binaryPath, options = {}) {
  try {
    assertWindowsAuthenticodeSigned(binaryPath, options);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  WINDOWS_PUBLISHER_NAME,
  AZURE_TRUSTED_SIGNING,
  resolveWindowsSigningCredentials,
  windowsSignatureRequired,
  signWindowsStagedBinary,
  assertWindowsAuthenticodeSigned,
  isWindowsAuthenticodeSigned,
};
