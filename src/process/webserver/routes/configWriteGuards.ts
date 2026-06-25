/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The single shared gate for every remote config-write route
 * (remote-secure-config W0). Parallel feature builders MUST call these helpers
 * rather than inventing their own per-route checks, so the trust tiers stay
 * consistent across the whole config-write surface.
 *
 * TIERS (cross-audit 2026-06-15 R1):
 *  - CONFIG-WRITE  = authenticated session + secure transport + CSRF + per-route
 *    rate-limit. NETWORK-TIER-AGNOSTIC: a phone on cellular (public IP) can plant
 *    a write-only key. Enforced by `requireSecureConfigWrite`. The CSRF +
 *    rate-limit pieces live as middleware on the route itself (apiRateLimiter +
 *    tiny-csrf); this guard enforces the HTTPS-when-public floor.
 *  - DESTRUCTIVE   = CONFIG-WRITE floor + operator network + step-up password.
 *    Enforced by `requireDestructive`.
 *
 * The §0 invariant still holds end-to-end: these guards gate WRITES only. No
 * route built on them may return a secret back to the caller. `redactSecrets`
 * is provided so callers can scrub any upstream error body before echoing it
 * to a remote client (R6).
 */

import type { Request, Response } from 'express';
import { AuthService } from '@process/webserver/auth/service/AuthService';
import { UserRepository } from '@process/webserver/auth/repository/UserRepository';
import { detectNetworkContext } from '../middleware/detectNetworkContext';
import { classifyClientTrust } from '../middleware/networkTrust';

/**
 * Step-up failure lockout (R7). The route's own `authRateLimiter` throttles
 * request VOLUME, but it counts every request and resets on success - it is not
 * a failure-counting password oracle defence. This gate-internal counter is the
 * real lockout: it increments ONLY on a wrong step-up password and locks the
 * caller out for the window once the threshold is hit, regardless of which
 * limiter a future config-write route happens to wire up. A correct password
 * clears the counter immediately so a legitimate operator is never penalised.
 *
 * Keyed by user-id + direct socket peer so one device's fat-fingering cannot
 * lock another, and so the lockout cannot be reset by rotating the auth token.
 */
const STEP_UP_MAX_FAILURES = 5;
const STEP_UP_WINDOW_MS = 15 * 60 * 1000;

type StepUpEntry = { failures: number; lockedUntil: number; resetAt: number };

const stepUpFailures = new Map<string, StepUpEntry>();

function stepUpKey(req: Request, password: string): string {
  const peer = socketPeer(req) ?? 'unknown';
  const userId = req.user?.id ?? 'anon';
  // Password is never stored; it only participates so the key is stable per
  // caller, not per attempt. (userId + peer is the real identity.)
  void password;
  return `${userId}|${peer}`;
}

/**
 * Returns the milliseconds remaining on an active lockout for this caller, or 0
 * when they are free to attempt a step-up. Expired windows are pruned lazily.
 */
function stepUpLockoutRemaining(key: string, now: number): number {
  const entry = stepUpFailures.get(key);
  if (!entry) return 0;
  if (now >= entry.resetAt) {
    stepUpFailures.delete(key);
    return 0;
  }
  if (entry.lockedUntil > now) return entry.lockedUntil - now;
  return 0;
}

/** Record a failed step-up; locks the caller out once the threshold is hit. */
function recordStepUpFailure(key: string, now: number): void {
  const existing = stepUpFailures.get(key);
  const entry: StepUpEntry =
    existing && now < existing.resetAt ? existing : { failures: 0, lockedUntil: 0, resetAt: now + STEP_UP_WINDOW_MS };
  entry.failures += 1;
  if (entry.failures >= STEP_UP_MAX_FAILURES) {
    entry.lockedUntil = now + STEP_UP_WINDOW_MS;
    entry.resetAt = entry.lockedUntil;
  }
  stepUpFailures.set(key, entry);
}

/** Clear the failure counter for a caller after a correct password. */
function clearStepUpFailures(key: string): void {
  stepUpFailures.delete(key);
}

/** Test-only: drop all lockout state between cases. */
export function _resetStepUpLockoutForTests(): void {
  stepUpFailures.clear();
}

/**
 * Verify the step-up password for the authenticated user. Destructive actions
 * require re-entering the WebUI password even for an operator session, so a
 * session left open on an unlocked device cannot perform an irreversible action.
 *
 * SINGLE implementation: storageRoutes imports this rather than re-declaring it.
 */
export async function verifyStepUp(req: Request, password: string): Promise<boolean> {
  if (!password || !req.user?.id) return false;
  const user = await UserRepository.findById(req.user.id);
  if (!user) return false;
  return AuthService.verifyPassword(password, user.password_hash);
}

/**
 * The DIRECT socket peer for trust classification. NEVER `req.ip`: with trust
 * proxy set to private ranges, `req.ip` can be rewritten from a spoofable
 * `X-Forwarded-For` by a public attacker; the raw socket peer cannot be forged.
 */
function socketPeer(req: Request): string | undefined {
  return req.socket?.remoteAddress ?? undefined;
}

/**
 * Mask known secret formats in arbitrary text so an upstream error body echoed
 * to a remote client cannot leak the very key that was just planted (R6).
 *
 * Covers OpenAI-style `sk-...` keys (incl. `sk-live-`, `sk-proj-`, etc.),
 * `Bearer <token>` authorization values, and `xai-`/`xoxb-` style prefixes.
 * Conservative on purpose: it is fine to over-redact in an error message.
 */
export function redactSecrets(text: string): string {
  if (!text) return text;
  return (
    text
      // Bearer <token>  -> Bearer [redacted]
      .replace(/\bBearer\s+[A-Za-z0-9._\-+/=]+/gi, 'Bearer [redacted]')
      // sk-... / sk-live-... / sk-proj-... (OpenAI/Anthropic-style)
      .replace(/\bsk-[A-Za-z0-9-]{8,}/g, 'sk-[redacted]')
      // xai- (xAI) and xoxb-/xoxp- (Slack) style prefixed tokens
      .replace(/\bxai-[A-Za-z0-9-]{8,}/g, 'xai-[redacted]')
      .replace(/\bxox[baprs]-[A-Za-z0-9-]{8,}/g, 'xox-[redacted]')
  );
}

/**
 * Enforce the CONFIG-WRITE floor. Returns true when the request may proceed;
 * returns false AFTER writing a 403 response when it must be refused.
 *
 * The only hard refusal here is plain-HTTP over the PUBLIC internet (no secure
 * transport for a secret write). Loopback / Tailscale / private-network reaches
 * are allowed without HTTPS (their transport is already locally confined or
 * cryptographically authenticated). Auth, CSRF and rate-limit are enforced by
 * the route's own middleware and are assumed already satisfied here.
 */
export function requireSecureConfigWrite(req: Request, res: Response): boolean {
  const ctx = detectNetworkContext(req);

  if (ctx.reachedVia === 'public_internet' && !ctx.isHttps) {
    res.status(403).json({
      success: false,
      msg: 'HTTPS required: secret writes from the public internet must use a secure connection (HTTPS / Tailscale).',
    });
    return false;
  }

  return true;
}

/**
 * Enforce the DESTRUCTIVE tier: the CONFIG-WRITE floor PLUS operator-network
 * (direct socket peer is loopback / Tailscale / allowlisted) PLUS a step-up
 * password re-verify. Returns true to proceed; returns false AFTER writing the
 * appropriate 403/401 when refused.
 */
export async function requireDestructive(req: Request, res: Response, password: string): Promise<boolean> {
  // CONFIG-WRITE floor first (also handles plain-http-public refusal).
  if (!requireSecureConfigWrite(req, res)) return false;

  // Operator network: judged from the DIRECT socket peer.
  if (classifyClientTrust(socketPeer(req)) !== 'operator') {
    res.status(403).json({
      success: false,
      msg: 'This action is only available from a trusted local network (loopback or Tailscale).',
    });
    return false;
  }

  // Step-up password re-verify, behind a failure-counting lockout (R7). The
  // lockout is enforced HERE, in the shared gate, so it protects every
  // config-write consumer regardless of the route's own rate-limiter wiring -
  // the foundation no longer bakes in a 60/min password oracle.
  const now = Date.now();
  const key = stepUpKey(req, password);
  const lockedFor = stepUpLockoutRemaining(key, now);
  if (lockedFor > 0) {
    res.setHeader('Retry-After', Math.ceil(lockedFor / 1000).toString());
    res.status(429).json({
      success: false,
      msg: 'Too many failed password attempts. Try again later.',
    });
    return false;
  }

  if (!(await verifyStepUp(req, password))) {
    recordStepUpFailure(key, now);
    res.status(401).json({ success: false, msg: 'Password confirmation failed.' });
    return false;
  }

  clearStepUpFailures(key);
  return true;
}
