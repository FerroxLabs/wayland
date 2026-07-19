// src/process/services/database/drivers/BunSqliteDriver.bun.test.ts
// Run with: bun test src/process/services/database/drivers/BunSqliteDriver.bun.test.ts

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, afterEach } from 'bun:test';
import { BunSqliteDriver } from './BunSqliteDriver';

describe('BunSqliteDriver', () => {
  let driver: BunSqliteDriver;
  const temporaryDirectories: string[] = [];

  afterEach(() => {
    driver?.close();
    for (const directory of temporaryDirectories.splice(0)) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  function temporaryDirectory(): string {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-bun-sqlite-test-'));
    temporaryDirectories.push(directory);
    return directory;
  }

  it('exec and prepare().get() roundtrip', () => {
    driver = new BunSqliteDriver(':memory:');
    driver.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, val TEXT)');
    driver.prepare('INSERT INTO t (val) VALUES (?)').run('hello');
    const row = driver.prepare('SELECT val FROM t WHERE id = 1').get() as { val: string };
    expect(row.val).toBe('hello');
  });

  it('prepare().all() returns array', () => {
    driver = new BunSqliteDriver(':memory:');
    driver.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, val TEXT)');
    driver.prepare('INSERT INTO t (val) VALUES (?)').run('a');
    driver.prepare('INSERT INTO t (val) VALUES (?)').run('b');
    const rows = driver.prepare('SELECT val FROM t ORDER BY id').all() as Array<{ val: string }>;
    expect(rows).toHaveLength(2);
    expect(rows[0].val).toBe('a');
    expect(rows[1].val).toBe('b');
  });

  it('prepare().run() returns changes and lastInsertRowid', () => {
    driver = new BunSqliteDriver(':memory:');
    driver.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, val TEXT)');
    const result = driver.prepare('INSERT INTO t (val) VALUES (?)').run('x');
    expect(result.changes).toBe(1);
    expect(Number(result.lastInsertRowid)).toBe(1);
  });

  it('pragma() getter with simple:true returns scalar', () => {
    driver = new BunSqliteDriver(':memory:');
    const mode = driver.pragma('journal_mode', { simple: true });
    expect(typeof mode).toBe('string');
  });

  it('pragma() setter does not throw', () => {
    driver = new BunSqliteDriver(':memory:');
    expect(() => driver.pragma('foreign_keys = ON')).not.toThrow();
  });

  it('pragma() getter without options returns array', () => {
    driver = new BunSqliteDriver(':memory:');
    const result = driver.pragma('foreign_key_check');
    expect(Array.isArray(result)).toBe(true);
  });

  it('transaction() wraps function', () => {
    driver = new BunSqliteDriver(':memory:');
    driver.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, val TEXT)');
    const insert = driver.transaction((val: unknown) => {
      driver.prepare('INSERT INTO t (val) VALUES (?)').run(val);
    });
    insert('wrapped');
    const row = driver.prepare('SELECT val FROM t').get() as { val: string };
    expect(row.val).toBe('wrapped');
  });

  it('captures committed WAL state into a standalone database', async () => {
    const directory = temporaryDirectory();
    const sourcePath = path.join(directory, 'source.db');
    const backupPath = path.join(directory, 'backup.db');
    driver = new BunSqliteDriver(sourcePath);
    driver.pragma('journal_mode = WAL');
    driver.pragma('wal_autocheckpoint = 0');
    driver.exec('CREATE TABLE recovery_probe (value TEXT NOT NULL)');
    driver.prepare('INSERT INTO recovery_probe (value) VALUES (?)').run('committed-in-wal');
    expect(fs.existsSync(`${sourcePath}-wal`)).toBe(true);

    await driver.backup(backupPath);

    // Recovery validation opens an isolated mutable copy. WAL-mode database
    // headers can require SQLite to create sidecars on first standalone open.
    const backup = new BunSqliteDriver(backupPath, { fileMustExist: true });
    try {
      expect(backup.prepare('SELECT value FROM recovery_probe').get()).toEqual({ value: 'committed-in-wal' });
    } finally {
      backup.close();
    }
    if (process.platform !== 'win32') {
      expect(fs.statSync(backupPath).mode & 0o777).toBe(0o600);
    }
  });

  it('serializes committed WAL state into an application-consistent in-memory image', () => {
    const directory = temporaryDirectory();
    const sourcePath = path.join(directory, 'source.db');
    const snapshotPath = path.join(directory, 'snapshot-from-memory.db');
    driver = new BunSqliteDriver(sourcePath);
    driver.pragma('journal_mode = WAL');
    driver.pragma('wal_autocheckpoint = 0');
    driver.exec('CREATE TABLE recovery_probe (value TEXT NOT NULL)');
    driver.prepare('INSERT INTO recovery_probe (value) VALUES (?)').run('committed-in-wal');

    const bytes = driver.snapshotBytes();
    expect(bytes.subarray(0, 16).toString()).toBe('SQLite format 3\0');
    fs.writeFileSync(snapshotPath, bytes, { flag: 'wx', mode: 0o600 });
    const snapshot = new BunSqliteDriver(snapshotPath, { fileMustExist: true });
    try {
      expect(snapshot.prepare('SELECT value FROM recovery_probe').get()).toEqual({ value: 'committed-in-wal' });
    } finally {
      snapshot.close();
    }
  });

  it('never overwrites an existing destination', async () => {
    const directory = temporaryDirectory();
    const backupPath = path.join(directory, 'existing.db');
    driver = new BunSqliteDriver(':memory:');
    driver.exec('CREATE TABLE recovery_probe (value TEXT NOT NULL)');
    fs.writeFileSync(backupPath, 'prior-evidence');

    await expect(driver.backup(backupPath)).rejects.toMatchObject({ code: 'EEXIST' });
    expect(fs.readFileSync(backupPath, 'utf8')).toBe('prior-evidence');
  });

  it('refuses to back up over its source database', async () => {
    const directory = temporaryDirectory();
    const sourcePath = path.join(directory, 'source.db');
    driver = new BunSqliteDriver(sourcePath);
    await expect(driver.backup(sourcePath)).rejects.toThrow('must differ from the source');
  });
});
