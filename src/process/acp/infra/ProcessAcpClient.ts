// src/process/acp/infra/ProcessAcpClient.ts

/**
 * ProcessAcpClient - Single owner of a local agent subprocess + ACP protocol.
 *
 * Internally manages:
 *   - Child process (via spawnFn callback - allows legacy and direct spawn)
 *   - Stderr ring buffer (8KB, captured from spawn time)
 *   - 4-signal lifecycle detection (exit, close, stdout.close, connection.abort)
 *   - Startup failure watcher (Promise.race: init vs process exit)
 *   - Pending request tracking (runConnectionRequest wraps every SDK call)
 *   - SDK ClientSideConnection
 *   - NdjsonTransport
 *   - Graceful 3-phase shutdown
 *
 * See docs/specs/acp-rewrite/02-reference-implementation.md §6.1-6.2
 */

import type {
  Client,
  ForkSessionResponse,
  InitializeResponse,
  LoadSessionResponse,
  NewSessionResponse,
  PromptResponse,
  SetSessionConfigOptionRequest,
} from '@agentclientprotocol/sdk';
import { ClientSideConnection, PROTOCOL_VERSION } from '@agentclientprotocol/sdk';
import { AgentDisconnectedError, AgentSpawnError, AgentStartupError } from '@process/acp/errors/AcpError';
import { normalizeError } from '@process/acp/errors/errorNormalize';
import { mapModeForAcpBridge } from '@/common/types/agentModes';
import * as os from 'node:os';
import * as path from 'node:path';
import type { CreateSessionParams, ForkSessionParams, LoadSessionParams } from '@process/acp/infra/AcpProtocol';
import type {
  AcpClient,
  AgentDisconnectReason,
  AgentExitInfo,
  AgentLifecycleSnapshot,
  DisconnectInfo,
} from '@process/acp/infra/IAcpClient';
import { NdjsonTransport } from '@process/acp/infra/NdjsonTransport';
import { gracefulShutdown, waitForExit, waitForSpawn } from '@process/acp/infra/processUtils';
import type { PromptContent, ProtocolHandlers } from '@process/acp/types';
import type { ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';

/**
 * Bound on the COMPLETE records the stderr ring retains. Enforced by dropping whole
 * records off the front, never by cutting through one - see {@link ProcessAcpClient.appendStderr}.
 */
const STARTUP_STDERR_MAX = 8192;

/**
 * Hard ceiling on ONE unterminated record - an agent that writes megabytes without
 * ever emitting `\r` or `\n`.
 *
 * The ring cannot cut a partial record safely (that is the whole point of
 * `appendStderr`), so this is not a slice: on overflow the accumulated fragment is
 * FROZEN as a final record and everything after it is discarded until the next real
 * boundary arrives. Freezing keeps the head, which keeps every credential's ANCHOR
 * attached to the part that is retained; discarding to the next boundary is what
 * guarantees the resumed stream cannot begin mid-credential.
 *
 * 32KB = 4x the record budget. It has to sit well ABOVE the largest single line a
 * real agent emits or it would throw away the diagnostic it exists to preserve: a
 * 21KB minified stack frame on one line is a measured shape, and a bound near
 * {@link STARTUP_STDERR_MAX} would have frozen that record before its error text
 * arrived. It has to sit well BELOW anything that matters for memory, which 32KB
 * per client does not.
 */
const STDERR_PENDING_MAX = 32768;

/**
 * How long to wait for a child that had ALREADY exited when the lifecycle
 * listeners attached before synthesising its exit. 'close' normally arrives
 * first and carries the flushed stderr with it; this is the backstop.
 */
const MISSED_EXIT_REPLAY_MS = 250;

/**
 * How long a prompt may run with ZERO bytes read off the agent's stdout before the
 * transport is declared gone (#1061).
 *
 * Only consulted on win32, where the pipe signals cannot fire for a live child (see
 * {@link ProcessAcpClient.attachLifecycleObservers}). It has to sit well above the
 * longest legitimate silence a working agent produces mid-prompt - a single long
 * tool call, e.g. a multi-minute build, during which the agent emits nothing - and
 * it only has to beat "never", which is what Windows had. Ten minutes clears the
 * longest tool call we have measured by a wide margin, and the alternative it
 * replaces is a prompt that hangs until the user gives up.
 */
const TRANSPORT_SILENCE_MS = 600_000;

/** Poll interval for the silence watchdog. Fine enough to be testable, cheap enough to ignore. */
function transportWatchdogTickMs(silenceMs: number): number {
  return Math.max(50, Math.floor(silenceMs / 4));
}

/**
 * Resolve `target` to a real filesystem path, symlinks included.
 *
 * bun names the REAL path of the module it could not resolve. On macOS that is
 * `/private/var/folders/.../T/bunx-...`, while `os.tmpdir()` hands back the
 * symlinked `/var/folders/.../T` form of the same directory. A textual
 * comparison of the two disagrees, so the containment guard below rejects bun's
 * own working directory as "suspicious" and the corrupt install is never
 * cleared. Both sides go through here so they are compared in the same form.
 *
 * Falls back to the lexically resolved path when the target does not exist,
 * which keeps the guard usable for paths that were already removed.
 */
function resolveRealPath(target: string): string {
  const resolved = path.resolve(target);
  try {
    return fs.realpathSync(resolved);
  } catch {
    return resolved;
  }
}

type PendingRequest = {
  settled: boolean;
  reject: (error: unknown) => void;
};

export type ProcessAcpClientOptions = {
  backend: string;
  handlers: ProtocolHandlers;
  gracePeriodMs?: number;
  /**
   * Platform the lifecycle detection should assume. Defaults to `process.platform`.
   * Passed explicitly by the #1061 tests so the win32-only transport-silence
   * watchdog is pinned from any host - the local box is not CI, and a darwin-only
   * proof would prove nothing about the platform the watchdog exists for.
   */
  platform?: NodeJS.Platform;
  /** Override {@link TRANSPORT_SILENCE_MS}. Tests only; production uses the default. */
  transportSilenceMs?: number;
};

export class ProcessAcpClient implements AcpClient {
  private child: ChildProcess | null = null;
  private connection: ClientSideConnection | null = null;
  private _connProxy: ClientSideConnection | null = null;
  private closing = false;

  // Stderr ring buffer, held as COMPLETE records plus the incomplete tail fragment.
  private stderrRecords: string[] = [];
  private stderrRecordsLength = 0;
  private stderrPending = '';
  private stderrResyncing = false;

  /** The ring as one string. Raw and unscrubbed - every consumer scrubs. */
  private get stderrBuffer(): string {
    return this.stderrRecords.join('') + this.stderrPending;
  }

  // Lifecycle state (first-write-wins)
  private _lastExit: AgentExitInfo | null = null;
  private disconnectHandler: ((info: DisconnectInfo) => void) | null = null;
  private hasActivePrompt = false;

  // Transport-silence watchdog (#1061). `lastStdoutBytes` is the last value read
  // off the child's stdout socket, NOT a copy of its data - the data path is
  // owned by NdjsonTransport and must not be touched.
  private transportWatchdog: NodeJS.Timeout | null = null;
  private lastStdoutBytes = 0;
  private lastStdoutChangeAt = 0;

  // Learned capability: set to true once the agent rejects session/set_model
  // with -32601 (Method not found), so we stop re-sending it (#298).
  private setModelUnsupported = false;

  // Pending request tracking
  private readonly pendingRequests = new Set<PendingRequest>();

  constructor(
    private readonly spawnFn: () => Promise<ChildProcess>,
    private readonly options: ProcessAcpClientOptions
  ) {}

  // ─── Lifecycle ──────────────────────────────────────────────

  get lifecycleSnapshot(): AgentLifecycleSnapshot {
    return {
      pid: this.child?.pid ?? null,
      running: this.child !== null && this._lastExit === null,
      lastExit: this._lastExit,
    };
  }

  onDisconnect(handler: (info: DisconnectInfo) => void): void {
    this.disconnectHandler = handler;
  }

  // ─── start() - spawn + init + startup failure watcher ─────

  async start(): Promise<InitializeResponse> {
    // 1. Spawn child process
    let child: ChildProcess;
    try {
      child = await this.spawnFn();
      await waitForSpawn(child);
    } catch (err) {
      throw new AgentSpawnError(this.options.backend, err);
    }
    this.child = child;

    // 2. Capture stderr from spawn time
    this.setupStderrCapture(child);

    // 3. Attach 4-signal lifecycle observers
    this.attachLifecycleObservers(child);

    // 4. Create transport + SDK connection
    const stream = NdjsonTransport.fromChildProcess(child);
    const connection = new ClientSideConnection(
      (_agent): Client => ({
        sessionUpdate: async (params) => this.options.handlers.onSessionUpdate(params),
        requestPermission: async (params) => this.options.handlers.onRequestPermission(params),
        readTextFile: async (params) => this.options.handlers.onReadTextFile(params),
        writeTextFile: async (params) => this.options.handlers.onWriteTextFile(params),
        // Vendor extensions. The SDK does NOT schema-validate these, which is
        // exactly why Nano's cost metering moved here after `sessionUpdate:
        // 'budget'` was rejected outright. Without this arm the SDK answers
        // methodNotFound and logs on every frame.
        extNotification: async (method, params) => this.options.handlers.onExtNotification?.(method, params),
      }),
      stream
    );
    this.connection = connection;

    // Also listen for SDK connection abort
    connection.signal.addEventListener(
      'abort',
      () => this.recordAgentExit('connection_close', child.exitCode ?? null, child.signalCode ?? null),
      { once: true }
    );

    // 5. Promise.race: initialize vs startup failure watcher
    const startupFailure = this.createStartupFailureWatcher(child);
    try {
      const initResult = await Promise.race([
        this.runConnectionRequest(() =>
          this.conn.initialize({
            clientInfo: { name: 'Wayland', version: '2.0.0' },
            protocolVersion: PROTOCOL_VERSION,
            clientCapabilities: {
              fs: { readTextFile: true, writeTextFile: true },
            },
          })
        ),
        startupFailure.promise,
      ]);
      startupFailure.dispose();
      return initResult;
    } catch (err) {
      startupFailure.dispose();
      // Normalize SDK "ACP connection closed" into AgentStartupError
      throw await this.normalizeInitializeError(err, child);
    }
  }

  // ─── Protocol Methods (wrapped with runConnectionRequest) ──

  async createSession(params: CreateSessionParams): Promise<NewSessionResponse> {
    return this.runConnectionRequest(() =>
      this.conn.newSession({
        cwd: params.cwd,
        mcpServers: params.mcpServers ?? [],
        additionalDirectories: params.additionalDirectories,
      })
    );
  }

  async loadSession(params: LoadSessionParams): Promise<LoadSessionResponse> {
    return this.runConnectionRequest(() =>
      this.conn.loadSession({
        sessionId: params.sessionId,
        cwd: params.cwd,
        mcpServers: params.mcpServers ?? [],
        additionalDirectories: params.additionalDirectories,
      })
    );
  }

  /**
   * Fork an existing session, creating a new independent session that
   * inherits the parent's conversation context.
   *
   * TODO(acp-fork): The current implementation is a workaround.
   * Claude does not support the standard ACP `session/fork` method yet, so we
   * fall back to `session/new` with Claude-specific `_meta.claudeCode.options.resume`
   * plus a non-standard `forkSession: true` parameter. This approach is
   * Claude-only and non-portable.
   *
   * Once ACP agents implement the standard `session/fork` (currently @experimental
   * in the SDK), this should switch to `sdk.unstable_forkSession()` - and once
   * the spec stabilizes, to the stable SDK method.
   */
  async forkSession(params: ForkSessionParams): Promise<ForkSessionResponse> {
    return this.runConnectionRequest(() =>
      this.conn.extMethod('session/new', {
        cwd: params.cwd,
        mcpServers: params.mcpServers ?? [],
        _meta: { claudeCode: { options: { resume: params.sessionId } } },
        forkSession: true,
      })
    ) as Promise<ForkSessionResponse>;
  }

  async prompt(sessionId: string, content: PromptContent): Promise<PromptResponse> {
    this.hasActivePrompt = true;
    this.armTransportWatchdog();
    try {
      return await this.runConnectionRequest(() => this.conn.prompt({ sessionId, prompt: content }));
    } finally {
      this.hasActivePrompt = false;
      this.disarmTransportWatchdog();
    }
  }

  async cancel(sessionId: string): Promise<void> {
    await this.runConnectionRequest(() => this.conn.cancel({ sessionId }));
  }

  async closeSession(sessionId: string): Promise<void> {
    await this.runConnectionRequest(() => this.conn.unstable_closeSession({ sessionId }));
  }

  async setModel(sessionId: string, modelId: string): Promise<void> {
    // Feature-detect session/set_model. Some agents (e.g. opencode v1.17.9) do
    // not implement it and reject with JSON-RPC -32601 "Method not found". Once
    // learned, skip the call instead of repeating it on every prompt re-assert -
    // which otherwise floods the logs and never selects a model (#298).
    if (this.setModelUnsupported) return;
    try {
      await this.runConnectionRequest(() => this.conn.unstable_setSessionModel({ sessionId, modelId }));
    } catch (err) {
      if (normalizeError(err).code === 'ACP_METHOD_NOT_FOUND') {
        this.setModelUnsupported = true;
        console.warn(
          `[ProcessAcpClient] ${this.options.backend}: session/set_model not supported by this agent; ` +
            'skipping model selection (the agent manages its own model).'
        );
        return;
      }
      throw err;
    }
  }

  async setMode(sessionId: string, modeId: string): Promise<void> {
    // Translate Wayland-internal modes the bridge does not understand before
    // session/set_mode. Today only 'autoGuarded' -> 'default' (so the bridge
    // escalates risky tool calls as permission requests that Wayland's guardrail
    // then auto-approves-or-vetoes). Real bridge modes pass through unchanged.
    const bridgeModeId = mapModeForAcpBridge(modeId);
    await this.runConnectionRequest(() => this.conn.setSessionMode({ sessionId, modeId: bridgeModeId }));
  }

  async setConfigOption(sessionId: string, configId: string, value: string | boolean): Promise<void> {
    const params: SetSessionConfigOptionRequest =
      typeof value === 'boolean' ? { sessionId, configId, type: 'boolean', value } : { sessionId, configId, value };
    await this.runConnectionRequest(() => this.conn.setSessionConfigOption(params));
  }

  async authenticate(methodId: string): Promise<unknown> {
    return this.runConnectionRequest(() => this.conn.authenticate({ methodId }));
  }

  async extMethod(method: string, params: Record<string, unknown>): Promise<unknown> {
    return this.runConnectionRequest(() => this.conn.extMethod(method, params));
  }

  // ─── Shutdown ─────────────────────────────────────────────

  async close(): Promise<void> {
    this.closing = true;
    this.disarmTransportWatchdog();
    if (this.child) {
      await gracefulShutdown(this.child, this.options.gracePeriodMs ?? 100);
      this.child = null;
    }
    this.connection = null;
    this._connProxy = null;
  }

  // ─── Internals: Connection accessor ────────────────────────

  private get conn(): ClientSideConnection {
    if (!this.connection) {
      throw new AgentDisconnectedError('connection_close', null, null);
    }
    if (!this._connProxy) {
      this._connProxy = this.loggingProxy(this.connection);
    }
    return this._connProxy;
  }

  /**
   * Wrap a ClientSideConnection with a Proxy that logs every method call
   * (request args + response/error) via console.debug.
   * Zero-touch: all current and future SDK methods are captured automatically.
   */
  private loggingProxy(conn: ClientSideConnection): ClientSideConnection {
    const backend = this.options.backend;
    return new Proxy(conn, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver) as unknown;
        if (typeof value !== 'function') return value;

        const label = String(prop);
        const tag = `[AcpClient:${backend}:${label}]`;
        return (...args: unknown[]) => {
          console.debug(`${tag}\n \x1b[36m-> ${JSON.stringify(args)}\x1b[0m`);
          const result = (value as (...a: unknown[]) => unknown).apply(target, args);
          if (result instanceof Promise) {
            return result.then(
              (res: unknown) => {
                console.debug(`${tag}\n \x1b[32m<- ${JSON.stringify(res)}\x1b[0m`);
                return res;
              },
              (err: unknown) => {
                console.debug(`${tag}\n \x1b[31m<- ERROR ${JSON.stringify(err)}\x1b[0m`);
                throw err;
              }
            );
          }
          return result;
        };
      },
    });
  }

  // ─── Internals: Pending request tracking ───────────────────

  /**
   * Wraps every SDK call. On disconnect, all pending requests are rejected
   * with AgentDisconnectedError (not the SDK's opaque "ACP connection closed").
   */
  private async runConnectionRequest<T>(run: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const pending: PendingRequest = { settled: false, reject };
      this.pendingRequests.add(pending);

      const finish = (fn: () => void) => {
        if (pending.settled) return;
        pending.settled = true;
        this.pendingRequests.delete(pending);
        fn();
      };

      Promise.resolve()
        .then(run)
        .then(
          (value) => finish(() => resolve(value)),
          (error) => finish(() => reject(error))
        );
    });
  }

  private rejectPendingRequests(error: unknown): void {
    for (const pending of this.pendingRequests) {
      if (pending.settled) continue;
      pending.settled = true;
      this.pendingRequests.delete(pending);
      pending.reject(error);
    }
  }

  // ─── Internals: Stderr capture ────────────────────────────

  private setupStderrCapture(child: ChildProcess): void {
    child.stderr?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      console.error(`[ACP ${this.options.backend} STDERR]:`, chunk);
      this.appendStderr(chunk);
    });
  }

  /**
   * Grow the stderr ring by one chunk, keeping it a sequence of COMPLETE RECORDS
   * (#1023). NOTHING is scrubbed here. `redactSecrets` runs at READ time only, in
   * `buildStderrTail` and `AgentStartupError`, where it is handed whole text.
   *
   * #1020 routes this ring into the chat transcript through `buildCrashMessage`,
   * which makes its truncation a disclosure path: `redactSecrets` only matches a
   * WHOLE credential, so any cut through one leaves a remainder that every
   * downstream scrub misses. Cutting only on record boundaries removes the cut
   * that could do that - a boundary never lands mid-word, so the four shapes that
   * leaked on main cannot recur: `Bearer <token>`, `Authorization: <token>` and
   * `api_key = <value>` each keep their ANCHOR in a separate whitespace-delimited
   * word, and a cut landing inside the anchor left the secret whole and merely
   * un-anchored, while `password=<value>` keeps both in one run.
   *
   * Scrubbing HERE instead was the first attempt at that and it is NOT safe, which
   * is why this reads at collection and masks at read rather than the reverse.
   * `redactSecrets` is not resumable: masking a PARTIAL credential replaces its
   * anchor with `[redacted]`, and the continuation arriving in the NEXT chunk is
   * then anchorless and invisible to every later scrub. Measured through the real
   * path, both against a live-shaped key inside a >256 character run of minified
   * JSON (51 characters reached the banner, sitting immediately after the
   * `[redacted]` that ate its prefix) and against a PEM private key split across
   * two writes - the PEM rule matches BEGIN-to-end-of-input, so the head scrub
   * consumed the anchor while the body was still arriving and the whole key body
   * plus its `-----END PRIVATE KEY-----` line reached the banner.
   *
   * A boundary is `\r` as well as `\n`: bare-CR output (progress bars, old-Mac
   * line endings) has real record boundaries with no `\n` anywhere. `\r\n` splits
   * into two records; joining is lossless either way, so the ring is always a
   * verbatim substring of the child's stderr.
   *
   * Two degenerate cases, both measured:
   *
   *  - A SINGLE record larger than the whole ring (a minified stack frame, a JSON
   *    config echo, a base64 dump). Eviction stops at one record rather than
   *    emptying the ring, so the diagnostic still reaches the banner: 21KB on one
   *    line used to give `ringLen=0` and a banner with no `Agent stderr:` section
   *    at all. Its tail cannot be trimmed to the budget, because trimming a tail is
   *    exactly the anchor-cut above. It is dropped as soon as any NEWER record
   *    exists, which is the more recent diagnostic anyway.
   *
   *  - Unbounded PENDING growth, handled by {@link STDERR_PENDING_MAX}.
   */
  private appendStderr(chunk: string): void {
    let text = chunk;

    // Discarding to the next real boundary after a frozen record: resuming anywhere
    // else could resume INSIDE a credential whose anchor was frozen away.
    if (this.stderrResyncing) {
      const boundary = text.search(/[\r\n]/);
      if (boundary < 0) return;
      text = text.slice(boundary + 1);
      this.stderrResyncing = false;
    }

    this.stderrPending += text;

    const lastBoundary = Math.max(this.stderrPending.lastIndexOf('\n'), this.stderrPending.lastIndexOf('\r'));
    if (lastBoundary >= 0) {
      const complete = this.stderrPending.slice(0, lastBoundary + 1);
      this.stderrPending = this.stderrPending.slice(lastBoundary + 1);
      for (const record of complete.match(/[^\r\n]*[\r\n]/g) ?? []) {
        this.stderrRecords.push(record);
        this.stderrRecordsLength += record.length;
      }
    }

    if (this.stderrPending.length > STDERR_PENDING_MAX) {
      this.stderrRecords.push(this.stderrPending);
      this.stderrRecordsLength += this.stderrPending.length;
      this.stderrPending = '';
      this.stderrResyncing = true;
    }

    // Drop WHOLE records off the front until the ring fits the budget. The budget
    // counts the pending fragment too, because that is what a consumer reads.
    //
    // The last clause is the oversized-record case above: eviction stops rather than
    // leaving the ring EMPTY, because a banner with no `Agent stderr:` section at all
    // is worse than an over-budget one, and there is no safe way to trim a single
    // record down to size. When the retained text still exceeds the budget it is
    // because no record boundary exists to cut on - never because a cut was declined.
    while (
      this.stderrRecords.length > 0 &&
      this.stderrRecordsLength + this.stderrPending.length > STARTUP_STDERR_MAX &&
      (this.stderrRecords.length > 1 || this.stderrPending.length > 0)
    ) {
      this.stderrRecordsLength -= this.stderrRecords.shift()!.length;
    }
  }

  // ─── Internals: 4-signal lifecycle detection ───────────────

  /**
   * Four PIPE signals plus, on Windows only, a fifth that does not come from the pipe
   * at all (#1061).
   *
   * Three of the four below are transport signals - `pipe_close` fires on the child's
   * stdout 'close', and `connection_close` (attached in start()) fires when the SDK
   * aborts on that readable's 'end'. On win32 neither ever fires while the child is
   * still running. Executed on a real Windows box, with a known positive in the same
   * run:
   *
   *   child does `process.stdout.end()`, stays alive -> parent sees nothing
   *   child does `fs.closeSync(1)`, stays alive      -> parent sees nothing
   *   child really exits (control)                   -> parent sees
   *      stdout 'end', stdout 'close', 'exit', 'close'
   *
   * The same probe on darwin reports stdout 'end' + 'close' with the child still alive
   * for both of the first two cases, so this is a platform difference, not a bug in the
   * probe. A genuinely crashed or killed agent IS still reported on Windows through
   * the control above, because process death closes the pipe; what had no signal at
   * all was an agent process that lives on while its transport goes away - the #1020
   * customer shape - and that prompt simply hung until the caller gave up.
   *
   * {@link armTransportWatchdog} closes that gap with the one measurement that does
   * not depend on the pipe's EVENT stream: how many bytes have actually been READ off
   * the child's stdout socket. A failing write is no help here (the parent writes to
   * the child's STDIN, which is still open), and neither is an ACP-level "did it
   * answer" timer, which would fire on any agent that is merely slow.
   *
   * One Windows effect remains even when the child DOES die: `connection_close`
   * reliably wins the first-write-wins race below, so `exitCode` and `signal` reach
   * `buildCrashMessage` as null and the banner never carries an exit code from this
   * path. The CRLF stderr ring is preserved either way.
   *
   * The live-child tests in `tests/unit/acpDisconnectTransport.test.ts` and
   * `tests/integration/process/acp/session/AcpSession.disconnectBanner.test.ts` stay
   * `skipIf(win32)`: they assert the IMMEDIATE pipe route, which is still unreachable
   * on Windows. The watchdog route is covered cross-platform in
   * `tests/unit/acpTransportSilenceWatchdog.test.ts`.
   */
  private attachLifecycleObservers(child: ChildProcess): void {
    child.once('exit', (code, signal) => {
      this.recordAgentExit('process_exit', code, signal);
    });
    child.once('close', (code, signal) => {
      this.recordAgentExit('process_close', code, signal);
    });
    child.stdout?.once('close', () => {
      this.recordAgentExit('pipe_close', child.exitCode ?? null, child.signalCode ?? null);
    });
    // connection_close is attached after ClientSideConnection is created (in start())
  }

  /**
   * Bytes read so far off the child's stdout, or null when that cannot be measured.
   *
   * `child.stdout` is a `net.Socket` for a piped stdio, and `bytesRead` is a plain
   * counter on it. Reading it is passive: it does not consume, pause, or resume the
   * stream, which matters because the data path belongs to `NdjsonTransport` via
   * `Readable.toWeb()` and a second consumer would steal frames from the SDK.
   */
  private stdoutBytesRead(): number | null {
    const bytes = (this.child?.stdout as { bytesRead?: unknown } | null | undefined)?.bytesRead;
    return typeof bytes === 'number' ? bytes : null;
  }

  /**
   * Arm the win32 transport-silence watchdog for the duration of one prompt (#1061).
   *
   * Scoped deliberately narrowly, because a false "the agent disconnected" banner
   * would be worse than the bug it replaces:
   *   - win32 only. Everywhere else the pipe signals are EXACT and fire in
   *     milliseconds, so a timer could only ever add false positives.
   *   - during a prompt only. An idle, connected agent is silent by definition.
   *   - bytes, not answers. Any inbound frame - a session/update chunk, a permission
   *     request, an unknown-method notification - moves `bytesRead` and resets the
   *     clock, so an agent that is working but slow to ANSWER is never accused. Only
   *     an agent that has sent literally nothing for the whole window is.
   *
   * Reported as `connection_close` rather than a new reason: that is exactly what has
   * been concluded - the transport is gone, and nothing about a process exit is known -
   * and it reuses the honest banner that already says so.
   */
  private armTransportWatchdog(): void {
    this.disarmTransportWatchdog();
    if ((this.options.platform ?? process.platform) !== 'win32') return;
    const silenceMs = this.options.transportSilenceMs ?? TRANSPORT_SILENCE_MS;
    if (!(silenceMs > 0)) return;
    const bytes = this.stdoutBytesRead();
    if (bytes === null) return;

    this.lastStdoutBytes = bytes;
    this.lastStdoutChangeAt = Date.now();
    this.transportWatchdog = setInterval(() => this.checkTransportSilence(silenceMs), transportWatchdogTickMs(silenceMs));
    this.transportWatchdog.unref?.();
  }

  private disarmTransportWatchdog(): void {
    if (!this.transportWatchdog) return;
    clearInterval(this.transportWatchdog);
    this.transportWatchdog = null;
  }

  private checkTransportSilence(silenceMs: number): void {
    if (this._lastExit || !this.hasActivePrompt || this.closing) {
      this.disarmTransportWatchdog();
      return;
    }
    const bytes = this.stdoutBytesRead();
    if (bytes === null) {
      this.disarmTransportWatchdog();
      return;
    }
    if (bytes !== this.lastStdoutBytes) {
      this.lastStdoutBytes = bytes;
      this.lastStdoutChangeAt = Date.now();
      return;
    }
    if (Date.now() - this.lastStdoutChangeAt < silenceMs) return;

    this.disarmTransportWatchdog();
    console.warn(
      `[ACP ${this.options.backend}] No bytes from the agent for ${silenceMs}ms during a prompt; ` +
        'treating the transport as dropped (#1061).'
    );
    this.recordAgentExit('connection_close', this.child?.exitCode ?? null, this.child?.signalCode ?? null);
  }

  /**
   * First-write-wins: only the first signal records exit info.
   * Subsequent signals are ignored (idempotent).
   */
  private recordAgentExit(
    reason: AgentDisconnectReason,
    exitCode: number | null,
    signal: NodeJS.Signals | string | null
  ): void {
    if (this._lastExit) return;

    if (signal) {
      console.warn(
        `[ACP ${this.options.backend}] Process killed by signal: ${signal}` +
          (exitCode !== null ? ` (exit code: ${exitCode})` : '') +
          ` [reason: ${reason}]`
      );
    } else if (exitCode !== null && exitCode !== 0) {
      console.warn(`[ACP ${this.options.backend}] Process exited with code ${exitCode} [reason: ${reason}]`);
    }

    const unexpectedDuringPrompt = !this.closing && this.hasActivePrompt;

    this._lastExit = {
      exitCode,
      signal: signal ? String(signal) : null,
      reason,
      stderr: this.stderrBuffer,
      unexpectedDuringPrompt,
    };

    // Reject the pending SDK requests, then notify the disconnect handler - both
    // SYNCHRONOUSLY, in that order.
    //
    // That order is load-bearing, and it is not what it looks like. A rejection's
    // continuation is a microtask, so `AcpSession.onDisconnect` still runs BEFORE
    // `PromptExecutor.handlePromptError` sees the rejected prompt. That is exactly
    // what arms `handlePromptError`'s "someone else owns recovery" guard
    // (`status !== 'prompting'`): `onDisconnect` has already moved the session on.
    //
    // Put ANY await, timer or deferral between these two statements and the
    // ordering inverts: `handlePromptError` runs first, takes its retryable
    // branch, emits its own raw banner, flushes the queued follow-up at the dead
    // client (#774), and the session-level #1020 banner becomes dead code. Do not
    // add one.
    //
    // The tradeoff this buys is accepted deliberately: because nothing waits for
    // the child's 'exit' event, a genuine fast crash whose exit is still a
    // millisecond away is reported as a transport close rather than a confirmed
    // exit. That is the correct direction. Reporting "no exit code or signal was
    // reported" is honest about what was observed; asserting "process exited" with
    // no code and no signal is the #1020 bug itself. The banner stops there and does
    // not claim the child is probably alive, because for a fast crash it is not.
    const error = new AgentDisconnectedError(reason, exitCode, signal ? String(signal) : null, {
      outputAlreadyEmitted: this.hasActivePrompt,
    });
    this.rejectPendingRequests(error);

    if (this.disconnectHandler) {
      this.disconnectHandler({
        reason,
        exitCode,
        signal: signal ? String(signal) : null,
        stderr: this.stderrBuffer,
        unexpectedDuringPrompt,
      });
    }
  }

  // ─── Internals: Startup failure watcher ────────────────────

  private createStartupFailureWatcher(child: ChildProcess): { promise: Promise<never>; dispose: () => void } {
    let rejectFn: ((err: Error) => void) | null = null;
    let disposed = false;

    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      if (disposed) return;
      rejectFn?.(new AgentStartupError(this.options.backend, code, signal ? String(signal) : null, this.stderrBuffer));
    };

    const onError = (err: Error) => {
      if (disposed) return;
      rejectFn?.(new AgentSpawnError(this.options.backend, err));
    };

    child.on('exit', onExit);
    child.on('error', onError);

    const promise = new Promise<never>((_resolve, reject) => {
      rejectFn = reject;
    });

    // A bridge that crashes on import - the signature of an install missing a
    // declared dependency - can be dead before any of the listeners above (or
    // in attachLifecycleObservers) attach. Their 'exit' never fires again, so
    // start() waits forever: the backend hangs rather than failing, and nothing
    // downstream ever gets the chance to clear the bad install and retry.
    // Replay the exit we already missed. 'close' lands once the stdio streams
    // have flushed, so the stderr summary is complete by then; the timer is the
    // backstop for when 'close' has been and gone too. Both paths are safe to
    // run twice - recordAgentExit is first-write-wins and a settled promise
    // ignores further rejections.
    let replayTimer: NodeJS.Timeout | null = null;
    const replayMissedExit = () => {
      this.recordAgentExit('process_exit', child.exitCode, child.signalCode);
      onExit(child.exitCode, child.signalCode as NodeJS.Signals | null);
    };
    const alreadyExited = child.exitCode !== null || child.signalCode !== null;
    if (alreadyExited) {
      child.once('close', replayMissedExit);
      replayTimer = setTimeout(replayMissedExit, MISSED_EXIT_REPLAY_MS);
      replayTimer.unref?.();
    }

    const dispose = () => {
      disposed = true;
      child.off('exit', onExit);
      child.off('error', onError);
      if (alreadyExited) child.off('close', replayMissedExit);
      if (replayTimer) clearTimeout(replayTimer);
    };

    return { promise, dispose };
  }

  /**
   * When SDK throws "ACP connection closed" during init, convert to
   * AgentStartupError with stderr + exit code. Waits briefly for the
   * exit event to arrive (handles the race between stream close and exit).
   *
   * An AgentDisconnectedError is converted for the same reason. Whichever of
   * the four lifecycle signals lands first decides the error type, and when the
   * SDK connection aborts ahead of the exit event the failure surfaces as a bare
   * `Agent disconnected (connection_close, code: null)` with the captured stderr
   * thrown away. That is the message the owner was shown for a bridge whose
   * install was missing a dependency: it names nothing, and every downstream
   * check that reads the stderr (the broken-install detection and the guidance
   * rewrite) is starved. A disconnect during initialize IS a startup failure, so
   * report it as one and keep the stderr attached.
   */
  private async normalizeInitializeError(error: unknown, child: ChildProcess): Promise<unknown> {
    if (error instanceof AgentStartupError || error instanceof AgentSpawnError) return error;

    const isConnectionClosed =
      error instanceof AgentDisconnectedError ||
      (error instanceof Error && /acp connection closed/i.test(error.message));
    if (!isConnectionClosed) return error;

    // Brief wait for exit event to capture exit code
    await waitForExit(child, 200);

    return new AgentStartupError(
      this.options.backend,
      child.exitCode ?? null,
      child.signalCode ? String(child.signalCode) : null,
      this.stderrBuffer,
      error
    );
  }

  // ─── Internals: bunx cache cleanup (from old prepareRetry) ─

  /**
   * Inspect the captured startup stderr for known bun cache-corruption
   * signatures and clear the stale state so the existing retry re-resolves
   * cleanly. Both signatures are best-effort and idempotent; failures are
   * swallowed so this can never throw into the spawn/retry path.
   *
   * Handled signatures:
   *   1. "Cannot find package|module" - bunx working dir is missing a
   *      transitive dependency. Remove the specific bunx-<uid>-<pkg> dir.
   *   2. "Failed to link <pkg>: EEXIST" - a package version bump left a
   *      half-linked entry in the install cache. The next spawn re-crashes
   *      on the same stale state forever. Remove the scoped cache entry for
   *      that package so the retry re-resolves and re-saves the lockfile.
   *
   * @returns true when something was actually removed, so the caller can tell a
   *          real recovery from a no-op instead of retrying a doomed spawn.
   */
  clearBunxCacheIfNeeded(): boolean {
    const clearedMissing = this.clearMissingPackageBunxCache();
    const clearedLink = this.clearLinkCorruptedBunCacheEntry();
    return clearedMissing || clearedLink;
  }

  /**
   * Returns the bun cache/tmp roots that cleanup is allowed to delete inside.
   * Validating the extracted path against these prevents a malicious agent
   * from crafting stderr that points cleanup at an arbitrary filesystem path.
   * Bun respects BUN_TMPDIR and BUN_INSTALL_CACHE_DIR for cache location.
   */
  private bunCleanupAllowedRoots(): string[] {
    return [
      process.env.BUN_TMPDIR || os.tmpdir(),
      process.env.BUN_INSTALL_CACHE_DIR || path.join(os.homedir(), '.bun', 'install', 'cache'),
      path.join(os.homedir(), '.bun'),
    ].map(resolveRealPath);
  }

  private isInsideBunCleanupRoot(target: string): boolean {
    return this.bunCleanupAllowedRoots().some((root) => target.startsWith(root + path.sep));
  }

  /** True when `target` is itself an allowed root, or lives inside one. */
  private isBunCleanupRootOrInside(target: string): boolean {
    const roots = this.bunCleanupAllowedRoots();
    return roots.some((root) => target === root) || this.isInsideBunCleanupRoot(target);
  }

  /**
   * Signature 1: bunx working dir missing a transitive dependency. The full
   * path to the missing module appears in stderr; remove the versioned bunx
   * working dir so the next `bun x` does a fresh install.
   */
  private clearMissingPackageBunxCache(): boolean {
    if (!/Cannot find (?:package|module)/i.test(this.stderrBuffer)) return false;

    const match = this.stderrBuffer.match(/([^\s'"]*[/\\]bunx-\d+[^\s/\\]*[/\\][^\s/\\]+@[^\s/\\]+)[/\\]node_modules/);
    if (!match) return false;

    const cacheDir = resolveRealPath(match[1]);
    if (!this.isInsideBunCleanupRoot(cacheDir)) {
      console.warn(`[AcpClient ${this.options.backend}] Refusing to clear suspicious cache path: ${cacheDir}`);
      return false;
    }

    console.log(`[AcpClient ${this.options.backend}] Clearing corrupted bunx cache: ${cacheDir}`);
    try {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      return true;
    } catch {
      /* best effort */
      return false;
    }
  }

  /**
   * Signature 2: "Failed to link <pkg>: EEXIST". A package version bump left
   * a half-linked entry in the install cache; every retry re-crashes on it.
   * Remove only that package's stale cache entries (and any bunx working dir
   * referencing it) so the retry re-resolves cleanly - this mirrors what
   * manually re-running `bun x --bun <pkg> --version` does to heal it.
   */
  private clearLinkCorruptedBunCacheEntry(): boolean {
    if (!/Failed to link\b/i.test(this.stderrBuffer) || !/EEXIST/i.test(this.stderrBuffer)) return false;

    const match = this.stderrBuffer.match(/Failed to link\s+(@?[\w.-]+(?:\/[\w.-]+)?)\s*:/i);
    if (!match) return false;
    const pkg = match[1];

    const installCacheRoot = resolveRealPath(
      process.env.BUN_INSTALL_CACHE_DIR || path.join(os.homedir(), '.bun', 'install', 'cache')
    );

    let cleared = false;

    // Install-cache entry. Scoped pkg "@scope/name" -> "<cache>/@scope/name*";
    // unscoped "name" -> "<cache>/name*". Bun stores versioned siblings like
    // "name@1.2.3@@@1[_patch_hash=...]", so match the dir name as a prefix.
    const slash = pkg.lastIndexOf('/');
    const entryParentDir = slash >= 0 ? path.join(installCacheRoot, pkg.slice(0, slash)) : installCacheRoot;
    const entryBaseName = slash >= 0 ? pkg.slice(slash + 1) : pkg;
    cleared = this.removeBunCacheChildrenByPrefix(entryParentDir, entryBaseName) || cleared;

    // Any leftover bunx working dir referencing the package (best-effort).
    const tmpRoot = resolveRealPath(process.env.BUN_TMPDIR || os.tmpdir());
    cleared = this.removeBunxWorkingDirsForPackage(tmpRoot, pkg) || cleared;

    if (cleared) {
      console.log(`[ACP] cleared stale bun link state for ${pkg} after EEXIST, retrying`);
    }
    return cleared;
  }

  /**
   * Remove cache children of `parentDir` whose name equals `baseName` or
   * starts with `baseName@` (the versioned/patched siblings). Guarded by the
   * cleanup-root allowlist and fully best-effort.
   */
  private removeBunCacheChildrenByPrefix(parentDir: string, baseName: string): boolean {
    const resolvedParent = resolveRealPath(parentDir);
    if (!this.isBunCleanupRootOrInside(resolvedParent)) return false;

    let removed = false;
    let entries: string[];
    try {
      entries = fs.readdirSync(resolvedParent);
    } catch {
      return false;
    }

    for (const name of entries) {
      if (name !== baseName && !name.startsWith(`${baseName}@`)) continue;
      const target = resolveRealPath(path.join(resolvedParent, name));
      if (!this.isInsideBunCleanupRoot(target)) continue;
      try {
        fs.rmSync(target, { recursive: true, force: true });
        removed = true;
      } catch {
        /* best effort */
      }
    }
    return removed;
  }

  /**
   * Remove any "bunx-<uid>-...<pkg>..." working dirs under `tmpRoot` that
   * reference the package, so a re-resolve does not collide with a stale dir.
   */
  private removeBunxWorkingDirsForPackage(tmpRoot: string, pkg: string): boolean {
    const resolvedRoot = resolveRealPath(tmpRoot);
    if (!this.isBunCleanupRootOrInside(resolvedRoot) && resolvedRoot !== resolveRealPath(os.tmpdir())) return false;

    const baseName = pkg.includes('/') ? pkg.slice(pkg.lastIndexOf('/') + 1) : pkg;
    let removed = false;
    let entries: string[];
    try {
      entries = fs.readdirSync(resolvedRoot);
    } catch {
      return false;
    }

    for (const name of entries) {
      if (!/^bunx-\d+/.test(name) || !name.includes(baseName)) continue;
      const target = resolveRealPath(path.join(resolvedRoot, name));
      try {
        fs.rmSync(target, { recursive: true, force: true });
        removed = true;
      } catch {
        /* best effort */
      }
    }
    return removed;
  }
}
