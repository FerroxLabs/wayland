/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ISqliteDriver, IStatement } from '@process/services/database/drivers/ISqliteDriver';
import type { CostAggregate, CostEventInput, CostGroupBy, CostSeriesPoint, CostWindow, ICostRepository } from './types';

const GROUP_COLUMNS: Record<CostGroupBy, string> = {
  model_id: 'model_id',
  backend: 'backend',
  conversation_id: 'conversation_id',
  team_id: 'team_id',
};

/**
 * SQLite implementation of ICostRepository over the cost_events table
 * (migration_v48). All methods are synchronous (better-sqlite3 / bun:sqlite);
 * the caller obtains the driver via `getDatabase().getDriver()`. Mirrors the
 * Sqlite*Repository family in services/database and the prune contract of
 * SqliteUsageEventRepository.
 */
export class SqliteCostRepository implements ICostRepository {
  private readonly stmtInsert: IStatement;
  private readonly stmtTotal: IStatement;
  private readonly stmtPrune: IStatement;

  constructor(private readonly db: ISqliteDriver) {
    this.stmtInsert = db.prepare(`
      INSERT INTO cost_events (
        conversation_id, backend, model_id, cost_usd, tokens_total,
        input_tokens, output_tokens, cache_read_tokens, cost_source,
        cron_id, team_id, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.stmtTotal = db.prepare(`
      SELECT
        COALESCE(SUM(cost_usd), 0) AS cost_usd,
        COALESCE(SUM(tokens_total), 0) AS tokens_total,
        COUNT(*) AS events
      FROM cost_events
      WHERE created_at >= ? AND created_at < ?
    `);

    this.stmtPrune = db.prepare('DELETE FROM cost_events WHERE created_at < ?');
  }

  insert(event: CostEventInput): number {
    const result = this.stmtInsert.run(
      event.conversationId,
      event.backend,
      event.modelId ?? null,
      event.costUsd,
      event.tokensTotal,
      event.inputTokens ?? null,
      event.outputTokens ?? null,
      event.cacheReadTokens ?? null,
      event.costSource,
      event.cronId ?? null,
      event.teamId ?? null,
      event.createdAt
    );
    return Number(result.lastInsertRowid);
  }

  aggregate(groupBy: CostGroupBy, window: CostWindow): CostAggregate[] {
    const column = GROUP_COLUMNS[groupBy];
    const rows = this.db
      .prepare(`
        SELECT
          COALESCE(${column}, '') AS key,
          COALESCE(SUM(cost_usd), 0) AS cost_usd,
          COALESCE(SUM(tokens_total), 0) AS tokens_total,
          COUNT(*) AS events
        FROM cost_events
        WHERE created_at >= ? AND created_at < ?
        GROUP BY COALESCE(${column}, '')
        ORDER BY cost_usd DESC
      `)
      .all(window.fromMs, window.toMs) as Array<{
      key: string;
      cost_usd: number;
      tokens_total: number;
      events: number;
    }>;
    return rows.map((r) => ({
      key: r.key,
      costUsd: r.cost_usd,
      tokensTotal: r.tokens_total,
      events: r.events,
    }));
  }

  series(window: CostWindow, bucketMs: number): CostSeriesPoint[] {
    if (bucketMs <= 0) throw new Error('[SqliteCostRepository] series bucketMs must be > 0');
    const rows = this.db
      .prepare(`
        SELECT
          (created_at - ((created_at - ?) % ?)) AS bucket_start,
          COALESCE(SUM(cost_usd), 0) AS cost_usd,
          COALESCE(SUM(tokens_total), 0) AS tokens_total,
          COUNT(*) AS events
        FROM cost_events
        WHERE created_at >= ? AND created_at < ?
        GROUP BY bucket_start
        ORDER BY bucket_start ASC
      `)
      .all(window.fromMs, bucketMs, window.fromMs, window.toMs) as Array<{
      bucket_start: number;
      cost_usd: number;
      tokens_total: number;
      events: number;
    }>;
    return rows.map((r) => ({
      bucketStart: r.bucket_start,
      costUsd: r.cost_usd,
      tokensTotal: r.tokens_total,
      events: r.events,
    }));
  }

  total(window: CostWindow): { costUsd: number; tokensTotal: number; events: number } {
    const row = this.stmtTotal.get(window.fromMs, window.toMs) as {
      cost_usd: number;
      tokens_total: number;
      events: number;
    };
    return { costUsd: row.cost_usd, tokensTotal: row.tokens_total, events: row.events };
  }

  prune(cutoffMs: number): number {
    return this.stmtPrune.run(cutoffMs).changes;
  }
}
