/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PPT Preview Bridge
 *
 * Manages officecli watch child processes for live PPT preview.
 * Each pptx file gets one watch process on a unique port.
 * The renderer loads http://localhost:<port> in a webview.
 */

import { ipcBridge } from '@/common';
import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { getEnhancedEnv } from '@process/utils/shellEnv';
import { installOfficecli } from './officecliInstaller';
import { confinePath } from './pathConfinement';

interface WatchSession {
  process: ChildProcess;
  port: number;
  aborted: boolean;
}

// Track sessions by canonical session key - process is tracked immediately
// after spawn. The key is derived from the confined path but normalised so the
// watcher (start) and preview client (stop) agree on it across processes on
// case-insensitive filesystems (XP-OFFICE-PIPE-01).
const sessions = new Map<string, WatchSession>();
// Pending kill timers - delayed stop allows Strict Mode re-mount to reuse sessions
const pendingKills = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Whether the host filesystem treats paths case-insensitively. Windows (NTFS)
 * and the default macOS volume (APFS case-insensitive) fold case, so a path that
 * differs only by drive-letter/segment case refers to the same file. Linux is
 * case-sensitive.
 */
const CASE_INSENSITIVE_FS = process.platform === 'win32' || process.platform === 'darwin';

/**
 * Canonicalise a confined path into a stable session/pipe key.
 *
 * officecli is spawned with the confined real path, but the *key* under which we
 * track its watch session (and which must match what a separately-bundled
 * officecli computes for its pipe/port name) has to be identical no matter how
 * the path arrives. On case-insensitive filesystems realpath may return a
 * drive-letter or segment in either case, and Windows callers may use `\` while
 * the resolver used `/`; without normalisation start and stop can key different
 * strings for the same file and never reuse/stop the session. We normalise
 * separators to the platform default and lowercase the whole path on
 * case-insensitive filesystems so the key is process-stable.
 */
function canonicalizeSessionKey(confinedPath: string): string {
  const normalized = path.normalize(confinedPath);
  return CASE_INSENSITIVE_FS ? normalized.toLowerCase() : normalized;
}

/**
 * Find a free TCP port by binding to port 0.
 */
function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        const port = addr.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error('Failed to get port')));
      }
    });
    server.on('error', reject);
  });
}

/**
 * Wait until a TCP connection to localhost:port succeeds.
 */
function waitForPort(port: number, maxRetries = 20, interval = 100): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempt = 0;
    const tryConnect = () => {
      const socket = net.connect(port, '127.0.0.1');
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        attempt++;
        if (attempt >= maxRetries) {
          reject(new Error(`Port ${port} not ready after ${maxRetries} attempts`));
        } else {
          setTimeout(tryConnect, interval);
        }
      });
    };
    tryConnect();
  });
}

/**
 * Kill an existing session and remove it from the map. `key` is the canonical
 * session key (see {@link canonicalizeSessionKey}).
 */
function killSession(key: string): void {
  const session = sessions.get(key);
  if (session) {
    session.aborted = true;
    session.process.kill();
    sessions.delete(key);
  }
}

/**
 * Start an officecli watch process and wait for the server URL.
 * Reuses an existing healthy session if one is already running.
 * Auto-installs officecli on first use if not found.
 */
async function startWatch(filePath: string, retry = false): Promise<string> {
  // Confine the renderer-supplied path to the app's authorized roots
  // (workspace/temp/appData/downloads/desktop/documents) before spawning
  // officecli against it. confinePath also collapses symlinks so the pipe name
  // matches what officecli computes, and rejects traversal/UNC/ADS/out-of-root
  // paths - preventing the renderer from driving officecli to open arbitrary
  // documents (SEC-IPC-07).
  const confined = await confinePath(filePath);
  if (!confined) {
    throw new Error('Refused to preview a file outside the allowed directories');
  }
  filePath = confined;
  // Session/pipe key derived from the confined path, normalised so start and
  // stop agree across processes on case-insensitive filesystems
  // (XP-OFFICE-PIPE-01).
  const sessionKey = canonicalizeSessionKey(filePath);

  // Cancel any pending delayed kill (Strict Mode re-mount)
  const pendingTimer = pendingKills.get(sessionKey);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingKills.delete(sessionKey);
  }

  // Reuse existing session if process is still alive
  const existing = sessions.get(sessionKey);
  if (existing && !existing.aborted && existing.process.exitCode === null) {
    const url = `http://localhost:${existing.port}`;
    return url;
  }

  // Kill any existing/pending session for this file first
  killSession(sessionKey);

  const port = await findFreePort();

  ipcBridge.pptPreview.status.emit({ state: 'starting' });

  const child = spawn('officecli', ['watch', filePath, '--port', String(port)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: getEnhancedEnv(),
  });

  // Track session immediately so stop can kill it
  const session: WatchSession = { process: child, port, aborted: false };
  sessions.set(sessionKey, session);

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        killSession(sessionKey);
        reject(new Error('officecli watch timed out'));
      }
    }, 15000);

    const settle = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (err) reject(err);
    };

    child.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      if (!settled && text.includes('Watch:')) {
        // Check if session was aborted while we waited for stdout
        if (session.aborted) {
          settle(new Error('Watch session was aborted'));
          return;
        }
        const url = `http://localhost:${port}`;
        waitForPort(port)
          .then(() => {
            if (session.aborted) {
              settle(new Error('Watch session was aborted'));
              return;
            }
            if (!settled) {
              settled = true;
              clearTimeout(timeout);
              resolve(url);
            }
          })
          .catch(() => {
            settle(new Error('officecli watch server did not become ready'));
            killSession(sessionKey);
          });
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      console.error('[pptPreview] officecli stderr:', data.toString().trim());
    });

    child.on('error', (err) => {
      console.error('[pptPreview] spawn error:', err.message);
      sessions.delete(sessionKey);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT' && !retry) {
        // officecli not found (bundled binary unresolvable) - offer a
        // consent-gated, pinned, checksum-verified install, then retry once.
        // Clear the timeout before the potentially long install + retry; the
        // install path drives its own resolve/reject on the outer promise.
        clearTimeout(timeout);
        settled = true;
        installOfficecli((payload) => ipcBridge.pptPreview.status.emit(payload))
          .then((installed) => {
            if (installed) {
              startWatch(filePath, true).then(resolve, reject);
            } else {
              reject(new Error('officecli is not installed and auto-install was declined or failed'));
            }
          })
          .catch(reject);
      } else {
        settle(new Error(`Failed to start officecli: ${err.message}`));
      }
    });

    child.on('exit', (code, signal) => {
      sessions.delete(sessionKey);
      if (session.aborted) {
        settle();
        return;
      }
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      settle(new Error(`officecli exited with ${reason}`));
    });
  });
}

/**
 * Check if a port belongs to an active PPT preview session.
 * Used by the web server proxy route to validate proxy targets.
 */
export function isActivePreviewPort(port: number): boolean {
  for (const [, session] of sessions) {
    if (session.port === port && !session.aborted && session.process.exitCode === null) {
      return true;
    }
  }
  return false;
}

/**
 * Stop all running watch processes (called on app shutdown).
 */
export function stopAllWatchSessions(): void {
  for (const [key] of sessions) {
    killSession(key);
  }
}

export function initPptPreviewBridge(): void {
  ipcBridge.pptPreview.start.provider(async ({ filePath }) => {
    // Attach .catch() synchronously on the promise to ensure the rejection
    // handler is registered before microtask processing. The bridge framework's
    // internal promise chain does not propagate await's handlers, so bare
    // await/try-catch leaves rejections unhandled (Sentry ELECTRON-CW, ELECTRON-CT).
    const result = await startWatch(filePath)
      .then((url) => ({ url }))
      .catch((err: unknown) => {
        console.error('[pptPreview] start failed:', err);
        return { url: '', error: err instanceof Error ? err.message : String(err) };
      });
    return result;
  });

  ipcBridge.pptPreview.stop.provider(async ({ filePath }) => {
    // Resolve to the same confined real path used as the session key on start.
    // Out-of-root paths never had a session, so nothing to stop.
    const confined = await confinePath(filePath);
    if (!confined) return;
    // Canonicalise to the same key start used so stop matches the session on
    // case-insensitive filesystems (XP-OFFICE-PIPE-01).
    const key = canonicalizeSessionKey(confined);
    // Delay kill to allow Strict Mode re-mount to reuse the session
    const timer = setTimeout(() => {
      pendingKills.delete(key);
      killSession(key);
    }, 500);
    pendingKills.set(key, timer);
  });
}
