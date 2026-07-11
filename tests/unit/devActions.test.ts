/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import {
  branchSlug,
  sanitizeBranch,
  buildRelease,
  buildLocal,
  syncForks,
  commitAndPr,
  repoStatus,
} from '@process/services/devActions';

const noop = () => {};

describe('devActions helpers', () => {
  it('branchSlug produces a git-safe, bounded slug', () => {
    expect(branchSlug('fix(models): correct label!!')).toBe('fix-models-correct-label');
    expect(branchSlug('   ')).toBe('update');
    expect(branchSlug('x'.repeat(80)).length).toBeLessThanOrEqual(40);
  });

  it('sanitizeBranch strips shell/path-injection characters', () => {
    expect(sanitizeBranch('feat/ok-1.2')).toBe('feat/ok-1.2');
    expect(sanitizeBranch('a; rm -rf ~')).toBe('a--rm--rf--');
    expect(sanitizeBranch('$(evil)')).toBe('--evil-');
  });
});

describe('devActions input validation (must not spawn a process)', () => {
  it('commitAndPr rejects an empty folder or message before doing anything', async () => {
    expect(await commitAndPr({ cwd: '', message: 'x' }, noop)).toEqual({
      ok: false,
      error: 'No repository folder selected.',
    });
    expect(await commitAndPr({ cwd: '/tmp/repo', message: '  ' }, noop)).toEqual({
      ok: false,
      error: 'A commit message is required.',
    });
  });

  it('buildRelease rejects a bad repo slug and a bad platform', async () => {
    expect((await buildRelease({ repo: 'not-a-slug', branch: 'main', platform: 'all' }, noop)).ok).toBe(false);
    expect((await buildRelease({ repo: 'owner/repo', branch: 'main', platform: 'solaris' }, noop)).ok).toBe(false);
  });

  it('buildLocal rejects empty/injecting script names before spawning', async () => {
    const log = vi.fn();
    expect(await buildLocal({ cwd: '/tmp/repo', script: '' }, log)).toEqual({
      ok: false,
      error: 'Invalid build script name.',
    });
    expect((await buildLocal({ cwd: '/tmp/repo', script: 'build && rm -rf ~' }, log)).ok).toBe(false);
    expect((await buildLocal({ cwd: '', script: 'package' }, log)).error).toBe('No repository folder selected.');
    // A rejected input must never reach the `$ <pm> run` step.
    expect(log).not.toHaveBeenCalled();
  });

  it('buildLocal reports a missing folder without spawning', async () => {
    const res = await buildLocal({ cwd: '/definitely/not/here/xyz', script: 'package' }, noop);
    expect(res).toEqual({ ok: false, error: 'That folder does not exist.' });
  });

  it('syncForks reports an invalid slug per-repo without dispatching', async () => {
    const log = vi.fn();
    const { results } = await syncForks({ repos: ['bad slug'] }, log);
    expect(results).toEqual([{ repo: 'bad slug', ok: false, error: 'Invalid repository slug.' }]);
    // A rejected slug must never reach the `$ gh …` step.
    expect(log).not.toHaveBeenCalled();
  });

  it('repoStatus returns an empty result set for no paths', async () => {
    expect(await repoStatus({ paths: [] })).toEqual({ results: [] });
    expect(await repoStatus({ paths: ['   '] })).toEqual({ results: [] });
  });

  it('repoStatus flags a non-git folder without throwing', async () => {
    // A path that is not a work tree resolves to a per-repo error, never a throw.
    const { results } = await repoStatus({ paths: ['/definitely/not/a/git/repo/xyz'] });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ name: 'xyz', changed: 0, untracked: 0, error: 'Not a git repository.' });
  });
});
