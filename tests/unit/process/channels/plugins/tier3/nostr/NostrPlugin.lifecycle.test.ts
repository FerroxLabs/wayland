/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * NostrPlugin lifecycle tests: created → initializing → ready → starting →
 * running → stopping → stopped. WebSocket is mocked with a hand-rolled
 * EventEmitter so no real network connections are made.
 */

import { EventEmitter } from 'node:events';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

// ── Hoist WebSocket mock (MUST be top-level, before imports) ──────────────────

const { MockWs, mockWsInstance } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EventEmitter } = require('node:events') as typeof import('node:events');

  class FakeWs extends EventEmitter {
    send = vi.fn();
    terminate = vi.fn();
    removeAllListeners = vi.fn(() => {
      EventEmitter.prototype.removeAllListeners.call(this);
      return this;
    });
  }

  const instance = new FakeWs();

  // Must be a regular function so `new MockWs()` works.
  const MockWs = vi.fn(function () {
    return instance;
  }) as unknown as { new (url: string): FakeWs } & ReturnType<typeof vi.fn>;

  return { MockWs, mockWsInstance: instance };
});

vi.mock('ws', () => ({ default: MockWs }));

// nostr-tools is pure crypto - mock minimally so no native deps needed in tests.
vi.mock('nostr-tools', () => ({
  getPublicKey: vi.fn(() => 'a'.repeat(64)),
  nip19: {
    npubEncode: vi.fn((hex: string) => `npub1${hex.slice(0, 8)}`),
    decode: vi.fn(),
  },
  finalizeEvent: vi.fn((partial: object, _sk: Uint8Array) => ({
    ...partial,
    id: 'test-event-id-' + Math.random().toString(36).slice(2),
    pubkey: 'b'.repeat(64),
    sig: 'sig',
  })),
}));

vi.mock('nostr-tools/nip04', () => ({
  encrypt: vi.fn((_sk: unknown, _pk: string, text: string) => `encrypted:${text}`),
  decrypt: vi.fn((_sk: unknown, _pk: string, cipher: string) => cipher.replace('encrypted:', '')),
}));

import { NostrPlugin } from '@process/channels/plugins/tier3/nostr/NostrPlugin';

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_HEX_KEY = 'a'.repeat(64);

function makeConfig(overrides: Partial<Record<string, unknown>> = {}): IChannelPluginConfig {
  return {
    id: 'nostr_default',
    type: 'nostr',
    name: 'Nostr',
    enabled: true,
    status: 'created',
    credentials: {
      privateKey: VALID_HEX_KEY,
      relays: ['wss://relay.damus.io'],
      ...overrides,
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

beforeEach(() => {
  MockWs.mockClear();
  mockWsInstance.send.mockClear();
  mockWsInstance.terminate.mockClear();
  EventEmitter.prototype.removeAllListeners.call(mockWsInstance);

  // Default: emit 'open' synchronously so onStart resolves immediately.
  MockWs.mockImplementation(function () {
    setTimeout(() => mockWsInstance.emit('open'), 0);
    return mockWsInstance;
  });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NostrPlugin capabilities', () => {
  it('declares nostr type with react=true and edit=false', () => {
    const plugin = new NostrPlugin();
    expect(plugin.type).toBe('nostr');
    expect(plugin.capabilities).toEqual({
      canEdit: false,
      canStream: false,
      canReact: true,
      canTypingIndicator: false,
    });
  });
});

describe('NostrPlugin initial state', () => {
  it('starts created with 0 active users and no bot info', () => {
    const plugin = new NostrPlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.getActiveUserCount()).toBe(0);
    expect(plugin.getBotInfo()).toBeNull();
  });
});

describe('NostrPlugin lifecycle: created → ready → running → stopped', () => {
  it('transitions through the full happy path', async () => {
    const plugin = new NostrPlugin();

    await plugin.initialize(makeConfig());
    expect(plugin.status).toBe('ready');

    await plugin.start();
    expect(plugin.status).toBe('running');

    expect(plugin.getBotInfo()).not.toBeNull();

    await plugin.stop();
    expect(plugin.status).toBe('stopped');
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('sends a REQ subscription after WebSocket open', async () => {
    const plugin = new NostrPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();

    expect(mockWsInstance.send).toHaveBeenCalledOnce();
    const sentMsg = JSON.parse(mockWsInstance.send.mock.calls[0][0] as string) as unknown[];
    expect(sentMsg[0]).toBe('REQ');
    expect(Array.isArray(sentMsg[2])).toBe(false); // filter object not array
    await plugin.stop();
  });

  it('terminates all WebSockets on stop', async () => {
    const plugin = new NostrPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    await plugin.stop();
    expect(mockWsInstance.terminate).toHaveBeenCalled();
  });
});

describe('NostrPlugin initialize validation', () => {
  it('throws when privateKey is missing', async () => {
    const plugin = new NostrPlugin();
    await expect(plugin.initialize(makeConfig({ privateKey: '' }))).rejects.toThrow(/private key/i);
    expect(plugin.status).toBe('error');
  });

  it('throws when no valid relays provided', async () => {
    const plugin = new NostrPlugin();
    await expect(plugin.initialize(makeConfig({ relays: ['http://bad-url'] }))).rejects.toThrow(/relay/i);
    expect(plugin.status).toBe('error');
  });

  it('falls back to default relays when relays array is empty', async () => {
    const plugin = new NostrPlugin();
    // Empty array → should fall back to defaults (damus + nos.lol) and NOT throw.
    await plugin.initialize(makeConfig({ relays: [] }));
    expect(plugin.status).toBe('ready');
  });
});

describe('NostrPlugin handleWebhookPayload', () => {
  it('throws with a clear explanation', async () => {
    const plugin = new NostrPlugin();
    await expect(plugin.handleWebhookPayload()).rejects.toThrow(/webhook/i);
  });
});
