// Run with: bun test src/process/services/recovery/startupCompatibility.bun.test.ts

import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BunSqliteDriver } from '../database/drivers/BunSqliteDriver';
import { CURRENT_DB_VERSION } from '../database/schema';
import { assertDatabaseSchemaCompatible } from './startupCompatibility';

function snapshotFiles(directory: string): Map<string, Buffer> {
  return new Map(
    readdirSync(directory)
      .sort()
      .map((name) => [name, readFileSync(path.join(directory, name))])
  );
}

describe('startup compatibility against a real SQLite database', () => {
  let tempDirectory: string | undefined;

  afterEach(() => {
    if (tempDirectory) rmSync(tempDirectory, { recursive: true, force: true });
    tempDirectory = undefined;
  });

  it('rejects a future schema without checkpointing, deleting, or changing persistent SQLite data', async () => {
    tempDirectory = mkdtempSync(path.join(os.tmpdir(), 'wayland-startup-compat-'));
    const databasePath = path.join(tempDirectory, 'wayland.db');
    const writer = new BunSqliteDriver(databasePath);

    try {
      writer.pragma('journal_mode = WAL');
      writer.exec('CREATE TABLE future_sentinel (value TEXT NOT NULL)');
      writer.prepare('INSERT INTO future_sentinel (value) VALUES (?)').run('preserve-me');
      writer.pragma(`user_version = ${CURRENT_DB_VERSION + 1}`);

      const before = snapshotFiles(tempDirectory);

      await expect(assertDatabaseSchemaCompatible(databasePath)).rejects.toMatchObject({
        code: 'DATABASE_SCHEMA_NEWER_THAN_APP',
        currentVersion: CURRENT_DB_VERSION + 1,
        supportedVersion: CURRENT_DB_VERSION,
      });

      const after = snapshotFiles(tempDirectory);
      expect([...after.keys()]).toEqual([...before.keys()]);
      // SQLite may update lock-coordination bytes in the shared-memory file
      // while opening a read-only connection. The authoritative DB and WAL
      // contents must remain byte-identical and no sidecar may be removed.
      const changedFiles = [...before]
        .filter(([name, bytes]) => name !== 'wayland.db-shm' && !after.get(name)?.equals(bytes))
        .map(([name]) => name);
      expect(changedFiles).toEqual([]);
      expect((writer.prepare('SELECT value FROM future_sentinel').get() as { value: string }).value).toBe(
        'preserve-me'
      );
    } finally {
      writer.close();
    }
  });
});
