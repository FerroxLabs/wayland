/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MCP OAuth (DCR) connect from a remote WebUI client
 * (remote-secure-config W4a). Covers the hosted MCP servers whose vendor supports
 * Dynamic Client Registration (DCR) - the client is registered on the fly and the
 * redirect URI is chosen at registration time, so it can be made ORIGIN-AWARE for
 * a remote session. BYO-OAuth vendors (the user must paste a redirect URI into
 * their own console) are explicitly OUT OF SCOPE here - that is W4b.
 *
 * Trust model: this is a CONFIG-WRITE route - it kicks off the OAuth flow and the
 * server persists the resulting token ENCRYPTED via the existing MCP token store.
 * It is WRITE-ONLY by construction: it never reads a token / secret back. The §0
 * invariant is preserved end-to-end - a remote session can grant Wayland access to
 * a vendor but can never exfiltrate the token Wayland stored. The `authUrl` we
 * return is the vendor's PUBLIC authorization-endpoint URL the phone must visit;
 * it is not a secret, and is the minimum needed for a remote browser to start the
 * flow (the server cannot open the phone's browser for it).
 *
 * Gates (the toolKeyRoutes / providerKeyRoutes shape):
 *  - `apiRateLimiter` (per-route rate limit) + `validateApiAccess` (token auth),
 *    wired as route middleware on the connect verb.
 *  - tiny-csrf (global middleware in setup.ts) covers the connect POST.
 *  - `requireSecureConfigWrite` (W0 shared guard): the CONFIG-WRITE floor -
 *    refuses to start a secret-bearing flow over plain HTTP from the public
 *    internet.
 *
 * Origin-aware redirect (the W4a keystone): for a REMOTE session the DCR
 * redirect_uri is derived from the VALIDATED blessed origin (the same source
 * detectNetworkContext judges from - SERVER_BASE_URL / the validated hostname,
 * NEVER a raw Host header). The desktop loopback default is preserved unchanged
 * when the request is NOT remote, so the existing desktop flow is untouched.
 *
 * Callback forwarding: the upstream MCP OAuth provider binds a LOCAL callback
 * server on OAUTH_CALLBACK_PORT (57000) and blocks on it. The remote browser is
 * redirected to OUR public `/api/mcp/oauth/callback`, which forwards the
 * `code`+`state` to that local server so the upstream flow unblocks, exchanges the
 * code for a token, and persists it. The forwarder never returns the token.
 *
 * Persistence goes through the EXISTING in-process `mcpOAuthService.login` - the
 * SAME singleton the desktop `loginMcpOAuth` IPC handler runs (encrypt-to-store
 * via MCPOAuthTokenStorage). It does NOT route through the WS bridge (R2: the WS
 * denylist stays denial-only; the `mcpService.*` IPC channels remain denied to
 * remote callers).
 */

import { type Express, type Request, type RequestHandler, type Response } from 'express';
import http from 'node:http';
import { coreEvents, CoreEvent } from '@office-ai/aioncli-core/dist/src/utils/events.js';
import { apiRateLimiter } from '../middleware/security';
import { redactSecrets, requireSecureConfigWrite } from './configWriteGuards';
import { detectNetworkContext } from '../middleware/detectNetworkContext';
import { appendAudit } from '../audit/auditLog';
import type { IMcpServer } from '@/common/config/storage';
import {
  mcpOAuthService,
  WAYLAND_OAUTH_CALLBACK_PORT,
  WAYLAND_OAUTH_REDIRECT_URI,
} from '@process/services/mcpServices/McpOAuthService';

/** The path the vendor redirects the remote browser back to (our public origin). */
const REMOTE_CALLBACK_PATH = '/api/mcp/oauth/callback';

function bodyString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Load the persisted MCP servers (same backing key the desktop bridge reads).
 * A storage failure is allowed to propagate to the route's catch so the error is
 * redacted before it reaches the client (R6).
 *
 * #283/#397: the read MUST go through `ProcessConfig` (direct main-process file
 * accessor), NOT the renderer-facing `ConfigStorage`, which round-trips over IPC
 * and HANGS when called from the main process (the webserver runs in main). The
 * desktop bridge was fixed in #283; this is the same hang on the remote-WebUI
 * GitHub MCP OAuth surface, which wedged "Save & Sign In" with no resolution.
 */
async function loadServers(): Promise<IMcpServer[]> {
  const { ProcessConfig } = await import('@process/utils/initStorage');
  return (await ProcessConfig.get('mcp.config')) ?? [];
}

/**
 * Derive the OAuth redirect_uri for this request.
 *
 * Desktop default (NOT remote): the pinned loopback callback. Preserving this
 * keeps the existing desktop flow byte-for-byte unchanged.
 *
 * Remote session: the callback on the VALIDATED blessed origin. The origin is
 * taken from the SAME source detectNetworkContext judges from - SERVER_BASE_URL
 * (the explicit public entrypoint) when set, else the request's validated scheme
 * + hostname. We NEVER trust a raw `Host` header value directly. Returns null when
 * a remote session has no derivable stable origin (caller refuses the flow).
 */
export function deriveRedirectUri(req: Request): string | null {
  const ctx = detectNetworkContext(req);

  // Desktop / loopback default: keep the pinned localhost callback.
  if (ctx.reachedVia === 'loopback') {
    return WAYLAND_OAUTH_REDIRECT_URI;
  }

  // Remote: prefer the blessed public entrypoint (SERVER_BASE_URL); this is the
  // same value detectHttps consults, so origin + isHttps stay consistent.
  const base = process.env.SERVER_BASE_URL;
  if (base) {
    try {
      const u = new URL(base);
      return `${u.protocol}//${u.host}${REMOTE_CALLBACK_PATH}`;
    } catch {
      /* fall through to validated-hostname derivation */
    }
  }

  // Fall back to the request's VALIDATED hostname (Express-derived, trust-proxy
  // aware) + the scheme detectNetworkContext already decided. Never a raw Host.
  if (ctx.hostname) {
    const scheme = ctx.isHttps ? 'https' : 'http';
    return `${scheme}://${ctx.hostname}${REMOTE_CALLBACK_PATH}`;
  }

  return null;
}

/**
 * Capture the vendor authorization URL the upstream flow emits as user feedback.
 *
 * The upstream `authenticate()` emits a "Opening your browser... copy and paste
 * this URL:\n<authUrl>" feedback message synchronously, right after it builds the
 * auth URL and before it blocks on the callback. We subscribe for the next such
 * message and pull the first https URL out of it - that is the public
 * authorization endpoint the remote browser must navigate to. Not a secret.
 */
function captureAuthUrl(): { promise: Promise<string | null>; dispose: () => void } {
  let timer: NodeJS.Timeout | undefined;
  let onFeedback: ((payload: { message?: string }) => void) | undefined;
  const dispose = (): void => {
    if (onFeedback) coreEvents.off(CoreEvent.UserFeedback, onFeedback);
    if (timer) clearTimeout(timer);
  };
  const promise = new Promise<string | null>((resolve) => {
    const settle = (v: string | null): void => {
      dispose();
      resolve(v);
    };
    onFeedback = (payload: { message?: string }): void => {
      const url = typeof payload?.message === 'string' ? payload.message.match(/https?:\/\/\S+/)?.[0] : undefined;
      if (url) settle(url);
    };
    coreEvents.on(CoreEvent.UserFeedback, onFeedback);
    // The auth URL is emitted within the discovery+registration round-trip; if it
    // never arrives (transport error before auth-url build) resolve null so the
    // route still responds rather than hanging.
    timer = setTimeout(() => settle(null), 20_000);
  });
  return { promise, dispose };
}

/**
 * Register the write-only MCP OAuth (DCR) routes for the remote WebUI (W4a).
 */
export function registerMcpOAuthRoutes(app: Express, validateApiAccess: RequestHandler): void {
  // POST /api/mcp/oauth/connect { serverId }
  // Write-only: starts the DCR OAuth flow with an origin-aware redirect and
  // returns STATUS + the public authUrl the remote browser must visit. Never a
  // token. The login promise runs in the background and persists the token once
  // the callback (below) unblocks it.
  app.post('/api/mcp/oauth/connect', apiRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    // CONFIG-WRITE floor: refuse to start a secret-bearing flow over plain HTTP
    // from the public internet. Network-tier-agnostic otherwise.
    if (!requireSecureConfigWrite(req, res)) return;

    const serverId = bodyString(req.body?.serverId).trim();
    if (!serverId) {
      res.status(400).json({ success: false, msg: 'serverId is required' });
      return;
    }

    const ctx = detectNetworkContext(req);
    // DIRECT socket peer - never req.ip (XFF is spoofable). Audit only.
    const ip = req.socket?.remoteAddress ?? null;

    const redirectUri = deriveRedirectUri(req);
    if (!redirectUri) {
      res.status(400).json({
        success: false,
        msg: 'Cannot derive a callback origin for this remote session. Configure SERVER_BASE_URL or use a stable hostname.',
      });
      return;
    }

    try {
      const servers = await loadServers();
      const server = servers.find((s) => s.id === serverId);
      if (!server) {
        res.status(400).json({ success: false, msg: 'Unknown MCP server.' });
        return;
      }

      // Audit the connect attempt (never a token) - best-effort, never throws.
      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'mcp.oauth-connect',
        target: serverId,
        ip,
        reachedVia: ctx.reachedVia,
      });

      // Kick off the flow. We do NOT await completion here: the upstream login
      // blocks on the local callback server until the remote browser finishes and
      // the forwarder (below) feeds it the code. We capture the auth URL the flow
      // emits and return it so the phone can navigate.
      const capture = captureAuthUrl();
      const loginPromise = mcpOAuthService
        .login(server, { enabled: true, redirectUri })
        .catch((error) => {
          console.error('[API] MCP OAuth login error:', error);
          return { success: false as const, code: 'unknown' as const };
        })
        .finally(() => capture.dispose());
      // Surface unhandled rejections cleanly; the result is consumed via the
      // callback flow, not here.
      void loginPromise;

      const authUrl = await capture.promise;
      if (!authUrl) {
        res.status(502).json({
          success: false,
          msg: 'Could not start the OAuth flow (no authorization URL from the vendor).',
        });
        return;
      }

      // Status + the public auth URL only. Never a token.
      res.json({ success: true, data: { status: 'pending', authUrl } });
    } catch (error) {
      console.error('[API] MCP OAuth connect error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to start MCP OAuth';
      res.status(500).json({ success: false, msg });
    }
  });

  // GET /api/mcp/oauth/callback?code=&state=
  // The remote-origin landing the vendor redirects the phone's browser to. Auth
  // is NOT required here (the vendor's redirect is an unauthenticated browser
  // navigation); the upstream callback server validates `state` (CSRF) before it
  // accepts the code, so a forged hit cannot complete a flow. We forward the
  // query to the LOCAL upstream callback server so its blocked promise resolves,
  // then show a close-the-window page. We never read or echo a token.
  app.get(REMOTE_CALLBACK_PATH, (req: Request, res: Response) => {
    const code = bodyString(req.query?.code);
    const state = bodyString(req.query?.state);
    const error = bodyString(req.query?.error);

    const port = Number(process.env.OAUTH_CALLBACK_PORT) || Number(WAYLAND_OAUTH_CALLBACK_PORT);
    const search = new URLSearchParams();
    if (code) search.set('code', code);
    if (state) search.set('state', state);
    if (error) search.set('error', error);

    const forward = http.request(
      {
        host: '127.0.0.1',
        port,
        path: `/oauth/callback?${search.toString()}`,
        method: 'GET',
      },
      (upstream) => {
        // Drain the upstream response; we do not relay its body (it may name the
        // server) - we render our own neutral close page.
        upstream.resume();
        upstream.on('end', () => {
          res.status(200).type('html').send(closeWindowHtml());
        });
      }
    );
    forward.on('error', (err) => {
      console.error('[API] MCP OAuth callback forward error:', err);
      // Still render the close page: the user has finished in the browser, and we
      // never leak token material on this path.
      res.status(200).type('html').send(closeWindowHtml());
    });
    forward.end();
  });
}

/** Neutral "you can close this" page. Contains no token / server identity. */
function closeWindowHtml(): string {
  return [
    '<!doctype html><html><head><meta charset="utf-8"><title>Connected</title></head>',
    '<body style="font-family:system-ui;padding:2rem;text-align:center">',
    '<h1>Authorization received</h1>',
    '<p>You can close this window and return to Wayland.</p>',
    '<script>setTimeout(function(){window.close();},500);</script>',
    '</body></html>',
  ].join('');
}
