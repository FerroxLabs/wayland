/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, generateKeyPairSync, sign, type KeyObject } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  COHORT_ROLLOUT_ALGORITHM,
  COHORT_ROLLOUT_CONTRACT,
  COHORT_ROLLOUT_MAX_RECEIPT_LIFETIME_MS,
  describeCohortRolloutPublicKey,
  evaluateCohortRolloutEligibility,
  issueCohortRolloutAuthorization,
  type CohortRolloutAuthorizationPayload,
  type CohortRolloutStage,
  type CohortRolloutVerificationPolicy,
} from '@process/services/cohort/rolloutAuthority';

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const NOW = 2_000_000_000_000;
const DAY_MS = 86_400_000;
const BASELINE_DIGEST = `sha256:${'a'.repeat(64)}` as const;
const WINDOW = Object.freeze({ startMs: NOW - 15 * DAY_MS, endMs: NOW - DAY_MS });

const trustedKeys = generateKeyPairSync('ed25519');
const rogueKeys = generateKeyPairSync('ed25519');
const trustedDescriptor = describeCohortRolloutPublicKey('release-authority-2026', trustedKeys.publicKey);

function payload(overrides: Partial<CohortRolloutAuthorizationPayload> = {}): CohortRolloutAuthorizationPayload {
  return {
    schemaVersion: 1,
    appVersion: '0.12.0-preview.1',
    releaseTrack: 'preview',
    previousStage: 'internal-dogfood',
    stage: 'invited-alpha',
    cohort: 'knowledge-work',
    window: WINDOW,
    baselineAggregateDigest: BASELINE_DIGEST,
    issuedAt: NOW - 1_000,
    expiresAt: NOW + 60_000,
    decisionOwner: 'Sean Donahoe',
    ...overrides,
  };
}

function policy(overrides: Partial<CohortRolloutVerificationPolicy['expected']> = {}): CohortRolloutVerificationPolicy {
  return {
    expected: {
      appVersion: '0.12.0-preview.1',
      releaseTrack: 'preview',
      currentStage: 'internal-dogfood',
      stage: 'invited-alpha',
      cohort: 'knowledge-work',
      window: WINDOW,
      baselineAggregateDigest: BASELINE_DIGEST,
      decisionOwner: 'Sean Donahoe',
      ...overrides,
    },
    trustedPublicKeys: [trustedDescriptor],
  };
}

function issue(
  payloadOverrides: Partial<CohortRolloutAuthorizationPayload> = {},
  privateKey = trustedKeys.privateKey,
  keyId = trustedDescriptor.keyId
): Uint8Array {
  return issueCohortRolloutAuthorization(payload(payloadOverrides), { keyId, privateKey });
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

function encode(value: Json): Uint8Array {
  return Buffer.from(canonicalJson(value), 'utf8');
}

function read(receipt: Uint8Array): Record<string, unknown> {
  return JSON.parse(Buffer.from(receipt).toString('utf8')) as Record<string, unknown>;
}

function signedRaw(
  rawPayload: Record<string, unknown>,
  privateKey: KeyObject = trustedKeys.privateKey,
  keyId = trustedDescriptor.keyId
): Uint8Array {
  const publicKey = privateKey === trustedKeys.privateKey ? trustedKeys.publicKey : rogueKeys.publicKey;
  const descriptor = describeCohortRolloutPublicKey(keyId, publicKey);
  const payloadBytes = encode(rawPayload as Json);
  return encode({
    recordType: 'cohort-rollout-authorization',
    contract: COHORT_ROLLOUT_CONTRACT,
    algorithm: COHORT_ROLLOUT_ALGORITHM,
    keyId,
    publicKeyFingerprint: descriptor.publicKeyFingerprint,
    payload: rawPayload,
    signature: Buffer.from(sign(null, payloadBytes, privateKey)).toString('base64url'),
  });
}

function resign(mutator: (raw: Record<string, unknown>) => void): Uint8Array {
  const rawPayload = JSON.parse(JSON.stringify(payload())) as Record<string, unknown>;
  mutator(rawPayload);
  return signedRaw(rawPayload);
}

describe('cohort rollout authority', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns only a minimal renderer-safe decision for an exact trusted scope', () => {
    const decision = evaluateCohortRolloutEligibility(issue(), policy());

    expect(decision).toEqual({ eligible: true, stage: 'invited-alpha', cohort: 'knowledge-work' });
    expect(Object.keys(decision).toSorted()).toEqual(['cohort', 'eligible', 'stage']);
    expect(JSON.stringify(decision)).not.toMatch(/signature|private|publicKey|digest|event/i);
  });

  it.each<readonly [CohortRolloutStage | null, CohortRolloutStage]>([
    [null, 'internal-dogfood'],
    ['internal-dogfood', 'invited-alpha'],
    ['invited-alpha', 'opt-in-beta'],
    ['opt-in-beta', 'default-new'],
  ])('authorizes only the next rollout stage from %s to %s', (currentStage, stage) => {
    const receipt = issue({ previousStage: currentStage, stage });

    expect(evaluateCohortRolloutEligibility(receipt, policy({ currentStage, stage }))).toEqual({
      eligible: true,
      stage,
      cohort: 'knowledge-work',
    });
  });

  it.each([
    ['appVersion', '0.12.0-preview.2'],
    ['releaseTrack', 'stable'],
    ['cohort', 'developer'],
    ['baselineAggregateDigest', `sha256:${'b'.repeat(64)}`],
    ['decisionOwner', 'Local User'],
  ] as const)('rejects a signed receipt for the wrong %s', (field, value) => {
    const receipt = issue({ [field]: value });
    expect(evaluateCohortRolloutEligibility(receipt, policy())).toEqual({
      eligible: false,
      reason: 'scope-mismatch',
    });
  });

  it('rejects a signed receipt for another stage without treating it as a local preference', () => {
    const receipt = issue({ previousStage: 'invited-alpha', stage: 'opt-in-beta' });

    expect(evaluateCohortRolloutEligibility(receipt, policy())).toEqual({
      eligible: false,
      reason: 'scope-mismatch',
    });
  });

  it('rejects a signed receipt for another baseline window', () => {
    const receipt = issue({ window: { startMs: WINDOW.startMs - 1, endMs: WINDOW.endMs } });

    expect(evaluateCohortRolloutEligibility(receipt, policy())).toEqual({
      eligible: false,
      reason: 'scope-mismatch',
    });
  });

  it('rejects a stage skip even when the trusted key signed it', () => {
    const receipt = resign((raw) => {
      raw.previousStage = 'internal-dogfood';
      raw.stage = 'default-new';
    });

    expect(evaluateCohortRolloutEligibility(receipt, policy())).toEqual({
      eligible: false,
      reason: 'invalid-transition',
    });
  });

  it('rejects unknown envelope and payload fields before they can become critical claims', () => {
    const envelopeWithExtra = read(issue());
    envelopeWithExtra.eligible = true;
    expect(evaluateCohortRolloutEligibility(encode(envelopeWithExtra as Json), policy())).toEqual({
      eligible: false,
      reason: 'malformed-receipt',
    });

    const payloadWithExtra = read(issue());
    (payloadWithExtra.payload as Record<string, unknown>).candidateApproved = true;
    expect(evaluateCohortRolloutEligibility(encode(payloadWithExtra as Json), policy())).toEqual({
      eligible: false,
      reason: 'malformed-receipt',
    });
  });

  it('rejects unsigned, non-canonical, wrong-contract, and wrong-schema receipts', () => {
    const unsigned = read(issue());
    delete unsigned.signature;
    expect(evaluateCohortRolloutEligibility(encode(unsigned as Json), policy())).toEqual({
      eligible: false,
      reason: 'malformed-receipt',
    });

    const nonCanonical = Buffer.from(`${JSON.stringify(read(issue()))}\n`, 'utf8');
    expect(evaluateCohortRolloutEligibility(nonCanonical, policy())).toEqual({
      eligible: false,
      reason: 'malformed-receipt',
    });

    const wrongContract = read(issue());
    wrongContract.contract = 'wayland-desktop-cohort-rollout/2.0';
    expect(evaluateCohortRolloutEligibility(encode(wrongContract as Json), policy())).toEqual({
      eligible: false,
      reason: 'malformed-receipt',
    });

    const wrongSchema = resign((raw) => {
      raw.schemaVersion = 2;
    });
    expect(evaluateCohortRolloutEligibility(wrongSchema, policy())).toEqual({
      eligible: false,
      reason: 'malformed-receipt',
    });
  });

  it('rejects an invalid signature without exposing cryptographic material', () => {
    const tampered = read(issue());
    const signature = Buffer.from(tampered.signature as string, 'base64url');
    signature[0] ^= 1;
    tampered.signature = signature.toString('base64url');

    expect(evaluateCohortRolloutEligibility(encode(tampered as Json), policy())).toEqual({
      eligible: false,
      reason: 'invalid-signature',
    });
  });

  it('rejects a correctly signed receipt from an untrusted candidate key', () => {
    const receipt = issue({}, rogueKeys.privateKey, 'candidate-local-key');

    expect(evaluateCohortRolloutEligibility(receipt, policy())).toEqual({
      eligible: false,
      reason: 'untrusted-authority',
    });
  });

  it('rejects candidate, user, and local-config claims that are not signed receipts', () => {
    for (const claim of [
      { eligible: true, source: 'candidate' },
      { stage: 'default-new', source: 'user' },
      { invitedAlphaEnabled: true, source: 'local-config' },
    ]) {
      expect(evaluateCohortRolloutEligibility(claim, policy())).toEqual({
        eligible: false,
        reason: 'malformed-receipt',
      });
    }
  });

  it('rejects future, expired, reversed, and overlong signed receipt windows', () => {
    const future = resign((raw) => {
      raw.issuedAt = NOW + 1;
      raw.expiresAt = NOW + 60_000;
    });
    expect(evaluateCohortRolloutEligibility(future, policy())).toEqual({
      eligible: false,
      reason: 'not-yet-valid',
    });

    const expired = resign((raw) => {
      raw.issuedAt = NOW - 60_000;
      raw.expiresAt = NOW;
    });
    expect(evaluateCohortRolloutEligibility(expired, policy())).toEqual({ eligible: false, reason: 'expired' });

    const reversed = resign((raw) => {
      raw.issuedAt = NOW - 1_000;
      raw.expiresAt = NOW - 2_000;
    });
    expect(evaluateCohortRolloutEligibility(reversed, policy())).toEqual({
      eligible: false,
      reason: 'malformed-receipt',
    });

    const overlong = resign((raw) => {
      raw.issuedAt = NOW - 1;
      raw.expiresAt = NOW + COHORT_ROLLOUT_MAX_RECEIPT_LIFETIME_MS;
    });
    expect(evaluateCohortRolloutEligibility(overlong, policy())).toEqual({
      eligible: false,
      reason: 'malformed-receipt',
    });
  });

  it('rejects malformed and caller-expanded trust policy', () => {
    expect(
      evaluateCohortRolloutEligibility(issue(), {
        ...policy(),
        candidateOverride: true,
      } as CohortRolloutVerificationPolicy)
    ).toEqual({ eligible: false, reason: 'invalid-policy' });

    expect(
      evaluateCohortRolloutEligibility(issue(), {
        ...policy(),
        trustedPublicKeys: [{ ...trustedDescriptor, publicKeyFingerprint: `sha256:${'0'.repeat(64)}` }],
      })
    ).toEqual({ eligible: false, reason: 'invalid-policy' });

    expect(
      evaluateCohortRolloutEligibility(issue(), {
        ...policy(),
        trustedPublicKeys: [trustedDescriptor, trustedDescriptor],
      })
    ).toEqual({ eligible: false, reason: 'invalid-policy' });
  });

  it('binds the trusted descriptor fingerprint to its exact Ed25519 DER', () => {
    const changedDer = Buffer.from(trustedDescriptor.publicKeyDer, 'base64url');
    changedDer[changedDer.length - 1] ^= 1;
    const changedDerText = changedDer.toString('base64url');
    const changedFingerprint = `sha256:${createHash('sha256').update(changedDer).digest('hex')}` as const;

    expect(
      evaluateCohortRolloutEligibility(issue(), {
        ...policy(),
        trustedPublicKeys: [
          {
            ...trustedDescriptor,
            publicKeyDer: changedDerText,
            publicKeyFingerprint: changedFingerprint,
          },
        ],
      })
    ).toEqual({ eligible: false, reason: 'untrusted-authority' });
  });

  it('fails issuance closed for future, expired, overlong, and skipped authorizations', () => {
    expect(() => issue({ issuedAt: NOW + 1, expiresAt: NOW + 60_000 })).toThrow();
    expect(() => issue({ issuedAt: NOW - 60_000, expiresAt: NOW })).toThrow();
    expect(() => issue({ issuedAt: NOW - 1, expiresAt: NOW + COHORT_ROLLOUT_MAX_RECEIPT_LIFETIME_MS })).toThrow();
    expect(() => issue({ previousStage: 'internal-dogfood', stage: 'default-new' })).toThrow();
  });
});
