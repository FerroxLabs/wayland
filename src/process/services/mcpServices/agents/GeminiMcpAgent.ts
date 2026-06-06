/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { McpOperationResult } from '../McpProtocol';
import { AbstractMcpAgent } from '../McpProtocol';
import type { IMcpServer } from '@/common/config/storage';
import { getEnhancedEnv } from '@process/utils/shellEnv';
import { safeExec, safeExecFile } from '@process/utils/safeExec';

/** Env options for exec calls - ensures CLI is found from Finder/launchd launches */
const getExecEnv = () => ({
  env: { ...getEnhancedEnv(), NODE_OPTIONS: '', TERM: 'dumb', NO_COLOR: '1' } as NodeJS.ProcessEnv,
});

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
    const installOperation = async () => {
      try {
        for (const server of mcpServers) {
          if (server.transport.type === 'stdio') {
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
              await safeExecFile('gemini', args, { timeout: 5000, ...getExecEnv() });
              console.log(`[GeminiMcpAgent] Added MCP server: ${server.name}`);
            } catch (error) {
              console.warn(`Failed to add MCP ${server.name} to Gemini:`, error);
              // Continue with other servers
            }
          } else if (
            server.transport.type === 'sse' ||
            server.transport.type === 'http' ||
            server.transport.type === 'streamable_http'
          ) {
            // Handle SSE/HTTP/Streamable HTTP transport types
            // Gemini CLI uses --transport http for both HTTP and Streamable HTTP
            const transportFlag = server.transport.type === 'streamable_http' ? 'http' : server.transport.type;
            // Pass name/url as separate argv elements (shell:false) so shell
            // metacharacters in any value cannot inject commands (SEC-MCP-01).
            const args = ['mcp', 'add', server.name, server.transport.url, '--transport', transportFlag, '-s', 'user'];

            try {
              await safeExecFile('gemini', args, { timeout: 5000, ...getExecEnv() });
              console.log(`[GeminiMcpAgent] Added MCP server: ${server.name}`);
            } catch (error) {
              console.warn(`Failed to add MCP ${server.name} to Gemini:`, error);
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
   * Remove an MCP server from the Google Gemini CLI
   */
  removeMcpServer(mcpServerName: string): Promise<McpOperationResult> {
    const removeOperation = async () => {
      try {
        // Use Gemini CLI to remove an MCP server
        // First try user scope
        try {
          const result = await safeExecFile('gemini', ['mcp', 'remove', mcpServerName, '-s', 'user'], {
            timeout: 5000,
            ...getExecEnv(),
          });

          if (result.stdout && result.stdout.includes('removed')) {
            console.log(`[GeminiMcpAgent] Removed MCP server: ${mcpServerName}`);
            return { success: true };
          } else if (result.stdout && result.stdout.includes('not found')) {
            // Try project scope
            throw new Error('Server not found in user scope');
          } else {
            return { success: true };
          }
        } catch (userError) {
          // Try project scope
          try {
            const result = await safeExecFile('gemini', ['mcp', 'remove', mcpServerName, '-s', 'project'], {
              timeout: 5000,
              ...getExecEnv(),
            });

            if (result.stdout && result.stdout.includes('removed')) {
              console.log(`[GeminiMcpAgent] Removed MCP server from project: ${mcpServerName}`);
              return { success: true };
            } else {
              // Server does not exist; still treat as success
              return { success: true };
            }
          } catch (projectError) {
            // If the server does not exist, still treat as success
            if (userError instanceof Error && userError.message.includes('not found')) {
              return { success: true };
            }
            return { success: false, error: userError instanceof Error ? userError.message : String(userError) };
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
