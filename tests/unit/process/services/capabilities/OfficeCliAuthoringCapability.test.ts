import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { OFFICECLI_CAPABILITY } from '@/common/capabilities';
import {
  classifyBundledOfficeCli,
  OFFICECLI_CONTRACT_SHA256,
  OFFICECLI_LEDGER_PROOF,
  OFFICECLI_PINNED_AUTHORING_VERSION,
  OFFICECLI_SKILL_PROOF,
  probeOfficeCliAuthoringEvidence,
  verifyInstalledOfficeCliSkillProof,
} from '@process/services/capabilities/OfficeCliAuthoringCapability';

const TARGET = OFFICECLI_CAPABILITY.platforms.find((entry) => entry.platform === 'darwin' && entry.arch === 'arm64')!;
const PUBLISHER = {
  contract: 'apple-developer-id/1.0',
  teamIdentifier: '52JQX2HUSC',
  hardenedRuntime: true,
  secureTimestamp: true,
  entitlements: ['com.apple.security.cs.allow-jit'],
};
function manifest(overrides: Record<string, unknown> = {}) {
  return {
    contract: 'iofficeai-officecli-native',
    version: `v${OFFICECLI_PINNED_AUTHORING_VERSION}`,
    reportedVersion: OFFICECLI_PINNED_AUTHORING_VERSION,
    platform: 'darwin',
    arch: 'arm64',
    asset: TARGET.artifact,
    binary: 'officecli',
    sha256: TARGET.binarySha256,
    source: 'verified-cache',
    contractSha256: OFFICECLI_CONTRACT_SHA256,
    capabilityFixtureDigest: OFFICECLI_CAPABILITY.fixtureDigest,
    skillProof: OFFICECLI_SKILL_PROOF,
    ledgerProof: OFFICECLI_LEDGER_PROOF,
    publisherSignatureProof: PUBLISHER,
    contractProof: { contract: 'wayland-officecli-authoring/1.0', release: `v${OFFICECLI_PINNED_AUTHORING_VERSION}` },
    smokeProof: {
      formats: OFFICECLI_CAPABILITY.formats,
      operations: OFFICECLI_CAPABILITY.operations,
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
    ...overrides,
  };
}

function createInstalledFixture(prefix: string) {
  const source = path.resolve('resources/bundled-officecli/darwin-arm64');
  if (!fs.existsSync(path.join(source, 'officecli'))) return null;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const bundledDir = path.join(root, 'bundle');
  const skillsRoot = path.join(root, 'skills');
  fs.cpSync(source, bundledDir, { recursive: true });
  for (const skill of OFFICECLI_SKILL_PROOF.skills) {
    const target = path.join(skillsRoot, skill.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.resolve('src/process/resources/skills', skill.path), target);
  }
  return { root, bundledDir, skillsRoot };
}

async function probeInstalledFixture(bundledDir: string, skillsRoot: string) {
  return probeOfficeCliAuthoringEvidence({
    correlationId: 'capabilities:wcore',
    backend: 'wcore',
    platform: 'darwin',
    arch: 'arm64',
    bundledDir,
    skillsRoot,
  });
}

describe('OfficeCLI target-exact evidence producer', () => {
  it('accepts the exact target digest, authoring contract, smoke proof, and publisher identity', () => {
    expect(classifyBundledOfficeCli(manifest(), TARGET.binarySha256, 'darwin', 'arm64')).toMatchObject({
      available: true,
    });
  });

  it('rejects a manifest whose checksum was changed with the binary', () => {
    const attacker = `sha256:${'a'.repeat(64)}` as const;
    expect(classifyBundledOfficeCli(manifest({ sha256: attacker }), attacker, 'darwin', 'arm64')).toMatchObject({
      available: false,
    });
  });

  it('rejects a valid target manifest replayed for another architecture', () => {
    expect(classifyBundledOfficeCli(manifest(), TARGET.binarySha256, 'darwin', 'x64')).toMatchObject({
      available: false,
    });
  });

  it('rejects an invalid publisher identity', () => {
    expect(
      classifyBundledOfficeCli(
        manifest({ publisherSignatureProof: { ...PUBLISHER, teamIdentifier: 'ATTACKER00' } }),
        TARGET.binarySha256,
        'darwin',
        'arm64'
      )
    ).toMatchObject({ available: false });
  });

  it('rejects unknown manifest fields that attempt to mint readiness', () => {
    expect(
      classifyBundledOfficeCli(manifest({ grantsReady: true }), TARGET.binarySha256, 'darwin', 'arm64')
    ).toMatchObject({ available: false });
  });

  it.each([
    ['contract digest', { contractSha256: `sha256:${'0'.repeat(64)}` }],
    ['capability fixture', { capabilityFixtureDigest: `sha256:${'0'.repeat(64)}` }],
    ['skill digest', { skillProof: { ...OFFICECLI_SKILL_PROOF, skills: [] } }],
    ['ledger digest', { ledgerProof: { ...OFFICECLI_LEDGER_PROOF, ledgerSha256: `sha256:${'0'.repeat(64)}` } }],
    ['hosted fallback', { ledgerProof: { ...OFFICECLI_LEDGER_PROOF, hostedFallbackAvailable: true } }],
    ['source substitution', { source: 'https://attacker.invalid/officecli' }],
    ['reported version', { reportedVersion: '1.0.999' }],
    ['publisher self-claim', { publisherSignatureProof: { ...PUBLISHER, grantsReady: true } }],
    [
      'contract self-claim',
      {
        contractProof: {
          contract: 'wayland-officecli-authoring/1.0',
          release: `v${OFFICECLI_PINNED_AUTHORING_VERSION}`,
          grantsReady: true,
        },
      },
    ],
    ['skill self-claim', { skillProof: { ...OFFICECLI_SKILL_PROOF, grantsReady: true } }],
  ])('rejects %s drift', (_label, override) => {
    expect(classifyBundledOfficeCli(manifest(override), TARGET.binarySha256, 'darwin', 'arm64')).toMatchObject({
      available: false,
    });
  });

  it('rejects missing, duplicate, or extra smoke capabilities', () => {
    const base = manifest().smokeProof as Record<string, unknown>;
    for (const formats of [
      ['docx', 'xlsx'],
      ['docx', 'xlsx', 'pptx', 'pdf'],
      ['docx', 'xlsx', 'pptx', 'pptx'],
    ]) {
      expect(
        classifyBundledOfficeCli(manifest({ smokeProof: { ...base, formats } }), TARGET.binarySha256, 'darwin', 'arm64')
      ).toMatchObject({ available: false });
    }
  });

  it('does not use an arbitrary PATH executable when the bundle is absent', async () => {
    const evidence = await probeOfficeCliAuthoringEvidence({
      correlationId: 'capabilities:wcore',
      backend: 'wcore',
      now: 1000,
      platform: 'darwin',
      arch: 'arm64',
      bundledDir: null,
    });
    expect(evidence.status).toBe('unavailable');
    expect(evidence.reason).toContain('target-exact bundled');
  });

  it('re-authenticates installed skill bytes and rejects undeclared nested files', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-officecli-installed-skills-'));
    for (const skill of OFFICECLI_SKILL_PROOF.skills) {
      const target = path.join(root, skill.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.resolve('src/process/resources/skills', skill.path), target);
    }
    await expect(verifyInstalledOfficeCliSkillProof(root, OFFICECLI_SKILL_PROOF)).resolves.toBe(true);
    fs.appendFileSync(path.join(root, OFFICECLI_SKILL_PROOF.skills[0].path), '\nstale\n');
    await expect(verifyInstalledOfficeCliSkillProof(root, OFFICECLI_SKILL_PROOF)).resolves.toBe(false);
    fs.copyFileSync(
      path.resolve('src/process/resources/skills', OFFICECLI_SKILL_PROOF.skills[0].path),
      path.join(root, OFFICECLI_SKILL_PROOF.skills[0].path)
    );
    fs.writeFileSync(path.join(root, path.dirname(OFFICECLI_SKILL_PROOF.skills[0].path), 'undeclared.md'), 'stale');
    await expect(verifyInstalledOfficeCliSkillProof(root, OFFICECLI_SKILL_PROOF)).resolves.toBe(false);
    if (process.platform !== 'win32') {
      fs.rmSync(path.join(root, path.dirname(OFFICECLI_SKILL_PROOF.skills[0].path), 'undeclared.md'));
      fs.symlinkSync(
        path.join(root, path.dirname(OFFICECLI_SKILL_PROOF.skills[0].path)),
        path.join(root, 'officecli-alias')
      );
      await expect(verifyInstalledOfficeCliSkillProof(root, OFFICECLI_SKILL_PROOF)).resolves.toBe(false);
    }
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('does not advertise a non-executable pinned binary', async () => {
    if (process.platform !== 'darwin' || process.arch !== 'arm64') return;
    const source = path.resolve('resources/bundled-officecli/darwin-arm64');
    if (!fs.existsSync(path.join(source, 'officecli'))) return;
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-officecli-nonexec-'));
    const bundledDir = path.join(root, 'bundle');
    const skillsRoot = path.join(root, 'skills');
    fs.cpSync(source, bundledDir, { recursive: true });
    for (const skill of OFFICECLI_SKILL_PROOF.skills) {
      const target = path.join(skillsRoot, skill.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.resolve('src/process/resources/skills', skill.path), target);
    }
    fs.chmodSync(path.join(bundledDir, 'officecli'), 0o644);
    const evidence = await probeOfficeCliAuthoringEvidence({
      correlationId: 'capabilities:wcore',
      backend: 'wcore',
      platform: 'darwin',
      arch: 'arm64',
      bundledDir,
      skillsRoot,
    });
    expect(evidence.status).toBe('unavailable');
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('does not advertise an exact-byte binary reached through a symbolic link', async () => {
    if (process.platform !== 'darwin' || process.arch !== 'arm64') return;
    const fixture = createInstalledFixture('wayland-officecli-symlink-');
    if (!fixture) return;
    const substitute = path.join(fixture.root, 'substitute-officecli');
    fs.copyFileSync(path.join(fixture.bundledDir, 'officecli'), substitute);
    fs.chmodSync(substitute, 0o755);
    fs.rmSync(path.join(fixture.bundledDir, 'officecli'));
    fs.symlinkSync(substitute, path.join(fixture.bundledDir, 'officecli'));

    const evidence = await probeInstalledFixture(fixture.bundledDir, fixture.skillsRoot);
    expect(evidence.status).toBe('unavailable');
    fs.rmSync(fixture.root, { recursive: true, force: true });
  });

  it('rejects symbolic or non-regular bundle, manifest, and binary identities', async () => {
    if (process.platform !== 'darwin' || process.arch !== 'arm64') return;
    const mutations: ReadonlyArray<(fixture: NonNullable<ReturnType<typeof createInstalledFixture>>) => string> = [
      (fixture) => {
        const substitute = path.join(fixture.root, 'manifest-substitute.json');
        fs.copyFileSync(path.join(fixture.bundledDir, 'manifest.json'), substitute);
        fs.rmSync(path.join(fixture.bundledDir, 'manifest.json'));
        fs.symlinkSync(substitute, path.join(fixture.bundledDir, 'manifest.json'));
        return fixture.bundledDir;
      },
      (fixture) => {
        const actual = path.join(fixture.root, 'actual-bundle');
        fs.renameSync(fixture.bundledDir, actual);
        fs.symlinkSync(actual, fixture.bundledDir, 'dir');
        return fixture.bundledDir;
      },
      (fixture) => {
        fs.rmSync(path.join(fixture.bundledDir, 'officecli'));
        fs.mkdirSync(path.join(fixture.bundledDir, 'officecli'));
        return fixture.bundledDir;
      },
      (fixture) => {
        fs.rmSync(path.join(fixture.bundledDir, 'manifest.json'));
        fs.mkdirSync(path.join(fixture.bundledDir, 'manifest.json'));
        return fixture.bundledDir;
      },
    ];

    await Promise.all(
      mutations.map(async (mutate) => {
        const fixture = createInstalledFixture('wayland-officecli-path-matrix-');
        if (!fixture) return;
        try {
          const evidence = await probeInstalledFixture(mutate(fixture), fixture.skillsRoot);
          expect(evidence.status).toBe('unavailable');
        } finally {
          fs.rmSync(fixture.root, { recursive: true, force: true });
        }
      })
    );
  });

  it('rejects a bundle binary with an out-of-bundle hardlink authority', async () => {
    if (process.platform !== 'darwin' || process.arch !== 'arm64') return;
    const fixture = createInstalledFixture('wayland-officecli-hardlink-');
    if (!fixture) return;
    try {
      fs.linkSync(path.join(fixture.bundledDir, 'officecli'), path.join(fixture.root, 'external-officecli'));

      const evidence = await probeInstalledFixture(fixture.bundledDir, fixture.skillsRoot);

      // An external hardlink can mutate the authenticated inode after the
      // probe, so it is not exclusively contained by the managed bundle.
      expect(evidence.status).toBe('unavailable');
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects a bundle manifest with an out-of-bundle hardlink authority', async () => {
    if (process.platform !== 'darwin' || process.arch !== 'arm64') return;
    const fixture = createInstalledFixture('wayland-officecli-manifest-hardlink-');
    if (!fixture) return;
    try {
      fs.linkSync(path.join(fixture.bundledDir, 'manifest.json'), path.join(fixture.root, 'external-manifest.json'));

      const evidence = await probeInstalledFixture(fixture.bundledDir, fixture.skillsRoot);

      expect(evidence.status).toBe('unavailable');
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects installed skill bytes with an out-of-root hardlink authority', async () => {
    if (process.platform !== 'darwin' || process.arch !== 'arm64') return;
    const fixture = createInstalledFixture('wayland-officecli-skill-hardlink-');
    if (!fixture) return;
    try {
      const skillPath = path.join(fixture.skillsRoot, OFFICECLI_SKILL_PROOF.skills[0].path);
      fs.linkSync(skillPath, path.join(fixture.root, 'external-skill.md'));

      const evidence = await probeInstalledFixture(fixture.bundledDir, fixture.skillsRoot);

      expect(evidence.status).toBe('unavailable');
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects a symbolic installed skill root even when every byte is exact', async () => {
    if (process.platform === 'win32') return;
    const fixture = createInstalledFixture('wayland-officecli-skill-root-symlink-');
    if (!fixture) return;
    const linkedRoot = path.join(fixture.root, 'linked-skills');
    fs.symlinkSync(fixture.skillsRoot, linkedRoot, 'dir');
    try {
      const evidence = await probeInstalledFixture(fixture.bundledDir, linkedRoot);

      expect(evidence.status).toBe('unavailable');
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects bundle mutation while installed skills are being verified', async () => {
    if (process.platform !== 'darwin' || process.arch !== 'arm64') return;
    const fixture = createInstalledFixture('wayland-officecli-post-bundle-race-');
    if (!fixture) return;
    const realFs = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    let mutated = false;
    vi.resetModules();
    vi.doMock('node:fs/promises', () => ({
      ...realFs,
      realpath: async (target: Parameters<typeof realFs.realpath>[0], options?: BufferEncoding | null) => {
        if (!mutated && String(target) === fixture.skillsRoot) {
          mutated = true;
          fs.appendFileSync(path.join(fixture.bundledDir, 'officecli'), 'post-bundle-verification-tamper');
        }
        return realFs.realpath(target, options as never);
      },
    }));
    try {
      const { probeOfficeCliAuthoringEvidence: probeWithRace } =
        await import('@process/services/capabilities/OfficeCliAuthoringCapability');

      const evidence = await probeWithRace({
        correlationId: 'capabilities:wcore',
        backend: 'wcore',
        platform: 'darwin',
        arch: 'arm64',
        bundledDir: fixture.bundledDir,
        skillsRoot: fixture.skillsRoot,
      });

      expect(mutated).toBe(true);
      expect(evidence.status).toBe('unavailable');
    } finally {
      vi.doUnmock('node:fs/promises');
      vi.resetModules();
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects installed skill mutation while the bundle is rebound', async () => {
    if (process.platform !== 'darwin' || process.arch !== 'arm64') return;
    const fixture = createInstalledFixture('wayland-officecli-post-skill-race-');
    if (!fixture) return;
    const realFs = await vi.importActual<typeof import('node:fs')>('node:fs');
    let mutated = false;
    vi.resetModules();
    vi.doMock('node:fs', () => ({
      ...realFs,
      realpathSync: (target: Parameters<typeof realFs.realpathSync>[0], options?: BufferEncoding | null) => {
        if (!mutated && String(target) === fixture.bundledDir) {
          mutated = true;
          fs.appendFileSync(path.join(fixture.skillsRoot, OFFICECLI_SKILL_PROOF.skills[0].path), 'post-skill-tamper');
        }
        return realFs.realpathSync(target, options as never);
      },
    }));
    try {
      const { probeOfficeCliAuthoringEvidence: probeWithRace } =
        await import('@process/services/capabilities/OfficeCliAuthoringCapability');

      const evidence = await probeWithRace({
        correlationId: 'capabilities:wcore',
        backend: 'wcore',
        platform: 'darwin',
        arch: 'arm64',
        bundledDir: fixture.bundledDir,
        skillsRoot: fixture.skillsRoot,
      });

      expect(mutated).toBe(true);
      expect(evidence.status).toBe('unavailable');
    } finally {
      vi.doUnmock('node:fs');
      vi.resetModules();
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects bundle mutation while the combined sweep checks skills', async () => {
    if (process.platform !== 'darwin' || process.arch !== 'arm64') return;
    const fixture = createInstalledFixture('wayland-officecli-combined-sweep-race-');
    if (!fixture) return;
    const realFs = await vi.importActual<typeof import('node:fs')>('node:fs');
    let mutated = false;
    vi.resetModules();
    vi.doMock('node:fs', () => ({
      ...realFs,
      realpathSync: (target: Parameters<typeof realFs.realpathSync>[0], options?: BufferEncoding | null) => {
        if (!mutated && String(target) === fixture.skillsRoot) {
          mutated = true;
          fs.appendFileSync(path.join(fixture.bundledDir, 'officecli'), 'post-bundle-sweep-tamper');
        }
        return realFs.realpathSync(target, options as never);
      },
    }));
    try {
      const { probeOfficeCliAuthoringEvidence: probeWithRace } =
        await import('@process/services/capabilities/OfficeCliAuthoringCapability');

      const evidence = await probeWithRace({
        correlationId: 'capabilities:wcore',
        backend: 'wcore',
        platform: 'darwin',
        arch: 'arm64',
        bundledDir: fixture.bundledDir,
        skillsRoot: fixture.skillsRoot,
      });

      expect(mutated).toBe(true);
      expect(evidence.status).toBe('unavailable');
    } finally {
      vi.doUnmock('node:fs');
      vi.resetModules();
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
