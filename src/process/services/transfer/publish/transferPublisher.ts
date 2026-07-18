/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  destinationProtection,
  parseTransferContainerHeader,
  recoveryProtection,
  serializeTransferContainerRecord,
  TRANSFER_CHUNK_SCHEMA,
  TRANSFER_CONTAINER_CONTRACT,
  TRANSFER_CONTAINER_FORMAT_VERSION,
  TRANSFER_DESTINATION_SUITE,
  TRANSFER_MAX_CHUNKS,
  TRANSFER_MAX_CHUNK_PLAINTEXT_BYTES,
  TRANSFER_MAX_CIPHERTEXT_BYTES,
  TRANSFER_MAX_PLAINTEXT_BYTES,
  TRANSFER_RECOVERY_SUITE,
  TransferContainerStreamValidator,
  transferCiphertextDigest,
  type TransferChunkDescriptor,
  type TransferContainerHeader,
  type TransferContainerTerminal,
  type TransferContainerSuite,
} from '@process/services/transfer/container';
import {
  contentDigest,
  DESTINATION_MAX_KEY_LIFETIME_MS,
  encryptDestinationChunk,
  parseDestinationChunkEnvelope,
  RecoveryBundleCryptoSession,
  type DestinationRecipientDescriptor,
} from '@process/services/transfer/crypto';
import {
  parseAndValidateTransferObjectGraph,
  type TransferDigest,
  type TransferObjectGraph,
  type TransferObjectId,
} from '@process/services/transfer/export';

import {
  createSourceAuthorizationRecord,
  sourceScopeForGraph,
  verifySourceAuthorizationRecord,
  type SourceAuthorizationTarget,
  type SourceAuthorizationValidationPolicy,
  type SourceExportAuthorizationInput,
} from './sourceAuthorization';
import {
  TRANSFER_PUBLICATION_RECEIPT_CONTRACT,
  type TransferPublication,
  type TransferPublicationChunkRecord,
  type TransferPublicationContainerRecord,
  type TransferPublicationReceipt,
  type TransferPublicationRecord,
  type TransferSourceAuthorizationRecord,
} from './types';

const DESTINATION_TAG_BYTES = 16;
const RECOVERY_TAG_BYTES = 16;

export type PublishDestinationTransferInput = Readonly<{
  graph: TransferObjectGraph;
  recipient: DestinationRecipientDescriptor;
  sourceAuthorization: SourceExportAuthorizationInput;
  now?: () => number;
}>;

export type PublishRecoveryTransferInput = Readonly<{
  graph: TransferObjectGraph;
  passphrase: string | Uint8Array;
  sourceAuthorization: SourceExportAuthorizationInput;
  now?: () => number;
}>;

type PlaintextChunk = Readonly<{
  ordinal: number;
  plaintext: Uint8Array;
  contentDigest: `sha256:${string}`;
}>;

type SealedChunk = Readonly<{
  ordinal: number;
  plaintextLength: number;
  contentDigest: `sha256:${string}`;
  ciphertext: Uint8Array;
  nonce?: string;
  encapsulatedKey?: string;
}>;

/** Publish a destination-bound transfer using one fresh HPKE seal per chunk. */
export async function publishDestinationTransfer(input: PublishDestinationTransferInput): Promise<TransferPublication> {
  const now = input.now ?? Date.now;
  assertFreshDestinationAuthority(input.recipient, now());
  const snapshot = snapshotGraph(input.graph);
  const sealed: SealedChunk[] = [];

  for (const chunk of snapshot.chunks) {
    assertFreshDestinationAuthority(input.recipient, now());
    // oxlint-disable-next-line no-await-in-loop -- sealing stays bounded instead of retaining every HPKE job at once.
    const serialized = await encryptDestinationChunk(
      {
        bundleId: snapshot.bundleId,
        schema: TRANSFER_CHUNK_SCHEMA,
        ordinal: chunk.ordinal,
        declaredLength: chunk.plaintext.byteLength,
        contentDigest: chunk.contentDigest,
        plaintext: chunk.plaintext,
      },
      input.recipient,
      now
    );
    const envelope = parseDestinationChunkEnvelope(serialized);
    sealed.push({
      ordinal: chunk.ordinal,
      plaintextLength: chunk.plaintext.byteLength,
      contentDigest: chunk.contentDigest,
      ciphertext: decodeCanonicalBase64Url(envelope.ciphertext, chunk.plaintext.byteLength + DESTINATION_TAG_BYTES),
      encapsulatedKey: envelope.encapsulatedKey,
    });
  }
  assertFreshDestinationAuthority(input.recipient, now());

  return assemblePublication(
    snapshot,
    TRANSFER_DESTINATION_SUITE,
    sealed,
    destinationProtection({
      recipientKeyId: input.recipient.keyId,
      recipientKeyFingerprint: asDigest(input.recipient.fingerprint, 'recipient fingerprint'),
      authorizationBinding: input.recipient.authorizationBinding,
      expiresAt: input.recipient.expiresAt,
    }),
    input.sourceAuthorization,
    now
  );
}

/** Publish a recovery transfer with one Argon2 derivation for the complete bundle. */
export async function publishRecoveryTransfer(input: PublishRecoveryTransferInput): Promise<TransferPublication> {
  const now = input.now ?? Date.now;
  const snapshot = snapshotGraph(input.graph);
  const session = await RecoveryBundleCryptoSession.create(input.passphrase);
  try {
    const sealed = snapshot.chunks.map((chunk): SealedChunk => {
      const envelope = session.encryptChunk({
        bundleId: snapshot.bundleId,
        schema: TRANSFER_CHUNK_SCHEMA,
        ordinal: chunk.ordinal,
        declaredLength: chunk.plaintext.byteLength,
        contentDigest: chunk.contentDigest,
        plaintext: chunk.plaintext,
      });
      return {
        ordinal: chunk.ordinal,
        plaintextLength: chunk.plaintext.byteLength,
        contentDigest: chunk.contentDigest,
        ciphertext: decodeCanonicalBase64Url(envelope.ciphertext, chunk.plaintext.byteLength + RECOVERY_TAG_BYTES),
        nonce: envelope.nonce,
      };
    });

    return assemblePublication(
      snapshot,
      TRANSFER_RECOVERY_SUITE,
      sealed,
      recoveryProtection(Buffer.from(session.parameters().salt, 'base64url')),
      input.sourceAuthorization,
      now
    );
  } finally {
    session.destroy();
  }
}

/** Replay a complete outer publication through the real fail-closed stream reducer. */
export function validateTransferPublication(
  records: readonly TransferPublicationRecord[],
  policy: SourceAuthorizationValidationPolicy
): TransferPublicationReceipt {
  if (!Array.isArray(records) || records.length === 0) throw new Error('Transfer publication is empty');
  if (!policy) throw new Error('Transfer publication requires source authorization policy');
  const authorization = records.at(-1);
  if (!authorization || authorization.recordType !== 'source-authorization') {
    if (records.some((record) => record.recordType === 'source-authorization')) {
      throw new Error('Transfer publication contains a record after terminal source authorization');
    }
    throw new Error('Transfer publication is unsigned');
  }
  if (records.slice(0, -1).some((record) => record.recordType === 'source-authorization')) {
    throw new Error('Transfer publication contains duplicate source authorization');
  }
  const containerRecords = records.slice(0, -1) as readonly TransferPublicationContainerRecord[];
  const first = containerRecords[0];
  if (!first) throw new Error('Transfer publication container is empty');
  if (first.recordType !== 'header') throw new Error('Transfer publication must begin with a header');
  assertImmutableBytes(first.serialized, 'header');
  const header = parseTransferContainerHeader(first.serialized);
  if (header.suite === TRANSFER_DESTINATION_SUITE) {
    assertFreshDestinationProtection(header.protection, (policy.now ?? Date.now)());
  }
  const validator = new TransferContainerStreamValidator(header);
  let terminal: TransferContainerTerminal | undefined;

  for (const [index, record] of containerRecords.entries()) {
    if (index === 0) continue;
    if (record.recordType === 'header') throw new Error('Transfer publication contains a duplicate header');
    if (record.recordType === 'chunk') {
      assertImmutableBytes(record.descriptor, 'chunk descriptor');
      assertImmutableBytes(record.ciphertext, 'ciphertext');
      validator.acceptChunk(record.descriptor, record.ciphertext);
      continue;
    }
    assertImmutableBytes(record.serialized, 'terminal');
    terminal = validator.acceptTerminal(record.serialized);
  }
  const validated = validator.finish();
  if (!terminal || terminal !== validated.terminal) throw new Error('Transfer publication terminal mismatch');
  if (header.suite === TRANSFER_DESTINATION_SUITE) {
    assertFreshDestinationProtection(header.protection, (policy.now ?? Date.now)());
  }
  verifySourceAuthorizationRecord(authorization, containerRecords, header, terminal, policy);
  return receiptFor(header.suite, validated.terminal);
}

type PublicationGraphSnapshot = Readonly<{
  bundleId: string;
  semanticGraphSha256: TransferDigest;
  selectedLogicalState: TransferObjectGraph['manifest']['selectedLogicalState'];
  exclusions: TransferObjectGraph['manifest']['exclusions'];
  chunks: readonly PlaintextChunk[];
}>;

function snapshotGraph(graph: TransferObjectGraph): PublicationGraphSnapshot {
  if (!graph || !(graph.manifestBytes instanceof Uint8Array) || !(graph.objects instanceof Map)) {
    throw new Error('Transfer publication requires a complete object graph');
  }
  const manifestBytes = copyBytes(graph.manifestBytes, 'manifest');
  const objectBytes = new Map<TransferObjectId, Uint8Array>();
  for (const descriptor of graph.manifest.objects) {
    const bytes = graph.objects.get(descriptor.id);
    if (!bytes) throw new Error(`Transfer publication object bytes missing at ordinal ${descriptor.ordinal}`);
    objectBytes.set(descriptor.id, copyBytes(bytes, `object ordinal ${descriptor.ordinal}`));
  }
  const manifest = parseAndValidateTransferObjectGraph(manifestBytes, objectBytes);
  const chunkCount = manifest.objects.length + 1;
  if (chunkCount > TRANSFER_MAX_CHUNKS) throw new Error('Transfer publication exceeds maximum chunk count');

  const chunks: PlaintextChunk[] = [plaintextChunk(0, manifestBytes)];
  for (const descriptor of manifest.objects) {
    if (descriptor.ordinal + 1 !== chunks.length) throw new Error('Transfer publication object ordinal drift');
    const bytes = objectBytes.get(descriptor.id)!;
    if (bytes.byteLength === 0) throw new Error('Transfer publication cannot encode an empty chunk');
    if (descriptor.sha256 !== contentDigest(bytes)) throw new Error('Transfer publication object digest mismatch');
    chunks.push(plaintextChunk(descriptor.ordinal + 1, bytes));
  }
  assertPlaintextBounds(chunks);
  return {
    bundleId: manifest.bundleId,
    semanticGraphSha256: manifest.resumability.semanticGraphSha256,
    selectedLogicalState: Object.freeze([...manifest.selectedLogicalState]),
    exclusions: Object.freeze(manifest.exclusions.map((exclusion) => Object.freeze({ ...exclusion }))),
    chunks,
  };
}

function plaintextChunk(ordinal: number, plaintext: Uint8Array): PlaintextChunk {
  if (plaintext.byteLength === 0 || plaintext.byteLength > TRANSFER_MAX_CHUNK_PLAINTEXT_BYTES) {
    throw new Error('Transfer publication chunk plaintext exceeds bounds');
  }
  return { ordinal, plaintext, contentDigest: contentDigest(plaintext) as `sha256:${string}` };
}

function assemblePublication(
  snapshot: PublicationGraphSnapshot,
  suite: TransferContainerSuite,
  sealed: readonly SealedChunk[],
  protection: TransferContainerHeader['protection'],
  sourceAuthorization: SourceExportAuthorizationInput,
  now: () => number
): TransferPublication {
  const bundleId = snapshot.bundleId;
  if (sealed.length === 0 || sealed.length > TRANSFER_MAX_CHUNKS) {
    throw new Error('Transfer publication sealed chunk count is invalid');
  }
  let plaintextBytes = 0;
  let ciphertextBytes = 0;
  const chunks: TransferPublicationChunkRecord[] = [];
  for (const [expectedOrdinal, chunk] of sealed.entries()) {
    if (chunk.ordinal !== expectedOrdinal) throw new Error('Transfer publication sealed ordinal drift');
    plaintextBytes = checkedAdd(plaintextBytes, chunk.plaintextLength, TRANSFER_MAX_PLAINTEXT_BYTES, 'plaintext');
    ciphertextBytes = checkedAdd(
      ciphertextBytes,
      chunk.ciphertext.byteLength,
      TRANSFER_MAX_CIPHERTEXT_BYTES,
      'ciphertext'
    );
    const descriptor: TransferChunkDescriptor = {
      recordType: 'chunk',
      bundleId,
      schema: TRANSFER_CHUNK_SCHEMA,
      ordinal: chunk.ordinal,
      plaintextLength: chunk.plaintextLength,
      ciphertextLength: chunk.ciphertext.byteLength,
      contentDigest: chunk.contentDigest,
      ciphertextDigest: transferCiphertextDigest(chunk.ciphertext),
      ...(suite === TRANSFER_RECOVERY_SUITE
        ? { nonce: requiredString(chunk.nonce, 'recovery nonce') }
        : { encapsulatedKey: requiredString(chunk.encapsulatedKey, 'destination encapsulated key') }),
    };
    chunks.push({
      recordType: 'chunk',
      descriptor: serializeTransferContainerRecord(descriptor),
      ciphertext: Uint8Array.from(chunk.ciphertext),
    });
  }

  const header = {
    recordType: 'header',
    contract: TRANSFER_CONTAINER_CONTRACT,
    formatVersion: TRANSFER_CONTAINER_FORMAT_VERSION,
    bundleId,
    suite,
    declaredChunkCount: chunks.length,
    declaredCiphertextBytes: ciphertextBytes,
    declaredPlaintextBytes: plaintextBytes,
    protection,
  } as TransferContainerHeader;
  const headerRecord = { recordType: 'header' as const, serialized: serializeTransferContainerRecord(header) };
  const validator = new TransferContainerStreamValidator(header);
  for (const chunk of chunks) validator.acceptChunk(chunk.descriptor, chunk.ciphertext);
  const terminal: TransferContainerTerminal = {
    recordType: 'terminal',
    bundleId,
    chunkCount: chunks.length,
    plaintextBytes,
    ciphertextBytes,
    streamDigest: validator.currentStreamDigest(),
  };
  const terminalRecord = {
    recordType: 'terminal' as const,
    serialized: serializeTransferContainerRecord(terminal),
  };
  const containerRecords: readonly TransferPublicationContainerRecord[] = [headerRecord, ...chunks, terminalRecord];
  const target: SourceAuthorizationTarget =
    header.suite === TRANSFER_DESTINATION_SUITE
      ? { mode: 'destination', destinationKeyFingerprint: header.protection.recipientKeyFingerprint }
      : { mode: 'recovery', recoveryMode: 'passphrase' };
  const scope = sourceScopeForGraph(
    snapshot.semanticGraphSha256,
    snapshot.bundleId,
    snapshot.selectedLogicalState,
    snapshot.exclusions,
    sourceAuthorization.mutationEpoch,
    target
  );
  const authorizationRecord = createSourceAuthorizationRecord(
    containerRecords,
    header,
    terminal,
    scope,
    sourceAuthorization,
    now()
  );
  const records: readonly TransferPublicationRecord[] = [...containerRecords, authorizationRecord];
  const receipt = validateTransferPublication(records, {
    trustedAuthority: sourceAuthorization.authority.descriptor(),
    expectedScope: scope,
    now,
  });
  return {
    records: records.map(copyRecord),
    supportReceipt: Object.freeze({ ...receipt }),
  };
}

function assertPlaintextBounds(chunks: readonly PlaintextChunk[]): void {
  let total = 0;
  for (const [expectedOrdinal, chunk] of chunks.entries()) {
    if (chunk.ordinal !== expectedOrdinal) throw new Error('Transfer publication chunk ordinal drift');
    total = checkedAdd(total, chunk.plaintext.byteLength, TRANSFER_MAX_PLAINTEXT_BYTES, 'plaintext');
  }
}

function assertFreshDestinationAuthority(recipient: DestinationRecipientDescriptor, now: number): void {
  if (recipient.suite !== TRANSFER_DESTINATION_SUITE) throw new Error('Transfer destination suite mismatch');
  assertFreshDestinationProtection({ expiresAt: recipient.expiresAt }, now);
}

function assertFreshDestinationProtection(protection: { expiresAt: number }, now: number): void {
  if (!Number.isSafeInteger(now) || !Number.isSafeInteger(protection.expiresAt)) {
    throw new Error('Transfer destination authority expiry is invalid');
  }
  const remaining = protection.expiresAt - now;
  if (remaining <= 0 || remaining > DESTINATION_MAX_KEY_LIFETIME_MS) {
    throw new Error('Transfer destination authority is expired or exceeds 15 minutes');
  }
}

function receiptFor(suite: TransferContainerSuite, terminal: TransferContainerTerminal): TransferPublicationReceipt {
  return Object.freeze({
    contract: TRANSFER_PUBLICATION_RECEIPT_CONTRACT,
    bundleId: terminal.bundleId,
    suite,
    chunkCount: terminal.chunkCount,
    plaintextBytes: terminal.plaintextBytes,
    ciphertextBytes: terminal.ciphertextBytes,
    streamDigest: terminal.streamDigest,
  });
}

function copyRecord(record: TransferPublicationRecord): TransferPublicationRecord {
  if (record.recordType === 'chunk') {
    return Object.freeze({
      recordType: 'chunk',
      descriptor: Uint8Array.from(record.descriptor),
      ciphertext: Uint8Array.from(record.ciphertext),
    });
  }
  return Object.freeze({ recordType: record.recordType, serialized: Uint8Array.from(record.serialized) }) as
    TransferPublicationContainerRecord | TransferSourceAuthorizationRecord;
}

function copyBytes(bytes: Uint8Array, label: string): Uint8Array {
  assertImmutableBytes(bytes, label);
  return Uint8Array.from(bytes);
}

function assertImmutableBytes(bytes: Uint8Array, label: string): void {
  if (!(bytes instanceof Uint8Array)) throw new Error(`Transfer publication ${label} must be bytes`);
  if (typeof SharedArrayBuffer !== 'undefined' && bytes.buffer instanceof SharedArrayBuffer) {
    throw new Error(`Transfer publication ${label} cannot use shared mutable memory`);
  }
}

function decodeCanonicalBase64Url(value: string, expectedBytes: number): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Transfer publication encrypted bytes are malformed');
  const decoded = Uint8Array.from(Buffer.from(value, 'base64url'));
  if (decoded.byteLength !== expectedBytes || Buffer.from(decoded).toString('base64url') !== value) {
    throw new Error('Transfer publication encrypted bytes are malformed');
  }
  return decoded;
}

function requiredString(value: string | undefined, label: string): string {
  if (!value) throw new Error(`Transfer publication ${label} is missing`);
  return value;
}

function asDigest(value: string, label: string): `sha256:${string}` {
  if (!/^sha256:[0-9a-f]{64}$/.test(value)) throw new Error(`Transfer publication ${label} is invalid`);
  return value as `sha256:${string}`;
}

function checkedAdd(current: number, addition: number, maximum: number, label: string): number {
  const result = current + addition;
  if (!Number.isSafeInteger(result) || result > maximum) {
    throw new Error(`Transfer publication ${label} bytes exceed bounds`);
  }
  return result;
}
