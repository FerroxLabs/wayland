/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { McpOperationResult } from '../McpProtocol';
import { AbstractMcpAgent } from '../McpProtocol';
import type { IMcpServer } from '@/common/config/storage';
import { getEnhancedEnv } from '@process/utils/shellEnv';
import { safeExec, safeExecFile } from '@process/utils/safeExec';
import { validateMcpEnvEntry } from '../validateMcpServer';

/** Env options for exec calls - ensures CLI is found from Finder/launchd launches */
const getExecEnv = () => ({
  env: { ...getEnhancedEnv(), NODE_OPTIONS: '', TERM: 'dumb', NO_COLOR: '1' } as NodeJS.ProcessEnv,
});

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
    const installOperation = async () => {
      try {
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
              await safeExecFile('qwen', args, { timeout: 5000, ...getExecEnv() });
            } catch (error) {
              console.warn(`Failed to add MCP ${server.name} to Qwen Code:`, error);
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
              await safeExecFile('qwen', args, { timeout: 5000, ...getExecEnv() });
            } catch (error) {
              console.warn(`Failed to add MCP ${server.name} to Qwen Code:`, error);
            }
          }
        }
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(installOperation, 'name', { value: 'installMcpServers' });
    return this.withLock(installOperation);
  }

  /**
   * Remove an MCP server from the Qwen Code agent
   */
  removeMcpServer(mcpServerName: string): Promise<McpOperationResult> {
    const removeOperation = async () => {
      try {
        // Use Qwen CLI to remove an MCP server (try different scopes)
        // First try user scope (matches install), then try project scope
        try {
          const result = await safeExecFile('qwen', ['mcp', 'remove', mcpServerName, '-s', 'user'], {
            timeout: 5000,
            ...getExecEnv(),
          });

          // Check output to determine real successful removal
          if (result.stdout && result.stdout.includes('removed from user settings')) {
            return { success: true };
          } else if (result.stdout && result.stdout.includes('not found in user')) {
            // Server not in user scope; try project scope
            throw new Error('Server not found in user settings');
          } else {
            // Other cases: treat as success (backward compatibility)
            return { success: true };
          }
        } catch (userError) {
          // user scope failed; try project scope
          try {
            const result = await safeExecFile('qwen', ['mcp', 'remove', mcpServerName, '-s', 'project'], {
              timeout: 5000,
              ...getExecEnv(),
            });

            // Check output to determine real successful removal
            if (result.stdout && result.stdout.includes('removed from project settings')) {
              return { success: true };
            } else if (result.stdout && result.stdout.includes('not found in project')) {
              // Server not in project scope; fall back to config file
              throw new Error('Server not found in project settings', { cause: userError });
            } else {
              // Other cases: treat as success (backward compatibility)
              return { success: true };
            }
          } catch (projectError) {
            // CLI commands all failed; fall back to direct config-file manipulation
            const configPath = join(homedir(), '.qwen', 'client_config.json');

            if (!existsSync(configPath)) {
              return { success: true }; // Config file missing; consider it already removed
            }

            try {
              const config = JSON.parse(readFileSync(configPath, 'utf-8'));
              if (config.mcpServers && config.mcpServers[mcpServerName]) {
                delete config.mcpServers[mcpServerName];
                writeFileSync(configPath, JSON.stringify(config, null, 2));
              }
              return { success: true };
            } catch (fileError) {
              console.warn(`Failed to update config file ${configPath}:`, fileError);
              return { success: true }; // If config-file write fails, still treat as success
            }
          }
        }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(removeOperation, 'name', { value: 'removeMcpServer' });
    return this.withLock(removeOperation);
  }
}
