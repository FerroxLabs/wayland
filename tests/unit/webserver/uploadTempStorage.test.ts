/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A TEMP that cannot be created must not stop Wayland from starting.
 *
 * Measured on Windows 11: the user's %TEMP% was F:\Temp\Codex after drive F:
 * was removed. Both upload routes built `multer.diskStorage({ destination })`
 * at module load, multer ran `mkdirSync` on it right there, and bootstrap died
 * with `ENOENT: mkdir 'F:\Temp\Codex'` before any window opened.
 */

import fs from 'fs';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';

const { missingTemp } = vi.hoisted(() => ({
  // A directory that can never be created: a missing drive on Windows, a path
  // beneath a character device elsewhere.
  missingTemp: process.platform === 'win32' ? 'Q:\\wayland-missing-drive\\Temp' : '/dev/null/wayland-missing-temp',
}));

vi.mock('os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('os')>();
  const tmpdir = () => missingTemp;
  return { ...actual, tmpdir, default: { ...actual, tmpdir } };
});

// Same isolation the other apiRoutes tests use: no database or storage at import.
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn() }));
vi.mock('@process/initStorage', () => ({ ProcessConfig: { get: vi.fn(), set: vi.fn() } }));

type DestinationFn = (req: unknown, file: unknown, cb: (error: Error | null, destination: string) => void) => void;
const destinationOf = (storage: unknown) => (storage as { getDestination: DestinationFn }).getDestination;

describe('upload temp storage with an uncreatable TEMP', () => {
  // Importing apiRoutes pulls a large module graph: on a cold windows-2022 runner
  // the transform alone exceeded the default 10 s, failing on time, not on logic.
  it('loads both upload route modules without touching the temp directory', { timeout: 120_000 }, async () => {
    await expect(import('@process/webserver/routes/storageRoutes')).resolves.toHaveProperty('registerStorageRoutes');
    await expect(import('@process/webserver/routes/apiRoutes')).resolves.toBeDefined();
  });

  it('fails only the upload that needs the missing directory', async () => {
    const { lazyTempDiskStorage } = await import('@process/webserver/routes/uploadTempStorage');
    const storage = lazyTempDiskStorage(missingTemp);

    const error = await new Promise<Error | null>((resolve) => destinationOf(storage)({}, {}, (err) => resolve(err)));
    expect(error).toBeInstanceOf(Error);
  });

  it('creates the directory when an upload arrives and it can be created', async () => {
    const { lazyTempDiskStorage } = await import('@process/webserver/routes/uploadTempStorage');
    const realTmp = (await vi.importActual<typeof import('os')>('os')).tmpdir();
    const root = fs.mkdtempSync(path.join(realTmp, 'wl-upload-temp-'));
    const dir = path.join(root, 'not-yet-created');
    try {
      const storage = lazyTempDiskStorage(dir);
      expect(fs.existsSync(dir)).toBe(false);

      const result = await new Promise<{ error: Error | null; destination: string }>((resolve) =>
        destinationOf(storage)({}, {}, (error, destination) => resolve({ error, destination }))
      );
      expect(result).toEqual({ error: null, destination: dir });
      expect(fs.statSync(dir).isDirectory()).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
