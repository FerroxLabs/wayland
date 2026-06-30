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
vi.mock('@process/services/projectWorkspace', () => ({
  allocateProjectWorkspace: mockAllocate,
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
