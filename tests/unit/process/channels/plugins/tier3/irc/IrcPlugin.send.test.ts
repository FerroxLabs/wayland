/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for IrcPlugin.sendMessage - single line, multi-line chunking,
 * error when not connected, and inbound message emission.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';
import { IRC_MESSAGE_CHUNK_CHARS } from '@process/channels/plugins/tier3/irc/IrcAdapter';

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

function makeConfig(): IChannelPluginConfig {
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
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

async function startPlugin(): Promise<IrcPlugin> {
  const plugin = new IrcPlugin();
  await plugin.initialize(makeConfig());
  await plugin.start();
  return plugin;
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

describe('IrcPlugin.sendMessage - happy paths', () => {
  it('sends a short message via client.say and returns a stable message id', async () => {
    const plugin = await startPlugin();
    const id = await plugin.sendMessage('#wayland-bots', { type: 'text', text: 'hello' });
    expect(mockClientInstance.say).toHaveBeenCalledWith('#wayland-bots', 'hello');
    expect(typeof id).toBe('string');
    expect(id.startsWith('irc:#wayland-bots:')).toBe(true);
    await plugin.stop();
  });

  it('sends each chunk separately for long messages', async () => {
    const plugin = await startPlugin();
    const longText = 'word '.repeat(Math.ceil((IRC_MESSAGE_CHUNK_CHARS * 2) / 5)).trimEnd();
    await plugin.sendMessage('#wayland-bots', { type: 'text', text: longText });
    expect(mockClientInstance.say.mock.calls.length).toBeGreaterThan(1);
    for (const [target, line] of mockClientInstance.say.mock.calls as [string, string][]) {
      expect(target).toBe('#wayland-bots');
      expect((line as string).length).toBeLessThanOrEqual(IRC_MESSAGE_CHUNK_CHARS);
    }
    await plugin.stop();
  });

  it('returns an empty string for a blank message', async () => {
    const plugin = await startPlugin();
    const id = await plugin.sendMessage('#wayland-bots', { type: 'text', text: '' });
    expect(id).toBe('');
    expect(mockClientInstance.say).not.toHaveBeenCalled();
    await plugin.stop();
  });

  it('sends to a direct-message target (nick)', async () => {
    const plugin = await startPlugin();
    await plugin.sendMessage('alice', { type: 'text', text: 'hi alice' });
    expect(mockClientInstance.say).toHaveBeenCalledWith('alice', 'hi alice');
    await plugin.stop();
  });
});

describe('IrcPlugin.sendMessage - error when not connected', () => {
  it('throws when the client is disconnected', async () => {
    const plugin = await startPlugin();
    mockClientInstance.connected = false;
    await expect(
      plugin.sendMessage('#wayland-bots', { type: 'text', text: 'hello' }),
    ).rejects.toThrow(/not connected/i);
    await plugin.stop();
  });
});

describe('IrcPlugin inbound message emission', () => {
  it('emits a unified message when a PRIVMSG arrives on the plugin', async () => {
    const plugin = await startPlugin();

    const received: unknown[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg);
    });

    mockClientInstance.emit('privmsg', {
      nick: 'alice',
      ident: 'alice',
      hostname: 'example.com',
      target: '#wayland-bots',
      message: 'hello from IRC',
    });

    await new Promise((r) => setTimeout(r, 0));

    expect(received.length).toBe(1);
    const msg = received[0] as { platform: string; content: { text: string }; chatId: string };
    expect(msg.platform).toBe('irc');
    expect(msg.content.text).toBe('hello from IRC');
    expect(msg.chatId).toBe('#wayland-bots');

    await plugin.stop();
  });

  it('does not emit messages from our own nick', async () => {
    const plugin = await startPlugin();

    const received: unknown[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg);
    });

    mockClientInstance.emit('privmsg', {
      nick: 'wayland-bot',
      target: '#wayland-bots',
      message: 'self-echo',
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(received.length).toBe(0);

    await plugin.stop();
  });

  it('tracks senders in the active user set', async () => {
    const plugin = await startPlugin();
    plugin.onMessage(async () => undefined);

    expect(plugin.getActiveUserCount()).toBe(0);

    mockClientInstance.emit('privmsg', {
      nick: 'alice',
      target: '#wayland-bots',
      message: 'hi',
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(plugin.getActiveUserCount()).toBe(1);

    await plugin.stop();
  });
});

// ── HIGH fix: chatId CRLF injection ──────────────────────────────────────────
describe('IrcPlugin.sendMessage - target sanitisation', () => {
  it('throws if chatId contains CRLF + smuggled IRC command', async () => {
    const plugin = await startPlugin();
    await expect(
      plugin.sendMessage('#wayland-bots\r\nQUIT', { type: 'text', text: 'pwn' }),
    ).rejects.toThrow(/Invalid IRC target/);
    expect(mockClientInstance.say).not.toHaveBeenCalled();
    await plugin.stop();
  });

  it('throws for target with whitespace', async () => {
    const plugin = await startPlugin();
    await expect(
      plugin.sendMessage('#wayland bots', { type: 'text', text: 'hello' }),
    ).rejects.toThrow(/Invalid IRC target/);
    await plugin.stop();
  });

  it('throws for target with embedded colon', async () => {
    const plugin = await startPlugin();
    await expect(
      plugin.sendMessage('#bad:target', { type: 'text', text: 'hello' }),
    ).rejects.toThrow(/Invalid IRC target/);
    await plugin.stop();
  });

  it('throws for empty target', async () => {
    const plugin = await startPlugin();
    await expect(plugin.sendMessage('', { type: 'text', text: 'hello' })).rejects.toThrow(
      /required/,
    );
    await plugin.stop();
  });
});

// ── HIGH fix: NOTICE handling ────────────────────────────────────────────────
describe('IrcPlugin inbound NOTICE handling', () => {
  it('emits NOTICE messages with a [NOTICE] prefix', async () => {
    const plugin = await startPlugin();
    const received: unknown[] = [];
    plugin.onMessage(async (m) => {
      received.push(m);
    });

    mockClientInstance.emit('notice', {
      nick: 'ChanServ',
      ident: 'ChanServ',
      hostname: 'services.libera.chat',
      target: '#wayland-bots',
      message: 'You are now identified.',
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(received.length).toBe(1);
    const m = received[0] as { content: { type: string; text: string } };
    expect(m.content.type).toBe('text');
    expect(m.content.text).toBe('[NOTICE] You are now identified.');
    await plugin.stop();
  });

  it('skips server-numeric NOTICEs (no ident/hostname)', async () => {
    const plugin = await startPlugin();
    const received: unknown[] = [];
    plugin.onMessage(async (m) => {
      received.push(m);
    });

    mockClientInstance.emit('notice', {
      nick: 'irc.libera.chat',
      target: 'wayland-bot',
      message: '*** Looking up your hostname...',
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(received.length).toBe(0);
    await plugin.stop();
  });

  it('skips NOTICE echoes from our own nick', async () => {
    const plugin = await startPlugin();
    const received: unknown[] = [];
    plugin.onMessage(async (m) => {
      received.push(m);
    });

    mockClientInstance.emit('notice', {
      nick: 'wayland-bot',
      ident: 'wayland-bot',
      hostname: 'example.com',
      target: '#wayland-bots',
      message: 'self-notice',
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(received.length).toBe(0);
    await plugin.stop();
  });
});
