/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import * as fs from 'fs';
import stripJsonComments from 'strip-json-comments';
import type { IMcpServer, IMcpServerTransport } from '@/common/config/storage';
import type { McpOperationResult } from '../McpProtocol';
import { AbstractMcpAgent } from '../McpProtocol';
import { agentConfigPath } from '../agentConfigRoot';
import { writeAtomic } from '@process/services/ijfw/atomicFile';

type OpencodeToolConfig = Record<string, boolean | undefined>;

type OpencodeLocalMcpEntry = {
  type: 'local';
  command?: string[] | string;
  environment?: Record<string, string>;
  enabled?: boolean;
  timeout?: number;
};

type OpencodeRemoteMcpEntry = {
  type: 'remote';
  url?: string;
  enabled?: boolean;
  headers?: Record<string, string>;
  oauth?: Record<string, unknown>;
  timeout?: number;
};

type OpencodeMcpEntry = OpencodeLocalMcpEntry | OpencodeRemoteMcpEntry;

type OpencodeConfig = {
  $schema?: string;
  mcp?: Record<string, OpencodeMcpEntry>;
  tools?: OpencodeToolConfig;
  [key: string]: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === 'string');
}

function sanitizeStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (pair): pair is [string, string] => typeof pair[0] === 'string' && typeof pair[1] === 'string'
    )
  );
}

function toOpencodeTransport(entry: OpencodeMcpEntry): IMcpServerTransport | null {
  if (entry.type === 'local') {
    if (Array.isArray(entry.command) && entry.command.length > 0) {
      return {
        type: 'stdio',
        command: entry.command[0],
        args: entry.command.slice(1),
        env: sanitizeStringRecord(entry.environment),
      };
    }

    if (typeof entry.command === 'string' && entry.command.trim()) {
      return {
        type: 'stdio',
        command: entry.command,
        args: [],
        env: sanitizeStringRecord(entry.environment),
      };
    }

    return null;
  }

  if (!entry.url || typeof entry.url !== 'string') {
    return null;
  }

  const headers = sanitizeStringRecord(entry.headers);
  // OpenCode's 'remote' type maps back to 'streamable_http' by default (lossy conversion:
  // both 'http' and 'streamable_http' are written as 'remote', so 'streamable_http' is the
  // safe default on read-back). SSE entries are identified by URL path heuristic.
  const remoteType = entry.url.includes('/sse') ? 'sse' : 'streamable_http';
  return {
    type: remoteType,
    url: entry.url,
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
  };
}

function toOpencodeEntry(transport: IMcpServerTransport): OpencodeMcpEntry | null {
  if (transport.type === 'stdio') {
    return {
      type: 'local',
      command: [transport.command, ...(transport.args || [])],
      ...(transport.env && Object.keys(transport.env).length > 0 ? { environment: transport.env } : {}),
      enabled: true,
    };
  }

  if (transport.type === 'http' || transport.type === 'streamable_http' || transport.type === 'sse') {
    return {
      type: 'remote',
      url: transport.url,
      ...(transport.headers && Object.keys(transport.headers).length > 0 ? { headers: transport.headers } : {}),
      enabled: true,
    };
  }

  return null;
}

function getOriginalJson(name: string, entry: OpencodeMcpEntry): string {
  return JSON.stringify(
    {
      mcp: {
        [name]: entry,
      },
    },
    null,
    2
  );
}

function resolveToolDisabled(name: string, tools: OpencodeToolConfig | undefined): boolean {
  if (!tools) return false;

  if (tools[name] === false) {
    return true;
  }

  const prefixedName = `${name}_*`;
  return tools[prefixedName] === false;
}

function getDefaultConfigPath(): string {
  // Through the ONE agent-config seam, never `os.homedir()`. This is a file
  // OpenCode owns and reads on startup; see agentConfigRoot.ts.
  return agentConfigPath('.config', 'opencode', 'opencode.json');
}

export function resolveOpencodeConfigPath(): string {
  const customPath = process.env.OPENCODE_CONFIG;
  if (customPath && customPath.trim()) {
    return customPath;
  }

  const jsonPath = getDefaultConfigPath();
  if (fs.existsSync(jsonPath)) {
    return jsonPath;
  }

  const jsoncPath = jsonPath.replace(/\.json$/i, '.jsonc');
  if (fs.existsSync(jsoncPath)) {
    return jsoncPath;
  }

  return jsonPath;
}

export function parseOpencodeConfig(content: string): OpencodeConfig {
  const parsed = JSON.parse(stripJsonComments(content)) as unknown;
  if (!isRecord(parsed)) {
    return {};
  }

  const config: OpencodeConfig = { ...parsed };
  if (!isRecord(config.mcp)) {
    config.mcp = {};
  }
  if (!isRecord(config.tools)) {
    config.tools = undefined;
  }
  return config;
}

/**
 * OpenCode MCP agent
 *
 * Reads and writes OpenCode MCP entries from opencode.json/jsonc.
 * Official config locations:
 * - OPENCODE_CONFIG
 * - ~/.config/opencode/opencode.json
 */
export class OpencodeMcpAgent extends AbstractMcpAgent {
  constructor() {
    super('opencode');
  }

  getSupportedTransports(): string[] {
    return ['stdio', 'sse', 'http', 'streamable_http'];
  }

  private readConfig(): OpencodeConfig | null {
    try {
      const configPath = resolveOpencodeConfigPath();
      if (!fs.existsSync(configPath)) {
        return null;
      }

      const content = fs.readFileSync(configPath, 'utf-8');
      return parseOpencodeConfig(content);
    } catch (error) {
      console.warn('[OpencodeMcpAgent] Failed to read opencode config:', error);
      return null;
    }
  }

  /**
   * Write OpenCode's config the only way it is safe to write a file another
   * product reads on startup.
   *
   * THREE GUARANTEES, and how each is obtained:
   *
   * 1. NEVER LEFT INVALID. The serialized text is parsed back before anything
   *    touches the real path. If our own output would not survive
   *    `parseOpencodeConfig`, we throw with the user's file untouched. Same
   *    posture the Kimi connector takes ("Refusing to write ...: the result
   *    would not be valid TOML").
   * 2. NEVER DROPS A SIBLING. Callers pass a spread of the parsed config, so
   *    every top-level key OpenCode or the user put there is carried through,
   *    and only the `mcp` map is edited. A read that FAILED (unparseable file,
   *    EACCES) returns null, and writing a fresh `{ mcp: ... }` over that would
   *    silently delete the whole file - so an unreadable-but-present config is
   *    refused instead.
   * 3. SAFE IF THE PROCESS DIES MID-WRITE. `writeAtomic` writes a temp sibling,
   *    fdatasyncs it, then renames over the target. A rename within one
   *    filesystem is atomic, so at every instant the path holds either the
   *    complete old file or the complete new one - never a truncated prefix.
   *    A crash before the rename leaves only an orphan dotfile.
   */
  private async writeConfig(config: OpencodeConfig): Promise<void> {
    const configPath = resolveOpencodeConfigPath();
    const serialized = `${JSON.stringify(config, null, 2)}\n`;

    try {
      parseOpencodeConfig(serialized);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Refusing to write ${configPath}: the result would not be valid JSON (${message})`, {
        cause: error,
      });
    }

    await writeAtomic(configPath, serialized);
  }

  /**
   * Read the config, distinguishing "no config" from "config we could not
   * read". The difference decides whether a write is allowed at all: an
   * absent file may be created, a present-but-unreadable one must never be
   * overwritten, because doing so discards everything the customer had.
   */
  private readConfigForWrite(): { config: OpencodeConfig; existed: boolean } {
    const configPath = resolveOpencodeConfigPath();
    if (!fs.existsSync(configPath)) {
      return { config: {}, existed: false };
    }
    const content = fs.readFileSync(configPath, 'utf-8');
    return { config: parseOpencodeConfig(content), existed: true };
  }

  detectMcpServers(_cliPath?: string): Promise<IMcpServer[]> {
    const detectOperation = async () => {
      const config = this.readConfig();
      if (!config?.mcp) {
        return [];
      }

      const mcpServers: IMcpServer[] = [];

      for (const [name, rawEntry] of Object.entries(config.mcp)) {
        if (!isRecord(rawEntry) || (rawEntry.type !== 'local' && rawEntry.type !== 'remote')) {
          continue;
        }

        const entry = rawEntry as OpencodeMcpEntry;
        const transport = toOpencodeTransport(entry);
        if (!transport) {
          continue;
        }

        const enabled = entry.enabled !== false && !resolveToolDisabled(name, config.tools);
        let tools: Array<{ name: string; description?: string }> = [];
        let status: IMcpServer['status'] = enabled ? 'connected' : 'disconnected';

        if (enabled) {
          try {
            const result = await this.testMcpConnection(transport);
            tools = result.tools || [];
            status = result.success ? 'connected' : 'disconnected';
          } catch (error) {
            console.warn(`[OpencodeMcpAgent] Failed to get tools for ${name}:`, error);
            status = 'disconnected';
          }
        }

        mcpServers.push({
          id: `opencode_${name}`,
          name,
          transport,
          tools,
          enabled,
          status,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          description: '',
          originalJson: getOriginalJson(name, entry),
        });
      }

      console.log(`[OpencodeMcpAgent] Detection complete: found ${mcpServers.length} server(s)`);
      return mcpServers;
    };

    Object.defineProperty(detectOperation, 'name', { value: 'detectMcpServers' });
    return this.withLock(detectOperation);
  }

  installMcpServers(mcpServers: IMcpServer[]): Promise<McpOperationResult> {
    const installOperation = async (): Promise<McpOperationResult> => {
      try {
        // Deliberately NOT `this.readConfig() || {}`. That swallowed a parse
        // or permission error into an empty object and then wrote it back,
        // erasing every provider, model and key the customer had in
        // opencode.json. An unreadable config must abort the publication.
        const { config } = this.readConfigForWrite();
        const existingMcp = isRecord(config.mcp) ? { ...config.mcp } : {};

        for (const server of mcpServers) {
          const entry = toOpencodeEntry(server.transport);
          if (!entry) {
            console.warn(`[OpencodeMcpAgent] Skipping unsupported transport for ${server.name}`);
            continue;
          }

          existingMcp[server.name] = entry;
        }

        await this.writeConfig({
          ...config,
          mcp: existingMcp,
        });

        return { success: true, outcome: 'applied' };
      } catch (error) {
        return { success: false, outcome: 'failed', error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(installOperation, 'name', { value: 'installMcpServers' });
    return this.withLock(installOperation);
  }

  removeMcpServer(mcpServerName: string): Promise<McpOperationResult> {
    const removeOperation = async (): Promise<McpOperationResult> => {
      try {
        const { config, existed } = this.readConfigForWrite();
        if (!existed || !isRecord(config.mcp) || !config.mcp[mcpServerName]) {
          // Nothing to remove. That is the goal state, not a failure.
          return { success: true, outcome: 'already-absent' };
        }

        const nextMcp = { ...config.mcp };
        delete nextMcp[mcpServerName];

        await this.writeConfig({
          ...config,
          mcp: nextMcp,
        });

        return { success: true, outcome: 'applied' };
      } catch (error) {
        return { success: false, outcome: 'failed', error: error instanceof Error ? error.message : String(error) };
      }
    };

    Object.defineProperty(removeOperation, 'name', { value: 'removeMcpServer' });
    return this.withLock(removeOperation);
  }
}
