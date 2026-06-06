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
            await updateServerStatus('disconnected');
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
            });
            await globalMessageQueue.add(() => {
              message.success(`${server.name}: ${t('settings.mcpTestConnectionSuccess')}`);
            });

            // Connection test succeeded; no extra actions to perform
          } else {
            // Update server status to error and disable install.
            // On failure, automatically set enabled=false to avoid installing a broken service
            await updateServerStatus('error', {
              enabled: false,
            });
            const errorMsg = truncateErrorMessage(result.error || t('settings.mcpError'));
            await globalMessageQueue.add(() => {
              message.error({ content: `${server.name}: ${errorMsg}`, duration: 5000 });
            });
          }
        } else {
          // IPC call failed; disable install
          await updateServerStatus('error', {
            enabled: false,
          });
          const errorMsg = truncateErrorMessage(response.msg || t('settings.mcpError'));
          await globalMessageQueue.add(() => {
            message.error({ content: `${server.name}: ${errorMsg}`, duration: 5000 });
          });
        }
      } catch (error) {
        // Update server status to error and disable install
        await updateServerStatus('error', {
          enabled: false,
        });
        const errorMsg = truncateErrorMessage(error instanceof Error ? error.message : t('settings.mcpError'));
        await globalMessageQueue.add(() => {
          message.error({ content: `${server.name}: ${errorMsg}`, duration: 5000 });
        });
      } finally {
        setTestingServers((prev) => ({ ...prev, [server.id]: false }));
      }
    },
    [saveMcpServers, message, t, onAuthRequired]
  );

  return {
    testingServers,
    handleTestMcpConnection,
  };
};
