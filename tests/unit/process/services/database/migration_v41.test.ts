/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, expect, it } from 'vitest';
import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { ALL_MIGRATIONS, runMigrations } from '@process/services/database/migrations';
import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { describeNativeSqlite } from '../../../helpers/nativeSqlite';

describeNativeSqlite('Migration v41 - workflow_sessions table', () => {
  let driver: BetterSqlite3Driver;

  beforeEach(() => {
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
    runMigrations(driver, 0, CURRENT_DB_VERSION);
  });

  afterEach(() => driver.close());

  it('bumps CURRENT_DB_VERSION to 41 or higher', () => {
    expect(CURRENT_DB_VERSION).toBeGreaterThanOrEqual(41);
  });

  it('creates the workflow_sessions table with all required columns', () => {
    const cols = driver.pragma('table_info(workflow_sessions)') as Array<{ name: string }>;
    const colNames = cols.map((c) => c.name);
    // beforeEach runs the FULL chain (0 -> CURRENT_DB_VERSION), so later
    // migrations also touch this table (v42 adds begin_sent_at). Assert v41's
    // columns are all PRESENT rather than an exact set, so this stays correct
    // as future migrations extend the table.
    expect(colNames).toEqual(
      expect.arrayContaining([
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
      ])
    );
  });

  it('enforces CHECK constraints (status enum + monotonic step bounds)', () => {
    const baseInsert = (overrides: Record<string, unknown>) => {
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

    // Baseline valid row inserts cleanly.
    expect(() => baseInsert({})).not.toThrow();

    // Bad status enum rejected.
    expect(() => baseInsert({ id: 'ws-bad-status', status: 'paused' })).toThrow(/CHECK constraint/i);

    // Negative current_step rejected.
    expect(() => baseInsert({ id: 'ws-bad-step', current_step: -1 })).toThrow(/CHECK constraint/i);

    // Negative total_steps rejected.
    expect(() => baseInsert({ id: 'ws-bad-total', total_steps: -1 })).toThrow(/CHECK constraint/i);

    // current_step > total_steps + 1 rejected.
    expect(() => baseInsert({ id: 'ws-overshoot', current_step: 7, total_steps: 5 })).toThrow(/CHECK constraint/i);

    // current_step === total_steps + 1 is the legal "just completed" boundary.
    expect(() => baseInsert({ id: 'ws-just-done', current_step: 6, total_steps: 5, status: 'complete' })).not.toThrow();
  });

  it('creates all three workflow_sessions indexes', () => {
    const indexes = driver.pragma('index_list(workflow_sessions)') as Array<{ name: string }>;
    const idxNames = indexes.map((i) => i.name);
    expect(idxNames).toContain('idx_workflow_sessions_workflow_name_active');
    expect(idxNames).toContain('idx_workflow_sessions_conversation');
    expect(idxNames).toContain('idx_workflow_sessions_active_recency');
  });

  it('is idempotent - re-running the workflow_sessions migrations does not throw', () => {
    // beforeEach already ran the full chain. Re-running v41 (CREATE TABLE/INDEX
    // IF NOT EXISTS) and v42 (guarded ADD COLUMN) again must be a no-op. Scope
    // to these two migrations rather than re-running the whole chain from 0:
    // older migrations (e.g. v8's unguarded ADD COLUMN source) predate the
    // idempotency convention and are out of scope for this file. Production
    // never re-runs a migration anyway - runMigrations is gated by the stored
    // user_version (see getMigrationsToRun).
    const v41 = ALL_MIGRATIONS.find((m) => m.version === 41);
    const v42 = ALL_MIGRATIONS.find((m) => m.version === 42);
    expect(v41).toBeDefined();
    expect(v42).toBeDefined();
    expect(() => {
      v41!.up(driver);
      v42!.up(driver);
    }).not.toThrow();
    const cols = driver.pragma('table_info(workflow_sessions)') as Array<{ name: string }>;
    expect(cols.length).toBeGreaterThan(0);
  });
});
