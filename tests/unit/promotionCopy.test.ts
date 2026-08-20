/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Promotion rule 5 (copy semantics) and rule 6 (retry with quiesce) on a real
 * filesystem. Nothing here is mocked: real directories, real symlinks, real
 * FIFOs, real sha256.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'os';
import path from 'path';
import fsp from 'fs/promises';
import { execFileSync } from 'child_process';
import {
  copyTreeVerified,
  buildTreeManifest,
  diffManifests,
  EscapingSymlinkError,
  DigestDriftError,
} from '@process/services/promotion/promotionCopy';

let root: string;
let source: string;
let dest: string;

beforeEach(async () => {
  root = await fsp.mkdtemp(path.join(os.tmpdir(), 'wl-copy-'));
  source = path.join(root, 'src');
  dest = path.join(root, 'dst');
  await fsp.mkdir(source, { recursive: true });
});
afterEach(async () => {
  await fsp.rm(root, { recursive: true, force: true });
});

describe('promotion copy semantics (rule 5)', () => {
  it('copies a regular tree and the manifest verifies against the destination', async () => {
    await fsp.mkdir(path.join(source, 'artifacts', '2026-08-19'), { recursive: true });
    await fsp.writeFile(path.join(source, 'notes.md'), 'top level', 'utf8');
    await fsp.writeFile(path.join(source, 'artifacts', '2026-08-19', 'brief.md'), '# Monday', 'utf8');

    const result = await copyTreeVerified(source, dest);

    expect(result.skipped).toEqual([]);
    expect(
      result.manifest
        .filter((e) => e.type === 'file')
        .map((e) => e.relPath)
        .toSorted()
    ).toEqual(['artifacts/2026-08-19/brief.md', 'notes.md']);
    expect(await fsp.readFile(path.join(dest, 'artifacts', '2026-08-19', 'brief.md'), 'utf8')).toBe('# Monday');

    const after = await buildTreeManifest(dest);
    expect(diffManifests(result.manifest, after.manifest)).toEqual([]);
  });

  it('a bare file count is not verification: same count, different bytes still fails', async () => {
    await fsp.writeFile(path.join(source, 'a.txt'), 'original', 'utf8');
    const result = await copyTreeVerified(source, dest);
    await fsp.writeFile(path.join(dest, 'a.txt'), 'tampered', 'utf8');

    const after = await buildTreeManifest(dest);
    expect(after.manifest.length).toBe(result.manifest.length);
    expect(diffManifests(result.manifest, after.manifest)).toEqual(['a.txt: sha256 differs']);
  });

  it('refuses the whole copy when a symlink escapes the source root', async () => {
    const outside = path.join(root, 'outside.txt');
    await fsp.writeFile(outside, 'secret', 'utf8');
    await fsp.symlink(outside, path.join(source, 'leak'));

    await expect(copyTreeVerified(source, dest)).rejects.toBeInstanceOf(EscapingSymlinkError);
  });

  it('skips an internal symlink with a report instead of following it', async () => {
    await fsp.writeFile(path.join(source, 'real.txt'), 'body', 'utf8');
    await fsp.symlink(path.join(source, 'real.txt'), path.join(source, 'alias.txt'));

    const result = await copyTreeVerified(source, dest);

    expect(result.skipped).toEqual([{ relPath: 'alias.txt', reason: 'symlink' }]);
    // Never dereferenced: the alias must not exist in the copy at all.
    await expect(fsp.lstat(path.join(dest, 'alias.txt'))).rejects.toThrow();
    expect(await fsp.readFile(path.join(dest, 'real.txt'), 'utf8')).toBe('body');
  });

  it('skips a non-regular file with a report', async () => {
    await fsp.writeFile(path.join(source, 'keep.txt'), 'keep', 'utf8');
    execFileSync('/usr/bin/mkfifo', [path.join(source, 'pipe')]);

    const result = await copyTreeVerified(source, dest);

    expect(result.skipped).toEqual([{ relPath: 'pipe', reason: 'non-regular' }]);
    expect(result.manifest.some((e) => e.relPath === 'keep.txt')).toBe(true);
  });

  it('honours the exclusion predicate for a whole subtree', async () => {
    await fsp.mkdir(path.join(source, '.wayland-core', 'skills', 'cron'), { recursive: true });
    await fsp.writeFile(path.join(source, '.wayland-core', 'skills', 'cron', 'SKILL.md'), 'machinery', 'utf8');
    await fsp.writeFile(path.join(source, 'report.md'), 'mine', 'utf8');

    const result = await copyTreeVerified(source, dest, { exclude: (rel) => rel === '.wayland-core' });

    expect(result.manifest.map((e) => e.relPath)).toEqual(['report.md']);
    await expect(fsp.lstat(path.join(dest, '.wayland-core'))).rejects.toThrow();
  });
});

describe('promotion copy drift (rule 6)', () => {
  it('retries with quiesce when a source file is appended mid-copy, and does not abort forever', async () => {
    const file = path.join(source, 'growing.log');
    await fsp.writeFile(file, 'line 1\n', 'utf8');

    // The appender writes during the window between the copy and the verify -
    // exactly the "file being appended mid-copy" case - and then stops.
    let appends = 0;
    const result = await copyTreeVerified(source, dest, {
      quiesceMs: 0,
      hooks: {
        afterCopyAttempt: async () => {
          if (appends < 2) {
            appends += 1;
            await fsp.appendFile(file, `line ${appends + 1}\n`, 'utf8');
          }
        },
      },
    });

    expect(appends).toBe(2);
    // Succeeded rather than aborting, and the copy matches the SETTLED source.
    const settled = await fsp.readFile(file, 'utf8');
    expect(await fsp.readFile(path.join(dest, 'growing.log'), 'utf8')).toBe(settled);
    expect(settled).toBe('line 1\nline 2\nline 3\n');
    expect(diffManifests(result.manifest, (await buildTreeManifest(dest)).manifest)).toEqual([]);
  });

  it('gives up with DigestDriftError only after exhausting the retry budget', async () => {
    const file = path.join(source, 'never-settles.log');
    await fsp.writeFile(file, 'x', 'utf8');

    let appends = 0;
    await expect(
      copyTreeVerified(source, dest, {
        quiesceMs: 0,
        maxDriftRetries: 3,
        hooks: {
          afterCopyAttempt: async () => {
            appends += 1;
            await fsp.appendFile(file, 'x', 'utf8');
          },
        },
      })
    ).rejects.toBeInstanceOf(DigestDriftError);
    expect(appends).toBe(4);
  });
});
