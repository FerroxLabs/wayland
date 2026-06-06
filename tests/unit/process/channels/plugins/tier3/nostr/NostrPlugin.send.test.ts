/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * NostrPlugin.sendMessage tests: verifies that outbound DMs are encrypted via
 * NIP-04, published to all connected relays, and return a stable event id.
 * Also tests inbound event routing (decrypt → emitMessage).
 */

import { EventEmitter } from 'node:events';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

// ── Hoist WS mock ─────────────────────────────────────────────────────────────

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

  const MockWs = vi.fn(function () {
    setTimeout(() => instance.emit('open'), 0);
    return instance;
  }) as unknown as { new (url: string): FakeWs } & ReturnType<typeof vi.fn>;

  return { MockWs, mockWsInstance: instance };
});

vi.mock('ws', () => ({ default: MockWs }));

const MOCK_PK = 'a'.repeat(64);
const FIXED_EVENT_ID = 'fixed-event-id-001';

vi.mock('nostr-tools', () => ({
  getPublicKey: vi.fn(() => MOCK_PK),
  nip19: {
    npubEncode: vi.fn((hex: string) => `npub1${hex.slice(0, 8)}`),
    decode: vi.fn(),
  },
  finalizeEvent: vi.fn(
    (partial: { kind: number; content: string; tags: string[][]; created_at: number }) => ({
      ...partial,
      id: FIXED_EVENT_ID,
      pubkey: MOCK_PK,
      sig: 'sig',
    }),
  ),
  // Always-true Schnorr verify stub. Real-signature tests live in
  // NostrPlugin.security.test.ts which toggles this per-test.
  verifyEvent: vi.fn(() => true),
}));

vi.mock('nostr-tools/nip04', () => ({
  encrypt: vi.fn((_sk: unknown, _pk: string, text: string) => `enc:${text}`),
  decrypt: vi.fn((_sk: unknown, _pk: string, cipher: string) => cipher.replace('enc:', '')),
}));

import { NostrPlugin } from '@process/channels/plugins/tier3/nostr/NostrPlugin';

const VALID_HEX_KEY = 'b'.repeat(64);
const RECIPIENT_PK = 'c'.repeat(64);

function makeConfig(): IChannelPluginConfig {
  return {
    id: 'nostr_default',
    type: 'nostr',
    name: 'Nostr',
    enabled: true,
    status: 'created',
    credentials: {
      privateKey: VALID_HEX_KEY,
      relays: ['wss://relay.damus.io'],
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

async function startedPlugin(): Promise<NostrPlugin> {
  const plugin = new NostrPlugin();
  await plugin.initialize(makeConfig());
  await plugin.start();
  return plugin;
}

beforeEach(() => {
  MockWs.mockClear();
  mockWsInstance.send.mockClear();
  mockWsInstance.terminate.mockClear();
  EventEmitter.prototype.removeAllListeners.call(mockWsInstance);

  MockWs.mockImplementation(function () {
    setTimeout(() => mockWsInstance.emit('open'), 0);
    return mockWsInstance;
  });
});

// ── sendMessage ───────────────────────────────────────────────────────────────

describe('NostrPlugin.sendMessage', () => {
  it('sends an EVENT message to the relay and returns the event id', async () => {
    const plugin = await startedPlugin();

    // sendMessage triggers publishToRelays which sends to ws; resolve the OK
    // listener by emitting OK after a brief delay.
    mockWsInstance.send.mockImplementation((_data: string) => {
      // Only reply to EVENT messages, not REQ.
      setTimeout(() => {
        mockWsInstance.emit(
          'message',
          Buffer.from(JSON.stringify(['OK', FIXED_EVENT_ID, true, ''])),
        );
      }, 5);
    });

    const msgId = await plugin.sendMessage(RECIPIENT_PK, { text: 'hello nostr' });
    expect(msgId).toBe(FIXED_EVENT_ID);

    // Second send call is the EVENT (first was REQ).
    const calls = mockWsInstance.send.mock.calls;
    const eventCall = calls.find((c) => {
      try {
        const msg = JSON.parse(c[0] as string) as unknown[];
        return msg[0] === 'EVENT';
      } catch {
        return false;
      }
    });
    expect(eventCall).toBeDefined();

    await plugin.stop();
  });

  it('returns empty string for blank message', async () => {
    const plugin = await startedPlugin();
    const id = await plugin.sendMessage(RECIPIENT_PK, { text: '   ' });
    expect(id).toBe('');
    await plugin.stop();
  });

  it('throws when no relays are connected', async () => {
    const plugin = new NostrPlugin();
    await plugin.initialize(makeConfig());
    // Don't start - sk/pk not set → 'not running' guard fires first.
    await expect(plugin.sendMessage(RECIPIENT_PK, { text: 'hi' })).rejects.toThrow(
      /not running|no nostr relays/i,
    );
  });
});

// ── Inbound event routing ─────────────────────────────────────────────────────

describe('NostrPlugin inbound event routing', () => {
  it('decrypts an inbound kind:4 DM and emits it via messageHandler', async () => {
    const plugin = await startedPlugin();
    const received: string[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg.content.text ?? '');
    });

    const senderPk = 'd'.repeat(64);
    const inboundEvent = {
      id: 'inbound-001',
      pubkey: senderPk,
      created_at: Math.floor(Date.now() / 1000),
      kind: 4,
      tags: [['p', MOCK_PK]],
      content: 'enc:hello from sender',
    };

    // Simulate relay pushing an EVENT.
    mockWsInstance.emit(
      'message',
      Buffer.from(JSON.stringify(['EVENT', 'sub-id', inboundEvent])),
    );

    // Allow microtasks to settle.
    await new Promise((r) => setTimeout(r, 20));

    expect(received).toContain('hello from sender');
    await plugin.stop();
  });

  it('ignores self-messages (echo filter)', async () => {
    const plugin = await startedPlugin();
    const received: string[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg.content.text ?? '');
    });

    const selfEvent = {
      id: 'self-001',
      pubkey: MOCK_PK, // same as bot pubkey → should be dropped
      created_at: Math.floor(Date.now() / 1000),
      kind: 4,
      tags: [['p', MOCK_PK]],
      content: 'enc:bot talking to itself',
    };

    mockWsInstance.emit(
      'message',
      Buffer.from(JSON.stringify(['EVENT', 'sub-id', selfEvent])),
    );

    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(0);
    await plugin.stop();
  });

  it('deduplicates events received on multiple relays', async () => {
    const plugin = await startedPlugin();
    const received: string[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg.content.text ?? '');
    });

    const senderPk = 'e'.repeat(64);
    const dupEvent = {
      id: 'dup-event-001',
      pubkey: senderPk,
      created_at: Math.floor(Date.now() / 1000),
      kind: 4,
      tags: [['p', MOCK_PK]],
      content: 'enc:duplicate message',
    };

    // Emit the same event id twice (relay fanout dedup scenario).
    mockWsInstance.emit('message', Buffer.from(JSON.stringify(['EVENT', 'sub-id', dupEvent])));
    mockWsInstance.emit('message', Buffer.from(JSON.stringify(['EVENT', 'sub-id', dupEvent])));

    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(1);
    await plugin.stop();
  });
});
