/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * TwitchPlugin lifecycle tests: created → initializing → ready → starting →
 * running → stopping → stopped. tmi.js is mocked with a hand-rolled
 * EventEmitter so no real network connections are made.
 */

import { EventEmitter } from 'node:events';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

// ── Hoist tmi.js mock (MUST be top-level, before imports) ─────────────────────

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

function makeConfig(overrides: Partial<Record<string, unknown>> = {}): IChannelPluginConfig {
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
      ...overrides,
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

beforeEach(() => {
  MockTmiClient.mockReset();
  mockTmiInstance.connect.mockReset();
  mockTmiInstance.disconnect.mockReset();
  mockTmiInstance.say.mockReset();
  EventEmitter.prototype.removeAllListeners.call(mockTmiInstance);

  // Default: connect resolves immediately.
  MockTmiClient.mockImplementation(function () {
    return mockTmiInstance;
  });
  mockTmiInstance.connect.mockResolvedValue(['irc.chat.twitch.tv', 6697]);
  mockTmiInstance.disconnect.mockResolvedValue(['irc.chat.twitch.tv', 6697]);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TwitchPlugin capabilities', () => {
  it('declares twitch type with all capabilities false', () => {
    const plugin = new TwitchPlugin();
    expect(plugin.type).toBe('twitch');
    expect(plugin.capabilities).toEqual({
      canEdit: false,
      canStream: false,
      canReact: false,
      canTypingIndicator: false,
    });
  });
});

describe('TwitchPlugin initial state', () => {
  it('starts created with 0 active users and no bot info', () => {
    const plugin = new TwitchPlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.getActiveUserCount()).toBe(0);
    expect(plugin.getBotInfo()).toBeNull();
  });
});

describe('TwitchPlugin lifecycle: created → ready → running → stopped', () => {
  it('transitions through the full happy path', async () => {
    const plugin = new TwitchPlugin();

    await plugin.initialize(makeConfig());
    expect(plugin.status).toBe('ready');

    await plugin.start();
    expect(plugin.status).toBe('running');
    expect(mockTmiInstance.connect).toHaveBeenCalledOnce();

    const botInfo = plugin.getBotInfo();
    expect(botInfo).not.toBeNull();
    expect(botInfo?.username).toBe('mybot');

    await plugin.stop();
    expect(plugin.status).toBe('stopped');
    expect(mockTmiInstance.disconnect).toHaveBeenCalled();
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('can restart after stop', async () => {
    const plugin = new TwitchPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    await plugin.stop();

    // Re-initialize and start again.
    await plugin.initialize(makeConfig());
    await plugin.start();
    expect(plugin.status).toBe('running');
    await plugin.stop();
  });
});

describe('TwitchPlugin initialize validation', () => {
  it('throws when botUsername is missing', async () => {
    const plugin = new TwitchPlugin();
    await expect(plugin.initialize(makeConfig({ botUsername: '' }))).rejects.toThrow(/botUsername/i);
    expect(plugin.status).toBe('error');
  });

  it('throws when oauthToken is missing', async () => {
    const plugin = new TwitchPlugin();
    await expect(plugin.initialize(makeConfig({ oauthToken: '' }))).rejects.toThrow(/oauth/i);
    expect(plugin.status).toBe('error');
  });
});

describe('TwitchPlugin handleWebhookPayload', () => {
  it('throws with a clear explanation', async () => {
    const plugin = new TwitchPlugin();
    await expect(plugin.handleWebhookPayload()).rejects.toThrow(/webhook/i);
  });
});

describe('TwitchPlugin stop is idempotent', () => {
  it('does not throw when stopped twice', async () => {
    const plugin = new TwitchPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();
    await plugin.stop();
    // Second stop - BasePlugin early-returns; no throw.
    await expect(plugin.stop()).resolves.not.toThrow();
  });
});
