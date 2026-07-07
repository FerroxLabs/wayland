// src/process/services/cost/BudgetController.bun.test.ts
// Run with: bun test src/process/services/cost/BudgetController.bun.test.ts
//
// Verifies the budget enforcement surface Stage 2 / the recording path build on:
// CRUD + current-period spend (scoped by global/model/backend/team), over-limit
// evaluation split by action, the opt-in pause gate (canStartTurn), and the
// one-time warn alert emitted post-turn (checkAfterTurn). Uses bun:sqlite with
// both cost migrations applied and a fixed clock for deterministic periods.

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { BunSqliteDriver } from '@process/services/database/drivers/BunSqliteDriver';
import { ALL_MIGRATIONS, type IMigration } from '@process/services/database/migrations';
import { CostAnalyticsService } from './CostAnalyticsService';
import { SqliteCostRepository } from './SqliteCostRepository';
import { SqliteBudgetRepository } from './SqliteBudgetRepository';
import { BudgetController, periodStart } from './BudgetController';
import type { BudgetAlert, CostEventInput } from './types';

const migration_v48 = ALL_MIGRATIONS.find((m) => m.version === 48) as IMigration;
const migration_v49 = ALL_MIGRATIONS.find((m) => m.version === 49) as IMigration;

// A fixed "now": 2026-06-09T12:00:00 local time.
const NOW = new Date(2026, 5, 9, 12, 0, 0, 0).getTime();

function costEvent(overrides: Partial<CostEventInput>): CostEventInput {
  return {
    conversationId: 'c1',
    backend: 'claude',
    modelId: 'opus-4',
    costUsd: 1,
    tokensTotal: 100,
    costSource: 'computed',
    createdAt: NOW,
    ...overrides,
  };
}

describe('BudgetController (bun:sqlite)', () => {
  let driver: BunSqliteDriver;
  let costRepo: SqliteCostRepository;
  let controller: BudgetController;
  let alerts: BudgetAlert[];

  beforeEach(() => {
    driver = new BunSqliteDriver(':memory:');
    migration_v48.up(driver);
    migration_v49.up(driver);
    costRepo = new SqliteCostRepository(driver);
    const analytics = new CostAnalyticsService(driver);
    const budgetRepo = new SqliteBudgetRepository(driver);
    alerts = [];
    controller = new BudgetController(
      budgetRepo,
      analytics,
      (a) => alerts.push(a),
      () => NOW
    );
  });

  afterEach(() => driver.close());

  describe('periodStart', () => {
    it('day = local midnight', () => {
      expect(periodStart('day', NOW)).toBe(new Date(2026, 5, 9, 0, 0, 0, 0).getTime());
    });
    it('week = midnight on the most recent Monday', () => {
      // 2026-06-09 is a Tuesday => Monday is 2026-06-08.
      expect(periodStart('week', NOW)).toBe(new Date(2026, 5, 8, 0, 0, 0, 0).getTime());
    });
    it('month = midnight on the 1st', () => {
      expect(periodStart('month', NOW)).toBe(new Date(2026, 5, 1, 0, 0, 0, 0).getTime());
    });
  });

  describe('upsert / list / remove', () => {
    it('creates a budget with generated id and timestamps', () => {
      const b = controller.upsert({ scope: 'global', limitUsd: 50, period: 'month', action: 'warn' });
      expect(b.id).toBeTruthy();
      expect(b.createdAt).toBe(NOW);
      expect(b.updatedAt).toBe(NOW);
      expect(b.scopeKey).toBeUndefined();
    });

    it('drops scopeKey for global scope', () => {
      const b = controller.upsert({
        scope: 'global',
        scopeKey: 'ignored',
        limitUsd: 10,
        period: 'day',
        action: 'warn',
      });
      expect(b.scopeKey).toBeUndefined();
    });

    it('updates in place and preserves createdAt', () => {
      const created = controller.upsert({
        scope: 'model',
        scopeKey: 'opus-4',
        limitUsd: 10,
        period: 'day',
        action: 'warn',
      });
      const updated = controller.upsert({
        id: created.id,
        scope: 'model',
        scopeKey: 'opus-4',
        limitUsd: 99,
        period: 'day',
        action: 'pause',
      });
      expect(updated.id).toBe(created.id);
      expect(updated.createdAt).toBe(created.createdAt);
      expect(updated.limitUsd).toBe(99);
      expect(updated.action).toBe('pause');
      expect(controller.listStatus().length).toBe(1);
    });

    it('remove deletes the budget', () => {
      const b = controller.upsert({ scope: 'global', limitUsd: 10, period: 'day', action: 'warn' });
      controller.remove(b.id);
      expect(controller.listStatus().length).toBe(0);
    });
  });

  describe('listStatus current-period spend', () => {
    it('global budget sums all spend in the period', () => {
      costRepo.insert(costEvent({ costUsd: 3 }));
      costRepo.insert(costEvent({ costUsd: 4, modelId: 'haiku' }));
      controller.upsert({ scope: 'global', limitUsd: 50, period: 'month', action: 'warn' });
      const status = controller.listStatus();
      expect(status[0].spentUsd).toBeCloseTo(7, 6);
      expect(status[0].periodStartMs).toBe(periodStart('month', NOW));
    });

    it('model budget sums only the matching model', () => {
      costRepo.insert(costEvent({ costUsd: 3, modelId: 'opus-4' }));
      costRepo.insert(costEvent({ costUsd: 9, modelId: 'haiku' }));
      controller.upsert({ scope: 'model', scopeKey: 'opus-4', limitUsd: 50, period: 'month', action: 'warn' });
      expect(controller.listStatus()[0].spentUsd).toBeCloseTo(3, 6);
    });

    it('backend budget sums only the matching backend', () => {
      costRepo.insert(costEvent({ costUsd: 2, backend: 'wcore' }));
      costRepo.insert(costEvent({ costUsd: 5, backend: 'claude' }));
      controller.upsert({ scope: 'backend', scopeKey: 'wcore', limitUsd: 50, period: 'month', action: 'warn' });
      expect(controller.listStatus()[0].spentUsd).toBeCloseTo(2, 6);
    });

    it('excludes spend from before the period start', () => {
      const lastMonth = new Date(2026, 4, 15, 12, 0, 0, 0).getTime();
      costRepo.insert(costEvent({ costUsd: 100, createdAt: lastMonth }));
      costRepo.insert(costEvent({ costUsd: 4, createdAt: NOW }));
      controller.upsert({ scope: 'global', limitUsd: 50, period: 'month', action: 'warn' });
      expect(controller.listStatus()[0].spentUsd).toBeCloseTo(4, 6);
    });
  });

  describe('evaluate', () => {
    it('splits over-limit budgets by action', () => {
      costRepo.insert(costEvent({ costUsd: 60, modelId: 'opus-4' }));
      controller.upsert({ scope: 'global', limitUsd: 50, period: 'month', action: 'warn' });
      controller.upsert({ scope: 'model', scopeKey: 'opus-4', limitUsd: 10, period: 'month', action: 'pause' });
      const { warn, pause } = controller.evaluate();
      expect(warn.length).toBe(1);
      expect(pause.length).toBe(1);
      expect(pause[0].budget.scopeKey).toBe('opus-4');
    });

    it('does not flag budgets under their limit', () => {
      costRepo.insert(costEvent({ costUsd: 5 }));
      controller.upsert({ scope: 'global', limitUsd: 50, period: 'month', action: 'warn' });
      const { warn, pause } = controller.evaluate();
      expect(warn.length).toBe(0);
      expect(pause.length).toBe(0);
    });

    it('treats spend exactly at the limit as a breach', () => {
      costRepo.insert(costEvent({ costUsd: 50 }));
      controller.upsert({ scope: 'global', limitUsd: 50, period: 'month', action: 'warn' });
      expect(controller.evaluate().warn.length).toBe(1);
    });
  });

  describe('canStartTurn (opt-in pause gate)', () => {
    it('allows by default when no pause budget is over limit', () => {
      controller.upsert({ scope: 'global', limitUsd: 50, period: 'month', action: 'pause' });
      costRepo.insert(costEvent({ costUsd: 5 }));
      expect(controller.canStartTurn({ modelId: 'opus-4', backend: 'claude' }).allowed).toBe(true);
    });

    it('blocks when a matching pause budget is over limit', () => {
      controller.upsert({ scope: 'model', scopeKey: 'opus-4', limitUsd: 10, period: 'month', action: 'pause' });
      costRepo.insert(costEvent({ costUsd: 12, modelId: 'opus-4' }));
      const res = controller.canStartTurn({ modelId: 'opus-4', backend: 'claude' });
      expect(res.allowed).toBe(false);
      expect(res.budget?.scopeKey).toBe('opus-4');
      expect(res.spentUsd).toBeCloseTo(12, 6);
    });

    it('ignores warn budgets (never blocks)', () => {
      controller.upsert({ scope: 'global', limitUsd: 10, period: 'month', action: 'warn' });
      costRepo.insert(costEvent({ costUsd: 999 }));
      expect(controller.canStartTurn({ modelId: 'opus-4', backend: 'claude' }).allowed).toBe(true);
    });

    it('does not block a turn whose scope does not match the pause budget', () => {
      controller.upsert({ scope: 'model', scopeKey: 'opus-4', limitUsd: 1, period: 'month', action: 'pause' });
      costRepo.insert(costEvent({ costUsd: 99, modelId: 'opus-4' }));
      expect(controller.canStartTurn({ modelId: 'haiku', backend: 'claude' }).allowed).toBe(true);
    });
  });

  describe('checkAfterTurn (warn enforcement)', () => {
    it('emits a one-time alert when a warn budget goes over', () => {
      controller.upsert({ scope: 'global', limitUsd: 10, period: 'month', action: 'warn' });
      costRepo.insert(costEvent({ costUsd: 12 }));
      controller.checkAfterTurn({ modelId: 'opus-4', backend: 'claude' });
      controller.checkAfterTurn({ modelId: 'opus-4', backend: 'claude' });
      expect(alerts.length).toBe(1);
      expect(alerts[0].limitUsd).toBe(10);
      expect(alerts[0].spentUsd).toBeCloseTo(12, 6);
    });

    it('does not emit when under the limit', () => {
      controller.upsert({ scope: 'global', limitUsd: 50, period: 'month', action: 'warn' });
      costRepo.insert(costEvent({ costUsd: 5 }));
      controller.checkAfterTurn({ modelId: 'opus-4', backend: 'claude' });
      expect(alerts.length).toBe(0);
    });

    it('does not emit for pause budgets (handled by canStartTurn)', () => {
      controller.upsert({ scope: 'global', limitUsd: 10, period: 'month', action: 'pause' });
      costRepo.insert(costEvent({ costUsd: 12 }));
      controller.checkAfterTurn({ modelId: 'opus-4', backend: 'claude' });
      expect(alerts.length).toBe(0);
    });

    it('re-arms the alert after the budget is updated', () => {
      const b = controller.upsert({ scope: 'global', limitUsd: 10, period: 'month', action: 'warn' });
      costRepo.insert(costEvent({ costUsd: 12 }));
      controller.checkAfterTurn({ modelId: 'opus-4', backend: 'claude' });
      expect(alerts.length).toBe(1);
      controller.upsert({ id: b.id, scope: 'global', limitUsd: 11, period: 'month', action: 'warn' });
      controller.checkAfterTurn({ modelId: 'opus-4', backend: 'claude' });
      expect(alerts.length).toBe(2);
    });
  });
});
