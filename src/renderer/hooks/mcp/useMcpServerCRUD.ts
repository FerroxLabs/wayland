import type React from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Message } from '@arco-design/web-react';
import { ConfigStorage } from '@/common/config/storage';
import type { IMcpServer } from '@/common/config/storage';

/**
 * MCP server CRUD operations hook.
 * Handles add/edit/delete and enable/disable for MCP servers.
 */
export const useMcpServerCRUD = (
  mcpServers: IMcpServer[],
  saveMcpServers: (serversOrUpdater: IMcpServer[] | ((prev: IMcpServer[]) => IMcpServer[])) => Promise<void>,
  syncMcpToAgents: (server: IMcpServer, skipRecheck?: boolean) => Promise<void>,
  removeMcpFromAgents: (serverName: string, successMessage?: string, transportType?: string) => Promise<void>,
  checkSingleServerInstallStatus: (serverName: string) => Promise<void>,
  setAgentInstallStatus: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
) => {
  const { t } = useTranslation();

  // Add MCP server
  const handleAddMcpServer = useCallback(
    async (serverData: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = Date.now();
      let serverToSync: IMcpServer | null = null;

      // Use functional update to avoid stale-closure issues
      await saveMcpServers((prevServers) => {
        const existingServerIndex = prevServers.findIndex((server) => server.name === serverData.name);

        if (existingServerIndex !== -1) {
          // If a server with the same name exists, update the existing one
          const updatedServers = [...prevServers];
          updatedServers[existingServerIndex] = {
            ...updatedServers[existingServerIndex],
            ...serverData,
            updatedAt: now,
          };
          serverToSync = updatedServers[existingServerIndex];
          return updatedServers;
        } else {
          // If no server with the same name exists, add a new server
          const newServer: IMcpServer = {
            ...serverData,
            id: `mcp_${now}`,
            createdAt: now,
            updatedAt: now,
          };
          serverToSync = newServer;
          return [...prevServers, newServer];
        }
      });

      // Check install status
      if (serverToSync) {
        setTimeout(() => void checkSingleServerInstallStatus(serverToSync.name), 100);
      }

      // Return the newly added/updated server for subsequent connection testing
      return serverToSync;
    },
    [saveMcpServers, syncMcpToAgents, t, checkSingleServerInstallStatus]
  );

  // Batch-import MCP servers
  const handleBatchImportMcpServers = useCallback(
    async (serversData: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>[]) => {
      const now = Date.now();
      const addedServers: IMcpServer[] = [];

      // Use functional update to avoid stale-closure issues
      await saveMcpServers((prevServers) => {
        const updatedServers = [...prevServers];

        serversData.forEach((serverData, index) => {
          const existingServerIndex = updatedServers.findIndex((server) => server.name === serverData.name);

          if (existingServerIndex !== -1) {
            // If a server with the same name exists, update the existing one
            updatedServers[existingServerIndex] = {
              ...updatedServers[existingServerIndex],
              ...serverData,
              updatedAt: now,
            };
          } else {
            // If no server with the same name exists, add a new server
            const newServer: IMcpServer = {
              ...serverData,
              id: `mcp_${now}_${index}`,
              createdAt: now,
              updatedAt: now,
            };
            updatedServers.push(newServer);
            addedServers.push(newServer);
          }
        });

        return updatedServers;
      });

      // Check install status
      setTimeout(() => {
        serversData.forEach((serverData) => {
          void checkSingleServerInstallStatus(serverData.name);
        });
      }, 100);

      // Return list of newly added servers for subsequent connection testing
      return addedServers;
    },
    [saveMcpServers, syncMcpToAgents, t, checkSingleServerInstallStatus]
  );

  // Edit MCP server
  const handleEditMcpServer = useCallback(
    async (
      editingMcpServer: IMcpServer | undefined,
      serverData: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<IMcpServer | undefined> => {
      if (!editingMcpServer) return undefined;

      let updatedServer: IMcpServer | undefined;

      // Use functional update to avoid stale-closure issues
      await saveMcpServers((prevServers) => {
        updatedServer = {
          ...editingMcpServer,
          ...serverData,
          updatedAt: Date.now(),
        };

        return prevServers.map((server) => (server.id === editingMcpServer.id ? updatedServer : server));
      });

      Message.success(t('settings.mcpImportSuccess'));
      // Immediately re-check install status for this server after editing (install status only)
      setTimeout(() => void checkSingleServerInstallStatus(serverData.name), 100);

      // Return the updated server object for subsequent connection testing
      return updatedServer;
    },
    [saveMcpServers, t, checkSingleServerInstallStatus]
  );

  // Delete MCP server
  const handleDeleteMcpServer = useCallback(
    async (serverId: string) => {
      let targetServer: IMcpServer | undefined;

      // Use functional update to avoid stale-closure issues
      await saveMcpServers((prevServers) => {
        targetServer = prevServers.find((server) => server.id === serverId);
        if (!targetServer) return prevServers;

        return prevServers.filter((server) => server.id !== serverId);
      });

      if (!targetServer) return;

      // After deletion, update install status directly without triggering detection
      setAgentInstallStatus((prev) => {
        const updated = { ...prev };
        delete updated[targetServer.name];
        // Also update local storage
        void ConfigStorage.set('mcp.agentInstallStatus', updated).catch(() => {
          // Handle storage error silently
        });
        return updated;
      });

      try {
        // If the server is enabled, remove the MCP config from all agents
        if (targetServer.enabled) {
          await removeMcpFromAgents(
            targetServer.name,
            t('settings.mcpDeletedWithCleanup'),
            targetServer.transport.type
          );
        } else {
          Message.success(t('settings.mcpDeleted'));
        }
      } catch (error) {
        Message.error(t('settings.mcpDeleteError'));
      }
    },
    [saveMcpServers, setAgentInstallStatus, removeMcpFromAgents, t]
  );

  // Enable/disable MCP server
  const handleToggleMcpServer = useCallback(
    async (serverId: string, enabled: boolean) => {
      let targetServer: IMcpServer | undefined;
      let updatedTargetServer: IMcpServer | undefined;

      // Use functional update to avoid stale-closure issues
      await saveMcpServers((prevServers) => {
        targetServer = prevServers.find((server) => server.id === serverId);
        if (!targetServer) return prevServers;

        return prevServers.map((server) => {
          if (server.id === serverId) {
            updatedTargetServer = { ...server, enabled, updatedAt: Date.now() };
            return updatedTargetServer;
          }
          return server;
        });
      });

      if (!targetServer || !updatedTargetServer) return;

      try {
        if (enabled) {
          // If the MCP server is enabled, sync only the current server to all detected agents
          await syncMcpToAgents(updatedTargetServer, true);
          // Immediately re-check install status after enabling (install status only)
          setTimeout(() => void checkSingleServerInstallStatus(targetServer.name), 100);
        } else {
          // If the MCP server is disabled, remove the config from all agents
          await removeMcpFromAgents(targetServer.name, undefined, targetServer.transport.type);
          // After disabling, update UI state directly; no re-detection needed
          setAgentInstallStatus((prev) => {
            const updated = { ...prev };
            delete updated[targetServer.name];
            // Also update local storage
            void ConfigStorage.set('mcp.agentInstallStatus', updated).catch(() => {
              // Handle storage error silently
            });
            return updated;
          });
        }
      } catch (error) {
        Message.error(enabled ? t('settings.mcpSyncError') : t('settings.mcpRemoveError'));
      }
    },
    [saveMcpServers, syncMcpToAgents, removeMcpFromAgents, checkSingleServerInstallStatus, setAgentInstallStatus, t]
  );

  return {
    handleAddMcpServer,
    handleBatchImportMcpServers,
    handleEditMcpServer,
    handleDeleteMcpServer,
    handleToggleMcpServer,
  };
};
