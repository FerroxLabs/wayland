import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  TARGETS,
  testOnlyVerifyFinalAcceptance: verifyFinalAcceptance,
  verifyFinalAcceptance: verifyProductionAcceptance,
} = require('../../../scripts/release-acceptance/verifyFinalAcceptance') as {
  TARGETS: string[];
  testOnlyVerifyFinalAcceptance: (
    input: unknown,
    verifiers?: Record<string, (...args: any[]) => any>
  ) => Record<string, any>;
  verifyFinalAcceptance: (input: unknown) => Record<string, any>;
};

const COMMIT = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
const DIGEST = (character: string) => `sha256:${character.repeat(64)}`;
const INDEX_DIGEST = (index: number) => `sha256:${index.toString(16).padStart(64, '0')}`;
const CONDITIONAL: Record<string, string[]> = {
  'cowork-office': ['C0-B', 'C1', 'C0-RELEASE-CLOSURE'],
  voice: ['M5V-A', 'M5V-B'],
  mcp: ['M1M', 'MCP-4'],
  sandbox: ['M1S', 'SBX-2'],
  flux: ['M1F'],
};
const CORE_ASSETS = TARGETS.map((target) => `wayland-core-v0.12.25-${target}.archive`);
const TARGET_GATES = ['package-identity-signature', 'install', 'updater', 'rollback', 're-upgrade'];
const TARGET_GATE_REQUIREMENTS = TARGETS.flatMap((target) =>
  TARGET_GATES.map((gate) => ({
    receiptId: `M8-F:${target}:${gate}`,
    contract: 'wayland-target-hardening-gate-receipt/1.0',
    target,
    gate,
  }))
);
const TARGET_GATE_SCHEMA = {
  contract: 'wayland-target-hardening-gate-receipt/1.0',
  requiredFields: ['contract', 'receiptId', 'candidate', 'target', 'gate', 'authority', 'evidenceSha256'],
  authority: 'canonical-target-hardening-validator',
};
const RELEASE_EVIDENCE = {
  invariant: Array.from({ length: 21 }, (_, index) => `INV-${String(index + 1).padStart(2, '0')}`),
  criterion: [
    'SC-01',
    'SC-02',
    'SC-03',
    'SC-04',
    'SC-05',
    'SC-06',
    'SC-06A',
    'SC-06B',
    'SC-06C',
    'SC-06D',
    'SC-06E',
    'SC-06F',
    'SC-07',
    'SC-08',
    'SC-09',
    'SC-10',
    'SC-10A',
    'SC-11',
    'SC-12',
    'SC-13',
    'SC-14',
    'SC-14A',
    'SC-14B',
    'SC-14C',
    'SC-15',
    'SC-16',
    'SC-17',
    'SC-18',
    'SC-19',
    'SC-20',
    'SC-21',
  ],
  journey: Array.from({ length: 25 }, (_, index) => `J${index + 1}`).filter((id) => id !== 'J22'),
  'hardening-gate': [
    'accessibility',
    'bundle',
    'crash-recovery',
    'dependency-security',
    'extension-isolation',
    'localization',
    'memory',
    'offline-partial-service',
    'packaging',
    'performance',
    'process-cleanup',
    'rollback',
    'security',
    'support-doctor',
    'updater',
  ],
};

function releaseEvidence() {
  return Object.entries(RELEASE_EVIDENCE).flatMap(([kind, ids]) =>
    ids.map((id) => ({ kind, id, evidenceSha256: DIGEST('a') }))
  );
}

function verifiedTargetGateReceipts() {
  return TARGET_GATE_REQUIREMENTS.map((receipt, index) => ({
    ...receipt,
    candidate: { commit: COMMIT, tree: TREE },
    authority: 'canonical-target-hardening-validator',
    evidenceSha256: INDEX_DIGEST(index + 1),
    receiptFile: { path: `/trusted/${receipt.target}/${receipt.gate}.json`, sha256: INDEX_DIGEST(index + 101) },
    attestationVerified: true,
  }));
}

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
      targetGateReceiptSchema: TARGET_GATE_SCHEMA,
      targetGateRequirements: TARGET_GATE_REQUIREMENTS,
      capabilityConditional: Object.fromEntries(
        Object.entries(CONDITIONAL).map(([id, receipts]) => [id, { criteria: [], journeys: [], receipts }])
      ),
    },
    capabilitySeal: { source: 'canonical' },
    packageSmokes: TARGETS.map((target) => ({ target, source: 'runtime' })),
    targetGateReceipts: { receiptsDirectory: '/trusted/target-gates' },
    releaseEvidenceManifest: { source: 'canonical' },
    releaseClaimsManifest: { source: 'canonical' },
    publisherArtifacts: CORE_ASSETS.map((assetName) => ({ assetName })),
    updaterEvidence: { accepted: true },
    conditionalReceipts: Object.keys(CONDITIONAL).map((capabilityId) => ({ capabilityId, accepted: true })),
    findingsEvidence: { accepted: true },
    releaseBlockersEvidence: { accepted: true },
  };
}

function verifiers() {
  return {
    observeCandidateIdentity: () => ({ commit: COMMIT, tree: TREE }),
    verifyHardeningMatrix: () => ({
      contract: 'wayland-release-hardening-matrix/1.0',
      invariants: 21,
      criteria: 31,
      journeys: 24,
      targets: 6,
      gates: 15,
      targetProofGates: 5,
      targetGateReceiptSchema: TARGET_GATE_SCHEMA,
      targetGateRequirements: TARGET_GATE_REQUIREMENTS,
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
    verifyTargetGateReceiptFiles: () => ({
      contract: 'wayland-target-hardening-gate-verification/1.0',
      authority: 'canonical-target-hardening-validator',
      candidate: { commit: COMMIT, tree: TREE },
      receipts: verifiedTargetGateReceipts(),
    }),
    expectedReleaseEvidence: () => RELEASE_EVIDENCE,
    verifyReleaseEvidenceManifest: () => ({
      contract: 'wayland-release-evidence-attestation/1.0',
      candidate: { commit: COMMIT, tree: TREE },
      evidence: releaseEvidence(),
      manifestSha256: DIGEST('b'),
      signerWorkflow: 'FerroxLabs/wayland/.github/workflows/release-acceptance.yml',
      authority: 'github-attested-release-evidence',
    }),
    verifyReleaseClaimsManifest: () => ({
      contract: 'wayland-release-claims-attestation/1.0',
      candidate: { commit: COMMIT, tree: TREE },
      capabilities: Object.keys(CONDITIONAL).map((id) => ({ id, claimed: true, evidenceSha256: DIGEST('c') })),
      manifestSha256: DIGEST('d'),
      signerWorkflow: 'FerroxLabs/wayland/.github/workflows/release-acceptance.yml',
      authority: 'github-attested-release-claims',
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
    expectedPublisherAssets: () => CORE_ASSETS.map((asset) => ({ asset, sha256: DIGEST('5') })),
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
  it('exercises a complete authority-backed exact candidate without minting production acceptance', () => {
    const receipt = verifyFinalAcceptance(request(), verifiers());

    expect(receipt).toMatchObject({
      contract: 'wayland-final-acceptance-test-only/1.0',
      candidate: { commit: COMMIT, tree: TREE },
      accepted: false,
    });
    expect(receipt.targets).toHaveLength(6);
    expect(receipt.targetGates).toHaveLength(30);
    expect(receipt.capabilityReceipts).toHaveLength(5);
  });

  it('does not expose verifier injection through the production acceptance entry point', () => {
    expect(() =>
      (verifyProductionAcceptance as unknown as (input: unknown, injected: unknown) => unknown)(request(), verifiers())
    ).toThrow(/M8A_LIVE_CANDIDATE_INVALID|M8A_.*_AUTHORITY_UNAVAILABLE/);
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

  it('rejects a caller-selected candidate that is not the clean observed Git identity', () => {
    const input = request();
    input.candidate = { commit: 'f'.repeat(40), tree: TREE };

    expect(() => verifyFinalAcceptance(input, verifiers())).toThrow(/M8A_LIVE_CANDIDATE_INVALID.*stale-or-foreign/);
  });

  it('requires publisher attestations for the complete authoritative Core asset set', () => {
    const missing = request();
    missing.publisherArtifacts.pop();
    expect(() => verifyFinalAcceptance(missing, verifiers())).toThrow(/core-asset-coverage-mismatch/);

    const duplicate = request();
    duplicate.publisherArtifacts[5] = { ...duplicate.publisherArtifacts[0] };
    expect(() => verifyFinalAcceptance(duplicate, verifiers())).toThrow(/missing-duplicate-or-unknown-core-asset/);
  });

  it('binds every Core publisher artifact to the pinned release digest', () => {
    const hostile = verifiers();
    hostile.verifyPublisherArtifact = (raw: { assetName: string }) => ({
      ...verifiers().verifyPublisherArtifact(raw),
      sha256: DIGEST('f'),
    });

    expect(() => verifyFinalAcceptance(request(), hostile)).toThrow(/core-asset-digest-mismatch/);
  });

  it('requires every exact target and hardening-gate receipt', () => {
    const hostile = verifiers();
    const receipts = verifiedTargetGateReceipts().filter(
      (receipt) => receipt.receiptId !== 'M8-F:linux-x64:re-upgrade'
    );
    receipts.push({
      ...receipts[0],
      receiptId: 'M8-F:linux-x64:not-a-real-gate',
      gate: 'not-a-real-gate',
    });
    hostile.verifyTargetGateReceiptFiles = () => ({
      ...verifiers().verifyTargetGateReceiptFiles(),
      receipts,
    });

    expect(() => verifyFinalAcceptance(request(), hostile)).toThrow(/foreign-or-misbound:M8-F:linux-x64:re-upgrade/);
  });

  it('rejects a target gate receipt for a stale candidate', () => {
    const hostile = verifiers();
    const receipts = verifiedTargetGateReceipts();
    receipts[0].candidate = { commit: 'f'.repeat(40), tree: TREE };
    hostile.verifyTargetGateReceiptFiles = () => ({
      ...verifiers().verifyTargetGateReceiptFiles(),
      receipts,
    });

    expect(() => verifyFinalAcceptance(request(), hostile)).toThrow(/stale-or-foreign-candidate/);
  });

  it('requires exact evidence for every invariant, criterion, journey, and hardening gate', () => {
    const missing = verifiers();
    missing.verifyReleaseEvidenceManifest = () => ({
      ...verifiers().verifyReleaseEvidenceManifest(),
      evidence: releaseEvidence().slice(0, -1),
    });
    expect(() => verifyFinalAcceptance(request(), missing)).toThrow(/coverage-mismatch/);

    const misbound = verifiers();
    const foreign = releaseEvidence();
    foreign[0] = { ...foreign[0], id: 'INV-FOREIGN' };
    misbound.verifyReleaseEvidenceManifest = () => ({
      ...verifiers().verifyReleaseEvidenceManifest(),
      evidence: foreign,
    });
    expect(() => verifyFinalAcceptance(request(), misbound)).toThrow(/unknown-misbound-or-duplicate/);

    const duplicate = verifiers();
    const repeated = releaseEvidence();
    repeated[repeated.length - 1] = { ...repeated[0] };
    duplicate.verifyReleaseEvidenceManifest = () => ({
      ...verifiers().verifyReleaseEvidenceManifest(),
      evidence: repeated,
    });
    expect(() => verifyFinalAcceptance(request(), duplicate)).toThrow(/unknown-misbound-or-duplicate/);
  });

  it('fails closed when the release evidence manifest is unattested', () => {
    const hostile = verifiers();
    hostile.verifyReleaseEvidenceManifest = () => {
      throw new Error('Release acceptance manifest is unattested');
    };
    expect(() => verifyFinalAcceptance(request(), hostile)).toThrow(/manifest is unattested/);
  });

  it('rejects an excluded capability that remains in release or marketing claims', () => {
    const hostile = verifiers();
    hostile.verifyCapabilitySeal = () => ({
      ...verifiers().verifyCapabilitySeal(),
      capabilities: Object.keys(CONDITIONAL).map((id) => ({
        id,
        mode: id === 'voice' ? 'excluded' : 'included',
      })),
    });

    expect(() => verifyFinalAcceptance(request(), hostile)).toThrow(/excluded-capability-still-claimed:voice/);
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

  it('has one non-deploying package and GitHub callsite after evidence artifacts exist', () => {
    const packageDocument = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(packageDocument.scripts['verify:release-acceptance']).toBe(
      'node scripts/release-acceptance/verifyFinalAcceptance.js'
    );

    const workflow = readFileSync('.github/workflows/release-acceptance.yml', 'utf8');
    const download = workflow.indexOf('Download completed evidence artifacts');
    const gate = workflow.indexOf('bun run verify:release-acceptance');
    expect(download).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(download);
    expect(workflow).not.toMatch(/gh release edit|softprops\/action-gh-release|kubectl|fly deploy/i);
  });
});
