/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// dingtalk-stream is not exercised here; stub before importing the plugin so
// the SDK does not try to open a real socket during instantiation.
vi.mock('dingtalk-stream', () => ({
  DWClient: class {
    registerCallbackListener() {}
    socketCallBackResponse() {}
    connect() {
      return Promise.resolve();
    }
    disconnect() {}
  },
  TOPIC_ROBOT: 'robot',
  TOPIC_CARD: 'card',
  EventAck: { SUCCESS: 'SUCCESS' },
}));

import https from 'node:https';

import { DingTalkPlugin } from '@process/channels/plugins/dingtalk/DingTalkPlugin';

/**
 * Stub https.request so testConnection can run offline. Returns the JSON
 * payload supplied by the caller. Each call yields a fresh `req` whose
 * `end()` triggers the response listeners.
 */
function stubHttpsResponse(payload: unknown, statusCode = 200) {
  return vi.spyOn(https, 'request').mockImplementation(((_options: unknown, cb?: any) => {
    const listeners: Record<string, ((chunk?: unknown) => void)[]> = { data: [], end: [], error: [] };
    const res = {
      statusCode,
      on(event: string, fn: (chunk?: unknown) => void) {
        listeners[event] = listeners[event] || [];
        listeners[event].push(fn);
        return res;
      },
    };
    const req = {
      on() {
        return req;
      },
      setTimeout() {
        return req;
      },
      write() {
        return true;
      },
      end() {
        cb?.(res);
        listeners.data.forEach((fn) => fn(JSON.stringify(payload)));
        listeners.end.forEach((fn) => fn());
      },
      destroy() {},
    };
    return req as unknown as ReturnType<typeof https.request>;
  }) as unknown as typeof https.request);
}

describe('DingTalkPlugin - R11 HIGH H2 timestamp-skew rejection', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let plugin: DingTalkPlugin;
  let messageHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    plugin = new DingTalkPlugin();
    messageHandler = vi.fn().mockResolvedValue(undefined);
    // BasePlugin exposes `setMessageHandler` via public API; assert through
    // private `messageHandler` directly to keep the test focused on the
    // skew-check branch rather than the wider plugin lifecycle.
    (plugin as unknown as { messageHandler: typeof messageHandler }).messageHandler = messageHandler;
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('rejects a stream event whose createAt is older than 5 minutes', async () => {
    const sixMinutesAgo = Date.now() - 6 * 60 * 1000;
    const data = {
      msgId: 'replay-1',
      senderStaffId: 'staff-x',
      conversationType: '1',
      createAt: sixMinutesAgo,
    };

    await (
      plugin as unknown as {
        handleRobotMessage: (d: unknown, id: string) => Promise<void>;
      }
    ).handleRobotMessage(data, 'stream-1');

    expect(messageHandler).not.toHaveBeenCalled();
    const stalenessLog = warnSpy.mock.calls.find((args) =>
      typeof args[0] === 'string' && args[0].includes('out-of-range timestamp')
    );
    expect(stalenessLog).toBeDefined();
  });

  it('v0.4.3 Wave D: rejects a stream event with far-future createAt (negative-skew bypass)', async () => {
    // Codex re-audit caught the original `skew > MAX` check accepted future
    // timestamps because the skew was negative. Math.abs closes that bypass.
    const sixMinutesAhead = Date.now() + 6 * 60 * 1000;
    const data = {
      msgId: 'future-1',
      senderStaffId: 'staff-x',
      conversationType: '1',
      createAt: sixMinutesAhead,
    };

    await (
      plugin as unknown as {
        handleRobotMessage: (d: unknown, id: string) => Promise<void>;
      }
    ).handleRobotMessage(data, 'stream-future-1');

    expect(messageHandler).not.toHaveBeenCalled();
    const skewLog = warnSpy.mock.calls.find((args) =>
      typeof args[0] === 'string' && args[0].includes('out-of-range timestamp')
    );
    expect(skewLog).toBeDefined();
  });

  it('accepts a fresh stream event with current createAt', async () => {
    const data = {
      msgId: 'fresh-1',
      senderStaffId: 'staff-x',
      conversationType: '1',
      createAt: Date.now(),
      text: { content: 'hello' },
    };

    await (
      plugin as unknown as {
        handleRobotMessage: (d: unknown, id: string) => Promise<void>;
      }
    ).handleRobotMessage(data, 'stream-2');

    const stalenessLog = warnSpy.mock.calls.find((args) =>
      typeof args[0] === 'string' && args[0].includes('out-of-range timestamp')
    );
    expect(stalenessLog).toBeUndefined();
  });

  it('warns (but does not reject) when createAt is missing', async () => {
    const data = {
      msgId: 'no-ts-1',
      senderStaffId: 'staff-x',
      conversationType: '1',
      text: { content: 'hello' },
    };

    await (
      plugin as unknown as {
        handleRobotMessage: (d: unknown, id: string) => Promise<void>;
      }
    ).handleRobotMessage(data, 'stream-3');

    const missingTsLog = warnSpy.mock.calls.find((args) =>
      typeof args[0] === 'string' && args[0].includes('missing createAt')
    );
    expect(missingTsLog).toBeDefined();
  });
});

describe('DingTalkPlugin - R10 HIGH H1 webhookSecret credential', () => {
  it('reads webhookSecret from credentials during onInitialize', async () => {
    const plugin = new DingTalkPlugin();
    await (
      plugin as unknown as {
        onInitialize: (cfg: unknown) => Promise<void>;
      }
    ).onInitialize({
      credentials: {
        clientId: 'ding-app-key',
        clientSecret: 'ding-app-secret',
        webhookSecret: 'SEC-abc-123  ',
      },
    });

    const stored = (plugin as unknown as { webhookSecret: string }).webhookSecret;
    expect(stored).toBe('SEC-abc-123');
  });

  it('defaults webhookSecret to empty when not provided', async () => {
    const plugin = new DingTalkPlugin();
    await (
      plugin as unknown as {
        onInitialize: (cfg: unknown) => Promise<void>;
      }
    ).onInitialize({
      credentials: {
        clientId: 'ding-app-key',
        clientSecret: 'ding-app-secret',
      },
    });

    const stored = (plugin as unknown as { webhookSecret: string }).webhookSecret;
    expect(stored).toBe('');
  });
});

describe('DingTalkPlugin - R16 L5/L6 testConnection honesty', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the caller-supplied displayName instead of the hardcoded default', async () => {
    stubHttpsResponse({ accessToken: 'tok-xyz', expireIn: 7200 });
    const result = await DingTalkPlugin.testConnection('app-key', 'app-secret', 'My Custom Bot');
    expect(result.success).toBe(true);
    expect(result.botInfo?.name).toBe('My Custom Bot');
  });

  it('falls back to the default Wayland name when no displayName is provided', async () => {
    stubHttpsResponse({ accessToken: 'tok-xyz', expireIn: 7200 });
    const result = await DingTalkPlugin.testConnection('app-key', 'app-secret');
    expect(result.success).toBe(true);
    expect(result.botInfo?.name).toBe('Wayland DingTalk Bot');
  });

  it('returns success=false with the upstream error when token mint fails', async () => {
    stubHttpsResponse({ message: 'invalid appSecret' });
    const result = await DingTalkPlugin.testConnection('app-key', 'wrong-secret');
    expect(result.success).toBe(false);
    expect(result.error).toBe('invalid appSecret');
  });

  it('rejects when clientSecret is missing without touching the network', async () => {
    const spy = vi.spyOn(https, 'request');
    const result = await DingTalkPlugin.testConnection('app-key');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Client Secret is required/);
    expect(spy).not.toHaveBeenCalled();
  });
});
