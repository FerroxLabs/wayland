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
import { safeExec, execErrorDetail } from '@process/utils/safeExec';
import { cliSafeMcpServerName } from '../validateMcpServer';
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
 * launches, and redirects every home-ish variable when an agent-config sandbox
 * is in force. `claude` resolves its config from `CLAUDE_CONFIG_DIR`, which
 * `agentCliEnv` sets: measured on 2026-08-23, `claude mcp add-json` under the
 * override wrote `<root>/.claude/.claude.json` and left the real
 * `~/.claude.json` byte-identical.
 */
const getExecEnv = () => ({ env: agentCliEnv() });

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
    const installOperation = async (): Promise<McpOperationResult> => {
      try {
        const failures: string[] = [];
        let timedOut = false;
        for (const server of mcpServers) {
          // Claude CLI rejects dots in names; use the CLI-safe form everywhere
          // (add + remove) so the keys match and removal stays clean.
          const cliName = cliSafeMcpServerName(server.name);
          if (server.transport.type === 'stdio') {
            const addJson = () =>
              runAgentCli('claude', ['mcp', 'add-json', '-s', 'user', cliName, buildClaudeStdioJsonConfig(server)], {
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
                  await runAgentCli('claude', ['mcp', 'remove', '-s', 'user', cliName], {
                    ...getExecEnv(),
                  });
                  await addJson();
                  console.log(`[ClaudeMcpAgent] Replaced existing MCP server: ${server.name}`);
                  continue;
                } catch (replaceError) {
                  const replaceDetail = agentCliFailureDetail(replaceError);
                  if (isAgentCliTimeout(replaceError)) timedOut = true;
                  console.warn(`Failed to replace MCP ${server.name} in Claude Code: ${replaceDetail}`);
                  failures.push(`${server.name}: ${replaceDetail}`);
                  continue;
                }
              }
              if (isAgentCliTimeout(error)) timedOut = true;
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
              await runAgentCli('claude', args, { ...getExecEnv() });
              console.log(`[ClaudeMcpAgent] Added MCP server: ${server.name}`);
            } catch (error) {
              const detail = agentCliFailureDetail(error);
              if (isAgentCliTimeout(error)) timedOut = true;
              console.warn(`Failed to add MCP ${server.name} to Claude Code: ${detail}`);
              failures.push(`${server.name}: ${detail}`);
            }
          } else {
            failures.push(
              `${server.name}: Claude Code does not support ${(server.transport as { type: string }).type} transport type`
            );
          }
        }
        return aggregatePublicationFailures('Claude Code', failures, timedOut);
      } catch (error) {
        return { success: false, outcome: 'failed', error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(installOperation, 'name', { value: 'installMcpServers' });
    return this.withLock(installOperation);
  }

  /**
   * Remove an MCP server from the Claude Code agent
   */
  removeMcpServer(mcpServerName: string): Promise<McpOperationResult> {
    const removeOperation = async (): Promise<McpOperationResult> => {
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
        const reports: RemovalScopeReport[] = [];

        for (const scope of scopes) {
          for (const candidateName of candidateNames) {
            try {
              const result = await runAgentCli(
                'claude',
                ['mcp', 'remove', '-s', scope, cliSafeMcpServerName(candidateName)],
                { ...getExecEnv() }
              );

              if (result.stdout && result.stdout.includes('removed')) {
                console.log(`[ClaudeMcpAgent] Removed MCP server from ${scope} scope: ${candidateName}`);
                reports.push({ scope, signal: 'removed' });
                return aggregateRemovalSignals('Claude Code', reports);
              }
              reports.push({ scope, signal: 'absent' });
            } catch (error) {
              const detail = execErrorDetail(error);

              // A killed child is an UNKNOWN, not an absence and not a
              // refusal. This is the exact state the user was shown as
              // "failed: Command timed out after 5000ms" - a sentence that
              // asserts more than we knew.
              if (isAgentCliTimeout(error)) {
                reports.push({ scope, signal: 'unknown', detail });
                continue;
              }

              if (isClaudeMcpAbsentDetail(detail)) {
                reports.push({ scope, signal: 'absent' });
                continue;
              }

              console.warn(`[ClaudeMcpAgent] Failed to remove from ${scope} scope: ${detail}`);
              reports.push({ scope: `${scope}/${candidateName}`, signal: 'error', detail });
            }
          }
        }

        return aggregateRemovalSignals('Claude Code', reports);
      } catch (error) {
        return { success: false, outcome: 'failed', error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(removeOperation, 'name', { value: 'removeMcpServer' });
    return this.withLock(removeOperation);
  }
}
