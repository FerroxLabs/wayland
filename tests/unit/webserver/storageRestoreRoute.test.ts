/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1021 on the WebUI surface, and #1042 F5.
 *
 * The desktop IPC provider was taught to report what a restore actually applied,
 * because a legacy file export only ever covers `conversations`, `attachments`,
 * `config` and the optional encrypted `keys.json` - so an archive taken from a
 * modern install legitimately carries nothing this importer can install, and "the
 * archive was read without error" is a useless success signal. The HTTP route is
 * the second caller of exactly the same importer, and it discarded the report and
 * replied `{success: true, data: {safetyBackupPath}}` regardless. A WebUI user
 * restoring a modern-install archive still got a confident success over a no-op,
 * which is verbatim the reported bug.
 */

import express from 'express';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import JSZip from 'jszip';

const passThrough = (_req: express.Request, _res: express.Response, next: express.NextFunction) => next();
vi.mock('@process/webserver/middleware/security', () => ({
  apiRateLimiter: passThrough,
  authRateLimiter: passThrough,
  authenticatedActionLimiter: passThrough,
}));

// The DESTRUCTIVE gate (operator provenance + step-up password + lockout) is not
// what this test covers; it is covered where it lives. Let it through so the
// restore body itself is reachable.
vi.mock('@process/webserver/routes/configWriteGuards', () => ({
  requireDestructive: vi.fn(() => Promise.resolve(true)),
}));

let userData = '';
vi.mock('@process/storage/storageLocations', () => ({
  getStorageDirs: () => ({ workspace: userData, cache: userData, logs: userData }),
  getLogsDir: () => path.join(userData, 'logs'),
  clearStorageDir: vi.fn(),
}));

vi.mock('@process/storage/computeUsage', () => ({
  computeUsage: vi.fn(() => Promise.resolve({ used: 0, breakdown: [], computedAt: 0 })),
  invalidateUsageCache: vi.fn(),
}));

vi.mock('@process/storage/legacySafetyExport', () => ({
  createLegacySafetyExport: vi.fn(() => Promise.resolve('/data/recovery/pre-restore.zip')),
}));

const { registerStorageRoutes } = await import('@process/webserver/routes/storageRoutes');

/** The route body is the LAST handler registered for POST /api/storage/restore. */
function restoreHandler(app: express.Express): express.RequestHandler {
  const layer = app.router.stack.find(
    (entry: { route?: { path?: string; methods?: Record<string, boolean>; stack?: Array<{ handle: unknown }> } }) =>
      entry.route?.path === '/api/storage/restore' && entry.route?.methods?.post === true
  );
  const stack = layer?.route?.stack;
  // Known positive for the harness: without this the assertions below would be
  // vacuously true against an undefined handler.
  expect(stack?.length, 'POST /api/storage/restore was never registered').toBeGreaterThan(0);
  return stack?.[stack.length - 1]?.handle as express.RequestHandler;
}

type Captured = { status: number; body: unknown };

async function callRestore(app: express.Express, uploadedPath: string): Promise<Captured> {
  const captured: Captured = { status: 200, body: undefined };
  const res = {
    status(code: number) {
      captured.status = code;
      return this;
    },
    json(body: unknown) {
      captured.body = body;
    },
  } as unknown as express.Response;
  const req = { file: { path: uploadedPath }, body: { password: 'operator-pw' } } as unknown as express.Request;
  await (restoreHandler(app) as (r: express.Request, s: express.Response) => Promise<void>)(req, res);
  return captured;
}

describe('POST /api/storage/restore reports what it applied (#1021, #1042 F5)', () => {
  let scratch = '';
  let uploaded = '';

  beforeEach(() => {
    vi.clearAllMocks();
    scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-route-test-'));
    expect(fs.realpathSync(scratch).startsWith(fs.realpathSync(os.tmpdir()))).toBe(true);
    userData = path.join(scratch, 'userData');
    fs.mkdirSync(userData, { recursive: true });
    uploaded = path.join(scratch, 'upload.zip');
  });

  afterEach(() => {
    fs.rmSync(scratch, { recursive: true, force: true });
  });

  const writeArchive = async (entries: Record<string, string>, manifest: unknown = { version: 1 }) => {
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify(manifest));
    for (const [name, body] of Object.entries(entries)) zip.file(name, body);
    fs.writeFileSync(uploaded, await zip.generateAsync({ type: 'nodebuffer' }));
  };

  // `success` here is the TRANSPORT signal - the request was served - and the test
  // asserts it stays true. The user-facing claim is made by the renderer's
  // reportRestore, which warns on an empty `applied`. Naming this test "does not
  // claim success" while asserting `success: true` was the same genre of problem
  // this whole fix exists to catch, so it says what it checks instead.
  it('reports an empty applied list when a modern-install archive moved nothing', async () => {
    // An archive whose only top-level entry is outside the legacy restore scope:
    // exactly the shape a modern install produces for the reporter of #1021.
    await writeArchive({ 'database/wayland.db': 'sqlite' });
    const app = express();
    registerStorageRoutes(app, passThrough);

    const { status, body } = await callRestore(app, uploaded);

    expect(status).toBe(200);
    expect(body).toMatchObject({ success: true, data: { applied: [] } });
  });

  it('replies with a classified code, never the raw error text', async () => {
    // A malformed archive: the underlying error text can carry a userData path or
    // a decrypted fragment, and this reply lands in a browser.
    fs.writeFileSync(uploaded, 'not a zip at all');
    const app = express();
    registerStorageRoutes(app, passThrough);

    const { status, body } = await callRestore(app, uploaded);

    expect(status).toBe(500);
    expect(body).toEqual({ success: false, msg: 'BACKUP_FAILED' });
    expect(JSON.stringify(body)).not.toContain(userData);
  });

  it('forwards the applied list and the keys-skipped flag on a real restore', async () => {
    await writeArchive({
      'config/settings.json': '{"theme":"dark"}',
      'keys.json.enc': 'unopenable-without-a-passphrase',
    });
    const app = express();
    registerStorageRoutes(app, passThrough);

    const { status, body } = await callRestore(app, uploaded);

    expect(status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      data: {
        applied: ['config'],
        keysSkippedNoPassphrase: true,
        safetyBackupPath: '/data/recovery/pre-restore.zip',
      },
    });
  });
});
