/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WebUI admin change-username entry from a remote WebUI client
 * (remote-secure-config W3 task H). The SIBLING of change-password
 * (`/api/auth/change-username` next to authRoutes' `/api/auth/change-password`).
 *
 * Trust model: this is a CONFIG-WRITE route - it rewrites the admin login name
 * and returns STATUS ONLY (`{ username }`). The username is the caller's own
 * submitted value (and the admin already knows their own login), never a secret;
 * the route is WRITE-ONLY by construction - it never reads back a password or any
 * stored secret. The §0 invariant holds end-to-end.
 *
 * It enforces the SAME current-password gate as change-password: a remote
 * session left open on an unlocked device cannot silently rename the admin
 * account without re-proving the password.
 *
 * Gates (the providerKeyRoutes / toolKeyRoutes shape):
 *  - `apiRateLimiter` (per-route rate limit) + `validateApiAccess` (token auth),
 *    wired as route middleware here.
 *  - tiny-csrf (global middleware in setup.ts) covers the POST verb.
 *  - `requireSecureConfigWrite` (W0 shared guard): the CONFIG-WRITE floor -
 *    refuses an auth-mutating write over plain HTTP from the public internet.
 *  - current-password re-verify (mirrors change-password).
 *
 * Persistence goes through the EXISTING `UserRepository.updateUsername`
 * (parameterized SQL) - the SAME repo method the desktop path runs. It does NOT
 * route through the WS bridge (R2: the `webui.change-username` bridge channel
 * stays remote-DENIED in the denylist; this HTTP route is the remote path).
 */

import { type Express, type Request, type RequestHandler, type Response } from 'express';
import { z } from 'zod';
import { apiRateLimiter } from '../middleware/security';
import { redactSecrets, requireSecureConfigWrite } from './configWriteGuards';
import { detectNetworkContext } from '../middleware/detectNetworkContext';
import { appendAudit } from '../audit/auditLog';
import { AuthService } from '@process/webserver/auth/service/AuthService';
import { UserRepository } from '@process/webserver/auth/repository/UserRepository';

const changeUsernameSchema = z.object({
  currentPassword: z.string().min(1),
  newUsername: z.string().min(1),
});

/**
 * Register the write-only change-username route for the remote WebUI (W3 H).
 */
export function registerUsernameRoutes(app: Express, validateApiAccess: RequestHandler): void {
  // POST /api/auth/change-username { currentPassword, newUsername }
  // Write-only: renames the admin login and returns { username } only.
  app.post('/api/auth/change-username', apiRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    // CONFIG-WRITE floor: refuse an auth-mutating write over plain HTTP from the
    // public internet. Network-tier-agnostic otherwise (a cellular phone is
    // allowed once the transport is secure).
    if (!requireSecureConfigWrite(req, res)) return;

    const parsed = changeUsernameSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, msg: 'Current password and new username are required' });
      return;
    }

    const currentPassword = parsed.data.currentPassword;
    const newUsername = parsed.data.newUsername.trim();

    // Validate the new username shape (length, charset, edge chars).
    const usernameValidation = AuthService.validateUsername(newUsername);
    if (!usernameValidation.isValid) {
      res.status(400).json({ success: false, msg: usernameValidation.errors.join('; ') });
      return;
    }

    const ctx = detectNetworkContext(req);
    // DIRECT socket peer - never req.ip (XFF is spoofable). Audit only.
    const ip = req.socket?.remoteAddress ?? null;

    try {
      // Resolve the authenticated user, then re-prove the current password -
      // exactly as change-password does.
      const user = req.user?.id ? await UserRepository.findById(req.user.id) : null;
      if (!user) {
        res.status(404).json({ success: false, msg: 'User not found' });
        return;
      }

      const isValidPassword = await AuthService.verifyPassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ success: false, msg: 'Current password is incorrect' });
        return;
      }

      // Uniqueness: reject a name already taken by a different account.
      const existing = await UserRepository.findByUsername(newUsername);
      if (existing && existing.id !== user.id) {
        res.status(409).json({ success: false, msg: 'Username already exists' });
        return;
      }

      // No-op rename: nothing to persist, but still report success.
      if (newUsername !== user.username) {
        await UserRepository.updateUsername(user.id, newUsername);
        // Renaming the admin login rotates auth, mirroring change-password.
        await AuthService.invalidateAllTokens();
        await AuthService.revokeAllFamiliesForUser(user.id);
      }

      void appendAudit({
        userId: user.id,
        action: 'webui.change-username',
        target: newUsername,
        ip,
        reachedVia: ctx.reachedVia,
      });

      // Status only - the username is the caller's own submitted value, never a
      // secret read back from storage.
      res.json({ success: true, data: { username: newUsername } });
    } catch (error) {
      console.error('[API] Change username error:', error);
      const msg = error instanceof Error ? redactSecrets(error.message) : 'Failed to change username';
      res.status(500).json({ success: false, msg });
    }
  });
}
