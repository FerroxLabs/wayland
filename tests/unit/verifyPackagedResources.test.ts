import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const roots: string[] = [];
const require = createRequire(import.meta.url);
const { verifyPackagedResources } = require('../../scripts/verify-packaged-resources.js') as {
  verifyPackagedResources: (options: Record<string, unknown>) => { resourceDirs: string[]; warnings: number };
};
const TEST_WCORE_RELEASE = 'v0.12.25';
const TEST_WCORE_ARCHIVE_SHA = 'a'.repeat(64);
const TEST_WCORE_BYTES = Buffer.from('deterministic-test-wayland-core');
const TEST_WCORE_BINARY_SHA = crypto.createHash('sha256').update(TEST_WCORE_BYTES).digest('hex');
const silentLogger = { log() {}, warn() {}, error() {} };

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

function createPackagedResources(includeOfficeCli: boolean, officeCliRuntime = 'darwin-arm64'): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-packaged-resources-'));
  roots.push(root);
  const resources = path.join(root, 'mac-arm64', 'Wayland.app', 'Contents', 'Resources');
  const files = [
    'skills-library/index.json',
    'bundled-workflows/index.json',
    'bundled-wayland-core/darwin-arm64/wayland-core',
    'bundled-bun/darwin-arm64/bun',
    'modelsdev-snapshot.json',
    'voice-models/model.bin',
  ];
  if (includeOfficeCli) {
    files.push(
      `bundled-officecli/${officeCliRuntime}/${officeCliRuntime.startsWith('win32-') ? 'officecli.exe' : 'officecli'}`
    );
  }
  for (const relativePath of files) {
    const target = path.join(resources, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, relativePath.endsWith('/wayland-core') ? TEST_WCORE_BYTES : '{}');
  }
  const wcoreAsset = testWCoreAuthority.getAssetName('darwin', 'arm64', TEST_WCORE_RELEASE);
  fs.writeFileSync(
    path.join(resources, 'bundled-wayland-core', 'darwin-arm64', 'manifest.json'),
    JSON.stringify({
      contract: testWCoreAuthority.BUNDLE_CONTRACT,
      generator: testWCoreAuthority.BUNDLE_GENERATOR,
      platform: 'darwin',
      arch: 'arm64',
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
      binary: { name: 'wayland-core', sha256: `sha256:${TEST_WCORE_BINARY_SHA}` },
      files: ['wayland-core'],
      skipped: false,
    })
  );
  for (const arch of ['arm64', 'x64']) {
    const target = path.join(resources, 'classic-recovery-tools', 'win', arch, '7za.exe');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(process.cwd(), 'node_modules', '7zip-bin', 'win', arch, '7za.exe'), target);
  }
  if (includeOfficeCli) {
    const [platform, arch] = officeCliRuntime.split('-');
    const binaryName = platform === 'win32' ? 'officecli.exe' : 'officecli';
    const binary = path.join(resources, 'bundled-officecli', officeCliRuntime, binaryName);
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(binary)).digest('hex');
    const manifest = path.join(resources, 'bundled-officecli', officeCliRuntime, 'manifest.json');
    fs.writeFileSync(
      manifest,
      JSON.stringify({
        contract: 'iofficeai-officecli-native',
        version: 'v1.0.136',
        platform,
        arch,
        binary: binaryName,
        sha256: `sha256:${sha256}`,
        publisherSignatureProof:
          platform === 'darwin'
            ? {
                contract: 'apple-developer-id/1.0',
                teamIdentifier: '52JQX2HUSC',
                hardenedRuntime: true,
                secureTimestamp: true,
                entitlements: ['com.apple.security.cs.allow-jit'],
              }
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

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('packaged resource release gate', () => {
  const verifyArgs = (out: string, officeCliRuntime = 'darwin-arm64', wcoreRuntime = 'darwin-arm64') => [
    'scripts/verify-packaged-resources.js',
    '--out',
    out,
    '--wcore-runtime',
    wcoreRuntime,
    '--officecli-runtime',
    officeCliRuntime,
  ];
  const verify = (out: string, officeCliRuntime = 'darwin-arm64', wcoreRuntime = 'darwin-arm64') =>
    verifyPackagedResources({
      argv: verifyArgs(out, officeCliRuntime, wcoreRuntime),
      cwd: process.cwd(),
      logger: silentLogger,
      wcoreAuthority: testWCoreAuthority,
    });

  it('accepts a non-empty native OfficeCLI binary plus manifest', () => {
    const out = createPackagedResources(true);
    expect(verify(out)).toMatchObject({ warnings: 3 });
  });

  it('blocks a package whose native OfficeCLI bundle is absent', () => {
    const out = createPackagedResources(false);
    expect(() => verify(out)).toThrow();
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

  it('blocks verification when only the OfficeCLI target is declared', () => {
    const out = createPackagedResources(true);
    expect(() =>
      verifyPackagedResources({
        argv: ['scripts/verify-packaged-resources.js', '--out', out, '--officecli-runtime', 'darwin-arm64'],
        cwd: process.cwd(),
        logger: silentLogger,
        wcoreAuthority: testWCoreAuthority,
      })
    ).toThrow(/--wcore-runtime/);
  });
});
