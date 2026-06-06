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

  it('returns [] when cwd is "/" (macOS GUI Dock launch)', () => {
    (process.cwd as ReturnType<typeof vi.fn>).mockReturnValue('/');
    expect(getActiveProjectDirs()).toEqual([]);
  });

  it('returns [] when cwd is the bare HOME directory', () => {
    process.env.HOME = '/Users/test-user';
    (process.cwd as ReturnType<typeof vi.fn>).mockReturnValue('/Users/test-user');
    expect(getActiveProjectDirs()).toEqual([]);
  });

  it('returns [] for system paths like /etc, /var, /System', () => {
    for (const sys of ['/etc', '/var', '/System', '/Library', '/Applications']) {
      (process.cwd as ReturnType<typeof vi.fn>).mockReturnValue(sys);
      expect(getActiveProjectDirs()).toEqual([]);
    }
  });

  it('returns [cwd] for a normal project directory', () => {
    (process.cwd as ReturnType<typeof vi.fn>).mockReturnValue('/Users/test-user/dev/myproject');
    expect(getActiveProjectDirs()).toEqual(['/Users/test-user/dev/myproject']);
  });
});
