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
const prepareWaylandCore = require('./prepareWaylandCore');

const TAG = '[verify-packaged-resources]';

// resource path (relative to the app Resources dir) -> {critical, kind}
// kind 'file' = must exist and be non-empty; 'dir' = must exist and be non-empty.
const REQUIRED = [
  { rel: 'skills-library/index.json', critical: true, kind: 'file' },
  { rel: 'bundled-workflows/index.json', critical: true, kind: 'file' },
  { rel: 'bundled-wayland-core', critical: true, kind: 'wcore-bundle' },
  { rel: 'bundled-officecli', critical: true, kind: 'officecli-bundle' },
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
  { rel: 'bundled-bun', critical: true, kind: 'dir' },
  { rel: 'modelsdev-snapshot.json', critical: true, kind: 'file' },
  { rel: 'voice-models', critical: true, kind: 'dir' },
  // Degradable features - warn loudly but do not block the release.
  { rel: 'hub', critical: false, kind: 'dir' },
  { rel: 'whatsapp-bridge', critical: false, kind: 'dir' },
  { rel: 'signal-cli-runtime', critical: false, kind: 'dir' },
];

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

/**
 * Find every app "Resources" directory under the electron-builder output.
 * macOS:  <out>/<mac*>/<Name>.app/Contents/Resources
 * win:    <out>/<*-unpacked>/resources
 * linux:  <out>/<*-unpacked>/resources
 */
function findResourceDirs(outDir) {
  const found = [];
  if (!fs.existsSync(outDir)) return found;

  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(outDir, entry.name);

    // macOS: look for *.app/Contents/Resources
    for (const sub of fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
      if (sub.name.endsWith('.app')) {
        const res = path.join(dir, sub.name, 'Contents', 'Resources');
        if (fs.existsSync(res)) found.push(res);
      }
    }

    // win/linux: *-unpacked/resources
    if (entry.name.endsWith('-unpacked')) {
      const res = path.join(dir, 'resources');
      if (fs.existsSync(res)) found.push(res);
    }
  }
  return found;
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
  const actualBinarySha256 = crypto.createHash('sha256').update(fs.readFileSync(binaryPath)).digest('hex');
  const manifestArchiveSha256 = String(metadata.source?.archiveSha256 || '')
    .replace(/^sha256:/i, '')
    .toLowerCase();
  const manifestBinarySha256 = String(metadata.binary?.sha256 || '')
    .replace(/^sha256:/i, '')
    .toLowerCase();
  const expectedUrl = `https://github.com/FerroxLabs/wayland-core/releases/download/${releaseTag}/${assetName}`;

  return (
    metadata.contract === authority.BUNDLE_CONTRACT &&
    metadata.generator === authority.BUNDLE_GENERATOR &&
    metadata.platform === platform &&
    metadata.arch === arch &&
    metadata.releaseTag === releaseTag &&
    metadata.version === releaseTag &&
    ['download', 'verified-cache'].includes(metadata.sourceType) &&
    metadata.verified === true &&
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

function hasNonHiddenRegularFile(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const target = path.join(dir, entry.name);
    if (entry.isFile()) return fs.statSync(target).size > 0;
    if (entry.isDirectory() && hasNonHiddenRegularFile(target)) return true;
  }
  return false;
}

function isNonEmpty(
  p,
  kind,
  requiredOfficeCliRuntimes = [],
  expected = {},
  requiredWCoreRuntimes = [],
  wcoreAuthority = prepareWaylandCore
) {
  try {
    const st = fs.statSync(p);
    if (kind === 'file') return st.isFile() && st.size > 0;
    if (kind === 'hashed-file') {
      return (
        st.isFile() &&
        st.size === expected.size &&
        crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') === expected.sha256
      );
    }
    if (!st.isDirectory()) return false;
    if (kind === 'wcore-bundle') {
      return verifyWCoreBundle(p, requiredWCoreRuntimes, wcoreAuthority);
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
        const binary = path.join(runtimeDir, platform === 'win32' ? 'officecli.exe' : 'officecli');
        if (!isNonEmpty(manifest, 'file') || !isNonEmpty(binary, 'file')) return false;
        const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
        const expectedSha = String(metadata.sha256 || '')
          .replace(/^sha256:/i, '')
          .toLowerCase();
        const actualSha = crypto.createHash('sha256').update(fs.readFileSync(binary)).digest('hex');
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
        const darwinPublisherProof =
          platform !== 'darwin' ||
          (publisherSignature?.contract === 'apple-developer-id/1.0' &&
            publisherSignature?.teamIdentifier === '52JQX2HUSC' &&
            publisherSignature?.hardenedRuntime === true &&
            publisherSignature?.secureTimestamp === true &&
            JSON.stringify(publisherSignature?.entitlements) === JSON.stringify(['com.apple.security.cs.allow-jit']));
        return (
          metadata.contract === 'iofficeai-officecli-native' &&
          metadata.platform === platform &&
          metadata.arch === arch &&
          metadata.binary === path.basename(binary) &&
          /^v1\./.test(metadata.version) &&
          /^[0-9a-f]{64}$/.test(expectedSha) &&
          expectedSha === actualSha &&
          darwinPublisherProof &&
          proof?.release === metadata.version &&
          (executableProof || crossHostProof)
        );
      });
    }
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
  const outDir = parseOutDir(argv, cwd);
  const requiredOfficeCliRuntimes = parseRequiredRuntimes(argv, '--officecli-runtime', 'OfficeCLI');
  const requiredWCoreRuntimes = parseRequiredRuntimes(argv, '--wcore-runtime', 'wayland-core');
  const resourceDirs = findResourceDirs(outDir);

  if (resourceDirs.length === 0) {
    throw new Error(
      `${TAG} ERROR: no packaged app Resources dir found under ${outDir} ` +
        `(expected <out>/<mac*>/<App>.app/Contents/Resources or <out>/*-unpacked/resources)`
    );
  }

  let criticalFailures = 0;
  let warnings = 0;

  for (const resDir of resourceDirs) {
    logger.log(`${TAG} checking ${resDir}`);
    for (const req of REQUIRED) {
      const target = path.join(resDir, req.rel);
      const ok = isNonEmpty(target, req.kind, requiredOfficeCliRuntimes, req, requiredWCoreRuntimes, wcoreAuthority);
      if (ok) {
        logger.log(`${TAG}   OK   ${req.rel}`);
      } else if (req.critical) {
        logger.error(`${TAG}   FAIL ${req.rel}  <-- CRITICAL, missing or invalid`);
        criticalFailures += 1;
      } else {
        logger.warn(`${TAG}   WARN ${req.rel}  (optional, missing or empty)`);
        warnings += 1;
      }
    }
  }

  if (criticalFailures > 0) {
    throw new Error(
      `${TAG} ${criticalFailures} CRITICAL resource(s) missing or invalid in the packaged app. ` +
        `Refusing to ship a broken build.`
    );
  }

  logger.log(
    `\n${TAG} PASS - all critical bundled resources present${warnings ? ` (${warnings} optional warning(s))` : ''}.`
  );
  return { resourceDirs, warnings };
}

module.exports = {
  verifyPackagedResources,
  verifyWCoreBundle,
  verifyWCoreRuntime,
};

if (require.main === module) {
  try {
    verifyPackagedResources();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
