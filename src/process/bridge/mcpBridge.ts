/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { ConfigStorage } from '@/common/config/storage';
import type { IMcpServer } from '@/common/config/storage';
import { mcpService } from '@process/services/mcpServices/McpService';
import { mcpOAuthService } from '@process/services/mcpServices/McpOAuthService';

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
      if (!clientId || typeof clientId !== 'string' || !clientId.trim()) {
        return { success: false, msg: 'clientId is required' };
      }
      // ConfigStorage exposes the same backing file as the renderer's
      // useMcpServers hook (mcp.config key on agent.config storage).
      const servers: IMcpServer[] = (await ConfigStorage.get('mcp.config').catch(() => [] as IMcpServer[])) ?? [];
      const idx = servers.findIndex((s) => s.id === serverId);
      if (idx < 0) {
        return { success: false, msg: `MCP server not found: ${serverId}` };
      }
      const updated = mcpOAuthService.setByoCredentials(servers[idx], clientId, clientSecret);
      const nextServers = [...servers];
      nextServers[idx] = { ...updated, updatedAt: Date.now() };
      await ConfigStorage.set('mcp.config', nextServers);
      return { success: true, data: { server: nextServers[idx] } };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Unknown error saving BYO OAuth credentials',
      };
    }
  });
}
