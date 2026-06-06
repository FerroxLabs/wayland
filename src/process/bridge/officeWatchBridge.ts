/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Office Watch Bridge (Word & Excel)
 *
 * Manages officecli watch child processes for live Word and Excel preview.
 * Each file gets one watch process on a unique port.
 * The renderer loads http://localhost:<port> in a webview.
 */

import { ipcBridge } from '@/common';
import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { getEnhancedEnv } from '@process/utils/shellEnv';
import { installOfficecli } from './officecliInstaller';
import { confinePath } from './pathConfinement';

type OfficeDocType = 'word' | 'excel';

type StatusEmitter = (payload: { state: 'starting' | 'installing' | 'ready' | 'error'; message?: string }) => void;

interface WatchSession {
  process: ChildProcess;
  port: number;
  aborted: boolean;
}

// Track sessions by canonical session key - separate maps for word and excel.
// The key is derived from the confined path but normalised so the watcher
// (start) and preview client (stop) agree on it across processes on
// case-insensitive filesystems (XP-OFFICE-PIPE-01).
const wordSessions = new Map<string, WatchSession>();
const excelSessions = new Map<string, WatchSession>();

// Pending kill timers - delayed stop allows Strict Mode re-mount to reuse sessions
const wordPendingKills = new Map<string, ReturnType<typeof setTimeout>>();
const excelPendingKills = new Map<string, ReturnType<typeof setTimeout>>();

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

function getSessionMap(docType: OfficeDocType): Map<string, WatchSession> {
  return docType === 'word' ? wordSessions : excelSessions;
}

function getPendingKillsMap(docType: OfficeDocType): Map<string, ReturnType<typeof setTimeout>> {
  return docType === 'word' ? wordPendingKills : excelPendingKills;
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
function waitForPort(port: number, maxRetries = 150, interval = 100): Promise<void> {
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
function killSession(key: string, sessions: Map<string, WatchSession>): void {
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
async function startWatch(
  filePath: string,
  docType: OfficeDocType,
  emitStatus: StatusEmitter,
  retry = false
): Promise<string> {
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

  const sessions = getSessionMap(docType);
  const pendingKills = getPendingKillsMap(docType);

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
  killSession(sessionKey, sessions);

  const port = await findFreePort();

  emitStatus({ state: 'starting' });

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
        killSession(sessionKey, sessions);
        reject(new Error('officecli watch timed out'));
      }
    }, 15000);

    const settle = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (err) reject(err);
    };

    // Identity handshake (RT-F5-04): require the "Watch:" marker on OUR child's
    // stdout pipe before trusting whatever bound the port. findFreePort() returns
    // the port after its probe socket closes, so there is a TOCTOU window in which
    // a local attacker could race to bind the port and serve content to the
    // webview. Only the process we spawned can write to its own stdout pipe, so a
    // racing imposter that answers TCP on the port cannot forge the marker. We
    // confirm the marker first (identity), then poll the port (readiness) before
    // resolving the URL the webview loads. The PPT preview path uses the same
    // marker; the prior port-only check trusted any responder.
    const url = `http://localhost:${port}`;

    const onPortReady = () => {
      if (session.aborted) {
        settle(new Error('Watch session was aborted'));
        return;
      }
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        resolve(url);
      }
    };

    child.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      if (settled || !text.includes('Watch:')) return;
      // Marker seen on our spawned child's stdout - the server on this port is
      // ours, not a port-race imposter. Now confirm it is actually listening.
      if (session.aborted) {
        settle(new Error('Watch session was aborted'));
        return;
      }
      waitForPort(port, 150, 100)
        .then(onPortReady)
        .catch(() => {
          settle(new Error('officecli watch server did not become ready'));
          killSession(sessionKey, sessions);
        });
    });

    child.stderr?.on('data', (data: Buffer) => {
      console.error(`[officeWatch] officecli stderr (${docType}):`, data.toString().trim());
    });

    child.on('error', (err) => {
      console.error(`[officeWatch] spawn error (${docType}):`, err.message);
      sessions.delete(sessionKey);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT' && !retry) {
        // officecli not found (bundled binary unresolvable) - offer a
        // consent-gated, pinned, checksum-verified install, then retry once.
        // settle() without error: defuses the current promise machinery
        // (clears timeout, prevents double-settle) while the install + recursive
        // retry below chains its own resolve/reject to the outer promise.
        settle();
        installOfficecli(emitStatus)
          .then((installed) => {
            if (installed) {
              startWatch(filePath, docType, emitStatus, true).then(resolve, reject);
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
 * Check if a port belongs to an active Word or Excel preview session.
 * Used by the web server proxy route to validate proxy targets.
 */
export function isActiveOfficeWatchPort(port: number): boolean {
  for (const [, session] of wordSessions) {
    if (session.port === port && !session.aborted && session.process.exitCode === null) {
      return true;
    }
  }
  for (const [, session] of excelSessions) {
    if (session.port === port && !session.aborted && session.process.exitCode === null) {
      return true;
    }
  }
  return false;
}

/**
 * Stop all running Word and Excel watch processes (called on app shutdown).
 */
export function stopAllOfficeWatchSessions(): void {
  for (const [key] of wordSessions) {
    killSession(key, wordSessions);
  }
  for (const [key] of excelSessions) {
    killSession(key, excelSessions);
  }
}

export function initOfficeWatchBridge(): void {
  // Word preview handlers
  ipcBridge.wordPreview.start.provider(async ({ filePath }) => {
    try {
      const url = await startWatch(filePath, 'word', (payload) => ipcBridge.wordPreview.status.emit(payload));
      return { url };
    } catch (err) {
      console.error('[officeWatch] word start failed:', err);
      return { url: '', error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcBridge.wordPreview.stop.provider(async ({ filePath }) => {
    // Resolve to the same confined real path used as the session key on start.
    // Out-of-root paths never had a session, so nothing to stop.
    const confined = await confinePath(filePath);
    if (!confined) return;
    // Canonicalise to the same key start used so stop matches the session on
    // case-insensitive filesystems (XP-OFFICE-PIPE-01).
    const key = canonicalizeSessionKey(confined);
    // Delay kill to allow Strict Mode re-mount to reuse the session
    const timer = setTimeout(() => {
      wordPendingKills.delete(key);
      killSession(key, wordSessions);
    }, 500);
    wordPendingKills.set(key, timer);
  });

  // Excel preview handlers
  ipcBridge.excelPreview.start.provider(async ({ filePath }) => {
    try {
      const url = await startWatch(filePath, 'excel', (payload) => ipcBridge.excelPreview.status.emit(payload));
      return { url };
    } catch (err) {
      console.error('[officeWatch] excel start failed:', err);
      return { url: '', error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcBridge.excelPreview.stop.provider(async ({ filePath }) => {
    // Resolve to the same confined real path used as the session key on start.
    // Out-of-root paths never had a session, so nothing to stop.
    const confined = await confinePath(filePath);
    if (!confined) return;
    // Canonicalise to the same key start used so stop matches the session on
    // case-insensitive filesystems (XP-OFFICE-PIPE-01).
    const key = canonicalizeSessionKey(confined);
    // Delay kill to allow Strict Mode re-mount to reuse the session
    const timer = setTimeout(() => {
      excelPendingKills.delete(key);
      killSession(key, excelSessions);
    }, 500);
    excelPendingKills.set(key, timer);
  });
}
