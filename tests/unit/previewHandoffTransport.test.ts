/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SPEC-PREVIEW-PANE §4 Lane B, the acceptance that matters most in the feature:
 *
 *   "a PreviewTab whose content is >= 100,000 chars survives `preview.handoff`
 *    intact"
 *
 * `PreviewProvider`'s localStorage path drops any tab over 80,000 chars
 * (`sanitizeTabsForPersistence` / `parsePersistedTabs`), and the deliverable
 * this feature exists for is a 77 KB HTML brief that is still growing. So the
 * transport must carry the whole tab with NO storage anywhere in the path.
 *
 * This exercises the REAL adapter, not a stand-in:
 *   - `src/common/adapter/main.ts` installs the real `bridge.adapter` and is
 *     the module that owns the 50 MB payload guard;
 *   - the outbound leg is asserted on the exact string handed to
 *     `webContents.send`, then re-parsed the way `common/adapter/browser.ts`
 *     parses it in the renderer;
 *   - the inbound leg (renderer -> main provider param) is driven through the
 *     real `ipcMain.handle` callback registered by `main.ts`, including the
 *     `isAllowedInboundName` allowlist gate.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/** Captures the `ipcMain.handle(ADAPTER_BRIDGE_EVENT_KEY, ...)` callback. */
const ipcMainHandlers: Record<string, (event: unknown, info: string) => unknown> = {};

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (event: unknown, info: string) => unknown) => {
      ipcMainHandlers[channel] = handler;
    },
  },
  app: { isPackaged: false, getPath: () => '/tmp' },
}));

type SentPayload = { channel: string; value: string };

const sent: SentPayload[] = [];

function makeFakeWindow() {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    isDestroyed: () => false,
    on: (event: string, cb: () => void) => {
      (listeners[event] ||= []).push(cb);
    },
    webContents: {
      isDestroyed: () => false,
      send: (channel: string, value: string) => {
        sent.push({ channel, value });
      },
    },
  };
}

/** The exact shape `PreviewProvider` holds, at brief scale and then some. */
function makeBriefTab(contentLength: number) {
  // Deterministic, non-repeating-ish body so a truncation anywhere in the
  // middle is detectable by hash, not just by length.
  let body = '';
  let i = 0;
  while (body.length < contentLength) {
    body += `<tr data-row="${i}"><td>market-cell-${i}</td><td>${(i * 7919) % 100003}</td></tr>\n`;
    i++;
  }
  body = body.slice(0, contentLength);
  return {
    id: 'preview-morning-brief',
    content: body,
    contentType: 'html' as const,
    title: 'morning-brief.html',
    metadata: {
      fileName: 'morning-brief.html',
      filePath: '/Users/sean/workspace/morning-brief.html',
      workspace: '/Users/sean/workspace',
      editable: true,
    },
    isDirty: false,
    originalContent: body,
    isStreaming: false,
  };
}

const CONTENT_LENGTH = 100_000;
/** The persistence ceiling in PreviewProvider that this transport must beat. */
const MAX_PERSISTED_TAB_CONTENT_LENGTH = 80_000;

let ipcBridgeModule: typeof import('@/common/adapter/ipcBridge');
let mainAdapter: typeof import('@/common/adapter/main');
let allowlist: typeof import('@/common/adapter/bridgeAllowlist');
let ADAPTER_BRIDGE_EVENT_KEY: string;

beforeAll(async () => {
  mainAdapter = await import('@/common/adapter/main');
  ipcBridgeModule = await import('@/common/adapter/ipcBridge');
  allowlist = await import('@/common/adapter/bridgeAllowlist');
  ADAPTER_BRIDGE_EVENT_KEY = (await import('@/common/adapter/constant')).ADAPTER_BRIDGE_EVENT_KEY;
  mainAdapter.initMainAdapterWithWindow(makeFakeWindow() as never);
});

beforeEach(() => {
  sent.length = 0;
});

describe('preview.handoff transport - a 100,000-char tab survives intact', () => {
  it('the fixture is genuinely bigger than the storage path would accept', () => {
    const tab = makeBriefTab(CONTENT_LENGTH);
    expect(tab.content.length).toBe(CONTENT_LENGTH);
    expect(tab.content.length).toBeGreaterThan(MAX_PERSISTED_TAB_CONTENT_LENGTH);
  });

  it('carries the whole tab main -> renderer with identical length, head and tail', () => {
    const tab = makeBriefTab(CONTENT_LENGTH);

    ipcBridgeModule.preview.handoff.emit({ tab, direction: 'popout' });

    const frames = sent.filter((s) => s.channel === ADAPTER_BRIDGE_EVENT_KEY);
    expect(frames).toHaveLength(1);

    // Parse it exactly the way common/adapter/browser.ts does in the renderer.
    const parsed = JSON.parse(frames[0].value) as {
      name: string;
      data: { tab: typeof tab; direction: string };
    };

    expect(parsed.name).toBe('preview.handoff');
    expect(parsed.data.direction).toBe('popout');

    const received = parsed.data.tab;
    expect(received.content.length).toBe(CONTENT_LENGTH);
    expect(received.content.slice(0, 256)).toBe(tab.content.slice(0, 256));
    expect(received.content.slice(-256)).toBe(tab.content.slice(-256));
    // Byte-for-byte, not just the ends.
    expect(received.content).toBe(tab.content);
    expect(received).toEqual(tab);
  });

  it('never trips the 50 MB payload guard, and no bridge:error frame is sent', () => {
    const tab = makeBriefTab(CONTENT_LENGTH);
    ipcBridgeModule.preview.handoff.emit({ tab, direction: 'popout' });

    const frames = sent.filter((s) => s.channel === ADAPTER_BRIDGE_EVENT_KEY);
    expect(frames).toHaveLength(1);
    const serializedBytes = Buffer.byteLength(frames[0].value, 'utf8');
    // Documented for the record: ~100 KB against a 50 MB ceiling.
    expect(serializedBytes).toBeLessThan(50 * 1024 * 1024);
    expect(JSON.parse(frames[0].value).name).not.toBe('bridge:error');
  });

  it('the dock-back direction carries the tab home just as intact', () => {
    const tab = makeBriefTab(CONTENT_LENGTH);
    ipcBridgeModule.preview.handoff.emit({ tab, direction: 'dock-back' });

    const parsed = JSON.parse(sent[0].value) as { data: { tab: typeof tab; direction: string } };
    expect(parsed.data.direction).toBe('dock-back');
    expect(parsed.data.tab.content).toBe(tab.content);
  });

  it('a `preview.handoff.on` subscriber receives the same 100,000 chars off the wire', () => {
    const tab = makeBriefTab(CONTENT_LENGTH);
    let receivedLength = -1;
    let receivedContent = '';
    const off = ipcBridgeModule.preview.handoff.on(({ tab: t }) => {
      receivedLength = t.content.length;
      receivedContent = t.content;
    });

    ipcBridgeModule.preview.handoff.emit({ tab, direction: 'popout' });

    // Replay the renderer's receive step verbatim: common/adapter/browser.ts
    // does `JSON.parse(value)` then `emitter.emit(name, data)` on the very
    // emitter the adapter handed us. Nothing else stands between the wire and
    // the subscriber - in particular, no storage.
    const { name, data } = JSON.parse(sent[0].value) as { name: string; data: unknown };
    expect(name).toBe('preview.handoff');
    mainAdapter.getBridgeEmitter()!.emit(name, data);

    off();
    expect(receivedLength).toBe(CONTENT_LENGTH);
    expect(receivedContent).toBe(tab.content);
  });
});

describe('preview.popout inbound leg - renderer -> main carries the tab too', () => {
  it('is accepted by the C1 inbound allowlist with NO bridgeAllowlist.ts edit', () => {
    // The spec claims every provider/emitter is recorded automatically at
    // module load. `buildProvider` in bridgeAllowlist.ts does exactly that, and
    // ipcBridge.ts calls the WRAPPED builder - so declaring the key is enough.
    expect(allowlist.isAllowedInboundName('subscribe-preview.popout')).toBe(true);
    expect(allowlist.isAllowedInboundName('subscribe-preview.dock-back')).toBe(true);
    // Sanity: the gate is real and not just returning true for everything.
    expect(allowlist.isAllowedInboundName('subscribe-preview.not-a-real-key')).toBe(false);

    const registered = allowlist._getRegisteredKeysForTests();
    expect(registered.providers.has('preview.popout')).toBe(true);
    expect(registered.providers.has('preview.dock-back')).toBe(true);
    expect(registered.emitters.has('preview.handoff')).toBe(true);
  });

  it('a 100,000-char tab survives the preload JSON.stringify -> ipcMain JSON.parse leg', async () => {
    const tab = makeBriefTab(CONTENT_LENGTH);

    let seenByProvider: typeof tab | null = null;
    ipcBridgeModule.preview.popout.provider(async ({ tab: t }) => {
      seenByProvider = t as typeof tab;
      return { ok: true, alreadyOpen: false };
    });

    // Exactly what src/preload/main.ts's electronAPI.emit puts on the wire.
    // `{ id, data }` is the platform's provider-invocation envelope (the id is
    // what the `subscribe.callback-<key><id>` response is keyed by).
    const wire = JSON.stringify({
      name: 'subscribe-preview.popout',
      data: { id: 'preview.popout0badc0de', data: { tab } },
    });
    expect(Buffer.byteLength(wire, 'utf8')).toBeGreaterThan(CONTENT_LENGTH);

    const handler = ipcMainHandlers[ADAPTER_BRIDGE_EVENT_KEY];
    expect(handler).toBeTypeOf('function');
    await handler({}, wire);

    expect(seenByProvider).not.toBeNull();
    expect(seenByProvider!.content.length).toBe(CONTENT_LENGTH);
    expect(seenByProvider!.content).toBe(tab.content);
  });
});

describe('the mirrored PreviewPopoutTab cannot drift from the renderer PreviewTab', () => {
  it('is assignable in both directions (compile-time)', () => {
    type Wire = import('@/common/adapter/ipcBridge').PreviewPopoutTab;
    type Renderer = import('@renderer/pages/conversation/Preview/context/PreviewContext').PreviewTab;

    // These fail `tsc --noEmit` if either side gains or loses a field.
    const assertWireIsRenderer: (t: Wire) => Renderer = (t) => t;
    const assertRendererIsWire: (t: Renderer) => Wire = (t) => t;

    expect(assertWireIsRenderer).toBeTypeOf('function');
    expect(assertRendererIsWire).toBeTypeOf('function');
  });
});
