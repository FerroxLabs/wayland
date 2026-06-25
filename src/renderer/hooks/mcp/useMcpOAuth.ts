import { useState, useCallback } from 'react';
import { mcpService } from '@/common/adapter/ipcBridge';
import { ConfigStorage } from '@/common/config/storage';
import type { IMcpServer } from '@/common/config/storage';
import { isElectronDesktop } from '@renderer/utils/platform';
import { startMcpOAuthHttp } from '@renderer/services/McpOAuthService';
import { setMcpByoOAuthCredentialsHttp } from '@renderer/services/McpConfigService';

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
      code: 'needs_byo' | 'transport_unsupported' | 'no_url' | 'cancelled' | 'timeout' | 'unknown';
      error?: string;
      redirectUri?: string;
      authorizationUrl?: string;
    };

/**
 * Options for a login() call. The upstream authenticate() (aioncli-core) takes
 * no AbortSignal and only self-times-out after 5 minutes, so the time bound and
 * cancel are enforced HERE by racing the IPC promise. The abandoned upstream
 * call self-closes its own callback server at its 5-min timeout.
 */
export interface McpOAuthLoginOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

// Default ceiling on the OAuth wait. A real sign-in resolves far below this; the
// timeout only fires when a vendor endpoint stalls or the user never completes
// (or mis-pastes) the consent, so the spinner can't hang the app indefinitely.
const DEFAULT_LOGIN_TIMEOUT_MS = 120_000;

/**
 * MCP OAuth management hook.
 * Handles OAuth status checks and login flow for MCP servers.
 */
export const useMcpOAuth = () => {
  const [oauthStatus, setOAuthStatus] = useState<Record<string, McpOAuthStatus>>({});
  const [loggingIn, setLoggingIn] = useState<Record<string, boolean>>({});

  // Check OAuth status
  const checkOAuthStatus = useCallback(async (server: IMcpServer) => {
    // Only check remote servers. streamable_http is what every hosted catalog
    // remote normalizes to, so it MUST be included or those servers never
    // surface a needs-login state.
    if (
      server.transport.type !== 'http' &&
      server.transport.type !== 'sse' &&
      server.transport.type !== 'streamable_http'
    ) {
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

  const login = useCallback(
    async (server: IMcpServer, scopes?: string[], options?: McpOAuthLoginOptions): Promise<McpOAuthLoginResult> => {
      setLoggingIn((prev) => ({ ...prev, [server.id]: true }));

      // The actual sign-in work. Raced below against a timeout + abort so a
      // stalled vendor endpoint or an unfinished consent can't hang forever -
      // the upstream authenticate() can't be aborted, so the bound lives here.
      const runLogin = async (): Promise<McpOAuthLoginResult> => {
        // Headless WebUI: the loginMcpOAuth IPC is denied to remote callers (it
        // mutates credential material). Start the flow over the write-only HTTP route
        // instead, which derives an origin-aware DCR redirect and persists the token
        // server-side. The route returns the vendor authorization URL; we navigate
        // this tab there so the vendor can redirect back to /api/mcp/oauth/callback.
        if (!isElectronDesktop()) {
          try {
            const result = await startMcpOAuthHttp(server.id);
            if (result.ok === true) {
              // Navigate to the vendor auth page. The vendor redirect lands on the
              // server callback, which completes + persists the token; the user
              // returns and re-checks status. Success is NOT asserted here.
              window.location.assign(result.authUrl);
              return { success: true };
            }
            return { success: false, code: 'unknown', error: result.error || 'Login failed' };
          } catch (error) {
            return { success: false, code: 'unknown', error: error instanceof Error ? error.message : 'Unknown error' };
          }
        }

        try {
          const response = await mcpService.loginMcpOAuth.invoke({
            server,
            // Pass catalog-declared scopes (e.g. GitHub repo / read:org / workflow)
            // so the authorization request actually asks for them; auto-discover the
            // rest of the OAuth config.
            config: scopes && scopes.length > 0 ? { enabled: true, scopes } : undefined,
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
        }
      };

      const timeoutMs = options?.timeoutMs ?? DEFAULT_LOGIN_TIMEOUT_MS;
      const signal = options?.signal;
      let timer: ReturnType<typeof setTimeout> | undefined;

      // Time bound: resolve to a discriminable timeout result instead of hanging.
      const timeout = new Promise<McpOAuthLoginResult>((resolve) => {
        timer = setTimeout(() => {
          resolve({ success: false, code: 'timeout', error: 'timeout' });
        }, timeoutMs);
      });

      // Cancel path: an already-aborted signal short-circuits; otherwise resolve
      // when the user aborts. The abandoned IPC promise settles in the background
      // (upstream callback server self-closes), it just no longer gates the UI.
      const abort = new Promise<McpOAuthLoginResult>((resolve) => {
        if (!signal) return;
        if (signal.aborted) {
          resolve({ success: false, code: 'cancelled', error: 'Sign-in cancelled' });
          return;
        }
        signal.addEventListener(
          'abort',
          () => resolve({ success: false, code: 'cancelled', error: 'Sign-in cancelled' }),
          { once: true },
        );
      });

      try {
        return await Promise.race([runLogin(), timeout, abort]);
      } finally {
        if (timer) clearTimeout(timer);
        setLoggingIn((prev) => ({ ...prev, [server.id]: false }));
      }
    },
    [],
  );

  /**
   * Cancel an in-flight login(). Fires the cancel IPC so the main-process
   * service aborts the OAuth wait + frees the callback port, and immediately
   * flips loggingIn -> false so the user is never stuck behind a spinner with a
   * disabled Cancel button (bug #242). Best-effort: a failed IPC still clears
   * the local in-flight state.
   */
  const cancel = useCallback(async (server: IMcpServer): Promise<void> => {
    setLoggingIn((prev) => ({ ...prev, [server.id]: false }));
    if (!isElectronDesktop()) return;
    try {
      // The service keys in-flight logins by server.name (it calls
      // authenticate(server.name, ...)), so cancel must target the NAME, not id.
      await mcpService.cancelMcpOAuth.invoke(server.name);
    } catch (error) {
      console.error('Failed to cancel OAuth login:', error);
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
        // Headless WebUI: the setMcpByoOAuthCredentials IPC is denied to remote
        // callers (it mutates credential material). Post through the write-only
        // HTTP route instead, which returns STATUS ONLY ({ ok }) - it never echoes
        // the credentials back. Reconstruct the updated record locally from the
        // (non-secret) mcp.config so the caller can retry login immediately.
        if (!isElectronDesktop()) {
          const ok = await setMcpByoOAuthCredentialsHttp(serverId, clientId, clientSecret);
          if (!ok) {
            return { success: false, error: 'Failed to save credentials' };
          }
          const servers = (await ConfigStorage.get('mcp.config').catch(() => [] as IMcpServer[])) ?? [];
          const server = servers.find((s) => s.id === serverId);
          if (!server) {
            return { success: false, error: 'MCP server not found after save' };
          }
          return { success: true, server };
        }

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
      const httpServers = servers.filter(
        (s) =>
          s.transport.type === 'http' || s.transport.type === 'sse' || s.transport.type === 'streamable_http'
      );

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
    cancel,
    logout,
    setByoCredentials,
  };
};
