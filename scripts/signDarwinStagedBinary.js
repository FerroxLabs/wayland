'use strict';

// Developer ID signing for binaries we stage into the packaged app.
//
// Apple refuses to notarize an app that contains an unsigned or merely ad-hoc /
// linker-signed Mach-O. Several binaries we bundle are exactly that: our own
// wayland-core, wayland-nano and wayland-constitution-fs ship linker-signed
// from their own release pipelines, and the whatsapp-bridge sharp and bare-*
// natives are unsigned npm artifacts. bundled-bun and bundled-officecli are the
// exceptions - their publishers sign them properly, so they are left untouched.
//
// The signing happens at STAGE time, before each binary's digest is recorded,
// rather than during packaging. That ordering is what keeps every existing
// integrity check exact:
//
//   * the staged manifest, the embedded authority and the packaged gate all
//     record and compare the SAME post-signature bytes, so byte identity is
//     preserved end to end rather than downgraded to "signed by someone we
//     trust";
//   * `mac.signIgnore` then stops electron-builder re-signing these paths
//     during packaging, so the bytes cannot change after they were pinned;
//   * `wayland-constitution-fs` in particular is re-hashed at RUNTIME against a
//     digest embedded in app.asar, so a binary signed after that digest was
//     recorded would fail every launch with CONSTITUTION_FS_BINARY_UNVERIFIED.
//
// The upstream-provenance guarantee is unaffected: the download, checksum and
// attestation checks all run against the upstream bytes BEFORE this signature is
// applied.

const { execFileSync } = require('child_process');

// Apple's canonical Developer ID Application requirement. Checking only
// `subject.OU` would also accept an Apple Development or Mac Distribution
// certificate from the same team, neither of which notarizes; the two marker
// OIDs below are what actually pin it to a Developer ID Application leaf issued
// under the Developer ID CA.
//
// The leading '=' is REQUIRED: `codesign -R` reads a bare argument as a path to
// a requirement FILE and only parses inline requirement text when it starts with
// '='. Without it codesign exits 1 with "invalid requirement specification",
// which fails closed on correctly signed binaries too.
const DARWIN_TEAM_ID = 'PX6SP9GPWJ';
const DARWIN_DEVELOPER_ID_REQUIREMENT =
  '=anchor apple generic and ' +
  'certificate 1[field.1.2.840.113635.100.6.2.6] exists and ' +
  'certificate leaf[field.1.2.840.113635.100.6.1.13] exists and ' +
  `certificate leaf[subject.OU] = "${DARWIN_TEAM_ID}"`;

/**
 * Bind a signature to the exact upstream bytes it was produced from.
 *
 * Signing necessarily changes the binary, so the shipped bytes can no longer be
 * compared to the pinned upstream digest directly. Recording the post-signature
 * digest in the bundle manifest is not sufficient on its own: the manifest ships
 * inside the app and is not independently authenticated, so anything able to
 * rewrite the binary can rewrite the digest beside it and swap in a different -
 * or older, vulnerable - binary that we also legitimately signed.
 *
 * Putting the upstream digest in the code-signing IDENTIFIER closes that. The
 * identifier lives inside the signature, so it cannot be altered without the
 * signing key, and the requirement below checks it. A substituted binary either
 * carries a different identifier or no valid Ferrox Labs signature at all.
 */
function darwinSigningIdentifier(binaryName, upstreamSha256) {
  const digest = String(upstreamSha256 || '')
    .replace(/^sha256:/i, '')
    .toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(digest)) {
    throw new Error(`[sign-darwin] refusing to sign ${binaryName} without a pinned upstream sha256`);
  }
  return `${binaryName}.${digest}`;
}

function darwinDeveloperIdRequirementFor(identifier) {
  if (!identifier) return DARWIN_DEVELOPER_ID_REQUIREMENT;
  return `=identifier "${identifier}" and ${DARWIN_DEVELOPER_ID_REQUIREMENT.slice(1)}`;
}

/**
 * The Developer ID identity to sign staged binaries with, or null when this
 * build has none (local development, forks, PR builds without secrets).
 */
function resolveDarwinSigningIdentity(env = process.env) {
  const identity = env.WAYLAND_DARWIN_SIGN_IDENTITY || env.CSC_NAME || env.identity;
  const trimmed = typeof identity === 'string' ? identity.trim() : '';
  // '-' is codesign's ad-hoc identity. Ad-hoc is precisely the state Apple
  // rejects, so treat it as "no identity" rather than signing uselessly.
  return trimmed && trimmed !== '-' ? trimmed : null;
}

/**
 * Sign one staged binary with Developer ID, the hardened runtime and a secure
 * timestamp - the three things Apple's notary service checks - then prove the
 * result satisfies the Developer ID requirement before any digest is taken.
 *
 * Returns true when the binary was signed, false when this build has no
 * identity. Throws if signing was attempted and did not produce a valid
 * Developer ID signature: a silently unsigned binary would fail notarization
 * much later, with a far less obvious error.
 */
function signDarwinStagedBinary(binaryPath, options = {}) {
  const execute = options.execFileSync || execFileSync;
  const identity = options.identity === undefined ? resolveDarwinSigningIdentity(options.env) : options.identity;
  const label = options.label || binaryPath;
  if (!identity) {
    console.log(`[sign-darwin] no Developer ID identity for this build; leaving ${label} unsigned`);
    return false;
  }
  const identifier = options.identifier;
  execute(
    '/usr/bin/codesign',
    [
      '--force',
      '--options',
      'runtime',
      '--timestamp',
      ...(identifier ? ['--identifier', identifier] : []),
      '--sign',
      identity,
      binaryPath,
    ],
    { stdio: 'inherit' }
  );
  assertDarwinDeveloperIdSigned(binaryPath, { execFileSync: execute, identifier });
  console.log(`[sign-darwin] signed ${label}`);
  return true;
}

/** Throws unless the binary carries a valid Ferrox Labs Developer ID signature. */
function assertDarwinDeveloperIdSigned(binaryPath, options = {}) {
  const execute = options.execFileSync || execFileSync;
  const requirement = darwinDeveloperIdRequirementFor(options.identifier);
  execute('/usr/bin/codesign', ['--verify', '--strict', '-R', requirement, binaryPath], { stdio: 'pipe' });
}

// `identifier` may be passed positionally so call sites in the packaged gate
// stay readable; an options object is still accepted.
function isDarwinDeveloperIdSigned(binaryPath, options = {}) {
  const resolved = typeof options === 'string' ? { identifier: options } : options;
  try {
    assertDarwinDeveloperIdSigned(binaryPath, resolved);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  DARWIN_TEAM_ID,
  DARWIN_DEVELOPER_ID_REQUIREMENT,
  darwinSigningIdentifier,
  darwinDeveloperIdRequirementFor,
  resolveDarwinSigningIdentity,
  signDarwinStagedBinary,
  assertDarwinDeveloperIdSigned,
  isDarwinDeveloperIdSigned,
};
