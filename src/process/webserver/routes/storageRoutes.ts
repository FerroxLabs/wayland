/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Express, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import fsPromises from 'fs/promises';
import os from 'os';
import path from 'path';
import multer from 'multer';
import { apiRateLimiter, authRateLimiter } from '../middleware/security';
import { requireDestructive } from './configWriteGuards';
import { computeUsage, invalidateUsageCache } from '@process/storage/computeUsage';
import { clearStorageDir, getLogsDir, getStorageDirs } from '@process/storage/storageLocations';
import { backupExport } from '@process/storage/backupExport';
import { backupImport } from '@process/storage/backupImport';
import { createLegacySafetyExport } from '@process/storage/legacySafetyExport';
import { publicBackupErrorCode } from '@/common/types/storageBackup';

/** Largest backup zip accepted for restore upload (1 GiB - matches the import zip-bomb total cap). */
const MAX_RESTORE_ZIP_BYTES = 1024 * 1024 * 1024;

/** Restore upload: disk storage so a large zip is streamed to a temp file, not buffered in memory. */
const uploadRestore = multer({
  storage: multer.diskStorage({ destination: os.tmpdir() }),
  limits: { fileSize: MAX_RESTORE_ZIP_BYTES, files: 1 },
});

function bodyString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Storage actions for the remote WebUI (#83).
 *
 * Trust model: every route is behind `validateApiAccess` (token auth). The
 * non-destructive tier (paths / clear cache+logs / export) is available to any
 * authenticated session. Restore is destructive (it overwrites live storage),
 * so it additionally requires (a) operator provenance - the request must arrive
 * from a private network: loopback, LAN, or a Tailscale tailnet - and (b) a
 * step-up password re-auth. The import core already enforces zip-slip
 * containment, a top-level-dir allowlist, zip-bomb caps, and passphrase-gated
 * key material; this route adds a pre-restore safety backup on top.
 */
export function registerStorageRoutes(app: Express, validateApiAccess: RequestHandler): void {
  // GET /api/storage/paths - resolve directory locations for show/copy in browser.
  app.get('/api/storage/paths', apiRateLimiter, validateApiAccess, (_req: Request, res: Response) => {
    res.json({ success: true, data: getStorageDirs() });
  });

  // POST /api/storage/clear { kind: 'cache' | 'logs' } - constrained clear + fresh usage.
  app.post('/api/storage/clear', apiRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    try {
      const kind = bodyString(req.body?.kind);
      if (kind !== 'cache' && kind !== 'logs') {
        res.status(400).json({ success: false, msg: 'kind must be "cache" or "logs"' });
        return;
      }
      clearStorageDir(kind);
      const dirs = getStorageDirs();
      const usage = await computeUsage(dirs.workspace, getLogsDir());
      res.json({ success: true, data: { usage } });
    } catch (error) {
      console.error('[API] Storage clear error:', error);
      res.status(500).json({ success: false, msg: error instanceof Error ? error.message : 'Failed to clear' });
    }
  });

  // POST /api/storage/export { includeKeys?, passphrase?, password? } - generate a backup zip and download it.
  // POST (not GET) so the passphrase never lands in a URL or access log.
  // authRateLimiter (5 / 15min, failures counted) - NOT apiRateLimiter - because
  // the keys-included branch re-verifies the WebUI password (step-up); behind the
  // 60/min apiRateLimiter that re-verify was a password oracle (R7).
  app.post('/api/storage/export', authRateLimiter, validateApiAccess, async (req: Request, res: Response) => {
    const passphrase = bodyString(req.body?.passphrase) || undefined;
    const includeKeys = req.body?.includeKeys === true || req.body?.includeKeys === 'true';

    // A keys-included export is the single most sensitive read-back the app
    // exposes - it bundles credential material for offline decryption - so it is
    // gated as DESTRUCTIVE via the shared `requireDestructive`: the CONFIG-WRITE
    // floor (HTTPS-when-public) + operator provenance (raw socket peer, never the
    // spoofable req.ip) + a step-up password re-auth carrying the gate-internal
    // failure-counting lockout (R7). A keyless backup (conversations / attachments
    // / config) stays available to any authenticated session.
    if (includeKeys) {
      if (!(await requireDestructive(req, res, bodyString(req.body?.password)))) {
        return;
      }
    }

    const tmpDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'wl-export-'));
    const fileName = `wayland-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    const destPath = path.join(tmpDir, fileName);
    try {
      await backupExport({ userData: getStorageDirs().workspace, destPath, includeKeys, passphrase });
      res.download(destPath, fileName, () => {
        void fsPromises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      });
    } catch (error) {
      void fsPromises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      console.error('[API] Storage export error:', error);
      res.status(500).json({ success: false, msg: error instanceof Error ? error.message : 'Failed to export' });
    }
  });

  // POST /api/storage/restore (multipart 'file' zip) + body { password, passphrase? }
  // DESTRUCTIVE: CONFIG-WRITE floor + operator-only (private network) + step-up
  // password (with failure-counting lockout) + pre-restore safety backup.
  // authRateLimiter (not apiRateLimiter) so the step-up re-verify is not a
  // 60/min password oracle (R7).
  app.post(
    '/api/storage/restore',
    authRateLimiter,
    validateApiAccess,
    (req: Request, res: Response, next: NextFunction) => {
      uploadRestore.single('file')(req, res, (err: unknown) => {
        if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({ success: false, msg: 'Backup too large' });
          return;
        }
        if (err) {
          next(err);
          return;
        }
        next();
      });
    },
    async (req: Request, res: Response) => {
      const uploadedPath = req.file?.path;
      const cleanup = () => {
        if (uploadedPath) void fsPromises.rm(uploadedPath, { force: true }).catch(() => {});
      };
      try {
        // CONFIG-WRITE floor + operator provenance (raw socket peer, never the
        // spoofable req.ip) + step-up password re-auth with failure lockout (R7),
        // all enforced by the shared DESTRUCTIVE gate.
        if (!(await requireDestructive(req, res, bodyString(req.body?.password)))) {
          cleanup();
          return;
        }
        if (!uploadedPath) {
          res.status(400).json({ success: false, msg: 'No backup file uploaded' });
          return;
        }

        const userData = getStorageDirs().workspace;
        const passphrase = bodyString(req.body?.passphrase) || undefined;

        // Persist the matching file-only rollback artifact before changing live
        // state. Temporary storage would make the UI's recovery promise false.
        const safetyPath = await createLegacySafetyExport({ userData, passphrase });

        // Apply the restore (core enforces zip-slip containment, dir allowlist,
        // zip-bomb caps, and skips encrypted keys when no passphrase is given).
        const report = await backupImport({ userData, srcPath: uploadedPath, passphrase });
        invalidateUsageCache();

        cleanup();
        // Forward the report, do not swallow it. This route is the second caller
        // of the same importer, and `success: true` on its own is a useless
        // signal: a legacy file export only covers conversations, attachments,
        // config and the optional encrypted keys, so an archive from a modern
        // install legitimately applies nothing. Replying with a bare success over
        // a no-op is verbatim #1021, and the desktop caller being fixed did not
        // fix this one.
        res.json({ success: true, data: { safetyBackupPath: safetyPath, ...report } });
      } catch (error) {
        cleanup();
        console.error('[API] Storage restore error:', error);
        // A fixed code, not the error text. A decrypt or zip failure can carry a
        // userData path or a decrypted fragment in its message, and this reply
        // ends up in a browser the operator may not be the only reader of. The
        // code also lets the client name a mistyped passphrase, which is the
        // everyday failure here and which the desktop surface already names.
        res.status(500).json({ success: false, msg: publicBackupErrorCode(error) });
      }
    }
  );
}
