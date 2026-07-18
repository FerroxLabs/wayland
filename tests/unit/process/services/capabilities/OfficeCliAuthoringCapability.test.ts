import { describe, expect, it } from 'vitest';
import { OFFICECLI_CAPABILITY } from '@/common/capabilities';
import {
  classifyBundledOfficeCli,
  OFFICECLI_PINNED_AUTHORING_VERSION,
  probeOfficeCliAuthoringEvidence,
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
    publisherSignatureProof: PUBLISHER,
    contractProof: { contract: 'wayland-officecli-authoring/1.0', release: `v${OFFICECLI_PINNED_AUTHORING_VERSION}` },
    smokeProof: { formats: OFFICECLI_CAPABILITY.formats, operations: OFFICECLI_CAPABILITY.operations },
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
});
