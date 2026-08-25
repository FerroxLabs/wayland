/**
 * Prepare wayland-nano binary for Electron packaging.
 *
 * Resolution order:
 *  0. Dev-only calls may use a pre-placed unverified local binary. Strict
 *     package builds never treat extracted cache bytes as publisher authority;
 *     they authenticate the exact release archive before publishing.
 *  1. GitHub release download (requires WNANO_VERSION or defaults to "latest"),
 *     SHA-256 verified before extract/copy/execute.
 *
 * Output: resources/bundled-wayland-nano/{platform}-{arch}/wayland-nano[.exe]
 *
 * Env (DEV ONLY - IGNORED for skipping verification on release/CI builds):
 *      WNANO_USE_LOCAL=1      trust a pre-placed binary on a dev build;
 *      WNANO_FORCE_DOWNLOAD=1 always re-download (ignore a pre-placed binary);
 *      WNANO_ALLOW_UNVERIFIED=1 (historical) does NOT downgrade a release build.
 *   On a release/CI build these never bypass SHA-256 verification - the build
 *   either verifies a present local binary or downloads-and-verifies, else fails
 *   closed.
 *
 * Pattern follows prepareWaylandCore.js.
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
const GITHUB_REPO = 'wayland-nano';
const BUNDLE_CONTRACT = 'wayland-nano-bundle/1.0';
const BUNDLE_GENERATOR = 'prepareWaylandNano/1';

// Authoritative per-platform SHA-256 manifest for the downloaded release
// archives. Supply-chain guard (UPD-03): every release build must fetch the
// pinned tag's asset and verify its SHA-256 against this file before the
// archive is extracted, copied, or - critically - executed (`--version`).
// Mirrors scripts/bundled-wcore-shasums.json. Bump in lockstep with the tag.
const SHASUMS_FILE = path.resolve(__dirname, 'bundled-wnano-shasums.json');

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
  return platform === 'win32' ? 'wayland-nano.exe' : 'wayland-nano';
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
 * every bundled agent binary MUST have a verified SHA-256, and the WNANO_*
 * trust/bypass env vars are IGNORED for the purpose of skipping verification.
 *
 * Signals (any one is sufficient):
 *  - process.env.CI                  - standard CI marker (GitHub Actions etc.)
 *  - process.env.npm_config_production / NODE_ENV=production - prod install/build
 *  - electron-builder release context - set by electron-builder during a build
 *    (npm_lifecycle_event starts with dist/build/make/package, or a publish run).
 *  - WNANO_REQUIRE_VERIFIED=1         - explicit opt-in to the strict path.
 *
 * IMPORTANT (RT-B6-06): WNANO_ALLOW_UNVERIFIED must NOT be able to flip this to
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
    process.env.WNANO_REQUIRE_VERIFIED === '1' ||
    process.env.NODE_ENV === 'production' ||
    process.env.npm_config_production === 'true' ||
    builderRelease
  );
}

/**
 * Resolve the expected SHA-256 (lowercase hex, no prefix) for a given release
 * tag + asset from bundled-wnano-shasums.json. Throws when the manifest is
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
        `Cannot verify bundled wayland-nano integrity (supply-chain guard).`
    );
  }

  const tagEntry = manifest[tag];
  if (!tagEntry || typeof tagEntry !== 'object') {
    throw new Error(
      `No SHA-256 entries for wayland-nano tag "${tag}" in ${SHASUMS_FILE}. ` +
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
 * unverified agent binary.
 */
function verifyArchiveChecksum(archivePath, expectedHex, assetName, tag) {
  const actualHex = computeFileSha256(archivePath);
  if (actualHex !== expectedHex) {
    throw new Error(
      `wayland-nano archive checksum mismatch for ${assetName} (tag ${tag}). ` +
        `Expected sha256=${expectedHex}, got sha256=${actualHex}. ` +
        `Refusing to extract or execute this binary; aborting bundled wayland-nano preparation.`
    );
  }
}

// Default version. The agent release stream lives at FerroxLabs/wayland-nano;
// unlike wayland-core there is no pinned tag yet - the first release assets
// are published alongside this integration, so the default resolves "latest"
// for dev builds. Strict package builds REJECT "latest" (see below), so
// packaging fails closed until DEFAULT_WNANO_VERSION is pinned to an exact
// release tag here and scripts/bundled-wnano-shasums.json is filled in the
// same commit. Override with WNANO_VERSION=... when bumping.
const DEFAULT_WNANO_VERSION = 'v0.2.0';

function getVersion() {
  return (process.env.WNANO_VERSION || DEFAULT_WNANO_VERSION).trim();
}

function normalizeExactReleaseTag(version) {
  const tag = version.startsWith('v') ? version : `v${version}`;
  if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?$/.test(tag)) {
    throw new Error(`Invalid wayland-nano release tag "${version}"; expected an exact vMAJOR.MINOR.PATCH tag.`);
  }
  return tag;
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
 * wayland-nano release assets are named after the unprefixed npm version and
 * the npm package's runtime key, one zip per platform (the release workflow
 * publishes no Windows ARM64 target):
 *   wayland-nano-0.1.0-darwin-arm64.zip
 */
// wayland-nano does not publish a runtime for every target Desktop packages
// (there is no win32-arm64 build). Callers use this to bundle where a runtime
// exists and fall back to the npx launcher where one does not, rather than
// failing the whole platform build.
const SUPPORTED_WNANO_TARGETS = new Set(['darwin-arm64', 'darwin-x64', 'linux-arm64', 'linux-x64', 'win32-x64']);

function isSupportedWNanoTarget(platform, arch) {
  return SUPPORTED_WNANO_TARGETS.has(`${platform}-${arch}`);
}

function getAssetName(platform, arch, tag) {
  const runtimeKey = `${platform}-${arch}`;
  if (!SUPPORTED_WNANO_TARGETS.has(runtimeKey)) return null;
  const version = tag.startsWith('v') ? tag.slice(1) : tag;
  return `wayland-nano-${version}-${runtimeKey}.zip`;
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
  console.log(`  Downloading wayland-nano from ${url}`);
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

function extractArchive(archivePath, outputDir, platform) {
  ensureDirectory(outputDir);
  if (platform === 'win32' || archivePath.endsWith('.zip')) {
    if (platform === 'win32') {
      const ps = `Expand-Archive -LiteralPath '${archivePath.replace(/'/g, "''")}' -DestinationPath '${outputDir.replace(/'/g, "''")}' -Force`;
      execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps]);
    } else {
      execFileSync('unzip', ['-o', archivePath, '-d', outputDir]);
    }
  } else {
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
    throw new Error(`Unsupported wayland-nano target: ${platform}-${arch}`);
  }

  const url = getDownloadUrl(assetName, tag);
  const tempDir = path.join(os.tmpdir(), 'aionui-wayland-nano', tag, `${platform}-${arch}`);
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
      `wayland-nano extracted binary checksum mismatch for ${assetName} (tag ${tag}). ` +
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
      // Verified UPSTREAM digest - the provenance pin.
      sha256: `sha256:${binarySha256}`,
      // Digest of the bytes actually staged. Differs from the upstream digest
      // only on macOS, where the binary is Developer ID signed above; the
      // packaged gate compares the shipped bytes against this.
      stagedSha256: `sha256:${stagedBinarySha256 || binarySha256}`,
    },
    publisherAttestation: publisherAttestation || null,
    files: [binaryName],
    skipped: false,
  };
}

function prepareWaylandNano(options = {}) {
  const signIdentity =
    options.signIdentity === undefined ? resolveDarwinSigningIdentity(options.env) : options.signIdentity;
  const projectRoot = path.resolve(__dirname, '..');
  const platform = options.platform || process.platform;
  // Support cross-compilation: WNANO_ARCH > npm_config_target_arch > process.arch
  const arch = options.arch || process.env.WNANO_ARCH || process.env.npm_config_target_arch || process.arch;
  const runtimeKey = `${platform}-${arch}`;
  const version = String(options.version || getVersion()).trim();
  const strict = options.requireVerified === true || isReleaseBuild();
  const skipRequested = process.env.WNANO_SKIP === '1' || process.env.WAYLAND_NANO_SKIP === '1';

  // Honor an explicit skip - same pattern as wayland-core. Used by CI test
  // matrices and forks that do not need the bundled agent. IMPORTANT: there is
  // NO runtime download fallback - a build made with WNANO_SKIP=1 ships WITHOUT
  // the agent, so the Wayland-Nano backend falls back to a `wayland-nano`
  // binary on the user's PATH in that build.
  // Release builds must NOT set this.
  if (skipRequested && strict) {
    throw new Error(
      `Strict wayland-nano preparation for ${runtimeKey} cannot honor WNANO_SKIP/WAYLAND_NANO_SKIP; ` +
        `a package must contain an independently verified agent binary.`
    );
  }
  if (skipRequested) {
    const targetDir = path.join(projectRoot, 'resources', 'bundled-wayland-nano', runtimeKey);
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
      reason: 'WNANO_SKIP=1 set; agent NOT bundled (PATH fallback only). Test/matrix builds only.',
    });
    console.log(
      `  wayland-nano skip requested (WNANO_SKIP=1); wrote skip manifest at resources/bundled-wayland-nano/${runtimeKey}/manifest.json`
    );
    return { prepared: false, reason: 'env_skip' };
  }

  // Resolve the actual version tag - asset filenames include the version.
  // If "latest" can't be resolved (e.g. FerroxLabs/wayland-nano has no
  // published releases yet), fall through to the skip-manifest path below
  // instead of throwing. The comment at "Not found - write skip manifest"
  // describes the intended behavior; this preserves it.
  let tag;
  if (version === 'latest') {
    if (strict) {
      throw new Error('Strict wayland-nano preparation requires an exact pinned release tag; "latest" is forbidden.');
    }
    const resolved = resolveLatestTag();
    if (!resolved) {
      console.warn('  Could not resolve latest wayland-nano release tag; falling back to skip manifest.');
      const targetDir = path.join(projectRoot, 'resources', 'bundled-wayland-nano', runtimeKey);
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
    console.log(`Resolved wayland-nano "latest" → ${tag}`);
  } else {
    tag = normalizeExactReleaseTag(version);
  }

  const targetDir = path.join(projectRoot, 'resources', 'bundled-wayland-nano', runtimeKey);
  const binaryName = getBinaryName(platform);
  const targetBinaryPath = path.join(targetDir, binaryName);
  const assetName = getAssetName(platform, arch, tag);
  if (!assetName) {
    throw new Error(`Unsupported wayland-nano target: ${runtimeKey}`);
  }
  const expected = loadExpectedProvenance(tag, assetName, { requireBinary: strict });
  const forceDownload = process.env.WNANO_FORCE_DOWNLOAD === '1';

  console.log(`Preparing wayland-nano for ${runtimeKey} (version: ${tag})`);

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
        `  Strict build: independently pinned wayland-nano cache for ${runtimeKey} lacks archive-bound publisher ` +
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
        binary: { name: binaryName, sha256: `sha256:${binarySha256}`, stagedSha256: `sha256:${binarySha256}` },
        files: [binaryName],
        skipped: false,
      });
      console.log(
        `  Using dev-only pre-placed wayland-nano: resources/bundled-wayland-nano/${runtimeKey}/${binaryName} ` +
          `[source=local-prebuilt verified=false binarySha256=${binarySha256.slice(0, 12)}...]`
      );
      return { prepared: true, dir: targetDir, sourceType: 'local-prebuilt', verified: false };
    } else {
      console.warn(
        `  Strict build: pre-placed wayland-nano at resources/bundled-wayland-nano/${runtimeKey}/${binaryName} ` +
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
      // abort - never silently ship an agent-less or unverified installer.
      if (strict) {
        if (tempDir) removeDirectorySafe(tempDir);
        throw new Error(
          `Release build cannot prepare a verified wayland-nano for ${runtimeKey} (tag ${tag}): ${error.message}`
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
        `wayland-nano binary changed while publishing ${runtimeKey}: ` +
          `expected sha256=${binarySha256}, got sha256=${copiedBinarySha256}`
      );
    }

    // Released wayland-nano binaries are linker-signed, which Apple rejects.
    // Sign AFTER the upstream checksum/attestation checks above and BEFORE the
    // digest the packaged gate pins, so provenance and byte identity both hold.
    if (platform === 'darwin') {
      signDarwinStagedBinary(targetBinaryPath, {
        identity: signIdentity,
        identifier: darwinSigningIdentifier(binaryName, binarySha256),
        label: `wayland-nano ${runtimeKey}`,
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
      `  Bundled wayland-nano prepared: resources/bundled-wayland-nano/${runtimeKey}/${binaryName} [source=${sourceType}]`
    );

    if (tempDir) removeDirectorySafe(tempDir);
    return { prepared: true, dir: targetDir, sourceType, verified: manifest.verified };
  }

  // Not found - write skip manifest (non-fatal, like wayland-core)
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
    reason: 'wayland-nano binary not found (ensure GitHub release exists)',
  };

  writeJson(path.join(targetDir, 'manifest.json'), manifest);
  console.warn(`  wayland-nano not found - skipping bundle (agent will fall back to PATH in packaged app)`);
  return { prepared: false, reason: 'not_found' };
}

module.exports = prepareWaylandNano;
prepareWaylandNano.BUNDLE_CONTRACT = BUNDLE_CONTRACT;
prepareWaylandNano.BUNDLE_GENERATOR = BUNDLE_GENERATOR;
prepareWaylandNano.DEFAULT_WNANO_VERSION = DEFAULT_WNANO_VERSION;
prepareWaylandNano.SHASUMS_FILE = SHASUMS_FILE;
prepareWaylandNano.getAssetName = getAssetName;
prepareWaylandNano.loadExpectedProvenance = loadExpectedProvenance;
prepareWaylandNano.normalizeSha256 = normalizeSha256;
prepareWaylandNano.SUPPORTED_WNANO_TARGETS = SUPPORTED_WNANO_TARGETS;
prepareWaylandNano.isSupportedWNanoTarget = isSupportedWNanoTarget;
prepareWaylandNano.normalizeExactReleaseTag = normalizeExactReleaseTag;
prepareWaylandNano.pruneRuntimeDirectory = pruneRuntimeDirectory;

// Allow standalone invocation: `node scripts/prepareWaylandNano.js`.
// build-with-builder.js requires the module and calls the function directly;
// this runner makes the script independently executable (and testable).
if (require.main === module) {
  try {
    prepareWaylandNano();
  } catch (error) {
    console.error(`prepareWaylandNano failed: ${error.message}`);
    process.exit(1);
  }
}
