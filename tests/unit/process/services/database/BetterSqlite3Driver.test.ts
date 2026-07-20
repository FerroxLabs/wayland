import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BetterSqlite3Driver, toBetterSqlite3Options } from '@process/services/database/drivers/BetterSqlite3Driver';

describe('BetterSqlite3Driver options', () => {
  it('omits absent booleans instead of passing undefined into better-sqlite3', () => {
    expect(toBetterSqlite3Options({})).toEqual({});
  });

  it('preserves explicit read-only compatibility options', () => {
    expect(toBetterSqlite3Options({ readonly: true, fileMustExist: true })).toEqual({
      readonly: true,
      fileMustExist: true,
    });
  });
});

// The installed native module is rebuilt for Electron's ABI. Node Vitest must
// not attempt to load it; the same cases run in the Electron proof script at
// scripts/verify-recovery-sqlite-backup.cjs.
describe.skipIf(!process.versions.electron)('BetterSqlite3Driver backup', () => {
  const temporaryDirectories: string[] = [];

  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  function temporaryDirectory(): string {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-better-sqlite-test-'));
    temporaryDirectories.push(directory);
    return directory;
  }

  it('captures committed WAL state into a standalone database', async () => {
    const directory = temporaryDirectory();
    const sourcePath = path.join(directory, 'source.db');
    const backupPath = path.join(directory, 'backup.db');
    const source = new BetterSqlite3Driver(sourcePath);

    try {
      source.pragma('journal_mode = WAL');
      source.pragma('wal_autocheckpoint = 0');
      source.exec('CREATE TABLE recovery_probe (value TEXT NOT NULL)');
      source.prepare('INSERT INTO recovery_probe (value) VALUES (?)').run('committed-in-wal');
      expect(fs.existsSync(`${sourcePath}-wal`)).toBe(true);

      await source.backup(backupPath);

      const backup = new BetterSqlite3Driver(backupPath, { readonly: true, fileMustExist: true });
      try {
        expect(backup.prepare('SELECT value FROM recovery_probe').get()).toEqual({ value: 'committed-in-wal' });
      } finally {
        backup.close();
      }
      if (process.platform !== 'win32') {
        expect(fs.statSync(backupPath).mode & 0o777).toBe(0o600);
      }
    } finally {
      source.close();
    }
  });

  it('serializes committed WAL state into an application-consistent in-memory image', () => {
    const directory = temporaryDirectory();
    const sourcePath = path.join(directory, 'source.db');
    const snapshotPath = path.join(directory, 'snapshot-from-memory.db');
    const source = new BetterSqlite3Driver(sourcePath);

    try {
      source.pragma('journal_mode = WAL');
      source.pragma('wal_autocheckpoint = 0');
      source.exec('CREATE TABLE recovery_probe (value TEXT NOT NULL)');
      source.prepare('INSERT INTO recovery_probe (value) VALUES (?)').run('committed-in-wal');

      const bytes = source.snapshotBytes();
      expect(bytes.subarray(0, 16).toString()).toBe('SQLite format 3\0');
      fs.writeFileSync(snapshotPath, bytes, { flag: 'wx', mode: 0o600 });
      const snapshot = new BetterSqlite3Driver(snapshotPath, { readonly: true, fileMustExist: true });
      try {
        expect(snapshot.prepare('SELECT value FROM recovery_probe').get()).toEqual({ value: 'committed-in-wal' });
      } finally {
        snapshot.close();
      }
    } finally {
      source.close();
    }
  });

  it('never overwrites an existing destination', async () => {
    const directory = temporaryDirectory();
    const sourcePath = path.join(directory, 'source.db');
    const backupPath = path.join(directory, 'existing.db');
    const source = new BetterSqlite3Driver(sourcePath);
    fs.writeFileSync(backupPath, 'prior-evidence');

    try {
      source.exec('CREATE TABLE recovery_probe (value TEXT NOT NULL)');
      await expect(source.backup(backupPath)).rejects.toMatchObject({ code: 'EEXIST' });
      expect(fs.readFileSync(backupPath, 'utf8')).toBe('prior-evidence');
    } finally {
      source.close();
    }
  });

  it('refuses to back up over its source database', async () => {
    const directory = temporaryDirectory();
    const sourcePath = path.join(directory, 'source.db');
    const source = new BetterSqlite3Driver(sourcePath);
    try {
      await expect(source.backup(sourcePath)).rejects.toThrow('must differ from the source');
    } finally {
      source.close();
    }
  });
});
