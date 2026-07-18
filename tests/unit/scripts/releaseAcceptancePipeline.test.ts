import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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
const { produceConditionalCapabilityReceipts } =
  require('../../../scripts/release-acceptance/produceProtectedAcceptanceEvidence') as {
    produceConditionalCapabilityReceipts: (
      rawRoot: string,
      output: string,
      candidate: { commit: string; tree: string },
      seal: Record<string, any>,
      gates: Map<string, { logSha256: string }>
    ) => void;
  };

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('protected release acceptance pipeline', () => {
  it('mints conditional capability receipts only inside protected evidence production', () => {
    const root = mkdtempSync(join(tmpdir(), 'wayland-protected-capability-'));
    roots.push(root);
    const raw = join(root, 'raw');
    const output = join(root, 'output');
    mkdirSync(join(raw, 'capability-receipts'), { recursive: true });
    mkdirSync(output);
    const digest = (value: string) => `sha256:${createHash('sha256').update(value).digest('hex')}`;
    const candidate = { commit: 'a'.repeat(40), tree: 'b'.repeat(40) };
    const logBytes = 'protected cowork proof output\n';
    writeFileSync(join(raw, 'capability-receipts/cowork-office.proof.log'), logBytes);
    const proofBytes = `${JSON.stringify({ contract: 'wayland-capability-proof/1.0' })}\n`;
    writeFileSync(join(raw, 'capability-receipts/cowork-office.proof.json'), proofBytes);
    const receipt = { capabilityId: 'cowork-office', packets: ['C0-B', 'C1'] };
    const receiptBytes = `${JSON.stringify(receipt)}\n`;
    writeFileSync(join(raw, 'capability-receipts/cowork-office.json'), receiptBytes);
    const receiptSha256 = digest(receiptBytes);
    const proofSha256 = digest(proofBytes);
    const logSha256 = digest(logBytes);
    writeFileSync(
      join(raw, 'capability-receipts/manifest.json'),
      `${JSON.stringify({
        contract: 'wayland-capability-acceptance-manifest/2.0',
        candidate,
        selectionSha256: digest('selection'),
        receipts: [
          {
            capabilityId: 'cowork-office',
            receiptFile: 'cowork-office.json',
            receiptSha256,
            proofFile: 'cowork-office.proof.json',
            proofSha256,
            logFile: 'cowork-office.proof.log',
            logSha256,
          },
        ],
      })}\n`
    );
    produceConditionalCapabilityReceipts(
      raw,
      output,
      candidate,
      {
        capabilities: [
          { id: 'cowork-office', mode: 'included', receiptSha256, sourceSha256: digest('cowork-source') },
          ...['voice', 'mcp', 'sandbox', 'flux'].map((id) => ({ id, mode: 'excluded' })),
        ],
      },
      new Map([
        ['tests', { logSha256: digest('tests') }],
        ['build', { logSha256: digest('build') }],
      ])
    );
    const protectedReceipt = JSON.parse(
      readFileSync(join(output, 'conditional/capability-release-acceptance-cowork-office.json'), 'utf8')
    );
    expect(protectedReceipt.receiptIds).toEqual(['C0-B', 'C1', 'C0-RELEASE-CLOSURE']);
    expect(new Set(protectedReceipt.receiptDigests).size).toBe(3);
    expect(protectedReceipt.authority).toBe('canonical-capability-acceptance-validator');
  });

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
