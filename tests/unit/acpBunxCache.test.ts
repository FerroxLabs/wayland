/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { join } from 'node:path';

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  isBunxCacheCorruption,
  clearBunxCache,
  clearBunxWorkingDirsForPackage,
  isBunCacheMoveFailed,
} from '../../src/process/agent/acp/acpConnectors';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    rmSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
  };
});

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const { rmSync, readdirSync, statSync } = await import('fs');
const rmSyncMock = vi.mocked(rmSync);
const readdirSyncMock = vi.mocked(readdirSync);
const statSyncMock = vi.mocked(statSync);

afterEach(() => {
  // resetAllMocks (not clearAllMocks) so a per-test mockImplementation - e.g.
  // the `rmSync throws` case below - does not leak into later tests.
  vi.resetAllMocks();
});

describe('isBunxCacheCorruption', () => {
  it('detects "Cannot find package" (Unix bun error)', () => {
    const stderr =
      "error: Cannot find package 'zod' from '/tmp/bunx-501-@zed-industries/claude-agent-acp@0.21.0/node_modules/@agentclientprotocol/sdk/dist/acp.js'";
    expect(isBunxCacheCorruption(stderr)).toBe(true);
  });

  it('detects "Cannot find module" (Windows bun error)', () => {
    const stderr =
      "error: Cannot find module '@anthropic-ai/claude-agent-sdk' from 'C:\\Users\\test\\AppData\\Local\\Temp\\bunx-1743022513-@zed-industries\\claude-agent-acp@0.21.0\\node_modules\\@zed-industries\\claude-agent-acp\\dist\\acp-agent.js'";
    expect(isBunxCacheCorruption(stderr)).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isBunxCacheCorruption('ENOENT: no such file or directory')).toBe(false);
    expect(isBunxCacheCorruption('Error: error loading config')).toBe(false);
    expect(isBunxCacheCorruption('command not found')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isBunxCacheCorruption('')).toBe(false);
  });
});

describe('clearBunxCache', () => {
  it('extracts and removes Unix bunx cache directory', () => {
    const stderr =
      "error: Cannot find package 'zod' from '/tmp/bunx-501-@zed-industries/claude-agent-acp@0.21.0/node_modules/@agentclientprotocol/sdk/dist/acp.js'";

    const result = clearBunxCache(stderr);

    expect(result).toBe('/tmp/bunx-501-@zed-industries/claude-agent-acp@0.21.0');
    expect(rmSyncMock).toHaveBeenCalledWith('/tmp/bunx-501-@zed-industries/claude-agent-acp@0.21.0', {
      recursive: true,
      force: true,
    });
  });

  it('extracts and removes macOS bunx cache directory', () => {
    const stderr =
      "error: Cannot find package 'zod' from '/private/var/folders/t2/fy1kjb5d3711k89q19x2v05w0000gn/T/bunx-501-@zed-industries/claude-agent-acp@0.21.0/node_modules/@agentclientprotocol/sdk/dist/acp.js'";

    const result = clearBunxCache(stderr);

    expect(result).toBe(
      '/private/var/folders/t2/fy1kjb5d3711k89q19x2v05w0000gn/T/bunx-501-@zed-industries/claude-agent-acp@0.21.0'
    );
    expect(rmSyncMock).toHaveBeenCalledOnce();
  });

  it('extracts and removes Windows bunx cache directory', () => {
    const stderr =
      "error: Cannot find module '@anthropic-ai/claude-agent-sdk' from 'C:\\Users\\test\\AppData\\Local\\Temp\\bunx-1743022513-@zed-industries\\claude-agent-acp@0.21.0\\node_modules\\@zed-industries\\claude-agent-acp\\dist\\acp-agent.js'";

    const result = clearBunxCache(stderr);

    expect(result).toBe(
      'C:\\Users\\test\\AppData\\Local\\Temp\\bunx-1743022513-@zed-industries\\claude-agent-acp@0.21.0'
    );
    expect(rmSyncMock).toHaveBeenCalledOnce();
  });

  it('returns null when stderr does not contain a bunx cache path', () => {
    const stderr = 'Error: some other error without bunx path';

    const result = clearBunxCache(stderr);

    expect(result).toBeNull();
    expect(rmSyncMock).not.toHaveBeenCalled();
  });

  it('returns null when rmSync throws (permission denied, etc.)', () => {
    rmSyncMock.mockImplementation(() => {
      throw new Error('EPERM: operation not permitted');
    });

    const stderr =
      "error: Cannot find package 'zod' from '/tmp/bunx-501-@zed-industries/claude-agent-acp@0.21.0/node_modules/foo'";

    const result = clearBunxCache(stderr);

    expect(result).toBeNull();
    expect(rmSyncMock).toHaveBeenCalledOnce();
  });
});

describe('clearBunxWorkingDirsForPackage (#373)', () => {
  it('clears the agent bunx working dir BY NAME when stderr has no extractable path', () => {
    // #373: `Cannot find module 'zod/v4'` prints no bunx path, so clearBunxCache
    // returns null; the by-name fallback must still remove the corrupt dir.
    readdirSyncMock.mockImplementation((dir: unknown) =>
      String(dir) === '/fake/tmp'
        ? (['bunx-501-@agentclientprotocol', 'bunx-501-@zed-industries', 'unrelated'] as never)
        : ([] as never)
    );
    statSyncMock.mockReturnValue({ isDirectory: () => true } as never);

    const removed = clearBunxWorkingDirsForPackage('@agentclientprotocol/claude-agent-acp@0.52.0', {
      BUN_TMPDIR: '/fake/tmp',
    });

    const expectedDir = join('/fake/tmp', 'bunx-501-@agentclientprotocol');
    expect(removed).toEqual([expectedDir]);
    expect(rmSyncMock).toHaveBeenCalledWith(expectedDir, {
      recursive: true,
      force: true,
    });
    // Must NOT touch a different package's bunx dir or unrelated entries.
    expect(rmSyncMock).toHaveBeenCalledTimes(1);
  });

  it('returns [] and removes nothing when no bunx dir matches the package', () => {
    readdirSyncMock.mockReturnValue(['bunx-501-@some-other-scope', 'random'] as never);
    statSyncMock.mockReturnValue({ isDirectory: () => true } as never);

    const removed = clearBunxWorkingDirsForPackage('@agentclientprotocol/claude-agent-acp@0.52.0', {
      BUN_TMPDIR: '/fake/tmp',
    });

    expect(removed).toEqual([]);
    expect(rmSyncMock).not.toHaveBeenCalled();
  });

  it('derives the bunx suffix for an unscoped package name', () => {
    readdirSyncMock.mockImplementation((dir: unknown) =>
      String(dir) === '/fake/tmp' ? (['bunx-777-claude-agent-acp'] as never) : ([] as never)
    );
    statSyncMock.mockReturnValue({ isDirectory: () => true } as never);

    const removed = clearBunxWorkingDirsForPackage('claude-agent-acp@1.0.0', { BUN_TMPDIR: '/fake/tmp' });

    expect(removed).toEqual([join('/fake/tmp', 'bunx-777-claude-agent-acp')]);
  });
});

describe('isBunCacheMoveFailed', () => {
  it('detects EPERM moving to cache dir error', () => {
    const stderr =
      'error: moving "@zed-industries/codex-acp-win32-x64" to cache dir failed\n' +
      'EPERM: Operation not permitted (NtSetInformationFile())\n' +
      '  From: .bdbfbff4faf5dd89-00000013\n';
    expect(isBunCacheMoveFailed(stderr)).toBe(true);
  });

  it('detects EPERM with different package names', () => {
    const stderr =
      'error: moving "@zed-industries/codex-acp" to cache dir failed\nEPERM: Operation not permitted (NtSetInformationFile())';
    expect(isBunCacheMoveFailed(stderr)).toBe(true);
  });

  it('returns false for unrelated EPERM errors', () => {
    expect(isBunCacheMoveFailed('EPERM: operation not permitted, unlink /some/file')).toBe(false);
  });

  it('returns false for non-EPERM cache errors', () => {
    expect(isBunCacheMoveFailed('error: moving package to cache dir failed\nENOENT: no such file')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isBunCacheMoveFailed('')).toBe(false);
  });

  it('returns false for unrelated errors', () => {
    expect(isBunCacheMoveFailed('Cannot find package zod')).toBe(false);
    expect(isBunCacheMoveFailed('command not found')).toBe(false);
  });
});
