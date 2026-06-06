/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { parse, stringify } from 'smol-toml';
import type { TProviderWithModel } from '@/common/config/storage';
import { getEnhancedEnv } from '@process/utils/shellEnv';
import { resolveWCoreBinary } from './binaryResolver';
import { buildSpawnConfig } from './envBuilder';
import type { WCoreEvent, WCoreCommand, WCoreCapabilities } from './protocol';

const WCORE_PROJECT_CONFIG = '.wcore.toml';

type StreamEventHandler = (event: { type: string; data: unknown; msg_id: string }) => void;

/**
 * Sanitize an existing `.wcore.toml` body and merge in the app's own provider
 * config, returning the serialized result plus whether an attacker-owned
 * `providers` table was present and dropped.
 *
 * Provider tables are app-owned: they hold `base_url`/endpoint keys that decide
 * where credentials and prompts are sent. A pre-placed or sibling-written config
 * must never inject or keep a provider override the app did not author, or an
 * attacker with workspace write access could redirect traffic to their own host
 * (RT-B6-07).
 *
 * We parse with a real TOML library rather than scanning lines, because TOML
 * exposes the same `providers` table through many equivalent syntaxes -
 * bracket header `[providers.openai]`, inline table
 * `providers = { openai = { ... } }`, dotted key `providers.openai.base_url`,
 * spaced dotted `providers . openai . base_url`, quoted-key header
 * `["providers"]`, headers with trailing comments - and a string scan cannot
 * robustly catch them all. Parsing collapses every form into the single
 * top-level `providers` object key, so one `delete` strips every variant.
 *
 * The app's own provider fragment (`appContent`) is parsed and its `providers`
 * (plus any other app-owned top-level keys) merged over the sanitized user
 * object, so the app's values always win. Legitimate user-authored non-provider
 * settings (top-level keys, other tables) are preserved.
 *
 * Fails closed: if the existing file is not valid TOML (malformed / attacker
 * garbage), the user content is discarded entirely and only the app's
 * known-good config is written. `parsed` is `false` in that case.
 */
function sanitizeProjectConfig(
  existing: string,
  appContent: string
): { written: string; strippedProviders: boolean; parsed: boolean } {
  const appObject = parse(appContent) as Record<string, unknown>;

  let userObject: Record<string, unknown>;
  try {
    userObject = parse(existing) as Record<string, unknown>;
  } catch {
    // Fail closed: unparseable user content is untrusted - write only the
    // app's known-good config.
    return { written: `${stringify(appObject).trim()}\n`, strippedProviders: false, parsed: false };
  }

  // Every TOML form of an attacker `providers` override collapses to this one
  // top-level key after parsing, so a single delete catches all variants.
  const strippedProviders = Object.prototype.hasOwnProperty.call(userObject, 'providers');
  delete userObject.providers;

  // App-owned keys (including `providers`) win over anything user-authored.
  const merged = { ...userObject, ...appObject };
  return { written: `${stringify(merged).trim()}\n`, strippedProviders, parsed: true };
}

/**
 * A stdio-transport MCP server to inject into the wcore session. Each entry
 * is forwarded verbatim as an `add_mcp_server` command. `awaitReady` flags
 * that the server performs a ready handshake (e.g. team coordination MCP
 * waits for TEAM_AGENT_SLOT_ID registration); leave it false for fire-and-
 * forget servers like the team-guide bridge.
 */
export type StdioMcpOption = {
  name: string;
  command: string;
  args: string[];
  env: Array<{ name: string; value: string }>;
  awaitReady?: boolean;
};

export type WCoreAgentOptions = {
  workspace: string;
  model: TProviderWithModel;
  proxy?: string;
  yoloMode?: boolean;
  presetRules?: string;
  maxTokens?: number;
  maxTurns?: number;
  sessionId?: string;
  resume?: string;
  /**
   * Stdio MCP servers to register with the wcore session after start.
   * Caller decides which MCPs belong here (team coordination, team-guide,
   * future project MCPs, etc.) - WCoreAgent just forwards them.
   */
  stdioMcpServers?: StdioMcpOption[];
  onStreamEvent: StreamEventHandler;
  onProcessExit?: (code: number | null, activeMsgId: string) => void;
  onPong?: () => void;
};

export class WCoreAgent {
  private childProcess: ChildProcess | null = null;
  private ready = false;
  private readyPromise: Promise<void>;
  private readyResolve!: () => void;
  private readyReject!: (err: Error) => void;
  private onStreamEvent: StreamEventHandler;
  private _onProcessExit: WCoreAgentOptions['onProcessExit'];
  private _onPong: WCoreAgentOptions['onPong'];
  private options: WCoreAgentOptions;
  private activeMsgId: string | null = null;
  private configBackup: { path: string; content: string | null; written: string | null } | null = null;
  private mcpReadyPromise: Promise<void>;
  private mcpReadyResolve!: () => void;
  public sessionId?: string;
  public capabilities?: WCoreCapabilities;
  /**
   * The `--max-tokens` value actually passed to wcore, after applying the
   * reasoning-model default fallback in `buildSpawnConfig`. `undefined` when
   * no `--max-tokens` arg was added. Set during `start()`; `WCoreManager`
   * mirrors this into `data.data.maxTokens` so the truncation heuristic
   * compares `output_tokens` against the real budget rather than `undefined`.
   */
  public resolvedMaxTokens?: number;

  constructor(options: WCoreAgentOptions) {
    this.options = options;
    this.onStreamEvent = options.onStreamEvent;
    this._onProcessExit = options.onProcessExit;
    this._onPong = options.onPong;
    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    this.mcpReadyPromise = new Promise((resolve) => {
      this.mcpReadyResolve = resolve;
    });
  }

  get bootstrap(): Promise<void> {
    return this.readyPromise;
  }

  async start(): Promise<void> {
    const binaryPath = resolveWCoreBinary();
    if (!binaryPath) {
      throw new Error('wcore binary not found');
    }

    const { args, env, projectConfig, resolvedMaxTokens } = buildSpawnConfig(this.options.model, {
      workspace: this.options.workspace,
      maxTokens: this.options.maxTokens,
      maxTurns: this.options.maxTurns,
      autoApprove: this.options.yoloMode,
      sessionId: this.options.sessionId,
      resume: this.options.resume,
    });
    this.resolvedMaxTokens = resolvedMaxTokens;

    // Write temporary .wcore.toml for provider compat overrides
    if (projectConfig) {
      this.writeProjectConfig(projectConfig);
    }

    this.childProcess = spawn(binaryPath, args, {
      env: getEnhancedEnv(env),
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: this.options.workspace,
    });

    // Parse stdout JSON Lines
    const rl = createInterface({ input: this.childProcess.stdout! });
    rl.on('line', (line) => {
      try {
        const event = JSON.parse(line) as WCoreEvent;
        this.handleEvent(event);
      } catch {
        console.error('[WCoreAgent] Failed to parse event:', line);
      }
    });

    // Log stderr as diagnostics
    this.childProcess.stderr?.on('data', (chunk: Buffer) => {
      console.error('[wcore]', chunk.toString());
    });

    // Handle process exit
    this.childProcess.on('exit', (code) => {
      this.restoreProjectConfig();
      if (!this.ready) {
        this.readyReject(new Error(`wcore exited with code ${code} during init`));
      }
      if (this.activeMsgId && this._onProcessExit) {
        this._onProcessExit(code, this.activeMsgId);
      }
      this.activeMsgId = null;
      this.childProcess = null;
    });

    // Wait for ready event with timeout
    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('wcore ready timeout (30s)')), 30000);
    });

    try {
      await Promise.race([this.readyPromise, timeout]);
    } catch (err) {
      // If resume failed (session not found), fallback to a new session
      if (this.options.resume) {
        console.error('[WCoreAgent] Resume failed, falling back to new session:', err);
        this.options = { ...this.options, resume: undefined, sessionId: this.options.resume };
        this.ready = false;
        this.readyPromise = new Promise((resolve, reject) => {
          this.readyResolve = resolve;
          this.readyReject = reject;
        });
        return this.start();
      }
      throw err;
    }

    // Inject stdio MCP servers (must happen before first message). Each entry
    // is forwarded as `add_mcp_server`; if any entry has `awaitReady: true`,
    // wait on the handshake before continuing.
    const stdioMcpServers = this.options.stdioMcpServers ?? [];
    let awaitAnyReady = false;
    for (const server of stdioMcpServers) {
      const envRecord: Record<string, string> = {};
      for (const { name: k, value: v } of server.env) {
        envRecord[k] = v;
      }
      this.sendCommand({
        type: 'add_mcp_server',
        name: server.name,
        transport: 'stdio',
        command: server.command,
        args: server.args,
        env: envRecord,
      });
      if (server.awaitReady) awaitAnyReady = true;
    }

    if (awaitAnyReady) {
      await Promise.race([
        this.mcpReadyPromise,
        new Promise<void>((_resolve, reject) => setTimeout(() => reject(new Error('MCP ready timeout (30s)')), 30000)),
      ]).catch((err) => {
        console.warn('[WCoreAgent] MCP setup warning:', err);
      });
    }

    // Inject preset rules as history context (skip on resume - rules were already injected)
    if (this.options.presetRules && !this.options.resume) {
      this.sendCommand({
        type: 'init_history',
        text: `[Assistant System Rules]\n${this.options.presetRules}`,
      });
    }
  }

  private handleEvent(event: WCoreEvent): void {
    switch (event.type) {
      case 'ready':
        this.ready = true;
        this.sessionId = event.session_id;
        this.capabilities = event.capabilities;
        this.readyResolve();
        break;

      case 'stream_start':
        this.activeMsgId = event.msg_id;
        this.onStreamEvent({ type: 'start', data: '', msg_id: event.msg_id });
        break;

      case 'text_delta':
        this.onStreamEvent({ type: 'content', data: event.text, msg_id: event.msg_id });
        break;

      case 'thinking':
        this.onStreamEvent({ type: 'thought', data: event.text, msg_id: event.msg_id });
        break;

      case 'tool_request':
        this.onStreamEvent({
          type: 'tool_group',
          data: [
            {
              callId: event.call_id,
              name: event.tool.name,
              description: event.tool.description,
              status: 'Confirming',
              renderOutputAsMarkdown: false,
              confirmationDetails: this.mapConfirmationDetails(event),
            },
          ],
          msg_id: event.msg_id,
        });
        break;

      case 'tool_running':
        this.onStreamEvent({
          type: 'tool_group',
          data: [
            {
              callId: event.call_id,
              name: event.tool_name,
              description: '',
              status: 'Executing',
              renderOutputAsMarkdown: false,
            },
          ],
          msg_id: event.msg_id,
        });
        break;

      case 'tool_result':
        this.onStreamEvent({
          type: 'tool_group',
          data: [
            {
              callId: event.call_id,
              name: event.tool_name,
              description: '',
              status: event.status === 'success' ? 'Success' : 'Error',
              resultDisplay:
                event.output_type === 'diff'
                  ? { fileDiff: event.output, fileName: (event.metadata as Record<string, string>)?.file_path ?? '' }
                  : event.output,
              renderOutputAsMarkdown: event.output_type === 'text',
            },
          ],
          msg_id: event.msg_id,
        });
        break;

      case 'tool_cancelled':
        this.onStreamEvent({
          type: 'tool_group',
          data: [
            {
              callId: event.call_id,
              name: '',
              description: event.reason,
              status: 'Canceled',
              renderOutputAsMarkdown: false,
            },
          ],
          msg_id: event.msg_id,
        });
        break;

      case 'stream_end': {
        const finishPayload: Record<string, unknown> = {};
        if (event.usage) Object.assign(finishPayload, event.usage);
        if (event.finish_reason) finishPayload.finish_reason = event.finish_reason;
        const payload = Object.keys(finishPayload).length > 0 ? finishPayload : '';
        this.onStreamEvent({ type: 'finish', data: payload, msg_id: event.msg_id });
        this.activeMsgId = null;
        break;
      }

      case 'error':
        this.onStreamEvent({
          type: 'error',
          data: event.error.message,
          msg_id: event.msg_id ?? this.activeMsgId ?? '',
        });
        break;

      case 'info':
        this.onStreamEvent({
          type: 'info',
          data: event.message,
          msg_id: event.msg_id,
        });
        break;

      case 'config_changed':
        this.capabilities = event.capabilities;
        this.onStreamEvent({
          type: 'config_changed',
          data: event.capabilities,
          msg_id: '',
        });
        break;

      case 'mcp_ready':
        this.mcpReadyResolve();
        break;

      case 'pong':
        this._onPong?.();
        break;

      // ── W7 F4: streaming tool-result chunk ─────────────────────────
      // Forward as an `info`-channel update so the renderer can append
      // partial output to the in-flight tool card. Hosts that don't
      // surface tool_chunk yet still see the final `tool_result` carrying
      // the full buffered output.
      case 'tool_chunk':
        this.onStreamEvent({
          type: 'tool_chunk',
          data: { callId: event.call_id, toolName: event.tool_name, chunk: event.chunk },
          msg_id: event.msg_id,
        });
        break;

      // ── Safety-critical: browser policy denied ─────────────────────
      // Surface to the user as an error so the policy decision is visible.
      // Gated by `capabilities.browser_suite`; only the wayland-browser
      // plugin emits it.
      case 'browser_policy_denied':
        console.warn('[WCoreAgent] browser_policy_denied', { url: event.url, reason: event.reason });
        this.onStreamEvent({
          type: 'error',
          data: `Browser policy denied: ${event.reason} (${event.url})`,
          msg_id: event.msg_id,
        });
        break;

      // ── W8c.1 browser op event ────────────────────────────────────
      // Forward typed so the renderer can render a compact browser-op
      // trail; safe to drop if the renderer hasn't wired it.
      case 'browser_event':
        this.onStreamEvent({
          type: 'browser_event',
          data: { callId: event.call_id, op: event.op, url: event.url, summary: event.summary },
          msg_id: event.msg_id,
        });
        break;

      // ── Safety-critical: CUA policy denied ─────────────────────────
      // Mirrors browser_policy_denied for the computer-use surface.
      case 'cua_policy_denied':
        console.warn('[WCoreAgent] cua_policy_denied', {
          op: event.op,
          app: event.app,
          reason: event.reason,
        });
        this.onStreamEvent({
          type: 'error',
          data: `Computer-use policy denied: ${event.reason} (op=${event.op}${event.app ? `, app=${event.app}` : ''})`,
          msg_id: event.msg_id,
        });
        break;

      // ── W8c.2 CUA op event ────────────────────────────────────────
      case 'cua_event':
        this.onStreamEvent({
          type: 'cua_event',
          data: {
            callId: event.call_id,
            op: event.op,
            coords: event.coords,
            summary: event.summary,
          },
          msg_id: event.msg_id,
        });
        break;

      // ── Wave RB: tool panic recovery ──────────────────────────────
      // The engine has already converted the panic to a synthetic
      // ToolResult; this event lets us surface the panic as a distinct
      // diagnostic (vs. a normal `is_error: true` ToolResult).
      case 'tool_panicked':
        console.error('[WCoreAgent] tool_panicked', {
          tool: event.tool_name,
          callId: event.call_id,
          message: event.panic_message,
        });
        this.onStreamEvent({
          type: 'error',
          data: `Tool ${event.tool_name} panicked: ${event.panic_message}`,
          msg_id: event.msg_id,
        });
        break;

      // ── Wave RB: plugin registration failed ───────────────────────
      // Plugin still loaded - partial registration is allowed - but the
      // user should see why an expected tool/hook is missing.
      case 'plugin_registration_failed':
        console.error('[WCoreAgent] plugin_registration_failed', {
          plugin: event.plugin_name,
          surface: event.surface,
          kind: event.error_kind,
          message: event.message,
        });
        this.onStreamEvent({
          type: 'info',
          data: `Plugin "${event.plugin_name}" failed to register ${event.surface}: ${event.message}`,
          msg_id: '',
        });
        break;

      // ── W7 F8: provider circuit-breaker transition ─────────────────
      // Always emitted (no capability flag) - surface `open` state as a
      // user-visible info so users notice failover; log-only for
      // half_open / closed transitions.
      case 'provider_circuit_event':
        console.warn('[WCoreAgent] provider_circuit_event', {
          primary: event.primary,
          fallback: event.fallback,
          state: event.state,
          error: event.error,
        });
        if (event.state === 'open') {
          this.onStreamEvent({
            type: 'info',
            data: `Provider ${event.primary} circuit opened${
              event.fallback ? ` - falling back to ${event.fallback}` : ''
            }${event.error ? `: ${event.error}` : ''}`,
            msg_id: this.activeMsgId ?? '',
          });
        }
        break;

      // ── W8a A.7: ExecutionBudget cap exceeded ─────────────────────
      // Always emitted (no capability flag); surface as user-visible
      // info so the user knows why the session stopped.
      case 'budget_exceeded':
        console.warn('[WCoreAgent] budget_exceeded', {
          reason: event.reason,
          observed: event.observed,
          limit: event.limit,
        });
        this.onStreamEvent({
          type: 'info',
          data: `Budget exceeded: ${event.reason} (observed ${event.observed}, limit ${event.limit})`,
          msg_id: this.activeMsgId ?? '',
        });
        break;

      // ── W7 S4: HITL approval flow ─────────────────────────────────
      // Forward typed so a future renderer can render an approval modal.
      // For now log + surface as info.
      case 'approval_required':
        console.warn('[WCoreAgent] approval_required', {
          callId: event.call_id,
          reason: event.reason,
        });
        this.onStreamEvent({
          type: 'approval_required',
          data: {
            callId: event.call_id,
            resumeToken: event.resume_token,
            correlationId: event.correlation_id,
            reason: event.reason,
            context: event.context,
          },
          msg_id: this.activeMsgId ?? '',
        });
        break;

      case 'suspend':
        this.onStreamEvent({
          type: 'suspend',
          data: { reason: event.reason, resumeToken: event.resume_token },
          msg_id: this.activeMsgId ?? '',
        });
        break;

      case 'approval_resume':
        this.onStreamEvent({
          type: 'approval_resume',
          data: { resumeToken: event.resume_token, approved: event.approved },
          msg_id: this.activeMsgId ?? '',
        });
        break;

      // ── W1 F9: structured turn trace ──────────────────────────────
      // Opaque payload; forward typed so a future trace UI can opt in.
      case 'trace_event':
        this.onStreamEvent({
          type: 'trace_event',
          data: event.trace,
          msg_id: event.msg_id,
        });
        break;

      // ── W6 F7: end-of-session cost aggregate ──────────────────────
      case 'session_cost':
        this.onStreamEvent({
          type: 'session_cost',
          data: {
            sessionId: event.session_id,
            totalCostUsd: event.total_cost_usd,
            perTurn: event.per_turn,
          },
          msg_id: '',
        });
        break;

      // ── W7 F2: sub-agent event (inner payload is opaque) ──────────
      case 'sub_agent_event':
        this.onStreamEvent({
          type: 'sub_agent_event',
          data: {
            parentCallId: event.parent_call_id,
            agentName: event.agent_name,
            inner: event.inner,
          },
          msg_id: '',
        });
        break;

      // ── W8a H.1: plugin-emitted event ─────────────────────────────
      case 'plugin_event':
        this.onStreamEvent({
          type: 'plugin_event',
          data: {
            pluginName: event.plugin_name,
            eventType: event.event_type,
            payload: event.payload,
          },
          msg_id: '',
        });
        break;

      // ── W10B F12: GEPA evolution event ────────────────────────────
      case 'evolution_event':
        this.onStreamEvent({
          type: 'evolution_event',
          data: {
            runId: event.run_id,
            generation: event.generation,
            parentId: event.parent_id,
            childId: event.child_id,
            mutationKind: event.mutation_kind,
            score: event.score,
            retained: event.retained,
          },
          msg_id: '',
        });
        break;

      // ── Forward-compat default arm ────────────────────────────────
      // The W0 Host Decoder Contract (docs/json-stream-protocol.md
      // §"Host Decoder Contract") says hosts MUST drop unknown event
      // types silently. We deliberately log at warn level instead: any
      // line reaching this arm is a variant the engine emits but this
      // host hasn't enumerated, which is the exact failure mode this
      // file exists to prevent (safety-critical events like
      // `browser_policy_denied` were being silently dropped for an
      // entire engine release). The warn is observability, not
      // user-facing - ops sees the gap before users do. The cast keeps
      // TypeScript's exhaustiveness check honest (every variant in
      // WCoreEvent is handled above; this branch only fires at runtime
      // when the engine ships a new variant before this host learns it).
      default: {
        const unknownEvent = event as { type?: unknown };
        const typeStr = typeof unknownEvent.type === 'string' ? unknownEvent.type : '<non-string>';
        console.warn(`[WCoreAgent] unknown event type "${typeStr}" - dropping`, event);
        break;
      }
    }
  }

  /**
   * Map wcore tool_request to wayland confirmation details format.
   */
  private mapConfirmationDetails(event: WCoreEvent & { type: 'tool_request' }) {
    const { tool } = event;

    switch (tool.category) {
      case 'edit':
        return {
          type: 'edit' as const,
          title: tool.description,
          fileName: (tool.args as Record<string, string>).file_path ?? '',
          fileDiff: '',
        };
      case 'exec':
        return {
          type: 'exec' as const,
          title: tool.description,
          rootCommand: (tool.args as Record<string, string>).command?.split(' ')[0] ?? tool.name,
          command: (tool.args as Record<string, string>).command ?? JSON.stringify(tool.args),
        };
      case 'mcp':
        return {
          type: 'mcp' as const,
          title: tool.description,
          toolName: tool.name,
          toolDisplayName: tool.name,
          serverName: '',
        };
      case 'info':
      default:
        return {
          type: 'info' as const,
          title: tool.description,
          prompt: JSON.stringify(tool.args, null, 2),
        };
    }
  }

  sendCommand(cmd: WCoreCommand): void {
    if (!this.childProcess?.stdin?.writable) return;
    this.childProcess.stdin.write(JSON.stringify(cmd) + '\n');
  }

  async send(content: string, msgId: string, files?: string[]): Promise<void> {
    await this.readyPromise;
    this.sendCommand({
      type: 'message',
      msg_id: msgId,
      content,
      files,
    });
  }

  injectConversationHistory(text: string): Promise<void> {
    this.sendCommand({ type: 'init_history', text });
    return Promise.resolve();
  }

  stop(): void {
    this.sendCommand({ type: 'stop' });
  }

  approveTool(callId: string, scope: 'once' | 'always' = 'once'): void {
    this.sendCommand({ type: 'tool_approve', call_id: callId, scope });
  }

  denyTool(callId: string, reason = ''): void {
    this.sendCommand({ type: 'tool_deny', call_id: callId, reason });
  }

  setConfig(config: { model?: string; thinking?: string; thinking_budget?: number; effort?: string }): void {
    this.sendCommand({ type: 'set_config', ...config });
  }

  setMode(mode: 'default' | 'auto_edit' | 'yolo'): void {
    this.sendCommand({ type: 'set_mode', mode });
  }

  ping(): void {
    this.sendCommand({ type: 'ping' });
  }

  get isAlive(): boolean {
    return this.childProcess !== null;
  }

  kill(): void {
    this.restoreProjectConfig();
    if (this.childProcess) {
      this.childProcess.kill('SIGTERM');
      this.childProcess = null;
    }
  }

  /**
   * Write a temporary .wcore.toml in the workspace for provider compat overrides.
   * Backs up existing file content so it can be restored on exit.
   *
   * Security (RT-B6-07): the app owns every `[providers.*]` section because those
   * carry `base_url`/endpoint overrides that decide where API keys and prompts are
   * sent. A pre-placed or sibling-written `.wcore.toml` must never be allowed to
   * inject or keep a provider override the app did not author - otherwise an
   * attacker with workspace write access (temp-dir race or a custom workspace)
   * could redirect traffic to their own host. We therefore parse the existing
   * file with a real TOML library, drop ALL existing `providers.*` overrides
   * (in every equivalent TOML syntax), and regenerate them from the app's own
   * `content`, letting the app's intended values win. Non-provider, user-authored
   * settings are preserved. If the existing file is unparseable, we fail closed
   * and write only the app's known-good config.
   */
  private writeProjectConfig(content: string): void {
    const configPath = join(this.options.workspace, WCORE_PROJECT_CONFIG);
    const existing = existsSync(configPath) ? readFileSync(configPath, 'utf-8') : null;

    let written: string;
    if (existing) {
      const { written: sanitized, strippedProviders, parsed } = sanitizeProjectConfig(existing, content);
      written = sanitized;
      if (!parsed) {
        console.warn(
          `[WCoreAgent] Existing ${WCORE_PROJECT_CONFIG} is not valid TOML; discarding it and writing only app-owned provider config.`
        );
      } else if (strippedProviders) {
        console.warn(
          `[WCoreAgent] Stripped untrusted [providers.*] override(s) from existing ${WCORE_PROJECT_CONFIG}; app-owned provider config wins.`
        );
      }
      writeFileSync(configPath, written, 'utf-8');
    } else {
      written = content;
      writeFileSync(configPath, written, 'utf-8');
    }

    // Track the exact bytes this agent left on disk so restore can detect
    // whether a sibling agent (same workspace, concurrent chat) has since
    // overwritten the file - see restoreProjectConfig for the TOCTOU guard.
    this.configBackup = { path: configPath, content: existing, written };
  }

  /**
   * Restore or remove the .wcore.toml written by writeProjectConfig.
   *
   * Multiple agents in the same workspace share one config path, so restore
   * is a read-modify-write race: the last writer wins and earlier agents must
   * not clobber it. We only act when the on-disk content still matches what
   * this agent wrote - otherwise a sibling agent owns the file and is
   * responsible for its own restore.
   */
  private restoreProjectConfig(): void {
    if (!this.configBackup) return;
    const { path, content, written } = this.configBackup;
    this.configBackup = null;

    try {
      const current = existsSync(path) ? readFileSync(path, 'utf-8') : null;
      // A sibling agent has rewritten the file since we wrote it; leave it
      // alone so we don't delete/clobber config another live agent depends on.
      if (current !== written) {
        return;
      }
      if (content === null) {
        unlinkSync(path);
      } else {
        writeFileSync(path, content, 'utf-8');
      }
    } catch {
      // Best-effort cleanup; file may already be removed
    }
  }
}
