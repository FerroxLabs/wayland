/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetProject = vi.hoisted(() => vi.fn(async (_id: string) => null as { workspace?: string } | null));
vi.mock('../../src/process/services/database/SqliteProjectRepository', () => ({
  SqliteProjectRepository: class {
    getProject = mockGetProject;
  },
}));

import { enforceProjectWorkspace } from '../../src/process/services/projectWorkspace';

describe('enforceProjectWorkspace (#30 no-drift)', () => {
  beforeEach(() => {
    mockGetProject.mockReset();
    mockGetProject.mockResolvedValue(null);
  });

  it('is a no-op for a non-project chat', async () => {
    const extra: Record<string, unknown> = { workspace: '/anything' };
    const changed = await enforceProjectWorkspace(extra);
    expect(changed).toBe(false);
    expect(extra.workspace).toBe('/anything');
    expect(mockGetProject).not.toHaveBeenCalled();
  });

  it('is a no-op when extra is undefined', async () => {
    expect(await enforceProjectWorkspace(undefined)).toBe(false);
  });

  it('corrects a project chat that drifted to a temp dir', async () => {
    mockGetProject.mockResolvedValueOnce({ workspace: '/projects/alpha' });
    const extra: Record<string, unknown> = {
      projectId: 'p1',
      workspace: '/var/folders/tmp/wcore-temp-1736900000000',
    };
    const changed = await enforceProjectWorkspace(extra);
    expect(changed).toBe(true);
    expect(extra.workspace).toBe('/projects/alpha');
  });

  it('fills an empty workspace from the project', async () => {
    mockGetProject.mockResolvedValueOnce({ workspace: '/projects/alpha' });
    const extra: Record<string, unknown> = { projectId: 'p1', workspace: '' };
    expect(await enforceProjectWorkspace(extra)).toBe(true);
    expect(extra.workspace).toBe('/projects/alpha');
  });

  it('corrects a stale workspace after the project workspace moved', async () => {
    mockGetProject.mockResolvedValueOnce({ workspace: '/projects/alpha-renamed' });
    const extra: Record<string, unknown> = { projectId: 'p1', workspace: '/projects/alpha' };
    expect(await enforceProjectWorkspace(extra)).toBe(true);
    expect(extra.workspace).toBe('/projects/alpha-renamed');
  });

  it('never overrides a user-chosen custom workspace', async () => {
    const extra: Record<string, unknown> = {
      projectId: 'p1',
      workspace: '/my/custom/ws',
      customWorkspace: true,
    };
    expect(await enforceProjectWorkspace(extra)).toBe(false);
    expect(extra.workspace).toBe('/my/custom/ws');
    expect(mockGetProject).not.toHaveBeenCalled();
  });

  it('is a no-op when already pinned to the project workspace', async () => {
    mockGetProject.mockResolvedValueOnce({ workspace: '/projects/alpha' });
    const extra: Record<string, unknown> = { projectId: 'p1', workspace: '/projects/alpha' };
    expect(await enforceProjectWorkspace(extra)).toBe(false);
    expect(extra.workspace).toBe('/projects/alpha');
  });

  it('leaves the temp fallback alone when the project has no workspace', async () => {
    mockGetProject.mockResolvedValueOnce({ workspace: '' });
    const extra: Record<string, unknown> = { projectId: 'p1', workspace: '/tmp/wcore-temp-1' };
    expect(await enforceProjectWorkspace(extra)).toBe(false);
    expect(extra.workspace).toBe('/tmp/wcore-temp-1');
  });

  it('swallows repository failure and does not change the workspace', async () => {
    mockGetProject.mockRejectedValueOnce(new Error('db down'));
    const extra: Record<string, unknown> = { projectId: 'p1', workspace: '/tmp/wcore-temp-1' };
    expect(await enforceProjectWorkspace(extra)).toBe(false);
    expect(extra.workspace).toBe('/tmp/wcore-temp-1');
  });
});
