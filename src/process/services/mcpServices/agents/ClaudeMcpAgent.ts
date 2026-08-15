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
import {
  BUILTIN_IMAGE_GEN_LEGACY_NAMES,
  BUILTIN_IMAGE_GEN_NAME,
  isBuiltinImageGenName,
  isBuiltinImageGenTransport,
} from '@process/resources/builtinMcp/constants';
import { getEnhancedEnv } from '@process/utils/shellEnv';
import { safeExec, safeExecFile, execErrorDetail } from '@process/utils/safeExec';
import { cliSafeMcpServerName } from '../validateMcpServer';

/** Env options for exec calls - ensures CLI is found from Finder/launchd launches */
const getExecEnv = () => ({
  env: { ...getEnhancedEnv(), NODE_OPTIONS: '', TERM: 'dumb', NO_COLOR: '1' } as NodeJS.ProcessEnv,
});

export function buildClaudeStdioJsonConfig(server: IMcpServer): string {
  if (server.transport.type !== 'stdio') {
    throw new Error('Claude stdio JSON config requires a stdio transport');
  }

  return JSON.stringify({
    command: server.transport.command,
    args: server.transport.args || [],
    env: server.transport.env || {},
  });
}

/**
 * True when a failed `claude mcp add-json` failed only because the name is
 * already taken.
 *
 * `claude mcp add-json` is not an upsert: it exits 1 with
 * `MCP server <name> already exists in <scope> config` rather than replacing
 * the entry. Only the stdio publication path uses `add-json` - the HTTP/SSE
 * path uses `claude mcp add`, which overwrites and exits 0 - so without this,
 * re-publishing an stdio connector always fails while the same operation on a
 * remote connector always succeeds. Re-publication is the ordinary case
 * (reconnect, enable, edit-and-save, or a name already present in the user's
 * own Claude config), and a failed publication is rolled back and recorded as
 * a publication divergence the connector cannot leave.
 *
 * Matched against {@link execErrorDetail}, not `error.message`: `safeExecFile`
 * rejects with the fixed string `Command failed with exit code 1` and carries
 * the CLI's own words on the `stderr` property.
 */
export function isClaudeMcpNameTakenDetail(detail: string): boolean {
  return detail.includes('already exists');
}

/**
 * True when a failed `claude mcp remove` failed only because there was nothing
 * to remove.
 *
 * `claude mcp remove -s <scope> <absent>` exits 1 and writes
 * `No MCP server named "<name>" in <scope> scope` (or `... in .mcp.json` for
 * project scope) to stderr. Removal is the rollback half of publication, so
 * treating absence as a failure turns any partially-published connector into a
 * permanently stuck one: the rollback "fails", divergence is recorded, and
 * every later reconnect rolls back through the same absent-remove.
 *
 * Neither `not found` nor `does not exist` appears in any of those messages,
 * and the check previously read `error.message` - which `safeExecFile` fixes
 * to `Command failed with exit code 1` - so absence could never be detected.
 * CodexMcpAgent already classifies on the joined output for this reason.
 */
export function isClaudeMcpAbsentDetail(detail: string): boolean {
  return detail.includes('No MCP server named') || detail.includes('not found') || detail.includes('does not exist');
}

/**
 * Claude Code MCP agent implementation
 * Claude CLI supports stdio, sse, http transport types
 */
export class ClaudeMcpAgent extends AbstractMcpAgent {
  constructor() {
    super('claude');
  }

  getSupportedTransports(): string[] {
    // Claude CLI supports stdio, sse, http transport types (streamable_http maps to http)
    return ['stdio', 'sse', 'http', 'streamable_http'];
  }

  /**
   * Detect Claude Code's MCP configuration
   */
  detectMcpServers(_cliPath?: string): Promise<IMcpServer[]> {
    const detectOperation = async () => {
      try {
        // Use Claude Code CLI command to get MCP configuration
        const { stdout: result } = await safeExec('claude mcp list', {
          timeout: this.timeout,
          ...getExecEnv(),
        });

        // If no MCP servers are configured, return an empty array
        if (result.includes('No MCP servers configured') || !result.trim()) {
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

          // Match formats like: "12306-mcp: npx -y 12306-mcp - ✓ Connected" or "12306-mcp: npx -y 12306-mcp - ✗ Failed to connect"
          // Supports multiple status texts
          const match = cleanLine.match(/^([^:]+):\s+(.+?)\s*-\s*[✓✗]\s*(.+)$/);
          if (match) {
            const [, name, commandStr, statusText] = match;
            const commandParts = commandStr.trim().split(/\s+/);
            const command = commandParts[0];
            const args = commandParts.slice(1);
            const displayName =
              isBuiltinImageGenName(name.trim()) || isBuiltinImageGenTransport({ command, args })
                ? BUILTIN_IMAGE_GEN_NAME
                : name.trim();

            // Parse status: Connected, Disconnected, Failed to connect, etc.
            const isConnected =
              statusText.toLowerCase().includes('connected') && !statusText.toLowerCase().includes('disconnect');
            const status = isConnected ? 'connected' : 'disconnected';

            // Build transport object
            const transportObj = {
              type: 'stdio' as const,
              command: command,
              args: args,
              env: {},
            };

            // Try to fetch tools info (for all connected servers)
            let tools: Array<{ name: string; description?: string }> = [];
            if (isConnected) {
              try {
                const testResult = await this.testMcpConnection(transportObj);
                tools = testResult.tools || [];
              } catch (error) {
                console.warn(`[ClaudeMcpAgent] Failed to get tools for ${name.trim()}:`, error);
                // If fetching tools fails, fall back to an empty array
              }
            }

            mcpServers.push({
              id: `claude_${name.trim()}`,
              name: displayName,
              transport: transportObj,
              tools: tools,
              enabled: true,
              status: status,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              description: '',
              originalJson: JSON.stringify(
                {
                  mcpServers: {
                    [displayName]: {
                      command: command,
                      args: args,
                      description: `Detected from Claude CLI`,
                    },
                  },
                },
                null,
                2
              ),
            });
          }
        }

        console.log(`[ClaudeMcpAgent] Detection complete: found ${mcpServers.length} server(s)`);
        return mcpServers;
      } catch (error) {
        console.warn('[ClaudeMcpAgent] Failed to detect MCP servers:', error);
        return [];
      }
    };

    // Use a named function so it appears in logs
    Object.defineProperty(detectOperation, 'name', { value: 'detectMcpServers' });
    return this.withLock(detectOperation);
  }

  /**
   * Install MCP servers into the Claude Code agent
   */
  installMcpServers(mcpServers: IMcpServer[]): Promise<McpOperationResult> {
    const installOperation = async () => {
      try {
        const failures: string[] = [];
        for (const server of mcpServers) {
          // Claude CLI rejects dots in names; use the CLI-safe form everywhere
          // (add + remove) so the keys match and removal stays clean.
          const cliName = cliSafeMcpServerName(server.name);
          if (server.transport.type === 'stdio') {
            const addJson = () =>
              safeExecFile('claude', ['mcp', 'add-json', '-s', 'user', cliName, buildClaudeStdioJsonConfig(server)], {
                timeout: 5000,
                ...getExecEnv(),
              });
            try {
              await addJson();
              console.log(`[ClaudeMcpAgent] Added MCP server: ${server.name}`);
            } catch (error) {
              const detail = execErrorDetail(error);
              // `add-json` refuses a name that is already present, so publish as
              // an upsert: drop the existing entry and add the current
              // declaration. Removal is scoped to `user`, the only scope this
              // agent writes, so a user's own project/local entry is untouched.
              if (isClaudeMcpNameTakenDetail(detail)) {
                try {
                  await safeExecFile('claude', ['mcp', 'remove', '-s', 'user', cliName], {
                    timeout: 5000,
                    ...getExecEnv(),
                  });
                  await addJson();
                  console.log(`[ClaudeMcpAgent] Replaced existing MCP server: ${server.name}`);
                  continue;
                } catch (replaceError) {
                  const replaceDetail = execErrorDetail(replaceError);
                  console.warn(`Failed to replace MCP ${server.name} in Claude Code: ${replaceDetail}`);
                  failures.push(`${server.name}: ${replaceDetail}`);
                  continue;
                }
              }
              console.warn(`Failed to add MCP ${server.name} to Claude Code: ${detail}`);
              failures.push(`${server.name}: ${detail}`);
            }
          } else if (
            server.transport.type === 'sse' ||
            server.transport.type === 'http' ||
            server.transport.type === 'streamable_http'
          ) {
            // Handle SSE/HTTP/Streamable HTTP transport types
            // Claude CLI uses --transport http for both HTTP and Streamable HTTP
            // Format: claude mcp add -s user --transport <type> <name> <url> [--header ...]
            const transportFlag = server.transport.type === 'streamable_http' ? 'http' : server.transport.type;
            // Pass name/url/headers as separate argv elements (shell:false) so
            // shell metacharacters in any value cannot inject commands (SEC-MCP-01).
            const args = ['mcp', 'add', '-s', 'user', '--transport', transportFlag, cliName, server.transport.url];

            // Add headers
            if (server.transport.headers) {
              for (const [key, value] of Object.entries(server.transport.headers)) {
                args.push('--header', `${key}: ${value}`);
              }
            }

            try {
              await safeExecFile('claude', args, {
                timeout: 5000,
                ...getExecEnv(),
              });
              console.log(`[ClaudeMcpAgent] Added MCP server: ${server.name}`);
            } catch (error) {
              const detail = execErrorDetail(error);
              console.warn(`Failed to add MCP ${server.name} to Claude Code: ${detail}`);
              failures.push(`${server.name}: ${detail}`);
            }
          } else {
            failures.push(
              `${server.name}: Claude Code does not support ${(server.transport as { type: string }).type} transport type`
            );
          }
        }
        return failures.length === 0 ? { success: true } : { success: false, error: failures.join('; ') };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(installOperation, 'name', { value: 'installMcpServers' });
    return this.withLock(installOperation);
  }

  /**
   * Remove an MCP server from the Claude Code agent
   */
  removeMcpServer(mcpServerName: string): Promise<McpOperationResult> {
    const removeOperation = async () => {
      try {
        // Use Claude CLI command to remove MCP server (try different scopes)
        // Order: user (Wayland default) -> local -> project
        // user scope first, because Wayland installs use user scope
        const scopes = ['user', 'local', 'project'] as const;
        const candidateNames = Array.from(
          new Set(
            isBuiltinImageGenName(mcpServerName)
              ? [mcpServerName, BUILTIN_IMAGE_GEN_NAME, ...BUILTIN_IMAGE_GEN_LEGACY_NAMES]
              : [mcpServerName]
          )
        );
        const failures: string[] = [];

        for (const scope of scopes) {
          for (const candidateName of candidateNames) {
            try {
              const result = await safeExecFile(
                'claude',
                ['mcp', 'remove', '-s', scope, cliSafeMcpServerName(candidateName)],
                {
                  timeout: 5000,
                  ...getExecEnv(),
                }
              );

              if (result.stdout && result.stdout.includes('removed')) {
                console.log(`[ClaudeMcpAgent] Removed MCP server from ${scope} scope: ${candidateName}`);
                return { success: true };
              }
            } catch (error) {
              const detail = execErrorDetail(error);

              if (isClaudeMcpAbsentDetail(detail)) {
                continue;
              }

              console.warn(`[ClaudeMcpAgent] Failed to remove from ${scope} scope: ${detail}`);
              failures.push(`${scope}/${candidateName}: ${detail}`);
            }
          }
        }

        if (failures.length > 0) return { success: false, error: failures.join('; ') };
        // Every scope explicitly reported absence.
        console.log(`[ClaudeMcpAgent] MCP server ${mcpServerName} not found in any scope (may already be removed)`);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(removeOperation, 'name', { value: 'removeMcpServer' });
    return this.withLock(removeOperation);
  }
}
