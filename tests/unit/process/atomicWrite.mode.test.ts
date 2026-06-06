/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs/promises';
import { statSync } from 'fs';
import path from 'path';
import os from 'os';
import { writeFileAtomic, writeFileSyncAtomic } from '@process/utils/atomicWrite';

/**
 * SEC-DATA-04: secret-bearing config/env blobs must be created 0o600 so other
 * local users / backup daemons can't read them. initStorage.WriteFile now
 * passes `{ mode: 0o600 }` through to these helpers; verify the option reaches
 * the on-disk file and survives the temp-then-rename.
 *
 * This block is POSIX-only by design - unix file-mode bits do not exist on
 * Windows. It is NOT a coverage gap: the Windows equivalent (restricting the
 * temp + final file DACL to owner-only via `icacls`, since Node ignores `mode`
 * on win32) is fully asserted in the sibling `atomicWrite.windowsAcl.test.ts`.
 * So SEC-DATA-04 is verified on every platform, just split by mechanism.
 */
const describePosix = process.platform === 'win32' ? describe.skip : describe;

describePosix('atomicWrite honors mode 0o600 (SEC-DATA-04)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'atomicWrite-mode-'));
  });

  it('writeFileAtomic creates the file with the requested mode', async () => {
    const filePath = path.join(tmpDir, 'wayland-config.txt');
    await writeFileAtomic(filePath, 'secret-blob', { mode: 0o600 });

    const stat = await fs.stat(filePath);
    expect(stat.mode & 0o777).toBe(0o600);
    expect(await fs.readFile(filePath, 'utf-8')).toBe('secret-blob');
  });

  it('writeFileAtomic preserves 0o600 when overwriting an existing file', async () => {
    const filePath = path.join(tmpDir, 'wayland-config.txt');
    await writeFileAtomic(filePath, 'first', { mode: 0o600 });
    await writeFileAtomic(filePath, 'second', { mode: 0o600 });

    const stat = await fs.stat(filePath);
    expect(stat.mode & 0o777).toBe(0o600);
    expect(await fs.readFile(filePath, 'utf-8')).toBe('second');
  });

  it('writeFileSyncAtomic creates the file with the requested mode', () => {
    const filePath = path.join(tmpDir, '.wayland-env');
    writeFileSyncAtomic(filePath, 'env-blob', { mode: 0o600 });

    const stat = statSync(filePath);
    expect(stat.mode & 0o777).toBe(0o600);
  });
});
