/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ISqliteDriver } from '@process/services/database/drivers/ISqliteDriver';
import type { IUsageEventRepository, UsageEvent, UsageEventType } from './types';

type Row = {
  id: string;
  timestamp_ms: number;
  event_type: string;
  anchor_id: string | null;
  assistant_id: string | null;
  cli_backend: string | null;
  metadata_json: string | null;
};

const rowToEvent = (r: Row): UsageEvent => ({
  id: r.id,
  timestampMs: r.timestamp_ms,
  eventType: r.event_type as UsageEventType,
  anchorId: r.anchor_id ?? undefined,
  assistantId: r.assistant_id ?? undefined,
  cliBackend: r.cli_backend ?? undefined,
  metadata: r.metadata_json ? (JSON.parse(r.metadata_json) as Record<string, unknown>) : undefined,
});

/**
 * SQLite-backed append-only event log for usage telemetry. Drives the
 * Launchpad predictive widget (frecency ranking of recently-used assistants)
 * and dashboard activity surfaces. All methods are async to keep the
 * repository interface uniform with other services, even though the underlying
 * better-sqlite3 driver is synchronous.
 */
export class SqliteUsageEventRepository implements IUsageEventRepository {
  constructor(private readonly db: ISqliteDriver) {}

  async append(event: UsageEvent): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO usage_events (id, timestamp_ms, event_type, anchor_id, assistant_id, cli_backend, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        event.id,
        event.timestampMs,
        event.eventType,
        event.anchorId ?? null,
        event.assistantId ?? null,
        event.cliBackend ?? null,
        event.metadata ? JSON.stringify(event.metadata) : null
      );
  }

  async findSince(sinceMs: number): Promise<UsageEvent[]> {
    const rows = this.db
      .prepare('SELECT * FROM usage_events WHERE timestamp_ms >= ? ORDER BY timestamp_ms ASC')
      .all(sinceMs) as Row[];
    return rows.map(rowToEvent);
  }

  async findByType(eventType: UsageEventType, sinceMs: number): Promise<UsageEvent[]> {
    const rows = this.db
      .prepare('SELECT * FROM usage_events WHERE event_type = ? AND timestamp_ms >= ? ORDER BY timestamp_ms ASC')
      .all(eventType, sinceMs) as Row[];
    return rows.map(rowToEvent);
  }

  /**
   * Cross-audit MED-4: delete events older than `cutoffMs`. Called on app
   * startup with a 90-day retention window so usage_events stays bounded on
   * long-lived installs. Aggregator only ever queries the last 7 days.
   */
  async prune(cutoffMs: number): Promise<number> {
    const result = this.db.prepare('DELETE FROM usage_events WHERE timestamp_ms < ?').run(cutoffMs);
    return result.changes;
  }
}
