/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * TwitchPlugin.testConnection tests: happy path + 2 error paths.
 * tmi.js mocked with a hand-rolled EventEmitter.
 */

import { EventEmitter } from 'node:events';

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoist tmi.js mock ─────────────────────────────────────────────────────────

const { MockTmiClient, mockTmiInstance } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EventEmitter } = require('node:events') as typeof import('node:events');

  class FakeTmiClient extends EventEmitter {
    connect = vi.fn(() => Promise.resolve(['irc.chat.twitch.tv', 6697] as [string, number]));
    disconnect = vi.fn(() => Promise.resolve(['irc.chat.twitch.tv', 6697] as [string, number]));
    say = vi.fn((_channel: string, _msg: string) => Promise.resolve([''] as [string]));
    readyState = vi.fn(() => 'OPEN');
    removeAllListeners = vi.fn(function (this: FakeTmiClient, event?: string) {
      EventEmitter.prototype.removeAllListeners.call(this, event);
      return this;
    });
  }

  const instance = new FakeTmiClient();

  const MockTmiClient = vi.fn(function () {
    return instance;
  }) as unknown as { new (opts: unknown): FakeTmiClient } & ReturnType<typeof vi.fn>;

  return { MockTmiClient, mockTmiInstance: instance };
});

vi.mock('tmi.js', () => ({ default: MockTmiClient }));

import { TwitchPlugin } from '@process/channels/plugins/tier3/twitch/TwitchPlugin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function validToken(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    botUsername: 'mybot',
    oauthToken: 'oauth:testtoken123',
    channels: ['mychannel'],
    ...overrides,
  });
}

beforeEach(() => {
  MockTmiClient.mockReset();
  mockTmiInstance.connect.mockReset();
  mockTmiInstance.disconnect.mockReset();
  EventEmitter.prototype.removeAllListeners.call(mockTmiInstance);

  MockTmiClient.mockImplementation(function () {
    return mockTmiInstance;
  });
  mockTmiInstance.connect.mockResolvedValue(['irc.chat.twitch.tv', 6697]);
  mockTmiInstance.disconnect.mockResolvedValue(['irc.chat.twitch.tv', 6697]);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TwitchPlugin.testConnection - happy path', () => {
  it('resolves success when globaluserstate fires before timeout', async () => {
    // Emit globaluserstate after connect() resolves.
    mockTmiInstance.connect.mockImplementation(async () => {
      setTimeout(() => mockTmiInstance.emit('globaluserstate', {}), 10);
      return ['irc.chat.twitch.tv', 6697] as [string, number];
    });

    const result = await TwitchPlugin.testConnection(validToken());
    expect(result.success).toBe(true);
    expect(result.botUsername).toBe('mybot');
    expect(result.error).toBeUndefined();
  });
});

describe('TwitchPlugin.testConnection - error paths', () => {
  it('returns failure when JSON is invalid', async () => {
    const result = await TwitchPlugin.testConnection('not-json');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/json/i);
  });

  it('returns failure when botUsername is missing', async () => {
    const result = await TwitchPlugin.testConnection(validToken({ botUsername: '' }));
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/botUsername/i);
  });

  it('returns failure when oauthToken is missing', async () => {
    const result = await TwitchPlugin.testConnection(validToken({ oauthToken: '' }));
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/oauth/i);
  });

  it('returns failure when disconnected fires before globaluserstate (bad creds)', async () => {
    mockTmiInstance.connect.mockImplementation(async () => {
      setTimeout(() => mockTmiInstance.emit('disconnected', 'Login authentication failed'), 10);
      return ['irc.chat.twitch.tv', 6697] as [string, number];
    });

    const result = await TwitchPlugin.testConnection(validToken());
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/authentication failed/i);
  });

  it('returns failure when connect() rejects (network error)', async () => {
    mockTmiInstance.connect.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await TwitchPlugin.testConnection(validToken());
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ECONNREFUSED/i);
  });
});
