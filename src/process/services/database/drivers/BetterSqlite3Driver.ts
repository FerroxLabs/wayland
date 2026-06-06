// src/process/services/database/drivers/BetterSqlite3Driver.ts

import fs from 'node:fs';
import BetterSqlite3 from 'better-sqlite3';
import type Database from 'better-sqlite3';
import type { ISqliteDriver, IStatement } from './ISqliteDriver';

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

  constructor(dbPath: string) {
    this.db = new BetterSqlite3(dbPath);
    // SEC-DATA-04: the DB holds at-rest secrets (jwt_secret, encrypted api
    // keys). Restrict it to owner-only on POSIX so other local users / backup
    // daemons can't read it. No-op on Windows (file mode is meaningless there;
    // the durable cross-platform story is value-level safeStorage encryption).
    // Wrapped in try/catch so a chmod failure never blocks app startup.
    if (process.platform !== 'win32') {
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

  close(): void {
    this.db.close();
  }
}
