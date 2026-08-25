import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const roots: string[] = [];
const require = createRequire(import.meta.url);
const { assertDarwinDeveloperIdSigned, DARWIN_TEAM_ID } = require('../../scripts/signDarwinStagedBinary') as {
  assertDarwinDeveloperIdSigned: (
    binaryPath: string,
    options?: { execFileSync?: (file: string, args: string[], options?: unknown) => Buffer; identifier?: string }
  ) => void;
  DARWIN_TEAM_ID: string;
};
const { darwinSigningIdentifier } = require('../../scripts/signDarwinStagedBinary') as {
  darwinSigningIdentifier: (binaryName: string, upstreamSha256: string) => string;
};
const {
  reconcileStagedDarwinNatives,
  resolvePackagedTarget,
  snapshotPackagedTargets,
  verifyConstitutionFsBundle,
  verifyPackagedResources,
  verifyWhatsAppDarwinSignIgnoreInventory,
  verifyWhatsAppNativeTarget,
} = require('../../scripts/verify-packaged-resources.js') as {
  reconcileStagedDarwinNatives: (
    bundleDir: string,
    sourceEntries: string[],
    bundledEntries: string[],
    signedCheck: (binaryPath: string, identifier: string) => boolean
  ) => string[];
  resolvePackagedTarget: (
    out: string,
    platform: string,
    arch: string,
    options?: { previousSnapshot?: Map<string, string> }
  ) => { executablePath: string; resourceDir: string };
  snapshotPackagedTargets: (out: string) => Map<string, string>;
  verifyConstitutionFsBundle: (
    root: string,
    platform: string,
    arch: string,
    authority?: unknown,
    verifyDarwinSignature?: (binaryPath: string) => void,
    requireDarwinSignature?: boolean
  ) => boolean;
  verifyPackagedResources: (options: Record<string, unknown>) => { resourceDirs: string[]; warnings: number };
  verifyWhatsAppDarwinSignIgnoreInventory: (root: string, arch: string) => boolean;
  verifyWhatsAppNativeTarget: (root: string, platform: string, arch: string) => boolean;
};
// Derived from the live policy, never re-typed: verify-packaged-resources reads
// the real DEFAULT_WCORE_VERSION and the real attestation policy, so a
// hard-coded tag here fails the day the engine is bumped and proves nothing in
// between.
//
// Selected by engine id, NOT by "the first active entry". The document also
// carries an active wayland-nano policy, so position decided which product this
// picked: while the active engine entry happened to precede nano it worked, and
// appending v0.13.3 after nano silently handed these fixtures the NANO tag and
// failed fifteen tests on a mismatch that had nothing to do with the engine.
// The production selector keys off releaseTag and demands a unique match, so
// only this test was ever order-dependent.
const TEST_WCORE_ACTIVE_POLICIES = (
  require('../../scripts/supply-chain/verifyPublisherAttestation') as {
    readPolicy: () => { policies: Array<{ status: string; id: string; releaseTag: string; sourceDigest: string }> };
  }
)
  .readPolicy()
  .policies.filter((entry) => entry.status === 'active' && entry.id.startsWith('wayland-core-'));
if (TEST_WCORE_ACTIVE_POLICIES.length !== 1) {
  throw new Error(
    `expected exactly one active wayland-core publisher policy, found ${TEST_WCORE_ACTIVE_POLICIES.length}`
  );
}
const TEST_WCORE_ACTIVE_POLICY = TEST_WCORE_ACTIVE_POLICIES[0]!;
const TEST_WCORE_RELEASE = TEST_WCORE_ACTIVE_POLICY.releaseTag;
const TEST_WCORE_ARCHIVE_SHA = 'a'.repeat(64);
const TEST_WCORE_BYTES = Buffer.from('deterministic-test-wayland-core');
const TEST_WCORE_BINARY_SHA = crypto.createHash('sha256').update(TEST_WCORE_BYTES).digest('hex');
const silentLogger = { log() {}, warn() {}, error() {} };
const VOICE_MODEL_FILES = [
  'config.json',
  'generation_config.json',
  'preprocessor_config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'vocab.json',
  'merges.txt',
  'added_tokens.json',
  'normalizer.json',
  'special_tokens_map.json',
  'onnx/encoder_model_quantized.onnx',
  'onnx/decoder_model_merged_quantized.onnx',
];
const TEST_VOICE_AUTHORITY = {
  contract: 'wayland-voice-model-pin/1.0',
  repository: 'Xenova/whisper-tiny',
  revision: 'a'.repeat(40),
  files: Object.fromEntries(
    VOICE_MODEL_FILES.map((relativePath) => {
      const bytes = Buffer.from(relativePath.endsWith('.json') ? '{}' : 'model');
      return [relativePath, { size: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }];
    })
  ),
};
const TEST_MODELS_SNAPSHOT = JSON.stringify({
  test: { id: 'test', name: 'Test', models: { model: { id: 'model', name: 'Model' } } },
});
const TEST_MODELS_AUTHORITY = {
  contract: 'wayland-modelsdev-snapshot/1.0',
  size: Buffer.byteLength(TEST_MODELS_SNAPSHOT),
  sha256: crypto.createHash('sha256').update(TEST_MODELS_SNAPSHOT).digest('hex'),
};
const BUN_SHA = {
  arm64: 'd8b96221828ad6f97ac7ac0ab7e95872341af763001e8803e8267652c2652620',
  x64: '4183df3374623e5bab315c547cfa0974533cd457d86b73b639f7a87974cd6633',
  baseline: '3e35ad6f53971a9834bf9e6786e2adf72b5f1921cc9a9c5fde073d2972944076',
};

const TEST_OFFICE_SIGNATURE = {
  contract: 'apple-developer-id/1.0',
  teamIdentifier: '52JQX2HUSC',
  hardenedRuntime: true,
  secureTimestamp: true,
  entitlements: ['com.apple.security.cs.allow-jit'],
};

function machExecutableBytes(arch: 'arm64' | 'x64'): Buffer {
  const binary = Buffer.alloc(16);
  binary.writeUInt32LE(0xfeedfacf, 0);
  binary.writeUInt32LE(arch === 'arm64' ? 0x0100000c : 0x01000007, 4);
  return binary;
}

const TEST_OFFICE_AUTHORITY = {
  DEFAULT_OFFICECLI_VERSION: 'v1.0.136',
  getAssetName(platform: string, arch: string): string {
    return `officecli-${platform}-${arch}`;
  },
  getBinaryName(platform: string): string {
    return platform === 'win32' ? 'officecli.exe' : 'officecli';
  },
  loadExpectedSha(_version: string, asset: string): string {
    const arch = asset.endsWith('-x64') ? 'x64' : 'arm64';
    return crypto.createHash('sha256').update(machExecutableBytes(arch)).digest('hex');
  },
};

function testConstitutionAuthority(arch: 'arm64' | 'x64') {
  const bytes = machExecutableBytes(arch);
  const digest = crypto.createHash('sha256').update(bytes).digest('hex');
  return {
    supported: true,
    protocolVersion: 2,
    platform: 'darwin',
    arch,
    fileName: 'wayland-constitution-fs',
    size: bytes.length,
    sha256: `sha256:${digest}`,
    // prepareConstitutionFs mints this at STAGE time from the pre-signature
    // bytes and codesign writes it inside the signature, so it cannot be
    // changed without the signing key. The fixture helper is never signed, so
    // its pre-signature digest is simply its digest.
    darwinSignatureIdentifier: `wayland-constitution-fs.${digest}`,
  };
}

const TEST_BUN_AUTHORITY = {
  contract: 'wayland-bundled-bun-binaries/1.0',
  '1.3.14': Object.fromEntries(
    [
      ['bun-darwin-aarch64.zip', 'arm64'],
      ['bun-darwin-x64.zip', 'x64'],
      ['bun-darwin-x64-baseline.zip', 'x64'],
    ].map(([asset, arch]) => {
      const bytes = machExecutableBytes(arch as 'arm64' | 'x64');
      return [asset, { size: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }];
    })
  ),
};

const testWCoreAuthority = {
  BUNDLE_CONTRACT: 'wayland-core-bundle/1.0',
  BUNDLE_GENERATOR: 'prepareWaylandCore/2',
  DEFAULT_WCORE_VERSION: TEST_WCORE_RELEASE,
  getAssetName(platform: string, arch: string, tag: string): string {
    const archName = arch === 'arm64' ? 'aarch64' : 'x86_64';
    const platformName =
      platform === 'darwin' ? 'apple-darwin' : platform === 'linux' ? 'unknown-linux-gnu' : 'pc-windows-msvc';
    return `wayland-core-${tag}-${archName}-${platformName}${platform === 'win32' ? '.zip' : '.tar.gz'}`;
  },
  loadExpectedProvenance(_tag: string, _asset: string, _options: { requireBinary: boolean }) {
    return { archiveSha256: TEST_WCORE_ARCHIVE_SHA, binarySha256: TEST_WCORE_BINARY_SHA };
  },
};

// wayland-nano mirrors the wayland-core fixture. Its publisher-attestation
// policy does not exist in the real policy file yet (the first signed
// FerroxLabs/wayland-nano release lands after this integration), so the gate
// accepts an injected policy selector for the wnano bundle checks.
const TEST_WNANO_RELEASE = 'v0.1.0';
const TEST_WNANO_ARCHIVE_SHA = 'd'.repeat(64);
const TEST_WNANO_BYTES = Buffer.from('deterministic-test-wayland-nano');
const TEST_WNANO_BINARY_SHA = crypto.createHash('sha256').update(TEST_WNANO_BYTES).digest('hex');
const TEST_WNANO_POLICY = {
  id: 'wayland-nano-v0.1.0-release',
  repository: 'FerroxLabs/wayland-nano',
  signerWorkflow: 'FerroxLabs/wayland-nano/.github/workflows/release.yml',
  sourceRef: 'refs/heads/main',
  sourceDigest: 'e'.repeat(40),
  predicateType: 'https://slsa.dev/provenance/v1',
  runner: 'github-hosted',
};

const testWNanoAuthority = {
  BUNDLE_CONTRACT: 'wayland-nano-bundle/1.0',
  BUNDLE_GENERATOR: 'prepareWaylandNano/1',
  DEFAULT_WNANO_VERSION: TEST_WNANO_RELEASE,
  getAssetName(platform: string, arch: string, tag: string): string {
    return `wayland-nano-${tag.replace(/^v/, '')}-${platform}-${arch}.zip`;
  },
  loadExpectedProvenance(_tag: string, _asset: string, _options: { requireBinary: boolean }) {
    return { archiveSha256: TEST_WNANO_ARCHIVE_SHA, binarySha256: TEST_WNANO_BINARY_SHA };
  },
};

const testWNanoPolicySelector = (_releaseTag: string) => TEST_WNANO_POLICY;

function writeMachExecutable(target: string, arch: 'arm64' | 'x64'): void {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, machExecutableBytes(arch), { mode: 0o755 });
}

function writeSkillPack(resources: string, name: string): void {
  const root = path.join(resources, name);
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'index.json'), JSON.stringify([{ id: 'test', name: 'Test', path: 'test' }]));
  fs.writeFileSync(path.join(root, 'skill-bodies.bin'), 'body');
  fs.writeFileSync(
    path.join(root, 'skill-bodies.offsets.json'),
    JSON.stringify({ version: 1, entries: { test: [0, 4] } })
  );
}

function writeBunBundle(resources: string, arch: 'arm64' | 'x64'): void {
  const variants = arch === 'x64' ? ['default', 'baseline'] : ['default'];
  for (const variant of variants) {
    const baseline = variant === 'baseline';
    const runtimeKey = `darwin-${arch}${baseline ? '-baseline' : ''}`;
    const root = path.join(resources, 'bundled-bun', runtimeKey);
    const asset = `bun-darwin-${arch === 'arm64' ? 'aarch64' : 'x64'}${baseline ? '-baseline' : ''}.zip`;
    const binaryPath = path.join(root, 'bun');
    writeMachExecutable(binaryPath, arch);
    const binary = TEST_BUN_AUTHORITY['1.3.14'][asset];
    fs.writeFileSync(
      path.join(root, 'manifest.json'),
      JSON.stringify({
        platform: 'darwin',
        arch,
        variant,
        version: '1.3.14',
        sourceType: 'download',
        source: {
          asset,
          url: `https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/${asset}`,
          sha256: baseline ? BUN_SHA.baseline : BUN_SHA[arch],
        },
        binary: { name: 'bun', ...binary },
        files: ['bun'],
        skipped: false,
      })
    );
  }
}

function addPackagedApp(
  root: string,
  arch: 'arm64' | 'x64',
  includeOfficeCli: boolean,
  officeCliRuntime = `darwin-${arch}`,
  folder = arch === 'arm64' ? 'mac-arm64' : 'mac',
  appName = 'Wayland.app'
): string {
  const appRoot = path.join(root, folder, appName);
  const resources = path.join(appRoot, 'Contents', 'Resources');
  writeMachExecutable(path.join(appRoot, 'Contents', 'MacOS', appName.replace(/\.app$/, '')), arch);
  writeSkillPack(resources, 'skills-library');
  writeSkillPack(resources, 'bundled-workflows');
  writeBunBundle(resources, arch);
  fs.mkdirSync(resources, { recursive: true });
  fs.cpSync(path.resolve('resources/managed-cli-shims'), path.join(resources, 'managed-cli-shims'), {
    recursive: true,
  });
  fs.writeFileSync(path.join(resources, 'capability-seal.json'), '{}');
  fs.writeFileSync(path.join(resources, 'modelsdev-snapshot.json'), TEST_MODELS_SNAPSHOT);
  for (const relativePath of VOICE_MODEL_FILES) {
    const target = path.join(resources, 'voice-models', 'whisper-tiny', relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, relativePath.endsWith('.json') ? '{}' : 'model');
  }
  const wcoreBinary = path.join(resources, 'bundled-wayland-core', `darwin-${arch}`, 'wayland-core');
  fs.mkdirSync(path.dirname(wcoreBinary), { recursive: true });
  fs.writeFileSync(wcoreBinary, TEST_WCORE_BYTES);
  const constitutionRuntime = path.join(resources, 'bundled-constitution-fs', `darwin-${arch}`);
  const constitutionBinary = path.join(constitutionRuntime, 'wayland-constitution-fs');
  const constitutionAuthority = testConstitutionAuthority(arch);
  writeMachExecutable(constitutionBinary, arch);
  fs.writeFileSync(
    path.join(constitutionRuntime, 'manifest.json'),
    JSON.stringify({
      schemaVersion: 1,
      protocolVersion: 2,
      platform: 'darwin',
      arch,
      binary: {
        fileName: constitutionAuthority.fileName,
        sha256: constitutionAuthority.sha256,
        size: constitutionAuthority.size,
      },
    })
  );
  fs.writeFileSync(path.join(constitutionRuntime, 'package-authority.json'), JSON.stringify(constitutionAuthority));
  if (includeOfficeCli) {
    const officeBinary = path.join(
      resources,
      'bundled-officecli',
      officeCliRuntime,
      officeCliRuntime.startsWith('win32-') ? 'officecli.exe' : 'officecli'
    );
    fs.mkdirSync(path.dirname(officeBinary), { recursive: true });
    if (officeCliRuntime.startsWith('darwin-'))
      writeMachExecutable(officeBinary, officeCliRuntime.endsWith('-x64') ? 'x64' : 'arm64');
    else fs.writeFileSync(officeBinary, 'office-cli');
  }
  const wcoreAsset = testWCoreAuthority.getAssetName('darwin', arch, TEST_WCORE_RELEASE);
  fs.writeFileSync(
    path.join(resources, 'bundled-wayland-core', `darwin-${arch}`, 'manifest.json'),
    JSON.stringify({
      contract: testWCoreAuthority.BUNDLE_CONTRACT,
      generator: testWCoreAuthority.BUNDLE_GENERATOR,
      platform: 'darwin',
      arch,
      releaseTag: TEST_WCORE_RELEASE,
      version: TEST_WCORE_RELEASE,
      sourceType: 'download',
      verified: true,
      source: {
        owner: 'FerroxLabs',
        repository: 'wayland-core',
        url: `https://github.com/FerroxLabs/wayland-core/releases/download/${TEST_WCORE_RELEASE}/${wcoreAsset}`,
        asset: wcoreAsset,
        archiveSha256: `sha256:${TEST_WCORE_ARCHIVE_SHA}`,
      },
      publisherAttestation: {
        contract: 'wayland-publisher-attestations/1.0',
        policyId: TEST_WCORE_ACTIVE_POLICY.id,
        repository: 'FerroxLabs/wayland-core',
        signerWorkflow: 'FerroxLabs/wayland-core/.github/workflows/release.yml',
        sourceRef: 'refs/heads/main',
        sourceDigest: TEST_WCORE_ACTIVE_POLICY.sourceDigest,
        predicateType: 'https://slsa.dev/provenance/v1',
        runner: 'github-hosted',
        asset: wcoreAsset,
        sha256: `sha256:${TEST_WCORE_ARCHIVE_SHA}`,
        verified: true,
      },
      binary: {
        name: 'wayland-core',
        sha256: `sha256:${TEST_WCORE_BINARY_SHA}`,
        // Unsigned fixture: the staged bytes are the upstream bytes verbatim,
        // which is what a build with no Developer ID identity produces.
        stagedSha256: `sha256:${TEST_WCORE_BINARY_SHA}`,
      },
      files: ['wayland-core'],
      skipped: false,
    })
  );
  const wnanoBinary = path.join(resources, 'bundled-wayland-nano', `darwin-${arch}`, 'wayland-nano');
  fs.mkdirSync(path.dirname(wnanoBinary), { recursive: true });
  fs.writeFileSync(wnanoBinary, TEST_WNANO_BYTES);
  const wnanoAsset = testWNanoAuthority.getAssetName('darwin', arch, TEST_WNANO_RELEASE);
  fs.writeFileSync(
    path.join(resources, 'bundled-wayland-nano', `darwin-${arch}`, 'manifest.json'),
    JSON.stringify({
      contract: testWNanoAuthority.BUNDLE_CONTRACT,
      generator: testWNanoAuthority.BUNDLE_GENERATOR,
      platform: 'darwin',
      arch,
      releaseTag: TEST_WNANO_RELEASE,
      version: TEST_WNANO_RELEASE,
      sourceType: 'download',
      verified: true,
      source: {
        owner: 'FerroxLabs',
        repository: 'wayland-nano',
        url: `https://github.com/FerroxLabs/wayland-nano/releases/download/${TEST_WNANO_RELEASE}/${wnanoAsset}`,
        asset: wnanoAsset,
        archiveSha256: `sha256:${TEST_WNANO_ARCHIVE_SHA}`,
      },
      publisherAttestation: {
        contract: 'wayland-publisher-attestations/1.0',
        policyId: TEST_WNANO_POLICY.id,
        repository: TEST_WNANO_POLICY.repository,
        signerWorkflow: TEST_WNANO_POLICY.signerWorkflow,
        sourceRef: TEST_WNANO_POLICY.sourceRef,
        sourceDigest: TEST_WNANO_POLICY.sourceDigest,
        predicateType: TEST_WNANO_POLICY.predicateType,
        runner: TEST_WNANO_POLICY.runner,
        asset: wnanoAsset,
        sha256: `sha256:${TEST_WNANO_ARCHIVE_SHA}`,
        verified: true,
      },
      binary: {
        name: 'wayland-nano',
        sha256: `sha256:${TEST_WNANO_BINARY_SHA}`,
        stagedSha256: `sha256:${TEST_WNANO_BINARY_SHA}`,
      },
      files: ['wayland-nano'],
      skipped: false,
    })
  );
  for (const extractorArch of ['arm64', 'x64']) {
    const target = path.join(resources, 'classic-recovery-tools', 'win', extractorArch, '7za.exe');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(process.cwd(), 'node_modules', '7zip-bin', 'win', extractorArch, '7za.exe'), target);
  }
  if (includeOfficeCli) {
    const [platform, officeArch] = officeCliRuntime.split('-');
    const binaryName = platform === 'win32' ? 'officecli.exe' : 'officecli';
    const binary = path.join(resources, 'bundled-officecli', officeCliRuntime, binaryName);
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(binary)).digest('hex');
    fs.writeFileSync(
      path.join(resources, 'bundled-officecli', officeCliRuntime, 'manifest.json'),
      JSON.stringify({
        contract: 'iofficeai-officecli-native',
        version: 'v1.0.136',
        platform,
        arch: officeArch,
        asset: TEST_OFFICE_AUTHORITY.getAssetName(platform, officeArch),
        binary: binaryName,
        sha256: `sha256:${sha256}`,
        publisherSignatureProof:
          platform === 'darwin'
            ? TEST_OFFICE_SIGNATURE
            : { contract: 'not-verifiable-on-build-host', reason: 'not-macos-build-host' },
        contractProof: { contract: 'wayland-officecli-authoring/1.0', release: 'v1.0.136' },
        smokeProof: {
          formats: ['docx', 'xlsx', 'pptx'],
          operations: ['create', 'mutate', 'query', 'validate', 'view'],
          specialistPacks: [
            'officecli-financial-model',
            'officecli-data-dashboard',
            'officecli-word-form',
            'officecli-pitch-deck',
          ],
          specialistPrimitives: [
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
          ],
        },
      })
    );
  }
  return resources;
}

// A self-contained stand-in for "some other real executable that happens to sit on the build
// host". This used to copy /bin/echo, which does not exist on Windows (path.resolve turns it
// into <drive>:\bin\echo there), so the fixture writes its own stub instead: a runnable script
// with the host's spawnable extension, which - exactly like /bin/echo - carries neither the
// pinned OfficeCLI digest nor a Mach-O identity.
function writeEchoStub(root: string): string {
  const windows = process.platform === 'win32';
  const stub = path.join(root, windows ? 'echo-stub.cmd' : 'echo-stub');
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(stub, windows ? '@echo off\r\necho %*\r\n' : '#!/bin/sh\nprintf \'%s\\n\' "$@"\n', { mode: 0o755 });
  return stub;
}

function createPackagedResources(includeOfficeCli: boolean, officeCliRuntime = 'darwin-arm64'): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-packaged-resources-'));
  roots.push(root);
  addPackagedApp(root, 'arm64', includeOfficeCli, officeCliRuntime);
  return root;
}

function packagedResourcesPath(out: string): string {
  return path.join(out, 'mac-arm64', 'Wayland.app', 'Contents', 'Resources');
}

function wcoreManifestPath(out: string, runtime = 'darwin-arm64'): string {
  return path.join(packagedResourcesPath(out), 'bundled-wayland-core', runtime, 'manifest.json');
}

function wcoreBinaryPath(out: string, runtime = 'darwin-arm64'): string {
  return path.join(
    packagedResourcesPath(out),
    'bundled-wayland-core',
    runtime,
    runtime.startsWith('win32-') ? 'wayland-core.exe' : 'wayland-core'
  );
}

function wnanoManifestPath(out: string, runtime = 'darwin-arm64'): string {
  return path.join(packagedResourcesPath(out), 'bundled-wayland-nano', runtime, 'manifest.json');
}

function wnanoBinaryPath(out: string, runtime = 'darwin-arm64'): string {
  return path.join(
    packagedResourcesPath(out),
    'bundled-wayland-nano',
    runtime,
    runtime.startsWith('win32-') ? 'wayland-nano.exe' : 'wayland-nano'
  );
}

function verifyArgs(
  out: string,
  officeCliRuntime = 'darwin-arm64',
  wcoreRuntime = 'darwin-arm64',
  wnanoRuntime = wcoreRuntime
): string[] {
  return [
    'scripts/verify-packaged-resources.js',
    '--out',
    out,
    '--target-platform',
    wcoreRuntime.split('-')[0],
    '--target-arch',
    wcoreRuntime.split('-')[1],
    '--wcore-runtime',
    wcoreRuntime,
    '--wnano-runtime',
    wnanoRuntime,
    '--officecli-runtime',
    officeCliRuntime,
  ];
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

// The release gate pins `managed-cli-shims/officecli` with `posixExecutable: true` because
// that shim is tracked at git mode 100755 and must stay executable inside a darwin/linux
// package. NTFS cannot represent the POSIX executable bit — Node reports mode 0o666 for
// every writable file on Windows — so on a Windows host the darwin fixture below can never
// satisfy that one pin and the sweep always reports it as the single CRITICAL failure.
// Production never verifies a darwin package from a Windows host (the darwin path shells out
// to /usr/bin/codesign), so only the assertions that require the whole sweep to PASS are
// host-limited. Every failure-path assertion in this file stays active on all hosts.
const itAcceptedSweep = it.skipIf(process.platform === 'win32');

describe('packaged resource release gate', () => {
  const verify = (
    out: string,
    officeCliRuntime = 'darwin-arm64',
    wcoreRuntime = 'darwin-arm64',
    extra: Record<string, unknown> = {}
  ) =>
    verifyPackagedResources({
      argv: verifyArgs(out, officeCliRuntime, wcoreRuntime),
      cwd: process.cwd(),
      logger: silentLogger,
      wcoreAuthority: testWCoreAuthority,
      wnanoAuthority: testWNanoAuthority,
      wnanoPolicySelector: testWNanoPolicySelector,
      voiceAuthority: TEST_VOICE_AUTHORITY,
      bunAuthority: TEST_BUN_AUTHORITY,
      modelsAuthority: TEST_MODELS_AUTHORITY,
      officeCliAuthority: TEST_OFFICE_AUTHORITY,
      verifyOfficeCliDarwinSignature: () => TEST_OFFICE_SIGNATURE,
      verifyConstitutionFsDarwinSignature: () => undefined,
      verifyDarwinPackageSignature: () => undefined,
      verifyCapabilitySeal: () => undefined,
      ...extra,
    });

  itAcceptedSweep('accepts a non-empty native OfficeCLI binary plus manifest', () => {
    const out = createPackagedResources(true);
    expect(verify(out)).toMatchObject({ warnings: 3 });
  });

  it('rejects a Core bundle whose publisher attestation is absent or altered', () => {
    const out = createPackagedResources(true);
    const manifestPath = wcoreManifestPath(out);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
      publisherAttestation: { sourceDigest: string } | null;
    };
    manifest.publisherAttestation = null;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(() => verify(out)).toThrow(/CRITICAL resource/);

    const altered = createPackagedResources(true);
    const alteredPath = wcoreManifestPath(altered);
    const alteredManifest = JSON.parse(fs.readFileSync(alteredPath, 'utf8')) as {
      publisherAttestation: { sourceDigest: string };
    };
    alteredManifest.publisherAttestation.sourceDigest = 'f'.repeat(40);
    fs.writeFileSync(alteredPath, JSON.stringify(alteredManifest));
    expect(() => verify(altered)).toThrow(/CRITICAL resource/);
  });

  it('rejects a Nano bundle whose publisher attestation is absent or altered', () => {
    const out = createPackagedResources(true);
    const manifestPath = wnanoManifestPath(out);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
      publisherAttestation: { sourceDigest: string } | null;
    };
    manifest.publisherAttestation = null;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(() => verify(out)).toThrow(/CRITICAL resource/);

    const altered = createPackagedResources(true);
    const alteredPath = wnanoManifestPath(altered);
    const alteredManifest = JSON.parse(fs.readFileSync(alteredPath, 'utf8')) as {
      publisherAttestation: { sourceDigest: string };
    };
    alteredManifest.publisherAttestation.sourceDigest = 'f'.repeat(40);
    fs.writeFileSync(alteredPath, JSON.stringify(alteredManifest));
    expect(() => verify(altered)).toThrow(/CRITICAL resource/);
  });

  it('blocks a package whose bundled wayland-nano runtime is absent', () => {
    const out = createPackagedResources(true);
    fs.rmSync(path.join(packagedResourcesPath(out), 'bundled-wayland-nano'), { recursive: true, force: true });
    expect(() => verify(out)).toThrow(/CRITICAL resource/);
  });

  it('blocks a local-prebuilt or unverified wayland-nano manifest', () => {
    const out = createPackagedResources(true);
    const manifest = wnanoManifestPath(out);
    const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    metadata.sourceType = 'local-prebuilt';
    metadata.verified = false;
    fs.writeFileSync(manifest, JSON.stringify(metadata));
    expect(() => verify(out)).toThrow();
  });

  it('blocks wayland-nano binary byte drift even when the manifest is unchanged', () => {
    const out = createPackagedResources(true);
    fs.appendFileSync(wnanoBinaryPath(out), 'tampered');
    expect(() => verify(out)).toThrow();
  });

  it('blocks undeclared extra wayland-nano runtime content', () => {
    const out = createPackagedResources(true);
    const extra = path.join(packagedResourcesPath(out), 'bundled-wayland-nano', 'linux-x64');
    fs.mkdirSync(extra, { recursive: true });
    fs.writeFileSync(path.join(extra, 'wayland-nano'), 'unverified-extra-runtime');
    expect(() => verify(out)).toThrow();
  });

  it('rejects a missing or malformed packaged capability seal', () => {
    const malformed = createPackagedResources(true);
    expect(() => verify(malformed, 'darwin-arm64', 'darwin-arm64', { verifyCapabilitySeal: undefined })).toThrow(
      /CRITICAL resource/
    );

    const missing = createPackagedResources(true);
    fs.rmSync(path.join(packagedResourcesPath(missing), 'capability-seal.json'));
    expect(() => verify(missing)).toThrow(/CRITICAL resource/);
  });

  itAcceptedSweep('accepts an intentionally-omitted seal on a local verification build (--allow-missing-seal)', () => {
    const out = createPackagedResources(true);
    fs.rmSync(path.join(packagedResourcesPath(out), 'capability-seal.json'));
    expect(() =>
      verify(out, 'darwin-arm64', 'darwin-arm64', {
        argv: [...verifyArgs(out, 'darwin-arm64', 'darwin-arm64'), '--allow-missing-seal'],
      })
    ).not.toThrow();
  });

  it('rejects a seal that is PRESENT on a local verification build (enforces omit-not-forge)', () => {
    const out = createPackagedResources(true); // fixture writes capability-seal.json
    expect(() =>
      verify(out, 'darwin-arm64', 'darwin-arm64', {
        argv: [...verifyArgs(out, 'darwin-arm64', 'darwin-arm64'), '--allow-missing-seal'],
      })
    ).toThrow(/CRITICAL resource/);
  });

  it('fails closed on Windows unless the unsupported Constitution authority has no packaged helper bytes', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'constitution-fs-windows-'));
    roots.push(root);
    expect(verifyConstitutionFsBundle(root, 'win32', 'x64')).toBe(false);
    fs.rmSync(root, { recursive: true, force: true });
    expect(verifyConstitutionFsBundle(root, 'win32', 'x64')).toBe(true);
  });

  // A build with no Developer ID identity stages the helper UNSIGNED on purpose
  // (see signDarwinStagedBinary). ld64 only linker-signs arm64, never x86_64, so
  // a gate that demanded *any* signature failed every darwin-x64 build without
  // signing secrets while darwin-arm64 passed on the linker's ad-hoc signature.
  // A signed build must still be held to a real Developer ID signature - ad-hoc
  // is exactly what Apple refuses to notarize.
  it.each(['arm64', 'x64'] as const)(
    'requires a Constitution helper signature on darwin-%s only when the build had a signing identity',
    (arch) => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), `constitution-fs-sign-${arch}-`));
      roots.push(root);
      const runtimeRoot = path.join(root, `darwin-${arch}`);
      const authority = testConstitutionAuthority(arch);
      writeMachExecutable(path.join(runtimeRoot, 'wayland-constitution-fs'), arch);
      fs.writeFileSync(
        path.join(runtimeRoot, 'manifest.json'),
        JSON.stringify({
          schemaVersion: 1,
          protocolVersion: 2,
          platform: 'darwin',
          arch,
          binary: { fileName: authority.fileName, sha256: authority.sha256, size: authority.size },
        })
      );
      fs.writeFileSync(path.join(runtimeRoot, 'package-authority.json'), JSON.stringify(authority));

      const signatureChecks: string[] = [];
      const record = (binaryPath: string) => {
        signatureChecks.push(binaryPath);
      };
      expect(verifyConstitutionFsBundle(root, 'darwin', arch, authority, record, false)).toBe(true);
      expect(signatureChecks).toEqual([]);
      expect(verifyConstitutionFsBundle(root, 'darwin', arch, authority, record, true)).toBe(true);
      expect(signatureChecks).toEqual([path.join(runtimeRoot, 'wayland-constitution-fs')]);
      // Pin WHICH check the default performs, without spawning anything: the
      // default must assert a Ferrox Labs Developer ID signature (codesign -R
      // with the Developer ID leaf marker OID), not the ad-hoc-accepting
      // `codesign --verify --strict` it replaced. A bare toThrow() here would
      // also be satisfied by `spawnSync /usr/bin/codesign ENOENT` on the ubuntu
      // and windows shards, so the requirement itself is what gets asserted.
      const argv: string[][] = [];
      verifyConstitutionFsBundle(
        root,
        'darwin',
        arch,
        authority,
        (binaryPath: string) => {
          assertDarwinDeveloperIdSigned(binaryPath, {
            execFileSync: (_file: string, args: string[]) => {
              argv.push(args);
              return Buffer.alloc(0);
            },
          });
        },
        true
      );
      expect(argv).toHaveLength(1);
      expect(argv[0]).toContain('-R');
      const requirement = argv[0][argv[0].indexOf('-R') + 1];
      expect(requirement.startsWith('=')).toBe(true);
      expect(requirement).toContain('field.1.2.840.113635.100.6.1.13');
      expect(requirement).toContain(`subject.OU] = "${DARWIN_TEAM_ID}"`);
      expect(argv[0]).not.toEqual(['--verify', '--strict', path.join(runtimeRoot, 'wayland-constitution-fs')]);
    }
  );

  // Binds the DEFAULT signature check, with nothing injected. Node's own binary
  // is a real thin arm64 Mach-O carrying a valid Developer ID signature from a
  // DIFFERENT team, so `codesign --verify --strict` (the check this replaced)
  // accepts it while the Ferrox Labs Developer ID requirement refuses it. If the
  // default is ever reverted to the ad-hoc-accepting form, this goes red.
  // darwin-only because the real check shells out to /usr/bin/codesign.
  it.skipIf(process.platform !== 'darwin')(
    'default Constitution signature check pins the Ferrox Labs Developer ID, not merely "signed"',
    () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'constitution-fs-default-'));
      roots.push(root);
      const runtimeRoot = path.join(root, 'darwin-arm64');
      fs.mkdirSync(runtimeRoot, { recursive: true });
      const binary = path.join(runtimeRoot, 'wayland-constitution-fs');
      fs.copyFileSync(process.execPath, binary);
      fs.chmodSync(binary, 0o755);
      const bytes = fs.readFileSync(binary);
      const sha256 = `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
      const authority = {
        supported: true,
        protocolVersion: 2,
        platform: 'darwin',
        arch: 'arm64',
        fileName: 'wayland-constitution-fs',
        size: bytes.length,
        sha256,
      };
      fs.writeFileSync(
        path.join(runtimeRoot, 'manifest.json'),
        JSON.stringify({
          schemaVersion: 1,
          protocolVersion: 2,
          platform: 'darwin',
          arch: 'arm64',
          binary: { fileName: authority.fileName, sha256, size: bytes.length },
        })
      );
      fs.writeFileSync(path.join(runtimeRoot, 'package-authority.json'), JSON.stringify(authority));

      // Signed, and every byte/authority check passes, so without an identity the
      // gate accepts it - and `codesign --verify --strict` would accept it too.
      expect(execFileSync('/usr/bin/codesign', ['--verify', '--strict', binary], { stdio: 'pipe' })).toBeDefined();
      expect(verifyConstitutionFsBundle(root, 'darwin', 'arm64', authority, undefined, false)).toBe(true);
      // With an identity the default must refuse it: wrong signing team.
      expect(() => verifyConstitutionFsBundle(root, 'darwin', 'arm64', authority, undefined, true)).toThrow(
        /code failed to satisfy specified code requirement/
      );
    }
  );

  // Covers the REAL hand-off, not the leaf: verifyPackagedResources -> the
  // 23-positional-parameter isNonEmpty -> verifyConstitutionFsBundle. A single
  // reordered argument in that list is literally what shipped this bug, and it
  // would silently disable Constitution signature enforcement on signed releases
  // while every leaf-level test above stayed green. Assert the injected check is
  // reached through the full sweep, with the flag and without it.
  itAcceptedSweep('routes --require-darwin-signature through the sweep to the Constitution helper', () => {
    const out = createPackagedResources(true);
    const helper = path.join(
      packagedResourcesPath(out),
      'bundled-constitution-fs',
      'darwin-arm64',
      'wayland-constitution-fs'
    );

    const withoutFlag: string[] = [];
    expect(
      verify(out, 'darwin-arm64', 'darwin-arm64', {
        verifyConstitutionFsDarwinSignature: (binaryPath: string) => {
          withoutFlag.push(binaryPath);
        },
      })
    ).toMatchObject({ warnings: 3 });
    expect(withoutFlag).toEqual([]);

    const withFlag: string[] = [];
    expect(
      verify(out, 'darwin-arm64', 'darwin-arm64', {
        argv: [...verifyArgs(out, 'darwin-arm64', 'darwin-arm64'), '--require-darwin-signature'],
        darwinSignedCheck: () => true,
        verifyConstitutionFsDarwinSignature: (binaryPath: string) => {
          withFlag.push(binaryPath);
        },
      })
    ).toMatchObject({ warnings: 3 });
    expect(withFlag).toEqual([helper]);

    // And a refusal from that check must fail the whole sweep, not be swallowed.
    expect(() =>
      verify(out, 'darwin-arm64', 'darwin-arm64', {
        argv: [...verifyArgs(out, 'darwin-arm64', 'darwin-arm64'), '--require-darwin-signature'],
        darwinSignedCheck: () => true,
        verifyConstitutionFsDarwinSignature: () => {
          throw new Error('test-requirement: code failed to satisfy specified code requirement(s)');
        },
      })
    ).toThrow(/CRITICAL resource/);
  });

  it('rejects helper digest drift and foreign runtime contamination', () => {
    const out = createPackagedResources(true);
    const resources = packagedResourcesPath(out);
    const bundle = path.join(resources, 'bundled-constitution-fs');
    fs.appendFileSync(path.join(bundle, 'darwin-arm64', 'wayland-constitution-fs'), 'tamper');
    expect(() => verify(out)).toThrow(/CRITICAL resource/);

    const clean = createPackagedResources(true);
    const cleanBundle = path.join(packagedResourcesPath(clean), 'bundled-constitution-fs');
    fs.cpSync(path.join(cleanBundle, 'darwin-arm64'), path.join(cleanBundle, 'darwin-x64'), { recursive: true });
    expect(() => verify(clean)).toThrow(/CRITICAL resource/);
  });

  it('rejects a packaged Constitution helper that advertises protocol v1', () => {
    const out = createPackagedResources(true);
    const manifestPath = path.join(
      packagedResourcesPath(out),
      'bundled-constitution-fs',
      'darwin-arm64',
      'manifest.json'
    );
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { protocolVersion: number };
    manifest.protocolVersion = 1;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(() => verify(out)).toThrow(/CRITICAL resource/);
  });

  // #1033. The two JSON files beside the helper ship INSIDE the same directory as
  // the helper, so anything able to rewrite the binary can rewrite them too. The
  // only authority that is not in the tamperer's reach is the one compiled into
  // app.asar - which is also the one the app re-hashes the helper against at every
  // launch. Until the gate reads that, a consistent three-file substitution walks
  // straight through and the build ships a helper nobody authorised.
  itAcceptedSweep('rejects a helper substitution that also rewrites its adjacent manifest and package authority', () => {
    const out = createPackagedResources(true);
    expect(verify(out)).toMatchObject({ warnings: 3 });

    const runtimeRoot = path.join(packagedResourcesPath(out), 'bundled-constitution-fs', 'darwin-arm64');
    const substituted = Buffer.concat([machExecutableBytes('arm64'), Buffer.from('substituted-helper')]);
    const sha256 = `sha256:${crypto.createHash('sha256').update(substituted).digest('hex')}`;
    fs.writeFileSync(path.join(runtimeRoot, 'wayland-constitution-fs'), substituted, { mode: 0o755 });
    fs.writeFileSync(
      path.join(runtimeRoot, 'manifest.json'),
      JSON.stringify({
        schemaVersion: 1,
        protocolVersion: 2,
        platform: 'darwin',
        arch: 'arm64',
        binary: { fileName: 'wayland-constitution-fs', sha256, size: substituted.length },
      })
    );
    fs.writeFileSync(
      path.join(runtimeRoot, 'package-authority.json'),
      JSON.stringify({ ...testConstitutionAuthority('arm64'), sha256, size: substituted.length })
    );

    expect(() => verify(out)).toThrow(/CRITICAL resource/);
  });

  // #1036. A Developer ID signature proves only "Ferrox Labs signed something".
  // prepareConstitutionFs puts the pre-signature digest in the code-signing
  // IDENTIFIER precisely so the signature names the bytes it was minted for, and
  // wcore/wnano already require that identifier. The Constitution helper asked for
  // no identifier at all, so any other helper we ever signed satisfied its check.
  itAcceptedSweep('binds the Constitution signature check to the identifier minted for those exact bytes', () => {
    const out = createPackagedResources(true);
    const identifiers: unknown[] = [];
    expect(
      verify(out, 'darwin-arm64', 'darwin-arm64', {
        argv: [...verifyArgs(out, 'darwin-arm64', 'darwin-arm64'), '--require-darwin-signature'],
        darwinSignedCheck: () => true,
        verifyConstitutionFsDarwinSignature: (_binaryPath: string, identifier: unknown) => {
          identifiers.push(identifier);
        },
      })
    ).toMatchObject({ warnings: 3 });
    expect(identifiers).toEqual([testConstitutionAuthority('arm64').darwinSignatureIdentifier]);
    expect(identifiers[0]).toMatch(/^wayland-constitution-fs\.[0-9a-f]{64}$/);
  });

  // A signed release whose package authority carries no digest-bound identifier
  // cannot be checked against one, so it must be refused rather than fall back to
  // "any Ferrox Labs signature will do".
  itAcceptedSweep('refuses a signed Constitution helper whose package authority names no signing identifier', () => {
    const out = createPackagedResources(true);
    const authorityPath = path.join(
      packagedResourcesPath(out),
      'bundled-constitution-fs',
      'darwin-arm64',
      'package-authority.json'
    );
    const authority = JSON.parse(fs.readFileSync(authorityPath, 'utf8')) as Record<string, unknown>;
    delete authority.darwinSignatureIdentifier;
    fs.writeFileSync(authorityPath, JSON.stringify(authority));
    expect(() =>
      verify(out, 'darwin-arm64', 'darwin-arm64', {
        argv: [...verifyArgs(out, 'darwin-arm64', 'darwin-arm64'), '--require-darwin-signature'],
        darwinSignedCheck: () => true,
        verifyConstitutionFsDarwinSignature: () => undefined,
      })
    ).toThrow(/CRITICAL resource/);
  });

  itAcceptedSweep('uses the package-sealed Constitution authority instead of mutable tracked authority', () => {
    const out = createPackagedResources(true);
    expect(verify(out)).toMatchObject({ warnings: 3 });
    expect(() =>
      verify(out, 'darwin-arm64', 'darwin-arm64', {
        constitutionFsAuthority: { ...testConstitutionAuthority('arm64'), sha256: `sha256:${'0'.repeat(64)}` },
      })
    ).toThrow(/CRITICAL/);
  });

  it('blocks a package whose native OfficeCLI bundle is absent', () => {
    const out = createPackagedResources(false);
    expect(() => verify(out)).toThrow();
  });

  it.each(['officecli', 'officecli.cmd'])('blocks a package whose managed %s guard is absent', (name) => {
    const out = createPackagedResources(true);
    fs.rmSync(path.join(packagedResourcesPath(out), 'managed-cli-shims', name));
    expect(() => verify(out)).toThrow(/CRITICAL/);
  });

  it.each(['officecli', 'officecli.cmd'])('blocks a package whose managed %s guard bytes drift', (name) => {
    const out = createPackagedResources(true);
    fs.appendFileSync(path.join(packagedResourcesPath(out), 'managed-cli-shims', name), 'tampered');
    expect(() => verify(out)).toThrow(/CRITICAL/);
  });

  it('blocks a package whose managed POSIX OfficeCLI guard is not executable', () => {
    if (process.platform === 'win32') return;
    const out = createPackagedResources(true);
    const guard = path.join(packagedResourcesPath(out), 'managed-cli-shims', 'officecli');
    fs.chmodSync(guard, 0o644);
    expect(() => verify(out)).toThrow(/CRITICAL/);
  });

  it('blocks a package whose managed OfficeCLI guard is a symbolic link', () => {
    if (process.platform === 'win32') return;
    const out = createPackagedResources(true);
    const guard = path.join(packagedResourcesPath(out), 'managed-cli-shims', 'officecli');
    const substitute = path.join(out, 'substitute-officecli');
    fs.copyFileSync(guard, substitute);
    fs.rmSync(guard);
    fs.symlinkSync(substitute, guard);
    expect(() => verify(out)).toThrow(/CRITICAL/);
  });

  it('blocks a package whose Classic recovery extractor bytes drift', () => {
    const out = createPackagedResources(true);
    const extractor = path.join(
      out,
      'mac-arm64',
      'Wayland.app',
      'Contents',
      'Resources',
      'classic-recovery-tools',
      'win',
      'x64',
      '7za.exe'
    );
    fs.appendFileSync(extractor, 'tampered');

    expect(() => verify(out)).toThrow();
  });

  it('blocks a package when the OfficeCLI binary no longer matches its manifest', () => {
    const out = createPackagedResources(true);
    const binary = path.join(
      out,
      'mac-arm64',
      'Wayland.app',
      'Contents',
      'Resources',
      'bundled-officecli',
      'darwin-arm64',
      'officecli'
    );
    fs.appendFileSync(binary, 'tampered');
    expect(() => verify(out)).toThrow();
  });

  it('rejects a substituted echo stub even when the OfficeCLI manifest rewrites its own checksum and signature claim', () => {
    const out = createPackagedResources(true);
    const runtime = path.join(packagedResourcesPath(out), 'bundled-officecli', 'darwin-arm64');
    const binary = path.join(runtime, 'officecli');
    const manifest = path.join(runtime, 'manifest.json');
    fs.copyFileSync(writeEchoStub(out), binary);
    const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    metadata.sha256 = `sha256:${crypto.createHash('sha256').update(fs.readFileSync(binary)).digest('hex')}`;
    metadata.publisherSignatureProof = TEST_OFFICE_SIGNATURE;
    fs.writeFileSync(manifest, JSON.stringify(metadata));
    expect(() => verify(out)).toThrow(/CRITICAL/);
  });

  it('blocks a mac package whose OfficeCLI publisher signature proof is broadened', () => {
    const out = createPackagedResources(true);
    const manifest = path.join(
      out,
      'mac-arm64',
      'Wayland.app',
      'Contents',
      'Resources',
      'bundled-officecli',
      'darwin-arm64',
      'manifest.json'
    );
    const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    metadata.publisherSignatureProof.entitlements.push('com.apple.security.cs.disable-library-validation');
    fs.writeFileSync(manifest, JSON.stringify(metadata));

    expect(() => verify(out)).toThrow();
  });

  it('blocks a package without executable three-format smoke proof', () => {
    const out = createPackagedResources(true);
    const manifest = path.join(
      out,
      'mac-arm64',
      'Wayland.app',
      'Contents',
      'Resources',
      'bundled-officecli',
      'darwin-arm64',
      'manifest.json'
    );
    const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    metadata.smokeProof.formats = ['docx', 'xlsx'];
    fs.writeFileSync(manifest, JSON.stringify(metadata));
    expect(() => verify(out)).toThrow();
  });

  it('blocks a package without executable specialist behavior proof', () => {
    const out = createPackagedResources(true);
    const manifest = path.join(
      out,
      'mac-arm64',
      'Wayland.app',
      'Contents',
      'Resources',
      'bundled-officecli',
      'darwin-arm64',
      'manifest.json'
    );
    const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    metadata.smokeProof.specialistPrimitives = metadata.smokeProof.specialistPrimitives.filter(
      (primitive: string) => primitive !== 'pptx-embedded-chart'
    );
    fs.writeFileSync(manifest, JSON.stringify(metadata));
    expect(() => verify(out)).toThrow();
  });

  it('blocks a local-prebuilt or unverified wayland-core manifest', () => {
    const out = createPackagedResources(true);
    const manifest = wcoreManifestPath(out);
    const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    metadata.sourceType = 'local-prebuilt';
    metadata.verified = false;
    fs.writeFileSync(manifest, JSON.stringify(metadata));
    expect(() => verify(out)).toThrow();
  });

  it('blocks wayland-core archive provenance drift', () => {
    const out = createPackagedResources(true);
    const manifest = wcoreManifestPath(out);
    const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    metadata.source.archiveSha256 = `sha256:${'b'.repeat(64)}`;
    fs.writeFileSync(manifest, JSON.stringify(metadata));
    expect(() => verify(out)).toThrow();
  });

  it('blocks a self-asserted wayland-core binary digest', () => {
    const out = createPackagedResources(true);
    const manifest = wcoreManifestPath(out);
    const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    metadata.binary.sha256 = `sha256:${'c'.repeat(64)}`;
    fs.writeFileSync(manifest, JSON.stringify(metadata));
    expect(() => verify(out)).toThrow();
  });

  it('blocks wayland-core binary byte drift even when the manifest is unchanged', () => {
    const out = createPackagedResources(true);
    fs.appendFileSync(wcoreBinaryPath(out), 'tampered');
    expect(() => verify(out)).toThrow();
  });

  it('fails closed on a wayland-core manifest with no staged digest', () => {
    const out = createPackagedResources(true);
    const manifest = wcoreManifestPath(out);
    const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    delete metadata.binary.stagedSha256;
    fs.writeFileSync(manifest, JSON.stringify(metadata));
    // Without it there is nothing pinning the shipped bytes, so the gate must
    // refuse rather than fall back to a laxer comparison.
    expect(() => verify(out)).toThrow(/CRITICAL resource/);
  });

  it('demands a Developer ID signature once a darwin manifest claims signed staging', () => {
    const out = createPackagedResources(true);
    const manifest = wcoreManifestPath(out);
    const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    // Model a signed staging: the staged bytes differ from the pinned upstream
    // bytes, which is only legitimate because we signed them.
    fs.appendFileSync(wcoreBinaryPath(out), 'signature');
    metadata.binary.stagedSha256 = `sha256:${crypto
      .createHash('sha256')
      .update(fs.readFileSync(wcoreBinaryPath(out)))
      .digest('hex')}`;
    fs.writeFileSync(manifest, JSON.stringify(metadata));

    // Bytes match the staged digest, so only the signature stands between this
    // and acceptance: unsigned must fail. The accepting half of this pair lives
    // in the itAcceptedSweep spec below, because a full accepting sweep cannot
    // run on a Windows host (the fixture cannot reproduce POSIX exec modes).
    expect(() => verify(out, 'darwin-arm64', 'darwin-arm64', { darwinSignedCheck: () => false })).toThrow(
      /CRITICAL resource/
    );
  });

  itAcceptedSweep('accepts a darwin manifest claiming signed staging when the signature is valid', () => {
    const out = createPackagedResources(true);
    const manifest = wcoreManifestPath(out);
    const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    fs.appendFileSync(wcoreBinaryPath(out), 'signature');
    metadata.binary.stagedSha256 = `sha256:${crypto
      .createHash('sha256')
      .update(fs.readFileSync(wcoreBinaryPath(out)))
      .digest('hex')}`;
    fs.writeFileSync(manifest, JSON.stringify(metadata));
    expect(() => verify(out, 'darwin-arm64', 'darwin-arm64', { darwinSignedCheck: () => true })).not.toThrow();
  });

  it('refuses unsigned darwin runtimes once the build had a signing identity', () => {
    const out = createPackagedResources(true);
    // Unsigned staging: staged bytes are the upstream bytes verbatim. That is
    // fine for a local build, but a release that could sign and did not would
    // ship without the hardened runtime and be rejected by Apple.
    expect(() =>
      verify(out, 'darwin-arm64', 'darwin-arm64', {
        requireDarwinSignature: true,
        darwinSignedCheck: () => false,
      })
    ).toThrow(/CRITICAL resource/);
  });

  itAcceptedSweep('accepts a signed darwin runtime under release signature enforcement', () => {
    const out = createPackagedResources(true);
    expect(() =>
      verify(out, 'darwin-arm64', 'darwin-arm64', {
        requireDarwinSignature: true,
        darwinSignedCheck: () => true,
      })
    ).not.toThrow();
  });

  it('blocks a wayland-core manifest from the wrong release', () => {
    const out = createPackagedResources(true);
    const manifest = wcoreManifestPath(out);
    const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    metadata.releaseTag = 'v0.12.24';
    metadata.version = 'v0.12.24';
    fs.writeFileSync(manifest, JSON.stringify(metadata));
    expect(() => verify(out)).toThrow();
  });

  it('blocks a package whose valid wayland-core runtime is for the wrong target', () => {
    const out = createPackagedResources(true);
    expect(() => verify(out, 'darwin-arm64', 'win32-x64')).toThrow();
  });

  it('blocks undeclared extra wayland-core runtime content', () => {
    const out = createPackagedResources(true);
    const extra = path.join(packagedResourcesPath(out), 'bundled-wayland-core', 'linux-x64');
    fs.mkdirSync(extra, { recursive: true });
    fs.writeFileSync(path.join(extra, 'wayland-core'), 'unverified-extra-runtime');
    expect(() => verify(out)).toThrow();
  });

  it('blocks stale executables inside the declared wayland-core runtime', () => {
    const out = createPackagedResources(true);
    const runtime = path.dirname(wcoreBinaryPath(out));
    fs.writeFileSync(path.join(runtime, 'wcore'), 'stale-unpinned-fallback');
    expect(() => verify(out)).toThrow();
  });

  it('blocks symlinks inside the declared wayland-core runtime', () => {
    const out = createPackagedResources(true);
    const runtime = path.dirname(wcoreBinaryPath(out));
    fs.symlinkSync('wayland-core', path.join(runtime, 'wcore'));
    expect(() => verify(out)).toThrow();
  });

  it('blocks an undeclared extra wayland-core runtime even when independently valid', () => {
    const out = createPackagedResources(true);
    const resources = packagedResourcesPath(out);
    const source = path.join(resources, 'bundled-wayland-core', 'darwin-arm64');
    const extra = path.join(resources, 'bundled-wayland-core', 'linux-x64');
    fs.cpSync(source, extra, { recursive: true });
    const manifest = path.join(extra, 'manifest.json');
    const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    metadata.platform = 'linux';
    metadata.arch = 'x64';
    metadata.source.asset = testWCoreAuthority.getAssetName('linux', 'x64', TEST_WCORE_RELEASE);
    metadata.source.url = `https://github.com/FerroxLabs/wayland-core/releases/download/${TEST_WCORE_RELEASE}/${metadata.source.asset}`;
    fs.writeFileSync(manifest, JSON.stringify(metadata));
    expect(() => verify(out)).toThrow();
  });

  it('blocks undeclared extra OfficeCLI runtime content', () => {
    const out = createPackagedResources(true);
    const resources = packagedResourcesPath(out);
    const source = path.join(resources, 'bundled-officecli', 'darwin-arm64');
    fs.cpSync(source, path.join(resources, 'bundled-officecli', 'linux-x64'), { recursive: true });
    expect(() => verify(out)).toThrow();
  });

  it('does not treat hidden placeholder files as a critical directory payload', () => {
    const out = createPackagedResources(true);
    const modelDir = path.join(packagedResourcesPath(out), 'voice-models');
    fs.rmSync(modelDir, { recursive: true, force: true });
    fs.mkdirSync(modelDir, { recursive: true });
    fs.writeFileSync(path.join(modelDir, '.DS_Store'), 'placeholder');
    expect(() => verify(out)).toThrow();
  });

  /**
   * The shipped-without-a-voice-floor case, which is what a build that never
   * ran `prepareVoiceModel.js` actually produces: `resources/voice-models` is
   * gitignored, so on a fresh clone the directory does not exist at all and
   * electron-builder drops the `extraResources` entry silently and exits 0.
   *
   * The existing coverage above only pinned "present but empty". An ABSENT
   * directory takes a different path through `isNonEmpty` - `fs.statSync`
   * throws ENOENT and the blanket catch turns it into `false` - so it was
   * possible to keep the placeholder case green while the real one regressed.
   * On-device voice is the floor the whole "works with no keys" story rests on;
   * shipping without it must be a hard stop, not a warning.
   */
  it('refuses to ship when the bundled voice model directory is absent entirely', () => {
    const out = createPackagedResources(true);
    fs.rmSync(path.join(packagedResourcesPath(out), 'voice-models'), { recursive: true, force: true });
    expect(fs.existsSync(path.join(packagedResourcesPath(out), 'voice-models'))).toBe(false);
    expect(() => verify(out)).toThrow(/CRITICAL/);
  });

  /** KNOWN POSITIVE: the same fixture, untouched, must pass. */
  // Requires the whole sweep to PASS, so it is host-limited for the reason
  // documented at `itAcceptedSweep`: NTFS cannot carry the POSIX executable bit
  // this darwin fixture pins. The four sibling accepted-sweep cases already use
  // it; this one was left on plain `it` and was the only reason the
  // windows-2022 3/4 shard stayed red.
  itAcceptedSweep('KNOWN POSITIVE: the complete fixture with the voice model present verifies', () => {
    const out = createPackagedResources(true);
    expect(() => verify(out)).not.toThrow();
  });

  it('blocks a package that contains a valid runtime for the wrong target only', () => {
    const out = createPackagedResources(true, 'win32-x64');
    expect(() => verify(out, 'darwin-arm64')).toThrow();
  });

  it('blocks verification when the build does not declare its target runtime', () => {
    const out = createPackagedResources(true);
    expect(() =>
      verifyPackagedResources({
        argv: ['scripts/verify-packaged-resources.js', '--out', out],
        cwd: process.cwd(),
        logger: silentLogger,
        wcoreAuthority: testWCoreAuthority,
      })
    ).toThrow();
  });

  // Acceptance path: skipped on Windows like the other accepting specs, because the
  // fixture cannot reproduce the POSIX executable mode that managed-cli-shims needs.
  itAcceptedSweep('accepts a target that declares it bundles no wayland-nano runtime', () => {
    // wayland-nano publishes no win32-arm64 build. That target legitimately ships
    // none, but the absence has to be declared rather than inferred from a missing
    // flag, which is what --no-wnano-runtime states.
    const out = createPackagedResources(true, 'darwin-arm64');
    fs.rmSync(path.join(packagedResourcesPath(out), 'bundled-wayland-nano'), { recursive: true, force: true });
    const argv = verifyArgs(out).filter(
      (arg, index, all) => arg !== '--wnano-runtime' && all[index - 1] !== '--wnano-runtime'
    );
    expect(() => verify(out, 'darwin-arm64', 'darwin-arm64', { argv: [...argv, '--no-wnano-runtime'] })).not.toThrow();
  });

  it('blocks a declared-absent wayland-nano bundle that is actually present', () => {
    // Opting out is not the same as not looking: a stale or half-copied bundle must
    // never ride along unverified on the target that says it ships none.
    const out = createPackagedResources(true, 'darwin-arm64');
    const argv = verifyArgs(out).filter(
      (arg, index, all) => arg !== '--wnano-runtime' && all[index - 1] !== '--wnano-runtime'
    );
    expect(() => verify(out, 'darwin-arm64', 'darwin-arm64', { argv: [...argv, '--no-wnano-runtime'] })).toThrow(
      /bundled-wayland-nano/
    );
  });

  itAcceptedSweep('accepts a target that declares it bundles no bun runtime', () => {
    // bun publishes no Windows ARM64 build, so that target bundles none and never
    // has. Declaring it keeps the gate honest instead of leaving a binary-less
    // directory, which is what win32-arm64 was shipping.
    const out = createPackagedResources(true, 'darwin-arm64');
    fs.rmSync(path.join(packagedResourcesPath(out), 'bundled-bun'), { recursive: true, force: true });
    expect(() =>
      verify(out, 'darwin-arm64', 'darwin-arm64', { argv: [...verifyArgs(out), '--no-bun-runtime'] })
    ).not.toThrow();
  });

  it('blocks a declared-absent bun bundle that is actually present', () => {
    const out = createPackagedResources(true, 'darwin-arm64');
    expect(() =>
      verify(out, 'darwin-arm64', 'darwin-arm64', { argv: [...verifyArgs(out), '--no-bun-runtime'] })
    ).toThrow(/bundled-bun/);
  });

  it('rejects declaring both a wayland-nano runtime and no wayland-nano runtime', () => {
    const out = createPackagedResources(true, 'darwin-arm64');
    expect(() =>
      verify(out, 'darwin-arm64', 'darwin-arm64', {
        argv: [...verifyArgs(out), '--no-wnano-runtime'],
      })
    ).toThrow(/cannot be combined/);
  });

  it('blocks verification when only the OfficeCLI target is declared', () => {
    const out = createPackagedResources(true);
    expect(() =>
      verifyPackagedResources({
        argv: [
          'scripts/verify-packaged-resources.js',
          '--out',
          out,
          '--target-platform',
          'darwin',
          '--target-arch',
          'arm64',
          '--officecli-runtime',
          'darwin-arm64',
        ],
        cwd: process.cwd(),
        logger: silentLogger,
        wcoreAuthority: testWCoreAuthority,
      })
    ).toThrow(/--wcore-runtime/);
  });

  itAcceptedSweep('selects exactly the requested current app when arm64 and x64 packages coexist', () => {
    const out = createPackagedResources(true);
    addPackagedApp(out, 'x64', true);

    expect(verify(out)).toMatchObject({ warnings: 3 });
    expect(verify(out, 'darwin-x64', 'darwin-x64')).toMatchObject({ warnings: 3 });
  });

  it('fails closed when the requested architecture is missing or ambiguous', () => {
    const missing = createPackagedResources(true);
    expect(() => verify(missing, 'darwin-x64', 'darwin-x64')).toThrow(/exactly one current darwin-x64/);

    const ambiguous = createPackagedResources(true);
    addPackagedApp(ambiguous, 'x64', true);
    addPackagedApp(ambiguous, 'x64', true, 'darwin-x64', 'mac-x64-copy', 'Wayland Copy.app');
    expect(() => verify(ambiguous, 'darwin-x64', 'darwin-x64')).toThrow(/found 2/);
  });

  it('rejects stale package output until the target executable changes', () => {
    const out = createPackagedResources(true);
    const snapshot = snapshotPackagedTargets(out);
    expect(() => resolvePackagedTarget(out, 'darwin', 'arm64', { previousSnapshot: snapshot })).toThrow(/found 0/);

    const executable = path.join(out, 'mac-arm64', 'Wayland.app', 'Contents', 'MacOS', 'Wayland');
    fs.appendFileSync(executable, 'fresh-build');
    expect(resolvePackagedTarget(out, 'darwin', 'arm64', { previousSnapshot: snapshot }).executablePath).toBe(
      executable
    );
  });

  it('rejects an explicitly supplied executable for the wrong architecture', () => {
    const out = createPackagedResources(true);
    const resources = packagedResourcesPath(out);
    const x64Executable = path.join(out, 'mac-arm64', 'Wayland.app', 'Contents', 'MacOS', 'Wayland');
    fs.writeFileSync(x64Executable, machExecutableBytes('x64'));
    expect(() =>
      verifyPackagedResources({
        argv: [...verifyArgs(out), '--resources-dir', resources, '--app-executable', x64Executable],
        cwd: process.cwd(),
        logger: silentLogger,
        wcoreAuthority: testWCoreAuthority,
      })
    ).toThrow(/does not match darwin-arm64/);
  });

  it('rejects an executable paired with another packaged app resource tree', () => {
    const out = createPackagedResources(true);
    addPackagedApp(out, 'arm64', true, 'darwin-arm64', 'mac-arm64-copy', 'Wayland Copy.app');
    const secondExecutable = path.join(out, 'mac-arm64-copy', 'Wayland Copy.app', 'Contents', 'MacOS', 'Wayland Copy');
    expect(() =>
      verifyPackagedResources({
        argv: [...verifyArgs(out), '--resources-dir', packagedResourcesPath(out), '--app-executable', secondExecutable],
        cwd: process.cwd(),
        logger: silentLogger,
        wcoreAuthority: testWCoreAuthority,
        voiceAuthority: TEST_VOICE_AUTHORITY,
        bunAuthority: TEST_BUN_AUTHORITY,
        modelsAuthority: TEST_MODELS_AUTHORITY,
      })
    ).toThrow(/does not belong/);
  });

  it.each([
    ['bundled-bun/darwin-arm64/stale-bun', 'bun'],
    ['voice-models/whisper-tiny/stale-model.bin', 'voice'],
    ['skills-library/stale-skill.md', 'skill'],
  ])('rejects undeclared critical debris in %s (%s)', (relativePath) => {
    const out = createPackagedResources(true);
    fs.writeFileSync(path.join(packagedResourcesPath(out), relativePath), 'stale');
    expect(() => verify(out)).toThrow(/CRITICAL/);
  });

  it('rejects same-architecture Bun byte drift even when the manifest is unchanged', () => {
    const out = createPackagedResources(true);
    const target = path.join(packagedResourcesPath(out), 'bundled-bun', 'darwin-arm64', 'bun');
    const bytes = fs.readFileSync(target);
    bytes[12] ^= 1;
    fs.writeFileSync(target, bytes, { mode: 0o755 });
    expect(() => verify(out)).toThrow(/CRITICAL/);
  });

  it('rejects a structurally empty models snapshot', () => {
    const out = createPackagedResources(true);
    fs.writeFileSync(path.join(packagedResourcesPath(out), 'modelsdev-snapshot.json'), '{}');
    expect(() => verify(out)).toThrow(/CRITICAL/);
  });

  it('rejects same-size models.dev offline-floor drift', () => {
    const out = createPackagedResources(true);
    const target = path.join(packagedResourcesPath(out), 'modelsdev-snapshot.json');
    const bytes = fs.readFileSync(target);
    bytes[bytes.length - 2] ^= 1;
    fs.writeFileSync(target, bytes);
    expect(() => verify(out)).toThrow(/CRITICAL/);
  });

  itAcceptedSweep.each(['addition', 'omission', 'drift', 'symlink', 'nested-escaping-symlink'])(
    'fails closed when the packaged WhatsApp bridge has source-fidelity %s',
    (failure) => {
      const out = createPackagedResources(true);
      const source = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-whatsapp-source-'));
      roots.push(source);
      fs.mkdirSync(path.join(source, 'node_modules', 'dep'), { recursive: true });
      fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify({ dependencies: { dep: '1.0.0' } }));
      fs.writeFileSync(
        path.join(source, 'bun.lock'),
        '{\n  "workspaces": { "": {\n    "dependencies": {\n      "dep": "1.0.0"\n    },\n  } },\n  "packages": {\n    "dep": ["dep@1.0.0", "", {}, "sha512-AAAA=="]\n  }\n}\n'
      );
      fs.writeFileSync(path.join(source, 'bridge.js'), 'bridge');
      fs.writeFileSync(path.join(source, 'node_modules', 'dep', 'index.js'), 'dependency');
      const placeholder = path.join(source, 'node_modules', 'tr46', 'lib', '.gitkeep');
      fs.mkdirSync(path.dirname(placeholder), { recursive: true });
      fs.writeFileSync(placeholder, '');
      const authority = {
        contract: 'wayland-whatsapp-bridge-source/1.0',
        files: Object.fromEntries(
          ['package.json', 'bun.lock', 'bridge.js'].map((relative) => {
            const bytes = fs.readFileSync(path.join(source, relative));
            return [relative, { size: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }];
          })
        ),
      };
      const bridge = path.join(packagedResourcesPath(out), 'whatsapp-bridge');
      fs.cpSync(source, bridge, { recursive: true });
      fs.rmSync(path.join(bridge, 'node_modules', 'tr46', 'lib', '.gitkeep'));
      const extra = { whatsappSourceDir: source, whatsappAuthority: authority };
      expect(verify(out, 'darwin-arm64', 'darwin-arm64', extra)).toMatchObject({ warnings: 2 });

      if (failure === 'addition') fs.writeFileSync(path.join(bridge, 'stale.js'), 'stale');
      if (failure === 'omission') fs.rmSync(path.join(bridge, 'bridge.js'));
      if (failure === 'drift') fs.appendFileSync(path.join(bridge, 'bridge.js'), '\n// drift');
      if (failure === 'symlink') {
        fs.rmSync(path.join(bridge, 'bridge.js'));
        fs.symlinkSync('package.json', path.join(bridge, 'bridge.js'));
      }
      if (failure === 'nested-escaping-symlink') {
        fs.rmSync(path.join(bridge, 'node_modules', 'dep', 'index.js'));
        fs.symlinkSync('/tmp', path.join(bridge, 'node_modules', 'dep', 'index.js'));
      }
      expect(() => verify(out, 'darwin-arm64', 'darwin-arm64', extra)).toThrow(/CRITICAL/);
    }
  );

  it('rejects payload bytes hidden in the one expected omitted .gitkeep path', () => {
    const out = createPackagedResources(true);
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-whatsapp-gitkeep-'));
    roots.push(source);
    fs.mkdirSync(path.join(source, 'node_modules', 'dep'), { recursive: true });
    fs.mkdirSync(path.join(source, 'node_modules', 'tr46', 'lib'), { recursive: true });
    fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify({ dependencies: { dep: '1.0.0' } }));
    fs.writeFileSync(
      path.join(source, 'bun.lock'),
      '{\n  "workspaces": { "": {\n    "dependencies": {\n      "dep": "1.0.0"\n    },\n  } },\n  "packages": {\n    "dep": ["dep@1.0.0", "", {}, "sha512-AAAA=="]\n  }\n}\n'
    );
    fs.writeFileSync(path.join(source, 'bridge.js'), 'bridge');
    fs.writeFileSync(path.join(source, 'node_modules', 'dep', 'index.js'), 'dependency');
    fs.writeFileSync(path.join(source, 'node_modules', 'tr46', 'lib', '.gitkeep'), 'hidden payload');
    const authority = {
      contract: 'wayland-whatsapp-bridge-source/1.0',
      files: Object.fromEntries(
        ['package.json', 'bun.lock', 'bridge.js'].map((relative) => {
          const bytes = fs.readFileSync(path.join(source, relative));
          return [relative, { size: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }];
        })
      ),
    };
    const bridge = path.join(packagedResourcesPath(out), 'whatsapp-bridge');
    fs.cpSync(source, bridge, { recursive: true });
    fs.rmSync(path.join(bridge, 'node_modules', 'tr46', 'lib', '.gitkeep'));
    expect(() =>
      verify(out, 'darwin-arm64', 'darwin-arm64', { whatsappSourceDir: source, whatsappAuthority: authority })
    ).toThrow(/CRITICAL/);
  });

  it('rejects cross-target sharp and libvips optional dependencies', () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-whatsapp-native-'));
    roots.push(source);
    fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify({ dependencies: { parent: '1.0.0' } }));
    for (const packageName of ['sharp-darwin-x64', 'sharp-libvips-darwin-x64']) {
      const packageRoot = path.join(source, 'node_modules', '@img', packageName);
      fs.mkdirSync(packageRoot, { recursive: true });
      fs.writeFileSync(
        path.join(packageRoot, 'package.json'),
        JSON.stringify({ name: `@img/${packageName}`, os: ['darwin'], cpu: ['x64'] })
      );
      writeMachExecutable(path.join(packageRoot, 'native.node'), 'x64');
    }
    expect(verifyWhatsAppNativeTarget(source, 'darwin', 'arm64')).toBe(false);
  });

  it('propagates a nested native inventory failure instead of accepting earlier valid executable bytes', () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-whatsapp-native-recursive-'));
    roots.push(source);
    fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify({ dependencies: { parent: '1.0.0' } }));
    for (const packageName of ['sharp-darwin-arm64', 'sharp-libvips-darwin-arm64']) {
      const packageRoot = path.join(source, 'node_modules', '@img', packageName);
      fs.mkdirSync(path.join(packageRoot, 'nested'), { recursive: true });
      fs.writeFileSync(
        path.join(packageRoot, 'package.json'),
        JSON.stringify({ name: `@img/${packageName}`, os: ['darwin'], cpu: ['arm64'] })
      );
      writeMachExecutable(path.join(packageRoot, 'native.node'), 'arm64');
    }
    fs.symlinkSync('/tmp', path.join(source, 'node_modules', '@img', 'sharp-darwin-arm64', 'nested', 'escape'));
    expect(verifyWhatsAppNativeTarget(source, 'darwin', 'arm64')).toBe(false);
  });

  it('enumerates every Darwin-signing exemption and rejects an unproven executable in that scope', () => {
    const source = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-whatsapp-sign-ignore-'));
    roots.push(source);
    writeMachExecutable(
      path.join(source, 'node_modules', '@img', 'sharp-darwin-arm64', 'lib', 'sharp-darwin-arm64.node'),
      'arm64'
    );
    writeMachExecutable(
      path.join(source, 'node_modules', '@img', 'sharp-libvips-darwin-arm64', 'lib', 'libvips-cpp.8.17.3.dylib'),
      'arm64'
    );
    const appleRuntimes = [
      ['darwin-arm64', 'arm64'],
      ['darwin-x64', 'x64'],
      ['ios-arm64', 'arm64'],
      ['ios-arm64-simulator', 'arm64'],
      ['ios-x64-simulator', 'x64'],
    ] as const;
    for (const packageName of ['bare-fs', 'bare-os', 'bare-url']) {
      for (const [runtime, runtimeArch] of appleRuntimes) {
        writeMachExecutable(
          path.join(source, 'node_modules', packageName, 'prebuilds', runtime, `${packageName}.bare`),
          runtimeArch
        );
      }
    }
    expect(verifyWhatsAppDarwinSignIgnoreInventory(source, 'arm64')).toBe(true);
    writeMachExecutable(
      path.join(source, 'node_modules', 'bare-fs', 'prebuilds', 'darwin-arm64', 'unlisted.bare'),
      'arm64'
    );
    expect(verifyWhatsAppDarwinSignIgnoreInventory(source, 'arm64')).toBe(false);
  });

  it.each(['hub', 'signal-cli-runtime'])('fails closed when optional %s bytes are present but invalid', (relative) => {
    const out = createPackagedResources(true);
    const target = path.join(packagedResourcesPath(out), relative);
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, 'stale'), 'stale');
    expect(() => verify(out)).toThrow(/CRITICAL/);
  });

  it('rejects voice-model bytes that keep the expected filename and size but drift from the pin', () => {
    const out = createPackagedResources(true);
    const target = path.join(packagedResourcesPath(out), 'voice-models', 'whisper-tiny', 'config.json');
    fs.writeFileSync(target, '[]');
    expect(() => verify(out)).toThrow(/CRITICAL/);
  });

  it('rejects non-contiguous skill-body offsets', () => {
    const out = createPackagedResources(true);
    const target = path.join(packagedResourcesPath(out), 'skills-library', 'skill-bodies.offsets.json');
    fs.writeFileSync(target, JSON.stringify({ version: 1, entries: { test: [1, 3] } }));
    expect(() => verify(out)).toThrow(/CRITICAL/);
  });
});

/**
 * The bridge natives are Developer ID signed at stage time, so a packaged copy is
 * never byte-identical to a freshly installed source tree. The producer never
 * noticed because it signs its own source tree; an independent observer cannot
 * reproduce the bytes at all, because codesign embeds a secure timestamp. Byte
 * equality was therefore unsatisfiable off the signing machine, and the protected
 * platform observer failed on both darwin legs every time it ran.
 *
 * These cases pin the replacement rule: a differing native is accepted ONLY when
 * it carries a Ferrox Labs Developer ID signature whose identifier embeds the
 * sha256 of the source file, and is rejected in every other case.
 */
describe('staged darwin native reconciliation', () => {
  const SOURCE_SHA = 'a'.repeat(64);
  const REL = 'node_modules/@img/sharp-darwin-arm64/lib/sharp-darwin-arm64.node';
  const sourceEntry = `file:${REL}:100:${SOURCE_SHA}`;
  const bundledEntry = `file:${REL}:220:${'b'.repeat(64)}`;

  it('accepts a signed native by substituting the source entry', () => {
    expect(reconcileStagedDarwinNatives('/bundle', [sourceEntry], [bundledEntry], () => true)).toEqual([sourceEntry]);
  });

  it('demands the identifier that binds the signature to the source digest', () => {
    const seen: Array<{ binaryPath: string; identifier: string }> = [];
    reconcileStagedDarwinNatives('/bundle', [sourceEntry], [bundledEntry], (binaryPath, identifier) => {
      seen.push({ binaryPath, identifier });
      return true;
    });
    expect(seen).toHaveLength(1);
    expect(seen[0].binaryPath).toBe(path.join('/bundle', REL));
    // Exactly the identifier build-with-builder.js signed it with. A signature
    // lifted from any other native carries a different identifier and fails.
    expect(seen[0].identifier).toBe(darwinSigningIdentifier('sharp-darwin-arm64.node', SOURCE_SHA));
  });

  it('keeps the differing entry when the signature check refuses', () => {
    expect(reconcileStagedDarwinNatives('/bundle', [sourceEntry], [bundledEntry], () => false)).toEqual([bundledEntry]);
  });

  it('fails closed when the signature check throws', () => {
    expect(
      reconcileStagedDarwinNatives('/bundle', [sourceEntry], [bundledEntry], () => {
        throw new Error('codesign unavailable');
      })
    ).toEqual([bundledEntry]);
  });

  it('never consults the signature check for entries that already match', () => {
    let calls = 0;
    const result = reconcileStagedDarwinNatives('/bundle', [sourceEntry], [sourceEntry], () => {
      calls += 1;
      return true;
    });
    expect(result).toEqual([sourceEntry]);
    expect(calls).toBe(0);
  });

  it('leaves directory and symlink entries alone', () => {
    const structural = ['dir:node_modules', 'link:node_modules/.bin/x:../y'];
    expect(reconcileStagedDarwinNatives('/bundle', [], structural, () => true)).toEqual(structural);
  });

  it('does not invent a match for a bundled file the source does not have', () => {
    const extra = `file:node_modules/extra.node:10:${'c'.repeat(64)}`;
    expect(reconcileStagedDarwinNatives('/bundle', [sourceEntry], [extra], () => true)).toEqual([extra]);
  });

  it('reads the path from the right so a colon in a name cannot borrow another digest', () => {
    // ':' is legal in a darwin filename. Reading the first ':' after the prefix
    // truncated `awkward:name.node` to `awkward` and looked up whatever file was
    // actually called `awkward` - handing a planted file a legitimate file's
    // digest, and pointing the signature check at the legitimate file's path.
    const REAL = 'node_modules/pkg/awkward';
    const PLANTED = 'node_modules/pkg/awkward:name.node';
    const realSource = `file:${REAL}:10:${'d'.repeat(64)}`;
    const plantedBundled = `file:${PLANTED}:99:${'e'.repeat(64)}`;
    const seen: string[] = [];
    const result = reconcileStagedDarwinNatives('/bundle', [realSource], [plantedBundled], (binaryPath) => {
      seen.push(binaryPath);
      return true;
    });
    expect(result).toEqual([plantedBundled]);
    expect(seen).toEqual([]);
  });

  it('refuses to reconcile against a malformed source digest', () => {
    const malformed = `file:${REL}:100:not-a-sha`;
    expect(reconcileStagedDarwinNatives('/bundle', [malformed], [bundledEntry], () => true)).toEqual([bundledEntry]);
  });
});
