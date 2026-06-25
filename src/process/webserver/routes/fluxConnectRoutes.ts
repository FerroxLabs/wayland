/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Flux Router OAuth connect from a remote WebUI client
 * (remote-secure-config W4a). The desktop flow (process/onboarding/connectFlux)
 * runs a loopback HTTP listener + `shell.openExternal`; a phone browser has
 * neither, so this server-side variant drives the SAME Authorization Code + PKCE
 * exchange entirely on the server and persists the minted key encrypted.
 *
 * Trust model: this is a CONFIG-WRITE flow - it plants a freshly-minted Flux
 * credential and returns STATUS ONLY (`{ connected }`). It is WRITE-ONLY by
 * construction: the PKCE `code_verifier` and the minted `api_key` never leave
 * the server, and no route ever echoes a key. The §0 invariant holds end-to-end
 * - a remote session can mint + plant a Flux key but can never exfiltrate one.
 *
 * Flow (two POSTs + a GET callback bridge, all same-origin):
 *  1. POST /api/flux/connect/start
 *       Server generates PKCE, derives the redirect_uri from the SERVER-TRUSTED
 *       blessed origin (NOT a raw Host header - R12), stashes the verifier in a
 *       short-lived in-memory map keyed by `state`, and returns the authorize
 *       URL (non-secret) for the phone browser to open.
 *  2. Phone browser opens the authorize URL; Flux redirects back to
 *     GET /api/flux/connect/callback?code&state on the blessed origin. The
 *     callback bounces the browser to the SPA with the code+state so the SPA can
 *     finish the exchange (the server never serves a key-bearing page).
 *  3. POST /api/flux/connect/complete { code, state }
 *       Server looks up the stashed verifier by `state`, exchanges the code at
 *       Flux SERVER-SIDE with the SAME server-derived redirect_uri, persists via
 *       the existing connect path, and returns { connected } only.
 *
 * Gates (the providerKeyRoutes / toolKeyRoutes shape):
 *  - `apiRateLimiter` + `validateApiAccess` as route middleware.
 *  - tiny-csrf (global middleware in setup.ts) covers the POST verbs.
 *  - `requireSecureConfigWrite` (W0 shared guard): the CONFIG-WRITE floor -
 *    refuses a secret write over plain HTTP from the public internet.
 *
 * Persistence reuses the desktop core (`exchangeCode` + `connectModelRegistryProvider`)
 * - the SAME logic the desktop `onboarding.connect-flux` IPC runs (test +
 * encrypt-to-keychain + catalog + legacy mirror). It does NOT route through the
 * WS bridge (R2: the WS denylist stays denial-only).
 */

import { type Express, type Request, type RequestHandler, type Response } from 'express';
import { apiRateLimiter } from '../middleware/security';
import { redactSecrets, requireSecureConfigWrite } from './configWriteGuards';
import { detectNetworkContext } from '../middleware/detectNetworkContext';
import { appendAudit } from '../audit/auditLog';
import { SERVER_CONFIG } from '../config/constants';
import {
  buildAuthorizeUrl,
  connectFluxRemoteExchange,
  createPkce,
  FLUX_PROVIDER_ID,
} from '@process/onboarding/connectFlux';

/** Path on the blessed origin Flux redirects back to after authorize. */
const CALLBACK_PATH = '/api/flux/connect/callback';
/** SPA route the callback bounces to so the browser can POST `complete`. */
const SPA_FINISH_PATH = '/settings/models';

/** How long a pending PKCE flow stays valid before it is swept. */
const PENDING_TTL_MS = 5 * 60 * 1000;

/** A short device label for the issued key (audit/UX only, never a secret). */
const REMOTE_DEVICE_LABEL = 'Wayland WebUI';

function bodyString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** One in-flight remote PKCE exchange. The verifier NEVER leaves the server. */
type PendingFlow = { verifier: string; redirectUri: string; createdAt: number };

/**
 * Pending flows keyed by the opaque PKCE `state`. In-memory + short-TTL: a
 * minted verifier is single-use and must never be persisted to disk.
 */
const pendingFlows = new Map<string, PendingFlow>();

/** Drop any pending flow older than the TTL (lazy sweep on each start). */
function sweepExpired(now: number): void {
  for (const [state, flow] of pendingFlows) {
    if (now - flow.createdAt > PENDING_TTL_MS) pendingFlows.delete(state);
  }
}

/** Test-only: clear all pending PKCE state between cases. */
export function _resetPendingFlowsForTests(): void {
  pendingFlows.clear();
}

/**
 * Normalise an origin to `protocol//host[:port]`, or null when unparseable.
 * Mirrors setup.ts `normalizeOrigin` so this route stays single-owner.
 */
function normalizeOrigin(origin: string): string | null {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    const portSuffix = url.port ? `:${url.port}` : '';
    return `${url.protocol}//${url.hostname}${portSuffix}`;
  } catch {
    return null;
  }
}

/** The explicit operator-configured origin allowlist (WAYLAND_ALLOWED_ORIGINS). */
function allowedOrigins(): Set<string> {
  const set = new Set<string>();
  for (const raw of (process.env.WAYLAND_ALLOWED_ORIGINS || '').split(',')) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const normalized = normalizeOrigin(trimmed);
    if (normalized) set.add(normalized);
  }
  return set;
}

/**
 * Derive the SERVER-TRUSTED origin the redirect_uri is built from. R12: a raw
 * Host header is attacker-controlled, so it is NEVER trusted on its own. The
 * order of trust is:
 *
 *  1. `SERVER_BASE_URL` - the explicit public entrypoint (e.g. the nginx TLS
 *     origin). This is operator-set, not request-derived, so it is authoritative.
 *  2. The request's own origin (`detectNetworkContext` hostname + scheme) ONLY
 *     when it is in the operator's `WAYLAND_ALLOWED_ORIGINS` allowlist - the
 *     same allowlist CORS enforces. An attacker forging a Host that is not
 *     allowlisted is rejected and falls through.
 *  3. `SERVER_CONFIG.BASE_URL` - the loopback default. A safe, non-attacker
 *     origin for the local/dev case.
 */
function resolveBlessedOrigin(req: Request): string {
  const envBase = process.env.SERVER_BASE_URL ? normalizeOrigin(process.env.SERVER_BASE_URL) : null;
  if (envBase) return envBase;

  const ctx = detectNetworkContext(req);
  if (ctx.hostname) {
    // Build the candidate from the SAME validated hostname detectNetworkContext
    // uses (req.hostname), never a re-read of the raw Host header.
    const scheme = ctx.isHttps ? 'https' : 'http';
    const candidate = normalizeOrigin(`${scheme}://${ctx.hostname}`);
    // Only honour the request origin when the operator has allowlisted it.
    if (candidate && allowedOrigins().has(candidate)) return candidate;
  }

  return normalizeOrigin(SERVER_CONFIG.BASE_URL) ?? SERVER_CONFIG.BASE_URL;
}

/**
 * Register the write-only Flux remote-connect routes for the WebUI (W4a).
 */
export function registerFluxConnectRoutes(app: Express, validateApiAccess: RequestHandler): void {
  // POST /api/flux/connect/start
  // Mint PKCE, derive the redirect_uri from the blessed origin, return the
  // authorize URL only (no secret leaves the server - the verifier is stashed).
  app.post('/api/flux/connect/start', apiRateLimiter, validateApiAccess, (req: Request, res: Response) => {
    // CONFIG-WRITE floor: refuse from the public internet over plain HTTP.
    if (!requireSecureConfigWrite(req, res)) return;

    try {
      const now = Date.now();
      sweepExpired(now);

      const pkce = createPkce();
      const origin = resolveBlessedOrigin(req);
      // The token exchange MUST echo the SAME redirect_uri the authorize step
      // used; both are derived from the server-trusted origin, never the client.
      const redirectUri = `${origin}${CALLBACK_PATH}`;
      pendingFlows.set(pkce.state, { verifier: pkce.verifier, redirectUri, createdAt: now });

      const authorizeUrl = buildAuthorizeUrl(pkce.challenge, pkce.state, redirectUri, REMOTE_DEVICE_LABEL);

      // Status only: the authorize URL + state are non-secret; the verifier stays
      // server-side, keyed by state, never sent to the browser.
      res.json({ success: true, data: { authorizeUrl, state: pkce.state } });
    } catch (error) {
      console.error('[API] Flux connect start error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to start Flux connect';
      res.status(500).json({ success: false, msg });
    }
  });

  // GET /api/flux/connect/callback?code&state
  // The blessed-origin landing Flux redirects to. It never serves a key-bearing
  // page: it bounces the browser back to the SPA, which finishes via `complete`.
  // No auth middleware: the browser arrives here from Flux without the API token,
  // and this handler holds no secret and performs no write.
  app.get(CALLBACK_PATH, apiRateLimiter, (req: Request, res: Response) => {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const params = new URLSearchParams();
    if (code) params.set('fluxCode', code);
    if (state) params.set('fluxState', state);
    // Same-origin relative redirect: the SPA reads the params and POSTs complete.
    res.redirect(`${SPA_FINISH_PATH}?${params.toString()}`);
  });

  // POST /api/flux/connect/complete { code, state }
  // Exchange the code SERVER-SIDE against the stashed verifier + redirect_uri,
  // persist the minted key encrypted, and return { connected } only.
  app.post('/api/flux/connect/complete', apiRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    if (!requireSecureConfigWrite(req, res)) return;

    const code = bodyString(req.body?.code).trim();
    const state = bodyString(req.body?.state).trim();

    if (!code) {
      res.status(400).json({ success: false, msg: 'code is required' });
      return;
    }
    if (!state) {
      res.status(400).json({ success: false, msg: 'state is required' });
      return;
    }

    // CSRF guard: a state with no pending flow is forged, stale, or replayed.
    const pending = pendingFlows.get(state);
    pendingFlows.delete(state); // single-use, regardless of outcome
    if (!pending) {
      res.status(400).json({ success: false, msg: 'No pending Flux connect for this session.' });
      return;
    }

    const ctx = detectNetworkContext(req);
    // DIRECT socket peer - never req.ip (XFF is spoofable). Audit only.
    const ip = req.socket?.remoteAddress ?? null;

    try {
      // Exchange + persist via the SAME desktop core; never echoes the key.
      const result = await connectFluxRemoteExchange({
        code,
        verifier: pending.verifier,
        redirectUri: pending.redirectUri,
      });

      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'flux.connect',
        target: FLUX_PROVIDER_ID,
        ip,
        reachedVia: ctx.reachedVia,
      });

      if (result.ok === false) {
        // `result.error` is a fixed enum reason, not an upstream body, so it
        // cannot carry a key. Redact defensively anyway (R6).
        res.status(400).json({ success: false, error: redactSecrets(result.error) });
        return;
      }

      // Status only - never echo the minted key.
      res.json({ success: true, data: { connected: true } });
    } catch (error) {
      console.error('[API] Flux connect complete error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to connect Flux';
      res.status(500).json({ success: false, msg });
    }
  });
}
