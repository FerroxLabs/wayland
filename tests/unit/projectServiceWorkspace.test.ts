/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #455 scope 1 - on project create, a project with no user-picked folder gets a
 * PERSISTENT workspace allocated (default ~/Documents/Wayland/<name>) and stored
 * on projects.workspace, so its chats never fall back to a throwaway temp dir.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAllocate = vi.hoisted(() => vi.fn(async (name: string) => `/Docs/Wayland/${name}`));
const mockEnsure = vi.hoisted(() => vi.fn(async () => '/Docs/Wayland/Proj'));
const mockEnforce = vi.hoisted(() =>
  // Mirror the real enforcer: repoint a non-custom project chat's workspace onto
  // the project folder (returns true), but never touch a user-picked custom one.
  vi.fn(async (extra: Record<string, unknown>) => {
    if (extra.customWorkspace) return false;
    extra.workspace = '/Docs/Wayland/Proj';
    return true;
  })
);
vi.mock('@process/services/projectWorkspace', () => ({
  allocateProjectWorkspace: mockAllocate,
  ensureProjectWorkspace: mockEnsure,
  enforceProjectWorkspace: mockEnforce,
}));

const mockBootstrap = vi.hoisted(() => vi.fn(async () => {}));
vi.mock('@process/services/projectKnowledge/bootstrap', () => ({
  WAYLAND_KNOWLEDGE_DIR: '.wayland',
  bootstrapProjectKnowledge: mockBootstrap,
}));

import { ProjectServiceImpl } from '@process/services/ProjectServiceImpl';
import type { IProject } from '@/common/types/project';

function makeRepo() {
  return {
    createProject: vi.fn(async (p: IProject) => p),
    getProject: vi.fn(async () => null),
    listProjects: vi.fn(async () => []),
    updateProject: vi.fn(async () => {}),
    removeProject: vi.fn(async () => {}),
    getProjectConversations: vi.fn(async () => []),
  };
}

describe('ProjectServiceImpl.createProject persistent workspace (#455)', () => {
  beforeEach(() => {
    mockAllocate.mockClear();
    mockBootstrap.mockClear();
  });

  it('allocates a persistent workspace when the user picked none', async () => {
    const repo = makeRepo();
    const svc = new ProjectServiceImpl(repo as never, {} as never);

    const project = await svc.createProject({ name: 'My Notes' });

    expect(mockAllocate).toHaveBeenCalledWith('My Notes');
    expect(project.workspace).toBe('/Docs/Wayland/My Notes');
    expect(repo.createProject).toHaveBeenCalledWith(expect.objectContaining({ workspace: '/Docs/Wayland/My Notes' }));
    // Knowledge folder bootstrapped at the new workspace.
    expect(mockBootstrap).toHaveBeenCalledWith('/Docs/Wayland/My Notes', 'My Notes', undefined);
  });

  it('respects a user-picked workspace and does not allocate', async () => {
    const repo = makeRepo();
    const svc = new ProjectServiceImpl(repo as never, {} as never);

    const project = await svc.createProject({ name: 'Alpha', workspace: '/picked/dir' });

    expect(mockAllocate).not.toHaveBeenCalled();
    expect(project.workspace).toBe('/picked/dir');
  });

  it('still creates the project when allocation fails (lazy migration retries later)', async () => {
    mockAllocate.mockRejectedValueOnce(new Error('disk full'));
    const repo = makeRepo();
    const svc = new ProjectServiceImpl(repo as never, {} as never);

    const project = await svc.createProject({ name: 'Alpha' });

    expect(project.workspace).toBeUndefined();
    expect(repo.createProject).toHaveBeenCalled();
    // No workspace -> no bootstrap.
    expect(mockBootstrap).not.toHaveBeenCalled();
  });
});

describe('ProjectServiceImpl.assignConversation re-homes workspace (#30)', () => {
  beforeEach(() => {
    mockEnsure.mockClear();
    mockEnforce.mockClear();
  });

  it('ensures + enforces the project workspace, persists it, and evicts the idle cached task', async () => {
    const repo = makeRepo();
    const convs = {
      getConversation: vi.fn(async () => ({ id: 'c1', extra: { workspace: '/tmp/wcore-temp-1' } })),
      updateConversation: vi.fn(async () => {}),
    };
    // An open-but-idle chat: the cached task exists and is finished, so evicting
    // it is safe and forces the next turn to respawn in the project folder.
    const taskCache = { getStatus: vi.fn(() => 'finished' as const), evict: vi.fn() };
    const svc = new ProjectServiceImpl(repo as never, convs as never, taskCache);

    await svc.assignConversation('c1', 'p1');

    // Lazy-migrate the project workspace, then pin this chat onto it.
    expect(mockEnsure).toHaveBeenCalledWith('p1');
    expect(mockEnforce).toHaveBeenCalled();
    // The exact re-homed extra is what gets persisted (not a stale copy).
    const [id, updates, mergeExtra] = convs.updateConversation.mock.calls[0];
    expect(id).toBe('c1');
    expect(mergeExtra).toBe(true);
    expect(updates).toEqual({
      extra: expect.objectContaining({ projectId: 'p1', workspace: '/Docs/Wayland/Proj' }),
    });
    // Re-homed + idle -> cached task evicted so the next turn rebuilds in the project dir.
    expect(taskCache.evict).toHaveBeenCalledWith('c1');
  });

  it('does NOT evict an actively-streaming (running) task, but still persists the re-home', async () => {
    const repo = makeRepo();
    const convs = {
      getConversation: vi.fn(async () => ({ id: 'c3', extra: { workspace: '/tmp/wcore-temp-9' } })),
      updateConversation: vi.fn(async () => {}),
    };
    // Chat assigned mid-turn: evicting would kill the in-flight stream, so skip it.
    const taskCache = { getStatus: vi.fn(() => 'running' as const), evict: vi.fn() };
    const svc = new ProjectServiceImpl(repo as never, convs as never, taskCache);

    await svc.assignConversation('c3', 'p1');

    // Workspace is still re-homed + persisted (correctness holds either way)...
    const persisted = convs.updateConversation.mock.calls[0][1] as { extra: { workspace: string } };
    expect(persisted.extra.workspace).toBe('/Docs/Wayland/Proj');
    // ...but the in-flight turn is NOT aborted; it re-homes on its next spawn.
    expect(taskCache.evict).not.toHaveBeenCalled();
  });

  it('preserves a user-picked custom workspace and does not evict', async () => {
    const repo = makeRepo();
    const convs = {
      getConversation: vi.fn(async () => ({
        id: 'c2',
        extra: { workspace: '/picked/dir', customWorkspace: true },
      })),
      updateConversation: vi.fn(async () => {}),
    };
    const taskCache = { getStatus: vi.fn(() => 'finished' as const), evict: vi.fn() };
    const svc = new ProjectServiceImpl(repo as never, convs as never, taskCache);

    await svc.assignConversation('c2', 'p1');

    // projectId is still stamped + persisted, but the custom folder is untouched.
    const persisted = convs.updateConversation.mock.calls[0][1] as {
      extra: { projectId: string; workspace: string };
    };
    expect(persisted.extra.projectId).toBe('p1');
    expect(persisted.extra.workspace).toBe('/picked/dir');
    // Not re-homed -> no eviction (guard short-circuits before getStatus).
    expect(taskCache.evict).not.toHaveBeenCalled();
  });
});
