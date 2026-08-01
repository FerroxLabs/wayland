import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';

const migrationV51 = ALL_MIGRATIONS.find((migration) => migration.version === 51) as IMigration;
const migrationV54 = ALL_MIGRATIONS.find((migration) => migration.version === 54) as IMigration;

describe('Migration v54 - audit mutation result', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    migrationV51.up(driver);
  });

  afterEach(() => driver.close());

  it('adds a constrained result column while preserving legacy rows', () => {
    driver.prepare('INSERT INTO audit_log (action, created_at) VALUES (?, ?)').run('legacy.action', 1);
    migrationV54.up(driver);

    const legacy = driver.prepare('SELECT result FROM audit_log WHERE action = ?').get('legacy.action') as {
      result: string;
    };
    expect(legacy.result).toBe('unknown');
    expect(() =>
      driver
        .prepare('INSERT INTO audit_log (action, result, created_at) VALUES (?, ?, ?)')
        .run('constitution.write', 'success', 2)
    ).not.toThrow();
    expect(() =>
      driver.prepare('INSERT INTO audit_log (action, result, created_at) VALUES (?, ?, ?)').run('bad', 'maybe', 3)
    ).toThrow();
  });

  it('is idempotent', () => {
    migrationV54.up(driver);
    expect(() => migrationV54.up(driver)).not.toThrow();
  });
});
