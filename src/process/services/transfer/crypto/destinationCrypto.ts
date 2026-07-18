import { CipherSuite, HkdfSha256 } from '@hpke/core';
import { Chacha20Poly1305 } from '@hpke/chacha20poly1305';
import { DhkemX25519HkdfSha256 } from '@hpke/dhkem-x25519';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';
import { contentDigest, type RecoveryChunkMetadata } from './recoveryCrypto';
import { parseStrictJson } from './strictJson';

export const DESTINATION_CRYPTO_FORMAT = 'wayland-transfer-destination-chunk/1' as const;
export const DESTINATION_CRYPTO_SUITE = 'WT-D1' as const;
export const DESTINATION_KEM = 'DHKEM(X25519,HKDF-SHA256)' as const;
export const DESTINATION_KDF = 'HKDF-SHA256' as const;
export const DESTINATION_AEAD = 'ChaCha20-Poly1305' as const;
export const DESTINATION_PUBLIC_KEY_BYTES = 32 as const;
export const DESTINATION_ENCAPSULATED_KEY_BYTES = 32 as const;
export const DESTINATION_TAG_BYTES = 16 as const;
export const DESTINATION_MAX_CHUNK_BYTES = 64 * 1024 * 1024;
export const DESTINATION_MAX_KEY_LIFETIME_MS = 15 * 60 * 1000;

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;
const ROOT_FIELDS = new Set([
  'format',
  'suite',
  'kem',
  'kdf',
  'aead',
  'recipientKeyId',
  'recipientFingerprint',
  'bundleId',
  'schema',
  'ordinal',
  'declaredLength',
  'contentDigest',
  'encapsulatedKey',
  'ciphertext',
]);
const HPKE_INFO_PREFIX = 'wayland-transfer/wt-d1/info/1';
const HPKE_AAD_PREFIX = 'wayland-transfer/wt-d1/aad/1';

const suite = new CipherSuite({
  kem: new DhkemX25519HkdfSha256(),
  kdf: new HkdfSha256(),
  aead: new Chacha20Poly1305(),
});

export type DestinationRecipientDescriptor = {
  suite: typeof DESTINATION_CRYPTO_SUITE;
  keyId: string;
  publicKey: string;
  fingerprint: string;
  expiresAt: number;
};

export type DestinationChunkEncryptionInput = RecoveryChunkMetadata & {
  plaintext: Uint8Array;
};

export type DestinationChunkEnvelope = RecoveryChunkMetadata & {
  format: typeof DESTINATION_CRYPTO_FORMAT;
  suite: typeof DESTINATION_CRYPTO_SUITE;
  kem: typeof DESTINATION_KEM;
  kdf: typeof DESTINATION_KDF;
  aead: typeof DESTINATION_AEAD;
  recipientKeyId: string;
  recipientFingerprint: string;
  encapsulatedKey: string;
  ciphertext: string;
};

export type DecryptedDestinationChunk = RecoveryChunkMetadata & {
  plaintext: Uint8Array;
};

export class DestinationRecipientKey {
  private keyPair: CryptoKeyPair | undefined;

  private constructor(
    private readonly recipient: DestinationRecipientDescriptor,
    keyPair: CryptoKeyPair,
    private readonly now: () => number
  ) {
    this.keyPair = keyPair;
  }

  static async issue(input: {
    keyId: string;
    expiresAt: number;
    now?: () => number;
  }): Promise<DestinationRecipientKey> {
    const now = input.now ?? Date.now;
    validateKeyId(input.keyId);
    if (!Number.isSafeInteger(input.expiresAt)) throw new Error('Invalid destination key expiry');
    const lifetime = input.expiresAt - now();
    if (lifetime <= 0 || lifetime > DESTINATION_MAX_KEY_LIFETIME_MS)
      throw new Error('Destination key expiry must be within 15 minutes');

    const keyPair = await suite.kem.generateKeyPair();
    const publicKey = new Uint8Array(await suite.kem.serializePublicKey(keyPair.publicKey));
    const descriptor: DestinationRecipientDescriptor = {
      suite: DESTINATION_CRYPTO_SUITE,
      keyId: input.keyId,
      publicKey: encodeBase64Url(publicKey),
      fingerprint: fingerprint(publicKey),
      expiresAt: input.expiresAt,
    };
    return new DestinationRecipientKey(descriptor, keyPair, now);
  }

  descriptor(): Readonly<DestinationRecipientDescriptor> {
    return Object.freeze({ ...this.recipient });
  }

  destroy(): void {
    this.keyPair = undefined;
  }

  async openChunk(serializedEnvelope: Uint8Array | string): Promise<DecryptedDestinationChunk> {
    const keyPair = this.keyPair;
    if (!keyPair) throw new Error('Destination key is destroyed');
    if (this.now() >= this.recipient.expiresAt) {
      this.destroy();
      throw new Error('Destination key is expired');
    }

    const envelope = parseDestinationChunkEnvelope(serializedEnvelope);
    if (
      envelope.recipientKeyId !== this.recipient.keyId ||
      envelope.recipientFingerprint !== this.recipient.fingerprint
    )
      throw new Error('Destination recipient binding mismatch');

    const enc = decodeBase64Url(envelope.encapsulatedKey, DESTINATION_ENCAPSULATED_KEY_BYTES, 'encapsulated key');
    const ciphertext = decodeBase64Url(
      envelope.ciphertext,
      envelope.declaredLength + DESTINATION_TAG_BYTES,
      'ciphertext'
    );
    let plaintext: Uint8Array;
    try {
      plaintext = new Uint8Array(
        await suite.open(
          {
            recipientKey: keyPair.privateKey,
            enc,
            info: buildDestinationInfo(envelope),
          },
          ciphertext,
          buildDestinationAssociatedData(envelope)
        )
      );
    } catch {
      throw new Error('Destination chunk authentication failed');
    }
    assertPlaintextMatchesMetadata(plaintext, envelope);
    return {
      bundleId: envelope.bundleId,
      schema: envelope.schema,
      ordinal: envelope.ordinal,
      declaredLength: envelope.declaredLength,
      contentDigest: envelope.contentDigest,
      plaintext,
    };
  }
}

export async function encryptDestinationChunk(
  input: DestinationChunkEncryptionInput,
  recipient: DestinationRecipientDescriptor
): Promise<Uint8Array> {
  validateMetadata(input);
  validateRecipient(recipient);
  if (!(input.plaintext instanceof Uint8Array)) throw new Error('Plaintext must be bytes');
  assertPlaintextMatchesMetadata(input.plaintext, input);

  const publicKeyBytes = decodeBase64Url(recipient.publicKey, DESTINATION_PUBLIC_KEY_BYTES, 'public key');
  if (fingerprint(publicKeyBytes) !== recipient.fingerprint)
    throw new Error('Destination public-key fingerprint mismatch');

  let recipientPublicKey: CryptoKey;
  try {
    recipientPublicKey = await suite.kem.deserializePublicKey(publicKeyBytes);
  } catch {
    throw new Error('Malformed destination public key');
  }

  const metadata = {
    ...input,
    recipientKeyId: recipient.keyId,
    recipientFingerprint: recipient.fingerprint,
  };
  let sealed: { enc: ArrayBuffer; ct: ArrayBuffer };
  try {
    sealed = await suite.seal(
      {
        recipientPublicKey,
        info: buildDestinationInfo(metadata),
      },
      input.plaintext,
      buildDestinationAssociatedData(metadata)
    );
  } catch {
    throw new Error('Destination chunk encryption failed');
  }

  return serializeDestinationChunkEnvelope({
    format: DESTINATION_CRYPTO_FORMAT,
    suite: DESTINATION_CRYPTO_SUITE,
    kem: DESTINATION_KEM,
    kdf: DESTINATION_KDF,
    aead: DESTINATION_AEAD,
    recipientKeyId: recipient.keyId,
    recipientFingerprint: recipient.fingerprint,
    bundleId: input.bundleId,
    schema: input.schema,
    ordinal: input.ordinal,
    declaredLength: input.declaredLength,
    contentDigest: input.contentDigest,
    encapsulatedKey: encodeBase64Url(new Uint8Array(sealed.enc)),
    ciphertext: encodeBase64Url(new Uint8Array(sealed.ct)),
  });
}

export function parseDestinationChunkEnvelope(serializedEnvelope: Uint8Array | string): DestinationChunkEnvelope {
  let text: string;
  try {
    text = typeof serializedEnvelope === 'string' ? serializedEnvelope : decoder.decode(serializedEnvelope);
  } catch {
    throw new Error('Destination envelope is not valid UTF-8');
  }
  const parsed = parseStrictJson(text);
  if (!isRecord(parsed)) throw new Error('Destination envelope must be an object');
  assertExactFields(parsed, ROOT_FIELDS, 'envelope');
  const envelope = parsed as DestinationChunkEnvelope;
  validateEnvelope(envelope);
  return envelope;
}

export function serializeDestinationChunkEnvelope(envelope: DestinationChunkEnvelope): Uint8Array {
  assertExactFields(envelope as unknown as Record<string, unknown>, ROOT_FIELDS, 'envelope');
  validateEnvelope(envelope);
  return encoder.encode(
    JSON.stringify({
      format: envelope.format,
      suite: envelope.suite,
      kem: envelope.kem,
      kdf: envelope.kdf,
      aead: envelope.aead,
      recipientKeyId: envelope.recipientKeyId,
      recipientFingerprint: envelope.recipientFingerprint,
      bundleId: envelope.bundleId,
      schema: envelope.schema,
      ordinal: envelope.ordinal,
      declaredLength: envelope.declaredLength,
      contentDigest: envelope.contentDigest,
      encapsulatedKey: envelope.encapsulatedKey,
      ciphertext: envelope.ciphertext,
    })
  );
}

export function buildDestinationAssociatedData(metadata: RecoveryChunkMetadata): Uint8Array {
  validateMetadata(metadata);
  return concatBytes(
    lengthPrefixed(encoder.encode(HPKE_AAD_PREFIX)),
    uint32(1),
    lengthPrefixed(encoder.encode(DESTINATION_CRYPTO_SUITE)),
    lengthPrefixed(encoder.encode(metadata.bundleId)),
    lengthPrefixed(encoder.encode(metadata.schema)),
    uint64(metadata.ordinal),
    uint64(metadata.declaredLength),
    hexToBytes(metadata.contentDigest.slice('sha256:'.length))
  );
}

function buildDestinationInfo(recipient: { recipientKeyId: string; recipientFingerprint: string }): Uint8Array {
  validateKeyId(recipient.recipientKeyId);
  if (!DIGEST_PATTERN.test(recipient.recipientFingerprint)) throw new Error('Invalid destination fingerprint');
  const info = concatBytes(
    lengthPrefixed(encoder.encode(HPKE_INFO_PREFIX)),
    lengthPrefixed(encoder.encode(recipient.recipientKeyId)),
    hexToBytes(recipient.recipientFingerprint.slice('sha256:'.length))
  );
  if (info.length > 128) throw new Error('Destination HPKE info exceeds 128 bytes');
  return info;
}

function validateEnvelope(envelope: DestinationChunkEnvelope): void {
  if (envelope.format !== DESTINATION_CRYPTO_FORMAT) throw new Error('Unknown destination format');
  if (envelope.suite !== DESTINATION_CRYPTO_SUITE) throw new Error('Unknown destination crypto suite');
  if (envelope.kem !== DESTINATION_KEM) throw new Error('Destination KEM drift');
  if (envelope.kdf !== DESTINATION_KDF) throw new Error('Destination KDF drift');
  if (envelope.aead !== DESTINATION_AEAD) throw new Error('Destination AEAD drift');
  validateKeyId(envelope.recipientKeyId);
  if (!DIGEST_PATTERN.test(envelope.recipientFingerprint)) throw new Error('Invalid destination fingerprint');
  validateMetadata(envelope);
  decodeBase64Url(envelope.encapsulatedKey, DESTINATION_ENCAPSULATED_KEY_BYTES, 'encapsulated key');
  decodeBase64Url(envelope.ciphertext, envelope.declaredLength + DESTINATION_TAG_BYTES, 'ciphertext');
}

function validateRecipient(recipient: DestinationRecipientDescriptor): void {
  if (recipient.suite !== DESTINATION_CRYPTO_SUITE) throw new Error('Unknown destination crypto suite');
  validateKeyId(recipient.keyId);
  if (!DIGEST_PATTERN.test(recipient.fingerprint)) throw new Error('Invalid destination fingerprint');
  if (!Number.isSafeInteger(recipient.expiresAt)) throw new Error('Invalid destination key expiry');
}

function validateMetadata(metadata: RecoveryChunkMetadata): void {
  if (!IDENTIFIER_PATTERN.test(metadata.bundleId)) throw new Error('Invalid transfer bundle id');
  if (!IDENTIFIER_PATTERN.test(metadata.schema)) throw new Error('Invalid transfer schema');
  if (!Number.isSafeInteger(metadata.ordinal) || metadata.ordinal < 0)
    throw new Error('Invalid transfer chunk ordinal');
  if (
    !Number.isSafeInteger(metadata.declaredLength) ||
    metadata.declaredLength < 0 ||
    metadata.declaredLength > DESTINATION_MAX_CHUNK_BYTES
  )
    throw new Error('Invalid transfer chunk length');
  if (!DIGEST_PATTERN.test(metadata.contentDigest)) throw new Error('Invalid transfer content digest');
}

function assertPlaintextMatchesMetadata(plaintext: Uint8Array, metadata: RecoveryChunkMetadata): void {
  if (plaintext.length !== metadata.declaredLength) throw new Error('Destination chunk declared length mismatch');
  if (contentDigest(plaintext) !== metadata.contentDigest) throw new Error('Destination chunk content digest mismatch');
}

function validateKeyId(keyId: string): void {
  if (!IDENTIFIER_PATTERN.test(keyId)) throw new Error('Invalid destination key id');
}

function fingerprint(publicKey: Uint8Array): string {
  return `sha256:${bytesToHex(sha256(publicKey))}`;
}

function encodeBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function decodeBase64Url(value: unknown, expectedLength: number, field: string): Uint8Array {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error(`Malformed destination ${field}`);
  const decoded = Uint8Array.from(Buffer.from(value, 'base64url'));
  if (decoded.length !== expectedLength || encodeBase64Url(decoded) !== value)
    throw new Error(`Malformed destination ${field}`);
  return decoded;
}

function lengthPrefixed(bytes: Uint8Array): Uint8Array {
  return concatBytes(uint32(bytes.length), bytes);
}

function uint32(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, false);
  return bytes;
}

function uint64(value: number): Uint8Array {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(value), false);
  return bytes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertExactFields(value: Record<string, unknown>, expected: ReadonlySet<string>, label: string): void {
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) throw new Error(`Unknown critical ${label} field: ${key}`);
  }
  for (const key of expected) {
    if (!Object.hasOwn(value, key)) throw new Error(`Missing critical ${label} field: ${key}`);
  }
}
