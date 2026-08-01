/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * RT-F4-03 regression: the weixin login preload listeners must enforce
 * single-active-listener semantics so an XSS-injected `weixinLoginOnDone`
 * callback cannot persist and receive a later login's accountId.
 */

type IpcListener = (event: unknown, ...args: unknown[]) => void;
type ExposedApi = {
  weixinLoginOnQR: (callback: (data: { qrcodeUrl: string }) => void) => () => void;
  weixinLoginOnScanned: (callback: () => void) => () => void;
  weixinLoginOnDone: (callback: (data: { accountId: string }) => void) => () => void;
  getConstitutionClassicRecovery: () => Promise<unknown>;
  decideConstitutionClassicRecovery: (request: unknown) => Promise<unknown>;
  resumeConstitutionClassicRecovery: (request: unknown) => Promise<unknown>;
};

// Minimal in-memory ipcRenderer that mirrors Electron's add/remove semantics.
const listeners: Record<string, IpcListener[]> = {};
const ipcRenderer = {
  invoke: vi.fn(async () => undefined),
  on: vi.fn((channel: string, listener: IpcListener) => {
    (listeners[channel] ??= []).push(listener);
  }),
  off: vi.fn((channel: string, listener: IpcListener) => {
    listeners[channel] = (listeners[channel] ?? []).filter((l) => l !== listener);
  }),
  removeListener: vi.fn((channel: string, listener: IpcListener) => {
    listeners[channel] = (listeners[channel] ?? []).filter((l) => l !== listener);
  }),
};

// Capture the object passed to contextBridge.exposeInMainWorld('electronAPI', ...)
let exposedApi = {} as ExposedApi;

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn((_key: string, api: unknown) => {
      exposedApi = api as ExposedApi;
    }),
  },
  ipcRenderer,
  webUtils: { getPathForFile: vi.fn(() => '/tmp/file') },
}));

vi.mock('../../src/common/adapter/constant', () => ({
  ADAPTER_BRIDGE_EVENT_KEY: 'adapter:bridge:event',
}));

// `window` is referenced at module top-level for tray events.
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { dispatchEvent: vi.fn() },
});

function emit(channel: string, payload?: unknown) {
  for (const l of (listeners[channel] ?? []).slice()) {
    l({}, payload);
  }
}

function listenerCount(channel: string): number {
  return (listeners[channel] ?? []).length;
}

beforeEach(async () => {
  for (const key of Object.keys(listeners)) delete listeners[key];
  vi.clearAllMocks();
  // Re-import to re-run the module side effects against a clean listener map.
  vi.resetModules();
  await import('../../src/preload/main');
});

describe('weixin login preload listeners (RT-F4-03)', () => {
  it('keeps at most one done listener - a second registration removes the first', () => {
    const first = vi.fn();
    const second = vi.fn();

    exposedApi.weixinLoginOnDone(first);
    expect(listenerCount('weixin:login:done')).toBe(1);

    exposedApi.weixinLoginOnDone(second);
    // The stale (first) listener must be gone; only the latest survives.
    expect(listenerCount('weixin:login:done')).toBe(1);

    emit('weixin:login:done', { accountId: 'acct-123' });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith({ accountId: 'acct-123' });
  });

  it('done is one-shot: after firing, the listener is removed (no later login reaches it)', () => {
    const cb = vi.fn();
    exposedApi.weixinLoginOnDone(cb);

    emit('weixin:login:done', { accountId: 'first-login' });
    expect(cb).toHaveBeenCalledTimes(1);
    // Listener torn down - a subsequent legitimate login must NOT reach it.
    expect(listenerCount('weixin:login:done')).toBe(0);

    emit('weixin:login:done', { accountId: 'second-login' });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('done teardown removes the qr and scanned listeners too (whole flow)', () => {
    exposedApi.weixinLoginOnQR(vi.fn());
    exposedApi.weixinLoginOnScanned(vi.fn());
    exposedApi.weixinLoginOnDone(vi.fn());

    expect(listenerCount('weixin:login:qr')).toBe(1);
    expect(listenerCount('weixin:login:scanned')).toBe(1);

    emit('weixin:login:done', { accountId: 'acct' });

    expect(listenerCount('weixin:login:qr')).toBe(0);
    expect(listenerCount('weixin:login:scanned')).toBe(0);
    expect(listenerCount('weixin:login:done')).toBe(0);
  });

  it('qr/scanned also enforce single-active-listener', () => {
    const qr1 = vi.fn();
    const qr2 = vi.fn();
    exposedApi.weixinLoginOnQR(qr1);
    exposedApi.weixinLoginOnQR(qr2);
    expect(listenerCount('weixin:login:qr')).toBe(1);
    emit('weixin:login:qr', { qrcodeUrl: 'data:img' });
    expect(qr1).not.toHaveBeenCalled();
    expect(qr2).toHaveBeenCalledWith({ qrcodeUrl: 'data:img' });

    const sc1 = vi.fn();
    const sc2 = vi.fn();
    exposedApi.weixinLoginOnScanned(sc1);
    exposedApi.weixinLoginOnScanned(sc2);
    expect(listenerCount('weixin:login:scanned')).toBe(1);
    emit('weixin:login:scanned');
    expect(sc1).not.toHaveBeenCalled();
    expect(sc2).toHaveBeenCalledTimes(1);
  });

  it('the returned unsubscribe tears down the whole flow', () => {
    exposedApi.weixinLoginOnQR(vi.fn());
    exposedApi.weixinLoginOnScanned(vi.fn());
    const unsub = exposedApi.weixinLoginOnDone(vi.fn());

    expect(listenerCount('weixin:login:done')).toBe(1);
    unsub();
    expect(listenerCount('weixin:login:qr')).toBe(0);
    expect(listenerCount('weixin:login:scanned')).toBe(0);
    expect(listenerCount('weixin:login:done')).toBe(0);
  });

  it('preserves the legitimate flow: qr -> scanned -> done delivers in order', () => {
    const order: string[] = [];
    exposedApi.weixinLoginOnQR(() => order.push('qr'));
    exposedApi.weixinLoginOnScanned(() => order.push('scanned'));
    exposedApi.weixinLoginOnDone(() => order.push('done'));

    emit('weixin:login:qr', { qrcodeUrl: 'data:img' });
    emit('weixin:login:scanned');
    emit('weixin:login:done', { accountId: 'acct' });

    expect(order).toEqual(['qr', 'scanned', 'done']);
  });
});

describe('Constitution Classic recovery preload boundary', () => {
  it('exposes only the exact metadata, decision, and resume IPC channels', async () => {
    const decision = {
      operationId: '11111111-1111-4111-8111-111111111111',
      projectionReceiptSha256: `sha256:${'a'.repeat(64)}`,
      expectedRecoveryRevision: 'recovery:v1',
      password: 'correct',
      decision: { kind: 'promote' },
    };
    const resume = {
      operationId: '22222222-2222-4222-8222-222222222222',
      promotionId: '33333333-3333-4333-8333-333333333333',
      projectionReceiptSha256: `sha256:${'a'.repeat(64)}`,
      expectedRecoveryRevision: 'recovery:v2',
      expectedJournalHeadSha256: `sha256:${'b'.repeat(64)}`,
      password: 'correct',
    };

    await exposedApi.getConstitutionClassicRecovery();
    await exposedApi.decideConstitutionClassicRecovery(decision);
    await exposedApi.resumeConstitutionClassicRecovery(resume);

    expect(ipcRenderer.invoke).toHaveBeenNthCalledWith(1, 'constitution:classic-recovery:get');
    expect(ipcRenderer.invoke).toHaveBeenNthCalledWith(2, 'constitution:classic-recovery:decision', decision);
    expect(ipcRenderer.invoke).toHaveBeenNthCalledWith(3, 'constitution:classic-recovery:resume', resume);
  });
});
