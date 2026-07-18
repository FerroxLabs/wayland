import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import receiptFixture from '../../../contracts/wayland-desktop-core/v1/events/anvil_receipt.json';
import {
  assertArtifactEnvelope,
  assertCitedText,
  assertEquivalentJ23State,
  assertTrustedArtifactReceipts,
  sha256File,
  type ArtifactEvidence,
} from './replayContract';

const artifact = (kind: 'docx' | 'pdf', digest: `sha256:${string}`): ArtifactEvidence => ({
  path: `/tmp/report.${kind}`,
  kind,
  bytes: 1024,
  digest,
  text: 'Northstar Outcome Brief LOCAL-001 WEB-001 Sources Limitations 71 percent to 84 percent 19 hours to 7 hours',
});

const acceptedEvidence = (event: unknown) => ({
  type: 'execution_evidence',
  content: {
    acceptedBy: 'desktop-core-v1-consumer',
    acceptedAt: 1_721_000_001_000,
    event:
      event && typeof event === 'object' && 'type' in event && event.type === 'anvil_receipt'
        ? { ...event, desktop_trust_status: 'active' }
        : event,
  },
});

function receiptBodyDigest(event: Record<string, unknown>): `sha256:${string}` {
  const body: Record<string, unknown> = {
    receipt_id: event.receipt_id,
    event_id: event.event_id,
    origin: event.origin,
    contract_version: event.contract_version,
    session_id: event.session_id,
    run_id: event.run_id,
    task_id: event.task_id,
    sequence: event.sequence,
    issued_at_unix_ms: event.issued_at_unix_ms,
    digest_algorithm: event.digest_algorithm,
    artifact_scope: event.artifact_scope,
    artifact_digest: event.artifact_digest,
    gate_closure_digest: event.gate_closure_digest,
    receipt_body_digest: '',
  };
  if (event.supersedes_receipt_id !== undefined) body.supersedes_receipt_id = event.supersedes_receipt_id;
  Object.assign(body, {
    terminal_state: event.terminal_state,
    stamp: event.stamp,
    checks_passed: event.checks_passed,
    checks_total: event.checks_total,
  });
  if (event.coverage !== undefined) body.coverage = event.coverage;
  Object.assign(body, {
    iterations: event.iterations,
    valve_fires: event.valve_fires,
    cost_microcents: event.cost_microcents,
    priced: event.priced,
    engine_version: event.engine_version,
  });
  return `sha256:${createHash('sha256')
    .update('wayland-core:anvil-receipt-body:v1\0')
    .update(JSON.stringify(body))
    .digest('hex')}`;
}

describe('M8 Cowork replay acceptance contract', () => {
  it('rejects the auditor forged DOM receipt contract reproduction', () => {
    const output = artifact('docx', `sha256:${'1'.repeat(64)}`);
    expect(() =>
      assertTrustedArtifactReceipts(
        [
          {
            status: 'verified',
            origin: 'core/anvil',
            contract: '1.0',
            artifactDigest: output.digest,
            gateClosureDigest: `sha256:${'2'.repeat(64)}`,
          },
        ],
        [output]
      )
    ).toThrow('M8_RECEIPT_AUTHORITY_MISSING');
  });

  it('accepts only pinned consumer evidence bound to the exact artifact digest and receipt body', () => {
    const output = artifact('pdf', receiptFixture.artifact_digest as `sha256:${string}`);
    const receipts = assertTrustedArtifactReceipts([acceptedEvidence(receiptFixture)], [output]);
    expect(receipts).toEqual([
      expect.objectContaining({
        receiptId: receiptFixture.receipt_id,
        status: 'active',
        acceptedBy: 'desktop-core-v1-consumer',
        contractVersion: '1.0',
        artifactDigest: output.digest,
        receiptBodyDigest: receiptFixture.receipt_body_digest,
      }),
    ]);
  });

  it('rejects an acceptedBy claim whose raw receipt body was forged', () => {
    const forged = { ...receiptFixture, artifact_digest: `sha256:${'9'.repeat(64)}` };
    const output = artifact('pdf', forged.artifact_digest as `sha256:${string}`);
    expect(() => assertTrustedArtifactReceipts([acceptedEvidence(forged)], [output])).toThrow();
  });

  it('rejects a raw receipt that lacks the live consumer active-trust stamp', () => {
    const output = artifact('pdf', receiptFixture.artifact_digest as `sha256:${string}`);
    expect(() =>
      assertTrustedArtifactReceipts(
        [
          {
            type: 'execution_evidence',
            content: {
              acceptedBy: 'desktop-core-v1-consumer',
              acceptedAt: 1_721_000_001_000,
              event: receiptFixture,
            },
          },
        ],
        [output]
      )
    ).toThrow(`M8_RECEIPT_TERMINAL_AUTHORITY_INVALID:${receiptFixture.receipt_id}`);
  });

  it('rejects a receipt invalidated later in the canonical Core stream', () => {
    const events = fs
      .readFileSync(
        path.resolve('contracts/wayland-desktop-core/v1/adversarial/anvil/valid-invalidation.jsonl'),
        'utf8'
      )
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    const output = artifact('docx', receiptFixture.artifact_digest as `sha256:${string}`);
    expect(() => assertTrustedArtifactReceipts(events.map(acceptedEvidence), [output])).toThrow(
      'M8_RECEIPT_AUTHORITY_MISSING'
    );
  });

  it('rejects a receipt superseded by a later active publication', () => {
    const successor = {
      ...receiptFixture,
      receipt_id: 'receipt-desktop-002',
      event_id: 'anvil-event-001',
      sequence: 1,
      issued_at_unix_ms: 1_721_000_002_000,
      artifact_digest: `sha256:${'d'.repeat(64)}`,
      gate_closure_digest: `sha256:${'e'.repeat(64)}`,
      supersedes_receipt_id: receiptFixture.receipt_id,
      receipt_body_digest: '',
    } satisfies Record<string, unknown>;
    successor.receipt_body_digest = receiptBodyDigest(successor);
    const oldOutput = artifact('pdf', receiptFixture.artifact_digest as `sha256:${string}`);
    expect(() =>
      assertTrustedArtifactReceipts([acceptedEvidence(receiptFixture), acceptedEvidence(successor)], [oldOutput])
    ).toThrow('M8_RECEIPT_AUTHORITY_MISSING');
  });

  it('rejects publication-bound trust after a Desktop-accepted disconnect or workspace mutation', () => {
    const output = artifact('pdf', receiptFixture.artifact_digest as `sha256:${string}`);
    expect(() =>
      assertTrustedArtifactReceipts(
        [
          acceptedEvidence(receiptFixture),
          acceptedEvidence({
            type: 'anvil_trust_changed',
            receipt_ids: [receiptFixture.receipt_id],
            status: 'historical',
            reason: 'disconnected',
            requires_fresh_core_validation: true,
          }),
        ],
        [output]
      )
    ).toThrow('M8_RECEIPT_AUTHORITY_MISSING');
  });

  it('fails closed on malformed or partial publication-revocation evidence', () => {
    const output = artifact('pdf', receiptFixture.artifact_digest as `sha256:${string}`);
    expect(() =>
      assertTrustedArtifactReceipts(
        [
          acceptedEvidence(receiptFixture),
          acceptedEvidence({
            type: 'anvil_trust_changed',
            receipt_ids: [],
            status: 'historical',
            reason: 'disconnected',
            requires_fresh_core_validation: true,
          }),
        ],
        [output]
      )
    ).toThrow('M8_RECEIPT_PUBLICATION_REVOCATION_INVALID');
    expect(() =>
      assertTrustedArtifactReceipts(
        [
          acceptedEvidence(receiptFixture),
          acceptedEvidence({
            type: 'anvil_trust_changed',
            receipt_ids: [receiptFixture.receipt_id, 'candidate-minted-receipt'],
            status: 'historical',
            reason: 'workspace_mutated',
            requires_fresh_core_validation: true,
          }),
        ],
        [output]
      )
    ).toThrow('M8_RECEIPT_PUBLICATION_REVOCATION_MISMATCH');
  });

  it('rejects malformed or unsupported-version raw Core evidence', () => {
    const malformed = { ...receiptFixture, receipt_id: '' };
    expect(() =>
      assertTrustedArtifactReceipts(
        [acceptedEvidence(malformed)],
        [artifact('pdf', receiptFixture.artifact_digest as `sha256:${string}`)]
      )
    ).toThrow();
    expect(() =>
      assertTrustedArtifactReceipts(
        [acceptedEvidence({ ...receiptFixture, contract_version: '2.0' })],
        [artifact('pdf', receiptFixture.artifact_digest as `sha256:${string}`)]
      )
    ).toThrow();
  });

  it('requires the cited facts, source IDs, Sources, and Limitations in native output text', () => {
    expect(() => assertCitedText('LOCAL-001 only', ['LOCAL-001', 'WEB-001', 'Limitations'])).toThrow(
      'M8_CITATION_OR_CONTENT_MISSING:WEB-001'
    );
  });

  it('requires both native formats on both J23 entry paths', () => {
    const docx = artifact('docx', `sha256:${'5'.repeat(64)}`);
    const pdf = artifact('pdf', `sha256:${'6'.repeat(64)}`);
    expect(() => assertEquivalentJ23State([docx, pdf], [docx, pdf], ['LOCAL-001', 'WEB-001'])).not.toThrow();
    expect(() => assertEquivalentJ23State([docx], [docx, pdf], ['LOCAL-001'])).toThrow(
      'M8_J23_NATIVE_OUTPUT_PAIR_INCOMPLETE'
    );
  });

  it('rejects files whose extension disguises a non-native payload', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'm8-artifact-envelope-'));
    try {
      const fakePdf = path.join(dir, 'report.pdf');
      fs.writeFileSync(fakePdf, Buffer.alloc(512, 0x41));
      expect(() => assertArtifactEnvelope(fakePdf, 'pdf')).toThrow('M8_PDF_HEADER_INVALID');
      expect(sha256File(fakePdf)).toMatch(/^sha256:[a-f0-9]{64}$/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
