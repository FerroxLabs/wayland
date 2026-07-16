// src/process/services/database/drivers/createDriver.ts

import type { ISqliteDriver } from './ISqliteDriver';

export type DriverOpenOptions = {
  readonly?: boolean;
  fileMustExist?: boolean;
};

export async function createDriver(dbPath: string, options: DriverOpenOptions = {}): Promise<ISqliteDriver> {
  if (typeof process.versions['bun'] !== 'undefined') {
    // @ts-ignore -- BunSqliteDriver uses bun:sqlite which is not available in tsc's module resolution
    const { BunSqliteDriver } = await import('./BunSqliteDriver');
    return new BunSqliteDriver(dbPath, options);
  }
  const { BetterSqlite3Driver } = await import('./BetterSqlite3Driver');
  return new BetterSqlite3Driver(dbPath, options);
}
