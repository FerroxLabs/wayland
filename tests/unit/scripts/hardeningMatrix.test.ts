import fs from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  MATRIX_FILE,
  TARGETS,
  TARGET_GATE_RECEIPT_SCHEMA,
  TARGET_GATE_RECEIPTS,
  TARGET_PROOF_GATES,
  verifyHardeningMatrix,
} = require('../../../scripts/release-acceptance/verifyHardeningMatrix');

function matrix() {
  return JSON.parse(fs.readFileSync(MATRIX_FILE, 'utf8'));
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
      targetGateReceipts: TARGET_GATE_RECEIPTS,
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
  )('rejects a missing target gate receipt for %s', (_label, target, gate) => {
    const candidate = matrix();
    candidate.requiredTargetGateReceipts = candidate.requiredTargetGateReceipts.filter(
      (receipt: { target: string; gate: string }) => receipt.target !== target || receipt.gate !== gate
    );
    expect(() => verifyHardeningMatrix(candidate)).toThrow(/target gate receipt coverage or ordering mismatch/);
  });

  it('rejects duplicate receipt IDs and target-misbound receipts', () => {
    const duplicate = matrix();
    duplicate.requiredTargetGateReceipts[1].receiptId = duplicate.requiredTargetGateReceipts[0].receiptId;
    expect(() => verifyHardeningMatrix(duplicate)).toThrow(/receipt ID duplicated/);

    const misbound = matrix();
    misbound.requiredTargetGateReceipts[0].target = 'linux-x64';
    expect(() => verifyHardeningMatrix(misbound)).toThrow(/coverage or ordering mismatch/);
  });

  it('rejects reordered target gates and a foreign receipt contract', () => {
    const reordered = matrix();
    [reordered.requiredTargetGateReceipts[0], reordered.requiredTargetGateReceipts[1]] = [
      reordered.requiredTargetGateReceipts[1],
      reordered.requiredTargetGateReceipts[0],
    ];
    expect(() => verifyHardeningMatrix(reordered)).toThrow(/coverage or ordering mismatch/);

    const foreign = matrix();
    foreign.requiredTargetGateReceipts[0].contract = 'caller-authored-proof/1.0';
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
    receipt.requiredTargetGateReceipts[0].acceptAnyway = true;
    expect(() => verifyHardeningMatrix(receipt)).toThrow(/unknown critical fields/);

    const schema = matrix();
    schema.targetGateReceiptSchema.acceptAnyway = true;
    expect(() => verifyHardeningMatrix(schema)).toThrow(/unknown critical fields/);
  });
});
