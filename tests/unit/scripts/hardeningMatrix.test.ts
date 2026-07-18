import fs from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  MATRIX_FILE,
  TARGETS,
  TARGET_GATE_REQUIREMENTS,
  TARGET_GATE_RECEIPT_SCHEMA,
  TARGET_PROOF_GATES,
  validateTargetGateReceiptSet,
  verifyHardeningMatrix,
} = require('../../../scripts/release-acceptance/verifyHardeningMatrix');

const COMMIT = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
const CANDIDATE = Object.freeze({ commit: COMMIT, tree: TREE });
const DIGEST = `sha256:${'c'.repeat(64)}`;

function matrix() {
  return JSON.parse(fs.readFileSync(MATRIX_FILE, 'utf8'));
}

function targetGateReceipts() {
  return TARGET_GATE_REQUIREMENTS.map((requirement: Record<string, string>) => ({
    ...requirement,
    candidate: { ...CANDIDATE },
    authority: TARGET_GATE_RECEIPT_SCHEMA.authority,
    evidenceSha256: DIGEST,
  }));
}

describe('M8 release hardening matrix', () => {
  it('pins every invariant, success criterion, mandatory journey, target and hardening gate', () => {
    expect(verifyHardeningMatrix()).toEqual({
      contract: 'wayland-release-hardening-matrix/1.0',
      invariants: 21,
      criteria: 31,
      journeys: 24,
      targets: 6,
      gates: 15,
      targetProofGates: 5,
      targetGateReceiptSchema: TARGET_GATE_RECEIPT_SCHEMA,
      targetGateRequirements: TARGET_GATE_REQUIREMENTS,
      conditionalCapabilities: 5,
    });
  });

  it.each([
    ['requiredInvariants', 'INV-21'],
    ['requiredCriteria', 'SC-21'],
    ['requiredJourneys', 'J25'],
    ['supportedTargets', 'linux-x64'],
    ['requiredHardeningGates', 'updater'],
  ])('rejects missing %s coverage', (field, member) => {
    const candidate = matrix();
    candidate[field] = candidate[field].filter((entry: string) => entry !== member);
    expect(() => verifyHardeningMatrix(candidate)).toThrow(/coverage or ordering mismatch/);
  });

  it('rejects unknown, duplicate and reordered coverage', () => {
    const unknown = matrix();
    unknown.requiredInvariants.push('INV-22');
    expect(() => verifyHardeningMatrix(unknown)).toThrow(/coverage or ordering mismatch/);

    const duplicate = matrix();
    duplicate.requiredCriteria.splice(1, 0, duplicate.requiredCriteria[0]);
    expect(() => verifyHardeningMatrix(duplicate)).toThrow(/coverage or ordering mismatch|duplicates/);

    const reordered = matrix();
    reordered.supportedTargets.reverse();
    expect(() => verifyHardeningMatrix(reordered)).toThrow(/coverage or ordering mismatch/);
  });

  it('keeps follow-on Cloud journey J22 outside first-preview acceptance', () => {
    const candidate = matrix();
    expect(candidate.requiredJourneys).not.toContain('J22');
    candidate.requiredJourneys.splice(21, 0, 'J22');
    expect(() => verifyHardeningMatrix(candidate)).toThrow(/coverage or ordering mismatch/);
  });

  it('rejects weakened capability-conditional gates and receipts', () => {
    for (const capability of Object.keys(matrix().capabilityConditional)) {
      const candidate = matrix();
      const gate = candidate.capabilityConditional[capability];
      const field = gate.receipts.length ? 'receipts' : gate.journeys.length ? 'journeys' : 'criteria';
      gate[field].pop();
      expect(() => verifyHardeningMatrix(candidate)).toThrow(/coverage or ordering mismatch/);
    }
  });

  it('requires the final C0 release-closure receipt without replacing C0-B or C1', () => {
    const candidate = matrix();
    expect(candidate.capabilityConditional['cowork-office'].receipts).toEqual(['C0-B', 'C1', 'C0-RELEASE-CLOSURE']);

    candidate.capabilityConditional['cowork-office'].receipts = ['C0-B', 'C1'];
    expect(() => verifyHardeningMatrix(candidate)).toThrow(
      /cowork-office conditional receipts coverage or ordering mismatch/
    );
  });

  it.each(
    TARGETS.flatMap((target: string) =>
      TARGET_PROOF_GATES.map((gate: string) => [`${target}/${gate}`, target, gate] as const)
    )
  )('rejects a missing target gate requirement and actual receipt for %s', (_label, target, gate) => {
    const candidateMatrix = matrix();
    candidateMatrix.targetGateRequirements = candidateMatrix.targetGateRequirements.filter(
      (requirement: { target: string; gate: string }) => requirement.target !== target || requirement.gate !== gate
    );
    expect(() => verifyHardeningMatrix(candidateMatrix)).toThrow(
      /target gate requirement coverage or ordering mismatch/
    );

    const receipts = targetGateReceipts().filter(
      (receipt: { target: string; gate: string }) => receipt.target !== target || receipt.gate !== gate
    );
    expect(() => validateTargetGateReceiptSet(receipts, CANDIDATE)).toThrow(
      /target gate receipt coverage or ordering mismatch/
    );
  });

  it('rejects duplicate requirement IDs and target-misbound requirements', () => {
    const duplicate = matrix();
    duplicate.targetGateRequirements[1].receiptId = duplicate.targetGateRequirements[0].receiptId;
    expect(() => verifyHardeningMatrix(duplicate)).toThrow(/requirement receipt ID duplicated/);

    const misbound = matrix();
    misbound.targetGateRequirements[0].target = 'linux-x64';
    expect(() => verifyHardeningMatrix(misbound)).toThrow(/coverage or ordering mismatch/);
  });

  it('rejects reordered target gates and a foreign receipt contract', () => {
    const reordered = matrix();
    [reordered.targetGateRequirements[0], reordered.targetGateRequirements[1]] = [
      reordered.targetGateRequirements[1],
      reordered.targetGateRequirements[0],
    ];
    expect(() => verifyHardeningMatrix(reordered)).toThrow(/coverage or ordering mismatch/);

    const foreign = matrix();
    foreign.targetGateRequirements[0].contract = 'caller-authored-proof/1.0';
    expect(() => verifyHardeningMatrix(foreign)).toThrow(/coverage or ordering mismatch/);
  });

  it('pins the M8-A target-gate receipt schema and authority', () => {
    const missingCandidateBinding = matrix();
    missingCandidateBinding.targetGateReceiptSchema.requiredFields =
      missingCandidateBinding.targetGateReceiptSchema.requiredFields.filter((field: string) => field !== 'candidate');
    expect(() => verifyHardeningMatrix(missingCandidateBinding)).toThrow(/schema fields coverage or ordering mismatch/);

    const callerAuthority = matrix();
    callerAuthority.targetGateReceiptSchema.authority = 'caller-authored-acceptance';
    expect(() => verifyHardeningMatrix(callerAuthority)).toThrow(/schema authority or contract mismatch/);
  });

  it('rejects unknown critical fields at every authority boundary', () => {
    const top = matrix();
    top.acceptAnyway = true;
    expect(() => verifyHardeningMatrix(top)).toThrow(/unknown critical fields/);

    const nested = matrix();
    nested.capabilityConditional.mcp.acceptAnyway = true;
    expect(() => verifyHardeningMatrix(nested)).toThrow(/unknown critical fields/);

    const receipt = matrix();
    receipt.targetGateRequirements[0].acceptAnyway = true;
    expect(() => verifyHardeningMatrix(receipt)).toThrow(/unknown critical fields/);

    const schema = matrix();
    schema.targetGateReceiptSchema.acceptAnyway = true;
    expect(() => verifyHardeningMatrix(schema)).toThrow(/unknown critical fields/);
  });

  it('accepts the exact canonical candidate-bound target gate receipt set', () => {
    expect(validateTargetGateReceiptSet(targetGateReceipts(), CANDIDATE)).toEqual(targetGateReceipts());
  });

  it('rejects stale commit or tree bindings', () => {
    const staleCommit = targetGateReceipts();
    staleCommit[0].candidate.commit = 'd'.repeat(40);
    expect(() => validateTargetGateReceiptSet(staleCommit, CANDIDATE)).toThrow(/stale or foreign candidate/);

    const staleTree = targetGateReceipts();
    staleTree[0].candidate.tree = 'e'.repeat(40);
    expect(() => validateTargetGateReceiptSet(staleTree, CANDIDATE)).toThrow(/stale or foreign candidate/);
  });

  it('rejects malformed candidate identity, wrong authority, and bad evidence digest', () => {
    expect(() => validateTargetGateReceiptSet(targetGateReceipts(), { commit: 'not-a-commit', tree: TREE })).toThrow(
      /commit or tree is malformed/
    );

    const malformedReceiptCandidate = targetGateReceipts();
    malformedReceiptCandidate[0].candidate.commit = 'not-a-commit';
    expect(() => validateTargetGateReceiptSet(malformedReceiptCandidate, CANDIDATE)).toThrow(
      /commit or tree is malformed/
    );

    const wrongAuthority = targetGateReceipts();
    wrongAuthority[0].authority = 'caller-authored-acceptance';
    expect(() => validateTargetGateReceiptSet(wrongAuthority, CANDIDATE)).toThrow(/authority mismatch/);

    const badDigest = targetGateReceipts();
    badDigest[0].evidenceSha256 = `sha256:${'z'.repeat(64)}`;
    expect(() => validateTargetGateReceiptSet(badDigest, CANDIDATE)).toThrow(/evidence digest invalid/);
  });

  it('rejects duplicate, unknown, foreign, and target-misbound actual receipts', () => {
    const duplicate = targetGateReceipts();
    duplicate[1].receiptId = duplicate[0].receiptId;
    expect(() => validateTargetGateReceiptSet(duplicate, CANDIDATE)).toThrow(/receipt ID duplicated/);

    const unknown = targetGateReceipts();
    unknown[0].receiptId = 'M8-F:unknown-target:install';
    expect(() => validateTargetGateReceiptSet(unknown, CANDIDATE)).toThrow(/foreign or misbound/);

    const foreign = targetGateReceipts();
    foreign[0].contract = 'caller-authored-proof/1.0';
    expect(() => validateTargetGateReceiptSet(foreign, CANDIDATE)).toThrow(/foreign or misbound/);

    const misbound = targetGateReceipts();
    misbound[0].target = 'linux-x64';
    expect(() => validateTargetGateReceiptSet(misbound, CANDIDATE)).toThrow(/foreign or misbound/);

    const reordered = targetGateReceipts();
    [reordered[0], reordered[1]] = [reordered[1], reordered[0]];
    expect(() => validateTargetGateReceiptSet(reordered, CANDIDATE)).toThrow(/foreign or misbound/);
  });

  it('rejects unknown critical fields in actual receipts and candidate identities', () => {
    const receipt = targetGateReceipts();
    receipt[0].acceptAnyway = true;
    expect(() => validateTargetGateReceiptSet(receipt, CANDIDATE)).toThrow(/unknown critical fields/);

    const candidate = { ...CANDIDATE, acceptAnyway: true };
    expect(() => validateTargetGateReceiptSet(targetGateReceipts(), candidate)).toThrow(/unknown critical fields/);
  });
});
