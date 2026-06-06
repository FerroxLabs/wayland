import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IChannelPluginConfig } from '@process/channels/types';
import { extractChannelSendProtocol } from '@process/channels/utils';
import type { MonitorOptions } from '@process/channels/plugins/weixin/WeixinMonitor';
import os from 'os';
import path from 'path';
import fs from 'fs';

let mockStartFn = vi.fn();

const TEST_DATA_DIR = path.join(os.tmpdir(), 'wayland-test-weixin');

async function loadPluginClass() {
  vi.resetModules();
  vi.doMock('@process/channels/plugins/weixin/WeixinMonitor', () => ({
    startMonitor: (...args: unknown[]) => mockStartFn(...args),
  }));
  vi.doMock('@/common/platform', () => ({
    getPlatformServices: () => ({
      paths: {
        getDataDir: () => TEST_DATA_DIR,
      },
    }),
  }));
  const mod = await import('@process/channels/plugins/weixin/WeixinPlugin');
  return mod.WeixinPlugin;
}

function createConfig(overrides?: Partial<IChannelPluginConfig['credentials']>): IChannelPluginConfig {
  const now = Date.now();
  return {
    id: 'weixin-1',
    type: 'weixin' as const,
    name: 'WeChat',
    enabled: true,
    credentials: {
      accountId: 'user_test123',
      botToken: 'tok_abc',
      baseUrl: 'https://ilinkai.weixin.qq.com',
      ...overrides,
    },
    status: 'created' as const,
    createdAt: now,
    updatedAt: now,
  };
}

describe('WeixinPlugin - initialization', () => {
  it('enters error state when credentials are missing', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await expect(plugin.initialize(createConfig({ accountId: '', botToken: '' }))).rejects.toThrow();
    expect(plugin.status).toBe('error');
  });

  it('enters ready state with valid credentials', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());
    expect(plugin.status).toBe('ready');
  });
});

describe('Weixin channel send protocol', () => {
  it('extracts valid protocol blocks and keeps invalid blocks visible', () => {
    const parsed = extractChannelSendProtocol(`Done

[WAYLAND_CHANNEL_SEND]
{"type":"image","path":"./chart.png","caption":"Chart"}
[/WAYLAND_CHANNEL_SEND]

[WAYLAND_CHANNEL_SEND]
not-json
[/WAYLAND_CHANNEL_SEND]`);

    expect(parsed.visibleText).toContain('Done');
    expect(parsed.visibleText).toContain('not-json');
    expect(parsed.actions).toEqual([{ type: 'image', path: './chart.png', caption: 'Chart' }]);
  });
});

describe('WeixinPlugin - Promise bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStartFn = vi.fn(); // void return - no promise needed
  });

  it('emits unified message and resolves via editMessage with replyMarkup', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());

    const received: unknown[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg);
      const msgId = await plugin.sendMessage(msg.chatId, { type: 'text', text: 'partial' });
      await plugin.editMessage(msg.chatId, msgId, {
        type: 'text',
        text: 'Final answer',
        replyMarkup: { done: true },
      });
    });

    await plugin.start();

    const { agent } = mockStartFn.mock.calls[0][0] as MonitorOptions;
    const chatPromise = agent.chat({ conversationId: 'user_abc', text: 'Hello' });

    await new Promise((r) => setTimeout(r, 20));

    const response = await chatPromise;
    expect(response.text).toBe('Final answer');
    expect(response.mediaActions).toEqual([]);
    expect(received).toHaveLength(1);
  });

  it('accumulates text across multiple editMessage calls', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());

    plugin.onMessage(async (msg) => {
      const msgId = await plugin.sendMessage(msg.chatId, { type: 'text' });
      await plugin.editMessage(msg.chatId, msgId, { type: 'text', text: 'chunk 1' });
      await plugin.editMessage(msg.chatId, msgId, { type: 'text', text: 'chunk 1 chunk 2' });
      await plugin.editMessage(msg.chatId, msgId, {
        type: 'text',
        text: 'final complete text',
        replyMarkup: {},
      });
    });

    await plugin.start();
    const { agent } = mockStartFn.mock.calls[0][0] as MonitorOptions;
    const response = await agent.chat({ conversationId: 'user_abc', text: 'hi' });
    expect(response.text).toBe('final complete text');
  });

  it('sends completed text drafts through injected sendTextNow without duplicating final response text', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());

    const sentNow: string[] = [];
    plugin.onMessage(async (msg) => {
      const firstMsgId = await plugin.sendMessage(msg.chatId, { type: 'text', text: '⏳ Thinking...' });
      await plugin.editMessage(msg.chatId, firstMsgId, { type: 'text', text: 'first draft' });
      await plugin.editMessage(msg.chatId, firstMsgId, { type: 'text', text: 'first final' });

      const secondMsgId = await plugin.sendMessage(msg.chatId, { type: 'text', text: 'second draft' });
      await plugin.editMessage(msg.chatId, secondMsgId, {
        type: 'text',
        text: 'second final',
        replyMarkup: {},
      });
    });

    await plugin.start();
    const { agent } = mockStartFn.mock.calls[0][0] as MonitorOptions;
    const response = await agent.chat({
      conversationId: 'user_abc',
      text: 'hi',
      sendTextNow: async (text) => {
        sentNow.push(text);
      },
    });

    expect(sentNow).toEqual(['first final', 'second final']);
    expect(response.text).toBeUndefined();
  });

  it('does not send duplicate messages for updates within one text draft', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());

    const sentNow: string[] = [];
    plugin.onMessage(async (msg) => {
      const msgId = await plugin.sendMessage(msg.chatId, { type: 'text', text: '⏳ Thinking...' });
      await plugin.editMessage(msg.chatId, msgId, { type: 'text', text: 'partial' });
      await plugin.editMessage(msg.chatId, msgId, { type: 'text', text: 'complete' });
      await plugin.editMessage(msg.chatId, msgId, { type: 'text', text: 'complete', replyMarkup: {} });
    });

    await plugin.start();
    const { agent } = mockStartFn.mock.calls[0][0] as MonitorOptions;
    await agent.chat({
      conversationId: 'user_abc',
      text: 'hi',
      sendTextNow: async (text) => {
        sentNow.push(text);
      },
    });

    expect(sentNow).toEqual(['complete']);
  });

  it('does not send the thinking placeholder when a draft is flushed explicitly', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());

    const sentNow: string[] = [];
    plugin.onMessage(async (msg) => {
      const msgId = await plugin.sendMessage(msg.chatId, { type: 'text', text: '⏳ Thinking...' });
      await plugin.flushTextDraft(msg.chatId);
      await plugin.editMessage(msg.chatId, msgId, {
        type: 'text',
        text: 'real answer',
        replyMarkup: {},
      });
    });

    await plugin.start();
    const { agent } = mockStartFn.mock.calls[0][0] as MonitorOptions;
    const response = await agent.chat({
      conversationId: 'user_abc',
      text: 'hi',
      sendTextNow: async (text) => {
        sentNow.push(text);
      },
    });

    expect(sentNow).toEqual(['real answer']);
    expect(response.text).toBeUndefined();
  });

  it('sends legitimate assistant text that begins with the thinking placeholder literal', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());

    const sentNow: string[] = [];
    plugin.onMessage(async (msg) => {
      const msgId = await plugin.sendMessage(msg.chatId, { type: 'text', text: '⏳ Thinking...' });
      await plugin.editMessage(msg.chatId, msgId, {
        type: 'text',
        text: '⏳ Thinking... is the literal text you asked me to print.',
        replyMarkup: {},
      });
    });

    await plugin.start();
    const { agent } = mockStartFn.mock.calls[0][0] as MonitorOptions;
    const response = await agent.chat({
      conversationId: 'user_abc',
      text: 'hi',
      sendTextNow: async (text) => {
        sentNow.push(text);
      },
    });

    expect(sentNow).toEqual(['⏳ Thinking... is the literal text you asked me to print.']);
    expect(response.text).toBeUndefined();
  });

  it('flushes an assistant text draft before a silent intermediate event', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());

    const sentNow: string[] = [];
    plugin.onMessage(async (msg) => {
      const msgId = await plugin.sendMessage(msg.chatId, { type: 'text', text: '⏳ Thinking...' });
      await plugin.editMessage(msg.chatId, msgId, {
        type: 'text',
        text: '好，我来做几个基础操作。',
      });
      await plugin.flushTextDraft(msg.chatId);
      await plugin.editMessage(msg.chatId, msgId, {
        type: 'text',
        text: '操作完成。',
        replyMarkup: {},
      });
    });

    await plugin.start();
    const { agent } = mockStartFn.mock.calls[0][0] as MonitorOptions;
    const response = await agent.chat({
      conversationId: 'user_abc',
      text: 'hi',
      sendTextNow: async (text) => {
        sentNow.push(text);
      },
    });

    expect(sentNow).toEqual(['好，我来做几个基础操作。', '操作完成。']);
    expect(response.text).toBeUndefined();
  });

  it('does not resend an already flushed draft when finalization repeats the same text', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());

    const sentNow: string[] = [];
    plugin.onMessage(async (msg) => {
      const msgId = await plugin.sendMessage(msg.chatId, { type: 'text', text: '⏳ Thinking...' });
      await plugin.editMessage(msg.chatId, msgId, {
        type: 'text',
        text: '好，我来做几个基础操作。',
      });
      await plugin.flushTextDraft(msg.chatId);
      await plugin.editMessage(msg.chatId, msgId, {
        type: 'text',
        text: '好，我来做几个基础操作。',
        replyMarkup: {},
      });
    });

    await plugin.start();
    const { agent } = mockStartFn.mock.calls[0][0] as MonitorOptions;
    const response = await agent.chat({
      conversationId: 'user_abc',
      text: 'hi',
      sendTextNow: async (text) => {
        sentNow.push(text);
      },
    });

    expect(sentNow).toEqual(['好，我来做几个基础操作。']);
    expect(response.text).toBeUndefined();
  });

  it('resolves mediaActions even when final visible text is empty', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());

    plugin.onMessage(async (msg) => {
      const msgId = await plugin.sendMessage(msg.chatId, { type: 'text', text: 'working' });
      await plugin.editMessage(msg.chatId, msgId, {
        type: 'text',
        text: '',
        mediaActions: [{ type: 'file', path: '/tmp/report.pdf', fileName: 'report.pdf' }],
        replyMarkup: {},
      });
    });

    await plugin.start();
    const { agent } = mockStartFn.mock.calls[0][0] as MonitorOptions;
    const response = await agent.chat({ conversationId: 'user_abc', text: 'hi' });

    expect(response.text).toBeUndefined();
    expect(response.mediaActions).toEqual([{ type: 'file', path: '/tmp/report.pdf', fileName: 'report.pdf' }]);
  });

  it('rejects superseded Promise when second chat arrives before first resolves', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());
    plugin.onMessage(async () => {
      await new Promise(() => {});
    });
    await plugin.start();

    const { agent } = mockStartFn.mock.calls[0][0] as MonitorOptions;
    const first = agent.chat({ conversationId: 'user_abc', text: 'first' });
    await new Promise((r) => setTimeout(r, 0));

    const second = agent.chat({ conversationId: 'user_abc', text: 'second' });
    await expect(first).rejects.toThrow('superseded');

    const msgId = await plugin.sendMessage('user_abc', { type: 'text' });
    await plugin.editMessage('user_abc', msgId, { type: 'text', text: 'ok', replyMarkup: {} });
    await expect(second).resolves.toBeDefined();
  });

  it('rejects all pending on stop', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());
    plugin.onMessage(async () => {
      await new Promise(() => {});
    });
    await plugin.start();

    const { agent } = mockStartFn.mock.calls[0][0] as MonitorOptions;
    const chatPromise = agent.chat({ conversationId: 'user_abc', text: 'hi' });
    await new Promise((r) => setTimeout(r, 0));

    await plugin.stop();
    await expect(chatPromise).rejects.toThrow('Plugin stopped');
  });

  it('times out after 5 minutes', async () => {
    vi.useFakeTimers();
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());
    plugin.onMessage(async () => {
      await new Promise(() => {});
    });
    await plugin.start();

    const { agent } = mockStartFn.mock.calls[0][0] as MonitorOptions;
    const chatPromise = agent.chat({ conversationId: 'user_abc', text: 'hi' });
    await Promise.resolve();

    const assertion = expect(chatPromise).rejects.toThrow('Response timeout');
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 100);
    await assertion;
    vi.useRealTimers();
  });

  it('rejects immediately when _stopping is true', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    await plugin.initialize(createConfig());
    plugin.onMessage(async () => {});
    await plugin.start();
    await plugin.stop();

    const { agent } = mockStartFn.mock.calls[0][0] as MonitorOptions;
    await expect(agent.chat({ conversationId: 'u', text: 'hi' })).rejects.toThrow('Plugin stopped');
  });
});

describe('WeixinPlugin - testConnection', () => {
  it('returns false when buf file does not exist (legacy no-token path)', async () => {
    const WeixinPlugin = await loadPluginClass();
    const result = await WeixinPlugin.testConnection('nonexistent_account_id_xyz');
    expect(result.success).toBe(false);
  });

  it('returns true when buf file exists (legacy no-token path)', async () => {
    const WeixinPlugin = await loadPluginClass();
    const monitorDir = path.join(TEST_DATA_DIR, 'weixin-monitor');
    fs.mkdirSync(monitorDir, { recursive: true });
    const bufFile = path.join(monitorDir, 'test_acc_valid.buf');
    fs.writeFileSync(bufFile, 'some-buf-value');

    const result = await WeixinPlugin.testConnection('test_acc_valid');
    expect(result.success).toBe(true);

    fs.unlinkSync(bufFile);
  });

  // Audit HIGH-1 / CRIT-10: real token validation via the iLink API,
  // not a stale `.buf` file probe that ignored botToken entirely.
  it('issues an authenticated getupdates probe when botToken is supplied', async () => {
    const WeixinPlugin = await loadPluginClass();
    const fetchCalls: Array<{ url: string; init: RequestInit | undefined }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        fetchCalls.push({ url, init });
        return { ok: true, json: async () => ({ ret: 0 }) } as Response;
      })
    );

    const result = await WeixinPlugin.testConnection('acct_live', 'tok_live');

    expect(result.success).toBe(true);
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]?.url).toContain('ilink/bot/getupdates');
    const headers = (fetchCalls[0]?.init?.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok_live');
    expect(headers.AuthorizationType).toBe('ilink_bot_token');
    expect(headers['X-WECHAT-UIN']).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it('treats non-zero ret as a failed connection test', async () => {
    const WeixinPlugin = await loadPluginClass();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ret: 401, errmsg: 'invalid token' }),
      } as Response)
    );

    const result = await WeixinPlugin.testConnection('acct_bad', 'tok_revoked');

    expect(result.success).toBe(false);
    expect(result.error).toContain('invalid token');
    vi.unstubAllGlobals();
  });
});

describe('WeixinPlugin - capability flags', () => {
  // Audit HIGH-2: TypingManager is actively wired in WeixinMonitor;
  // the capability flag must match.
  it('declares canTypingIndicator: true to match the live TypingManager wiring', async () => {
    const WeixinPlugin = await loadPluginClass();
    const plugin = new WeixinPlugin();
    expect(plugin.capabilities.canTypingIndicator).toBe(true);
  });
});

describe('WeixinPlugin - WeChat UIN persistence', () => {
  // Audit CRIT-3: the prior implementation regenerated 4 random bytes per
  // process startup and shipped that as `X-WECHAT-UIN`. That looks like
  // bot rotation to Tencent risk-control and accelerates token revocation.
  it('persists wechatUin to <dataDir>/weixin-monitor/<accountId>.uin and reuses it across starts', async () => {
    const WeixinPlugin = await loadPluginClass();
    mockStartFn = vi.fn();

    const plugin1 = new WeixinPlugin();
    await plugin1.initialize(createConfig({ accountId: 'acct_uin_persist' }));
    await plugin1.start();
    const uinFirstCall = (mockStartFn.mock.calls[0][0] as MonitorOptions).wechatUin;
    await plugin1.stop();

    const uinFile = path.join(TEST_DATA_DIR, 'weixin-monitor', 'acct_uin_persist.uin');
    expect(fs.existsSync(uinFile)).toBe(true);
    const persisted = fs.readFileSync(uinFile, 'utf-8').trim();
    expect(persisted).toBe(uinFirstCall);

    const plugin2 = new WeixinPlugin();
    await plugin2.initialize(createConfig({ accountId: 'acct_uin_persist' }));
    await plugin2.start();
    const uinSecondCall = (mockStartFn.mock.calls[1][0] as MonitorOptions).wechatUin;
    expect(uinSecondCall).toBe(uinFirstCall);
    await plugin2.stop();

    fs.unlinkSync(uinFile);
  });
});
