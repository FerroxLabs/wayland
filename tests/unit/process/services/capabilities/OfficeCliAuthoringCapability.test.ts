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
});
