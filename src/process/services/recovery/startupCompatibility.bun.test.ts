// Run with: bun test src/process/services/recovery/startupCompatibility.bun.test.ts

import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BunSqliteDriver } from '../database/drivers/BunSqliteDriver';
import { CURRENT_DB_VERSION } from '../database/schema';
import { downgradeAuthorityForClassic } from './recoveryStateTransformer';
import {
  assertClassicStartupIsolated,
  assertDatabaseSchemaCompatible,
  assertReupgradeAdmissible,
  ClassicStartupIsolationError,
  ReupgradeAdmissionError,
} from './startupCompatibility';

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

const SOURCE = { schemaVersion: 53, sourceEpoch: 7 } as const;

function classicRanDelta() {
  return downgradeAuthorityForClassic(SOURCE, [
    { workspace: '/ws/trusted', authority: 'trusted-edits' },
    { workspace: '/ws/ask', authority: 'ask' },
  ]);
}

describe('assertClassicStartupIsolated', () => {
  it('admits an isolated schema-52 transformed tree', () => {
    expect(() =>
      assertClassicStartupIsolated({ path: 'isolated-transformed-tree', schemaVersion: 52 })
    ).not.toThrow();
  });

  it('rejects a direct/live binary path before any historical binary executes', () => {
    try {
      assertClassicStartupIsolated({ path: 'direct-binary-path', schemaVersion: 52 });
      throw new Error('expected rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(ClassicStartupIsolationError);
      expect((error as ClassicStartupIsolationError).code).toBe('CLASSIC_DIRECT_STATE_PATH');
    }
  });

  it('refuses to open unclassified schema-53 state directly', () => {
    try {
      assertClassicStartupIsolated({ path: 'isolated-transformed-tree', schemaVersion: 53 });
      throw new Error('expected rejection');
    } catch (error) {
      expect((error as ClassicStartupIsolationError).code).toBe('CLASSIC_UNCLASSIFIED_FUTURE_SCHEMA');
    }
  });

  it('rejects any other schema as incompatible', () => {
    try {
      assertClassicStartupIsolated({ path: 'isolated-transformed-tree', schemaVersion: 51 });
      throw new Error('expected rejection');
    } catch (error) {
      expect((error as ClassicStartupIsolationError).code).toBe('CLASSIC_SCHEMA_INCOMPATIBLE');
    }
  });
});

describe('assertReupgradeAdmissible', () => {
  const base = () => ({
    path: 'isolated-transformed-tree' as const,
    treeSchemaVersion: 52,
    reupgradeDelta: classicRanDelta(),
    expectedSource: SOURCE,
  });

  it('reapplies exactly the source-bound authority on a clean re-upgrade', () => {
    const admission = assertReupgradeAdmissible(base());
    expect(admission).toEqual({
      schemaVersion: 53,
      sourceEpoch: 7,
      entries: [
        { workspace: '/ws/trusted', restoredAuthority: 'trusted-edits' },
        { workspace: '/ws/ask', restoredAuthority: 'ask' },
      ],
    });
  });

  it('ignores authority Classic left that stays within the source bound', () => {
    const admission = assertReupgradeAdmissible({
      ...base(),
      // Classic downgraded /ws/trusted to `chat`; re-upgrade still restores the
      // SOURCE-bound trusted-edits, not Classic's narrower leftover.
      classicObservedAuthority: { '/ws/trusted': 'chat', '/ws/ask': 'chat' },
    });
    expect(admission.entries).toEqual([
      { workspace: '/ws/trusted', restoredAuthority: 'trusted-edits' },
      { workspace: '/ws/ask', restoredAuthority: 'ask' },
    ]);
  });

  function expectCode(request: Parameters<typeof assertReupgradeAdmissible>[0], code: string): void {
    try {
      assertReupgradeAdmissible(request);
      throw new Error('expected rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(ReupgradeAdmissionError);
      expect((error as ReupgradeAdmissionError).code).toBe(code);
    }
  }

  it('fails closed on a direct state path', () => {
    expectCode({ ...base(), path: 'direct-binary-path' }, 'REUPGRADE_DIRECT_STATE_PATH');
  });

  it('fails closed when the transformed tree is not schema 52', () => {
    expectCode({ ...base(), treeSchemaVersion: 53 }, 'REUPGRADE_UNKNOWN_SCHEMA');
  });

  it('fails closed on an unknown expected source schema', () => {
    expectCode({ ...base(), expectedSource: { schemaVersion: 99, sourceEpoch: 7 } }, 'REUPGRADE_UNKNOWN_SCHEMA');
  });

  it('fails closed on a missing delta', () => {
    expectCode({ ...base(), reupgradeDelta: null }, 'REUPGRADE_MISSING_DELTA');
  });

  it('fails closed on a malformed/unusable delta', () => {
    expectCode({ ...base(), reupgradeDelta: { formatVersion: 2 } }, 'REUPGRADE_MISSING_DELTA');
  });

  it('fails closed on a stale source epoch', () => {
    expectCode({ ...base(), expectedSource: { schemaVersion: 53, sourceEpoch: 8 } }, 'REUPGRADE_STALE_SOURCE_EPOCH');
  });

  it('fails closed on an effective-authority increase left by Classic', () => {
    expectCode(
      { ...base(), classicObservedAuthority: { '/ws/ask': 'trusted-edits' } },
      'REUPGRADE_AUTHORITY_INCREASE'
    );
  });

  it('fails closed when a widened authority appears for an unknown workspace', () => {
    expectCode(
      { ...base(), classicObservedAuthority: { '/ws/injected': 'trusted-edits' } },
      'REUPGRADE_AUTHORITY_INCREASE'
    );
  });
});
