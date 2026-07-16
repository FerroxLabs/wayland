/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #684: a provider invocation (`subscribe-<key>` carrying `{ id, data }`) only
 * settles the caller's `invoke()` promise when `subscribe.callback-<key><id>`
 * comes back - the wire protocol has no reject path. The WS adapter used to
 * silently DROP rejected invocations (disallowed name / remote-forbidden),
 * leaving the remote caller pending forever (WebUI stuck at "Drafting...").
 *
 * These tests pin the fix: a rejected `subscribe-` invocation gets an
 * error-shaped callback reply on the invoking socket, while allowed
 * invocations still dispatch to the bridge emitter with no such reply.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { wsManagerMock, capturedHandler, registryMocks } = vi.hoisted(() => {
  const captured: { fn: ((name: string, data: unknown, ws: unknown) => void) | null } = { fn: null };
  const manager = {
    initialize: vi.fn(),
    setupConnectionHandler: vi.fn((cb: (name: string, data: unknown, ws: unknown) => void) => {
      captured.fn = cb;
    }),
    broadcast: vi.fn(),
    destroy: vi.fn(),
  };
  const emitter = { emit: vi.fn() };
  return {
    wsManagerMock: manager,
    capturedHandler: captured,
    registryMocks: {
      emitter,
      registerWebSocketBroadcaster: vi.fn(() => () => {}),
      getBridgeEmitter: vi.fn(() => emitter),
    },
  };
});

vi.mock('@process/webserver/websocket/WebSocketManager', () => ({
  WebSocketManager: vi.fn(function MockWebSocketManager() {
    return wsManagerMock;
  }),
}));

vi.mock('@/common/adapter/registry', () => ({
  registerWebSocketBroadcaster: registryMocks.registerWebSocketBroadcaster,
  getBridgeEmitter: registryMocks.getBridgeEmitter,
}));

import { buildProvider } from '@/common/adapter/bridgeAllowlist';
import { initWebAdapter } from '@process/webserver/adapter';

// Register the keys under test in the inbound allowlist, exactly as ipcBridge
// does at module load. `project.generate-knowledge-draft` is in the remote
// denylist (the #684 trigger); `conversation.get-list-684-test` is not.
buildProvider('project.generate-knowledge-draft');
buildProvider('conversation.get-list-684-test');
// #819: the shared config setter — wire-allowed (the paired WebUI writes config),
// value-gated so a remote peer cannot write `webui.desktop.*` and arm LAN exposure.
buildProvider('agent.config.storage.set');

function makeWs(): { send: ReturnType<typeof vi.fn> } {
  return { send: vi.fn() };
}

describe('webserver adapter - rejected bridge invocations settle the caller (#684)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedHandler.fn = null;
    initWebAdapter({} as never);
    expect(capturedHandler.fn).toBeTypeOf('function');
  });

  it('replies with an error-shaped subscribe.callback for a remote-forbidden invocation', () => {
    const ws = makeWs();
    const id = 'project.generate-knowledge-draft0a1b2c3d';
    capturedHandler.fn!('subscribe-project.generate-knowledge-draft', { id, data: { kind: 'context' } }, ws);

    // Never dispatched to the bridge - the deny still holds.
    expect(registryMocks.emitter.emit).not.toHaveBeenCalled();

    // But the caller's pending invoke() is settled with an error result.
    expect(ws.send).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(ws.send.mock.calls[0][0] as string);
    expect(payload.name).toBe(`subscribe.callback-project.generate-knowledge-draft${id}`);
    expect(payload.data).toEqual({ error: 'failed', detail: 'remote-forbidden' });
  });

  it('replies with an error-shaped subscribe.callback for a non-allowlisted invocation', () => {
    const ws = makeWs();
    const id = 'totally-unknown-provider0a1b2c3d';
    capturedHandler.fn!('subscribe-totally-unknown-provider', { id, data: {} }, ws);

    expect(registryMocks.emitter.emit).not.toHaveBeenCalled();
    expect(ws.send).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(ws.send.mock.calls[0][0] as string);
    expect(payload.name).toBe(`subscribe.callback-totally-unknown-provider${id}`);
    expect(payload.data).toEqual({ error: 'failed', detail: 'not-allowed' });
  });

  it('does not reply when the rejected message carries no usable invocation id', () => {
    const ws = makeWs();
    capturedHandler.fn!('subscribe-project.generate-knowledge-draft', { data: {} }, ws);
    capturedHandler.fn!('subscribe-project.generate-knowledge-draft', null, ws);
    capturedHandler.fn!('subscribe-project.generate-knowledge-draft', { id: 42 }, ws);
    capturedHandler.fn!('subscribe-project.generate-knowledge-draft', { id: 'x'.repeat(300) }, ws);

    expect(ws.send).not.toHaveBeenCalled();
    expect(registryMocks.emitter.emit).not.toHaveBeenCalled();
  });

  it('survives a send() failure on a closing socket', () => {
    const ws = {
      send: vi.fn(() => {
        throw new Error('socket closed');
      }),
    };
    expect(() =>
      capturedHandler.fn!(
        'subscribe-project.generate-knowledge-draft',
        { id: 'project.generate-knowledge-draftdeadbeef' },
        ws
      )
    ).not.toThrow();
  });

  it('still dispatches allowed invocations to the bridge emitter with no rejection reply', () => {
    const ws = makeWs();
    const message = { id: 'conversation.get-list-684-testdeadbeef', data: {} };
    capturedHandler.fn!('subscribe-conversation.get-list-684-test', message, ws);

    expect(registryMocks.emitter.emit).toHaveBeenCalledWith('subscribe-conversation.get-list-684-test', message);
    expect(ws.send).not.toHaveBeenCalled();
  });
});

describe('webserver adapter - remote peer cannot arm LAN exposure via a config write (#819)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedHandler.fn = null;
    initWebAdapter({} as never);
    expect(capturedHandler.fn).toBeTypeOf('function');
  });

  const NAME = 'subscribe-agent.config.storage.set';

  it('blocks a remote webui.desktop.allowRemote write and settles the caller', () => {
    const ws = makeWs();
    const id = 'agent.config.storage.setdeadbeef';
    capturedHandler.fn!(NAME, { id, data: { key: 'webui.desktop.allowRemote', data: true } }, ws);

    // The write never reaches the store — no auto-bind on the next launch.
    expect(registryMocks.emitter.emit).not.toHaveBeenCalled();
    // The caller's invoke() settles instead of hanging (#684 contract).
    expect(ws.send).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(ws.send.mock.calls[0][0] as string);
    expect(payload.name).toBe(`subscribe.callback-agent.config.storage.set${id}`);
    expect(payload.data).toEqual({ error: 'failed', detail: 'remote-forbidden' });
  });

  it('also blocks the enabled half of a from-cold auto-bind', () => {
    const ws = makeWs();
    capturedHandler.fn!(
      NAME,
      { id: 'agent.config.storage.setcafebabe', data: { key: 'webui.desktop.enabled', data: true } },
      ws
    );
    expect(registryMocks.emitter.emit).not.toHaveBeenCalled();
  });

  it('still dispatches a legitimate config write the paired WebUI needs', () => {
    const ws = makeWs();
    const message = { id: 'agent.config.storage.setfeedface', data: { key: 'theme', data: 'dark' } };
    capturedHandler.fn!(NAME, message, ws);

    expect(registryMocks.emitter.emit).toHaveBeenCalledWith(NAME, message);
    expect(ws.send).not.toHaveBeenCalled();
  });
});
