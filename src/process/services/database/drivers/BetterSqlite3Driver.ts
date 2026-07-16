// src/process/services/database/drivers/BetterSqlite3Driver.ts

import fs from 'node:fs';
import { chmod, link, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import BetterSqlite3 from 'better-sqlite3';
import type Database from 'better-sqlite3';
import type { ISqliteDriver, IStatement } from './ISqliteDriver';
import type { DriverOpenOptions } from './createDriver';

export function toBetterSqlite3Options(options: DriverOpenOptions): Database.Options {
  const normalized: Database.Options = {};
  if (options.readonly !== undefined) normalized.readonly = options.readonly;
  if (options.fileMustExist !== undefined) normalized.fileMustExist = options.fileMustExist;
  return normalized;
}

class BetterSqlite3Statement implements IStatement {
  constructor(private stmt: Database.Statement) {}

  get(...args: unknown[]): unknown {
    return this.stmt.get(...args);
  }

  all(...args: unknown[]): unknown[] {
    return this.stmt.all(...args) as unknown[];
  }

  run(...args: unknown[]): { changes: number; lastInsertRowid: number | bigint } {
    return this.stmt.run(...args);
  }
}

export class BetterSqlite3Driver implements ISqliteDriver {
  private db: Database.Database;

  constructor(
    private readonly dbPath: string,
    options: DriverOpenOptions = {}
  ) {
    this.db = new BetterSqlite3(dbPath, toBetterSqlite3Options(options));
    // SEC-DATA-04: the DB holds at-rest secrets (jwt_secret, encrypted api
    // keys). Restrict it to owner-only on POSIX so other local users / backup
    // daemons can't read it. No-op on Windows (file mode is meaningless there;
    // the durable cross-platform story is value-level safeStorage encryption).
    // Wrapped in try/catch so a chmod failure never blocks app startup.
    if (!options.readonly && process.platform !== 'win32') {
      try {
        fs.chmodSync(dbPath, 0o600);
      } catch (err) {
        console.warn('[BetterSqlite3Driver] Failed to chmod DB file to 0o600:', err);
      }
    }
  }

  prepare(sql: string): IStatement {
    return new BetterSqlite3Statement(this.db.prepare(sql));
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  pragma(sql: string, options?: { simple?: boolean }): unknown {
    return this.db.pragma(sql, options);
  }

  transaction<T>(fn: (...args: unknown[]) => T): (...args: unknown[]) => T {
    return this.db.transaction(fn);
  }

  async backup(destinationPath: string): Promise<void> {
    const resolvedDestination = path.resolve(destinationPath);
    if (this.dbPath !== ':memory:' && resolvedDestination === path.resolve(this.dbPath)) {
      throw new Error('SQLite backup destination must differ from the source database.');
    }

    // better-sqlite3 may update an existing destination. Capture beside the
    // destination, then publish through an exclusive hard link. That makes the
    // completed snapshot visible atomically without an overwrite window.
    const stagingDirectory = await mkdtemp(path.join(path.dirname(resolvedDestination), '.wayland-sqlite-backup-'));
    const stagedPath = path.join(stagingDirectory, 'snapshot.db');
    try {
      await this.db.backup(stagedPath);
      if (process.platform !== 'win32') await chmod(stagedPath, 0o600);
      await link(stagedPath, resolvedDestination);
    } finally {
      await rm(stagingDirectory, { recursive: true, force: true });
    }
  }

  close(): void {
    this.db.close();
  }
}
