import { useState, useEffect, useCallback } from 'react';
import { ConfigStorage } from '@/common/config/storage';
import type { IMcpServer } from '@/common/config/storage';
import { ipcBridge } from '@/common';
import { migrateExistingServers } from './migrateExistingServers';

/**
 * MCP server state management hook.
 * Manages loading, saving, and updating the MCP server list.
 * Includes both user-configured MCP servers and extension-contributed MCP servers.
 */
export const useMcpServers = () => {
  const [mcpServers, setMcpServers] = useState<IMcpServer[]>([]);
  /** Extension-contributed MCP servers (read-only, from extensions) */
  const [extensionMcpServers, setExtensionMcpServers] = useState<IMcpServer[]>([]);

  // Load MCP server configuration
  useEffect(() => {
    // Load user-configured MCP servers
    void ConfigStorage.get('mcp.config')
      .then((data) => {
        if (data) {
          // One-time, idempotent migration: tag any server without an explicit
          // `source` as `source: 'custom'` so the new MCP Library Installed
          // page groups pre-library installs under "Custom". Persist only when
          // the migration actually changed something, so subsequent launches
          // are a no-op write.
          const migrated = migrateExistingServers(data);
          const changed = migrated.some((server, idx) => server !== data[idx]);
          if (changed) {
            void ConfigStorage.set('mcp.config', migrated).catch((error) => {
              console.error('[useMcpServers] Failed to persist source migration:', error);
            });
          }
          setMcpServers(migrated);
        }
      })
      .catch((error) => {
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
            status: 'connected' as const,
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
  }, []);

  // Save MCP server configuration (user-configured only; extension servers are not persisted)
  const saveMcpServers = useCallback((serversOrUpdater: IMcpServer[] | ((prev: IMcpServer[]) => IMcpServer[])) => {
    return new Promise<void>((resolve, reject) => {
      setMcpServers((prev) => {
        // Compute new value
        const newServers = typeof serversOrUpdater === 'function' ? serversOrUpdater(prev) : serversOrUpdater;

        // Persist to storage asynchronously (in a microtask)
        queueMicrotask(() => {
          ConfigStorage.set('mcp.config', newServers)
            .then(() => resolve())
            .catch((error) => {
              console.error('Failed to save MCP servers:', error);
              reject(error);
            });
        });

        return newServers;
      });
    });
  }, []);

  // Combined complete list (user-configured + extension-contributed)
  const allMcpServers = [...mcpServers, ...extensionMcpServers];

  return {
    mcpServers,
    allMcpServers,
    extensionMcpServers,
    setMcpServers,
    saveMcpServers,
  };
};
