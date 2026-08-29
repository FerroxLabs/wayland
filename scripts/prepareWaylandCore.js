/**
 * Prepare wayland-core binary for Electron packaging.
 *
 * Resolution order:
 *  0. Dev-only calls may use a pre-placed unverified local binary. Strict
 *     package builds never treat extracted cache bytes as publisher authority;
 *     they authenticate the exact release archive before publishing.
 *  1. GitHub release download (requires WCORE_VERSION or defaults to "latest"),
 *     SHA-256 verified before extract/copy/execute.
 *
 * Output: resources/bundled-wayland-core/{platform}-{arch}/wayland-core[.exe]
 *
 * Env (DEV ONLY - IGNORED for skipping verification on release/CI builds):
 *      WCORE_USE_LOCAL=1      trust a pre-placed binary on a dev build;
 *      WCORE_FORCE_DOWNLOAD=1 always re-download (ignore a pre-placed binary);
 *      WCORE_ALLOW_UNVERIFIED=1 (historical) does NOT downgrade a release build.
 *   On a release/CI build these never bypass SHA-256 verification - the build
 *   either verifies a present local binary or downloads-and-verifies, else fails
 *   closed.
 *
 * Pattern follows prepareBundledBun.js.
 */

const { execSync, execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const {
  signDarwinStagedBinary,
  resolveDarwinSigningIdentity,
  darwinSigningIdentifier,
} = require('./signDarwinStagedBinary');
const path = require('path');
const { verifyPublisherAttestation } = require('./supply-chain/verifyPublisherAttestation');

const GITHUB_OWNER = 'FerroxLabs';
const GITHUB_REPO = 'wayland-core';
const BUNDLE_CONTRACT = 'wayland-core-bundle/1.0';
const BUNDLE_GENERATOR = 'prepareWaylandCore/3';

// Authoritative per-platform SHA-256 manifest for the downloaded release
// archives. Supply-chain guard (UPD-03): every release build must fetch the
// pinned tag's asset and verify its SHA-256 against this file before the
// archive is extracted, copied, or - critically - executed (`--version`).
// Mirrors scripts/bundled-bun-shasums.json. Bump in lockstep with the tag.
const SHASUMS_FILE = path.resolve(__dirname, 'bundled-wcore-shasums.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function removeDirectorySafe(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function pruneRuntimeDirectory(dirPath, allowedNames) {
  const allowed = new Set(allowedNames);
  if (!fs.existsSync(dirPath)) return;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (allowed.has(entry.name)) continue;
    fs.rmSync(path.join(dirPath, entry.name), { recursive: true, force: true });
  }
}

function copyFileSafe(sourcePath, targetPath) {
  ensureDirectory(path.dirname(targetPath));
  // Unlink first so the copy lands on a fresh inode, which is the standard safe
  // way to replace an executable.
  //
  // Prompted by an OBSERVED failure while staging the C-1..C-5 engine: copying
  // the new binary over the existing one here produced a binary that was
  // SIGKILLed on exec (rc=137, no output) despite a matching sha256, identical
  // `codesign` output and identical xattrs; `rm` then `cp` at the same path ran
  // clean. Both results were reproducible at the time.
  //
  // The mechanism is NOT established - a later attempt to reproduce it in a
  // scratch directory, with and without a resident process holding the old
  // binary, did not fail. So this is a cheap guard against a real observation,
  // not a fix for a diagnosed cause. Do not repeat any mechanism story for it.
  fs.rmSync(targetPath, { force: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function ensureExecutableMode(filePath) {
  if (process.platform === 'win32') return;
  try {
    fs.chmodSync(filePath, 0o755);
  } catch {}
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
}

function getBinaryName(platform) {
  return platform === 'win32' ? 'wayland-core.exe' : 'wayland-core';
}

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Detect a release/CI build. When true the supply-chain guard is mandatory:
 * every bundled engine binary MUST have a verified SHA-256, and the WCORE_*
 * trust/bypass env vars are IGNORED for the purpose of skipping verification.
 *
 * Signals (any one is sufficient):
 *  - process.env.CI                  - standard CI marker (GitHub Actions etc.)
 *  - process.env.npm_config_production / NODE_ENV=production - prod install/build
 *  - electron-builder release context - set by electron-builder during a build
 *    (npm_lifecycle_event starts with dist/build/make/package, or a publish run).
 *  - WCORE_REQUIRE_VERIFIED=1         - explicit opt-in to the strict path.
 *
 * IMPORTANT (RT-B6-06): WCORE_ALLOW_UNVERIFIED must NOT be able to flip this to
 * false. A genuine release/CI build stays a release build regardless of that
 * env var, so it can never downgrade itself into trusting an unverified binary.
 */
function isReleaseBuild() {
  const lifecycle = (process.env.npm_lifecycle_event || '').toLowerCase();
  const builderRelease =
    /^(dist|build|make|package)/.test(lifecycle) ||
    process.env.EP_PRE_RELEASE === 'true' ||
    process.env.PUBLISH_FOR_PULL_REQUEST === 'true';
  return (
    process.env.CI === '1' ||
    process.env.CI === 'true' ||
    process.env.WCORE_REQUIRE_VERIFIED === '1' ||
    process.env.NODE_ENV === 'production' ||
    process.env.npm_config_production === 'true' ||
    builderRelease
  );
}

/**
 * Resolve the expected SHA-256 (lowercase hex, no prefix) for a given release
 * tag + asset from bundled-wcore-shasums.json. Throws when the manifest is
 * missing, the tag/asset entry is absent, or the value is malformed - callers
 * decide whether that aborts (release) or downgrades to skip (dev).
 */
function normalizeSha256(raw, label) {
  const hex = String(raw || '')
    .replace(/^sha256:/i, '')
    .trim()
    .toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    throw new Error(`Malformed or placeholder SHA-256 for ${label}: ${raw || '<missing>'}.`);
  }
  return hex;
}

function loadExpectedProvenance(tag, assetName, { requireBinary = false } = {}) {
  const manifest = readJsonSafe(SHASUMS_FILE);
  if (!manifest) {
    throw new Error(
      `Missing SHA-256 manifest at ${SHASUMS_FILE}. ` +
        `Cannot verify bundled wayland-core integrity (supply-chain guard).`
    );
  }

  const tagEntry = manifest[tag];
  if (!tagEntry || typeof tagEntry !== 'object') {
    throw new Error(
      `No SHA-256 entries for wayland-core tag "${tag}" in ${SHASUMS_FILE}. ` +
        `Add the per-platform archive checksums from the signed release before building.`
    );
  }

  const raw = tagEntry[assetName];
  if (!raw || (typeof raw !== 'string' && typeof raw !== 'object')) {
    throw new Error(`No SHA-256 entry for asset "${assetName}" under tag "${tag}" in ${SHASUMS_FILE}.`);
  }

  const archiveSha256 = normalizeSha256(
    typeof raw === 'string' ? raw : raw.archiveSha256,
    `archive "${assetName}" (tag "${tag}") in ${SHASUMS_FILE}`
  );
  const binarySha256 =
    typeof raw === 'object' && raw.binarySha256
      ? normalizeSha256(raw.binarySha256, `binary from "${assetName}" (tag "${tag}") in ${SHASUMS_FILE}`)
      : null;
  if (requireBinary && !binarySha256) {
    throw new Error(
      `No independently pinned extracted-binary SHA-256 for "${assetName}" (tag "${tag}") in ${SHASUMS_FILE}. ` +
        `A strict package cannot trust a manifest that asserts its own binary digest.`
    );
  }
  return { archiveSha256, binarySha256 };
}

function loadExpectedShaForAsset(tag, assetName) {
  return loadExpectedProvenance(tag, assetName).archiveSha256;
}

function computeFileSha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

/**
 * Verify the downloaded archive against its pinned SHA-256 BEFORE it is
 * extracted, copied, or executed. Aborts on mismatch - never ships or runs an
 * unverified engine binary.
 */
function verifyArchiveChecksum(archivePath, expectedHex, assetName, tag) {
  const actualHex = computeFileSha256(archivePath);
  if (actualHex !== expectedHex) {
    throw new Error(
      `wayland-core archive checksum mismatch for ${assetName} (tag ${tag}). ` +
        `Expected sha256=${expectedHex}, got sha256=${actualHex}. ` +
        `Refusing to extract or execute this binary; aborting bundled wayland-core preparation.`
    );
  }
}

// Pinned default tag. The engine release stream lives at
// FerroxLabs/wayland-core; Desktop integrates against a specific tag rather
// than tracking `latest` so version drift can't sneak in via a release made
// while a CI build is mid-flight. Override with WCORE_VERSION=... when bumping.
//
// ⚠️ This tag and `DESKTOP_CORE_V1_PIN` are ONE decision. The host compares the
// contract descriptor for equality, so an engine that does not match the pin
// kills every session on frame 1.
//
// 🔴 They do NOT agree on this branch, deliberately: the pin demands minor 14
// (Core 0.13.0) and v0.12.26 advertises minor 12. 0.13.0 is not tagged - it
// exists only as a local build we are verifying against through the override
// directory, and it gets tagged only once that verification passes. So this
// branch is NOT shippable, the tag below stays where it is until then, and
// `desktopContractV1.test.ts` holds the tripwire that says so.
const DEFAULT_WCORE_VERSION = 'v0.13.10';

function getVersion() {
  return (process.env.WCORE_VERSION || DEFAULT_WCORE_VERSION).trim();
}

// A pre-release engine is for INTEGRATION ONLY. The opt-in is an explicit env
// var that defaults off, so an ordinary `bun run package` can never bundle an RC
// into a shipped build - it fails closed on the tag shape exactly as before.
// Mirrors the --allow-prerelease flag in scripts/stage-wcore-bump.mjs; the two
// validators must stay in step or staging succeeds and packaging then refuses.
function normalizeExactReleaseTag(version) {
  const tag = version.startsWith('v') ? version : `v${version}`;
  if (/^v\d+\.\d+\.\d+$/.test(tag)) return tag;

  const isPrerelease = /^v\d+\.\d+\.\d+-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*$/.test(tag);
  if (isPrerelease && process.env.WCORE_ALLOW_PRERELEASE === '1') {
    console.warn(
      `WARNING: bundling PRE-RELEASE wayland-core ${tag} (WCORE_ALLOW_PRERELEASE=1). ` +
        'Integration testing only - do not ship this build.'
    );
    return tag;
  }
  throw new Error(
    isPrerelease
      ? `wayland-core tag "${version}" is a pre-release; set WCORE_ALLOW_PRERELEASE=1 to bundle it for INTEGRATION ONLY (never ship it).`
      : `Invalid wayland-core release tag "${version}"; expected an exact vMAJOR.MINOR.PATCH tag.`
  );
}

// ---------------------------------------------------------------------------
// Source resolvers
// ---------------------------------------------------------------------------

/**
 * Resolve the actual version tag when "latest" is requested.
 * Uses GitHub API via `gh` CLI (needs GH_TOKEN in CI) or falls back to
 * `curl` with an optional Authorization header (GITHUB_TOKEN / GH_TOKEN).
 */
function resolveLatestTag() {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';

  // 1. Try gh CLI (honours GH_TOKEN automatically)
  try {
    const out = execSync(`gh api repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest --jq .tag_name`, {
      encoding: 'utf-8',
      timeout: 15000,
    }).trim();
    if (out) return out;
  } catch {
    // gh CLI not available or no token - fall back to curl
  }

  // 2. Curl with optional token to avoid rate-limit 403
  try {
    const authArgs = token ? ['-H', `Authorization: token ${token}`] : [];
    const args = ['-fsSL', ...authArgs, `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`];
    const out = execFileSync('curl', args, { encoding: 'utf-8', timeout: 15000 });
    const tag = JSON.parse(out).tag_name;
    if (tag) return tag;
  } catch {
    // network issue or rate-limited
  }

  return null;
}

/**
 * 1. Download from GitHub releases
 *
 * wayland-core release assets include the version tag in the filename:
 *   wayland-core-v0.1.9-aarch64-apple-darwin.tar.gz
 */
function getAssetName(platform, arch, tag) {
  const archMap = { x64: 'x86_64', arm64: 'aarch64' };
  const platformMap = { darwin: 'apple-darwin', linux: 'unknown-linux-gnu', win32: 'pc-windows-msvc' };
  const normalizedArch = archMap[arch];
  const normalizedPlatform = platformMap[platform];
  if (!normalizedArch || !normalizedPlatform) return null;
  const ext = platform === 'win32' ? '.zip' : '.tar.gz';
  return `wayland-core-${tag}-${normalizedArch}-${normalizedPlatform}${ext}`;
}

function getDownloadUrl(assetName, tag) {
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${tag}/${assetName}`;
}

/**
 * Try downloading via authed `gh release download` first when the URL looks
 * like a GitHub release asset. This handles private repos (where anonymous
 * curl gets a 404) without requiring users to plumb GITHUB_TOKEN manually.
 * Returns true on success; false to signal the caller should fall through.
 */
function tryGhRelease(url, outputPath) {
  const ghMatch = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/([^/]+)$/.exec(url);
  if (!ghMatch) return false;
  const [, owner, repo, tag, asset] = ghMatch;
  try {
    execFileSync('gh', ['--version'], { stdio: 'ignore', timeout: 5000 });
  } catch {
    return false;
  }
  try {
    const tmpDir = path.dirname(outputPath);
    execFileSync(
      'gh',
      ['release', 'download', tag, '--repo', `${owner}/${repo}`, '--pattern', asset, '--dir', tmpDir, '--clobber'],
      { timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] }
    );
    const ghOut = path.join(tmpDir, asset);
    if (ghOut !== outputPath && fs.existsSync(ghOut)) {
      fs.renameSync(ghOut, outputPath);
    }
    return true;
  } catch {
    return false;
  }
}

function downloadFile(url, outputPath) {
  console.log(`  Downloading wayland-core from ${url}`);
  if (tryGhRelease(url, outputPath)) return;
  if (process.platform === 'win32') {
    const ps = `$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '${url.replace(/'/g, "''")}' -OutFile '${outputPath.replace(/'/g, "''")}'`;
    execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps], { timeout: 120000 });
    return;
  }
  try {
    execFileSync('curl', ['-L', '--fail', '--silent', '--show-error', '-o', outputPath, url], { timeout: 120000 });
  } catch {
    execFileSync('wget', ['-q', '-O', outputPath, url], { timeout: 120000 });
  }
}

/**
 * Which extractor to run. The TARGET platform decides only whether the archive is
 * a zip (win32 releases ship .zip, the rest .tar.gz); the HOST decides what tool
 * can actually open it (#1058).
 *
 * Keying the tool off the target made a win32 target select PowerShell's
 * Expand-Archive on a macOS or Linux build host, where powershell does not exist:
 *
 *   Release build cannot prepare a verified wayland-core for win32-arm64
 *   (tag v0.13.0): spawnSync powershell ENOENT
 *
 * `downloadFile` above already keys on `process.platform` for exactly this reason.
 * In CI this is a no-op, because Windows builds run on Windows runners.
 */
function __extractorFor(targetPlatform, hostPlatform, archivePath) {
  const isZip = targetPlatform === 'win32' || archivePath.endsWith('.zip');
  if (!isZip) return 'tar';
  return hostPlatform === 'win32' ? 'powershell' : 'unzip';
}

function extractArchive(archivePath, outputDir, targetPlatform, hostPlatform = process.platform) {
  ensureDirectory(outputDir);
  switch (__extractorFor(targetPlatform, hostPlatform, archivePath)) {
    case 'powershell': {
      const ps = `Expand-Archive -LiteralPath '${archivePath.replace(/'/g, "''")}' -DestinationPath '${outputDir.replace(/'/g, "''")}' -Force`;
      execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps]);
      return;
    }
    case 'unzip':
      execFileSync('unzip', ['-o', archivePath, '-d', outputDir]);
      return;
    default:
      execFileSync('tar', ['-xzf', archivePath, '-C', outputDir]);
  }
}

function findBinaryInDir(dir, binaryName) {
  // Search recursively for the binary
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === binaryName) return fullPath;
    if (entry.isDirectory()) {
      const found = findBinaryInDir(fullPath, binaryName);
      if (found) return found;
    }
  }
  return null;
}

function downloadAndExtract(platform, arch, tag, { requireBinaryPin = false } = {}) {
  const assetName = getAssetName(platform, arch, tag);
  if (!assetName) {
    throw new Error(`Unsupported wayland-core target: ${platform}-${arch}`);
  }

  const url = getDownloadUrl(assetName, tag);
  const tempDir = path.join(os.tmpdir(), 'aionui-wayland-core', tag, `${platform}-${arch}`);
  const archivePath = path.join(tempDir, assetName);
  const extractDir = path.join(tempDir, 'extracted');

  // Resolve the expected hash BEFORE downloading so a missing/placeholder
  // entry aborts without ever touching the network result.
  const expected = loadExpectedProvenance(tag, assetName, { requireBinary: requireBinaryPin });

  removeDirectorySafe(tempDir);
  ensureDirectory(tempDir);

  downloadFile(url, archivePath);
  // Supply-chain gate: verify the downloaded archive before extract/copy/exec.
  verifyArchiveChecksum(archivePath, expected.archiveSha256, assetName, tag);
  const publisherAttestation = requireBinaryPin
    ? verifyPublisherAttestation({
        artifactPath: archivePath,
        assetName,
        releaseTag: tag,
        expectedSha256: expected.archiveSha256,
      })
    : null;
  extractArchive(archivePath, extractDir, platform);

  const binaryName = getBinaryName(platform);
  const binaryPath = findBinaryInDir(extractDir, binaryName);
  if (!binaryPath) {
    throw new Error(`Binary ${binaryName} not found in downloaded archive`);
  }

  const binarySha256 = computeFileSha256(binaryPath);
  if (expected.binarySha256 && binarySha256 !== expected.binarySha256) {
    throw new Error(
      `wayland-core extracted binary checksum mismatch for ${assetName} (tag ${tag}). ` +
        `Expected sha256=${expected.binarySha256}, got sha256=${binarySha256}. ` +
        `Refusing to bundle an archive whose extracted executable is not independently pinned.`
    );
  }

  return {
    binaryPath,
    tempDir,
    url,
    assetName,
    archiveSha256: expected.archiveSha256,
    binarySha256,
    publisherAttestation,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function verifiedBundleManifest({
  platform,
  arch,
  tag,
  sourceType,
  assetName,
  archiveSha256,
  binaryName,
  binarySha256,
  stagedBinarySha256,
  publisherAttestation,
}) {
  return {
    contract: BUNDLE_CONTRACT,
    generator: BUNDLE_GENERATOR,
    platform,
    arch,
    releaseTag: tag,
    version: tag,
    generatedAt: new Date().toISOString(),
    sourceType,
    verified: Boolean(publisherAttestation),
    source: {
      owner: GITHUB_OWNER,
      repository: GITHUB_REPO,
      url: getDownloadUrl(assetName, tag),
      asset: assetName,
      archiveSha256: `sha256:${archiveSha256}`,
    },
    binary: {
      name: binaryName,
      // The verified UPSTREAM digest - the provenance pin, unchanged.
      sha256: `sha256:${binarySha256}`,
      // The digest of the bytes actually staged into the package. Identical to
      // the upstream digest everywhere except macOS, where the binary is
      // Developer ID signed above so that the app can notarize. The packaged
      // gate compares the shipped bytes against THIS, so byte identity is still
      // proven exactly rather than downgraded to "signed by someone we trust".
      stagedSha256: `sha256:${stagedBinarySha256 || binarySha256}`,
    },
    publisherAttestation: publisherAttestation || null,
    files: [binaryName],
    skipped: false,
  };
}

function prepareWaylandCore(options = {}) {
  const projectRoot = path.resolve(__dirname, '..');
  const signIdentity =
    options.signIdentity === undefined ? resolveDarwinSigningIdentity(options.env) : options.signIdentity;
  const platform = options.platform || process.platform;
  // Support cross-compilation: WCORE_ARCH > npm_config_target_arch > process.arch
  const arch = options.arch || process.env.WCORE_ARCH || process.env.npm_config_target_arch || process.arch;
  const runtimeKey = `${platform}-${arch}`;
  const version = String(options.version || getVersion()).trim();
  const strict = options.requireVerified === true || isReleaseBuild();
  const skipRequested = process.env.WCORE_SKIP === '1' || process.env.WAYLAND_CORE_SKIP === '1';

  // Honor an explicit skip - same pattern as bundled-bun. Used by CI test
  // matrices and forks that do not need a working engine. IMPORTANT: there is
  // NO runtime download fallback - a build made with WCORE_SKIP=1 ships WITHOUT
  // the engine, so the Wayland-Core backend is unavailable in that build.
  // Release builds must NOT set this (see _build-reusable.yml).
  if (skipRequested && strict) {
    throw new Error(
      `Strict wayland-core preparation for ${runtimeKey} cannot honor WCORE_SKIP/WAYLAND_CORE_SKIP; ` +
        `a package must contain an independently verified engine.`
    );
  }
  if (skipRequested) {
    const targetDir = path.join(projectRoot, 'resources', 'bundled-wayland-core', runtimeKey);
    ensureDirectory(targetDir);
    writeJson(path.join(targetDir, 'manifest.json'), {
      contract: BUNDLE_CONTRACT,
      generator: BUNDLE_GENERATOR,
      platform,
      arch,
      releaseTag: version,
      version,
      generatedAt: new Date().toISOString(),
      sourceType: 'none',
      verified: false,
      source: {},
      files: [],
      skipped: true,
      reason: 'WCORE_SKIP=1 set; engine NOT bundled and there is no runtime fallback. Test/matrix builds only.',
    });
    console.log(
      `  wayland-core skip requested (WCORE_SKIP=1); wrote skip manifest at resources/bundled-wayland-core/${runtimeKey}/manifest.json`
    );
    return { prepared: false, reason: 'env_skip' };
  }

  // Resolve the actual version tag - asset filenames include the tag.
  // If "latest" can't be resolved (e.g. FerroxLabs/wayland-core has no
  // published releases yet), fall through to the skip-manifest path below
  // instead of throwing. The comment at "Not found - write skip manifest"
  // describes the intended behavior; this preserves it.
  let tag;
  if (version === 'latest') {
    if (strict) {
      throw new Error('Strict wayland-core preparation requires an exact pinned release tag; "latest" is forbidden.');
    }
    const resolved = resolveLatestTag();
    if (!resolved) {
      console.warn('  Could not resolve latest wayland-core release tag; falling back to skip manifest.');
      const targetDir = path.join(projectRoot, 'resources', 'bundled-wayland-core', runtimeKey);
      ensureDirectory(targetDir);
      writeJson(path.join(targetDir, 'manifest.json'), {
        contract: BUNDLE_CONTRACT,
        generator: BUNDLE_GENERATOR,
        platform,
        arch,
        releaseTag: 'unresolved',
        version: 'unresolved',
        generatedAt: new Date().toISOString(),
        sourceType: 'none',
        verified: false,
        source: {},
        files: [],
        skipped: true,
        reason: 'Failed to resolve latest tag (likely no GitHub releases published yet).',
      });
      return { prepared: false, reason: 'unresolved_latest' };
    }
    tag = resolved;
    console.log(`Resolved wayland-core "latest" → ${tag}`);
  } else {
    tag = normalizeExactReleaseTag(version);
  }

  const targetDir = path.join(projectRoot, 'resources', 'bundled-wayland-core', runtimeKey);
  const binaryName = getBinaryName(platform);
  const targetBinaryPath = path.join(targetDir, binaryName);
  const assetName = getAssetName(platform, arch, tag);
  if (!assetName) {
    throw new Error(`Unsupported wayland-core target: ${runtimeKey}`);
  }
  const expected = loadExpectedProvenance(tag, assetName, { requireBinary: strict });
  const forceDownload = process.env.WCORE_FORCE_DOWNLOAD === '1';

  console.log(`Preparing wayland-core for ${runtimeKey} (version: ${tag})`);

  // A strict build may reuse exact bytes only because the extracted executable
  // digest is independently pinned beside the archive digest. The old manifest
  // is deliberately ignored: a local or self-asserted manifest is not authority.
  const hasPreplaced = fs.existsSync(targetBinaryPath) && fs.lstatSync(targetBinaryPath).isFile();
  if (hasPreplaced && !forceDownload) {
    const binarySha256 = computeFileSha256(targetBinaryPath);
    if (strict && binarySha256 === expected.binarySha256) {
      // The publisher attestation covers the release archive, not this extracted
      // executable. A digest-matching local cache therefore cannot prove
      // publisher authority by itself; strict builds re-fetch and authenticate
      // the exact archive before publishing any bytes.
      console.warn(
        `  Strict build: independently pinned wayland-core cache for ${runtimeKey} lacks archive-bound publisher ` +
          `authentication; downloading and verifying the signed release asset.`
      );
    } else if (!strict) {
      pruneRuntimeDirectory(targetDir, [binaryName]);
      ensureExecutableMode(targetBinaryPath);
      let binaryVersion = tag;
      try {
        binaryVersion = execFileSync(targetBinaryPath, ['--version'], { encoding: 'utf-8', timeout: 5000 }).trim();
      } catch {}
      writeJson(path.join(targetDir, 'manifest.json'), {
        contract: BUNDLE_CONTRACT,
        generator: BUNDLE_GENERATOR,
        platform,
        arch,
        releaseTag: tag,
        version: binaryVersion,
        generatedAt: new Date().toISOString(),
        sourceType: 'local-prebuilt',
        verified: false,
        source: {
          note: 'Dev-only pre-placed binary. It is not eligible for packaged-resource acceptance.',
        },
        binary: { name: binaryName, sha256: `sha256:${binarySha256}` },
        files: [binaryName],
        skipped: false,
      });
      console.log(
        `  Using dev-only pre-placed wayland-core: resources/bundled-wayland-core/${runtimeKey}/${binaryName} ` +
          `[source=local-prebuilt verified=false binarySha256=${binarySha256.slice(0, 12)}...]`
      );
      return { prepared: true, dir: targetDir, sourceType: 'local-prebuilt', verified: false };
    } else {
      console.warn(
        `  Strict build: pre-placed wayland-core at resources/bundled-wayland-core/${runtimeKey}/${binaryName} ` +
          `does not match the independently pinned extracted-binary digest; downloading the exact release asset instead.`
      );
    }
  }

  removeDirectorySafe(targetDir);
  ensureDirectory(targetDir);

  let sourcePath = null;
  let sourceType = 'none';
  let sourceDetail = {};
  let tempDir = null;
  let archiveSha256 = null;
  let binarySha256 = null;
  let publisherAttestation = null;

  // 1. Download from GitHub releases (archive is SHA-256 verified inside
  //    downloadAndExtract BEFORE it is extracted, copied, or executed).
  if (!sourcePath) {
    try {
      const result = downloadAndExtract(platform, arch, tag, { requireBinaryPin: strict });
      sourcePath = result.binaryPath;
      tempDir = result.tempDir;
      sourceType = 'download';
      sourceDetail = { url: result.url, asset: result.assetName };
      archiveSha256 = result.archiveSha256;
      binarySha256 = result.binarySha256;
      publisherAttestation = result.publisherAttestation;
      console.log(
        `  Downloaded + verified from GitHub releases ` +
          `(archiveSha256=${archiveSha256} binarySha256=${binarySha256})`
      );
    } catch (error) {
      // On release builds a failed download OR a failed/missing checksum must
      // abort - never silently ship an engine-less or unverified installer.
      if (strict) {
        if (tempDir) removeDirectorySafe(tempDir);
        throw new Error(
          `Release build cannot prepare a verified wayland-core for ${runtimeKey} (tag ${tag}): ${error.message}`
        );
      }
      console.warn(`  Download failed: ${error.message}`);
    }
  }

  // Write result
  if (sourcePath) {
    copyFileSafe(sourcePath, targetBinaryPath);
    ensureExecutableMode(targetBinaryPath);

    const copiedBinarySha256 = computeFileSha256(targetBinaryPath);
    if (copiedBinarySha256 !== binarySha256) {
      if (tempDir) removeDirectorySafe(tempDir);
      throw new Error(
        `wayland-core binary changed while publishing ${runtimeKey}: ` +
          `expected sha256=${binarySha256}, got sha256=${copiedBinarySha256}`
      );
    }

    // Apple refuses to notarize an app containing an ad-hoc / linker-signed
    // Mach-O, and released wayland-core binaries are linker-signed. Sign here,
    // AFTER the upstream bytes have been checksum- and attestation-verified
    // above and BEFORE the digest the packaged gate pins is taken, so the
    // provenance chain stays intact and the shipped bytes stay byte-exact.
    // `mac.signIgnore` then keeps electron-builder from re-signing this path.
    if (platform === 'darwin') {
      signDarwinStagedBinary(targetBinaryPath, {
        identity: signIdentity,
        // Binds the signature to the pinned upstream bytes, so a substituted or
        // downgraded binary cannot pass by rewriting the manifest beside it.
        identifier: darwinSigningIdentifier(binaryName, binarySha256),
        label: `wayland-core ${runtimeKey}`,
      });
    }
    const stagedBinarySha256 = computeFileSha256(targetBinaryPath);

    const manifest = verifiedBundleManifest({
      platform,
      arch,
      tag,
      sourceType,
      assetName: sourceDetail.asset,
      archiveSha256,
      binaryName,
      binarySha256,
      stagedBinarySha256,
      publisherAttestation,
    });
    if (!strict && !expected.binarySha256) manifest.verified = false;

    writeJson(path.join(targetDir, 'manifest.json'), manifest);
    console.log(
      `  Bundled wayland-core prepared: resources/bundled-wayland-core/${runtimeKey}/${binaryName} [source=${sourceType}]`
    );

    if (tempDir) removeDirectorySafe(tempDir);
    return { prepared: true, dir: targetDir, sourceType, verified: manifest.verified };
  }

  // Not found - write skip manifest (non-fatal, like bundled-bun)
  const manifest = {
    contract: BUNDLE_CONTRACT,
    generator: BUNDLE_GENERATOR,
    platform,
    arch,
    releaseTag: tag,
    version: tag,
    generatedAt: new Date().toISOString(),
    sourceType: 'none',
    verified: false,
    source: {},
    files: [],
    skipped: true,
    reason: 'wayland-core binary not found (ensure GitHub release exists)',
  };

  writeJson(path.join(targetDir, 'manifest.json'), manifest);
  console.warn(`  wayland-core not found - skipping bundle (agent will not be available in packaged app)`);
  return { prepared: false, reason: 'not_found' };
}

module.exports = prepareWaylandCore;
prepareWaylandCore.BUNDLE_CONTRACT = BUNDLE_CONTRACT;
prepareWaylandCore.BUNDLE_GENERATOR = BUNDLE_GENERATOR;
prepareWaylandCore.DEFAULT_WCORE_VERSION = DEFAULT_WCORE_VERSION;
prepareWaylandCore.SHASUMS_FILE = SHASUMS_FILE;
prepareWaylandCore.getAssetName = getAssetName;
prepareWaylandCore.loadExpectedProvenance = loadExpectedProvenance;
prepareWaylandCore.normalizeExactReleaseTag = normalizeExactReleaseTag;
prepareWaylandCore.pruneRuntimeDirectory = pruneRuntimeDirectory;
// Exported so the extractor choice (#1058) can be driven directly instead of only
// through a real release download.
prepareWaylandCore.extractArchive = extractArchive;
prepareWaylandCore.__extractorFor = __extractorFor;

// Allow standalone invocation: `node scripts/prepareWaylandCore.js`.
// build-with-builder.js requires the module and calls the function directly;
// this runner makes the script independently executable (and testable).
if (require.main === module) {
  try {
    prepareWaylandCore();
  } catch (error) {
    console.error(`prepareWaylandCore failed: ${error.message}`);
    process.exit(1);
  }
}
