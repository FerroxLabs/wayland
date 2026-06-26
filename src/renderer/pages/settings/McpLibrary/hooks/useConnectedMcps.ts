/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { acpConversation, mcpService } from '@/common/adapter/ipcBridge';
import { canonicalMcpServerName } from '@/common/mcp';
import type { IMcpServer } from '@/common/config/storage';
import {
  useMcpServers,
  useMcpAgentStatus,
  useMcpOperations,
  useMcpServerCRUD,
  useMcpOAuth,
} from '@renderer/hooks/mcp';
import { useMcpConnection } from '@renderer/hooks/mcp/useMcpConnection';
import { deriveStatus, type UIStatus } from '../status';

/** One configured/live server, resolved for the Connected-MCPs overview. */
export type ConnectedServerRow = {
  server: IMcpServer;
  status: UIStatus;
  /** Number of tools the server last reported (0 until a successful probe). */
  toolCount: number;
  /** Agent CLIs this server is currently installed into. */
  agents: string[];
  /** A live probe/test is in flight for this server. */
  testing: boolean;
};

/**
 * A server that is installed into one or more agent CLIs but is NO LONGER in
 * the Wayland MCP config — a leftover carried over from a prior session whose
 * stale tool defs still get replayed. Removable, but not otherwise visible.
 */
export type StaleServerRow = {
  name: string;
  agents: string[];
};

/**
 * Pure leftover-diff: a server installed in one or more agent CLIs whose canonical
 * name is NOT in the configured set is a stale carry-over. Grouped by raw name with
 * the agents that still carry it. Each agent rewrites the name on write, so the
 * configured set must be compared canonically (see canonicalMcpServerName).
 */
export function findStaleServers(
  configuredCanonical: Set<string>,
  agentConfigs: Array<{ source: string; servers: Array<{ name: string }> }>,
  canonicalize: (name: string) => string
): StaleServerRow[] {
  const leftover = new Map<string, Set<string>>();
  for (const cfg of agentConfigs) {
    for (const srv of cfg.servers) {
      if (configuredCanonical.has(canonicalize(srv.name))) continue;
      const agents = leftover.get(srv.name) ?? new Set<string>();
      agents.add(cfg.source);
      leftover.set(srv.name, agents);
    }
  }
  return [...leftover.entries()].map(([name, agents]) => ({ name, agents: [...agents] }));
}

/**
 * Lane 1 — composes the existing MCP lifecycle primitives into the data + actions
 * the global "Connected MCPs" overview needs: every configured + live server with
 * status and tool count, the disconnect/reconnect/remove actions, and detection +
 * removal of stale leftover servers. Touches connection-status/teardown only; it
 * never writes per-tool `allowed_tools` (Lane 2) or `configBridge.allow_list` (Lane 3).
 */
export function useConnectedMcps(
  message: ReturnType<typeof import('@arco-design/web-react').Message.useMessage>[0]
) {
  const { mcpServers, allMcpServers, saveMcpServers } = useMcpServers();
  const { agentInstallStatus, setAgentInstallStatus, checkSingleServerInstallStatus, checkAgentInstallStatus } =
    useMcpAgentStatus();
  const { removeMcpFromAgents, syncMcpToAgents } = useMcpOperations(mcpServers, message);
  const { oauthStatus } = useMcpOAuth();
  const crud = useMcpServerCRUD(
    mcpServers,
    saveMcpServers,
    syncMcpToAgents,
    removeMcpFromAgents,
    checkSingleServerInstallStatus,
    setAgentInstallStatus
  );
  const conn = useMcpConnection(mcpServers, saveMcpServers, message);

  const [stale, setStale] = useState<StaleServerRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Compute the leftover set: server names present in agent configs but absent
  // from the Wayland MCP config (canonical-name compared, since each agent CLI
  // rewrites the name on write — see useMcpAgentStatus).
  const computeStale = useCallback(async () => {
    try {
      const agentsRes = await acpConversation.getAvailableAgents.invoke();
      if (!agentsRes.success || !agentsRes.data) {
        setStale([]);
        return;
      }
      const cfgRes = await mcpService.getAgentMcpConfigs.invoke(agentsRes.data);
      if (!cfgRes.success || !cfgRes.data) {
        setStale([]);
        return;
      }
      const configured = new Set(mcpServers.map((s) => canonicalMcpServerName(s.name)));
      setStale(findStaleServers(configured, cfgRes.data, canonicalMcpServerName));
    } catch {
      // Stale detection is best-effort; a probe failure must not break the page.
      setStale([]);
    }
  }, [mcpServers]);

  // On mount + whenever the configured set changes: probe live status/tool counts
  // (non-destructive), refresh per-agent install status, and recompute leftovers.
  useEffect(() => {
    if (mcpServers.length === 0) {
      void computeStale();
      return;
    }
    void conn.refreshServerStatuses(mcpServers);
    void checkAgentInstallStatus(mcpServers);
    void computeStale();
    // refreshServerStatuses/checkAgentInstallStatus are stable callbacks; keyed on
    // the configured set so a newly added/removed server re-resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcpServers]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        conn.refreshServerStatuses(mcpServers, { force: true }),
        checkAgentInstallStatus(mcpServers),
        computeStale(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [conn, mcpServers, checkAgentInstallStatus, computeStale]);

  const rows = useMemo<ConnectedServerRow[]>(
    () =>
      allMcpServers.map((server) => ({
        server,
        status: deriveStatus(server, oauthStatus[server.id]),
        toolCount: server.tools?.length ?? 0,
        agents: agentInstallStatus[server.name] ?? [],
        testing: conn.testingServers[server.id] === true,
      })),
    [allMcpServers, oauthStatus, agentInstallStatus, conn.testingServers]
  );

  // Disconnect = disable + tear the config out of every agent (no live socket to
  // close; agents reconnect lazily). Reconnect = enable + re-probe. Remove =
  // delete from config + agents.
  const disconnect = useCallback(
    (serverId: string): void => void crud.handleToggleMcpServer(serverId, false),
    [crud]
  );
  const reconnect = useCallback(
    async (server: IMcpServer) => {
      if (!server.enabled) await crud.handleToggleMcpServer(server.id, true);
      await conn.handleTestMcpConnection(server);
    },
    [crud, conn]
  );
  const remove = useCallback((serverId: string): void => void crud.handleDeleteMcpServer(serverId), [crud]);
  const removeStale = useCallback(
    async (name: string) => {
      await removeMcpFromAgents(name);
      await computeStale();
    },
    [removeMcpFromAgents, computeStale]
  );

  return { rows, stale, refreshing, refresh, disconnect, reconnect, remove, removeStale };
}
