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
  /**
   * Detected backend with no MCP implementation - nothing to publish to or
   * remove from. Not a failure; must be excluded before judging an operation.
   * See the field doc on `McpSyncResult` in McpProtocol.ts.
   */
  unsupported?: boolean;
  /** See `McpAgentOutcome` in McpProtocol.ts. */
  outcome?: 'applied' | 'already-absent' | 'unsupported' | 'timed-out' | 'failed';
  retryable?: boolean;
}

/** Comma-joined agent display names, for a sentence the user can act on. */
const nameList = (results: McpOperationResult[]): string => results.map((r) => r.agent).join(', ');

interface McpOperationResponse {
  success: boolean;
  data?: {
    results: McpOperationResult[];
  };
  msg?: string;
}

/**
 * One message slot per connector.
 *
 * Arco keys messages by `id` and REPLACES a live one that shares it, so every
 * message about a single connector - "contacting N agents...", the outcome,
 * the error - lands in the same slot and supersedes whatever it is correcting.
 *
 * Without this, a warning sits for its full 8s `duration` while the NEXT
 * operation's "contacting N agents to remove..." appears beneath it. Nothing
 * was doing the opposite of what the user asked; two operations were on screen
 * at once, and the earlier one was never retracted once it stopped being true.
 */
const mcpOpMessageId = (connector: string): string => `mcp-op-${connector}`;

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
      skipRecheck = false,
      messageId?: string
    ) => {
      if (response.success && response.data) {
        const { results } = response.data;
        // Non-targets are not partial failures. Without this exclusion a normal
        // operation toasts "partially failed: Grok Build: not supported, Goose:
        // not supported, ..." on every machine that has such a backend.
        const targets = results.filter((r: McpOperationResult) => !r.unsupported);

        // THE THREE STATES, KEPT APART.
        //
        // The banner the user was shown glued two of them together:
        //   "removal partially failed: claude:Claude Code: ...: failed: Command
        //    timed out after 5000ms, qwen:Qwen Code: user: Comma... Server not
        //    found in project settings"
        // - a state we did not know, and a state that was a SUCCESS, both
        // reported as failure, in one sentence with no next step.
        const retryable = targets.filter((r: McpOperationResult) => !r.success && r.outcome === 'timed-out');
        const failed = targets.filter((r: McpOperationResult) => !r.success && r.outcome !== 'timed-out');
        const applied = targets.filter((r: McpOperationResult) => r.success && r.outcome === 'applied');
        const alreadyAbsent = targets.filter((r: McpOperationResult) => r.success && r.outcome === 'already-absent');

        if (retryable.length > 0) {
          // Not "failed". We do not know. Say so, and say what to do.
          await globalMessageQueue.add(() => {
            message.warning({
              id: messageId,
              content: t('settings.mcpAgentsRetryNeeded', {
                names: nameList(retryable),
                applied: applied.length,
                total: targets.length,
              }),
              duration: 8000,
            });
          });
        } else if (failed.length > 0) {
          const errors = truncateErrorMessage(
            failed.map((r: McpOperationResult) => `${r.agent}: ${truncateErrorMessage(r.error || '')}`).join(', '),
            200
          );
          await globalMessageQueue.add(() => {
            message.warning({
              id: messageId,
              content: t('settings.mcpAgentsFailed', {
                names: nameList(failed),
                applied: applied.length,
                total: targets.length,
                errors,
              }),
              duration: 8000,
            });
          });
        } else if (operation === 'remove' && applied.length === 0 && alreadyAbsent.length > 0) {
          // A removal whose every target reported "it was not there" is DONE,
          // not failed. This is the case that produced a red banner on a
          // healthy, reachable server with 105 tools.
          await globalMessageQueue.add(() => {
            message.success({ id: messageId, content: t('settings.mcpRemoveNothingToDo') });
          });
        } else {
          // Success, stated with the number that is actually true - the toast
          // shown at the START is a count of agents we were about to CONTACT,
          // and nothing ever corrected it downward.
          const outcomeKey = operation === 'sync' ? 'mcpSyncOutcome' : 'mcpRemoveOutcome';
          await globalMessageQueue.add(() => {
            message.success({
              id: messageId,
              content:
                successMessage ?? t(`settings.${outcomeKey}`, { applied: applied.length, total: targets.length }),
            });
          });
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
          message.error({ id: messageId, content: t(`settings.${failedKey}`, { error: errorMsg }), duration: 6000 });
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
          message.info({
            id: mcpOpMessageId(serverName),
            content: t('settings.mcpRemoveStarted', { count: compatibleCount }),
            icon: progressIcon(),
          });
        });

        // Desktop -> Electron IPC; hosted WebUI -> token-authed + CSRF'd write-only
        // HTTP route (the mcpService.* IPC channels stay denied to remote callers).
        const removeResponse = isElectronDesktop()
          ? await mcpService.removeMcpFromAgents.invoke({
              mcpServerName: serverName,
              agents: agentsResponse.data,
            })
          : await removeMcpFromAgentsHttp(serverName);
        await handleMcpOperationResult(
          removeResponse,
          'remove',
          successMessage,
          true, // Skip re-detection
          mcpOpMessageId(serverName)
        );
        // Same non-target exclusion as the publication path above. This one is
        // the rollback half: treating unsupported backends as failed removals
        // turned every rolled-back publication into an "incomplete rollback",
        // which is what persisted the unrecoverable divergence marker.
        const removalResults = (removeResponse.data?.results ?? []).filter((result) => !result.unsupported);
        const failedRemovals = removalResults.filter((result) => !result.success);
        if (!removeResponse.success || removalResults.length === 0 || failedRemovals.length > 0) {
          throw new Error(
            removeResponse.msg ||
              failedRemovals.map((result) => `${result.agent}: ${result.error || 'removal failed'}`).join(', ') ||
              t('settings.mcpRemoveFailed')
          );
        }
        return removeResponse.data?.results ?? [];
      } else {
        throw new Error(agentsResponse.msg || t('settings.mcpSyncFailedNoAgents'));
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
          message.info({
            id: mcpOpMessageId(server.name),
            content: t('settings.mcpSyncStarted', { count: compatibleCount }),
            icon: progressIcon(),
          });
        });

        // Desktop -> Electron IPC; hosted WebUI -> token-authed + CSRF'd write-only
        // HTTP route (the server is resolved server-side by id over HTTP).
        const syncResponse = isElectronDesktop()
          ? await mcpService.syncMcpToAgents.invoke({
              mcpServers: [server],
              agents: agentsResponse.data,
            })
          : await syncMcpToAgentsHttp(server.id);

        await handleMcpOperationResult(syncResponse, 'sync', undefined, skipRecheck, mcpOpMessageId(server.name));
        // A detected backend with no MCP implementation is a non-target, not a
        // failed publication. Counting those made this throw on every toggle:
        // a typical install detects a dozen of them, so publication "failed"
        // even when all five agents that can carry an MCP server succeeded.
        const publicationResults = (syncResponse.data?.results ?? []).filter((result) => !result.unsupported);
        const failedPublications = publicationResults.filter((result) => !result.success);
        if (!syncResponse.success || publicationResults.length === 0 || failedPublications.length > 0) {
          throw new Error(syncResponse.msg || t('settings.mcpSyncFailedNoAgents'));
        }
        return syncResponse.data?.results ?? [];
      } else {
        // Fix: Handle case when no agents are available, show user-friendly error message
        console.error('[useMcpOperations] Failed to get available agents:', agentsResponse.msg);
        await globalMessageQueue.add(() => {
          message.error(t('settings.mcpSyncFailedNoAgents'));
        });
        throw new Error(agentsResponse.msg || t('settings.mcpSyncFailedNoAgents'));
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
