/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockProcessConfig, mockSecrets, mockGetDatabase, mockDb } = vi.hoisted(() => {
  const CIPHER_PREFIX = 'enc:v1:';
  return {
    mockProcessConfig: {
      get: vi.fn(),
      set: vi.fn(),
    },
    mockSecrets: {
      isEncryptionAvailable: vi.fn(() => true),
      encryptString: vi.fn(
        (plaintext: string) => `${CIPHER_PREFIX}${Buffer.from(plaintext, 'utf-8').toString('base64')}`
      ),
      decryptString: vi.fn(),
      CIPHER_PREFIX,
      isSensitiveField: vi.fn(),
      SENSITIVE_FIELD_NAMES: [],
    },
    mockDb: {
      getChannelPlugins: vi.fn(),
      upsertChannelPlugin: vi.fn(),
    },
    mockGetDatabase: vi.fn(),
  };
});

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: mockProcessConfig,
}));

vi.mock('@process/secrets', () => mockSecrets);

vi.mock('@process/services/database/export', () => ({
  getDatabase: mockGetDatabase,
}));

import { migrateCredentialsToSafeStorage_v1 } from '@process/utils/credentialMigration';

describe('credentialMigration.migrateCredentialsToSafeStorage_v1', () => {
  beforeEach(() => {
    mockProcessConfig.get.mockReset();
    mockProcessConfig.set.mockReset();
    mockSecrets.isEncryptionAvailable.mockReset().mockReturnValue(true);
    mockDb.getChannelPlugins.mockReset();
    mockDb.upsertChannelPlugin.mockReset();
    mockGetDatabase.mockReset().mockResolvedValue(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('is a no-op when the migration flag is already true', async () => {
    mockProcessConfig.get.mockResolvedValueOnce(true);

    await migrateCredentialsToSafeStorage_v1();

    expect(mockGetDatabase).not.toHaveBeenCalled();
    expect(mockDb.getChannelPlugins).not.toHaveBeenCalled();
    expect(mockProcessConfig.set).not.toHaveBeenCalled();
  });

  it('re-encrypts every plugin and sets the flag on success', async () => {
    mockProcessConfig.get.mockResolvedValueOnce(undefined);
    mockDb.getChannelPlugins.mockReturnValue({
      success: true,
      data: [
        {
          id: 'slack-1',
          type: 'slack',
          name: 'Slack',
          enabled: true,
          credentials: { botToken: 'test', chatId: '123' },
          config: {},
          status: 'stopped',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });
    mockDb.upsertChannelPlugin.mockReturnValue({ success: true, data: true });

    await migrateCredentialsToSafeStorage_v1();

    expect(mockDb.upsertChannelPlugin).toHaveBeenCalledTimes(1);
    // The plugin object is upserted with plaintext credentials - the database
    // layer re-encrypts via the (now safeStorage-backed) encryptCredentials.
    const arg = mockDb.upsertChannelPlugin.mock.calls[0][0];
    expect(arg.credentials.botToken).toBe('test');
    expect(arg.credentials.chatId).toBe('123');
    expect(mockProcessConfig.set).toHaveBeenCalledWith('system.credentialsCryptoMigrated_v1', true);
  });

  it('short-circuits and leaves the flag unset when encryption is unavailable', async () => {
    mockProcessConfig.get.mockResolvedValueOnce(undefined);
    mockSecrets.isEncryptionAvailable.mockReturnValue(false);

    await migrateCredentialsToSafeStorage_v1();

    expect(mockGetDatabase).not.toHaveBeenCalled();
    expect(mockDb.upsertChannelPlugin).not.toHaveBeenCalled();
    expect(mockProcessConfig.set).not.toHaveBeenCalled();
  });

  it('does not set the flag when any plugin upsert fails', async () => {
    mockProcessConfig.get.mockResolvedValueOnce(undefined);
    mockDb.getChannelPlugins.mockReturnValue({
      success: true,
      data: [
        {
          id: 'slack-1',
          type: 'slack',
          name: 'Slack',
          enabled: true,
          credentials: { botToken: 'test' },
          config: {},
          status: 'stopped',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });
    mockDb.upsertChannelPlugin.mockReturnValue({ success: false, error: 'disk full' });

    await migrateCredentialsToSafeStorage_v1();

    expect(mockProcessConfig.set).not.toHaveBeenCalled();
  });

  it('swallows database listing failure and leaves the flag unset', async () => {
    mockProcessConfig.get.mockResolvedValueOnce(undefined);
    mockDb.getChannelPlugins.mockReturnValue({ success: false, error: 'db not ready', data: [] });

    await migrateCredentialsToSafeStorage_v1();

    expect(mockDb.upsertChannelPlugin).not.toHaveBeenCalled();
    expect(mockProcessConfig.set).not.toHaveBeenCalled();
  });

  it('does not throw when ProcessConfig.get rejects', async () => {
    mockProcessConfig.get.mockRejectedValueOnce(new Error('storage corrupt'));

    await expect(migrateCredentialsToSafeStorage_v1()).resolves.toBeUndefined();
    expect(mockProcessConfig.set).not.toHaveBeenCalled();
  });

  it('sets the flag when the plugin list is empty (nothing to migrate)', async () => {
    mockProcessConfig.get.mockResolvedValueOnce(undefined);
    mockDb.getChannelPlugins.mockReturnValue({ success: true, data: [] });

    await migrateCredentialsToSafeStorage_v1();

    expect(mockDb.upsertChannelPlugin).not.toHaveBeenCalled();
    expect(mockProcessConfig.set).toHaveBeenCalledWith('system.credentialsCryptoMigrated_v1', true);
  });
});
