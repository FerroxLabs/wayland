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

// Inserts a workflow_sessions row using the v49-era column set (v41 columns plus
// begin_sent_at from v42), i.e. WITHOUT run_mode / interactivity. Used to prove
// the v50 migration backfills pre-existing rows to the NOT NULL defaults.
const insertV49Row = (driver: BetterSqlite3Driver, id: string): void => {
  driver
    .prepare(
      `INSERT INTO workflow_sessions
       (id, workflow_name, workflow_title, conversation_id, current_step, total_steps,
        steps_json, skills_json, asks_json, status, palette, category,
        created_at, updated_at, completed_at, begin_sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, 'demo', 'Demo', 'conv-1', 1, 2, '[]', '[]', '[]', 'active', 'amber', 'build', 1, 1, null, null);
};

describeNativeSqlite('Migration v50 - run_mode + interactivity', () => {
  let driver: BetterSqlite3Driver;

  beforeEach(() => {
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
  });

  afterEach(() => driver.close());

  it('bumps CURRENT_DB_VERSION to 50 or higher', () => {
    expect(CURRENT_DB_VERSION).toBeGreaterThanOrEqual(50);
  });

  it('adds run_mode and interactivity columns to workflow_sessions', () => {
    runMigrations(driver, 0, CURRENT_DB_VERSION);
    const cols = driver.pragma('table_info(workflow_sessions)') as Array<{ name: string }>;
    const colNames = cols.map((c) => c.name);
    expect(colNames).toEqual(expect.arrayContaining(['run_mode', 'interactivity']));
  });

  it('backfills pre-existing rows to the NOT NULL defaults (running / step)', () => {
    // Build the table at the v49 shape, insert a legacy row, THEN apply v50.
    runMigrations(driver, 0, 49);
    insertV49Row(driver, 'legacy-1');
    runMigrations(driver, 49, 50);
    const row = driver
      .prepare('SELECT run_mode, interactivity FROM workflow_sessions WHERE id = ?')
      .get('legacy-1') as { run_mode: string; interactivity: string };
    expect(row.run_mode).toBe('running');
    expect(row.interactivity).toBe('step');
  });

  it('down migration removes run_mode + interactivity but preserves begin_sent_at and data', () => {
    runMigrations(driver, 0, CURRENT_DB_VERSION);
    const beginTs = 1_700_000_555_000;
    driver
      .prepare(
        `INSERT INTO workflow_sessions
         (id, workflow_name, workflow_title, conversation_id, current_step, total_steps,
          steps_json, skills_json, asks_json, status, palette, category,
          created_at, updated_at, completed_at, begin_sent_at, run_mode, interactivity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run('keep-1', 'demo', 'Demo', 'conv-1', 1, 2, '[]', '[]', '[]', 'active', 'amber', 'build', 1, 1, null, beginTs, 'paused', 'auto');

    const v50 = ALL_MIGRATIONS.find((m) => m.version === 50);
    expect(v50).toBeDefined();
    v50!.down(driver);

    const cols = (driver.pragma('table_info(workflow_sessions)') as Array<{ name: string }>).map((c) => c.name);
    expect(cols).not.toContain('run_mode');
    expect(cols).not.toContain('interactivity');
    expect(cols).toContain('begin_sent_at');

    const row = driver
      .prepare('SELECT id, begin_sent_at FROM workflow_sessions WHERE id = ?')
      .get('keep-1') as { id: string; begin_sent_at: number };
    expect(row.id).toBe('keep-1');
    expect(row.begin_sent_at).toBe(beginTs);
  });

  it('is idempotent - re-running v50.up does not throw', () => {
    runMigrations(driver, 0, CURRENT_DB_VERSION);
    const v50 = ALL_MIGRATIONS.find((m) => m.version === 50);
    expect(v50).toBeDefined();
    expect(() => v50!.up(driver)).not.toThrow();
    const cols = (driver.pragma('table_info(workflow_sessions)') as Array<{ name: string }>).map((c) => c.name);
    expect(cols).toEqual(expect.arrayContaining(['run_mode', 'interactivity']));
  });
});
