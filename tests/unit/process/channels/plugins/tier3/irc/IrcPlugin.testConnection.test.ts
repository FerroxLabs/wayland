/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for IrcPlugin.testConnection - happy path, bad credentials, network failure.
 * irc-framework is mocked so no real TCP connections are made.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoist the irc-framework mock ─────────────────────────────────────────────
const { MockClient, mockClientInstance } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EventEmitter } = require('node:events') as typeof import('node:events');

  class FakeClient extends EventEmitter {
    user = { nick: 'wayland-bot' };
    connected = false;
    connect = vi.fn(() => {
      setTimeout(() => this.emit('registered', {}), 0);
    });
    quit = vi.fn();
    join = vi.fn();
    say = vi.fn();
    removeAllListeners = vi.fn(() => {
      EventEmitter.prototype.removeAllListeners.call(this);
      return this;
    });
  }

  const instance = new FakeClient();

  // Must be a regular function so `new MockClient()` works.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const MockClient = vi.fn(function () {
    return instance;
  }) as unknown as { new (): FakeClient } & ReturnType<typeof vi.fn>;

  return { MockClient, mockClientInstance: instance };
});

vi.mock('irc-framework', () => ({
  default: { Client: MockClient },
}));

import { EventEmitter } from 'node:events';
import { IrcPlugin } from '@process/channels/plugins/tier3/irc/IrcPlugin';

const VALID_TOKEN = JSON.stringify({
  server: 'irc.libera.chat',
  port: 6697,
  tls: true,
  nick: 'wayland-bot',
  username: 'wayland-bot',
  password: '',
  channels: ['#wayland-bots'],
  saslMechanism: 'none',
});

beforeEach(() => {
  MockClient.mockClear();
  mockClientInstance.connect.mockClear();
  mockClientInstance.quit.mockClear();
  EventEmitter.prototype.removeAllListeners.call(mockClientInstance);

  mockClientInstance.connect.mockImplementation(() => {
    setTimeout(() => mockClientInstance.emit('registered', {}), 0);
  });
});

describe('IrcPlugin.testConnection - happy path', () => {
  it('returns success with botUsername when server sends registered', async () => {
    const result = await IrcPlugin.testConnection(VALID_TOKEN);
    expect(result).toEqual({ success: true, botUsername: 'wayland-bot' });
  });

  it('calls quit after a successful test', async () => {
    await IrcPlugin.testConnection(VALID_TOKEN);
    expect(mockClientInstance.quit).toHaveBeenCalled();
  });
});

describe('IrcPlugin.testConnection - credential errors', () => {
  it('returns failure for non-JSON token', async () => {
    const result = await IrcPlugin.testConnection('not-json');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/json/i);
  });

  it('returns failure when server field is missing', async () => {
    const result = await IrcPlugin.testConnection(JSON.stringify({ nick: 'bot' }));
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/server/i);
  });

  it('returns failure when nick field is missing', async () => {
    const result = await IrcPlugin.testConnection(
      JSON.stringify({ server: 'irc.libera.chat' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/nick/i);
  });
});

describe('IrcPlugin.testConnection - network failures', () => {
  it('returns failure when irc error fires before registered', async () => {
    mockClientInstance.connect.mockImplementation(() => {
      setTimeout(
        () => mockClientInstance.emit('irc error', { error: 'Bad password (464)' }),
        0,
      );
    });

    const result = await IrcPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/464|password/i);
  });

  it('returns failure when connection closes before registered', async () => {
    mockClientInstance.connect.mockImplementation(() => {
      setTimeout(() => mockClientInstance.emit('close'), 0);
    });

    const result = await IrcPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/closed/i);
  });

  it('returns failure on socket error', async () => {
    mockClientInstance.connect.mockImplementation(() => {
      setTimeout(
        () => mockClientInstance.emit('socket error', new Error('ECONNREFUSED')),
        0,
      );
    });

    const result = await IrcPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ECONNREFUSED/i);
  });

  it('returns failure on timeout (no server response)', async () => {
    vi.useFakeTimers();
    try {
      mockClientInstance.connect.mockImplementation(() => {
        // Never emit anything - simulate a silent server.
      });

      const resultPromise = IrcPlugin.testConnection(VALID_TOKEN);
      await vi.advanceTimersByTimeAsync(11_000);
      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/timed out/i);
    } finally {
      vi.useRealTimers();
    }
  });
});
