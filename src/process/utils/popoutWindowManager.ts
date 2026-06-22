/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pop-out window manager (#27 phase 2; #157 route pop-outs).
 *
 * Opens a single conversation - or an allowlisted top-level route such as
 * Mission Control - in its own OS BrowserWindow for multi-monitor work. The
 * window loads the SAME renderer entry as the main window, deep-linked with
 * `?mode=popout` (e.g. `#/conversation/<id>?mode=popout` or
 * `#/mission-control?mode=popout`) so the renderer hides the sider / tab bar and
 * runs as a focused standalone surface.
 *
 * Live agent streams need NO new plumbing: each pop-out registers via
 * `initMainAdapterWithWindow`, and `common/adapter/main.ts` already broadcasts
 * every bridge event (responseStream / turnCompleted / confirmations) to ALL
 * registered windows. The renderer filters by conversation_id.
 *
 * Owner decisions honored here:
 *  - Dedupe: a second pop-out of the same conversation focuses the existing one.
 *  - Custom Wayland titlebar: macOS uses `titleBarStyle: 'hidden'` + traffic
 *    lights (matching the main window); Windows/Linux are frameless and the
 *    renderer draws WindowControls.
 *  - Ephemeral: only window GEOMETRY is persisted (shared bounds), never the
 *    window-to-conversation map - pop-outs are not restored on relaunch.
 *
 * Security mirrors the main window (see src/index.ts createWindow): identical
 * webPreferences, `setWindowOpenHandler(deny)`, and a `will-navigate` origin
 * guard. The first-party media-permission check in src/index.ts also consults
 * `isPopoutWebContents` so voice works in a pop-out.
 */

import path from 'node:path';
import fs from 'node:fs';
import { app, BrowserWindow, screen } from 'electron';
import { ipcBridge } from '@/common';
import { ProcessConfig } from '@process/utils/initStorage';
import { initMainAdapterWithWindow } from '@/common/adapter/main';
import { resolvePopoutAction, resolvePopoutBounds, type PopoutBounds } from '@process/utils/popoutBounds';
import {
  isAllowedPopoutRoute,
  routePopoutHash,
  routePopoutKey,
  routePopoutLoadFileHash,
} from '@process/utils/popoutRoutes';

/**
 * Registry of live pop-out windows keyed by conversation id. Window instances
 * are only ever inserted by `openPopoutWindow`. The pure dedupe / bounds logic
 * lives in `popoutBounds.ts` (unit-tested without Electron).
 */
const popouts = new Map<string, BrowserWindow>();

// -- Electron lifecycle -----------------------------------------------------

/** True when the given webContents belongs to a live pop-out window. */
export function isPopoutWebContents(webContentsId: number): boolean {
  for (const win of popouts.values()) {
    if (!win.isDestroyed() && !win.webContents.isDestroyed() && win.webContents.id === webContentsId) {
      return true;
    }
  }
  return false;
}

/** The expected renderer origin, mirroring the main window's will-navigate guard. */
function getExpectedRendererOrigin(): string | null {
  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devUrl) {
    try {
      return new URL(devUrl).origin;
    } catch {
      return null;
    }
  }
  return 'file://';
}

async function readPersistedBounds(): Promise<PopoutBounds | null> {
  try {
    return (await ProcessConfig.get('conversation.popoutBounds')) ?? null;
  } catch (err) {
    console.warn('[Popout] Failed to read persisted bounds:', err);
    return null;
  }
}

let boundsSaveTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersistBounds(win: BrowserWindow): void {
  if (boundsSaveTimer) clearTimeout(boundsSaveTimer);
  boundsSaveTimer = setTimeout(() => {
    boundsSaveTimer = null;
    if (win.isDestroyed()) return;
    const { x, y, width, height } = win.getBounds();
    const display = screen.getDisplayNearestPoint({
      x: Math.round(x + width / 2),
      y: Math.round(y + height / 2),
    });
    void ProcessConfig.set('conversation.popoutBounds', { x, y, width, height, displayId: display.id }).catch((err) => {
      console.warn('[Popout] Failed to persist bounds:', err);
    });
  }, 300);
}

/**
 * Open (or focus) a pop-out window for a conversation. Returns `alreadyOpen:true`
 * when an existing window was focused instead of a new one created.
 */
export async function openPopoutWindow(conversationId: string): Promise<{ ok: boolean; alreadyOpen: boolean }> {
  return openPopout({
    key: conversationId,
    deepLink: `#/conversation/${encodeURIComponent(conversationId)}?mode=popout`,
    loadFileHash: `/conversation/${encodeURIComponent(conversationId)}?mode=popout`,
    // Conversation pop-outs notify all windows on close so the main-window tab
    // un-dims its placeholder. Route pop-outs have no such placeholder.
    onClosed: () => {
      try {
        ipcBridge.conversation.popoutClosed.emit({ conversation_id: conversationId });
      } catch (err) {
        console.warn('[Popout] Failed to emit popoutClosed:', err);
      }
    },
  });
}

/**
 * Open (or focus) a pop-out window for an allowlisted top-level route (e.g.
 * Mission Control), reusing the conversation pop-out window infrastructure
 * (#157). Rejects any route not on the allowlist - `route` is renderer-supplied.
 */
export async function openRoutePopoutWindow(route: string): Promise<{ ok: boolean; alreadyOpen: boolean }> {
  if (!isAllowedPopoutRoute(route)) {
    console.warn('[Popout] Rejected non-allowlisted route pop-out:', route);
    return { ok: false, alreadyOpen: false };
  }
  return openPopout({
    key: routePopoutKey(route),
    deepLink: routePopoutHash(route),
    loadFileHash: routePopoutLoadFileHash(route),
  });
}

/**
 * Shared pop-out window creation, keyed by an arbitrary registry key. Dedupes
 * (focuses an existing live window), creates a chrome-less BrowserWindow loading
 * `deepLink`, registers it for live bridge streams, and persists shared geometry.
 * `onClosed` runs after the window closes (in addition to registry cleanup).
 */
async function openPopout(opts: {
  key: string;
  deepLink: string;
  loadFileHash: string;
  onClosed?: () => void;
}): Promise<{ ok: boolean; alreadyOpen: boolean }> {
  const { key, deepLink, loadFileHash, onClosed } = opts;
  if (resolvePopoutAction(popouts, key) === 'focus') {
    const existing = popouts.get(key)!;
    if (existing.isMinimized()) existing.restore();
    existing.show();
    existing.focus();
    return { ok: true, alreadyOpen: true };
  }

  const persisted = await readPersistedBounds();
  const { x, y, width, height } = resolvePopoutBounds(
    persisted,
    screen.getAllDisplays().map((d) => ({ id: d.id, workArea: d.workArea })),
    screen.getPrimaryDisplay().workArea
  );

  let devIcon: Electron.NativeImage | undefined;
  if (!app.isPackaged && process.platform !== 'darwin') {
    try {
      const iconFile = process.platform === 'win32' ? 'app.ico' : 'app_dev.png';
      const iconPath = path.join(process.cwd(), 'resources', iconFile);
      if (fs.existsSync(iconPath)) {
        const { nativeImage } = await import('electron');
        const img = nativeImage.createFromPath(iconPath);
        if (!img.isEmpty()) devIcon = img;
      }
    } catch {
      // Ignore icon load errors.
    }
  }

  const win = new BrowserWindow({
    width,
    height,
    x,
    y,
    show: false,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    title: 'Wayland',
    ...(devIcon ? { icon: devIcon } : {}),
    // Custom titlebar: match the main window so the renderer's Wayland Titlebar
    // owns the chrome (macOS keeps native traffic lights; others are frameless).
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hidden' as const, trafficLightPosition: { x: 10, y: 13 } }
      : { frame: false }),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      webviewTag: true,
    },
  });

  // Security guards mirroring the main window.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const expectedRendererOrigin = getExpectedRendererOrigin();
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const target = new URL(navigationUrl);
      const targetOrigin = target.protocol === 'file:' ? 'file://' : target.origin;
      if (expectedRendererOrigin && targetOrigin === expectedRendererOrigin) return;
    } catch {
      // Fall through to deny.
    }
    console.warn('[Popout] Blocked will-navigate to', navigationUrl);
    event.preventDefault();
  });
  win.webContents.on('will-attach-webview', (_event, webPreferences, params) => {
    delete (webPreferences as { preload?: string; preloadURL?: string }).preload;
    delete (webPreferences as { preload?: string; preloadURL?: string }).preloadURL;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    (webPreferences as { sandbox?: boolean }).sandbox = true;
    (params as { nodeintegration?: boolean }).nodeintegration = false;
  });

  // Register with the bridge so live streams reach this window.
  initMainAdapterWithWindow(win);

  popouts.set(key, win);

  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) {
      win.show();
      win.focus();
    }
  });
  // Belt-and-suspenders show fallback.
  win.webContents.once('did-finish-load', () => {
    if (!win.isDestroyed() && !win.isVisible()) win.show();
  });
  setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) win.show();
  }, 5000);

  win.on('resize', () => schedulePersistBounds(win));
  win.on('move', () => schedulePersistBounds(win));

  win.on('closed', () => {
    popouts.delete(key);
    // Closing by any path (dock-back, OS close, app quit) funnels through here.
    if (onClosed) onClosed();
  });

  loadPopoutContent(win, deepLink, loadFileHash);

  return { ok: true, alreadyOpen: false };
}

function loadPopoutContent(win: BrowserWindow, deepLink: string, loadFileHash: string): void {
  const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && rendererUrl) {
    win.loadURL(`${rendererUrl}/${deepLink}`).catch((error) => {
      console.error('[Popout] loadURL failed:', error);
    });
  } else {
    const fallbackFile = path.join(__dirname, '../renderer/index.html');
    win.loadFile(fallbackFile, { hash: loadFileHash }).catch((error) => {
      console.error('[Popout] loadFile failed:', error);
    });
  }
}

/**
 * Close the pop-out for a conversation (dock it back into the main window). The
 * `closed` handler emits `popoutClosed`, which the main window uses to restore
 * the tab. Returns `ok:false` when there was no live pop-out.
 */
export function closePopoutWindow(conversationId: string): { ok: boolean } {
  const win = popouts.get(conversationId);
  if (!win || win.isDestroyed()) {
    popouts.delete(conversationId);
    return { ok: false };
  }
  win.close();
  return { ok: true };
}

/** Close every pop-out window (called from before-quit). */
export function closeAllPopouts(): void {
  for (const win of popouts.values()) {
    if (!win.isDestroyed()) win.destroy();
  }
  popouts.clear();
}

/** Test/diagnostic accessor for the live pop-out conversation ids. */
export function getOpenPopoutIds(): string[] {
  return Array.from(popouts.keys()).filter((id) => {
    const win = popouts.get(id);
    return win && !win.isDestroyed();
  });
}
