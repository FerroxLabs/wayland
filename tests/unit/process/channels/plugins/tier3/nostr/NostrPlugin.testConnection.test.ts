/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * NostrPlugin.testConnection: happy path + 2 error paths (bad creds, network failure).
 */

import { EventEmitter } from 'node:events';

import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    return instance;
  }) as unknown as { new (url: string): FakeWs } & ReturnType<typeof vi.fn>;

  return { MockWs, mockWsInstance: instance };
});

vi.mock('ws', () => ({ default: MockWs }));

vi.mock('nostr-tools', () => ({
  getPublicKey: vi.fn(() => 'a'.repeat(64)),
  nip19: {
    npubEncode: vi.fn((hex: string) => `npub1${hex.slice(0, 8)}`),
    decode: vi.fn(),
  },
  finalizeEvent: vi.fn(),
}));

vi.mock('nostr-tools/nip04', () => ({
  encrypt: vi.fn(),
  decrypt: vi.fn(),
}));

import { NostrPlugin } from '@process/channels/plugins/tier3/nostr/NostrPlugin';

const VALID_HEX_KEY = 'a'.repeat(64);

function makeToken(overrides: object = {}): string {
  return JSON.stringify({
    privateKey: VALID_HEX_KEY,
    relays: ['wss://relay.damus.io'],
    ...overrides,
  });
}

beforeEach(() => {
  MockWs.mockClear();
  mockWsInstance.send.mockClear();
  mockWsInstance.terminate.mockClear();
  EventEmitter.prototype.removeAllListeners.call(mockWsInstance);
});

describe('NostrPlugin.testConnection - happy path', () => {
  it('returns success=true and botUsername=npub when relay sends EOSE', async () => {
    MockWs.mockImplementation(function () {
      setTimeout(() => {
        mockWsInstance.emit('open');
        // After open, simulate relay responding with EOSE.
        setTimeout(() => {
          mockWsInstance.emit('message', Buffer.from(JSON.stringify(['EOSE', 'sub1'])));
        }, 10);
      }, 0);
      return mockWsInstance;
    });

    const result = await NostrPlugin.testConnection(makeToken());
    expect(result.success).toBe(true);
    expect(result.botUsername).toMatch(/^npub1/);
  });

  it('also resolves success when relay sends an EVENT (no stored events → EOSE timing)', async () => {
    MockWs.mockImplementation(function () {
      setTimeout(() => {
        mockWsInstance.emit('open');
        setTimeout(() => {
          mockWsInstance.emit(
            'message',
            Buffer.from(JSON.stringify(['EVENT', 'sub1', { id: 'x', kind: 4 }])),
          );
        }, 10);
      }, 0);
      return mockWsInstance;
    });

    const result = await NostrPlugin.testConnection(makeToken());
    expect(result.success).toBe(true);
  });
});

describe('NostrPlugin.testConnection - error paths', () => {
  it('returns success=false on bad JSON token', async () => {
    const result = await NostrPlugin.testConnection('not-json');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/json/i);
  });

  it('returns success=false when privateKey is missing', async () => {
    const result = await NostrPlugin.testConnection(JSON.stringify({ relays: ['wss://r.io'] }));
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/private key/i);
  });

  it('returns success=false on network error', async () => {
    MockWs.mockImplementation(function () {
      setTimeout(() => {
        mockWsInstance.emit('error', new Error('ECONNREFUSED'));
      }, 0);
      return mockWsInstance;
    });

    const result = await NostrPlugin.testConnection(makeToken());
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ECONNREFUSED/i);
  });

  it('returns success=false when relay closes without responding', async () => {
    MockWs.mockImplementation(function () {
      setTimeout(() => {
        mockWsInstance.emit('open');
        setTimeout(() => mockWsInstance.emit('close'), 10);
      }, 0);
      return mockWsInstance;
    });

    const result = await NostrPlugin.testConnection(makeToken());
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/closed/i);
  });
});
