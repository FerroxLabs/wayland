/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import type { McpOperationResult } from '../McpProtocol';
import { AbstractMcpAgent } from '../McpProtocol';
import type { IMcpServer } from '@/common/config/storage';
import { safeExec, execErrorDetail } from '@process/utils/safeExec';
import {
  aggregatePublicationFailures,
  aggregateRemovalSignals,
  agentCliEnv,
  agentCliFailureDetail,
  isAgentCliTimeout,
  runAgentCli,
  type RemovalScopeReport,
} from './agentCliExec';

/**
 * Env options for exec calls - ensures the CLI is found from Finder/launchd
 * launches, and redirects HOME (which `gemini` resolves
 * `~/.gemini/settings.json` against) when an agent-config sandbox is in force.
 */
const getExecEnv = () => ({ env: agentCliEnv() });

/**
 * Google Gemini CLI MCP agent implementation
 *
 * Manages MCP server configuration via the official Google Gemini CLI's mcp subcommand
 * Note: this manages the real Google Gemini CLI, not @office-ai/aioncli-core
 */
export class GeminiMcpAgent extends AbstractMcpAgent {
  constructor() {
    super('gemini');
  }

  getSupportedTransports(): string[] {
    // Google Gemini CLI supports stdio, sse, http transport types (streamable_http maps to http)
    return ['stdio', 'sse', 'http', 'streamable_http'];
  }

  /**
   * Detect the Google Gemini CLI's MCP configuration
   */
  detectMcpServers(_cliPath?: string): Promise<IMcpServer[]> {
    const detectOperation = async () => {
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (attempt === 1) {
            console.log('[GeminiMcpAgent] Starting MCP detection...');
          } else {
            console.log(`[GeminiMcpAgent] Retrying detection (attempt ${attempt}/${maxRetries})...`);
            // On retries, add a short delay to avoid conflicting with other operations
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          // Use Gemini CLI command to get MCP configuration
          const { stdout: result } = await safeExec('gemini mcp list', { timeout: this.timeout, ...getExecEnv() });

          // If no MCP servers are configured, return an empty array
          if (result.includes('No MCP servers configured') || !result.trim()) {
            console.log('[GeminiMcpAgent] No MCP servers configured');
            return [];
          }

          // Parse text output
          const mcpServers: IMcpServer[] = [];
          const lines = result.split('\n');

          for (const line of lines) {
            // Strip ANSI color codes (supports multiple formats)
            /* eslint-disable no-control-regex */
            const cleanLine = line
              .replace(/\u001b\[[0-9;]*m/g, '')
              .replace(/\[[0-9;]*m/g, '')
              .trim();
            /* eslint-enable no-control-regex */

            // Match formats like: "✓ 12306-mcp: npx -y 12306-mcp (stdio) - Connected"
            const match = cleanLine.match(/[✓✗]\s+([^:]+):\s+(.+?)\s+\(([^)]+)\)\s*-\s*(Connected|Disconnected)/);
            if (match) {
              const [, name, commandStr, transport, status] = match;
              const commandParts = commandStr.trim().split(/\s+/);
              const command = commandParts[0];
              const args = commandParts.slice(1);

              const transportType = transport as 'stdio' | 'sse' | 'http';

              // Build transport object
              const transportObj: any =
                transportType === 'stdio'
                  ? {
                      type: 'stdio',
                      command: command,
                      args: args,
                      env: {},
                    }
                  : transportType === 'sse'
                    ? {
                        type: 'sse',
                        url: commandStr.trim(),
                      }
                    : {
                        type: 'http',
                        url: commandStr.trim(),
                      };

              // Try to fetch tools info (for all connected servers)
              let tools: Array<{ name: string; description?: string }> = [];
              if (status === 'Connected') {
                try {
                  const testResult = await this.testMcpConnection(transportObj);
                  tools = testResult.tools || [];
                } catch (error) {
                  console.warn(`[GeminiMcpAgent] Failed to get tools for ${name.trim()}:`, error);
                }
              }

              mcpServers.push({
                id: `gemini_${name.trim()}`,
                name: name.trim(),
                transport: transportObj,
                tools: tools,
                enabled: true,
                status: status === 'Connected' ? 'connected' : 'disconnected',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                description: '',
                originalJson: JSON.stringify(
                  {
                    mcpServers: {
                      [name.trim()]:
                        transportType === 'stdio'
                          ? {
                              command: command,
                              args: args,
                              description: `Detected from Google Gemini CLI`,
                            }
                          : {
                              url: commandStr.trim(),
                              type: transportType,
                              description: `Detected from Google Gemini CLI`,
                            },
                    },
                  },
                  null,
                  2
                ),
              });
            }
          }

          console.log(`[GeminiMcpAgent] Detection complete: found ${mcpServers.length} server(s)`);

          // Validate result: if output contains "Configured MCP servers:" but no servers were parsed, output may be truncated
          const hasConfigHeader = result.includes('Configured MCP servers:');
          const hasServerLines = lines.some((line) => line.match(/[✓✗]\s+[^:]+:/));

          if (hasConfigHeader && hasServerLines && mcpServers.length === 0) {
            throw new Error('Output appears truncated: found server markers but parsed 0 servers');
          }

          // Success, return the result
          return mcpServers;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`[GeminiMcpAgent] Detection attempt ${attempt} failed:`, lastError.message);

          // If retries remain, continue to the next attempt
          if (attempt < maxRetries) {
            continue;
          }
        }
      }

      // All retries failed
      console.warn('[GeminiMcpAgent] All detection attempts failed. Last error:', lastError);
      return [];
    };

    // Use a named function so it appears in logs
    Object.defineProperty(detectOperation, 'name', { value: 'detectMcpServers' });
    return this.withLock(detectOperation);
  }

  /**
   * Install MCP servers into the Google Gemini CLI
   */
  installMcpServers(mcpServers: IMcpServer[]): Promise<McpOperationResult> {
    const installOperation = async (): Promise<McpOperationResult> => {
      try {
        const failures: string[] = [];
        let timedOut = false;
        for (const server of mcpServers) {
          if (server.transport.type === 'stdio') {
            if (Object.keys(server.transport.env ?? {}).length > 0) {
              failures.push(
                `${server.name}: Gemini CLI publication cannot preserve stdio environment variables in this adapter`
              );
              continue;
            }
            // Use Gemini CLI to add an MCP server
            // Format: gemini mcp add <name> <command> [args...]
            // Pass name/command/args as separate argv elements (shell:false) so
            // shell metacharacters in any value cannot inject commands (SEC-MCP-01).
            const args = ['mcp', 'add', server.name, server.transport.command];
            if (server.transport.args?.length) {
              args.push(...server.transport.args);
            }

            // Add scope flag (user or project)
            args.push('-s', 'user');

            try {
              // `this.timeout` (30 s), NOT a hard-coded 5 s. RC1 measured this
              // exact call at 4,399 ms and 5,009 ms on the same machine 600 ms
              // apart: a 5 s wall below the measured cost of the call it
              // guards is a coin flip, and it decided whether the user's
              // connector turned on (#B4a).
              await runAgentCli('gemini', args, { ...getExecEnv() });
              console.log(`[GeminiMcpAgent] Added MCP server: ${server.name}`);
            } catch (error) {
              const detail = agentCliFailureDetail(error);
              if (isAgentCliTimeout(error)) timedOut = true;
              console.warn(`Failed to add MCP ${server.name} to Gemini: ${detail}`);
              failures.push(`${server.name}: ${detail}`);
            }
          } else if (
            server.transport.type === 'sse' ||
            server.transport.type === 'http' ||
            server.transport.type === 'streamable_http'
          ) {
            if (Object.keys(server.transport.headers ?? {}).length > 0) {
              failures.push(`${server.name}: Gemini CLI publication cannot preserve HTTP headers in this adapter`);
              continue;
            }
            // Handle SSE/HTTP/Streamable HTTP transport types
            // Gemini CLI uses --transport http for both HTTP and Streamable HTTP
            const transportFlag = server.transport.type === 'streamable_http' ? 'http' : server.transport.type;
            // Pass name/url as separate argv elements (shell:false) so shell
            // metacharacters in any value cannot inject commands (SEC-MCP-01).
            const args = ['mcp', 'add', server.name, server.transport.url, '--transport', transportFlag, '-s', 'user'];

            try {
              await runAgentCli('gemini', args, { ...getExecEnv() });
              console.log(`[GeminiMcpAgent] Added MCP server: ${server.name}`);
            } catch (error) {
              const detail = agentCliFailureDetail(error);
              if (isAgentCliTimeout(error)) timedOut = true;
              console.warn(`Failed to add MCP ${server.name} to Gemini: ${detail}`);
              failures.push(`${server.name}: ${detail}`);
            }
          } else {
            failures.push(
              `${server.name}: Gemini CLI does not support ${(server.transport as { type: string }).type} transport type`
            );
          }
        }
        return aggregatePublicationFailures('Gemini CLI', failures, timedOut);
      } catch (error) {
        return { success: false, outcome: 'failed', error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(installOperation, 'name', { value: 'installMcpServers' });
    return this.withLock(installOperation);
  }

  /**
   * Remove an MCP server from the Google Gemini CLI
   */
  removeMcpServer(mcpServerName: string): Promise<McpOperationResult> {
    const removeOperation = async (): Promise<McpOperationResult> => {
      // Per-scope classification, same rule as every other adapter: absence is
      // a success, a killed child is an unknown, and only a real answer from
      // the CLI is a failure. The previous shape demanded the literal words
      // "not found" in BOTH scope messages before it would call the removal
      // idempotent, so a single slow scope reported the whole thing failed.
      const scopes = ['user', 'project'] as const;
      const reports: RemovalScopeReport[] = [];

      for (const scope of scopes) {
        try {
          const result = await runAgentCli('gemini', ['mcp', 'remove', mcpServerName, '-s', scope], {
            ...getExecEnv(),
          });
          const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;

          if (output.includes('removed')) {
            console.log(`[GeminiMcpAgent] Removed MCP server from ${scope} scope: ${mcpServerName}`);
            reports.push({ scope, signal: 'removed' });
            break;
          }
          if (output.includes('not found')) {
            reports.push({ scope, signal: 'absent' });
            continue;
          }
          reports.push({ scope, signal: 'removed' });
          break;
        } catch (error) {
          const detail = execErrorDetail(error);
          if (isAgentCliTimeout(error)) {
            reports.push({ scope, signal: 'unknown', detail });
            continue;
          }
          if (detail.includes('not found') || detail.includes('does not exist')) {
            reports.push({ scope, signal: 'absent' });
            continue;
          }
          reports.push({ scope, signal: 'error', detail });
        }
      }

      return aggregateRemovalSignals('Gemini CLI', reports);
    };

    Object.defineProperty(removeOperation, 'name', { value: 'removeMcpServer' });
    return this.withLock(removeOperation);
  }
}
