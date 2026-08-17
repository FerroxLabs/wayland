/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1042 F3, second call site: the STAGING cleanup.
 *
 * Both temp cleanups in backupImport run in a `finally`, and a `finally` that
 * throws REPLACES the successful return it follows - so an undeletable scratch
 * directory turned a restore that had already installed every file into a
 * rejection, and the caller then told the user the restore failed and offered
 * them the safety archive, which would undo the good restore.
 *
 * The rollback-tree half of this is covered with real permissions and no mocks
 * in tests/unit/storage.test.ts. The staging half cannot be provoked through the
 * filesystem alone: after a successful install the staging tree is always empty
 * and always ours to delete. The condition that DOES provoke it is external, and
 * on Windows it is routine rather than exotic - an EBUSY or EPERM from a handle
 * another process still holds on a file we just wrote. So the fault is injected
 * at the `fs.rmSync` boundary, which is exactly where the real platform raises
 * it, and only for the staging prefix.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const STAGING_PREFIX = '.wayland-legacy-restore-';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  const rmSync = (target: fs.PathLike, options?: fs.RmOptions) => {
    if (typeof target === 'string' && target.includes(STAGING_PREFIX)) {
      throw Object.assign(new Error(`EBUSY: resource busy or locked, rm '${target}'`), { code: 'EBUSY' });
    }
    return actual.rmSync(target, options);
  };
  return { ...actual, default: { ...actual, rmSync }, rmSync };
});

// The UNMOCKED module, for fixture setup and teardown. Using the mocked one here
// would make the harness fight itself.
const realFs = await vi.importActual<typeof import('fs')>('fs');
const { backupExport } = await import('../../../../src/process/storage/backupExport');
const { backupImport } = await import('../../../../src/process/storage/backupImport');

describe('backupImport staging cleanup (#1042 F3)', () => {
  let src: string;
  let restore: string;
  let zipDir: string;
  let zipPath: string;

  beforeEach(() => {
    src = realFs.mkdtempSync(path.join(os.tmpdir(), 'wayland-test-'));
    restore = realFs.mkdtempSync(path.join(os.tmpdir(), 'wayland-test-'));
    zipDir = realFs.mkdtempSync(path.join(os.tmpdir(), 'wayland-test-'));
    zipPath = path.join(zipDir, 'legacy.zip');
  });

  afterEach(() => {
    for (const dir of [src, restore, zipDir]) {
      realFs.rmSync(dir, { recursive: true, force: true });
    }
    for (const entry of realFs.readdirSync(os.tmpdir())) {
      if (entry.startsWith(STAGING_PREFIX)) {
        realFs.rmSync(path.join(os.tmpdir(), entry), { recursive: true, force: true });
      }
    }
  });

  // Known positive for the harness itself: the injected fault must really be in
  // force AND must really be scoped to the staging prefix, or the test below
  // would pass while proving nothing.
  it('injects the fault it claims to inject, and only for staging paths', () => {
    const staging = realFs.mkdtempSync(path.join(os.tmpdir(), STAGING_PREFIX));
    const unrelated = realFs.mkdtempSync(path.join(os.tmpdir(), 'wayland-test-'));
    expect(() => fs.rmSync(staging, { recursive: true, force: true })).toThrow('EBUSY');
    expect(() => fs.rmSync(unrelated, { recursive: true, force: true })).not.toThrow();
    expect(realFs.existsSync(unrelated)).toBe(false);
  });

  it('still reports the applied restore when the staging cleanup cannot be removed', async () => {
    realFs.mkdirSync(path.join(src, 'conversations'), { recursive: true });
    realFs.writeFileSync(path.join(src, 'conversations', 'c.json'), 'chat');
    await backupExport({ userData: src, destPath: zipPath, includeKeys: false });

    const report = await backupImport({ userData: restore, srcPath: zipPath });

    expect(report.applied).toEqual(['conversations']);
    expect(realFs.readFileSync(path.join(restore, 'conversations', 'c.json'), 'utf-8')).toBe('chat');
  });
});
