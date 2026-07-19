import type React from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Message } from '@arco-design/web-react';
import { ConfigStorage } from '@/common/config/storage';
import type { IMcpServer } from '@/common/config/storage';
import { mcpServerCollisionKey } from '@/common/mcp';
import { acpConversation, mcpService } from '@/common/adapter/ipcBridge';
import { archiveConfiguredMcpServerHttp } from '@/renderer/services/McpConfigService';
import { isElectronDesktop } from '@/renderer/utils/platform';

/**
 * MCP server CRUD operations hook.
 * Handles add/edit/delete and enable/disable for MCP servers.
 */
export const useMcpServerCRUD = (
  mcpServers: IMcpServer[],
  saveMcpServers: (serversOrUpdater: IMcpServer[] | ((prev: IMcpServer[]) => IMcpServer[])) => Promise<void>,
  syncMcpToAgents: (server: IMcpServer, skipRecheck?: boolean) => Promise<unknown>,
  removeMcpFromAgents: (serverName: string, successMessage?: string, transportType?: string) => Promise<unknown>,
  checkSingleServerInstallStatus: (serverName: string) => Promise<void>,
  setAgentInstallStatus: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
  refreshMcpServers: () => Promise<void>
) => {
  const { t } = useTranslation();

  // Add MCP server
  const handleAddMcpServer = useCallback(
    async (serverData: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = Date.now();
      let serverToSync: IMcpServer | null = null;
      const existingPublished = mcpServers.find(
        (server) => mcpServerCollisionKey(server.name) === mcpServerCollisionKey(serverData.name) && server.enabled
      );

      // Add/import is declaration persistence, never adapter publication. If
      // this replaces an already-enabled definition, revoke that old
      // publication first so storage cannot diverge from an agent config.
      if (existingPublished) {
        await removeMcpFromAgents(existingPublished.name, undefined, existingPublished.transport.type);
      }

      const savedDeclaration: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'> = {
        ...serverData,
        enabled: false,
        status: 'disconnected' as const,
        tools: undefined,
        lastConnected: undefined,
        lastError: undefined,
      };

      // Use functional update to avoid stale-closure issues
      await saveMcpServers((prevServers) => {
        const incomingKey = mcpServerCollisionKey(serverData.name);
        const existingServerIndex = prevServers.findIndex(
          (server) => mcpServerCollisionKey(server.name) === incomingKey
        );

        if (existingServerIndex !== -1) {
          // If a server with the same name exists, update the existing one
          const updatedServers = [...prevServers];
          updatedServers[existingServerIndex] = {
            ...updatedServers[existingServerIndex],
            ...savedDeclaration,
            updatedAt: now,
          };
          serverToSync = updatedServers[existingServerIndex];
          return updatedServers;
        } else {
          // If no server with the same name exists, add a new server
          const newServer: IMcpServer = {
            ...savedDeclaration,
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
    [mcpServers, saveMcpServers, removeMcpFromAgents, checkSingleServerInstallStatus]
  );

  // Batch-import MCP servers
  const handleBatchImportMcpServers = useCallback(
    async (serversData: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>[]) => {
      const now = Date.now();
      const addedServers: IMcpServer[] = [];

      const incomingKeys = new Set(serversData.map((server) => mcpServerCollisionKey(server.name)));
      const existingPublished = mcpServers.filter(
        (server) => server.enabled && incomingKeys.has(mcpServerCollisionKey(server.name))
      );
      await Promise.all(
        existingPublished.map((server) => removeMcpFromAgents(server.name, undefined, server.transport.type))
      );

      // Use functional update to avoid stale-closure issues
      await saveMcpServers((prevServers) => {
        const updatedServers = [...prevServers];

        serversData.forEach((serverData, index) => {
          const savedDeclaration: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'> = {
            ...serverData,
            enabled: false,
            status: 'disconnected' as const,
            tools: undefined,
            lastConnected: undefined,
            lastError: undefined,
          };
          const incomingKey = mcpServerCollisionKey(serverData.name);
          const existingServerIndex = updatedServers.findIndex(
            (server) => mcpServerCollisionKey(server.name) === incomingKey
          );

          if (existingServerIndex !== -1) {
            // If a server with the same name exists, update the existing one
            updatedServers[existingServerIndex] = {
              ...updatedServers[existingServerIndex],
              ...savedDeclaration,
              updatedAt: now,
            };
          } else {
            // If no server with the same name exists, add a new server
            const newServer: IMcpServer = {
              ...savedDeclaration,
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
    [mcpServers, saveMcpServers, removeMcpFromAgents, checkSingleServerInstallStatus]
  );

  // Edit MCP server
  const handleEditMcpServer = useCallback(
    async (
      editingMcpServer: IMcpServer | undefined,
      serverData: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<IMcpServer | undefined> => {
      if (!editingMcpServer) return undefined;

      const updatedServer: IMcpServer = {
        ...editingMcpServer,
        ...serverData,
        updatedAt: Date.now(),
      };

      // Treat an edit as an agent-publication transaction. Revoke the old
      // definition first so renames and transport changes cannot strand an
      // orphan config, then publish the replacement. If either step fails,
      // best-effort restore the old enabled definition and keep local storage
      // unchanged so the user has an honest retry surface.
      try {
        if (editingMcpServer.enabled) {
          await removeMcpFromAgents(editingMcpServer.name, undefined, editingMcpServer.transport.type);
        }
        if (updatedServer.enabled) {
          await syncMcpToAgents(updatedServer, true);
        }
      } catch (error) {
        if (editingMcpServer.enabled) {
          try {
            await syncMcpToAgents(editingMcpServer, true);
          } catch {
            // The original declaration remains persisted and visibly enabled;
            // its next session receipt will expose any failed restoration.
          }
        }
        Message.error(t('settings.mcpSyncError'));
        throw error;
      }

      await saveMcpServers((prevServers) =>
        prevServers.map((server) => (server.id === editingMcpServer.id ? updatedServer : server))
      );

      Message.success(t('settings.mcpImportSuccess'));
      // Immediately re-check install status for this server after editing (install status only)
      setTimeout(() => void checkSingleServerInstallStatus(serverData.name), 100);

      // Return the updated server object for subsequent connection testing
      return updatedServer;
    },
    [saveMcpServers, syncMcpToAgents, removeMcpFromAgents, t, checkSingleServerInstallStatus]
  );

  // Delete MCP server
  const handleDeleteMcpServer = useCallback(
    async (serverId: string) => {
      const targetServer = mcpServers.find((server) => server.id === serverId);
      if (!targetServer) return;

      try {
        const agents = await acpConversation.getAvailableAgents.invoke();
        if (!agents.success || !agents.data) throw new Error(agents.msg || t('settings.mcpSyncFailedNoAgents'));
        const archived = isElectronDesktop()
          ? await mcpService.archiveConfiguredServer.invoke({ serverId, agents: agents.data })
          : await archiveConfiguredMcpServerHttp(serverId);
        if (!archived.success) throw new Error(archived.msg || t('settings.mcpDeleteError'));
        await refreshMcpServers();
        Message.success(t('settings.mcpArchivedWithCleanup', 'Connector archived and removed from your agents.'));

        setAgentInstallStatus((prev) => {
          const updated = { ...prev };
          delete updated[targetServer.name];
          void ConfigStorage.set('mcp.agentInstallStatus', updated).catch(() => {});
          return updated;
        });
      } catch {
        Message.error(t('settings.mcpDeleteError'));
      }
    },
    [mcpServers, setAgentInstallStatus, refreshMcpServers, t]
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

      if (!targetServer || !updatedTargetServer) return false;

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
        return true;
      } catch {
        if (enabled) {
          // Enabling is fail-closed: if zero real adapters published it, revert
          // the local intent instead of leaving another green-but-unusable row.
          await saveMcpServers((prevServers) =>
            prevServers.map((server) =>
              server.id === serverId
                ? { ...server, enabled: false, status: 'disconnected' as const, updatedAt: Date.now() }
                : server
            )
          );
        } else {
          // Keep it disabled locally (Desktop will not inject it), but preserve
          // the record and flag cleanup failure so removal can be retried.
          await saveMcpServers((prevServers) =>
            prevServers.map((server) =>
              server.id === serverId ? { ...server, status: 'error' as const, updatedAt: Date.now() } : server
            )
          );
        }
        Message.error(enabled ? t('settings.mcpSyncError') : t('settings.mcpRemoveError'));
        return false;
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
