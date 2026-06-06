/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IrcPlugin lifecycle tests: created → initializing → ready → starting →
 * running → stopping → stopped. irc-framework is mocked with a hand-rolled
 * EventEmitter so no real TCP connections are made.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

// ── Hoist the irc-framework mock ─────────────────────────────────────────────
// EventEmitter is required inside vi.hoisted so it is available before imports
// resolve (vi.hoisted runs before the module graph is evaluated).
const { MockClient, mockClientInstance } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EventEmitter } = require('node:events') as typeof import('node:events');

  class FakeClient extends EventEmitter {
    user = { nick: 'wayland-bot' };
    connected = true;
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

  // Must be a regular function (not arrow) so `new MockClient()` works.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const MockClient = vi.fn(function () {
    return instance;
  }) as unknown as { new (): FakeClient } & ReturnType<typeof vi.fn>;

  return { MockClient, mockClientInstance: instance };
});

vi.mock('irc-framework', () => ({
  default: { Client: MockClient },
}));

import { IrcPlugin } from '@process/channels/plugins/tier3/irc/IrcPlugin';

// Need EventEmitter for beforeEach cleanup - require it at module level too.
import { EventEmitter } from 'node:events';

function makeConfig(overrides: Partial<Record<string, unknown>> = {}): IChannelPluginConfig {
  return {
    id: 'irc_default',
    type: 'irc',
    name: 'IRC',
    enabled: true,
    status: 'created',
    credentials: {
      server: 'irc.libera.chat',
      port: 6697,
      tls: true,
      nick: 'wayland-bot',
      username: 'wayland-bot',
      password: '',
      channels: ['#wayland-bots'],
      saslMechanism: 'none',
      ...overrides,
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

beforeEach(() => {
  MockClient.mockClear();
  mockClientInstance.connect.mockClear();
  mockClientInstance.quit.mockClear();
  mockClientInstance.join.mockClear();
  mockClientInstance.say.mockClear();
  EventEmitter.prototype.removeAllListeners.call(mockClientInstance);
  mockClientInstance.connected = true;

  mockClientInstance.connect.mockImplementation(() => {
    setTimeout(() => mockClientInstance.emit('registered', {}), 0);
  });
});

describe('IrcPlugin capabilities', () => {
  it('declares the irc type with no edit/react/stream/typing capabilities', () => {
    const plugin = new IrcPlugin();
    expect(plugin.type).toBe('irc');
    expect(plugin.capabilities).toEqual({
      canEdit: false,
      canStream: false,
      canReact: false,
      canTypingIndicator: false,
    });
  });
});

describe('IrcPlugin initial state', () => {
  it('starts in created status with 0 active users and no bot info', () => {
    const plugin = new IrcPlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.getActiveUserCount()).toBe(0);
    expect(plugin.getBotInfo()).toBeNull();
  });
});

describe('IrcPlugin lifecycle: created → ready → running → stopped', () => {
  it('transitions through the full lifecycle', async () => {
    const plugin = new IrcPlugin();

    await plugin.initialize(makeConfig());
    expect(plugin.status).toBe('ready');

    await plugin.start();
    expect(plugin.status).toBe('running');

    expect(plugin.getBotInfo()).toEqual({
      id: 'wayland-bot',
      username: 'wayland-bot',
      displayName: 'wayland-bot',
    });

    await plugin.stop();
    expect(plugin.status).toBe('stopped');
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('joins configured channels after registration', async () => {
    const plugin = new IrcPlugin();
    await plugin.initialize(makeConfig({ channels: ['#wayland-bots', '#general'] }));
    await plugin.start();
    expect(mockClientInstance.join).toHaveBeenCalledWith('#wayland-bots');
    expect(mockClientInstance.join).toHaveBeenCalledWith('#general');
    await plugin.stop();
  });

  it('calls quit on stop', async () => {
    const plugin = new IrcPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    await plugin.stop();
    expect(mockClientInstance.quit).toHaveBeenCalled();
  });
});

describe('IrcPlugin initialize validation', () => {
  it('throws when server is missing', async () => {
    const plugin = new IrcPlugin();
    await expect(plugin.initialize(makeConfig({ server: '' }))).rejects.toThrow(/server/i);
  });

  it('throws when nick is missing', async () => {
    const plugin = new IrcPlugin();
    await expect(plugin.initialize(makeConfig({ nick: '' }))).rejects.toThrow(/nick/i);
  });

  it('transitions to error status on initialize failure', async () => {
    const plugin = new IrcPlugin();
    await expect(plugin.initialize(makeConfig({ server: '' }))).rejects.toThrow();
    expect(plugin.status).toBe('error');
  });
});

describe('IrcPlugin reconnect backoff', () => {
  it('schedules a reconnect when the connection closes unexpectedly', async () => {
    const plugin = new IrcPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();

    vi.useFakeTimers();
    try {
      expect(plugin.status).toBe('running');
      const connectCallsBefore = mockClientInstance.connect.mock.calls.length;

      // Wire the reconnect connect to also fire registered so the promise resolves.
      mockClientInstance.connect.mockImplementation(() => {
        setTimeout(() => mockClientInstance.emit('registered', {}), 0);
      });

      mockClientInstance.emit('close');
      await vi.advanceTimersByTimeAsync(5_000);
      await vi.runAllTimersAsync();

      expect(mockClientInstance.connect.mock.calls.length).toBeGreaterThan(connectCallsBefore);
    } finally {
      vi.useRealTimers();
      await plugin.stop();
    }
  });

  it('transitions to error after exceeding max reconnect attempts', async () => {
    const plugin = new IrcPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();

    vi.useFakeTimers();
    try {
      // Make connect() throw synchronously so connectAndListen() rejects,
      // which causes the catch path in scheduleReconnect to call scheduleReconnect
      // again - cleanly incrementing the failure counter each cycle.
      mockClientInstance.connect.mockImplementation(() => {
        throw new Error('simulated connect failure');
      });

      // Trigger initial disconnect - failure count goes to 1, timer at 5s.
      mockClientInstance.emit('close');

      // Each advanceTimersByTimeAsync fires the backoff timer, connectAndListen
      // rejects (connect throws), the catch calls scheduleReconnect again.
      // Backoff windows: 5s(1), 10s(2), 20s(3), 40s(4), 60s(5) → 6th → error.
      for (let i = 0; i < 6; i++) {
        await vi.advanceTimersByTimeAsync(60_000);
        await vi.runAllTimersAsync();
      }

      expect(plugin.status).toBe('error');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('IrcPlugin handleWebhookPayload', () => {
  it('throws with a clear explanation', async () => {
    const plugin = new IrcPlugin();
    await expect(plugin.handleWebhookPayload()).rejects.toThrow(/webhook/i);
  });
});
