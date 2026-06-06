/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * ImessagePlugin lifecycle: created → initializing → ready → starting →
 * running → stopping → stopped. Database and execFileNoThrow are mocked so
 * no real filesystem or process access occurs.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Force process.platform=darwin so the iMessage plugin's macOS-only guards
// don't short-circuit on Linux CI runners. Tests that need to assert non-darwin
// behavior re-stub locally.
const ORIGINAL_PLATFORM = process.platform;
beforeAll(() => Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true }));
afterAll(() => Object.defineProperty(process, 'platform', { value: ORIGINAL_PLATFORM, configurable: true }));

// ---------------------------------------------------------------------------
// Hoist mocks - must be at module top level per MANDATORY Vitest hoisting rules
// ---------------------------------------------------------------------------

const { mockDbInstance, mockDbConstructor, mockExecFileNoThrow, mockFsExistsSync, mockFsAccessSync } = vi.hoisted(() => {
  const stmtMock = { all: vi.fn(() => [] as unknown[]) };
  const seedStmt = { get: vi.fn(() => ({ maxid: 5 })) };

  const dbInstance = {
    prepare: vi.fn(function (sql: string) {
      if (sql.includes('MAX(rowid)')) return seedStmt;
      return stmtMock;
    }),
    close: vi.fn(),
  };

  // vi.fn(function() { return instance }) is the correct pattern for new-able mocks
  const dbConstructor = vi.fn(function () { return dbInstance; });

  const execMock = vi.fn(async () => ({ stdout: 'ok', stderr: '', exitCode: 0 }));
  const existsSyncMock = vi.fn(() => true);
  const accessSyncMock = vi.fn(() => undefined);

  return {
    mockDbInstance: dbInstance,
    mockDbConstructor: dbConstructor,
    mockExecFileNoThrow: execMock,
    mockFsExistsSync: existsSyncMock,
    mockFsAccessSync: accessSyncMock,
  };
});

vi.mock('better-sqlite3', () => ({ default: mockDbConstructor }));
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

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { ImessagePlugin } from '@process/channels/plugins/tier2/imessage/ImessagePlugin';
import type { IChannelPluginConfig } from '@process/channels/types';

function makeConfig(overrides: Partial<IChannelPluginConfig['credentials']> = {}): IChannelPluginConfig {
  return {
    id: 'imessage_default',
    type: 'imessage',
    name: 'iMessage',
    enabled: true,
    status: 'created',
    credentials: {
      pollIntervalMs: 100,
      ...overrides,
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFsExistsSync.mockReturnValue(true);
  mockFsAccessSync.mockReturnValue(undefined);
  mockExecFileNoThrow.mockResolvedValue({ stdout: 'ok', stderr: '', exitCode: 0 });
  mockDbInstance.prepare.mockImplementation(function (sql: string) {
    if (sql.includes('MAX(rowid)')) return { get: vi.fn(() => ({ maxid: 5 })) };
    return { all: vi.fn(() => []) };
  });
  mockDbInstance.close.mockImplementation(() => undefined);
});

describe('ImessagePlugin - lifecycle', () => {
  it('starts in created status', () => {
    const plugin = new ImessagePlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.type).toBe('imessage');
  });

  it('declares correct capabilities', () => {
    const plugin = new ImessagePlugin();
    expect(plugin.capabilities).toEqual({
      canEdit: false,
      canStream: false,
      canReact: true,
      canTypingIndicator: false,
    });
  });

  it('returns null from getBotInfo before running', () => {
    const plugin = new ImessagePlugin();
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('fails fast on non-darwin platforms', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    try {
      const plugin = new ImessagePlugin();
      await expect(plugin.initialize(makeConfig())).rejects.toThrow(/macOS-only/i);
      expect(plugin.status).toBe('error');
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
    }
  });

  it('transitions created → initializing → ready on initialize()', async () => {
    const plugin = new ImessagePlugin();
    await plugin.initialize(makeConfig());
    expect(plugin.status).toBe('ready');
  });

  it('transitions ready → starting → running on start()', async () => {
    const plugin = new ImessagePlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    expect(plugin.status).toBe('running');
    await plugin.stop();
  });

  it('transitions running → stopping → stopped on stop()', async () => {
    const plugin = new ImessagePlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    await plugin.stop();
    expect(plugin.status).toBe('stopped');
    expect(mockDbInstance.close).toHaveBeenCalled();
  });

  it('getActiveUserCount always returns 0', () => {
    const plugin = new ImessagePlugin();
    expect(plugin.getActiveUserCount()).toBe(0);
  });

  it('getBotInfo returns imessage-bot identity when running', async () => {
    const plugin = new ImessagePlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    expect(plugin.getBotInfo()).toEqual({
      id: 'imessage-bot',
      username: 'imessage-bot',
      displayName: 'iMessage',
    });
    await plugin.stop();
  });
});
