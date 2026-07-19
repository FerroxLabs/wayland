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

function nextMcpRevision(previous?: number): number {
  return Math.max(Date.now(), (previous ?? 0) + 1);
}

function newMcpServerId(): string {
  return `mcp_${globalThis.crypto.randomUUID()}`;
}

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
      let revokedExisting = false;

      // Add/import is declaration persistence, never adapter publication. If
      // this replaces an already-enabled definition, revoke that old
      // publication first so storage cannot diverge from an agent config.
      if (existingPublished) {
        await removeMcpFromAgents(existingPublished.name, undefined, existingPublished.transport.type);
        revokedExisting = true;
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
      try {
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
              updatedAt: nextMcpRevision(updatedServers[existingServerIndex].updatedAt),
            };
            serverToSync = updatedServers[existingServerIndex];
            return updatedServers;
          }
          // If no server with the same name exists, add a new server
          const newServer: IMcpServer = {
            ...savedDeclaration,
            id: newMcpServerId(),
            createdAt: now,
            updatedAt: now,
          };
          serverToSync = newServer;
          return [...prevServers, newServer];
        });
      } catch (error) {
        if (revokedExisting && existingPublished) {
          try {
            await syncMcpToAgents(existingPublished, true);
          } catch (rollbackError) {
            const failure = new Error('Failed to save MCP declaration and restore publication', { cause: error });
            Object.assign(failure, { rollbackErrors: [rollbackError] });
            throw failure;
          }
        }
        throw error;
      }

      // Check install status
      if (serverToSync) {
        setTimeout(() => void checkSingleServerInstallStatus(serverToSync.name), 100);
      }

      // Return the newly added/updated server for subsequent connection testing
      return serverToSync;
    },
    [mcpServers, saveMcpServers, syncMcpToAgents, removeMcpFromAgents, checkSingleServerInstallStatus]
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
      const revocations = await Promise.allSettled(
        existingPublished.map((server) => removeMcpFromAgents(server.name, undefined, server.transport.type))
      );
      const revokedServers = existingPublished.filter((_server, index) => revocations[index].status === 'fulfilled');
      const revocationFailures = revocations
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => result.reason);

      const restoreRevoked = async (): Promise<unknown[]> => {
        const restorations = await Promise.allSettled(revokedServers.map((server) => syncMcpToAgents(server, true)));
        return restorations
          .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
          .map((result) => result.reason);
      };

      if (revocationFailures.length > 0) {
        const restorationFailures = await restoreRevoked();
        throw new AggregateError(
          [...revocationFailures, ...restorationFailures],
          'Failed to revoke existing MCP publications for import'
        );
      }

      // Use functional update to avoid stale-closure issues
      try {
        await saveMcpServers((prevServers) => {
          const updatedServers = [...prevServers];

          serversData.forEach((serverData) => {
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
                updatedAt: nextMcpRevision(updatedServers[existingServerIndex].updatedAt),
              };
            } else {
              // If no server with the same name exists, add a new server
              const newServer: IMcpServer = {
                ...savedDeclaration,
                id: newMcpServerId(),
                createdAt: now,
                updatedAt: now,
              };
              updatedServers.push(newServer);
              addedServers.push(newServer);
            }
          });

          return updatedServers;
        });
      } catch (error) {
        const restorationFailures = await restoreRevoked();
        if (restorationFailures.length > 0) {
          const failure = new Error('Failed to save MCP import and restore publication', { cause: error });
          Object.assign(failure, { rollbackErrors: restorationFailures });
          throw failure;
        }
        throw error;
      }

      // Check install status
      setTimeout(() => {
        serversData.forEach((serverData) => {
          void checkSingleServerInstallStatus(serverData.name);
        });
      }, 100);

      // Return list of newly added servers for subsequent connection testing
      return addedServers;
    },
    [mcpServers, saveMcpServers, syncMcpToAgents, removeMcpFromAgents, checkSingleServerInstallStatus]
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
        updatedAt: nextMcpRevision(editingMcpServer.updatedAt),
      };

      // Treat an edit as an agent-publication transaction. Revoke the old
      // definition first so renames and transport changes cannot strand an
      // orphan config, then publish the replacement. If either step fails,
      // best-effort restore the old enabled definition and keep local storage
      // unchanged so the user has an honest retry surface.
      let oldPublicationRevoked = false;
      let replacementPublished = false;
      try {
        if (editingMcpServer.enabled) {
          await removeMcpFromAgents(editingMcpServer.name, undefined, editingMcpServer.transport.type);
          oldPublicationRevoked = true;
        }
        if (updatedServer.enabled) {
          await syncMcpToAgents(updatedServer, true);
          replacementPublished = true;
        }
        let committed = false;
        await saveMcpServers((prevServers) =>
          prevServers.map((server) => {
            if (server.id !== editingMcpServer.id || server.updatedAt !== editingMcpServer.updatedAt) return server;
            committed = true;
            return updatedServer;
          })
        );
        if (!committed) throw new Error('MCP declaration changed while edit publication was in progress');
      } catch (error) {
        const rollbackErrors: unknown[] = [];
        if (replacementPublished) {
          try {
            await removeMcpFromAgents(updatedServer.name, undefined, updatedServer.transport.type);
          } catch (rollbackError) {
            rollbackErrors.push(rollbackError);
          }
        }
        if (oldPublicationRevoked) {
          try {
            await syncMcpToAgents(editingMcpServer, true);
          } catch (rollbackError) {
            rollbackErrors.push(rollbackError);
          }
        }
        Message.error(t('settings.mcpSyncError'));
        if (rollbackErrors.length > 0) {
          const failure = new Error('MCP edit failed and publication rollback was incomplete', { cause: error });
          Object.assign(failure, { rollbackErrors });
          throw failure;
        }
        throw error;
      }

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
      const targetServer = mcpServers.find((server) => server.id === serverId);
      if (!targetServer) return false;
      const updatedTargetServer: IMcpServer = {
        ...targetServer,
        enabled,
        updatedAt: nextMcpRevision(targetServer.updatedAt),
      };
      let externalChanged = false;

      try {
        if (enabled) {
          // Publish before committing the local enabled state. A failed or
          // partial publication can therefore never leave a false-green row.
          await syncMcpToAgents(updatedTargetServer, true);
          externalChanged = true;
        } else {
          await removeMcpFromAgents(targetServer.name, undefined, targetServer.transport.type);
          externalChanged = true;
        }

        let committed = false;
        await saveMcpServers((prevServers) =>
          prevServers.map((server) => {
            if (server.id !== serverId || server.updatedAt !== targetServer.updatedAt) return server;
            committed = true;
            return updatedTargetServer;
          })
        );
        if (!committed) throw new Error('MCP declaration changed while publication was in progress');

        if (enabled) {
          setTimeout(() => void checkSingleServerInstallStatus(targetServer.name), 100);
        } else {
          setAgentInstallStatus((prev) => {
            const updated = { ...prev };
            delete updated[targetServer.name];
            void ConfigStorage.set('mcp.agentInstallStatus', updated).catch(() => {
              // Install-status cache is non-authoritative UI evidence.
            });
            return updated;
          });
        }
        return true;
      } catch (error) {
        if (externalChanged) {
          try {
            if (enabled) {
              await removeMcpFromAgents(updatedTargetServer.name, undefined, updatedTargetServer.transport.type);
            } else {
              await syncMcpToAgents(targetServer, true);
            }
          } catch (rollbackError) {
            Message.error(enabled ? t('settings.mcpSyncError') : t('settings.mcpRemoveError'));
            const failure = new Error('MCP toggle failed and publication rollback was incomplete', { cause: error });
            Object.assign(failure, { rollbackErrors: [rollbackError] });
            throw failure;
          }
        }
        Message.error(enabled ? t('settings.mcpSyncError') : t('settings.mcpRemoveError'));
        return false;
      }
    },
    [
      mcpServers,
      saveMcpServers,
      syncMcpToAgents,
      removeMcpFromAgents,
      checkSingleServerInstallStatus,
      setAgentInstallStatus,
      t,
    ]
  );

  return {
    handleAddMcpServer,
    handleBatchImportMcpServers,
    handleEditMcpServer,
    handleDeleteMcpServer,
    handleToggleMcpServer,
  };
};
