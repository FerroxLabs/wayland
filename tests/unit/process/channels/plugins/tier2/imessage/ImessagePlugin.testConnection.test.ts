/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for ImessagePlugin.testConnection static method.
 * Covers: platform check, chat.db existence, permission denied, osascript probe.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Force process.platform=darwin so the iMessage plugin's macOS-only guards
// don't short-circuit on Linux CI runners. Tests that need to assert non-darwin
// behavior re-stub locally.
const ORIGINAL_PLATFORM = process.platform;
beforeAll(() => Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true }));
afterAll(() => Object.defineProperty(process, 'platform', { value: ORIGINAL_PLATFORM, configurable: true }));

// ---------------------------------------------------------------------------
// Hoist mocks - all vi.mock + vi.hoisted at module top level
// ---------------------------------------------------------------------------

const { mockExecFileNoThrow, mockFsExistsSync, mockFsAccessSync } = vi.hoisted(() => {
  const execMock = vi.fn(async () => ({ stdout: '/usr/bin/osascript', stderr: '', exitCode: 0 }));
  const existsSyncMock = vi.fn(() => true);
  const accessSyncMock = vi.fn(() => undefined);
  return {
    mockExecFileNoThrow: execMock,
    mockFsExistsSync: existsSyncMock,
    mockFsAccessSync: accessSyncMock,
  };
});

vi.mock('@/utils/execFileNoThrow', () => ({ execFileNoThrow: mockExecFileNoThrow }));
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: mockFsExistsSync,
      accessSync: mockFsAccessSync,
      constants: actual.constants,
    },
    existsSync: mockFsExistsSync,
    accessSync: mockFsAccessSync,
  };
});

import { ImessagePlugin } from '@process/channels/plugins/tier2/imessage/ImessagePlugin';

beforeEach(() => {
  vi.clearAllMocks();
  mockFsExistsSync.mockReturnValue(true);
  mockFsAccessSync.mockReturnValue(undefined);
  // Default: which osascript succeeds, then smoke test succeeds
  mockExecFileNoThrow
    .mockResolvedValueOnce({ stdout: '/usr/bin/osascript', stderr: '', exitCode: 0 })
    .mockResolvedValueOnce({ stdout: 'ok', stderr: '', exitCode: 0 });
});

describe('ImessagePlugin.testConnection', () => {
  it('returns success with botUsername=imessage-bot on darwin with all checks passing', async () => {
    const result = await ImessagePlugin.testConnection(JSON.stringify({}));
    expect(result).toEqual({ success: true, botUsername: 'imessage-bot' });
  });

  it('fails fast with clear error on non-darwin platforms', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    try {
      const result = await ImessagePlugin.testConnection('{}');
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/macOS-only/i);
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
    }
  });

  it('fails with clear error when chat.db does not exist', async () => {
    mockFsExistsSync.mockReturnValue(false);
    const result = await ImessagePlugin.testConnection('{}');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/chat\.db not found/i);
  });

  it('fails with Full Disk Access message when chat.db is not readable', async () => {
    mockFsExistsSync.mockReturnValue(true);
    mockFsAccessSync.mockImplementation(() => { throw new Error('EACCES: permission denied'); });
    const result = await ImessagePlugin.testConnection('{}');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Full Disk Access/i);
  });

  it('fails when osascript is not in PATH', async () => {
    // mockReset clears queued Once values; clearAllMocks does not
    mockExecFileNoThrow.mockReset();
    mockFsExistsSync.mockReset();
    mockFsAccessSync.mockReset();
    mockFsExistsSync.mockReturnValue(true);
    mockFsAccessSync.mockReturnValue(undefined);
    mockExecFileNoThrow.mockResolvedValueOnce({ stdout: '', stderr: 'not found', exitCode: 1 });
    const result = await ImessagePlugin.testConnection('{}');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/osascript not found/i);
  });

  it('fails when the osascript smoke-test itself fails', async () => {
    // mockReset clears queued Once values; clearAllMocks does not
    mockExecFileNoThrow.mockReset();
    mockFsExistsSync.mockReset();
    mockFsAccessSync.mockReset();
    mockFsExistsSync.mockReturnValue(true);
    mockFsAccessSync.mockReturnValue(undefined);
    mockExecFileNoThrow
      .mockResolvedValueOnce({ stdout: '/usr/bin/osascript', stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: '', stderr: 'execution error', exitCode: 1 });
    const result = await ImessagePlugin.testConnection('{}');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/smoke-test failed/i);
  });

  it('handles invalid JSON credentials gracefully', async () => {
    const result = await ImessagePlugin.testConnection('not-json');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid json/i);
  });
});
