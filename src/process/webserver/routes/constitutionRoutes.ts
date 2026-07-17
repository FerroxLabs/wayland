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
 * Persistence goes through the process-wide ConstitutionFsService - the same
 * owner used by desktop IPC and prompt composition. It does NOT route through
 * the WS bridge (R2:
 * the WS denylist stays denial-only; the raw `constitution:*` IPC channels
 * remain unreachable to a remote caller).
 */

import { type Express, type Request, type RequestHandler, type Response } from 'express';
import { apiRateLimiter } from '../middleware/security';
import { redactSecrets, requireDestructive, requireSecureConfigWrite, verifyStepUp } from './configWriteGuards';
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
import { DEFAULT_CONSTITUTION } from '@/common/constitutionDefault';
import { ConstitutionFsTransactionError } from '@process/services/constitution/constitutionFsTransaction';
import {
  getConstitutionFsService,
  type ConstitutionFsService,
  type ConstitutionMutationResult,
  type ConstitutionReadResult,
} from '@process/services/constitution/constitutionFsService';
import { constitutionMutationQuiescence } from '@process/services/constitution/constitutionMutationQuiescence';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function bodyString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function expectedRevision(body: unknown): { valid: true; value: string } | { valid: false } {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.hasOwn(body, 'expectedRevision')) {
    return { valid: false };
  }
  const value = (body as { expectedRevision?: unknown }).expectedRevision;
  return typeof value === 'string' && value.length > 0 ? { valid: true, value } : { valid: false };
}

function requestId(body: unknown): { valid: true; value: string } | { valid: false } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { valid: false };
  const value = (body as { requestId?: unknown }).requestId;
  return typeof value === 'string' && UUID_PATTERN.test(value) ? { valid: true, value } : { valid: false };
}

function requireRequestId(body: unknown, res: Response): string | null {
  const parsed = requestId(body);
  if (parsed.valid) return parsed.value;
  res.status(400).json({
    success: false,
    code: 'CONSTITUTION_REQUEST_ID_REQUIRED',
    msg: 'A valid mutation request id is required.',
  });
  return null;
}

function wireRead(
  result: ConstitutionReadResult
): { state: 'absent'; revision: string } | { state: 'present'; content: string; revision: string } {
  return result.status === 'present'
    ? { state: 'present', content: result.content, revision: result.revision }
    : { state: 'absent', revision: result.revision };
}

function wireMutation(result: ConstitutionMutationResult): {
  ok: true;
  revision: string;
  receiptId: string;
  requestId: string;
  requestFingerprint: `sha256:${string}`;
} {
  return {
    ok: true,
    revision: result.revision,
    receiptId: result.receiptId,
    requestId: result.transactionId,
    requestFingerprint: result.requestFingerprint,
  };
}

function serviceErrorCode(error: unknown): string {
  return error instanceof ConstitutionFsTransactionError
    ? error.code
    : error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';
}

function sendReadError(res: Response, error: unknown, fallback: string): void {
  if (serviceErrorCode(error) === 'CONSTITUTION_FS_UNSAFE_PLATFORM') {
    res.status(503).json({
      success: false,
      code: 'CONSTITUTION_UNAVAILABLE',
      msg: 'Constitution editing is unavailable on this platform.',
    });
    return;
  }
  const msg = error instanceof Error ? redactSecrets(error.message) : fallback;
  res.status(500).json({ success: false, msg });
}

function sendMutationError(res: Response, error: unknown, fallback: string): void {
  const code = serviceErrorCode(error);
  if (code === 'CONSTITUTION_FS_UNSAFE_PLATFORM') {
    res.status(503).json({
      success: false,
      code: 'CONSTITUTION_UNAVAILABLE',
      msg: 'Constitution editing is unavailable on this platform.',
    });
    return;
  }
  if (code === 'CONSTITUTION_FS_CONFLICT') {
    res.status(409).json({ success: false, code: 'CONSTITUTION_REVISION_CONFLICT', msg: 'Reload before retrying.' });
    return;
  }
  if (code === 'CONSTITUTION_FS_INVALID_REQUEST') {
    res.status(400).json({ success: false, msg: fallback });
    return;
  }
  const msg = error instanceof Error ? redactSecrets(error.message) : fallback;
  res.status(500).json({ success: false, msg });
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
export function registerConstitutionRoutes(
  app: Express,
  validateApiAccess: RequestHandler,
  constitutionFs: ConstitutionFsService = getConstitutionFsService()
): void {
  // GET /api/constitution
  // Read-only: returns the current Constitution prose so the headless editor can
  // load it. The Constitution is NOT a secret, so a read here is allowed.
  app.get('/api/constitution', apiRateLimiter, validateApiAccess, (_req: Request, res: Response) => {
    try {
      res.json({ success: true, data: wireRead(constitutionFs.readConstitution()) });
    } catch (error) {
      console.error('[API] Constitution read error:', error);
      sendReadError(res, error, 'Failed to read constitution');
    }
  });

  app.get('/api/constitution/specialists', apiRateLimiter, validateApiAccess, (_req: Request, res: Response) => {
    try {
      res.json({ success: true, data: { items: constitutionFs.listSpecialists() } });
    } catch (error) {
      sendReadError(res, error, 'Failed to list specialist overlays');
    }
  });

  app.get('/api/constitution/specialist', apiRateLimiter, validateApiAccess, (req: Request, res: Response) => {
    const id = typeof req.query?.id === 'string' ? req.query.id : '';
    if (!id) {
      res.status(400).json({ success: false, msg: 'id is required' });
      return;
    }
    try {
      res.json({ success: true, data: wireRead(constitutionFs.readSpecialist(id)) });
    } catch (error) {
      sendReadError(res, error, 'Failed to read specialist overlay');
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
    const expectation = expectedRevision(req.body);
    if (!expectation.valid) {
      res.status(409).json({ success: false, code: 'CONSTITUTION_REVISION_REQUIRED', msg: 'Reload before saving.' });
      return;
    }
    const mutationRequestId = requireRequestId(req.body, res);
    if (!mutationRequestId) return;

    const ctx = detectNetworkContext(req);
    // DIRECT socket peer - never req.ip (XFF is spoofable). Audit only.
    const ip = req.socket?.remoteAddress ?? null;

    try {
      // The helper validates the content (string + size cap) and writes atomically.
      const committed = constitutionMutationQuiescence.runInteractiveMutation(() =>
        constitutionFs.writeConstitution(content, expectation.value, mutationRequestId)
      );

      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'constitution.write',
        target: null,
        ip,
        reachedVia: ctx.reachedVia,
        result: 'success',
      });
      res.json({ success: true, data: wireMutation(committed) });
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
      sendMutationError(res, error, 'Failed to save constitution');
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
        const expectation = expectedRevision(req.body);
        if (!expectation.valid) {
          res
            .status(409)
            .json({ success: false, code: 'CONSTITUTION_REVISION_REQUIRED', msg: 'Reload before resetting.' });
          return;
        }
        const mutationRequestId = requireRequestId(req.body, res);
        if (!mutationRequestId) return;
        const committed = constitutionMutationQuiescence.runInteractiveMutation(() =>
          constitutionFs.writeConstitution(DEFAULT_CONSTITUTION, expectation.value, mutationRequestId)
        );

        void appendAudit({
          userId: req.user?.id ?? null,
          action: 'constitution.reset',
          target: null,
          ip,
          reachedVia: ctx.reachedVia,
          result: 'success',
        });

        // Status only - never echo the default body back.
        res.json({ success: true, data: wireMutation(committed) });
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
        sendMutationError(res, error, 'Failed to reset constitution');
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
    if (!requireEditGrant(req, res, `specialist.write:${id}`)) return;
    const content = req.body.content as string;
    const expectation = expectedRevision(req.body);
    if (!expectation.valid) {
      res.status(409).json({ success: false, code: 'CONSTITUTION_REVISION_REQUIRED', msg: 'Reload before saving.' });
      return;
    }
    const mutationRequestId = requireRequestId(req.body, res);
    if (!mutationRequestId) return;
    const ctx = detectNetworkContext(req);
    const ip = req.socket?.remoteAddress ?? null;

    try {
      // The helper validates the id (path-traversal containment) + content.
      const committed = constitutionMutationQuiescence.runInteractiveMutation(() =>
        constitutionFs.writeSpecialist(id, content, expectation.value, mutationRequestId)
      );

      void appendAudit({
        userId: req.user?.id ?? null,
        action: 'constitution.writeSpecialist',
        target: id,
        ip,
        reachedVia: ctx.reachedVia,
        result: 'success',
      });
      res.json({ success: true, data: wireMutation(committed) });
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
      sendMutationError(res, error, 'Failed to save specialist overlay');
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
      const expectation = expectedRevision(req.body);
      if (!expectation.valid || typeof expectation.value !== 'string') {
        res
          .status(409)
          .json({ success: false, code: 'CONSTITUTION_REVISION_REQUIRED', msg: 'Reload before deleting.' });
        return;
      }
      const mutationRequestId = requireRequestId(req.body, res);
      if (!mutationRequestId) return;

      const ctx = detectNetworkContext(req);
      const ip = req.socket?.remoteAddress ?? null;

      try {
        const committed = constitutionMutationQuiescence.runInteractiveMutation(() =>
          constitutionFs.deleteSpecialist(id, expectation.value, mutationRequestId)
        );

        void appendAudit({
          userId: req.user?.id ?? null,
          action: 'constitution.deleteSpecialist',
          target: id,
          ip,
          reachedVia: ctx.reachedVia,
          result: 'success',
        });
        res.json({ success: true, data: wireMutation(committed) });
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
        sendMutationError(res, error, 'Failed to remove specialist overlay');
      }
    })
  );
}
