/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { McpOperationResult } from '../McpProtocol';
import { AbstractMcpAgent } from '../McpProtocol';
import type { IMcpServer } from '@/common/config/storage';
import { ProcessConfig } from '@process/utils/initStorage';

/**
 * Wayland local MCP agent implementation
 *
 * Manages MCP configuration for the local Gemini CLI running via @office-ai/aioncli-core
 *
 * How it works:
 * 1. MCP configuration is stored in ProcessConfig under 'mcp.config'
 * 2. GeminiAgentManager reads from mcp.config at startup and converts it to @office-ai/aioncli-core format
 * 3. @office-ai/aioncli-core uses these MCP servers at runtime
 *
 * Differences vs. other ACP Backend MCP Agents:
 * - ACP Backend Agents: manage MCP configuration of real CLI tools (e.g. claude mcp, qwen mcp commands)
 * - WaylandMcpAgent: manages runtime MCP configuration for Wayland's local @office-ai/aioncli-core
 */
export class WaylandMcpAgent extends AbstractMcpAgent {
  constructor() {
    // Use 'wayland' as the backend type to distinguish from the real Gemini CLI
    // Even though config is consumed by GeminiAgentManager, at the MCP management layer it's a separate agent
    super('wayland');
  }

  getSupportedTransports(): string[] {
    // @office-ai/aioncli-core supports stdio, sse, http (streamable_http maps to http)
    // Reference: node_modules/@office-ai/aioncli-core/dist/src/config/config.d.ts -> MCPServerConfig
    return ['stdio', 'sse', 'http', 'streamable_http'];
  }

  /**
   * Detect MCP configuration managed by Wayland
   * Reads from the unified ProcessConfig
   */
  async detectMcpServers(_cliPath?: string): Promise<IMcpServer[]> {
    try {
      const mcpConfig = await ProcessConfig.get('mcp.config');
      if (!mcpConfig || !Array.isArray(mcpConfig)) {
        return [];
      }

      // Return all configured MCP servers
      // Filter to those with transport types supported by @office-ai/aioncli-core
      return mcpConfig.filter((server: IMcpServer) => {
        const supportedTypes = this.getSupportedTransports();
        return supportedTypes.includes(server.transport.type);
      });
    } catch (error) {
      console.warn('[WaylandMcpAgent] Failed to detect MCP servers:', error);
      return [];
    }
  }

  /**
   * "Install" MCP servers for Wayland's local runtime.
   *
   * Intentionally a no-op, for the same reason {@link removeMcpServer} is: the
   * renderer owns `mcp.config`, and this agent must not mutate it underneath
   * the caller. Both publication paths already persist the declaration
   * themselves - the toggle commits it immediately after publishing, and the
   * WebUI route publishes a server it looked up out of `mcp.config` in the
   * first place - so there is nothing here left to write.
   *
   * Writing it anyway was actively harmful. `updateMcpConfig` is a
   * main-process authority that bypasses the renderer's write queue, and this
   * method bumped `updatedAt` on the very row the caller was about to
   * compare-and-set. `handleToggleMcpServer` publishes first and commits
   * second, guarding on the `updatedAt` it read before publishing - so this
   * write invalidated that guard from inside the publication it was part of,
   * and the commit failed and rolled back every agent. It also left the row
   * `enabled: true` even though the toggle never committed, which is how a
   * failed publication ended up retaining an ENABLED divergence row.
   *
   * The transport check is retained as validation so an unsupported transport
   * is still reported rather than silently accepted.
   */
  installMcpServers(mcpServers: IMcpServer[]): Promise<McpOperationResult> {
    const supported = this.getSupportedTransports();
    const unsupported = mcpServers.filter((server) => !supported.includes(server.transport.type));
    for (const server of unsupported) {
      console.warn(`[WaylandMcpAgent] Skipping ${server.name}: unsupported transport type ${server.transport.type}`);
    }

    console.log(
      '[WaylandMcpAgent] Skip writing config - managed by renderer:',
      mcpServers.map((s) => s.name).join(', ')
    );
    return Promise.resolve({ success: true });
  }

  /**
   * Remove an MCP server from the Wayland configuration
   *
   * Note: Wayland's MCP configuration is managed centrally by the renderer (frontend).
   * This method is intentionally a no-op because:
   * 1. When toggled off: the frontend already sets enabled: false; no backend mutation needed
   * 2. When deleted: the frontend already removed it from config; no backend mutation needed
   *
   * WaylandMcpAgent is only responsible for READING config (detectMcpServers). It must not
   * mutate config on remove OR on install, to avoid conflicting with the frontend's
   * configuration management - see {@link installMcpServers} for what that conflict cost.
   */
  removeMcpServer(mcpServerName: string): Promise<McpOperationResult> {
    console.log(`[WaylandMcpAgent] Skip removing '${mcpServerName}' - config managed by renderer`);
    return Promise.resolve({ success: true });
  }
}
