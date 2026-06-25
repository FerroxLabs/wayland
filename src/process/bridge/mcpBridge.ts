/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IMcpServer } from '@/common/config/storage';
import { mcpService } from '@process/services/mcpServices/McpService';
import { mcpOAuthService } from '@process/services/mcpServices/McpOAuthService';

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
  const { ProcessConfig } = await import('@process/utils/initStorage');
  const servers: IMcpServer[] = (await ProcessConfig.get('mcp.config').catch(() => [] as IMcpServer[])) ?? [];
  const idx = servers.findIndex((s) => s.id === serverId);
  if (idx < 0) {
    return { ok: false, msg: `MCP server not found: ${serverId}` };
  }
  const updated = mcpOAuthService.setByoCredentials(servers[idx], clientId, clientSecret);
  const nextServers = [...servers];
  nextServers[idx] = { ...updated, updatedAt: Date.now() };
  await ProcessConfig.set('mcp.config', nextServers);
  return { ok: true };
}

export function initMcpBridge(): void {
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
      const { ProcessConfig } = await import('@process/utils/initStorage');
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
