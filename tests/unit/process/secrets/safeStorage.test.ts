/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSafeStorage } = vi.hoisted(() => ({
  mockSafeStorage: {
    isEncryptionAvailable: vi.fn(),
    encryptString: vi.fn(),
    decryptString: vi.fn(),
  },
}));

vi.mock('electron', () => ({
  safeStorage: mockSafeStorage,
}));

import {
  CIPHER_PREFIX,
  decryptString,
  encryptString,
  isEncryptionAvailable,
} from '@process/secrets/safeStorage';
import { FILE_CIPHER_PREFIX, _resetFileKeyStoreForTests } from '@process/secrets/fileKeyStore';

describe('secrets/safeStorage', () => {
  // The file-backend fallback writes a secret key into DATA_DIR. Point it at a
  // throwaway tmp dir so the fallback tests don't touch the real data dir.
  let dataDir: string;
  const prevDataDir = process.env.DATA_DIR;

  beforeAll(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), 'wl-secrets-'));
    process.env.DATA_DIR = dataDir;
  });

  afterAll(() => {
    if (prevDataDir === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = prevDataDir;
    rmSync(dataDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    mockSafeStorage.isEncryptionAvailable.mockReset();
    mockSafeStorage.encryptString.mockReset();
    mockSafeStorage.decryptString.mockReset();
    _resetFileKeyStoreForTests();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('exposes the version-pinned cipher prefix', () => {
    expect(CIPHER_PREFIX).toBe('enc:v1:');
  });

  it('reports encryption availability from the underlying safeStorage', () => {
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(true);
    expect(isEncryptionAvailable()).toBe(true);

    mockSafeStorage.isEncryptionAvailable.mockReturnValue(false);
    expect(isEncryptionAvailable()).toBe(false);
  });

  it('roundtrips plaintext through encrypt → decrypt', () => {
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(true);
    mockSafeStorage.encryptString.mockImplementation((plaintext: string) =>
      Buffer.from(`enc(${plaintext})`)
    );
    mockSafeStorage.decryptString.mockImplementation((cipher: Buffer) => {
      const raw = cipher.toString('utf8');
      const match = raw.match(/^enc\((.*)\)$/);
      return match ? match[1] : '';
    });

    const plaintext = 'xoxb-1234567890-secret';
    const encoded = encryptString(plaintext);
    expect(encoded.startsWith(CIPHER_PREFIX)).toBe(true);
    expect(decryptString(encoded)).toBe(plaintext);
  });

  it('falls back to the file backend when safeStorage is unavailable', () => {
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(false);

    const plaintext = 'sk-headless-secret';
    const encoded = encryptString(plaintext);

    // Routed to the file backend (distinct prefix), not safeStorage.
    expect(encoded.startsWith(FILE_CIPHER_PREFIX)).toBe(true);
    expect(mockSafeStorage.encryptString).not.toHaveBeenCalled();

    // The same wrapper decrypts a file-backed blob even though safeStorage is off.
    expect(decryptString(encoded)).toBe(plaintext);
    expect(mockSafeStorage.decryptString).not.toHaveBeenCalled();
  });

  it('prefers safeStorage and decrypts a keychain blob even after a file-backed write', () => {
    // Write a file-backed blob first (no keychain)...
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(false);
    const fileBlob = encryptString('from-file-backend');
    expect(fileBlob.startsWith(FILE_CIPHER_PREFIX)).toBe(true);

    // ...then with the keychain available, new writes use safeStorage...
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(true);
    mockSafeStorage.encryptString.mockImplementation((p: string) => Buffer.from(`enc(${p})`));
    mockSafeStorage.decryptString.mockImplementation((c: Buffer) => {
      const m = c.toString('utf8').match(/^enc\((.*)\)$/);
      return m ? m[1] : '';
    });
    const keychainBlob = encryptString('from-keychain');
    expect(keychainBlob.startsWith(CIPHER_PREFIX)).toBe(true);
    expect(decryptString(keychainBlob)).toBe('from-keychain');

    // ...and the previously file-written blob is still decryptable by prefix routing.
    expect(decryptString(fileBlob)).toBe('from-file-backend');
  });

  it('rejects decrypting values without a known scheme prefix', () => {
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(true);
    expect(() => decryptString('b64:abc')).toThrowError(/prefix/);
    expect(() => decryptString('plain:abc')).toThrowError(/prefix/);
    expect(() => decryptString('')).toThrowError(/prefix/);
    expect(mockSafeStorage.decryptString).not.toHaveBeenCalled();
  });
});
