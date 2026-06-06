/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, expect, it } from 'vitest';
import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { runMigrations } from '@process/services/database/migrations';
import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { SqliteUsageEventRepository } from '@process/services/usage/SqliteUsageEventRepository';
import type { UsageEvent } from '@process/services/usage/types';
import { describeNativeSqlite } from '../../../helpers/nativeSqlite';

describeNativeSqlite('SqliteUsageEventRepository', () => {
  let driver: BetterSqlite3Driver;
  let repo: SqliteUsageEventRepository;

  beforeEach(() => {
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
    runMigrations(driver, 0, CURRENT_DB_VERSION);
    repo = new SqliteUsageEventRepository(driver);
  });
  afterEach(() => driver.close());

  it('persists and reads back an event', async () => {
    const event: UsageEvent = {
      id: 'evt-1',
      timestampMs: 1_700_000_000_000,
      eventType: 'launchpad.card_clicked',
      anchorId: 'cowork',
      assistantId: 'builtin-cowork',
      cliBackend: 'claude',
      metadata: { source: 'guid' },
    };
    await repo.append(event);
    const since = await repo.findSince(0);
    expect(since).toHaveLength(1);
    expect(since[0]).toMatchObject({ id: 'evt-1', eventType: 'launchpad.card_clicked', anchorId: 'cowork' });
    expect(since[0].metadata).toEqual({ source: 'guid' });
  });

  it('findSince filters by timestamp', async () => {
    await repo.append({ id: 'a', timestampMs: 100, eventType: 'launchpad.card_clicked' });
    await repo.append({ id: 'b', timestampMs: 200, eventType: 'launchpad.card_clicked' });
    const since = await repo.findSince(150);
    expect(since.map((e) => e.id)).toEqual(['b']);
  });

  it('findByType filters by event_type AND timestamp', async () => {
    await repo.append({ id: 'a', timestampMs: 100, eventType: 'launchpad.card_clicked' });
    await repo.append({ id: 'b', timestampMs: 200, eventType: 'guid.message_sent' });
    expect((await repo.findByType('launchpad.card_clicked', 0)).map((e) => e.id)).toEqual(['a']);
  });

  it('returns undefined metadata when stored row has null metadata_json', async () => {
    await repo.append({ id: 'a', timestampMs: 100, eventType: 'guid.message_sent' });
    const [evt] = await repo.findSince(0);
    expect(evt.metadata).toBeUndefined();
  });

  it('prune removes events older than the cutoff and returns the deleted count (MED-4)', async () => {
    await repo.append({ id: 'old1', timestampMs: 100, eventType: 'launchpad.card_clicked' });
    await repo.append({ id: 'old2', timestampMs: 200, eventType: 'launchpad.card_clicked' });
    await repo.append({ id: 'keep1', timestampMs: 500, eventType: 'launchpad.card_clicked' });
    await repo.append({ id: 'keep2', timestampMs: 1_000, eventType: 'launchpad.card_clicked' });

    const removed = await repo.prune(500);

    expect(removed).toBe(2);
    const remaining = await repo.findSince(0);
    expect(remaining.map((e) => e.id).sort()).toEqual(['keep1', 'keep2']);
  });

  it('prune returns 0 when no events are old enough', async () => {
    await repo.append({ id: 'a', timestampMs: 1_000, eventType: 'launchpad.card_clicked' });
    expect(await repo.prune(500)).toBe(0);
    expect((await repo.findSince(0)).map((e) => e.id)).toEqual(['a']);
  });
});
