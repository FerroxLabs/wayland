/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { MCPOAuthProvider, OAUTH_DISPLAY_MESSAGE_EVENT } from '@office-ai/aioncli-core/dist/src/mcp/oauth-provider.js';
import { MCPOAuthTokenStorage } from '@office-ai/aioncli-core/dist/src/mcp/oauth-token-storage.js';
import type { MCPOAuthConfig } from '@office-ai/aioncli-core/dist/src/mcp/oauth-provider.js';
import { EventEmitter } from 'node:events';
import type { IMcpServer } from '@/common/config/storage';

export interface OAuthStatus {
  isAuthenticated: boolean;
  needsLogin: boolean;
  error?: string;
}

/**
 * MCP OAuth service
 *
 * Manages the OAuth auth flow for MCP servers
 * Built on top of the OAuth feature in @office-ai/aioncli-core
 */
export class McpOAuthService {
  private oauthProvider: MCPOAuthProvider;
  private tokenStorage: MCPOAuthTokenStorage;
  private eventEmitter: EventEmitter;

  constructor() {
    this.tokenStorage = new MCPOAuthTokenStorage();
    this.oauthProvider = new MCPOAuthProvider(this.tokenStorage);
    this.eventEmitter = new EventEmitter();

    // Listen for OAuth display-message events
    this.eventEmitter.on(OAUTH_DISPLAY_MESSAGE_EVENT, (message: string) => {
      console.log('[McpOAuthService] OAuth Message:', message);
      // Can be forwarded to the frontend over WebSocket
    });
  }

  /**
   * Check whether the MCP server requires OAuth auth
   * Detection is done by attempting a connection and inspecting the WWW-Authenticate header
   */
  async checkOAuthStatus(server: IMcpServer): Promise<OAuthStatus> {
    try {
      // Only HTTP/SSE transport types support OAuth
      if (server.transport.type !== 'http' && server.transport.type !== 'sse') {
        return {
          isAuthenticated: true,
          needsLogin: false,
        };
      }

      const url = server.transport.url;
      if (!url) {
        return {
          isAuthenticated: false,
          needsLogin: false,
          error: 'No URL provided',
        };
      }

      // Try to reach the MCP server
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      // Check whether it returned 401 Unauthorized
      if (response.status === 401) {
        const wwwAuthenticate = response.headers.get('WWW-Authenticate');

        if (wwwAuthenticate) {
          // Server requires OAuth auth
          // Check whether we already have a stored token
          const credentials = await this.tokenStorage.getCredentials(server.name);

          if (credentials && credentials.token) {
            // Have a token, but it may be expired
            const isExpired = this.tokenStorage.isTokenExpired(credentials.token);

            return {
              isAuthenticated: !isExpired,
              needsLogin: isExpired,
              error: isExpired ? 'Token expired' : undefined,
            };
          }

          // No token; login required
          return {
            isAuthenticated: false,
            needsLogin: true,
          };
        }
      }

      // Connection succeeded or auth not required
      return {
        isAuthenticated: true,
        needsLogin: false,
      };
    } catch (error) {
      console.error('[McpOAuthService] Error checking OAuth status:', error);
      return {
        isAuthenticated: false,
        needsLogin: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Run the OAuth login flow
   */
  async login(server: IMcpServer, oauthConfig?: MCPOAuthConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // Only HTTP/SSE transport types support OAuth
      if (server.transport.type !== 'http' && server.transport.type !== 'sse') {
        return {
          success: false,
          error: 'OAuth only supported for HTTP/SSE transport',
        };
      }

      const url = server.transport.url;
      if (!url) {
        return {
          success: false,
          error: 'No URL provided',
        };
      }

      // If no OAuth config was provided, try server discovery
      let config = oauthConfig;
      if (!config) {
        // Use default config; the OAuth provider will attempt auto-discovery
        config = {
          enabled: true,
        };
      }

      // Run the OAuth auth flow
      await this.oauthProvider.authenticate(server.name, config, url);

      console.log(`[McpOAuthService] OAuth login successful for ${server.name}`);
      return { success: true };
    } catch (error) {
      console.error('[McpOAuthService] OAuth login failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get a valid access token
   */
  async getValidToken(server: IMcpServer, oauthConfig?: MCPOAuthConfig): Promise<string | null> {
    try {
      const config = oauthConfig || { enabled: true };
      return await this.oauthProvider.getValidToken(server.name, config);
    } catch (error) {
      console.error('[McpOAuthService] Failed to get valid token:', error);
      return null;
    }
  }

  /**
   * Logout (delete stored token)
   */
  async logout(serverName: string): Promise<void> {
    try {
      await this.tokenStorage.deleteCredentials(serverName);
      console.log(`[McpOAuthService] Logged out from ${serverName}`);
    } catch (error) {
      console.error('[McpOAuthService] Failed to logout:', error);
      throw error;
    }
  }

  /**
   * Get the list of all authenticated servers
   */
  async getAuthenticatedServers(): Promise<string[]> {
    try {
      return await this.tokenStorage.listServers();
    } catch (error) {
      console.error('[McpOAuthService] Failed to list servers:', error);
      return [];
    }
  }

  /**
   * Get the event emitter, used to listen for OAuth messages
   */
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }
}

// Singleton export
export const mcpOAuthService = new McpOAuthService();
