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
import { validateMcpEnvEntry } from '../validateMcpServer';
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
 * launches, and redirects HOME (which `qwen` resolves `~/.qwen/settings.json`
 * against) when an agent-config sandbox is in force.
 */
const getExecEnv = () => ({ env: agentCliEnv() });

/**
 * Qwen Code MCP agent implementation
 * Qwen CLI supports stdio, sse, http transport types
 */
export class QwenMcpAgent extends AbstractMcpAgent {
  constructor() {
    super('qwen');
  }

  getSupportedTransports(): string[] {
    return ['stdio', 'sse', 'http'];
  }

  /**
   * Detect Qwen Code's MCP configuration
   */
  detectMcpServers(_cliPath?: string): Promise<IMcpServer[]> {
    const detectOperation = async () => {
      try {
        // Try to fetch MCP configuration via the Qwen CLI command
        const { stdout: result } = await safeExec('qwen mcp list', { timeout: this.timeout, ...getExecEnv() });

        // If no MCP servers are configured, return an empty array
        if (result.trim() === 'No MCP servers configured.' || !result.trim()) {
          console.log('[QwenMcpAgent] No MCP servers configured');
          return [];
        }

        // Parse text output
        const mcpServers: IMcpServer[] = [];
        const lines = result.split('\n');

        for (const line of lines) {
          // Strip ANSI color codes
          // eslint-disable-next-line no-control-regex
          const cleanLine = line.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '').trim();
          // Match formats like: "✓ filesystem: npx @modelcontextprotocol/server-filesystem /path (stdio) - Connected"
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
                console.warn(`[QwenMcpAgent] Failed to get tools for ${name.trim()}:`, error);
                // If fetching tools fails, fall back to empty array
              }
            }

            mcpServers.push({
              id: `qwen_${name.trim()}`,
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
                            description: `Detected from Qwen CLI`,
                          }
                        : {
                            url: commandStr.trim(),
                            type: transportType,
                            description: `Detected from Qwen CLI`,
                          },
                  },
                },
                null,
                2
              ),
            });
          }
        }

        console.log(`[QwenMcpAgent] Detection complete: found ${mcpServers.length} server(s)`);
        return mcpServers;
      } catch (error) {
        console.warn('[QwenMcpAgent] Failed to get Qwen Code MCP config:', error);
        return [];
      }
    };

    // Use a named function so it appears in logs
    Object.defineProperty(detectOperation, 'name', { value: 'detectMcpServers' });
    return this.withLock(detectOperation);
  }

  /**
   * Install MCP servers into the Qwen Code agent
   */
  installMcpServers(mcpServers: IMcpServer[]): Promise<McpOperationResult> {
    const installOperation = async (): Promise<McpOperationResult> => {
      try {
        const failures: string[] = [];
        let timedOut = false;
        for (const server of mcpServers) {
          if (server.transport.type === 'stdio') {
            // Use Qwen CLI to add an MCP server
            // Format: qwen mcp add <name> <command> [args...]
            // Pass name/command/args/env as separate argv elements (shell:false)
            // so shell metacharacters in any value cannot inject commands (SEC-MCP-01).
            const args = ['mcp', 'add', server.name, server.transport.command];
            if (server.transport.args?.length) {
              args.push(...server.transport.args);
            }
            for (const [key, value] of Object.entries(server.transport.env || {})) {
              // Reject argv-breaking keys/values before they ride into the
              // `--env KEY=VALUE` argv element (RT-B2-01 / RT-B2-03).
              validateMcpEnvEntry(server.name, key, String(value ?? ''));
              args.push('--env', `${key}=${value}`);
            }

            // Add scope flag, prefer user scope
            args.push('-s', 'user');

            try {
              await runAgentCli('qwen', args, { ...getExecEnv() });
            } catch (error) {
              const detail = agentCliFailureDetail(error);
              if (isAgentCliTimeout(error)) timedOut = true;
              console.warn(`Failed to add MCP ${server.name} to Qwen Code: ${detail}`);
              failures.push(`${server.name}: ${detail}`);
            }
          } else if (
            server.transport.type === 'sse' ||
            server.transport.type === 'http' ||
            server.transport.type === 'streamable_http'
          ) {
            // Handle SSE/HTTP/Streamable HTTP transport types
            // Qwen CLI uses --transport http for both HTTP and Streamable HTTP
            const transportFlag = server.transport.type === 'streamable_http' ? 'http' : server.transport.type;
            // Pass name/url/headers as separate argv elements (shell:false) so
            // shell metacharacters in any value cannot inject commands (SEC-MCP-01).
            const args = ['mcp', 'add', server.name, server.transport.url, '--transport', transportFlag];

            // Add headers
            if (server.transport.headers) {
              for (const [key, value] of Object.entries(server.transport.headers)) {
                args.push('--header', `${key}: ${value}`);
              }
            }

            args.push('-s', 'user');

            try {
              await runAgentCli('qwen', args, { ...getExecEnv() });
            } catch (error) {
              const detail = agentCliFailureDetail(error);
              if (isAgentCliTimeout(error)) timedOut = true;
              console.warn(`Failed to add MCP ${server.name} to Qwen Code: ${detail}`);
              failures.push(`${server.name}: ${detail}`);
            }
          } else {
            failures.push(
              `${server.name}: Qwen Code does not support ${(server.transport as { type: string }).type} transport type`
            );
          }
        }
        return aggregatePublicationFailures('Qwen Code', failures, timedOut);
      } catch (error) {
        return { success: false, outcome: 'failed', error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(installOperation, 'name', { value: 'installMcpServers' });
    return this.withLock(installOperation);
  }

  /**
   * Remove an MCP server from the Qwen Code agent
   */
  removeMcpServer(mcpServerName: string): Promise<McpOperationResult> {
    const removeOperation = async (): Promise<McpOperationResult> => {
      // Never rewrite Qwen's user-owned config file behind the CLI's back. An
      // earlier fallback did, with a non-atomic write that even returned
      // success when parsing or writing failed - letting Wayland erase its own
      // connector definition while Qwen still retained stale tools.
      //
      // This produced the user's banner verbatim:
      //   "qwen:Qwen Code: user: Comma... Server not found in project settings"
      // `user` had TIMED OUT (unknown) and `project` had reported ABSENCE (a
      // success). The old code demanded the literal words "not found" in BOTH
      // messages before it would call the removal idempotent, so one unknown
      // scope turned a nothing-to-do removal into a red partial failure with
      // two unrelated sentences glued together. Classification is now per
      // scope, and the aggregate knows the difference between "not there",
      // "did not answer" and "answered with an error".
      const scopes = ['user', 'project'] as const;
      const reports: RemovalScopeReport[] = [];

      for (const scope of scopes) {
        try {
          const result = await runAgentCli('qwen', ['mcp', 'remove', mcpServerName, '-s', scope], {
            ...getExecEnv(),
          });
          const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;

          if (output.includes('removed')) {
            reports.push({ scope, signal: 'removed' });
            break;
          }
          if (output.includes('not found')) {
            reports.push({ scope, signal: 'absent' });
            continue;
          }
          // Exit 0 with nothing recognisable to say: the CLI reported success,
          // and second-guessing it here is how the previous code invented
          // failures. Take it at its word.
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

      return aggregateRemovalSignals('Qwen Code', reports);
    };

    Object.defineProperty(removeOperation, 'name', { value: 'removeMcpServer' });
    return this.withLock(removeOperation);
  }
}
