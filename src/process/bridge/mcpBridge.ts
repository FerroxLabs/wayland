/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs. Changes are documented in the project history.
 */

import { ipcBridge } from '@/common';
import type { IMcpServer } from '@/common/config/storage';
import { mcpService } from '@process/services/mcpServices/McpService';
import { mcpOAuthService } from '@process/services/mcpServices/McpOAuthService';
import {
  McpConnectorArchiveStore,
  McpConnectorLifecycleService,
} from '@process/services/mcpServices/mcpConnectorArchive';
import { getConfigPath } from '@process/utils/utils';
import { ProcessConfig } from '@process/utils/initStorage';
import {
  compareAndSetMcpConfig,
  mcpConfigRevision,
  readMcpConfigSnapshot,
  updateMcpConfig,
} from '@process/services/mcpServices/mcpConfigAuthority';

export const mcpConnectorLifecycle = new McpConnectorLifecycleService(new McpConnectorArchiveStore(getConfigPath()), {
  getActiveServers: async () => (await readMcpConfigSnapshot()).servers,
  compareAndSetActiveServers: async (expected, servers) =>
    (await compareAndSetMcpConfig(mcpConfigRevision(expected), servers)).applied,
  removeFromAgents: (serverName, agents) => mcpService.removeMcpFromAgents(serverName, agents),
  syncToAgents: (servers, agents) => mcpService.syncMcpToAgents(servers, agents),
});

/**
 * Persist user-supplied BYO OAuth client credentials onto an MCP server record.
 *
 * SINGLE owner of the find -> setByoCredentials -> persist sequence: both the
 * desktop `setMcpByoOAuthCredentials` IPC handler AND the remote
 * `/api/mcp/set-byo-oauth-credentials` route call this, so the storage logic
 * lives in exactly one place.
 *
 * Write-only by construction: it returns STATUS ONLY ({ ok }). The clientSecret
 * is never read back, never echoed - the remote caller can plant a credential
 * but can never exfiltrate one (§0).
 */
export async function persistMcpByoOAuthCredentials(input: {
  serverId: string;
  clientId: string;
  clientSecret?: string;
}): Promise<{ ok: boolean; msg?: string }> {
  const { serverId, clientId, clientSecret } = input;
  if (!clientId || typeof clientId !== 'string' || !clientId.trim()) {
    return { ok: false, msg: 'clientId is required' };
  }
  // ConfigStorage exposes the same backing file as the renderer's
  // useMcpServers hook (mcp.config key on agent.config storage).
  // #283: read/write the persisted MCP config through the MAIN-process config
  // accessor (ProcessConfig = the same `configFile` used by initStorage and the
  // ACP session builder). The renderer-facing `ConfigStorage` is a bridge API
  // whose get/set route over the IPC wire; calling them from the main process
  // has no responder and hangs forever, which left "Save & sign in" spinning
  // for every BYO-OAuth MCP (GitHub, Slack, ...).
  class ServerNotFound extends Error {}
  try {
    await updateMcpConfig((servers) => {
      const idx = servers.findIndex((server) => server.id === serverId);
      if (idx < 0) throw new ServerNotFound();
      const updated = mcpOAuthService.setByoCredentials(servers[idx], clientId, clientSecret);
      const nextServers = [...servers];
      nextServers[idx] = {
        ...updated,
        updatedAt: Math.max(Date.now(), (servers[idx].updatedAt ?? 0) + 1),
      };
      return nextServers;
    });
  } catch (error) {
    if (!(error instanceof ServerNotFound)) throw error;
    return { ok: false, msg: `MCP server not found: ${serverId}` };
  }
  return { ok: true };
}

export function initMcpBridge(): void {
  ipcBridge.mcpService.getMcpConfigSnapshot.provider(async () => {
    try {
      return { success: true, data: await readMcpConfigSnapshot() };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error reading MCP config',
      };
    }
  });

  ipcBridge.mcpService.compareAndSetMcpConfig.provider(async ({ expectedRevision, nextServers }) => {
    try {
      return { success: true, data: await compareAndSetMcpConfig(expectedRevision, nextServers) };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error writing MCP config',
      };
    }
  });

  // MCP service IPC handlers
  ipcBridge.mcpService.getAgentMcpConfigs.provider(async (agents) => {
    try {
      const result = await mcpService.getAgentMcpConfigs(agents);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error getting MCP configs',
      };
    }
  });

  ipcBridge.mcpService.testMcpConnection.provider(async (server) => {
    try {
      const result = await mcpService.testMcpConnection(server);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error testing MCP connection',
      };
    }
  });

  ipcBridge.mcpService.syncMcpToAgents.provider(async ({ mcpServers, agents }) => {
    try {
      const result = await mcpService.syncMcpToAgents(mcpServers, agents);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error syncing MCP to agents',
      };
    }
  });

  ipcBridge.mcpService.removeMcpFromAgents.provider(async ({ mcpServerName, agents }) => {
    try {
      const result = await mcpService.removeMcpFromAgents(mcpServerName, agents);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error removing MCP from agents',
      };
    }
  });

  ipcBridge.mcpService.archiveConfiguredServer.provider(async ({ serverId, agents }) => {
    try {
      return { success: true, data: await mcpConnectorLifecycle.archiveConfiguredServer(serverId, agents) };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error archiving MCP connector',
      };
    }
  });

  ipcBridge.mcpService.listArchivedServers.provider(async () => {
    try {
      return { success: true, data: await mcpConnectorLifecycle.listArchivedServers() };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error listing archived MCP connectors',
      };
    }
  });

  ipcBridge.mcpService.restoreArchivedServer.provider(async ({ archiveId }) => {
    try {
      return { success: true, data: await mcpConnectorLifecycle.restoreArchivedServer(archiveId) };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error restoring MCP connector',
      };
    }
  });

  // OAuth IPC handlers
  ipcBridge.mcpService.checkOAuthStatus.provider(async (server) => {
    try {
      const result = await mcpOAuthService.checkOAuthStatus(server);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error checking OAuth status',
      };
    }
  });

  ipcBridge.mcpService.loginMcpOAuth.provider(async ({ server, config }) => {
    try {
      const result = await mcpOAuthService.login(server, config);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error during OAuth login',
      };
    }
  });

  ipcBridge.mcpService.cancelMcpOAuth.provider(async (serverName) => {
    try {
      mcpOAuthService.cancel(serverName);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error cancelling OAuth login',
      };
    }
  });

  ipcBridge.mcpService.logoutMcpOAuth.provider(async (serverName) => {
    try {
      await mcpOAuthService.logout(serverName);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error during OAuth logout',
      };
    }
  });

  ipcBridge.mcpService.getAuthenticatedServers.provider(async () => {
    try {
      const result = await mcpOAuthService.getAuthenticatedServers();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error getting authenticated servers',
      };
    }
  });

  ipcBridge.mcpService.setMcpByoOAuthCredentials.provider(async ({ serverId, clientId, clientSecret }) => {
    try {
      const result = await persistMcpByoOAuthCredentials({ serverId, clientId, clientSecret });
      if (!result.ok) {
        return { success: false, msg: result.msg ?? 'Failed to save BYO OAuth credentials' };
      }
      // The desktop renderer reads back the updated record to refresh its local
      // useMcpServers cache; re-read it from storage (the helper persisted it).
      // #283: main-process read MUST use ProcessConfig, not the renderer-bridge
      // ConfigStorage (which hangs when called from main).
      const servers: IMcpServer[] = (await ProcessConfig.get('mcp.config').catch(() => [] as IMcpServer[])) ?? [];
      const server = servers.find((s) => s.id === serverId);
      return { success: true, data: { server } };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error saving BYO OAuth credentials',
      };
    }
  });
}
