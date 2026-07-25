import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@noble/hashes/argon2.js', () => ({
  argon2idAsync: vi.fn(async () => new Uint8Array(32).fill(0x42)),
}));

import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import {
  buildRecoveryAssociatedData,
  contentDigest,
  parseRecoveryChunkEnvelope,
  RECOVERY_ARGON2_MEMORY_KIB,
  RecoveryCryptoSession,
  serializeRecoveryChunkEnvelope,
  type RecoveryChunkEnvelope,
  type RecoveryChunkEncryptionInput,
} from '@process/services/transfer/crypto';

const plaintext = new TextEncoder().encode('portable Wayland state');
const input: RecoveryChunkEncryptionInput = {
  bundleId: 'bundle-hostile-1',
  schema: 'wayland-transfer/1',
  ordinal: 2,
  declaredLength: plaintext.length,
  contentDigest: contentDigest(plaintext),
  plaintext,
};

let serialized: Uint8Array;
let envelope: RecoveryChunkEnvelope;

type MutableEnvelope = Record<string, unknown> & {
  kdf: Record<string, unknown>;
};

beforeAll(async () => {
  serialized = await new RecoveryCryptoSession().encryptChunk(input, 'test recovery credential');
  envelope = parseRecoveryChunkEnvelope(serialized);
});

function mutate(transform: (candidate: MutableEnvelope) => void): string {
  const candidate = JSON.parse(new TextDecoder().decode(serialized)) as MutableEnvelope;
  transform(candidate);
  return JSON.stringify(candidate);
}

describe('WT-R1 strict recovery envelope', () => {
  it('uses fresh 16-byte salts and 24-byte nonces', async () => {
    const session = new RecoveryCryptoSession();
    const first = parseRecoveryChunkEnvelope(await session.encryptChunk(input, 'test recovery credential'));
    const second = parseRecoveryChunkEnvelope(
      await session.encryptChunk({ ...input, ordinal: 3 }, 'test recovery credential')
    );
    expect(Buffer.from(first.kdf.salt, 'base64url')).toHaveLength(16);
    expect(Buffer.from(first.nonce, 'base64url')).toHaveLength(24);
    expect(second.kdf.salt).not.toBe(first.kdf.salt);
    expect(second.nonce).not.toBe(first.nonce);
  });

  it.each([
    ['suite', (candidate: MutableEnvelope) => (candidate.suite = 'WT-R2')],
    ['cipher', (candidate: MutableEnvelope) => (candidate.cipher = 'AES-256-GCM')],
    ['KDF', (candidate: MutableEnvelope) => (candidate.kdf.algorithm = 'scrypt')],
  ])('rejects an unknown %s', (_label, transform) => {
    expect(() => parseRecoveryChunkEnvelope(mutate(transform))).toThrow(/Unknown/);
  });

  it.each([
    ['low memory', RECOVERY_ARGON2_MEMORY_KIB - 1],
    ['high memory', RECOVERY_ARGON2_MEMORY_KIB + 1],
  ])('rejects %s parameter drift before derivation', (_label, memoryKiB) => {
    expect(() => parseRecoveryChunkEnvelope(mutate((candidate) => (candidate.kdf.memoryKiB = memoryKiB)))).toThrow(
      'Argon2 memory drift'
    );
  });

  it.each([
    ['version low', 'version', 16],
    ['version high', 'version', 20],
    ['iterations low', 'iterations', 2],
    ['iterations high', 'iterations', 4],
    ['parallelism low', 'parallelism', 0],
    ['parallelism high', 'parallelism', 2],
    ['keyLength low', 'keyLength', 16],
    ['keyLength high', 'keyLength', 64],
  ])('rejects %s drift', (_label, field, value) => {
    expect(() => parseRecoveryChunkEnvelope(mutate((candidate) => (candidate.kdf[field] = value)))).toThrow(/drift/);
  });

  it('rejects unknown and missing critical fields', () => {
    expect(() => parseRecoveryChunkEnvelope(mutate((candidate) => (candidate.criticalFuture = true)))).toThrow(
      'Unknown critical envelope field'
    );
    expect(() => parseRecoveryChunkEnvelope(mutate((candidate) => delete candidate.contentDigest))).toThrow(
      'Missing critical envelope field'
    );
  });

  it('rejects duplicate root and nested critical fields', () => {
    const text = new TextDecoder().decode(serialized);
    expect(() =>
      parseRecoveryChunkEnvelope(text.replace('"suite":"WT-R1"', '"suite":"WT-R1","suite":"WT-R1"'))
    ).toThrow('duplicate object key');
    expect(() =>
      parseRecoveryChunkEnvelope(
        text.replace('"algorithm":"Argon2id"', '"algorithm":"Argon2id","algorithm":"Argon2id"')
      )
    ).toThrow('duplicate object key');
  });

  it.each([
    ['invalid JSON', () => '{"suite":'],
    ['trailing content', () => `${new TextDecoder().decode(serialized)} null`],
    ['noncanonical salt', () => mutate((candidate) => (candidate.kdf.salt += '='))],
    ['short nonce', () => mutate((candidate) => (candidate.nonce = 'AA'))],
    ['short salt', () => mutate((candidate) => (candidate.kdf.salt = Buffer.alloc(15).toString('base64url')))],
    ['long salt', () => mutate((candidate) => (candidate.kdf.salt = Buffer.alloc(17).toString('base64url')))],
  ])('rejects %s', (_label, makeValue) => {
    expect(() => parseRecoveryChunkEnvelope(makeValue())).toThrow();
  });

  it('rejects ciphertext and declared-length mismatch before derivation', () => {
    expect(() => parseRecoveryChunkEnvelope(mutate((candidate) => (candidate.declaredLength += 1)))).toThrow(
      'Malformed recovery ciphertext'
    );
  });

  it('rejects plaintext length and digest mismatch before derivation', async () => {
    const session = new RecoveryCryptoSession();
    await expect(
      session.encryptChunk({ ...input, declaredLength: input.declaredLength + 1 }, 'credential')
    ).rejects.toThrow('declared length mismatch');
    await expect(
      session.encryptChunk({ ...input, contentDigest: `sha256:${'00'.repeat(32)}` }, 'credential')
    ).rejects.toThrow('content digest mismatch');
  });

  it('rejects nonce replay within one import session', async () => {
    const session = new RecoveryCryptoSession();
    await expect(session.decryptChunk(serialized, 'test recovery credential')).resolves.toMatchObject({
      ordinal: input.ordinal,
    });
    await expect(session.decryptChunk(serialized, 'test recovery credential')).rejects.toThrow('nonce reuse');
  });

  it('rejects ciphertext tampering', async () => {
    const candidate = JSON.parse(new TextDecoder().decode(serialized)) as RecoveryChunkEnvelope;
    const bytes = Buffer.from(candidate.ciphertext, 'base64url');
    bytes[0] ^= 0x80;
    candidate.ciphertext = bytes.toString('base64url');
    await expect(
      new RecoveryCryptoSession().decryptChunk(JSON.stringify(candidate), 'test recovery credential')
    ).rejects.toThrow('authentication failed');
  });

  it('rejects authenticated content whose digest claim is false', async () => {
    const falseDigestEnvelope: RecoveryChunkEnvelope = {
      ...envelope,
      contentDigest: `sha256:${'00'.repeat(32)}`,
    };
    const nonce = Uint8Array.from(Buffer.from(falseDigestEnvelope.nonce, 'base64url'));
    falseDigestEnvelope.ciphertext = Buffer.from(
      xchacha20poly1305(new Uint8Array(32).fill(0x42), nonce, buildRecoveryAssociatedData(falseDigestEnvelope)).encrypt(
        plaintext
      )
    ).toString('base64url');
    const malicious = serializeRecoveryChunkEnvelope(falseDigestEnvelope);
    await expect(new RecoveryCryptoSession().decryptChunk(malicious, 'test recovery credential')).rejects.toThrow(
      'content digest mismatch'
    );
  });

  it('binds every required metadata field into associated data', () => {
    const original = Buffer.from(buildRecoveryAssociatedData(input)).toString('hex');
    const variants = [
      { ...input, bundleId: 'bundle-hostile-2' },
      { ...input, schema: 'wayland-transfer/2' },
      { ...input, ordinal: input.ordinal + 1 },
      { ...input, declaredLength: input.declaredLength + 1 },
      { ...input, contentDigest: `sha256:${'00'.repeat(32)}` },
    ];
    for (const variant of variants) {
      expect(Buffer.from(buildRecoveryAssociatedData(variant)).toString('hex')).not.toBe(original);
    }
  });
});
