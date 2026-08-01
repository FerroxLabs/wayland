import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@noble/hashes/argon2.js', () => ({
  argon2idAsync: vi.fn(async () => new Uint8Array(32).fill(0x42)),
}));

import { argon2idAsync } from '@noble/hashes/argon2.js';
import {
  contentDigest,
  RECOVERY_ARGON2_MEMORY_KIB,
  RecoveryBundleCryptoSession,
  type RecoveryBundleEncryptedChunk,
  type RecoveryChunkEncryptionInput,
} from '@process/services/transfer/crypto';

const plaintext = new TextEncoder().encode('one bundle KDF, fresh chunk nonce');
const input: RecoveryChunkEncryptionInput = {
  bundleId: 'bundle-recovery-1',
  schema: 'wayland-transfer/1',
  ordinal: 0,
  declaredLength: plaintext.length,
  contentDigest: contentDigest(plaintext),
  plaintext,
};

describe('WT-R1 bundle-scoped recovery crypto', () => {
  beforeEach(() => {
    vi.mocked(argon2idAsync).mockClear();
  });

  it('derives once per bundle and uses one fixed salt across fresh chunk nonces', async () => {
    const encryptor = await RecoveryBundleCryptoSession.create('recovery credential');
    const first = encryptor.encryptChunk(input);
    const second = encryptor.encryptChunk({ ...input, ordinal: 1 });

    expect(argon2idAsync).toHaveBeenCalledTimes(1);
    expect(Buffer.from(encryptor.parameters().salt, 'base64url')).toHaveLength(16);
    expect(Buffer.from(first.nonce, 'base64url')).toHaveLength(24);
    expect(second.nonce).not.toBe(first.nonce);
    expect(first).not.toHaveProperty('kdf');
    expect(second).not.toHaveProperty('kdf');

    const decryptor = await RecoveryBundleCryptoSession.open('recovery credential', encryptor.parameters());
    expect(argon2idAsync).toHaveBeenCalledTimes(2);
    expect(new TextDecoder().decode(decryptor.decryptChunk(first).plaintext)).toBe('one bundle KDF, fresh chunk nonce');
    expect(decryptor.decryptChunk(second).ordinal).toBe(1);
  });

  it('fails closed on replay, tampering, unknown fields, and destruction', async () => {
    const encryptor = await RecoveryBundleCryptoSession.create('recovery credential');
    const chunk = encryptor.encryptChunk(input);
    const decryptor = await RecoveryBundleCryptoSession.open('recovery credential', encryptor.parameters());
    expect(decryptor.decryptChunk(chunk).ordinal).toBe(0);
    expect(() => decryptor.decryptChunk(chunk)).toThrow('nonce reuse');

    const tamperedDecryptor = await RecoveryBundleCryptoSession.open('recovery credential', encryptor.parameters());
    const ciphertext = Buffer.from(chunk.ciphertext, 'base64url');
    ciphertext[0] ^= 0x80;
    expect(() => tamperedDecryptor.decryptChunk({ ...chunk, ciphertext: ciphertext.toString('base64url') })).toThrow(
      'authentication failed'
    );

    const unknownFieldDecryptor = await RecoveryBundleCryptoSession.open('recovery credential', encryptor.parameters());
    expect(() =>
      unknownFieldDecryptor.decryptChunk({
        ...chunk,
        futureCritical: true,
      } as RecoveryBundleEncryptedChunk)
    ).toThrow('Unknown critical bundle chunk field');

    encryptor.destroy();
    expect(() => encryptor.encryptChunk(input)).toThrow('destroyed');
  });

  it('rejects KDF drift before invoking Argon2', async () => {
    const encryptor = await RecoveryBundleCryptoSession.create('recovery credential');
    const callsBefore = vi.mocked(argon2idAsync).mock.calls.length;
    await expect(
      RecoveryBundleCryptoSession.open('recovery credential', {
        ...encryptor.parameters(),
        memoryKiB: RECOVERY_ARGON2_MEMORY_KIB - 1,
      })
    ).rejects.toThrow('Argon2 memory drift');
    expect(argon2idAsync).toHaveBeenCalledTimes(callsBefore);
  });

  it('binds metadata and verifies plaintext digest after authentication', async () => {
    const encryptor = await RecoveryBundleCryptoSession.create('recovery credential');
    const chunk = encryptor.encryptChunk(input);
    const variants = [
      { ...chunk, bundleId: 'bundle-recovery-2' },
      { ...chunk, schema: 'wayland-transfer/2' },
      { ...chunk, ordinal: 1 },
      { ...chunk, contentDigest: `sha256:${'00'.repeat(32)}` },
    ];
    await Promise.all(
      variants.map(async (variant) => {
        const decryptor = await RecoveryBundleCryptoSession.open('recovery credential', encryptor.parameters());
        expect(() => decryptor.decryptChunk(variant)).toThrow();
      })
    );
  });
});
