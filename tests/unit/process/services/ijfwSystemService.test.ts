/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contract test for ijfwSystemService - verifies the service exposes the
 * five Wave 1 methods and the result/runtime-mode types.
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getVersion: () => '0.6.3',
    getPath: (key: string) => `/tmp/wayland-test-${key}`,
  },
}));

// #716: getActiveProjectDirs reads persisted project workspaces (lazily) so a
// GUI launch with cwd '/' still scans tracked projects. Mocked so unit tests
// never touch a real SQLite database.
const listProjectsSpy = vi.fn().mockResolvedValue([]);
vi.mock('@process/services/database/SqliteProjectRepository', () => ({
  SqliteProjectRepository: class {
    listProjects() {
      return listProjectsSpy();
    }
  },
}));

// eslint-disable-next-line import/first
import { ijfwSystemService, getActiveProjectDirs } from '@process/services/ijfwSystemService';

describe('ijfwSystemService - contract', () => {
  it('exposes detectLocalInstall', () => {
    expect(typeof ijfwSystemService.detectLocalInstall).toBe('function');
  });

  it('exposes getLatestPublished', () => {
    expect(typeof ijfwSystemService.getLatestPublished).toBe('function');
  });

  it('exposes bootstrap', () => {
    expect(typeof ijfwSystemService.bootstrap).toBe('function');
  });

  it('exposes applyPendingUpgrade', () => {
    expect(typeof ijfwSystemService.applyPendingUpgrade).toBe('function');
  });

  it('exposes getRuntimeMode', () => {
    expect(typeof ijfwSystemService.getRuntimeMode).toBe('function');
  });

  it('getRuntimeMode returns one of the documented modes', () => {
    const mode = ijfwSystemService.getRuntimeMode();
    expect(['disabled', 'enabled', 'pending_activation']).toContain(mode);
  });

  it('exposes startHealthWatcher', () => {
    expect(typeof ijfwSystemService.startHealthWatcher).toBe('function');
  });
});

describe('getActiveProjectDirs - Gemini B2 unsafe-root guard', () => {
  const originalCwd = process.cwd();
  const originalHome = process.env.HOME;

  beforeEach(() => {
    vi.spyOn(process, 'cwd');
    listProjectsSpy.mockReset().mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.HOME = originalHome;
    // Ensure no test stays in a chdir state.
    try {
      process.chdir(originalCwd);
    } catch {
      /* ignore */
    }
  });

  it('returns [] when cwd is "/" (macOS GUI Dock launch) and no projects exist', async () => {
    (process.cwd as ReturnType<typeof vi.fn>).mockReturnValue('/');
    await expect(getActiveProjectDirs()).resolves.toEqual([]);
  });

  it('returns [] when cwd is the bare HOME directory', async () => {
    process.env.HOME = '/Users/test-user';
    (process.cwd as ReturnType<typeof vi.fn>).mockReturnValue('/Users/test-user');
    await expect(getActiveProjectDirs()).resolves.toEqual([]);
  });

  it('returns [] for system paths like /etc, /var, /System', async () => {
    for (const sys of ['/etc', '/var', '/System', '/Library', '/Applications']) {
      (process.cwd as ReturnType<typeof vi.fn>).mockReturnValue(sys);
      await expect(getActiveProjectDirs()).resolves.toEqual([]);
    }
  });

  it('returns [cwd] for a normal project directory', async () => {
    (process.cwd as ReturnType<typeof vi.fn>).mockReturnValue('/Users/test-user/dev/myproject');
    await expect(getActiveProjectDirs()).resolves.toEqual(['/Users/test-user/dev/myproject']);
  });
});

describe('getActiveProjectDirs - #716 project workspaces on GUI launch', () => {
  const originalHome = process.env.HOME;

  beforeEach(() => {
    vi.spyOn(process, 'cwd');
    listProjectsSpy.mockReset().mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.HOME = originalHome;
  });

  it('returns project workspaces when cwd is "/" (macOS GUI Dock launch)', async () => {
    (process.cwd as ReturnType<typeof vi.fn>).mockReturnValue('/');
    listProjectsSpy.mockResolvedValue([
      { id: 'a', name: 'A', workspace: '/Users/test-user/WaylandProjects/alpha' },
      { id: 'b', name: 'B', workspace: '/Users/test-user/WaylandProjects/beta' },
    ]);
    await expect(getActiveProjectDirs()).resolves.toEqual([
      '/Users/test-user/WaylandProjects/alpha',
      '/Users/test-user/WaylandProjects/beta',
    ]);
  });

  it('skips projects without a workspace and unsafe workspace values', async () => {
    process.env.HOME = '/Users/test-user';
    (process.cwd as ReturnType<typeof vi.fn>).mockReturnValue('/');
    listProjectsSpy.mockResolvedValue([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B', workspace: '  ' },
      { id: 'c', name: 'C', workspace: '/' },
      { id: 'd', name: 'D', workspace: '/Users/test-user' },
      { id: 'e', name: 'E', workspace: '/Users/test-user/dev/ok' },
    ]);
    await expect(getActiveProjectDirs()).resolves.toEqual(['/Users/test-user/dev/ok']);
  });

  it('deduplicates a cwd that is also a project workspace', async () => {
    (process.cwd as ReturnType<typeof vi.fn>).mockReturnValue('/Users/test-user/dev/myproject');
    listProjectsSpy.mockResolvedValue([{ id: 'a', name: 'A', workspace: '/Users/test-user/dev/myproject' }]);
    await expect(getActiveProjectDirs()).resolves.toEqual(['/Users/test-user/dev/myproject']);
  });

  it('falls back to a safe cwd when the project store read fails', async () => {
    (process.cwd as ReturnType<typeof vi.fn>).mockReturnValue('/Users/test-user/dev/myproject');
    listProjectsSpy.mockRejectedValue(new Error('db not ready'));
    await expect(getActiveProjectDirs()).resolves.toEqual(['/Users/test-user/dev/myproject']);
  });
});
