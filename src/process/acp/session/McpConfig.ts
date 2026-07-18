// src/process/acp/session/McpConfig.ts
import type { IMcpServer } from '@/common/config/storage';
import type { AcpMcpCapabilities } from '@/common/types/acpTypes';
import type { McpServer } from '@agentclientprotocol/sdk';
import { resolveMcpStdioSpawn } from '@process/services/mcpServices/mcpStdioSpawn';
import { isServerActiveForSession } from '@process/agent/acp/mcpSessionConfig';

type MergeParams = {
  userServers?: McpServer[];
  presetServers?: McpServer[];
  teamServer?: McpServer;
};

export type McpConfigOmission = {
  server: IMcpServer;
  reason: string;
};

export type McpConfigProjection = {
  servers: McpServer[];
  omissions: McpConfigOmission[];
  selectedServers: IMcpServer[];
};

/**
 * Default MCP capabilities used when no cached initialize result is available.
 * stdio is mandatory per ACP spec; http/sse are conservatively disabled.
 */
const DEFAULT_MCP_CAPABILITIES: AcpMcpCapabilities = { stdio: true, http: false, sse: false };

function toNameValueArray(source?: Record<string, string>): Array<{ name: string; value: string }> {
  if (!source) return [];
  return Object.entries(source)
    .filter(([n, v]) => typeof n === 'string' && typeof v === 'string')
    .map(([name, value]) => ({ name, value }));
}

// eslint-disable-next-line typescript-eslint/no-extraneous-class -- Static utility class matches project pattern
export class McpConfig {
  /**
   * Resolve the transport contract advertised by an initialized ACP agent.
   * Stdio is the ACP baseline; HTTP and SSE are opt-in capabilities and must
   * never be manufactured by the Desktop host.
   */
  static resolveCapabilities(capabilities?: AcpMcpCapabilities): AcpMcpCapabilities {
    return {
      stdio: capabilities?.stdio ?? true,
      http: capabilities?.http ?? false,
      sse: capabilities?.sse ?? false,
    };
  }

  static merge(params: MergeParams): McpServer[] {
    const { userServers = [], presetServers = [], teamServer } = params;
    const merged = new Map<string, McpServer>();
    for (const s of presetServers) merged.set(s.name, s);
    for (const s of userServers) merged.set(s.name, s);
    const result = Array.from(merged.values());
    if (teamServer) result.push(teamServer);
    return result;
  }

  /**
   * Convert user-configured MCP servers (from ProcessConfig / IMcpServer[])
   * to SDK McpServer[] with transport capability filtering.
   *
   * Only builtin + enabled + connected servers are included.
   * Transport types unsupported by the agent are dropped.
   *
   * @param servers  Raw server configs from `ProcessConfig.get('mcp.config')`
   * @param capabilities  Agent MCP capabilities (from cached init result).
   *                      Defaults to stdio-only when not available.
   */
  static fromStorageConfig(
    servers: IMcpServer[],
    capabilities?: AcpMcpCapabilities,
    activeServerIds?: readonly string[]
  ): McpServer[] {
    return McpConfig.projectStorageConfig(servers, capabilities, activeServerIds).servers;
  }

  /**
   * Project storage authority into ACP config without hiding eligible servers
   * that the negotiated transport contract cannot publish.
   */
  static projectStorageConfig(
    servers: IMcpServer[],
    capabilities?: AcpMcpCapabilities,
    activeServerIds?: readonly string[]
  ): McpConfigProjection {
    const caps = capabilities ?? DEFAULT_MCP_CAPABILITIES;
    const eligible = servers
      .filter(
        (s) =>
          // Wayland-managed builtin servers AND user-installed library/custom
          // servers (e.g. hosted OAuth Notion) must reach the chat session.
          // Restricting to builtin silently dropped every library MCP from the
          // session, so they were never callable in a chat. Still gated on
          // enabled + connected (or not-yet-probed) so a known-broken server
          // is not surfaced to the agent.
          (s.builtin === true || s.source === 'library' || s.source === 'custom') &&
          s.enabled &&
          (s.status === undefined || s.status === 'connected')
      )
      // This is an authority boundary, not a display preference. Builtins stay
      // available; user connectors must match this conversation's selection.
      .filter((server) => isServerActiveForSession(server, activeServerIds));
    const projected: McpServer[] = [];
    const omissions: McpConfigOmission[] = [];
    for (const server of eligible) {
      let runtimeServer: McpServer | undefined;
      let reason: string | undefined;
      switch (server.transport.type) {
        case 'stdio': {
          if (!caps.stdio) {
            reason = 'ACP runtime did not advertise stdio MCP transport support';
            break;
          }
          const spawn = resolveMcpStdioSpawn(server.transport.command, server.transport.args ?? []);
          runtimeServer = {
            name: server.name,
            command: spawn.command,
            args: spawn.args,
            env: toNameValueArray(server.transport.env),
          };
          break;
        }
        case 'http':
        case 'streamable_http':
          if (!caps.http) {
            reason = 'ACP runtime did not advertise HTTP MCP transport support';
            break;
          }
          runtimeServer = {
            type: 'http' as const,
            name: server.name,
            url: server.transport.url,
            headers: toNameValueArray(server.transport.headers),
          };
          break;
        case 'sse':
          if (!caps.sse) {
            reason = 'ACP runtime did not advertise SSE MCP transport support';
            break;
          }
          runtimeServer = {
            type: 'sse' as const,
            name: server.name,
            url: server.transport.url,
            headers: toNameValueArray(server.transport.headers),
          };
          break;
        default:
          reason = `ACP runtime cannot publish MCP transport: ${(server.transport as { type: string }).type}`;
      }
      if (runtimeServer) projected.push(runtimeServer);
      else omissions.push({ server, reason: reason ?? 'ACP runtime omitted MCP server' });
    }
    return { servers: projected, omissions, selectedServers: eligible };
  }
}
