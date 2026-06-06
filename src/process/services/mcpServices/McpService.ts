/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'child_process';
import type { IMcpServer } from '@/common/config/storage';
import { ClaudeMcpAgent } from './agents/ClaudeMcpAgent';
import { CodebuddyMcpAgent } from './agents/CodebuddyMcpAgent';
import { QwenMcpAgent } from './agents/QwenMcpAgent';
import { GeminiMcpAgent } from './agents/GeminiMcpAgent';
import { WaylandMcpAgent } from './agents/WaylandMcpAgent';
import { CodexMcpAgent } from './agents/CodexMcpAgent';
import { OpencodeMcpAgent } from './agents/OpencodeMcpAgent';
import { WCoreMcpAgent } from './agents/WCoreMcpAgent';
import type { IMcpProtocol, DetectedMcpServer, McpConnectionTestResult, McpSyncResult, McpSource } from './McpProtocol';
import { validateMcpServer } from './validateMcpServer';

/**
 * MCP service - coordinates the MCP operation protocol across agents
 * New architecture: this layer only defines the protocol; implementations live in each Agent class
 *
 * Agent types:
 * - AcpBackend ('claude', 'qwen', 'gemini', 'codex', etc.): supported ACP backends
 * - 'wayland': @office-ai/aioncli-core (Wayland's locally managed Gemini implementation)
 */
export class McpService {
  private agents: Map<McpSource, IMcpProtocol>;

  /**
   * Service-level operation lock to serialize heavy MCP operations.
   * Prevents concurrent getAgentMcpConfigs / syncMcpToAgents / removeMcpFromAgents
   * which would otherwise spawn dozens of child processes simultaneously,
   * causing resource exhaustion and potential system freezes.
   */
  private operationQueue: Promise<unknown> = Promise.resolve();

  private withServiceLock<T>(operation: () => Promise<T>): Promise<T> {
    const queued = this.operationQueue.then(operation, () => operation());
    // Keep the queue moving even if the operation rejects
    this.operationQueue = queued.catch(() => {});
    return queued;
  }

  private isCliAvailable(cliCommand: string): boolean {
    const isWindows = process.platform === 'win32';
    const whichCommand = isWindows ? 'where' : 'which';

    // Keep original behavior: prefer where/which, then fallback on Windows to Get-Command.
    try {
      execSync(`${whichCommand} ${cliCommand}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 1000,
      });
      return true;
    } catch {
      if (!isWindows) return false;
    }

    if (isWindows) {
      try {
        // PowerShell fallback for shim scripts like *.ps1 (vfox)
        execSync(
          `powershell -NoProfile -NonInteractive -Command "Get-Command -All ${cliCommand} | Select-Object -First 1 | Out-Null"`,
          {
            encoding: 'utf-8',
            stdio: 'pipe',
            timeout: 1000,
          }
        );
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  constructor() {
    this.agents = new Map([
      ['claude', new ClaudeMcpAgent()],
      ['codebuddy', new CodebuddyMcpAgent()],
      ['qwen', new QwenMcpAgent()],
      ['gemini', new GeminiMcpAgent()],
      ['wayland', new WaylandMcpAgent()], // Wayland local @office-ai/aioncli-core
      ['codex', new CodexMcpAgent()],
      ['opencode', new OpencodeMcpAgent()],
      ['wcore', new WCoreMcpAgent()], // Wayland Core (Rust binary, TOML config)
    ]);
  }

  /**
   * Get the agent instance for a specific backend
   */
  private getAgent(backend: McpSource): IMcpProtocol | undefined {
    return this.agents.get(backend);
  }

  /**
   * Get the correct MCP agent instance based on agent config.
   * Fork Gemini (cliPath=undefined) uses WaylandMcpAgent.
   * Native Gemini (cliPath='gemini') uses GeminiMcpAgent.
   */
  private getAgentForConfig(agent: { backend: string; cliPath?: string }): IMcpProtocol | undefined {
    // Fork Gemini uses WaylandMcpAgent to manage MCP config
    if (agent.backend === 'gemini' && !agent.cliPath) {
      return this.agents.get('wayland');
    }
    return this.agents.get(agent.backend as McpSource);
  }

  /**
   * Ensure native Gemini CLI is in the agent list (if installed but not present).
   * AcpDetector returns fork Gemini (cliPath=undefined), but MCP operations need native Gemini CLI too.
   */
  private addNativeGeminiIfNeeded(
    agents: Array<{ backend: string; name: string; cliPath?: string }>
  ): Array<{ backend: string; name: string; cliPath?: string }> {
    const hasNativeGemini = agents.some((a) => a.backend === 'gemini' && a.cliPath === 'gemini');
    if (hasNativeGemini) return agents;

    try {
      if (!this.isCliAvailable('gemini')) return agents;

      const allAgents = [
        ...agents,
        {
          backend: 'gemini',
          name: 'Google Gemini CLI',
          cliPath: 'gemini',
        },
      ];
      console.log('[McpService] Added native Gemini CLI to agent list');
      return allAgents;
    } catch {
      return agents;
    }
  }

  /**
   * Resolve which MCP agent should be used for config detection and how it
   * should be reported back to the renderer.
   */
  private getDetectionTarget(agent: { backend: string; cliPath?: string }): {
    agentInstance: IMcpProtocol | undefined;
    source: McpSource;
  } {
    const agentInstance = this.getAgentForConfig(agent);
    const source: McpSource = agent.backend === 'gemini' && !agent.cliPath ? 'gemini' : (agent.backend as McpSource);
    return { agentInstance, source };
  }

  /**
   * Merge detection results by source so the UI sees a single entry per agent.
   * This also prevents duplicate Gemini rows when both built-in Gemini and the
   * native Gemini CLI expose the same MCP server names.
   */
  private mergeDetectedServers(results: DetectedMcpServer[]): DetectedMcpServer[] {
    const merged = new Map<McpSource, Map<string, IMcpServer>>();

    results.forEach((result) => {
      const serversByName = merged.get(result.source) ?? new Map<string, IMcpServer>();

      result.servers.forEach((server) => {
        if (!serversByName.has(server.name)) {
          serversByName.set(server.name, server);
        }
      });

      merged.set(result.source, serversByName);
    });

    return Array.from(merged.entries()).map(([source, serversByName]) => ({
      source,
      servers: Array.from(serversByName.values()),
    }));
  }

  /**
   * Get MCP configuration from detected ACP agents (concurrent version)
   *
   * Note: this method also detects the native Gemini CLI's MCP configuration,
   * even when it is disabled in ACP config (because fork Gemini is used for ACP).
   */
  getAgentMcpConfigs(
    agents: Array<{
      backend: string;
      name: string;
      cliPath?: string;
    }>
  ): Promise<DetectedMcpServer[]> {
    return this.withServiceLock(async () => {
      // Build the full detection list, including ACP agents plus the native Gemini CLI
      const allAgentsToCheck = this.addNativeGeminiIfNeeded(agents);

      // Run MCP detection across all agents concurrently
      const promises = allAgentsToCheck.map(async (agent) => {
        try {
          const { agentInstance, source } = this.getDetectionTarget(agent);
          if (!agentInstance) {
            console.warn(`[McpService] No agent instance for backend: ${agent.backend}`);
            return null;
          }

          const servers = await agentInstance.detectMcpServers(agent.cliPath);
          console.log(
            `[McpService] Detected ${servers.length} MCP servers for ${agent.backend} (cliPath: ${agent.cliPath || 'default'})`
          );

          if (servers.length > 0) {
            return {
              source,
              servers,
            };
          }
          return null;
        } catch (error) {
          console.warn(`[McpService] Failed to detect MCP servers for ${agent.backend}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      return this.mergeDetectedServers(results.filter((result): result is DetectedMcpServer => result !== null));
    });
  }

  /**
   * Get supported transport types for a given agent config.
   * Fork Gemini (backend='gemini', no cliPath) uses WaylandMcpAgent.
   */
  getSupportedTransportsForAgent(agent: { backend: string; cliPath?: string }): string[] {
    const agentInstance = this.getAgentForConfig(agent as { backend: string; cliPath?: string });
    return agentInstance ? agentInstance.getSupportedTransports() : [];
  }

  /**
   * Test connection to an MCP server
   */
  async testMcpConnection(server: IMcpServer): Promise<McpConnectionTestResult> {
    // Use the first available agent to test the connection; the test logic in the base class is generic
    const firstAgent = this.agents.values().next().value;
    if (firstAgent) {
      return await firstAgent.testMcpConnection(server);
    }
    return {
      success: false,
      error: 'No agent available for connection testing',
    };
  }

  /**
   * Sync MCP configuration to all detected agents
   */
  syncMcpToAgents(
    mcpServers: IMcpServer[],
    agents: Array<{
      backend: string;
      name: string;
      cliPath?: string;
    }>
  ): Promise<McpSyncResult> {
    // Only sync enabled MCP servers
    const enabledServers = mcpServers.filter((server) => server.enabled);

    if (enabledServers.length === 0) {
      return Promise.resolve({ success: true, results: [] });
    }

    // Reject command-injection-prone names / non-http(s) URLs before any agent
    // builds a CLI invocation from them (SEC-MCP-01 pre-sync guard).
    for (const server of enabledServers) {
      validateMcpServer(server);
    }

    return this.withServiceLock(async () => {
      // Ensure native Gemini CLI is also in the sync list
      const allAgents = this.addNativeGeminiIfNeeded(agents);

      // Run MCP sync across all agents concurrently
      const promises = allAgents.map(async (agent) => {
        try {
          // Use getAgentForConfig to correctly distinguish fork Gemini from native Gemini
          const agentInstance = this.getAgentForConfig(agent);
          if (!agentInstance) {
            console.warn(`[McpService] Skipping MCP sync for unsupported backend: ${agent.backend}`);
            return {
              agent: agent.name,
              success: true,
            };
          }

          const result = await agentInstance.installMcpServers(enabledServers);
          return {
            agent: agent.name,
            success: result.success,
            error: result.error,
          };
        } catch (error) {
          return {
            agent: agent.name,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      const results = await Promise.all(promises);

      const allSuccess = results.every((r) => r.success);

      return { success: allSuccess, results };
    });
  }

  /**
   * Remove MCP configuration from all detected agents
   */
  removeMcpFromAgents(
    mcpServerName: string,
    agents: Array<{
      backend: string;
      name: string;
      cliPath?: string;
    }>
  ): Promise<McpSyncResult> {
    return this.withServiceLock(async () => {
      // Ensure native Gemini CLI is also in the removal list
      const allAgents = this.addNativeGeminiIfNeeded(agents);

      // Run MCP removal across all agents concurrently
      const promises = allAgents.map(async (agent) => {
        try {
          // Use getAgentForConfig to correctly distinguish fork Gemini from native Gemini
          const agentInstance = this.getAgentForConfig(agent);
          if (!agentInstance) {
            console.warn(`[McpService] Skipping MCP removal for unsupported backend: ${agent.backend}`);
            return {
              agent: `${agent.backend}:${agent.name}`,
              success: true,
            };
          }

          const result = await agentInstance.removeMcpServer(mcpServerName);
          return {
            agent: `${agent.backend}:${agent.name}`,
            success: result.success,
            error: result.error,
          };
        } catch (error) {
          return {
            agent: `${agent.backend}:${agent.name}`,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      const results = await Promise.all(promises);

      return { success: true, results };
    });
  }
}

export const mcpService = new McpService();
