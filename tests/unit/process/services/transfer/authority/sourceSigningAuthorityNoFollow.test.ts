/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Windows has no O_NOFOLLOW: `fs.constants.O_NOFOLLOW` is undefined there, so
 * `O_RDONLY | O_NOFOLLOW` collapses to a plain read and open() follows a link.
 * Every check made through the resulting handle then inspects the *target* -
 * fstat structurally cannot report a symlink - so a state file swapped for a
 * link to attacker-chosen content read clean and redirected signing authority.
 *
 * These cases live in their own file because they mock `node:fs` constants, and
 * they are the only coverage that can fail if the pre-open guard is removed: on
 * POSIX the real O_NOFOLLOW makes open() throw ELOOP by itself, so the sibling
 * suite passes with or without the guard and cannot regress it.
 */

import { execFileSync } from 'node:child_process';
import realFs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

// Force the Windows condition on every host: O_NOFOLLOW absent.
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    default: actual,
    constants: { ...actual.constants, O_NOFOLLOW: undefined },
  };
});

const roots: string[] = [];

function temporaryRoot(): string {
  const root = realFs.mkdtempSync(path.join(os.tmpdir(), 'wayland-nofollow-'));
  roots.push(root);
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) realFs.rmSync(root, { recursive: true, force: true });
});

describe('source signing authority state read without O_NOFOLLOW', () => {
  it('refuses a state path replaced by a symlink even though open() would follow it', async () => {
    const { FileSourceSigningAuthorityStateBackend } =
      await import('@process/services/transfer/authority/sourceSigningAuthorityStore');
    const root = temporaryRoot();
    const secret = path.join(root, 'attacker.json');
    realFs.writeFileSync(secret, JSON.stringify({ attacker: true }), { mode: 0o600 });
    const statePath = path.join(root, 'identity.json');
    realFs.symlinkSync(secret, statePath);

    const backend = new FileSourceSigningAuthorityStateBackend(statePath);
    // Proves the guard, not the platform: with O_NOFOLLOW absent the open below
    // succeeds, so only the pre-open lstat can refuse this.
    await expect(backend.read()).rejects.toThrow(/unsafe/);
  });

  it('reads a legitimate regular state file with O_NOFOLLOW absent', async () => {
    const { FileSourceSigningAuthorityStateBackend } =
      await import('@process/services/transfer/authority/sourceSigningAuthorityStore');
    const root = temporaryRoot();
    const statePath = path.join(root, 'identity.json');
    const payload = JSON.stringify({ legit: true });
    realFs.writeFileSync(statePath, payload, { mode: 0o600 });

    const backend = new FileSourceSigningAuthorityStateBackend(statePath);
    // The guard must not cost the happy path: this is what a Windows read does.
    const bytes = await backend.read();
    expect(bytes).not.toBeNull();
    expect(Buffer.from(bytes!).toString('utf8')).toBe(payload);
  });

  it('returns null for a missing state file rather than throwing', async () => {
    const { FileSourceSigningAuthorityStateBackend } =
      await import('@process/services/transfer/authority/sourceSigningAuthorityStore');
    const root = temporaryRoot();
    const backend = new FileSourceSigningAuthorityStateBackend(path.join(root, 'identity.json'));
    await expect(backend.read()).resolves.toBeNull();
  });

  // mkfifo is POSIX-only. The hazard it proves is real on every platform that
  // has FIFOs: open(O_RDONLY) blocks until a writer appears, and the !isFile()
  // check that would refuse it used to run only AFTER the open, so read() hung
  // indefinitely and pinned a libuv threadpool thread.
  it.skipIf(process.platform === 'win32')(
    'refuses a FIFO before open() can block on it',
    async () => {
      const { FileSourceSigningAuthorityStateBackend } =
        await import('@process/services/transfer/authority/sourceSigningAuthorityStore');
      const root = temporaryRoot();
      const statePath = path.join(root, 'identity.json');
      execFileSync('mkfifo', ['-m', '600', statePath]);

      const backend = new FileSourceSigningAuthorityStateBackend(statePath);
      // A regression here does not fail, it hangs - hence the explicit timeout.
      await expect(backend.read()).rejects.toThrow(/unsafe/);
    },
    5000
  );
});
