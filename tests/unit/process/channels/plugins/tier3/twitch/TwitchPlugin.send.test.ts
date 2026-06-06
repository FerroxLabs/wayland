/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * TwitchPlugin.sendMessage tests: short text, chunked text, error path.
 * tmi.js mocked with a hand-rolled EventEmitter.
 */

import { EventEmitter } from 'node:events';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig, IUnifiedOutgoingMessage } from '@process/channels/types';

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

function outgoing(text: string): IUnifiedOutgoingMessage {
  return { type: 'text', text };
}

beforeEach(() => {
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
  mockTmiInstance.say.mockResolvedValue(['']);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TwitchPlugin.sendMessage - short text', () => {
  it('calls client.say once for a short message and returns a stable id', async () => {
    const plugin = new TwitchPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();

    const id = await plugin.sendMessage('mychannel', outgoing('Hello Twitch!'));

    expect(mockTmiInstance.say).toHaveBeenCalledOnce();
    expect(mockTmiInstance.say).toHaveBeenCalledWith('mychannel', 'Hello Twitch!');
    expect(id).toMatch(/^twitch:mychannel:\d+$/);

    await plugin.stop();
  });

  it('normalises chatId with # prefix before sending', async () => {
    const plugin = new TwitchPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();

    await plugin.sendMessage('#mychannel', outgoing('test'));
    expect(mockTmiInstance.say).toHaveBeenCalledWith('mychannel', 'test');

    await plugin.stop();
  });
});

describe('TwitchPlugin.sendMessage - chunked text', () => {
  it('calls client.say multiple times for text exceeding 500 chars', async () => {
    const plugin = new TwitchPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();

    // ~750 chars of words - will chunk into 2 messages of ≤500 chars each.
    const longText = 'word '.repeat(150).trimEnd();
    await plugin.sendMessage('mychannel', outgoing(longText));

    expect(mockTmiInstance.say.mock.calls.length).toBeGreaterThan(1);
    for (const [, msg] of mockTmiInstance.say.mock.calls as [string, string][]) {
      expect(msg.length).toBeLessThanOrEqual(500);
    }

    await plugin.stop();
  });
});

describe('TwitchPlugin.sendMessage - empty text', () => {
  it('returns empty string and does not call say for blank message', async () => {
    const plugin = new TwitchPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();

    const id = await plugin.sendMessage('mychannel', outgoing(''));
    expect(mockTmiInstance.say).not.toHaveBeenCalled();
    expect(id).toBe('');

    await plugin.stop();
  });
});

describe('TwitchPlugin.sendMessage - not connected', () => {
  it('throws when client is null (not started)', async () => {
    const plugin = new TwitchPlugin();
    await plugin.initialize(makeConfig());
    // Do NOT start - client stays null.
    await expect(plugin.sendMessage('mychannel', outgoing('hi'))).rejects.toThrow(/not connected/i);
  });
});

describe('TwitchPlugin.sendMessage - say() failure propagates', () => {
  it('throws when tmi say() rejects', async () => {
    const plugin = new TwitchPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();

    mockTmiInstance.say.mockRejectedValue(new Error('No permission to send'));
    await expect(plugin.sendMessage('mychannel', outgoing('hello'))).rejects.toThrow(/no permission/i);

    await plugin.stop();
  });
});

describe('TwitchPlugin.sendMessage - markdown stripping', () => {
  it('sends plain text when message contains markdown', async () => {
    const plugin = new TwitchPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();

    await plugin.sendMessage('mychannel', outgoing('**bold** and *italic*'));
    expect(mockTmiInstance.say).toHaveBeenCalledWith('mychannel', 'bold and italic');

    await plugin.stop();
  });
});
