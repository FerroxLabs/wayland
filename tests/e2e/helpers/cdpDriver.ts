/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Spawn + Chrome DevTools Protocol driver for tests that need to launch
 * their OWN Electron instances (per-test sandbox, quit/relaunch, etc).
 *
 * WHY THIS EXISTS (not just `electron.launch()` from Playwright):
 *   Playwright's `electron.launch()` attaches a Node Inspector WebSocket
 *   client as soon as Electron prints `Debugger listening on ws://...` to
 *   stderr. Empirically against this codebase, attaching the Node Inspector
 *   freezes V8 init enough that Chromium never finishes binding its own
 *   remote-debugging port - `DevTools listening on ws://...` never appears,
 *   and `electron.launch()` times out at the chromeMatchPromise step.
 *
 *   Plain Electron launches the app cleanly. Node child_process.spawn (this
 *   driver) with `--remote-debugging-port` set to a known port and NO
 *   `--inspect` flag works perfectly. We then connect to Chromium's CDP
 *   (NOT Node's inspector) and drive the renderer via Runtime.evaluate.
 *
 * Wire protocol mirrors `tests/e2e/helpers/bridge.ts`:
 *   emit('subscribe-<key>', { id, data })  →
 *     on(payload) where payload.value matches { name: 'subscribe.callback-<key><id>', data }
 *
 * Usage:
 *   const app = await launchAppViaCdp({ userDataDir, env });
 *   await app.invokeBridge('agent.config.storage.set', { key: 'foo', data: 'bar' });
 *   const value = await app.invokeBridge('agent.config.storage.get', 'foo');
 *   await app.quit();
 */

import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../..');
const ELECTRON_BIN = path.join(
  APP_ROOT,
  'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'
);

export interface CdpAppOptions {
  userDataDir: string;
  /** Additional env vars merged on top of the test defaults. */
  env?: Record<string, string>;
  /** CDP port (default: random unused 9876-9999). Set explicitly when running tests in parallel. */
  cdpPort?: number;
  /** Timeout for renderer-ready signal in ms (default 25000). */
  readyTimeoutMs?: number;
}

export interface CdpApp {
  readonly proc: ChildProcess;
  readonly cdpPort: number;
  /** Evaluate an expression in the first renderer page (returns the value). */
  evaluate<T = unknown>(expression: string): Promise<T>;
  /**
   * Invoke a bridge provider via the renderer. Same protocol as
   * tests/e2e/helpers/bridge.ts invokeBridge.
   */
  invokeBridge<T = unknown>(key: string, data?: unknown, timeoutMs?: number): Promise<T>;
  /** Kill the app and clean up. */
  quit(): Promise<void>;
}

interface CdpPageInfo {
  type: string;
  url: string;
  webSocketDebuggerUrl: string;
}

function waitForLine(stream: NodeJS.ReadableStream, regex: RegExp, timeoutMs: number): Promise<RegExpMatchArray> {
  return new Promise((resolve, reject) => {
    let buf = '';
    const onData = (chunk: Buffer) => {
      buf += chunk.toString();
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        const m = line.match(regex);
        if (m) {
          stream.off('data', onData);
          clearTimeout(timer);
          resolve(m);
          return;
        }
      }
    };
    const timer = setTimeout(() => {
      stream.off('data', onData);
      reject(new Error(`waitForLine timeout: ${regex}`));
    }, timeoutMs);
    stream.on('data', onData);
  });
}

export async function launchAppViaCdp(opts: CdpAppOptions): Promise<CdpApp> {
  const cdpPort = opts.cdpPort ?? 9876 + Math.floor(Math.random() * 100);
  const readyTimeoutMs = opts.readyTimeoutMs ?? 25000;

  const proc = spawn(ELECTRON_BIN, ['.', `--user-data-dir=${opts.userDataDir}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: APP_ROOT,
    detached: process.platform !== 'win32',
    env: {
      ...process.env,
      WAYLAND_E2E_TEST: '1',
      WAYLAND_CDP_PORT: String(cdpPort),
      WAYLAND_DISABLE_AUTO_UPDATE: '1',
      WAYLAND_DISABLE_DEVTOOLS: '1',
      NODE_ENV: 'development',
      ...opts.env,
    },
  });

  if (!proc.pid) throw new Error('Failed to spawn Electron');

  // Wait for renderer to finish loading (stdout contains the electron-log line).
  await waitForLine(proc.stdout!, /Renderer did-finish-load/, readyTimeoutMs);

  // Give Chromium a moment to wire its CDP HTTP endpoint after the renderer
  // event - the /json endpoint is sometimes not ready the same tick.
  await new Promise((r) => setTimeout(r, 750));

  // Discover the page WS URL via Chromium's CDP HTTP endpoint.
  const pages: CdpPageInfo[] = await fetch(`http://127.0.0.1:${cdpPort}/json`).then((r) => r.json());
  const page = pages.find((p) => p.type === 'page');
  if (!page) throw new Error('No CDP page found');

  // Bun + Node both have a global WebSocket - avoid the `ws` package
  // (Bun's `ws` rejects valid 101 responses).
  const ws = new (globalThis as { WebSocket: typeof WebSocket }).WebSocket(page.webSocketDebuggerUrl);
  await new Promise<void>((resolve, reject) => {
    ws.addEventListener('open', () => resolve(), { once: true });
    ws.addEventListener('error', (e) => reject(new Error('CDP WS error: ' + ((e as ErrorEvent).message ?? 'unknown'))), { once: true });
  });

  let msgId = 0;
  function send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const id = ++msgId;
    return new Promise<unknown>((resolve, reject) => {
      const onMessage = (ev: MessageEvent) => {
        const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '');
        if (msg.id !== id) return;
        ws.removeEventListener('message', onMessage);
        if (msg.error) reject(new Error(`CDP ${method} error: ${msg.error.message}`));
        else resolve(msg.result);
      };
      ws.addEventListener('message', onMessage);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate<T>(expression: string): Promise<T> {
    const res = (await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })) as { result: { value: T } };
    return res.result.value;
  }

  async function invokeBridge<T>(key: string, data?: unknown, timeoutMs = 10_000): Promise<T> {
    // Serialize data into the JS expression to avoid CDP serialization gotchas.
    const dataJson = JSON.stringify(data ?? null);
    const expr = `
      (async () => {
        const api = window.electronAPI;
        if (!api?.emit || !api?.on) throw new Error('electronAPI not in renderer');
        const id = 'cdp_' + Date.now() + '_' + Math.random().toString(16).slice(2, 10);
        const cbName = 'subscribe.callback-${key}' + id;
        return new Promise((resolve, reject) => {
          let settled = false;
          const off = api.on((payload) => {
            try {
              const raw = payload?.value;
              const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
              if (parsed?.name !== cbName) return;
              if (settled) return;
              settled = true;
              off?.();
              clearTimeout(timer);
              resolve(parsed.data);
            } catch (e) {
              if (settled) return;
              settled = true;
              off?.();
              clearTimeout(timer);
              reject(String(e));
            }
          });
          const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            off?.();
            reject('invokeBridge timeout: ${key}');
          }, ${timeoutMs});
          api.emit('subscribe-${key}', { id, data: ${dataJson} }).catch((err) => {
            if (settled) return;
            settled = true;
            off?.();
            clearTimeout(timer);
            reject(String(err));
          });
        });
      })()
    `;
    return evaluate<T>(expr);
  }

  async function quit(): Promise<void> {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
    try {
      if (proc.pid && process.platform !== 'win32') process.kill(-proc.pid, 'SIGTERM');
      else proc.kill('SIGTERM');
    } catch {
      /* ignore */
    }
    // Give the process a grace period to exit cleanly (writeFileAtomic flushes).
    await new Promise((r) => setTimeout(r, 800));
    try {
      if (proc.pid && process.platform !== 'win32') process.kill(-proc.pid, 'SIGKILL');
      else proc.kill('SIGKILL');
    } catch {
      /* ignore - already dead */
    }
  }

  return { proc, cdpPort, evaluate, invokeBridge, quit };
}
