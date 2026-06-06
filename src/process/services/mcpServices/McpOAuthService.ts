/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { MCPOAuthProvider, OAUTH_DISPLAY_MESSAGE_EVENT } from '@office-ai/aioncli-core/dist/src/mcp/oauth-provider.js';
import { MCPOAuthTokenStorage } from '@office-ai/aioncli-core/dist/src/mcp/oauth-token-storage.js';
import { OAuthUtils } from '@office-ai/aioncli-core/dist/src/mcp/oauth-utils.js';
import type { MCPOAuthConfig } from '@office-ai/aioncli-core/dist/src/mcp/oauth-provider.js';
import { coreEvents, CoreEvent } from '@office-ai/aioncli-core/dist/src/utils/events.js';
import { EventEmitter } from 'node:events';
import type { IMcpServer } from '@/common/config/storage';

// RFC 9728 §7.3 strict `===` comparison vs vendor-deployed inconsistency on
// trailing slashes:
//   - Slack returns resource="https://mcp.slack.com" (no slash)
//   - Box / Calendly / Miro / Vercel return resource="https://mcp.box.com/" (slash)
//   - WHATWG URL parser normalizes empty pathname to "/", so the upstream
//     buildResourceParameter always produces the slashy form
// Canonicalize BOTH sides to no-trailing-slash for root-only URLs so neither
// vendor deployment style trips the mismatch error. 20 of the 29 hosted-OAuth
// catalog entries depend on this normalization.
function canonicalizeRootResource(value: string): string {
  try {
    const u = new URL(value);
    if ((u.pathname === '/' || u.pathname === '') && value.endsWith('/')) {
      return value.slice(0, -1);
    }
  } catch {
    /* fall through */
  }
  return value;
}

const originalBuildResourceParameter = OAuthUtils.buildResourceParameter.bind(OAuthUtils);
(OAuthUtils as unknown as { buildResourceParameter: (url: string) => string }).buildResourceParameter = (
  endpointUrl: string,
): string => canonicalizeRootResource(originalBuildResourceParameter(endpointUrl));

// Mirror the canonicalization on the inbound side. discoverOAuthConfig compares
// `resourceMetadata.resource !== expectedResource` with strict equality - both
// sides must be canonicalized for the slash variants to match. This handles the
// root-URL vendors (Slack, Box, Calendly, Miro, Vercel...) where the only
// difference is a trailing slash.
//
// NOTE: do NOT do path-prefix widening here. fetchProtectedResourceMetadata
// receives the well-known METADATA url (https://host/.well-known/oauth-protected-resource[/path]),
// NOT the MCP server url, so this function has no way to know the requested
// endpoint path. Path-vs-base mismatches (Linear: requests /mcp, advertises the
// bare host) are handled in the discoverOAuthConfig wrapper below, which DOES
// have the server url in scope.
const originalFetchProtectedResourceMetadata =
  OAuthUtils.fetchProtectedResourceMetadata.bind(OAuthUtils);
(
  OAuthUtils as unknown as {
    fetchProtectedResourceMetadata: (url: string) => Promise<{ resource?: string } | null>;
  }
).fetchProtectedResourceMetadata = async (url: string) => {
  const metadata = await originalFetchProtectedResourceMetadata(url);
  if (metadata && typeof metadata.resource === 'string') {
    metadata.resource = canonicalizeRootResource(metadata.resource);
  }
  return metadata;
};

// Wrap discoverOAuthConfig to recover from a ResourceMismatchError when the
// server advertises a resource that is a same-origin PREFIX of the URL we
// requested. Linear is the canonical case: we connect to
// https://mcp.linear.app/mcp but its protected-resource metadata advertises
// `resource: https://mcp.linear.app` (the OAuth boundary is the API root, not
// the transport endpoint). RFC 9728 §7.3's strict-equality check rejects this,
// but it's a legitimate deployment pattern. On mismatch, re-run discovery with
// a temporary buildResourceParameter override that returns the advertised form,
// so the comparison passes. Only applies when advertised is a genuine prefix -
// any other mismatch still throws.
const originalDiscoverOAuthConfig = OAuthUtils.discoverOAuthConfig.bind(OAuthUtils);
function isSameOriginPrefix(advertised: string, requested: string): boolean {
  try {
    const a = new URL(advertised);
    const r = new URL(requested);
    if (a.protocol !== r.protocol || a.host !== r.host) return false;
    const aPath = a.pathname === '/' ? '' : a.pathname.replace(/\/$/, '');
    const rPath = r.pathname === '/' ? '' : r.pathname.replace(/\/$/, '');
    return aPath === '' || rPath === aPath || rPath.startsWith(`${aPath}/`);
  } catch {
    return false;
  }
}
(
  OAuthUtils as unknown as {
    discoverOAuthConfig: (serverUrl: string) => Promise<unknown>;
  }
).discoverOAuthConfig = async (serverUrl: string) => {
  try {
    return await originalDiscoverOAuthConfig(serverUrl);
  } catch (err) {
    const advertised =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message).match(/Protected resource (\S+)/)?.[1]
        : undefined;
    const isMismatch =
      err instanceof Error && err.name === 'ResourceMismatchError' && !!advertised;
    if (!isMismatch || !isSameOriginPrefix(advertised!, serverUrl)) {
      throw err;
    }
    // Temporarily override buildResourceParameter to return the advertised
    // (prefix) form so the strict compare inside discoverOAuthConfig passes.
    const saved = OAuthUtils.buildResourceParameter;
    const advForced = canonicalizeRootResource(advertised!);
    (OAuthUtils as unknown as { buildResourceParameter: (u: string) => string }).buildResourceParameter =
      () => advForced;
    try {
      return await originalDiscoverOAuthConfig(serverUrl);
    } finally {
      (OAuthUtils as unknown as { buildResourceParameter: typeof saved }).buildResourceParameter = saved;
    }
  }
};

// Pin the OAuth callback server port. Upstream picks a random OS-assigned port
// unless OAUTH_CALLBACK_PORT is set, which is fine for DCR flows (the freshly-
// registered client_id is throwaway). But BYO flows require the user to paste
// a redirect URI into their vendor OAuth-app console once, and that URI's port
// must match what the callback server actually binds. Pin to 57000 unless the
// user has explicitly overridden it. Same port for DCR and BYO - DCR registers
// the same redirect URI it'll receive on.
export const WAYLAND_OAUTH_CALLBACK_PORT = '57000';
export const WAYLAND_OAUTH_REDIRECT_URI = `http://localhost:${WAYLAND_OAUTH_CALLBACK_PORT}/oauth/callback`;
if (!process.env.OAUTH_CALLBACK_PORT) {
  process.env.OAUTH_CALLBACK_PORT = WAYLAND_OAUTH_CALLBACK_PORT;
}

export interface OAuthStatus {
  isAuthenticated: boolean;
  needsLogin: boolean;
  error?: string;
}

export type OAuthLoginResult =
  | { success: true }
  | {
      success: false;
      /**
       * Stable failure-code the renderer can branch on. Add new codes here
       * as new failure modes are discovered.
       */
      code: 'needs_byo' | 'transport_unsupported' | 'no_url' | 'cancelled' | 'unknown';
      error?: string;
      /** When code='needs_byo', the redirect URI the user must register on the vendor. */
      redirectUri?: string;
      /** When code='needs_byo', the vendor's authorization-server URL. */
      authorizationUrl?: string;
    };

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

    // Auto-confirm OAuth consent prompts. The MCPOAuthProvider in
    // @office-ai/aioncli-core fires a ConsentRequest event before opening the
    // browser; in a Gemini-CLI TTY it prompts on stdin, but in Electron's
    // main process stdin is non-interactive and the call falls through to a
    // FatalAuthenticationError ("Interactive consent could not be obtained.
    // Please run Gemini CLI in an interactive terminal...").
    //
    // The user clicking "Sign in with <vendor>" in the renderer IS the
    // consent - there's no reason to surface a second prompt. Wire a
    // listener that auto-confirms.
    coreEvents.on(CoreEvent.ConsentRequest, (payload: { prompt: string; onConfirm: (confirmed: boolean) => void }) => {
      console.log('[McpOAuthService] Auto-confirming OAuth consent:', payload.prompt);
      payload.onConfirm(true);
    });
  }

  /**
   * Check whether the MCP server requires OAuth auth
   * Detection is done by attempting a connection and inspecting the WWW-Authenticate header
   */
  async checkOAuthStatus(server: IMcpServer): Promise<OAuthStatus> {
    try {
      // OAuth applies to all HTTP-family transports (http, sse, streamable_http).
      // stdio servers spawn locally and use API keys / env vars instead.
      if (
        server.transport.type !== 'http' &&
        server.transport.type !== 'sse' &&
        server.transport.type !== 'streamable_http'
      ) {
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
   * Run the OAuth login flow.
   *
   * Flow:
   *   1. Validate transport is HTTP-family + URL is present.
   *   2. Build oauthConfig - populate clientId/clientSecret from server.byoOAuth
   *      if the user has pasted credentials for a vendor that doesn't support DCR.
   *   3. Pre-probe DCR support. If no stored credentials AND no registration_endpoint
   *      advertised by the auth server, short-circuit with `code: 'needs_byo'` so the
   *      renderer can open the BYO-credentials modal - avoids the worse UX of failing
   *      mid-flight inside MCPOAuthProvider with "dynamic registration not supported".
   *   4. Delegate to oauthProvider.authenticate(). Upstream skips DCR when clientId
   *      is set; otherwise it performs DCR and proceeds.
   */
  async login(server: IMcpServer, oauthConfig?: MCPOAuthConfig): Promise<OAuthLoginResult> {
    if (
      server.transport.type !== 'http' &&
      server.transport.type !== 'sse' &&
      server.transport.type !== 'streamable_http'
    ) {
      return {
        success: false,
        code: 'transport_unsupported',
        error: `OAuth requires an HTTP-family transport (http / sse / streamable_http), got '${server.transport.type}'`,
      };
    }

    const url = server.transport.url;
    if (!url) {
      return { success: false, code: 'no_url', error: 'No URL provided' };
    }

    const config: MCPOAuthConfig = oauthConfig ? { ...oauthConfig } : { enabled: true };

    // Step 2: BYO credentials short-circuit. If the user has previously pasted
    // client_id/secret for this server, populate them so MCPOAuthProvider skips
    // its DCR attempt.
    if (server.byoOAuth?.clientId) {
      config.clientId = server.byoOAuth.clientId;
      if (server.byoOAuth.clientSecret) {
        config.clientSecret = server.byoOAuth.clientSecret;
      }
      // Pin redirect URI so the user's registered OAuth-app callback matches.
      config.redirectUri ??= WAYLAND_OAUTH_REDIRECT_URI;
    } else {
      // Step 3: Pre-probe DCR support. Skip when caller already provided a
      // pre-resolved authorizationUrl + registrationUrl in oauthConfig (no
      // need to re-discover).
      if (!config.authorizationUrl || !config.registrationUrl) {
        try {
          const discovered = await OAuthUtils.discoverOAuthConfig(url);
          if (discovered && !discovered.registrationUrl) {
            return {
              success: false,
              code: 'needs_byo',
              redirectUri: WAYLAND_OAUTH_REDIRECT_URI,
              authorizationUrl: discovered.authorizationUrl,
              error: 'This vendor does not support automatic OAuth client registration. Paste a manually-registered client_id (and secret) to continue.',
            };
          }
        } catch (probeErr) {
          // Probe failure is non-fatal - fall through and let authenticate()
          // attempt its own discovery. We just lose the early needs_byo signal.
          console.warn(`[McpOAuthService] Pre-probe failed for ${server.name}:`, probeErr);
        }
      }
    }

    try {
      await this.oauthProvider.authenticate(server.name, config, url);
      console.log(`[McpOAuthService] OAuth login successful for ${server.name}`);
      return { success: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);

      // Defensive: if MCPOAuthProvider's own DCR attempt failed even though our
      // pre-probe didn't flag it (vendor advertises registration_endpoint but
      // rejects POSTs - Figma 403, etc.), surface as needs_byo so the user gets
      // the BYO modal instead of a raw error.
      if (/dynamic registration not supported/i.test(msg) || /client registration failed/i.test(msg)) {
        return {
          success: false,
          code: 'needs_byo',
          redirectUri: WAYLAND_OAUTH_REDIRECT_URI,
          error: msg,
        };
      }

      if (/cancelled/i.test(msg)) {
        return { success: false, code: 'cancelled', error: msg };
      }

      console.error('[McpOAuthService] OAuth login failed:', error);
      return { success: false, code: 'unknown', error: msg };
    }
  }

  /**
   * Persist user-supplied OAuth client credentials onto the server record.
   * Called when the user fills out the BYO credentials modal. Caller is
   * responsible for persisting the mutated IMcpServer back to storage.
   */
  setByoCredentials(server: IMcpServer, clientId: string, clientSecret?: string): IMcpServer {
    return {
      ...server,
      byoOAuth: {
        clientId: clientId.trim(),
        clientSecret: clientSecret?.trim() || undefined,
      },
    };
  }

  /**
   * Clear stored BYO credentials (e.g. when user wants to re-paste).
   */
  clearByoCredentials(server: IMcpServer): IMcpServer {
    const { byoOAuth: _omit, ...rest } = server;
    return rest;
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
