import { randomBytes } from 'node:crypto';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { argon2idAsync } from '@noble/hashes/argon2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';
import { parseStrictJson } from './strictJson';

export const RECOVERY_CRYPTO_FORMAT = 'wayland-transfer-recovery-chunk/1' as const;
export const RECOVERY_CRYPTO_SUITE = 'WT-R1' as const;
export const RECOVERY_KDF_ALGORITHM = 'Argon2id' as const;
export const RECOVERY_CIPHER_ALGORITHM = 'XChaCha20-Poly1305' as const;
export const RECOVERY_ARGON2_VERSION = 0x13 as const;
export const RECOVERY_ARGON2_MEMORY_KIB = 262144 as const;
export const RECOVERY_ARGON2_ITERATIONS = 3 as const;
export const RECOVERY_ARGON2_PARALLELISM = 1 as const;
export const RECOVERY_KEY_BYTES = 32 as const;
export const RECOVERY_SALT_BYTES = 16 as const;
export const RECOVERY_NONCE_BYTES = 24 as const;

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const CONTENT_DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const ROOT_FIELDS = new Set([
  'format',
  'suite',
  'cipher',
  'bundleId',
  'schema',
  'ordinal',
  'declaredLength',
  'contentDigest',
  'kdf',
  'nonce',
  'ciphertext',
]);
const KDF_FIELDS = new Set(['algorithm', 'version', 'memoryKiB', 'iterations', 'parallelism', 'keyLength', 'salt']);
const BUNDLE_CHUNK_FIELDS = new Set([
  'bundleId',
  'schema',
  'ordinal',
  'declaredLength',
  'contentDigest',
  'nonce',
  'ciphertext',
]);

export type RecoveryChunkMetadata = {
  bundleId: string;
  schema: string;
  ordinal: number;
  declaredLength: number;
  contentDigest: string;
};

export type RecoveryChunkEncryptionInput = RecoveryChunkMetadata & {
  plaintext: Uint8Array;
};

export type RecoveryKdfParameters = {
  algorithm: typeof RECOVERY_KDF_ALGORITHM;
  version: typeof RECOVERY_ARGON2_VERSION;
  memoryKiB: typeof RECOVERY_ARGON2_MEMORY_KIB;
  iterations: typeof RECOVERY_ARGON2_ITERATIONS;
  parallelism: typeof RECOVERY_ARGON2_PARALLELISM;
  keyLength: typeof RECOVERY_KEY_BYTES;
  salt: string;
};

export type RecoveryChunkEnvelope = RecoveryChunkMetadata & {
  format: typeof RECOVERY_CRYPTO_FORMAT;
  suite: typeof RECOVERY_CRYPTO_SUITE;
  cipher: typeof RECOVERY_CIPHER_ALGORITHM;
  kdf: RecoveryKdfParameters;
  nonce: string;
  ciphertext: string;
};

export type DecryptedRecoveryChunk = RecoveryChunkMetadata & {
  plaintext: Uint8Array;
};

export type RecoveryBundleEncryptedChunk = RecoveryChunkMetadata & {
  nonce: string;
  ciphertext: string;
};

/**
 * Bundle-scoped WT-R1 authority. Argon2id runs once for the bundle; every
 * chunk receives a fresh XChaCha20 nonce and independently bound metadata.
 */
export class RecoveryBundleCryptoSession {
  private readonly observedNonces = new Set<string>();
  private key: Uint8Array | undefined;

  private constructor(
    key: Uint8Array,
    private readonly kdf: RecoveryKdfParameters
  ) {
    this.key = key;
  }

  static async create(passphrase: string | Uint8Array): Promise<RecoveryBundleCryptoSession> {
    const parameters = fixedKdfParameters(Uint8Array.from(randomBytes(RECOVERY_SALT_BYTES)));
    return new RecoveryBundleCryptoSession(await deriveRecoveryKey(passphrase, parameters), parameters);
  }

  static async open(
    passphrase: string | Uint8Array,
    parameters: RecoveryKdfParameters
  ): Promise<RecoveryBundleCryptoSession> {
    validateKdf(parameters);
    return new RecoveryBundleCryptoSession(
      await deriveRecoveryKey(passphrase, parameters),
      Object.freeze({ ...parameters })
    );
  }

  parameters(): Readonly<RecoveryKdfParameters> {
    return Object.freeze({ ...this.kdf });
  }

  destroy(): void {
    this.key?.fill(0);
    this.key = undefined;
  }

  encryptChunk(input: RecoveryChunkEncryptionInput): RecoveryBundleEncryptedChunk {
    const key = this.requireKey();
    validateMetadata(input);
    if (!(input.plaintext instanceof Uint8Array)) throw new Error('Plaintext must be bytes');
    assertPlaintextMatchesMetadata(input.plaintext, input);
    const nonce = Uint8Array.from(randomBytes(RECOVERY_NONCE_BYTES));
    this.claimNonce(nonce);
    const ciphertext = xchacha20poly1305(key, nonce, buildRecoveryAssociatedData(input)).encrypt(input.plaintext);
    return {
      bundleId: input.bundleId,
      schema: input.schema,
      ordinal: input.ordinal,
      declaredLength: input.declaredLength,
      contentDigest: input.contentDigest,
      nonce: encodeBase64Url(nonce),
      ciphertext: encodeBase64Url(ciphertext),
    };
  }

  decryptChunk(chunk: RecoveryBundleEncryptedChunk): DecryptedRecoveryChunk {
    const key = this.requireKey();
    assertExactFields(chunk as unknown as Record<string, unknown>, BUNDLE_CHUNK_FIELDS, 'bundle chunk');
    validateMetadata(chunk);
    const nonce = decodeBase64Url(chunk.nonce, RECOVERY_NONCE_BYTES, 'nonce');
    this.claimNonce(nonce);
    const ciphertext = decodeBase64Url(
      chunk.ciphertext,
      chunk.declaredLength + xchacha20poly1305.tagLength,
      'ciphertext'
    );
    let plaintext: Uint8Array;
    try {
      plaintext = xchacha20poly1305(key, nonce, buildRecoveryAssociatedData(chunk)).decrypt(ciphertext);
    } catch {
      throw new Error('Recovery chunk authentication failed');
    }
    assertPlaintextMatchesMetadata(plaintext, chunk);
    return {
      bundleId: chunk.bundleId,
      schema: chunk.schema,
      ordinal: chunk.ordinal,
      declaredLength: chunk.declaredLength,
      contentDigest: chunk.contentDigest,
      plaintext,
    };
  }

  private requireKey(): Uint8Array {
    if (!this.key) throw new Error('Recovery bundle key is destroyed');
    return this.key;
  }

  private claimNonce(nonce: Uint8Array): void {
    const encoded = encodeBase64Url(nonce);
    if (this.observedNonces.has(encoded)) throw new Error('Recovery nonce reuse detected');
    this.observedNonces.add(encoded);
  }
}

export class RecoveryCryptoSession {
  private readonly observedNonces = new Set<string>();

  async encryptChunk(input: RecoveryChunkEncryptionInput, passphrase: string | Uint8Array): Promise<Uint8Array> {
    validateMetadata(input);
    if (!(input.plaintext instanceof Uint8Array)) throw new Error('Plaintext must be bytes');
    assertPlaintextMatchesMetadata(input.plaintext, input);

    const salt = Uint8Array.from(randomBytes(RECOVERY_SALT_BYTES));
    const nonce = Uint8Array.from(randomBytes(RECOVERY_NONCE_BYTES));
    this.claimNonce(nonce);
    const kdf = fixedKdfParameters(salt);
    const key = await deriveRecoveryKey(passphrase, kdf);
    try {
      const associatedData = buildRecoveryAssociatedData(input);
      const ciphertext = xchacha20poly1305(key, nonce, associatedData).encrypt(input.plaintext);
      return serializeRecoveryChunkEnvelope({
        format: RECOVERY_CRYPTO_FORMAT,
        suite: RECOVERY_CRYPTO_SUITE,
        cipher: RECOVERY_CIPHER_ALGORITHM,
        bundleId: input.bundleId,
        schema: input.schema,
        ordinal: input.ordinal,
        declaredLength: input.declaredLength,
        contentDigest: input.contentDigest,
        kdf,
        nonce: encodeBase64Url(nonce),
        ciphertext: encodeBase64Url(ciphertext),
      });
    } finally {
      key.fill(0);
    }
  }

  async decryptChunk(
    serializedEnvelope: Uint8Array | string,
    passphrase: string | Uint8Array
  ): Promise<DecryptedRecoveryChunk> {
    const envelope = parseRecoveryChunkEnvelope(serializedEnvelope);
    const nonce = decodeBase64Url(envelope.nonce, RECOVERY_NONCE_BYTES, 'nonce');
    this.claimNonce(nonce);
    const ciphertext = decodeBase64Url(
      envelope.ciphertext,
      envelope.declaredLength + xchacha20poly1305.tagLength,
      'ciphertext'
    );
    const key = await deriveRecoveryKey(passphrase, envelope.kdf);
    try {
      let plaintext: Uint8Array;
      try {
        plaintext = xchacha20poly1305(key, nonce, buildRecoveryAssociatedData(envelope)).decrypt(ciphertext);
      } catch {
        throw new Error('Recovery chunk authentication failed');
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
    } finally {
      key.fill(0);
    }
  }

  private claimNonce(nonce: Uint8Array): void {
    const encoded = encodeBase64Url(nonce);
    if (this.observedNonces.has(encoded)) throw new Error('Recovery nonce reuse detected');
    this.observedNonces.add(encoded);
  }
}

export function contentDigest(plaintext: Uint8Array): string {
  if (!(plaintext instanceof Uint8Array)) throw new Error('Plaintext must be bytes');
  return `sha256:${bytesToHex(sha256(plaintext))}`;
}

export async function deriveRecoveryKey(
  passphrase: string | Uint8Array,
  parameters: RecoveryKdfParameters
): Promise<Uint8Array> {
  validateKdf(parameters);
  const password = normalizePassphrase(passphrase);
  const salt = decodeBase64Url(parameters.salt, RECOVERY_SALT_BYTES, 'salt');
  try {
    return await argon2idAsync(password, salt, {
      version: RECOVERY_ARGON2_VERSION,
      m: RECOVERY_ARGON2_MEMORY_KIB,
      t: RECOVERY_ARGON2_ITERATIONS,
      p: RECOVERY_ARGON2_PARALLELISM,
      dkLen: RECOVERY_KEY_BYTES,
      maxmem: RECOVERY_ARGON2_MEMORY_KIB * 1024,
      asyncTick: 10,
    });
  } finally {
    password.fill(0);
  }
}

export function buildRecoveryAssociatedData(metadata: RecoveryChunkMetadata): Uint8Array {
  validateMetadata(metadata);
  return concatBytes(
    lengthPrefixed(encoder.encode('wayland-transfer/wt-r1/aad/1')),
    uint32(1),
    lengthPrefixed(encoder.encode(RECOVERY_CRYPTO_SUITE)),
    lengthPrefixed(encoder.encode(metadata.bundleId)),
    lengthPrefixed(encoder.encode(metadata.schema)),
    uint64(metadata.ordinal),
    uint64(metadata.declaredLength),
    hexToBytes(metadata.contentDigest.slice('sha256:'.length))
  );
}

export function parseRecoveryChunkEnvelope(serializedEnvelope: Uint8Array | string): RecoveryChunkEnvelope {
  let text: string;
  try {
    text = typeof serializedEnvelope === 'string' ? serializedEnvelope : decoder.decode(serializedEnvelope);
  } catch {
    throw new Error('Recovery envelope is not valid UTF-8');
  }
  const parsed = parseStrictJson(text);
  if (!isRecord(parsed)) throw new Error('Recovery envelope must be an object');
  assertExactFields(parsed, ROOT_FIELDS, 'envelope');
  if (!isRecord(parsed.kdf)) throw new Error('Recovery KDF parameters must be an object');
  assertExactFields(parsed.kdf, KDF_FIELDS, 'KDF parameters');
  const envelope = parsed as RecoveryChunkEnvelope;
  validateEnvelope(envelope);
  return envelope;
}

export function serializeRecoveryChunkEnvelope(envelope: RecoveryChunkEnvelope): Uint8Array {
  assertExactFields(envelope as unknown as Record<string, unknown>, ROOT_FIELDS, 'envelope');
  assertExactFields(envelope.kdf as unknown as Record<string, unknown>, KDF_FIELDS, 'KDF parameters');
  validateEnvelope(envelope);
  return encoder.encode(
    JSON.stringify({
      format: envelope.format,
      suite: envelope.suite,
      cipher: envelope.cipher,
      bundleId: envelope.bundleId,
      schema: envelope.schema,
      ordinal: envelope.ordinal,
      declaredLength: envelope.declaredLength,
      contentDigest: envelope.contentDigest,
      kdf: {
        algorithm: envelope.kdf.algorithm,
        version: envelope.kdf.version,
        memoryKiB: envelope.kdf.memoryKiB,
        iterations: envelope.kdf.iterations,
        parallelism: envelope.kdf.parallelism,
        keyLength: envelope.kdf.keyLength,
        salt: envelope.kdf.salt,
      },
      nonce: envelope.nonce,
      ciphertext: envelope.ciphertext,
    })
  );
}

function validateEnvelope(envelope: RecoveryChunkEnvelope): void {
  if (envelope.format !== RECOVERY_CRYPTO_FORMAT) throw new Error('Unknown recovery format');
  if (envelope.suite !== RECOVERY_CRYPTO_SUITE) throw new Error('Unknown recovery crypto suite');
  if (envelope.cipher !== RECOVERY_CIPHER_ALGORITHM) throw new Error('Unknown recovery cipher');
  validateMetadata(envelope);
  validateKdf(envelope.kdf);
  decodeBase64Url(envelope.nonce, RECOVERY_NONCE_BYTES, 'nonce');
  decodeBase64Url(envelope.ciphertext, envelope.declaredLength + xchacha20poly1305.tagLength, 'ciphertext');
}

function validateKdf(parameters: RecoveryKdfParameters): void {
  if (parameters.algorithm !== RECOVERY_KDF_ALGORITHM) throw new Error('Unknown recovery KDF');
  if (parameters.version !== RECOVERY_ARGON2_VERSION) throw new Error('Argon2 version drift');
  if (parameters.memoryKiB !== RECOVERY_ARGON2_MEMORY_KIB) throw new Error('Argon2 memory drift');
  if (parameters.iterations !== RECOVERY_ARGON2_ITERATIONS) throw new Error('Argon2 iteration drift');
  if (parameters.parallelism !== RECOVERY_ARGON2_PARALLELISM) throw new Error('Argon2 parallelism drift');
  if (parameters.keyLength !== RECOVERY_KEY_BYTES) throw new Error('Argon2 key-length drift');
  decodeBase64Url(parameters.salt, RECOVERY_SALT_BYTES, 'salt');
}

function validateMetadata(metadata: RecoveryChunkMetadata): void {
  if (!IDENTIFIER_PATTERN.test(metadata.bundleId)) throw new Error('Invalid transfer bundle id');
  if (!IDENTIFIER_PATTERN.test(metadata.schema)) throw new Error('Invalid transfer schema');
  if (!Number.isSafeInteger(metadata.ordinal) || metadata.ordinal < 0)
    throw new Error('Invalid transfer chunk ordinal');
  if (!Number.isSafeInteger(metadata.declaredLength) || metadata.declaredLength < 0)
    throw new Error('Invalid transfer chunk length');
  if (!CONTENT_DIGEST_PATTERN.test(metadata.contentDigest)) throw new Error('Invalid transfer content digest');
}

function assertPlaintextMatchesMetadata(plaintext: Uint8Array, metadata: RecoveryChunkMetadata): void {
  if (plaintext.length !== metadata.declaredLength) throw new Error('Recovery chunk declared length mismatch');
  if (contentDigest(plaintext) !== metadata.contentDigest) throw new Error('Recovery chunk content digest mismatch');
}

function fixedKdfParameters(salt: Uint8Array): RecoveryKdfParameters {
  return {
    algorithm: RECOVERY_KDF_ALGORITHM,
    version: RECOVERY_ARGON2_VERSION,
    memoryKiB: RECOVERY_ARGON2_MEMORY_KIB,
    iterations: RECOVERY_ARGON2_ITERATIONS,
    parallelism: RECOVERY_ARGON2_PARALLELISM,
    keyLength: RECOVERY_KEY_BYTES,
    salt: encodeBase64Url(salt),
  };
}

function normalizePassphrase(passphrase: string | Uint8Array): Uint8Array {
  const bytes =
    typeof passphrase === 'string'
      ? encoder.encode(passphrase)
      : passphrase instanceof Uint8Array
        ? Uint8Array.from(passphrase)
        : null;
  if (!bytes || bytes.length === 0 || bytes.length > 1024 * 1024)
    throw new Error('Recovery passphrase must contain 1..1048576 bytes');
  return bytes;
}

function encodeBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function decodeBase64Url(value: unknown, expectedLength: number, field: string): Uint8Array {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error(`Malformed recovery ${field}`);
  const decoded = Uint8Array.from(Buffer.from(value, 'base64url'));
  if (decoded.length !== expectedLength || encodeBase64Url(decoded) !== value)
    throw new Error(`Malformed recovery ${field}`);
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
  const keys = Object.keys(value);
  for (const key of keys) {
    if (!expected.has(key)) throw new Error(`Unknown critical ${label} field: ${key}`);
  }
  for (const key of expected) {
    if (!Object.hasOwn(value, key)) throw new Error(`Missing critical ${label} field: ${key}`);
  }
}
