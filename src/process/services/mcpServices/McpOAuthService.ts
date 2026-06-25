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
  endpointUrl: string
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
const originalFetchProtectedResourceMetadata = OAuthUtils.fetchProtectedResourceMetadata.bind(OAuthUtils);
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
const originalDiscoverOAuthFromWWWAuthenticate = OAuthUtils.discoverOAuthFromWWWAuthenticate.bind(OAuthUtils);

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

// Shared recovery for the RFC 9728 §7.3 strict-equality resource check. When a
// server advertises a protected-resource that is a same-origin PREFIX of the
// URL we connect to - connect to https://host/mcp, but the OAuth boundary is
// advertised as the bare origin https://host (Linear, Higgsfield, ...) - the
// upstream throws ResourceMismatchError. On that specific mismatch we re-run
// with a temporary buildResourceParameter override that returns the advertised
// form so the strict compare passes; any other mismatch still throws.
//
// This must wrap BOTH discovery entry points:
//   - discoverOAuthConfig            -> the login() pre-probe
//   - discoverOAuthFromWWWAuthenticate -> used INSIDE authenticate() when the
//     first request comes back 401 + WWW-Authenticate
// Higgsfield reaches the second path, so patching only the first (the original
// Linear-only fix) left the bare-origin OAuth servers failing with
// "Protected resource <origin> does not match expected <origin>/mcp".
async function withSameOriginPrefixRecovery<T>(serverUrl: string | undefined, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    const advertised =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message).match(/Protected resource (\S+)/)?.[1]
        : undefined;
    const recoverable =
      err instanceof Error &&
      err.name === 'ResourceMismatchError' &&
      !!advertised &&
      !!serverUrl &&
      isSameOriginPrefix(advertised, serverUrl);
    if (!recoverable) {
      throw err;
    }
    // Force the advertised (prefix/origin) form so the strict compare passes,
    // then restore so other servers keep their own canonical resource.
    const saved = OAuthUtils.buildResourceParameter;
    const advForced = canonicalizeRootResource(advertised!);
    (OAuthUtils as unknown as { buildResourceParameter: (u: string) => string }).buildResourceParameter = () =>
      advForced;
    try {
      return await run();
    } finally {
      (OAuthUtils as unknown as { buildResourceParameter: typeof saved }).buildResourceParameter = saved;
    }
  }
}

(
  OAuthUtils as unknown as {
    discoverOAuthConfig: (serverUrl: string) => Promise<unknown>;
  }
).discoverOAuthConfig = (serverUrl: string) =>
  withSameOriginPrefixRecovery(serverUrl, () => originalDiscoverOAuthConfig(serverUrl));

(
  OAuthUtils as unknown as {
    discoverOAuthFromWWWAuthenticate: (wwwAuthenticate: string, mcpServerUrl?: string) => Promise<unknown>;
  }
).discoverOAuthFromWWWAuthenticate = (wwwAuthenticate: string, mcpServerUrl?: string) =>
  withSameOriginPrefixRecovery(mcpServerUrl, () =>
    originalDiscoverOAuthFromWWWAuthenticate(wwwAuthenticate, mcpServerUrl)
  );

/**
 * #283 / #306: Decide whether `url` is an OAuth-protected MCP endpoint by running
 * OAuth metadata discovery (RFC 9728 protected-resource + RFC 8414 auth-server)
 * against it. This is deliberately INDEPENDENT of the connection probe's HTTP
 * status: GitHub's remote MCP answers an unauthenticated probe with
 * 400 "missing required Authorization header" and Google Workspace MCP behaves
 * similarly - neither returns the RFC 6750 `401 + WWW-Authenticate` challenge the
 * old detection keyed on. Discovery still succeeds because the `.well-known`
 * metadata endpoints are reachable regardless of the probe status.
 *
 * Used to GATE the "treat a non-2xx probe as auth-required" rule (Overwatch
 * ruling on #283): a non-2xx response only means "sign-in required" when OAuth is
 * actually discoverable here, so a transient 5xx with no discoverable OAuth stays
 * a plain connection error instead of triggering a spurious sign-in flow.
 *
 * Never throws - any discovery failure (network error, no metadata, malformed
 * response) resolves to `false`.
 */
export async function isOAuthProtectedEndpoint(url: string): Promise<boolean> {
  try {
    const discovered = (await OAuthUtils.discoverOAuthConfig(url)) as
      | { authorizationUrl?: string; registrationUrl?: string }
      | null
      | undefined;
    return Boolean(discovered && (discovered.authorizationUrl || discovered.registrationUrl));
  } catch {
    return false;
  }
}

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

// Max time a single BYO/DCR login() is allowed to wait for the loopback OAuth
// callback before we give up and return control to the renderer. The upstream
// MCPOAuthProvider only rejects on its own 5-minute timer, which is far too
// long - the user sees a frozen "Save & sign in" with no way out. Cap the wait
// so a never-arriving callback (wrong redirect URI, closed browser tab) fails
// in ~2 minutes with a structured 'timeout' result instead of hanging.
const OAUTH_LOGIN_TIMEOUT_MS = 120_000;

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
      code: 'needs_byo' | 'transport_unsupported' | 'no_url' | 'cancelled' | 'timeout' | 'unknown';
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

  /**
   * In-flight login()s keyed by server name, so cancel(serverName) can abort a
   * specific login (or cancel() with no arg aborts all). Each entry's abort()
   * settles the login()'s Promise.race with a 'cancelled' result and closes the
   * upstream loopback callback server to free port 57000.
   */
  private inflightLogins = new Map<string, { abort: () => void }>();

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

      // Fast path: an RFC 6750 challenge (401 + WWW-Authenticate) unambiguously
      // means the endpoint wants OAuth.
      if (response.status === 401 && response.headers.get('WWW-Authenticate')) {
        return this.authStatusFromStoredToken(server);
      }

      // Reachable and not demanding auth.
      if (response.ok) {
        return {
          isAuthenticated: true,
          needsLogin: false,
        };
      }

      // #283 / #306: some remote MCP servers reject an unauthenticated probe
      // WITHOUT a 401 challenge - GitHub's returns 400 "missing required
      // Authorization header", Google Workspace similarly. A non-2xx probe is
      // only an auth requirement when the endpoint actually advertises OAuth, so
      // gate on discovery (independent of the probe status). A transient 5xx with
      // no discoverable OAuth stays a connection error, not a spurious sign-in.
      if (await isOAuthProtectedEndpoint(url)) {
        return this.authStatusFromStoredToken(server);
      }

      // Non-2xx and no discoverable OAuth: a genuine connection failure. Do NOT
      // report it as authenticated - that was the original fall-through bug that
      // left #283/#306 servers looking "connected" while every request 400s.
      return {
        isAuthenticated: false,
        needsLogin: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
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
   * Resolve OAuth status from any stored credentials for `server`: authenticated
   * when a non-expired token exists, otherwise login required. Shared by the
   * 401-challenge fast path and the #283/#306 discovery-gated path so both reach
   * the identical token-presence/expiry decision.
   */
  private async authStatusFromStoredToken(server: IMcpServer): Promise<OAuthStatus> {
    const credentials = await this.tokenStorage.getCredentials(server.name);

    if (credentials && credentials.token) {
      // Have a token, but it may be expired.
      const isExpired = this.tokenStorage.isTokenExpired(credentials.token);
      return {
        isAuthenticated: !isExpired,
        needsLogin: isExpired,
        error: isExpired ? 'Token expired' : undefined,
      };
    }

    // No token; login required.
    return {
      isAuthenticated: false,
      needsLogin: true,
    };
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

    // Thread the catalog-declared OAuth scopes (e.g. GitHub's repo / read:org /
    // workflow) into the config so the authorization request actually asks for
    // them. Without this the vendor grants only its default scope set and the
    // connector silently lacks the access the catalog advertised. The caller
    // (renderer login() -> loginMcpOAuth IPC) passes them via oauthConfig.scopes.
    if (oauthConfig?.scopes && oauthConfig.scopes.length > 0) {
      config.scopes = oauthConfig.scopes;
    }

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
              error:
                'This vendor does not support automatic OAuth client registration. Paste a manually-registered client_id (and secret) to continue.',
            };
          }
        } catch (probeErr) {
          // Probe failure is non-fatal - fall through and let authenticate()
          // attempt its own discovery. We just lose the early needs_byo signal.
          console.warn(`[McpOAuthService] Pre-probe failed for ${server.name}:`, probeErr);
        }
      }
    }

    // Race authenticate() against a timeout / explicit cancel so a never-arriving
    // loopback callback can't hang the renderer for the upstream 5-minute timer.
    // authenticate() itself isn't AbortSignal-aware, so on timeout/cancel we
    // resolve the race with a structured failure AND close the upstream callback
    // server to free port 57000; the orphaned authenticate() promise is left to
    // settle on the upstream timer (it can no longer affect the UI).
    let settleAbort: ((reason: 'cancelled' | 'timeout') => void) | undefined;
    const abortPromise = new Promise<{ aborted: 'cancelled' | 'timeout' }>((resolve) => {
      settleAbort = (reason) => resolve({ aborted: reason });
    });
    const timer = setTimeout(() => settleAbort?.('timeout'), OAUTH_LOGIN_TIMEOUT_MS);
    if (timer.unref) timer.unref();

    const closeCallbackServer = () => {
      try {
        (
          this.oauthProvider as unknown as { _activeCallbackServer?: { close?: () => void } }
        )._activeCallbackServer?.close?.();
      } catch {
        /* already closed */
      }
    };

    this.inflightLogins.set(server.name, { abort: () => settleAbort?.('cancelled') });

    try {
      const outcome = await Promise.race([
        this.oauthProvider.authenticate(server.name, config, url).then(() => ({ ok: true as const })),
        abortPromise,
      ]);

      if ('aborted' in outcome) {
        closeCallbackServer();
        return {
          success: false,
          code: outcome.aborted,
          error:
            outcome.aborted === 'timeout'
              ? `OAuth login timed out after ${Math.round(OAUTH_LOGIN_TIMEOUT_MS / 1000)}s waiting for the authorization callback.`
              : 'OAuth login was cancelled.',
        };
      }

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
    } finally {
      clearTimeout(timer);
      this.inflightLogins.delete(server.name);
    }
  }

  /**
   * Abort an in-flight login(). With a serverName, aborts only that login; with
   * no arg, aborts every in-flight login. The aborted login() resolves with a
   * `{ success: false, code: 'cancelled' }` result and its upstream loopback
   * callback server is closed (freeing port 57000). Safe to call when nothing is
   * in flight - it's a no-op. Lets the renderer's Cancel button unstick a user
   * waiting on a callback that will never arrive.
   */
  cancel(serverName?: string): void {
    if (serverName) {
      this.inflightLogins.get(serverName)?.abort();
      return;
    }
    for (const entry of this.inflightLogins.values()) {
      entry.abort();
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
