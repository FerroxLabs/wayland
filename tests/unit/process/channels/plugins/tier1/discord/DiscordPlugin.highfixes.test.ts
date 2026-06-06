/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted, so any references it makes must live inside vi.hoisted.
// The plugin only touches a tiny slice of the Client surface (login, destroy,
// user, channels.fetch, on, rest.on), so faking that slice is sufficient.
const mocks = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void;

  class FakeREST {
    private handlers: Map<string, Handler[]> = new Map();
    on(event: string, fn: Handler): this {
      const arr = this.handlers.get(event) ?? [];
      arr.push(fn);
      this.handlers.set(event, arr);
      return this;
    }
    emit(event: string, payload: unknown): void {
      for (const fn of this.handlers.get(event) ?? []) fn(payload);
    }
  }

  class FakeClient {
    static instances: FakeClient[] = [];
    static loginBehavior: (token: string) => Promise<void> = async () => {};
    static usernameAfterLogin: string | undefined = 'probe-bot';

    public rest = new FakeREST();
    public user: { id: string; username: string; globalName: string | null } | null = null;
    public destroyed = false;
    public loginCalls: string[] = [];
    public receivedIntents: number[];
    private handlers: Map<string, Handler[]> = new Map();
    public channels = { fetch: () => Promise.resolve(null) };

    constructor(opts: { intents?: number[] } = {}) {
      this.receivedIntents = opts.intents ?? [];
      FakeClient.instances.push(this);
    }

    on(event: string, fn: Handler): this {
      const arr = this.handlers.get(event) ?? [];
      arr.push(fn);
      this.handlers.set(event, arr);
      return this;
    }

    emit(event: string, ...args: unknown[]): void {
      for (const fn of this.handlers.get(event) ?? []) fn(...args);
    }

    async login(token: string): Promise<string> {
      this.loginCalls.push(token);
      await FakeClient.loginBehavior(token);
      if (FakeClient.usernameAfterLogin) {
        this.user = { id: 'bot-id', username: FakeClient.usernameAfterLogin, globalName: null };
      }
      return token;
    }

    async destroy(): Promise<void> {
      this.destroyed = true;
    }
  }

  return { FakeClient };
});

vi.mock('discord.js', () => ({
  Client: mocks.FakeClient,
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
    GuildMessageReactions: 3,
    GuildMessageTyping: 4,
    GuildMembers: 5,
    GuildVoiceStates: 6,
    DirectMessages: 7,
    DirectMessageReactions: 8,
    DirectMessageTyping: 9,
    MessageContent: 10,
  },
  Partials: { Channel: 1, Message: 2, Reaction: 3, User: 4 },
}));

import { DiscordPlugin } from '@process/channels/plugins/tier1/discord/DiscordPlugin';

const FakeClient = mocks.FakeClient;

beforeEach(() => {
  FakeClient.instances = [];
  FakeClient.loginBehavior = async () => {};
  FakeClient.usernameAfterLogin = 'probe-bot';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DiscordPlugin.testConnection - F-1/F-4 privileged intents alignment', () => {
  it('requests the privileged intent set used by production (MessageContent + GuildMembers)', async () => {
    const result = await DiscordPlugin.testConnection('valid-token');
    expect(result.success).toBe(true);
    expect(result.botUsername).toBe('probe-bot');
    const probe = FakeClient.instances[0];
    expect(probe).toBeDefined();
    expect(probe.receivedIntents).toContain(5); // GuildMembers (privileged)
    expect(probe.receivedIntents).toContain(10); // MessageContent (privileged)
    expect(probe.destroyed).toBe(true);
  });

  it('surfaces an actionable message when the Developer Portal toggles are off (disallowed intents)', async () => {
    FakeClient.loginBehavior = async () => {
      throw new Error('Used disallowed intents');
    };
    const result = await DiscordPlugin.testConnection('valid-but-locked-token');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Privileged intents not enabled/i);
    expect(result.error).toMatch(/Message Content Intent/i);
    expect(result.error).toMatch(/Server Members Intent/i);
  });

  it('still translates plain invalid-token errors', async () => {
    FakeClient.loginBehavior = async () => {
      throw new Error('TokenInvalid: bad token format');
    };
    const result = await DiscordPlugin.testConnection('garbage');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid Discord bot token');
  });
});

describe('DiscordPlugin runtime - F-13 token-invalidated recovery', () => {
  it('transitions to error + clears client when Gateway emits `invalidated`', async () => {
    const plugin = new DiscordPlugin({ id: 'discord_default', type: 'discord' });
    await plugin.initialize({ credentials: { botToken: 'tok-1' } });
    await plugin.start();
    const runtimeClient = plugin.getClient() as unknown as InstanceType<typeof FakeClient>;
    expect(runtimeClient).not.toBeNull();
    expect(plugin.getBotInfo()).not.toBeNull();

    runtimeClient.emit('invalidated');

    expect(plugin.status).toBe('error');
    expect(plugin.error).toMatch(/invalidated/i);
    expect(plugin.error).toMatch(/paste the new token/i);
    expect(plugin.getBotInfo()).toBeNull();
    expect(plugin.getClient()).toBeNull();
    expect(runtimeClient.destroyed).toBe(true);
  });
});

describe('DiscordPlugin runtime - F-12 rate-limit backpressure surfacing', () => {
  it('counts and logs `rateLimited` events emitted by discord.js REST', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const plugin = new DiscordPlugin({ id: 'discord_default', type: 'discord' });
    await plugin.initialize({ credentials: { botToken: 'tok-2' } });
    await plugin.start();

    const runtimeClient = plugin.getClient() as unknown as InstanceType<typeof FakeClient>;
    expect(plugin.getRateLimitStats().events).toBe(0);

    runtimeClient.rest.emit('rateLimited', {
      route: '/channels/123/messages',
      method: 'POST',
      timeToReset: 1500,
      global: false,
    });
    runtimeClient.rest.emit('rateLimited', {
      route: '/guilds/9/members',
      method: 'GET',
      timeToReset: 8000,
      global: true,
    });

    const stats = plugin.getRateLimitStats();
    expect(stats.events).toBe(2);
    expect(stats.lastAt).not.toBeNull();
    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[0][0])).toMatch(/Rate-limited \(route\) POST/);
    expect(String(warn.mock.calls[1][0])).toMatch(/Rate-limited \(GLOBAL\) GET/);
  });
});
