/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('secrets/safeStorage', () => {
  beforeEach(() => {
    mockSafeStorage.isEncryptionAvailable.mockReset();
    mockSafeStorage.encryptString.mockReset();
    mockSafeStorage.decryptString.mockReset();
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

  it('throws when encryption is not available, with remediation guidance', () => {
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(false);
    expect(() => encryptString('anything')).toThrowError(/libsecret/);
    expect(mockSafeStorage.encryptString).not.toHaveBeenCalled();
  });

  it('rejects decrypting values without the version prefix', () => {
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(true);
    expect(() => decryptString('b64:abc')).toThrowError(/prefix/);
    expect(() => decryptString('plain:abc')).toThrowError(/prefix/);
    expect(() => decryptString('')).toThrowError(/prefix/);
    expect(mockSafeStorage.decryptString).not.toHaveBeenCalled();
  });
});
