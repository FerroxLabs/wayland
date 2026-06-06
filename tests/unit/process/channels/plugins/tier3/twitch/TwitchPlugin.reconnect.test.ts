/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * TwitchPlugin reconnect backoff tests.
 * Uses fake timers to drive the exponential backoff without wall-clock waiting.
 */

import { EventEmitter } from 'node:events';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

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

function makeConfig(): IChannelPluginConfig {
  return {
    id: 'twitch_default',
    type: 'twitch',
    name: 'Twitch',
    enabled: true,
    status: 'created',
    credentials: {
      botUsername: 'mybot',
      oauthToken: 'oauth:testtoken123',
      channels: 'mychannel',
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  MockTmiClient.mockReset();
  mockTmiInstance.connect.mockReset();
  mockTmiInstance.disconnect.mockReset();
  mockTmiInstance.say.mockReset();
  EventEmitter.prototype.removeAllListeners.call(mockTmiInstance);

  MockTmiClient.mockImplementation(function () {
    return mockTmiInstance;
  });
  mockTmiInstance.connect.mockResolvedValue(['irc.chat.twitch.tv', 6697]);
  mockTmiInstance.disconnect.mockResolvedValue(['irc.chat.twitch.tv', 6697]);
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TwitchPlugin reconnect - single disconnect triggers backoff', () => {
  it('schedules a reconnect after the first disconnect', async () => {
    const plugin = new TwitchPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    expect(plugin.status).toBe('running');

    // Simulate a server-side disconnect.
    mockTmiInstance.emit('disconnected', 'Connection lost');

    // Status should be 'running' still (setError, not setStatus('error')).
    // error property should be set.
    expect(plugin.error).toMatch(/retrying/i);

    // Advance past the 5s first-attempt delay.
    await vi.advanceTimersByTimeAsync(6_000);

    // connect() called again for the reconnect attempt.
    expect(mockTmiInstance.connect.mock.calls.length).toBeGreaterThanOrEqual(2);

    await plugin.stop();
  });
});

describe('TwitchPlugin reconnect - stop cancels pending reconnect', () => {
  it('does not reconnect after stop() is called', async () => {
    const plugin = new TwitchPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();

    mockTmiInstance.emit('disconnected', 'Server restart');
    await plugin.stop();

    const callsAtStop = mockTmiInstance.connect.mock.calls.length;

    // Advance well past the reconnect window - no new connect() call.
    await vi.advanceTimersByTimeAsync(60_000);
    expect(mockTmiInstance.connect.mock.calls.length).toBe(callsAtStop);
    expect(plugin.status).toBe('stopped');
  });
});

describe('TwitchPlugin reconnect - gives up after 5 failed attempts', () => {
  it('transitions to error status after max attempts', async () => {
    // Make every connect() call fail after the initial success.
    let connectCount = 0;
    mockTmiInstance.connect.mockImplementation(async () => {
      connectCount += 1;
      if (connectCount === 1) {
        // First call succeeds (onStart).
        return ['irc.chat.twitch.tv', 6697] as [string, number];
      }
      // All subsequent reconnect attempts fail with a non-auth reason
      // (auth failures fast-fail per F-2 - covered separately below).
      throw new Error('Connection reset by peer');
    });

    const plugin = new TwitchPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    expect(plugin.status).toBe('running');

    // Trigger initial disconnect with a transient (non-auth) reason.
    mockTmiInstance.emit('disconnected', 'Connection reset by peer');

    // Drive through all 5 backoff windows: 5s, 10s, 20s, 40s, 60s = 135s total.
    // Each failing reconnect triggers another scheduleReconnect immediately.
    for (let i = 0; i < 6; i++) {
      await vi.advanceTimersByTimeAsync(65_000);
      // Let microtasks (promise rejections) settle.
      await Promise.resolve();
    }

    expect(plugin.status).toBe('error');
    expect(plugin.error).toMatch(/reconnect attempts/i);
  });
});

describe('TwitchPlugin reconnect - F-2 fast-fail on auth failure', () => {
  it('transitions to error immediately without burning backoff attempts', async () => {
    const plugin = new TwitchPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    expect(plugin.status).toBe('running');

    const connectCallsBefore = mockTmiInstance.connect.mock.calls.length;

    // Twitch tmi.js auth-failure disconnect message.
    mockTmiInstance.emit('disconnected', 'Login authentication failed');

    // Status flips to error synchronously inside the listener.
    expect(plugin.status).toBe('error');
    expect(plugin.error).toMatch(/token invalid or expired/i);

    // No reconnect attempt scheduled - advance well past any backoff.
    await vi.advanceTimersByTimeAsync(90_000);
    expect(mockTmiInstance.connect.mock.calls.length).toBe(connectCallsBefore);
  });
});
