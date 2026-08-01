import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readyEvent from '../../../contracts/wayland-desktop-core/v1/events/ready.json';
import { DesktopCoreV1Consumer } from '../../../src/process/agent/wcore/desktopContractV1';
import { OfficeParser } from 'officeparser';

export type ArtifactEvidence = Readonly<{
  path: string;
  kind: 'docx' | 'pdf';
  bytes: number;
  digest: `sha256:${string}`;
  text: string;
}>;

export type CanonicalArtifactReceiptEvidence = Readonly<{
  receiptId: string;
  status: 'active';
  acceptedBy: 'desktop-core-v1-consumer';
  origin: 'core/anvil';
  contractVersion: '1.0';
  artifactDigest: `sha256:${string}`;
  gateClosureDigest: `sha256:${string}`;
  receiptBodyDigest: `sha256:${string}`;
}>;

type PersistedCoreEvidenceMessage = Readonly<{
  type?: unknown;
  content?: unknown;
}>;

export const sha256File = (filePath: string): `sha256:${string}` =>
  `sha256:${createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')}`;

export function assertArtifactEnvelope(filePath: string, kind: 'docx' | 'pdf'): void {
  if (!fs.existsSync(filePath)) throw new Error(`M8_ARTIFACT_MISSING:${filePath}`);
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 256) throw new Error(`M8_ARTIFACT_TRUNCATED:${filePath}:${bytes.length}`);
  if (kind === 'docx' && !bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
    throw new Error(`M8_DOCX_NOT_OOXML:${filePath}`);
  }
  if (kind === 'pdf') {
    if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error(`M8_PDF_HEADER_INVALID:${filePath}`);
    if (!bytes.subarray(Math.max(0, bytes.length - 1024)).includes(Buffer.from('%%EOF'))) {
      throw new Error(`M8_PDF_EOF_MISSING:${filePath}`);
    }
  }
}

export function assertCitedText(text: string, requiredMarkers: readonly string[]): void {
  const canonical = text.replace(/\s+/g, ' ').trim().toLocaleLowerCase('en');
  for (const marker of requiredMarkers) {
    if (!canonical.includes(marker.toLocaleLowerCase('en'))) {
      throw new Error(`M8_CITATION_OR_CONTENT_MISSING:${marker}`);
    }
  }
}

export async function inspectNativeArtifact(
  filePath: string,
  kind: 'docx' | 'pdf',
  requiredMarkers: readonly string[]
): Promise<ArtifactEvidence> {
  assertArtifactEnvelope(filePath, kind);
  let text: string;
  try {
    const ast = await OfficeParser.parseOffice(filePath);
    const rendered = await ast.to('text');
    text = typeof rendered.value === 'string' ? rendered.value : Buffer.from(rendered.value).toString('utf8');
  } catch (error) {
    throw new Error(
      `M8_NATIVE_PARSE_FAILED:${path.basename(filePath)}:${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
  assertCitedText(text, requiredMarkers);
  return {
    path: filePath,
    kind,
    bytes: fs.statSync(filePath).size,
    digest: sha256File(filePath),
    text,
  };
}

export function assertTrustedArtifactReceipts(
  messages: readonly PersistedCoreEvidenceMessage[],
  artifacts: readonly ArtifactEvidence[]
): readonly CanonicalArtifactReceiptEvidence[] {
  const consumer = new DesktopCoreV1Consumer();
  consumer.consumeLine(JSON.stringify(readyEvent));
  const acceptedReceipts = new Map<string, CanonicalArtifactReceiptEvidence>();

  for (const message of messages) {
    if (message.type !== 'execution_evidence' || !message.content || typeof message.content !== 'object') continue;
    const content = message.content as Record<string, unknown>;
    if (
      content.acceptedBy !== 'desktop-core-v1-consumer' ||
      !Number.isSafeInteger(content.acceptedAt) ||
      Number(content.acceptedAt) <= 0 ||
      !content.event ||
      typeof content.event !== 'object' ||
      Array.isArray(content.event)
    ) {
      continue;
    }
    const event = content.event as Record<string, unknown>;
    if (event.type === 'anvil_trust_changed') {
      const receiptIds = event.receipt_ids;
      if (
        event.status !== 'historical' ||
        event.requires_fresh_core_validation !== true ||
        typeof event.reason !== 'string' ||
        event.reason.trim().length === 0 ||
        !Array.isArray(receiptIds) ||
        receiptIds.length === 0 ||
        receiptIds.some((receiptId) => typeof receiptId !== 'string' || receiptId.length === 0) ||
        new Set(receiptIds).size !== receiptIds.length
      ) {
        throw new Error('M8_RECEIPT_PUBLICATION_REVOCATION_INVALID');
      }

      // Desktop emits this accepted evidence only after the live consumer has
      // revoked every active publication-bound receipt on workspace mutation
      // or Core disconnect. Reproduce that transition exactly: a partial,
      // unknown, duplicate, or candidate-authored revocation set is invalid.
      const activeReceiptIds = [...acceptedReceipts.keys()].filter(
        (receiptId) => consumer.anvilStatus(receiptId) === 'active'
      );
      const expected = activeReceiptIds.toSorted();
      const observed = (receiptIds as string[]).toSorted();
      if (JSON.stringify(observed) !== JSON.stringify(expected)) {
        throw new Error('M8_RECEIPT_PUBLICATION_REVOCATION_MISMATCH');
      }
      const revoked = consumer.markDisconnected().toSorted();
      if (JSON.stringify(revoked) !== JSON.stringify(expected)) {
        throw new Error('M8_RECEIPT_PUBLICATION_REVOCATION_REPLAY_FAILED');
      }
      continue;
    }
    if (event.type !== 'anvil_receipt' && event.type !== 'anvil_receipt_invalidated') continue;

    // This is the same pinned schema, body-hash, sequence, correlation,
    // invalidation, and supersession reducer used for the live Core stream.
    // A DOM object, model claim, or candidate-authored summary never reaches it.
    consumer.consumeLine(JSON.stringify(event));
    if (event.type !== 'anvil_receipt') continue;

    const receiptId = String(event.receipt_id ?? '');
    if (
      event.contract_version !== '1.0' ||
      event.origin !== 'core/anvil' ||
      event.desktop_trust_status !== 'active' ||
      event.terminal_state !== 'verified' ||
      event.stamp !== 'verified' ||
      event.priced !== true ||
      !Number.isSafeInteger(event.checks_total) ||
      Number(event.checks_total) <= 0 ||
      event.checks_passed !== event.checks_total ||
      !/^sha256:[a-f0-9]{64}$/.test(String(event.artifact_digest ?? '')) ||
      !/^sha256:[a-f0-9]{64}$/.test(String(event.gate_closure_digest ?? '')) ||
      !/^sha256:[a-f0-9]{64}$/.test(String(event.receipt_body_digest ?? ''))
    ) {
      throw new Error(`M8_RECEIPT_TERMINAL_AUTHORITY_INVALID:${receiptId || '<missing>'}`);
    }
    acceptedReceipts.set(receiptId, {
      receiptId,
      status: 'active',
      acceptedBy: 'desktop-core-v1-consumer',
      origin: 'core/anvil',
      contractVersion: '1.0',
      artifactDigest: event.artifact_digest as `sha256:${string}`,
      gateClosureDigest: event.gate_closure_digest as `sha256:${string}`,
      receiptBodyDigest: event.receipt_body_digest as `sha256:${string}`,
    });
  }

  const activeReceipts = [...acceptedReceipts.values()].filter(
    (receipt) => consumer.anvilStatus(receipt.receiptId) === 'active'
  );
  for (const artifact of artifacts) {
    const matching = activeReceipts.find((receipt) => receipt.artifactDigest === artifact.digest);
    if (!matching) {
      throw new Error(`M8_RECEIPT_AUTHORITY_MISSING:${path.basename(artifact.path)}:${artifact.digest}`);
    }
  }
  return activeReceipts;
}

export function assertEquivalentJ23State(
  plain: readonly ArtifactEvidence[],
  cowork: readonly ArtifactEvidence[],
  requiredMarkers: readonly string[]
): void {
  if (plain.length !== 2 || cowork.length !== 2) throw new Error('M8_J23_NATIVE_OUTPUT_PAIR_INCOMPLETE');
  for (const collection of [plain, cowork]) {
    const kinds = new Set(collection.map((artifact) => artifact.kind));
    if (!kinds.has('docx') || !kinds.has('pdf')) throw new Error('M8_J23_NATIVE_OUTPUT_KIND_MISMATCH');
    for (const artifact of collection) assertCitedText(artifact.text, requiredMarkers);
  }
}
