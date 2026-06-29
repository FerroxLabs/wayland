/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for v0.4.2 HIGH fixes (REVIEW-imessage-v0.4.1-sweep):
 *   - F6: attributedBody fallback when m.text is NULL (Ventura+)
 *   - F8: 1:1 send picks iMessage vs SMS from chat.service_name
 *   - F11: post-send delivery verification via chat.db is_delivered / error
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_PLATFORM = process.platform;
beforeAll(() => Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true }));
afterAll(() => Object.defineProperty(process, 'platform', { value: ORIGINAL_PLATFORM, configurable: true }));

// ---------------------------------------------------------------------------
// Mocks (hoisted)
// ---------------------------------------------------------------------------

const {
  mockStmt,
  mockServiceLookupStmt,
  mockDeliveryStmt,
  mockDbInstance,
  mockDbConstructor,
  mockExecFileNoThrow,
  mockFsExistsSync,
  mockFsAccessSync,
} = vi.hoisted(() => {
  const stmtMock = { all: vi.fn(() => [] as unknown[]) };
  const seedStmt = { get: vi.fn(() => ({ maxid: 0 })) };
  const serviceLookup = { get: vi.fn(() => ({ service_name: 'iMessage' })) };
  const deliveryStmt = { get: vi.fn(() => undefined) };

  const dbInst = {
    prepare: vi.fn((sql: string) => {
      if (sql.includes('MAX(rowid)')) return seedStmt;
      // F11 - delivery-check statement: outbound (is_from_me=1) ORDER BY rowid DESC
      if (sql.includes('is_from_me = 1') && sql.includes('date >=')) return deliveryStmt;
      // F8 - service-name lookups
      if (sql.includes('FROM chat WHERE guid')) return serviceLookup;
      if (sql.includes('service_name') && sql.includes('chat_handle_join')) return serviceLookup;
      // tapback body-lookup
      if (sql.includes('WHERE rowid')) return { get: vi.fn(() => ({ text: 'orig' })) };
      return stmtMock;
    }),
    close: vi.fn(),
  };
  const ctor = vi.fn(function () {
    return dbInst;
  });
  const execMock = vi.fn(async () => ({ stdout: '', stderr: '', exitCode: 0 }));
  const existsMock = vi.fn(() => true);
  const accessMock = vi.fn(() => undefined);
  return {
    mockStmt: stmtMock,
    mockServiceLookupStmt: serviceLookup,
    mockDeliveryStmt: deliveryStmt,
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
import { decodeAttributedBody, rowToUnifiedMessage } from '@process/channels/plugins/tier2/imessage/ImessageAdapter';
import type { IChannelPluginConfig } from '@process/channels/types';

function cfg(): IChannelPluginConfig {
  return {
    id: 'imessage_default',
    type: 'imessage',
    name: 'iMessage',
    enabled: true,
    status: 'created',
    credentials: { pollIntervalMs: 500 },
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
  mockServiceLookupStmt.get.mockReturnValue({ service_name: 'iMessage' });
  mockDeliveryStmt.get.mockReturnValue(undefined);
  plugin = new ImessagePlugin();
});

// F11 post-send delivery verification polls chat.db for a real
// DELIVERY_POLL_CYCLES (5) x DELIVERY_POLL_INTERVAL_MS (600) = 3 s ceiling via
// setTimeout. Under fake timers we advance past that budget instead of waiting
// the real ~3 s (#358 - this was a top contributor to the shard-1/4 imbalance).
// advanceTimersByTimeAsync (not runAllTimersAsync) is used deliberately: start()
// installs a self-rescheduling inbound-poll setInterval that would make
// runAllTimersAsync spin forever.
const DELIVERY_BUDGET_MS = 3000;
async function sendDrained(...args: Parameters<ImessagePlugin['sendMessage']>): Promise<string> {
  const p = plugin.sendMessage(...args);
  await vi.advanceTimersByTimeAsync(DELIVERY_BUDGET_MS);
  return p;
}

// ---------------------------------------------------------------------------
// F6 - attributedBody fallback
// ---------------------------------------------------------------------------

describe('F6 - decodeAttributedBody fallback', () => {
  it('rowToUnifiedMessage uses m.text when present (no decode path)', () => {
    const msg = rowToUnifiedMessage({
      rowid: 1,
      text: 'plain body',
      attributed_body: Buffer.from([0x4f]), // garbage; should be ignored
      is_from_me: 0,
      date: 0,
      chat_guid: 'chat0011',
      sender_handle: '+15551234567',
      is_group: 0,
    });
    expect(msg?.content.text).toBe('plain body');
  });

  it('rowToUnifiedMessage falls back to attributedBody when m.text is NULL', () => {
    // Synthetic NSKeyedArchiver blob: "NSString" marker + 0x45 (5-char ASCII) + "hello"
    const marker = Buffer.from('NSString', 'utf8');
    const tag = Buffer.from([0x45]); // ASCII length 5
    const body = Buffer.from('hello', 'utf8');
    const blob = Buffer.concat([Buffer.alloc(10, 0), marker, tag, body, Buffer.alloc(4, 0)]);

    const msg = rowToUnifiedMessage({
      rowid: 2,
      text: null,
      attributed_body: blob,
      is_from_me: 0,
      date: 0,
      chat_guid: 'chat0011',
      sender_handle: '+15551234567',
      is_group: 0,
    });
    expect(msg?.content.text).toBe('hello');
  });

  it('decodeAttributedBody returns "" for un-parseable buffers (no NSString marker)', () => {
    expect(decodeAttributedBody(Buffer.from([0x00, 0x01, 0x02, 0x03]))).toBe('');
  });

  it('decodeAttributedBody returns the user-visible string body after the NSString marker', () => {
    // Realistic round-trip: marker + length-tag + UTF-8 body. The decoder
    // must scan forward from the LAST marker and pick the first valid string.
    const marker = Buffer.from('NSString', 'utf8');
    const tag = Buffer.from([0x4c]); // ASCII length 12
    const body = Buffer.from('hello world!', 'utf8');
    const blob = Buffer.concat([marker, tag, body, Buffer.alloc(8, 0)]);
    expect(decodeAttributedBody(blob)).toBe('hello world!');
  });

  it('rowToUnifiedMessage drops the row when both text and attributedBody are empty', () => {
    const msg = rowToUnifiedMessage({
      rowid: 3,
      text: null,
      attributed_body: null,
      is_from_me: 0,
      date: 0,
      chat_guid: 'chat0011',
      sender_handle: '+15551234567',
      is_group: 0,
    });
    expect(msg).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// F8 - service-name routing on 1:1 send
// ---------------------------------------------------------------------------

describe('F8 - sendMessage picks iMessage vs SMS service from chat.service_name', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('uses `service type = iMessage` when chat.service_name = "iMessage"', async () => {
    mockServiceLookupStmt.get.mockReturnValue({ service_name: 'iMessage' });

    await plugin.initialize(cfg());
    await plugin.start();
    await sendDrained('+15551234567', { type: 'text', text: 'hi' });

    const sendCall = mockExecFileNoThrow.mock.calls.find((c) => String(c[1]?.[1] ?? '').includes('targetBuddy'));
    expect(sendCall).toBeDefined();
    const script = String(sendCall![1]![1]);
    expect(script).toContain('service type = iMessage');
    expect(script).not.toContain('service type = SMS');
    await plugin.stop();
  });

  it('uses `service type = SMS` when chat.service_name = "SMS" (green bubble)', async () => {
    mockServiceLookupStmt.get.mockReturnValue({ service_name: 'SMS' });

    await plugin.initialize(cfg());
    await plugin.start();
    await sendDrained('+15551234567', { type: 'text', text: 'hi' });

    const sendCall = mockExecFileNoThrow.mock.calls.find((c) => String(c[1]?.[1] ?? '').includes('targetBuddy'));
    expect(sendCall).toBeDefined();
    expect(String(sendCall![1]![1])).toContain('service type = SMS');
    await plugin.stop();
  });

  it('defaults to iMessage when service-name lookup returns null', async () => {
    mockServiceLookupStmt.get.mockReturnValue(undefined);

    await plugin.initialize(cfg());
    await plugin.start();
    await sendDrained('+15551234567', { type: 'text', text: 'hi' });

    const sendCall = mockExecFileNoThrow.mock.calls.find((c) => String(c[1]?.[1] ?? '').includes('targetBuddy'));
    expect(String(sendCall![1]![1])).toContain('service type = iMessage');
    await plugin.stop();
  });
});

// ---------------------------------------------------------------------------
// F11 - post-send delivery verification
// ---------------------------------------------------------------------------

describe('F11 - sendMessage verifies delivery via chat.db', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns a delivery-confirmed id when is_delivered=1 lands in chat.db', async () => {
    mockDeliveryStmt.get.mockReturnValue({ rowid: 99, is_delivered: 1, error: 0, date_delivered: 1 });

    await plugin.initialize(cfg());
    await plugin.start();
    const id = await sendDrained('+15551234567', { type: 'text', text: 'hi' });

    // suffix-encoded confirmation: `d` for delivered
    expect(id).toMatch(/^imessage-sent-d-/);
    await plugin.stop();
  });

  it('throws when chat.db records a non-zero error code on the outbound row', async () => {
    mockDeliveryStmt.get.mockReturnValue({ rowid: 99, is_delivered: 0, error: 22, date_delivered: 0 });

    await plugin.initialize(cfg());
    await plugin.start();
    // Attach the rejection expectation BEFORE advancing timers so the promise is
    // never momentarily unhandled while the fake delivery-poll budget elapses.
    const rejection = expect(plugin.sendMessage('+15551234567', { type: 'text', text: 'hi' })).rejects.toThrow(
      /not delivered.*error=22/i
    );
    await vi.advanceTimersByTimeAsync(DELIVERY_BUDGET_MS);
    await rejection;
    await plugin.stop();
  });

  it('returns a pending-suffix id when delivery never confirms within the budget', async () => {
    mockDeliveryStmt.get.mockReturnValue(undefined); // never lands

    await plugin.initialize(cfg());
    await plugin.start();
    const id = await sendDrained('+15551234567', { type: 'text', text: 'hi' });
    expect(id).toMatch(/^imessage-sent-p-/);
    await plugin.stop();
  });
});
