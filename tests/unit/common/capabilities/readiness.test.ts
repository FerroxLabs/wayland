import { describe, expect, it } from 'vitest';
import {
  CAPABILITY_EVIDENCE_CONTRACT,
  OFFICECLI_CAPABILITY,
  WAYLAND_CAPABILITY_MANIFEST,
  capabilityFixtureDigest,
  selectCapabilityReadiness,
  type CapabilityDefinition,
  type CapabilityEvidence,
  type CapabilityManifest,
} from '@/common/capabilities';

const NOW = 10_000;
const TARGET = OFFICECLI_CAPABILITY.platforms.find((entry) => entry.platform === 'darwin' && entry.arch === 'arm64')!;
const context = {
  capabilityId: OFFICECLI_CAPABILITY.id,
  correlationId: 'turn:1',
  platform: 'darwin',
  arch: 'arm64',
  backend: 'wcore',
  now: NOW,
} as const;
function evidence(overrides: Partial<CapabilityEvidence> = {}): CapabilityEvidence {
  return {
    contract: CAPABILITY_EVIDENCE_CONTRACT,
    evidenceId: 'officecli:e1',
    capabilityId: OFFICECLI_CAPABILITY.id,
    capabilityVersion: OFFICECLI_CAPABILITY.version,
    manifestId: WAYLAND_CAPABILITY_MANIFEST.id,
    manifestVersion: WAYLAND_CAPABILITY_MANIFEST.version,
    fixtureDigest: OFFICECLI_CAPABILITY.fixtureDigest,
    source: 'officecli-bundle',
    sourceInstance: 'officecli:fixture',
    correlationId: context.correlationId,
    observedAt: NOW - 1,
    expiresAt: NOW + 1000,
    platform: 'darwin',
    arch: 'arm64',
    backend: 'wcore',
    executionMode: 'local-binary',
    status: 'available',
    operations: OFFICECLI_CAPABILITY.operations,
    formats: OFFICECLI_CAPABILITY.formats,
    dependencies: [],
    requirements: OFFICECLI_CAPABILITY.requirements,
    artifact: { binarySha256: TARGET.binarySha256, publisherProof: TARGET.publisherProofSha256! },
    reason: 'available',
    ...overrides,
  };
}
function withEnforceability(enforceability: CapabilityDefinition['enforceability']): CapabilityManifest {
  const { fixtureDigest: _old, ...fixture } = structuredClone(OFFICECLI_CAPABILITY);
  const updated = { ...fixture, enforceability };
  return {
    ...WAYLAND_CAPABILITY_MANIFEST,
    capabilities: [{ ...updated, fixtureDigest: capabilityFixtureDigest(updated) }],
  };
}

describe('shared capability readiness selector', () => {
  it('grants invocation only for complete, current, correlated enforced evidence', () => {
    expect(selectCapabilityReadiness(WAYLAND_CAPABILITY_MANIFEST, [evidence()], context)).toMatchObject({
      state: 'ready',
      canInvoke: true,
      enforceability: 'enforced',
    });
  });

  it('requires an explicit broker decision for brokered capability evidence', () => {
    const manifest = withEnforceability('brokered');
    const brokerEvidence = evidence({ fixtureDigest: manifest.capabilities[0].fixtureDigest });
    expect(selectCapabilityReadiness(manifest, [brokerEvidence], context)).toMatchObject({
      state: 'brokered',
      canInvoke: false,
      requiresBroker: true,
    });
  });

  it('never grants invocation from advisory evidence', () => {
    const manifest = withEnforceability('advisory');
    const advisoryEvidence = evidence({ fixtureDigest: manifest.capabilities[0].fixtureDigest });
    expect(selectCapabilityReadiness(manifest, [advisoryEvidence], context)).toMatchObject({
      state: 'advisory',
      canInvoke: false,
    });
  });

  it('fails closed on malformed or unknown critical evidence', () => {
    expect(
      selectCapabilityReadiness(WAYLAND_CAPABILITY_MANIFEST, [{ ...evidence(), grantsReady: true }], context).state
    ).toBe('unavailable');
  });

  it('fails closed on stale or correlation-mismatched evidence', () => {
    expect(selectCapabilityReadiness(WAYLAND_CAPABILITY_MANIFEST, [evidence({ expiresAt: NOW })], context).state).toBe(
      'unavailable'
    );
    expect(
      selectCapabilityReadiness(WAYLAND_CAPABILITY_MANIFEST, [evidence({ correlationId: 'turn:other' })], context).state
    ).toBe('unavailable');
  });

  it('fails closed on a publisher proof that is not pinned to the target manifest', () => {
    expect(
      selectCapabilityReadiness(
        WAYLAND_CAPABILITY_MANIFEST,
        [evidence({ artifact: { binarySha256: TARGET.binarySha256, publisherProof: `sha256:${'1'.repeat(64)}` } })],
        context
      ).state
    ).toBe('unavailable');
  });

  it('uses a conservative intersection across producers', () => {
    const narrowed = evidence({
      evidenceId: 'officecli:e2',
      operations: OFFICECLI_CAPABILITY.operations.filter((entry) => entry !== 'view'),
      requirements: {
        ...OFFICECLI_CAPABILITY.requirements,
        network: 'required',
        cost: 'unknown',
        credentials: ['broker-token'],
      },
    });
    const readiness = selectCapabilityReadiness(WAYLAND_CAPABILITY_MANIFEST, [evidence(), narrowed], context);
    expect(readiness.state).toBe('unavailable');
    expect(readiness.operations).not.toContain('view');
    expect(readiness.requirements).toMatchObject({
      network: 'required',
      cost: 'unknown',
      credentials: ['broker-token'],
    });
  });
});
