/**
 * verify-packaged-resources.js
 *
 * Fail-hard gate run AFTER electron-builder packaging. Asserts that every
 * bundled resource that the running app needs is physically present inside the
 * packaged output. Exists because electron-builder SILENTLY skips any
 * `extraResources` whose source folder is absent at pack time (exit 0, no
 * warning) - which is exactly how 0.11.4/0.11.5 shipped with the entire
 * skills-library + bundled-workflows missing, breaking all skills and
 * workflows for every user.
 *
 * CRITICAL entries abort the build (exit 1) when missing - the app is broken
 * without them. OPTIONAL entries only warn (degraded feature, app still works).
 *
 * Usage:
 *   node scripts/verify-packaged-resources.js [--out <dir>]
 *     --wcore-runtime <platform-arch> [--wcore-runtime ...]
 *     --wnano-runtime <platform-arch> [--wnano-runtime ...]
 *     --officecli-runtime <platform-arch> [--officecli-runtime ...]
 *   (defaults to ./out, electron-builder's directories.output)
 *
 * Locates the unpacked app Resources dir under <out> across mac/win/linux
 * layouts and checks each entry there.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const prepareWaylandCore = require('./prepareWaylandCore');
const prepareWaylandNano = require('./prepareWaylandNano');
const prepareOfficeCli = require('./prepareOfficeCli');
const bundledBunShasums = require('./bundled-bun-shasums.json');
const bundledBunBinaries = require('./bundled-bun-binaries.json');
const signalPinnedRelease = require('./signal-cli-pinned-release.json');
const voiceModelPinnedRelease = require('./voice-model-pinned-release.json');
const modelsDevSnapshotPin = require('./modelsdev-snapshot-pin.json');
const whatsappBridgeSource = require('./whatsapp-bridge-source.json');
const { verifyCapabilitySeal } = require('./capability-seal/verifyCandidateCapabilitySeal');
const { CONTRACT: PUBLISHER_CONTRACT, selectPolicy } = require('./supply-chain/verifyPublisherAttestation');

const TAG = '[verify-packaged-resources]';

// resource path (relative to the app Resources dir) -> {critical, kind}
// kind 'file' = must exist and be non-empty; 'dir' = must exist and be non-empty.
const REQUIRED = [
  { rel: 'capability-seal.json', critical: true, kind: 'capability-seal' },
  { rel: 'skills-library', critical: true, kind: 'skill-pack' },
  { rel: 'bundled-workflows', critical: true, kind: 'skill-pack' },
  { rel: 'bundled-wayland-core', critical: true, kind: 'wcore-bundle' },
  { rel: 'bundled-wayland-nano', critical: true, kind: 'wnano-bundle' },
  { rel: 'bundled-officecli', critical: true, kind: 'officecli-bundle' },
  {
    rel: 'managed-cli-shims/officecli',
    critical: true,
    kind: 'hashed-file',
    posixExecutable: true,
    size: 139,
    sha256: 'b77af087b9ce061bd26957e387b6dc56491ef894409e52317d11692a63ac327f',
  },
  {
    rel: 'managed-cli-shims/officecli.cmd',
    critical: true,
    kind: 'hashed-file',
    size: 141,
    sha256: '268a4892123162e5264b7f31d6d0ac659b64960e588c808445f39898e7e81055',
  },
  { rel: 'bundled-constitution-fs', critical: true, kind: 'constitution-fs-bundle' },
  {
    rel: 'classic-recovery-tools/win/arm64/7za.exe',
    critical: true,
    kind: 'hashed-file',
    size: 1089024,
    sha256: '81f67048b7366870e5d49f00a8c570570c6a0dd11c05df7a09a8c52870cc83bd',
  },
  {
    rel: 'classic-recovery-tools/win/x64/7za.exe',
    critical: true,
    kind: 'hashed-file',
    size: 1231360,
    sha256: 'b0cfdeaf429f5cc53f85123dd8f5a5feb92c19d31aa34df257edf9a26be05f95',
  },
  { rel: 'bundled-bun', critical: true, kind: 'bun-bundle' },
  { rel: 'modelsdev-snapshot.json', critical: true, kind: 'models-snapshot' },
  { rel: 'voice-models', critical: true, kind: 'voice-bundle' },
  // Degradable features - warn loudly but do not block the release.
  { rel: 'hub', critical: false, kind: 'hub-bundle' },
  { rel: 'whatsapp-bridge', critical: false, kind: 'whatsapp-bundle' },
  { rel: 'signal-cli-runtime', critical: false, kind: 'signal-bundle' },
];

const VOICE_MODEL_FILES = Object.keys(voiceModelPinnedRelease.files);

function parseSingleArg(argv, flag, required = true) {
  const values = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === flag) values.push(argv[index + 1]);
  }
  if (values.length > 1) throw new Error(`${TAG} ${flag} must be declared exactly once`);
  if (required && (!values[0] || values[0].startsWith('--'))) {
    throw new Error(`${TAG} ${flag} is required`);
  }
  return values[0] || null;
}

function parseTarget(argv) {
  const platform = parseSingleArg(argv, '--target-platform');
  const arch = parseSingleArg(argv, '--target-arch');
  if (!['darwin', 'linux', 'win32'].includes(platform)) {
    throw new Error(`${TAG} unsupported --target-platform: ${platform}`);
  }
  if (!['x64', 'arm64'].includes(arch)) throw new Error(`${TAG} unsupported --target-arch: ${arch}`);
  return { platform, arch };
}

function inspectExecutable(filePath) {
  const fd = fs.openSync(filePath, 'r');
  let bytes;
  try {
    bytes = Buffer.alloc(4096);
    bytes = bytes.subarray(0, fs.readSync(fd, bytes, 0, bytes.length, 0));
  } finally {
    fs.closeSync(fd);
  }
  if (bytes.length >= 8) {
    const magicLe = bytes.readUInt32LE(0);
    const magicBe = bytes.readUInt32BE(0);
    if (magicLe === 0xfeedfacf || magicLe === 0xfeedface) {
      const cpu = bytes.readUInt32LE(4);
      if (cpu === 0x01000007) return { platform: 'darwin', arch: 'x64' };
      if (cpu === 0x0100000c) return { platform: 'darwin', arch: 'arm64' };
    }
    if (magicBe === 0xfeedfacf || magicBe === 0xfeedface) {
      const cpu = bytes.readUInt32BE(4);
      if (cpu === 0x01000007) return { platform: 'darwin', arch: 'x64' };
      if (cpu === 0x0100000c) return { platform: 'darwin', arch: 'arm64' };
    }
  }
  if (bytes.length >= 64 && bytes[0] === 0x4d && bytes[1] === 0x5a) {
    const peOffset = bytes.readUInt32LE(0x3c);
    if (peOffset + 6 <= bytes.length && bytes.toString('ascii', peOffset, peOffset + 4) === 'PE\0\0') {
      const machine = bytes.readUInt16LE(peOffset + 4);
      if (machine === 0x8664) return { platform: 'win32', arch: 'x64' };
      if (machine === 0xaa64) return { platform: 'win32', arch: 'arm64' };
    }
  }
  if (bytes.length >= 20 && bytes.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))) {
    const machine = bytes[5] === 2 ? bytes.readUInt16BE(18) : bytes.readUInt16LE(18);
    if (machine === 62) return { platform: 'linux', arch: 'x64' };
    if (machine === 183) return { platform: 'linux', arch: 'arm64' };
  }
  return null;
}

function loadConstitutionFsAuthority() {
  const authoritySource = fs.readFileSync(
    path.resolve(__dirname, '..', 'src', 'process', 'services', 'constitution', 'constitutionFsAuthority.generated.ts'),
    'utf8'
  );
  const match = authoritySource.match(/^\/\/ constitution-fs-authority-json:(\{[^\r\n]+\})$/m);
  return match ? JSON.parse(match[1]) : null;
}

function verifyConstitutionFsBundle(
  bundleRoot,
  targetPlatform,
  targetArch,
  authority,
  verifyDarwinSignature = (binaryPath) =>
    execFileSync('/usr/bin/codesign', ['--verify', '--strict', binaryPath], { stdio: 'pipe' })
) {
  if (targetPlatform === 'win32') return !fs.existsSync(bundleRoot);
  const runtime = `${targetPlatform}-${targetArch}`;
  const entries = fs.readdirSync(bundleRoot, { withFileTypes: true });
  if (entries.length !== 1 || !entries[0].isDirectory() || entries[0].name !== runtime) return false;
  const runtimeRoot = path.join(bundleRoot, runtime);
  const manifestPath = path.join(runtimeRoot, 'manifest.json');
  const packageAuthorityPath = path.join(runtimeRoot, 'package-authority.json');
  const binaryPath = path.join(runtimeRoot, 'wayland-constitution-fs');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const packageAuthority = JSON.parse(fs.readFileSync(packageAuthorityPath, 'utf8'));
  if (authority && JSON.stringify(authority) !== JSON.stringify(packageAuthority)) return false;
  authority = packageAuthority;
  if (!authority) return false;
  const bytes = fs.readFileSync(binaryPath);
  const digest = `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
  if (
    JSON.stringify(Object.keys(manifest).sort()) !==
      JSON.stringify(['arch', 'binary', 'platform', 'protocolVersion', 'schemaVersion']) ||
    manifest.schemaVersion !== 1 ||
    manifest.protocolVersion !== 2 ||
    manifest.platform !== targetPlatform ||
    manifest.arch !== targetArch ||
    manifest.binary.fileName !== 'wayland-constitution-fs' ||
    manifest.binary.sha256 !== digest ||
    manifest.binary.size !== bytes.length ||
    authority.supported !== true ||
    authority.protocolVersion !== 2 ||
    authority.platform !== targetPlatform ||
    authority.arch !== targetArch ||
    authority.sha256 !== digest ||
    authority.size !== bytes.length ||
    authority.fileName !== manifest.binary.fileName
  )
    return false;
  const identity = inspectExecutable(binaryPath);
  if (identity?.platform !== targetPlatform || identity?.arch !== targetArch) return false;
  if (targetPlatform === 'darwin') {
    verifyDarwinSignature(binaryPath);
  }
  return true;
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(filePath, 'r');
  const chunk = Buffer.alloc(1024 * 1024);
  try {
    let bytesRead;
    do {
      bytesRead = fs.readSync(fd, chunk, 0, chunk.length, null);
      if (bytesRead > 0) hash.update(chunk.subarray(0, bytesRead));
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

function candidateFingerprint(candidate) {
  const stat = fs.statSync(candidate.executablePath);
  return `${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeMs}`;
}

function findPackagedCandidates(outDir) {
  const candidates = [];
  if (!fs.existsSync(outDir)) return candidates;
  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(outDir, entry.name);
    for (const sub of fs.readdirSync(dir, { withFileTypes: true }).filter((item) => item.isDirectory())) {
      if (!sub.name.endsWith('.app')) continue;
      const appDir = path.join(dir, sub.name);
      const macosDir = path.join(appDir, 'Contents', 'MacOS');
      const resourceDir = path.join(appDir, 'Contents', 'Resources');
      if (!fs.existsSync(macosDir) || !fs.existsSync(resourceDir)) continue;
      const executables = fs
        .readdirSync(macosDir, { withFileTypes: true })
        .filter((item) => item.isFile())
        .map((item) => path.join(macosDir, item.name))
        .filter((item) => inspectExecutable(item)?.platform === 'darwin');
      if (executables.length !== 1) continue;
      const executablePath = executables[0];
      candidates.push({ appDir, resourceDir, executablePath, ...inspectExecutable(executablePath) });
    }
    if (!entry.name.endsWith('-unpacked')) continue;
    const resourceDir = path.join(dir, 'resources');
    if (!fs.existsSync(resourceDir)) continue;
    const executables = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((item) => item.isFile())
      .map((item) => path.join(dir, item.name))
      .map((executablePath) => ({ executablePath, identity: inspectExecutable(executablePath) }))
      .filter(({ executablePath, identity }) => {
        if (!identity) return false;
        const name = path.basename(executablePath).toLowerCase();
        return identity.platform === 'win32'
          ? /^wayland(?: preview)?\.exe$/.test(name)
          : /^wayland(?:-preview)?$/.test(name);
      });
    for (const { executablePath, identity } of executables) {
      candidates.push({ appDir: dir, resourceDir, executablePath, ...identity });
    }
  }
  return candidates;
}

function snapshotPackagedTargets(outDir) {
  return new Map(
    findPackagedCandidates(outDir).map((candidate) => [candidate.appDir, candidateFingerprint(candidate)])
  );
}

function resolvePackagedTarget(outDir, platform, arch, options = {}) {
  const allCandidates = findPackagedCandidates(outDir);
  const platformCandidates = allCandidates.filter((candidate) => candidate.platform === platform);
  const targetCandidates = platformCandidates.filter((candidate) => candidate.arch === arch);
  const snapshot = options.previousSnapshot;
  const currentCandidates = snapshot
    ? targetCandidates.filter((candidate) => snapshot.get(candidate.appDir) !== candidateFingerprint(candidate))
    : targetCandidates;
  if (currentCandidates.length !== 1) {
    const inventory = platformCandidates.map(
      (candidate) => `${candidate.appDir} (${candidate.platform}-${candidate.arch})`
    );
    throw new Error(
      `${TAG} expected exactly one current ${platform}-${arch} packaged app under ${outDir}; ` +
        `found ${currentCandidates.length}. Inventory: ${inventory.join(', ') || '<empty>'}`
    );
  }
  return currentCandidates[0];
}

function assertOwnedResourcePair(executablePath, resourceDir, platform) {
  const executable = path.resolve(executablePath);
  const resources = path.resolve(resourceDir);
  if (!fs.lstatSync(executable).isFile() || !fs.lstatSync(resources).isDirectory()) {
    throw new Error(`${TAG} packaged executable/resources must be regular, existing paths`);
  }
  let expectedResources;
  if (platform === 'darwin') {
    const macosDir = path.dirname(executable);
    const contentsDir = path.dirname(macosDir);
    const appDir = path.dirname(contentsDir);
    if (path.basename(macosDir) !== 'MacOS' || path.basename(contentsDir) !== 'Contents' || !appDir.endsWith('.app')) {
      throw new Error(`${TAG} malformed macOS app executable path: ${executable}`);
    }
    expectedResources = path.join(contentsDir, 'Resources');
  } else {
    expectedResources = path.join(path.dirname(executable), 'resources');
  }
  if (resources !== expectedResources) {
    throw new Error(`${TAG} --resources-dir does not belong to --app-executable: ${resources}`);
  }
  const realExecutable = fs.realpathSync(executable);
  const realResources = fs.realpathSync(resources);
  const realExpectedResources =
    platform === 'darwin'
      ? path.join(path.dirname(path.dirname(realExecutable)), 'Resources')
      : path.join(path.dirname(realExecutable), 'resources');
  if (realResources !== realExpectedResources) {
    throw new Error(`${TAG} packaged executable/resources may not cross symlink-owned trees`);
  }
}

function parseOutDir(argv, cwd) {
  const i = argv.indexOf('--out');
  const raw = i !== -1 ? argv[i + 1] : 'out';
  return path.resolve(cwd, raw);
}

function parseRequiredRuntimes(argv, flag, label) {
  const runtimes = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== flag) continue;
    const runtime = argv[index + 1];
    if (!/^(darwin|linux|win32)-(x64|arm64)$/.test(runtime || '')) {
      throw new Error(`${TAG} invalid or missing ${flag} value: ${runtime || '<missing>'}`);
    }
    runtimes.push(runtime);
    index += 1;
  }
  if (runtimes.length === 0) {
    throw new Error(`${TAG} at least one ${flag} is required; ${label} target identity must never be inferred`);
  }
  return [...new Set(runtimes)].sort();
}

function verifyWCoreRuntime(bundleDir, runtimeKey, authority = prepareWaylandCore) {
  const [platform, arch] = runtimeKey.split('-');
  const binaryName = platform === 'win32' ? 'wayland-core.exe' : 'wayland-core';
  const runtimeDir = path.join(bundleDir, runtimeKey);
  const manifestPath = path.join(runtimeDir, 'manifest.json');
  const binaryPath = path.join(runtimeDir, binaryName);
  if (!isNonEmpty(manifestPath, 'file') || !isNonEmpty(binaryPath, 'file')) return false;
  const runtimeEntries = fs.readdirSync(runtimeDir, { withFileTypes: true });
  const expectedRuntimeFiles = [binaryName, 'manifest.json'].sort();
  if (
    JSON.stringify(runtimeEntries.map((entry) => entry.name).sort()) !== JSON.stringify(expectedRuntimeFiles) ||
    runtimeEntries.some((entry) => !entry.isFile())
  ) {
    return false;
  }

  const metadata = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const releaseTag = authority.DEFAULT_WCORE_VERSION;
  const assetName = authority.getAssetName(platform, arch, releaseTag);
  if (!assetName) return false;
  const expected = authority.loadExpectedProvenance(releaseTag, assetName, { requireBinary: true });
  const actualBinarySha256 = sha256File(binaryPath);
  const manifestArchiveSha256 = String(metadata.source?.archiveSha256 || '')
    .replace(/^sha256:/i, '')
    .toLowerCase();
  const manifestBinarySha256 = String(metadata.binary?.sha256 || '')
    .replace(/^sha256:/i, '')
    .toLowerCase();
  const expectedUrl = `https://github.com/FerroxLabs/wayland-core/releases/download/${releaseTag}/${assetName}`;
  const publisher = metadata.publisherAttestation;
  const publisherPolicy = selectPolicy(releaseTag);
  const publisherVerified =
    publisher?.contract === PUBLISHER_CONTRACT &&
    publisher?.policyId === publisherPolicy.id &&
    publisher?.repository === publisherPolicy.repository &&
    publisher?.signerWorkflow === publisherPolicy.signerWorkflow &&
    publisher?.sourceRef === publisherPolicy.sourceRef &&
    publisher?.sourceDigest === publisherPolicy.sourceDigest &&
    publisher?.predicateType === publisherPolicy.predicateType &&
    publisher?.runner === publisherPolicy.runner &&
    publisher?.asset === assetName &&
    publisher?.sha256 === `sha256:${expected.archiveSha256}` &&
    publisher?.verified === true;

  return (
    metadata.contract === authority.BUNDLE_CONTRACT &&
    metadata.generator === authority.BUNDLE_GENERATOR &&
    metadata.platform === platform &&
    metadata.arch === arch &&
    metadata.releaseTag === releaseTag &&
    metadata.version === releaseTag &&
    ['download', 'verified-cache'].includes(metadata.sourceType) &&
    metadata.verified === true &&
    publisherVerified &&
    metadata.skipped === false &&
    metadata.source?.owner === 'FerroxLabs' &&
    metadata.source?.repository === 'wayland-core' &&
    metadata.source?.url === expectedUrl &&
    metadata.source?.asset === assetName &&
    manifestArchiveSha256 === expected.archiveSha256 &&
    metadata.binary?.name === binaryName &&
    manifestBinarySha256 === expected.binarySha256 &&
    actualBinarySha256 === expected.binarySha256 &&
    JSON.stringify(metadata.files) === JSON.stringify([binaryName])
  );
}

function verifyWCoreBundle(bundleDir, requiredRuntimes, authority = prepareWaylandCore) {
  if (!fs.statSync(bundleDir).isDirectory()) return false;
  const entries = fs.readdirSync(bundleDir, { withFileTypes: true });
  if (entries.length === 0) return false;
  if (entries.some((entry) => !entry.isDirectory() || !/^(darwin|linux|win32)-(x64|arm64)$/.test(entry.name))) {
    return false;
  }
  const packagedRuntimes = entries.map((entry) => entry.name).sort();
  if (JSON.stringify(packagedRuntimes) !== JSON.stringify([...requiredRuntimes].sort())) return false;
  return packagedRuntimes.every((runtime) => verifyWCoreRuntime(bundleDir, runtime, authority));
}

// Mirrors verifyWCoreRuntime for the bundled wayland-nano agent. The policy
// selector is injectable because, unlike wayland-core, the first
// FerroxLabs/wayland-nano publisher-attestation policy only exists once the
// first signed release lands - tests substitute their own until then.
function verifyWNanoRuntime(bundleDir, runtimeKey, authority = prepareWaylandNano, policySelector = selectPolicy) {
  const [platform, arch] = runtimeKey.split('-');
  const binaryName = platform === 'win32' ? 'wayland-nano.exe' : 'wayland-nano';
  const runtimeDir = path.join(bundleDir, runtimeKey);
  const manifestPath = path.join(runtimeDir, 'manifest.json');
  const binaryPath = path.join(runtimeDir, binaryName);
  if (!isNonEmpty(manifestPath, 'file') || !isNonEmpty(binaryPath, 'file')) return false;
  const runtimeEntries = fs.readdirSync(runtimeDir, { withFileTypes: true });
  const expectedRuntimeFiles = [binaryName, 'manifest.json'].sort();
  if (
    JSON.stringify(runtimeEntries.map((entry) => entry.name).sort()) !== JSON.stringify(expectedRuntimeFiles) ||
    runtimeEntries.some((entry) => !entry.isFile())
  ) {
    return false;
  }

  const metadata = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const releaseTag = authority.DEFAULT_WNANO_VERSION;
  const assetName = authority.getAssetName(platform, arch, releaseTag);
  if (!assetName) return false;
  const expected = authority.loadExpectedProvenance(releaseTag, assetName, { requireBinary: true });
  const actualBinarySha256 = sha256File(binaryPath);
  const manifestArchiveSha256 = String(metadata.source?.archiveSha256 || '')
    .replace(/^sha256:/i, '')
    .toLowerCase();
  const manifestBinarySha256 = String(metadata.binary?.sha256 || '')
    .replace(/^sha256:/i, '')
    .toLowerCase();
  const expectedUrl = `https://github.com/FerroxLabs/wayland-nano/releases/download/${releaseTag}/${assetName}`;
  const publisher = metadata.publisherAttestation;
  const publisherPolicy = policySelector(releaseTag);
  const publisherVerified =
    publisher?.contract === PUBLISHER_CONTRACT &&
    publisher?.policyId === publisherPolicy.id &&
    publisher?.repository === publisherPolicy.repository &&
    publisher?.signerWorkflow === publisherPolicy.signerWorkflow &&
    publisher?.sourceRef === publisherPolicy.sourceRef &&
    publisher?.sourceDigest === publisherPolicy.sourceDigest &&
    publisher?.predicateType === publisherPolicy.predicateType &&
    publisher?.runner === publisherPolicy.runner &&
    publisher?.asset === assetName &&
    publisher?.sha256 === `sha256:${expected.archiveSha256}` &&
    publisher?.verified === true;

  return (
    metadata.contract === authority.BUNDLE_CONTRACT &&
    metadata.generator === authority.BUNDLE_GENERATOR &&
    metadata.platform === platform &&
    metadata.arch === arch &&
    metadata.releaseTag === releaseTag &&
    metadata.version === releaseTag &&
    ['download', 'verified-cache'].includes(metadata.sourceType) &&
    metadata.verified === true &&
    publisherVerified &&
    metadata.skipped === false &&
    metadata.source?.owner === 'FerroxLabs' &&
    metadata.source?.repository === 'wayland-nano' &&
    metadata.source?.url === expectedUrl &&
    metadata.source?.asset === assetName &&
    manifestArchiveSha256 === expected.archiveSha256 &&
    metadata.binary?.name === binaryName &&
    manifestBinarySha256 === expected.binarySha256 &&
    actualBinarySha256 === expected.binarySha256 &&
    JSON.stringify(metadata.files) === JSON.stringify([binaryName])
  );
}

function verifyWNanoBundle(bundleDir, requiredRuntimes, authority = prepareWaylandNano, policySelector = selectPolicy) {
  if (!fs.statSync(bundleDir).isDirectory()) return false;
  const entries = fs.readdirSync(bundleDir, { withFileTypes: true });
  if (entries.length === 0) return false;
  if (entries.some((entry) => !entry.isDirectory() || !/^(darwin|linux|win32)-(x64|arm64)$/.test(entry.name))) {
    return false;
  }
  const packagedRuntimes = entries.map((entry) => entry.name).sort();
  if (JSON.stringify(packagedRuntimes) !== JSON.stringify([...requiredRuntimes].sort())) return false;
  return packagedRuntimes.every((runtime) => verifyWNanoRuntime(bundleDir, runtime, authority, policySelector));
}

function hasNonHiddenRegularFile(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const target = path.join(dir, entry.name);
    if (entry.isFile()) return fs.statSync(target).size > 0;
    if (entry.isDirectory() && hasNonHiddenRegularFile(target)) return true;
  }
  return false;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listRelativeFiles(root, current = root, found = []) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) listRelativeFiles(root, target, found);
    else if (entry.isFile()) found.push(path.relative(root, target).replace(/\\/g, '/'));
    else found.push(`!non-file:${path.relative(root, target).replace(/\\/g, '/')}`);
  }
  return found.sort();
}

const WHATSAPP_OMITTED_EMPTY_PLACEHOLDERS = ['node_modules/tr46/lib/.gitkeep'];

function validateOmittedEmptyPlaceholders(sourceDir, bundleDir) {
  for (const relative of WHATSAPP_OMITTED_EMPTY_PLACEHOLDERS) {
    const source = path.join(sourceDir, relative);
    const bundled = path.join(bundleDir, relative);
    if (!fs.existsSync(source)) continue;
    const stat = fs.lstatSync(source);
    if (!stat.isFile() || stat.size !== 0) return false;
    if (fs.existsSync(bundled)) {
      const bundledStat = fs.lstatSync(bundled);
      if (!bundledStat.isFile() || bundledStat.size !== 0) return false;
    }
  }
  return true;
}

function sourceInventory(root, current = root, inventory = [], ignoredPaths = new Set()) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const target = path.join(current, entry.name);
    const relative = path.relative(root, target).replace(/\\/g, '/');
    if (ignoredPaths.has(relative)) continue;
    if (entry.isDirectory()) {
      inventory.push(`dir:${relative}`);
      if (sourceInventory(root, target, inventory, ignoredPaths) === null) return null;
    } else if (entry.isFile()) {
      inventory.push(`file:${relative}:${fs.statSync(target).size}:${sha256File(target)}`);
    } else if (entry.isSymbolicLink()) {
      const linkTarget = fs.readlinkSync(target);
      const resolved = path.resolve(path.dirname(target), linkTarget);
      const rootPrefix = `${path.resolve(root)}${path.sep}`;
      if (resolved !== path.resolve(root) && !resolved.startsWith(rootPrefix)) return null;
      inventory.push(`link:${relative}:${linkTarget}`);
    } else {
      return null;
    }
  }
  return inventory.sort();
}

function listNativeIdentities(root, identities = []) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (listNativeIdentities(target, identities) === null) return null;
    } else if (entry.isFile()) {
      const identity = inspectExecutable(target);
      if (/\.(?:node|dylib|dll)$|\.so(?:\.|$)/.test(entry.name) && !identity) return null;
      if (identity) identities.push(identity);
    } else {
      return null;
    }
  }
  return identities;
}

function expectedSharpPackages(platform, arch) {
  if (platform === 'darwin') return [`sharp-darwin-${arch}`, `sharp-libvips-darwin-${arch}`];
  // bun's --os/--cpu filters select by platform and architecture but carry no libc
  // dimension, so a linux install always lands both the glibc and the musl builds of
  // sharp. Both are genuine linux/<arch> natives and both still have to satisfy the
  // per-package os, cpu and native-identity assertions below; only the exact-inventory
  // comparison needs to know they are expected.
  if (platform === 'linux')
    return [
      `sharp-linux-${arch}`,
      `sharp-libvips-linux-${arch}`,
      `sharp-linuxmusl-${arch}`,
      `sharp-libvips-linuxmusl-${arch}`,
    ];
  if (platform === 'win32') return [`sharp-win32-${arch}`];
  return [];
}

const WHATSAPP_APPLE_BARE_PACKAGES = ['bare-fs', 'bare-os', 'bare-url'];
const WHATSAPP_APPLE_BARE_RUNTIMES = [
  ['darwin-arm64', 'arm64'],
  ['darwin-x64', 'x64'],
  ['ios-arm64', 'arm64'],
  ['ios-arm64-simulator', 'arm64'],
  ['ios-x64-simulator', 'x64'],
];

function verifyWhatsAppDarwinSignIgnoreInventory(sourceDir, arch) {
  const expected = [
    {
      relative: `node_modules/@img/sharp-darwin-${arch}/lib/sharp-darwin-${arch}.node`,
      arch,
    },
    {
      relative: `node_modules/@img/sharp-libvips-darwin-${arch}/lib/libvips-cpp.8.17.3.dylib`,
      arch,
    },
  ];
  for (const packageName of WHATSAPP_APPLE_BARE_PACKAGES) {
    for (const [runtime, runtimeArch] of WHATSAPP_APPLE_BARE_RUNTIMES) {
      expected.push({
        relative: `node_modules/${packageName}/prebuilds/${runtime}/${packageName}.bare`,
        arch: runtimeArch,
      });
    }
  }

  const actual = [];
  const sharpRoot = path.join(sourceDir, 'node_modules', '@img');
  for (const packageName of expectedSharpPackages('darwin', arch)) {
    const packageRoot = path.join(sharpRoot, packageName);
    if (!fs.existsSync(packageRoot)) return false;
    const inventory = sourceInventory(packageRoot);
    if (inventory === null) return false;
    for (const item of inventory) {
      const match = item.match(/^file:([^:]+):/);
      if (match && /\.(?:node|dylib)$/.test(match[1])) {
        actual.push(path.posix.join('node_modules', '@img', packageName, match[1]));
      }
    }
  }
  for (const packageName of WHATSAPP_APPLE_BARE_PACKAGES) {
    const prebuilds = path.join(sourceDir, 'node_modules', packageName, 'prebuilds');
    if (!fs.existsSync(prebuilds)) return false;
    for (const [runtime] of WHATSAPP_APPLE_BARE_RUNTIMES) {
      const runtimeDir = path.join(prebuilds, runtime);
      if (!fs.existsSync(runtimeDir) || !fs.lstatSync(runtimeDir).isDirectory()) return false;
      for (const entry of fs.readdirSync(runtimeDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.bare')) return false;
        actual.push(path.posix.join('node_modules', packageName, 'prebuilds', runtime, entry.name));
      }
    }
  }

  const expectedPaths = expected.map(({ relative }) => relative).sort();
  if (JSON.stringify(actual.sort()) !== JSON.stringify(expectedPaths)) return false;
  return expected.every(({ relative, arch: expectedArch }) => {
    const identity = inspectExecutable(path.join(sourceDir, ...relative.split('/')));
    return identity?.platform === 'darwin' && identity.arch === expectedArch;
  });
}

function verifyWhatsAppNativeTarget(sourceDir, platform, arch) {
  if (!['darwin', 'linux', 'win32'].includes(platform) || !['arm64', 'x64'].includes(arch)) return false;
  const imageRoot = path.join(sourceDir, 'node_modules', '@img');
  if (!fs.existsSync(imageRoot)) return true;
  if (!fs.lstatSync(imageRoot).isDirectory()) return false;
  const expected = expectedSharpPackages(platform, arch).sort();
  const installed = fs
    .readdirSync(imageRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('sharp-') && entry.name !== 'sharp-colour')
    .map((entry) => entry.name)
    .sort();
  if (installed.length === 0) return true;
  if (JSON.stringify(installed) !== JSON.stringify(expected)) return false;
  for (const packageName of expected) {
    const packageRoot = path.join(imageRoot, packageName);
    const metadata = readJson(path.join(packageRoot, 'package.json'));
    if (
      metadata.name !== `@img/${packageName}` ||
      !Array.isArray(metadata.os) ||
      !metadata.os.includes(platform) ||
      !Array.isArray(metadata.cpu) ||
      !metadata.cpu.includes(arch)
    ) {
      return false;
    }
    const identities = listNativeIdentities(packageRoot);
    if (
      identities === null ||
      identities.length === 0 ||
      identities.some((identity) => identity.platform !== platform || identity.arch !== arch)
    ) {
      return false;
    }
  }
  if (
    platform === 'darwin' &&
    WHATSAPP_APPLE_BARE_PACKAGES.some((name) => fs.existsSync(path.join(sourceDir, 'node_modules', name)))
  ) {
    return verifyWhatsAppDarwinSignIgnoreInventory(sourceDir, arch);
  }
  return true;
}

function verifyBridgeLock(sourceDir) {
  const packageJson = readJson(path.join(sourceDir, 'package.json'));
  const lock = fs.readFileSync(path.join(sourceDir, 'bun.lock'), 'utf8');
  const dependencyBlock = lock.match(/"dependencies":\s*\{([\s\S]*?)\n\s*\},/);
  if (!dependencyBlock || !packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) return false;
  return Object.entries(packageJson.dependencies).every(([name, range]) => {
    const declared = `${JSON.stringify(name)}: ${JSON.stringify(range)}`;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const integrityEntry = new RegExp(`"${escaped}": \\["${escaped}@[^\\n]+sha512-[A-Za-z0-9+/=]+"\\]`);
    return (
      dependencyBlock[1].includes(declared) &&
      integrityEntry.test(lock) &&
      fs.existsSync(path.join(sourceDir, 'node_modules', ...name.split('/')))
    );
  });
}

function verifySourceMirror(
  bundleDir,
  sourceDir,
  authority = whatsappBridgeSource,
  targetPlatform = process.platform,
  targetArch = process.arch
) {
  if (
    authority.contract !== 'wayland-whatsapp-bridge-source/1.0' ||
    !verifyBridgeLock(sourceDir) ||
    !verifyWhatsAppNativeTarget(sourceDir, targetPlatform, targetArch) ||
    !validateOmittedEmptyPlaceholders(sourceDir, bundleDir)
  )
    return false;
  for (const [relative, expected] of Object.entries(authority.files || {})) {
    const source = path.join(sourceDir, relative);
    if (
      !fs.existsSync(source) ||
      !fs.lstatSync(source).isFile() ||
      fs.statSync(source).size !== expected.size ||
      sha256File(source) !== expected.sha256
    ) {
      return false;
    }
  }
  const ignoredPlaceholders = new Set(
    WHATSAPP_OMITTED_EMPTY_PLACEHOLDERS.filter((relative) => fs.existsSync(path.join(sourceDir, relative)))
  );
  const source = sourceInventory(sourceDir, sourceDir, [], ignoredPlaceholders);
  const bundled = sourceInventory(bundleDir, bundleDir, [], ignoredPlaceholders);
  return source !== null && bundled !== null && JSON.stringify(bundled) === JSON.stringify(source);
}

function verifySkillPack(packDir) {
  const allowed = new Set(['index.json', 'routines.json', 'skill-bodies.bin', 'skill-bodies.offsets.json']);
  const files = listRelativeFiles(packDir);
  if (files.some((file) => !allowed.has(file))) return false;
  if (!['index.json', 'skill-bodies.bin', 'skill-bodies.offsets.json'].every((file) => files.includes(file)))
    return false;
  const index = readJson(path.join(packDir, 'index.json'));
  const offsets = readJson(path.join(packDir, 'skill-bodies.offsets.json'));
  const blobSize = fs.statSync(path.join(packDir, 'skill-bodies.bin')).size;
  if (!Array.isArray(index) || index.length === 0 || offsets?.version !== 1 || !offsets.entries) return false;
  const ranges = Object.values(offsets.entries);
  if (ranges.length === 0) return false;
  const indexPaths = new Set(index.map((entry) => entry?.path).filter((entry) => typeof entry === 'string'));
  if (Object.keys(offsets.entries).some((entry) => !indexPaths.has(entry))) return false;
  const orderedRanges = ranges.toSorted((left, right) => left[0] - right[0]);
  let expectedOffset = 0;
  const valid = orderedRanges.every((range) => {
    const rangeValid =
      Array.isArray(range) &&
      range.length === 2 &&
      Number.isSafeInteger(range[0]) &&
      Number.isSafeInteger(range[1]) &&
      range[0] === expectedOffset &&
      range[1] > 0 &&
      range[0] + range[1] <= blobSize;
    if (rangeValid) expectedOffset += range[1];
    return rangeValid;
  });
  return valid && expectedOffset === blobSize;
}

function verifyBunBundle(bundleDir, targetPlatform, targetArch, authority = bundledBunBinaries) {
  const version = '1.3.14';
  const requiredRuntimeKeys = [`${targetPlatform}-${targetArch}`];
  if (targetArch === 'x64' && ['darwin', 'linux'].includes(targetPlatform)) {
    requiredRuntimeKeys.push(`${targetPlatform}-${targetArch}-baseline`);
  }
  const entries = fs.readdirSync(bundleDir, { withFileTypes: true });
  if (entries.some((entry) => !entry.isDirectory())) return false;
  if (JSON.stringify(entries.map((entry) => entry.name).sort()) !== JSON.stringify(requiredRuntimeKeys.sort()))
    return false;
  return requiredRuntimeKeys.every((runtimeKey) => {
    const isBaseline = runtimeKey.endsWith('-baseline');
    const runtimeDir = path.join(bundleDir, runtimeKey);
    const binaryName = targetPlatform === 'win32' ? 'bun.exe' : 'bun';
    const files = listRelativeFiles(runtimeDir);
    if (JSON.stringify(files) !== JSON.stringify([binaryName, 'manifest.json'].sort())) return false;
    const binaryPath = path.join(runtimeDir, binaryName);
    const identity = inspectExecutable(binaryPath);
    const manifest = readJson(path.join(runtimeDir, 'manifest.json'));
    const assetArch = targetArch === 'arm64' ? 'aarch64' : 'x64';
    const assetPlatform = targetPlatform === 'win32' ? 'windows' : targetPlatform;
    const asset = `bun-${assetPlatform}-${assetArch}${isBaseline ? '-baseline' : ''}.zip`;
    const sourceUrl = `https://github.com/oven-sh/bun/releases/download/bun-v${version}/${asset}`;
    const expectedArchiveSha = String(bundledBunShasums[version]?.[asset] || '').replace(/^sha256:/, '');
    const expectedBinary = authority?.[version]?.[asset];
    const source = manifest.sourceType === 'cache' ? manifest.cacheMeta?.source : manifest.source;
    return (
      authority?.contract === 'wayland-bundled-bun-binaries/1.0' &&
      identity?.platform === targetPlatform &&
      identity?.arch === targetArch &&
      manifest.platform === targetPlatform &&
      manifest.arch === targetArch &&
      manifest.variant === (isBaseline ? 'baseline' : 'default') &&
      manifest.version === version &&
      manifest.skipped === false &&
      ['download', 'cache'].includes(manifest.sourceType) &&
      JSON.stringify(manifest.files) === JSON.stringify([binaryName]) &&
      source?.asset === asset &&
      source?.url === sourceUrl &&
      source?.sha256 === expectedArchiveSha &&
      /^[0-9a-f]{64}$/.test(expectedArchiveSha) &&
      Number.isSafeInteger(expectedBinary?.size) &&
      fs.statSync(binaryPath).size === expectedBinary.size &&
      sha256File(binaryPath) === expectedBinary.sha256 &&
      manifest.binary?.name === binaryName &&
      manifest.binary?.size === expectedBinary.size &&
      manifest.binary?.sha256 === expectedBinary.sha256
    );
  });
}

function verifyVoiceBundle(bundleDir, authority = voiceModelPinnedRelease) {
  const root = path.join(bundleDir, 'whisper-tiny');
  if (!fs.existsSync(root)) return false;
  const expectedFiles = Object.keys(authority.files || {}).sort();
  if (authority.contract !== 'wayland-voice-model-pin/1.0') return false;
  if (!/^[0-9a-f]{40}$/.test(authority.revision || '')) return false;
  if (JSON.stringify(listRelativeFiles(root)) !== JSON.stringify(expectedFiles)) return false;
  for (const relative of expectedFiles) {
    const target = path.join(root, relative);
    const expected = authority.files[relative];
    if (!expected || fs.statSync(target).size !== expected.size || sha256File(target) !== expected.sha256) return false;
    if (relative.endsWith('.json')) readJson(target);
  }
  return true;
}

function verifyModelsSnapshot(filePath, authority = modelsDevSnapshotPin) {
  const stat = fs.statSync(filePath);
  if (
    authority.contract !== 'wayland-modelsdev-snapshot/1.0' ||
    stat.size !== authority.size ||
    sha256File(filePath) !== authority.sha256
  ) {
    return false;
  }
  const snapshot = readJson(filePath);
  if (!snapshot || Array.isArray(snapshot) || typeof snapshot !== 'object') return false;
  const providers = Object.values(snapshot);
  return (
    providers.length > 0 &&
    providers.every((provider) => {
      if (!provider || typeof provider !== 'object' || Array.isArray(provider)) return false;
      if (typeof provider.id !== 'string' || provider.id.length === 0) return false;
      if (!provider.models || typeof provider.models !== 'object' || Array.isArray(provider.models)) return false;
      const models = Object.values(provider.models);
      return (
        models.length > 0 &&
        models.every(
          (model) =>
            model &&
            typeof model === 'object' &&
            !Array.isArray(model) &&
            typeof model.id === 'string' &&
            model.id.length > 0
        )
      );
    })
  );
}

function verifySignalBundle(runtimeDir, targetPlatform, targetArch) {
  const binaryName = targetPlatform === 'win32' ? 'signal-cli.exe' : 'signal-cli';
  const files = listRelativeFiles(runtimeDir);
  if (JSON.stringify(files) !== JSON.stringify([`bin/${binaryName}`, 'bin/manifest.json'].sort())) return false;
  const binaryPath = path.join(runtimeDir, 'bin', binaryName);
  const manifest = readJson(path.join(runtimeDir, 'bin', 'manifest.json'));
  const identity = inspectExecutable(binaryPath);
  const digest = sha256File(binaryPath);
  const mode = fs.statSync(binaryPath).mode;
  return (
    identity?.platform === targetPlatform &&
    identity?.arch === targetArch &&
    (targetPlatform === 'win32' || (mode & 0o111) !== 0) &&
    manifest.contract === 'wayland-signal-cli-bundle/1.0' &&
    targetPlatform === signalPinnedRelease.platform &&
    targetArch === signalPinnedRelease.arch &&
    manifest.platform === signalPinnedRelease.platform &&
    manifest.arch === signalPinnedRelease.arch &&
    manifest.releaseTag === signalPinnedRelease.releaseTag &&
    manifest.source?.owner === 'AsamK' &&
    manifest.source?.repository === 'signal-cli' &&
    manifest.source?.releaseId === signalPinnedRelease.releaseId &&
    manifest.source?.assetId === signalPinnedRelease.assetId &&
    manifest.source?.asset === signalPinnedRelease.asset &&
    manifest.source?.url === signalPinnedRelease.url &&
    manifest.source?.assetDigest === `sha256:${signalPinnedRelease.archiveSha256}` &&
    manifest.source?.archiveSha256 === `sha256:${signalPinnedRelease.archiveSha256}` &&
    manifest.binary?.name === binaryName &&
    manifest.binary?.sha256 === `sha256:${signalPinnedRelease.binarySha256}` &&
    digest === signalPinnedRelease.binarySha256 &&
    manifest.verified === true
  );
}

function isNonEmpty(
  p,
  kind,
  requiredOfficeCliRuntimes = [],
  expected = {},
  requiredWCoreRuntimes = [],
  wcoreAuthority = prepareWaylandCore,
  targetPlatform,
  targetArch,
  voiceAuthority = voiceModelPinnedRelease,
  bunAuthority = bundledBunBinaries,
  modelsAuthority = modelsDevSnapshotPin,
  whatsappSourceDir = path.resolve(__dirname, '..', 'src', 'process', 'channels', 'whatsapp-bridge'),
  whatsappAuthority = whatsappBridgeSource,
  officeCliAuthority = prepareOfficeCli,
  verifyOfficeCliDarwinSignature = (binaryPath) => officeCliAuthority.verifyDarwinPublisherSignature(binaryPath),
  constitutionFsAuthority,
  verifyConstitutionFsDarwinSignature,
  verifyCandidateCapabilitySeal = verifyCapabilitySeal,
  requiredWNanoRuntimes = [],
  wnanoAuthority = prepareWaylandNano,
  wnanoPolicySelector = selectPolicy
) {
  try {
    if (kind === 'constitution-fs-bundle' && targetPlatform === 'win32') {
      return !fs.existsSync(p);
    }
    const st = kind === 'hashed-file' ? fs.lstatSync(p) : fs.statSync(p);
    if (kind === 'file') return st.isFile() && st.size > 0;
    if (kind === 'hashed-file') {
      const executable = !expected.posixExecutable || targetPlatform === 'win32' || (st.mode & 0o111) !== 0;
      return st.isFile() && executable && st.size === expected.size && sha256File(p) === expected.sha256;
    }
    if (kind === 'models-snapshot') return st.isFile() && verifyModelsSnapshot(p, modelsAuthority);
    if (kind === 'capability-seal') {
      if (!st.isFile() || st.size === 0) return false;
      verifyCandidateCapabilitySeal(JSON.parse(fs.readFileSync(p, 'utf8')));
      return true;
    }
    if (!st.isDirectory()) return false;
    if (kind === 'wcore-bundle') {
      return verifyWCoreBundle(p, requiredWCoreRuntimes, wcoreAuthority);
    }
    if (kind === 'wnano-bundle') {
      return verifyWNanoBundle(p, requiredWNanoRuntimes, wnanoAuthority, wnanoPolicySelector);
    }
    if (kind === 'officecli-bundle') {
      const entries = fs.readdirSync(p, { withFileTypes: true });
      if (entries.some((entry) => !entry.isDirectory() || !/^(darwin|linux|win32)-(x64|arm64)$/.test(entry.name))) {
        return false;
      }
      const packagedRuntimes = entries.map((entry) => entry.name).sort();
      if (JSON.stringify(packagedRuntimes) !== JSON.stringify([...requiredOfficeCliRuntimes].sort())) return false;
      return requiredOfficeCliRuntimes.every((runtimeKey) => {
        const runtimeDir = path.join(p, runtimeKey);
        const manifest = path.join(runtimeDir, 'manifest.json');
        const [platform, arch] = runtimeKey.split('-');
        const version = officeCliAuthority.DEFAULT_OFFICECLI_VERSION;
        const asset = officeCliAuthority.getAssetName(platform, arch, 'gnu');
        const binaryName = officeCliAuthority.getBinaryName(platform);
        const binary = path.join(runtimeDir, binaryName);
        if (!isNonEmpty(manifest, 'file') || !isNonEmpty(binary, 'file')) return false;
        const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
        const expectedSha = officeCliAuthority.loadExpectedSha(version, asset);
        const actualSha = sha256File(binary);
        const identity = inspectExecutable(binary);
        const proof = metadata.contractProof;
        const smoke = metadata.smokeProof;
        const publisherSignature = metadata.publisherSignatureProof;
        const executableProof =
          proof?.contract === 'wayland-officecli-authoring/1.0' &&
          ['docx', 'xlsx', 'pptx'].every((format) => smoke?.formats?.includes(format)) &&
          ['create', 'mutate', 'query', 'validate', 'view'].every((operation) =>
            smoke?.operations?.includes(operation)
          ) &&
          [
            'officecli-financial-model',
            'officecli-data-dashboard',
            'officecli-word-form',
            'officecli-pitch-deck',
          ].every((pack) => smoke?.specialistPacks?.includes(pack)) &&
          [
            'formula-evaluation',
            'named-range',
            'data-validation',
            'conditional-formatting',
            'xlsx-chart',
            'structured-content-control',
            'legacy-form-field',
            'document-protection',
            'connected-shapes',
            'speaker-notes',
            'pptx-embedded-chart',
          ].every((primitive) => smoke?.specialistPrimitives?.includes(primitive));
        const crossHostProof =
          proof?.contract === 'not-executable-on-build-host' && smoke?.reason === 'not-executable-on-build-host';
        const expectedPublisherSignature =
          platform === 'darwin' ? verifyOfficeCliDarwinSignature(binary) : publisherSignature;
        return (
          metadata.contract === 'iofficeai-officecli-native' &&
          metadata.version === version &&
          metadata.platform === platform &&
          metadata.arch === arch &&
          metadata.asset === asset &&
          metadata.binary === binaryName &&
          metadata.sha256 === `sha256:${expectedSha}` &&
          identity?.platform === platform &&
          identity?.arch === arch &&
          expectedSha === actualSha &&
          JSON.stringify(publisherSignature) === JSON.stringify(expectedPublisherSignature) &&
          proof?.release === metadata.version &&
          (executableProof || crossHostProof)
        );
      });
    }
    if (kind === 'skill-pack') return verifySkillPack(p);
    if (kind === 'constitution-fs-bundle') {
      return verifyConstitutionFsBundle(
        p,
        targetPlatform,
        targetArch,
        constitutionFsAuthority,
        verifyConstitutionFsDarwinSignature
      );
    }
    if (kind === 'bun-bundle') return verifyBunBundle(p, targetPlatform, targetArch, bunAuthority);
    if (kind === 'voice-bundle') return verifyVoiceBundle(p, voiceAuthority);
    if (kind === 'signal-bundle') return verifySignalBundle(p, targetPlatform, targetArch);
    if (kind === 'hub-bundle') return false;
    if (kind === 'whatsapp-bundle')
      return verifySourceMirror(p, whatsappSourceDir, whatsappAuthority, targetPlatform, targetArch);
    return hasNonHiddenRegularFile(p);
  } catch {
    return false;
  }
}

function verifyPackagedResources(options = {}) {
  const argv = options.argv || process.argv;
  const cwd = options.cwd || process.cwd();
  const logger = options.logger || console;
  const wcoreAuthority = options.wcoreAuthority || prepareWaylandCore;
  const wnanoAuthority = options.wnanoAuthority || prepareWaylandNano;
  const wnanoPolicySelector = options.wnanoPolicySelector || selectPolicy;
  const voiceAuthority = options.voiceAuthority || voiceModelPinnedRelease;
  const bunAuthority = options.bunAuthority || bundledBunBinaries;
  const modelsAuthority = options.modelsAuthority || modelsDevSnapshotPin;
  const officeCliAuthority = options.officeCliAuthority || prepareOfficeCli;
  const verifyOfficeCliDarwinSignature =
    options.verifyOfficeCliDarwinSignature ||
    ((binaryPath) => officeCliAuthority.verifyDarwinPublisherSignature(binaryPath));
  const constitutionFsAuthority = options.constitutionFsAuthority;
  const verifyConstitutionFsDarwinSignature = options.verifyConstitutionFsDarwinSignature;
  const verifyCandidateCapabilitySeal = options.verifyCapabilitySeal || verifyCapabilitySeal;
  const verifyDarwinPackageSignature =
    options.verifyDarwinPackageSignature ||
    ((appDir) => execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', appDir], { stdio: 'pipe' }));
  const whatsappSourceDir =
    options.whatsappSourceDir || path.resolve(__dirname, '..', 'src', 'process', 'channels', 'whatsapp-bridge');
  const whatsappAuthority = options.whatsappAuthority || whatsappBridgeSource;
  const outDir = parseOutDir(argv, cwd);
  const { platform: targetPlatform, arch: targetArch } = parseTarget(argv);
  const requiredOfficeCliRuntimes = parseRequiredRuntimes(argv, '--officecli-runtime', 'OfficeCLI');
  const requiredWCoreRuntimes = parseRequiredRuntimes(argv, '--wcore-runtime', 'wayland-core');
  const requiredWNanoRuntimes = parseRequiredRuntimes(argv, '--wnano-runtime', 'wayland-nano');
  // Local verification builds (`build-with-builder.js` with WAYLAND_LOCAL_VERIFICATION=1
  // + `--dir`) intentionally OMIT the release capability seal. When this flag is set we
  // require the seal to be ABSENT (not present-and-valid) — enforcing omit-not-forge —
  // while every other critical resource + signature check stays fully in force.
  const allowMissingSeal = argv.includes('--allow-missing-seal');
  const expectedRuntime = `${targetPlatform}-${targetArch}`;
  if (
    JSON.stringify(requiredOfficeCliRuntimes) !== JSON.stringify([expectedRuntime]) ||
    JSON.stringify(requiredWCoreRuntimes) !== JSON.stringify([expectedRuntime]) ||
    JSON.stringify(requiredWNanoRuntimes) !== JSON.stringify([expectedRuntime])
  ) {
    throw new Error(`${TAG} Core, Nano and OfficeCLI runtime declarations must exactly match ${expectedRuntime}`);
  }
  const explicitResourceDir = parseSingleArg(argv, '--resources-dir', false);
  const explicitExecutable = parseSingleArg(argv, '--app-executable', false);
  let packagedTarget;
  if (explicitResourceDir || explicitExecutable) {
    if (!explicitResourceDir || !explicitExecutable) {
      throw new Error(`${TAG} --resources-dir and --app-executable must be supplied together`);
    }
    const resourceDir = path.resolve(cwd, explicitResourceDir);
    const executablePath = path.resolve(cwd, explicitExecutable);
    assertOwnedResourcePair(executablePath, resourceDir, targetPlatform);
    const identity = inspectExecutable(executablePath);
    if (identity?.platform !== targetPlatform || identity?.arch !== targetArch) {
      throw new Error(
        `${TAG} packaged executable does not match ${expectedRuntime}: ${executablePath} ` +
          `(detected ${identity ? `${identity.platform}-${identity.arch}` : 'unknown'})`
      );
    }
    const appDir = targetPlatform === 'darwin' ? path.resolve(resourceDir, '..', '..') : path.dirname(resourceDir);
    packagedTarget = { appDir, resourceDir, executablePath, ...identity };
  } else {
    packagedTarget = resolvePackagedTarget(outDir, targetPlatform, targetArch, {
      previousSnapshot: options.previousSnapshot,
    });
  }
  const resourceDirs = [packagedTarget.resourceDir];

  if (targetPlatform === 'darwin') verifyDarwinPackageSignature(packagedTarget.appDir);

  if (resourceDirs.length === 0) {
    throw new Error(
      `${TAG} ERROR: no packaged app Resources dir found under ${outDir} ` +
        `(expected <out>/<mac*>/<App>.app/Contents/Resources or <out>/*-unpacked/resources)`
    );
  }

  let criticalFailures = 0;
  // Name what failed. A gate that says only "1 CRITICAL resource missing" makes
  // a red CI run undiagnosable when the logger is silent (as it is under test),
  // which is exactly how a Windows-only failure here stayed opaque.
  const criticalFailureRels = [];
  let warnings = 0;

  for (const resDir of resourceDirs) {
    logger.log(`${TAG} checking ${resDir}`);
    for (const req of REQUIRED) {
      const target = path.join(resDir, req.rel);
      if (req.kind === 'capability-seal' && allowMissingSeal) {
        // Verification build: the seal MUST be absent. A present seal (stale or
        // manually placed) is a forge risk, so treat its presence as a failure.
        if (fs.existsSync(target)) {
          logger.error(`${TAG}   FAIL ${req.rel}  <-- local verification build must NOT contain a capability seal`);
          criticalFailures += 1;
          criticalFailureRels.push(`${req.rel} (unexpected capability seal)`);
        } else {
          logger.log(`${TAG}   SKIP ${req.rel}  (intentionally omitted - local verification build)`);
        }
        continue;
      }
      const ok = isNonEmpty(
        target,
        req.kind,
        requiredOfficeCliRuntimes,
        req,
        requiredWCoreRuntimes,
        wcoreAuthority,
        targetPlatform,
        targetArch,
        voiceAuthority,
        bunAuthority,
        modelsAuthority,
        whatsappSourceDir,
        whatsappAuthority,
        officeCliAuthority,
        verifyOfficeCliDarwinSignature,
        constitutionFsAuthority,
        verifyConstitutionFsDarwinSignature,
        verifyCandidateCapabilitySeal,
        requiredWNanoRuntimes,
        wnanoAuthority,
        wnanoPolicySelector
      );
      if (ok) {
        logger.log(`${TAG}   OK   ${req.rel}`);
      } else if (req.critical || fs.existsSync(target)) {
        logger.error(`${TAG}   FAIL ${req.rel}  <-- CRITICAL, missing or invalid`);
        criticalFailures += 1;
        criticalFailureRels.push(req.rel);
      } else {
        logger.warn(`${TAG}   WARN ${req.rel}  (optional, missing or empty)`);
        warnings += 1;
      }
    }
  }

  if (criticalFailures > 0) {
    throw new Error(
      `${TAG} ${criticalFailures} CRITICAL resource(s) missing or invalid in the packaged app: ` +
        `${criticalFailureRels.join(', ')}. Refusing to ship a broken build.`
    );
  }

  logger.log(
    `\n${TAG} PASS - all critical bundled resources present${warnings ? ` (${warnings} optional warning(s))` : ''}.`
  );
  return { resourceDirs, warnings };
}

module.exports = {
  VOICE_MODEL_FILES,
  findPackagedCandidates,
  inspectExecutable,
  resolvePackagedTarget,
  snapshotPackagedTargets,
  verifyPackagedResources,
  verifySignalBundle,
  verifySourceMirror,
  verifyWhatsAppDarwinSignIgnoreInventory,
  verifyWhatsAppNativeTarget,
  verifyVoiceBundle,
  verifyModelsSnapshot,
  verifyConstitutionFsBundle,
  verifyWCoreBundle,
  verifyWCoreRuntime,
  verifyWNanoBundle,
  verifyWNanoRuntime,
};

if (require.main === module) {
  try {
    verifyPackagedResources();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
