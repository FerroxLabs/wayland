import { useState, useEffect, useCallback } from 'react';
import { ConfigStorage } from '@/common/config/storage';
import type { IMcpServer } from '@/common/config/storage';
import { ipcBridge } from '@/common';
import { migrateExistingServers } from './migrateExistingServers';

type McpConfigListener = (servers: IMcpServer[]) => void;

// MCP settings are rendered from several independent screens. Keep one
// renderer-wide durable mutation queue so those hook instances cannot race and
// overwrite each other's config snapshots.
let mcpConfigWriteQueue: Promise<void> = Promise.resolve();
const mcpConfigListeners = new Set<McpConfigListener>();

function publishMcpConfig(servers: IMcpServer[]): void {
  for (const listener of mcpConfigListeners) listener(servers);
}

function enqueueMcpConfigRead(): Promise<IMcpServer[]> {
  const operation = mcpConfigWriteQueue.then(async () => (await ConfigStorage.get('mcp.config')) ?? []);
  mcpConfigWriteQueue = operation.then(
    (): void => undefined,
    (): void => undefined
  );
  return operation;
}

function enqueueMcpConfigWrite(serversOrUpdater: IMcpServer[] | ((prev: IMcpServer[]) => IMcpServer[])): Promise<void> {
  const operation = mcpConfigWriteQueue.then(async () => {
    const persisted = (await ConfigStorage.get('mcp.config')) ?? [];
    const next = typeof serversOrUpdater === 'function' ? serversOrUpdater(persisted) : serversOrUpdater;
    await ConfigStorage.set('mcp.config', next);
    // Publish only after persistence succeeds. A rejected write must never
    // manufacture renderer state that the main process cannot subsequently use.
    publishMcpConfig(next);
  });
  mcpConfigWriteQueue = operation.catch((): void => undefined);
  return operation;
}

/**
 * MCP server state management hook.
 * Manages loading, saving, and updating the MCP server list.
 * Includes both user-configured MCP servers and extension-contributed MCP servers.
 */
export const useMcpServers = () => {
  const [mcpServers, setMcpServers] = useState<IMcpServer[]>([]);
  /** Extension-contributed MCP servers (read-only, from extensions) */
  const [extensionMcpServers, setExtensionMcpServers] = useState<IMcpServer[]>([]);

  useEffect(() => {
    const listener: McpConfigListener = (servers) => setMcpServers(servers);
    mcpConfigListeners.add(listener);
    return () => {
      mcpConfigListeners.delete(listener);
    };
  }, []);

  const refreshMcpServers = useCallback(async (): Promise<void> => {
    const data = await enqueueMcpConfigRead();
    // One-time, idempotent migration: tag any server without an explicit
    // `source` as `source: 'custom'` so the new MCP Library Installed page
    // groups pre-library installs under "Custom".
    const migrated = migrateExistingServers(data);
    const changed = migrated.some((server, idx) => server !== data[idx]);
    if (changed) {
      await enqueueMcpConfigWrite((persisted) => migrateExistingServers(persisted));
    } else {
      setMcpServers(migrated);
    }
  }, []);

  // Load MCP server configuration
  useEffect(() => {
    void refreshMcpServers().catch((error) => {
      console.error('[useMcpServers] Failed to load MCP config:', error);
    });

    // Load extension-contributed MCP servers
    void ipcBridge.extensions.getMcpServers
      .invoke()
      .then((extServers) => {
        if (extServers && extServers.length > 0) {
          const converted: IMcpServer[] = extServers.map((s) => ({
            id: String(s.id || ''),
            name: String(s.name || ''),
            description: s.description as string | undefined,
            enabled: s.enabled !== false,
            transport: s.transport as IMcpServer['transport'],
            // No status: an extension manifest declares a connector; it does
            // not prove that this server registered tools in the current chat.
            createdAt: (s.createdAt as number) || Date.now(),
            updatedAt: (s.updatedAt as number) || Date.now(),
            originalJson: String(s.originalJson || '{}'),
            _source: 'extension' as const,
            _extensionName: s._extensionName as string | undefined,
          })) as IMcpServer[];
          setExtensionMcpServers(converted);
        }
      })
      .catch((error) => {
        console.error('[useMcpServers] Failed to load extension MCP servers:', error);
      });
  }, [refreshMcpServers]);

  // Save MCP server configuration (user-configured only; extension servers are not persisted)
  const saveMcpServers = useCallback(
    (serversOrUpdater: IMcpServer[] | ((prev: IMcpServer[]) => IMcpServer[])) =>
      enqueueMcpConfigWrite(serversOrUpdater),
    []
  );

  // Combined complete list (user-configured + extension-contributed)
  const allMcpServers = [...mcpServers, ...extensionMcpServers];

  return {
    mcpServers,
    allMcpServers,
    extensionMcpServers,
    setMcpServers,
    saveMcpServers,
    refreshMcpServers,
  };
};
