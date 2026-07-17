import { createHash } from 'node:crypto';
import {
  canonicalizeRestrictedJson,
  compareUnicodeCodeUnits,
  isPlainObject,
  requireWellFormedUnicode,
} from '../../utils/restrictedCanonicalJson';
import type { ConstitutionFsTarget } from './constitutionFsTransaction';

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MAX_REVISION_SCALARS = 4096;
const MAX_TARGET_SCALARS = 255;

export const CONSTITUTION_REQUEST_FINGERPRINT_SCHEMA_VERSION = 2 as const;

export type ConstitutionMutationIntent = 'replace' | 'delete' | 'migrate_legacy' | 'restore';

export type ConstitutionRequestFingerprintFacts = {
  intent: ConstitutionMutationIntent;
  target: ConstitutionFsTarget;
  contentSha256: `sha256:${string}` | null;
  expectedRevision: string;
  archiveIdentity: string | null;
};

type CanonicalConstitutionTarget =
  | { kind: 'constitution'; sourceName: 'CONSTITUTION.md' | 'SOUL.md' }
  | { kind: 'specialist'; sourceName: string; specialistId: string };

export type ConstitutionRequestFingerprintPreimage = {
  schemaVersion: typeof CONSTITUTION_REQUEST_FINGERPRINT_SCHEMA_VERSION;
  intent: ConstitutionMutationIntent;
  target: CanonicalConstitutionTarget;
  contentSha256: `sha256:${string}` | null;
  expectedRevision: string;
  archiveIdentity: string | null;
};

function assertExactDataObject(
  value: unknown,
  keys: readonly string[],
  label: string
): asserts value is Record<string, unknown> {
  if (!isPlainObject(value)) throw new Error(`${label} must be a plain object.`);
  if (Object.getOwnPropertySymbols(value).length > 0) throw new Error(`${label} contains symbol fields.`);
  const actual = Object.getOwnPropertyNames(value).toSorted(compareUnicodeCodeUnits);
  const expected = [...keys].toSorted(compareUnicodeCodeUnits);
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} contains missing or unknown fields.`);
  }
  for (const key of actual) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !('value' in descriptor)) {
      throw new Error(`${label} contains hidden or accessor fields.`);
    }
  }
}

function assertBoundedNfcString(value: unknown, label: string, maxScalars: number): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string.`);
  requireWellFormedUnicode(value, label);
  if (value !== value.normalize('NFC')) throw new Error(`${label} must use NFC normalization.`);
  if (Array.from(value).length > maxScalars) throw new Error(`${label} exceeds its scalar bound.`);
  if (/\p{Cc}/u.test(value)) throw new Error(`${label} contains a control character.`);
}

function canonicalTarget(target: unknown): CanonicalConstitutionTarget {
  if (!isPlainObject(target)) throw new Error('Constitution fingerprint target must be a plain object.');
  const kindDescriptor = Object.getOwnPropertyDescriptor(target, 'kind');
  if (!kindDescriptor?.enumerable || !('value' in kindDescriptor)) {
    throw new Error('Constitution fingerprint target kind must be an enumerable data field.');
  }
  if (kindDescriptor.value === 'constitution') {
    assertExactDataObject(target, ['kind', 'sourceName'], 'Constitution fingerprint target');
    if (target.sourceName !== 'CONSTITUTION.md' && target.sourceName !== 'SOUL.md') {
      throw new Error('Constitution fingerprint target source name is invalid.');
    }
    return { kind: 'constitution', sourceName: target.sourceName };
  }
  if (kindDescriptor.value !== 'specialist') throw new Error('Constitution fingerprint target kind is invalid.');
  assertExactDataObject(target, ['kind', 'sourceName', 'specialistId'], 'Constitution fingerprint target');
  assertBoundedNfcString(target.specialistId, 'Constitution specialist fingerprint id', MAX_TARGET_SCALARS);
  assertBoundedNfcString(target.sourceName, 'Constitution specialist fingerprint source name', MAX_TARGET_SCALARS);
  return {
    kind: 'specialist',
    sourceName: target.sourceName,
    specialistId: target.specialistId,
  };
}

export function constitutionRequestFingerprintPreimage(
  facts: ConstitutionRequestFingerprintFacts
): ConstitutionRequestFingerprintPreimage {
  assertExactDataObject(
    facts,
    ['intent', 'target', 'contentSha256', 'expectedRevision', 'archiveIdentity'],
    'Constitution request fingerprint facts'
  );
  if (!['replace', 'delete', 'migrate_legacy', 'restore'].includes(facts.intent)) {
    throw new Error('Constitution request fingerprint intent is invalid.');
  }
  assertBoundedNfcString(
    facts.expectedRevision,
    'Constitution request fingerprint expected revision',
    MAX_REVISION_SCALARS
  );
  if (facts.contentSha256 !== null && !SHA256_PATTERN.test(facts.contentSha256)) {
    throw new Error('Constitution request fingerprint requires a canonical content digest.');
  }
  if (facts.archiveIdentity !== null && !UUID_V4_PATTERN.test(facts.archiveIdentity)) {
    throw new Error('Constitution request fingerprint archive identity must be a lowercase UUIDv4.');
  }
  if (facts.intent === 'delete' && facts.contentSha256 !== null) {
    throw new Error('Constitution delete fingerprints require a null content digest.');
  }
  if (facts.intent !== 'delete' && facts.contentSha256 === null) {
    throw new Error('Constitution non-delete fingerprints require a content digest.');
  }
  if (facts.intent === 'restore' && facts.archiveIdentity === null) {
    throw new Error('Constitution restore fingerprints require an archive identity.');
  }
  if (facts.intent !== 'restore' && facts.archiveIdentity !== null) {
    throw new Error('Only Constitution restore fingerprints may bind an archive identity.');
  }
  return {
    schemaVersion: CONSTITUTION_REQUEST_FINGERPRINT_SCHEMA_VERSION,
    intent: facts.intent,
    target: canonicalTarget(facts.target),
    contentSha256: facts.contentSha256,
    expectedRevision: facts.expectedRevision,
    archiveIdentity: facts.archiveIdentity,
  };
}

export function canonicalConstitutionRequestFingerprintBytes(facts: ConstitutionRequestFingerprintFacts): Buffer {
  return canonicalizeRestrictedJson(constitutionRequestFingerprintPreimage(facts));
}

export function createConstitutionRequestFingerprint(facts: ConstitutionRequestFingerprintFacts): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(canonicalConstitutionRequestFingerprintBytes(facts)).digest('hex')}`;
}

export function sameConstitutionFingerprintTarget(left: unknown, right: unknown): boolean {
  try {
    const canonicalLeft = canonicalTarget(left);
    const canonicalRight = canonicalTarget(right);
    return canonicalizeRestrictedJson(canonicalLeft).equals(canonicalizeRestrictedJson(canonicalRight));
  } catch {
    return false;
  }
}
