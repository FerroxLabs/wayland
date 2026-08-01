// src/process/services/database/drivers/ISqliteDriver.ts

export interface IStatement {
  get(...args: unknown[]): unknown;
  all(...args: unknown[]): unknown[];
  run(...args: unknown[]): { changes: number; lastInsertRowid: number | bigint };
}

export interface ISqliteDriver {
  prepare(sql: string): IStatement;
  exec(sql: string): void;
  pragma(sql: string, options?: { simple?: boolean }): unknown;
  transaction<T>(fn: (...args: unknown[]) => T): (...args: unknown[]) => T;
  /**
   * Produce an application-consistent snapshot without replacing an existing
   * destination. Implementations must include committed WAL state.
   */
  backup(destinationPath: string): Promise<void>;
  /**
   * Return an application-consistent SQLite image without ever materializing a
   * plaintext staging file. Recovery capture requires this capability so a
   * process crash cannot strand a readable database beside the snapshot.
   */
  snapshotBytes?(): Buffer;
  close(): void;
}
