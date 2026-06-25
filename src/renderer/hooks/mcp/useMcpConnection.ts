import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { mcpService } from '@/common/adapter/ipcBridge';
import type { IMcpServer } from '@/common/config/storage';
import { globalMessageQueue } from './messageQueue';

/**
 * Truncate long error messages to keep them readable
 */
const truncateErrorMessage = (message: string, maxLength: number = 150): string => {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength) + '...';
};

/**
 * MCP connection-test management hook.
 * Handles MCP server connection tests and status updates.
 */
export const useMcpConnection = (
  mcpServers: IMcpServer[],
  saveMcpServers: (serversOrUpdater: IMcpServer[] | ((prev: IMcpServer[]) => IMcpServer[])) => Promise<void>,
  message: ReturnType<typeof import('@arco-design/web-react').Message.useMessage>[0],
  onAuthRequired?: (server: IMcpServer) => void // Added: callback fired when authentication is required
) => {
  const { t } = useTranslation();
  const [testingServers, setTestingServers] = useState<Record<string, boolean>>({});

  // Connection test function
  const handleTestMcpConnection = useCallback(
    async (server: IMcpServer) => {
      setTestingServers((prev) => ({ ...prev, [server.id]: true }));

      // Update server status - use the unified save function to avoid race conditions
      const updateServerStatus = async (status: IMcpServer['status'], additionalData?: Partial<IMcpServer>) => {
        try {
          await saveMcpServers((prevServers) =>
            prevServers.map((s) =>
              s.id === server.id ? { ...s, status, updatedAt: Date.now(), ...additionalData } : s
            )
          );
        } catch (error) {
          console.error('Failed to update server status:', error);
        }
      };

      await updateServerStatus('testing');

      try {
        const response = await mcpService.testMcpConnection.invoke(server);

        if (response.success && response.data) {
          const result = response.data;

          // Check whether authentication is required
          if (result.needsAuth) {
            // Needing auth is not a connection error - clear any stale lastError
            // so a previous transport failure can't resurface as the reason.
            await updateServerStatus('disconnected', { lastError: undefined });
            await globalMessageQueue.add(() => {
              message.warning(`${server.name}: ${t('settings.mcpAuthRequired') || 'Authentication required'}`);
            });

            // Fire authentication callback
            if (onAuthRequired) {
              onAuthRequired(server);
            }
            return;
          }

          if (result.success) {
            // Update server status to connected and save fetched tool info.
            // On success, do not modify the enabled field - let the user decide whether to install
            await updateServerStatus('connected', {
              tools: result.tools?.map((tool) => ({
                name: tool.name,
                description: tool.description,
                ...(tool._meta ? { _meta: tool._meta } : {}),
              })),
              lastConnected: Date.now(),
              lastError: undefined,
            });
            await globalMessageQueue.add(() => {
              message.success(`${server.name}: ${t('settings.mcpTestConnectionSuccess')}`);
            });

            // Connection test succeeded; no extra actions to perform
          } else {
            // Update server status to error and disable install.
            // On failure, automatically set enabled=false to avoid installing a broken service
            const errorMsg = truncateErrorMessage(result.error || t('settings.mcpError'));
            await updateServerStatus('error', {
              enabled: false,
              lastError: errorMsg,
            });
            await globalMessageQueue.add(() => {
              message.error({ content: `${server.name}: ${errorMsg}`, duration: 5000 });
            });
          }
        } else {
          // IPC call failed; disable install
          const errorMsg = truncateErrorMessage(response.msg || t('settings.mcpError'));
          await updateServerStatus('error', {
            enabled: false,
            lastError: errorMsg,
          });
          await globalMessageQueue.add(() => {
            message.error({ content: `${server.name}: ${errorMsg}`, duration: 5000 });
          });
        }
      } catch (error) {
        // Update server status to error and disable install
        const errorMsg = truncateErrorMessage(error instanceof Error ? error.message : t('settings.mcpError'));
        await updateServerStatus('error', {
          enabled: false,
          lastError: errorMsg,
        });
        await globalMessageQueue.add(() => {
          message.error({ content: `${server.name}: ${errorMsg}`, duration: 5000 });
        });
      } finally {
        setTestingServers((prev) => ({ ...prev, [server.id]: false }));
      }
    },
    [saveMcpServers, message, t, onAuthRequired]
  );

  // Passive, non-destructive status refresh. Probes the given ENABLED servers
  // concurrently to populate live status + tool counts, then writes all results
  // in a SINGLE save. Unlike handleTestMcpConnection it does NOT toast and does
  // NOT auto-disable a server on failure (a transient probe must never silently
  // turn off the user's MCP). Servers already `connected` and probed within
  // STALE_MS are skipped unless `force` is set, so visiting the page does not
  // re-spawn every stdio server on each render.
  const refreshServerStatuses = useCallback(
    async (servers: IMcpServer[], options?: { force?: boolean }) => {
      const force = options?.force ?? false;
      const STALE_MS = 5 * 60 * 1000;
      const now = Date.now();
      const targets = servers.filter(
        (s) =>
          s.enabled === true &&
          (force ||
            s.status !== 'connected' ||
            typeof s.lastConnected !== 'number' ||
            now - s.lastConnected > STALE_MS)
      );
      if (targets.length === 0) {
        return;
      }

      setTestingServers((prev) => {
        const next = { ...prev };
        for (const s of targets) next[s.id] = true;
        return next;
      });

      const updates = await Promise.all(
        targets.map(async (server): Promise<{ id: string; patch: Partial<IMcpServer> }> => {
          try {
            const response = await mcpService.testMcpConnection.invoke(server);
            if (response.success && response.data) {
              const result = response.data;
              if (result.needsAuth) {
                return { id: server.id, patch: { status: 'disconnected', lastError: undefined } };
              }
              if (result.success) {
                return {
                  id: server.id,
                  patch: {
                    status: 'connected',
                    tools: result.tools?.map((tool) => ({
                      name: tool.name,
                      description: tool.description,
                      ...(tool._meta ? { _meta: tool._meta } : {}),
                    })),
                    lastConnected: Date.now(),
                    lastError: undefined,
                  },
                };
              }
              // Probe failed: surface the error state but leave `enabled` alone.
              return {
                id: server.id,
                patch: { status: 'error', lastError: truncateErrorMessage(result.error || t('settings.mcpError')) },
              };
            }
            return {
              id: server.id,
              patch: { status: 'error', lastError: truncateErrorMessage(response.msg || t('settings.mcpError')) },
            };
          } catch (err) {
            return {
              id: server.id,
              patch: {
                status: 'error',
                lastError: truncateErrorMessage(err instanceof Error ? err.message : t('settings.mcpError')),
              },
            };
          }
        })
      );

      try {
        await saveMcpServers((prevServers) =>
          prevServers.map((s) => {
            const update = updates.find((u) => u.id === s.id);
            return update ? { ...s, ...update.patch, updatedAt: Date.now() } : s;
          })
        );
      } finally {
        setTestingServers((prev) => {
          const next = { ...prev };
          for (const s of targets) next[s.id] = false;
          return next;
        });
      }
    },
    [saveMcpServers, t]
  );

  return {
    testingServers,
    handleTestMcpConnection,
    refreshServerStatuses,
  };
};
