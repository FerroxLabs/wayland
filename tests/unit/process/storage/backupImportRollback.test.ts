/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1050: a FAILED legacy restore destroyed the user's originals.
 *
 * `replaceFromStaging` displaces every live target it is about to overwrite into
 * a rollback tree, then unwinds on failure. Executed at the tag, that unwind was
 * not survivable:
 *
 *  1. neither unwind loop guarded its iterations, so ONE failure - an EBUSY or
 *     EPERM on a Windows handle another process still holds, the everyday way
 *     this goes wrong - aborted the whole sweep. A throw in the FIRST loop meant
 *     the restore loop never ran at all;
 *  2. the `finally` then removed the rollback tree unconditionally, so every
 *     displaced original went with it. On the no-passphrase path that tree is
 *     genuinely the only copy of the user's `keys.json` on the machine, because
 *     legacySafetyExport omits it when no passphrase was given;
 *  3. and because that throw propagated OUT of the catch, `throw error` never
 *     ran and the caller received the rollback's error instead of the failure
 *     that actually caused the restore to fail.
 *
 * This is the RECOVERY path. It runs precisely when something has already gone
 * wrong, so it is the last place that may lose data.
 *
 * The faults are injected at the `fs` boundary, which is exactly where the real
 * platform raises them, and are scoped by path so nothing else in the run is
 * affected. Both are proven to fire, and to be scoped, by the harness test below.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const STAGING_PREFIX = '.wayland-legacy-restore-';
const ROLLBACK_PREFIX = '.wayland-legacy-rollback-';
const VICTIM_PREFIX = 'wayland-victim-';

const inject = vi.hoisted(() => ({
  /** Number of remaining `rmSync` calls on `<userData>/attachments` to fail. */
  rmAttachmentsFailures: 0,
  /** Fail the staging -> live install of `config`, to force the unwind. */
  failConfigInstall: false,
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  const sep = (await import('path')).sep;

  const rmSync = (target: fs.PathLike, options?: fs.RmOptions) => {
    if (
      inject.rmAttachmentsFailures > 0 &&
      typeof target === 'string' &&
      target.includes('wayland-victim-') &&
      target.endsWith(`${sep}attachments`)
    ) {
      inject.rmAttachmentsFailures -= 1;
      throw Object.assign(new Error(`EBUSY: resource busy or locked, rm '${target}'`), { code: 'EBUSY' });
    }
    return actual.rmSync(target, options);
  };

  const renameSync = (from: fs.PathLike, to: fs.PathLike) => {
    if (
      inject.failConfigInstall &&
      typeof from === 'string' &&
      typeof to === 'string' &&
      from.includes('.wayland-legacy-restore-') &&
      to.endsWith(`${sep}config`)
    ) {
      throw Object.assign(new Error(`EPERM: operation not permitted, rename '${from}' -> '${to}'`), { code: 'EPERM' });
    }
    return actual.renameSync(from, to);
  };

  return { ...actual, default: { ...actual, rmSync, renameSync }, rmSync, renameSync };
});

// The UNMOCKED module, for fixture setup, assertions and teardown. Reading the
// world back through the mocked one would make the harness fight itself.
const realFs = await vi.importActual<typeof import('fs')>('fs');
const { backupExport } = await import('../../../../src/process/storage/backupExport');
const { backupImport, preservedRollbackPath } = await import('../../../../src/process/storage/backupImport');

function write(root: string, relativePath: string, contents: string): void {
  const full = path.join(root, relativePath);
  realFs.mkdirSync(path.dirname(full), { recursive: true });
  realFs.writeFileSync(full, contents);
}

/** Every file under `dir`, keyed by its path relative to `dir`. */
function readTree(dir: string, base = dir, out: Record<string, string> = {}): Record<string, string> {
  if (!realFs.existsSync(dir)) return out;
  for (const entry of realFs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) readTree(full, base, out);
    else if (entry.isFile()) out[path.relative(base, full).split(path.sep).join('/')] = realFs.readFileSync(full, 'utf-8');
  }
  return out;
}

/** Temp siblings of the userData root that the importer created this run. */
function waylandTempDirs(parent: string): string[] {
  return realFs
    .readdirSync(parent)
    .filter((entry) => entry.startsWith(STAGING_PREFIX) || entry.startsWith(ROLLBACK_PREFIX))
    .map((entry) => path.join(parent, entry));
}

describe('backupImport rollback survivability (#1050)', () => {
  let src: string;
  // The importer builds its staging and rollback trees as SIBLINGS of the
  // userData root, so the root gets a private parent of its own. Sweeping
  // `os.tmpdir()` for those prefixes instead would race any other suite that is
  // mid-import in the same shared directory.
  let victimParent: string;
  let restore: string;
  let zipDir: string;
  let zipPath: string;

  beforeEach(() => {
    inject.rmAttachmentsFailures = 0;
    inject.failConfigInstall = false;
    src = realFs.mkdtempSync(path.join(os.tmpdir(), 'wayland-test-'));
    victimParent = realFs.mkdtempSync(path.join(os.tmpdir(), VICTIM_PREFIX));
    restore = path.join(victimParent, 'userData');
    realFs.mkdirSync(restore, { recursive: true });
    zipDir = realFs.mkdtempSync(path.join(os.tmpdir(), 'wayland-test-'));
    zipPath = path.join(zipDir, 'legacy.zip');
  });

  afterEach(() => {
    inject.rmAttachmentsFailures = 0;
    inject.failConfigInstall = false;
    for (const dir of [src, victimParent, zipDir]) {
      realFs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // Known positive for the harness itself: both injected faults must really be
  // in force AND really be scoped, or the test below would pass while proving
  // nothing.
  it('injects the faults it claims to inject, and only where it claims', () => {
    inject.rmAttachmentsFailures = 1;
    inject.failConfigInstall = true;

    const victimAttachments = path.join(restore, 'attachments');
    realFs.mkdirSync(victimAttachments, { recursive: true });
    expect(() => fs.rmSync(victimAttachments, { recursive: true, force: true })).toThrow('EBUSY');
    // One-shot: the second call goes through, which is what lets the fixed
    // unwind clear a path it failed to clear the first time.
    expect(() => fs.rmSync(victimAttachments, { recursive: true, force: true })).not.toThrow();
    expect(realFs.existsSync(victimAttachments)).toBe(false);

    // Unrelated removals are untouched.
    inject.rmAttachmentsFailures = 1;
    const unrelated = realFs.mkdtempSync(path.join(victimParent, 'wayland-test-'));
    expect(() => fs.rmSync(unrelated, { recursive: true, force: true })).not.toThrow();

    // The rename fault fires only for a staging -> live install of `config`,
    // never for the rollback -> live move that puts the original back.
    const staging = realFs.mkdtempSync(path.join(victimParent, STAGING_PREFIX));
    const rollback = realFs.mkdtempSync(path.join(victimParent, ROLLBACK_PREFIX));
    realFs.mkdirSync(path.join(staging, 'config'), { recursive: true });
    realFs.mkdirSync(path.join(rollback, 'config'), { recursive: true });
    expect(() => fs.renameSync(path.join(staging, 'config'), path.join(restore, 'config'))).toThrow('EPERM');
    expect(() => fs.renameSync(path.join(rollback, 'config'), path.join(restore, 'config'))).not.toThrow();
    expect(realFs.existsSync(path.join(restore, 'config'))).toBe(true);

    realFs.rmSync(path.join(restore, 'config'), { recursive: true, force: true });
  });

  it('keeps every displaced original when the unwind itself fails partway', async () => {
    const originals = {
      'conversations/c.json': 'ORIGINAL-chat',
      'attachments/a.txt': 'ORIGINAL-attachment',
      'config/settings.json': '{"theme":"ORIGINAL"}',
    };
    for (const [relativePath, contents] of Object.entries(originals)) write(restore, relativePath, contents);

    write(src, 'conversations/c.json', 'ARCHIVE-chat');
    write(src, 'attachments/a.txt', 'ARCHIVE-attachment');
    write(src, 'config/settings.json', '{"theme":"ARCHIVE"}');
    await backupExport({ userData: src, destPath: zipPath, includeKeys: false });

    // `conversations` and `attachments` install, then `config` fails - and the
    // sweep that must put all three back trips on `attachments`.
    inject.failConfigInstall = true;
    inject.rmAttachmentsFailures = 1;

    const failure = await backupImport({ userData: restore, srcPath: zipPath }).then(
      () => null,
      (error: unknown) => error
    );
    expect(failure).toBeInstanceOf(Error);

    // The whole point: the user's own files are still on this machine, either
    // back in place or preserved in a rollback tree that was NOT swept away.
    const survivors = readTree(restore);
    for (const tree of waylandTempDirs(victimParent)) {
      if (path.basename(tree).startsWith(ROLLBACK_PREFIX)) Object.assign(survivors, readTree(tree));
    }
    for (const [relativePath, contents] of Object.entries(originals)) {
      expect(survivors[relativePath], `${relativePath} must survive a failed restore`).toBe(contents);
    }

    // And the caller must receive the failure that CAUSED the restore to fail,
    // not whatever the unwind afterwards tripped on. Both classify to
    // BACKUP_FAILED, so the message is all a support case has to go on.
    expect((failure as Error).message).toContain('EPERM');
    expect((failure as Error).message).not.toContain('EBUSY');
  });

  // A preserved copy nobody is told about is indistinguishable from a deleted
  // one. When the unwind cannot put an original back, the tree holding it stays
  // on disk - and the caller has to be able to name where, or the user has no
  // way to reach their own bytes.
  it('names where it kept an original that could not be put back', async () => {
    write(restore, 'conversations/c.json', 'ORIGINAL-chat');
    write(restore, 'attachments/a.txt', 'ORIGINAL-attachment');
    write(restore, 'config/settings.json', '{"theme":"ORIGINAL"}');

    write(src, 'conversations/c.json', 'ARCHIVE-chat');
    write(src, 'attachments/a.txt', 'ARCHIVE-attachment');
    write(src, 'config/settings.json', '{"theme":"ARCHIVE"}');
    await backupExport({ userData: src, destPath: zipPath, includeKeys: false });

    // Unlike the one-shot fault above, this path never clears, so `attachments`
    // can never go home and its original can only survive in the rollback tree.
    inject.failConfigInstall = true;
    inject.rmAttachmentsFailures = Number.MAX_SAFE_INTEGER;

    const failure = await backupImport({ userData: restore, srcPath: zipPath }).then(
      () => null,
      (error: unknown) => error
    );

    const preserved = preservedRollbackPath(failure);
    expect(preserved, 'a kept rollback tree must be named to the caller').toBeTypeOf('string');
    expect(realFs.readFileSync(path.join(preserved as string, 'attachments', 'a.txt'), 'utf-8')).toBe(
      'ORIGINAL-attachment'
    );

    // What COULD go back did, and is not left duplicated in the kept tree.
    expect(readTree(restore)['conversations/c.json']).toBe('ORIGINAL-chat');
    expect(readTree(restore)['config/settings.json']).toBe('{"theme":"ORIGINAL"}');
    expect(realFs.existsSync(path.join(preserved as string, 'conversations'))).toBe(false);
  });
});
