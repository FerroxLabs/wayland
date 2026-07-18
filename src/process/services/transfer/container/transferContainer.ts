/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, type Hash } from 'node:crypto';
import { parseStrictJson } from '../crypto/strictJson';
import { canonicalizeRestrictedJson } from '../../../utils/restrictedCanonicalJson';
import {
  TRANSFER_CONTAINER_CONTRACT,
  TRANSFER_CONTAINER_FORMAT_VERSION,
  TRANSFER_CHUNK_SCHEMA,
  TRANSFER_DESTINATION_SUITE,
  TRANSFER_MAX_CHUNKS,
  TRANSFER_MAX_CHUNK_CIPHERTEXT_BYTES,
  TRANSFER_MAX_CHUNK_PLAINTEXT_BYTES,
  TRANSFER_MAX_CIPHERTEXT_BYTES,
  TRANSFER_MAX_EXPANSION_RATIO,
  TRANSFER_MAX_HEADER_BYTES,
  TRANSFER_MAX_PLAINTEXT_BYTES,
  TRANSFER_MAX_RECORD_BYTES,
  TRANSFER_MIN_CHUNK_CIPHERTEXT_BYTES,
  TRANSFER_RECOVERY_SUITE,
  type TransferChunkDescriptor,
  type TransferContainerHeader,
  type TransferContainerTerminal,
  type TransferDestinationProtection,
  type TransferRecoveryProtection,
  type ValidatedTransferChunk,
  type ValidatedTransferContainer,
} from './types';

const decoder = new TextDecoder('utf-8', { fatal: true });
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const HEADER_FIELDS = new Set([
  'recordType',
  'contract',
  'formatVersion',
  'bundleId',
  'suite',
  'declaredChunkCount',
  'declaredCiphertextBytes',
  'declaredPlaintextBytes',
  'protection',
]);
const RECOVERY_PROTECTION_FIELDS = new Set([
  'mode',
  'kdf',
  'argon2Version',
  'memoryKiB',
  'iterations',
  'parallelism',
  'keyBytes',
  'salt',
  'cipher',
]);
const DESTINATION_PROTECTION_FIELDS = new Set(['mode', 'hpkeMode', 'kem', 'kdf', 'aead', 'recipientKeyFingerprint']);
const RECOVERY_CHUNK_FIELDS = new Set([
  'recordType',
  'bundleId',
  'schema',
  'ordinal',
  'plaintextLength',
  'ciphertextLength',
  'contentDigest',
  'ciphertextDigest',
  'nonce',
]);
const DESTINATION_CHUNK_FIELDS = new Set([
  ...[...RECOVERY_CHUNK_FIELDS].filter((field) => field !== 'nonce'),
  'encapsulatedKey',
]);
const TERMINAL_FIELDS = new Set([
  'recordType',
  'bundleId',
  'chunkCount',
  'plaintextBytes',
  'ciphertextBytes',
  'streamDigest',
]);

/**
 * Parse and validate the content-free outer header. This performs no KDF work;
 * callers must complete it before allocating any password-derived resources.
 */
export function parseTransferContainerHeader(serialized: Uint8Array | string): TransferContainerHeader {
  const parsed = parseCanonicalRecord(serialized, TRANSFER_MAX_HEADER_BYTES, 'header');
  assertExactFields(parsed, HEADER_FIELDS, 'header');
  if (parsed.recordType !== 'header') throw new Error('Transfer first record must be a header');
  if (parsed.contract !== TRANSFER_CONTAINER_CONTRACT) throw new Error('Unknown transfer container contract');
  if (parsed.formatVersion !== TRANSFER_CONTAINER_FORMAT_VERSION)
    throw new Error('Unsupported transfer format version');
  assertIdentifier(parsed.bundleId, 'bundle id');
  assertBoundedInteger(parsed.declaredChunkCount, 1, TRANSFER_MAX_CHUNKS, 'chunk count');
  assertBoundedInteger(parsed.declaredCiphertextBytes, 1, TRANSFER_MAX_CIPHERTEXT_BYTES, 'declared ciphertext bytes');
  assertBoundedInteger(parsed.declaredPlaintextBytes, 1, TRANSFER_MAX_PLAINTEXT_BYTES, 'declared plaintext bytes');
  assertExpansionRatio(
    parsed.declaredPlaintextBytes as number,
    parsed.declaredCiphertextBytes as number,
    'declared transfer'
  );
  if ((parsed.declaredPlaintextBytes as number) < (parsed.declaredChunkCount as number))
    throw new Error('Transfer declared plaintext bytes cannot satisfy chunk count');
  if (
    (parsed.declaredCiphertextBytes as number) <
    (parsed.declaredChunkCount as number) * TRANSFER_MIN_CHUNK_CIPHERTEXT_BYTES
  ) {
    throw new Error('Transfer declared ciphertext bytes cannot satisfy chunk count');
  }
  if (!isRecord(parsed.protection)) throw new Error('Transfer protection must be an object');

  if (parsed.suite === TRANSFER_RECOVERY_SUITE) {
    validateRecoveryProtection(parsed.protection);
  } else if (parsed.suite === TRANSFER_DESTINATION_SUITE) {
    validateDestinationProtection(parsed.protection);
  } else {
    throw new Error('Unknown transfer crypto suite');
  }
  return parsed as TransferContainerHeader;
}

export function serializeTransferContainerRecord(
  record: TransferContainerHeader | TransferChunkDescriptor | TransferContainerTerminal
): Uint8Array {
  return canonicalizeRestrictedJson(record);
}

/**
 * Stateful, bounded validator for an already-framed transfer stream. It holds
 * only counters, digests, and observed nonces; ciphertext is never retained.
 */
export class TransferContainerStreamValidator {
  private readonly streamHash: Hash;
  private readonly observedNonces = new Set<string>();
  private readonly observedEncapsulatedKeys = new Set<string>();
  private expectedOrdinal = 0;
  private observedPlaintextBytes = 0;
  private observedCiphertextBytes = 0;
  private terminal: TransferContainerTerminal | null = null;
  private failed = false;

  constructor(readonly header: TransferContainerHeader) {
    // Re-validate object callers through the same canonical wire contract.
    this.header = parseTransferContainerHeader(serializeTransferContainerRecord(header));
    this.streamHash = createHash('sha256');
    this.updateStreamHash(serializeTransferContainerRecord(this.header));
  }

  acceptChunk(serializedDescriptor: Uint8Array | string, ciphertext: Uint8Array): ValidatedTransferChunk {
    try {
      return this.acceptChunkUnchecked(serializedDescriptor, ciphertext);
    } catch (error) {
      this.failed = true;
      throw error;
    }
  }

  private acceptChunkUnchecked(
    serializedDescriptor: Uint8Array | string,
    ciphertext: Uint8Array
  ): ValidatedTransferChunk {
    this.assertOpen();
    if (!(ciphertext instanceof Uint8Array)) throw new Error('Transfer ciphertext must be bytes');
    if (typeof SharedArrayBuffer !== 'undefined' && ciphertext.buffer instanceof SharedArrayBuffer) {
      throw new Error('Transfer ciphertext cannot use shared mutable memory');
    }
    const parsed = parseCanonicalRecord(serializedDescriptor, TRANSFER_MAX_RECORD_BYTES, 'chunk descriptor');
    const fields = this.header.suite === TRANSFER_RECOVERY_SUITE ? RECOVERY_CHUNK_FIELDS : DESTINATION_CHUNK_FIELDS;
    assertExactFields(parsed, fields, 'chunk descriptor');
    if (parsed.recordType !== 'chunk') throw new Error('Expected transfer chunk descriptor');
    if (parsed.bundleId !== this.header.bundleId) throw new Error('Transfer chunk bundle mismatch');
    if (parsed.schema !== TRANSFER_CHUNK_SCHEMA) throw new Error('Unsupported transfer chunk schema');
    if (parsed.ordinal !== this.expectedOrdinal)
      throw new Error(`Transfer chunk sequence gap or reordering at ordinal ${this.expectedOrdinal}`);
    assertBoundedInteger(parsed.plaintextLength, 1, TRANSFER_MAX_CHUNK_PLAINTEXT_BYTES, 'chunk plaintext length');
    assertBoundedInteger(
      parsed.ciphertextLength,
      TRANSFER_MIN_CHUNK_CIPHERTEXT_BYTES,
      TRANSFER_MAX_CHUNK_CIPHERTEXT_BYTES,
      'chunk ciphertext length'
    );
    assertExpansionRatio(parsed.plaintextLength as number, parsed.ciphertextLength as number, 'chunk');
    assertDigest(parsed.contentDigest, 'chunk content digest');
    assertDigest(parsed.ciphertextDigest, 'chunk ciphertext digest');
    if (this.header.suite === TRANSFER_RECOVERY_SUITE) {
      const nonce = decodeCanonicalBase64Url(parsed.nonce, 24, 'recovery chunk nonce');
      const encoded = Buffer.from(nonce).toString('base64url');
      if (this.observedNonces.has(encoded)) throw new Error('Transfer recovery nonce reuse detected');
      this.observedNonces.add(encoded);
    } else {
      const encapsulatedKey = decodeCanonicalBase64Url(parsed.encapsulatedKey, 32, 'WT-D1 chunk encapsulated key');
      const encoded = Buffer.from(encapsulatedKey).toString('base64url');
      if (this.observedEncapsulatedKeys.has(encoded)) throw new Error('Transfer WT-D1 encapsulated key reuse detected');
      this.observedEncapsulatedKeys.add(encoded);
    }
    if (ciphertext.length !== parsed.ciphertextLength) throw new Error('Transfer chunk ciphertext length mismatch');
    if (digest(ciphertext) !== parsed.ciphertextDigest) throw new Error('Transfer chunk ciphertext digest mismatch');

    const nextPlaintext = checkedAdd(
      this.observedPlaintextBytes,
      parsed.plaintextLength as number,
      TRANSFER_MAX_PLAINTEXT_BYTES,
      'transfer plaintext bytes'
    );
    const nextCiphertext = checkedAdd(
      this.observedCiphertextBytes,
      parsed.ciphertextLength as number,
      TRANSFER_MAX_CIPHERTEXT_BYTES,
      'transfer ciphertext bytes'
    );
    if (nextPlaintext > this.header.declaredPlaintextBytes)
      throw new Error('Transfer plaintext bytes exceed header declaration');
    if (nextCiphertext > this.header.declaredCiphertextBytes)
      throw new Error('Transfer ciphertext bytes exceed header declaration');
    if (this.expectedOrdinal >= this.header.declaredChunkCount)
      throw new Error('Transfer chunk count exceeds header declaration');

    const canonicalDescriptor = canonicalizeRestrictedJson(parsed);
    this.updateStreamHash(canonicalDescriptor);
    this.updateStreamHash(ciphertext);
    this.observedPlaintextBytes = nextPlaintext;
    this.observedCiphertextBytes = nextCiphertext;
    this.expectedOrdinal += 1;
    return { descriptor: parsed as TransferChunkDescriptor };
  }

  acceptTerminal(serializedTerminal: Uint8Array | string): TransferContainerTerminal {
    try {
      return this.acceptTerminalUnchecked(serializedTerminal);
    } catch (error) {
      this.failed = true;
      throw error;
    }
  }

  private acceptTerminalUnchecked(serializedTerminal: Uint8Array | string): TransferContainerTerminal {
    this.assertOpen();
    const parsed = parseCanonicalRecord(serializedTerminal, TRANSFER_MAX_RECORD_BYTES, 'terminal');
    assertExactFields(parsed, TERMINAL_FIELDS, 'terminal');
    if (parsed.recordType !== 'terminal') throw new Error('Expected transfer terminal record');
    if (parsed.bundleId !== this.header.bundleId) throw new Error('Transfer terminal bundle mismatch');
    assertBoundedInteger(parsed.chunkCount, 1, TRANSFER_MAX_CHUNKS, 'terminal chunk count');
    assertBoundedInteger(parsed.plaintextBytes, 1, TRANSFER_MAX_PLAINTEXT_BYTES, 'terminal plaintext bytes');
    assertBoundedInteger(parsed.ciphertextBytes, 1, TRANSFER_MAX_CIPHERTEXT_BYTES, 'terminal ciphertext bytes');
    assertDigest(parsed.streamDigest, 'terminal stream digest');
    if (parsed.chunkCount !== this.expectedOrdinal || parsed.chunkCount !== this.header.declaredChunkCount) {
      throw new Error('Transfer terminal chunk count mismatch');
    }
    if (
      parsed.plaintextBytes !== this.observedPlaintextBytes ||
      parsed.plaintextBytes !== this.header.declaredPlaintextBytes
    ) {
      throw new Error('Transfer terminal plaintext byte count mismatch');
    }
    if (
      parsed.ciphertextBytes !== this.observedCiphertextBytes ||
      parsed.ciphertextBytes !== this.header.declaredCiphertextBytes
    ) {
      throw new Error('Transfer terminal ciphertext byte count mismatch');
    }
    const observedStreamDigest = `sha256:${this.streamHash.copy().digest('hex')}`;
    if (parsed.streamDigest !== observedStreamDigest) throw new Error('Transfer terminal stream digest mismatch');
    this.terminal = parsed as TransferContainerTerminal;
    return this.terminal;
  }

  finish(): ValidatedTransferContainer {
    if (this.failed) throw new Error('Transfer container validation previously failed closed');
    if (!this.terminal) throw new Error('Transfer container is truncated before terminal record');
    return { header: this.header, terminal: this.terminal };
  }

  currentStreamDigest(): `sha256:${string}` {
    return `sha256:${this.streamHash.copy().digest('hex')}`;
  }

  private assertOpen(): void {
    if (this.failed) throw new Error('Transfer container validation previously failed closed');
    if (this.terminal) throw new Error('Transfer record appears after terminal state');
  }

  private updateStreamHash(bytes: Uint8Array): void {
    const length = Buffer.allocUnsafe(8);
    length.writeBigUInt64BE(BigInt(bytes.length));
    this.streamHash.update(length).update(bytes);
  }
}

function validateRecoveryProtection(value: Record<string, unknown>): void {
  assertExactFields(value, RECOVERY_PROTECTION_FIELDS, 'WT-R1 protection');
  if (value.mode !== 'recovery') throw new Error('WT-R1 protection mode mismatch');
  if (value.kdf !== 'Argon2id') throw new Error('WT-R1 KDF substitution');
  if (value.argon2Version !== 19) throw new Error('WT-R1 Argon2 version drift');
  if (value.memoryKiB !== 262_144) throw new Error('WT-R1 Argon2 memory drift');
  if (value.iterations !== 3) throw new Error('WT-R1 Argon2 iteration drift');
  if (value.parallelism !== 1) throw new Error('WT-R1 Argon2 parallelism drift');
  if (value.keyBytes !== 32) throw new Error('WT-R1 key-length drift');
  if (value.cipher !== 'XChaCha20-Poly1305') throw new Error('WT-R1 cipher substitution');
  decodeCanonicalBase64Url(value.salt, 16, 'WT-R1 salt');
}

function validateDestinationProtection(value: Record<string, unknown>): void {
  assertExactFields(value, DESTINATION_PROTECTION_FIELDS, 'WT-D1 protection');
  if (value.mode !== 'destination-bound') throw new Error('WT-D1 protection mode mismatch');
  if (value.hpkeMode !== 'base') throw new Error('WT-D1 HPKE mode substitution');
  if (value.kem !== 'DHKEM(X25519,HKDF-SHA256)') throw new Error('WT-D1 KEM substitution');
  if (value.kdf !== 'HKDF-SHA256') throw new Error('WT-D1 KDF substitution');
  if (value.aead !== 'ChaCha20-Poly1305') throw new Error('WT-D1 AEAD substitution');
  assertDigest(value.recipientKeyFingerprint, 'WT-D1 recipient key fingerprint');
}

function parseCanonicalRecord(
  serialized: Uint8Array | string,
  maxBytes: number,
  label: string
): Record<string, unknown> {
  const bytes = typeof serialized === 'string' ? Buffer.from(serialized, 'utf8') : serialized;
  if (!(bytes instanceof Uint8Array)) throw new Error(`Transfer ${label} must be bytes or text`);
  if (bytes.length === 0 || bytes.length > maxBytes) throw new Error(`Transfer ${label} exceeds bounded record size`);
  let text: string;
  try {
    text = decoder.decode(bytes);
  } catch {
    throw new Error(`Transfer ${label} is not valid UTF-8`);
  }
  const parsed = parseStrictJson(text);
  if (!isRecord(parsed)) throw new Error(`Transfer ${label} must be an object`);
  if (!canonicalizeRestrictedJson(parsed).equals(Buffer.from(bytes)))
    throw new Error(`Transfer ${label} is not canonical JSON`);
  return parsed;
}

function assertExactFields(value: Record<string, unknown>, expected: ReadonlySet<string>, label: string): void {
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) throw new Error(`Unknown critical transfer ${label} field: ${key}`);
  }
  for (const key of expected) {
    if (!Object.hasOwn(value, key)) throw new Error(`Missing critical transfer ${label} field: ${key}`);
  }
}

function assertIdentifier(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !IDENTIFIER_PATTERN.test(value)) throw new Error(`Invalid transfer ${label}`);
}

function assertDigest(value: unknown, label: string): asserts value is `sha256:${string}` {
  if (typeof value !== 'string' || !DIGEST_PATTERN.test(value)) throw new Error(`Invalid transfer ${label}`);
}

function assertBoundedInteger(value: unknown, minimum: number, maximum: number, label: string): void {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum)
    throw new Error(`Invalid transfer ${label}`);
}

function assertExpansionRatio(plaintext: number, ciphertext: number, label: string): void {
  if (plaintext > ciphertext * TRANSFER_MAX_EXPANSION_RATIO) throw new Error(`Unsafe ${label} expansion ratio`);
}

function decodeCanonicalBase64Url(value: unknown, expectedBytes: number, label: string): Uint8Array {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error(`Malformed transfer ${label}`);
  const decoded = Uint8Array.from(Buffer.from(value, 'base64url'));
  if (decoded.length !== expectedBytes || Buffer.from(decoded).toString('base64url') !== value)
    throw new Error(`Malformed transfer ${label}`);
  return decoded;
}

function checkedAdd(current: number, addition: number, maximum: number, label: string): number {
  const total = current + addition;
  if (!Number.isSafeInteger(total) || total > maximum) throw new Error(`Transfer ${label} overflow`);
  return total;
}

function digest(bytes: Uint8Array): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function recoveryProtection(salt: Uint8Array): TransferRecoveryProtection {
  if (!(salt instanceof Uint8Array) || salt.length !== 16) throw new Error('WT-R1 salt must contain exactly 16 bytes');
  return {
    mode: 'recovery',
    kdf: 'Argon2id',
    argon2Version: 19,
    memoryKiB: 262_144,
    iterations: 3,
    parallelism: 1,
    keyBytes: 32,
    salt: Buffer.from(salt).toString('base64url'),
    cipher: 'XChaCha20-Poly1305',
  };
}

export function destinationProtection(recipientKeyFingerprint: `sha256:${string}`): TransferDestinationProtection {
  assertDigest(recipientKeyFingerprint, 'WT-D1 recipient key fingerprint');
  return {
    mode: 'destination-bound',
    hpkeMode: 'base',
    kem: 'DHKEM(X25519,HKDF-SHA256)',
    kdf: 'HKDF-SHA256',
    aead: 'ChaCha20-Poly1305',
    recipientKeyFingerprint,
  };
}

export function transferCiphertextDigest(ciphertext: Uint8Array): `sha256:${string}` {
  if (!(ciphertext instanceof Uint8Array)) throw new Error('Transfer ciphertext must be bytes');
  return digest(ciphertext);
}
