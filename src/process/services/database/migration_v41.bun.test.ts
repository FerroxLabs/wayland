// src/process/services/database/migration_v41.bun.test.ts
// Run with: bun test src/process/services/database/migration_v41.bun.test.ts
//
// Bun-runtime sibling to tests/unit/process/services/database/migration_v41.test.ts.
// The vitest copy exercises the migration via the production BetterSqlite3Driver
// + full runMigrations chain (CI's native-module path). This file invokes the
// migration directly through BunSqliteDriver so the migration is verifiable
// on local dev machines where better-sqlite3 native bindings ABI-mismatch.

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BunSqliteDriver } from './drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from './migrations';

const migration_v41 = ALL_MIGRATIONS.find((m) => m.version === 41) as IMigration | undefined;

describe('Migration v41 - workflow_sessions table (bun:sqlite)', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    expect(migration_v41).toBeDefined();
    migration_v41!.up(driver);
  });

  afterEach(() => driver.close());

  it('is registered in ALL_MIGRATIONS at version 41', () => {
    expect(migration_v41).toBeDefined();
    expect(migration_v41!.version).toBe(41);
    expect(migration_v41!.name).toMatch(/workflow_sessions/i);
  });

  it('creates the workflow_sessions table with all required columns', () => {
    const cols = driver.pragma('table_info(workflow_sessions)') as Array<{ name: string }>;
    const colNames = cols.map((c) => c.name).sort();
    expect(colNames).toEqual([
      'asks_json',
      'category',
      'completed_at',
      'conversation_id',
      'created_at',
      'current_step',
      'id',
      'palette',
      'skills_json',
      'status',
      'steps_json',
      'total_steps',
      'updated_at',
      'workflow_name',
      'workflow_title',
    ]);
  });

  it('enforces CHECK constraints (status enum + monotonic step bounds)', () => {
    const insert = (overrides: Record<string, unknown>) => {
      const row = {
        id: 'ws-1',
        workflow_name: 'launch-funnel',
        workflow_title: 'Launch Funnel',
        conversation_id: 'conv-1',
        current_step: 1,
        total_steps: 5,
        steps_json: '[]',
        skills_json: '[]',
        asks_json: '[]',
        status: 'active',
        palette: 'cobalt',
        category: 'launch',
        created_at: 1_700_000_000_000,
        updated_at: 1_700_000_000_000,
        completed_at: null,
        ...overrides,
      };
      driver
        .prepare(
          `INSERT INTO workflow_sessions
           (id, workflow_name, workflow_title, conversation_id, current_step, total_steps,
            steps_json, skills_json, asks_json, status, palette, category,
            created_at, updated_at, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          row.id,
          row.workflow_name,
          row.workflow_title,
          row.conversation_id,
          row.current_step,
          row.total_steps,
          row.steps_json,
          row.skills_json,
          row.asks_json,
          row.status,
          row.palette,
          row.category,
          row.created_at,
          row.updated_at,
          row.completed_at
        );
    };

    expect(() => insert({})).not.toThrow();
    expect(() => insert({ id: 'ws-bad-status', status: 'paused' })).toThrow(/CHECK constraint/i);
    expect(() => insert({ id: 'ws-bad-step', current_step: -1 })).toThrow(/CHECK constraint/i);
    expect(() => insert({ id: 'ws-bad-total', total_steps: -1 })).toThrow(/CHECK constraint/i);
    expect(() => insert({ id: 'ws-overshoot', current_step: 7, total_steps: 5 })).toThrow(/CHECK constraint/i);
    expect(() =>
      insert({ id: 'ws-just-done', current_step: 6, total_steps: 5, status: 'complete' })
    ).not.toThrow();
  });

  it('creates all three workflow_sessions indexes', () => {
    const indexes = driver.pragma('index_list(workflow_sessions)') as Array<{ name: string }>;
    const idxNames = indexes.map((i) => i.name);
    expect(idxNames).toContain('idx_workflow_sessions_workflow_name_active');
    expect(idxNames).toContain('idx_workflow_sessions_conversation');
    expect(idxNames).toContain('idx_workflow_sessions_active_recency');
  });

  it('is idempotent - re-running migration_v41.up does not throw', () => {
    expect(() => migration_v41!.up(driver)).not.toThrow();
    const cols = driver.pragma('table_info(workflow_sessions)') as Array<{ name: string }>;
    expect(cols.length).toBeGreaterThan(0);
  });
});
