/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #455 - lazy migration. A project that has no workspace yet must get one
 * allocated, persisted, and knowledge-bootstrapped on demand (e.g. the next time
 * a chat is created in it), so existing empty-workspace projects self-heal with
 * no data loss. `ensureProjectWorkspace` is the shared seam createProject and the
 * conversation-create reconcile both lean on.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetProject = vi.hoisted(() =>
  vi.fn(async (_id: string) => null as { id: string; name: string; description?: string; workspace?: string } | null)
);
const mockUpdateProject = vi.hoisted(() => vi.fn(async (_id: string, _u: Record<string, unknown>) => {}));
vi.mock('../../src/process/services/database/SqliteProjectRepository', () => ({
  SqliteProjectRepository: class {
    getProject = mockGetProject;
    updateProject = mockUpdateProject;
  },
}));

const mockBootstrap = vi.hoisted(() => vi.fn(async () => {}));
vi.mock('@process/services/projectKnowledge/bootstrap', () => ({
  WAYLAND_KNOWLEDGE_DIR: '.wayland',
  bootstrapProjectKnowledge: mockBootstrap,
}));

import { ensureProjectWorkspace } from '../../src/process/services/projectWorkspace';

describe('ensureProjectWorkspace (#455 lazy migration)', () => {
  beforeEach(() => {
    mockGetProject.mockReset();
    mockUpdateProject.mockReset();
    mockBootstrap.mockReset();
  });

  it('returns null for a missing projectId', async () => {
    expect(await ensureProjectWorkspace(undefined)).toBe(null);
    expect(mockGetProject).not.toHaveBeenCalled();
  });

  it('returns null when the project does not exist', async () => {
    mockGetProject.mockResolvedValueOnce(null);
    expect(await ensureProjectWorkspace('p1', async () => '/should/not/run')).toBe(null);
    expect(mockUpdateProject).not.toHaveBeenCalled();
  });

  it('returns the existing workspace untouched (no allocation, no write)', async () => {
    mockGetProject.mockResolvedValueOnce({ id: 'p1', name: 'Alpha', workspace: '/projects/alpha' });
    const allocate = vi.fn(async () => '/never');
    expect(await ensureProjectWorkspace('p1', allocate)).toBe('/projects/alpha');
    expect(allocate).not.toHaveBeenCalled();
    expect(mockUpdateProject).not.toHaveBeenCalled();
  });

  it('allocates, persists, and bootstraps when the project has no workspace', async () => {
    mockGetProject.mockResolvedValueOnce({ id: 'p1', name: 'My Notes', description: 'd', workspace: '' });
    const allocate = vi.fn(async (name: string) => `/Docs/Wayland/${name}`);
    const result = await ensureProjectWorkspace('p1', allocate);
    expect(result).toBe('/Docs/Wayland/My Notes');
    expect(allocate).toHaveBeenCalledWith('My Notes');
    expect(mockUpdateProject).toHaveBeenCalledWith('p1', { workspace: '/Docs/Wayland/My Notes' });
    expect(mockBootstrap).toHaveBeenCalledWith('/Docs/Wayland/My Notes', 'My Notes', 'd');
  });

  it('still returns the workspace when knowledge bootstrap fails (best-effort)', async () => {
    mockGetProject.mockResolvedValueOnce({ id: 'p1', name: 'Alpha', workspace: undefined });
    mockBootstrap.mockRejectedValueOnce(new Error('disk full'));
    const result = await ensureProjectWorkspace('p1', async () => '/Docs/Wayland/Alpha');
    expect(result).toBe('/Docs/Wayland/Alpha');
    expect(mockUpdateProject).toHaveBeenCalledWith('p1', { workspace: '/Docs/Wayland/Alpha' });
  });

  it('swallows repository failure and returns null', async () => {
    mockGetProject.mockRejectedValueOnce(new Error('db down'));
    expect(await ensureProjectWorkspace('p1', async () => '/x')).toBe(null);
  });

  it('serializes concurrent first-chats for the same project (allocates once)', async () => {
    mockGetProject.mockResolvedValue({ id: 'p1', name: 'Alpha', workspace: '' });
    let calls = 0;
    const allocate = vi.fn(async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 5));
      return '/Docs/Wayland/Alpha';
    });
    const [a, b] = await Promise.all([ensureProjectWorkspace('p1', allocate), ensureProjectWorkspace('p1', allocate)]);
    expect(a).toBe('/Docs/Wayland/Alpha');
    expect(b).toBe('/Docs/Wayland/Alpha');
    // The lock collapses the two concurrent calls to a single allocation + write.
    expect(calls).toBe(1);
    expect(mockUpdateProject).toHaveBeenCalledTimes(1);
  });
});
