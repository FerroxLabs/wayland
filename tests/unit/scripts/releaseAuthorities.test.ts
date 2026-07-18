import crypto from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const { SIGNER_WORKFLOW, verifyConditionalCapability, verifyFindingsClearance, verifyReleaseBlockers } =
  require('../../../scripts/release-acceptance/verifyReleaseAuthorities') as {
    SIGNER_WORKFLOW: string;
    verifyConditionalCapability: (input: unknown, context: unknown, options?: unknown) => Record<string, unknown>;
    verifyFindingsClearance: (input: unknown, context: unknown, options?: unknown) => Record<string, unknown>;
    verifyReleaseBlockers: (input: unknown, context: unknown, options?: unknown) => Record<string, unknown>;
  };

const candidate = { commit: 'a'.repeat(40), tree: 'b'.repeat(40) };
const roots: string[] = [];
const digest = (character: string) => `sha256:${character.repeat(64)}`;

function receipt(name: string, value: unknown): string {
  const root = mkdtempSync(join(tmpdir(), 'wayland-release-authority-'));
  roots.push(root);
  const file = join(root, name);
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function attestation(file: string, capture?: (args: string[]) => void) {
  return {
    execFileSyncImpl: (_command: string, args: string[]) => {
      capture?.(args);
      const sha256 = crypto.createHash('sha256').update(readFileSync(file)).digest('hex');
      return JSON.stringify([
        {
          verificationResult: {
            statement: {
              predicateType: 'https://slsa.dev/provenance/v1',
              subject: [{ digest: { sha256 } }],
            },
          },
        },
      ]);
    },
  };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('release acceptance file authorities', () => {
  it('accepts an exact attested conditional capability receipt', () => {
    const file = receipt('mcp.json', {
      contract: 'wayland-capability-release-acceptance/1.0',
      candidate,
      capabilityId: 'mcp',
      receiptIds: ['M1M', 'MCP-4'],
      receiptDigests: [digest('1'), digest('2')],
      authority: 'canonical-capability-acceptance-validator',
    });
    let commandArgs: string[] = [];

    expect(
      verifyConditionalCapability(
        { capabilityId: 'mcp', receiptPath: file },
        { candidate, capabilityId: 'mcp', expectedReceiptIds: ['M1M', 'MCP-4'] },
        attestation(file, (args) => (commandArgs = args))
      )
    ).toMatchObject({ capabilityId: 'mcp', candidate });
    expect(commandArgs).toContain(SIGNER_WORKFLOW);
    expect(commandArgs).toContain(candidate.commit);
    expect(commandArgs).toContain('--deny-self-hosted-runners');
  });

  it('rejects a signature that does not bind the exact receipt bytes', () => {
    const file = receipt('voice.json', {
      contract: 'wayland-capability-release-acceptance/1.0',
      candidate,
      capabilityId: 'voice',
      receiptIds: ['M5V-A', 'M5V-B'],
      receiptDigests: [digest('1'), digest('2')],
      authority: 'canonical-capability-acceptance-validator',
    });

    expect(() =>
      verifyConditionalCapability(
        { capabilityId: 'voice', receiptPath: file },
        { candidate, capabilityId: 'voice', expectedReceiptIds: ['M5V-A', 'M5V-B'] },
        {
          execFileSyncImpl: () =>
            JSON.stringify([
              {
                verificationResult: {
                  statement: {
                    predicateType: 'https://slsa.dev/provenance/v1',
                    subject: [{ digest: { sha256: 'f'.repeat(64) } }],
                  },
                },
              },
            ]),
        }
      )
    ).toThrow(/does not bind exact receipt bytes/);
  });

  it('rejects duplicated proof digests and stale candidates', () => {
    const file = receipt('mcp.json', {
      contract: 'wayland-capability-release-acceptance/1.0',
      candidate: { ...candidate, tree: 'c'.repeat(40) },
      capabilityId: 'mcp',
      receiptIds: ['M1M', 'MCP-4'],
      receiptDigests: [digest('1'), digest('1')],
      authority: 'canonical-capability-acceptance-validator',
    });

    expect(() =>
      verifyConditionalCapability(
        { capabilityId: 'mcp', receiptPath: file },
        { candidate, capabilityId: 'mcp', expectedReceiptIds: ['M1M', 'MCP-4'] },
        attestation(file)
      )
    ).toThrow(/stale or foreign candidate/);
  });

  it('accepts zeroed critical/high and release-blocker clearances', () => {
    const findings = receipt('findings.json', {
      contract: 'wayland-release-findings-clearance/1.0',
      candidate,
      unresolved: { blocker: 0, critical: 0, high: 0 },
      authority: 'canonical-release-tracker',
      evidenceSha256: digest('3'),
    });
    const blockers = receipt('blockers.json', {
      contract: 'wayland-release-blocker-clearance/1.0',
      candidate,
      unresolved: { p0: 0, p1: 0 },
      authority: 'canonical-release-tracker',
      evidenceSha256: digest('4'),
    });

    expect(verifyFindingsClearance({ receiptPath: findings }, { candidate }, attestation(findings))).toMatchObject({
      unresolved: { blocker: 0, critical: 0, high: 0 },
    });
    expect(verifyReleaseBlockers({ receiptPath: blockers }, { candidate }, attestation(blockers))).toMatchObject({
      unresolved: { p0: 0, p1: 0 },
    });
  });

  it('fails closed on unresolved findings and symlinked receipts', () => {
    const file = receipt('findings.json', {
      contract: 'wayland-release-findings-clearance/1.0',
      candidate,
      unresolved: { blocker: 0, critical: 0, high: 1 },
      authority: 'canonical-release-tracker',
      evidenceSha256: digest('5'),
    });
    expect(() => verifyFindingsClearance({ receiptPath: file }, { candidate }, attestation(file))).toThrow(
      /unresolved high/
    );

    const link = `${file}.link`;
    symlinkSync(file, link);
    expect(() => verifyFindingsClearance({ receiptPath: link }, { candidate }, attestation(link))).toThrow(
      /not a regular file/
    );
  });
});
