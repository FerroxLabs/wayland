#!/usr/bin/env node

/**
 * Simplified build script for Wayland
 * Coordinates electron-vite (bundling) and electron-builder (packaging)
 *
 * Features:
 * - Incremental builds: use --skip-vite to skip Vite compilation if out/ exists
 * - Skip native rebuild: use --skip-native to skip native module rebuilding
 * - Packaging only: use --pack-only to skip electron-builder distributable creation
 */

const { execFileSync, execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const prepareBundledBun = require('./prepareBundledBun');
const prepareWaylandCore = require('./prepareWaylandCore');
const prepareOfficeCli = require('./prepareOfficeCli');
const prepareConstitutionFs = require('./prepareConstitutionFs');
const { verifyThirdPartyExecutableLedger } = require('./supply-chain/verifyThirdPartyExecutableLedger');
const { writeCapabilitySeal } = require('./capability-seal/verifyCandidateCapabilitySeal');
const { isLocalVerificationBuild } = require('./localVerificationGate');
const {
  VOICE_MODEL_FILES,
  resolvePackagedTarget,
  snapshotPackagedTargets,
  verifyModelsSnapshot,
  verifySourceMirror,
} = require('./verify-packaged-resources');

// Raise the V8 old-space ceiling for the bundling step. electron-vite transforms
// ~13k modules in a single process; on machines with the default ~2 GB heap the
// renderer build OOMs partway through ("Ineffective mark-compacts near heap
// limit - JavaScript heap out of memory", #260). 8192 MB matches the `typecheck`
// script. Setting it on process.env propagates to every execSync child below
// (they all spread process.env). An explicit caller --max-old-space-size wins.
if (!/--max[-_]old[-_]space[-_]size/.test(process.env.NODE_OPTIONS || '')) {
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-old-space-size=8192`.trim();
}

// DMG retry logic for macOS: detects DMG creation failures by checking artifacts
// (.app exists but .dmg missing) and retries only the DMG step using
// electron-builder --prepackaged with the .app path (not the parent directory).
// This preserves full DMG styling (window size, icon positions, background)
// Background: GitHub Actions macos-14 runners occasionally suffer from transient
// "Device not configured" hdiutil errors (electron-builder#8415, actions/runner-images#12323).
const DMG_RETRY_MAX = 3;
const DMG_RETRY_DELAY_SEC = 30;

const RELEASE_TRACK = process.env.WAYLAND_RELEASE_TRACK || 'stable';
if (!['stable', 'preview'].includes(RELEASE_TRACK)) {
  throw new Error(`Unsupported WAYLAND_RELEASE_TRACK: ${RELEASE_TRACK}`);
}
const IS_PREVIEW_BUILD = RELEASE_TRACK === 'preview';
const BUILDER_CONFIG_FILE = IS_PREVIEW_BUILD ? 'electron-builder.preview.cjs' : 'electron-builder.yml';
const BUILDER_CONFIG_ARG = IS_PREVIEW_BUILD ? `--config ${BUILDER_CONFIG_FILE}` : '';
const BUILDER_OUTPUT_DIR = path.resolve(__dirname, IS_PREVIEW_BUILD ? '../out-preview' : '../out');
const BUILDER_EXECUTABLE_NAME = IS_PREVIEW_BUILD ? 'Wayland Preview.exe' : 'Wayland.exe';

// Incremental build: hash of source files to detect changes
const INCREMENTAL_CACHE_FILE = 'out/.build-hash';

function walkFiles(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'out' || entry.name === '.git') continue;
      walkFiles(fullPath, acc);
    } else if (entry.isFile()) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function computeSourceHash() {
  const hash = crypto.createHash('md5');
  const rootDir = path.resolve(__dirname, '..');
  const filesToHash = [
    'package.json',
    'package-lock.json',
    'bun.lock',
    'tsconfig.json',
    'electron.vite.config.ts',
    'electron-builder.yml',
    'electron-builder.preview.cjs',
    'justfile',
  ];
  hash.update(`release-track:${RELEASE_TRACK}`);

  for (const file of filesToHash) {
    const filePath = path.resolve(rootDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      hash.update(file + ':');
      hash.update(content);
    }
  }

  const hashDirs = ['src', 'public', 'scripts'];
  for (const dir of hashDirs) {
    const dirPath = path.resolve(rootDir, dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = walkFiles(dirPath)
      .map((file) => path.relative(rootDir, file).replace(/\\/g, '/'))
      .sort();

    for (const relPath of files) {
      const absolutePath = path.resolve(rootDir, relPath);
      const stat = fs.statSync(absolutePath);
      hash.update(relPath + ':');
      hash.update(String(stat.size));
      hash.update(String(stat.mtimeMs));
    }
  }

  return hash.digest('hex');
}

function loadCachedHash() {
  try {
    const cacheFile = path.resolve(__dirname, '..', INCREMENTAL_CACHE_FILE);
    if (fs.existsSync(cacheFile)) {
      return fs.readFileSync(cacheFile, 'utf8').trim();
    }
  } catch {}
  return null;
}

function saveCurrentHash(hash) {
  try {
    const cacheFile = path.resolve(__dirname, '..', INCREMENTAL_CACHE_FILE);
    const viteDir = path.dirname(cacheFile);
    if (!fs.existsSync(viteDir)) {
      fs.mkdirSync(viteDir, { recursive: true });
    }
    fs.writeFileSync(cacheFile, hash);
  } catch {}
}

function viteBuildExists() {
  const outDir = path.resolve(__dirname, '../out');
  const mainDir = path.join(outDir, 'main');
  const rendererDir = path.join(outDir, 'renderer');

  return fs.existsSync(path.join(mainDir, 'index.js')) && fs.existsSync(path.join(rendererDir, 'index.html'));
}

function shouldSkipViteBuild(skipViteFlag, forceFlag) {
  if (forceFlag) return false;
  if (skipViteFlag) return true;

  // Auto-detect: skip if build exists and hash matches
  const currentHash = computeSourceHash();
  const cachedHash = loadCachedHash();

  if (cachedHash && currentHash === cachedHash && viteBuildExists()) {
    console.log('📦 Incremental build: Vite output unchanged, skipping compilation');
    return true;
  }

  return false;
}

function cleanupDiskImages() {
  try {
    // Detach all mounted disk images that may block subsequent DMG creation:
    // hdiutil info → grep device paths → force detach each
    const result = spawnSync(
      'sh',
      [
        '-c',
        "hdiutil info 2>/dev/null | grep /dev/disk | awk '{print $1}' | xargs -I {} hdiutil detach {} -force 2>/dev/null",
      ],
      { stdio: 'ignore' }
    );
    if (result.status !== 0) {
      console.log(`   ℹ️  Disk image cleanup exit code: ${result.status}`);
    }
    return result.status === 0;
  } catch (error) {
    console.log(`   ℹ️  Disk image cleanup failed: ${error.message}`);
    return false;
  }
}

function snapshotDmgArtifacts(outDir) {
  const snapshot = new Map();
  if (!fs.existsSync(outDir)) return snapshot;
  for (const file of fs.readdirSync(outDir)) {
    if (!file.endsWith('.dmg')) continue;
    const stat = fs.statSync(path.join(outDir, file));
    snapshot.set(file, `${stat.size}:${stat.mtimeMs}`);
  }
  return snapshot;
}

function hasFreshTargetDmg(outDir, targetArch, previousSnapshot) {
  if (!fs.existsSync(outDir)) return false;
  return fs.readdirSync(outDir).some((file) => {
    if (!file.endsWith('.dmg')) return false;
    const lower = file.toLowerCase();
    const explicitArm = /(?:^|[-_])(?:arm64|aarch64)(?:[-_.]|$)/.test(lower);
    const explicitX64 = /(?:^|[-_])(?:x64|x86_64|amd64)(?:[-_.]|$)/.test(lower);
    if (targetArch === 'arm64' ? !explicitArm : explicitArm || (!explicitX64 && lower.includes('universal')))
      return false;
    const stat = fs.statSync(path.join(outDir, file));
    return previousSnapshot.get(file) !== `${stat.size}:${stat.mtimeMs}`;
  });
}

function tryRemoveDir(targetDir) {
  if (!fs.existsSync(targetDir)) return true;
  try {
    fs.rmSync(targetDir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 300,
    });
    return true;
  } catch (error) {
    console.log(`❌ Failed to remove ${targetDir}: ${error.message}`);
    return false;
  }
}

function isProcessRunningWindows(imageName) {
  if (process.platform !== 'win32') return false;
  try {
    const result = execSync(`tasklist /FI "IMAGENAME eq ${imageName}"`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return result.toString().toLowerCase().includes(imageName.toLowerCase());
  } catch {
    return false;
  }
}

function killWindowsProcesses(imageNames) {
  if (process.platform !== 'win32') return;
  for (const name of imageNames) {
    try {
      execSync(`taskkill /F /IM ${name}`, { stdio: 'ignore' });
    } catch {}
  }
}

function formatExecError(error) {
  return [error?.message, error?.stdout?.toString?.(), error?.stderr?.toString?.()].filter(Boolean).join('\n').trim();
}

// Create DMG using electron-builder --prepackaged with .app path
// This preserves DMG styling from electron-builder.yml (window size, icon positions, background)
function createDmgWithPrepackaged(appDir, targetArch) {
  const appName = fs.readdirSync(appDir).find((f) => f.endsWith('.app'));
  if (!appName) throw new Error(`No .app found in ${appDir}`);
  const appPath = path.join(appDir, appName);

  execSync(
    `bunx electron-builder ${BUILDER_CONFIG_ARG} --mac dmg --${targetArch} --prepackaged "${appPath}" --publish=never`,
    {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  );
}

function resolveDmgRetryTarget(outDir, targetPlatform, targetArch, previousPackages) {
  return resolvePackagedTarget(outDir, targetPlatform, targetArch, {
    previousSnapshot: previousPackages,
  });
}

function buildWithDmgRetry(cmd, targetPlatform, targetArch, previousPackages, previousDmgs) {
  const isMac = process.platform === 'darwin';
  const outDir = BUILDER_OUTPUT_DIR;

  try {
    execSync(cmd, { stdio: 'inherit', shell: process.platform === 'win32' });
    return;
  } catch (error) {
    // On non-macOS or if .app doesn't exist, just throw
    let packagedTarget = null;
    if (isMac) {
      try {
        packagedTarget = resolveDmgRetryTarget(outDir, targetPlatform, targetArch, previousPackages);
      } catch {}
    }
    if (!packagedTarget || hasFreshTargetDmg(outDir, targetArch, previousDmgs)) throw error;
    const appDir = path.dirname(packagedTarget.appDir);

    // .app exists but no .dmg → DMG creation failed
    console.log('\n🔄 Build failed during DMG creation (.app exists, .dmg missing)');
    console.log('   Retrying DMG creation with --prepackaged...');

    for (let attempt = 1; attempt <= DMG_RETRY_MAX; attempt++) {
      cleanupDiskImages();
      spawnSync('sleep', [String(DMG_RETRY_DELAY_SEC)]);

      try {
        console.log(`\n📀 DMG retry attempt ${attempt}/${DMG_RETRY_MAX}...`);
        createDmgWithPrepackaged(appDir, targetArch);
        console.log('✅ DMG created successfully on retry');
        return;
      } catch (retryError) {
        console.log(`   ⚠️  DMG retry ${attempt}/${DMG_RETRY_MAX} failed`);
        cleanupDiskImages();
        if (attempt === DMG_RETRY_MAX) {
          console.log(`   ❌ DMG creation failed after ${DMG_RETRY_MAX} retries`);
          throw retryError;
        }
      }
    }
  }
}

function prepareOptionalHubResources(options = {}) {
  const hubDir = options.hubDir || path.resolve(__dirname, '..', 'resources', 'hub');
  fs.rmSync(hubDir, { recursive: true, force: true });
  // There is currently no published FerroxLabs/waylandHub repository from
  // which an immutable tag, index digest, and archive digests can be compiled.
  // Never activate the legacy mutable dist-latest/WAYLAND_HUB_TAG downloader.
  // Honest omission is safer than shipping self-attested extension archives.
  return { available: false, reason: 'trusted-hub-authority-unavailable' };
}

function prepareWhatsAppBridgeResources(options = {}) {
  const bridgeDir = options.bridgeDir || path.resolve(__dirname, '..', 'src', 'process', 'channels', 'whatsapp-bridge');
  const nodeModules = path.join(bridgeDir, 'node_modules');
  const platform = options.platform || process.platform;
  const arch = options.arch || process.arch;
  const run = options.run || execFileSync;
  const validate = options.validate || (() => verifySourceMirror(bridgeDir, bridgeDir, undefined, platform, arch));
  fs.rmSync(nodeModules, { recursive: true, force: true });
  try {
    run('bun', ['install', '--frozen-lockfile', '--os', platform, '--cpu', arch], {
      cwd: bridgeDir,
      stdio: 'inherit',
      env: process.env,
    });
    if (!validate()) throw new Error('WhatsApp bridge clean frozen-lock input failed source/dependency validation');
  } catch (error) {
    fs.rmSync(nodeModules, { recursive: true, force: true });
    throw error;
  }
  return { available: true, bridgeDir };
}

function cleanGeneratedResourceRoots(options = {}) {
  const voiceDir = options.voiceDir || path.resolve(__dirname, '..', 'resources', 'voice-models', 'whisper-tiny');
  const skillPackDir = options.skillPackDir || path.resolve(__dirname, '..', '.skill-pack');
  const expectedVoiceFiles = new Set(VOICE_MODEL_FILES);
  const cleanVoiceDir = (current) => {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) {
        cleanVoiceDir(target);
        if (fs.readdirSync(target).length === 0) fs.rmSync(target, { recursive: true, force: true });
        continue;
      }
      const relative = path.relative(voiceDir, target).replace(/\\/g, '/');
      if (!entry.isFile() || !expectedVoiceFiles.has(relative)) fs.rmSync(target, { recursive: true, force: true });
    }
  };
  cleanVoiceDir(voiceDir);
  fs.rmSync(skillPackDir, { recursive: true, force: true });
}

function preserveGeneratedSource(filePath, fsImpl = fs) {
  const existed = fsImpl.existsSync(filePath);
  const bytes = existed ? fsImpl.readFileSync(filePath) : null;
  let restored = false;
  return () => {
    if (restored) return;
    restored = true;
    if (existed) {
      fsImpl.mkdirSync(path.dirname(filePath), { recursive: true });
      fsImpl.writeFileSync(filePath, bytes);
    } else {
      fsImpl.rmSync(filePath, { force: true });
    }
  };
}

function writeConstitutionPackageAuthority(authority, root = path.resolve(__dirname, '..', 'resources')) {
  if (!authority?.supported) return null;
  const runtime = `${authority.platform}-${authority.arch}`;
  const target = path.join(root, 'bundled-constitution-fs', runtime, 'package-authority.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(authority, null, 2)}\n`);
  return target;
}

// Clean stale Windows packaging outputs from previous runs
function cleanupWindowsPackOutput() {
  const outDir = BUILDER_OUTPUT_DIR;
  if (!fs.existsSync(outDir)) return;

  const removed = [];
  const winUnpackedDirRe = /^win(?:-[a-z0-9]+)?-unpacked$/i;
  const winArtifactFileRe = /-win-[^.]+\.(?:exe|msi|zip|7z)$/i;

  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    const fullPath = path.join(outDir, entry.name);

    if (entry.isDirectory() && winUnpackedDirRe.test(entry.name)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      removed.push(entry.name);
      continue;
    }

    if (entry.isFile() && winArtifactFileRe.test(entry.name)) {
      fs.rmSync(fullPath, { force: true });
      removed.push(entry.name);
    }
  }

  if (removed.length > 0) {
    console.log(`🧹 Cleaned stale Windows outputs: ${removed.join(', ')}`);
  }
}

if (require.main !== module) {
  module.exports = {
    buildWithDmgRetry,
    cleanGeneratedResourceRoots,
    hasFreshTargetDmg,
    prepareOptionalHubResources,
    prepareWhatsAppBridgeResources,
    preserveGeneratedSource,
    resolveDmgRetryTarget,
    snapshotDmgArtifacts,
    writeConstitutionPackageAuthority,
  };
  return;
}

// Parse command line arguments
const args = process.argv.slice(2);
const archList = ['x64', 'arm64'];
const electronBuilderArchNames = [...archList, 'ia32', 'armv7l', 'universal'];
const platformAliases = new Map([
  ['--mac', ['--mac', 'darwin']],
  ['--macos', ['--mac', 'darwin']],
  ['-m', ['--mac', 'darwin']],
  ['-o', ['--mac', 'darwin']],
  ['--win', ['--win', 'win32']],
  ['--windows', ['--win', 'win32']],
  ['-w', ['--win', 'win32']],
  ['--linux', ['--linux', 'linux']],
  ['-l', ['--linux', 'linux']],
]);

function optionName(arg) {
  return arg.split('=', 1)[0];
}

// electron-builder accepts aliases, `--flag=value`, architecture-qualified
// targets (`dmg:x64`), and `--universal`. If this wrapper ignored one of those
// spellings it could prepare one native runtime while electron-builder emitted
// a different or additional target. Keep the package grammar deliberately
// narrow: one canonical platform plus one canonical arm64/x64 declaration.
const nonCanonicalPlatformArg = args.find((arg) => {
  const alias = platformAliases.get(optionName(arg));
  return alias && arg !== alias[0];
});
if (nonCanonicalPlatformArg) {
  console.error(
    `❌ Non-canonical platform argument ${nonCanonicalPlatformArg} is not allowed. Use exactly one of --mac, --win, or --linux.`
  );
  process.exit(1);
}

const encodedArchArg = args.find(
  (arg) =>
    (/^--/.test(arg) && electronBuilderArchNames.includes(optionName(arg).slice(2)) && arg.includes('=')) ||
    new RegExp(`:(${electronBuilderArchNames.join('|')})$`).test(arg)
);
if (encodedArchArg) {
  console.error(
    `❌ Non-canonical architecture argument ${encodedArchArg} is not allowed. Declare exactly one isolated arm64 or x64 target.`
  );
  process.exit(1);
}

const unsupportedArchArg = args.find((arg) => {
  const name = optionName(arg);
  const arch = name.startsWith('--') ? name.slice(2) : name;
  return electronBuilderArchNames.includes(arch) && !archList.includes(arch);
});
if (unsupportedArchArg) {
  console.error(
    `❌ Unsupported package architecture ${unsupportedArchArg}. Bundled native runtimes support arm64 and x64.`
  );
  process.exit(1);
}

// Check for special flags
const skipVite = args.includes('--skip-vite');
const skipNative = args.includes('--skip-native');
const packOnly = args.includes('--pack-only');
const forceBuild = args.includes('--force');

const builderArgs = args
  .filter((arg) => {
    // Filter out 'auto', architecture flags, and special flags
    if (arg === 'auto') return false;
    if (arg === '--skip-vite' || arg === '--skip-native' || arg === '--pack-only' || arg === '--force') return false;
    if (archList.includes(arg)) return false;
    if (arg.startsWith('--') && archList.includes(arg.slice(2))) return false;
    return true;
  })
  .join(' ');

// Get target architecture from electron-builder.yml
function getTargetArchFromConfig(platform) {
  try {
    const configPath = path.resolve(__dirname, '../electron-builder.yml');
    const content = fs.readFileSync(configPath, 'utf8');

    const platformRegex = new RegExp(`^${platform}:\\s*$`, 'm');
    const platformMatch = content.match(platformRegex);
    if (!platformMatch) return null;

    const platformStartIndex = platformMatch.index;
    const afterPlatform = content.slice(platformStartIndex + platformMatch[0].length);
    const nextPlatformMatch = afterPlatform.match(/^[a-zA-Z][a-zA-Z0-9]*:/m);
    const platformBlock = nextPlatformMatch
      ? content.slice(platformStartIndex, platformStartIndex + platformMatch[0].length + nextPlatformMatch.index)
      : content.slice(platformStartIndex);

    const archMatch = platformBlock.match(/arch:\s*\[\s*([a-z0-9_]+)/i);
    return archMatch ? archMatch[1].trim() : null;
  } catch (error) {
    return null;
  }
}

// Determine target architecture
const buildMachineArch = process.arch;
let targetArch;
let multiArch = false;

// Check if multiple architectures are specified (support both --x64 and x64 formats)
const rawArchArgs = args
  .filter((arg) => {
    if (archList.includes(arg)) return true;
    if (arg.startsWith('--') && archList.includes(arg.slice(2))) return true;
    return false;
  })
  .map((arg) => (arg.startsWith('--') ? arg.slice(2) : arg));

// Remove duplicates to avoid treating "x64 --x64" as multiple architectures
const archArgs = [...new Set(rawArchArgs)];

const requestedPlatformTargets = [
  ...new Map(
    args
      .map((arg) => platformAliases.get(optionName(arg)))
      .filter(Boolean)
      .map(([flag, platform]) => [flag, platform])
  ).entries(),
];
if (args.some((arg) => optionName(arg) === '--all') || requestedPlatformTargets.length > 1) {
  console.error(
    '❌ One exact platform is required per package invocation. Run macOS, Windows, and Linux as isolated jobs so bundled native runtimes cannot cross-contaminate artifacts.'
  );
  process.exit(1);
}
if (archArgs.length > 1) {
  console.error(
    '❌ One exact architecture is required per package invocation. Run arm64 and x64 as isolated jobs so bundled native runtimes cannot cross-contaminate artifacts.'
  );
  process.exit(1);
}

if (args[0] === 'auto') {
  // Auto mode: detect from electron-builder.yml
  let detectedPlatform = null;
  if (builderArgs.includes('--linux')) detectedPlatform = 'linux';
  else if (builderArgs.includes('--mac')) detectedPlatform = 'mac';
  else if (builderArgs.includes('--win')) detectedPlatform = 'win';

  const configArch = detectedPlatform ? getTargetArchFromConfig(detectedPlatform) : null;
  targetArch = configArch || buildMachineArch;
} else {
  // Explicit architecture or default to build machine
  targetArch = archArgs[0] || buildMachineArch;
}

console.log(`🔨 Building for architecture: ${targetArch}`);
console.log(`🧭 Release track: ${RELEASE_TRACK}`);
console.log(`📋 Builder arguments: ${builderArgs || '(none)'}`);
if (skipVite) console.log('⚡ --skip-vite: Will skip Vite compilation if output exists');
if (skipNative) console.log('⚡ --skip-native: Will skip native module rebuilding');
if (packOnly) console.log('⚡ --pack-only: Will skip electron-builder distributable creation');
if (forceBuild) console.log('⚡ --force: Force full rebuild');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const packagePlatforms = [requestedPlatformTargets[0]?.[1] || process.platform];
const packageArchitectures = [targetArch];
const constitutionAuthorityPath = path.resolve(
  __dirname,
  '..',
  'src',
  'process',
  'services',
  'constitution',
  'constitutionFsAuthority.generated.ts'
);
const restoreConstitutionAuthority = preserveGeneratedSource(constitutionAuthorityPath);
const capabilitySealPath = path.resolve(__dirname, '..', 'public', 'capability-seal.json');
const restoreCapabilitySeal = preserveGeneratedSource(capabilitySealPath);

try {
  // Release packaging is capability-evidence driven. Every capability that is
  // still compiled into the candidate must carry an exact, candidate-bound
  // acceptance receipt; an excluded capability must be physically absent.
  // The generated seal is copied by electron-builder's existing public/ rule.
  verifyThirdPartyExecutableLedger();
  // The capability seal is release-gated. A local verification build
  // (WAYLAND_LOCAL_VERIFICATION=1) OMITS it — it does not forge one — so a local
  // `--dir` build can produce a launchable `.app` for packaged-cockpit-smoke.mjs.
  // Neither the app runtime nor the smoke ever read the seal (Q-C/Q-D), so its
  // absence is inert. Default-OFF: any other value writes the seal (release path).
  if (isLocalVerificationBuild(process.env)) {
    console.warn(
      '⚠️  LOCAL VERIFICATION BUILD — NOT A RELEASE (WAYLAND_LOCAL_VERIFICATION=1): capability seal omitted; this artifact must never ship as a release.'
    );
  } else {
    writeCapabilitySeal({
      root: path.resolve(__dirname, '..'),
      outputFile: capabilitySealPath,
    });
  }

  // 1. Ensure package.json main entry is correct for electron-vite
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.main !== './out/main/index.js') {
    packageJson.main = './out/main/index.js';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  }

  // 2. Generate the target-exact Constitution authority before Vite compiles
  // the main process. Generating this after electron-vite would package a
  // binary whose digest is not the authority embedded in app.asar.
  const constitutionAuthority = prepareConstitutionFs({
    platform: packagePlatforms[0],
    arch: packageArchitectures[0],
  });
  writeConstitutionPackageAuthority(constitutionAuthority);

  // 3. Check if we can skip Vite build (incremental build)
  const skipViteBuild = shouldSkipViteBuild(skipVite, forceBuild);

  if (!skipViteBuild) {
    // Run electron-vite to build all bundles (main + preload + renderer)
    console.log(`📦 Building ${targetArch}...`);
    execSync(`bunx electron-vite build`, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        ELECTRON_BUILDER_ARCH: targetArch,
      },
    });

    // Save hash after successful build
    saveCurrentHash(computeSourceHash());
  } else {
    console.log('📦 Using cached Vite build output');
  }

  // Re-bundle builtin MCP server as a fully self-contained CJS bundle so it can
  // be executed by an external `node` process (no Electron ASAR support available).
  // electron-vite's externalizeDepsPlugin leaves npm packages as require() calls
  // which the standalone node process cannot resolve from inside app.asar.unpacked.
  // Uses a dedicated script (build-mcp-servers.js) to avoid shell-quoting issues
  // with special characters in esbuild --define values.
  console.log('📦 Bundling builtin MCP servers (self-contained)...');
  execSync(`node "${path.join(__dirname, 'build-mcp-servers.js')}"`, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  // 4. Verify electron-vite output
  const viteOutDir = path.resolve(__dirname, '../out');
  if (!fs.existsSync(viteOutDir)) {
    throw new Error('electron-vite did not generate out/ directory');
  }

  // 5. Validate output structure
  const mainIndex = path.join(viteOutDir, 'main', 'index.js');
  const rendererIndex = path.join(viteOutDir, 'renderer', 'index.html');

  if (!fs.existsSync(mainIndex)) {
    throw new Error('Missing main entry: out/main/index.js');
  }

  if (!fs.existsSync(rendererIndex)) {
    throw new Error('Missing renderer entry: out/renderer/index.html');
  }

  // If --pack-only, skip electron-builder distributable creation
  if (packOnly) {
    console.log('✅ Package completed! (skipped distributable creation)');
    return;
  }

  // 6. Prepare bundled bun/bunx binaries (for packaged runtime usage).
  // prepareBundledBun consumes npm_config_target_arch, so assert the package
  // target here instead of inheriting the build host architecture.
  process.env.npm_config_target_arch = targetArch;
  // This only affects packaging assets; runtime integration will be added in a future PR.
  prepareBundledBun({ platform: packagePlatforms[0], arch: packageArchitectures[0] });

  // 5b. The optional offline Hub is unavailable until a real immutable source
  // authority exists. Remove stale bytes and report the honest degraded state;
  // never invoke the legacy mutable downloader during production packaging.
  prepareOptionalHubResources();
  console.warn('⚠️  trusted Hub authority unavailable; offline Hub bundle omitted');

  // 5c. Establish the exact self-contained WhatsApp bridge input from its
  // committed Bun lock. Packaging must never bless postinstall's mutable or
  // non-fatal fallback dependency tree.
  prepareWhatsAppBridgeResources({ platform: packagePlatforms[0], arch: packageArchitectures[0] });

  // electron-builder copies the complete native-resource roots into every
  // artifact. Keep both roots target-exact so stale preparation from a prior
  // job cannot contaminate this package with foreign executables.
  const exactRuntimeKey = `${packagePlatforms[0]}-${packageArchitectures[0]}`;
  for (const bundleName of ['bundled-wayland-core', 'bundled-officecli', 'bundled-constitution-fs']) {
    const bundleRoot = path.resolve(__dirname, '..', 'resources', bundleName);
    if (!fs.existsSync(bundleRoot)) continue;
    for (const entry of fs.readdirSync(bundleRoot, { withFileTypes: true })) {
      if (entry.name === exactRuntimeKey) continue;
      fs.rmSync(path.join(bundleRoot, entry.name), { recursive: true, force: true });
    }
  }

  // 5b. Prepare wayland-core for every requested package target. The package
  // command asserts strict mode directly and pins the release in source; it
  // must never depend on npm lifecycle variables or accept a local-prebuilt,
  // skipped, latest, or self-asserted engine manifest.
  for (const platform of packagePlatforms) {
    for (const arch of packageArchitectures) {
      prepareWaylandCore({
        platform,
        arch,
        version: prepareWaylandCore.DEFAULT_WCORE_VERSION,
        requireVerified: true,
      });
    }
  }

  // 5c. Prepare the exact native OfficeCLI authoring runtime for every package
  // target. This is a mandatory, checksum-pinned release asset: the hosted npm
  // `officecli` package exposes a different contract and cannot satisfy Cowork's
  // native docx/xlsx/pptx skills.
  const officeCliPlatforms = packagePlatforms;
  const officeCliArchitectures = packageArchitectures;
  for (const platform of officeCliPlatforms) {
    for (const arch of officeCliArchitectures) {
      prepareOfficeCli({ platform, arch });
    }
  }

  // 5e. Prepare the bundled voice STT model (Whisper-tiny ONNX, ~43 MB) so
  // offline dictation works on a fresh install with zero download.
  // Remove skill-pack output and undeclared voice debris first so stale
  // generated content cannot survive into a new artifact. Valid voice files
  // remain cached; the exact post-package gate rejects any malformed set.
  cleanGeneratedResourceRoots();
  // spawnSync with arg array - no shell, safe.
  const voicePrep = spawnSync('node', [path.join(__dirname, 'prepareVoiceModel.js')], {
    stdio: 'inherit',
    env: process.env,
  });
  if (voicePrep.status !== 0) {
    throw new Error(`Bundled voice model preparation failed with exit code ${voicePrep.status}`);
  }

  // 5e. Stage build-time bundled resources that are NOT committed to the repo:
  //  - resources/modelsdev-snapshot.json : immutable offline models.dev floor.
  //  - .skill-pack/{skills-library,bundled-workflows} : the AV-safe packed blob
  //    of every built-in skill + workflow (#316).
  // These previously ran ONLY via npm `predist*` lifecycle hooks, which never
  // fire when CI invokes this script directly (`node scripts/build-with-builder.js`).
  // That gap shipped 0.11.4/0.11.5 with the entire skills-library +
  // bundled-workflows missing -> every skill and workflow gone for all users.
  // Run them here unconditionally so they ALWAYS run, however the build starts.
  console.log('📦 Verifying immutable models.dev offline snapshot...');
  const modelsSnapshot = path.resolve(__dirname, '..', 'resources', 'modelsdev-snapshot.json');
  if (!verifyModelsSnapshot(modelsSnapshot)) {
    throw new Error('Committed models.dev offline snapshot failed pinned size, SHA-256, or schema validation');
  }
  console.log('📦 Building skill/workflow pack (.skill-pack)...');
  execSync('bunx tsx scripts/build-skill-pack.ts --out .skill-pack', { stdio: 'inherit', env: process.env });

  // Optional Signal CLI runtime (degradable channel) - never fail the build on it.
  try {
    execFileSync(
      'node',
      [
        path.join(__dirname, 'install-signal-cli.mjs'),
        '--platform',
        packagePlatforms[0],
        '--arch',
        packageArchitectures[0],
      ],
      { stdio: 'inherit', env: process.env }
    );
  } catch (e) {
    console.warn(`⚠️  signal-cli install failed (Signal channel will be unavailable): ${e.message}`);
  }

  // Pre-pack assertion: the packed skill/workflow blobs MUST exist now, or the
  // app would ship with 0 skills and 0 workflows (the 0.11.5 regression). Fail
  // loud here, before electron-builder silently omits the missing extraResource.
  for (const rel of ['skills-library/index.json', 'bundled-workflows/index.json']) {
    const staged = path.resolve(__dirname, '..', '.skill-pack', rel);
    if (!fs.existsSync(staged) || fs.statSync(staged).size === 0) {
      throw new Error(
        `Skill pack not staged: .skill-pack/${rel} is missing/empty - build:skill-pack did not produce it. ` +
          `Aborting before electron-builder so we never ship an app with no skills/workflows.`
      );
    }
  }

  // 6. Run electron-builder to create distributables (DMG/ZIP/EXE, etc.)
  // Always disable auto-publish to avoid electron-builder's implicit tag-based publishing
  // Publishing is handled by a separate release job in CI
  const publishArg = '--publish=never';

  // Set compression level based on environment
  // 7za -mx accepts numeric values: 0 (store) to 9 (ultra)
  // CI builds use 9 (maximum) for smallest size
  // Local builds use 7 (normal) for 30-50% faster ASAR packing
  const isCI = process.env.CI === 'true';
  if (!process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL) {
    process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL = isCI ? '9' : '7';
  }
  console.log(
    `📦 Compression level: ${process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL} (${isCI ? 'CI build' : 'local build'})`
  );

  // Add arch flags based on mode
  let archFlag = '';
  if (multiArch) {
    // Multi-arch mode: pass all arch flags to electron-builder
    archFlag = archArgs.map((arch) => `--${arch}`).join(' ');
    console.log(`🚀 Packaging for multiple architectures: ${archArgs.join(', ')}...`);
  } else {
    // Single arch mode: use the determined target arch
    archFlag = `--${targetArch}`;
    console.log(`🚀 Creating distributables for ${targetArch}...`);
  }

  // Add architecture detection scripts for Windows builds
  // Use .onVerifyInstDir to avoid conflicts with electron-builder
  let nsisInclude = '';
  if (builderArgs.includes('--win') || builderArgs.includes('--all')) {
    if (!multiArch) {
      // Single-arch build: Add architecture-specific detection script
      if (targetArch === 'arm64') {
        const arm64Script = 'resources/windows-installer-arm64.nsh';
        if (fs.existsSync(path.resolve(__dirname, '..', arm64Script))) {
          nsisInclude += ` --config.nsis.include="${arm64Script}"`;
          console.log(`📋 Including Windows ARM64 architecture check script`);
        }
      } else if (targetArch === 'x64') {
        const x64Script = 'resources/windows-installer-x64.nsh';
        if (fs.existsSync(path.resolve(__dirname, '..', x64Script))) {
          nsisInclude += ` --config.nsis.include="${x64Script}"`;
          console.log(`📋 Including Windows x64 architecture check script`);
        }
      }
    }
    // Multi-arch builds: Architecture detection not supported yet
  }

  if (process.platform === 'win32' && builderArgs.includes('--win')) {
    const winUnpackedDir = path.join(BUILDER_OUTPUT_DIR, 'win-unpacked');
    let cleaned = tryRemoveDir(winUnpackedDir);
    if (!cleaned) {
      const aionRunning = isProcessRunningWindows('Wayland.exe');
      const electronRunning = isProcessRunningWindows('electron.exe');
      if (aionRunning || electronRunning) {
        console.log('⚠️  Detected running Wayland/Electron process. Attempting to close...');
        killWindowsProcesses(['Wayland.exe', 'electron.exe']);
        cleaned = tryRemoveDir(winUnpackedDir);
        if (!cleaned) {
          console.log('⚠️  Directory still locked. Please close any running Wayland/Electron processes and retry.');
        }
      }
    }
  }

  const isWindowsBuild = builderArgs.includes('--win') || builderArgs.includes('--all');
  if (isWindowsBuild) {
    cleanupWindowsPackOutput();
  }

  const builderCommand = `bunx electron-builder ${BUILDER_CONFIG_ARG} ${builderArgs} ${archFlag} ${nsisInclude} ${publishArg}`;
  const previousPackages = snapshotPackagedTargets(BUILDER_OUTPUT_DIR);
  const previousDmgs = snapshotDmgArtifacts(BUILDER_OUTPUT_DIR);
  try {
    buildWithDmgRetry(builderCommand, packagePlatforms[0], targetArch, previousPackages, previousDmgs);
  } catch (error) {
    const winExePath = path.join(BUILDER_OUTPUT_DIR, 'win-unpacked', BUILDER_EXECUTABLE_NAME);
    const firstError = formatExecError(error);
    const canRetryWithoutExecutableEdit =
      process.platform === 'win32' && isWindowsBuild && process.env.CI !== 'true' && fs.existsSync(winExePath);

    if (!canRetryWithoutExecutableEdit) {
      throw error;
    }

    console.log('⚠️  Windows local build failed after Wayland.exe was produced.');
    if (firstError) {
      console.log('   First failure summary:');
      console.log(
        firstError
          .split(/\r?\n/)
          .slice(0, 6)
          .map((line) => `   ${line}`)
          .join('\n')
      );
    }
    console.log('   Retrying local build with win.signAndEditExecutable=false...');
    console.log('   This fallback is intended for transient rcedit / file-lock failures on developer machines.');
    killWindowsProcesses(['Wayland.exe', 'electron.exe']);
    cleanupWindowsPackOutput();

    try {
      buildWithDmgRetry(
        `${builderCommand} --config.win.signAndEditExecutable=false`,
        packagePlatforms[0],
        targetArch,
        previousPackages,
        previousDmgs
      );
    } catch (retryError) {
      const retryFailure = formatExecError(retryError);
      throw new Error(
        [
          'Windows local retry with win.signAndEditExecutable=false also failed.',
          'First failure:',
          firstError || String(error),
          'Retry failure:',
          retryFailure || String(retryError),
        ].join('\n')
      );
    }
  }

  // 7. Fail-hard gate: assert the packaged app actually contains every critical
  // bundled resource. electron-builder silently DROPS any extraResources whose
  // source is absent (exit 0, no warning) - the exact failure that shipped
  // 0.11.4/0.11.5 with no skills-library/bundled-workflows. This is the last
  // line of defense: a structurally-incomplete app fails the build, never ships.
  console.log('🔎 Verifying packaged resources are present in the built app...');
  const packagedTarget = resolvePackagedTarget(BUILDER_OUTPUT_DIR, packagePlatforms[0], targetArch, {
    previousSnapshot: previousPackages,
  });
  const officeCliRuntimeArgs = officeCliPlatforms
    .flatMap((platform) => officeCliArchitectures.map((arch) => `--officecli-runtime ${platform}-${arch}`))
    .join(' ');
  const wcoreRuntimeArgs = packagePlatforms
    .flatMap((platform) => packageArchitectures.map((arch) => `--wcore-runtime ${platform}-${arch}`))
    .join(' ');
  execFileSync(
    'node',
    [
      path.join(__dirname, 'verify-packaged-resources.js'),
      '--out',
      BUILDER_OUTPUT_DIR,
      '--target-platform',
      packagePlatforms[0],
      '--target-arch',
      targetArch,
      '--resources-dir',
      packagedTarget.resourceDir,
      '--app-executable',
      packagedTarget.executablePath,
      ...wcoreRuntimeArgs.split(' '),
      ...officeCliRuntimeArgs.split(' '),
    ],
    { stdio: 'inherit', env: process.env }
  );

  console.log('✅ Build completed!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exitCode = 1;
} finally {
  restoreConstitutionAuthority();
  restoreCapabilitySeal();
}
