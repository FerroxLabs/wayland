/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * An `ISqliteDriver` backed by Node's own `node:sqlite`, for suites that need a
 * REAL database under vitest.
 *
 * WHY THIS EXISTS
 * ---------------
 * `describeNativeSqlite` gates the better-sqlite3-backed suites, and on any
 * machine whose install ran `electron-builder install-app-deps` the addon is
 * compiled for the ELECTRON ABI. vitest runs under Node, so the load fails with
 * `NODE_MODULE_VERSION 145 ... requires NODE_MODULE_VERSION 127` and those
 * suites SKIP. That is a deliberate dev convenience, but it means a regression
 * pinned only there is not pinned at all on a box in that state - the whole
 * `SqliteTeamRepository` suite skips, 30 tests at a time.
 *
 * `node:sqlite` ships inside Node itself: no native build, no ABI to match, real
 * SQLite semantics including real transactions. Suites that only need "a real
 * database" (rather than better-sqlite3 specifically) can use this and run
 * everywhere.
 *
 * Only the surface `ISqliteDriver` declares is implemented. `backup` throws
 * rather than pretending: nothing that uses this driver takes snapshots, and a
 * quietly wrong backup is worse than a missing one.
 */

import { DatabaseSync } from 'node:sqlite';
import type { ISqliteDriver, IStatement } from '@process/services/database/drivers/ISqliteDriver';

/** node:sqlite rejects `undefined`; better-sqlite3 callers pass `null`. */
type Bindable = null | number | bigint | string | Uint8Array;

function toBindable(value: unknown): Bindable {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'string') return value;
  if (value instanceof Uint8Array) return value;
  throw new TypeError(`node:sqlite cannot bind a value of type ${typeof value}`);
}

class NodeSqliteStatement implements IStatement {
  constructor(
    private readonly db: DatabaseSync,
    private readonly sql: string
  ) {}

  private bind(args: unknown[]): Bindable[] {
    return args.map(toBindable);
  }

  get(...args: unknown[]): unknown {
    return this.db.prepare(this.sql).get(...this.bind(args)) ?? undefined;
  }

  all(...args: unknown[]): unknown[] {
    return this.db.prepare(this.sql).all(...this.bind(args)) as unknown[];
  }

  run(...args: unknown[]): { changes: number; lastInsertRowid: number | bigint } {
    const result = this.db.prepare(this.sql).run(...this.bind(args));
    return { changes: Number(result.changes), lastInsertRowid: Number(result.lastInsertRowid) };
  }
}

export class NodeSqliteDriver implements ISqliteDriver {
  private readonly db: DatabaseSync;
  /** Depth of the current transaction, so a nested one uses a SAVEPOINT. */
  private depth = 0;

  constructor(dbPath = ':memory:') {
    this.db = new DatabaseSync(dbPath);
  }

  prepare(sql: string): IStatement {
    return new NodeSqliteStatement(this.db, sql);
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  pragma(sql: string, options?: { simple?: boolean }): unknown {
    if (sql.includes('=')) {
      this.db.exec(`PRAGMA ${sql}`);
      return undefined;
    }
    const rows = this.db.prepare(`PRAGMA ${sql}`).all() as Array<Record<string, unknown>>;
    if (!options?.simple) return rows;
    const first = rows[0];
    return first ? Object.values(first)[0] : undefined;
  }

  /**
   * better-sqlite3's `transaction()` returns a wrapped function that runs inside
   * BEGIN/COMMIT and rolls back on throw, and nests via SAVEPOINT. Both are
   * reproduced here because the repositories rely on the rollback-on-throw
   * guarantee for their read-merge-write writers.
   */
  transaction<T>(fn: (...args: unknown[]) => T): (...args: unknown[]) => T {
    return (...args: unknown[]): T => {
      const nested = this.depth > 0;
      const name = `wl_sp_${this.depth}`;
      this.db.exec(nested ? `SAVEPOINT ${name}` : 'BEGIN');
      this.depth += 1;
      try {
        const result = fn(...args);
        this.db.exec(nested ? `RELEASE ${name}` : 'COMMIT');
        return result;
      } catch (error) {
        this.db.exec(nested ? `ROLLBACK TO ${name}; RELEASE ${name}` : 'ROLLBACK');
        throw error;
      } finally {
        this.depth -= 1;
      }
    };
  }

  async backup(): Promise<void> {
    throw new Error('NodeSqliteDriver does not implement backup(); use the real driver for snapshot tests.');
  }

  close(): void {
    this.db.close();
  }
}
