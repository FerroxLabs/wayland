/**
 * @license
 * Copyright 2025 Wayland (TradeCanyon)
 * SPDX-License-Identifier: Apache-2.0
 *
 * Coverage for the v0.4.2 MED + LOW finding fixes on the WhatsApp channel:
 *  - W-5  reply/quote context forwarded from bridge to unified message.
 *  - W-6  Meta reaction events preserve `reactionMessageId` via replyToMessageId.
 *  - W-7  audio / video / document / sticker mediaType no longer collapse to 'text'.
 *  - W-8  ms-encoded timestamps are not double-multiplied.
 *  - MED  webhookDelivery RPC races against a hard deadline.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig, IUnifiedIncomingMessage } from '@process/channels/types';

const { forkSpy, fakeChild, stdinWrites } = vi.hoisted(() => {
  type Listener = (...args: unknown[]) => void;
  function makeEmitter(): {
    on: (event: string, cb: Listener) => unknown;
    once: (event: string, cb: Listener) => unknown;
    off: (event: string, cb: Listener) => unknown;
    emit: (event: string, ...args: unknown[]) => boolean;
  } {
    const listeners: Record<string, Listener[]> = {};
    return {
      on(event, cb) {
        (listeners[event] ??= []).push(cb);
        return this;
      },
      once(event, cb) {
        const wrap: Listener = (...args) => {
          this.off(event, wrap);
          cb(...args);
        };
        (listeners[event] ??= []).push(wrap);
        return this;
      },
      off(event, cb) {
        const arr = listeners[event];
        if (!arr) return this;
        const idx = arr.indexOf(cb);
        if (idx >= 0) arr.splice(idx, 1);
        return this;
      },
      emit(event, ...args) {
        const arr = listeners[event];
        if (!arr || arr.length === 0) return false;
        for (const cb of [...arr]) cb(...args);
        return true;
      },
    };
  }

  const stdinWrites: string[] = [];
  const stdout = Object.assign(makeEmitter(), {
    setEncoding: () => undefined,
  });
  const stdin = {
    write(frame: string, cb?: (err?: Error) => void) {
      stdinWrites.push(frame);
      cb?.();
      return true;
    },
  };
  const child = Object.assign(makeEmitter(), {
    stdout,
    stdin,
    kill: (_sig?: string) => undefined,
  });
  return {
    forkSpy: vi.fn(() => child),
    fakeChild: child,
    stdinWrites,
  };
});

vi.mock('child_process', () => ({
  fork: forkSpy,
  ChildProcess: class {},
}));

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/test/app' },
}));

import { WhatsAppPlugin } from '@process/channels/plugins/tier1/whatsapp/WhatsAppPlugin';

function configFor(backend: string): IChannelPluginConfig {
  return {
    id: 'whatsapp_default',
    type: 'whatsapp',
    name: 'WhatsApp',
    enabled: true,
    status: 'created',
    createdAt: 0,
    updatedAt: 0,
    credentials: { backend },
  };
}

function emitFromBridge(frame: object): void {
  fakeChild.stdout.emit('data', `${JSON.stringify(frame)}\n`);
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

async function captureInbound(
  plugin: WhatsAppPlugin,
  params: Record<string, unknown>,
): Promise<IUnifiedIncomingMessage> {
  const received: IUnifiedIncomingMessage[] = [];
  plugin.onMessage(async (msg) => {
    received.push(msg);
  });
  emitFromBridge({
    jsonrpc: '2.0',
    method: 'inbound.message',
    params,
  });
  await flush();
  if (received.length !== 1) {
    throw new Error(`expected 1 inbound, got ${received.length}`);
  }
  return received[0]!;
}

describe('WhatsAppPlugin — MED/LOW finding fixes', () => {
  beforeEach(() => {
    forkSpy.mockClear();
    stdinWrites.length = 0;
  });

  it('W-5: forwards replyToMessageId when bridge includes context', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    const msg = await captureInbound(plugin, {
      messageId: 'WA_in_reply',
      chatId: 'chat@s.whatsapp.net',
      senderId: 'sender@s.whatsapp.net',
      body: 'replying to you',
      replyToMessageId: 'ORIGINAL_MSG_ID',
    });
    expect(msg.replyToMessageId).toBe('ORIGINAL_MSG_ID');
  });

  it('W-6: surfaces reactionMessageId via replyToMessageId for reaction events', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    const msg = await captureInbound(plugin, {
      messageId: 'WA_in_reaction',
      chatId: '15551234567',
      senderId: '15551234567',
      body: '👍',
      reactionMessageId: 'REACTED_TO_MSG',
    });
    expect(msg.replyToMessageId).toBe('REACTED_TO_MSG');
  });

  it.each([
    ['audio', 'audio'],
    ['video', 'video'],
    ['document', 'document'],
    ['sticker', 'sticker'],
    ['image', 'photo'],
  ] as const)(
    'W-7: mediaType %s maps to content.type %s (no collapse to text)',
    async (mediaType, expected) => {
      const plugin = new WhatsAppPlugin();
      await plugin.initialize(configFor('baileys'));
      const msg = await captureInbound(plugin, {
        messageId: `WA_in_${mediaType}`,
        chatId: 'chat@x',
        senderId: 'sender@x',
        body: '',
        mediaType,
      });
      expect(msg.content.type).toBe(expected);
    },
  );

  it('W-8: ms-encoded timestamps pass through (no double-multiply)', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    const tsMs = 1_700_000_000_000;
    const msg = await captureInbound(plugin, {
      messageId: 'WA_ts_ms',
      chatId: 'chat@x',
      senderId: 'sender@x',
      body: 'with ms timestamp',
      timestamp: tsMs,
    });
    expect(msg.timestamp).toBe(tsMs);
  });

  it('W-8: seconds timestamps are converted to ms exactly once', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    const tsSec = 1_700_000_000;
    const msg = await captureInbound(plugin, {
      messageId: 'WA_ts_s',
      chatId: 'chat@x',
      senderId: 'sender@x',
      body: 'with seconds timestamp',
      timestamp: tsSec,
    });
    expect(msg.timestamp).toBe(tsSec * 1000);
  });

  it('handleWebhookPayload rejects when bridge does not respond within 5s', async () => {
    vi.useFakeTimers();
    try {
      const plugin = new WhatsAppPlugin();
      await plugin.initialize({
        ...configFor('meta-business'),
        credentials: {
          backend: 'meta-business',
          accessToken: 'synthetic',
          phoneNumberId: '1',
        },
      });
      const pending = plugin.handleWebhookPayload({}, {}, 'whatsapp_default');
      // Swallow the rejection so unhandled-rejection trap doesn't flag it.
      const assertion = expect(pending).rejects.toThrow(/webhookDelivery timeout/);
      await vi.advanceTimersByTimeAsync(5_500);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
