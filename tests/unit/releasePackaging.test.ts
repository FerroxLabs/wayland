import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { load as parseYaml } from 'js-yaml';
import { afterEach, describe, expect, it } from 'vitest';

type ProtocolRegistration = {
  name: string;
  schemes: string[];
};

type BuilderConfig = {
  appId: string;
  productName: string;
  executableName: string;
  protocols: ProtocolRegistration[];
  directories: { output: string };
  publish: {
    provider: string;
    channel: string;
    releaseType: string;
  };
};

const require = createRequire(import.meta.url);
const previewConfig = require('../../electron-builder.preview.cjs') as BuilderConfig;
const {
  cleanGeneratedResourceRoots,
  hasFreshTargetDmg,
  prepareOptionalHubResources,
  prepareWhatsAppBridgeResources,
  preserveGeneratedSource,
  resolveDmgRetryTarget,
  snapshotDmgArtifacts,
  writeConstitutionPackageAuthority,
} = require('../../scripts/build-with-builder.js') as {
  cleanGeneratedResourceRoots: (options: { voiceDir: string; skillPackDir: string }) => void;
  hasFreshTargetDmg: (out: string, arch: string, snapshot: Map<string, string>) => boolean;
  prepareOptionalHubResources: (options: { hubDir: string; run?: () => void }) => {
    available: false;
    reason: string;
  };
  prepareWhatsAppBridgeResources: (options: {
    bridgeDir: string;
    platform?: string;
    arch?: string;
    run: (command: string, args: string[], options: { cwd: string }) => void;
    validate: () => boolean;
  }) => { available: true; bridgeDir: string };
  preserveGeneratedSource: (filePath: string) => () => void;
  resolveDmgRetryTarget: (
    out: string,
    platform: string,
    arch: string,
    snapshot: Map<string, string>
  ) => { executablePath: string };
  snapshotDmgArtifacts: (out: string) => Map<string, string>;
  writeConstitutionPackageAuthority: (authority: Record<string, unknown>, root: string) => string;
};
const { snapshotPackagedTargets } = require('../../scripts/verify-packaged-resources.js') as {
  snapshotPackagedTargets: (out: string) => Map<string, string>;
};
const roots: string[] = [];

function tempRoot(prefix: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  roots.push(root);
  return root;
}

function writeMacApp(out: string, folder: string, arch: 'arm64' | 'x64'): string {
  const app = path.join(out, folder, 'Wayland.app');
  const executable = path.join(app, 'Contents', 'MacOS', 'Wayland');
  fs.mkdirSync(path.join(app, 'Contents', 'Resources'), { recursive: true });
  fs.mkdirSync(path.dirname(executable), { recursive: true });
  const binary = Buffer.alloc(16);
  binary.writeUInt32LE(0xfeedfacf, 0);
  binary.writeUInt32LE(arch === 'arm64' ? 0x0100000c : 0x01000007, 4);
  fs.writeFileSync(executable, binary);
  return executable;
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('preview package isolation', () => {
  it('replaces every stable identity surface instead of merging it', () => {
    expect(previewConfig).toMatchObject({
      appId: 'com.ferroxlabs.wayland.preview',
      productName: 'Wayland Preview',
      executableName: 'Wayland Preview',
      directories: { output: 'out-preview' },
      publish: {
        provider: 'github',
        channel: 'preview',
        releaseType: 'prerelease',
      },
    });

    expect(previewConfig.protocols).toEqual([
      {
        name: 'Wayland Preview Protocol',
        schemes: ['wayland-preview'],
      },
    ]);
    expect(previewConfig.protocols.flatMap(({ schemes }) => schemes)).not.toContain('wayland');
  });
});

describe('release package fail-closed gates', () => {
  it('never converts a non-zero macOS package or provenance result into CI success', () => {
    const workflow = fs.readFileSync(path.resolve('.github/workflows/_build-reusable.yml'), 'utf8');
    expect(workflow).toContain('rm -f out/*.dmg');
    expect(workflow).toContain('exit $BUILD_EXIT_CODE');
    expect(workflow).not.toContain('grep -qiE "notariz|staple"');
    expect(workflow).not.toContain('exit 0  # Allow CI to continue');
  });

  it('runs multi-architecture convenience builds as isolated package invocations', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['build-mac']).toBe(
      'node scripts/build-with-builder.js arm64 --mac --arm64 && node scripts/build-with-builder.js x64 --mac --x64'
    );
    expect(pkg.scripts.build).toBe('bun run build-mac');
  });

  it('tracks DMGs by requested architecture and freshness', () => {
    const out = tempRoot('wayland-dmg-');
    const armDmg = path.join(out, 'Wayland-0.0.0-arm64.dmg');
    const x64Dmg = path.join(out, 'Wayland-0.0.0-x64.dmg');
    fs.writeFileSync(armDmg, 'old-arm');
    fs.writeFileSync(x64Dmg, 'old-x64');
    const snapshot = snapshotDmgArtifacts(out);

    fs.appendFileSync(armDmg, 'new');
    expect(hasFreshTargetDmg(out, 'arm64', snapshot)).toBe(true);
    expect(hasFreshTargetDmg(out, 'x64', snapshot)).toBe(false);
    fs.appendFileSync(x64Dmg, 'new');
    expect(hasFreshTargetDmg(out, 'x64', snapshot)).toBe(true);
  });

  it('recognizes a fresh generic legacy DMG as x64 but never as arm64', () => {
    const out = tempRoot('wayland-dmg-generic-');
    const generic = path.join(out, 'Wayland-0.0.0.dmg');
    fs.writeFileSync(generic, 'old');
    const snapshot = snapshotDmgArtifacts(out);
    fs.appendFileSync(generic, 'fresh');
    expect(hasFreshTargetDmg(out, 'x64', snapshot)).toBe(true);
    expect(hasFreshTargetDmg(out, 'arm64', snapshot)).toBe(false);
  });

  it('resolves a DMG retry from the fresh app for the requested architecture only', () => {
    const out = tempRoot('wayland-dmg-app-');
    writeMacApp(out, 'mac-arm64', 'arm64');
    const x64Executable = writeMacApp(out, 'mac', 'x64');
    const snapshot = snapshotPackagedTargets(out);

    fs.appendFileSync(x64Executable, 'fresh');
    expect(resolveDmgRetryTarget(out, 'darwin', 'x64', snapshot).executablePath).toBe(x64Executable);
    expect(() => resolveDmgRetryTarget(out, 'darwin', 'arm64', snapshot)).toThrow(/found 0/);
  });

  it('removes stale Hub bytes and cannot invoke the mutable legacy source', () => {
    const root = tempRoot('wayland-hub-');
    const hub = path.join(root, 'hub');
    fs.mkdirSync(hub);
    fs.writeFileSync(path.join(hub, 'stale.zip'), 'stale');
    let invoked = false;
    const result = prepareOptionalHubResources({
      hubDir: hub,
      run() {
        invoked = true;
        fs.mkdirSync(hub, { recursive: true });
        fs.writeFileSync(path.join(hub, 'untrusted.zip'), 'untrusted');
      },
    });
    expect(result).toEqual({ available: false, reason: 'trusted-hub-authority-unavailable' });
    expect(invoked).toBe(false);
    expect(fs.existsSync(hub)).toBe(false);
  });

  it('rebuilds WhatsApp dependencies only through a fatal frozen-lock install', () => {
    const bridgeDir = tempRoot('wayland-whatsapp-input-');
    const stale = path.join(bridgeDir, 'node_modules', 'stale');
    fs.mkdirSync(stale, { recursive: true });
    let invocation: { command: string; args: string[]; cwd: string } | undefined;
    const result = prepareWhatsAppBridgeResources({
      bridgeDir,
      platform: 'darwin',
      arch: 'arm64',
      run(command, args, options) {
        invocation = { command, args, cwd: options.cwd };
        fs.mkdirSync(path.join(bridgeDir, 'node_modules', 'clean'), { recursive: true });
      },
      validate: () => true,
    });
    expect(invocation).toEqual({
      command: 'bun',
      args: ['install', '--frozen-lockfile', '--os', 'darwin', '--cpu', 'arm64'],
      cwd: bridgeDir,
    });
    expect(fs.existsSync(stale)).toBe(false);
    expect(result).toEqual({ available: true, bridgeDir });

    fs.mkdirSync(stale, { recursive: true });
    expect(() =>
      prepareWhatsAppBridgeResources({
        bridgeDir,
        run() {
          throw new Error('frozen install failed');
        },
        validate: () => true,
      })
    ).toThrow(/frozen install failed/);
    expect(fs.existsSync(path.join(bridgeDir, 'node_modules'))).toBe(false);
  });

  it('restores target-generated source after a build and keeps restoration idempotent', () => {
    const root = tempRoot('wayland-generated-source-');
    const generated = path.join(root, 'authority.generated.ts');
    fs.writeFileSync(generated, 'accepted baseline');
    const restore = preserveGeneratedSource(generated);
    fs.writeFileSync(generated, 'target-exact transient authority');
    restore();
    restore();
    expect(fs.readFileSync(generated, 'utf8')).toBe('accepted baseline');
  });

  it('writes target authority into the package resource tree independently of tracked generated source', () => {
    const root = tempRoot('wayland-package-authority-');
    const authority = {
      supported: true,
      schemaVersion: 1,
      protocolVersion: 2,
      platform: 'darwin',
      arch: 'arm64',
      fileName: 'wayland-constitution-fs',
      sha256: `sha256:${'a'.repeat(64)}`,
      size: 42,
    };
    const target = writeConstitutionPackageAuthority(authority, root);
    expect(target).toBe(path.join(root, 'bundled-constitution-fs', 'darwin-arm64', 'package-authority.json'));
    expect(JSON.parse(fs.readFileSync(target, 'utf8'))).toEqual(authority);
  });

  it('packages the WhatsApp dependency tree through a dedicated resource matcher', () => {
    const builderConfig = parseYaml(fs.readFileSync(path.resolve('electron-builder.yml'), 'utf8')) as {
      extraResources?: Array<{ from?: string; to?: string; filter?: string[] }>;
    };
    const bridgeSource = builderConfig.extraResources?.find(
      ({ from }) => from === 'src/process/channels/whatsapp-bridge'
    );
    const bridgeDependencies = builderConfig.extraResources?.find(
      ({ from }) => from === 'src/process/channels/whatsapp-bridge/node_modules'
    );

    expect(bridgeSource).toMatchObject({
      to: 'whatsapp-bridge',
      filter: expect.arrayContaining(['**/*', '!node_modules/**/*']),
    });
    expect(bridgeDependencies).toEqual({
      from: 'src/process/channels/whatsapp-bridge/node_modules',
      to: 'whatsapp-bridge/node_modules',
      filter: ['**/*'],
    });
  });

  it('removes stale generated voice and skill-pack roots before regeneration', () => {
    const root = tempRoot('wayland-generated-resources-');
    const voiceDir = path.join(root, 'voice-models', 'whisper-tiny');
    const skillPackDir = path.join(root, '.skill-pack');
    fs.mkdirSync(voiceDir, { recursive: true });
    fs.mkdirSync(skillPackDir, { recursive: true });
    fs.writeFileSync(path.join(voiceDir, 'stale-model'), 'stale');
    fs.writeFileSync(path.join(skillPackDir, 'stale-skill'), 'stale');

    cleanGeneratedResourceRoots({ voiceDir, skillPackDir });
    expect(fs.readdirSync(voiceDir)).toEqual([]);
    expect(fs.existsSync(skillPackDir)).toBe(false);
  });
});
