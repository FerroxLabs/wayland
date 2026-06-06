/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * One-time, idempotent migration that tags any user-configured MCP server
 * without an explicit `source` field as `source: 'custom'`. The new MCP
 * Library UI groups installed servers by `source` ('library' vs 'custom'),
 * so pre-library installs need to be retroactively classified.
 *
 * The migration:
 *   - Preserves every other field on the record (spread + add).
 *   - Is idempotent - re-running over an already-migrated list is a no-op.
 *   - Leaves servers that already carry a `source` (e.g. 'library') alone.
 */
export type McpServerSource = 'library' | 'custom';

/**
 * Minimal shape the migration relies on. Real records (e.g. `IMcpServer`)
 * carry many more fields - they are preserved verbatim by the spread.
 */
export interface McpServerRecord {
  source?: McpServerSource;
  libraryEntryId?: string;
}

export function migrateExistingServers<T extends McpServerRecord>(servers: readonly T[]): T[] {
  return servers.map((server) =>
    server.source ? server : ({ ...server, source: 'custom' as const })
  );
}
