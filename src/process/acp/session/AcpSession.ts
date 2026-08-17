import type {
  RequestPermissionRequest,
  RequestPermissionResponse,
  SessionNotification,
  UsageUpdate,
} from '@agentclientprotocol/sdk';
import * as path from 'node:path';
import { resolveAcpSessionModeId } from '@/common/types/agentModes';
import { AcpError } from '@process/acp/errors/AcpError';
import { buildAcpAdapterCorruptionGuidance, buildAcpSetupGuidance } from '@process/acp/errors/setupFailure';
import type { ClientFactory, DisconnectInfo } from '@process/acp/infra/IAcpClient';
import { noopMetrics, type AcpMetrics } from '@process/acp/metrics/AcpMetrics';
import { ConfigTracker } from '@process/acp/session/ConfigTracker';
import { CRASH_MARKER_PROCESS_EXIT, CRASH_MARKER_TRANSPORT_CLOSE } from '@process/acp/session/crashMarkers';
import { stripAnsi } from '@process/agent/wcore/stderrLog';
import { redactSecrets } from '@process/utils/secretRedaction';
import { InputPreprocessor } from '@process/acp/session/InputPreprocessor';
import { MessageTranslator } from '@process/acp/session/MessageTranslator';
import { PermissionResolver } from '@process/acp/session/PermissionResolver';
import { loadWorkspaceApprovals, saveWorkspaceApproval } from '@process/acp/session/ApprovalPersistence';
import { PromptExecutor } from '@process/acp/session/PromptExecutor';
import { SessionLifecycle } from '@process/acp/session/SessionLifecycle';
import type {
  AgentConfig,
  InitialDesiredConfig,
  ProtocolHandlers,
  SessionCallbacks,
  SessionStatus,
} from '@process/acp/types';
import * as fs from 'node:fs';

export type SessionOptions = {
  promptTimeoutMs?: number;
  maxStartRetries?: number;
  maxResumeRetries?: number;
  metrics?: AcpMetrics;
  approvalCacheMaxSize?: number;
  /** User selections made before session creation (e.g., from the Guid page). */
  initialDesired?: InitialDesiredConfig;
};

const VALID_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  idle: ['starting'],
  starting: ['active', 'starting', 'error', 'idle'],
  active: ['prompting', 'suspended', 'idle'],
  prompting: ['active', 'resuming', 'error', 'idle'],
  suspended: ['resuming', 'idle'],
  resuming: ['active', 'resuming', 'error', 'idle'],
  error: ['starting', 'idle'],
};

/**
 * Wrap all SessionCallbacks methods with try/catch to prevent callback
 * implementation bugs from disrupting AcpSession's internal state machine.
 */
function wrapCallbacks(raw: SessionCallbacks): SessionCallbacks {
  const wrapped = {} as Record<string, unknown>;
  for (const key of Object.keys(raw)) {
    const fn = raw[key as keyof SessionCallbacks];
    if (typeof fn !== 'function') {
      wrapped[key] = fn;
      continue;
    }
    wrapped[key] = (...args: unknown[]) => {
      try {
        const result = (fn as (...a: unknown[]) => unknown)(...args);
        if (result instanceof Promise) {
          return result.catch((err: unknown) => {
            console.error(`[AcpSession:callback] ${key} rejected:`, err);
          });
        }
        return result;
      } catch (err) {
        console.error(`[AcpSession:callback] ${key} threw:`, err);
      }
    };
  }
  return wrapped as SessionCallbacks;
}

/**
 * Bound on the scrubbed stderr tail carried into the banner, mirroring
 * `WCORE_STDERR_TAIL_MAX`. `ProcessAcpClient` already caps its ring buffer at 8KB;
 * this trims again for a chat row.
 */
const DISCONNECT_STDERR_TAIL_MAX = 2048;

/**
 * Last {@link DISCONNECT_STDERR_TAIL_MAX} characters of the agent's stderr, ANSI
 * stripped and secret-scrubbed.
 *
 * Scrubbing is not optional: this is untrusted subprocess output on its way to the
 * chat transcript and the log file, and an agent bridge prints to stderr exactly
 * when credentials are in play. Routed through the shared scrubber (#984) rather
 * than any local pattern list.
 */
function buildStderrTail(stderr: string): string | null {
  const cleaned = redactSecrets(stripAnsi(stderr)).trim();
  if (!cleaned) return null;
  return cleaned.length > DISCONNECT_STDERR_TAIL_MAX ? cleaned.slice(-DISCONNECT_STDERR_TAIL_MAX) : cleaned;
}

/**
 * Describe a disconnect WITHOUT asserting anything that was not observed (#1020).
 *
 * The old single line claimed `process exited unexpectedly (code: unknown, signal:
 * none)` whenever both fields were null - which is precisely the case where no
 * process exit was observed at all. A customer on the Claude Code backend was shown
 * that for a transport drop, asked what it meant, and got a confabulated answer
 * about the process dying, because the message named the only two facts that were
 * not known and discarded the two that were: `reason` and the stderr buffer.
 *
 * So: claim an exit only when a code or a signal is present, name the reason either
 * way, and carry a scrubbed stderr tail so the real cause is recoverable.
 *
 * Deliberately NOT routed through i18n - this matches the surrounding diagnostics
 * (`AgentDisconnectedError`, `AgentStartupError`, `enterError`), which are all raw
 * English strings, and the reason/stderr payload is untranslatable anyway.
 */
export function buildCrashMessage(info?: DisconnectInfo): string | null {
  if (!info) return null;

  const exitObserved = info.exitCode !== null || info.signal !== null;
  const lines: string[] = [
    exitObserved
      ? `${CRASH_MARKER_PROCESS_EXIT} (code: ${info.exitCode ?? 'unknown'}, signal: ${info.signal ?? 'none'}) [reason: ${info.reason}]`
      : `${CRASH_MARKER_TRANSPORT_CLOSE} [reason: ${info.reason}]. No exit code or signal was reported, so the agent process may still be running - this is a transport-level disconnect, not a confirmed crash.`,
  ];

  if (info.unexpectedDuringPrompt) {
    lines.push('The message that was in flight did not complete and was not resent automatically - send it again.');
  }

  const tail = buildStderrTail(info.stderr);
  if (tail) lines.push(`Agent stderr:\n${tail}`);

  return lines.join('\n');
}

export class AcpSession {
  private _status: SessionStatus = 'idle';

  // components (exposed as readonly for host interfaces)
  readonly configTracker: ConfigTracker;
  readonly messageTranslator: MessageTranslator;
  readonly callbacks: SessionCallbacks;
  readonly metrics: AcpMetrics;

  private readonly permissionResolver: PermissionResolver;
  private readonly inputPreprocessor: InputPreprocessor;
  private readonly lifecycle: SessionLifecycle;
  private readonly promptExecutor: PromptExecutor;

  constructor(
    private readonly agentConfig: AgentConfig,
    clientFactory: ClientFactory,
    callbacks: SessionCallbacks,
    options?: SessionOptions
  ) {
    this.metrics = options?.metrics ?? noopMetrics;
    this.callbacks = wrapCallbacks(callbacks);

    this.configTracker = new ConfigTracker(options?.initialDesired);
    this.messageTranslator = new MessageTranslator(agentConfig.agentId);
    this.inputPreprocessor = new InputPreprocessor((path) => fs.readFileSync(path, 'utf-8'));
    this.permissionResolver = new PermissionResolver({
      autoApproveAll: agentConfig.yoloMode ?? false,
      cacheMaxSize: options?.approvalCacheMaxSize,
      // #672: persist "allow always" grants per workspace (cwd) so they survive
      // an app restart instead of re-prompting. hydrate loads them lazily on the
      // first permission check; persist write-throughs new grants.
      hydrate: () => loadWorkspaceApprovals(agentConfig.cwd),
      persist: (cacheKey, optionId) => {
        void saveWorkspaceApproval(agentConfig.cwd, cacheKey, optionId);
      },
    });

    this.lifecycle = new SessionLifecycle(
      {
        agentConfig: agentConfig,
        configTracker: this.configTracker,
        messageTranslator: this.messageTranslator,
        callbacks: this.callbacks,
        metrics: this.metrics,
        setStatus: (s) => this.setStatus(s),
        enterError: (msg) => this.enterError(msg),
        flushPendingPrompt: () => this.promptExecutor.flush(),
        buildProtocolHandlers: () => this.buildProtocolHandlers(),
        onDisconnect: (info?: DisconnectInfo) => this.onDisconnect(info),
      },
      clientFactory,
      {
        maxStartRetries: options?.maxStartRetries ?? 3,
        maxResumeRetries: options?.maxResumeRetries ?? 2,
      }
    );

    // `self` captured by the getter closure below - must be assigned before PromptExecutor construction.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.promptExecutor = new PromptExecutor(
      {
        get status() {
          return self.status;
        },
        lifecycle: this.lifecycle,
        messageTranslator: this.messageTranslator,
        authNegotiator: this.lifecycle.authNegotiator,
        callbacks: this.callbacks,
        metrics: this.metrics,
        agentConfig: agentConfig,
        setStatus: (s) => this.setStatus(s),
        enterError: (msg) => this.enterError(msg),
      },
      options?.promptTimeoutMs ?? 300_000
    );
  }

  // ─── State machine ────────────────────────────────────────────

  get status(): SessionStatus {
    return this._status;
  }

  get sessionId(): string | null {
    return this.lifecycle.sessionId;
  }

  setStatus(newStatus: SessionStatus): void {
    const allowed = VALID_TRANSITIONS[this._status];
    if (!allowed.includes(newStatus)) {
      console.warn(`[AcpSession] Invalid status transition: ${this._status} → ${newStatus}`);
      return;
    }
    this._status = newStatus;
    this.callbacks.onStatusChange(newStatus);
  }

  // ─── Public API ───────────────────────────────────────────────

  start(): void {
    if (this._status !== 'idle' && this._status !== 'error') return;
    console.log(`[AcpSession] Starting session with backend ${this.agentConfig.agentBackend}`);
    this.lifecycle.start();
  }

  async stop(): Promise<void> {
    this.promptExecutor.stopTimer();
    this.permissionResolver.rejectAll(new Error('Session stopped'));
    this.promptExecutor.clearPending();
    this.lifecycle.clearAuthPending();
    await this.lifecycle.teardown();
    this.setStatus('idle');
  }

  async suspend(): Promise<void> {
    if (this._status !== 'active') return;
    await this.lifecycle.teardown();
    this.setStatus('suspended');
  }

  retryAuth(credentials?: Record<string, string>): void {
    this.lifecycle.retryAuth(credentials);
  }

  async sendMessage(text: string, files?: string[]): Promise<void> {
    const content = this.inputPreprocessor.process(text, files);
    switch (this._status) {
      case 'active':
        await this.promptExecutor.execute(content);
        return;
      case 'suspended':
        this.promptExecutor.setPending(content);
        this.lifecycle.resume();
        return;
      case 'prompting':
        // The agent is mid-turn. Queue the follow-up instead of rejecting it -
        // `PromptExecutor.execute` flushes the pending prompt the moment the
        // current turn finishes (status → active). This is what stops a fast
        // second message from hitting a "Cannot send in prompting state" error.
        this.promptExecutor.setPending(content);
        return;
      case 'starting':
      case 'resuming':
        // Session is spawning / reconnecting — queue the message so doStart /
        // doResume flush it automatically when the session reaches 'active'.
        this.promptExecutor.setPending(content);
        return;
      default:
        throw new AcpError('INVALID_STATE', `Cannot send in ${this._status} state`);
    }
  }

  cancelPrompt(): void {
    this.promptExecutor.stopTimer();
    this.permissionResolver.rejectAll(new Error('Prompt cancelled'));
    this.promptExecutor.cancel();
  }

  cancelAll(): void {
    this.promptExecutor.cancelAll();
  }

  setModel(modelId: string): void {
    this.configTracker.setDesiredModel(modelId);
    if (this._status === 'idle' || this._status === 'error') return;
    const { client, sessionId } = this.lifecycle;
    if (this._status === 'active' && client && sessionId) {
      client
        .setModel(sessionId, modelId)
        .then(() => this.configTracker.setCurrentModel(modelId))
        .then(() => this.callbacks.onModelUpdate(this.configTracker.modelSnapshot()))
        .catch((err) => console.warn('[AcpSession] setModel failed:', err));
    }
  }

  setMode(modeId: string): void {
    this.configTracker.setDesiredMode(modeId);
    if (this._status === 'idle' || this._status === 'error') return;
    const { client, sessionId } = this.lifecycle;
    if (this._status === 'active' && client && sessionId) {
      // Validate against the agent's advertised modes: backends like opencode
      // have no `default` agent (their primary is `build`), so an unadvertised
      // modeId is rejected with "Agent not found" and breaks the session (#298).
      const { availableModes, currentModeId } = this.configTracker.modeSnapshot();
      const resolved = resolveAcpSessionModeId(modeId, availableModes, currentModeId);
      client
        .setMode(sessionId, resolved)
        .then(() => this.configTracker.setCurrentMode(resolved))
        .then(() => this.callbacks.onModeUpdate(this.configTracker.modeSnapshot()))
        .catch((err) => console.warn('[AcpSession] setMode failed:', err));
    }
  }

  setConfigOption(id: string, value: string | boolean): void {
    this.configTracker.setDesiredConfigOption(id, value);
    const { client, sessionId } = this.lifecycle;
    if (this._status === 'active' && client && sessionId) {
      client
        .setConfigOption(sessionId, id, value)
        .then(() => this.configTracker.setCurrentConfigOption(id, value))
        .catch((err) => console.warn('[AcpSession] setConfigOption failed:', err));
    }
  }

  getConfigOptions() {
    return this.configTracker.configSnapshot().configOptions;
  }

  confirmPermission(callId: string, optionId: string): void {
    this.permissionResolver.resolve(callId, optionId);
  }

  // ─── Path validation ────────────────────────────────────────

  /**
   * Verify that an agent-requested file path is within the allowed directories
   * (cwd + additionalDirectories). Prevents path traversal attacks.
   */
  private assertPathAllowed(filePath: string): void {
    const resolved = path.resolve(filePath);
    const allowedRoots = [this.agentConfig.cwd, ...(this.agentConfig.additionalDirectories ?? [])];
    const withinAllowed = allowedRoots.some(
      (root) => resolved.startsWith(path.resolve(root) + path.sep) || resolved === path.resolve(root)
    );
    if (!withinAllowed) {
      throw new Error(`Path not allowed: ${filePath} is outside permitted directories`);
    }
  }

  // ─── Protocol handlers (glue) ─────────────────────────────────

  private buildProtocolHandlers(): ProtocolHandlers {
    return {
      onSessionUpdate: (notification) => this.handleMessage(notification),
      onRequestPermission: (request) => this.handlePermissionRequest(request),
      onReadTextFile: async (req) => {
        this.assertPathAllowed(req.path);
        try {
          const content = fs.readFileSync(req.path, 'utf-8');
          return { content };
        } catch {
          throw new Error(`File not found: ${req.path}`);
        }
      },
      onWriteTextFile: async (req) => {
        this.assertPathAllowed(req.path);
        // An irreversible side effect that never passes through handleMessage, so
        // it would otherwise leave `turnRanTool` false and let a retry replay the
        // turn and write the file a second time (#774).
        this.promptExecutor.noteToolActivity();
        try {
          fs.writeFileSync(req.path, req.content, 'utf-8');
          return {};
        } catch {
          throw new Error(`Write failed: ${req.path}`);
        }
      },
    };
  }

  private handleMessage(notification: SessionNotification): void {
    const update = notification.update;

    switch (update.sessionUpdate) {
      case 'current_mode_update':
        this.configTracker.setCurrentMode(update.currentModeId);
        this.callbacks.onModeUpdate(this.configTracker.modeSnapshot());
        return;

      case 'config_option_update':
        this.callbacks.onConfigUpdate(this.configTracker.configSnapshot());
        return;

      case 'available_commands_update': {
        const data = update as unknown as {
          availableCommands?: Array<{ name: string; description?: string; input?: { hint?: string } | null }>;
        };
        const commands = (data.availableCommands ?? []).map((cmd) => ({
          name: cmd.name,
          description: cmd.description,
          hint: cmd.input?.hint,
        }));
        this.configTracker.updateAvailableCommands(commands);
        this.callbacks.onConfigUpdate(this.configTracker.configSnapshot());
        return;
      }

      case 'usage_update': {
        const u = update as UsageUpdate & { sessionUpdate: 'usage_update' };
        this.callbacks.onContextUsage({
          used: u.used ?? 0,
          total: u.size ?? 0,
          percentage: u.size > 0 ? Math.round((u.used / u.size) * 100) : 0,
          cost: u.cost ? { amount: u.cost.amount, currency: u.cost.currency } : undefined,
        });
        return;
      }
    }

    this.promptExecutor.resetTimer();

    // A tool has run, so this turn is no longer safe to replay wholesale on a
    // transient error (#774) - re-sending the prompt could re-execute it.
    if (update.sessionUpdate === 'tool_call' || update.sessionUpdate === 'tool_call_update') {
      this.promptExecutor.noteToolActivity();
    }

    const messages = this.messageTranslator.translate(notification);
    for (const msg of messages) {
      this.callbacks.onMessage(msg);
    }
  }

  private async handlePermissionRequest(request: RequestPermissionRequest): Promise<RequestPermissionResponse> {
    // A permission request means a tool is about to run — enough to make replaying
    // this turn unsafe, even if its `tool_call` update never reaches us (#774).
    this.promptExecutor.noteToolActivity();
    this.promptExecutor.pauseTimer();
    try {
      return await this.permissionResolver.evaluate(request, (data) => {
        this.callbacks.onPermissionRequest(data);
      });
    } finally {
      this.promptExecutor.resumeTimer();
    }
  }

  // ─── Internal helpers ─────────────────────────────────────────

  private onDisconnect(info?: DisconnectInfo): void {
    switch (this._status) {
      case 'idle':
      case 'suspended':
      case 'error':
        return;

      case 'prompting': {
        // Surfaced, NOT silently recovered (#1020). `resumeFromDisconnect` below
        // respawns the agent and re-flushes the pending QUEUE, but the turn that
        // was in flight is gone: `flush()` shifted it off the queue before
        // `execute()`, and `handlePromptError` deliberately refuses to hand it
        // back on a dead stream, because a `tool_call` it had already run can be
        // lost with the pipe. So the user's turn genuinely did not land, and
        // staying quiet would leave them believing it did - which is how the
        // customer's approval disappeared. The banner now says so explicitly (via
        // `unexpectedDuringPrompt`) rather than asserting a process exit.
        //
        // Tradeoff accepted: a benign inactivity-shaped transport close that
        // happens to land mid-prompt still shows a banner, where the 'active'
        // branch below stays silent. That asymmetry is correct - in 'active'
        // nothing was lost, here a turn was.
        this.lifecycle.clearClient();
        this.emitCrashSignalIfProcessDied(info);
        this.promptExecutor.stopTimer();
        this.permissionResolver.rejectAll(new Error('Process disconnected'));
        this.lifecycle.resumeFromDisconnect();
        return;
      }

      case 'active': {
        // Process exited while idle (no prompt in flight).  This is a normal
        // lifecycle event - e.g. the agent bridge (codex-acp) may shut down
        // after an inactivity timeout.  Silently transition to "suspended" so
        // the next sendMessage triggers a fresh spawn.  Do NOT emit a crash
        // signal: the user would see a scary "process exited unexpectedly"
        // error even though the conversation completed normally.
        this.lifecycle.clearClient();
        this.setStatus('suspended');
        return;
      }

      default: {
        // starting / resuming - process died during bootstrap, treat as crash
        this.lifecycle.clearClient();
        this.emitCrashSignalIfProcessDied(info);
        this.setStatus('suspended');
      }
    }
  }

  /** Emit error signal with exit info so TeammateManager can detect agent crash. */
  private emitCrashSignalIfProcessDied(info?: DisconnectInfo): void {
    const msg = buildCrashMessage(info);
    if (!msg) return;
    this.callbacks.onSignal({ type: 'error', message: msg, recoverable: true });
  }

  enterError(message: string): void {
    // If the backend failed because it's installed but missing a runtime extra
    // (e.g. Hermes without the ACP adapter), or because a bunx-spawned adapter
    // install is corrupt (#676), rewrite the raw stderr into actionable guidance.
    // Otherwise pass the original message through unchanged.
    const displayMessage =
      buildAcpSetupGuidance(this.agentConfig.agentBackend, message) ??
      buildAcpAdapterCorruptionGuidance(this.agentConfig.agentBackend, message) ??
      message;
    this.promptExecutor.clearPending();
    this.permissionResolver.rejectAll(new Error(displayMessage));
    this.promptExecutor.stopTimer();
    // Emit the detailed error signal BEFORE flipping status to 'error'. A pending
    // start op is rejected on the status change, and the reject wants the real
    // reason (#483/#369): emitting the signal first lets AcpAgentV2 capture the
    // message so the rejection carries it instead of a generic "failed to start".
    this.callbacks.onSignal({ type: 'error', message: displayMessage, recoverable: false });
    this.setStatus('error');
  }
}
