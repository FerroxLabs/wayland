import { createRequire } from 'node:module';
import fs from 'node:fs';
import { load as parseYaml } from 'js-yaml';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const prepareOfficeCli = require('../../scripts/prepareOfficeCli') as {
  DEFAULT_OFFICECLI_VERSION: string;
  getAssetName(platform: string, arch: string, libc?: string): string;
  loadExpectedSha(version: string, asset: string): string;
  verifyFile(filePath: string, expectedSha: string, asset: string, version: string): string;
  assertDarwinPublisherSignature(
    details: string,
    entitlements: string
  ): {
    contract: string;
    teamIdentifier: string;
    hardenedRuntime: boolean;
    secureTimestamp: boolean;
    entitlements: string[];
  };
  loadContract(): {
    contract: string;
    major: number;
    minor: number;
    release: string;
    requiredCommands: string[];
    requiredFormats: string[];
    requiredOperations: string[];
    requiredSkills: Array<{ id: string; path: string; sha256: string }>;
    requiredElements: Record<string, string[]>;
    previewCommand: string;
  };
  assertContractOutputs(
    version: string,
    topLevelHelp: string,
    formatHelp: Record<string, string>,
    watchHelp: string
  ): { contract: string; release: string };
  verifyBundledSkillDigests(
    contract?: ReturnType<typeof prepareOfficeCli.loadContract>,
    skillsRoot?: string
  ): { contract: string; skills: Array<{ id: string; path: string; sha256: string }> };
  loadOfficeCliLedgerProof(): {
    contract: string;
    ledgerSha256: string;
    entrySha256: string;
    hostedFallbackAvailable: false;
  };
  getCapabilityFixtureDigest(): string;
};

function collectSkillFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSkillFiles(target);
    return entry.name === 'SKILL.md' ? [target] : [];
  });
}

describe('prepareOfficeCli supply-chain contract', () => {
  it('pins v1.0.136 and maps every supported package target to an immutable asset', () => {
    expect(prepareOfficeCli.DEFAULT_OFFICECLI_VERSION).toBe('v1.0.136');
    expect(prepareOfficeCli.getAssetName('darwin', 'arm64')).toBe('officecli-mac-arm64');
    expect(prepareOfficeCli.getAssetName('darwin', 'x64')).toBe('officecli-mac-x64');
    expect(prepareOfficeCli.getAssetName('linux', 'arm64')).toBe('officecli-linux-arm64');
    expect(prepareOfficeCli.getAssetName('linux', 'x64', 'musl')).toBe('officecli-linux-alpine-x64');
    expect(prepareOfficeCli.getAssetName('win32', 'x64')).toBe('officecli-win-x64.exe');
    expect(prepareOfficeCli.getAssetName('win32', 'arm64')).toBe('officecli-win-arm64.exe');
  });

  it('loads canonical 64-hex checksums and rejects unsupported targets', () => {
    const sha = prepareOfficeCli.loadExpectedSha('v1.0.136', 'officecli-mac-arm64');
    expect(sha).toBe('b8582853cc464fa0bdb2fabc2803821472c9449c38b365a7be79fcb53d6356e7');
    expect(() => prepareOfficeCli.getAssetName('darwin', 'ia32')).toThrow('Unsupported OfficeCLI architecture');
    expect(() => prepareOfficeCli.getAssetName('freebsd', 'x64')).toThrow('Unsupported OfficeCLI platform');
  });

  it('fails closed when commands or format elements drift from the versioned skill contract', () => {
    const contract = prepareOfficeCli.loadContract();
    const topLevelHelp = contract.requiredCommands.map((command) => `  ${command} <file>`).join('\n');
    const formatHelp = Object.fromEntries(
      Object.entries(contract.requiredElements).map(([format, elements]) => [
        format,
        `Elements for ${format}:\n${elements.map((element) => `  ${element}`).join('\n')}`,
      ])
    );
    const watchHelp = 'Usage:\n  officecli watch <file> [command] [options]';

    expect(prepareOfficeCli.assertContractOutputs('1.0.136', topLevelHelp, formatHelp, watchHelp)).toEqual({
      contract: 'wayland-officecli-authoring/1.0',
      release: 'v1.0.136',
    });
    expect(() =>
      prepareOfficeCli.assertContractOutputs(
        '1.0.136',
        topLevelHelp.replace('  query <file>\n', ''),
        formatHelp,
        watchHelp
      )
    ).toThrow('must exactly equal');
    expect(() =>
      prepareOfficeCli.assertContractOutputs(
        '1.0.136',
        topLevelHelp,
        { ...formatHelp, pptx: formatHelp.pptx.replace('  notes\n', '') },
        watchHelp
      )
    ).toThrow('pptx contract is missing element: notes');
    expect(() =>
      prepareOfficeCli.assertContractOutputs('1.0.136', `${topLevelHelp}\n  upload <file>`, formatHelp, watchHelp)
    ).toThrow('must exactly equal');
    expect(() =>
      prepareOfficeCli.assertContractOutputs('1.0.136', `${topLevelHelp}\n  watch <file>`, formatHelp, watchHelp)
    ).toThrow('must exactly equal');
  });

  it('binds the exact bundled OfficeCLI skill set, ledger, and capability fixture', () => {
    const contract = prepareOfficeCli.loadContract();
    const proof = prepareOfficeCli.verifyBundledSkillDigests(contract);
    expect(proof.contract).toBe('wayland-officecli-skills/1.0');
    expect(proof.skills).toHaveLength(contract.requiredSkills.length);
    expect(proof.skills).toEqual([...proof.skills].toSorted((left, right) => left.id.localeCompare(right.id)));
    expect(prepareOfficeCli.loadOfficeCliLedgerProof()).toMatchObject({
      contract: 'wayland-third-party-executables/1.0',
      hostedFallbackAvailable: false,
    });
    expect(prepareOfficeCli.getCapabilityFixtureDigest()).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('rejects substituted, missing, and unexpected skill files', () => {
    const contract = prepareOfficeCli.loadContract();
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-officecli-skills-'));
    for (const skill of contract.requiredSkills) {
      const target = path.join(root, skill.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.resolve('src/process/resources/skills', skill.path), target);
    }
    expect(prepareOfficeCli.verifyBundledSkillDigests(contract, root).skills).toHaveLength(
      contract.requiredSkills.length
    );
    fs.appendFileSync(path.join(root, contract.requiredSkills[0].path), '\ntampered\n');
    expect(() => prepareOfficeCli.verifyBundledSkillDigests(contract, root)).toThrow('skill digest mismatch');
    fs.copyFileSync(
      path.resolve('src/process/resources/skills', contract.requiredSkills[0].path),
      path.join(root, contract.requiredSkills[0].path)
    );
    fs.mkdirSync(path.join(root, 'officecli-attacker'), { recursive: true });
    fs.writeFileSync(path.join(root, 'officecli-attacker/SKILL.md'), 'attack');
    expect(() => prepareOfficeCli.verifyBundledSkillDigests(contract, root)).toThrow('must exactly equal');
    fs.rmSync(path.join(root, 'officecli-attacker'), { recursive: true, force: true });
    fs.writeFileSync(path.join(root, path.dirname(contract.requiredSkills[0].path), 'undeclared.md'), 'stale');
    expect(() => prepareOfficeCli.verifyBundledSkillDigests(contract, root)).toThrow('must exactly equal');
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('covers every concrete OfficeCLI help element referenced by bundled skills', () => {
    const contract = prepareOfficeCli.loadContract();
    const skillRoot = path.resolve(process.cwd(), 'src/process/resources/skills');
    const referenced = new Map<string, Set<string>>();
    for (const skillPath of collectSkillFiles(skillRoot)) {
      const body = fs.readFileSync(skillPath, 'utf8');
      for (const match of body.matchAll(
        /officecli help (docx|xlsx|pptx) (?:(?:add|set|get|query|remove|validate|raw-set) )?([a-z][a-z0-9_-]*)/gi
      )) {
        const format = match[1].toLowerCase();
        const element = match[2].toLowerCase();
        if (!referenced.has(format)) referenced.set(format, new Set());
        referenced.get(format)?.add(element);
      }
    }

    for (const [format, elements] of referenced) {
      expect(contract.requiredElements[format], `${format} is missing from the contract`).toBeDefined();
      for (const element of elements) {
        expect(contract.requiredElements[format], `${format} contract does not cover ${element}`).toContain(element);
      }
    }
  });

  it('fails closed when downloaded bytes do not match the pinned checksum', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-officecli-sha-'));
    const file = path.join(dir, 'officecli');
    fs.writeFileSync(file, 'tampered');
    expect(() => prepareOfficeCli.verifyFile(file, '0'.repeat(64), 'officecli-mac-arm64', 'v1.0.136')).toThrow(
      'OfficeCLI checksum mismatch'
    );
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('accepts only the pinned hardened macOS publisher with minimal entitlements', () => {
    const details = [
      'CodeDirectory v=20500 size=65695 flags=0x10000(runtime) hashes=2042+7 location=embedded',
      'Authority=Developer ID Application: AionUi Inc. (52JQX2HUSC)',
      'Timestamp=14 Jul 2026 at 10:53:32',
      'TeamIdentifier=52JQX2HUSC',
    ].join('\n');
    const minimalEntitlements = '<plist><dict><key>com.apple.security.cs.allow-jit</key><true/></dict></plist>';

    expect(prepareOfficeCli.assertDarwinPublisherSignature(details, minimalEntitlements)).toEqual({
      contract: 'apple-developer-id/1.0',
      teamIdentifier: '52JQX2HUSC',
      hardenedRuntime: true,
      secureTimestamp: true,
      entitlements: ['com.apple.security.cs.allow-jit'],
    });
    expect(() =>
      prepareOfficeCli.assertDarwinPublisherSignature(
        details.replace('TeamIdentifier=52JQX2HUSC', 'TeamIdentifier=ATTACKER00'),
        minimalEntitlements
      )
    ).toThrow('publisher TeamIdentifier');
    expect(() =>
      prepareOfficeCli.assertDarwinPublisherSignature(
        details,
        minimalEntitlements.replace(
          '</dict>',
          '<key>com.apple.security.cs.disable-library-validation</key><true/></dict>'
        )
      )
    ).toThrow('entitlements must be exactly');
  });

  it('is mandatory in the build, package, and post-package release gates', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    const buildScript = fs.readFileSync(path.resolve('scripts/build-with-builder.js'), 'utf8');
    const builderConfig = fs.readFileSync(path.resolve('electron-builder.yml'), 'utf8');
    const packageVerifier = fs.readFileSync(path.resolve('scripts/verify-packaged-resources.js'), 'utf8');

    expect(packageJson.dependencies.officecli).toBeUndefined();
    expect(packageJson.trustedDependencies).not.toContain('officecli');
    expect(buildScript).toContain("const prepareOfficeCli = require('./prepareOfficeCli')");
    expect(buildScript).toContain('prepareOfficeCli({ platform, arch })');
    expect(builderConfig).toContain('from: resources/bundled-officecli');
    expect(builderConfig).not.toContain('node_modules/officecli');
    expect(packageVerifier).toContain("{ rel: 'bundled-officecli', critical: true, kind: 'officecli-bundle' }");
  });

  it('preserves the pinned publisher signature instead of applying Electron helper entitlements', () => {
    const builderConfig = parseYaml(fs.readFileSync(path.resolve('electron-builder.yml'), 'utf8')) as {
      mac?: { signIgnore?: string[] };
    };
    const signIgnore = builderConfig.mac?.signIgnore;

    expect(signIgnore).toEqual([
      '/Contents/Resources/bundled-bun/[^/]+/bun$',
      '/Contents/Resources/whatsapp-bridge/node_modules/@img/sharp-(?:libvips-)?darwin-(?:arm64|x64)/.*(?:\\.node|\\.dylib)$',
      '/Contents/Resources/whatsapp-bridge/node_modules/(?:bare-fs|bare-os|bare-url)/prebuilds/(?:darwin-(?:arm64|x64)|ios-(?:arm64|arm64-simulator|x64-simulator))/[^/]+\\.bare$',
      '/Contents/Resources/bundled-officecli/[^/]+/officecli$',
      '/Contents/Resources/bundled-wayland-core/[^/]+/wayland-core$',
      '/Contents/Resources/bundled-constitution-fs/[^/]+/wayland-constitution-fs$',
    ]);
    const bunPath = '/tmp/Wayland.app/Contents/Resources/bundled-bun/darwin-arm64/bun';
    expect(signIgnore?.some((pattern) => new RegExp(pattern).test(bunPath))).toBe(true);
    const whatsappNativePath =
      '/tmp/Wayland.app/Contents/Resources/whatsapp-bridge/node_modules/@img/sharp-darwin-arm64/lib/sharp.node';
    expect(signIgnore?.some((pattern) => new RegExp(pattern).test(whatsappNativePath))).toBe(true);
    const whatsappBarePath =
      '/tmp/Wayland.app/Contents/Resources/whatsapp-bridge/node_modules/bare-fs/prebuilds/ios-arm64/bare-fs.bare';
    expect(signIgnore?.some((pattern) => new RegExp(pattern).test(whatsappBarePath))).toBe(true);
    const whatsappAndroidBarePath =
      '/tmp/Wayland.app/Contents/Resources/whatsapp-bridge/node_modules/bare-fs/prebuilds/android-arm64/bare-fs.bare';
    expect(signIgnore?.some((pattern) => new RegExp(pattern).test(whatsappAndroidBarePath))).toBe(false);
    const whatsappJavascriptPath = '/tmp/Wayland.app/Contents/Resources/whatsapp-bridge/node_modules/axios/index.js';
    expect(signIgnore?.some((pattern) => new RegExp(pattern).test(whatsappJavascriptPath))).toBe(false);
    const officeCliPath = '/tmp/Wayland.app/Contents/Resources/bundled-officecli/darwin-arm64/officecli';
    expect(signIgnore?.some((pattern) => new RegExp(pattern).test(officeCliPath))).toBe(true);
    expect(signIgnore?.some((pattern) => new RegExp(pattern).test('/tmp/Wayland.app/Contents/MacOS/Wayland'))).toBe(
      false
    );
    expect(
      signIgnore?.some((pattern) => new RegExp(pattern).test('/tmp/Wayland.app/Contents/Frameworks/Wayland Helper.app'))
    ).toBe(false);
  });
});
