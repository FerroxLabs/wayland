/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// fileKeyStore pulls in getPlatformServices via @/common/platform. The electron
// module is absent in the node test runtime; mock it so the import resolves the
// same way the standalone server bundle sees it (safeStorage / app undefined).
vi.mock('electron', () => ({}));

import {
  FILE_CIPHER_PREFIX,
  fileDecryptString,
  fileEncryptString,
  _resetFileKeyStoreForTests,
} from '@process/secrets/fileKeyStore';

const SECRET_KEY_FILE = '.secret-key';

describe('secrets/fileKeyStore', () => {
  let dataDir: string;
  const prevDataDir = process.env.DATA_DIR;

  beforeAll(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), 'wl-filekey-'));
    process.env.DATA_DIR = dataDir;
  });

  afterAll(() => {
    if (prevDataDir === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = prevDataDir;
    rmSync(dataDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    _resetFileKeyStoreForTests();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('round-trips plaintext through encrypt → decrypt', () => {
    const plaintext = 'sk-ant-api03-headless-credential';
    const encoded = fileEncryptString(plaintext);
    expect(encoded.startsWith(FILE_CIPHER_PREFIX)).toBe(true);
    expect(fileDecryptString(encoded)).toBe(plaintext);
  });

  it('round-trips unicode and empty strings', () => {
    for (const s of ['', '🔐 café — naïve', JSON.stringify({ key: 'value', n: 42 })]) {
      expect(fileDecryptString(fileEncryptString(s))).toBe(s);
    }
  });

  it('uses a unique IV per call (same plaintext → different ciphertext)', () => {
    const plaintext = 'identical-plaintext';
    const a = fileEncryptString(plaintext);
    const b = fileEncryptString(plaintext);
    expect(a).not.toBe(b);
    // Both still decrypt to the original.
    expect(fileDecryptString(a)).toBe(plaintext);
    expect(fileDecryptString(b)).toBe(plaintext);

    // Prove the divergence is the IV: the first 12 bytes of the packed payload differ.
    const ivOf = (encoded: string) =>
      Buffer.from(encoded.slice(FILE_CIPHER_PREFIX.length), 'base64').subarray(0, 12).toString('hex');
    expect(ivOf(a)).not.toBe(ivOf(b));
  });

  it('throws on a tampered ciphertext (GCM tag fails to verify)', () => {
    const encoded = fileEncryptString('do-not-tamper');
    const packed = Buffer.from(encoded.slice(FILE_CIPHER_PREFIX.length), 'base64');
    // Flip a bit in the ciphertext body (after the 12-byte IV + 16-byte tag).
    packed[packed.length - 1] ^= 0x01;
    const tampered = `${FILE_CIPHER_PREFIX}${packed.toString('base64')}`;
    expect(() => fileDecryptString(tampered)).toThrow();
  });

  it('throws on a tampered auth tag', () => {
    const encoded = fileEncryptString('tag-protected');
    const packed = Buffer.from(encoded.slice(FILE_CIPHER_PREFIX.length), 'base64');
    // The tag occupies bytes [12, 28). Flip a bit inside it.
    packed[12] ^= 0x80;
    const tampered = `${FILE_CIPHER_PREFIX}${packed.toString('base64')}`;
    expect(() => fileDecryptString(tampered)).toThrow();
  });

  it('throws when decrypting with a different secret (wrong key)', () => {
    const encoded = fileEncryptString('bound-to-this-secret');
    // Drop the secret + cached key, forcing a fresh secret on next use.
    _resetFileKeyStoreForTests();
    // A new secret is minted; the old ciphertext can no longer be decrypted.
    expect(() => fileDecryptString(encoded)).toThrow();
  });

  it('rejects a value without the file-scheme prefix', () => {
    expect(() => fileDecryptString('enc:v1:abc')).toThrowError(/prefix/);
    expect(() => fileDecryptString('garbage')).toThrowError(/prefix/);
  });

  it('rejects a too-short payload', () => {
    // Valid prefix but fewer than IV(12)+tag(16) bytes.
    const tiny = `${FILE_CIPHER_PREFIX}${Buffer.from([1, 2, 3]).toString('base64')}`;
    expect(() => fileDecryptString(tiny)).toThrowError(/too short/);
  });

  it('creates the secret-key file with 0600 permissions on first use', () => {
    const keyFile = path.join(dataDir, SECRET_KEY_FILE);
    expect(existsSync(keyFile)).toBe(false);

    fileEncryptString('first-use-creates-the-secret');

    expect(existsSync(keyFile)).toBe(true);
    const mode = statSync(keyFile).mode & 0o777;
    // POSIX modes are advisory on Windows; assert only where they are enforced.
    if (process.platform !== 'win32') {
      expect(mode).toBe(0o600);
    }
  });

  it('reuses the same secret across calls (no re-mint on second use)', () => {
    const first = fileEncryptString('a');
    // Second encrypt must decrypt against the same secret - cross-decrypt proves it.
    const second = fileEncryptString('b');
    expect(fileDecryptString(first)).toBe('a');
    expect(fileDecryptString(second)).toBe('b');
  });
});
