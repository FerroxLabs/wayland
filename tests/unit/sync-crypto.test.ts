import { describe, it, expect } from 'vitest';
import { deriveKey, generateSalt } from '@process/sync/crypto/deriveKey';
import { seal, open } from '@process/sync/crypto/secretbox';

describe('deriveKey', () => {
  it('produces a 32-byte key', async () => {
    const salt = generateSalt();
    const key = await deriveKey('test-passphrase-long-enough', salt);
    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBe(32);
  });

  it('is deterministic: same passphrase + salt → same key', async () => {
    const salt = generateSalt();
    const k1 = await deriveKey('passphrase-abc-123', salt);
    const k2 = await deriveKey('passphrase-abc-123', salt);
    expect(Buffer.from(k1).toString('hex')).toBe(Buffer.from(k2).toString('hex'));
  });

  it('different salts produce different keys', async () => {
    const s1 = generateSalt();
    const s2 = generateSalt();
    const k1 = await deriveKey('same-passphrase', s1);
    const k2 = await deriveKey('same-passphrase', s2);
    expect(Buffer.from(k1).toString('hex')).not.toBe(Buffer.from(k2).toString('hex'));
  });
});

describe('secretbox', () => {
  const fixedKey = new Uint8Array(32).fill(0xab);

  it('round-trips plaintext', () => {
    const plaintext = new TextEncoder().encode('{"hello":"world"}');
    const sealed = seal(plaintext, fixedKey);
    const recovered = open(sealed, fixedKey);
    expect(recovered).not.toBeNull();
    expect(new TextDecoder().decode(recovered!)).toBe('{"hello":"world"}');
  });

  it('returns null for tampered ciphertext', () => {
    const plaintext = new TextEncoder().encode('sensitive data');
    const sealed = seal(plaintext, fixedKey);
    // Flip a byte in the ciphertext region (after the 24-byte nonce)
    sealed[30] ^= 0xff;
    const result = open(sealed, fixedKey);
    expect(result).toBeNull();
  });

  it('returns null for wrong key', () => {
    const plaintext = new TextEncoder().encode('sensitive data');
    const sealed = seal(plaintext, fixedKey);
    const wrongKey = new Uint8Array(32).fill(0x01);
    expect(open(sealed, wrongKey)).toBeNull();
  });

  it('returns null for truncated payload', () => {
    const plaintext = new TextEncoder().encode('data');
    const sealed = seal(plaintext, fixedKey);
    expect(open(sealed.slice(0, 10), fixedKey)).toBeNull();
  });

  it('seal produces different output each call (random nonce)', () => {
    const plaintext = new TextEncoder().encode('same');
    const s1 = seal(plaintext, fixedKey);
    const s2 = seal(plaintext, fixedKey);
    expect(Buffer.from(s1).toString('hex')).not.toBe(Buffer.from(s2).toString('hex'));
  });
});
