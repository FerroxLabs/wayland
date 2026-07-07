/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Covers the generalized welcome handshake surface on WhatsApp: getSelfTarget()
 * resolves to the linked account's own JID after connect (and is null for the
 * meta-business backend with no self thread), getAccountIdentity() keys the
 * once-per-account marker on the JID, and a logged_out re-arms the welcome
 * marker via ChannelWelcomeService. The actual send/dedup is driven by
 * PluginManager + ChannelWelcomeService (tested separately); this asserts the
 * plugin exposes the right hooks.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

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

function configFor(backend: string, extra: Record<string, string> = {}): IChannelPluginConfig {
  return {
    id: 'whatsapp_default',
    type: 'whatsapp',
    name: 'WhatsApp',
    enabled: true,
    status: 'created',
    createdAt: 0,
    updatedAt: 0,
    credentials: { backend, ...extra },
  };
}

function emitFromBridge(frame: object): void {
  fakeChild.stdout.emit('data', `${JSON.stringify(frame)}\n`);
}

describe('WhatsAppPlugin - generalized welcome handshake hooks', () => {
  beforeEach(() => {
    forkSpy.mockClear();
    stdinWrites.length = 0;
    rearmSpy.mockClear();
  });

  it('getSelfTarget()/getAccountIdentity() are null before connect', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    expect(plugin.getSelfTarget()).toBeNull();
    expect(plugin.getAccountIdentity()).toBeNull();
  });

  it('resolves the own JID as self target + account identity after connect', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    emitFromBridge({
      jsonrpc: '2.0',
      method: 'connection.status',
      params: { state: 'connected', jid: '15551234567@s.whatsapp.net' },
    });
    expect(plugin.getSelfTarget()).toBe('15551234567@s.whatsapp.net');
    expect(plugin.getAccountIdentity()).toBe('15551234567@s.whatsapp.net');
  });

  it('meta-business backend has no self target (no self thread)', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(
      configFor('meta-business', { accessToken: 'EAAG-token', phoneNumberId: '123456789012345' })
    );
    expect(plugin.getSelfTarget()).toBeNull();
    // Account identity falls back to the phone number id for marker keying.
    expect(plugin.getAccountIdentity()).toBe('123456789012345');
  });

  it('re-arms the welcome marker on logged_out (genuine re-pair)', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    emitFromBridge({
      jsonrpc: '2.0',
      method: 'connection.status',
      params: { state: 'connected', jid: 'acc-1@s.whatsapp.net' },
    });
    emitFromBridge({
      jsonrpc: '2.0',
      method: 'connection.status',
      params: { state: 'logged_out' },
    });
    expect(rearmSpy).toHaveBeenCalledWith('whatsapp', 'acc-1@s.whatsapp.net');
  });

  it('does NOT send the welcome directly anymore (no self-chat sendText on connect)', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    stdinWrites.length = 0;
    emitFromBridge({
      jsonrpc: '2.0',
      method: 'connection.status',
      params: { state: 'connected', jid: '15551234567@s.whatsapp.net' },
    });
    // The plugin no longer self-sends on connect; PluginManager drives the
    // welcome via ChannelWelcomeService. So no sendText RPC should be written.
    const sentText = stdinWrites.some((f) => f.includes('"method":"sendText"'));
    expect(sentText).toBe(false);
  });
});
