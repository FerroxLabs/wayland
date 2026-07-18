import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const { regularFile } = require('../../../scripts/release-acceptance/acceptanceBundle') as {
  regularFile: (root: string, relative: string, code: string) => { bytes: Buffer };
};
const { verifySevereDependencyAudit } = require('../../../scripts/release-acceptance/verifySevereDependencyAudit') as {
  verifySevereDependencyAudit: (file: string) => {
    contract: string;
    critical: number;
    high: number;
  };
};
const { REQUIRED_GATES } = require('../../../scripts/release-acceptance/produceProtectedAcceptanceEvidence') as {
  REQUIRED_GATES: Record<string, string>;
};

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('protected release acceptance pipeline', () => {
  it('keeps final acceptance authority outside the candidate workflow', () => {
    const dispatcher = readFileSync('.github/workflows/release-acceptance.yml', 'utf8');
    const trustRoot = readFileSync('.github/workflows/release-acceptance-trust-root.yml', 'utf8');
    const release = readFileSync('.github/workflows/build-and-release.yml', 'utf8');

    expect(dispatcher).not.toContain('actions/attest-build-provenance');
    expect(dispatcher).not.toContain('id-token: write');
    expect(dispatcher).toContain('--ref release-trust-v1');
    expect(trustRoot).toContain('refs/heads/release-trust-v1');
    expect(trustRoot).toContain('WAYLAND_RELEASE_TRUST_ROOT_SHA');
    expect(trustRoot).toContain('path: trust-root');
    expect(trustRoot).toContain('path: candidate');
    expect(trustRoot).toContain('trust-root/scripts/release-acceptance/verifyFinalAcceptance.js');
    expect(trustRoot).toContain('produceProtectedAcceptanceEvidence.js');
    expect(trustRoot).toContain('collectRawAcceptanceEvidence.js');
    expect(release).toContain('assemble-raw-release-acceptance:');
    expect(release).toContain('final-release-acceptance:');
    expect(release).toContain('needs: [release-smoke-gate, release-smoke-gate-windows, final-release-acceptance]');
    expect(release).toContain("needs.final-release-acceptance.result == 'success'");
  });

  it('binds the protected proof plan to the complete required gate set', () => {
    expect(REQUIRED_GATES).toEqual({
      tests: 'bun run test',
      typecheck: 'bunx tsc --noEmit',
      lint: 'bun run lint',
      build: 'bun run build:renderer:web',
      'dependency-security':
        'node ../trust-root/scripts/release-acceptance/verifySevereDependencyAudit.js dependency-audit.json',
    });
  });

  it('fails dependency acceptance on critical or high findings and ignores lower severities', () => {
    const root = mkdtempSync(join(tmpdir(), 'wayland-dependency-audit-'));
    roots.push(root);
    const report = join(root, 'audit.json');
    writeFileSync(report, JSON.stringify({ bad: [{ severity: 'high' }], low: [{ severity: 'low' }] }));
    expect(() => verifySevereDependencyAudit(report)).toThrow(/M8I_SEVERE_DEPENDENCY_FINDINGS/);
    writeFileSync(report, JSON.stringify({ bad: [{ severity: 'critical' }] }));
    expect(() => verifySevereDependencyAudit(report)).toThrow(/M8I_SEVERE_DEPENDENCY_FINDINGS/);
    writeFileSync(report, JSON.stringify({ okay: [{ severity: 'moderate' }, { severity: 'low' }] }));
    expect(verifySevereDependencyAudit(report)).toEqual({
      contract: 'wayland-severe-dependency-clearance/1.0',
      critical: 0,
      high: 0,
    });
  });

  it('rejects symlink evidence instead of following it', () => {
    const root = mkdtempSync(join(tmpdir(), 'wayland-release-evidence-'));
    roots.push(root);
    writeFileSync(join(root, 'real.json'), '{}');
    symlinkSync(join(root, 'real.json'), join(root, 'link.json'));
    expect(() => regularFile(root, 'link.json', 'M8I_TEST')).toThrow(/M8I_TEST:not-regular-file/);
  });
});
