import fs from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { MATRIX_FILE, verifyHardeningMatrix } = require('../../../scripts/release-acceptance/verifyHardeningMatrix');

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

  it('rejects unknown critical fields at every authority boundary', () => {
    const top = matrix();
    top.acceptAnyway = true;
    expect(() => verifyHardeningMatrix(top)).toThrow(/unknown critical fields/);

    const nested = matrix();
    nested.capabilityConditional.mcp.acceptAnyway = true;
    expect(() => verifyHardeningMatrix(nested)).toThrow(/unknown critical fields/);
  });
});
