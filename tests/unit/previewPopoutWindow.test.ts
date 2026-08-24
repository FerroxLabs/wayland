/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SPEC-PREVIEW-PANE §4 Lane B - the window half.
 *
 *  - the preview pop-out opens at 1240 x 900 and does NOT inherit the shared
 *    `conversation.popoutBounds` geometry (nor overwrite it);
 *  - closing the window emits dock-back EXACTLY ONCE, by every close path, so
 *    the OS red button and the in-app Dock back control are the same action;
 *  - `conversation.dockBack` still behaves exactly as it did.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

type Listener = (...args: unknown[]) => void;

class FakeWebContents {
  static nextId = 1;
  id = FakeWebContents.nextId++;
  private listeners: Record<string, Listener[]> = {};
  loading = true;
  setWindowOpenHandler = vi.fn();
  isDestroyed = () => false;
  on(event: string, cb: Listener) {
    (this.listeners[event] ||= []).push(cb);
  }
  once(event: string, cb: Listener) {
    const wrapped: Listener = (...args) => {
      this.off(event, wrapped);
      cb(...args);
    };
    this.on(event, wrapped);
  }
  off(event: string, cb: Listener) {
    const list = this.listeners[event];
    if (!list) return;
    const i = list.indexOf(cb);
    if (i > -1) list.splice(i, 1);
  }
  isLoading() {
    return this.loading;
  }
  fire(event: string) {
    // Copy first: a listener may unregister itself while we iterate.
    for (const cb of (this.listeners[event] ?? []).slice()) cb();
  }
}

class FakeBrowserWindow {
  static instances: FakeBrowserWindow[] = [];
  static optionsLog: Record<string, unknown>[] = [];

  options: Record<string, unknown>;
  webContents = new FakeWebContents();
  private listeners: Record<string, Listener[]> = {};
  private destroyed = false;

  constructor(options: Record<string, unknown>) {
    this.options = options;
    FakeBrowserWindow.instances.push(this);
    FakeBrowserWindow.optionsLog.push(options);
  }
  isDestroyed = () => this.destroyed;
  isMinimized = () => false;
  isVisible = () => true;
  restore = vi.fn();
  show = vi.fn();
  focus = vi.fn();
  getBounds = () => ({ x: 0, y: 0, width: 1240, height: 900 });
  on(event: string, cb: Listener) {
    (this.listeners[event] ||= []).push(cb);
  }
  once(event: string, cb: Listener) {
    this.on(event, cb);
  }
  fire(event: string) {
    // Copy first: a listener may unregister itself while we iterate.
    for (const cb of (this.listeners[event] ?? []).slice()) cb();
  }
  /** Mirrors Electron: close() and destroy() both end in a `closed` event. */
  close() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.fire('closed');
  }
  destroy() {
    this.close();
  }
  loadFile(_file: string, _opts: unknown) {
    this.webContents.loading = false;
    this.webContents.fire('did-finish-load');
    return Promise.resolve();
  }
  loadURL(_url: string) {
    this.webContents.loading = false;
    this.webContents.fire('did-finish-load');
    return Promise.resolve();
  }
}

const WORK_AREA = { x: 0, y: 0, width: 1920, height: 1080 };

vi.mock('electron', () => ({
  app: { isPackaged: true },
  BrowserWindow: FakeBrowserWindow,
  screen: {
    getAllDisplays: () => [{ id: 1, workArea: WORK_AREA }],
    getPrimaryDisplay: () => ({ id: 1, workArea: WORK_AREA }),
    getDisplayNearestPoint: () => ({ id: 1, workArea: WORK_AREA }),
  },
}));

vi.mock('@/common/adapter/main', () => ({ initMainAdapterWithWindow: vi.fn() }));
vi.mock('@process/utils/mainBundlePath', () => ({ resolveMainBundlePath: (p: string) => p }));

/**
 * A conversation pop-out was last left at 640 x 480 on display 1. The preview
 * window must ignore this entirely - that shared key is exactly the trap.
 */
const PERSISTED_CONVERSATION_BOUNDS = { x: 100, y: 100, width: 640, height: 480, displayId: 1 };
const processConfigSet = vi.fn(async () => undefined);
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: vi.fn(async () => PERSISTED_CONVERSATION_BOUNDS),
    set: (...args: unknown[]) => processConfigSet(...(args as [])),
  },
}));

type ProviderFn = (params: never) => Promise<unknown>;
const providers: Record<string, ProviderFn> = {};
const captureProvider = (name: string) => ({ provider: (fn: ProviderFn) => void (providers[name] = fn) });

const handoffEmit = vi.fn();
const popoutClosedEmit = vi.fn();

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      popout: captureProvider('conversation.popout'),
      dockBack: captureProvider('conversation.dockBack'),
      popoutClosed: { emit: (...a: unknown[]) => popoutClosedEmit(...a) },
    },
    preview: {
      popout: captureProvider('preview.popout'),
      dockBack: captureProvider('preview.dockBack'),
      handoff: { emit: (...a: unknown[]) => handoffEmit(...a) },
    },
  },
}));

const TAB = {
  id: 'preview-morning-brief',
  content: '<html>brief</html>',
  contentType: 'html' as const,
  title: 'morning-brief.html',
};

async function loadBridge() {
  vi.resetModules();
  for (const key of Object.keys(providers)) delete providers[key];
  FakeBrowserWindow.instances = [];
  FakeBrowserWindow.optionsLog = [];
  handoffEmit.mockClear();
  popoutClosedEmit.mockClear();
  processConfigSet.mockClear();

  const bridge = await import('@process/bridge/popoutBridge');
  bridge.initPopoutBridge();
  return bridge;
}

beforeEach(async () => {
  await loadBridge();
});

describe('preview pop-out window geometry', () => {
  it('opens at 1240 x 900', async () => {
    const result = (await providers['preview.popout']({ tab: TAB } as never)) as {
      ok: boolean;
      alreadyOpen: boolean;
    };
    expect(result).toEqual({ ok: true, alreadyOpen: false });

    expect(FakeBrowserWindow.optionsLog).toHaveLength(1);
    const opts = FakeBrowserWindow.optionsLog[0];
    expect(opts.width).toBe(1240);
    expect(opts.height).toBe(900);
  });

  it('ignores the shared conversation pop-out geometry instead of inheriting 640 x 480', async () => {
    await providers['preview.popout']({ tab: TAB } as never);
    const opts = FakeBrowserWindow.optionsLog[0];
    expect(opts.width).not.toBe(PERSISTED_CONVERSATION_BOUNDS.width);
    expect(opts.height).not.toBe(PERSISTED_CONVERSATION_BOUNDS.height);
    // centred on the primary work area
    expect(opts.x).toBe(Math.round((WORK_AREA.width - 1240) / 2));
    expect(opts.y).toBe(Math.round((WORK_AREA.height - 900) / 2));
  });

  it('never writes its geometry back into the shared conversation bounds key', async () => {
    await providers['preview.popout']({ tab: TAB } as never);
    FakeBrowserWindow.instances[0].fire('resize');
    FakeBrowserWindow.instances[0].fire('move');
    await new Promise((r) => setTimeout(r, 350));
    expect(processConfigSet).not.toHaveBeenCalled();
  });

  it('keeps the security shell identical to the conversation pop-out', async () => {
    await providers['preview.popout']({ tab: TAB } as never);
    const prefs = FakeBrowserWindow.optionsLog[0].webPreferences as Record<string, unknown>;
    expect(prefs.sandbox).toBe(true);
    expect(prefs.contextIsolation).toBe(true);
    expect(prefs.nodeIntegration).toBe(false);
    expect(prefs.nodeIntegrationInWorker).toBe(false);
  });
});

describe('preview handoff is emitted once the popped renderer has loaded', () => {
  it('emits direction:popout after did-finish-load, not before', async () => {
    await providers['preview.popout']({ tab: TAB } as never);
    expect(handoffEmit).toHaveBeenCalledTimes(1);
    expect(handoffEmit).toHaveBeenCalledWith({ tab: TAB, direction: 'popout' });
  });

  it('a second deliverable while popped re-hands off into the SAME window', async () => {
    await providers['preview.popout']({ tab: TAB } as never);
    handoffEmit.mockClear();

    const second = { ...TAB, id: 'preview-second', title: 'second.html' };
    const result = (await providers['preview.popout']({ tab: second } as never)) as { alreadyOpen: boolean };

    expect(result.alreadyOpen).toBe(true);
    expect(FakeBrowserWindow.instances).toHaveLength(1);
    expect(handoffEmit).toHaveBeenCalledTimes(1);
    expect(handoffEmit).toHaveBeenCalledWith({ tab: second, direction: 'popout' });
  });
});

describe('closing the preview window emits dock-back exactly once', () => {
  it('via the OS close button', async () => {
    await providers['preview.popout']({ tab: TAB } as never);
    handoffEmit.mockClear();

    FakeBrowserWindow.instances[0].close();

    expect(handoffEmit).toHaveBeenCalledTimes(1);
    expect(handoffEmit).toHaveBeenCalledWith({ tab: TAB, direction: 'dock-back' });
  });

  it('via the preview.dockBack provider - same single emission, and it returns the tab', async () => {
    await providers['preview.popout']({ tab: TAB } as never);
    handoffEmit.mockClear();

    const result = (await providers['preview.dockBack'](undefined as never)) as {
      ok: boolean;
      tab: unknown;
    };

    expect(result.ok).toBe(true);
    expect(result.tab).toEqual(TAB);
    expect(handoffEmit).toHaveBeenCalledTimes(1);
    expect(handoffEmit).toHaveBeenCalledWith({ tab: TAB, direction: 'dock-back' });
  });

  it('does not emit a second time when dockBack is called after the window already closed', async () => {
    await providers['preview.popout']({ tab: TAB } as never);
    FakeBrowserWindow.instances[0].close();
    handoffEmit.mockClear();

    const result = (await providers['preview.dockBack'](undefined as never)) as { ok: boolean; tab: unknown };

    expect(result.ok).toBe(false);
    expect(result.tab).toBeNull();
    expect(handoffEmit).not.toHaveBeenCalled();
  });

  it('does not emit dock-back when there was never a pop-out', async () => {
    const result = (await providers['preview.dockBack'](undefined as never)) as { ok: boolean };
    expect(result.ok).toBe(false);
    expect(handoffEmit).not.toHaveBeenCalled();
  });

  it('never emits a conversation popoutClosed for a preview window', async () => {
    await providers['preview.popout']({ tab: TAB } as never);
    FakeBrowserWindow.instances[0].close();
    expect(popoutClosedEmit).not.toHaveBeenCalled();
  });
});

describe('conversation pop-out behaviour is unchanged', () => {
  it('still opens at the persisted shared bounds, not at the preview size', async () => {
    await providers['conversation.popout']({ conversation_id: 'conv-1' } as never);
    const opts = FakeBrowserWindow.optionsLog[0];
    expect(opts.width).toBe(PERSISTED_CONVERSATION_BOUNDS.width);
    expect(opts.height).toBe(PERSISTED_CONVERSATION_BOUNDS.height);
    expect(opts.x).toBe(PERSISTED_CONVERSATION_BOUNDS.x);
    expect(opts.y).toBe(PERSISTED_CONVERSATION_BOUNDS.y);
  });

  it('still persists its geometry on resize', async () => {
    await providers['conversation.popout']({ conversation_id: 'conv-1' } as never);
    FakeBrowserWindow.instances[0].fire('resize');
    await new Promise((r) => setTimeout(r, 350));
    expect(processConfigSet).toHaveBeenCalledWith(
      'conversation.popoutBounds',
      expect.objectContaining({ width: 1240, height: 900 })
    );
  });

  it('conversation.dockBack still closes by raw conversation id and emits popoutClosed once', async () => {
    await providers['conversation.popout']({ conversation_id: 'conv-1' } as never);
    popoutClosedEmit.mockClear();

    const result = (await providers['conversation.dockBack']({ conversation_id: 'conv-1' } as never)) as {
      ok: boolean;
    };

    expect(result).toEqual({ ok: true });
    expect(popoutClosedEmit).toHaveBeenCalledTimes(1);
    expect(popoutClosedEmit).toHaveBeenCalledWith({ conversation_id: 'conv-1' });
    // and it must NOT have gone anywhere near the preview handoff channel
    expect(handoffEmit).not.toHaveBeenCalled();
  });

  it('conversation.dockBack cannot close the preview pop-out by passing its route key', async () => {
    await providers['preview.popout']({ tab: TAB } as never);
    handoffEmit.mockClear();

    // A raw conversation id never matches the `route:` namespace...
    const byRawRoute = (await providers['conversation.dockBack']({ conversation_id: 'preview' } as never)) as {
      ok: boolean;
    };
    expect(byRawRoute.ok).toBe(false);
    expect(handoffEmit).not.toHaveBeenCalled();
    expect(FakeBrowserWindow.instances[0].isDestroyed()).toBe(false);
  });
});

describe('the preview route is on the pop-out allowlist', () => {
  it('accepts preview and still rejects everything unlisted', async () => {
    const routes = await import('@process/utils/popoutRoutes');
    expect(routes.isAllowedPopoutRoute('preview')).toBe(true);
    expect(routes.POPOUT_ALLOWED_ROUTES).toContain('preview');
    expect(routes.routePopoutKey('preview')).toBe('route:preview');
    expect(routes.routePopoutHash('preview')).toBe('#/preview?mode=popout');
    expect(routes.routePopoutLoadFileHash('preview')).toBe('/preview?mode=popout');
    expect(routes.PREVIEW_POPOUT_SIZE).toEqual({ width: 1240, height: 900 });

    expect(routes.isAllowedPopoutRoute('preview/../settings')).toBe(false);
    expect(routes.isAllowedPopoutRoute('preview?mode=evil')).toBe(false);
    expect(routes.isAllowedPopoutRoute('')).toBe(false);
  });
});
