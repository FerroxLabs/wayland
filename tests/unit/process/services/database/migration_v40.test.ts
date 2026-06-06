/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, expect, it } from 'vitest';
import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { runMigrations } from '@process/services/database/migrations';
import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { describeNativeSqlite } from '../../../helpers/nativeSqlite';

describeNativeSqlite('Migration v40 - usage_events table', () => {
  let driver: BetterSqlite3Driver;
  beforeEach(() => {
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
    runMigrations(driver, 0, CURRENT_DB_VERSION);
  });
  afterEach(() => driver.close());

  it('bumps CURRENT_DB_VERSION to 40 or higher', () => {
    expect(CURRENT_DB_VERSION).toBeGreaterThanOrEqual(40);
  });

  it('creates the usage_events table with all required columns', () => {
    const cols = driver.pragma('table_info(usage_events)') as Array<{ name: string }>;
    const colNames = cols.map((c) => c.name).sort();
    expect(colNames).toEqual([
      'anchor_id',
      'assistant_id',
      'cli_backend',
      'event_type',
      'id',
      'metadata_json',
      'timestamp_ms',
    ]);
  });

  it('round-trips a usage event row', () => {
    driver
      .prepare(
        `INSERT INTO usage_events (id, timestamp_ms, event_type, anchor_id, assistant_id, cli_backend, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run('evt-1', 1_700_000_000_000, 'launchpad.card_clicked', 'cowork', 'builtin-cowork', 'claude', '{}');
    const row = driver.prepare('SELECT * FROM usage_events WHERE id = ?').get('evt-1') as Record<string, unknown>;
    expect(row.event_type).toBe('launchpad.card_clicked');
    expect(row.anchor_id).toBe('cowork');
  });

  it('indexes timestamp_ms', () => {
    const indexes = driver.pragma('index_list(usage_events)') as Array<{ name: string }>;
    expect(indexes.some((i) => i.name.includes('timestamp'))).toBe(true);
  });
});
