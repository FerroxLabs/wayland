/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import type { IMcpServer } from '@/common/config/storage';
import { ProcessConfig } from '@process/utils/initStorage';

export interface McpConfigSnapshot {
  revision: string;
  servers: IMcpServer[];
}

function cloneServers(servers: IMcpServer[] | undefined): IMcpServer[] {
  return structuredClone(Array.isArray(servers) ? servers : []);
}

export function mcpConfigRevision(servers: IMcpServer[]): string {
  return createHash('sha256').update(JSON.stringify(servers)).digest('hex');
}

export async function readMcpConfigSnapshot(): Promise<McpConfigSnapshot> {
  const servers = cloneServers(await ProcessConfig.get('mcp.config'));
  return { revision: mcpConfigRevision(servers), servers };
}

/**
 * The only runtime read-modify-write authority for mcp.config.
 *
 * ProcessConfig.update builds inside the store-wide persistence queue, so the
 * mutator always sees the last successfully persisted value and cannot replace
 * a sibling renderer/main-process mutation with a stale full-array snapshot.
 */
export async function updateMcpConfig(
  mutator: (current: IMcpServer[]) => IMcpServer[] | Promise<IMcpServer[]>
): Promise<McpConfigSnapshot> {
  let committed: IMcpServer[] = [];
  await ProcessConfig.update('mcp.config', async (current) => {
    const next = await mutator(cloneServers(current));
    if (!Array.isArray(next)) throw new TypeError('MCP config mutation must return an array');
    committed = cloneServers(next);
    return committed;
  });
  return { revision: mcpConfigRevision(committed), servers: cloneServers(committed) };
}

export async function compareAndSetMcpConfig(
  expectedRevision: string,
  nextServers: IMcpServer[]
): Promise<{ applied: boolean; snapshot: McpConfigSnapshot }> {
  if (!/^[0-9a-f]{64}$/.test(expectedRevision)) throw new TypeError('Invalid MCP config revision');
  if (!Array.isArray(nextServers)) throw new TypeError('MCP config replacement must be an array');
  let observed: IMcpServer[] = [];
  let applied = false;

  await ProcessConfig.update('mcp.config', async (current) => {
    observed = cloneServers(current);
    if (mcpConfigRevision(observed) !== expectedRevision) return observed;
    observed = cloneServers(nextServers);
    applied = true;
    return observed;
  });

  return {
    applied,
    snapshot: { revision: mcpConfigRevision(observed), servers: cloneServers(observed) },
  };
}
