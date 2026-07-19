/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, createPublicKey, sign, timingSafeEqual, verify, type KeyObject } from 'node:crypto';

import type { WaylandReleaseTrack } from '@/common/releaseTrack';

import { M0B_COHORTS, type M0BCohort } from './types';

export const COHORT_ROLLOUT_CONTRACT = 'wayland-desktop-cohort-rollout/1.0' as const;
export const COHORT_ROLLOUT_SCHEMA_VERSION = 1 as const;
export const COHORT_ROLLOUT_ALGORITHM = 'Ed25519' as const;
export const COHORT_ROLLOUT_MAX_RECEIPT_LIFETIME_MS = 24 * 60 * 60 * 1000;
export const COHORT_ROLLOUT_MAX_BASELINE_WINDOW_MS = 31 * 24 * 60 * 60 * 1000;

export const COHORT_ROLLOUT_STAGES = ['internal-dogfood', 'invited-alpha', 'opt-in-beta', 'default-new'] as const;
export type CohortRolloutStage = (typeof COHORT_ROLLOUT_STAGES)[number];

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type Digest = `sha256:${string}`;

export type CohortRolloutWindow = Readonly<{
  startMs: number;
  endMs: number;
}>;

export type CohortRolloutAuthorizationPayload = Readonly<{
  schemaVersion: typeof COHORT_ROLLOUT_SCHEMA_VERSION;
  appVersion: string;
  releaseTrack: WaylandReleaseTrack;
  previousStage: CohortRolloutStage | null;
  stage: CohortRolloutStage;
  cohort: M0BCohort;
  window: CohortRolloutWindow;
  baselineAggregateDigest: Digest;
  issuedAt: number;
  expiresAt: number;
  decisionOwner: string;
}>;

export type CohortRolloutTrustedPublicKey = Readonly<{
  keyId: string;
  algorithm: typeof COHORT_ROLLOUT_ALGORITHM;
  publicKeyDer: string;
  publicKeyFingerprint: Digest;
}>;

export type CohortRolloutSigningAuthority = Readonly<{
  keyId: string;
  privateKey: KeyObject;
}>;

export type CohortRolloutExpectedScope = Readonly<{
  appVersion: string;
  releaseTrack: WaylandReleaseTrack;
  currentStage: CohortRolloutStage | null;
  stage: CohortRolloutStage;
  cohort: M0BCohort;
  window: CohortRolloutWindow;
  baselineAggregateDigest: Digest;
  decisionOwner: string;
}>;

export type CohortRolloutVerificationPolicy = Readonly<{
  expected: CohortRolloutExpectedScope;
  trustedPublicKeys: readonly CohortRolloutTrustedPublicKey[];
}>;

export type CohortRolloutEligibilityDecision =
  | Readonly<{
      eligible: true;
      stage: CohortRolloutStage;
      cohort: M0BCohort;
    }>
  | Readonly<{
      eligible: false;
      reason:
        | 'invalid-policy'
        | 'malformed-receipt'
        | 'untrusted-authority'
        | 'invalid-signature'
        | 'not-yet-valid'
        | 'expired'
        | 'invalid-transition'
        | 'scope-mismatch';
    }>;

type CohortRolloutEnvelope = Readonly<{
  recordType: 'cohort-rollout-authorization';
  contract: typeof COHORT_ROLLOUT_CONTRACT;
  algorithm: typeof COHORT_ROLLOUT_ALGORITHM;
  keyId: string;
  publicKeyFingerprint: Digest;
  payload: CohortRolloutAuthorizationPayload;
  signature: string;
}>;

const SHA256 = /^sha256:[0-9a-f]{64}$/;
const CANONICAL_BASE64URL = /^[A-Za-z0-9_-]+$/;
const IDENTIFIER = /^[A-Za-z0-9._:-]{1,128}$/;
const APP_VERSION = /^[0-9A-Za-z][0-9A-Za-z.+_-]{0,63}$/;
const MAX_RECEIPT_BYTES = 16 * 1024;
const MAX_PUBLIC_KEY_DER_BYTES = 512;
const ED25519_SIGNATURE_BYTES = 64;
const MAX_TRUSTED_KEYS = 8;

/**
 * Produce the public descriptor that release policy must trust explicitly.
 * The descriptor contains no private material.
 */
export function describeCohortRolloutPublicKey(keyId: string, publicKey: KeyObject): CohortRolloutTrustedPublicKey {
  assertIdentifier(keyId, 'key ID');
  assertEd25519Key(publicKey, 'public');
  const publicKeyBytes = canonicalPublicDer(publicKey);
  return Object.freeze({
    keyId,
    algorithm: COHORT_ROLLOUT_ALGORITHM,
    publicKeyDer: encodeBase64Url(publicKeyBytes),
    publicKeyFingerprint: digest(publicKeyBytes),
  });
}

/**
 * Sign one narrowly scoped promotion. Possession of any key is insufficient:
 * the verifier accepts only an explicitly trusted public descriptor.
 */
export function issueCohortRolloutAuthorization(
  payloadInput: CohortRolloutAuthorizationPayload,
  authority: CohortRolloutSigningAuthority
): Uint8Array {
  const payload = parsePayload(payloadInput);
  assertReceiptWindow(payload, Date.now());
  assertSequentialTransition(payload.previousStage, payload.stage);
  assertIdentifier(authority.keyId, 'key ID');
  assertEd25519Key(authority.privateKey, 'private');

  const publicKey = createPublicKey(authority.privateKey);
  const descriptor = describeCohortRolloutPublicKey(authority.keyId, publicKey);
  const envelope: CohortRolloutEnvelope = {
    recordType: 'cohort-rollout-authorization',
    contract: COHORT_ROLLOUT_CONTRACT,
    algorithm: COHORT_ROLLOUT_ALGORITHM,
    keyId: descriptor.keyId,
    publicKeyFingerprint: descriptor.publicKeyFingerprint,
    payload,
    signature: encodeBase64Url(sign(null, canonicalBytes(payload as unknown as Json), authority.privateKey)),
  };
  return canonicalBytes(envelope as unknown as Json);
}

/**
 * Convert an untrusted receipt into the only renderer-safe outcome. Raw
 * receipts, aggregate evidence, signatures, and public/private key material
 * never cross this boundary.
 */
export function evaluateCohortRolloutEligibility(
  receipt: unknown,
  policyInput: CohortRolloutVerificationPolicy
): CohortRolloutEligibilityDecision {
  let policy: CohortRolloutVerificationPolicy;
  try {
    policy = parsePolicy(policyInput);
  } catch {
    return denied('invalid-policy');
  }

  let envelope: CohortRolloutEnvelope;
  try {
    envelope = parseCanonicalEnvelope(receipt);
  } catch {
    return denied('malformed-receipt');
  }

  const trusted = policy.trustedPublicKeys.find((descriptor) => descriptor.keyId === envelope.keyId);
  if (!trusted || trusted.publicKeyFingerprint !== envelope.publicKeyFingerprint) {
    return denied('untrusted-authority');
  }

  let publicKey: KeyObject;
  try {
    publicKey = parseTrustedPublicKey(trusted);
  } catch {
    return denied('invalid-policy');
  }
  const signature = decodeCanonicalBase64Url(
    envelope.signature,
    ED25519_SIGNATURE_BYTES,
    ED25519_SIGNATURE_BYTES,
    'signature'
  );
  if (!signature || !verify(null, canonicalBytes(envelope.payload as unknown as Json), publicKey, signature)) {
    return denied('invalid-signature');
  }

  const now = Date.now();
  const lifetime = envelope.payload.expiresAt - envelope.payload.issuedAt;
  if (lifetime <= 0 || lifetime > COHORT_ROLLOUT_MAX_RECEIPT_LIFETIME_MS) {
    return denied('malformed-receipt');
  }
  if (envelope.payload.issuedAt > now) return denied('not-yet-valid');
  if (envelope.payload.expiresAt <= now) return denied('expired');
  if (!isSequentialTransition(envelope.payload.previousStage, envelope.payload.stage)) {
    return denied('invalid-transition');
  }
  if (!matchesExpectedScope(envelope.payload, policy.expected)) return denied('scope-mismatch');

  return Object.freeze({ eligible: true, stage: envelope.payload.stage, cohort: envelope.payload.cohort });
}

function parseCanonicalEnvelope(receipt: unknown): CohortRolloutEnvelope {
  assertImmutableBytes(receipt);
  if (receipt.byteLength === 0 || receipt.byteLength > MAX_RECEIPT_BYTES) throw new Error('receipt bounds');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(receipt);
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('receipt JSON');
  }
  const envelope = parseEnvelope(raw);
  if (canonicalJson(envelope as unknown as Json) !== text) throw new Error('receipt canonicalization');
  return envelope;
}

function parseEnvelope(value: unknown): CohortRolloutEnvelope {
  if (!isRecord(value)) throw new Error('envelope');
  assertExactKeys(value, [
    'algorithm',
    'contract',
    'keyId',
    'payload',
    'publicKeyFingerprint',
    'recordType',
    'signature',
  ]);
  if (
    value.recordType !== 'cohort-rollout-authorization' ||
    value.contract !== COHORT_ROLLOUT_CONTRACT ||
    value.algorithm !== COHORT_ROLLOUT_ALGORITHM ||
    typeof value.keyId !== 'string' ||
    !IDENTIFIER.test(value.keyId) ||
    !isDigest(value.publicKeyFingerprint) ||
    typeof value.signature !== 'string'
  ) {
    throw new Error('envelope fields');
  }
  if (!decodeCanonicalBase64Url(value.signature, ED25519_SIGNATURE_BYTES, ED25519_SIGNATURE_BYTES, 'signature')) {
    throw new Error('signature');
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

function parsePayload(value: unknown): CohortRolloutAuthorizationPayload {
  if (!isRecord(value)) throw new Error('payload');
  assertExactKeys(value, [
    'appVersion',
    'baselineAggregateDigest',
    'cohort',
    'decisionOwner',
    'expiresAt',
    'issuedAt',
    'previousStage',
    'releaseTrack',
    'schemaVersion',
    'stage',
    'window',
  ]);
  if (
    value.schemaVersion !== COHORT_ROLLOUT_SCHEMA_VERSION ||
    typeof value.appVersion !== 'string' ||
    !APP_VERSION.test(value.appVersion) ||
    !isReleaseTrack(value.releaseTrack) ||
    !isNullableStage(value.previousStage) ||
    !isStage(value.stage) ||
    !isCohort(value.cohort) ||
    !isDigest(value.baselineAggregateDigest) ||
    !isTimestamp(value.issuedAt) ||
    !isTimestamp(value.expiresAt) ||
    typeof value.decisionOwner !== 'string' ||
    !isHumanLabel(value.decisionOwner)
  ) {
    throw new Error('payload fields');
  }
  return Object.freeze({
    schemaVersion: value.schemaVersion,
    appVersion: value.appVersion,
    releaseTrack: value.releaseTrack,
    previousStage: value.previousStage,
    stage: value.stage,
    cohort: value.cohort,
    window: parseWindow(value.window),
    baselineAggregateDigest: value.baselineAggregateDigest,
    issuedAt: value.issuedAt,
    expiresAt: value.expiresAt,
    decisionOwner: value.decisionOwner,
  });
}

function parseWindow(value: unknown): CohortRolloutWindow {
  if (!isRecord(value)) throw new Error('window');
  assertExactKeys(value, ['endMs', 'startMs']);
  if (!isTimestamp(value.startMs) || !isTimestamp(value.endMs)) throw new Error('window fields');
  const duration = value.endMs - value.startMs;
  if (duration <= 0 || duration > COHORT_ROLLOUT_MAX_BASELINE_WINDOW_MS) throw new Error('window duration');
  return Object.freeze({ startMs: value.startMs, endMs: value.endMs });
}

function parsePolicy(value: unknown): CohortRolloutVerificationPolicy {
  if (!isRecord(value)) throw new Error('policy');
  assertExactKeys(value, ['expected', 'trustedPublicKeys']);
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

function parseExpectedScope(value: unknown): CohortRolloutExpectedScope {
  if (!isRecord(value)) throw new Error('expected scope');
  assertExactKeys(value, [
    'appVersion',
    'baselineAggregateDigest',
    'cohort',
    'currentStage',
    'decisionOwner',
    'releaseTrack',
    'stage',
    'window',
  ]);
  if (
    typeof value.appVersion !== 'string' ||
    !APP_VERSION.test(value.appVersion) ||
    !isReleaseTrack(value.releaseTrack) ||
    !isNullableStage(value.currentStage) ||
    !isStage(value.stage) ||
    !isCohort(value.cohort) ||
    !isDigest(value.baselineAggregateDigest) ||
    typeof value.decisionOwner !== 'string' ||
    !isHumanLabel(value.decisionOwner)
  ) {
    throw new Error('expected scope fields');
  }
  assertSequentialTransition(value.currentStage, value.stage);
  return Object.freeze({
    appVersion: value.appVersion,
    releaseTrack: value.releaseTrack,
    currentStage: value.currentStage,
    stage: value.stage,
    cohort: value.cohort,
    window: parseWindow(value.window),
    baselineAggregateDigest: value.baselineAggregateDigest,
    decisionOwner: value.decisionOwner,
  });
}

function parseTrustedDescriptor(value: unknown): CohortRolloutTrustedPublicKey {
  if (!isRecord(value)) throw new Error('trusted key');
  assertExactKeys(value, ['algorithm', 'keyId', 'publicKeyDer', 'publicKeyFingerprint']);
  if (
    value.algorithm !== COHORT_ROLLOUT_ALGORITHM ||
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

function parseTrustedPublicKey(descriptor: CohortRolloutTrustedPublicKey): KeyObject {
  const bytes = decodeCanonicalBase64Url(descriptor.publicKeyDer, 1, MAX_PUBLIC_KEY_DER_BYTES, 'public key');
  if (!bytes) throw new Error('public key');
  const key = createPublicKey({ key: bytes, format: 'der', type: 'spki' });
  assertEd25519Key(key, 'public');
  const canonical = canonicalPublicDer(key);
  if (!equalBytes(canonical, bytes) || digest(canonical) !== descriptor.publicKeyFingerprint) {
    throw new Error('public key descriptor mismatch');
  }
  return key;
}

function assertReceiptWindow(payload: CohortRolloutAuthorizationPayload, now: number): void {
  const lifetime = payload.expiresAt - payload.issuedAt;
  if (lifetime <= 0 || lifetime > COHORT_ROLLOUT_MAX_RECEIPT_LIFETIME_MS) throw new Error('receipt lifetime');
  if (payload.issuedAt > now) throw new Error('receipt future');
  if (payload.expiresAt <= now) throw new Error('receipt expired');
}

function matchesExpectedScope(
  payload: CohortRolloutAuthorizationPayload,
  expected: CohortRolloutExpectedScope
): boolean {
  return (
    payload.appVersion === expected.appVersion &&
    payload.releaseTrack === expected.releaseTrack &&
    payload.previousStage === expected.currentStage &&
    payload.stage === expected.stage &&
    payload.cohort === expected.cohort &&
    payload.window.startMs === expected.window.startMs &&
    payload.window.endMs === expected.window.endMs &&
    payload.baselineAggregateDigest === expected.baselineAggregateDigest &&
    payload.decisionOwner === expected.decisionOwner
  );
}

function assertSequentialTransition(previousStage: CohortRolloutStage | null, stage: CohortRolloutStage): void {
  if (!isSequentialTransition(previousStage, stage)) throw new Error('rollout stage skip');
}

function isSequentialTransition(previousStage: CohortRolloutStage | null, stage: CohortRolloutStage): boolean {
  const targetIndex = COHORT_ROLLOUT_STAGES.indexOf(stage);
  return previousStage === null ? targetIndex === 0 : targetIndex === COHORT_ROLLOUT_STAGES.indexOf(previousStage) + 1;
}

function denied(reason: Extract<CohortRolloutEligibilityDecision, { eligible: false }>['reason']) {
  return Object.freeze({ eligible: false as const, reason });
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

function decodeCanonicalBase64Url(
  value: string,
  minimumBytes: number,
  maximumBytes: number,
  _label: string
): Buffer | null {
  if (!CANONICAL_BASE64URL.test(value)) return null;
  const bytes = Buffer.from(value, 'base64url');
  if (bytes.byteLength < minimumBytes || bytes.byteLength > maximumBytes || bytes.toString('base64url') !== value) {
    return null;
  }
  return bytes;
}

function assertIdentifier(value: string, label: string): void {
  if (!IDENTIFIER.test(value)) throw new Error(`${label} is invalid`);
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[]): void {
  const actual = Object.keys(value).toSorted();
  if (actual.length !== expected.length || actual.some((key, index) => key !== [...expected].toSorted()[index])) {
    throw new Error('unknown or missing critical fields');
  }
}

function assertImmutableBytes(value: unknown): asserts value is Uint8Array {
  if (!(value instanceof Uint8Array)) throw new Error('receipt bytes');
  if (typeof SharedArrayBuffer !== 'undefined' && value.buffer instanceof SharedArrayBuffer) {
    throw new Error('shared mutable receipt');
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

function isReleaseTrack(value: unknown): value is WaylandReleaseTrack {
  return value === 'stable' || value === 'preview';
}

function isStage(value: unknown): value is CohortRolloutStage {
  return COHORT_ROLLOUT_STAGES.includes(value as CohortRolloutStage);
}

function isNullableStage(value: unknown): value is CohortRolloutStage | null {
  return value === null || isStage(value);
}

function isCohort(value: unknown): value is M0BCohort {
  return M0B_COHORTS.includes(value as M0BCohort);
}

function isHumanLabel(value: string): boolean {
  return (
    value.length >= 1 &&
    value.length <= 128 &&
    value.trim() === value &&
    [...value].every((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)
  );
}
