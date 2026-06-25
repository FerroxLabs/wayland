import { useCallback, createElement } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { acpConversation, mcpService } from '@/common/adapter/ipcBridge';
import { ConfigStorage } from '@/common/config/storage';
import type { IMcpServer } from '@/common/config/storage';
import { isElectronDesktop } from '@/renderer/utils/platform';
import { removeMcpFromAgentsHttp, syncMcpToAgentsHttp } from '@/renderer/services/McpConfigService';
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
 * A green spinning loader for in-progress toasts. Syncing/removing MCP config is
 * a process, not a problem, so it gets a spinner in the success colour instead
 * of the orange info glyph that reads as a warning.
 */
const progressIcon = () =>
  createElement(Loader2, { size: 14, className: 'animate-spin', style: { color: 'var(--success)' } });

// MCP operation result types
interface McpOperationResult {
  agent: string;
  success: boolean;
  error?: string;
}

interface McpOperationResponse {
  success: boolean;
  data?: {
    results: McpOperationResult[];
  };
  msg?: string;
}

/**
 * MCP operations management hook.
 * Handles sync and remove operations between MCP servers and agents.
 */
export const useMcpOperations = (
  mcpServers: IMcpServer[],
  message: ReturnType<typeof import('@arco-design/web-react').Message.useMessage>[0]
) => {
  const { t } = useTranslation();

  // Handle results of syncing MCP config to agents
  const handleMcpOperationResult = useCallback(
    async (
      response: McpOperationResponse,
      operation: 'sync' | 'remove',
      successMessage?: string,
      skipRecheck = false
    ) => {
      if (response.success && response.data) {
        const { results } = response.data;
        const failedAgents = results.filter((r: McpOperationResult) => !r.success);

        // Show operation-start message immediately, then trigger state update
        if (failedAgents.length > 0) {
          const failedNames = failedAgents
            .map((r: McpOperationResult) => `${r.agent}: ${truncateErrorMessage(r.error || '')}`)
            .join(', ');
          const truncatedErrors = truncateErrorMessage(failedNames, 200);
          const partialFailedKey = operation === 'sync' ? 'mcpSyncPartialFailed' : 'mcpRemovePartialFailed';
          await globalMessageQueue.add(() => {
            message.warning({
              content: t(`settings.${partialFailedKey}`, { errors: truncatedErrors }),
              duration: 6000,
            });
          });
        } else {
          if (successMessage) {
            await globalMessageQueue.add(() => {
              message.success(successMessage);
            });
          }
          // No longer show the "operation started" message; it was already shown at the start
        }

        // Then update UI state
        if (!skipRecheck) {
          void ConfigStorage.get('mcp.config')
            .then((latestServers) => {
              if (latestServers) {
                // A status check can be triggered here, but callers must supply a callback
              }
            })
            .catch(() => {
              // Handle loading error silently
            });
        }
      } else {
        const failedKey = operation === 'sync' ? 'mcpSyncFailed' : 'mcpRemoveFailed';
        const errorMsg = truncateErrorMessage(response.msg || t('settings.unknownError'));
        await globalMessageQueue.add(() => {
          message.error({ content: t(`settings.${failedKey}`, { error: errorMsg }), duration: 6000 });
        });
      }
    },
    [message, t]
  );

  // Remove MCP config from agents
  const removeMcpFromAgents = useCallback(
    async (serverName: string, successMessage?: string, transportType?: string) => {
      const agentsResponse = await acpConversation.getAvailableAgents.invoke();
      if (agentsResponse.success && agentsResponse.data) {
        // Filter agents by transport type support if transport type is known
        const compatibleCount = transportType
          ? agentsResponse.data.filter((a) => a.supportedTransports?.includes(transportType)).length
          : agentsResponse.data.length;

        // Show remove-started message (via queue)
        await globalMessageQueue.add(() => {
          message.info({ content: t('settings.mcpRemoveStarted', { count: compatibleCount }), icon: progressIcon() });
        });

        // Desktop -> Electron IPC; hosted WebUI -> token-authed + CSRF'd write-only
        // HTTP route (the mcpService.* IPC channels stay denied to remote callers).
        const removeResponse = isElectronDesktop()
          ? await mcpService.removeMcpFromAgents.invoke({
              mcpServerName: serverName,
              agents: agentsResponse.data,
            })
          : await removeMcpFromAgentsHttp(serverName);
        await handleMcpOperationResult(removeResponse, 'remove', successMessage, true); // Skip re-detection
      }
    },
    [message, t, handleMcpOperationResult]
  );

  // Sync MCP config to agents
  const syncMcpToAgents = useCallback(
    async (server: IMcpServer, skipRecheck = false) => {
      const agentsResponse = await acpConversation.getAvailableAgents.invoke();
      if (agentsResponse.success && agentsResponse.data) {
        // Filter agents by transport type support to show accurate count
        const compatibleCount = agentsResponse.data.filter((a) =>
          a.supportedTransports?.includes(server.transport.type)
        ).length;

        // Show sync-started message (via queue)
        await globalMessageQueue.add(() => {
          message.info({ content: t('settings.mcpSyncStarted', { count: compatibleCount }), icon: progressIcon() });
        });

        // Desktop -> Electron IPC; hosted WebUI -> token-authed + CSRF'd write-only
        // HTTP route (the server is resolved server-side by id over HTTP).
        const syncResponse = isElectronDesktop()
          ? await mcpService.syncMcpToAgents.invoke({
              mcpServers: [server],
              agents: agentsResponse.data,
            })
          : await syncMcpToAgentsHttp(server.id);

        await handleMcpOperationResult(syncResponse, 'sync', undefined, skipRecheck);
      } else {
        // Fix: Handle case when no agents are available, show user-friendly error message
        console.error('[useMcpOperations] Failed to get available agents:', agentsResponse.msg);
        await globalMessageQueue.add(() => {
          message.error(t('settings.mcpSyncFailedNoAgents'));
        });
      }
    },
    [message, t, handleMcpOperationResult]
  );

  return {
    syncMcpToAgents,
    removeMcpFromAgents,
    handleMcpOperationResult,
  };
};
