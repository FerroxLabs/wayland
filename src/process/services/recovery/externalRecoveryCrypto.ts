/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import {
  canonicalizeRestrictedJson,
  compareUnicodeCodeUnits as compareCodeUnits,
  isPlainObject,
  requireWellFormedUnicode,
} from '../../utils/restrictedCanonicalJson';

export const RECOVERY_KEY_STATE_CONTRACT = 'wayland-constitution-recovery-key-state/1.0' as const;
export const RECOVERY_KEY_EVENT_CONTRACT = 'wayland-constitution-recovery-key-event/1.0' as const;
export const RECOVERY_ENVELOPE_CONTRACT = 'wayland-constitution-recovery-envelope/1.0' as const;
export const RECOVERY_SAME_DEVICE_WRAP_CONTRACT = 'wayland-constitution-recovery-same-device-wrap/1.0' as const;

const ROOT_SALT = createHash('sha256').update('wayland-constitution-external-recovery/root/1.0', 'utf8').digest();
const RECORD_ENCRYPTION_INFO = Buffer.from('record-encryption', 'utf8');
const RECORD_MAC_INFO = Buffer.from('record-mac', 'utf8');
const MAX_PLAINTEXT_BYTES = 32 * 1024 * 1024;
const MAX_CANONICAL_BYTES = 64 * 1024 * 1024;

export type RecoveryRootKeys = {
  encryptionKey: Buffer;
  macKey: Buffer;
};

export type SealExternalRecoveryRecordInput = {
  recordContract: string;
  domain: string;
  recordId: string;
  createdAt: string;
  plaintext: Uint8Array;
};

export type OpenedExternalRecoveryRecord = Omit<SealExternalRecoveryRecordInput, 'plaintext'> & {
  keyId: string;
  plaintext: Buffer;
  envelopeSha256: string;
};

type RecoveryKdf = {
  name: 'HKDF-SHA-256';
  saltBase64url: string;
  infoBase64url: string;
};

type RecoveryCipher = {
  name: 'AES-256-GCM';
  nonceBase64url: string;
  ciphertextBase64url: string;
  tagBase64url: string;
};

type RecoveryPlaintext = {
  bytes: number;
  sha256: string;
};

type RecoveryMac = {
  name: 'HMAC-SHA-256';
  valueBase64url: string;
};

type RecoveryEnvelope = {
  contract: typeof RECOVERY_ENVELOPE_CONTRACT;
  recordContract: string;
  domain: string;
  keyId: string;
  recordId: string;
  createdAt: string;
  kdf: RecoveryKdf;
  cipher: RecoveryCipher;
  plaintext: RecoveryPlaintext;
  mac: RecoveryMac;
};

export type RecoveryKeyEvent = {
  contract: typeof RECOVERY_KEY_EVENT_CONTRACT;
  sequence: number;
  previousEventSha256: string | null;
  kind: 'created' | 'rotated';
  oldKeyId: string | null;
  newKeyId: string;
  newVaultRef: string;
  createdAt: string;
  coveredRecordDigests: string[];
  macs: Array<{ keyId: string; valueBase64url: string }>;
};

export type RecoveryKeyState = {
  contract: typeof RECOVERY_KEY_STATE_CONTRACT;
  activeKeyId: string;
  keys: Array<{
    keyId: string;
    status: 'active' | 'retired';
    createdAt: string;
    retiredAt: string | null;
    vaultRef: string;
  }>;
  authorityHeadSha256: string;
};

export type RecoveryKeyEventResult = {
  event: RecoveryKeyEvent;
  canonicalBytes: Buffer;
  sha256: string;
};

type SameDeviceRecoveryWrap = {
  contract: typeof RECOVERY_SAME_DEVICE_WRAP_CONTRACT;
  keyId: string;
  createdAt: string;
  vaultProvider: string;
  vaultRef: string;
  wrappedSecretBase64url: string;
  wrappedCiphertextSha256: string;
};

/** Serialize the restricted recovery schema using RFC 8785/JCS ordering and ECMAScript primitives. */
export function canonicalizeRecoveryJson(value: unknown): Buffer {
  return canonicalizeRestrictedJson(value);
}

/** Parse JSON only when its supplied bytes are already the unique canonical representation. */
export function parseCanonicalRecoveryJson(bytes: Uint8Array): unknown {
  const serialized = Buffer.from(bytes);
  if (serialized.length === 0 || serialized.length > MAX_CANONICAL_BYTES) {
    throw new Error('Recovery JSON has an invalid size.');
  }
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(serialized);
  } catch (error) {
    throw new Error('Recovery JSON is not valid UTF-8.', { cause: error });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error('Recovery JSON is malformed.', { cause: error });
  }
  if (!canonicalizeRecoveryJson(parsed).equals(serialized)) {
    throw new Error('Recovery JSON is not RFC 8785 canonical.');
  }
  return parsed;
}

function expectExactKeys(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!isPlainObject(value)) throw new Error(`${label} must be an object.`);
  if (Object.getOwnPropertySymbols(value).length > 0) throw new Error(`${label} contains symbol fields.`);
  const actual = Object.getOwnPropertyNames(value).toSorted(compareCodeUnits);
  for (const key of actual) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !('value' in descriptor))
      throw new Error(`${label} contains hidden or accessor fields.`);
  }
  const expected = [...keys].toSorted(compareCodeUnits);
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} contains missing or unknown fields.`);
  }
  return value;
}

function requireCanonicalText(value: unknown, label: string, allowNul = false): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 4096 ||
    value.normalize('NFC') !== value ||
    (!allowNul && value.includes('\0'))
  ) {
    throw new Error(`${label} is not canonical text.`);
  }
  requireWellFormedUnicode(value, label);
  return value;
}

function requireTimestamp(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new Error(`${label} is not canonical UTC RFC3339.`);
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${label} is not canonical UTC RFC3339.`);
  }
  return value;
}

function sha256(bytes: Uint8Array): string {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function requireSha256(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label} is not a canonical SHA-256 digest.`);
  }
  return value;
}

function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function decodeBase64url(value: unknown, expectedBytes: number | null, label: string, allowEmpty = false): Buffer {
  if (
    typeof value !== 'string' ||
    (value.length === 0 && !allowEmpty) ||
    !/^[A-Za-z0-9_-]*$/.test(value) ||
    value.includes('=')
  ) {
    throw new Error(`${label} is not canonical unpadded base64url.`);
  }
  const decoded = Buffer.from(value, 'base64url');
  if (decoded.toString('base64url') !== value || (expectedBytes !== null && decoded.length !== expectedBytes)) {
    throw new Error(`${label} is not canonical unpadded base64url.`);
  }
  return decoded;
}

function requireSecret(secret: Uint8Array): Buffer {
  const bytes = Buffer.from(secret);
  if (bytes.length !== 32) {
    bytes.fill(0);
    throw new Error('Recovery vault secret must be exactly 32 bytes.');
  }
  return bytes;
}

/** Compute the stable key identifier bound to the exact 32-byte vault secret. */
export function deriveRecoveryKeyId(secret: Uint8Array): string {
  const bytes = requireSecret(secret);
  try {
    return `rk1:${createHash('sha256').update(bytes).digest('base64url')}`;
  } finally {
    bytes.fill(0);
  }
}

function requireKeyId(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^rk1:[A-Za-z0-9_-]{43}$/.test(value)) {
    throw new Error(`${label} is not a canonical recovery key ID.`);
  }
  decodeBase64url(value.slice(4), 32, label);
  return value;
}

/** Derive role-separated encryption and MAC roots under RFC 5869 HKDF-SHA-256. */
export function deriveRecoveryRootKeys(secret: Uint8Array): RecoveryRootKeys {
  const bytes = requireSecret(secret);
  try {
    return {
      encryptionKey: Buffer.from(hkdfSync('sha256', bytes, ROOT_SALT, RECORD_ENCRYPTION_INFO, 32)),
      macKey: Buffer.from(hkdfSync('sha256', bytes, ROOT_SALT, RECORD_MAC_INFO, 32)),
    };
  } finally {
    bytes.fill(0);
  }
}

/** Derive a per-record AES key from the encryption root, random salt, domain, and record ID. */
export function deriveRecoveryRecordKey(
  secret: Uint8Array,
  salt: Uint8Array,
  domain: string,
  recordId: string
): Buffer {
  const saltBytes = Buffer.from(salt);
  if (saltBytes.length !== 32) throw new Error('Recovery record salt must be exactly 32 bytes.');
  const checkedDomain = requireCanonicalText(domain, 'Recovery domain');
  const checkedRecordId = requireCanonicalText(recordId, 'Recovery record ID');
  const roots = deriveRecoveryRootKeys(secret);
  try {
    return Buffer.from(
      hkdfSync(
        'sha256',
        roots.encryptionKey,
        saltBytes,
        Buffer.from(`${checkedDomain}\0${checkedRecordId}`, 'utf8'),
        32
      )
    );
  } finally {
    roots.encryptionKey.fill(0);
    roots.macKey.fill(0);
    saltBytes.fill(0);
  }
}

function safeEqual(left: Uint8Array, right: Uint8Array): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function envelopeWithoutMac(envelope: RecoveryEnvelope): Omit<RecoveryEnvelope, 'mac'> {
  const { mac: _mac, ...withoutMac } = envelope;
  return withoutMac;
}

function envelopeAad(envelope: Omit<RecoveryEnvelope, 'mac' | 'cipher'> & { cipher?: never }): Buffer {
  return canonicalizeRecoveryJson({
    contract: envelope.contract,
    recordContract: envelope.recordContract,
    domain: envelope.domain,
    keyId: envelope.keyId,
    recordId: envelope.recordId,
    createdAt: envelope.createdAt,
    kdf: envelope.kdf,
    plaintext: envelope.plaintext,
  });
}

function parseEnvelope(value: unknown): RecoveryEnvelope {
  const envelope = expectExactKeys(
    value,
    ['contract', 'recordContract', 'domain', 'keyId', 'recordId', 'createdAt', 'kdf', 'cipher', 'plaintext', 'mac'],
    'Recovery envelope'
  );
  if (envelope.contract !== RECOVERY_ENVELOPE_CONTRACT) throw new Error('Recovery envelope contract is unsupported.');
  const kdf = expectExactKeys(envelope.kdf, ['name', 'saltBase64url', 'infoBase64url'], 'Recovery envelope KDF');
  const cipher = expectExactKeys(
    envelope.cipher,
    ['name', 'nonceBase64url', 'ciphertextBase64url', 'tagBase64url'],
    'Recovery envelope cipher'
  );
  const plaintext = expectExactKeys(envelope.plaintext, ['bytes', 'sha256'], 'Recovery envelope plaintext');
  const mac = expectExactKeys(envelope.mac, ['name', 'valueBase64url'], 'Recovery envelope MAC');
  const recordContract = requireCanonicalText(envelope.recordContract, 'Recovery record contract');
  const domain = requireCanonicalText(envelope.domain, 'Recovery domain');
  const recordId = requireCanonicalText(envelope.recordId, 'Recovery record ID');
  const expectedInfo = base64url(Buffer.from(`${domain}\0${recordId}`, 'utf8'));
  if (kdf.name !== 'HKDF-SHA-256' || kdf.infoBase64url !== expectedInfo) {
    throw new Error('Recovery envelope KDF identity or info is invalid.');
  }
  decodeBase64url(kdf.saltBase64url, 32, 'Recovery envelope salt');
  if (cipher.name !== 'AES-256-GCM') throw new Error('Recovery envelope cipher is unsupported.');
  decodeBase64url(cipher.nonceBase64url, 12, 'Recovery envelope nonce');
  decodeBase64url(cipher.ciphertextBase64url, null, 'Recovery envelope ciphertext', true);
  decodeBase64url(cipher.tagBase64url, 16, 'Recovery envelope tag');
  if (
    !Number.isSafeInteger(plaintext.bytes) ||
    (plaintext.bytes as number) < 0 ||
    (plaintext.bytes as number) > MAX_PLAINTEXT_BYTES
  ) {
    throw new Error('Recovery envelope plaintext length is invalid.');
  }
  requireSha256(plaintext.sha256, 'Recovery envelope plaintext digest');
  if (mac.name !== 'HMAC-SHA-256') throw new Error('Recovery envelope MAC is unsupported.');
  decodeBase64url(mac.valueBase64url, 32, 'Recovery envelope MAC');
  return {
    contract: RECOVERY_ENVELOPE_CONTRACT,
    recordContract,
    domain,
    keyId: requireKeyId(envelope.keyId, 'Recovery envelope key ID'),
    recordId,
    createdAt: requireTimestamp(envelope.createdAt, 'Recovery envelope creation time'),
    kdf: {
      name: 'HKDF-SHA-256',
      saltBase64url: kdf.saltBase64url as string,
      infoBase64url: kdf.infoBase64url as string,
    },
    cipher: {
      name: 'AES-256-GCM',
      nonceBase64url: cipher.nonceBase64url as string,
      ciphertextBase64url: cipher.ciphertextBase64url as string,
      tagBase64url: cipher.tagBase64url as string,
    },
    plaintext: { bytes: plaintext.bytes as number, sha256: plaintext.sha256 as string },
    mac: { name: 'HMAC-SHA-256', valueBase64url: mac.valueBase64url as string },
  };
}

export class DuplicateRecoveryTupleError extends Error {
  readonly quarantinedRecordDigests: readonly string[];

  constructor(digests: readonly string[]) {
    super('Duplicate external-recovery key/salt/nonce tuple detected; every implicated record is quarantined.');
    this.name = 'DuplicateRecoveryTupleError';
    this.quarantinedRecordDigests = digests;
  }
}

/** Process-lifetime tuple authority. Populate it from every live envelope before accepting new records. */
export class RecoveryTupleRegistry {
  readonly #records = new Map<string, string>();
  readonly #quarantined = new Set<string>();

  observe(envelope: RecoveryEnvelope, recordDigest: string): void {
    const keyId = requireKeyId(envelope.keyId, 'Recovery tuple key ID');
    const salt = base64url(decodeBase64url(envelope.kdf.saltBase64url, 32, 'Recovery tuple salt'));
    const nonce = base64url(decodeBase64url(envelope.cipher.nonceBase64url, 12, 'Recovery tuple nonce'));
    const checkedRecordDigest = requireSha256(recordDigest, 'Recovery tuple record digest');
    const tuple = `${keyId}\0${salt}\0${nonce}`;
    const previous = this.#records.get(tuple);
    if (!previous) {
      this.#records.set(tuple, checkedRecordDigest);
      return;
    }
    if (previous === checkedRecordDigest) return;
    this.#quarantined.add(previous);
    this.#quarantined.add(checkedRecordDigest);
    throw new DuplicateRecoveryTupleError([...this.#quarantined].toSorted(compareCodeUnits));
  }

  /** Return the complete set of records rejected because a cryptographic tuple was reused. */
  quarantinedRecordDigests(): readonly string[] {
    return [...this.#quarantined].toSorted(compareCodeUnits);
  }
}

/** Seal one record with fresh module-owned salt and nonce. Neither value is caller-controllable. */
export function sealExternalRecoveryRecord(
  input: SealExternalRecoveryRecordInput,
  secret: Uint8Array,
  tupleRegistry: RecoveryTupleRegistry
): Buffer {
  expectExactKeys(
    input as unknown,
    ['recordContract', 'domain', 'recordId', 'createdAt', 'plaintext'],
    'External recovery seal input'
  );
  if (input.plaintext.byteLength > MAX_PLAINTEXT_BYTES) throw new Error('Recovery plaintext exceeds its size limit.');
  const recordContract = requireCanonicalText(input.recordContract, 'Recovery record contract');
  const domain = requireCanonicalText(input.domain, 'Recovery domain');
  const recordId = requireCanonicalText(input.recordId, 'Recovery record ID');
  const createdAt = requireTimestamp(input.createdAt, 'Recovery record creation time');
  const secretBytes = requireSecret(secret);
  const plaintext = Buffer.from(input.plaintext);
  try {
    const keyId = deriveRecoveryKeyId(secretBytes);
    const salt = randomBytes(32);
    const nonce = randomBytes(12);
    const info = Buffer.from(`${domain}\0${recordId}`, 'utf8');
    try {
      const kdf: RecoveryKdf = {
        name: 'HKDF-SHA-256',
        saltBase64url: base64url(salt),
        infoBase64url: base64url(info),
      };
      const plaintextDescription: RecoveryPlaintext = { bytes: plaintext.length, sha256: sha256(plaintext) };
      const aad = canonicalizeRecoveryJson({
        contract: RECOVERY_ENVELOPE_CONTRACT,
        recordContract,
        domain,
        keyId,
        recordId,
        createdAt,
        kdf,
        plaintext: plaintextDescription,
      });
      const recordKey = deriveRecoveryRecordKey(secretBytes, salt, domain, recordId);
      const roots = deriveRecoveryRootKeys(secretBytes);
      try {
        const cipher = createCipheriv('aes-256-gcm', recordKey, nonce, { authTagLength: 16 });
        cipher.setAAD(aad);
        const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
        const envelopeWithoutAuthentication: Omit<RecoveryEnvelope, 'mac'> = {
          contract: RECOVERY_ENVELOPE_CONTRACT,
          recordContract,
          domain,
          keyId,
          recordId,
          createdAt,
          kdf,
          cipher: {
            name: 'AES-256-GCM',
            nonceBase64url: base64url(nonce),
            ciphertextBase64url: base64url(ciphertext),
            tagBase64url: base64url(cipher.getAuthTag()),
          },
          plaintext: plaintextDescription,
        };
        const envelope: RecoveryEnvelope = {
          ...envelopeWithoutAuthentication,
          mac: {
            name: 'HMAC-SHA-256',
            valueBase64url: createHmac('sha256', roots.macKey)
              .update(canonicalizeRecoveryJson(envelopeWithoutAuthentication))
              .digest('base64url'),
          },
        };
        const canonicalBytes = canonicalizeRecoveryJson(envelope);
        tupleRegistry.observe(envelope, sha256(canonicalBytes));
        return canonicalBytes;
      } finally {
        recordKey.fill(0);
        roots.encryptionKey.fill(0);
        roots.macKey.fill(0);
      }
    } finally {
      info.fill(0);
      salt.fill(0);
      nonce.fill(0);
    }
  } finally {
    secretBytes.fill(0);
    plaintext.fill(0);
  }
}

/** Authenticate and decrypt an exact canonical envelope without parsing its plaintext. */
export function openExternalRecoveryRecord(
  canonicalBytes: Uint8Array,
  secret: Uint8Array,
  tupleRegistry: RecoveryTupleRegistry
): OpenedExternalRecoveryRecord {
  const serialized = Buffer.from(canonicalBytes);
  const envelope = parseEnvelope(parseCanonicalRecoveryJson(serialized));
  const secretBytes = requireSecret(secret);
  if (deriveRecoveryKeyId(secretBytes) !== envelope.keyId) {
    secretBytes.fill(0);
    throw new Error('Recovery envelope key ID does not match the vault secret.');
  }
  const roots = deriveRecoveryRootKeys(secretBytes);
  const suppliedMac = decodeBase64url(envelope.mac.valueBase64url, 32, 'Recovery envelope MAC');
  const expectedMac = createHmac('sha256', roots.macKey)
    .update(canonicalizeRecoveryJson(envelopeWithoutMac(envelope)))
    .digest();
  if (!safeEqual(suppliedMac, expectedMac)) {
    roots.encryptionKey.fill(0);
    roots.macKey.fill(0);
    secretBytes.fill(0);
    throw new Error('Recovery envelope MAC authentication failed.');
  }
  const salt = decodeBase64url(envelope.kdf.saltBase64url, 32, 'Recovery envelope salt');
  const nonce = decodeBase64url(envelope.cipher.nonceBase64url, 12, 'Recovery envelope nonce');
  const recordKey = deriveRecoveryRecordKey(secretBytes, salt, envelope.domain, envelope.recordId);
  let plaintext: Buffer;
  let unauthenticatedPlaintext: Buffer | undefined;
  try {
    const decipher = createDecipheriv('aes-256-gcm', recordKey, nonce, { authTagLength: 16 });
    const { cipher: _cipher, mac: _mac, ...aadSource } = envelope;
    decipher.setAAD(envelopeAad(aadSource));
    decipher.setAuthTag(decodeBase64url(envelope.cipher.tagBase64url, 16, 'Recovery envelope tag'));
    unauthenticatedPlaintext = decipher.update(
      decodeBase64url(envelope.cipher.ciphertextBase64url, null, 'Recovery envelope ciphertext', true)
    );
    plaintext = Buffer.concat([unauthenticatedPlaintext, decipher.final()]);
    unauthenticatedPlaintext.fill(0);
  } catch (error) {
    unauthenticatedPlaintext?.fill(0);
    throw new Error('Recovery envelope AES-GCM authentication failed.', { cause: error });
  } finally {
    recordKey.fill(0);
    roots.encryptionKey.fill(0);
    roots.macKey.fill(0);
    secretBytes.fill(0);
  }
  if (plaintext.length !== envelope.plaintext.bytes || sha256(plaintext) !== envelope.plaintext.sha256) {
    plaintext.fill(0);
    throw new Error('Recovery plaintext failed its length or digest check.');
  }
  const envelopeSha256 = sha256(serialized);
  try {
    tupleRegistry.observe(envelope, envelopeSha256);
  } catch (error) {
    plaintext.fill(0);
    throw error;
  }
  return {
    recordContract: envelope.recordContract,
    domain: envelope.domain,
    keyId: envelope.keyId,
    recordId: envelope.recordId,
    createdAt: envelope.createdAt,
    plaintext,
    envelopeSha256,
  };
}

function requireSortedDigests(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  const result = value.map((entry, index) => requireSha256(entry, `${label}[${index}]`));
  if (result.some((entry, index) => index > 0 && result[index - 1] >= entry)) {
    throw new Error(`${label} must be sorted and unique.`);
  }
  return result;
}

function eventWithoutMacs(event: RecoveryKeyEvent): Omit<RecoveryKeyEvent, 'macs'> {
  const { macs: _macs, ...withoutMacs } = event;
  return withoutMacs;
}

function eventMac(event: Omit<RecoveryKeyEvent, 'macs'>, secret: Uint8Array): string {
  const roots = deriveRecoveryRootKeys(secret);
  try {
    return createHmac('sha256', roots.macKey).update(canonicalizeRecoveryJson(event)).digest('base64url');
  } finally {
    roots.encryptionKey.fill(0);
    roots.macKey.fill(0);
  }
}

function finishEvent(event: RecoveryKeyEvent): RecoveryKeyEventResult {
  const canonicalBytes = canonicalizeRecoveryJson(event);
  return { event, canonicalBytes, sha256: sha256(canonicalBytes) };
}

/** Create the single-MAC genesis authority event for a newly vaulted key. */
export function createRecoveryKeyCreatedEvent(input: {
  secret: Uint8Array;
  newVaultRef: string;
  createdAt: string;
  coveredRecordDigests: readonly string[];
}): RecoveryKeyEventResult {
  const newKeyId = deriveRecoveryKeyId(input.secret);
  const eventWithoutAuthentication: Omit<RecoveryKeyEvent, 'macs'> = {
    contract: RECOVERY_KEY_EVENT_CONTRACT,
    sequence: 0,
    previousEventSha256: null,
    kind: 'created',
    oldKeyId: null,
    newKeyId,
    newVaultRef: requireCanonicalText(input.newVaultRef, 'Recovery vault reference'),
    createdAt: requireTimestamp(input.createdAt, 'Recovery key creation time'),
    coveredRecordDigests: requireSortedDigests([...input.coveredRecordDigests], 'Covered record digests'),
  };
  return finishEvent({
    ...eventWithoutAuthentication,
    macs: [{ keyId: newKeyId, valueBase64url: eventMac(eventWithoutAuthentication, input.secret) }],
  });
}

/** Create a rotation event authenticated independently by both the old and the new vault secrets. */
export function createRecoveryKeyRotatedEvent(input: {
  oldSecret: Uint8Array;
  newSecret: Uint8Array;
  sequence: number;
  previousEventSha256: string;
  newVaultRef: string;
  createdAt: string;
  coveredRecordDigests: readonly string[];
}): RecoveryKeyEventResult {
  if (!Number.isSafeInteger(input.sequence) || input.sequence < 1)
    throw new Error('Recovery rotation sequence is invalid.');
  const oldKeyId = deriveRecoveryKeyId(input.oldSecret);
  const newKeyId = deriveRecoveryKeyId(input.newSecret);
  if (oldKeyId === newKeyId) throw new Error('Recovery rotation requires a distinct new key.');
  const eventWithoutAuthentication: Omit<RecoveryKeyEvent, 'macs'> = {
    contract: RECOVERY_KEY_EVENT_CONTRACT,
    sequence: input.sequence,
    previousEventSha256: requireSha256(input.previousEventSha256, 'Recovery predecessor digest'),
    kind: 'rotated',
    oldKeyId,
    newKeyId,
    newVaultRef: requireCanonicalText(input.newVaultRef, 'Recovery vault reference'),
    createdAt: requireTimestamp(input.createdAt, 'Recovery key rotation time'),
    coveredRecordDigests: requireSortedDigests([...input.coveredRecordDigests], 'Covered record digests'),
  };
  const macs = [
    { keyId: oldKeyId, valueBase64url: eventMac(eventWithoutAuthentication, input.oldSecret) },
    { keyId: newKeyId, valueBase64url: eventMac(eventWithoutAuthentication, input.newSecret) },
  ].toSorted((left, right) => compareCodeUnits(left.keyId, right.keyId));
  return finishEvent({ ...eventWithoutAuthentication, macs });
}

function parseEvent(value: unknown): RecoveryKeyEvent {
  const event = expectExactKeys(
    value,
    [
      'contract',
      'sequence',
      'previousEventSha256',
      'kind',
      'oldKeyId',
      'newKeyId',
      'newVaultRef',
      'createdAt',
      'coveredRecordDigests',
      'macs',
    ],
    'Recovery key event'
  );
  if (event.contract !== RECOVERY_KEY_EVENT_CONTRACT) throw new Error('Recovery key event contract is unsupported.');
  if (!Number.isSafeInteger(event.sequence) || (event.sequence as number) < 0)
    throw new Error('Recovery key event sequence is invalid.');
  if (event.kind !== 'created' && event.kind !== 'rotated') throw new Error('Recovery key event kind is invalid.');
  if (!Array.isArray(event.macs)) throw new Error('Recovery key event MACs must be an array.');
  const macs = event.macs.map((entry, index) => {
    const mac = expectExactKeys(entry, ['keyId', 'valueBase64url'], `Recovery key event MAC ${index}`);
    return {
      keyId: requireKeyId(mac.keyId, `Recovery key event MAC ${index} key ID`),
      valueBase64url: base64url(decodeBase64url(mac.valueBase64url, 32, `Recovery key event MAC ${index}`)),
    };
  });
  if (macs.some((entry, index) => index > 0 && macs[index - 1].keyId >= entry.keyId)) {
    throw new Error('Recovery key event MACs must be sorted and unique.');
  }
  return {
    contract: RECOVERY_KEY_EVENT_CONTRACT,
    sequence: event.sequence as number,
    previousEventSha256:
      event.previousEventSha256 === null
        ? null
        : requireSha256(event.previousEventSha256, 'Recovery key event predecessor'),
    kind: event.kind,
    oldKeyId: event.oldKeyId === null ? null : requireKeyId(event.oldKeyId, 'Recovery old key ID'),
    newKeyId: requireKeyId(event.newKeyId, 'Recovery new key ID'),
    newVaultRef: requireCanonicalText(event.newVaultRef, 'Recovery new vault reference'),
    createdAt: requireTimestamp(event.createdAt, 'Recovery key event creation time'),
    coveredRecordDigests: requireSortedDigests(event.coveredRecordDigests, 'Covered record digests'),
    macs,
  };
}

function verifyEventMacs(
  event: RecoveryKeyEvent,
  secrets: ReadonlyMap<string, Uint8Array>,
  requiredKeyIds: string[]
): void {
  const actualKeyIds = event.macs.map((mac) => mac.keyId);
  const expectedKeyIds = [...requiredKeyIds].toSorted(compareCodeUnits);
  if (
    actualKeyIds.length !== expectedKeyIds.length ||
    actualKeyIds.some((keyId, index) => keyId !== expectedKeyIds[index])
  ) {
    throw new Error('Recovery key event has a missing, extra, or single-sided rotation MAC.');
  }
  const unsigned = eventWithoutMacs(event);
  for (const mac of event.macs) {
    const secret = secrets.get(mac.keyId);
    if (!secret || deriveRecoveryKeyId(secret) !== mac.keyId) {
      throw new Error(`Recovery authority is missing required key ${mac.keyId}.`);
    }
    const expected = decodeBase64url(eventMac(unsigned, secret), 32, 'Expected recovery key event MAC');
    const supplied = decodeBase64url(mac.valueBase64url, 32, 'Recovery key event MAC');
    if (!safeEqual(expected, supplied)) throw new Error('Recovery key event MAC authentication failed.');
  }
}

function parseClaimedState(value: unknown): RecoveryKeyState {
  const state = expectExactKeys(
    value,
    ['contract', 'activeKeyId', 'keys', 'authorityHeadSha256'],
    'Recovery key state'
  );
  if (state.contract !== RECOVERY_KEY_STATE_CONTRACT) throw new Error('Recovery key state contract is unsupported.');
  if (!Array.isArray(state.keys) || state.keys.length === 0) throw new Error('Recovery key state keys are invalid.');
  const keys = state.keys.map((entry, index) => {
    const key = expectExactKeys(
      entry,
      ['keyId', 'status', 'createdAt', 'retiredAt', 'vaultRef'],
      `Recovery state key ${index}`
    );
    if (key.status !== 'active' && key.status !== 'retired') throw new Error('Recovery state key status is invalid.');
    if ((key.status === 'active') !== (key.retiredAt === null))
      throw new Error('Recovery state retirement fields are inconsistent.');
    return {
      keyId: requireKeyId(key.keyId, `Recovery state key ${index} ID`),
      status: key.status as 'active' | 'retired',
      createdAt: requireTimestamp(key.createdAt, `Recovery state key ${index} creation time`),
      retiredAt:
        key.retiredAt === null ? null : requireTimestamp(key.retiredAt, `Recovery state key ${index} retirement time`),
      vaultRef: requireCanonicalText(key.vaultRef, `Recovery state key ${index} vault reference`),
    };
  });
  if (keys.some((key, index) => index > 0 && keys[index - 1].keyId >= key.keyId)) {
    throw new Error('Recovery state keys must be sorted and unique.');
  }
  if (keys.filter((key) => key.status === 'active').length !== 1)
    throw new Error('Recovery state must contain exactly one active key.');
  const activeKeyId = requireKeyId(state.activeKeyId, 'Recovery state active key ID');
  if (!keys.some((key) => key.keyId === activeKeyId && key.status === 'active')) {
    throw new Error('Recovery state active key claim is inconsistent.');
  }
  return {
    contract: RECOVERY_KEY_STATE_CONTRACT,
    activeKeyId,
    keys,
    authorityHeadSha256: requireSha256(state.authorityHeadSha256, 'Recovery authority head digest'),
  };
}

/**
 * Verify the complete event set, require every active and retired secret, derive state, and optionally prove the
 * persisted state is byte-for-byte equal to that derivation.
 */
export function deriveAndVerifyRecoveryKeyState(
  canonicalEventBytes: readonly Uint8Array[],
  secrets: ReadonlyMap<string, Uint8Array>,
  claimedCanonicalState?: Uint8Array
): { state: RecoveryKeyState; canonicalBytes: Buffer; coveredRecordDigests: readonly string[] } {
  if (canonicalEventBytes.length === 0) throw new Error('Recovery key event chain is missing.');
  const events = canonicalEventBytes
    .map((bytes) => {
      const canonicalBytes = Buffer.from(bytes);
      return {
        event: parseEvent(parseCanonicalRecoveryJson(canonicalBytes)),
        canonicalBytes,
        digest: sha256(canonicalBytes),
      };
    })
    .toSorted((left, right) => left.event.sequence - right.event.sequence);
  if (events.some((entry, index) => entry.event.sequence !== index)) {
    throw new Error('Recovery key event chain has a fork, duplicate, or skipped sequence.');
  }
  const successorPredecessors = new Set<string>();
  const keyEntries = new Map<
    string,
    { keyId: string; status: 'active' | 'retired'; createdAt: string; retiredAt: string | null; vaultRef: string }
  >();
  let activeKeyId = '';
  for (let index = 0; index < events.length; index += 1) {
    const { event, digest } = events[index];
    if (index === 0) {
      if (
        event.sequence !== 0 ||
        event.kind !== 'created' ||
        event.previousEventSha256 !== null ||
        event.oldKeyId !== null
      ) {
        throw new Error('Recovery key event genesis is invalid.');
      }
      verifyEventMacs(event, secrets, [event.newKeyId]);
    } else {
      const predecessor = events[index - 1].digest;
      if (
        event.kind !== 'rotated' ||
        event.previousEventSha256 !== predecessor ||
        event.oldKeyId !== activeKeyId ||
        event.newKeyId === activeKeyId ||
        keyEntries.has(event.newKeyId)
      ) {
        throw new Error('Recovery key event rotation does not extend the unique authority head.');
      }
      if ([...keyEntries.values()].some((entry) => entry.vaultRef === event.newVaultRef)) {
        throw new Error('Recovery rotation reused a vault reference and would discard a required retired key.');
      }
      if (successorPredecessors.has(event.previousEventSha256)) throw new Error('Recovery key event chain is forked.');
      successorPredecessors.add(event.previousEventSha256);
      verifyEventMacs(event, secrets, [event.oldKeyId, event.newKeyId]);
      const retired = keyEntries.get(event.oldKeyId);
      if (!retired) throw new Error('Recovery rotation references an unknown old key.');
      retired.status = 'retired';
      retired.retiredAt = event.createdAt;
    }
    activeKeyId = event.newKeyId;
    keyEntries.set(event.newKeyId, {
      keyId: event.newKeyId,
      status: 'active',
      createdAt: event.createdAt,
      retiredAt: null,
      vaultRef: event.newVaultRef,
    });
    if (digest !== sha256(canonicalizeRecoveryJson(event)))
      throw new Error('Recovery key event canonical digest is inconsistent.');
  }
  for (const keyId of keyEntries.keys()) {
    const secret = secrets.get(keyId);
    if (!secret || deriveRecoveryKeyId(secret) !== keyId)
      throw new Error(`Recovery authority is missing required key ${keyId}.`);
  }
  const state: RecoveryKeyState = {
    contract: RECOVERY_KEY_STATE_CONTRACT,
    activeKeyId,
    keys: [...keyEntries.values()].toSorted((left, right) => compareCodeUnits(left.keyId, right.keyId)),
    authorityHeadSha256: events.at(-1)!.digest,
  };
  const canonicalBytes = canonicalizeRecoveryJson(state);
  if (claimedCanonicalState) {
    const supplied = Buffer.from(claimedCanonicalState);
    parseClaimedState(parseCanonicalRecoveryJson(supplied));
    if (!supplied.equals(canonicalBytes))
      throw new Error('Recovery key state is not byte-equal to authenticated derived state.');
  }
  return { state, canonicalBytes, coveredRecordDigests: events.at(-1)!.event.coveredRecordDigests };
}

/**
 * Strict load gate: require a persisted state and the complete current live-record set to equal authenticated
 * event-derived authority. Use this rather than derivation alone when opening an existing recovery repository.
 */
export function verifyRecoveryKeyState(
  canonicalEventBytes: readonly Uint8Array[],
  secrets: ReadonlyMap<string, Uint8Array>,
  claimedCanonicalState: Uint8Array,
  liveRecordDigests: readonly string[]
): { state: RecoveryKeyState; canonicalBytes: Buffer; coveredRecordDigests: readonly string[] } {
  const expectedLiveRecords = requireSortedDigests([...liveRecordDigests], 'Live recovery record digests');
  const verified = deriveAndVerifyRecoveryKeyState(canonicalEventBytes, secrets, claimedCanonicalState);
  if (
    verified.coveredRecordDigests.length !== expectedLiveRecords.length ||
    verified.coveredRecordDigests.some((digest, index) => digest !== expectedLiveRecords[index])
  ) {
    throw new Error('Recovery authority event does not cover the complete live record set.');
  }
  return verified;
}

function parseSameDeviceWrap(value: unknown): SameDeviceRecoveryWrap {
  const wrap = expectExactKeys(
    value,
    [
      'contract',
      'keyId',
      'createdAt',
      'vaultProvider',
      'vaultRef',
      'wrappedSecretBase64url',
      'wrappedCiphertextSha256',
    ],
    'Same-device recovery wrap'
  );
  if (wrap.contract !== RECOVERY_SAME_DEVICE_WRAP_CONTRACT)
    throw new Error('Same-device recovery wrap contract is unsupported.');
  decodeBase64url(wrap.wrappedSecretBase64url, null, 'Same-device wrapped secret');
  return {
    contract: RECOVERY_SAME_DEVICE_WRAP_CONTRACT,
    keyId: requireKeyId(wrap.keyId, 'Same-device recovery key ID'),
    createdAt: requireTimestamp(wrap.createdAt, 'Same-device recovery creation time'),
    vaultProvider: requireCanonicalText(wrap.vaultProvider, 'Same-device vault provider'),
    vaultRef: requireCanonicalText(wrap.vaultRef, 'Same-device vault reference'),
    wrappedSecretBase64url: wrap.wrappedSecretBase64url as string,
    wrappedCiphertextSha256: requireSha256(wrap.wrappedCiphertextSha256, 'Same-device wrapped ciphertext digest'),
  };
}

/** Describe ciphertext already produced by the active platform vault without weakening it with a fallback. */
export function createSameDeviceRecoveryWrap(input: {
  secret: Uint8Array;
  createdAt: string;
  vaultProvider: string;
  vaultRef: string;
  wrappedSecret: Uint8Array;
}): Buffer {
  expectExactKeys(
    input as unknown,
    ['secret', 'createdAt', 'vaultProvider', 'vaultRef', 'wrappedSecret'],
    'Same-device recovery wrap input'
  );
  const wrappedSecret = Buffer.from(input.wrappedSecret);
  if (wrappedSecret.length === 0) throw new Error('Same-device wrapped secret is empty.');
  return canonicalizeRecoveryJson({
    contract: RECOVERY_SAME_DEVICE_WRAP_CONTRACT,
    keyId: deriveRecoveryKeyId(input.secret),
    createdAt: requireTimestamp(input.createdAt, 'Same-device recovery creation time'),
    vaultProvider: requireCanonicalText(input.vaultProvider, 'Same-device vault provider'),
    vaultRef: requireCanonicalText(input.vaultRef, 'Same-device vault reference'),
    wrappedSecretBase64url: base64url(wrappedSecret),
    wrappedCiphertextSha256: sha256(wrappedSecret),
  } satisfies SameDeviceRecoveryWrap);
}

/** Verify wrap bytes and vault identity before invoking the platform vault, then bind the result to its key ID. */
export async function openSameDeviceRecoveryWrap(
  canonicalBytes: Uint8Array,
  vault: {
    provider: string;
    vaultRef: string;
    unwrap: (wrappedSecret: Buffer) => Promise<Uint8Array> | Uint8Array;
  }
): Promise<Buffer> {
  const wrap = parseSameDeviceWrap(parseCanonicalRecoveryJson(canonicalBytes));
  if (wrap.vaultProvider !== vault.provider || wrap.vaultRef !== vault.vaultRef) {
    throw new Error('Same-device recovery wrap does not match the active platform vault.');
  }
  const wrappedSecret = decodeBase64url(wrap.wrappedSecretBase64url, null, 'Same-device wrapped secret');
  if (sha256(wrappedSecret) !== wrap.wrappedCiphertextSha256) {
    throw new Error('Same-device wrapped ciphertext digest is invalid.');
  }
  const secret = requireSecret(await vault.unwrap(wrappedSecret));
  if (deriveRecoveryKeyId(secret) !== wrap.keyId) {
    secret.fill(0);
    throw new Error('Same-device recovery secret does not match its key ID.');
  }
  return secret;
}
