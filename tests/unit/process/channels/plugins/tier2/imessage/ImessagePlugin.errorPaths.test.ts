/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for ImessagePlugin error-mapping paths that the existing suites
 * leave uncovered. Each `describe` maps to a finding from the v0.4.1 sweep:
 *   - F13: Automation-denied stderr → friendly error in sendMessage
 *   - F14: group-chat send path uses `chat id` not `buddy`
 *   - F16: FDA denied on start() (not just testConnection)
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Force darwin so the macOS-only guard in onInitialize/onStart doesn't trip
// on Linux CI runners.
const ORIGINAL_PLATFORM = process.platform;
beforeAll(() => Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true }));
afterAll(() => Object.defineProperty(process, 'platform', { value: ORIGINAL_PLATFORM, configurable: true }));

// ---------------------------------------------------------------------------
// Hoist mocks
// ---------------------------------------------------------------------------

const {
  mockStmt,
  mockDbInstance,
  mockDbConstructor,
  mockExecFileNoThrow,
  mockFsExistsSync,
  mockFsAccessSync,
} = vi.hoisted(() => {
  const stmtMock = { all: vi.fn(() => [] as unknown[]) };
  const dbInst = {
    prepare: vi.fn(function (sql: string) {
      if (sql.includes('MAX(rowid)')) return { get: vi.fn(() => ({ maxid: 0 })) };
      if (sql.includes('WHERE rowid')) return { get: vi.fn(() => ({ text: 'orig' })) };
      return stmtMock;
    }),
    close: vi.fn(),
  };
  // Will be swapped per-test in F16.
  const ctor = vi.fn(function () { return dbInst; });
  const execMock = vi.fn(async () => ({ stdout: '', stderr: '', exitCode: 0 }));
  const existsMock = vi.fn(() => true);
  const accessMock = vi.fn(() => undefined);
  return {
    mockStmt: stmtMock,
    mockDbInstance: dbInst,
    mockDbConstructor: ctor,
    mockExecFileNoThrow: execMock,
    mockFsExistsSync: existsMock,
    mockFsAccessSync: accessMock,
  };
});

vi.mock('better-sqlite3', () => ({ default: mockDbConstructor }));
vi.mock('@/utils/execFileNoThrow', () => ({ execFileNoThrow: mockExecFileNoThrow }));
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    default: { ...actual, existsSync: mockFsExistsSync, accessSync: mockFsAccessSync, constants: actual.constants },
    existsSync: mockFsExistsSync,
    accessSync: mockFsAccessSync,
  };
});

import { ImessagePlugin } from '@process/channels/plugins/tier2/imessage/ImessagePlugin';
import type { IChannelPluginConfig } from '@process/channels/types';

function cfg(overrides: Record<string, unknown> = {}): IChannelPluginConfig {
  return {
    id: 'imessage_default',
    type: 'imessage',
    name: 'iMessage',
    enabled: true,
    status: 'created',
    credentials: { pollIntervalMs: 500, ...overrides },
    createdAt: 0,
    updatedAt: 0,
  };
}

let plugin: ImessagePlugin;

beforeEach(() => {
  vi.clearAllMocks();
  mockFsExistsSync.mockReturnValue(true);
  mockFsAccessSync.mockReturnValue(undefined);
  mockExecFileNoThrow.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
  mockStmt.all.mockReturnValue([]);
  mockDbConstructor.mockImplementation(function () { return mockDbInstance; });
  mockDbInstance.prepare.mockImplementation(function (sql: string) {
    if (sql.includes('MAX(rowid)')) return { get: vi.fn(() => ({ maxid: 0 })) };
    if (sql.includes('WHERE rowid')) return { get: vi.fn(() => ({ text: 'orig body' })) };
    return mockStmt;
  });
  plugin = new ImessagePlugin();
});

afterEach(async () => {
  if (plugin.status === 'running') await plugin.stop();
});

// ---------------------------------------------------------------------------
// F13 - Automation-denied stderr mapping
// ---------------------------------------------------------------------------

describe('ImessagePlugin.sendMessage Automation-denied mapping (F13)', () => {
  it('maps "-1743" stderr to the friendly Automation-denied error', async () => {
    mockExecFileNoThrow.mockResolvedValue({
      stdout: '',
      stderr: 'osascript: execution error: System Events got an error: ... (-1743)',
      exitCode: 1,
    });
    await plugin.initialize(cfg());
    await plugin.start();
    await expect(
      plugin.sendMessage('+15551234567', { type: 'text', text: 'hi' }),
    ).rejects.toThrow(/Automation access denied/i);
  });

  it('maps "not allowed to send Apple events" stderr to the friendly error', async () => {
    mockExecFileNoThrow.mockResolvedValue({
      stdout: '',
      stderr: 'osascript: execution error: Not authorised to send Apple events to Messages. (not allowed to send Apple events)',
      exitCode: 1,
    });
    await plugin.initialize(cfg());
    await plugin.start();
    await expect(
      plugin.sendMessage('+15551234567', { type: 'text', text: 'hi' }),
    ).rejects.toThrow(/Automation access denied/i);
  });
});

// ---------------------------------------------------------------------------
// F14 - group-chat send path uses `chat id` not `buddy`
// ---------------------------------------------------------------------------

describe('ImessagePlugin.sendMessage group-chat path (F14)', () => {
  it('uses AppleScript `chat id` (not `buddy`) for chat...-GUID chatIds', async () => {
    await plugin.initialize(cfg());
    await plugin.start();
    await plugin.sendMessage('chatdeadbeef0011', { type: 'text', text: 'hi group' });

    expect(mockExecFileNoThrow).toHaveBeenCalledWith(
      'osascript',
      ['-e', expect.stringContaining('chat id')],
      expect.any(Object),
    );
    const scriptArg = mockExecFileNoThrow.mock.calls.at(-1)?.[1] as string[] | undefined;
    expect(scriptArg?.[1]).toContain('chat id');
    expect(scriptArg?.[1]).not.toContain('buddy ');
  });

  it('uses AppleScript `buddy` (not `chat id`) for 1:1 handle chatIds', async () => {
    await plugin.initialize(cfg());
    await plugin.start();
    await plugin.sendMessage('+15551234567', { type: 'text', text: 'hi 1:1' });

    const scriptArg = mockExecFileNoThrow.mock.calls.at(-1)?.[1] as string[] | undefined;
    expect(scriptArg?.[1]).toContain('buddy');
    expect(scriptArg?.[1]).not.toContain('chat id');
  });
});

// ---------------------------------------------------------------------------
// F16 - FDA-denied on start() (runtime path, not just testConnection)
// ---------------------------------------------------------------------------

describe('ImessagePlugin.start() FDA-denied path (F16)', () => {
  it('throws a Full-Disk-Access-hinted error when chat.db open raises EACCES', async () => {
    mockDbConstructor.mockImplementationOnce(function () {
      throw new Error('EACCES: permission denied, open chat.db');
    });
    await plugin.initialize(cfg());
    await expect(plugin.start()).rejects.toThrow(/Full Disk Access/i);
  });

  it('throws a Full-Disk-Access-hinted error when chat.db open raises "permission"', async () => {
    mockDbConstructor.mockImplementationOnce(function () {
      throw new Error('permission denied opening chat.db');
    });
    await plugin.initialize(cfg());
    await expect(plugin.start()).rejects.toThrow(/Full Disk Access/i);
  });
});
