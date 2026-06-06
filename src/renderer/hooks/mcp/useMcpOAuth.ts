import { useState, useCallback } from 'react';
import { mcpService } from '@/common/adapter/ipcBridge';
import type { IMcpServer } from '@/common/config/storage';

export interface McpOAuthStatus {
  isAuthenticated: boolean;
  needsLogin: boolean;
  isChecking: boolean;
  error?: string;
}

/**
 * Result of an OAuth login attempt. Mirrors the service-layer
 * OAuthLoginResult so callers can discriminate on `code` to route
 * DCR-unavailable vendors into the BYO credentials modal.
 */
export type McpOAuthLoginResult =
  | { success: true }
  | {
      success: false;
      code: 'needs_byo' | 'transport_unsupported' | 'no_url' | 'cancelled' | 'unknown';
      error?: string;
      redirectUri?: string;
      authorizationUrl?: string;
    };

/**
 * MCP OAuth management hook.
 * Handles OAuth status checks and login flow for MCP servers.
 */
export const useMcpOAuth = () => {
  const [oauthStatus, setOAuthStatus] = useState<Record<string, McpOAuthStatus>>({});
  const [loggingIn, setLoggingIn] = useState<Record<string, boolean>>({});

  // Check OAuth status
  const checkOAuthStatus = useCallback(async (server: IMcpServer) => {
    // Only check HTTP/SSE servers
    if (server.transport.type !== 'http' && server.transport.type !== 'sse') {
      return;
    }

    setOAuthStatus((prev) => ({
      ...prev,
      [server.id]: {
        isAuthenticated: false,
        needsLogin: false,
        isChecking: true,
      },
    }));

    try {
      const response = await mcpService.checkOAuthStatus.invoke(server);

      if (response.success && response.data) {
        setOAuthStatus((prev) => ({
          ...prev,
          [server.id]: {
            isAuthenticated: response.data.isAuthenticated,
            needsLogin: response.data.needsLogin,
            isChecking: false,
            error: response.data.error,
          },
        }));
      } else {
        setOAuthStatus((prev) => ({
          ...prev,
          [server.id]: {
            isAuthenticated: false,
            needsLogin: false,
            isChecking: false,
            error: response.msg,
          },
        }));
      }
    } catch (error) {
      console.error('Failed to check OAuth status:', error);
      setOAuthStatus((prev) => ({
        ...prev,
        [server.id]: {
          isAuthenticated: false,
          needsLogin: false,
          isChecking: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    }
  }, []);

  const login = useCallback(async (server: IMcpServer): Promise<McpOAuthLoginResult> => {
    setLoggingIn((prev) => ({ ...prev, [server.id]: true }));

    try {
      const response = await mcpService.loginMcpOAuth.invoke({
        server,
        config: undefined, // Use auto discovery
      });

      if (response.success && response.data) {
        const inner = response.data;
        if (inner.success === true) {
          setOAuthStatus((prev) => ({
            ...prev,
            [server.id]: {
              isAuthenticated: true,
              needsLogin: false,
              isChecking: false,
            },
          }));
          return { success: true };
        }
        // inner.success === false: discriminator narrows to the BYO/error shape.
        return {
          success: false,
          code: inner.code,
          error: inner.error,
          redirectUri: inner.redirectUri,
          authorizationUrl: inner.authorizationUrl,
        };
      }

      return {
        success: false,
        code: 'unknown',
        error: response.msg || 'Login failed',
      };
    } catch (error) {
      return {
        success: false,
        code: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setLoggingIn((prev) => ({ ...prev, [server.id]: false }));
    }
  }, []);

  /**
   * Persist user-supplied OAuth client credentials for vendors that don't
   * support Dynamic Client Registration (Slack, GitHub, HubSpot, Zoom, Box,
   * Figma...). Returns the updated server record on success - caller is
   * responsible for refreshing useMcpServers so the next login() call sees
   * server.byoOAuth.
   */
  const setByoCredentials = useCallback(
    async (
      serverId: string,
      clientId: string,
      clientSecret?: string,
    ): Promise<{ success: boolean; server?: IMcpServer; error?: string }> => {
      try {
        const response = await mcpService.setMcpByoOAuthCredentials.invoke({
          serverId,
          clientId,
          clientSecret,
        });
        if (response.success && response.data?.server) {
          return { success: true, server: response.data.server };
        }
        return { success: false, error: response.msg || 'Failed to save credentials' };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [],
  );

  // Logout
  const logout = useCallback(
    async (serverName: string, serverId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await mcpService.logoutMcpOAuth.invoke(serverName);

        if (response.success) {
          // Logout succeeded; update status
          setOAuthStatus((prev) => ({
            ...prev,
            [serverId]: {
              isAuthenticated: false,
              needsLogin: true,
              isChecking: false,
            },
          }));
          return { success: true };
        } else {
          return {
            success: false,
            error: response.msg || 'Logout failed',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    []
  );

  // Batch-check OAuth status for multiple servers
  const checkMultipleServers = useCallback(
    async (servers: IMcpServer[]) => {
      const httpServers = servers.filter((s) => s.transport.type === 'http' || s.transport.type === 'sse');

      await Promise.all(httpServers.map((server) => checkOAuthStatus(server)));
    },
    [checkOAuthStatus]
  );

  return {
    oauthStatus,
    loggingIn,
    checkOAuthStatus,
    checkMultipleServers,
    login,
    logout,
    setByoCredentials,
  };
};
