/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// configureChromium sets app name (dev isolation) and Chromium flags - must run before
// ANY module that calls app.getPath('userData'), because Electron caches the path on first call.
import './process/utils/configureChromium';
// Force IPv4-first DNS in the main process (side-effect import). Keeps outbound
// connects fast/reliable; fixes the IMAP email channel hanging on a slow IPv6 path.
import './process/utils/dnsOrder';
import os from 'node:os';
import { createScrubPii } from '@/common/utils/sentryPii';

// L17 (AUDIT-05 F16): expose auto-updater bootstrap status to the renderer so the
// System settings tab can surface "auto-updates disabled until next launch" when
// the updater dynamic import fails. Set on init success/failure below.
declare global {
  // eslint-disable-next-line no-var
  var __waylandUpdateChannelStatus: { available: boolean; error?: string } | undefined;
}

// Audit Phase 2-J: dynamic import of @sentry/electron/main keeps ~430KB of
// Sentry transports + integrations out of the main-process boot path when no
// DSN is configured (the common case in dev and self-hosted builds). The DSN
// guard below mirrors the prior behavior - when DSN is set the SDK is loaded
// asynchronously and init runs as soon as the chunk resolves. Renderer Sentry
// is already lazy (see commit da1f173cc / src/renderer/main.tsx).
//
// `_sentry` is populated in the .then() callback below; the four capture
// sites in this file use `_sentry?.captureException(...)` and tolerate the
// short window between boot and chunk-load (any errors thrown in that window
// are still surfaced via electron-log + console.error directly above each call).
type SentryMainModule = typeof import('@sentry/electron/main');
let _sentry: SentryMainModule | undefined;
if (process.env.SENTRY_DSN && process.env.SENTRY_DSN.trim()) {
  import('@sentry/electron/main')
    .then((Sentry) => {
      try {
        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          beforeSend: createScrubPii(os.homedir()),
          sampleRate: 1.0,
          tracesSampleRate: 0.0,
        });
        _sentry = Sentry;
      } catch (err) {
        console.warn('[Sentry] main init threw:', (err as Error)?.message ?? err);
      }
    })
    .catch((err) => console.warn('[Sentry] main import skipped:', (err as Error)?.message ?? err));
} else {
  console.warn('[Sentry] DSN not set; telemetry disabled');
}

import './process/utils/configureConsoleLog';
import { app, BrowserWindow, nativeImage, net, powerMonitor, protocol, screen, session } from 'electron';
import log from 'electron-log';
import fixPath from 'fix-path';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { initMainAdapterWithWindow } from './common/adapter/main';
import { ipcBridge } from './common';
import { closeAllPopouts, isPopoutWebContents } from '@process/utils/popoutWindowManager';
import { initPopoutBridge } from '@process/bridge/popoutBridge';
import { AION_ASSET_PROTOCOL } from '@process/extensions';
import { resolveAllowedAssetPath } from '@process/extensions/protocol/assetAllowlist';
import { initializeProcess } from './process';
import { ProcessConfig } from './process/utils/initStorage';
import { loadShellEnvironmentAsync, logEnvironmentDiagnostics, mergePaths } from './process/utils/shellEnv';
import { initializeAcpDetector, registerWindowMaximizeListeners, disposeAllTeamSessions } from '@process/bridge';
import './process/bridge/feedbackBridge';
import { wasLaunchedAtLogin } from '@process/bridge/applicationBridge';
import { applyFirstRunDefaults } from '@process/utils/firstRunDefaults';
import { migrateCredentialsToSafeStorage_v1 } from '@process/utils/credentialMigration';
import { onCloseToTrayChanged, onLanguageChanged } from './process/bridge/systemSettingsBridge';
import { setInitialLanguage } from '@process/services/i18n';
import { workerTaskManager } from './process/task/workerTaskManagerSingleton';
import { setupApplicationMenu } from './process/utils/appMenu';
import { attachContextMenu } from './process/utils/contextMenu';
import { startWebServer } from './process/webserver';
import { initializeZoomFactor, setupZoomForWindow } from './process/utils/zoom';
import { getOrCreateAnalyticsId } from './process/utils/analyticsId';
import {
  clearPendingDeepLinkUrl,
  getPendingDeepLinkUrl,
  handleDeepLinkUrl,
  PROTOCOL_SCHEME,
} from './process/utils/deepLink';
import {
  bindMainWindowReferences,
  showAndFocusMainWindow,
  showOrCreateMainWindow,
} from './process/utils/mainWindowLifecycle';
import {
  loadUserWebUIConfig,
  resolveRemoteAccess,
  resolveWebUIPort,
  restoreDesktopWebUIFromPreferences,
} from './process/utils/webuiConfig';
import {
  createOrUpdateTray,
  destroyTray,
  getCloseToTrayEnabled,
  getIsQuitting,
  refreshTrayMenu,
  setCloseToTrayEnabled,
  setIsQuitting,
} from './process/utils/tray';
// @ts-expect-error - electron-squirrel-startup doesn't have types
import electronSquirrelStartup from 'electron-squirrel-startup';

// ============ Single Instance Lock ============
// Acquire lock early so the second instance quits before doing unnecessary work.
// When a second instance starts (e.g. from protocol URL), it sends its data
// to the first instance via second-instance event, then quits.
const isE2ETestMode = process.env.WAYLAND_E2E_TEST === '1';
const skipSingleInstanceLock = isE2ETestMode || process.env.WAYLAND_MULTI_INSTANCE === '1';
const deepLinkFromArgv = process.argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`));
const gotTheLock = skipSingleInstanceLock ? true : app.requestSingleInstanceLock({ deepLinkUrl: deepLinkFromArgv });
if (!gotTheLock) {
  console.warn('[Wayland] Another instance is already running; current process will exit.');
  app.quit();
} else {
  app.on('second-instance', (_event, argv, _workingDirectory, additionalData) => {
    // Prefer additionalData (reliable on all platforms), fallback to argv scan
    const deepLinkUrl =
      (additionalData as { deepLinkUrl?: string })?.deepLinkUrl ||
      argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`));
    if (deepLinkUrl) {
      handleDeepLinkUrl(deepLinkUrl);
    }
    // Focus existing window or recreate one if needed.
    if (isWebUIMode || isResetPasswordMode) {
      return;
    }

    // Skip window creation if app hasn't finished initializing
    if (!appReadyDone) return;

    if (app.isReady()) {
      showOrCreateMainWindow({
        mainWindow,
        createWindow: () => {
          console.log('[Wayland] second-instance received with no active main window, recreating main window');
          createWindow();
        },
      });
    }
  });
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// Fix the PATH environment variable for GUI apps on macOS and Linux to match the shell's PATH.
if (process.platform === 'darwin' || process.platform === 'linux') {
  fixPath();

  // PERF-BOOT-03: defer the nvm directory walk off the synchronous boot path.
  // existsSync + readdirSync + per-version existsSync ran at module top before
  // app.whenReady; scheduling it on setImmediate keeps that blocking FS cost out
  // of the hottest startup path while still supplementing PATH before the first
  // shell/tool spawn (nvm is often only in .zshrc, not .zshenv).
  setImmediate(() => {
    const nvmDir = process.env.NVM_DIR || path.join(process.env.HOME || '', '.nvm');
    const nvmVersionsDir = path.join(nvmDir, 'versions', 'node');
    if (fs.existsSync(nvmVersionsDir)) {
      try {
        const versions = fs.readdirSync(nvmVersionsDir);
        const nvmPaths = versions.map((v) => path.join(nvmVersionsDir, v, 'bin')).filter((p) => fs.existsSync(p));
        if (nvmPaths.length > 0) {
          const currentPath = process.env.PATH || '';
          const missingPaths = nvmPaths.filter((p) => !currentPath.includes(p));
          if (missingPaths.length > 0) {
            process.env.PATH = [...missingPaths, currentPath].join(path.delimiter);
          }
        }
      } catch {
        // Ignore errors when reading nvm directory
      }
    }
  });
}

// Log environment diagnostics once at startup (persisted via electron-log).
// Phase 1 prints sync info immediately; Phase 2 resolves CLI tools in the
// background - fire-and-forget so it never blocks the startup path (#1157).
void logEnvironmentDiagnostics();

// Handle Squirrel startup events (Windows installer)
if (electronSquirrelStartup) {
  app.quit();
}

// ============ Custom Asset Protocol ============
// Register wayland-asset:// as a privileged scheme BEFORE app.whenReady().
// This protocol serves local extension assets (icons, covers) bypassing
// the browser security policy that blocks file:// URLs from http://localhost.
protocol.registerSchemesAsPrivileged([
  {
    scheme: AION_ASSET_PROTOCOL,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

// SEC-ELEC-03: centrally harden every web-contents the app creates, especially
// guest <webview>s. The main window binds setWindowOpenHandler + a will-navigate
// origin lock on its own webContents, but those guards never reached guest
// webviews (HTMLRenderer's untrusted model-HTML preview, URLViewer/WebviewHost's
// remote pages), which share the default session. This listener re-applies the
// guards to every contents:
//   - deny ALL renderer-initiated window.open() (popups) everywhere.
//   - for guest webviews, block navigation/redirect INTO the first-party
//     renderer origin or any privileged scheme, so a compromised preview cannot
//     escalate into the app context (where it would inherit window.electronAPI).
//     Remote https / data: / file: navigations stay allowed - preview surfaces
//     legitimately load those.
const isPrivilegedAppTarget = (rawUrl: string): boolean => {
  try {
    const target = new URL(rawUrl);
    const scheme = target.protocol.replace(/:$/, '');
    // Privileged custom scheme that serves local app assets.
    if (scheme === AION_ASSET_PROTOCOL) {
      return true;
    }
    // The packaged renderer is served from file://; treat any file:// frame as
    // the privileged app origin for guests (preview file:// content is loaded
    // as the guest's INITIAL src, not navigated to, so this only blocks a guest
    // trying to escalate back into a file:// document mid-session).
    if (scheme === 'file') {
      return true;
    }
    // The dev renderer origin (Vite). In production ELECTRON_RENDERER_URL is unset.
    const devUrl = process.env['ELECTRON_RENDERER_URL'];
    if (!app.isPackaged && devUrl) {
      try {
        if (target.origin === new URL(devUrl).origin) {
          return true;
        }
      } catch {
        // Unparsable dev URL - fall through.
      }
    }
    return false;
  } catch {
    // Unparsable target - treat as unexpected and block (fail closed).
    return true;
  }
};

// SEC-ELEC-02: enforce a restrictive Content-Security-Policy on the first-party
// renderer document so any HTML-injection bug in the renderer (which renders
// model output, file content, and remote data, and holds the full IPC bridge)
// cannot load arbitrary remote script or exfiltrate over the network.
//
// The CSP is applied ONLY to first-party app documents (file:// in prod, the
// Vite dev origin in dev, and the wayland-asset: scheme). Guest <webview>
// content (remote pages in URLViewer, data:/file:// model HTML in HTMLRenderer)
// is intentionally left ungoverned here - those are sandboxed and origin-locked
// by the web-contents-created guard above, and applying app CSP to them would
// break legitimate preview rendering.
const buildRendererCsp = (): string => {
  // Sentry ingest host, when a DSN is configured, so error reporting still works.
  let sentryConnect = '';
  const dsn = process.env.SENTRY_DSN?.trim();
  if (dsn) {
    try {
      sentryConnect = ` ${new URL(dsn).origin}`;
    } catch {
      // Malformed DSN - omit from connect-src (Sentry init would also fail).
    }
  }
  // Dev needs 'unsafe-eval' (Vite/React refresh) and ws: for HMR; prod does not.
  const scriptExtra = app.isPackaged ? '' : " 'unsafe-eval'";
  const devConnect = app.isPackaged ? '' : ' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*';
  // Inline <script> blocks in index.html restore theme before first paint; pin
  // them by sha256 hash instead of allowing 'unsafe-inline' for scripts.
  const inlineScriptHashes =
    "'sha256-F0Ydm3Y8FcXdrgJvTODBT9QYFs/xNmlOzrekFfx7Ji0=' 'sha256-k/0jDZE33E24TcBZUFNXmfI9LIUaujAblssNi/WzOJU='";
  return [
    "default-src 'self'",
    `script-src 'self' 'wasm-unsafe-eval' ${inlineScriptHashes}${scriptExtra}`,
    // Arco / UnoCSS inject runtime <style> tags, so style needs 'unsafe-inline'.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    // Images/media come from local assets, generated data/blob URLs, the asset
    // protocol, packaged files, and remote extension covers/icons.
    `img-src 'self' data: blob: file: ${AION_ASSET_PROTOCOL}: https:`,
    `media-src 'self' data: blob: file: ${AION_ASSET_PROTOCOL}:`,
    // Renderer egress: same-origin, the embedded local WebUI server, the asset
    // protocol, and the Sentry ingest endpoint when configured. Model-provider
    // HTTP happens in the MAIN process, never the renderer, so no provider hosts
    // are needed here.
    `connect-src 'self' ${AION_ASSET_PROTOCOL}:${sentryConnect}${devConnect}`,
    // <webview> preview frames are served via the asset protocol / file / data.
    `frame-src 'self' ${AION_ASSET_PROTOCOL}: file: data: https:`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
};

const isFirstPartyAppDocument = (rawUrl: string): boolean => {
  try {
    const target = new URL(rawUrl);
    const scheme = target.protocol.replace(/:$/, '');
    if (scheme === 'file' || scheme === AION_ASSET_PROTOCOL) {
      return true;
    }
    const devUrl = process.env['ELECTRON_RENDERER_URL'];
    if (!app.isPackaged && devUrl) {
      try {
        return target.origin === new URL(devUrl).origin;
      } catch {
        return false;
      }
    }
    return false;
  } catch {
    return false;
  }
};

const applyRendererCsp = (): void => {
  const csp = buildRendererCsp();
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!isFirstPartyAppDocument(details.url)) {
      // Leave guest webview content (remote / data: previews) untouched.
      callback({ responseHeaders: details.responseHeaders });
      return;
    }
    const responseHeaders = { ...details.responseHeaders };
    // Strip any pre-existing CSP variants so ours is authoritative.
    for (const key of Object.keys(responseHeaders)) {
      if (key.toLowerCase() === 'content-security-policy') {
        delete responseHeaders[key];
      }
    }
    responseHeaders['Content-Security-Policy'] = [csp];
    callback({ responseHeaders });
  });
};

app.on('web-contents-created', (_event, contents) => {
  // Deny window.open() for every contents. The main renderer routes external
  // links through shell.openExternal; guests have no legitimate popup need.
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // Wire a native right-click menu (cut/copy/paste/spellcheck). Electron has no
  // default context menu, so without this paste-via-mouse is impossible (#523).
  attachContextMenu(contents);

  // Only add the guest navigation lock to webview contents. The main window's
  // own will-navigate guard (in createWindow) already fully constrains it, and
  // double-binding here would risk blocking its legitimate in-app file:// nav.
  if (contents.getType() === 'webview') {
    const blockEscalation = (event: Electron.Event, navigationUrl: string): void => {
      if (isPrivilegedAppTarget(navigationUrl)) {
        console.warn('[Wayland] Blocked guest webview navigation into app origin:', navigationUrl);
        event.preventDefault();
      }
    };
    contents.on('will-navigate', blockEscalation);
    contents.on('will-redirect', blockEscalation);
  }
});

// Global error handlers for main process.
// Always log via electron-log AND console.error before deferring to Sentry - if SENTRY_DSN
// is unset, Sentry's transport is no-op and errors would otherwise vanish silently (H11).
process.on('uncaughtException', (error) => {
  log.error('[uncaughtException]', error);
  console.error('[uncaughtException]', error);
  try {
    _sentry?.captureException(error);
  } catch {
    // Ignore Sentry failures - we've already logged the original error.
  }
  // Process state is undefined after an uncaught exception; exit so the OS/launcher can recover.
  app.exit(1);
});

process.on('unhandledRejection', (reason, _promise) => {
  log.error('[unhandledRejection]', reason);
  console.error('[unhandledRejection]', reason);
  try {
    _sentry?.captureException(reason instanceof Error ? reason : new Error(String(reason)));
  } catch {
    // Ignore Sentry failures - we've already logged the original reason.
  }
  // Do not exit - Node's default for unhandled rejections is to log and continue.
});

const hasSwitch = (flag: string) => process.argv.includes(`--${flag}`) || app.commandLine.hasSwitch(flag);
const getSwitchValue = (flag: string): string | undefined => {
  const withEqualsPrefix = `--${flag}=`;
  const equalsArg = process.argv.find((arg) => arg.startsWith(withEqualsPrefix));
  if (equalsArg) {
    return equalsArg.slice(withEqualsPrefix.length);
  }

  const argIndex = process.argv.indexOf(`--${flag}`);
  if (argIndex !== -1) {
    const nextArg = process.argv[argIndex + 1];
    if (nextArg && !nextArg.startsWith('--')) {
      return nextArg;
    }
  }

  const cliValue = app.commandLine.getSwitchValue(flag);
  return cliValue || undefined;
};
const hasCommand = (cmd: string) => process.argv.includes(cmd);

const isWebUIMode = hasSwitch('webui');
const isRemoteMode = hasSwitch('remote');
const isResetPasswordMode = hasCommand('--resetpass');
const isVersionMode = hasCommand('--version') || hasCommand('-v');

// Flag to distinguish intentional quit from unexpected exit in WebUI mode
let isExplicitQuit = false;

// Guard against premature window creation (e.g. macOS 'activate' firing during init).
// The activate event fires on first launch before handleAppReady finishes initializeProcess(),
// causing the renderer to load and compete with initStorage on the serial configFile queue,
// which blocks startup for 100-265 seconds.
let appReadyDone = false;

let mainWindow: BrowserWindow;

const createWindow = ({ showOnReady = true }: { showOnReady?: boolean } = {}): void => {
  console.log('[Wayland] Creating main window...');
  // Get primary display size
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Set window size to 80% (4/5) of screen size for better visibility on high-resolution displays
  const windowWidth = Math.floor(screenWidth * 0.8);
  const windowHeight = Math.floor(screenHeight * 0.8);

  // Get app icon for development mode (Windows/Linux need icon in BrowserWindow)
  // In production, icons are set via forge.config.ts packagerConfig
  let devIcon: Electron.NativeImage | undefined;
  if (!app.isPackaged) {
    try {
      // Windows: app.ico (no dev version), Linux: app_dev.png (with padding)
      const iconFile = process.platform === 'win32' ? 'app.ico' : 'app_dev.png';
      const iconPath = path.join(process.cwd(), 'resources', iconFile);
      if (fs.existsSync(iconPath)) {
        devIcon = nativeImage.createFromPath(iconPath);
        if (devIcon.isEmpty()) devIcon = undefined;
      }
    } catch {
      // Ignore icon loading errors in development
    }
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    show: false, // Hide until CSS is loaded to prevent FOUC
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    // Set icon for Windows/Linux in development mode
    ...(devIcon && process.platform !== 'darwin' ? { icon: devIcon } : {}),
    // Custom titlebar configuration
    ...(process.platform === 'darwin'
      ? {
          titleBarStyle: 'hidden',
          // Align traffic-light vertical center with the titlebar button centers.
          // Titlebar is 45px; buttons are 36px flex-centered → button center y≈22.5.
          // Empirically y=13 places the traffic lights on the same horizontal line
          // as the sidebar / back / forward icons.
          // NOTE: requires a full app restart to take effect (BrowserWindow option).
          trafficLightPosition: { x: 10, y: 13 },
        }
      : { frame: false }),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      // C6: explicit hardening. Match ambient window pattern; preload + contextBridge
      // is the supported renderer surface, so node access must stay disabled.
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      // <webview> is used by HTMLRenderer / PDFViewer / WebviewHost for previewing
      // user content; keep the tag enabled but lock down attached webviews via
      // the `will-attach-webview` guard below.
      webviewTag: true,
    },
  });
  console.log(`[Wayland] Main window created (id=${mainWindow.id})`);

  // C6: security guards on the main window's webContents.
  // 1) Deny renderer-initiated window.open() - preload exposes whatever opener APIs
  //    we actually want (auth, external links go through shell.openExternal).
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // 2) Block navigation away from the expected renderer origin. In dev the renderer
  //    is served from ELECTRON_RENDERER_URL (Vite); in production it's a file:// URL
  //    pointing at the packaged renderer/index.html. Any other origin is treated as
  //    a renderer-takeover attempt and cancelled.
  const expectedRendererOrigin = (() => {
    const devUrl = process.env['ELECTRON_RENDERER_URL'];
    if (!app.isPackaged && devUrl) {
      try {
        return new URL(devUrl).origin;
      } catch {
        return null;
      }
    }
    return 'file://';
  })();
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const target = new URL(navigationUrl);
      const targetOrigin = target.protocol === 'file:' ? 'file://' : target.origin;
      if (expectedRendererOrigin && targetOrigin === expectedRendererOrigin) {
        return;
      }
    } catch {
      // Fall through to deny on unparsable URLs.
    }
    console.warn('[Wayland] Blocked will-navigate to', navigationUrl);
    event.preventDefault();
  });

  // 3) Enforce safe defaults on any <webview> the renderer attaches. The renderer
  //    code only sets `src` on <webview>, so we strip preload and force the secure
  //    triad here regardless of what the renderer requested.
  mainWindow.webContents.on('will-attach-webview', (_event, webPreferences, params) => {
    delete (webPreferences as { preload?: string; preloadURL?: string }).preload;
    delete (webPreferences as { preload?: string; preloadURL?: string }).preloadURL;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    (webPreferences as { sandbox?: boolean }).sandbox = true;
    (params as { nodeintegration?: boolean }).nodeintegration = false;
  });

  // 4) Permissions (SEC-ELEC-01). The renderer's voice features call
  //    getUserMedia({ audio: true }); without a handler Electron can leave the
  //    request unanswered, so the mic silently never starts. But the default
  //    session is shared with preview <webview>s that render untrusted
  //    model-generated HTML (HTMLRenderer) or arbitrary remote pages (URLViewer).
  //    A blanket `callback(true)` auto-granted geolocation / camera / clipboard /
  //    notifications to those guests with no prompt.
  //
  //    Discriminate: grant ONLY the first-party renderer (our own webContents,
  //    origin-locked by the will-navigate guard above) and ONLY the media
  //    permission it actually needs (mic for voice). Everything else - and every
  //    guest webview - is denied.
  {
    const mainWebContentsId = mainWindow.webContents.id;
    const GRANTED_PERMISSIONS = new Set(['media', 'mediaKeySystem', 'audioCapture', 'videoCapture']);
    const isFirstPartyRenderer = (wc: Electron.WebContents | null | undefined): boolean => {
      // First-party = the main renderer OR a pop-out chat window (#27 phase 2).
      // Pop-outs load the same origin-locked renderer and must be able to use the
      // mic for voice; their navigation is guarded identically in
      // popoutWindowManager (will-navigate origin check + deny window.open).
      if (!wc || (wc.id !== mainWebContentsId && !isPopoutWebContents(wc.id))) {
        return false;
      }
      try {
        const target = new URL(wc.getURL());
        const targetOrigin = target.protocol === 'file:' ? 'file://' : target.origin;
        return !!expectedRendererOrigin && targetOrigin === expectedRendererOrigin;
      } catch {
        return false;
      }
    };
    const winSession = mainWindow.webContents.session;
    winSession.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(isFirstPartyRenderer(webContents) && GRANTED_PERMISSIONS.has(permission));
    });
    winSession.setPermissionCheckHandler((webContents, permission) => {
      return isFirstPartyRenderer(webContents) && GRANTED_PERMISSIONS.has(permission);
    });
  }

  // Show window after content is ready to prevent FOUC (Flash of Unstyled Content)
  // Use 'ready-to-show' which fires when renderer has painted first frame,
  // combined with 'did-finish-load' as belt-and-suspenders approach.
  if (showOnReady) {
    const showWindow = () => {
      if (!mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        console.log('[Wayland] Showing main window');
        mainWindow.show();
        mainWindow.focus();
      }
    };
    mainWindow.once('ready-to-show', () => {
      console.log('[Wayland] Window ready-to-show');
      showWindow();
    });
    // Belt-and-suspenders: also show on did-finish-load in case ready-to-show already fired
    mainWindow.webContents.once('did-finish-load', () => {
      console.log('[Wayland] Renderer did-finish-load');
      showWindow();
    });
    // Fallback: show window after 5s even if events don't fire (e.g. loadURL failure)
    setTimeout(showWindow, 5000);
  } else if (process.platform === 'darwin' && app.dock) {
    void app.dock.hide();
  }

  initMainAdapterWithWindow(mainWindow);
  bindMainWindowReferences(mainWindow);
  setupApplicationMenu();

  setupZoomForWindow(mainWindow);
  registerWindowMaximizeListeners(mainWindow);

  // Initialize auto-updater service (skip when disabled via env, e.g. E2E / CI,
  // and in unpackaged dev where there is no installed app to update - the updater
  // would otherwise hit the GitHub feed on every dev launch and log spurious errors)
  const isCiRuntime = process.env.CI === 'true' || process.env.CI === '1' || process.env.GITHUB_ACTIONS === 'true';
  const disableAutoUpdater =
    !app.isPackaged ||
    process.env.WAYLAND_DISABLE_AUTO_UPDATE === '1' ||
    process.env.WAYLAND_E2E_TEST === '1' ||
    isCiRuntime;
  if (!disableAutoUpdater) {
    Promise.all([import('./process/services/autoUpdaterService'), import('./process/bridge/updateBridge')])
      .then(([{ autoUpdaterService }, { createAutoUpdateStatusBroadcast }]) => {
        // Create status broadcast callback that emits via ipcBridge (pure emitter, no window binding)
        const statusBroadcast = createAutoUpdateStatusBroadcast();
        autoUpdaterService.initialize(statusBroadcast);
        globalThis.__waylandUpdateChannelStatus = { available: true };
        // Detect a silent install failure from the previous launch (downloaded +
        // attempted but the version never advanced) before the first check, so the
        // imminent re-offer is surfaced as a failure instead of looped silently (#286).
        autoUpdaterService.reconcilePendingInstall();
        // Check for updates after 3 seconds delay
        setTimeout(() => {
          void autoUpdaterService.checkForUpdatesAndNotify();
        }, 3000);
      })
      .catch((error) => {
        console.error('[App] Failed to initialize autoUpdaterService:', error);
        globalThis.__waylandUpdateChannelStatus = {
          available: false,
          error: error instanceof Error ? error.message : String(error),
        };
      });
  } else {
    console.log('[Wayland] Auto-updater disabled via env/CI guard');
  }

  // Initialize IJFW system service (skip when disabled via env, e.g. E2E / CI / explicit opt-out)
  const disableIjfw = isCiRuntime || process.env.WAYLAND_DISABLE_IJFW === '1' || process.env.WAYLAND_E2E_TEST === '1';
  if (!disableIjfw) {
    import('./process/services/ijfwSystemService')
      .then(async ({ ijfwSystemService }) => {
        // Activate any .pending tree from a previous boot BEFORE bootstrap, so a
        // staged upgrade lands first and the live mcp-server is current.
        try {
          await ijfwSystemService.applyPendingUpgrade();
        } catch (err) {
          console.error('[Wayland] ijfw applyPendingUpgrade failed:', err);
        }
        // Subscribe to ~/.ijfw - emit not_installed if the user removes the
        // install out from under us, and shut down the MCP client so a stale
        // socket doesn't keep the renderer in 'installed_current' state.
        try {
          ijfwSystemService.startHealthWatcher();
        } catch (err) {
          console.error('[Wayland] ijfw startHealthWatcher failed:', err);
        }
        // Defer bootstrap by 5s so first-paint is not blocked by npm view.
        setTimeout(() => {
          void ijfwSystemService.bootstrap().catch((err) => {
            console.error('[Wayland] ijfw bootstrap failed:', err);
          });
        }, 5000);
      })
      .catch((error) => {
        console.error('[Wayland] Failed to initialize ijfwSystemService:', error);
      });
  } else {
    console.log('[Wayland] IJFW system service disabled via env/CI guard');
  }

  // Load the renderer: dev server URL in development, built HTML file in production
  const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
  const fallbackFile = path.join(__dirname, '../renderer/index.html');

  if (!app.isPackaged && rendererUrl) {
    console.log(`[Wayland] Loading renderer URL: ${rendererUrl}`);
    mainWindow.loadURL(rendererUrl).catch((error) => {
      console.error('[Wayland] loadURL failed, falling back to file:', error.message || error);
      mainWindow.loadFile(fallbackFile).catch((e2) => {
        console.error('[Wayland] loadFile fallback also failed:', e2.message || e2);
      });
    });
  } else {
    console.log(`[Wayland] Loading renderer file: ${fallbackFile}`);
    mainWindow.loadFile(fallbackFile).catch((error) => {
      console.error('[Wayland] loadFile failed:', error.message || error);
    });
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error('[Wayland] did-fail-load:', { errorCode, errorDescription, validatedURL, isMainFrame });
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[Wayland] render-process-gone:', details);

    // Reload the renderer to recover from the crash.
    // The isDestroyed() guard in adapter/main.ts prevents further sends
    // to the dead webContents while the reload is in progress.
    if (!mainWindow.isDestroyed()) {
      console.log('[Wayland] Attempting to recover from renderer crash by reloading...');

      if (!app.isPackaged && rendererUrl) {
        mainWindow.loadURL(rendererUrl).catch((error) => {
          console.error('[Wayland] Recovery loadURL failed:', error.message || error);
        });
      } else {
        mainWindow.loadFile(fallbackFile).catch((error) => {
          console.error('[Wayland] Recovery loadFile failed:', error.message || error);
        });
      }
    }
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.warn('[Wayland] Renderer became unresponsive');
  });

  mainWindow.on('closed', () => {
    console.log('[Wayland] Main window closed');
  });

  // DevTools is no longer auto-opened at startup.
  // Use the DevTools toggle in Settings > System (dev mode only) to open it.

  // Listen to DevTools state changes and notify Renderer
  mainWindow.webContents.on('devtools-opened', () => {
    ipcBridge.application.devToolsStateChanged.emit({ isOpen: true });
  });

  mainWindow.webContents.on('devtools-closed', () => {
    ipcBridge.application.devToolsStateChanged.emit({ isOpen: false });
  });

  // Close interception: hide window instead of closing when "close to tray" is enabled
  mainWindow.on('close', (event) => {
    if (mainWindow.isDestroyed()) return;
    if (getCloseToTrayEnabled() && !getIsQuitting()) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
};

const handleAppReady = async (): Promise<void> => {
  const t0 = performance.now();
  const mark = (label: string) => console.log(`[Wayland:ready] ${label} +${Math.round(performance.now() - t0)}ms`);
  mark('start');

  if (!app.isPackaged) {
    try {
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import('electron-devtools-installer');
      await installExtension(REACT_DEVELOPER_TOOLS);
      console.log('[DevTools] React Developer Tools installed');
    } catch (e) {
      console.warn('[DevTools] Failed to install React DevTools:', e);
    }
  }

  // CLI mode: print app version and exit immediately (used by CI smoke tests)
  if (isVersionMode) {
    console.log(app.getVersion());
    app.exit(0);
    return;
  }

  // Register wayland-asset:// protocol handler.
  // Converts wayland-asset://asset/C:/path/to/file.svg → file:///C:/path/to/file.svg
  // and serves the local file through Electron's net module.
  //
  // SECURITY: The renderer can render untrusted LLM output, so we must NOT
  // serve arbitrary files. The path is resolved against an allowlist of
  // extension dirs + bundled hub resources to prevent
  // wayland-asset://asset//etc/passwd and similar arbitrary-read attacks.
  protocol.handle(AION_ASSET_PROTOCOL, (request) => {
    const url = new URL(request.url);
    // pathname is /C:/path/to/file.svg - strip leading slash on Windows
    let filePath = decodeURIComponent(url.pathname);
    if (process.platform === 'win32' && filePath.startsWith('/') && /^\/[A-Za-z]:/.test(filePath)) {
      filePath = filePath.slice(1);
    }
    const allowedPath = resolveAllowedAssetPath(filePath);
    if (!allowedPath) {
      console.warn(`[wayland-asset] Rejected request outside allowlist: ${request.url} -> ${filePath}`);
      return new Response('Forbidden', { status: 403 });
    }
    if (!fs.existsSync(allowedPath)) {
      console.warn(`[wayland-asset] File not found: ${request.url} -> ${allowedPath}`);
      return new Response('Not Found', { status: 404 });
    }
    return net.fetch(pathToFileURL(allowedPath).href);
  });

  // Set dock icon in development mode on macOS
  // In production, the icon is set via forge.config.ts packagerConfig.icon
  if (process.platform === 'darwin' && !app.isPackaged && app.dock) {
    try {
      const iconPath = path.join(process.cwd(), 'resources', 'app_dev.png');
      if (fs.existsSync(iconPath)) {
        const icon = nativeImage.createFromPath(iconPath);
        if (!icon.isEmpty()) {
          app.dock.setIcon(icon);
        }
      }
    } catch {
      // Ignore dock icon errors in development
    }
  }

  _sentry?.setUser({ id: getOrCreateAnalyticsId() });

  try {
    await initializeProcess();
    mark('initializeProcess');
  } catch (error) {
    console.error('Failed to initialize process:', error);
    app.exit(1);
    return;
  }

  // #27 phase 2: register pop-out window providers (conversation.popout /
  // dockBack). Cheap + idempotent; creates no windows until the renderer asks.
  try {
    initPopoutBridge();
  } catch (error) {
    console.error('[Wayland] Failed to init pop-out bridge:', error);
  }

  try {
    initializeZoomFactor(await ProcessConfig.get('ui.zoomFactor'));
    mark('initializeZoomFactor');
  } catch (error) {
    console.error('[Wayland] Failed to restore zoom factor:', error);
    initializeZoomFactor(undefined);
  }

  if (isResetPasswordMode) {
    // Handle password reset without creating window
    try {
      const { resetPasswordCLI, resolveResetPasswordUsername } = await import('./process/utils/resetPasswordCLI');
      const username = resolveResetPasswordUsername(process.argv);

      await resetPasswordCLI(username);

      app.quit();
    } catch {
      app.exit(1);
    }
  } else if (isWebUIMode) {
    const userConfigInfo = loadUserWebUIConfig();
    if (userConfigInfo.exists && userConfigInfo.path) {
      // Config file loaded from user directory
    }
    const resolvedPort = resolveWebUIPort(userConfigInfo.config, getSwitchValue);
    const allowRemote = resolveRemoteAccess(userConfigInfo.config, isRemoteMode);
    try {
      await startWebServer(resolvedPort, allowRemote);
    } catch (err) {
      console.error(`[WebUI] Failed to start server on port ${resolvedPort}:`, err);
      app.exit(1);
      return;
    }

    // Keep the process alive in WebUI mode by preventing default quit behavior.
    // On Linux headless (systemd), Electron may attempt to quit when no windows exist.
    app.on('will-quit', (event) => {
      // Only prevent quit if this is an unexpected exit (server still running).
      // Explicit app.exit() calls bypass will-quit, so they are unaffected.
      if (!isExplicitQuit) {
        event.preventDefault();
        console.warn('[WebUI] Prevented unexpected quit - server is still running');
      }
    });
  } else {
    // Initialize close-to-tray setting
    if (isE2ETestMode) {
      setCloseToTrayEnabled(false);
      destroyTray();
    } else {
      // Apply smart defaults once per install (close-to-tray ON, start-on-boot ON).
      // Must run BEFORE reading system.closeToTray so the default takes effect on first launch.
      await applyFirstRunDefaults();

      // Re-encrypt legacy base64-obfuscated channel credentials with Electron
      // safeStorage. One-shot per install, gated by
      // system.credentialsCryptoMigrated_v1. Must run BEFORE any channel
      // plugin starts so plugins read the safeStorage-backed ciphertext.
      // Wrapped in try/catch because migration MUST NOT block app launch.
      try {
        await migrateCredentialsToSafeStorage_v1();
      } catch (err) {
        console.error('[Wayland] credential migration threw:', err);
      }

      try {
        const savedCloseToTray = await ProcessConfig.get('system.closeToTray');
        setCloseToTrayEnabled(savedCloseToTray ?? false);
        if (getCloseToTrayEnabled()) {
          createOrUpdateTray();
        }
      } catch {
        // Ignore storage read errors, default to false
      }

      onCloseToTrayChanged((enabled) => {
        setCloseToTrayEnabled(enabled);
        if (enabled) {
          createOrUpdateTray();
        } else {
          destroyTray();
        }
      });
    }

    const showMainWindowOnReady = !(wasLaunchedAtLogin() && getCloseToTrayEnabled());

    createWindow({ showOnReady: showMainWindowOnReady });
    appReadyDone = true;
    mark('createWindow');

    // Initialize ambient bubble window if enabled.
    //
    // IMPORTANT: ambient is created *after* the main window so the E2E
    // fixture can reliably pick the main renderer first (BrowserWindow order
    // matters when Page.url() is still empty pre-navigation - satellite
    // filtering can only reject windows whose URL has resolved, so the
    // main window must have the earlier Page object).
    //
    // Priority:
    //   1. WAYLAND_AMBIENT=1 → ambient on  (env wins)
    //   2. WAYLAND_AMBIENT=0 → ambient off (env wins, explicit off)
    //   3. ambient.enabled === true        (settings fallback)
    const ambientEnvVar = process.env['WAYLAND_AMBIENT'];
    void (async () => {
      try {
        let useAmbient = false;
        if (ambientEnvVar === '1') {
          useAmbient = true;
        } else if (ambientEnvVar === '0') {
          useAmbient = false;
        } else {
          const ambientSetting = await ProcessConfig.get('ambient.enabled');
          useAmbient = ambientSetting === true;
        }

        if (!useAmbient) return;

        // Load + register bridge immediately (cheap, doesn't create windows).
        const { initAmbientBridge } = await import('./process/bridge/ambientBridge');
        initAmbientBridge();

        // Create the ambient window *after* the main renderer has finished
        // loading. This gives the E2E test fixture a chance to latch onto
        // the main renderer's Page before the ambient window's Page is
        // emitted - otherwise the satellite filter can misfire (both Pages
        // have an empty URL for a brief window). In non-E2E runs the delay
        // also helps avoid any startup visual glitch where the bubble
        // appears before the main window is painted.
        if (mainWindow && !mainWindow.isDestroyed()) {
          const onMainReady = async () => {
            try {
              const { createAmbientWindow } = await import('./process/ambient/ambientWindowManager');
              await createAmbientWindow();
            } catch (err) {
              console.error('[Ambient] deferred create failed:', err);
            }
          };
          if (mainWindow.webContents.isLoading()) {
            mainWindow.webContents.once('did-finish-load', () => {
              void onMainReady();
            });
          } else {
            await onMainReady();
          }
        } else {
          const { createAmbientWindow } = await import('./process/ambient/ambientWindowManager');
          await createAmbientWindow();
        }
      } catch (error) {
        console.error('[Ambient] Failed to initialize:', error);
      }
    })();

    // Run ACP detection in parallel with renderer loading.
    // By the time React mounts and calls getAvailableAgents (~300ms+),
    // detection (~700ms) is usually already done.
    initializeAcpDetector()
      .then(() => mark('initializeAcpDetector'))
      .catch((error) => console.error('[ACP] Detection failed:', error));

    // Read language setting and initialize main process i18n, then refresh tray menu
    try {
      const savedLanguage = await ProcessConfig.get('language');
      await setInitialLanguage(savedLanguage);
      // After language is set, refresh tray menu if it exists
      await refreshTrayMenu();
    } catch (error) {
      console.error('[index] Failed to initialize i18n language:', error);
    }

    // Listen for language changes to refresh tray menu labels
    onLanguageChanged(() => {
      void refreshTrayMenu();
    });

    if (!isE2ETestMode) {
      // Restore WebUI async after window creation, non-blocking
      restoreDesktopWebUIFromPreferences().catch((error) => {
        console.error('[WebUI] Failed to auto-restore:', error);
      });
    }

    // Flush pending deep-link URL (received before window was ready)
    const pendingUrl = getPendingDeepLinkUrl();
    if (pendingUrl) {
      clearPendingDeepLinkUrl();
      mainWindow.webContents.once('did-finish-load', () => {
        handleDeepLinkUrl(pendingUrl);
      });
    }
  }

  // WebUI mode also needs ACP detection for remote agent access
  if (isWebUIMode) {
    await initializeAcpDetector();
  }

  if (!isResetPasswordMode) {
    // Preload shell environment and apply it to process.env so workers forked
    // later inherit the complete PATH (nvm, npm globals, .zshrc paths, etc.)
    // This ensures custom skills that depend on globally installed tools work correctly.
    void loadShellEnvironmentAsync().then((shellEnv) => {
      if (shellEnv.PATH) {
        process.env.PATH = mergePaths(process.env.PATH, shellEnv.PATH);
      }
      // Apply other shell env vars (SSL certs, auth tokens) that may be missing
      for (const [key, value] of Object.entries(shellEnv)) {
        if (key !== 'PATH' && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }

  // Verify CDP is ready and log status
  const { cdpPort, verifyCdpReady } = await import('./process/utils/configureChromium');
  if (cdpPort) {
    const cdpReady = await verifyCdpReady(cdpPort);
    if (cdpReady) {
      console.log(`[CDP] Remote debugging server ready at http://127.0.0.1:${cdpPort}`);
      console.log(
        `[CDP] MCP chrome-devtools: npx chrome-devtools-mcp@0.16.0 --browser-url=http://127.0.0.1:${cdpPort}`
      );
    } else {
      console.warn(`[CDP] Warning: Remote debugging port ${cdpPort} not responding`);
    }
  }

  // Listen for system resume (wake from sleep/hibernate) to recover missed cron jobs
  powerMonitor.on('resume', () => {
    try {
      console.log('[App] System resumed from sleep, triggering cron recovery');
    } catch {
      // Console write may fail with EIO when PTY is broken after sleep
    }
    import('@process/services/cron/cronServiceSingleton')
      .then(({ cronService }) => {
        void cronService.handleSystemResume();
      })
      .catch(() => {
        // Cron recovery is best-effort after system resume
      });
  });
};

// ============ Protocol Registration ============
// Register wayland:// as the default protocol client
if (process.defaultApp) {
  // Dev mode: need to pass execPath explicitly
  app.setAsDefaultProtocolClient(PROTOCOL_SCHEME, process.execPath, [path.resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient(PROTOCOL_SCHEME);
}

// macOS: handle wayland:// URLs via the open-url event
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLinkUrl(url);
  if (isWebUIMode || isResetPasswordMode || !app.isReady()) {
    return;
  }
  // Focus existing window so user sees the result
  showOrCreateMainWindow({ mainWindow, createWindow });
});

// M17: Prefetch cleanup modules at app-ready so before-quit doesn't
// race the 10s master timeout doing cold dynamic imports. Fire-and-forget;
// before-quit awaits this cache and falls back to fresh imports if undefined
// (e.g. quit fires before ready, or one of the imports rejected).
type CleanupModules = {
  ambient: typeof import('./process/ambient/ambientWindowManager');
  channels: typeof import('@process/channels');
  webuiBridge: typeof import('@process/bridge/webuiBridge');
  webserverAdapter: typeof import('@process/webserver/adapter');
  officeWatch: typeof import('@process/bridge/officeWatchBridge');
  pptPreview: typeof import('@process/bridge/pptPreviewBridge');
  // REL-WATCH-01: drain leaked fs.watch handles (renderer-initiated file
  // watchers) deterministically on quit so they don't outlive the process and
  // accumulate against inotify max_user_watches / EMFILE.
  fileWatch: typeof import('@process/bridge/fileWatchBridge');
  // L15 (AUDIT-05 F17): close SQLite handle from before-quit so the DB file
  // is flushed/unlocked before process exit.
  database: typeof import('@process/services/database/export');
  // L16 (AUDIT-05 F18): shut down cron timers from before-quit so scheduled
  // work cannot outlive the app's quit sequence.
  cron: typeof import('@process/services/cron/cronServiceSingleton');
  // #139: reap webhook tunnel CLIs (cloudflared/ngrok/tailscale) on quit so
  // their long-lived child processes don't orphan past the app.
  tunnel: typeof import('@process/channels/tunnel');
  // #443: last-resort reaper for wayland-core / ACP engine children. Runs after
  // the graceful per-agent kill to force-kill any child left over (e.g. when the
  // per-step budget truncates a slow kill), so engine processes never orphan.
  agentChildren: typeof import('@process/agent/agentChildRegistry');
};
let _cleanupModulesPromise: Promise<CleanupModules> | undefined;

const prefetchCleanupModules = (): Promise<CleanupModules> => {
  return Promise.all([
    import('./process/ambient/ambientWindowManager'),
    import('@process/channels'),
    import('@process/bridge/webuiBridge'),
    import('@process/webserver/adapter'),
    import('@process/bridge/officeWatchBridge'),
    import('@process/bridge/pptPreviewBridge'),
    import('@process/services/database/export'),
    import('@process/services/cron/cronServiceSingleton'),
    import('@process/bridge/fileWatchBridge'),
    import('@process/channels/tunnel'),
    import('@process/agent/agentChildRegistry'),
  ]).then(
    ([
      ambient,
      channels,
      webuiBridge,
      webserverAdapter,
      officeWatch,
      pptPreview,
      database,
      cron,
      fileWatch,
      tunnel,
      agentChildren,
    ]) => ({
      ambient,
      channels,
      webuiBridge,
      webserverAdapter,
      officeWatch,
      pptPreview,
      database,
      cron,
      fileWatch,
      tunnel,
      agentChildren,
    })
  );
};

// Ensure we don't miss the ready event when running in CLI/WebUI mode
void app
  .whenReady()
  .then(() => {
    // SEC-ELEC-02: install the renderer CSP on the default session as early as
    // possible after ready, before any window loads its document.
    applyRendererCsp();
    // Kick off cleanup-module prefetch BEFORE handleAppReady so it runs in
    // parallel with init. Failure is non-fatal - before-quit handles undefined.
    _cleanupModulesPromise = prefetchCleanupModules();
    _cleanupModulesPromise.catch((err) => {
      console.warn('[Wayland] Cleanup-module prefetch failed; before-quit will fall back to fresh imports:', err);
      _cleanupModulesPromise = undefined;
    });
  })
  .then(handleAppReady)
  .catch((error) => {
    // L14 (AUDIT-05 F13): match initializeProcess failure semantics - capture
    // to Sentry and hard-exit so the OS/launcher can recover. app.quit() is a
    // soft request that can be cancelled by before-quit handlers, which is the
    // wrong behavior when init itself failed.
    console.error('[Wayland] App initialization failed:', error);
    try {
      _sentry?.captureException(error);
    } catch {
      // Ignore Sentry failures - we've already logged the original error.
    }
    app.exit(1);
  });

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Don't quit when close-to-tray is enabled
  if (getCloseToTrayEnabled()) {
    return;
  }
  // In WebUI mode, don't quit when windows are closed since we're running a web server
  if (!isWebUIMode && process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // Skip if handleAppReady hasn't finished - it will create the window itself.
  if (!appReadyDone) return;
  if (!isWebUIMode && app.isReady()) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Restore hidden window from tray
      showAndFocusMainWindow(mainWindow);
      if (process.platform === 'darwin' && app.dock) {
        void app.dock.show();
      }
    } else {
      createWindow();
    }
  }
});

app.on('before-quit', async () => {
  console.log('[Wayland] before-quit');
  setIsQuitting(true);
  isExplicitQuit = true;
  destroyTray();
  // #27 phase 2: pop-outs are ephemeral - tear them down on quit (synchronous,
  // cheap; their `closed` handlers fire popoutClosed but the main window is also
  // closing so the broadcast is a harmless no-op).
  closeAllPopouts();

  // M17: per-step budget. A single slow step (e.g. WebSocket close) cannot
  // starve later steps. Total ceiling stays at 10s.
  const PER_STEP_TIMEOUT_MS = 2000;
  const MASTER_TIMEOUT_MS = 10000;

  const withTimeout = <T>(label: string, p: Promise<T>, ms: number): Promise<T | undefined> => {
    return new Promise<T | undefined>((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        console.warn(`[Wayland] cleanup step "${label}" exceeded ${ms}ms; moving on`);
        resolve(undefined);
      }, ms);
      p.then(
        (v) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(v);
        },
        (err) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          console.error(`[Wayland] cleanup step "${label}" failed:`, err);
          resolve(undefined);
        }
      );
    });
  };

  // Pull from prefetch cache; fall back to fresh imports if quit raced ready
  // or the prefetch rejected. Falling back is the same cold path the audit
  // flagged, but only when prefetch is unavailable - the common case is hot.
  const loadModules = async (): Promise<Partial<CleanupModules>> => {
    if (_cleanupModulesPromise) {
      try {
        return await _cleanupModulesPromise;
      } catch {
        /* fall through to per-module fresh imports */
      }
    }
    const safeImport = async <K extends keyof CleanupModules>(
      key: K,
      loader: () => Promise<CleanupModules[K]>
    ): Promise<[K, CleanupModules[K] | undefined]> => {
      try {
        return [key, await loader()];
      } catch {
        return [key, undefined];
      }
    };
    const entries = await Promise.all([
      safeImport('ambient', () => import('./process/ambient/ambientWindowManager')),
      safeImport('channels', () => import('@process/channels')),
      safeImport('webuiBridge', () => import('@process/bridge/webuiBridge')),
      safeImport('webserverAdapter', () => import('@process/webserver/adapter')),
      safeImport('officeWatch', () => import('@process/bridge/officeWatchBridge')),
      safeImport('pptPreview', () => import('@process/bridge/pptPreviewBridge')),
      safeImport('database', () => import('@process/services/database/export')),
      safeImport('cron', () => import('@process/services/cron/cronServiceSingleton')),
      safeImport('fileWatch', () => import('@process/bridge/fileWatchBridge')),
      safeImport('tunnel', () => import('@process/channels/tunnel')),
      // #443: must be in the fallback list too - the fallback path is hit exactly
      // when the prefetch rejected (e.g. a native module failed to load, common
      // on Windows - the platform this reaper targets), so omitting it here would
      // silently disable the reaper in the case it is most needed.
      safeImport('agentChildren', () => import('@process/agent/agentChildRegistry')),
    ]);
    const out: Partial<CleanupModules> = {};
    for (const [k, v] of entries) {
      if (v) (out as Record<string, unknown>)[k] = v;
    }
    return out;
  };

  const cleanup = async () => {
    const mods = await loadModules();

    // Ordering rationale for the cleanup() chain (top-down):
    //   1. closeDatabase            - flush + release SQLite handle so cron/worker
    //                                 work scheduled after it cannot enqueue new
    //                                 transactions against a half-torn-down DB.
    //   2. CronService.shutdown     - clear scheduled timers + retry timers so no
    //                                 new jobs fire (and can't spawn workers) once
    //                                 the DB is closed.
    //   3. workerTaskManager.clear  - kill in-flight worker processes; safe to do
    //                                 after cron is silenced.
    //   4. everything else          - bridges, channels, webserver, ambient, etc.
    // All steps run concurrently via Promise.allSettled below; the order above is
    // the logical precedence the timeouts respect (each has its own 2s budget).
    // No per-step try/catch - withTimeout + allSettled already absorb failures.

    // L15 (AUDIT-05 F17): close DB before worker/cron drain can enqueue new tx.
    const databaseStep = withTimeout(
      'closeDatabase',
      (async () => {
        if (!mods.database) return;
        mods.database.closeDatabase();
      })(),
      PER_STEP_TIMEOUT_MS
    );

    // L16 (AUDIT-05 F18): silence cron timers before workers so no fresh jobs fire.
    const cronStep = withTimeout(
      'cronService.shutdown',
      (async () => {
        if (!mods.cron) return;
        mods.cron.cronService.shutdown();
      })(),
      PER_STEP_TIMEOUT_MS
    );

    // Worker processes after DB + cron (M18 made workerTaskManager.clear() properly
    // await per-agent kill() with its own 3.5s bound).
    const workerStep = withTimeout('workerTaskManager.clear', workerTaskManager.clear(), PER_STEP_TIMEOUT_MS);

    const ambientStep = withTimeout(
      'destroyAmbientWindow',
      (async () => {
        if (!mods.ambient) return;
        mods.ambient.destroyAmbientWindow();
      })(),
      PER_STEP_TIMEOUT_MS
    );

    const teamStep = withTimeout('disposeAllTeamSessions', disposeAllTeamSessions(), PER_STEP_TIMEOUT_MS);

    const channelsStep = withTimeout(
      'channelManager.shutdown',
      (async () => {
        if (!mods.channels) return;
        await mods.channels.getChannelManager().shutdown();
      })(),
      PER_STEP_TIMEOUT_MS
    );

    // #139: reap webhook tunnel CLIs. ChannelManager.shutdown() does not own
    // the tunnels (the WebhookExposureService singleton does), so they must be
    // torn down explicitly here or the cloudflared/ngrok/tailscale process
    // orphans past the app.
    const tunnelStep = withTimeout(
      'stopAllTunnels',
      (async () => {
        if (!mods.tunnel) return;
        await mods.tunnel.stopAllTunnels();
      })(),
      PER_STEP_TIMEOUT_MS
    );

    const webServerStep = withTimeout(
      'webServer.close',
      (async () => {
        if (!mods.webuiBridge) return;
        const { getWebServerInstance, setWebServerInstance } = mods.webuiBridge;
        const instance = getWebServerInstance();
        if (!instance) return;
        instance.wss.clients.forEach((client) => client.close(1000, 'App shutting down'));
        await new Promise<void>((resolve) => instance.server.close(() => resolve()));
        if (mods.webserverAdapter) {
          mods.webserverAdapter.cleanupWebAdapter();
        }
        setWebServerInstance(null);
      })(),
      PER_STEP_TIMEOUT_MS
    );

    const officeWatchStep = withTimeout(
      'stopAllOfficeWatchSessions',
      (async () => {
        if (!mods.officeWatch) return;
        mods.officeWatch.stopAllOfficeWatchSessions();
      })(),
      PER_STEP_TIMEOUT_MS
    );

    const pptPreviewStep = withTimeout(
      'stopAllWatchSessions',
      (async () => {
        if (!mods.pptPreview) return;
        mods.pptPreview.stopAllWatchSessions();
      })(),
      PER_STEP_TIMEOUT_MS
    );

    // REL-WATCH-01: drain renderer-initiated fs.watch handles so they are
    // released deterministically on quit rather than abandoned on Cmd+Q/crash.
    const fileWatchStep = withTimeout(
      'stopAllFileWatchers',
      (async () => {
        if (!mods.fileWatch) return;
        mods.fileWatch.stopAllFileWatchers();
      })(),
      PER_STEP_TIMEOUT_MS
    );

    // Run all steps concurrently; allSettled so one slow step can't starve
    // the rest. Each step has its own 2s budget via withTimeout above.
    // Listed in the documented top-down ordering above for readability.
    await Promise.allSettled([
      databaseStep,
      cronStep,
      workerStep,
      ambientStep,
      teamStep,
      channelsStep,
      tunnelStep,
      webServerStep,
      officeWatchStep,
      pptPreviewStep,
      fileWatchStep,
    ]);

    // #443: last-resort engine-child reaper. Runs AFTER the graceful path above
    // (workerStep -> WorkerTaskManager.clear() -> per-agent kill), so normally
    // there is nothing left. It force-kills any wayland-core / ACP child still
    // alive - e.g. when a per-agent graceful kill was truncated by its 2s budget,
    // or a child was spawned outside a tracked manager - so engine processes
    // never orphan past the app (the "two sets of Wayland" report).
    await withTimeout(
      'killAllAgentChildren',
      (async () => {
        if (!mods.agentChildren) return;
        await mods.agentChildren.killAllAgentChildren();
      })(),
      PER_STEP_TIMEOUT_MS
    );
  };

  // Master ceiling: hard 10s upper bound on the entire cleanup phase.
  // Per-step timeouts (2s each) handle the common case; this is the
  // last-resort guard if loadModules itself wedges or many steps queue
  // microtasks beyond their budget.
  const masterCeiling = new Promise<void>((resolve) => {
    setTimeout(() => {
      console.warn(`[Wayland] Cleanup master ceiling (${MASTER_TIMEOUT_MS}ms) reached; forcing quit`);
      resolve();
    }, MASTER_TIMEOUT_MS);
  });

  await Promise.race([cleanup(), masterCeiling]);
});

app.on('will-quit', () => {
  console.log('[Wayland] will-quit - all cleanup should be complete');
});

app.on('quit', (_event, exitCode) => {
  console.log(`[Wayland] quit (exitCode=${exitCode})`);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
