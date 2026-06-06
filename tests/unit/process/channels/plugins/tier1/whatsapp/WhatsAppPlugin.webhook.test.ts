/**
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * handleWebhookPayload contract:
 *   - meta-business backend: forwards parsed payload + lowercased headers
 *     to the bridge's `webhookDelivery` JSON-RPC method.
 *   - any other backend: throws - webhooks are Meta-only.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

// Hoisted block runs before imports - use a hand-rolled emitter stub instead
// of `new EventEmitter()` to avoid the `__vi_import_*` TDZ ordering error.
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
        for (const cb of arr.slice()) cb(...args);
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

import { WhatsAppPlugin } from '@process/channels/plugins/tier1/whatsapp/WhatsAppPlugin';

const metaConfig: IChannelPluginConfig = {
  id: 'whatsapp_default',
  type: 'whatsapp',
  name: 'WhatsApp',
  enabled: true,
  status: 'created',
  createdAt: 0,
  updatedAt: 0,
  credentials: {
    backend: 'meta-business',
    accessToken: 'EAAGxxx',
    phoneNumberId: '123456789012345',
  },
};

const baileysConfig: IChannelPluginConfig = {
  id: 'whatsapp_default',
  type: 'whatsapp',
  name: 'WhatsApp',
  enabled: true,
  status: 'created',
  createdAt: 0,
  updatedAt: 0,
  credentials: { backend: 'baileys' },
};

describe('WhatsAppPlugin.handleWebhookPayload - Meta backend', () => {
  beforeEach(() => {
    forkSpy.mockClear();
    stdinWrites.length = 0;
  });

  it('forwards payload + lowercased headers via webhookDelivery RPC', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(metaConfig);

    const samplePayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHA_ID',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '+14155550123', phone_number_id: '123' },
                contacts: [{ wa_id: '15551234567', profile: { name: 'Alice' } }],
                messages: [
                  {
                    from: '15551234567',
                    id: 'wamid.XYZ',
                    timestamp: '1700000000',
                    type: 'text',
                    text: { body: 'hi from meta' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const headers = {
      'X-Hub-Signature-256': 'sha256=abc',
      'Content-Type': 'application/json',
      'X-Forwarded-For': undefined,
    };

    // Fire-and-forget - handleWebhookPayload sends one RPC then awaits the
    // response. We synchronously read the captured frame, resolve from
    // "bridge", and await the call below.
    const pending = plugin.handleWebhookPayload(samplePayload, headers, 'whatsapp_default');

    expect(stdinWrites).toHaveLength(1);
    const sent = JSON.parse(stdinWrites[0]!.trim()) as {
      method: string;
      params: { payload: unknown; headers: Record<string, string> };
      id: number;
    };
    expect(sent.method).toBe('webhookDelivery');
    expect(sent.params.payload).toEqual(samplePayload);
    expect(sent.params.headers).toEqual({
      'x-hub-signature-256': 'sha256=abc',
      'content-type': 'application/json',
    });

    fakeChild.stdout.emit(
      'data',
      `${JSON.stringify({ jsonrpc: '2.0', id: sent.id, result: { ok: true, emitted: 1 } })}\n`
    );
    await expect(pending).resolves.toBeUndefined();
  });

  it('joins array-valued headers with comma + space', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(metaConfig);

    const pending = plugin.handleWebhookPayload(
      { object: 'whatsapp_business_account', entry: [] },
      { 'X-Forwarded-For': ['10.0.0.1', '10.0.0.2'] },
      'whatsapp_default'
    );
    const sent = JSON.parse(stdinWrites[0]!.trim()) as {
      id: number;
      params: { headers: Record<string, string> };
    };
    expect(sent.params.headers['x-forwarded-for']).toBe('10.0.0.1, 10.0.0.2');

    fakeChild.stdout.emit('data', `${JSON.stringify({ jsonrpc: '2.0', id: sent.id, result: { ok: true } })}\n`);
    await pending;
  });
});

describe('WhatsAppPlugin.handleWebhookPayload - non-Meta backends', () => {
  beforeEach(() => {
    forkSpy.mockClear();
    stdinWrites.length = 0;
  });

  it('throws for Baileys backend (webhook is Meta-only)', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(baileysConfig);
    await expect(
      plugin.handleWebhookPayload({ object: 'whatsapp_business_account' }, {}, 'whatsapp_default')
    ).rejects.toThrow(/only valid for meta-business backend/);
    // No RPC should be written when the backend rejects the call up front.
    expect(stdinWrites).toHaveLength(0);
  });
});
