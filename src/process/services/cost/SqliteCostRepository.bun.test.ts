// src/process/services/cost/SqliteCostRepository.bun.test.ts
// Run with: bun test src/process/services/cost/SqliteCostRepository.bun.test.ts
//
// Verifies the cost repository surface WS-D builds on: insert + aggregate
// (byModel/byBackend) + series bucketing + total, and prune (deletes only rows
// older than the cutoff and returns the count). Uses bun:sqlite.

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BunSqliteDriver } from '@process/services/database/drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from '@process/services/database/migrations';
import { SqliteCostRepository } from './SqliteCostRepository';
import type { CostEventInput } from './types';

const migration_v48 = ALL_MIGRATIONS.find((m) => m.version === 48) as IMigration;

function event(overrides: Partial<CostEventInput>): CostEventInput {
  return {
    conversationId: 'c1',
    backend: 'claude',
    modelId: 'opus-4',
    costUsd: 0.1,
    tokensTotal: 100,
    costSource: 'engine',
    createdAt: 1000,
    ...overrides,
  };
}

describe('SqliteCostRepository (bun:sqlite)', () => {
  let driver: BunSqliteDriver;
  let repo: SqliteCostRepository;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    migration_v48.up(driver);
    repo = new SqliteCostRepository(driver);
  });

  afterEach(() => driver.close());

  it('insert returns the assigned autoincrement id', () => {
    const id1 = repo.insert(event({}));
    const id2 = repo.insert(event({}));
    expect(id1).toBe(1);
    expect(id2).toBe(2);
  });

  it('aggregate groups by model within the window, ordered by cost desc', () => {
    repo.insert(event({ modelId: 'opus-4', costUsd: 0.5, tokensTotal: 500, createdAt: 1000 }));
    repo.insert(event({ modelId: 'opus-4', costUsd: 0.2, tokensTotal: 200, createdAt: 1100 }));
    repo.insert(event({ modelId: 'haiku', costUsd: 0.3, tokensTotal: 300, createdAt: 1200 }));

    const byModel = repo.aggregate('model_id', { fromMs: 0, toMs: 2000 });
    expect(byModel.length).toBe(2);
    expect(byModel[0].key).toBe('opus-4');
    expect(byModel[0].costUsd).toBeCloseTo(0.7, 6);
    expect(byModel[0].tokensTotal).toBe(700);
    expect(byModel[0].events).toBe(2);
    expect(byModel[1].key).toBe('haiku');
  });

  it('aggregate by backend collapses a null group to the empty-string key', () => {
    repo.insert(event({ backend: 'fuigo', modelId: undefined, costUsd: 0.4, createdAt: 1000 }));
    const byModel = repo.aggregate('model_id', { fromMs: 0, toMs: 2000 });
    expect(byModel[0].key).toBe('');
  });

  it('aggregate respects the window bounds (inclusive from, exclusive to)', () => {
    repo.insert(event({ costUsd: 0.1, createdAt: 1000 }));
    repo.insert(event({ costUsd: 0.2, createdAt: 2000 }));
    const agg = repo.aggregate('backend', { fromMs: 1000, toMs: 2000 });
    expect(agg.length).toBe(1);
    expect(agg[0].costUsd).toBeCloseTo(0.1, 6);
  });

  it('series buckets cost by fixed width aligned to the window start', () => {
    // bucket = 100ms starting at fromMs=1000
    repo.insert(event({ costUsd: 0.1, createdAt: 1000 }));
    repo.insert(event({ costUsd: 0.2, createdAt: 1050 })); // same bucket [1000,1100)
    repo.insert(event({ costUsd: 0.3, createdAt: 1150 })); // bucket [1100,1200)

    const series = repo.series({ fromMs: 1000, toMs: 1200 }, 100);
    expect(series.length).toBe(2);
    expect(series[0].bucketStart).toBe(1000);
    expect(series[0].costUsd).toBeCloseTo(0.3, 6);
    expect(series[0].events).toBe(2);
    expect(series[1].bucketStart).toBe(1100);
    expect(series[1].costUsd).toBeCloseTo(0.3, 6);
  });

  it('series rejects a non-positive bucket', () => {
    expect(() => repo.series({ fromMs: 0, toMs: 1 }, 0)).toThrow();
  });

  it('total sums cost + tokens + count within the window', () => {
    repo.insert(event({ costUsd: 0.1, tokensTotal: 100, createdAt: 1000 }));
    repo.insert(event({ costUsd: 0.2, tokensTotal: 200, createdAt: 1100 }));
    const t = repo.total({ fromMs: 0, toMs: 2000 });
    expect(t.costUsd).toBeCloseTo(0.3, 6);
    expect(t.tokensTotal).toBe(300);
    expect(t.events).toBe(2);
  });

  it('prune deletes only rows older than the cutoff and returns the count', () => {
    repo.insert(event({ createdAt: 100 }));
    repo.insert(event({ createdAt: 200 }));
    repo.insert(event({ createdAt: 500 }));

    const removed = repo.prune(300); // delete created_at < 300
    expect(removed).toBe(2);

    const remaining = repo.total({ fromMs: 0, toMs: 10_000 });
    expect(remaining.events).toBe(1);
  });

  it('prune returns 0 when nothing is old enough', () => {
    repo.insert(event({ createdAt: 1000 }));
    expect(repo.prune(500)).toBe(0);
  });
});
