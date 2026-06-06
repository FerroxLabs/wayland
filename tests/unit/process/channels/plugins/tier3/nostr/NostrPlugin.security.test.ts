/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * NostrPlugin security tests (HIGH-1/2/3 from REVIEW-nostr.md):
 *   - HIGH-1: Schnorr signature verification on every inbound event
 *   - HIGH-2: allowedSenders authorization
 *   - HIGH-3: ciphertext + plaintext byte-size caps
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

// Module-level toggle for verifyEvent: tests flip this to simulate
// valid (true) vs. forged-signature (false) events.
const verifyEventState = { valid: true };

vi.mock('nostr-tools', () => ({
  getPublicKey: vi.fn(() => MOCK_PK),
  nip19: {
    npubEncode: vi.fn((hex: string) => `npub1${hex.slice(0, 8)}`),
    decode: vi.fn((s: string) => {
      // Crude npub→hex decoder for test allowlist parsing: assume the literal
      // marker "npub1<hex8>...<padding>" and produce a Uint8Array filled with
      // the first 8 chars repeated 8× (32 bytes). Tests don't actually inspect
      // the bytes - only that decode + .map(b.toString(16)) round-trips to hex.
      const hex8 = s.slice(5, 13);
      const bytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        const ch = hex8[i % 8];
        bytes[i] = parseInt(ch + ch, 16);
      }
      return { type: 'npub', data: bytes };
    }),
  },
  finalizeEvent: vi.fn(
    (partial: { kind: number; content: string; tags: string[][]; created_at: number }) => ({
      ...partial,
      id: FIXED_EVENT_ID,
      pubkey: MOCK_PK,
      sig: 'sig',
    }),
  ),
  verifyEvent: vi.fn(() => verifyEventState.valid),
}));

vi.mock('nostr-tools/nip04', () => ({
  encrypt: vi.fn((_sk: unknown, _pk: string, text: string) => `enc:${text}`),
  decrypt: vi.fn((_sk: unknown, _pk: string, cipher: string) => cipher.replace('enc:', '')),
}));

import { NostrPlugin } from '@process/channels/plugins/tier3/nostr/NostrPlugin';

const VALID_HEX_KEY = 'b'.repeat(64);

function makeConfig(extra?: Record<string, unknown>): IChannelPluginConfig {
  return {
    id: 'nostr_default',
    type: 'nostr',
    name: 'Nostr',
    enabled: true,
    status: 'created',
    credentials: {
      privateKey: VALID_HEX_KEY,
      relays: ['wss://relay.damus.io'],
      ...extra,
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

async function startedPlugin(extra?: Record<string, unknown>): Promise<NostrPlugin> {
  const plugin = new NostrPlugin();
  await plugin.initialize(makeConfig(extra));
  await plugin.start();
  return plugin;
}

beforeEach(() => {
  verifyEventState.valid = true;
  MockWs.mockClear();
  mockWsInstance.send.mockClear();
  mockWsInstance.terminate.mockClear();
  EventEmitter.prototype.removeAllListeners.call(mockWsInstance);

  MockWs.mockImplementation(function () {
    setTimeout(() => mockWsInstance.emit('open'), 0);
    return mockWsInstance;
  });
});

// ── HIGH-1: signature verification ────────────────────────────────────────────

describe('NostrPlugin HIGH-1: signature verification', () => {
  it('drops an event whose Schnorr signature does not verify', async () => {
    verifyEventState.valid = false; // verifyEvent returns false for this test

    const plugin = await startedPlugin();
    const received: string[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg.content.text ?? '');
    });

    const senderPk = 'd'.repeat(64);
    const forgedEvent = {
      id: 'forged-001',
      pubkey: senderPk,
      created_at: Math.floor(Date.now() / 1000),
      kind: 4,
      tags: [['p', MOCK_PK]],
      content: 'enc:forged content',
      sig: 'invalid-sig',
    };

    mockWsInstance.emit(
      'message',
      Buffer.from(JSON.stringify(['EVENT', 'sub-id', forgedEvent])),
    );

    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(0);
    await plugin.stop();
  });

  it('accepts an event with a valid Schnorr signature', async () => {
    verifyEventState.valid = true;

    const plugin = await startedPlugin();
    const received: string[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg.content.text ?? '');
    });

    const senderPk = 'd'.repeat(64);
    const goodEvent = {
      id: 'good-001',
      pubkey: senderPk,
      created_at: Math.floor(Date.now() / 1000),
      kind: 4,
      tags: [['p', MOCK_PK]],
      content: 'enc:authentic message',
      sig: 'valid-sig',
    };

    mockWsInstance.emit(
      'message',
      Buffer.from(JSON.stringify(['EVENT', 'sub-id', goodEvent])),
    );

    await new Promise((r) => setTimeout(r, 20));
    expect(received).toContain('authentic message');
    await plugin.stop();
  });
});

// ── HIGH-2: sender authorization ──────────────────────────────────────────────

describe('NostrPlugin HIGH-2: allowedSenders authz', () => {
  it('open mode (no allowlist) accepts any authenticated sender', async () => {
    const plugin = await startedPlugin();
    const received: string[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg.content.text ?? '');
    });

    const senderPk = 'd'.repeat(64);
    mockWsInstance.emit(
      'message',
      Buffer.from(
        JSON.stringify([
          'EVENT',
          'sub-id',
          {
            id: 'open-001',
            pubkey: senderPk,
            created_at: Math.floor(Date.now() / 1000),
            kind: 4,
            tags: [['p', MOCK_PK]],
            content: 'enc:open mode hello',
            sig: 'sig',
          },
        ]),
      ),
    );

    await new Promise((r) => setTimeout(r, 20));
    expect(received).toContain('open mode hello');
    await plugin.stop();
  });

  it('allowlist mode drops events from unlisted senders', async () => {
    const allowedSender = 'd'.repeat(64);
    const blockedSender = 'e'.repeat(64);

    const plugin = await startedPlugin({ allowedSenders: [allowedSender] });
    const received: string[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg.content.text ?? '');
    });

    // Allowed sender - should reach handler.
    mockWsInstance.emit(
      'message',
      Buffer.from(
        JSON.stringify([
          'EVENT',
          'sub-id',
          {
            id: 'allowed-001',
            pubkey: allowedSender,
            created_at: Math.floor(Date.now() / 1000),
            kind: 4,
            tags: [['p', MOCK_PK]],
            content: 'enc:from allowed',
            sig: 'sig',
          },
        ]),
      ),
    );

    // Blocked sender - must be dropped.
    mockWsInstance.emit(
      'message',
      Buffer.from(
        JSON.stringify([
          'EVENT',
          'sub-id',
          {
            id: 'blocked-001',
            pubkey: blockedSender,
            created_at: Math.floor(Date.now() / 1000),
            kind: 4,
            tags: [['p', MOCK_PK]],
            content: 'enc:from blocked',
            sig: 'sig',
          },
        ]),
      ),
    );

    await new Promise((r) => setTimeout(r, 20));
    expect(received).toContain('from allowed');
    expect(received).not.toContain('from blocked');
    await plugin.stop();
  });

  it('allowlist accepts comma-separated string credential', async () => {
    const allowedSender = 'd'.repeat(64);
    const blockedSender = 'e'.repeat(64);

    const plugin = await startedPlugin({ allowedSenders: `${allowedSender}, ` });
    const received: string[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg.content.text ?? '');
    });

    mockWsInstance.emit(
      'message',
      Buffer.from(
        JSON.stringify([
          'EVENT',
          'sub-id',
          {
            id: 'str-blocked',
            pubkey: blockedSender,
            created_at: Math.floor(Date.now() / 1000),
            kind: 4,
            tags: [['p', MOCK_PK]],
            content: 'enc:str blocked',
            sig: 'sig',
          },
        ]),
      ),
    );

    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(0);
    await plugin.stop();
  });
});

// ── HIGH-3: size caps ─────────────────────────────────────────────────────────

describe('NostrPlugin HIGH-3: payload size caps', () => {
  it('drops events with ciphertext above MAX_CIPHERTEXT_BYTES (64 KB)', async () => {
    const plugin = await startedPlugin();
    const received: string[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg.content.text ?? '');
    });

    const senderPk = 'd'.repeat(64);
    // 65_000 chars > 64_000 byte cap.
    const oversized = 'enc:' + 'A'.repeat(65_000);
    mockWsInstance.emit(
      'message',
      Buffer.from(
        JSON.stringify([
          'EVENT',
          'sub-id',
          {
            id: 'big-ct-001',
            pubkey: senderPk,
            created_at: Math.floor(Date.now() / 1000),
            kind: 4,
            tags: [['p', MOCK_PK]],
            content: oversized,
            sig: 'sig',
          },
        ]),
      ),
    );

    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(0);
    await plugin.stop();
  });

  it('drops events whose decrypted plaintext exceeds MAX_PLAINTEXT_BYTES (32 KB)', async () => {
    const plugin = await startedPlugin();
    const received: string[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg.content.text ?? '');
    });

    const senderPk = 'd'.repeat(64);
    // Ciphertext under 64 KB, but decrypts to 33 KB plaintext.
    // Our nip04 mock strips the "enc:" prefix and returns the rest verbatim.
    const plaintextStub = 'P'.repeat(33_000);
    const ciphertext = 'enc:' + plaintextStub;

    mockWsInstance.emit(
      'message',
      Buffer.from(
        JSON.stringify([
          'EVENT',
          'sub-id',
          {
            id: 'big-pt-001',
            pubkey: senderPk,
            created_at: Math.floor(Date.now() / 1000),
            kind: 4,
            tags: [['p', MOCK_PK]],
            content: ciphertext,
            sig: 'sig',
          },
        ]),
      ),
    );

    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(0);
    await plugin.stop();
  });

  it('accepts events with payloads under both caps', async () => {
    const plugin = await startedPlugin();
    const received: string[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg.content.text ?? '');
    });

    const senderPk = 'd'.repeat(64);
    mockWsInstance.emit(
      'message',
      Buffer.from(
        JSON.stringify([
          'EVENT',
          'sub-id',
          {
            id: 'small-ok',
            pubkey: senderPk,
            created_at: Math.floor(Date.now() / 1000),
            kind: 4,
            tags: [['p', MOCK_PK]],
            content: 'enc:small payload',
            sig: 'sig',
          },
        ]),
      ),
    );

    await new Promise((r) => setTimeout(r, 20));
    expect(received).toContain('small payload');
    await plugin.stop();
  });
});
