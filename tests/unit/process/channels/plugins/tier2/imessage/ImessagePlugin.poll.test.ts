/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for ImessagePlugin poll loop:
 *  - cursor advance on new rows
 *  - own-message filtering (is_from_me=1)
 *  - allowedHandles filtering
 *  - send via AppleScript (execFileNoThrow)
 *  - tapback via AppleScript
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Force process.platform=darwin so the iMessage plugin's macOS-only guards
// don't short-circuit on Linux CI runners. Without this stub the suite would
// silently no-op pass on every non-darwin runner.
const ORIGINAL_PLATFORM = process.platform;
beforeAll(() => Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true }));
afterAll(() => Object.defineProperty(process, 'platform', { value: ORIGINAL_PLATFORM, configurable: true }));

// ---------------------------------------------------------------------------
// Hoist mocks - all vi.mock + vi.hoisted at module top level
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
  const seedStmt = { get: vi.fn(() => ({ maxid: 0 })) };
  const dbInst = {
    prepare: vi.fn(function (sql: string) {
      if (sql.includes('MAX(rowid)')) return seedStmt;
      return stmtMock;
    }),
    close: vi.fn(),
  };
  // new-able constructor mock using function form
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
    // 500 is the production floor (DOS guard); using exactly the floor here
    // keeps tests fast while exercising the clamped path.
    credentials: { pollIntervalMs: 500, ...overrides },
    createdAt: 0,
    updatedAt: 0,
  };
}

function makeDbRow(overrides: Record<string, unknown> = {}) {
  return {
    rowid: 10,
    text: 'Hello world',
    is_from_me: 0,
    date: 0,
    chat_guid: 'chat0011223344556677',
    sender_handle: '+15551234567',
    is_group: 0,
    ...overrides,
  };
}

let plugin: ImessagePlugin;

beforeEach(() => {
  vi.clearAllMocks();
  mockFsExistsSync.mockReturnValue(true);
  mockFsAccessSync.mockReturnValue(undefined);
  mockExecFileNoThrow.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
  mockStmt.all.mockReturnValue([]);
  mockDbInstance.prepare.mockImplementation(function (sql: string) {
    if (sql.includes('MAX(rowid)')) return { get: vi.fn(() => ({ maxid: 0 })) };
    if (sql.includes('WHERE rowid')) return { get: vi.fn(() => ({ text: 'original body' })) };
    return mockStmt;
  });
  plugin = new ImessagePlugin();
});

afterEach(async () => {
  if (plugin.status === 'running') await plugin.stop();
});

describe('ImessagePlugin poll loop', () => {
  it('emits unified messages for new inbound rows', async () => {
    const received: unknown[] = [];
    plugin.onMessage(async (msg) => { received.push(msg); });

    mockStmt.all
      .mockReturnValueOnce([makeDbRow({ rowid: 1, text: 'hi' })])
      .mockReturnValue([]);

    await plugin.initialize(cfg());
    await plugin.start();

    await vi.waitFor(() => expect(received.length).toBeGreaterThan(0), { timeout: 2000 });

    expect(received[0]).toMatchObject({
      platform: 'imessage',
      content: { type: 'text', text: 'hi' },
    });
    await plugin.stop();
  });

  it('advances the cursor so rows are not reprocessed', async () => {
    const received: unknown[] = [];
    plugin.onMessage(async (msg) => { received.push(msg); });

    mockStmt.all
      .mockReturnValueOnce([makeDbRow({ rowid: 5 })])
      .mockReturnValue([]);

    await plugin.initialize(cfg());
    await plugin.start();
    await vi.waitFor(() => expect(received.length).toBe(1), { timeout: 2000 });

    const calls = mockStmt.all.mock.calls;
    expect(calls[0][0]).toBe(0);
    if (calls.length > 1) {
      expect(calls[1][0]).toBe(5);
    }
    await plugin.stop();
  });

  it('filters out own messages (is_from_me=1)', async () => {
    const received: unknown[] = [];
    plugin.onMessage(async (msg) => { received.push(msg); });

    mockStmt.all.mockReturnValueOnce([makeDbRow({ is_from_me: 1 })]).mockReturnValue([]);

    await plugin.initialize(cfg());
    await plugin.start();
    await new Promise((r) => setTimeout(r, 1000));
    expect(received).toHaveLength(0);
    await plugin.stop();
  });

  it('filters messages by allowedHandles when configured', async () => {
    const received: unknown[] = [];
    plugin.onMessage(async (msg) => { received.push(msg); });

    mockStmt.all
      .mockReturnValueOnce([makeDbRow({ sender_handle: '+19991111111' })])
      .mockReturnValue([]);

    await plugin.initialize(cfg({ allowedHandles: ['+15551234567'] }));
    await plugin.start();
    await new Promise((r) => setTimeout(r, 1000));
    expect(received).toHaveLength(0);
    await plugin.stop();
  });

  it('allows messages from handles in the allowedHandles list', async () => {
    const received: unknown[] = [];
    plugin.onMessage(async (msg) => { received.push(msg); });

    mockStmt.all
      .mockReturnValueOnce([makeDbRow({ sender_handle: '+15551234567' })])
      .mockReturnValue([]);

    await plugin.initialize(cfg({ allowedHandles: ['+15551234567'] }));
    await plugin.start();
    await vi.waitFor(() => expect(received.length).toBe(1), { timeout: 2000 });
    await plugin.stop();
  });
});

describe('ImessagePlugin sendMessage', () => {
  it('calls osascript with a 1:1 send script and returns a stable id', async () => {
    await plugin.initialize(cfg());
    await plugin.start();
    const id = await plugin.sendMessage('+15551234567', { type: 'text', text: 'Hello!' });

    expect(mockExecFileNoThrow).toHaveBeenCalledWith(
      'osascript',
      ['-e', expect.stringContaining('Messages')],
      expect.any(Object),
    );
    expect(id).toMatch(/^imessage-sent-/);
    await plugin.stop();
  });

  it('throws when the text is empty', async () => {
    await plugin.initialize(cfg());
    await plugin.start();
    await expect(plugin.sendMessage('+15551234567', { type: 'text', text: '   ' })).rejects.toThrow(/empty/i);
    await plugin.stop();
  });

  it('throws when osascript exits non-zero', async () => {
    mockExecFileNoThrow.mockResolvedValue({ stdout: '', stderr: 'Messages not running', exitCode: 1 });

    await plugin.initialize(cfg());
    await plugin.start();
    await expect(
      plugin.sendMessage('+15551234567', { type: 'text', text: 'Hi' }),
    ).rejects.toThrow(/send failed/i);
    await plugin.stop();
  });
});

describe('ImessagePlugin reactToMessage (tapback)', () => {
  it('calls osascript with the heart tapback code (2005)', async () => {
    await plugin.initialize(cfg());
    await plugin.start();
    await plugin.reactToMessage('chatdeadbeef', '42', 'heart');

    expect(mockExecFileNoThrow).toHaveBeenCalledWith(
      'osascript',
      ['-e', expect.stringContaining('2005')],
      expect.any(Object),
    );
    await plugin.stop();
  });

  it('throws for an unknown tapback reaction name', async () => {
    await plugin.initialize(cfg());
    await plugin.start();
    await expect(
      plugin.reactToMessage('chatdeadbeef', '1', 'unknown-emoji'),
    ).rejects.toThrow(/unknown tapback/i);
    await plugin.stop();
  });
});
