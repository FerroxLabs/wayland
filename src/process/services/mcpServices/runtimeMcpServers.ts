/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';
import { mcpServerCollisionKey } from '@/common/mcp';
import { ExtensionRegistry } from '@process/extensions';
import { ProcessConfig } from '@process/utils/initStorage';

type ExtensionMcpRecord = Record<string, unknown>;

function extensionRecordToServer(record: ExtensionMcpRecord): IMcpServer | null {
  const id = typeof record.id === 'string' ? record.id : '';
  const name = typeof record.name === 'string' ? record.name : '';
  const transport = record.transport as IMcpServer['transport'] | undefined;
  if (!id || !name || !transport || typeof transport !== 'object' || typeof transport.type !== 'string') {
    return null;
  }

  return {
    id,
    name,
    description: typeof record.description === 'string' ? record.description : undefined,
    enabled: record.enabled !== false,
    transport,
    // An extension declaration is not a standalone connection receipt. Leave
    // health unproven; enabled + undefined is still eligible for a real session.
    status: undefined,
    createdAt: typeof record.createdAt === 'number' ? record.createdAt : 0,
    updatedAt: typeof record.updatedAt === 'number' ? record.updatedAt : 0,
    originalJson: typeof record.originalJson === 'string' ? record.originalJson : JSON.stringify(record),
  };
}

/**
 * Merge persisted and extension-contributed declarations into the exact set
 * Desktop-managed runtimes receive. Persisted user declarations win canonical
 * name collisions; extensions are ordered by stable id so two extensions can
 * never change the winner based on load timing.
 */
export function mergeRuntimeMcpServers(
  persisted: readonly IMcpServer[],
  extensionRecords: readonly ExtensionMcpRecord[]
): IMcpServer[] {
  const merged = persisted.map((server) => ({ ...server }));
  const occupiedNames = new Set(merged.map((server) => mcpServerCollisionKey(server.name)));

  const extensions = extensionRecords
    .map(extensionRecordToServer)
    .filter((server): server is IMcpServer => server !== null)
    .toSorted((left, right) => left.id.localeCompare(right.id));

  for (const server of extensions) {
    const key = mcpServerCollisionKey(server.name);
    if (occupiedNames.has(key)) continue;
    occupiedNames.add(key);
    merged.push(server);
  }

  return merged;
}

/** Load the canonical MCP declaration set used by every Desktop session. */
export async function loadRuntimeMcpServers(): Promise<IMcpServer[]> {
  const stored = await ProcessConfig.get('mcp.config').catch((): undefined => undefined);
  const persisted = Array.isArray(stored) ? (stored as IMcpServer[]) : [];
  let extensionRecords: ExtensionMcpRecord[] = [];
  try {
    extensionRecords = ExtensionRegistry.getInstance().getMcpServers();
  } catch (error) {
    console.warn('[runtimeMcpServers] Failed to load extension MCP declarations:', error);
  }
  return mergeRuntimeMcpServers(persisted, extensionRecords);
}
