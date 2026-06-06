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
   * Install MCP servers into the Wayland configuration
   * In practice, merges the entries into the unified ProcessConfig
   */
  async installMcpServers(mcpServers: IMcpServer[]): Promise<McpOperationResult> {
    try {
      // Read current configuration
      const currentConfig = (await ProcessConfig.get('mcp.config')) || [];
      const existingServers = Array.isArray(currentConfig) ? currentConfig : [];

      // Merge new servers (deduped by name)
      const serverMap = new Map<string, IMcpServer>();

      // Seed with existing servers first
      existingServers.forEach((server: IMcpServer) => {
        serverMap.set(server.name, server);
      });

      // Add or update incoming servers
      mcpServers.forEach((server) => {
        // Only install supported transport types
        if (this.getSupportedTransports().includes(server.transport.type)) {
          serverMap.set(server.name, {
            ...server,
            updatedAt: Date.now(),
          });
        } else {
          console.warn(`[WaylandMcpAgent] Skipping ${server.name}: unsupported transport type ${server.transport.type}`);
        }
      });

      // Convert back to an array and save
      const mergedServers = Array.from(serverMap.values());
      await ProcessConfig.set('mcp.config', mergedServers);

      console.log('[WaylandMcpAgent] Installed MCP servers:', mcpServers.map((s) => s.name).join(', '));
      return { success: true };
    } catch (error) {
      console.error('[WaylandMcpAgent] Failed to install MCP servers:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Remove an MCP server from the Wayland configuration
   *
   * Note: Wayland's MCP configuration is managed centrally by the renderer (frontend).
   * This method is intentionally a no-op because:
   * 1. When toggled off: the frontend already sets enabled: false; no backend mutation needed
   * 2. When deleted: the frontend already removed it from config; no backend mutation needed
   *
   * WaylandMcpAgent is only responsible for reading config (detectMcpServers) and adding
   * config (installMcpServers). It should not mutate config during remove to avoid
   * conflicting with the frontend's configuration management.
   */
  removeMcpServer(mcpServerName: string): Promise<McpOperationResult> {
    console.log(`[WaylandMcpAgent] Skip removing '${mcpServerName}' - config managed by renderer`);
    return Promise.resolve({ success: true });
  }
}
