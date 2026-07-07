// src/process/services/cost/CostRecorder.bun.test.ts
// Run with: bun test src/process/services/cost/CostRecorder.bun.test.ts
//
// Verifies the R1 delta logic of CostRecorder against a real SqliteCostRepository
// over bun:sqlite: the engine path produces correct per-turn deltas across a
// cumulative sequence and clamps a reset-to-lower to 0; the computed path prices
// via a stub ModelPricing and downgrades to 'unknown' when pricing is undefined;
// the unknown path records tokens with cost 0; resetBaseline restarts at zero.

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BunSqliteDriver } from '@process/services/database/drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from '@process/services/database/migrations';
import { SqliteCostRepository } from './SqliteCostRepository';
import { CostRecorder, type ModelPricing } from './CostRecorder';

const migration_v48 = ALL_MIGRATIONS.find((m) => m.version === 48) as IMigration;

type StoredRow = {
  conversation_id: string;
  backend: string;
  model_id: string | null;
  cost_usd: number;
  tokens_total: number;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_source: string;
};

function makeRecorder(
  driver: BunSqliteDriver,
  pricing: ModelPricing
): {
  recorder: CostRecorder;
  repo: SqliteCostRepository;
} {
  const repo = new SqliteCostRepository(driver);
  return { recorder: new CostRecorder(repo, pricing), repo };
}

function allRows(driver: BunSqliteDriver): StoredRow[] {
  return driver.prepare('SELECT * FROM cost_events ORDER BY id ASC').all() as StoredRow[];
}

const noPricing: ModelPricing = { priceTokens: () => undefined };

describe('CostRecorder (bun:sqlite)', () => {
  let driver: BunSqliteDriver;

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    migration_v48.up(driver);
  });

  afterEach(() => driver.close());

  it('engine path records per-turn deltas across a cumulative sequence', () => {
    const { recorder } = makeRecorder(driver, noPricing);
    // Cumulative high-water marks reported at each turn finish.
    recorder.recordTurnFinish({
      conversationId: 'c1',
      backend: 'claude',
      costSource: 'engine',
      cumulativeUsd: 0.1,
      cumulativeTokens: 1000,
      ts: 1,
    });
    recorder.recordTurnFinish({
      conversationId: 'c1',
      backend: 'claude',
      costSource: 'engine',
      cumulativeUsd: 0.3,
      cumulativeTokens: 2500,
      ts: 2,
    });
    recorder.recordTurnFinish({
      conversationId: 'c1',
      backend: 'claude',
      costSource: 'engine',
      cumulativeUsd: 0.35,
      cumulativeTokens: 2700,
      ts: 3,
    });

    const rows = allRows(driver);
    expect(rows[0].cost_usd).toBeCloseTo(0.1, 6);
    expect(rows[1].cost_usd).toBeCloseTo(0.2, 6);
    expect(rows[2].cost_usd).toBeCloseTo(0.05, 6);
    expect(rows.map((r) => r.tokens_total)).toEqual([1000, 1500, 200]);
    expect(rows.every((r) => r.cost_source === 'engine')).toBe(true);
  });

  it('engine path clamps a reset-to-lower cumulative to a 0 delta', () => {
    const { recorder } = makeRecorder(driver, noPricing);
    recorder.recordTurnFinish({
      conversationId: 'c1',
      backend: 'claude',
      costSource: 'engine',
      cumulativeUsd: 0.5,
      cumulativeTokens: 5000,
      ts: 1,
    });
    // Session reset/compaction drops the gauge below the prior high-water mark.
    recorder.recordTurnFinish({
      conversationId: 'c1',
      backend: 'claude',
      costSource: 'engine',
      cumulativeUsd: 0.2,
      cumulativeTokens: 1000,
      ts: 2,
    });
    // Next genuine growth resumes from the retained high-water mark, not the dip.
    recorder.recordTurnFinish({
      conversationId: 'c1',
      backend: 'claude',
      costSource: 'engine',
      cumulativeUsd: 0.6,
      cumulativeTokens: 5200,
      ts: 3,
    });

    const rows = allRows(driver);
    expect(rows[0].cost_usd).toBeCloseTo(0.5, 6);
    expect(rows[1].cost_usd).toBe(0);
    expect(rows[1].tokens_total).toBe(0);
    expect(rows[2].cost_usd).toBeCloseTo(0.1, 6); // 0.6 - retained 0.5
    expect(rows[2].tokens_total).toBe(200); // 5200 - retained 5000
  });

  it('keeps independent baselines per conversation', () => {
    const { recorder } = makeRecorder(driver, noPricing);
    recorder.recordTurnFinish({ conversationId: 'a', backend: 'x', costSource: 'engine', cumulativeUsd: 1, ts: 1 });
    recorder.recordTurnFinish({ conversationId: 'b', backend: 'x', costSource: 'engine', cumulativeUsd: 2, ts: 2 });
    recorder.recordTurnFinish({ conversationId: 'a', backend: 'x', costSource: 'engine', cumulativeUsd: 1.5, ts: 3 });

    const rows = allRows(driver);
    expect(rows[0].cost_usd).toBeCloseTo(1, 6);
    expect(rows[1].cost_usd).toBeCloseTo(2, 6);
    expect(rows[2].cost_usd).toBeCloseTo(0.5, 6);
  });

  it('resetBaseline restarts the conversation delta at zero', () => {
    const { recorder } = makeRecorder(driver, noPricing);
    recorder.recordTurnFinish({ conversationId: 'c', backend: 'x', costSource: 'engine', cumulativeUsd: 0.4, ts: 1 });
    recorder.resetBaseline('c');
    recorder.recordTurnFinish({ conversationId: 'c', backend: 'x', costSource: 'engine', cumulativeUsd: 0.1, ts: 2 });

    const rows = allRows(driver);
    expect(rows[1].cost_usd).toBeCloseTo(0.1, 6); // full new cumulative, baseline was cleared
  });

  it('computed path prices a per-turn split via ModelPricing (no baseline)', () => {
    const pricing: ModelPricing = {
      priceTokens: (modelId, t) => (modelId === 'm1' ? t.input * 0.000001 + t.output * 0.000002 : undefined),
    };
    const { recorder } = makeRecorder(driver, pricing);
    recorder.recordTurnFinish({
      conversationId: 'c',
      backend: 'wcore',
      modelId: 'm1',
      costSource: 'computed',
      inputTokens: 1000,
      outputTokens: 500,
      ts: 1,
    });

    const rows = allRows(driver);
    expect(rows[0].cost_source).toBe('computed');
    expect(rows[0].cost_usd).toBeCloseTo(0.001 + 0.001, 9);
    expect(rows[0].tokens_total).toBe(1500);
    expect(rows[0].input_tokens).toBe(1000);
    expect(rows[0].output_tokens).toBe(500);
  });

  it('computed path downgrades to unknown / cost 0 when pricing is undefined', () => {
    const { recorder } = makeRecorder(driver, noPricing);
    recorder.recordTurnFinish({
      conversationId: 'c',
      backend: 'wcore',
      modelId: 'mystery-model',
      costSource: 'computed',
      inputTokens: 200,
      outputTokens: 100,
      ts: 1,
    });

    const rows = allRows(driver);
    expect(rows[0].cost_source).toBe('unknown');
    expect(rows[0].cost_usd).toBe(0);
    expect(rows[0].tokens_total).toBe(300); // tokens still recorded
  });

  it('unknown path records cost 0 and any tokens present', () => {
    const { recorder } = makeRecorder(driver, noPricing);
    recorder.recordTurnFinish({
      conversationId: 'c',
      backend: 'remote',
      costSource: 'unknown',
      inputTokens: 50,
      outputTokens: 25,
      ts: 1,
    });

    const rows = allRows(driver);
    expect(rows[0].cost_source).toBe('unknown');
    expect(rows[0].cost_usd).toBe(0);
    expect(rows[0].tokens_total).toBe(75);
  });

  it('writes exactly one row per recordTurnFinish call', () => {
    const { recorder } = makeRecorder(driver, noPricing);
    recorder.recordTurnFinish({ conversationId: 'c', backend: 'x', costSource: 'engine', cumulativeUsd: 1, ts: 1 });
    recorder.recordTurnFinish({ conversationId: 'c', backend: 'x', costSource: 'unknown', ts: 2 });
    expect(allRows(driver).length).toBe(2);
  });
});
