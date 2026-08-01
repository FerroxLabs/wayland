import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ISqliteDriver } from '@process/services/database/drivers/ISqliteDriver';

vi.mock('@process/utils', () => ({
  ensureDirectory: vi.fn(),
  getDataPath: vi.fn(() => '/tmp/test'),
}));

vi.mock('@process/services/database/drivers/createDriver');
vi.mock('@process/services/database/migrations', () => ({ runMigrations: vi.fn() }));

vi.mock('@process/services/database/schema', () => ({
  CURRENT_DB_VERSION: 1,
  getDatabaseVersion: vi.fn(() => 1),
  initSchema: vi.fn(),
  setDatabaseVersion: vi.fn(),
}));

vi.mock('@process/services/database/types', () => ({
  conversationToRow: vi.fn(),
  messageToRow: vi.fn(),
  rowToConversation: vi.fn(),
  rowToMessage: vi.fn(),
}));

vi.mock('@process/channels/types', () => ({
  rowToChannelUser: vi.fn(),
  rowToChannelSession: vi.fn(),
  rowToPairingRequest: vi.fn(),
}));

vi.mock('@process/channels/utils/credentialCrypto', () => ({
  encryptCredentials: vi.fn(),
  decryptCredentials: vi.fn(),
  encryptString: vi.fn(),
  decryptString: vi.fn(),
}));

import { WaylandUIDatabase } from '@process/services/database/index';
import {
  assertDatabaseSchemaCompatible,
  DatabaseSchemaCompatibilityError,
  inspectDatabaseSchemaCompatibility,
} from '@process/services/recovery/startupCompatibility';
import { createDriver } from '@process/services/database/drivers/createDriver';
import { initSchema } from '@process/services/database/schema';
import fs from 'fs';

function createMockDriver(): ISqliteDriver {
  return {
    prepare: vi.fn(() => ({
      get: vi.fn(),
      all: vi.fn(() => []),
      run: vi.fn(() => ({ changes: 0, lastInsertRowid: 0 })),
    })),
    exec: vi.fn(),
    pragma: vi.fn(() => 1),
    transaction: vi.fn((fn) => fn),
    backup: vi.fn(async () => undefined),
    close: vi.fn(),
  };
}

describe('WaylandUIDatabase.create recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createDriver).mockReset();
    vi.mocked(initSchema).mockReset();
  });

  it('refuses a newer database before schema initialization without invoking corruption recovery', async () => {
    const futureDriver = createMockDriver();
    vi.mocked(createDriver).mockResolvedValueOnce(futureDriver);
    vi.mocked(futureDriver.pragma).mockReturnValueOnce(2);

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementation(() => undefined as never);
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined as never);

    const result = WaylandUIDatabase.create('/tmp/future.db');

    await expect(result).rejects.toBeInstanceOf(DatabaseSchemaCompatibilityError);
    await expect(result).rejects.toMatchObject({
      code: 'DATABASE_SCHEMA_NEWER_THAN_APP',
      currentVersion: 2,
      supportedVersion: 1,
    });
    expect(initSchema).not.toHaveBeenCalled();
    expect(futureDriver.close).toHaveBeenCalledOnce();
    expect(createDriver).toHaveBeenCalledOnce();
    expect(renameSpy).not.toHaveBeenCalled();
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('closes the failed driver before attempting file recovery', async () => {
    const failedDriver = createMockDriver();
    const freshDriver = createMockDriver();

    vi.mocked(createDriver).mockResolvedValueOnce(failedDriver).mockResolvedValueOnce(freshDriver);

    // First init fails (corruption), second succeeds
    vi.mocked(initSchema)
      .mockImplementationOnce(() => {
        throw new Error('database disk image is malformed');
      })
      .mockImplementationOnce(() => {});

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementation(() => undefined as never);
    vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined as never);

    await WaylandUIDatabase.create('/tmp/test.db');

    expect(failedDriver.close).toHaveBeenCalledOnce();
    expect(renameSpy).toHaveBeenCalled();
  });

  it('recovers successfully after closing the failed driver', async () => {
    const failedDriver = createMockDriver();
    const freshDriver = createMockDriver();

    vi.mocked(createDriver).mockResolvedValueOnce(failedDriver).mockResolvedValueOnce(freshDriver);

    vi.mocked(initSchema)
      .mockImplementationOnce(() => {
        throw new Error('database disk image is malformed');
      })
      .mockImplementationOnce(() => {});

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'renameSync').mockImplementation(() => undefined as never);
    vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined as never);

    const db = await WaylandUIDatabase.create('/tmp/test.db');
    expect(db).toBeInstanceOf(WaylandUIDatabase);
    expect(createDriver).toHaveBeenCalledTimes(2);
  });

  it('delegates online backup capture to the live driver', async () => {
    const driver = createMockDriver();
    vi.mocked(createDriver).mockResolvedValueOnce(driver);

    const db = await WaylandUIDatabase.create('/tmp/test.db');
    await db.backupTo('/tmp/recovery.db');

    expect(driver.backup).toHaveBeenCalledWith('/tmp/recovery.db');
  });

  it('does not close driver when createDriver itself throws', async () => {
    vi.mocked(createDriver).mockRejectedValueOnce(new Error('dlopen failed: libsqlite3.so not found'));

    await expect(WaylandUIDatabase.create('/tmp/test.db')).rejects.toThrow('dlopen');
  });

  it('does not replace the database when initialization fails without corruption markers', async () => {
    const failedDriver = createMockDriver();

    vi.mocked(createDriver).mockResolvedValueOnce(failedDriver);

    vi.mocked(initSchema).mockImplementationOnce(() => {
      throw new Error('SQLITE_CANTOPEN: unable to open database file');
    });

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementation(() => undefined as never);
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined as never);

    await expect(WaylandUIDatabase.create('/tmp/test.db')).rejects.toThrow('SQLITE_CANTOPEN');

    expect(failedDriver.close).toHaveBeenCalledOnce();
    expect(renameSpy).not.toHaveBeenCalled();
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('fails closed without deleting a corrupted database when quarantine cannot start', async () => {
    const failedDriver = createMockDriver();

    vi.mocked(createDriver).mockResolvedValueOnce(failedDriver);

    vi.mocked(initSchema).mockImplementationOnce(() => {
      throw new Error('database disk image is malformed');
    });

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'renameSync').mockImplementation(() => {
      throw new Error('EPERM: operation not permitted');
    });
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined as never);

    await expect(WaylandUIDatabase.create('/tmp/test.db')).rejects.toThrow(
      'Database is corrupted and could not be quarantined safely'
    );
    expect(failedDriver.close).toHaveBeenCalledOnce();
    expect(unlinkSpy).not.toHaveBeenCalled();
    expect(createDriver).toHaveBeenCalledOnce();
  });

  it('quarantines WAL and shared-memory sidecars instead of deleting recovery evidence', async () => {
    const failedDriver = createMockDriver();
    const freshDriver = createMockDriver();

    vi.mocked(createDriver).mockResolvedValueOnce(failedDriver).mockResolvedValueOnce(freshDriver);

    vi.mocked(initSchema)
      .mockImplementationOnce(() => {
        throw new Error('database disk image is malformed');
      })
      .mockImplementationOnce(() => {});

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementation(() => undefined as never);
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined as never);

    await WaylandUIDatabase.create('/tmp/test.db');

    expect(renameSpy).toHaveBeenCalledWith('/tmp/test.db', expect.stringMatching(/^\/tmp\/test\.db\.corrupt\.\d+$/));
    expect(renameSpy).toHaveBeenCalledWith(
      '/tmp/test.db-wal',
      expect.stringMatching(/^\/tmp\/test\.db\.corrupt\.\d+-wal$/)
    );
    expect(renameSpy).toHaveBeenCalledWith(
      '/tmp/test.db-shm',
      expect.stringMatching(/^\/tmp\/test\.db\.corrupt\.\d+-shm$/)
    );
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('rolls back an already-moved database when a sidecar cannot be quarantined', async () => {
    const failedDriver = createMockDriver();
    vi.mocked(createDriver).mockResolvedValueOnce(failedDriver);
    vi.mocked(initSchema).mockImplementationOnce(() => {
      throw new Error('database disk image is malformed');
    });

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const renameSpy = vi.spyOn(fs, 'renameSync');
    renameSpy
      .mockImplementationOnce(() => undefined as never)
      .mockImplementationOnce(() => {
        throw new Error('EPERM: WAL locked');
      })
      .mockImplementationOnce(() => undefined as never);
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined as never);

    await expect(WaylandUIDatabase.create('/tmp/test.db')).rejects.toThrow(
      'Database is corrupted and could not be quarantined safely. Original files remain in place.'
    );
    expect(renameSpy).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching(/^\/tmp\/test\.db\.corrupt\.\d+$/),
      '/tmp/test.db'
    );
    expect(unlinkSpy).not.toHaveBeenCalled();
    expect(createDriver).toHaveBeenCalledOnce();
  });
});

describe('database schema compatibility preflight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createDriver).mockReset();
  });

  it('reports an absent database without opening or creating it', async () => {
    vi.spyOn(fs, 'lstatSync').mockImplementation(() => {
      throw Object.assign(new Error('ENOENT: database absent'), { code: 'ENOENT' });
    });

    await expect(inspectDatabaseSchemaCompatibility('/tmp/absent.db')).resolves.toEqual({
      status: 'new',
      currentVersion: null,
      supportedVersion: 1,
      databasePath: '/tmp/absent.db',
    });
    expect(createDriver).not.toHaveBeenCalled();
  });

  it('opens an existing database read-only and closes it after inspection', async () => {
    const driver = createMockDriver();
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'lstatSync').mockReturnValue({
      isSymbolicLink: () => false,
      isFile: () => true,
    } as fs.Stats);
    vi.mocked(createDriver).mockResolvedValueOnce(driver);

    await expect(inspectDatabaseSchemaCompatibility('/tmp/existing.db')).resolves.toMatchObject({
      status: 'compatible',
      currentVersion: 1,
      supportedVersion: 1,
    });
    expect(createDriver).toHaveBeenCalledWith('/tmp/existing.db', { readonly: true, fileMustExist: true });
    expect(driver.close).toHaveBeenCalledOnce();
  });

  it('throws a typed stop for a newer database and still closes the read-only driver', async () => {
    const driver = createMockDriver();
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'lstatSync').mockReturnValue({
      isSymbolicLink: () => false,
      isFile: () => true,
    } as fs.Stats);
    vi.mocked(createDriver).mockResolvedValueOnce(driver);
    vi.mocked(driver.pragma).mockReturnValueOnce(2);

    await expect(assertDatabaseSchemaCompatible('/tmp/future.db')).rejects.toMatchObject({
      code: 'DATABASE_SCHEMA_NEWER_THAN_APP',
      currentVersion: 2,
      supportedVersion: 1,
    });
    expect(driver.close).toHaveBeenCalledOnce();
  });

  it('classifies ordinary startup failures instead of treating them as version zero', async () => {
    const driver = createMockDriver();
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'lstatSync').mockReturnValue({
      isSymbolicLink: () => false,
      isFile: () => true,
    } as fs.Stats);
    vi.mocked(createDriver).mockResolvedValueOnce(driver);
    vi.mocked(driver.pragma).mockImplementationOnce(() => {
      throw new Error('SQLITE_IOERR: disk I/O error');
    });

    await expect(assertDatabaseSchemaCompatible('/tmp/unreadable.db')).rejects.toMatchObject({
      code: 'DATABASE_STARTUP_FAILURE',
      currentVersion: null,
      supportedVersion: 1,
    });
    expect(driver.close).toHaveBeenCalledOnce();
  });

  it.each([
    ['database disk image is malformed', 'corrupt', 'DATABASE_CORRUPT'],
    ['dlopen failed: native driver unavailable', 'native-driver-failure', 'DATABASE_NATIVE_DRIVER_FAILURE'],
  ] as const)('classifies %s as %s', async (message, status, code) => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'lstatSync').mockReturnValue({
      isSymbolicLink: () => false,
      isFile: () => true,
    } as fs.Stats);
    vi.mocked(createDriver).mockRejectedValue(new Error(message));

    await expect(inspectDatabaseSchemaCompatibility('/tmp/blocked.db')).resolves.toMatchObject({ status });
    await expect(assertDatabaseSchemaCompatible('/tmp/blocked.db')).rejects.toMatchObject({ code });
  });

  it('refuses symlinked database paths without opening the target', async () => {
    vi.spyOn(fs, 'lstatSync').mockReturnValue({
      isSymbolicLink: () => true,
      isFile: () => false,
    } as fs.Stats);

    await expect(assertDatabaseSchemaCompatible('/tmp/linked.db')).rejects.toMatchObject({
      code: 'DATABASE_STARTUP_FAILURE',
      compatibility: expect.objectContaining({ status: 'startup-failure', reason: 'database path is a symbolic link' }),
    });
    expect(createDriver).not.toHaveBeenCalled();
  });

  it('refuses broken symlinks instead of misclassifying them as a new database', async () => {
    vi.spyOn(fs, 'lstatSync').mockReturnValue({
      isSymbolicLink: () => true,
      isFile: () => false,
    } as fs.Stats);

    await expect(inspectDatabaseSchemaCompatibility('/tmp/broken-link.db')).resolves.toMatchObject({
      status: 'startup-failure',
      reason: 'database path is a symbolic link',
    });
    expect(createDriver).not.toHaveBeenCalled();
  });
});
