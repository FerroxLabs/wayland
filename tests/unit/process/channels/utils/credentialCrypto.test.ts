/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted in-memory fake for @process/secrets. Real safeStorage requires
// Electron's runtime and OS keychain, which we don't have in node tests.
const { mockSecrets } = vi.hoisted(() => {
  const CIPHER_PREFIX = 'enc:v1:';
  const SENSITIVE = [
    'token',
    'botToken',
    'appSecret',
    'apiKey',
    'password',
    'authToken',
    'accessToken',
    'refreshToken',
    'signingSecret',
    'channelSecret',
    'channelAccessToken',
    'verifyToken',
    'webhookSecret',
    'appToken',
    'appPassword',
  ];
  return {
    mockSecrets: {
      CIPHER_PREFIX,
      isEncryptionAvailable: vi.fn(() => true),
      encryptString: vi.fn((plaintext: string) => `${CIPHER_PREFIX}${Buffer.from(plaintext, 'utf-8').toString('base64')}`),
      decryptString: vi.fn((encoded: string) => {
        if (!encoded.startsWith(CIPHER_PREFIX)) {
          throw new Error(`Refusing to decrypt value without "${CIPHER_PREFIX}" prefix.`);
        }
        return Buffer.from(encoded.slice(CIPHER_PREFIX.length), 'base64').toString('utf-8');
      }),
      isSensitiveField: vi.fn((fieldName: string) => {
        const normalized = fieldName.toLowerCase().replace(/[_-]/g, '');
        return SENSITIVE.some((s) => normalized.includes(s.toLowerCase()));
      }),
      SENSITIVE_FIELD_NAMES: SENSITIVE,
    },
  };
});

vi.mock('@process/secrets', () => mockSecrets);

import {
  decryptCredentials,
  decryptString,
  encryptCredentials,
  encryptString,
  isEncryptionAvailable,
} from '@process/channels/utils/credentialCrypto';

describe('channels/credentialCrypto', () => {
  beforeEach(() => {
    mockSecrets.isEncryptionAvailable.mockClear();
    mockSecrets.encryptString.mockClear();
    mockSecrets.decryptString.mockClear();
    mockSecrets.isSensitiveField.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('encryptCredentials', () => {
    it('encrypts only sensitive fields and passes non-sensitive fields through', () => {
      const result = encryptCredentials({ botToken: 'xoxb-x', chatId: '123' });

      expect(result).toBeDefined();
      expect(result!.botToken).toEqual(expect.stringMatching(/^enc:v1:/));
      // chatId is a non-sensitive identifier - must NOT be encrypted.
      expect(result!.chatId).toBe('123');
      expect(mockSecrets.encryptString).toHaveBeenCalledTimes(1);
      expect(mockSecrets.encryptString).toHaveBeenCalledWith('xoxb-x');
    });

    it('returns undefined when given undefined', () => {
      expect(encryptCredentials(undefined)).toBeUndefined();
      expect(mockSecrets.encryptString).not.toHaveBeenCalled();
    });

    it('skips empty-string sensitive fields without calling encrypt', () => {
      const result = encryptCredentials({ botToken: '', chatId: '123' });
      expect(result!.botToken).toBe('');
      expect(mockSecrets.encryptString).not.toHaveBeenCalled();
    });

    it('passes numeric and boolean values through untouched', () => {
      const result = encryptCredentials({ token: 'abc', count: 7, debug: true });
      expect(result!.token).toEqual(expect.stringMatching(/^enc:v1:/));
      expect(result!.count).toBe(7);
      expect(result!.debug).toBe(true);
    });
  });

  describe('decryptCredentials', () => {
    it('roundtrips through encryptCredentials → decryptCredentials', () => {
      const original = { botToken: 'xoxb-secret', chatId: '42' };
      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted);
      expect(decrypted).toEqual(original);
    });

    it('returns undefined when given undefined', () => {
      expect(decryptCredentials(undefined)).toBeUndefined();
      expect(mockSecrets.decryptString).not.toHaveBeenCalled();
    });
  });

  describe('decryptString legacy bridge', () => {
    it('decodes legacy b64: prefix without touching safeStorage', () => {
      expect(decryptString('b64:dGVzdA==')).toBe('test');
      expect(mockSecrets.decryptString).not.toHaveBeenCalled();
    });

    it('strips legacy plain: prefix without touching safeStorage', () => {
      expect(decryptString('plain:test')).toBe('test');
      expect(mockSecrets.decryptString).not.toHaveBeenCalled();
    });

    it('best-effort base64-decodes legacy enc: (unversioned) prefix', () => {
      expect(decryptString('enc:dGVzdA==')).toBe('test');
      expect(mockSecrets.decryptString).not.toHaveBeenCalled();
    });

    it('returns unprefixed legacy values as-is', () => {
      expect(decryptString('raw-value-no-prefix')).toBe('raw-value-no-prefix');
      expect(mockSecrets.decryptString).not.toHaveBeenCalled();
    });

    it('routes enc:v1: values through safeStorage', () => {
      const encoded = encryptString('xoxb-real');
      expect(encoded.startsWith('enc:v1:')).toBe(true);
      expect(decryptString(encoded)).toBe('xoxb-real');
      expect(mockSecrets.decryptString).toHaveBeenCalledTimes(1);
    });

    it('returns empty string for empty input', () => {
      expect(decryptString('')).toBe('');
      expect(mockSecrets.decryptString).not.toHaveBeenCalled();
    });
  });

  describe('isEncryptionAvailable', () => {
    it('delegates to the secrets module', () => {
      mockSecrets.isEncryptionAvailable.mockReturnValueOnce(false);
      expect(isEncryptionAvailable()).toBe(false);
      expect(mockSecrets.isEncryptionAvailable).toHaveBeenCalledTimes(1);
    });
  });
});
