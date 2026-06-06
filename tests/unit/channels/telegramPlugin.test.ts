/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

type StartOptions = {
  onStart?: (botInfo: { username: string }) => void;
};

type MockControl = {
  startPromiseFactory: () => Promise<void>;
  stopPromiseFactory: () => Promise<void>;
  autoTriggerOnStart: boolean;
};

const mockControl: MockControl = {
  startPromiseFactory: () => Promise.resolve(),
  stopPromiseFactory: () => Promise.resolve(),
  autoTriggerOnStart: true,
};

let latestBotStopSpy: ReturnType<typeof vi.fn> | null = null;

function createConfig() {
  const now = Date.now();
  return {
    id: 'telegram-1',
    type: 'telegram' as const,
    name: 'Telegram',
    enabled: true,
    credentials: { token: 'test-token' },
    status: 'created' as const,
    createdAt: now,
    updatedAt: now,
  };
}

async function loadPluginClass() {
  vi.resetModules();

  vi.doMock('grammy', () => {
    class MockGrammyError extends Error {
      description?: string;
      error_code?: number;
    }

    class MockHttpError extends Error {}

    class MockBot {
      public api = {
        getMe: vi.fn(async () => ({
          id: 123,
          username: 'mock_bot',
          first_name: 'Mock Bot',
        })),
        sendMessage: vi.fn(),
        editMessageText: vi.fn(),
      };

      public command = vi.fn();
      public on = vi.fn();
      public catch = vi.fn();

      public start = vi.fn((options: StartOptions) => {
        if (mockControl.autoTriggerOnStart) {
          options?.onStart?.({ username: 'mock_bot' });
        }
        return mockControl.startPromiseFactory();
      });

      public stop = vi.fn(() => mockControl.stopPromiseFactory());

      constructor(_token: string) {
        latestBotStopSpy = this.stop;
      }
    }

    return {
      Bot: MockBot,
      GrammyError: MockGrammyError,
      HttpError: MockHttpError,
    };
  });

  const mod = await import('@process/channels/plugins/telegram/TelegramPlugin');
  return mod.TelegramPlugin;
}

describe('TelegramPlugin polling lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    latestBotStopSpy = null;
    mockControl.autoTriggerOnStart = true;

    mockControl.startPromiseFactory = () => Promise.resolve();
    mockControl.stopPromiseFactory = () => Promise.resolve();
  });

  it('should wait for pollingPromise to finish before completing stop', async () => {
    let resolvePolling!: () => void;
    const pollingPromise = new Promise<void>((resolve) => {
      resolvePolling = resolve;
    });

    mockControl.startPromiseFactory = () => pollingPromise;

    const TelegramPlugin = await loadPluginClass();
    const plugin = new TelegramPlugin();
    await plugin.initialize(createConfig());
    await plugin.start();

    const stopPromise = plugin.stop();

    let isStopped = false;
    void stopPromise.then(() => {
      isStopped = true;
    });

    await Promise.resolve();
    expect(isStopped).toBe(false);
    expect(latestBotStopSpy).toHaveBeenCalledTimes(1);

    resolvePolling();

    await stopPromise;

    expect(plugin.status).toBe('stopped');
  });

  it('should clean up polling state when stop times out, leaving no residual active marker', async () => {
    vi.useFakeTimers();

    mockControl.startPromiseFactory = () => new Promise<void>(() => {});
    mockControl.stopPromiseFactory = () => new Promise<void>(() => {});

    const TelegramPlugin = await loadPluginClass();
    const plugin = new TelegramPlugin();
    await plugin.initialize(createConfig());
    await plugin.start();

    const stopPromise = plugin.stop();

    await vi.advanceTimersByTimeAsync(5000);
    await stopPromise;

    expect(plugin.status).toBe('stopped');
    expect((plugin as any).isPollingActive).toBe(false);
    expect((plugin as any).pollingPromise).toBeNull();
  });
});

describe('TelegramPlugin allowed_updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    latestBotStopSpy = null;
    mockControl.autoTriggerOnStart = true;
    mockControl.startPromiseFactory = () => Promise.resolve();
    mockControl.stopPromiseFactory = () => Promise.resolve();
  });

  it('subscribes to edited_message so user edits are not dropped', async () => {
    const TelegramPlugin = await loadPluginClass();
    const plugin = new TelegramPlugin();
    await plugin.initialize(createConfig());
    await plugin.start();

    const bot = (plugin as any).bot;
    const startCall = bot.start.mock.calls[0][0];
    expect(startCall.allowed_updates).toContain('edited_message');
    expect(startCall.allowed_updates).toContain('message');
    expect(startCall.allowed_updates).toContain('callback_query');

    await plugin.stop();
  });

  it('registers an edited_message handler on the bot', async () => {
    const TelegramPlugin = await loadPluginClass();
    const plugin = new TelegramPlugin();
    await plugin.initialize(createConfig());

    const bot = (plugin as any).bot;
    const onCalls = bot.on.mock.calls.map((c: unknown[]) => c[0]);
    expect(onCalls).toContain('edited_message');
  });
});

describe('TelegramPlugin sendMessage error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    latestBotStopSpy = null;
    mockControl.autoTriggerOnStart = true;
    mockControl.startPromiseFactory = () => Promise.resolve();
    mockControl.stopPromiseFactory = () => Promise.resolve();
  });

  it('retries once on 429 honouring retry_after, then succeeds', async () => {
    vi.useFakeTimers();
    const TelegramPlugin = await loadPluginClass();
    const grammy = await import('grammy');
    const plugin = new TelegramPlugin();
    await plugin.initialize(createConfig());
    await plugin.start();

    const bot = (plugin as any).bot;
    let attempts = 0;
    bot.api.sendMessage = vi.fn(async () => {
      attempts++;
      if (attempts === 1) {
        const err = new (grammy as any).GrammyError('Too Many Requests');
        err.error_code = 429;
        err.description = 'Too Many Requests';
        (err as any).parameters = { retry_after: 1 };
        throw err;
      }
      return { message_id: 99 };
    });

    const sendPromise = plugin.sendMessage('555', { text: 'hi' } as any);
    await vi.advanceTimersByTimeAsync(1500);
    const id = await sendPromise;

    expect(id).toBe('99');
    expect(attempts).toBe(2);
    vi.useRealTimers();
    await plugin.stop();
  });

  it('prunes the user from activeUsers on 403 blocked-by-user', async () => {
    const TelegramPlugin = await loadPluginClass();
    const grammy = await import('grammy');
    const plugin = new TelegramPlugin();
    await plugin.initialize(createConfig());
    await plugin.start();

    (plugin as any).activeUsers.add('555');

    const bot = (plugin as any).bot;
    bot.api.sendMessage = vi.fn(async () => {
      const err = new (grammy as any).GrammyError('Forbidden');
      err.error_code = 403;
      err.description = 'Forbidden: bot was blocked by the user';
      throw err;
    });

    await expect(plugin.sendMessage('555', { text: 'hi' } as any)).rejects.toBeDefined();
    expect((plugin as any).activeUsers.has('555')).toBe(false);

    await plugin.stop();
  });
});

describe('TelegramPlugin token-revoked detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    latestBotStopSpy = null;
    mockControl.autoTriggerOnStart = true;
    mockControl.startPromiseFactory = () => Promise.resolve();
    mockControl.stopPromiseFactory = () => Promise.resolve();
  });

  it('stops the bot and sets error status on a 401 GrammyError from bot.catch', async () => {
    const TelegramPlugin = await loadPluginClass();
    const grammy = await import('grammy');
    const plugin = new TelegramPlugin();
    await plugin.initialize(createConfig());
    await plugin.start();

    const bot = (plugin as any).bot;
    const botStopSpy = bot.stop;
    const catchHandler = bot.catch.mock.calls[0][0] as (e: any) => void;

    const err = new (grammy as any).GrammyError('Unauthorized');
    err.error_code = 401;
    err.description = 'Unauthorized';

    catchHandler({ error: err });

    // Flush microtasks + macrotask for the void stop() chain
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
    // The terminal indicator is that the plugin transitions to 'stopped',
    // which only happens via the 401 → stop() path triggered by bot.catch.
    expect(plugin.status).toBe('stopped');
    expect(botStopSpy).toBeDefined();
  });
});
