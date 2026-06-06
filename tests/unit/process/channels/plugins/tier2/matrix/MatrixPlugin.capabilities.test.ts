/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Exercises plugin capability declarations, status lifecycle hooks, and the
 * hasPluginCredentials matrix without booting a real Matrix sync. The SDK is
 * hoist-mocked with a hand-rolled emitter so the plugin can be constructed and
 * initialized in-process.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';
import { hasPluginCredentials } from '@process/channels/types';

// Hoist a tiny event-emitter stub so the SDK mock factory does not pull in any
// `events` module at hoist time (matches the WhatsApp bridge test pattern).
const { createClientSpy, fakeClient, emitSync } = vi.hoisted(() => {
  type Listener = (...args: unknown[]) => void;
  const listeners: Record<string, Listener[]> = {};
  const client = {
    on(event: string, cb: Listener) {
      (listeners[event] ??= []).push(cb);
      return this;
    },
    removeAllListeners() {
      for (const key of Object.keys(listeners)) delete listeners[key];
    },
    startClient: vi.fn(async () => undefined),
    stopClient: vi.fn(() => undefined),
    sendTextMessage: vi.fn(async () => ({ event_id: '$sent:matrix.org' })),
    sendEvent: vi.fn(async () => ({ event_id: '$evt:matrix.org' })),
    sendTyping: vi.fn(async () => undefined),
    whoami: vi.fn(async () => ({ user_id: '@bot:matrix.org' })),
    getUser: vi.fn(() => ({ displayName: 'Bot' })),
    fetchRoomEvent: vi.fn(async () => ({ content: { msgtype: 'm.text' } })),
  };
  return {
    createClientSpy: vi.fn(() => client),
    fakeClient: client,
    emitSync(state: string) {
      const arr = listeners['sync'];
      if (!arr) return;
      for (const cb of arr.slice()) cb(state);
    },
  };
});

vi.mock('matrix-js-sdk', () => ({
  createClient: createClientSpy,
}));

import { MatrixPlugin } from '@process/channels/plugins/tier2/matrix/MatrixPlugin';

function configFor(overrides: Partial<IChannelPluginConfig['credentials']> = {}): IChannelPluginConfig {
  return {
    id: 'matrix_default',
    type: 'matrix',
    name: 'Matrix',
    enabled: true,
    status: 'created',
    credentials: {
      homeserverUrl: 'https://matrix.org',
      userId: '@bot:matrix.org',
      accessToken: 'syt_xxxxx',
      ...overrides,
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

beforeEach(() => {
  createClientSpy.mockClear();
  fakeClient.startClient.mockClear();
  fakeClient.stopClient.mockClear();
  fakeClient.whoami.mockClear();
  fakeClient.sendEvent.mockClear();
  fakeClient.fetchRoomEvent.mockClear();
  fakeClient.whoami.mockImplementation(async () => ({ user_id: '@bot:matrix.org' }));
  fakeClient.fetchRoomEvent.mockImplementation(async () => ({ content: { msgtype: 'm.text' } }));
  fakeClient.startClient.mockImplementation(async () => undefined);
});

describe('MatrixPlugin capabilities and lifecycle', () => {
  it('exposes the matrix type and edit/react/typing capabilities (no streaming)', () => {
    const plugin = new MatrixPlugin();
    expect(plugin.type).toBe('matrix');
    expect(plugin.capabilities).toEqual({
      canEdit: true,
      canStream: false,
      canReact: true,
      canTypingIndicator: true,
    });
  });

  it('starts in the created status with no active users and no bot info before init', () => {
    const plugin = new MatrixPlugin();
    expect(plugin.status).toBe('created');
    expect(plugin.getActiveUserCount()).toBe(0);
    expect(plugin.getBotInfo()).toBeNull();
  });

  it('throws if homeserverUrl, accessToken, or userId is missing', async () => {
    await expect(new MatrixPlugin().initialize(configFor({ homeserverUrl: '' }))).rejects.toThrow(/homeserver url/i);
    await expect(new MatrixPlugin().initialize(configFor({ accessToken: '' }))).rejects.toThrow(/access token/i);
    await expect(new MatrixPlugin().initialize(configFor({ userId: '' }))).rejects.toThrow(/user id/i);
  });

  it('rejects malformed mxids that lack @ prefix or homeserver suffix', async () => {
    await expect(new MatrixPlugin().initialize(configFor({ userId: 'bot-no-prefix' }))).rejects.toThrow(/mxid/i);
    await expect(new MatrixPlugin().initialize(configFor({ userId: '@bot-no-colon' }))).rejects.toThrow(/mxid/i);
  });

  it('initializes the SDK client with the provided credentials and transitions to ready', async () => {
    const plugin = new MatrixPlugin();
    await plugin.initialize(configFor());
    expect(createClientSpy).toHaveBeenCalledWith({
      baseUrl: 'https://matrix.org',
      accessToken: 'syt_xxxxx',
      userId: '@bot:matrix.org',
    });
    expect(plugin.status).toBe('ready');
  });

  it('rejects handleWebhookPayload with the sync-vs-webhook explanation', async () => {
    const plugin = new MatrixPlugin();
    await expect(plugin.handleWebhookPayload()).rejects.toThrow(/sync.*webhook/i);
  });

  it('testConnection returns the resolved user_id on success', async () => {
    // Matrix testConnection takes a JSON-encoded credentials blob to match the
    // single-string signature on BasePlugin (see WhatsAppPlugin for the same
    // pattern). The renderer serializes { homeserverUrl, accessToken }.
    const result = await MatrixPlugin.testConnection(
      JSON.stringify({ homeserverUrl: 'https://matrix.org', accessToken: 'syt_xxxxx' })
    );
    expect(result).toEqual({ success: true, botUsername: '@bot:matrix.org' });
  });

  it('testConnection rejects missing inputs without calling the SDK', async () => {
    expect(await MatrixPlugin.testConnection(JSON.stringify({ homeserverUrl: '', accessToken: 'tok' }))).toMatchObject({
      success: false,
    });
    expect(
      await MatrixPlugin.testConnection(JSON.stringify({ homeserverUrl: 'https://x', accessToken: '' }))
    ).toMatchObject({ success: false });
  });

  it('testConnection rejects non-JSON input cleanly', async () => {
    const result = await MatrixPlugin.testConnection('not-json');
    expect(result).toEqual({ success: false, error: expect.stringContaining('JSON') });
  });

  it('start() resolves selfUserId via whoami before startClient and warns on mismatch', async () => {
    fakeClient.whoami.mockImplementationOnce(async () => ({ user_id: '@server-mxid:matrix.org' }));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const plugin = new MatrixPlugin();
    await plugin.initialize(configFor());
    await plugin.start();
    // whoami must be called as part of onStart (audit Miss 3)
    expect(fakeClient.whoami).toHaveBeenCalled();
    // and BEFORE startClient - order matters so handlers filter the right mxid
    const whoamiOrder = fakeClient.whoami.mock.invocationCallOrder[0];
    const startOrder = fakeClient.startClient.mock.invocationCallOrder[0];
    expect(whoamiOrder).toBeLessThan(startOrder);
    expect(plugin.getBotInfo()?.id).toBe('@server-mxid:matrix.org');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('whoami() returned @server-mxid:matrix.org'));
    warnSpy.mockRestore();
    await plugin.stop();
  });

  it('editMessage throws when the original event is not an m.text message', async () => {
    fakeClient.fetchRoomEvent.mockImplementationOnce(async () => ({
      content: { msgtype: 'm.image' },
    }));
    const plugin = new MatrixPlugin();
    await plugin.initialize(configFor());
    await plugin.start();
    await expect(plugin.editMessage('!room:matrix.org', '$orig:matrix.org', { text: 'hi' })).rejects.toThrow(
      /media messages is not supported/i
    );
    expect(fakeClient.sendEvent).not.toHaveBeenCalled();
    await plugin.stop();
  });

  it('editMessage proceeds when the original event is an m.text message', async () => {
    const plugin = new MatrixPlugin();
    await plugin.initialize(configFor());
    await plugin.start();
    await plugin.editMessage('!room:matrix.org', '$orig:matrix.org', { text: 'updated' });
    expect(fakeClient.sendEvent).toHaveBeenCalledWith(
      '!room:matrix.org',
      'm.room.message',
      expect.objectContaining({
        msgtype: 'm.text',
        'm.relates_to': { rel_type: 'm.replace', event_id: '$orig:matrix.org' },
      })
    );
    await plugin.stop();
  });

  it('on sync ERROR, stops the client and schedules a restart (backoff)', async () => {
    vi.useFakeTimers();
    try {
      const plugin = new MatrixPlugin();
      await plugin.initialize(configFor());
      await plugin.start();
      const startCallsBefore = fakeClient.startClient.mock.calls.length;
      const stopCallsBefore = fakeClient.stopClient.mock.calls.length;

      // First failure → stopClient called, restart scheduled at 5s
      emitSync('ERROR');
      expect(fakeClient.stopClient.mock.calls.length).toBe(stopCallsBefore + 1);
      expect(fakeClient.startClient.mock.calls.length).toBe(startCallsBefore);

      await vi.advanceTimersByTimeAsync(5_000);
      expect(fakeClient.startClient.mock.calls.length).toBe(startCallsBefore + 1);

      // Successful recovery resets the counter - subsequent ERROR uses the
      // initial 5s backoff again, not the doubled 10s value.
      emitSync('PREPARED');
      emitSync('ERROR');
      await vi.advanceTimersByTimeAsync(5_000);
      expect(fakeClient.startClient.mock.calls.length).toBe(startCallsBefore + 2);

      await plugin.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('transitions to error status after exceeding the max sync ERROR retries', async () => {
    vi.useFakeTimers();
    try {
      const plugin = new MatrixPlugin();
      await plugin.initialize(configFor());
      await plugin.start();
      expect(plugin.status).toBe('running');

      // Fire 5 ERRORs within the backoff budget - status stays 'running' but
      // setError records the failure each time.
      for (let i = 0; i < 5; i += 1) {
        emitSync('ERROR');
        // Drain the scheduled restart so the next ERROR can schedule again.
        await vi.advanceTimersByTimeAsync(60_000);
      }
      expect(plugin.status).toBe('running');

      // 6th ERROR exceeds SYNC_BACKOFF_MAX_ATTEMPTS=5 → hard error transition.
      emitSync('ERROR');
      expect(plugin.status).toBe('error');
      expect(fakeClient.stopClient).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('hasPluginCredentials for matrix', () => {
  it('returns false when credentials are missing', () => {
    expect(hasPluginCredentials('matrix', undefined)).toBe(false);
    expect(hasPluginCredentials('matrix', {})).toBe(false);
  });

  it('returns false when any of homeserverUrl / accessToken / userId is missing', () => {
    expect(hasPluginCredentials('matrix', { accessToken: 't', userId: '@b:m.org' })).toBe(false);
    expect(hasPluginCredentials('matrix', { homeserverUrl: 'https://x', userId: '@b:m.org' })).toBe(false);
    expect(hasPluginCredentials('matrix', { homeserverUrl: 'https://x', accessToken: 't' })).toBe(false);
  });

  it('returns true when all three matrix credentials are set', () => {
    expect(
      hasPluginCredentials('matrix', {
        homeserverUrl: 'https://matrix.org',
        accessToken: 'syt_xxx',
        userId: '@bot:matrix.org',
      })
    ).toBe(true);
  });
});
