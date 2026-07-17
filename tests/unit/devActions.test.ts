/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
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

type GhResponse = (args: string[]) => string;

async function loadDevActionsWithGhMock(respond: GhResponse) {
  vi.resetModules();
  const execFileMock = vi.fn(
    (
      file: string,
      args: string[],
      _options: unknown,
      callback: (error: Error | null, result?: { stdout: string; stderr: string }) => void
    ) => {
      if (file !== 'gh') {
        const error = Object.assign(new Error(`Unexpected executable: ${file}`), {
          stderr: `Unexpected executable: ${file}`,
        });
        callback(error);
        return;
      }
      try {
        callback(null, { stdout: respond(args), stderr: '' });
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        callback(Object.assign(new Error(message), { stderr: message }));
      }
    }
  );

  vi.doMock('node:child_process', async () => {
    const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
    return { ...actual, execFile: execFileMock };
  });

  const module = await import('@process/services/devActions');
  return { syncForks: module.syncForks, execFileMock };
}

function apiEndpoint(args: string[]): string {
  return args.find((arg) => arg.startsWith('repos/')) || '';
}

function apiMethod(args: string[]): string {
  const index = args.indexOf('--method');
  return index >= 0 ? args[index + 1] : 'GET';
}

describe('syncForks non-destructive upstream PRs', () => {
  afterEach(() => {
    vi.doUnmock('node:child_process');
    vi.resetModules();
  });

  it('creates a disposable sync branch and PR without updating the fork default branch', async () => {
    const calls: string[][] = [];
    const { syncForks: syncWithMock } = await loadDevActionsWithGhMock((args) => {
      calls.push(args);
      const endpoint = apiEndpoint(args);
      const method = apiMethod(args);
      if (endpoint === 'repos/ShadowsTT/wayland' && method === 'GET') {
        return JSON.stringify({
          fork: true,
          owner: 'ShadowsTT',
          targetBranch: 'main',
          upstream: 'FerroxLabs/wayland',
          upstreamOwner: 'FerroxLabs',
          upstreamBranch: 'main',
        });
      }
      if (endpoint.includes('/compare/')) return JSON.stringify({ ahead: 60, preserved: 36 });
      if (endpoint === 'repos/FerroxLabs/wayland/git/ref/heads/main') return JSON.stringify({ sha: 'upstream-sha' });
      if (endpoint.includes('/git/matching-refs/')) {
        return JSON.stringify([
          {
            ref: 'refs/heads/automated/upstream-sync-old',
            sha: 'similarly-prefixed-branch-sha',
          },
        ]);
      }
      if (endpoint === 'repos/ShadowsTT/wayland/git/refs' && method === 'POST') return '{}';
      if (endpoint === 'repos/ShadowsTT/wayland/pulls' && method === 'GET') return '[]';
      if (endpoint === 'repos/ShadowsTT/wayland/pulls' && method === 'POST') {
        return JSON.stringify({ url: 'https://github.com/ShadowsTT/wayland/pull/123' });
      }
      throw new Error(`Unexpected gh args: ${args.join(' ')}`);
    });

    const result = await syncWithMock({ repos: ['ShadowsTT/wayland'] }, vi.fn());

    expect(result.results[0]).toMatchObject({
      ok: true,
      status: 'created',
      prUrl: 'https://github.com/ShadowsTT/wayland/pull/123',
      upstreamCommits: 60,
      preservedForkCommits: 36,
    });
    expect(calls.some((args) => args.includes('ref=refs/heads/automated/upstream-sync'))).toBe(true);
    expect(calls.some((args) => apiEndpoint(args).includes('/git/refs/heads/') && apiMethod(args) === 'PATCH')).toBe(
      false
    );
    expect(calls.some((args) => args.some((arg) => arg.includes('refs/heads/main')))).toBe(false);
  });

  it('updates the disposable branch and reuses an existing sync PR', async () => {
    const calls: string[][] = [];
    const { syncForks: syncWithMock } = await loadDevActionsWithGhMock((args) => {
      calls.push(args);
      const endpoint = apiEndpoint(args);
      const method = apiMethod(args);
      if (endpoint === 'repos/ShadowsTT/wayland-core' && method === 'GET') {
        return JSON.stringify({
          fork: true,
          owner: 'ShadowsTT',
          targetBranch: 'main',
          upstream: 'FerroxLabs/wayland-core',
          upstreamOwner: 'FerroxLabs',
          upstreamBranch: 'main',
        });
      }
      if (endpoint.includes('/compare/')) return JSON.stringify({ ahead: 37, preserved: 3 });
      if (endpoint === 'repos/FerroxLabs/wayland-core/git/ref/heads/main') {
        return JSON.stringify({ sha: 'new-upstream-sha' });
      }
      if (endpoint.includes('/git/matching-refs/')) {
        return JSON.stringify([{ ref: 'refs/heads/automated/upstream-sync', sha: 'old-upstream-sha' }]);
      }
      if (endpoint.includes('/git/refs/heads/automated/upstream-sync') && method === 'PATCH') return '{}';
      if (endpoint === 'repos/ShadowsTT/wayland-core/pulls' && method === 'GET') {
        return JSON.stringify([{ url: 'https://github.com/ShadowsTT/wayland-core/pull/5' }]);
      }
      throw new Error(`Unexpected gh args: ${args.join(' ')}`);
    });

    const result = await syncWithMock({ repos: ['ShadowsTT/wayland-core'] }, vi.fn());

    expect(result.results[0]).toMatchObject({
      ok: true,
      status: 'updated',
      prUrl: 'https://github.com/ShadowsTT/wayland-core/pull/5',
    });
    expect(calls.some((args) => args.includes('force=true') && apiMethod(args) === 'PATCH')).toBe(true);
    expect(calls.some((args) => apiEndpoint(args).endsWith('/pulls') && apiMethod(args) === 'POST')).toBe(false);
  });

  it('reports an identical fork as up to date without requiring a workflow file', async () => {
    const calls: string[][] = [];
    const { syncForks: syncWithMock } = await loadDevActionsWithGhMock((args) => {
      calls.push(args);
      const endpoint = apiEndpoint(args);
      if (endpoint === 'repos/ShadowsTT/ijfw') {
        return JSON.stringify({
          fork: true,
          owner: 'ShadowsTT',
          targetBranch: 'main',
          upstream: 'FerroxLabs/ijfw',
          upstreamOwner: 'FerroxLabs',
          upstreamBranch: 'main',
        });
      }
      if (endpoint.includes('/compare/')) return JSON.stringify({ ahead: 0, preserved: 0 });
      throw new Error(`Unexpected gh args: ${args.join(' ')}`);
    });

    const result = await syncWithMock({ repos: ['ShadowsTT/ijfw'] }, vi.fn());

    expect(result.results[0]).toMatchObject({ ok: true, status: 'up-to-date', upstreamCommits: 0 });
    expect(calls).toHaveLength(2);
    expect(calls.some((args) => args.includes('workflow'))).toBe(false);
  });

  it('reads the original source repository for a fork of a fork', async () => {
    const calls: string[][] = [];
    const { syncForks: syncWithMock } = await loadDevActionsWithGhMock((args) => {
      calls.push(args);
      const endpoint = apiEndpoint(args);
      if (endpoint === 'repos/ShadowsTT/nested-fork') {
        const jq = args[args.indexOf('--jq') + 1] || '';
        if (!jq.includes('.source.full_name') || jq.includes('.parent.full_name')) {
          throw new Error(`Expected root source metadata query, received: ${jq}`);
        }
        return JSON.stringify({
          fork: true,
          owner: 'ShadowsTT',
          targetBranch: 'main',
          upstream: 'Original/project',
          upstreamOwner: 'Original',
          upstreamBranch: 'main',
        });
      }
      if (endpoint.includes('/compare/')) return JSON.stringify({ ahead: 0, preserved: 2 });
      throw new Error(`Unexpected gh args: ${args.join(' ')}`);
    });

    const result = await syncWithMock({ repos: ['ShadowsTT/nested-fork'] }, vi.fn());

    expect(result.results[0]).toMatchObject({
      ok: true,
      status: 'up-to-date',
      upstream: 'Original/project',
      preservedForkCommits: 2,
    });
    expect(calls).toHaveLength(2);
  });

  it('rejects a repository that is not a fork before writing any ref', async () => {
    const calls: string[][] = [];
    const { syncForks: syncWithMock } = await loadDevActionsWithGhMock((args) => {
      calls.push(args);
      return JSON.stringify({ fork: false, owner: 'ShadowsTT', targetBranch: 'main' });
    });

    const result = await syncWithMock({ repos: ['ShadowsTT/standalone'] }, vi.fn());

    expect(result.results[0]).toMatchObject({ ok: false, error: expect.stringContaining('not a fork') });
    expect(calls).toHaveLength(1);
  });
});
