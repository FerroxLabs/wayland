/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  timingSafeEqual,
  verify,
  type KeyObject,
} from 'node:crypto';

import {
  TRANSFER_DESTINATION_SUITE,
  TRANSFER_RECOVERY_SUITE,
  type TransferContainerHeader,
  type TransferContainerTerminal,
} from '@process/services/transfer/container';
import type { TransferDigest, TransferFamilyExclusion } from '@process/services/transfer/export';
import type { LogicalStateId } from '@process/services/recovery/recoveryManifest';

import type { TransferPublicationContainerRecord, TransferSourceAuthorizationRecord } from './types';

export const TRANSFER_SOURCE_AUTHORIZATION_CONTRACT = 'wayland-transfer-source-authorization/1.0' as const;
export const TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM = 'Ed25519' as const;
export const TRANSFER_SOURCE_AUTHORIZATION_MAX_LIFETIME_MS = 15 * 60 * 1000;

const SHA256 = /^sha256:[0-9a-f]{64}$/;
const BUNDLE_ID = /^wtb1:[0-9a-f]{64}$/;
const EPOCH = /^[A-Za-z0-9._:-]{1,128}$/;
const MAX_AUTHORIZATION_BYTES = 16 * 1024;
const MAX_DER_BYTES = 512;
const ED25519_SIGNATURE_BYTES = 64;

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type TransferMutationEpoch = Readonly<{ start: string; end: string }>;

export type SourceSigningAuthorityDescriptor = Readonly<{
  algorithm: typeof TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM;
  publicKeyDer: string;
  publicKeyFingerprint: TransferDigest;
}>;

export class SourceSigningAuthority {
  readonly #privateKey: KeyObject;
  readonly #descriptor: SourceSigningAuthorityDescriptor;

  private constructor(privateKey: KeyObject, publicKey: KeyObject) {
    assertEd25519Key(privateKey, 'private');
    assertEd25519Key(publicKey, 'public');
    const publicDer = canonicalPublicDer(publicKey);
    const derivedPublicDer = canonicalPublicDer(createPublicKey(privateKey));
    if (!equalBytes(publicDer, derivedPublicDer)) {
      throw new Error('Transfer source signing key pair does not match');
    }
    this.#privateKey = privateKey;
    this.#descriptor = Object.freeze({
      algorithm: TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM,
      publicKeyDer: encodeBase64Url(publicDer),
      publicKeyFingerprint: digest(publicDer),
    });
  }

  static issue(): SourceSigningAuthority {
    const pair = generateKeyPairSync('ed25519');
    return new SourceSigningAuthority(pair.privateKey, pair.publicKey);
  }

  static fromPkcs8(privateKeyDer: string, expectedPublicKeyDer?: string): SourceSigningAuthority {
    const privateBytes = decodeCanonicalBase64Url(privateKeyDer, 1, MAX_DER_BYTES, 'private key');
    const privateKey = createPrivateKey({ key: privateBytes, format: 'der', type: 'pkcs8' });
    const canonicalPrivate = privateKey.export({ format: 'der', type: 'pkcs8' }) as Buffer;
    if (!equalBytes(canonicalPrivate, privateBytes)) {
      throw new Error('Transfer source private key DER is not canonical');
    }
    const publicKey = createPublicKey(privateKey);
    if (expectedPublicKeyDer) {
      const expected = parseCanonicalPublicKey(expectedPublicKeyDer);
      if (!equalBytes(canonicalPublicDer(publicKey), canonicalPublicDer(expected))) {
        throw new Error('Transfer source signing key pair does not match');
      }
    }
    return new SourceSigningAuthority(privateKey, publicKey);
  }

  descriptor(): SourceSigningAuthorityDescriptor {
    return Object.freeze({ ...this.#descriptor });
  }

  sign(payload: Uint8Array): string {
    if (!(payload instanceof Uint8Array) || payload.byteLength === 0 || payload.byteLength > MAX_AUTHORIZATION_BYTES) {
      throw new Error('Transfer source authorization payload is invalid');
    }
    return encodeBase64Url(sign(null, payload, this.#privateKey));
  }
}

type DestinationAuthorizationTarget = Readonly<{
  mode: 'destination';
  destinationKeyFingerprint: TransferDigest;
}>;

type RecoveryAuthorizationTarget = Readonly<{
  mode: 'recovery';
  recoveryMode: 'passphrase';
}>;

export type SourceAuthorizationTarget = DestinationAuthorizationTarget | RecoveryAuthorizationTarget;

export type SourceExportAuthorizationScope = Readonly<{
  bundleId: string;
  semanticGraphSha256: TransferDigest;
  selectedLogicalStateSha256: TransferDigest;
  exclusionsSha256: TransferDigest;
  mutationEpoch: TransferMutationEpoch;
}> &
  SourceAuthorizationTarget;

export type SourceExportAuthorizationInput = Readonly<{
  authority: SourceSigningAuthority;
  mutationEpoch: TransferMutationEpoch;
  expiresAt: number;
}>;

export type SourceAuthorizationValidationPolicy = Readonly<{
  trustedAuthority: SourceSigningAuthorityDescriptor;
  expectedScope: SourceExportAuthorizationScope;
  now?: () => number;
}>;

type TerminalOutcome = Readonly<{
  chunkCount: number;
  plaintextBytes: number;
  ciphertextBytes: number;
  streamDigest: TransferDigest;
}>;

type SourceAuthorizationPayload = Readonly<{
  contract: typeof TRANSFER_SOURCE_AUTHORIZATION_CONTRACT;
  bundleId: string;
  semanticGraphSha256: TransferDigest;
  selectedLogicalStateSha256: TransferDigest;
  exclusionsSha256: TransferDigest;
  mutationEpochSha256: TransferDigest;
  issuedAt: number;
  expiresAt: number;
  transcriptSha256: TransferDigest;
  terminalOutcome: TerminalOutcome;
}> &
  SourceAuthorizationTarget;

type SourceAuthorizationEnvelope = Readonly<{
  recordType: 'source-authorization';
  contract: typeof TRANSFER_SOURCE_AUTHORIZATION_CONTRACT;
  algorithm: typeof TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM;
  publicKeyDer: string;
  publicKeyFingerprint: TransferDigest;
  payload: SourceAuthorizationPayload;
  signature: string;
}>;

export function sourceScopeForGraph(
  semanticGraphSha256: TransferDigest,
  bundleId: string,
  selectedLogicalState: readonly LogicalStateId[],
  exclusions: readonly TransferFamilyExclusion[],
  mutationEpoch: TransferMutationEpoch,
  target: SourceAuthorizationTarget
): SourceExportAuthorizationScope {
  assertBundleSemanticBinding(bundleId, semanticGraphSha256);
  assertMutationEpoch(mutationEpoch);
  return Object.freeze({
    bundleId,
    semanticGraphSha256,
    selectedLogicalStateSha256: digestCanonical(selectedLogicalState as unknown as Json),
    exclusionsSha256: digestCanonical(exclusions as unknown as Json),
    mutationEpoch: Object.freeze({ ...mutationEpoch }),
    ...target,
  });
}

export function createSourceAuthorizationRecord(
  containerRecords: readonly TransferPublicationContainerRecord[],
  header: TransferContainerHeader,
  terminal: TransferContainerTerminal,
  scope: SourceExportAuthorizationScope,
  input: SourceExportAuthorizationInput,
  now: number
): TransferSourceAuthorizationRecord {
  assertAuthorizationUsableAt(now, input.expiresAt, now, true);
  assertMutationEpoch(input.mutationEpoch);
  if (
    digestCanonical(input.mutationEpoch as unknown as Json) !== digestCanonical(scope.mutationEpoch as unknown as Json)
  ) {
    throw new Error('Transfer source authorization mutation epoch mismatch');
  }
  assertScopeMatchesContainer(scope, header);
  const descriptor = input.authority.descriptor();
  const payload: SourceAuthorizationPayload = {
    contract: TRANSFER_SOURCE_AUTHORIZATION_CONTRACT,
    bundleId: scope.bundleId,
    semanticGraphSha256: scope.semanticGraphSha256,
    selectedLogicalStateSha256: scope.selectedLogicalStateSha256,
    exclusionsSha256: scope.exclusionsSha256,
    mutationEpochSha256: digestCanonical(scope.mutationEpoch as unknown as Json),
    ...targetFromScope(scope),
    issuedAt: now,
    expiresAt: input.expiresAt,
    transcriptSha256: publicationTranscriptDigest(containerRecords),
    terminalOutcome: terminalOutcome(terminal),
  };
  const payloadBytes = canonicalBytes(payload as unknown as Json);
  const envelope: SourceAuthorizationEnvelope = {
    recordType: 'source-authorization',
    contract: TRANSFER_SOURCE_AUTHORIZATION_CONTRACT,
    algorithm: TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM,
    publicKeyDer: descriptor.publicKeyDer,
    publicKeyFingerprint: descriptor.publicKeyFingerprint,
    payload,
    signature: input.authority.sign(payloadBytes),
  };
  return Object.freeze({ recordType: 'source-authorization', serialized: canonicalBytes(envelope as unknown as Json) });
}

export function verifySourceAuthorizationRecord(
  record: TransferSourceAuthorizationRecord,
  containerRecords: readonly TransferPublicationContainerRecord[],
  header: TransferContainerHeader,
  terminal: TransferContainerTerminal,
  policy: SourceAuthorizationValidationPolicy
): void {
  assertBytes(record.serialized, 'source authorization');
  if (record.serialized.byteLength === 0 || record.serialized.byteLength > MAX_AUTHORIZATION_BYTES) {
    throw new Error('Transfer source authorization exceeds bounds');
  }
  const text = new TextDecoder('utf-8', { fatal: true }).decode(record.serialized);
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Transfer source authorization is malformed');
  }
  const envelope = parseEnvelope(raw);
  if (canonicalJson(envelope as unknown as Json) !== text) {
    throw new Error('Transfer source authorization is not canonical');
  }
  assertTrustedAuthority(envelope, policy.trustedAuthority);
  const now = (policy.now ?? Date.now)();
  assertAuthorizationUsableAt(
    envelope.payload.issuedAt,
    envelope.payload.expiresAt,
    now,
    envelope.payload.mode === 'destination'
  );
  assertPayloadMatchesPolicy(envelope.payload, policy.expectedScope, header, terminal, containerRecords);
  const publicKey = parseCanonicalPublicKey(envelope.publicKeyDer);
  const signature = decodeCanonicalBase64Url(
    envelope.signature,
    ED25519_SIGNATURE_BYTES,
    ED25519_SIGNATURE_BYTES,
    'signature'
  );
  if (!verify(null, canonicalBytes(envelope.payload as unknown as Json), publicKey, signature)) {
    throw new Error('Transfer source authorization signature is invalid');
  }
}

export function publicationTranscriptDigest(records: readonly TransferPublicationContainerRecord[]): TransferDigest {
  const hash = createHash('sha256');
  hash.update(Buffer.from('wayland-transfer-publication-transcript/1\0', 'utf8'));
  for (const record of records) {
    hash.update(Buffer.from(record.recordType, 'utf8'));
    if (record.recordType === 'chunk') {
      updateFramed(hash, record.descriptor);
      updateFramed(hash, record.ciphertext);
    } else {
      updateFramed(hash, record.serialized);
    }
  }
  return `sha256:${hash.digest('hex')}`;
}

function parseEnvelope(value: unknown): SourceAuthorizationEnvelope {
  if (!isRecord(value)) throw new Error('Transfer source authorization is malformed');
  assertExactKeys(value, [
    'algorithm',
    'contract',
    'payload',
    'publicKeyDer',
    'publicKeyFingerprint',
    'recordType',
    'signature',
  ]);
  if (
    value.recordType !== 'source-authorization' ||
    value.contract !== TRANSFER_SOURCE_AUTHORIZATION_CONTRACT ||
    value.algorithm !== TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM ||
    typeof value.publicKeyDer !== 'string' ||
    typeof value.publicKeyFingerprint !== 'string' ||
    !SHA256.test(value.publicKeyFingerprint) ||
    typeof value.signature !== 'string'
  ) {
    throw new Error('Transfer source authorization is malformed');
  }
  return {
    recordType: value.recordType,
    contract: value.contract,
    algorithm: value.algorithm,
    publicKeyDer: value.publicKeyDer,
    publicKeyFingerprint: value.publicKeyFingerprint as TransferDigest,
    payload: parsePayload(value.payload),
    signature: value.signature,
  };
}

function parsePayload(value: unknown): SourceAuthorizationPayload {
  if (!isRecord(value)) throw new Error('Transfer source authorization payload is malformed');
  const mode = value.mode;
  assertExactKeys(
    value,
    mode === 'destination'
      ? [
          'bundleId',
          'contract',
          'destinationKeyFingerprint',
          'exclusionsSha256',
          'expiresAt',
          'issuedAt',
          'mode',
          'mutationEpochSha256',
          'selectedLogicalStateSha256',
          'semanticGraphSha256',
          'terminalOutcome',
          'transcriptSha256',
        ]
      : [
          'bundleId',
          'contract',
          'exclusionsSha256',
          'expiresAt',
          'issuedAt',
          'mode',
          'mutationEpochSha256',
          'recoveryMode',
          'selectedLogicalStateSha256',
          'semanticGraphSha256',
          'terminalOutcome',
          'transcriptSha256',
        ]
  );
  if (
    value.contract !== TRANSFER_SOURCE_AUTHORIZATION_CONTRACT ||
    typeof value.bundleId !== 'string' ||
    !BUNDLE_ID.test(value.bundleId) ||
    !isDigest(value.semanticGraphSha256) ||
    !isDigest(value.selectedLogicalStateSha256) ||
    !isDigest(value.exclusionsSha256) ||
    !isDigest(value.mutationEpochSha256) ||
    !Number.isSafeInteger(value.issuedAt) ||
    !Number.isSafeInteger(value.expiresAt) ||
    !isDigest(value.transcriptSha256)
  ) {
    throw new Error('Transfer source authorization payload is malformed');
  }
  const terminalOutcomeValue = parseTerminalOutcome(value.terminalOutcome);
  const common = {
    contract: value.contract,
    bundleId: value.bundleId,
    semanticGraphSha256: value.semanticGraphSha256,
    selectedLogicalStateSha256: value.selectedLogicalStateSha256,
    exclusionsSha256: value.exclusionsSha256,
    mutationEpochSha256: value.mutationEpochSha256,
    issuedAt: value.issuedAt as number,
    expiresAt: value.expiresAt as number,
    transcriptSha256: value.transcriptSha256,
    terminalOutcome: terminalOutcomeValue,
  } as const;
  if (mode === 'destination' && isDigest(value.destinationKeyFingerprint)) {
    return { ...common, mode, destinationKeyFingerprint: value.destinationKeyFingerprint };
  }
  if (mode === 'recovery' && value.recoveryMode === 'passphrase') {
    return { ...common, mode, recoveryMode: value.recoveryMode };
  }
  throw new Error('Transfer source authorization target is malformed');
}

function parseTerminalOutcome(value: unknown): TerminalOutcome {
  if (!isRecord(value)) throw new Error('Transfer source authorization terminal outcome is malformed');
  assertExactKeys(value, ['chunkCount', 'ciphertextBytes', 'plaintextBytes', 'streamDigest']);
  if (
    !Number.isSafeInteger(value.chunkCount) ||
    !Number.isSafeInteger(value.plaintextBytes) ||
    !Number.isSafeInteger(value.ciphertextBytes) ||
    !isDigest(value.streamDigest)
  ) {
    throw new Error('Transfer source authorization terminal outcome is malformed');
  }
  return {
    chunkCount: value.chunkCount as number,
    plaintextBytes: value.plaintextBytes as number,
    ciphertextBytes: value.ciphertextBytes as number,
    streamDigest: value.streamDigest,
  };
}

function assertPayloadMatchesPolicy(
  payload: SourceAuthorizationPayload,
  scope: SourceExportAuthorizationScope,
  header: TransferContainerHeader,
  terminal: TransferContainerTerminal,
  records: readonly TransferPublicationContainerRecord[]
): void {
  assertScopeMatchesContainer(scope, header);
  assertMutationEpoch(scope.mutationEpoch);
  assertBundleSemanticBinding(payload.bundleId, payload.semanticGraphSha256);
  const actual = canonicalJson(payload as unknown as Json);
  const expected = canonicalJson({
    contract: TRANSFER_SOURCE_AUTHORIZATION_CONTRACT,
    bundleId: scope.bundleId,
    semanticGraphSha256: scope.semanticGraphSha256,
    selectedLogicalStateSha256: scope.selectedLogicalStateSha256,
    exclusionsSha256: scope.exclusionsSha256,
    mutationEpochSha256: digestCanonical(scope.mutationEpoch as unknown as Json),
    ...targetFromScope(scope),
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
    transcriptSha256: publicationTranscriptDigest(records),
    terminalOutcome: terminalOutcome(terminal) as unknown as Json,
  } as unknown as Json);
  if (actual !== expected) throw new Error('Transfer source authorization scope or transcript mismatch');
}

function assertTrustedAuthority(
  envelope: SourceAuthorizationEnvelope,
  trusted: SourceSigningAuthorityDescriptor
): void {
  if (
    trusted.algorithm !== TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM ||
    !isDigest(trusted.publicKeyFingerprint) ||
    envelope.publicKeyFingerprint !== trusted.publicKeyFingerprint ||
    envelope.publicKeyDer !== trusted.publicKeyDer
  ) {
    throw new Error('Transfer source signing authority is not trusted');
  }
  const publicKey = parseCanonicalPublicKey(envelope.publicKeyDer);
  if (digest(canonicalPublicDer(publicKey)) !== envelope.publicKeyFingerprint) {
    throw new Error('Transfer source public key fingerprint mismatch');
  }
}

function assertScopeMatchesContainer(scope: SourceExportAuthorizationScope, header: TransferContainerHeader): void {
  if (scope.bundleId !== header.bundleId) throw new Error('Transfer source authorization bundle mismatch');
  assertBundleSemanticBinding(scope.bundleId, scope.semanticGraphSha256);
  if (header.suite === TRANSFER_DESTINATION_SUITE) {
    if (scope.mode !== 'destination' || scope.destinationKeyFingerprint !== header.protection.recipientKeyFingerprint) {
      throw new Error('Transfer source authorization destination mismatch');
    }
    return;
  }
  if (header.suite !== TRANSFER_RECOVERY_SUITE || scope.mode !== 'recovery' || scope.recoveryMode !== 'passphrase') {
    throw new Error('Transfer source authorization recovery mode mismatch');
  }
}

function assertBundleSemanticBinding(bundleId: string, semanticGraphSha256: TransferDigest): void {
  if (!BUNDLE_ID.test(bundleId) || !SHA256.test(semanticGraphSha256)) {
    throw new Error('Transfer source authorization graph binding is malformed');
  }
  if (bundleId.slice('wtb1:'.length) !== semanticGraphSha256.slice('sha256:'.length)) {
    throw new Error('Transfer source authorization graph binding mismatch');
  }
}

function assertAuthorizationUsableAt(
  issuedAt: number,
  expiresAt: number,
  now: number,
  requireCurrentlyFresh: boolean
): void {
  if (
    !Number.isSafeInteger(issuedAt) ||
    !Number.isSafeInteger(expiresAt) ||
    !Number.isSafeInteger(now) ||
    issuedAt < 0 ||
    expiresAt < 0 ||
    now < 0
  ) {
    throw new Error('Transfer source authorization window is invalid');
  }
  const lifetime = expiresAt - issuedAt;
  if (lifetime <= 0 || lifetime > TRANSFER_SOURCE_AUTHORIZATION_MAX_LIFETIME_MS) {
    throw new Error('Transfer source authorization window exceeds 15 minutes');
  }
  if (issuedAt > now) throw new Error('Transfer source authorization was issued in the future');
  if (requireCurrentlyFresh && expiresAt <= now) {
    throw new Error('Transfer source authorization is expired');
  }
}

function assertMutationEpoch(epoch: { start: unknown; end: unknown }): void {
  if (
    typeof epoch.start !== 'string' ||
    typeof epoch.end !== 'string' ||
    !EPOCH.test(epoch.start) ||
    !EPOCH.test(epoch.end)
  ) {
    throw new Error('Transfer source authorization mutation epoch is malformed');
  }
  if (epoch.start !== epoch.end) throw new Error('Transfer source authorization mutation epoch drift');
}

function terminalOutcome(terminal: TransferContainerTerminal): TerminalOutcome {
  return {
    chunkCount: terminal.chunkCount,
    plaintextBytes: terminal.plaintextBytes,
    ciphertextBytes: terminal.ciphertextBytes,
    streamDigest: terminal.streamDigest,
  };
}

function targetFromScope(scope: SourceExportAuthorizationScope): SourceAuthorizationTarget {
  return scope.mode === 'destination'
    ? { mode: scope.mode, destinationKeyFingerprint: scope.destinationKeyFingerprint }
    : { mode: scope.mode, recoveryMode: scope.recoveryMode };
}

function canonicalBytes(value: Json): Uint8Array {
  return Buffer.from(canonicalJson(value), 'utf8');
}

function canonicalJson(value: Json): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value)
    .toSorted()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(',')}}`;
}

function digestCanonical(value: Json): TransferDigest {
  return digest(canonicalBytes(value));
}

function digest(bytes: Uint8Array): TransferDigest {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function updateFramed(hash: ReturnType<typeof createHash>, bytes: Uint8Array): void {
  assertBytes(bytes, 'transcript record');
  const length = Buffer.allocUnsafe(4);
  length.writeUInt32BE(bytes.byteLength);
  hash.update(length);
  hash.update(bytes);
}

function parseCanonicalPublicKey(value: string): KeyObject {
  const bytes = decodeCanonicalBase64Url(value, 1, MAX_DER_BYTES, 'public key');
  const key = createPublicKey({ key: bytes, format: 'der', type: 'spki' });
  assertEd25519Key(key, 'public');
  if (!equalBytes(canonicalPublicDer(key), bytes)) {
    throw new Error('Transfer source public key DER is not canonical');
  }
  return key;
}

function canonicalPublicDer(key: KeyObject): Buffer {
  return key.export({ format: 'der', type: 'spki' }) as Buffer;
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && timingSafeEqual(left, right);
}

function assertEd25519Key(key: KeyObject, type: 'private' | 'public'): void {
  if (key.type !== type || key.asymmetricKeyType !== 'ed25519') {
    throw new Error(`Transfer source ${type} key must be Ed25519`);
  }
}

function encodeBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function decodeCanonicalBase64Url(value: string, minimumBytes: number, maximumBytes: number, label: string): Buffer {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error(`Transfer source ${label} is malformed`);
  const bytes = Buffer.from(value, 'base64url');
  if (bytes.byteLength < minimumBytes || bytes.byteLength > maximumBytes || bytes.toString('base64url') !== value) {
    throw new Error(`Transfer source ${label} is malformed`);
  }
  return bytes;
}

function isDigest(value: unknown): value is TransferDigest {
  return typeof value === 'string' && SHA256.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[]): void {
  if (canonicalJson(Object.keys(value).toSorted() as unknown as Json) !== canonicalJson([...expected].toSorted())) {
    throw new Error('Transfer source authorization contains unknown or missing critical fields');
  }
}

function assertBytes(bytes: Uint8Array, label: string): void {
  if (!(bytes instanceof Uint8Array)) throw new Error(`Transfer ${label} must be bytes`);
  if (typeof SharedArrayBuffer !== 'undefined' && bytes.buffer instanceof SharedArrayBuffer) {
    throw new Error(`Transfer ${label} cannot use shared mutable memory`);
  }
}
