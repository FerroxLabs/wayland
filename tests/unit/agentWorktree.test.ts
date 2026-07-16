/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  AGENT_BRANCH_PREFIX,
  assignAgentWorktree,
  isGitRepo,
  isWorktreeIsolationEnabled,
  listAgentWorktrees,
  mergeAgentWorktree,
  removeAgentWorktree,
  worktreeNamesFor,
} from '@process/services/agentWorktree';

function hasGit(): boolean {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const GIT = hasGit();

describe('agentWorktree — pure helpers', () => {
  it('derives a sibling dir + namespaced branch from repo + id', () => {
    const { branch, path } = worktreeNamesFor(join('/home', 'me', 'repo'), 'abcd1234');
    expect(branch).toBe(`${AGENT_BRANCH_PREFIX}abcd1234`);
    // Sibling of the repo, not nested inside it.
    expect(path).toBe(join('/home', 'me', 'repo--agent-abcd1234'));
  });

  it('isolation is on by default and off only for an explicit opt-out', () => {
    const prev = process.env.WAYLAND_NO_AGENT_WORKTREE;
    try {
      delete process.env.WAYLAND_NO_AGENT_WORKTREE;
      expect(isWorktreeIsolationEnabled()).toBe(true);
      process.env.WAYLAND_NO_AGENT_WORKTREE = '1';
      expect(isWorktreeIsolationEnabled()).toBe(false);
      process.env.WAYLAND_NO_AGENT_WORKTREE = 'true';
      expect(isWorktreeIsolationEnabled()).toBe(false);
      process.env.WAYLAND_NO_AGENT_WORKTREE = '0';
      expect(isWorktreeIsolationEnabled()).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.WAYLAND_NO_AGENT_WORKTREE;
      else process.env.WAYLAND_NO_AGENT_WORKTREE = prev;
    }
  });
});

describe('agentWorktree — non-git and fallback', () => {
  let tmp: string;
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'wl-nogit-'));
  });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it('isGitRepo is false for a plain dir and a missing path', async () => {
    expect(await isGitRepo(tmp)).toBe(false);
    expect(await isGitRepo(join(tmp, 'does-not-exist'))).toBe(false);
    expect(await isGitRepo('')).toBe(false);
  });

  it('assignAgentWorktree is a safe no-op on a non-git workspace', async () => {
    const extra: Record<string, unknown> = { workspace: tmp };
    expect(await assignAgentWorktree(extra)).toBe(false);
    expect(extra.workspace).toBe(tmp); // untouched
    expect(extra.worktreePath).toBeUndefined();
  });

  it('respects the global opt-out', async () => {
    const prev = process.env.WAYLAND_NO_AGENT_WORKTREE;
    process.env.WAYLAND_NO_AGENT_WORKTREE = '1';
    try {
      const extra: Record<string, unknown> = { workspace: tmp };
      expect(await assignAgentWorktree(extra)).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.WAYLAND_NO_AGENT_WORKTREE;
      else process.env.WAYLAND_NO_AGENT_WORKTREE = prev;
    }
  });
});

describe.skipIf(!GIT)('agentWorktree — real git repo', () => {
  let parent: string;
  let repo: string;

  beforeAll(() => {
    parent = mkdtempSync(join(tmpdir(), 'wl-git-'));
    repo = join(parent, 'repo');
    execFileSync('git', ['init', '-q', repo]);
    // Commit identity + one commit so HEAD exists (worktree add needs it).
    execFileSync('git', ['-C', repo, 'config', 'user.email', 'test@wayland.local']);
    execFileSync('git', ['-C', repo, 'config', 'user.name', 'Wayland Test']);
    writeFileSync(join(repo, 'README.md'), '# test\n');
    execFileSync('git', ['-C', repo, 'add', '.']);
    execFileSync('git', ['-C', repo, 'commit', '-q', '-m', 'init']);
  });

  afterAll(() => rmSync(parent, { recursive: true, force: true }));

  // Track worktrees created per test so we can clean them between cases.
  let created: Record<string, unknown> | null = null;
  afterEach(async () => {
    if (created) {
      await removeAgentWorktree(created);
      created = null;
    }
  });

  it('detects the repo', async () => {
    expect(await isGitRepo(repo)).toBe(true);
  });

  it('assigns a live, isolated worktree and rewrites workspace', async () => {
    const extra: Record<string, unknown> = { workspace: repo };
    const ok = await assignAgentWorktree(extra);
    created = extra;
    expect(ok).toBe(true);
    expect(typeof extra.worktreePath).toBe('string');
    expect(extra.workspace).toBe(extra.worktreePath);
    expect(extra.worktreeRepo).toBe(repo);
    expect(String(extra.worktreeBranch).startsWith(AGENT_BRANCH_PREFIX)).toBe(true);
    // The worktree dir exists, is a sibling of the repo, and is itself a repo.
    expect(existsSync(extra.worktreePath as string)).toBe(true);
    expect(await isGitRepo(extra.worktreePath as string)).toBe(true);
  });

  it('two agents get distinct worktrees (no collision)', async () => {
    const a: Record<string, unknown> = { workspace: repo };
    const b: Record<string, unknown> = { workspace: repo };
    expect(await assignAgentWorktree(a)).toBe(true);
    expect(await assignAgentWorktree(b)).toBe(true);
    expect(a.worktreePath).not.toBe(b.worktreePath);
    expect(a.worktreeBranch).not.toBe(b.worktreeBranch);
    try {
      const list = await listAgentWorktrees(repo);
      const paths = list.map((w) => w.path);
      // Both agent worktrees are registered on the repo.
      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(paths.some((p) => p.includes('--agent-'))).toBe(true);
    } finally {
      await removeAgentWorktree(a);
      await removeAgentWorktree(b);
    }
  });

  it('is idempotent when a live worktree already exists', async () => {
    const extra: Record<string, unknown> = { workspace: repo };
    expect(await assignAgentWorktree(extra)).toBe(true);
    created = extra;
    const firstPath = extra.worktreePath;
    // Second call sees a live worktree and does nothing.
    expect(await assignAgentWorktree(extra)).toBe(false);
    expect(extra.worktreePath).toBe(firstPath);
  });

  it('removeAgentWorktree deletes the dir and its branch', async () => {
    const extra: Record<string, unknown> = { workspace: repo };
    await assignAgentWorktree(extra);
    const wtPath = extra.worktreePath as string;
    const branch = extra.worktreeBranch as string;
    expect(existsSync(wtPath)).toBe(true);
    await removeAgentWorktree(extra);
    expect(existsSync(wtPath)).toBe(false);
    // Branch is gone too.
    const branches = execFileSync('git', ['-C', repo, 'branch', '--list', branch]).toString().trim();
    expect(branches).toBe('');
  });

  it('merges an agent branch (incl. uncommitted edits) back into the main checkout', async () => {
    const extra: Record<string, unknown> = { workspace: repo };
    await assignAgentWorktree(extra);
    const wtPath = extra.worktreePath as string;
    const branch = extra.worktreeBranch as string;
    // New, UNCOMMITTED work in the isolated worktree - merge must snapshot it.
    writeFileSync(join(wtPath, 'agent-file.txt'), 'work from the agent\n');

    const res = await mergeAgentWorktree(repo, branch);
    expect(res.ok).toBe(true);
    // The agent's file now lives in the main checkout.
    expect(existsSync(join(repo, 'agent-file.txt'))).toBe(true);
    // Worktree + branch are retired after a successful merge.
    expect(existsSync(wtPath)).toBe(false);
    const branches = execFileSync('git', ['-C', repo, 'branch', '--list', branch]).toString().trim();
    expect(branches).toBe('');
  });

  it('refuses to merge a non-agent branch', async () => {
    const res = await mergeAgentWorktree(repo, 'main');
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });
});
