/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
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
import { safeExecFile, execErrorDetail } from '@process/utils/safeExec';
import { cliSafeMcpServerName } from '../validateMcpServer';
import { validateMcpEnvEntry } from '../validateMcpServer';

/** Env options for exec calls - ensures CLI is found from Finder/launchd launches */
const getExecEnv = () => ({
  env: { ...getEnhancedEnv(), NODE_OPTIONS: '', TERM: 'dumb', NO_COLOR: '1' } as NodeJS.ProcessEnv,
});

interface CodexMcpListEntry {
  name: string;
  enabled?: boolean;
  transport?: {
    type?: string;
    command?: string;
    args?: string[] | null;
    env?: Record<string, string> | null;
    env_vars?: Array<{ name?: string; value?: string }> | null;
    url?: string;
  };
}

function normalizeCodexEnv(entry: CodexMcpListEntry['transport']): Record<string, string> {
  const envFromObject = entry?.env;
  if (envFromObject && typeof envFromObject === 'object' && !Array.isArray(envFromObject)) {
    return Object.fromEntries(
      Object.entries(envFromObject).filter(
        (pair): pair is [string, string] => typeof pair[0] === 'string' && typeof pair[1] === 'string'
      )
    );
  }

  const envVars = entry?.env_vars;
  if (Array.isArray(envVars)) {
    return Object.fromEntries(
      envVars
        .filter(
          (item): item is { name: string; value: string } =>
            typeof item?.name === 'string' && typeof item?.value === 'string'
        )
        .map((item) => [item.name, item.value])
    );
  }

  return {};
}

export function parseCodexMcpListOutput(result: string): IMcpServer[] {
  const parsed = JSON.parse(result) as CodexMcpListEntry[];
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap((entry) => {
    if (!entry?.name || !entry.transport?.type) {
      return [];
    }

    const displayName =
      isBuiltinImageGenName(entry.name) || isBuiltinImageGenTransport(entry.transport)
        ? BUILTIN_IMAGE_GEN_NAME
        : entry.name;
    const env = normalizeCodexEnv(entry.transport);
    const transportType = entry.transport.type;
    let transport: IMcpServer['transport'] | null = null;

    if (transportType === 'stdio' && entry.transport.command) {
      transport = {
        type: 'stdio',
        command: entry.transport.command,
        args: entry.transport.args || [],
        env,
      };
    } else if ((transportType === 'http' || transportType === 'streamable_http') && entry.transport.url) {
      transport = {
        type: 'http',
        url: entry.transport.url,
      };
    } else if (transportType === 'sse' && entry.transport.url) {
      transport = {
        type: 'sse',
        url: entry.transport.url,
      };
    }

    if (!transport) {
      return [];
    }

    return [
      {
        id: `codex_${entry.name}`,
        name: displayName,
        transport,
        tools: [] as Array<{ name: string; description?: string }>,
        enabled: entry.enabled ?? true,
        status: 'connected' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        description: '',
        originalJson: JSON.stringify({ mcpServers: { [displayName]: transport } }, null, 2),
      },
    ];
  });
}

/**
 * Deterministic env var Codex reads an MCP server's bearer token from. Codex
 * ignores manual Authorization headers and only supports `--bearer-token-env-var`
 * for HTTP auth, so the same name must be derivable at `codex mcp add` time and
 * at agent-spawn time (where the live token is injected into the scoped env).
 */
export function codexBearerEnvVar(serverName: string): string {
  return `WAYLAND_MCP_BEARER_${cliSafeMcpServerName(serverName).replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`;
}

/**
 * Extract the OAuth bearer Wayland attached to an HTTP server (via
 * McpService.attachOAuthToken), if any. Returns null for non-HTTP transports or
 * when no Authorization: Bearer header is present.
 */
export function codexBearerToken(server: IMcpServer): string | null {
  if (server.transport.type !== 'http' && server.transport.type !== 'streamable_http') return null;
  const headers = 'headers' in server.transport ? server.transport.headers : undefined;
  if (!headers) return null;
  const auth = Object.entries(headers).find(([k]) => k.toLowerCase() === 'authorization')?.[1];
  if (!auth) return null;
  const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
  return match ? match[1] : null;
}

export function buildCodexAddArgs(server: IMcpServer): string[] | null {
  // Codex CLI rejects dots in the server name; use the CLI-safe form (the
  // remove path applies the identical transform so the keys stay in sync).
  const cliName = cliSafeMcpServerName(server.name);
  if (server.transport.type === 'stdio') {
    const args = ['mcp', 'add', cliName];

    for (const [key, value] of Object.entries(server.transport.env || {})) {
      // Reject argv-breaking keys/values before they ride into the
      // `--env KEY=VALUE` argv element (RT-B2-01 / RT-B2-03).
      validateMcpEnvEntry(server.name, key, String(value ?? ''));
      args.push('--env', `${key}=${value}`);
    }

    args.push('--', server.transport.command, ...(server.transport.args || []));
    return args;
  }

  if (server.transport.type === 'http' || server.transport.type === 'streamable_http') {
    const url = 'url' in server.transport ? server.transport.url : '';
    const args = ['mcp', 'add', cliName, '--url', url];
    // When Wayland holds an OAuth bearer for this server, register env-var auth
    // so Codex reads the token from a scoped env var instead of launching its
    // OWN interactive OAuth flow during `codex mcp add` (which opens the
    // provider's authorize page and dies on a throwaway 127.0.0.1 callback
    // port). The matching env var is set on the exec + the agent spawn.
    if (codexBearerToken(server)) {
      args.push('--bearer-token-env-var', codexBearerEnvVar(server.name));
    }
    return args;
  }

  return null;
}

/**
 * Codex CLI MCP agent implementation
 *
 * Manages MCP server configuration via the Codex CLI mcp subcommand
 * Codex CLI supports stdio and streamable HTTP (via --url) transport types
 */
export class CodexMcpAgent extends AbstractMcpAgent {
  constructor() {
    super('codex');
  }

  getSupportedTransports(): string[] {
    // Codex CLI supports stdio and streamable HTTP (via --url flag)
    return ['stdio', 'http', 'streamable_http'];
  }

  /**
   * Detect Codex CLI's MCP configuration
   */
  detectMcpServers(_cliPath?: string): Promise<IMcpServer[]> {
    const detectOperation = async () => {
      try {
        const { stdout: result } = await safeExecFile('codex', ['mcp', 'list', '--json'], {
          timeout: this.timeout,
          ...getExecEnv(),
        });

        if (!result.trim()) {
          return [];
        }

        const mcpServers = parseCodexMcpListOutput(result);

        for (const server of mcpServers) {
          try {
            const testResult = await this.testMcpConnection(server.transport);
            server.tools = testResult.tools || [];
            server.status = testResult.success ? 'connected' : 'disconnected';
          } catch (error) {
            console.warn(`[CodexMcpAgent] Failed to get tools for ${server.name}:`, error);
            server.status = 'disconnected';
          }
        }

        console.log(`[CodexMcpAgent] Detection complete: found ${mcpServers.length} server(s)`);
        return mcpServers;
      } catch (error) {
        console.warn('[CodexMcpAgent] Failed to get Codex MCP config:', error);
        return [];
      }
    };

    Object.defineProperty(detectOperation, 'name', { value: 'detectMcpServers' });
    return this.withLock(detectOperation);
  }

  /**
   * Install MCP servers into the Codex CLI
   */
  installMcpServers(mcpServers: IMcpServer[]): Promise<McpOperationResult> {
    const installOperation = async () => {
      try {
        for (const server of mcpServers) {
          const args = buildCodexAddArgs(server);
          if (!args) {
            console.warn(`Skipping ${server.name}: Codex CLI does not support ${server.transport.type} transport type`);
            continue;
          }

          // Codex ignores manual Authorization headers and only reads HTTP bearer
          // tokens from an env var (--bearer-token-env-var, set by buildCodexAddArgs).
          // Provide the token in a SCOPED env for THIS exec only - never via
          // process.env, which would leak the credential into every child process.
          const bearer = codexBearerToken(server);
          const execOptions = getExecEnv();
          if (bearer) {
            execOptions.env = { ...execOptions.env, [codexBearerEnvVar(server.name)]: bearer };
          }

          try {
            await safeExecFile('codex', args, { timeout: 5000, ...execOptions });
            console.log(`[CodexMcpAgent] Added MCP server: ${server.name}`);
          } catch (error) {
            console.warn(`Failed to add MCP ${server.name} to Codex: ${execErrorDetail(error)}`);
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
   * Remove an MCP server from the Codex CLI
   */
  removeMcpServer(mcpServerName: string): Promise<McpOperationResult> {
    const removeOperation = async () => {
      try {
        const candidateNames = Array.from(
          new Set(
            isBuiltinImageGenName(mcpServerName)
              ? [mcpServerName, BUILTIN_IMAGE_GEN_NAME, ...BUILTIN_IMAGE_GEN_LEGACY_NAMES]
              : [mcpServerName]
          )
        );

        for (const candidateName of candidateNames) {
          try {
            const result = await safeExecFile('codex', ['mcp', 'remove', cliSafeMcpServerName(candidateName)], {
              timeout: 5000,
              ...getExecEnv(),
            });

            // Check output to confirm successful removal
            if (result.stdout && (result.stdout.includes('removed') || result.stdout.includes('Removed'))) {
              console.log(`[CodexMcpAgent] Removed MCP server: ${candidateName}`);
              return { success: true };
            }

            if (result.stdout && (result.stdout.includes('not found') || result.stdout.includes('No such server'))) {
              continue;
            }

            // Other cases: treat as success (backward compatibility)
            return { success: true };
          } catch (cmdError) {
            const errorText = [
              cmdError instanceof Error ? cmdError.message : String(cmdError),
              (cmdError as { stdout?: string }).stdout || '',
              (cmdError as { stderr?: string }).stderr || '',
            ].join('\n');

            if (
              errorText.includes('not found') ||
              errorText.includes('does not exist') ||
              errorText.includes('No MCP server named')
            ) {
              continue;
            }

            return { success: false, error: cmdError instanceof Error ? cmdError.message : String(cmdError) };
          }
        }

        console.log(`[CodexMcpAgent] MCP server '${mcpServerName}' not found, nothing to remove`);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(removeOperation, 'name', { value: 'removeMcpServer' });
    return this.withLock(removeOperation);
  }
}
