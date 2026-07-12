/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';
import { parse, stringify } from 'smol-toml';
import { resolveActiveConfigPath } from '@process/agent/wcore/profilePaths';
import type { McpOperationResult } from '../McpProtocol';
import { AbstractMcpAgent } from '../McpProtocol';
import type { IMcpServer, IMcpServerTransport } from '@/common/config/storage';
import { ensurePlaywrightChromium } from '../playwrightBrowsers';
import { BUILTIN_PLAYWRIGHT_ID } from '@process/resources/builtinMcp/constants';

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
};

type WCoreConfigFile = {
  mcp?: {
    servers?: Record<string, WCoreServerConfig>;
  };
  [key: string]: unknown;
};

/**
 * Resolve the config.toml path that the ENGINE actually reads for the active
 * profile (Design B: `WAYLAND_HOME` = the active profile's config dir, set on
 * every spawn in envBuilder.ts). The settings-time sync MUST write to this same
 * file or the engine reads a config.toml that never got the connector.
 *
 * Previously this used `<binary> --config-path`, which always resolves the
 * NATIVE (default-profile) dir because the main process never has `WAYLAND_HOME`
 * set - so on a NAMED profile the sync wrote one file while the spawn read
 * another, and the connector was invisible in wcore. `resolveActiveConfigPath`
 * is the single source of truth both the spawn (`resolveActiveConfigDir`) and
 * the config bridge resolve through, so they can never disagree.
 *
 * #278: this FAILS CLOSED. The previous `--config-path` fallback was justified as
 * "backward-compatible for the default profile", but it was UNREACHABLE for the
 * default profile: resolveActiveConfigPath() -> resolveActiveConfigDir() can only
 * throw on its named-profile branch (see the invariant on resolveActiveConfigDir).
 * So the fallback could only ever fire while a NAMED profile was live - and it
 * resolved to the NATIVE (default-profile) dir, writing that profile's connector
 * into the DEFAULT profile's config.toml. That is the exact divergence the comment
 * above says this function was introduced to fix, reintroduced in its own catch.
 * Surface the failure instead of corrupting another profile's config.
 */
async function getActiveWCoreConfigPath(): Promise<string> {
  return resolveActiveConfigPath();
}

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
 * Convert a wayland IMcpServer to a wayland-core server config entry
 */
function toWCoreConfig(server: IMcpServer): WCoreServerConfig {
  const wcoreType = toWCoreTransportType(server.transport.type);

  if (server.transport.type === 'stdio') {
    const config: WCoreServerConfig = {
      transport: wcoreType,
      command: server.transport.command,
      args: server.transport.args?.length ? server.transport.args : undefined,
    };
    if (server.transport.env && Object.keys(server.transport.env).length > 0) {
      config.env = server.transport.env;
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
  return config;
}

/**
 * Wayland Core MCP agent implementation
 *
 * Manages MCP server configuration in the ACTIVE PROFILE's config directory
 * (see getActiveWCoreConfigPath()) — not the platform-native dir, which would be
 * the wrong file whenever a named profile is live (#278).
 * wayland-core uses TOML format with [mcp.servers.*] sections
 */
export class WCoreMcpAgent extends AbstractMcpAgent {
  constructor() {
    super('wcore');
  }

  getSupportedTransports(): string[] {
    // wayland-core supports stdio, sse, streamable-http (mapped to streamable_http in wayland)
    return ['stdio', 'sse', 'streamable_http'];
  }

  /**
   * Read and parse the wayland-core config file
   */
  private async readConfig(): Promise<WCoreConfigFile> {
    try {
      const content = await fs.readFile(await getActiveWCoreConfigPath(), 'utf-8');
      return parse(content) as WCoreConfigFile;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }

  /**
   * Write the wayland-core config file (preserving non-MCP sections)
   */
  private async writeConfig(config: WCoreConfigFile): Promise<void> {
    // Ensure directory exists. Write to the ACTIVE-PROFILE config.toml so the
    // engine spawn (which reads via WAYLAND_HOME = active profile dir) sees what
    // we wrote - not the native default-profile path the binary reports.
    const configPath = await getActiveWCoreConfigPath();
    await fs.mkdir(dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, stringify(config), 'utf-8');
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
    return this.withLock(detectOperation);
  }

  /**
   * Install MCP servers into wayland-core config.toml
   */
  installMcpServers(mcpServers: IMcpServer[]): Promise<McpOperationResult> {
    const installOperation = async () => {
      try {
        const config = await this.readConfig();

        // Ensure mcp.servers section exists
        if (!config.mcp) {
          config.mcp = { servers: {} };
        }
        if (!config.mcp.servers) {
          config.mcp.servers = {};
        }

        for (const server of mcpServers) {
          const supportedTypes = this.getSupportedTransports();
          if (!supportedTypes.includes(server.transport.type)) {
            console.warn(`[WCoreMcpAgent] Skipping ${server.name}: unsupported transport ${server.transport.type}`);
            continue;
          }
          config.mcp.servers[server.name] = toWCoreConfig(server);
          console.log(`[WCoreMcpAgent] Added MCP server: ${server.name}`);
        }

        await this.writeConfig(config);

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
    return this.withLock(installOperation);
  }

  /**
   * Remove an MCP server from wayland-core config.toml
   */
  removeMcpServer(mcpServerName: string): Promise<McpOperationResult> {
    const removeOperation = async () => {
      try {
        const config = await this.readConfig();
        const servers = config.mcp?.servers;

        if (!servers || !(mcpServerName in servers)) {
          console.log(`[WCoreMcpAgent] MCP server ${mcpServerName} not found (may already be removed)`);
          return { success: true };
        }

        delete servers[mcpServerName];
        await this.writeConfig(config);
        console.log(`[WCoreMcpAgent] Removed MCP server: ${mcpServerName}`);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(removeOperation, 'name', { value: 'removeMcpServer' });
    return this.withLock(removeOperation);
  }
}
