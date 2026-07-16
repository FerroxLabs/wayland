/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Constitution + specialist-overlay editing from a remote WebUI client
 * (remote-secure-config Wave 3 task G).
 *
 * Trust model: the Constitution and its specialist overlays are the agent's
 * behavioral spec - PROSE, not a secret. So this surface is asymmetric:
 *  - WRITES (write / reset / write-specialist / delete-specialist) are
 *    CONFIG-WRITE routes behind `requireSecureConfigWrite` (the W0 floor:
 *    refuse a write over plain HTTP from the public internet). They return
 *    STATUS ONLY ({ ok }) - they never echo back the body they just wrote.
 *  - the single GET `/api/constitution` is a READ, allowed here because the
 *    Constitution is not a secret: the headless editor must be able to load the
 *    current prose to edit it. This is NOT a §0 violation - §0 forbids reading a
 *    SECRET back; nothing here is keyed credential material.
 *
 * Gates (the providerKeyRoutes / toolKeyRoutes shape):
 *  - `apiRateLimiter` (per-route rate limit) + `validateApiAccess` (token auth),
 *    wired as route middleware here.
 *  - tiny-csrf (global middleware in setup.ts) covers the POST verb.
 *  - `requireSecureConfigWrite` (W0 shared guard) on every write.
 *
 * Persistence goes through the EXISTING in-process constitution helpers
 * (`writeConstitution` / `resetConstitution` / `writeConstitutionSpecialist` /
 * `deleteConstitutionSpecialist`) - the SAME logic the desktop
 * `constitution:write` / `:reset` / `:writeSpecialist` / `:deleteSpecialist`
 * IPC handlers run (string + size-cap validation, atomic write, path-traversal
 * containment to `specialists/`). It does NOT route through the WS bridge (R2:
 * the WS denylist stays denial-only; the raw `constitution:*` IPC channels
 * remain unreachable to a remote caller).
 */

import { type Express, type Request, type RequestHandler, type Response } from 'express';
import { apiRateLimiter } from '../middleware/security';
import { redactSecrets, requireDestructive, requireSecureConfigWrite } from './configWriteGuards';
import { detectNetworkContext } from '../middleware/detectNetworkContext';
import { appendAudit } from '../audit/auditLog';
import {
  authorizeConstitutionEditGrant,
  CONSTITUTION_EDIT_GRANT_HEADER,
  isConstitutionEditScope,
  issueConstitutionEditGrant,
  revokeConstitutionEditGrant,
  type ConstitutionEditScope,
} from './constitutionEditGrant';
import {
  deleteConstitutionSpecialist,
  readConstitution,
  resetConstitution,
  writeConstitution,
  writeConstitutionSpecialist,
} from '@process/bridge/constitutionBridge';

function bodyString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function requestHeader(req: Request, name: string): string {
  const fromExpress = typeof req.get === 'function' ? req.get(name) : undefined;
  if (typeof fromExpress === 'string') return fromExpress;
  const raw = req.headers?.[name.toLowerCase()];
  return Array.isArray(raw) ? (raw[0] ?? '') : typeof raw === 'string' ? raw : '';
}

function requireEditGrant(req: Request, res: Response, scope: ConstitutionEditScope): boolean {
  if (!requireSecureConfigWrite(req, res)) return false;
  const authorization = authorizeConstitutionEditGrant(req, requestHeader(req, CONSTITUTION_EDIT_GRANT_HEADER), scope);
  if (authorization.authorized) return true;
  res.status(401).json({
    success: false,
    code: 'CONSTITUTION_EDIT_AUTHORIZATION_REQUIRED',
    msg: 'Unlock editing again to save these changes.',
  });
  return false;
}

function asyncRoute(handler: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
}

/**
 * Register the constitution + specialist-overlay routes for the remote WebUI.
 */
export function registerConstitutionRoutes(app: Express, validateApiAccess: RequestHandler): void {
  // GET /api/constitution
  // Read-only: returns the current Constitution prose so the headless editor can
  // load it. The Constitution is NOT a secret, so a read here is allowed.
  app.get('/api/constitution', apiRateLimiter, validateApiAccess, (_req: Request, res: Response) => {
    try {
      res.json({ success: true, data: { content: readConstitution() } });
    } catch (error) {
      console.error('[API] Constitution read error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to read constitution';
      res.status(500).json({ success: false, msg });
    }
  });

  // POST /api/constitution/edit-grant { password, scopes }
  // A fresh operator-network + password step-up mints one short-lived opaque
  // autosave grant. The server retains only its digest, bound to user, direct
  // socket peer, expiry, and exact write scopes.
  app.post(
    '/api/constitution/edit-grant',
    apiRateLimiter,
    validateApiAccess,
    asyncRoute(async (req: Request, res: Response) => {
      const requested = req.body?.scopes;
      if (
        !Array.isArray(requested) ||
        requested.length === 0 ||
        requested.length > 32 ||
        !requested.every(isConstitutionEditScope)
      ) {
        res.status(400).json({ success: false, msg: 'At least one valid edit scope is required.' });
        return;
      }
      if (!(await requireDestructive(req, res, bodyString(req.body?.password)))) return;

      const grant = issueConstitutionEditGrant(req, requested);
      if (!grant) {
        res.status(403).json({ success: false, msg: 'Could not bind edit authorization to this session.' });
        return;
      }

      const ctx = detectNetworkContext(req);
      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'constitution.editGrant.issue',
        target: [...new Set(requested)].toSorted().join(','),
        ip: req.socket?.remoteAddress ?? null,
        reachedVia: ctx.reachedVia,
        result: 'success',
      });
      res.set('Cache-Control', 'no-store');
      res.set('Pragma', 'no-cache');
      res.json({ success: true, data: { grant: grant.token, expiresAt: grant.expiresAt } });
    })
  );

  // POST /api/constitution/edit-grant/revoke
  // Revocation is idempotent and never reveals whether a supplied token existed.
  app.post('/api/constitution/edit-grant/revoke', apiRateLimiter, validateApiAccess, (req: Request, res: Response) => {
    if (!requireSecureConfigWrite(req, res)) return;
    revokeConstitutionEditGrant(req, requestHeader(req, CONSTITUTION_EDIT_GRANT_HEADER));
    res.json({ success: true, data: { ok: true } });
  });

  // POST /api/constitution/write { content } + scoped edit-grant header
  // Write-only: overwrites the Constitution and returns { ok } only.
  app.post('/api/constitution/write', apiRateLimiter, validateApiAccess, (req: Request, res: Response) => {
    // Autosave uses a short-lived grant minted only after a fresh destructive
    // step-up. It remains subject to auth, CSRF, secure transport, rate limit,
    // exact scope, size limits, persistence CAS/archive, and audit controls.
    if (!requireEditGrant(req, res, 'constitution.write')) return;

    if (typeof req.body?.content !== 'string') {
      res.status(400).json({ success: false, msg: 'content is required' });
      return;
    }
    const content = req.body.content as string;

    const ctx = detectNetworkContext(req);
    // DIRECT socket peer - never req.ip (XFF is spoofable). Audit only.
    const ip = req.socket?.remoteAddress ?? null;

    try {
      // The helper validates the content (string + size cap) and writes atomically.
      const ok = writeConstitution(content);

      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'constitution.write',
        target: null,
        ip,
        reachedVia: ctx.reachedVia,
        result: ok ? 'success' : 'failure',
      });

      if (!ok) {
        res.status(400).json({ success: false, msg: 'Could not save the Constitution (too large or invalid).' });
        return;
      }

      // Status only - never echo the body back.
      res.json({ success: true, data: { ok: true } });
    } catch (error) {
      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'constitution.write',
        target: null,
        ip,
        reachedVia: ctx.reachedVia,
        result: 'failure',
      });
      console.error('[API] Constitution write error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to save constitution';
      res.status(500).json({ success: false, msg });
    }
  });

  // POST /api/constitution/reset
  // Write-only: restores the default Constitution and returns { ok } only.
  app.post(
    '/api/constitution/reset',
    apiRateLimiter,
    validateApiAccess,
    asyncRoute(async (req: Request, res: Response) => {
      // Reset is destructive and is deliberately outside continuous edit grants.
      if (!(await requireDestructive(req, res, bodyString(req.body?.password)))) return;

      const ctx = detectNetworkContext(req);
      const ip = req.socket?.remoteAddress ?? null;

      try {
        resetConstitution();

        void appendAudit({
          userId: req.user?.id ?? null,
          action: 'constitution.reset',
          target: null,
          ip,
          reachedVia: ctx.reachedVia,
          result: 'success',
        });

        // Status only - never echo the default body back.
        res.json({ success: true, data: { ok: true } });
      } catch (error) {
        void appendAudit({
          userId: req.user?.id ?? null,
          action: 'constitution.reset',
          target: null,
          ip,
          reachedVia: ctx.reachedVia,
          result: 'failure',
        });
        console.error('[API] Constitution reset error:', error);
        const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to reset constitution';
        res.status(500).json({ success: false, msg });
      }
    })
  );

  // POST /api/constitution/write-specialist { id, content }
  // Write-only: overwrites a specialist overlay and returns { ok } only.
  app.post('/api/constitution/write-specialist', apiRateLimiter, validateApiAccess, (req: Request, res: Response) => {
    const id = bodyString(req.body?.id).trim();
    if (!id) {
      res.status(400).json({ success: false, msg: 'id is required' });
      return;
    }
    if (typeof req.body?.content !== 'string') {
      res.status(400).json({ success: false, msg: 'content is required' });
      return;
    }
    const content = req.body.content as string;
    if (!requireEditGrant(req, res, `specialist.write:${id}`)) return;

    const ctx = detectNetworkContext(req);
    const ip = req.socket?.remoteAddress ?? null;

    try {
      // The helper validates the id (path-traversal containment) + content.
      const ok = writeConstitutionSpecialist(id, content);

      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'constitution.writeSpecialist',
        target: id,
        ip,
        reachedVia: ctx.reachedVia,
        result: ok ? 'success' : 'failure',
      });

      if (!ok) {
        res
          .status(400)
          .json({ success: false, msg: 'Could not save the overlay (invalid id, too large, or write failed).' });
        return;
      }

      res.json({ success: true, data: { ok: true } });
    } catch (error) {
      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'constitution.writeSpecialist',
        target: id,
        ip,
        reachedVia: ctx.reachedVia,
        result: 'failure',
      });
      console.error('[API] Constitution write-specialist error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to save specialist overlay';
      res.status(500).json({ success: false, msg });
    }
  });

  // POST /api/constitution/delete-specialist { id }
  // Write-only: removes a specialist overlay and returns { ok } only.
  app.post(
    '/api/constitution/delete-specialist',
    apiRateLimiter,
    validateApiAccess,
    asyncRoute(async (req: Request, res: Response) => {
      // AGENT-AUTHORITY: removing an overlay changes the agent's instruction set.
      // DESTRUCTIVE bar: operator-network + step-up.
      if (!(await requireDestructive(req, res, bodyString(req.body?.password)))) return;

      const id = bodyString(req.body?.id).trim();
      if (!id) {
        res.status(400).json({ success: false, msg: 'id is required' });
        return;
      }

      const ctx = detectNetworkContext(req);
      const ip = req.socket?.remoteAddress ?? null;

      try {
        const ok = deleteConstitutionSpecialist(id);

        void appendAudit({
          userId: req.user?.id ?? null,
          action: 'constitution.deleteSpecialist',
          target: id,
          ip,
          reachedVia: ctx.reachedVia,
          result: ok ? 'success' : 'failure',
        });

        if (!ok) {
          res.status(400).json({ success: false, msg: 'Could not remove the overlay (invalid id or delete failed).' });
          return;
        }

        res.json({ success: true, data: { ok: true } });
      } catch (error) {
        void appendAudit({
          userId: req.user?.id ?? null,
          action: 'constitution.deleteSpecialist',
          target: id,
          ip,
          reachedVia: ctx.reachedVia,
          result: 'failure',
        });
        console.error('[API] Constitution delete-specialist error:', error);
        const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to remove specialist overlay';
        res.status(500).json({ success: false, msg });
      }
    })
  );
}
