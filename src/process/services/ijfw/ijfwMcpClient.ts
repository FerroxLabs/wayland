/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW MCP client - newline-delimited JSON-RPC over stdio.
 *
 * Speaks to the local `~/.ijfw/mcp-server` install via Electron's main-process
 * Node runtime (`ELECTRON_RUN_AS_NODE=1`). Multiplexes requests by id,
 * serializes stdin writes, and treats decode failures + crashes as triggers
 * to null the process handle so the next `invoke()` respawns from scratch.
 *
 * Replaces the Wave 1 stub at `ijfwMcpClientStub.ts`.
 */

// eslint-disable-next-line no-restricted-imports -- IJFW MCP client spawns the local MCP server process by design (reviewed).
import { spawn, type ChildProcess } from 'node:child_process';
import * as os from 'node:os';
import * as path from 'node:path';
import log from 'electron-log';

import { encode, decode, DecodeError, MAX_LINE_BYTES } from './mcpWireProtocol';
import { buildChildEnv } from './envAllowlist';
import { resolveEntry } from './entryResolver';
import { jsonRpcResponseSchema } from './ipcSchemas';
import type { IjfwErrorReason, IjfwInvokeResult } from '@/common/types/ijfw';

const DEFAULT_TIMEOUT_MS = 30_000;
const SHUTDOWN_DEFAULT_MS = 5_000;
// Wave 7 H1: respawn backoff. Prevents thrashing if entry resolution / fork
// fail repeatedly (missing install, bad permissions, syntax error in entry).
const RESPAWN_BACKOFF_MS = 5_000;

// Codex B1: the renderer (and our own bridge) speaks the schema-allowlisted
// verb names ('memory_facts', 'wiki.get', 'think', etc.). The REAL IJFW MCP
// server (`~/.ijfw/mcp-server/src/server.js`) exposes 14 tools - most under
// the `ijfw_` namespace, plus a single `ijfw_brain` facade that accepts a
// `{verb, args}` envelope for the brain.* / wiki.* / conflict.* family.
//
// Without this mapping every `tools/call` was sent with the wrong tool name
// and the MCP server replied with -32601 method-not-found for every verb.
// Now: direct-mapped verbs resolve straight to their `ijfw_*` peer, and the
// brain verbs are wrapped into a single `ijfw_brain` call.
const BRAIN_VERBS = new Set<string>([
  'think',
  'links',
  'wiki.get',
  'wiki.compile',
  'wiki.promote',
  'wiki.export',
  'wiki.shareReadme',
  'conflict.resolve',
]);

const DIRECT_TOOL_MAP: Record<string, string> = {
  memory_recall: 'ijfw_memory_recall',
  memory_search: 'ijfw_memory_search',
  memory_store: 'ijfw_memory_store',
  memory_facts: 'ijfw_memory_facts',
  memory_prelude: 'ijfw_memory_prelude',
  state: 'ijfw_state',
  metrics: 'ijfw_metrics',
  prompt_check: 'ijfw_prompt_check',
  update_check: 'ijfw_update_check',
  update_apply: 'ijfw_update_apply',
  cross_audit_converge: 'ijfw_cross_audit_converge',
  cross_project_search: 'ijfw_cross_project_search',
};

type ResolvedToolCall =
  | { ok: true; toolName: string; toolArgs: Record<string, unknown> }
  | { ok: false; reason: string };

function resolveToolCall(verb: string, args: Record<string, unknown>): ResolvedToolCall {
  if (Object.prototype.hasOwnProperty.call(DIRECT_TOOL_MAP, verb)) {
    return { ok: true, toolName: DIRECT_TOOL_MAP[verb]!, toolArgs: args };
  }
  if (BRAIN_VERBS.has(verb)) {
    return { ok: true, toolName: 'ijfw_brain', toolArgs: { verb, args } };
  }
  return { ok: false, reason: `unknown verb: ${verb}` };
}

/**
 * Codex B2: the IJFW MCP server returns responses wrapped in the standard MCP
 * envelope `{content: [{type: 'text', text: '<json>'}], isError: boolean}`.
 * The `text` field is itself a JSON-stringified payload. Without unwrapping,
 * every caller saw `{content: [...]}` instead of the real `{ok, answer, ...}`
 * and downstream routing collapsed.
 */
type McpEnvelope = {
  content?: Array<{ type?: unknown; text?: unknown }>;
  isError?: unknown;
};

function unwrapMcpResult(raw: unknown): IjfwInvokeResult {
  if (raw === null || typeof raw !== 'object') {
    return { ok: true, data: raw };
  }
  const envelope = raw as McpEnvelope;
  const firstText =
    Array.isArray(envelope.content) && envelope.content[0]?.text !== undefined
      ? String(envelope.content[0].text)
      : undefined;
  if (envelope.isError === true) {
    return {
      ok: false,
      error: firstText ?? 'IJFW MCP returned isError',
      errorReason: 'mcp_error',
    };
  }
  if (firstText === undefined) {
    return { ok: true, data: raw };
  }
  try {
    const parsed = JSON.parse(firstText) as unknown;
    return { ok: true, data: parsed };
  } catch {
    return { ok: true, data: firstText };
  }
}

type PendingHandler = {
  resolve: (value: IjfwInvokeResult) => void;
  timer: ReturnType<typeof setTimeout>;
};

type WriteQueueItem = {
  payload: Buffer;
  resolve: () => void;
  reject: (err: Error) => void;
};

type RuntimeMode = 'degraded' | 'full';

class IjfwMcpClient {
  private child: ChildProcess | null = null;
  private childPromise: Promise<ChildProcess | null> | null = null;
  private readBuffer: Buffer = Buffer.alloc(0);
  private pending = new Map<number, PendingHandler>();
  private writeQueue: WriteQueueItem[] = [];
  private writing = false;
  private nextId = 1;
  // Checkpoint B B1: initial mode is `full` (optimistic). The previous
  // `degraded` default made every first `brain.invoke` short-circuit at the
  // bridge gate before `ensureSpawned()` ever ran - dead on arrival. We only
  // flip to `degraded` on a real failure (spawn error, decode error, child
  // crash/exit, stdin write failure).
  private mode: RuntimeMode = 'full';
  private exitWaiters: Array<() => void> = [];
  // Wave 7 H1: epoch-millis of the last failed spawn attempt. ensureSpawned()
  // refuses to respawn within RESPAWN_BACKOFF_MS of this timestamp so a
  // permanently-broken install doesn't fork a child on every invoke().
  private lastSpawnFailureAt: number = 0;

  getMode(): RuntimeMode {
    return this.mode;
  }

  /**
   * Invoke an IJFW MCP tool. Lazily spawns the local server on first call;
   * recovers from prior crashes by transparently respawning.
   */
  async invoke(
    verb: string,
    args: Record<string, unknown> = {},
    opts: { timeoutMs?: number } = {}
  ): Promise<IjfwInvokeResult> {
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    // Codex B1: resolve renderer verb to the actual MCP tool name BEFORE we
    // pay the spawn cost. Unknown verbs return validation_failed.
    const resolved = resolveToolCall(verb, args);
    if (resolved.ok === false) {
      return { ok: false, error: resolved.reason, errorReason: 'validation_failed' };
    }

    let child: ChildProcess | null;
    try {
      child = await this.ensureSpawned();
    } catch (err) {
      log.warn('[ijfw-mcp] spawn failed', { err });
      return { ok: false, error: (err as Error).message, errorReason: 'spawn_error' };
    }
    if (!child) {
      return { ok: false, error: 'spawn returned no child', errorReason: 'spawn_error' };
    }

    const id = this.nextId++;
    const envelope = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name: resolved.toolName, arguments: resolved.toolArgs },
    };
    // Checkpoint B H3: direct callers of invoke() (memory enrichment hooks
    // and future internal callers) skip the bridge-layer zod validation. An
    // oversized payload would throw out of `encode()` and surface as an
    // uncaught rejection. Pre-check here and return a structured rejection
    // instead.
    const envelopeBytes = Buffer.byteLength(JSON.stringify(envelope), 'utf-8') + 1;
    if (envelopeBytes >= MAX_LINE_BYTES) {
      return {
        ok: false,
        error: `encoded message exceeds MAX_LINE_BYTES (${envelopeBytes} >= ${MAX_LINE_BYTES})`,
        errorReason: 'validation_failed',
      };
    }
    const payload = encode(envelope);

    return new Promise<IjfwInvokeResult>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve({ ok: false, error: `invoke timeout after ${timeoutMs}ms`, errorReason: 'timeout' });
      }, timeoutMs);
      this.pending.set(id, { resolve, timer });

      this.enqueueWrite(payload).catch((err) => {
        const handler = this.pending.get(id);
        if (!handler) return;
        this.pending.delete(id);
        clearTimeout(handler.timer);
        // GEM-R-06: stdin write error means the child is unhealthy. null the
        // process so the next call respawns; treat it as a crash.
        this.handleChildLoss();
        resolve({ ok: false, error: err.message, errorReason: 'mcp_crashed' });
      });
    });
  }

  /** Send SIGTERM, wait for exit, then SIGKILL on timeout. No-op when not running. */
  async shutdown(timeoutMs: number = SHUTDOWN_DEFAULT_MS): Promise<void> {
    const child = this.child;
    if (!child) return;
    try {
      child.kill('SIGTERM');
    } catch {
      /* ignore */
    }
    const exited = await this.waitForExit(timeoutMs);
    if (!exited && this.child) {
      try {
        this.child.kill('SIGKILL');
      } catch {
        /* ignore */
      }
      await this.waitForExit(timeoutMs);
    }
  }

  /** Resolve when the current child exits, or after `timeoutMs`. */
  async waitForExit(timeoutMs: number): Promise<boolean> {
    if (!this.child) return true;
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        this.exitWaiters = this.exitWaiters.filter((w) => w !== onExit);
        resolve(false);
      }, timeoutMs);
      const onExit = () => {
        clearTimeout(timer);
        resolve(true);
      };
      this.exitWaiters.push(onExit);
    });
  }

  /** Test-only reset. */
  __resetForTests(): void {
    for (const handler of this.pending.values()) clearTimeout(handler.timer);
    this.pending.clear();
    this.writeQueue = [];
    this.writing = false;
    this.nextId = 1;
    this.readBuffer = Buffer.alloc(0);
    this.exitWaiters = [];
    if (this.child) {
      try {
        this.child.kill('SIGKILL');
      } catch {
        /* ignore */
      }
    }
    this.child = null;
    this.childPromise = null;
    // Checkpoint B B1: reset to `full` (optimistic) - matches initial state.
    this.mode = 'full';
    // Wave 7 H1: clear backoff so tests can attempt fresh spawns.
    this.lastSpawnFailureAt = 0;
  }

  private async ensureSpawned(): Promise<ChildProcess | null> {
    if (this.child) return this.child;
    if (this.childPromise) return this.childPromise;
    // Wave 7 H1: backoff. Don't refork within RESPAWN_BACKOFF_MS of the last
    // failed spawn. Without this, a permanently-broken install would attempt
    // a fresh spawn on every invoke() and burn CPU on resolveEntry()/spawn()
    // until the user uninstalls.
    const sinceLastFailure = Date.now() - this.lastSpawnFailureAt;
    if (this.lastSpawnFailureAt > 0 && sinceLastFailure < RESPAWN_BACKOFF_MS) {
      throw new Error(`IJFW MCP respawn backoff active (${RESPAWN_BACKOFF_MS - sinceLastFailure}ms remaining)`);
    }
    this.childPromise = this.spawnChild()
      .then((child) => {
        this.child = child;
        this.mode = child ? 'full' : 'degraded';
        if (child) this.lastSpawnFailureAt = 0;
        return child;
      })
      .catch((err) => {
        this.mode = 'degraded';
        this.lastSpawnFailureAt = Date.now();
        throw err;
      })
      .finally(() => {
        this.childPromise = null;
      });
    return this.childPromise;
  }

  private async spawnChild(): Promise<ChildProcess> {
    const mcpServerDir = path.join(os.homedir(), '.ijfw', 'mcp-server');
    const entry = await resolveEntry(mcpServerDir);
    const env = buildChildEnv({ ELECTRON_RUN_AS_NODE: '1' });
    const child = spawn(process.execPath, [entry], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    child.stdout?.on('data', (chunk: Buffer) => this.onStdout(chunk));
    child.stderr?.on('data', (chunk: Buffer) => {
      log.debug('[ijfw-mcp][stderr]', chunk.toString('utf-8').trim());
    });
    child.on('error', (err) => {
      log.warn('[ijfw-mcp] child error', { err });
    });
    child.on('exit', (code, signal) => {
      log.info('[ijfw-mcp] child exit', { code, signal });
      this.handleChildLoss();
    });

    return child;
  }

  private onStdout(chunk: Buffer): void {
    this.readBuffer = Buffer.concat([this.readBuffer, chunk]);
    let decoded;
    try {
      decoded = decode(this.readBuffer);
    } catch (err) {
      if (err instanceof DecodeError) {
        log.error('[ijfw-mcp] decode error - killing child', { err: err.message });
        try {
          this.child?.kill();
        } catch {
          /* ignore */
        }
        this.handleChildLoss();
        return;
      }
      throw err;
    }
    this.readBuffer = decoded.remainder;
    for (const raw of decoded.messages) {
      const parsed = jsonRpcResponseSchema.safeParse(raw);
      if (!parsed.success) {
        log.warn('[ijfw-mcp] invalid envelope - dropping', { err: parsed.error.message });
        continue;
      }
      const handler = this.pending.get(parsed.data.id);
      if (!handler) continue;
      this.pending.delete(parsed.data.id);
      clearTimeout(handler.timer);
      if (parsed.data.error) {
        const reason: IjfwErrorReason = 'mcp_error';
        handler.resolve({
          ok: false,
          error: parsed.data.error.message,
          errorReason: reason,
        });
      } else {
        // Codex B2: unwrap the MCP envelope (`{content: [{text}], isError}`)
        // so callers receive the real JSON payload, not the transport shell.
        handler.resolve(unwrapMcpResult(parsed.data.result));
      }
    }
  }

  private async enqueueWrite(payload: Buffer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.writeQueue.push({ payload, resolve, reject });
      this.drainQueue();
    });
  }

  private drainQueue(): void {
    if (this.writing || this.writeQueue.length === 0) return;
    const child = this.child;
    if (!child || !child.stdin) return;
    this.writing = true;
    const item = this.writeQueue.shift()!;
    try {
      child.stdin.write(item.payload, (err) => {
        this.writing = false;
        if (err) {
          item.reject(err);
        } else {
          item.resolve();
        }
        setImmediate(() => this.drainQueue());
      });
    } catch (err) {
      this.writing = false;
      item.reject(err instanceof Error ? err : new Error(String(err)));
      setImmediate(() => this.drainQueue());
    }
  }

  private handleChildLoss(): void {
    this.child = null;
    this.mode = 'degraded';
    this.readBuffer = Buffer.alloc(0);

    // Reject every pending request - they will never receive a response.
    for (const [id, handler] of this.pending) {
      clearTimeout(handler.timer);
      handler.resolve({
        ok: false,
        error: 'IJFW MCP child exited',
        errorReason: 'mcp_crashed',
      });
      this.pending.delete(id);
    }
    // Reject queued writes.
    while (this.writeQueue.length > 0) {
      const item = this.writeQueue.shift()!;
      item.reject(new Error('IJFW MCP child exited'));
    }
    this.writing = false;
    // Fire exit waiters.
    const waiters = this.exitWaiters.slice();
    this.exitWaiters = [];
    for (const w of waiters) w();
  }
}

const instance = new IjfwMcpClient();

export const ijfwMcpClient = {
  invoke: (verb: string, args?: Record<string, unknown>, opts?: { timeoutMs?: number }) =>
    instance.invoke(verb, args, opts),
  shutdown: (timeoutMs?: number) => instance.shutdown(timeoutMs),
  waitForExit: (timeoutMs: number) => instance.waitForExit(timeoutMs),
  getMode: (): RuntimeMode => instance.getMode(),
};

/** Test-only - reset module-level state. */
export function __resetForTests(): void {
  instance.__resetForTests();
}
