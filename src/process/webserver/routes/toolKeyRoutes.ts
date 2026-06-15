/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tool / service API-key entry from a remote WebUI client
 * (remote-secure-config W1.B). Covers the engine's keyed tool backends
 * (Brave, Tavily, Exa, Firecrawl, ElevenLabs, Groq, FAL, Hugging Face).
 *
 * Trust model: these are CONFIG-WRITE routes - they plant / clear a tool key and
 * return STATUS ONLY (`{ hasKey }`). They are WRITE-ONLY by construction: they
 * never read a key back, so they are network-tier-AGNOSTIC and work from a phone
 * on cellular (a public IP). The §0 invariant is preserved end-to-end - a remote
 * session can plant or remove a key but can never exfiltrate one.
 *
 * Gates (the storageRoutes / providerKeyRoutes shape):
 *  - `apiRateLimiter` (per-route rate limit) + `validateApiAccess` (token auth),
 *    wired as route middleware here.
 *  - tiny-csrf (global middleware in setup.ts) covers the POST verb.
 *  - `requireSecureConfigWrite` (W0 shared guard): the CONFIG-WRITE floor -
 *    refuses a secret write over plain HTTP from the public internet.
 *
 * Persistence goes through the EXISTING in-process tool-key handlers
 * (`createWcoreToolKeyHandlers` over `getToolKeyStore`) - the SAME logic the
 * desktop `wcoreToolKeys.set` / `.delete` IPC handlers run (validate id, trim,
 * encrypt-to-keychain via the model-registry creds rail). It does NOT route
 * through the WS bridge (R2: the WS denylist stays denial-only; the
 * `wcoreToolKeys.*` IPC channels remain denied to remote callers).
 */

import { type Express, type Request, type RequestHandler, type Response } from 'express';
import { apiRateLimiter } from '../middleware/security';
import { redactSecrets, requireSecureConfigWrite } from './configWriteGuards';
import { detectNetworkContext } from '../middleware/detectNetworkContext';
import { appendAudit } from '../audit/auditLog';
import { createWcoreToolKeyHandlers } from '@process/agent/wcore/toolKeyIpc';
import { getToolKeyStore } from '@process/agent/wcore/toolKeyStore';

function bodyString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Shared in-process handler set: the SAME logic behind the desktop IPC path. */
const handlers = createWcoreToolKeyHandlers(() => getToolKeyStore());

/** Read present-state for a single tool id - status only, never the key. */
async function presenceFor(id: string): Promise<boolean> {
  const list = await handlers.list();
  return list.some((p) => p.id === id && p.hasKey);
}

/**
 * Register the write-only tool-key routes for the remote WebUI (W1.B).
 */
export function registerToolKeyRoutes(app: Express, validateApiAccess: RequestHandler): void {
  // POST /api/tools/keys/set { id, key }
  // Write-only: persists the key and returns { hasKey } only.
  app.post('/api/tools/keys/set', apiRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    // CONFIG-WRITE floor: refuse a secret write over plain HTTP from the public
    // internet. Network-tier-agnostic otherwise (a cellular phone is allowed).
    if (!requireSecureConfigWrite(req, res)) return;

    const id = bodyString(req.body?.id).trim();
    const key = bodyString(req.body?.key).trim();

    if (!id) {
      res.status(400).json({ success: false, msg: 'id is required' });
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
      // The handler validates the id, trims, and rejects unknown ids itself.
      const result = await handlers.set({ id, key });

      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'tool.key.set',
        target: id,
        ip,
        reachedVia: ctx.reachedVia,
      });

      if (!result.ok) {
        res.status(400).json({ success: false, msg: 'Could not save the key (unknown tool or empty value).' });
        return;
      }

      // Status only - never echo the key.
      res.json({ success: true, data: { hasKey: await presenceFor(id) } });
    } catch (error) {
      console.error('[API] Tool key set error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to save tool key';
      res.status(500).json({ success: false, msg });
    }
  });

  // POST /api/tools/keys/delete { id }
  // Write-only: clears the stored key and returns { hasKey } only.
  app.post('/api/tools/keys/delete', apiRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    if (!requireSecureConfigWrite(req, res)) return;

    const id = bodyString(req.body?.id).trim();
    if (!id) {
      res.status(400).json({ success: false, msg: 'id is required' });
      return;
    }

    const ctx = detectNetworkContext(req);
    const ip = req.socket?.remoteAddress ?? null;

    try {
      const result = await handlers.delete({ id });

      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'tool.key.delete',
        target: id,
        ip,
        reachedVia: ctx.reachedVia,
      });

      if (!result.ok) {
        res.status(400).json({ success: false, msg: 'Could not remove the key (unknown tool).' });
        return;
      }

      res.json({ success: true, data: { hasKey: await presenceFor(id) } });
    } catch (error) {
      console.error('[API] Tool key delete error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to remove tool key';
      res.status(500).json({ success: false, msg });
    }
  });
}
