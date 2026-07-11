/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { branchSlug, sanitizeBranch, buildRelease, syncForks, commitAndPr } from '@process/services/devActions';

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

  it('syncForks reports an invalid slug per-repo without dispatching', async () => {
    const log = vi.fn();
    const { results } = await syncForks({ repos: ['bad slug'] }, log);
    expect(results).toEqual([{ repo: 'bad slug', ok: false, error: 'Invalid repository slug.' }]);
    // A rejected slug must never reach the `$ gh …` step.
    expect(log).not.toHaveBeenCalled();
  });
});
