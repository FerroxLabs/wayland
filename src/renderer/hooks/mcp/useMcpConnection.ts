import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { mcpService } from '@/common/adapter/ipcBridge';
import type { IMcpServer } from '@/common/config/storage';
import { mcpServerCollisionKey } from '@/common/mcp';
import type { McpConnectionTestResult, McpPrepublicationTruth } from '@process/services/mcpServices/McpProtocol';
import { globalMessageQueue } from './messageQueue';

export const MCP_PREPUBLICATION_MAX_AGE_MS = 5 * 60 * 1000;
const MCP_PREPUBLICATION_MAX_FUTURE_SKEW_MS = 5_000;
export const MCP_PUBLICATION_DIVERGENCE_MARKER = 'publication rollback incomplete';
const MCP_ERROR_MAX_LENGTH = 150;
const MCP_PUBLICATION_DIVERGENCE_ERROR = `${MCP_PUBLICATION_DIVERGENCE_MARKER} — reconnect this connector` as const;

function nextMcpRevision(previous: number): number {
  return Math.max(Date.now(), previous + 1);
}

export function readCorrelatedMcpPrepublicationTruth(
  server: Pick<IMcpServer, 'id' | 'name' | 'updatedAt'>,
  result: McpConnectionTestResult,
  now: number = Date.now()
): McpPrepublicationTruth {
  const truth = result.prepublication;
  if (
    !truth ||
    truth.version !== 'wayland-mcp-prepublication/1' ||
    truth.serverId !== server.id ||
    truth.serverName !== server.name ||
    truth.serverUpdatedAt !== server.updatedAt ||
    !Number.isSafeInteger(truth.observedAt) ||
    truth.observedAt <= 0 ||
    !Number.isSafeInteger(now) ||
    truth.observedAt > now + MCP_PREPUBLICATION_MAX_FUTURE_SKEW_MS ||
    now - truth.observedAt > MCP_PREPUBLICATION_MAX_AGE_MS
  ) {
    throw new Error('MCP probe returned missing, stale, or mismatched pre-publication evidence');
  }

  if (truth.state === 'probed') {
    if (
      result.success !== true ||
      result.needsAuth === true ||
      result.error !== undefined ||
      result.authMethod !== undefined ||
      result.wwwAuthenticate !== undefined ||
      !Array.isArray(result.tools) ||
      truth.authentication !== 'validated' ||
      truth.probe !== 'succeeded' ||
      truth.toolCount !== result.tools.length
    ) {
      throw new Error('MCP probe success contradicts its pre-publication evidence');
    }
    return truth;
  }

  if (truth.state === 'authentication-required') {
    if (
      result.success !== false ||
      result.needsAuth !== true ||
      result.tools !== undefined ||
      result.authMethod !== truth.authMethod ||
      truth.authentication !== 'required' ||
      truth.probe !== 'not-completed'
    ) {
      throw new Error('MCP authentication result contradicts its pre-publication evidence');
    }
    return truth;
  }

  if (
    result.success !== false ||
    result.needsAuth === true ||
    result.tools !== undefined ||
    result.authMethod !== undefined ||
    result.wwwAuthenticate !== undefined ||
    result.error !== truth.error ||
    truth.authentication !== 'unavailable' ||
    truth.probe !== 'failed'
  ) {
    throw new Error('MCP probe failure contradicts its pre-publication evidence');
  }
  return truth;
}

/**
 * Truncate long error messages to keep them readable
 */
const truncateErrorMessage = (message: string, maxLength: number = MCP_ERROR_MAX_LENGTH): string => {
  if (message.length <= maxLength) {
    return message;
  }
  return `${message.substring(0, Math.max(0, maxLength - 3))}...`;
};

const hasPublicationDivergence = (server: Pick<IMcpServer, 'lastError'>): boolean =>
  typeof server.lastError === 'string' && server.lastError.includes(MCP_PUBLICATION_DIVERGENCE_MARKER);

export function retainMcpPublicationReconciliation(
  servers: IMcpServer[],
  serverId: string,
  fallback: IMcpServer
): IMcpServer[] {
  const exactIndex = servers.findIndex((candidate) => candidate.id === serverId);
  const canonicalIndex = servers.findIndex(
    (candidate) => mcpServerCollisionKey(candidate.name) === mcpServerCollisionKey(fallback.name)
  );
  const reconciliationIndex = exactIndex >= 0 ? exactIndex : canonicalIndex;
  const current = reconciliationIndex >= 0 ? servers[reconciliationIndex] : undefined;
  const reconciliationServer: IMcpServer = {
    ...(current ?? fallback),
    enabled: current?.enabled ?? false,
    status: 'error',
    lastError: MCP_PUBLICATION_DIVERGENCE_ERROR,
    updatedAt: nextMcpRevision((current ?? fallback).updatedAt),
  };

  if (reconciliationIndex < 0) return [...servers, reconciliationServer];
  const next = [...servers];
  next[reconciliationIndex] = reconciliationServer;
  return next;
}

const publicationDivergenceError = (probeError: string): string => {
  const suffix = `; ${MCP_PUBLICATION_DIVERGENCE_MARKER} — reconnect this connector`;
  return `${truncateErrorMessage(probeError, MCP_ERROR_MAX_LENGTH - suffix.length)}${suffix}`;
};

/**
 * MCP standalone-probe management hook.
 * A successful probe proves server reachability and tool discovery only. It
 * never proves that an active chat session received or can invoke those tools.
 */
export const useMcpConnection = (
  mcpServers: IMcpServer[],
  saveMcpServers: (serversOrUpdater: IMcpServer[] | ((prev: IMcpServer[]) => IMcpServer[])) => Promise<void>,
  message: ReturnType<typeof import('@arco-design/web-react').Message.useMessage>[0],
  onAuthRequired?: (server: IMcpServer) => void, // Added: callback fired when authentication is required
  removeMcpFromAgents?: (serverName: string, successMessage?: string, transportType?: string) => Promise<unknown>,
  syncMcpToAgents?: (server: IMcpServer, skipRecheck?: boolean) => Promise<unknown>,
  readMcpServers?: () => Promise<IMcpServer[]>
) => {
  const { t } = useTranslation();
  const [testingServers, setTestingServers] = useState<Record<string, boolean>>({});

  // Connection test function
  const handleTestMcpConnection = useCallback(
    async (server: IMcpServer) => {
      // A probe cannot reconcile a partially-mutated external publication. The
      // explicit reconnect path must first republish the declaration and pass
      // the exact committed revision back here.
      if (hasPublicationDivergence(server)) return;

      setTestingServers((prev) => ({ ...prev, [server.id]: true }));

      // Update server status - use the unified save function to avoid race conditions
      const updateServerStatus = async (
        status: IMcpServer['status'],
        additionalData?: Partial<IMcpServer>,
        preserveRevision = false
      ): Promise<{ outcome: 'applied' | 'conflict' | 'error'; winner?: IMcpServer }> => {
        let applied = false;
        let winner: IMcpServer | undefined;
        try {
          await saveMcpServers((prevServers) => {
            applied = false;
            winner =
              prevServers.find((candidate) => candidate.id === server.id) ??
              prevServers.find(
                (candidate) => mcpServerCollisionKey(candidate.name) === mcpServerCollisionKey(server.name)
              );
            return prevServers.map((s) => {
              if (s.id !== server.id || s.updatedAt !== server.updatedAt) return s;
              applied = true;
              return {
                ...s,
                status,
                updatedAt: preserveRevision ? s.updatedAt : nextMcpRevision(s.updatedAt),
                ...additionalData,
              };
            });
          });
        } catch (error) {
          console.error('Failed to update server status:', error);
          return { outcome: 'error' };
        }
        return { outcome: applied ? 'applied' : 'conflict', winner };
      };

      const reconcileLostProbeFailureCas = async (
        winner: IMcpServer | undefined,
        adapterState: 'revoked' | 'published-original' | 'unknown'
      ): Promise<void> => {
        if (!removeMcpFromAgents || !syncMcpToAgents) return;

        const findDurableWinner = (servers: IMcpServer[]): IMcpServer | undefined =>
          servers.find((candidate) => candidate.id === server.id) ??
          servers.find((candidate) => mcpServerCollisionKey(candidate.name) === mcpServerCollisionKey(server.name));
        const readDurableWinner = async (): Promise<IMcpServer | undefined> => {
          if (readMcpServers) return findDurableWinner(await readMcpServers());

          // Tests and legacy callers may not provide a persistence reader. A
          // no-op update still observes the storage layer's current CAS input;
          // the render-time mcpServers array is not authoritative after awaits.
          let durableWinner: IMcpServer | undefined;
          await saveMcpServers((prevServers) => {
            durableWinner = findDurableWinner(prevServers);
            return prevServers;
          });
          return durableWinner;
        };
        const sameDurableRevision = (left: IMcpServer | undefined, right: IMcpServer | undefined): boolean =>
          left?.id === right?.id &&
          left?.updatedAt === right?.updatedAt &&
          left?.enabled === right?.enabled &&
          (left === undefined ||
            right === undefined ||
            mcpServerCollisionKey(left.name) === mcpServerCollisionKey(right.name));

        let desired = winner;
        let lastPublished: IMcpServer | undefined;
        try {
          let originalKeyRemoved = adapterState === 'revoked';
          let renameCleanupDone = false;

          // Every adapter mutation is followed by a fresh durable read. Four
          // attempts bound an actively changing declaration; exhaustion is
          // persisted as divergence instead of publishing an arbitrary loser.
          const reconcileAttempt = async (attempt: number): Promise<boolean> => {
            if (attempt >= 4) return false;

            const beforeMutation = await readDurableWinner();
            if (!sameDurableRevision(beforeMutation, desired)) desired = beforeMutation;

            if (lastPublished && !sameDurableRevision(lastPublished, desired)) {
              await removeMcpFromAgents(lastPublished.name, undefined, lastPublished.transport.type);
              lastPublished = undefined;
              const afterStaleCleanup = await readDurableWinner();
              if (!sameDurableRevision(afterStaleCleanup, desired)) {
                desired = afterStaleCleanup;
                return reconcileAttempt(attempt + 1);
              }
            }

            if (desired?.enabled) {
              // A rename can strand the original config under a different key.
              // Remove it before publishing the exact durable winner.
              if (!renameCleanupDone && desired.name !== server.name) {
                await removeMcpFromAgents(server.name, undefined, server.transport.type);
                originalKeyRemoved = true;
                renameCleanupDone = true;
                const afterOriginalCleanup = await readDurableWinner();
                if (!sameDurableRevision(afterOriginalCleanup, desired)) {
                  desired = afterOriginalCleanup;
                  return reconcileAttempt(attempt + 1);
                }
              }

              // Multi-adapter publication is not atomic. Record the exact
              // candidate before dispatch so a partial mutation followed by a
              // rejected promise is still revoked by the catch path.
              lastPublished = desired;
              await syncMcpToAgents(desired, true);
            } else if (!originalKeyRemoved) {
              // Disabled/deleted durable truth requires confirmed absence. A
              // previous rejected revocation or restoration may have left any
              // subset of adapters carrying the original definition.
              await removeMcpFromAgents(server.name, undefined, server.transport.type);
              originalKeyRemoved = true;
            }

            const afterMutation = await readDurableWinner();
            if (sameDurableRevision(afterMutation, desired)) return true;
            desired = afterMutation;
            return reconcileAttempt(attempt + 1);
          };

          if (await reconcileAttempt(0)) return;

          // Exhaustion must not leave the last known loser callable. Cleanup
          // is best-effort: a rejection still flows through the catch below,
          // which records durable divergence against current truth.
          if (lastPublished) {
            await removeMcpFromAgents(lastPublished.name, undefined, lastPublished.transport.type);
            lastPublished = undefined;
          }
          await saveMcpServers((prevServers) =>
            retainMcpPublicationReconciliation(prevServers, server.id, desired ?? winner ?? server)
          );
        } catch (reconciliationError) {
          const rollbackErrors: unknown[] = [reconciliationError];
          if (lastPublished) {
            try {
              await removeMcpFromAgents(lastPublished.name, undefined, lastPublished.transport.type);
              lastPublished = undefined;
            } catch (cleanupError) {
              rollbackErrors.push(cleanupError);
            }
          }

          const fallback = desired ?? winner ?? server;
          try {
            await saveMcpServers((prevServers) => retainMcpPublicationReconciliation(prevServers, server.id, fallback));
          } catch (persistenceError) {
            rollbackErrors.push(persistenceError);
            const failure = new Error('MCP probe reconciliation could not persist publication divergence', {
              cause: reconciliationError,
            });
            Object.assign(failure, { rollbackErrors });
            throw failure;
          }
          console.error('MCP publication reconciliation retained fail-closed divergence:', { rollbackErrors });
        }
      };

      const recordProbeFailure = async (errorMsg: string): Promise<void> => {
        let publicationRevoked = !server.enabled;
        let adapterState: 'revoked' | 'published-original' | 'unknown' = server.enabled ? 'unknown' : 'revoked';
        let surfacedError = errorMsg;
        if (server.enabled && removeMcpFromAgents && syncMcpToAgents) {
          try {
            await removeMcpFromAgents(server.name, undefined, server.transport.type);
            publicationRevoked = true;
            adapterState = 'revoked';
          } catch (revocationError) {
            // A rejected removal may have changed a subset of adapters. Restore
            // the previous enabled definition everywhere and keep local enabled
            // truth until a later revocation succeeds.
            try {
              await syncMcpToAgents(server, true);
              adapterState = 'published-original';
            } catch (restorationError) {
              adapterState = 'unknown';
              console.error('MCP publication rollback was incomplete:', {
                revocationError,
                restorationError,
              });
              surfacedError = publicationDivergenceError(errorMsg);
            }
          }
        }

        const statusUpdate = await updateServerStatus('error', {
          ...(publicationRevoked ? { enabled: false } : {}),
          lastError: surfacedError,
        });
        if (statusUpdate.outcome !== 'applied') {
          let winner = statusUpdate.winner;
          if (statusUpdate.outcome === 'error') {
            const current = await readMcpServers();
            winner =
              current.find((candidate) => candidate.id === server.id) ??
              current.find((candidate) => mcpServerCollisionKey(candidate.name) === mcpServerCollisionKey(server.name));
          }
          await reconcileLostProbeFailureCas(winner, adapterState);
          return;
        }
        await globalMessageQueue.add(() => {
          message.error({ content: `${server.name}: ${surfacedError}`, duration: 5000 });
        });
      };

      try {
        // Keep updatedAt as the declaration revision while the probe runs. Every
        // terminal write below is compare-and-set against that revision, so an
        // edit/re-import racing the probe wins and stale evidence is discarded.
        // This belongs inside the try/finally so even a rejected initial write
        // clears the renderer's in-flight indicator.
        if ((await updateServerStatus('testing', undefined, true)).outcome !== 'applied') return;

        const response = await mcpService.testMcpConnection.invoke(server);

        if (response.success && response.data) {
          const result = response.data;
          const truth = readCorrelatedMcpPrepublicationTruth(server, result);

          // Check whether authentication is required
          if (truth.state === 'authentication-required') {
            // Needing auth is not a connection error - clear any stale lastError
            // so a previous transport failure can't resurface as the reason.
            if ((await updateServerStatus('disconnected', { lastError: undefined })).outcome !== 'applied') return;
            await globalMessageQueue.add(() => {
              message.warning(`${server.name}: ${t('settings.mcpAuthRequired') || 'Authentication required'}`);
            });

            // Fire authentication callback
            if (onAuthRequired) {
              onAuthRequired(server);
            }
            return;
          }

          if (truth.state === 'probed') {
            // Persist the legacy `connected` value as probe-reachable and save
            // the probe-reported inventory. Session receipts own chat readiness.
            // On success, do not modify the enabled field - let the user decide whether to install
            const successUpdate = await updateServerStatus('connected', {
              tools: result.tools?.map((tool) => ({
                name: tool.name,
                description: tool.description,
                ...(tool._meta ? { _meta: tool._meta } : {}),
              })),
              lastConnected: Date.now(),
              lastError: undefined,
            });
            if (successUpdate.outcome !== 'applied') return;
            await globalMessageQueue.add(() => {
              message.success(
                `${server.name}: ${t('settings.mcpProbeSuccess', 'Server probe succeeded; a new chat will verify its tools')}`
              );
            });

            // Standalone probe succeeded; no session-readiness claim is made.
          } else {
            const errorMsg = truncateErrorMessage(result.error || t('settings.mcpError'));
            await recordProbeFailure(errorMsg);
          }
        } else {
          const errorMsg = truncateErrorMessage(response.msg || t('settings.mcpError'));
          await recordProbeFailure(errorMsg);
        }
      } catch (error) {
        const errorMsg = truncateErrorMessage(error instanceof Error ? error.message : t('settings.mcpError'));
        await recordProbeFailure(errorMsg);
      } finally {
        setTestingServers((prev) => ({ ...prev, [server.id]: false }));
      }
    },
    [saveMcpServers, message, t, onAuthRequired, removeMcpFromAgents, syncMcpToAgents, readMcpServers]
  );

  // Passive, non-destructive status refresh. Probes the given ENABLED servers
  // concurrently to populate probe status + probe-reported tool counts, then
  // writes all results
  // in a SINGLE save. Unlike handleTestMcpConnection it does NOT toast and does
  // NOT auto-disable a server on failure (a transient probe must never silently
  // turn off the user's MCP). Servers in the legacy `connected`
  // (probe-reachable) state and probed within
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
          !(s.status === 'error' && hasPublicationDivergence(s)) &&
          (force || s.status !== 'connected' || typeof s.lastConnected !== 'number' || now - s.lastConnected > STALE_MS)
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
        targets.map(async (server): Promise<{ id: string; expectedUpdatedAt: number; patch: Partial<IMcpServer> }> => {
          try {
            const response = await mcpService.testMcpConnection.invoke(server);
            if (response.success && response.data) {
              const result = response.data;
              const truth = readCorrelatedMcpPrepublicationTruth(server, result);
              if (truth.state === 'authentication-required') {
                return {
                  id: server.id,
                  expectedUpdatedAt: server.updatedAt,
                  patch: { status: 'disconnected', lastError: undefined },
                };
              }
              if (truth.state === 'probed') {
                return {
                  id: server.id,
                  expectedUpdatedAt: server.updatedAt,
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
                expectedUpdatedAt: server.updatedAt,
                patch: { status: 'error', lastError: truncateErrorMessage(result.error || t('settings.mcpError')) },
              };
            }
            return {
              id: server.id,
              expectedUpdatedAt: server.updatedAt,
              patch: { status: 'error', lastError: truncateErrorMessage(response.msg || t('settings.mcpError')) },
            };
          } catch (err) {
            return {
              id: server.id,
              expectedUpdatedAt: server.updatedAt,
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
            return update && update.expectedUpdatedAt === s.updatedAt
              ? { ...s, ...update.patch, updatedAt: nextMcpRevision(s.updatedAt) }
              : s;
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
