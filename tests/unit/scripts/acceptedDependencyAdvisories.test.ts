import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const { ACCEPTED_PATH, verifySevereDependencyAudit } =
  require('../../../scripts/release-acceptance/verifySevereDependencyAudit') as {
    ACCEPTED_PATH: string;
    verifySevereDependencyAudit: (
      file: string,
      now?: Date
    ) => {
      contract: string;
      critical: number;
      high: number;
      accepted?: { reviewedUntil: string; critical: number; high: number; advisories: unknown[] };
    };
  };

const roots: string[] = [];
afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

function auditFile(report: unknown): string {
  const root = mkdtempSync(join(tmpdir(), 'wayland-accepted-advisories-'));
  roots.push(root);
  const file = join(root, 'audit.json');
  writeFileSync(file, JSON.stringify(report));
  return file;
}

const acceptance = JSON.parse(readFileSync(ACCEPTED_PATH, 'utf8')) as {
  contract: string;
  reviewedUntil: string;
  accepted: { package: string; id: number; severity: string }[];
};

// The list is release evidence, not a convenience. If it stops being reviewable
// the gate it feeds stops meaning anything.
describe('accepted dependency advisories', () => {
  const withinReview = new Date(`${acceptance.reviewedUntil}T00:00:00Z`);

  it('declares a contract, a review deadline and well-formed entries', () => {
    expect(acceptance.contract).toBe('wayland-accepted-dependency-advisories/1.0');
    expect(acceptance.reviewedUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(acceptance.accepted.length).toBeGreaterThan(0);
    for (const entry of acceptance.accepted) {
      expect(typeof entry.package).toBe('string');
      expect(Number.isInteger(entry.id)).toBe(true);
      expect(['critical', 'high']).toContain(entry.severity);
    }
    const keys = acceptance.accepted.map((entry) => `${entry.package} ${entry.id}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('clears an accepted advisory and records the waiver in the receipt', () => {
    const [first] = acceptance.accepted;
    const receipt = verifySevereDependencyAudit(
      auditFile({ [first.package]: [{ id: first.id, severity: first.severity }] }),
      withinReview
    );
    expect(receipt.contract).toBe('wayland-severe-dependency-clearance/1.1');
    expect(receipt.accepted?.advisories).toEqual([
      { dependency: first.package, id: first.id, severity: first.severity },
    ]);
  });

  it('still refuses an advisory that is not on the list', () => {
    expect(() =>
      verifySevereDependencyAudit(auditFile({ 'not-listed': [{ id: 424242, severity: 'high' }] }), withinReview)
    ).toThrow(/M8I_SEVERE_DEPENDENCY_FINDINGS/);
  });

  it('refuses an accepted advisory id reported against a different package', () => {
    const [first] = acceptance.accepted;
    expect(() =>
      verifySevereDependencyAudit(
        auditFile({ 'some-other-package': [{ id: first.id, severity: 'high' }] }),
        withinReview
      )
    ).toThrow(/M8I_SEVERE_DEPENDENCY_FINDINGS/);
  });

  it('refuses an accepted advisory that has since been raised to critical', () => {
    const high = acceptance.accepted.find((entry) => entry.severity === 'high');
    expect(high).toBeDefined();
    expect(() =>
      verifySevereDependencyAudit(
        auditFile({ [high!.package]: [{ id: high!.id, severity: 'critical' }] }),
        withinReview
      )
    ).toThrow(/M8I_SEVERE_DEPENDENCY_FINDINGS/);
  });

  it('closes the gate again once the review deadline passes', () => {
    const [first] = acceptance.accepted;
    const expired = new Date(`${acceptance.reviewedUntil}T00:00:00Z`);
    expired.setUTCDate(expired.getUTCDate() + 1);
    expect(() =>
      verifySevereDependencyAudit(auditFile({ [first.package]: [{ id: first.id, severity: first.severity }] }), expired)
    ).toThrow(/M8I_DEPENDENCY_ACCEPTANCE_EXPIRED/);
  });

  it('does not consult the acceptance list at all when the tree is clean', () => {
    const expired = new Date('2099-01-01T00:00:00Z');
    expect(verifySevereDependencyAudit(auditFile({ fine: [{ severity: 'moderate' }] }), expired)).toEqual({
      contract: 'wayland-severe-dependency-clearance/1.0',
      critical: 0,
      high: 0,
    });
  });
});
