// @ts-nocheck -- this file uses bun:sqlite which is a Bun built-in not available to tsc
// src/process/services/database/drivers/BunSqliteDriver.ts
// bun:sqlite is a Bun built-in - this file must only be loaded when running under Bun.

import { Database } from 'bun:sqlite';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ISqliteDriver, IStatement } from './ISqliteDriver';
import type { DriverOpenOptions } from './createDriver';

class BunStatement implements IStatement {
  constructor(
    private db: Database,
    private sql: string
  ) {}

  get(...args: unknown[]): unknown {
    return this.db.query(this.sql).get(...args);
  }

  all(...args: unknown[]): unknown[] {
    return this.db.query(this.sql).all(...args) as unknown[];
  }

  run(...args: unknown[]): {
    changes: number;
    lastInsertRowid: number | bigint;
  } {
    // bun:sqlite db.query(...).run() returns void.
    // Use db.run() (top-level Database method) which returns { changes, lastInsertRowid }.
    return this.db.run(this.sql, ...args);
  }
}

export class BunSqliteDriver implements ISqliteDriver {
  private db: Database;

  constructor(
    private readonly dbPath: string,
    options: DriverOpenOptions = {}
  ) {
    this.db = new Database(
      dbPath,
      options.readonly
        ? { readonly: true, create: false }
        : { readwrite: true, create: options.fileMustExist ? false : true }
    );
  }

  prepare(sql: string): IStatement {
    return new BunStatement(this.db, sql);
  }

  exec(sql: string): void {
    // bun:sqlite db.run() does not support multi-statement strings.
    // Callers must pass single statements only.
    this.db.run(sql);
  }

  pragma(sql: string, options?: { simple?: boolean }): unknown {
    // Setter pragma: contains '=' (e.g. 'foreign_keys = ON')
    if (sql.includes('=')) {
      this.db.run(`PRAGMA ${sql}`);
      return undefined;
    }
    // Getter pragma with { simple: true }: return scalar value
    if (options?.simple) {
      const row = this.db.query(`PRAGMA ${sql}`).get() as Record<string, unknown> | null;
      if (!row) return undefined;
      return Object.values(row)[0];
    }
    // Getter pragma (default): return all rows as array
    return this.db.query(`PRAGMA ${sql}`).all();
  }

  transaction<T>(fn: (...args: unknown[]) => T): (...args: unknown[]) => T {
    return this.db.transaction(fn);
  }

  async backup(destinationPath: string): Promise<void> {
    const resolvedDestination = path.resolve(destinationPath);
    if (this.dbPath !== ':memory:' && resolvedDestination === path.resolve(this.dbPath)) {
      throw new Error('SQLite backup destination must differ from the source database.');
    }

    // serialize() returns a consistent image of the open connection, including
    // committed WAL state. wx makes publication fail closed if evidence exists.
    await writeFile(resolvedDestination, this.db.serialize(), {
      flag: 'wx',
      mode: 0o600,
    });
  }

  close(): void {
    this.db.close();
  }
}
