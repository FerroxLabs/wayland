/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit tests for safe child-process cwd selection (#755). The invariant under
 * test: the resolved cwd is never inside a signed application bundle
 * (`*.app/Contents`, `app.asar`, `app.asar.unpacked`) - a child that treats a
 * writable cwd as a project root must never be pointed at the bundle, or its
 * writes break the codesign seal and macOS blocks all child processes (#738).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as os from 'node:os';

const getDataDirMock = vi.fn<() => string>();

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({ paths: { getDataDir: () => getDataDirMock() } }),
}));

import { isBundleInternalPath, resolveSafeSpawnCwd } from '@process/utils/safeSpawnCwd';

beforeEach(() => {
  getDataDirMock.mockReset();
});

describe('isBundleInternalPath', () => {
  it('flags app.asar.unpacked (the #755 write target)', () => {
    expect(isBundleInternalPath('/Applications/Wayland.app/Contents/Resources/app.asar.unpacked')).toBe(true);
  });

  it('flags paths nested below app.asar.unpacked', () => {
    expect(isBundleInternalPath('/Applications/Wayland.app/Contents/Resources/app.asar.unpacked/.ijfw')).toBe(true);
  });

  it('flags app.asar itself', () => {
    expect(isBundleInternalPath('/Applications/Wayland.app/Contents/Resources/app.asar')).toBe(true);
  });

  it('flags macOS bundle interiors even without app.asar', () => {
    expect(isBundleInternalPath('/Applications/Wayland.app/Contents/MacOS')).toBe(true);
    expect(isBundleInternalPath('/Users/me/Apps/Wayland.app/Contents/Resources')).toBe(true);
  });

  it('flags Windows-style resources/app.asar paths', () => {
    expect(isBundleInternalPath('C:\\Program Files\\Wayland\\resources\\app.asar\\dist')).toBe(true);
    expect(isBundleInternalPath('C:\\Program Files\\Wayland\\resources\\app.asar.unpacked')).toBe(true);
  });

  it('does not flag ordinary user directories', () => {
    expect(isBundleInternalPath('/Users/me/Library/Application Support/Wayland')).toBe(false);
    expect(isBundleInternalPath(os.homedir())).toBe(false);
    expect(isBundleInternalPath(os.tmpdir())).toBe(false);
    expect(isBundleInternalPath('/Users/me/dev/myproject')).toBe(false);
  });

  it('does not flag a directory that merely ends in .app without a Contents child segment', () => {
    expect(isBundleInternalPath('/Users/me/dev/web.app/src')).toBe(false);
  });

  it('is false for empty input', () => {
    expect(isBundleInternalPath('')).toBe(false);
  });
});

describe('resolveSafeSpawnCwd', () => {
  it('prefers the userData dir when it exists and is bundle-external', () => {
    // os.tmpdir() stands in for userData: guaranteed to exist.
    const userData = os.tmpdir();
    getDataDirMock.mockReturnValue(userData);
    expect(resolveSafeSpawnCwd()).toBe(userData);
  });

  it('skips a bundle-internal userData dir and falls back to homedir', () => {
    getDataDirMock.mockReturnValue('/Applications/Wayland.app/Contents/Resources/app.asar.unpacked');
    expect(resolveSafeSpawnCwd()).toBe(os.homedir());
  });

  it('skips a non-existent userData dir and falls back to homedir', () => {
    getDataDirMock.mockReturnValue('/definitely/not/a/real/dir/wayland-test');
    expect(resolveSafeSpawnCwd()).toBe(os.homedir());
  });

  it('survives platform services throwing (utility-process edge) and falls back to homedir', () => {
    getDataDirMock.mockImplementation(() => {
      throw new Error('Services not registered');
    });
    expect(resolveSafeSpawnCwd()).toBe(os.homedir());
  });

  it('NEVER returns a bundle-internal path, whatever the platform reports', () => {
    const hostile = [
      '/Applications/Wayland.app/Contents/Resources/app.asar.unpacked',
      '/Applications/Wayland.app/Contents/MacOS',
      'C:\\Program Files\\Wayland\\resources\\app.asar',
    ];
    for (const dir of hostile) {
      getDataDirMock.mockReturnValue(dir);
      const resolved = resolveSafeSpawnCwd();
      expect(isBundleInternalPath(resolved)).toBe(false);
    }
  });
});
