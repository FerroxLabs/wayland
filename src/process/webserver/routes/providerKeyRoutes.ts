/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Provider API-key entry from a remote WebUI client (remote-secure-config W1.A).
 *
 * Trust model: this is a CONFIG-WRITE route - it plants a provider key and
 * returns STATUS ONLY. It is WRITE-ONLY by construction: it never reads a key
 * back, so it is network-tier-AGNOSTIC and works from a phone on cellular (a
 * public IP). The §0 invariant is preserved end-to-end - a remote session can
 * plant a key but can never exfiltrate one.
 *
 * Gates (the storageRoutes shape):
 *  - `apiRateLimiter` (per-route rate limit) + `validateApiAccess` (token auth),
 *    wired as route middleware here.
 *  - tiny-csrf (global middleware in setup.ts) covers the POST verb.
 *  - `requireSecureConfigWrite` (W0 shared guard): the CONFIG-WRITE floor -
 *    refuses a secret write over plain HTTP from the public internet.
 *
 * Persistence goes through the EXISTING in-process `connectModelRegistryProvider`
 * - the SAME path the desktop `modelRegistry.connect` IPC handler runs (test +
 * encrypt-to-keychain + catalog + legacy mirror). It does NOT route through the
 * WS bridge (R2: the WS denylist stays denial-only).
 *
 * The denied RETURNS-SECRET channels (`detectKeys`, `resolveForChatStart`,
 * `connect`/`rekey` via the bridge) are untouched - this is a NEW write-only
 * sibling, not an un-gated read.
 */

import { type Express, type Request, type RequestHandler, type Response } from 'express';
import { apiRateLimiter } from '../middleware/security';
import { redactSecrets, requireSecureConfigWrite } from './configWriteGuards';
import { detectNetworkContext } from '../middleware/detectNetworkContext';
import { appendAudit } from '../audit/auditLog';
import { connectModelRegistryProvider, getModelRegistryProviderView } from '@process/providers/ipc/modelRegistryIpc';
import type { ProviderId } from '@process/providers/types';

function bodyString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Register the write-only provider-key routes for the remote WebUI (W1.A).
 */
export function registerProviderKeyRoutes(app: Express, validateApiAccess: RequestHandler): void {
  // POST /api/providers/connect { providerId, key, baseUrl? }
  // Write-only: persists the key and returns { state, modelCount } only.
  app.post('/api/providers/connect', apiRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    // CONFIG-WRITE floor: refuse a secret write over plain HTTP from the public
    // internet. Network-tier-agnostic otherwise (a cellular phone is allowed).
    if (!requireSecureConfigWrite(req, res)) return;

    const providerId = bodyString(req.body?.providerId).trim();
    const key = bodyString(req.body?.key).trim();
    const baseUrl = bodyString(req.body?.baseUrl).trim() || undefined;

    if (!providerId) {
      res.status(400).json({ success: false, msg: 'providerId is required' });
      return;
    }
    if (!key) {
      res.status(400).json({ success: false, msg: 'key is required' });
      return;
    }

    const ctx = detectNetworkContext(req);
    // DIRECT socket peer - never req.ip (XFF is spoofable). Audit only.
    const ip = req.socket?.remoteAddress ?? null;

    try {
      const creds = baseUrl ? { key, baseUrl } : { key };
      const result = await connectModelRegistryProvider(providerId as ProviderId, creds);

      // Audit the write attempt (never the key) - best-effort, never throws.
      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'provider.connect',
        target: providerId,
        ip,
        reachedVia: ctx.reachedVia,
      });

      if (!result.ok) {
        // `result.error` is a fixed ConnectError enum code, not an upstream
        // body, so it cannot carry a key. Redact defensively anyway (R6) in case
        // a future connect path ever widens the error shape.
        res.status(400).json({ success: false, error: redactSecrets(result.error ?? 'unknown') });
        return;
      }

      // Status only - never echo the key. Read the non-secret view the Models
      // page already uses so the status is sourced from exactly one place.
      const view = await getModelRegistryProviderView(providerId as ProviderId);
      res.json({
        success: true,
        data: { state: view?.state ?? 'connected', modelCount: view?.modelCount ?? 0 },
      });
    } catch (error) {
      console.error('[API] Provider connect error:', error);
      // Strip any secret material that might appear in an unexpected error.
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to connect provider';
      res.status(500).json({ success: false, msg });
    }
  });
}
