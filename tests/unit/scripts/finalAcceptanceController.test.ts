import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { TARGETS, verifyFinalAcceptance } = require('../../../scripts/release-acceptance/verifyFinalAcceptance') as {
  TARGETS: string[];
  verifyFinalAcceptance: (input: unknown, verifiers?: Record<string, (...args: any[]) => any>) => Record<string, any>;
};

const COMMIT = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
const DIGEST = (character: string) => `sha256:${character.repeat(64)}`;
const CONDITIONAL: Record<string, string[]> = {
  'cowork-office': ['C0-B', 'C1', 'C0-RELEASE-CLOSURE'],
  voice: ['M5V-A', 'M5V-B'],
  mcp: ['M1M', 'MCP-4'],
  sandbox: ['M1S', 'SBX-2'],
  flux: ['M1F'],
};

function request() {
  return {
    contract: 'wayland-final-acceptance-request/1.0',
    candidate: { commit: COMMIT, tree: TREE },
    hardeningMatrix: {
      contract: 'wayland-release-hardening-matrix/1.0',
      requiredInvariants: [],
      requiredCriteria: [],
      requiredJourneys: [],
      supportedTargets: TARGETS,
      requiredHardeningGates: [],
      capabilityConditional: Object.fromEntries(
        Object.entries(CONDITIONAL).map(([id, receipts]) => [id, { criteria: [], journeys: [], receipts }])
      ),
    },
    capabilitySeal: { source: 'canonical' },
    packageSmokes: TARGETS.map((target) => ({ target, source: 'runtime' })),
    publisherArtifacts: [{ assetName: 'wayland-core-v0.12.25.tar.gz' }],
    updaterEvidence: { accepted: true },
    conditionalReceipts: Object.keys(CONDITIONAL).map((capabilityId) => ({ capabilityId, accepted: true })),
    findingsEvidence: { accepted: true },
    releaseBlockersEvidence: { accepted: true },
  };
}

function verifiers() {
  return {
    verifyHardeningMatrix: () => ({
      contract: 'wayland-release-hardening-matrix/1.0',
      invariants: 21,
      criteria: 31,
      journeys: 24,
      targets: 6,
      gates: 15,
      conditionalCapabilities: 5,
    }),
    verifyCapabilitySeal: () => ({
      contract: 'wayland-candidate-capability-seal/2.0',
      candidate: { commit: COMMIT, tree: TREE },
      selectionSha256: DIGEST('1'),
      capabilities: Object.keys(CONDITIONAL).map((id) => ({ id, mode: 'included' })),
      sealSha256: DIGEST('2'),
    }),
    verifyPlatformSmoke: (raw: { target: string }) => ({
      contract: 'wayland-platform-package-smoke-authority/1.0',
      target: raw.target,
      candidate: { commit: COMMIT, tree: TREE },
      artifacts: {
        installerDigest: DIGEST(String(TARGETS.indexOf(raw.target) + 1)),
        executableSha256: DIGEST(String(TARGETS.indexOf(raw.target) + 2)),
        appAsarSha256: DIGEST(String(TARGETS.indexOf(raw.target) + 3)),
        verifiedCandidateDigest: DIGEST(String(TARGETS.indexOf(raw.target) + 4)),
      },
      authority: 'canonical-packaged-runtime-observer',
    }),
    verifyThirdPartyLedger: () => ({
      contract: 'wayland-third-party-executables/1.0',
      entries: 4,
      ids: ['7zip-recovery', 'bun', 'officecli', 'signal-cli'],
    }),
    verifyPublisherArtifact: (raw: { assetName: string }) => ({
      contract: 'wayland-publisher-attestations/1.0',
      policyId: 'wayland-core-v0.12.25-release',
      repository: 'FerroxLabs/wayland-core',
      signerWorkflow: 'FerroxLabs/wayland-core/.github/workflows/release.yml',
      sourceRef: 'refs/heads/main',
      sourceDigest: 'c'.repeat(40),
      predicateType: 'https://slsa.dev/provenance/v1',
      runner: 'github-hosted',
      asset: raw.assetName,
      sha256: DIGEST('5'),
      verified: true,
    }),
    verifyUpdaterObservation: () => ({
      contract: 'wayland-updater-trusted-observation/1.0',
      candidate: { commit: COMMIT, tree: TREE },
      authority: 'nonce-bound-packaged-runtime-observer',
      receiptSha256: DIGEST('6'),
    }),
    verifyConditionalCapability: (_raw: unknown, context: { capabilityId: string; expectedReceiptIds: string[] }) => ({
      contract: 'wayland-capability-release-acceptance/1.0',
      candidate: { commit: COMMIT, tree: TREE },
      capabilityId: context.capabilityId,
      receiptIds: context.expectedReceiptIds,
      receiptDigests: context.expectedReceiptIds.map((_: string, index: number) => DIGEST(String(index + 1))),
      authority: 'canonical-capability-acceptance-validator',
    }),
    verifyFindingsClearance: () => ({
      contract: 'wayland-release-findings-clearance/1.0',
      candidate: { commit: COMMIT, tree: TREE },
      unresolved: { blocker: 0, critical: 0, high: 0 },
      authority: 'canonical-release-tracker',
      evidenceSha256: DIGEST('7'),
    }),
    verifyReleaseBlockers: () => ({
      contract: 'wayland-release-blocker-clearance/1.0',
      candidate: { commit: COMMIT, tree: TREE },
      unresolved: { p0: 0, p1: 0 },
      authority: 'canonical-release-tracker',
      evidenceSha256: DIGEST('8'),
    }),
  };
}

describe('M8-A final acceptance controller', () => {
  it('accepts only a complete authority-backed exact candidate', () => {
    const receipt = verifyFinalAcceptance(request(), verifiers());

    expect(receipt).toMatchObject({
      contract: 'wayland-final-acceptance/1.0',
      candidate: { commit: COMMIT, tree: TREE },
      accepted: true,
    });
    expect(receipt.targets).toHaveLength(6);
    expect(receipt.capabilityReceipts).toHaveLength(5);
  });

  it('rejects a missing or duplicate platform target', () => {
    const missing = request();
    missing.packageSmokes.pop();
    expect(() => verifyFinalAcceptance(missing, verifiers())).toThrow(/target-coverage-mismatch/);

    const duplicate = request();
    duplicate.packageSmokes[5] = { ...duplicate.packageSmokes[0] };
    expect(() => verifyFinalAcceptance(duplicate, verifiers())).toThrow(/unknown-or-duplicate-target/);
  });

  it('rejects stale commit or tree evidence', () => {
    const staleCommit = verifiers();
    staleCommit.verifyPlatformSmoke = (raw: { target: string }) => ({
      ...verifiers().verifyPlatformSmoke(raw),
      candidate: { commit: 'd'.repeat(40), tree: TREE },
    });
    expect(() => verifyFinalAcceptance(request(), staleCommit)).toThrow(/stale-or-foreign-candidate/);

    const staleTree = verifiers();
    staleTree.verifyCapabilitySeal = () => ({
      ...verifiers().verifyCapabilitySeal(),
      candidate: { commit: COMMIT, tree: 'e'.repeat(40) },
    });
    expect(() => verifyFinalAcceptance(request(), staleTree)).toThrow(/stale-or-foreign-candidate/);
  });

  it('does not treat a caller-authored accepted boolean as updater authority', () => {
    const withoutUpdaterAuthority = verifiers();
    delete withoutUpdaterAuthority.verifyUpdaterObservation;
    expect(() => verifyFinalAcceptance(request(), withoutUpdaterAuthority)).toThrow(
      /M8A_UPDATER_AUTHORITY_UNAVAILABLE/
    );
  });

  it('rejects an omitted conditional capability receipt', () => {
    const input = request();
    input.conditionalReceipts = input.conditionalReceipts.filter((receipt) => receipt.capabilityId !== 'mcp');
    expect(() => verifyFinalAcceptance(input, verifiers())).toThrow(/missing:mcp/);
  });

  it('rejects unknown critical fields before invoking authority adapters', () => {
    const input = { ...request(), acceptAnyway: true };
    expect(() => verifyFinalAcceptance(input, verifiers())).toThrow(/M8A_REQUEST_INVALID.*unknown-critical-field/);
  });

  it('rejects any unresolved BLOCKER, CRITICAL, or HIGH finding', () => {
    for (const severity of ['blocker', 'critical', 'high']) {
      const hostile = verifiers();
      hostile.verifyFindingsClearance = () => ({
        ...verifiers().verifyFindingsClearance(),
        unresolved: { blocker: 0, critical: 0, high: 0, [severity]: 1 },
      });
      expect(() => verifyFinalAcceptance(request(), hostile)).toThrow(new RegExp(`${severity}-unresolved`));
    }
  });

  it('rejects P0 or P1 release blockers', () => {
    for (const severity of ['p0', 'p1']) {
      const hostile = verifiers();
      hostile.verifyReleaseBlockers = () => ({
        ...verifiers().verifyReleaseBlockers(),
        unresolved: { p0: 0, p1: 0, [severity]: 1 },
      });
      expect(() => verifyFinalAcceptance(request(), hostile)).toThrow(new RegExp(`${severity}-unresolved`));
    }
  });

  it('fails closed when updater trusted-observation authority is unavailable', () => {
    const input = request();
    input.updaterEvidence = { contract: 'wayland-updater-rollback-reupgrade/1.0', accepted: true };
    const withoutUpdaterAuthority = verifiers();
    delete withoutUpdaterAuthority.verifyUpdaterObservation;

    expect(() => verifyFinalAcceptance(input, withoutUpdaterAuthority)).toThrow(/trusted-validator-not-installed/);
  });
});
