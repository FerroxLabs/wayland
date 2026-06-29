/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * SignalDaemon - long-lived signal-cli subprocess that serves JSON-RPC over
 * HTTP (signal-cli's `daemon --http` mode).  Outbound calls go via HTTP POST
 * to `/api/v1/rpc`; inbound messages are polled via the `receive` RPC method
 * at ~2s cadence.  Auto-restart on unexpected exit (5s → 60s backoff, max 5
 * attempts).
 *
 * Why HTTP, not stdio: `daemon --http <host>:<port>` exposes RPC over the
 * socket only; combined with `--no-receive-stdout` (which suppresses inbound
 * frames on stdout) the previous stdio transport could neither send nor
 * receive.  See REVIEW-signal.md (HIGH 4, 2026-05-18) for the audit trail.
 */

import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { app } from 'electron';

import { execFileNoThrow } from '@/utils/execFileNoThrow';

// ── Types ────────────────────────────────────────────────────────────────────

export type SignalDaemonStatus = 'stopped' | 'starting' | 'running' | 'error';

export type SignalDaemonOpts = {
  /** E.164 phone number registered with Signal, e.g. "+14155551234". */
  phoneNumber: string;
  /** signal-cli data directory (default: <userData>/signal). */
  configDir?: string;
  /** signal-cli binary path. Falls back to bundled runtime, then PATH. */
  cliPath?: string;
  /** HTTP host for the JSON-RPC daemon endpoint (default: 127.0.0.1). */
  httpHost?: string;
  /** HTTP port for the JSON-RPC daemon endpoint (default: 8080). */
  httpPort?: number;
};

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string };
}

/** Emitted for every inbound Signal message. */
export type SignalInboundMessage = {
  envelope: {
    source?: string;
    sourceUuid?: string;
    sourceName?: string;
    timestamp?: number;
    dataMessage?: {
      message?: string;
      timestamp?: number;
      groupInfo?: { groupId?: string; type?: string };
      reaction?: { emoji?: string; targetSentTimestamp?: number; targetAuthorUuid?: string; isRemove?: boolean };
    };
    receiptMessage?: unknown;
    typingMessage?: unknown;
  };
};

export type SignalMessageHandler = (msg: SignalInboundMessage) => void;

// ── Constants ─────────────────────────────────────────────────────────────────

const BACKOFF_INITIAL_MS = 5_000;
const BACKOFF_MAX_MS = 60_000;
const BACKOFF_FACTOR = 2;
const MAX_RESTART_ATTEMPTS = 5;

const RPC_TIMEOUT_MS = 30_000;
const READY_PROBE_TIMEOUT_MS = 30_000;
const READY_PROBE_INTERVAL_MS = 250;
const RECEIVE_POLL_INTERVAL_MS = 2_000;
const RECEIVE_RPC_TIMEOUT_MS = 60_000;

// ── Binary resolution ─────────────────────────────────────────────────────────

/**
 * Resolve the signal-cli binary path.
 *
 * Priority:
 *  1. Explicit cliPath from opts.
 *  2. Bundled runtime in packaged Electron build (extraResources).
 *  3. Bundled runtime relative to source tree (dev).
 *  4. "signal-cli" on PATH (fallback - fails gracefully if absent).
 */
export function resolveSignalCliPath(cliPath?: string): string {
  if (cliPath?.trim()) return cliPath.trim();

  // On Windows signal-cli ships as a launcher script (signal-cli.bat) or a
  // native signal-cli.exe - the extensionless name used on macOS/Linux does
  // not exist there. Probe the Windows launchers in priority order; POSIX
  // keeps the single extensionless candidate.
  const cliNames =
    process.platform === 'win32' ? ['signal-cli.bat', 'signal-cli.cmd', 'signal-cli.exe'] : ['signal-cli'];

  const existsFirst = (dir: string): string | null => {
    for (const name of cliNames) {
      const candidate = path.join(dir, name);
      try {
        if (fs.existsSync(candidate)) return candidate;
      } catch {
        // continue
      }
    }
    return null;
  };

  const isPackaged = (() => {
    try {
      return Boolean(app?.isPackaged);
    } catch {
      return false;
    }
  })();

  if (isPackaged) {
    const bundled = existsFirst(path.join(process.resourcesPath, 'signal-cli-runtime', 'bin'));
    if (bundled) return bundled;
  }

  // Dev: resolve relative to this file's location in the source tree.
  const devBinDirs = [
    path.resolve(__dirname, '../../../signal-cli-runtime/bin'),
    (() => {
      try {
        return path.resolve(app.getAppPath(), 'src/process/channels/signal-cli-runtime/bin');
      } catch {
        return '';
      }
    })(),
  ].filter((p): p is string => p.length > 0);

  for (const dir of devBinDirs) {
    const candidate = existsFirst(dir);
    if (candidate) return candidate;
  }

  // PATH fallback. On Windows, prefer the .bat launcher name so that the
  // shell-resolved spawn (see spawnChild) can find it via PATHEXT.
  return process.platform === 'win32' ? 'signal-cli.bat' : 'signal-cli';
}

/**
 * Probe whether signal-cli is accessible by running `signal-cli --version`.
 * Returns the version string on success or null on failure.
 */
export async function probeSignalCli(cliPath: string): Promise<string | null> {
  try {
    const result = await execFileNoThrow(cliPath, ['--version'], { timeoutMs: 10_000 });
    if (result.exitCode === 0 && result.stdout) {
      // Output is typically "signal-cli 0.13.x"
      return result.stdout.replace(/^signal-cli\s+/i, '').trim() || result.stdout.trim();
    }
    return null;
  } catch {
    return null;
  }
}

// ── SignalDaemon class ────────────────────────────────────────────────────────

export class SignalDaemon {
  private child: ChildProcess | null = null;
  private rpcId = 0;
  private _status: SignalDaemonStatus = 'stopped';
  private restartAttempts = 0;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private receiveTimer: ReturnType<typeof setTimeout> | null = null;
  private receiveInFlight = false;
  private stopRequested = false;
  private messageHandlers: SignalMessageHandler[] = [];
  private statusHandlers: Array<(status: SignalDaemonStatus) => void> = [];

  readonly opts: Required<Pick<SignalDaemonOpts, 'httpHost' | 'httpPort'>> & SignalDaemonOpts;

  constructor(opts: SignalDaemonOpts) {
    this.opts = {
      ...opts,
      httpHost: opts.httpHost?.trim() ? opts.httpHost.trim() : '127.0.0.1',
      httpPort: typeof opts.httpPort === 'number' ? opts.httpPort : 8080,
    };
  }

  get status(): SignalDaemonStatus {
    return this._status;
  }

  get baseUrl(): string {
    return `http://${this.opts.httpHost}:${this.opts.httpPort}`;
  }

  onMessage(handler: SignalMessageHandler): void {
    this.messageHandlers.push(handler);
  }

  offMessage(handler: SignalMessageHandler): void {
    this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
  }

  /**
   * Subscribe to daemon status changes. Audit fix HIGH7 2026-05-18: without
   * this hook the parent SignalPlugin couldn't observe restart-budget
   * exhaustion, so the Wayland channel kept showing 'running' after signal-cli
   * permanently died.
   */
  onStatusChange(handler: (status: SignalDaemonStatus) => void): void {
    this.statusHandlers.push(handler);
  }

  offStatusChange(handler: (status: SignalDaemonStatus) => void): void {
    this.statusHandlers = this.statusHandlers.filter((h) => h !== handler);
  }

  private setStatus(next: SignalDaemonStatus): void {
    if (this._status === next) return;
    this._status = next;
    for (const h of this.statusHandlers) {
      try {
        h(next);
      } catch (err) {
        console.error('[SignalDaemon] status handler threw:', err);
      }
    }
  }

  /** Spawn signal-cli daemon and connect. Resolves once the HTTP endpoint is up. */
  async start(): Promise<void> {
    this.stopRequested = false;
    this.restartAttempts = 0;
    this.setStatus('starting');
    this.spawnChild();
  }

  /** Gracefully stop the daemon and cancel any pending restart / poll. */
  async stop(): Promise<void> {
    this.stopRequested = true;
    this.setStatus('stopped');
    if (this.restartTimer !== null) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.stopReceiveLoop();
    await this.killChild();
  }

  /**
   * Send a JSON-RPC request to the running daemon over HTTP.
   * Throws if the daemon is not running, the HTTP call fails, or the daemon
   * returns a JSON-RPC error envelope.
   */
  async rpc(method: string, params: Record<string, JsonValue>): Promise<unknown> {
    if (!this.child || this._status === 'stopped' || this._status === 'error') {
      throw new Error('signal-cli daemon is not running');
    }
    return this.postRpc(method, params, RPC_TIMEOUT_MS);
  }

  // ── Private spawn/restart logic ──────────────────────────────────────────

  private spawnChild(): void {
    const cliPath = resolveSignalCliPath(this.opts.cliPath);
    const configDir = this.opts.configDir ?? this.resolveDefaultConfigDir();

    const args: string[] = [
      '--config',
      configDir,
      '-a',
      this.opts.phoneNumber,
      'daemon',
      '--http',
      `${this.opts.httpHost}:${this.opts.httpPort}`,
      '--no-receive-stdout',
      // #387: the daemon defaults to `--receive-mode on-connection` (auto-receive
      // in the background), which makes a manual `receive` RPC fail with
      // `-1 Receive command cannot be used if messages are already being received`.
      // Wayland's design is manual polling (pollReceive), so run the daemon in
      // manual receive mode so those polls are accepted (signal-cli 0.13.x/0.14.x).
      '--receive-mode',
      'manual',
    ];

    // stdin is `ignore` - RPC travels over HTTP, not stdio.  stdout/stderr
    // remain piped so we can capture signal-cli's log lines for diagnostics.
    //
    // On Windows, signal-cli is a `.bat`/`.cmd` launcher script; Node cannot
    // spawn those without `shell:true` (otherwise EINVAL). Mirror the
    // shellBridge.ts windows pattern: shell + windowsHide to suppress the
    // console flash. POSIX stays shell-free (argv array, no injection surface).
    const isWindowsLauncher = process.platform === 'win32' && /\.(bat|cmd)$/i.test(cliPath);
    const child = spawn(cliPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...(isWindowsLauncher ? { shell: true, windowsHide: true } : {}),
    });

    this.child = child;

    if (child.stdout) {
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => this.logSignalCliOutput(chunk));
    }

    if (child.stderr) {
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk: string) => this.logSignalCliOutput(chunk));
    }

    child.once('error', (err) => {
      console.error('[SignalDaemon] spawn error:', err.message);
      this.handleUnexpectedExit('spawn-error');
    });

    child.once('exit', (code, signal) => {
      const why = signal ? `signal=${signal}` : `code=${code}`;
      console.warn(`[SignalDaemon] exited (${why})`);
      this.child = null;
      this.handleUnexpectedExit(why);
    });

    // Stay in `starting` until the HTTP endpoint is reachable. `awaitReady()`
    // polls /api/v1/check in the background; on success it flips status to
    // `running` and starts the receive loop. On timeout it flips to `error`.
    // This avoids a window where consumers see status=running but RPC fails.
    void this.awaitReadyAndStartReceive();
  }

  private async awaitReadyAndStartReceive(): Promise<void> {
    const deadline = Date.now() + READY_PROBE_TIMEOUT_MS;
    const probeUrl = `${this.baseUrl}/api/v1/check`;
    while (!this.stopRequested && this.child !== null && Date.now() < deadline) {
      try {
        const res = await fetch(probeUrl, { method: 'GET' });
        if (res.ok) {
          // Re-check after the awaited fetch - stop() or an unexpected exit
          // can land between the fetch resolving and the setStatus call.
          if (this.stopRequested || this.child === null) return;
          this.setStatus('running');
          this.startReceiveLoop();
          return;
        }
      } catch {
        // daemon not up yet - keep probing
      }
      await sleep(READY_PROBE_INTERVAL_MS);
    }
    if (!this.stopRequested && this.child !== null) {
      console.warn('[SignalDaemon] signal-cli HTTP endpoint did not become ready before deadline');
      this.setStatus('error');
    }
  }

  private handleUnexpectedExit(reason: string): void {
    this.child = null;
    this.stopReceiveLoop();

    if (this.stopRequested) return;

    this.restartAttempts += 1;
    if (this.restartAttempts > MAX_RESTART_ATTEMPTS) {
      console.error(`[SignalDaemon] exceeded ${MAX_RESTART_ATTEMPTS} restart attempts - giving up`);
      this.setStatus('error');
      return;
    }

    // Audit gemini MED1 2026-05-18: jitter (0-1000ms) to avoid synchronized
    // signal-cli daemon restart storms across multiple bots.
    const delayMs =
      Math.min(BACKOFF_INITIAL_MS * Math.pow(BACKOFF_FACTOR, this.restartAttempts - 1), BACKOFF_MAX_MS) +
      Math.floor(Math.random() * 1000);
    console.log(
      `[SignalDaemon] restarting in ${delayMs / 1000}s (attempt ${this.restartAttempts}/${MAX_RESTART_ATTEMPTS})…`
    );
    this.setStatus('starting');
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (!this.stopRequested) this.spawnChild();
    }, delayMs);
  }

  private logSignalCliOutput(chunk: string): void {
    for (const line of chunk.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/\b(ERROR|WARN|FAILED|EXCEPTION)\b/i.test(trimmed)) {
        console.error('[SignalDaemon] signal-cli:', trimmed);
      } else {
        console.log('[SignalDaemon] signal-cli:', trimmed);
      }
    }
  }

  // ── HTTP RPC ──────────────────────────────────────────────────────────────

  private async postRpc(method: string, params: Record<string, JsonValue>, timeoutMs: number): Promise<unknown> {
    const id = ++this.rpcId;
    const body = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`signal-cli RPC transport failed: ${msg}`, { cause: err });
    } finally {
      clearTimeout(timer);
    }

    // signal-cli answers 201 No Content for notification-style methods.
    if (res.status === 201) return null;

    const text = await res.text();
    if (!text) {
      throw new Error(`signal-cli RPC empty response (HTTP ${res.status})`);
    }
    let parsed: JsonRpcResponse;
    try {
      parsed = JSON.parse(text) as JsonRpcResponse;
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`signal-cli RPC returned malformed JSON (HTTP ${res.status}): ${cause}`, { cause: err });
    }
    if (parsed.error) {
      throw new Error(`signal-cli RPC ${parsed.error.code}: ${parsed.error.message}`);
    }
    return parsed.result;
  }

  // ── Inbound polling loop ──────────────────────────────────────────────────

  private startReceiveLoop(): void {
    if (this.receiveTimer !== null) return;
    const tick = (): void => {
      this.receiveTimer = null;
      if (this.stopRequested || this._status !== 'running') return;
      void this.pollReceive().finally(() => {
        if (this.stopRequested || this._status !== 'running') return;
        this.receiveTimer = setTimeout(tick, RECEIVE_POLL_INTERVAL_MS);
      });
    };
    // First tick fires immediately so initial inbound traffic isn't delayed.
    this.receiveTimer = setTimeout(tick, 0);
  }

  private stopReceiveLoop(): void {
    if (this.receiveTimer !== null) {
      clearTimeout(this.receiveTimer);
      this.receiveTimer = null;
    }
  }

  private async pollReceive(): Promise<void> {
    if (this.receiveInFlight) return;
    this.receiveInFlight = true;
    try {
      const result = await this.postRpc(
        'receive',
        // #387: a single-account daemon (`-a <number>`) accepts ONLY
        // { maxMessages?, timeout? } for `receive`. `account` is implicit under
        // `-a`, and `ignoreAttachments` is a daemon SPAWN flag
        // (`--ignore-attachments`), not a per-call param - sending either is
        // rejected with `-32600 Unrecognized field`. `timeout` is the per-poll
        // receive window in seconds (we re-poll every RECEIVE_POLL_INTERVAL_MS).
        { timeout: 1 },
        RECEIVE_RPC_TIMEOUT_MS
      );
      const envelopes = Array.isArray(result) ? result : [];
      for (const env of envelopes) {
        if (env && typeof env === 'object') {
          this.dispatchMessage(env as SignalInboundMessage);
        }
      }
    } catch (err) {
      // Polling errors are expected when the daemon is restarting; log at
      // debug level so we don't drown the console.
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[SignalDaemon] receive poll failed:', msg);
    } finally {
      this.receiveInFlight = false;
    }
  }

  private dispatchMessage(msg: SignalInboundMessage): void {
    for (const handler of this.messageHandlers) {
      try {
        handler(msg);
      } catch (err) {
        console.error('[SignalDaemon] message handler threw:', err);
      }
    }
  }

  private resolveDefaultConfigDir(): string {
    try {
      const { app: electronApp } = require('electron') as typeof import('electron');
      return path.join(electronApp.getPath('userData'), 'signal');
    } catch {
      // No Electron app context (unit tests / CLI mode). os.homedir() resolves
      // USERPROFILE on Windows and HOME on POSIX, so the signal-cli state dir
      // lands in a stable, writable per-user location instead of cwd-relative
      // (which would be lost across launches on Windows where HOME is unset).
      // On Windows use %APPDATA% as the platform-appropriate data root.
      if (process.platform === 'win32') {
        const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming');
        return path.join(appData, 'signal-cli');
      }
      return path.join(os.homedir(), '.local', 'share', 'signal-cli');
    }
  }

  private async killChild(): Promise<void> {
    const child = this.child;
    this.child = null;
    if (!child) return;
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {
          /* best-effort */
        }
        resolve();
      }, 5_000);
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
      try {
        child.kill('SIGTERM');
      } catch {
        clearTimeout(timer);
        resolve();
      }
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
