/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, createPublicKey, sign, timingSafeEqual, verify, type KeyObject } from 'node:crypto';

import type { CohortBaselineService } from '../CohortBaselineService';
import {
  M0B_ACCESSIBILITY_SEVERITIES,
  M0B_COHORTS,
  M0B_SCHEMA_VERSION,
  M0B_SHELLS,
  M0B_SUPPORT_CATEGORIES,
  type M0BAccessibilitySeverity,
  type M0BCohort,
  type M0BCohortEvent,
  type M0BShell,
  type M0BSupportCategory,
} from '../types';

export const OBSERVATION_INCIDENT_CONTRACT = 'wayland-desktop-m0b-observation/1' as const;
export const OBSERVATION_INCIDENT_ALGORITHM = 'Ed25519' as const;

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type Digest = `sha256:${string}`;

const SHA256 = /^sha256:[0-9a-f]{64}$/;
const CANONICAL_BASE64URL = /^[A-Za-z0-9_-]+$/;
const IDENTIFIER = /^[A-Za-z0-9._:-]{1,128}$/;
const OPAQUE_ID = /^[A-Za-z0-9_-]{8,128}$/;
const PARTICIPANT_HASH = /^[a-f0-9]{16,128}$/;
const NONCE = /^[A-Za-z0-9_-]{16,128}$/;
const APP_VERSION = /^[0-9A-Za-z][0-9A-Za-z.+_-]{0,63}$/;
const MAX_ENVELOPE_BYTES = 16 * 1024;
const MAX_PUBLIC_KEY_DER_BYTES = 512;
const ED25519_SIGNATURE_BYTES = 64;
const MAX_TRUSTED_KEYS = 8;

/** The two real, terminal-bound usability incidents an observation can carry. */
export type ObservationIncident =
  | Readonly<{ kind: 'support_contact'; category: M0BSupportCategory }>
  | Readonly<{ kind: 'accessibility_violation'; severity: M0BAccessibilitySeverity }>;

export type ObservationIncidentPayload = Readonly<{
  schemaVersion: typeof M0B_SCHEMA_VERSION;
  protocolDigest: Digest;
  candidateCommit: Digest;
  candidateTree: Digest;
  appVersion: string;
  installParticipantHash: string;
  participantIdHash: string;
  sessionId: string;
  windowStartMs: number;
  windowEndMs: number;
  occurredAtMs: number;
  cohort: M0BCohort;
  shell: M0BShell;
  terminalBinding: string;
  incident: ObservationIncident;
  signerKeyId: string;
  nonce: string;
}>;

export type ObservationTrustedPublicKey = Readonly<{
  keyId: string;
  algorithm: typeof OBSERVATION_INCIDENT_ALGORITHM;
  publicKeyDer: string;
  publicKeyFingerprint: Digest;
}>;

export type ObservationSigningAuthority = Readonly<{
  keyId: string;
  privateKey: KeyObject;
}>;

export type ObservationIncidentExpectedScope = Readonly<{
  protocolDigest: Digest;
  candidateCommit: Digest;
  candidateTree: Digest;
  appVersion: string;
  installParticipantHash: string;
  window: Readonly<{ startMs: number; endMs: number }>;
  cohort: M0BCohort;
  shell: M0BShell;
}>;

export type ObservationIncidentPolicy = Readonly<{
  expected: ObservationIncidentExpectedScope;
  trustedPublicKeys: readonly ObservationTrustedPublicKey[];
}>;

export type ObservationIngestOutcome =
  | Readonly<{ status: 'admitted'; kind: ObservationIncident['kind']; eventId: string }>
  | Readonly<{
      status: 'denied';
      reason:
        | 'invalid-policy'
        | 'malformed-envelope'
        | 'untrusted-signer'
        | 'invalid-signature'
        | 'protocol-mismatch'
        | 'candidate-mismatch'
        | 'install-mismatch'
        | 'window-mismatch'
        | 'scope-mismatch'
        | 'out-of-window'
        | 'replayed'
        | 'storage-denied';
    }>;

type ObservationEnvelope = Readonly<{
  recordType: 'cohort-usability-observation';
  contract: typeof OBSERVATION_INCIDENT_CONTRACT;
  algorithm: typeof OBSERVATION_INCIDENT_ALGORITHM;
  keyId: string;
  publicKeyFingerprint: Digest;
  payload: ObservationIncidentPayload;
  signature: string;
}>;

/**
 * A source of immutable signed structured-observation envelopes awaiting
 * admission. The ingestor never mints an incident from renderer prose, a bug
 * report, an `openExternal`, macOS Accessibility permission state, or a generic
 * error; the only admissible input is a signed envelope produced under the
 * protocol.
 */
export interface ObservationEnvelopeSource {
  list(): Promise<readonly Uint8Array[]>;
}

/**
 * The authenticated observer authority for the two REAL usability incidents:
 * support contact and accessibility violation. Every candidate is an immutable
 * signed envelope verified against the protocol-bound trusted key set; a missing
 * or mismatched protocol digest, candidate identity, install participant hash,
 * session, window, category/severity, or terminal binding, an unknown signer, or
 * a replayed `(protocol_digest, signer_key_id, nonce)` fails closed WITHOUT
 * emitting evidence. Admission goes through {@link CohortBaselineService.record},
 * whose append-only repository publishes each incident under a deterministic
 * event id derived from `(protocol_digest, signer_key_id, nonce)`, so a restart
 * or replay cannot mint a second incident and conflicting reuse of the tuple
 * fails closed.
 */
export class CohortObservationIncidentIngestor {
  private readonly service: CohortBaselineService;
  private readonly policy: ObservationIncidentPolicy;
  private readonly source: ObservationEnvelopeSource | undefined;

  constructor(
    input: Readonly<{
      service: CohortBaselineService;
      policy: ObservationIncidentPolicy;
      source?: ObservationEnvelopeSource;
    }>
  ) {
    this.service = input.service;
    this.policy = input.policy;
    this.source = input.source;
  }

  /** Drain every pending signed envelope. Best-effort: one denial never blocks the rest. */
  async ingestPending(): Promise<void> {
    if (!this.source) return;
    let envelopes: readonly Uint8Array[];
    try {
      envelopes = await this.source.list();
    } catch {
      return;
    }
    for (const bytes of envelopes) {
      try {
        // Sequential by design: each admission is a single atomic append to the
        // shared append-only repository, and the `(digest, key, nonce)` replay
        // guard depends on ordered publication, not parallel racing.
        // eslint-disable-next-line no-await-in-loop
        await this.ingest(bytes);
      } catch {
        // A single malformed or hostile envelope must never abort the drain.
      }
    }
  }

  /** Verify and, if authentic and unreplayed, admit exactly one observation incident. */
  async ingest(bytes: unknown): Promise<ObservationIngestOutcome> {
    let policy: ObservationIncidentPolicy;
    try {
      policy = parsePolicy(this.policy);
    } catch {
      return denied('invalid-policy');
    }

    let envelope: ObservationEnvelope;
    try {
      envelope = parseCanonicalEnvelope(bytes);
    } catch {
      return denied('malformed-envelope');
    }

    const trusted = policy.trustedPublicKeys.find((descriptor) => descriptor.keyId === envelope.keyId);
    if (
      !trusted ||
      trusted.publicKeyFingerprint !== envelope.publicKeyFingerprint ||
      envelope.payload.signerKeyId !== envelope.keyId
    ) {
      return denied('untrusted-signer');
    }

    let publicKey: KeyObject;
    try {
      publicKey = parseTrustedPublicKey(trusted);
    } catch {
      return denied('invalid-policy');
    }
    const signature = decodeCanonicalBase64Url(envelope.signature, ED25519_SIGNATURE_BYTES, ED25519_SIGNATURE_BYTES);
    if (!signature || !verify(null, canonicalBytes(envelope.payload as unknown as Json), publicKey, signature)) {
      return denied('invalid-signature');
    }

    const { payload } = envelope;
    const { expected } = policy;
    if (payload.protocolDigest !== expected.protocolDigest) return denied('protocol-mismatch');
    if (payload.candidateCommit !== expected.candidateCommit || payload.candidateTree !== expected.candidateTree) {
      return denied('candidate-mismatch');
    }
    if (payload.installParticipantHash !== expected.installParticipantHash) return denied('install-mismatch');
    if (payload.windowStartMs !== expected.window.startMs || payload.windowEndMs !== expected.window.endMs) {
      return denied('window-mismatch');
    }
    if (payload.appVersion !== expected.appVersion || payload.cohort !== expected.cohort || payload.shell !== expected.shell) {
      return denied('scope-mismatch');
    }
    if (payload.occurredAtMs < payload.windowStartMs || payload.occurredAtMs >= payload.windowEndMs) {
      return denied('out-of-window');
    }

    const event = this.toEvent(payload);
    const result = await this.service.record(event);
    if (result.status === 'recorded') {
      return Object.freeze({ status: 'admitted' as const, kind: payload.incident.kind, eventId: event.eventId });
    }
    // A conflicting `(protocol_digest, signer_key_id, nonce)` reuse collides on
    // the deterministic event id with different content: the append-only
    // repository rejects it and record() surfaces a storage error. A replay of
    // the identical envelope publishes the same immutable event once, so the
    // aggregate never double-counts. Either way, no NEW evidence is minted here.
    return denied(result.status === 'storage_error' ? 'replayed' : 'storage-denied');
  }

  /**
   * Deterministic event identity binds the incident to
   * `(protocol_digest, signer_key_id, nonce)`. The append-only repository's
   * atomic publish under this id is the replay/restart guard.
   */
  private toEvent(payload: ObservationIncidentPayload): M0BCohortEvent {
    const eventId = createHash('sha256')
      .update(`wayland-m0b-observation-incident/1\0${payload.protocolDigest}\0${payload.signerKeyId}\0${payload.nonce}`)
      .digest('hex');
    const base = {
      schemaVersion: M0B_SCHEMA_VERSION,
      eventId,
      participantIdHash: payload.participantIdHash,
      sessionId: payload.sessionId,
      occurredAtMs: payload.occurredAtMs,
      cohort: payload.cohort,
      shell: payload.shell,
    } as const;
    return payload.incident.kind === 'support_contact'
      ? { ...base, kind: 'support_contact', category: payload.incident.category }
      : { ...base, kind: 'accessibility_violation', severity: payload.incident.severity };
  }
}

/**
 * Produce the public descriptor that observation policy must trust explicitly.
 * The descriptor contains no private material.
 */
export function describeObservationPublicKey(keyId: string, publicKey: KeyObject): ObservationTrustedPublicKey {
  assertIdentifier(keyId);
  assertEd25519Key(publicKey, 'public');
  const publicKeyBytes = canonicalPublicDer(publicKey);
  return Object.freeze({
    keyId,
    algorithm: OBSERVATION_INCIDENT_ALGORITHM,
    publicKeyDer: encodeBase64Url(publicKeyBytes),
    publicKeyFingerprint: digest(publicKeyBytes),
  });
}

/**
 * Sign one structured observation incident. Possession of any key is
 * insufficient: the ingestor accepts only an explicitly trusted descriptor.
 */
export function issueObservationIncident(
  payloadInput: ObservationIncidentPayload,
  authority: ObservationSigningAuthority
): Uint8Array {
  const payload = parsePayload(payloadInput);
  assertIdentifier(authority.keyId);
  assertEd25519Key(authority.privateKey, 'private');
  if (payload.signerKeyId !== authority.keyId) throw new Error('signer mismatch');

  const publicKey = createPublicKey(authority.privateKey);
  const descriptor = describeObservationPublicKey(authority.keyId, publicKey);
  const envelope: ObservationEnvelope = {
    recordType: 'cohort-usability-observation',
    contract: OBSERVATION_INCIDENT_CONTRACT,
    algorithm: OBSERVATION_INCIDENT_ALGORITHM,
    keyId: descriptor.keyId,
    publicKeyFingerprint: descriptor.publicKeyFingerprint,
    payload,
    signature: encodeBase64Url(sign(null, canonicalBytes(payload as unknown as Json), authority.privateKey)),
  };
  return canonicalBytes(envelope as unknown as Json);
}

function parseCanonicalEnvelope(receipt: unknown): ObservationEnvelope {
  assertImmutableBytes(receipt);
  if (receipt.byteLength === 0 || receipt.byteLength > MAX_ENVELOPE_BYTES) throw new Error('envelope bounds');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(receipt);
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('envelope JSON');
  }
  const envelope = parseEnvelope(raw);
  if (canonicalJson(envelope as unknown as Json) !== text) throw new Error('envelope canonicalization');
  return envelope;
}

function parseEnvelope(value: unknown): ObservationEnvelope {
  if (!isRecord(value)) throw new Error('envelope');
  assertExactKeys(value, ['algorithm', 'contract', 'keyId', 'payload', 'publicKeyFingerprint', 'recordType', 'signature']);
  if (
    value.recordType !== 'cohort-usability-observation' ||
    value.contract !== OBSERVATION_INCIDENT_CONTRACT ||
    value.algorithm !== OBSERVATION_INCIDENT_ALGORITHM ||
    typeof value.keyId !== 'string' ||
    !IDENTIFIER.test(value.keyId) ||
    !isDigest(value.publicKeyFingerprint) ||
    typeof value.signature !== 'string' ||
    !decodeCanonicalBase64Url(value.signature, ED25519_SIGNATURE_BYTES, ED25519_SIGNATURE_BYTES)
  ) {
    throw new Error('envelope fields');
  }
  return {
    recordType: value.recordType,
    contract: value.contract,
    algorithm: value.algorithm,
    keyId: value.keyId,
    publicKeyFingerprint: value.publicKeyFingerprint,
    payload: parsePayload(value.payload),
    signature: value.signature,
  };
}

function parsePayload(value: unknown): ObservationIncidentPayload {
  if (!isRecord(value)) throw new Error('payload');
  assertExactKeys(value, [
    'appVersion',
    'candidateCommit',
    'candidateTree',
    'cohort',
    'incident',
    'installParticipantHash',
    'nonce',
    'occurredAtMs',
    'participantIdHash',
    'protocolDigest',
    'schemaVersion',
    'sessionId',
    'shell',
    'signerKeyId',
    'terminalBinding',
    'windowStartMs',
    'windowEndMs',
  ]);
  if (
    value.schemaVersion !== M0B_SCHEMA_VERSION ||
    !isDigest(value.protocolDigest) ||
    !isDigest(value.candidateCommit) ||
    !isDigest(value.candidateTree) ||
    typeof value.appVersion !== 'string' ||
    !APP_VERSION.test(value.appVersion) ||
    typeof value.installParticipantHash !== 'string' ||
    !PARTICIPANT_HASH.test(value.installParticipantHash) ||
    typeof value.participantIdHash !== 'string' ||
    !PARTICIPANT_HASH.test(value.participantIdHash) ||
    typeof value.sessionId !== 'string' ||
    !OPAQUE_ID.test(value.sessionId) ||
    !isTimestamp(value.windowStartMs) ||
    !isTimestamp(value.windowEndMs) ||
    !isTimestamp(value.occurredAtMs) ||
    !isCohort(value.cohort) ||
    !isShell(value.shell) ||
    typeof value.terminalBinding !== 'string' ||
    !OPAQUE_ID.test(value.terminalBinding) ||
    typeof value.signerKeyId !== 'string' ||
    !IDENTIFIER.test(value.signerKeyId) ||
    typeof value.nonce !== 'string' ||
    !NONCE.test(value.nonce)
  ) {
    throw new Error('payload fields');
  }
  if (value.windowEndMs <= value.windowStartMs) throw new Error('payload window');
  return Object.freeze({
    schemaVersion: value.schemaVersion,
    protocolDigest: value.protocolDigest,
    candidateCommit: value.candidateCommit,
    candidateTree: value.candidateTree,
    appVersion: value.appVersion,
    installParticipantHash: value.installParticipantHash,
    participantIdHash: value.participantIdHash,
    sessionId: value.sessionId,
    windowStartMs: value.windowStartMs,
    windowEndMs: value.windowEndMs,
    occurredAtMs: value.occurredAtMs,
    cohort: value.cohort,
    shell: value.shell,
    terminalBinding: value.terminalBinding,
    incident: parseIncident(value.incident),
    signerKeyId: value.signerKeyId,
    nonce: value.nonce,
  });
}

function parseIncident(value: unknown): ObservationIncident {
  if (!isRecord(value)) throw new Error('incident');
  if (value.kind === 'support_contact') {
    assertExactKeys(value, ['category', 'kind']);
    if (!isSupportCategory(value.category)) throw new Error('incident category');
    return Object.freeze({ kind: 'support_contact', category: value.category });
  }
  if (value.kind === 'accessibility_violation') {
    assertExactKeys(value, ['kind', 'severity']);
    if (!isAccessibilitySeverity(value.severity)) throw new Error('incident severity');
    return Object.freeze({ kind: 'accessibility_violation', severity: value.severity });
  }
  throw new Error('incident kind');
}

function parsePolicy(value: ObservationIncidentPolicy): ObservationIncidentPolicy {
  const expected = parseExpectedScope(value.expected);
  if (!Array.isArray(value.trustedPublicKeys) || value.trustedPublicKeys.length === 0) throw new Error('trusted keys');
  if (value.trustedPublicKeys.length > MAX_TRUSTED_KEYS) throw new Error('trusted key count');
  const trustedPublicKeys = value.trustedPublicKeys.map(parseTrustedDescriptor);
  if (
    new Set(trustedPublicKeys.map((descriptor) => descriptor.keyId)).size !== trustedPublicKeys.length ||
    new Set(trustedPublicKeys.map((descriptor) => descriptor.publicKeyFingerprint)).size !== trustedPublicKeys.length
  ) {
    throw new Error('duplicate trusted key');
  }
  trustedPublicKeys.forEach(parseTrustedPublicKey);
  return Object.freeze({ expected, trustedPublicKeys: Object.freeze(trustedPublicKeys) });
}

function parseExpectedScope(value: unknown): ObservationIncidentExpectedScope {
  if (!isRecord(value)) throw new Error('expected scope');
  if (
    !isDigest(value.protocolDigest) ||
    !isDigest(value.candidateCommit) ||
    !isDigest(value.candidateTree) ||
    typeof value.appVersion !== 'string' ||
    !APP_VERSION.test(value.appVersion) ||
    typeof value.installParticipantHash !== 'string' ||
    !PARTICIPANT_HASH.test(value.installParticipantHash) ||
    !isRecord(value.window) ||
    !isTimestamp(value.window.startMs) ||
    !isTimestamp(value.window.endMs) ||
    value.window.endMs <= value.window.startMs ||
    !isCohort(value.cohort) ||
    !isShell(value.shell)
  ) {
    throw new Error('expected scope fields');
  }
  return Object.freeze({
    protocolDigest: value.protocolDigest,
    candidateCommit: value.candidateCommit,
    candidateTree: value.candidateTree,
    appVersion: value.appVersion,
    installParticipantHash: value.installParticipantHash,
    window: Object.freeze({ startMs: value.window.startMs, endMs: value.window.endMs }),
    cohort: value.cohort,
    shell: value.shell,
  });
}

function parseTrustedDescriptor(value: unknown): ObservationTrustedPublicKey {
  if (!isRecord(value)) throw new Error('trusted key');
  assertExactKeys(value, ['algorithm', 'keyId', 'publicKeyDer', 'publicKeyFingerprint']);
  if (
    value.algorithm !== OBSERVATION_INCIDENT_ALGORITHM ||
    typeof value.keyId !== 'string' ||
    !IDENTIFIER.test(value.keyId) ||
    typeof value.publicKeyDer !== 'string' ||
    !isDigest(value.publicKeyFingerprint)
  ) {
    throw new Error('trusted key fields');
  }
  return Object.freeze({
    keyId: value.keyId,
    algorithm: value.algorithm,
    publicKeyDer: value.publicKeyDer,
    publicKeyFingerprint: value.publicKeyFingerprint,
  });
}

function parseTrustedPublicKey(descriptor: ObservationTrustedPublicKey): KeyObject {
  const bytes = decodeCanonicalBase64Url(descriptor.publicKeyDer, 1, MAX_PUBLIC_KEY_DER_BYTES);
  if (!bytes) throw new Error('public key');
  const key = createPublicKey({ key: bytes, format: 'der', type: 'spki' });
  assertEd25519Key(key, 'public');
  const canonical = canonicalPublicDer(key);
  if (!equalBytes(canonical, bytes) || digest(canonical) !== descriptor.publicKeyFingerprint) {
    throw new Error('public key descriptor mismatch');
  }
  return key;
}

function denied(reason: Extract<ObservationIngestOutcome, { status: 'denied' }>['reason']): ObservationIngestOutcome {
  return Object.freeze({ status: 'denied' as const, reason });
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

function digest(bytes: Uint8Array): Digest {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function canonicalPublicDer(key: KeyObject): Buffer {
  return key.export({ format: 'der', type: 'spki' }) as Buffer;
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && timingSafeEqual(left, right);
}

function assertEd25519Key(key: KeyObject, type: 'private' | 'public'): void {
  if (key.type !== type || key.asymmetricKeyType !== 'ed25519') throw new Error(`${type} key must be Ed25519`);
}

function encodeBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function decodeCanonicalBase64Url(value: string, minimumBytes: number, maximumBytes: number): Buffer | null {
  if (!CANONICAL_BASE64URL.test(value)) return null;
  const bytes = Buffer.from(value, 'base64url');
  if (bytes.byteLength < minimumBytes || bytes.byteLength > maximumBytes || bytes.toString('base64url') !== value) {
    return null;
  }
  return bytes;
}

function assertIdentifier(value: string): void {
  if (!IDENTIFIER.test(value)) throw new Error('identifier is invalid');
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[]): void {
  const actual = Object.keys(value).toSorted();
  const wanted = [...expected].toSorted();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error('unknown or missing critical fields');
  }
}

function assertImmutableBytes(value: unknown): asserts value is Uint8Array {
  if (!(value instanceof Uint8Array)) throw new Error('envelope bytes');
  if (typeof SharedArrayBuffer !== 'undefined' && value.buffer instanceof SharedArrayBuffer) {
    throw new Error('shared mutable envelope');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isDigest(value: unknown): value is Digest {
  return typeof value === 'string' && SHA256.test(value);
}

function isCohort(value: unknown): value is M0BCohort {
  return M0B_COHORTS.includes(value as M0BCohort);
}

function isShell(value: unknown): value is M0BShell {
  return (M0B_SHELLS as readonly string[]).includes(value as M0BShell);
}

function isSupportCategory(value: unknown): value is M0BSupportCategory {
  return (M0B_SUPPORT_CATEGORIES as readonly string[]).includes(value as M0BSupportCategory);
}

function isAccessibilitySeverity(value: unknown): value is M0BAccessibilitySeverity {
  return (M0B_ACCESSIBILITY_SEVERITIES as readonly string[]).includes(value as M0BAccessibilitySeverity);
}
