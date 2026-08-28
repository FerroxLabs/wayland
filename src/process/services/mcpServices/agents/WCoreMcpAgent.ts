/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { mutateConfig, readConfig } from '@process/agent/wcore/configBridge';
import type { McpOperationResult } from '../McpProtocol';
import { AbstractMcpAgent } from '../McpProtocol';
import type { IMcpServer, IMcpServerTransport } from '@/common/config/storage';
import { ensurePlaywrightChromium } from '../playwrightBrowsers';
import { BUILTIN_PLAYWRIGHT_ID } from '@process/resources/builtinMcp/constants';
import {
  resolvePersistedMcpStdioSpawn,
  toRestartSafeBundledRuntimeCommand,
} from '@process/services/mcpServices/mcpStdioSpawn';

/**
 * wayland-core config.toml transport type (kebab-case)
 * Maps to wayland transport types (snake_case)
 */
type WCoreTransportType = 'stdio' | 'sse' | 'streamable-http';

type WCoreServerConfig = {
  transport: WCoreTransportType;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  /**
   * The user's per-server tool allow-list (#1167), written verbatim into
   * `[mcp.servers.<name>]`.
   *
   * POLARITY: an ALLOW-list whose EMPTY array is meaningful.
   *   undefined -> every tool enabled       []  -> NO tools enabled
   * The sibling `env`/`headers` fields above are guarded with
   * `Object.keys(...).length > 0`, which is exactly the shape that must NOT be
   * copied here: collapsing `[]` to absent enables every tool at the moment the
   * user asked for none. smol-toml renders `allowedTools = []` and parses it
   * back as an empty array, so the distinction survives the round trip.
   */
  allowedTools?: string[];
};

type WCoreConfigFile = {
  mcp?: {
    servers?: Record<string, WCoreServerConfig>;
  };
  [key: string]: unknown;
};

/**
 * Map wayland-core transport type (kebab-case) to wayland transport type
 */
function toWaylandTransportType(wcoreType: WCoreTransportType): IMcpServerTransport['type'] {
  if (wcoreType === 'streamable-http') return 'streamable_http';
  return wcoreType;
}

/**
 * Map wayland transport type to wayland-core transport type (kebab-case)
 */
function toWCoreTransportType(type: IMcpServerTransport['type']): WCoreTransportType {
  if (type === 'streamable_http') return 'streamable-http';
  if (type === 'http') return 'streamable-http';
  return type as WCoreTransportType;
}

/**
 * Convert a wayland-core server config entry to a wayland IMcpServer
 */
function toMcpServer(name: string, config: WCoreServerConfig): IMcpServer {
  const transportType = toWaylandTransportType(config.transport);
  const now = Date.now();

  const transport: IMcpServerTransport =
    transportType === 'stdio'
      ? {
          type: 'stdio',
          command: config.command || '',
          args: config.args || [],
          env: config.env || {},
        }
      : {
          type: transportType,
          url: config.url || '',
          headers: config.headers || {},
        };

  return {
    id: `wcore_${name}`,
    name,
    transport,
    tools: [],
    enabled: true,
    status: 'disconnected',
    createdAt: now,
    updatedAt: now,
    description: '',
    originalJson: JSON.stringify({ mcpServers: { [name]: config } }, null, 2),
  };
}

/**
 * How long the config.toml being written lives.
 *
 * `launchLocal` is the per-launch file `WCoreManager` rewrites on every start,
 * so an absolute bundled-runtime path in it is always the one this launch
 * resolved — and keeping it absolute is what makes the wcore launch tuple
 * byte-identical to the Library probe's. Everything else (the global/profile
 * config.toml) outlives the launch that wrote it and gets the restart-safe
 * portable command instead (#1056).
 */
export interface WCoreConfigSerializeOptions {
  launchLocal?: boolean;
}

/**
 * Convert a wayland IMcpServer to a wayland-core server config entry
 */
export function toWCoreConfig(server: IMcpServer, options: WCoreConfigSerializeOptions = {}): WCoreServerConfig {
  const wcoreType = toWCoreTransportType(server.transport.type);

  if (server.transport.type === 'stdio') {
    // Match the Library probe's bundled-Bun runtime without persisting an
    // AppImage mount path that becomes stale after a Linux restart.
    const spawn = resolvePersistedMcpStdioSpawn(server.transport.command, server.transport.args ?? []);
    const config: WCoreServerConfig = {
      transport: wcoreType,
      command: options.launchLocal ? spawn.command : toRestartSafeBundledRuntimeCommand(spawn.command),
      args: spawn.args.length ? spawn.args : undefined,
    };
    if (server.transport.env && Object.keys(server.transport.env).length > 0) {
      config.env = server.transport.env;
    }
    // #1167: presence-checked, NOT truthiness-checked - `[]` must survive.
    if (server.allowedTools !== undefined) {
      config.allowedTools = server.allowedTools;
    }
    return config;
  }

  const config: WCoreServerConfig = {
    transport: wcoreType,
    url: server.transport.url,
  };
  if (server.transport.headers && Object.keys(server.transport.headers).length > 0) {
    config.headers = server.transport.headers;
  }
  // #1167: this is the ONLY route hosted (http/sse) connectors take, so without
  // it the per-tool switches are inert on every hosted server.
  if (server.allowedTools !== undefined) {
    config.allowedTools = server.allowedTools;
  }
  return config;
}

/**
 * Wayland Core MCP agent implementation
 *
 * Manages MCP server configuration in the ACTIVE PROFILE's config directory
 * through the shared config bridge — not the platform-native dir, which would
 * be the wrong file whenever a named profile is live (#278). The shared bridge
 * also serializes this MCP mutation with tools/security/profile settings writes.
 * wayland-core uses TOML format with [mcp.servers.*] sections
 */
export class WCoreMcpAgent extends AbstractMcpAgent {
  /**
   * @param configPath  config.toml to write. Omitted = the active profile's.
   * @param launchLocal True only for a file the caller rewrites on every launch
   *   (`WCoreManager`'s launch-local config). Defaults to false so any file that
   *   survives the process gets the restart-safe portable command (#1056).
   */
  constructor(
    private readonly configPath?: string,
    private readonly launchLocal: boolean = false
  ) {
    super('wcore');
  }

  getSupportedTransports(): string[] {
    // Core's `streamable-http` config transport is represented by both `http`
    // and `streamable_http` in Desktop storage. `toWCoreTransportType` already
    // maps both forms; advertising only the latter made imported/plain URL MCPs
    // get skipped while the adapter still returned success.
    return ['stdio', 'sse', 'http', 'streamable_http'];
  }

  /**
   * Read and parse the wayland-core config file
   */
  private async readConfig(): Promise<WCoreConfigFile> {
    return (await readConfig(this.configPath)) as WCoreConfigFile;
  }

  /**
   * Detect MCP servers configured in wayland-core config.toml
   */
  detectMcpServers(_cliPath?: string): Promise<IMcpServer[]> {
    const detectOperation = async () => {
      try {
        const config = await this.readConfig();
        const servers = config.mcp?.servers;

        if (!servers || Object.keys(servers).length === 0) {
          return [];
        }

        const mcpServers = Object.entries(servers).map(([name, serverConfig]) =>
          toMcpServer(name, serverConfig as WCoreServerConfig)
        );

        console.log(`[WCoreMcpAgent] Detection complete: found ${mcpServers.length} server(s)`);
        return mcpServers;
      } catch (error) {
        console.warn('[WCoreMcpAgent] Failed to detect MCP servers:', error);
        return [];
      }
    };

    Object.defineProperty(detectOperation, 'name', { value: 'detectMcpServers' });
    return detectOperation();
  }

  /**
   * Install MCP servers into wayland-core config.toml
   */
  installMcpServers(mcpServers: IMcpServer[]): Promise<McpOperationResult> {
    const installOperation = async () => {
      try {
        for (const server of mcpServers) {
          const supportedTypes = this.getSupportedTransports();
          if (!supportedTypes.includes(server.transport.type)) {
            return {
              success: false,
              error: `${server.name}: Wayland Core does not support ${server.transport.type} transport type`,
            };
          }
        }
        await mutateConfig((rawConfig) => {
          const config = rawConfig as WCoreConfigFile;
          config.mcp ??= { servers: {} };
          config.mcp.servers ??= {};
          for (const server of mcpServers) {
            config.mcp.servers[server.name] = toWCoreConfig(server, { launchLocal: this.launchLocal });
            console.log(`[WCoreMcpAgent] Added MCP server: ${server.name}`);
          }
          return { value: undefined, changed: mcpServers.length > 0 };
        }, this.configPath);

        // #465 first-run browser provisioning: once the bundled Playwright MCP
        // is written to the engine config, make sure chromium is installed into
        // its managed dir so the agent's first browse finds it. Fire-and-forget
        // + guarded (one download ever), so it never blocks the sync.
        if (mcpServers.some((s) => s.id === BUILTIN_PLAYWRIGHT_ID)) {
          void ensurePlaywrightChromium();
        }

        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(installOperation, 'name', { value: 'installMcpServers' });
    return installOperation();
  }

  /**
   * Remove an MCP server from wayland-core config.toml
   */
  removeMcpServer(mcpServerName: string): Promise<McpOperationResult> {
    const removeOperation = async () => {
      try {
        const removed = await mutateConfig((rawConfig) => {
          const config = rawConfig as WCoreConfigFile;
          const servers = config.mcp?.servers;
          if (!servers || !(mcpServerName in servers)) return { value: false, changed: false };
          delete servers[mcpServerName];
          return { value: true, changed: true };
        }, this.configPath);
        if (!removed) {
          console.log(`[WCoreMcpAgent] MCP server ${mcpServerName} not found (may already be removed)`);
          return { success: true };
        }
        console.log(`[WCoreMcpAgent] Removed MCP server: ${mcpServerName}`);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(removeOperation, 'name', { value: 'removeMcpServer' });
    return removeOperation();
  }
}
