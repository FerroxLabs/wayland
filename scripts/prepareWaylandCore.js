/**
 * Prepare wayland-core binary for Electron packaging.
 *
 * Resolution order:
 *  0. Pre-placed local binary (a local source build copied into the bundle dir,
 *     or - once wayland-core ships on npm - a binary resolved from node_modules).
 *     DEV/LOCAL builds keep it as-is, never wiped or re-downloaded, with NO
 *     shasum requirement (no published release with real hashes yet). On a
 *     RELEASE/CI build a pre-placed binary is only trusted if its SHA-256
 *     verifies against bundled-wcore-shasums.json - otherwise the build falls
 *     through to the download+verify path. A release build NEVER bundles an
 *     unverified binary, regardless of the WCORE_* trust/bypass env vars.
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
const path = require('path');

const GITHUB_OWNER = 'FerroxLabs';
const GITHUB_REPO = 'wayland-core';

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
function loadExpectedShaForAsset(tag, assetName) {
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
  if (!raw || typeof raw !== 'string') {
    throw new Error(`No SHA-256 entry for asset "${assetName}" under tag "${tag}" in ${SHASUMS_FILE}.`);
  }

  const hex = raw
    .replace(/^sha256:/i, '')
    .trim()
    .toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    throw new Error(
      `Malformed or placeholder SHA-256 for "${assetName}" (tag "${tag}") in ${SHASUMS_FILE}: ${raw}. ` +
        `Replace the placeholder with the canonical checksum from the signed release.`
    );
  }
  return hex;
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
const DEFAULT_WCORE_VERSION = 'v0.12.24';

function getVersion() {
  return (process.env.WCORE_VERSION || DEFAULT_WCORE_VERSION).trim();
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
    const ps = `$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '${url}' -OutFile '${outputPath.replace(/'/g, "''")}'`;
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

function downloadAndExtract(platform, arch, tag) {
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
  const expectedSha256 = loadExpectedShaForAsset(tag, assetName);

  removeDirectorySafe(tempDir);
  ensureDirectory(tempDir);

  downloadFile(url, archivePath);
  // Supply-chain gate: verify the downloaded archive before extract/copy/exec.
  verifyArchiveChecksum(archivePath, expectedSha256, assetName, tag);
  extractArchive(archivePath, extractDir, platform);

  const binaryName = getBinaryName(platform);
  const binaryPath = findBinaryInDir(extractDir, binaryName);
  if (!binaryPath) {
    throw new Error(`Binary ${binaryName} not found in downloaded archive`);
  }

  return { binaryPath, tempDir, url, assetName, sha256: expectedSha256 };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function prepareWaylandCore() {
  const projectRoot = path.resolve(__dirname, '..');
  const platform = process.platform;
  // Support cross-compilation: WCORE_ARCH > npm_config_target_arch > process.arch
  const arch = process.env.WCORE_ARCH || process.env.npm_config_target_arch || process.arch;
  const runtimeKey = `${platform}-${arch}`;
  const version = getVersion();

  // Honor an explicit skip - same pattern as bundled-bun. Used by CI test
  // matrices and forks that do not need a working engine. IMPORTANT: there is
  // NO runtime download fallback - a build made with WCORE_SKIP=1 ships WITHOUT
  // the engine, so the Wayland-Core backend is unavailable in that build.
  // Release builds must NOT set this (see _build-reusable.yml).
  if (process.env.WCORE_SKIP === '1' || process.env.WAYLAND_CORE_SKIP === '1') {
    const targetDir = path.join(projectRoot, 'resources', 'bundled-wayland-core', runtimeKey);
    ensureDirectory(targetDir);
    writeJson(path.join(targetDir, 'manifest.json'), {
      platform,
      arch,
      version,
      generatedAt: new Date().toISOString(),
      sourceType: 'none',
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

  // 0. Non-destructive local / pre-placed binary path. If a usable binary is
  //    already present (a local source build copied in, or - once wayland-core
  //    ships on npm - a binary resolved from node_modules into this dir), keep
  //    it instead of wiping and re-downloading. Prevents destroying a
  //    hand-placed binary when no release asset exists, and supports the
  //    build-and-copy workflow.
  //
  //    DEV/LOCAL (!isReleaseBuild()): trusted as-is, NO shasum requirement.
  //      WCORE_FORCE_DOWNLOAD=1 still skips it to exercise the download path.
  //
  //    RELEASE/CI (isReleaseBuild()): the WCORE_* trust/bypass env vars are
  //      IGNORED for the purpose of skipping verification (RT-B6-01/02,
  //      RT-R3-02). A pre-placed binary is trusted ONLY if its SHA-256 matches
  //      bundled-wcore-shasums.json for the pinned tag's archive. On
  //      PENDING/missing/mismatch we DO NOT bundle it - we fall through to the
  //      download+verify path (which itself fails closed for a release build).
  {
    const localTargetDir = path.join(projectRoot, 'resources', 'bundled-wayland-core', runtimeKey);
    const localBinaryName = getBinaryName(platform);
    const preplaced = path.join(localTargetDir, localBinaryName);
    const hasPreplaced = fs.existsSync(preplaced) && fs.statSync(preplaced).isFile();
    const forceDownload = process.env.WCORE_FORCE_DOWNLOAD === '1';
    const releaseBuild = isReleaseBuild();

    // Does this pre-placed binary's SHA-256 match the pinned release archive's
    // checksum? Note: the manifest pins the *archive* (.tar.gz/.zip) hash, not
    // the extracted binary hash, so a bare pre-placed binary can only be
    // verified once a manifest carries a real binary checksum. Until then a
    // release build's local artifact is treated as UNVERIFIABLE and is never
    // bundled - it falls through to download+verify (which fails closed on
    // PENDING). This is the fail-closed posture the findings require.
    function localBinaryVerifies() {
      if (!hasPreplaced) return false;
      let resolvedTag;
      try {
        resolvedTag = version === 'latest' ? resolveLatestTag() : version.startsWith('v') ? version : `v${version}`;
      } catch {
        return false;
      }
      if (!resolvedTag) return false;
      const assetName = getAssetName(platform, arch, resolvedTag);
      if (!assetName) return false;
      let expectedHex;
      try {
        // Throws on missing manifest / missing entry / PENDING placeholder.
        expectedHex = loadExpectedShaForAsset(resolvedTag, assetName);
      } catch {
        return false;
      }
      const actualHex = computeFileSha256(preplaced);
      return actualHex === expectedHex;
    }

    const devTrustLocal = !releaseBuild && hasPreplaced && !forceDownload;
    const releaseTrustLocal = releaseBuild && !forceDownload && localBinaryVerifies();

    if (devTrustLocal || releaseTrustLocal) {
      ensureExecutableMode(preplaced);
      const sha256 = computeFileSha256(preplaced);
      let binaryVersion = version;
      try {
        binaryVersion = execFileSync(preplaced, ['--version'], { encoding: 'utf-8', timeout: 5000 }).trim();
      } catch {}
      const verified = releaseTrustLocal;
      writeJson(path.join(localTargetDir, 'manifest.json'), {
        platform,
        arch,
        version: binaryVersion,
        generatedAt: new Date().toISOString(),
        sourceType: 'local-prebuilt',
        source: {
          note: verified
            ? 'Pre-placed binary verified against bundled-wcore-shasums.json; not re-downloaded.'
            : 'Pre-placed binary kept as-is for local/dev build (no shasum requirement). WCORE_FORCE_DOWNLOAD=1 to override.',
          verified,
        },
        sha256,
        files: [localBinaryName],
        skipped: false,
      });
      console.log(
        `  Using pre-placed wayland-core: resources/bundled-wayland-core/${runtimeKey}/${localBinaryName} ` +
          `[source=local-prebuilt verified=${verified} sha256=${sha256.slice(0, 12)}...]`
      );
      return { prepared: true, dir: localTargetDir, sourceType: 'local-prebuilt' };
    }

    if (releaseBuild && hasPreplaced && !forceDownload) {
      // A pre-placed binary exists but did NOT verify on a release build. Do
      // not bundle it. Fall through to the download+verify path, which fails
      // closed (PENDING/missing/mismatch) for release builds.
      console.warn(
        `  Release build: pre-placed wayland-core at resources/bundled-wayland-core/${runtimeKey}/${localBinaryName} ` +
          `is UNVERIFIED against bundled-wcore-shasums.json - refusing to trust it. ` +
          `Taking the download+verify path instead (WCORE_USE_LOCAL / WCORE_ALLOW_UNVERIFIED do not bypass this).`
      );
    }
  }

  // Resolve the actual version tag - asset filenames include the tag.
  // If "latest" can't be resolved (e.g. FerroxLabs/wayland-core has no
  // published releases yet), fall through to the skip-manifest path below
  // instead of throwing. The comment at "Not found - write skip manifest"
  // describes the intended behavior; this preserves it.
  let tag;
  if (version === 'latest') {
    const resolved = resolveLatestTag();
    if (!resolved) {
      console.warn('  Could not resolve latest wayland-core release tag; falling back to skip manifest.');
      const targetDir = path.join(projectRoot, 'resources', 'bundled-wayland-core', runtimeKey);
      ensureDirectory(targetDir);
      writeJson(path.join(targetDir, 'manifest.json'), {
        platform,
        arch,
        version: 'unresolved',
        generatedAt: new Date().toISOString(),
        sourceType: 'none',
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
    tag = version.startsWith('v') ? version : `v${version}`;
  }

  const targetDir = path.join(projectRoot, 'resources', 'bundled-wayland-core', runtimeKey);
  const binaryName = getBinaryName(platform);
  const targetBinaryPath = path.join(targetDir, binaryName);

  console.log(`Preparing wayland-core for ${runtimeKey} (version: ${tag})`);

  // Fail closed BEFORE any destructive cleanup on a release build: if the
  // pinned archive has no real checksum (PENDING/missing), abort now so we
  // neither wipe a pre-placed binary nor download an unverifiable artifact.
  // This keeps the script non-destructive on a release build that can't be
  // verified, and guarantees no release path ever bundles an unverified binary.
  if (isReleaseBuild()) {
    const assetName = getAssetName(platform, arch, tag);
    if (!assetName) {
      throw new Error(`Release build: unsupported wayland-core target ${runtimeKey} (tag ${tag}); cannot verify.`);
    }
    // Throws on missing manifest / missing entry / PENDING placeholder.
    loadExpectedShaForAsset(tag, assetName);
  }

  removeDirectorySafe(targetDir);
  ensureDirectory(targetDir);

  let sourcePath = null;
  let sourceType = 'none';
  let sourceDetail = {};
  let tempDir = null;
  let verifiedSha256 = null;

  // 1. Download from GitHub releases (archive is SHA-256 verified inside
  //    downloadAndExtract BEFORE it is extracted, copied, or executed).
  if (!sourcePath) {
    try {
      const result = downloadAndExtract(platform, arch, tag);
      sourcePath = result.binaryPath;
      tempDir = result.tempDir;
      sourceType = 'download';
      sourceDetail = { url: result.url, asset: result.assetName, sha256: result.sha256 };
      verifiedSha256 = result.sha256;
      console.log(`  Downloaded + verified from GitHub releases (sha256=${result.sha256})`);
    } catch (error) {
      // On release builds a failed download OR a failed/missing checksum must
      // abort - never silently ship an engine-less or unverified installer.
      if (isReleaseBuild()) {
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

    // Get version info from binary - only ever execute an artifact whose
    // archive SHA-256 we verified above (supply-chain guard: do not run
    // untrusted code on the build host just to read a version string).
    let binaryVersion = tag;
    if (verifiedSha256) {
      try {
        // execFileSync (no shell) - the path is app-controlled, but avoid the
        // shell string entirely on principle.
        binaryVersion = execFileSync(targetBinaryPath, ['--version'], { encoding: 'utf-8', timeout: 5000 }).trim();
      } catch {}
    }

    const manifest = {
      platform,
      arch,
      version: binaryVersion,
      generatedAt: new Date().toISOString(),
      sourceType,
      source: sourceDetail,
      sha256: verifiedSha256,
      files: [binaryName],
      skipped: false,
    };

    writeJson(path.join(targetDir, 'manifest.json'), manifest);
    console.log(
      `  Bundled wayland-core prepared: resources/bundled-wayland-core/${runtimeKey}/${binaryName} [source=${sourceType}]`
    );

    if (tempDir) removeDirectorySafe(tempDir);
    return { prepared: true, dir: targetDir, sourceType };
  }

  // Not found - write skip manifest (non-fatal, like bundled-bun)
  const manifest = {
    platform,
    arch,
    version: tag,
    generatedAt: new Date().toISOString(),
    sourceType: 'none',
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
