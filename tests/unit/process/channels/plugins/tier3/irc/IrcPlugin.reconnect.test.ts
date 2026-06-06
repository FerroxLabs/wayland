/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Reconnect + PASS-without-SASL coverage for IrcPlugin.
 *
 * Covers two audit gaps:
 *   - >RECONNECT_BACKOFF_MAX_ATTEMPTS (5) reconnect attempts → status='error'.
 *   - saslMechanism='none' + password set → connectOpts.password (PASS) wired,
 *     no `account` block emitted.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

// ── Hoist the irc-framework mock ─────────────────────────────────────────────
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
    changeNick = vi.fn();
    removeAllListeners = vi.fn(() => {
      EventEmitter.prototype.removeAllListeners.call(this);
      return this;
    });
  }

  const instance = new FakeClient();

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
  mockClientInstance.changeNick.mockClear();
  EventEmitter.prototype.removeAllListeners.call(mockClientInstance);
  mockClientInstance.connected = true;

  mockClientInstance.connect.mockImplementation(() => {
    setTimeout(() => mockClientInstance.emit('registered', {}), 0);
  });
});

describe('IrcPlugin reconnect exhaustion', () => {
  it('transitions to status="error" after exceeding the reconnect cap', async () => {
    vi.useFakeTimers();
    try {
      const plugin = new IrcPlugin();
      await plugin.initialize(makeConfig());
      const startPromise = plugin.start();
      // Drain the queued setTimeout(0) so the registered event resolves.
      await vi.advanceTimersByTimeAsync(0);
      await startPromise;
      expect(plugin.status).toBe('running');

      // After registration, switch the mock so reconnect attempts emit 'close'
      // (mirroring a TCP RST during handshake). The plugin's close handler
      // schedules another reconnect - but only if `this.client === client`,
      // which is only true for the *previously registered* client. To keep
      // failing, each reconnect attempt must register first then close.
      //
      // Simpler: drive the failure through connectAndListen's rejection path.
      // Make connect() emit 'irc error' before registration so the start
      // Promise rejects; the catch handler in scheduleReconnect re-schedules.
      mockClientInstance.connect.mockImplementation(() => {
        // Pre-welcome failure - connectAndListen rejects → scheduleReconnect.
        setTimeout(() => mockClientInstance.emit('irc error', { error: 'refused' }), 0);
      });

      // Trigger the first reconnect via 'close' on the registered client.
      mockClientInstance.connected = false;
      mockClientInstance.emit('close');

      // Drive all backoff timers. Each cycle: max 60s + 1000ms jitter +
      // microtask drain for the irc error + rejection cascade.
      for (let i = 0; i < 6; i += 1) {
        await vi.advanceTimersByTimeAsync(61_500);
      }

      expect(plugin.status).toBe('error');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('IrcPlugin PASS without SASL', () => {
  it('sets connectOpts.password and omits the account block when saslMechanism="none" + password present', async () => {
    const plugin = new IrcPlugin();
    await plugin.initialize(
      makeConfig({ password: 'server-pass-123', saslMechanism: 'none' }),
    );
    await plugin.start();

    expect(mockClientInstance.connect).toHaveBeenCalledTimes(1);
    const opts = mockClientInstance.connect.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(opts).toBeDefined();
    expect(opts.password).toBe('server-pass-123');
    // PASS branch must NOT also emit an account block (that would force SASL).
    expect(opts.account).toBeUndefined();
  });
});
