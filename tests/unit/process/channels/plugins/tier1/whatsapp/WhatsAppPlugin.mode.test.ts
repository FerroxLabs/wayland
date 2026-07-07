/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Covers WhatsApp personal vs dedicated mode. Personal (default): only the
 * operator self-chat is owner, and allowsContactPairing() is false so the gate
 * stays silent for strangers. Dedicated: the owner is identified via the
 * ownerNumbers allowlist, and allowsContactPairing() is true so other contacts
 * may pair. Back-compat: a config with no mode behaves as personal.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';
import type { IUnifiedIncomingMessage } from '@process/channels/types';

const { forkSpy, fakeChild, stdinWrites, rearmSpy } = vi.hoisted(() => {
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
  const stdout = Object.assign(makeEmitter(), { setEncoding: () => undefined });
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
    rearmSpy: vi.fn(async () => undefined),
  };
});

vi.mock('child_process', () => ({
  fork: forkSpy,
  ChildProcess: class {},
}));

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/test/app' },
}));

vi.mock('@process/channels/gateway/ChannelWelcomeService', () => ({
  getChannelWelcomeService: () => ({ rearm: rearmSpy }),
}));

import { WhatsAppPlugin } from '@process/channels/plugins/tier1/whatsapp/WhatsAppPlugin';

function configFor(credentials: Record<string, unknown>): IChannelPluginConfig {
  return {
    id: 'whatsapp_default',
    type: 'whatsapp',
    name: 'WhatsApp',
    enabled: true,
    status: 'created',
    createdAt: 0,
    updatedAt: 0,
    credentials: credentials as IChannelPluginConfig['credentials'],
  };
}

function emitFromBridge(frame: object): void {
  fakeChild.stdout.emit('data', `${JSON.stringify(frame)}\n`);
}

async function connect(plugin: WhatsAppPlugin, jid: string): Promise<void> {
  emitFromBridge({
    jsonrpc: '2.0',
    method: 'connection.status',
    params: { state: 'connected', jid },
  });
}

/** Capture every IUnifiedIncomingMessage the plugin emits to its handler. */
function captureMessages(plugin: WhatsAppPlugin): IUnifiedIncomingMessage[] {
  const captured: IUnifiedIncomingMessage[] = [];
  plugin.onMessage(async (m) => {
    captured.push(m);
  });
  return captured;
}

const OWN_JID = '15551112222@s.whatsapp.net';
const STRANGER_JID = '447000000000@s.whatsapp.net';

describe('WhatsAppPlugin - personal vs dedicated mode', () => {
  beforeEach(() => {
    forkSpy.mockClear();
    stdinWrites.length = 0;
    rearmSpy.mockClear();
  });

  it('defaults to personal mode and forbids contact pairing (back-compat)', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor({ backend: 'baileys' }));
    expect(plugin.allowsContactPairing()).toBe(false);
  });

  it('personal mode: explicit mode also forbids contact pairing', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor({ backend: 'baileys', mode: 'personal' }));
    expect(plugin.allowsContactPairing()).toBe(false);
  });

  it('dedicated mode: allows contact pairing', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor({ backend: 'baileys', mode: 'dedicated', ownerNumbers: ['15551112222'] }));
    expect(plugin.allowsContactPairing()).toBe(true);
  });

  it('personal mode: self-chat inbound is flagged isOwner', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor({ backend: 'baileys' }));
    const captured = captureMessages(plugin);
    await connect(plugin, OWN_JID);
    emitFromBridge({
      jsonrpc: '2.0',
      method: 'inbound.message',
      params: { messageId: 'm1', chatId: OWN_JID, senderId: '15551112222', fromMe: true, body: 'hi self' },
    });
    expect(captured).toHaveLength(1);
    expect(captured[0].isOwner).toBe(true);
  });

  it('personal mode: unknown contact inbound is NOT isOwner', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor({ backend: 'baileys' }));
    const captured = captureMessages(plugin);
    await connect(plugin, OWN_JID);
    emitFromBridge({
      jsonrpc: '2.0',
      method: 'inbound.message',
      params: { messageId: 'm2', chatId: STRANGER_JID, senderId: '447000000000', body: 'hello stranger' },
    });
    expect(captured).toHaveLength(1);
    expect(captured[0].isOwner).toBeUndefined();
  });

  it('dedicated mode: owner-number inbound is flagged isOwner', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor({ backend: 'baileys', mode: 'dedicated', ownerNumbers: ['+1 (555) 111-2222'] }));
    const captured = captureMessages(plugin);
    await connect(plugin, '99999@s.whatsapp.net');
    emitFromBridge({
      jsonrpc: '2.0',
      method: 'inbound.message',
      params: {
        messageId: 'm3',
        chatId: STRANGER_JID,
        senderId: '15551112222',
        senderRawJid: '15551112222@s.whatsapp.net',
        body: 'owner here',
      },
    });
    expect(captured).toHaveLength(1);
    expect(captured[0].isOwner).toBe(true);
  });

  it('dedicated mode: non-owner inbound is NOT isOwner (pairing path preserved)', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor({ backend: 'baileys', mode: 'dedicated', ownerNumbers: ['15551112222'] }));
    const captured = captureMessages(plugin);
    await connect(plugin, '99999@s.whatsapp.net');
    emitFromBridge({
      jsonrpc: '2.0',
      method: 'inbound.message',
      params: { messageId: 'm4', chatId: STRANGER_JID, senderId: '447000000000', body: 'random' },
    });
    expect(captured).toHaveLength(1);
    expect(captured[0].isOwner).toBeUndefined();
  });

  it('dedicated mode: self-chat is NOT owner (owner talks from another device)', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor({ backend: 'baileys', mode: 'dedicated', ownerNumbers: ['15551112222'] }));
    const captured = captureMessages(plugin);
    await connect(plugin, '99999@s.whatsapp.net');
    emitFromBridge({
      jsonrpc: '2.0',
      method: 'inbound.message',
      params: { messageId: 'm5', chatId: '99999@s.whatsapp.net', senderId: '99999', fromMe: true, body: 'self' },
    });
    // fromMe self-chat is still let through, but it is not the owner here.
    expect(captured).toHaveLength(1);
    expect(captured[0].isOwner).toBeUndefined();
  });
});
