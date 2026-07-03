/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';
import { ProcessConfig } from '@process/utils/initStorage';

/**
 * Per-connector agent guidance injection (#475).
 *
 * Some MCP connectors need the model to call a tool in a specific way that the
 * server's own tool description doesn't spell out clearly. The Google Workspace
 * MCP is the motivating case: `start_google_auth` REQUIRES `service_name`
 * (gmail|drive|calendar|docs|...) and benefits from `user_google_email`; without
 * that the model loops on validation failures and burns its budget.
 *
 * A connector's `agentGuidance` (from its catalog entry, persisted onto the
 * installed server record) is injected into the agent's system prompt whenever
 * the connector is ENABLED — ungated by capability-intent, because a plain
 * "check my email" turn is exactly when the model needs it. Absent/blank
 * guidance and disabled connectors contribute nothing, so this is zero-cost
 * for every connector that doesn't opt in.
 */

const MCP_CONNECTOR_GUIDANCE_HEADER = '## Connected MCP connectors — usage notes';

type GuidanceServer = Pick<IMcpServer, 'enabled' | 'agentGuidance'>;

/**
 * Build the connector-guidance system-prompt section from a list of MCP servers.
 * Pure and side-effect-free. Returns '' when no enabled connector carries
 * non-blank guidance.
 */
export function buildMcpConnectorGuidance(servers: readonly GuidanceServer[]): string {
  const notes = servers
    .filter((s) => s.enabled && typeof s.agentGuidance === 'string' && s.agentGuidance.trim().length > 0)
    .map((s) => s.agentGuidance!.trim());

  if (notes.length === 0) return '';
  return `${MCP_CONNECTOR_GUIDANCE_HEADER}\n${notes.join('\n\n')}`;
}

/**
 * Read the installed MCP servers from config and build the guidance section.
 * Never throws — returns '' on any failure so it can be spliced into system
 * prompt assembly unconditionally.
 */
export async function resolveMcpConnectorGuidance(): Promise<string> {
  try {
    const servers = (await ProcessConfig.get('mcp.config')) ?? [];
    return buildMcpConnectorGuidance(servers);
  } catch {
    return '';
  }
}
