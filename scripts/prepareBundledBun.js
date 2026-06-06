const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CACHE_META_FILE = 'runtime-meta.json';

// Pinned Bun release. Reproducible builds + supply-chain safety (H14):
// every build must fetch this exact version and verify the SHA-256 against
// scripts/bundled-bun-shasums.json (which mirrors Bun's official
// SHASUMS256.txt for this tag). Bump both in lockstep.
const PINNED_BUN_VERSION = '1.3.14';
const SHASUMS_FILE = path.resolve(__dirname, 'bundled-bun-shasums.json');

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

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
}

function getRequiredRuntimeFiles(platform) {
  return [platform === 'win32' ? 'bun.exe' : 'bun'];
}

function getRuntimeVersion() {
  const configured = process.env.WAYLAND_BUN_VERSION;
  return configured && configured.trim() ? configured.trim() : PINNED_BUN_VERSION;
}

function normalizeVersionKey(version) {
  if (!version) return version;
  if (version.startsWith('bun-v')) return version.slice('bun-v'.length);
  if (version.startsWith('v')) return version.slice(1);
  return version;
}

function loadExpectedShaForAsset(version, assetName) {
  const manifest = readJsonSafe(SHASUMS_FILE);
  if (!manifest) {
    throw new Error(
      `Missing SHA-256 manifest at ${SHASUMS_FILE}. ` +
        `Cannot verify bundled Bun runtime integrity (supply-chain guard).`
    );
  }

  const versionKey = normalizeVersionKey(version);
  const versionEntry = manifest[versionKey];
  if (!versionEntry || typeof versionEntry !== 'object') {
    throw new Error(
      `No SHA-256 entries for Bun version "${versionKey}" in ${SHASUMS_FILE}. ` +
        `Add the official SHASUMS256.txt values from ` +
        `https://github.com/oven-sh/bun/releases/download/bun-v${versionKey}/SHASUMS256.txt ` +
        `before building.`
    );
  }

  const raw = versionEntry[assetName];
  if (!raw || typeof raw !== 'string') {
    throw new Error(
      `No SHA-256 entry for asset "${assetName}" under version "${versionKey}" in ${SHASUMS_FILE}.`
    );
  }

  const hex = raw.replace(/^sha256:/i, '').trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    throw new Error(
      `Malformed SHA-256 entry for "${assetName}" (version "${versionKey}") in ${SHASUMS_FILE}: ${raw}`
    );
  }
  return hex;
}

function computeFileSha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function verifyArchiveChecksum(archivePath, expectedHex, assetName, version) {
  const actualHex = computeFileSha256(archivePath);
  if (actualHex !== expectedHex) {
    throw new Error(
      `Bun archive checksum mismatch for ${assetName} (version ${version}). ` +
        `Expected sha256=${expectedHex}, got sha256=${actualHex}. ` +
        `Refusing to use this binary; aborting bundled Bun preparation.`
    );
  }
}

function getCacheRootDir() {
  const custom = process.env.WAYLAND_BUN_CACHE_DIR;
  if (custom && custom.trim()) {
    return path.resolve(custom.trim());
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return path.join(localAppData, 'Wayland', 'cache', 'bundled-bun');
  }

  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Caches', 'Wayland', 'bundled-bun');
  }

  const xdgCacheHome = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(xdgCacheHome, 'Wayland', 'bundled-bun');
}

function getPlatformAsset(platform, arch, variant = 'default') {
  const archMap = {
    x64: 'x64',
    arm64: 'aarch64',
  };
  const normalizedArch = archMap[arch];
  if (!normalizedArch) return null;

  const platformMap = {
    win32: 'windows',
    darwin: 'darwin',
    linux: 'linux',
  };
  const normalizedPlatform = platformMap[platform];
  if (!normalizedPlatform) return null;

  const suffix = variant === 'baseline' ? '-baseline' : '';
  return `bun-${normalizedPlatform}-${normalizedArch}${suffix}.zip`;
}

function needsBaselineVariant(platform, arch) {
  return platform === 'linux' && arch === 'x64';
}

function getDownloadUrl(assetName, version) {
  if (version === 'latest') {
    // Hard refusal: reproducible-build invariant. "latest" cannot be
    // SHA-pinned, so we never resolve to releases/latest/download.
    throw new Error(
      `Bundled Bun version "latest" is not allowed (no SHA pin possible). ` +
        `Set WAYLAND_BUN_VERSION to a specific release (e.g. "${PINNED_BUN_VERSION}") ` +
        `or leave it unset to use the pinned default.`
    );
  }

  const normalized = version.startsWith('bun-v')
    ? version
    : version.startsWith('v')
      ? `bun-${version}`
      : `bun-v${version}`;
  return `https://github.com/oven-sh/bun/releases/download/${normalized}/${assetName}`;
}

function runCommand(command, args, options = {}) {
  execFileSync(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120000,
    ...options,
  });
}

function downloadFile(url, outputPath) {
  console.log(`Downloading bun runtime from ${url}`);

  if (process.platform === 'win32') {
    const psScript = [
      "$ProgressPreference='SilentlyContinue'",
      `Invoke-WebRequest -Uri '${url}' -OutFile '${outputPath.replace(/'/g, "''")}'`,
    ].join('; ');

    runCommand('powershell', ['-NoProfile', '-NonInteractive', '-Command', psScript]);
    return;
  }

  try {
    runCommand('curl', ['-L', '--fail', '--silent', '--show-error', '-o', outputPath, url]);
    return;
  } catch {
    runCommand('wget', ['-q', '-O', outputPath, url]);
  }
}

function extractZip(zipPath, outputDir) {
  ensureDirectory(outputDir);

  if (process.platform === 'win32') {
    const psScript = `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${outputDir.replace(/'/g, "''")}' -Force`;
    runCommand('powershell', ['-NoProfile', '-NonInteractive', '-Command', psScript]);
    return;
  }

  try {
    runCommand('unzip', ['-o', zipPath, '-d', outputDir]);
    return;
  } catch {
    runCommand('tar', ['-xf', zipPath, '-C', outputDir]);
  }
}

function listDirectoriesRecursive(dirPath, acc = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(dirPath, entry.name);
    acc.push(fullPath);
    listDirectoriesRecursive(fullPath, acc);
  }
  return acc;
}

function findRuntimeDirectory(rootDir, requiredFiles) {
  const candidateDirs = [rootDir, ...listDirectoriesRecursive(rootDir)];
  for (const candidate of candidateDirs) {
    const allPresent = requiredFiles.every((fileName) => fs.existsSync(path.join(candidate, fileName)));
    if (allPresent) {
      return candidate;
    }
  }
  return null;
}

function ensureExecutableMode(filePath) {
  if (process.platform === 'win32') return;
  try {
    fs.chmodSync(filePath, 0o755);
  } catch {}
}

function getCacheMetaPath(cacheRuntimeDir) {
  return path.join(cacheRuntimeDir, CACHE_META_FILE);
}

function readCacheMeta(cacheRuntimeDir) {
  return readJsonSafe(getCacheMetaPath(cacheRuntimeDir));
}

function writeCacheMeta(cacheRuntimeDir, meta) {
  writeJson(getCacheMetaPath(cacheRuntimeDir), meta);
}

function isCachedRuntimeValid(cacheRuntimeDir, platform, arch, version, variant = 'default') {
  const requiredFiles = getRequiredRuntimeFiles(platform);
  const filesOk = requiredFiles.every((fileName) => fs.existsSync(path.join(cacheRuntimeDir, fileName)));
  if (!filesOk) return false;

  const meta = readCacheMeta(cacheRuntimeDir);
  if (!meta) return false;

  const metaVariant = meta.variant || 'default';
  return (
    meta.platform === platform &&
    meta.arch === arch &&
    meta.version === version &&
    metaVariant === variant &&
    meta.sourceType === 'download'
  );
}

function writeManifest(outputDir, manifest) {
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}

function copyRuntimeFromDirectory(sourceDir, targetDir, platform) {
  const copied = [];
  const requiredFiles = getRequiredRuntimeFiles(platform);

  for (const fileName of requiredFiles) {
    const sourcePath = path.join(sourceDir, fileName);
    const targetPath = path.join(targetDir, fileName);
    copyFileSafe(sourcePath, targetPath);
    ensureExecutableMode(targetPath);
    copied.push(fileName);
  }

  return copied;
}

function downloadRuntimeIntoCache(cacheRuntimeDir, platform, arch, version, variant = 'default') {
  const assetName = getPlatformAsset(platform, arch, variant);
  if (!assetName) {
    throw new Error(`Unsupported bun runtime target: ${platform}-${arch} (variant: ${variant})`);
  }

  const downloadUrl = getDownloadUrl(assetName, version);
  const expectedSha256 = loadExpectedShaForAsset(version, assetName);
  const tempRoot = path.join(os.tmpdir(), 'wayland-bundled-bun', version, `${platform}-${arch}-${variant}`);
  const tempZipPath = path.join(tempRoot, assetName);
  const extractedDir = path.join(tempRoot, 'extracted');

  removeDirectorySafe(tempRoot);
  ensureDirectory(tempRoot);

  downloadFile(downloadUrl, tempZipPath);
  verifyArchiveChecksum(tempZipPath, expectedSha256, assetName, version);
  extractZip(tempZipPath, extractedDir);

  const runtimeFiles = getRequiredRuntimeFiles(platform);
  const runtimeDir = findRuntimeDirectory(extractedDir, runtimeFiles);
  if (!runtimeDir) {
    throw new Error(`Downloaded bun archive does not contain expected files: ${runtimeFiles.join(', ')}`);
  }

  removeDirectorySafe(cacheRuntimeDir);
  ensureDirectory(cacheRuntimeDir);
  const copied = copyRuntimeFromDirectory(runtimeDir, cacheRuntimeDir, platform);

  const cacheMeta = {
    platform,
    arch,
    version,
    variant,
    sourceType: 'download',
    source: {
      url: downloadUrl,
      asset: assetName,
      sha256: expectedSha256,
    },
    updatedAt: new Date().toISOString(),
  };
  writeCacheMeta(cacheRuntimeDir, cacheMeta);

  removeDirectorySafe(tempRoot);

  return {
    sourceType: 'download',
    source: cacheMeta.source,
    files: copied,
    cacheMeta,
  };
}

function prepareVariant(projectRoot, platform, arch, runtimeVersion, variant) {
  const cacheRootDir = getCacheRootDir();
  const runtimeKey = `${platform}-${arch}`;
  const variantSuffix = variant === 'baseline' ? '-baseline' : '';
  const targetDir = path.join(projectRoot, 'resources', 'bundled-bun', `${runtimeKey}${variantSuffix}`);
  const cacheRuntimeDir = path.join(cacheRootDir, runtimeVersion, `${runtimeKey}${variantSuffix}`);

  removeDirectorySafe(targetDir);
  ensureDirectory(targetDir);
  ensureDirectory(cacheRuntimeDir);

  let prepareResult = null;
  let cacheMeta = null;

  if (isCachedRuntimeValid(cacheRuntimeDir, platform, arch, runtimeVersion, variant)) {
    cacheMeta = readCacheMeta(cacheRuntimeDir);
    prepareResult = {
      sourceType: 'cache',
      source: {
        dir: cacheRuntimeDir,
        origin: cacheMeta?.source || {},
      },
      files: copyRuntimeFromDirectory(cacheRuntimeDir, targetDir, platform),
    };
  } else {
    const downloadResult = downloadRuntimeIntoCache(cacheRuntimeDir, platform, arch, runtimeVersion, variant);
    cacheMeta = downloadResult.cacheMeta;
    prepareResult = {
      sourceType: downloadResult.sourceType,
      source: downloadResult.source,
      files: copyRuntimeFromDirectory(cacheRuntimeDir, targetDir, platform),
    };
  }

  const manifest = {
    platform,
    arch,
    variant,
    version: runtimeVersion,
    generatedAt: new Date().toISOString(),
    sourceType: prepareResult.sourceType,
    cacheDir: cacheRuntimeDir,
    cacheMeta,
    source: prepareResult.source,
    files: prepareResult.files,
    skipped: false,
  };

  writeManifest(targetDir, manifest);
  console.log(
    `Bundled bun runtime prepared: ${path.relative(projectRoot, targetDir)} (${prepareResult.files.join(', ')}) [variant=${variant}, source=${prepareResult.sourceType}]`
  );

  return { prepared: true, dir: targetDir, files: prepareResult.files, sourceType: prepareResult.sourceType };
}

function prepareBundledBun() {
  const projectRoot = path.resolve(__dirname, '..');
  const platform = process.platform;
  const arch = process.env.npm_config_target_arch || process.arch;
  const runtimeKey = `${platform}-${arch}`;
  const runtimeVersion = getRuntimeVersion();

  console.log(`Preparing bundled bun for ${runtimeKey} (version: ${runtimeVersion})`);

  try {
    const result = prepareVariant(projectRoot, platform, arch, runtimeVersion, 'default');

    if (needsBaselineVariant(platform, arch)) {
      console.log(`Preparing baseline variant for ${runtimeKey} (AVX2-free fallback)`);
      prepareVariant(projectRoot, platform, arch, runtimeVersion, 'baseline');
    }

    return result;
  } catch (error) {
    const targetDir = path.join(projectRoot, 'resources', 'bundled-bun', runtimeKey);
    const cacheRuntimeDir = path.join(getCacheRootDir(), runtimeVersion, runtimeKey);

    ensureDirectory(targetDir);
    const manifest = {
      platform,
      arch,
      variant: 'default',
      version: runtimeVersion,
      generatedAt: new Date().toISOString(),
      sourceType: 'none',
      cacheDir: cacheRuntimeDir,
      source: {},
      files: [],
      skipped: true,
      reason: error instanceof Error ? error.message : String(error),
    };

    writeManifest(targetDir, manifest);
    console.warn(`Failed to prepare bundled bun runtime: ${manifest.reason}`);
    return { prepared: false, reason: 'error' };
  }
}

module.exports = prepareBundledBun;
