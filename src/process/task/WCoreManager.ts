/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IMessageToolGroup, TMessage } from '@/common/chat/chatLib';
import { transformMessage } from '@/common/chat/chatLib';
import { buildResumeSeedTranscript } from '@process/task/resumeSeed';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { channelEventBus } from '@process/channels/agent/ChannelEventBus';
import { teamEventBus } from '@process/team/teamEventBus';
import type { IMcpServer, TProviderWithModel } from '@/common/config/storage';
import { buildWCoreUserStdioMcpServers } from '@process/agent/acp/mcpSessionConfig';
import { readWCoreConfigMcpServerNames } from '@process/agent/wcore/configMcpServers';
import { type OutputBudget, resolveFixedBudget } from '@/common/config/outputBudget';
import { ProcessConfig } from '@process/utils/initStorage';
import { BaseApprovalStore, type IApprovalKey } from '@/common/chat/approval';
import { ToolConfirmationOutcome } from '../agent/gemini/cli/tools/tools';
import { WCoreAgent, type StdioMcpOption } from '@process/agent/wcore';
import type { WCoreCapabilities } from '@process/agent/wcore/protocol';
import {
  buildSystemInstructionsWithSkillsIndex,
  buildTurnSkillContext,
  consumePendingSessionSkills,
  mergeLoadedSkillsExtra,
  resolveCapabilitiesManifest,
} from './agentUtils';
import { getDatabase } from '@process/services/database';
import { ProviderRepository } from '@process/providers/storage/ProviderRepository';
import { isProviderKeyAuthFailure } from '@process/providers/detection/authFailure';
import { addMessage, addOrUpdateMessage } from '@process/utils/message';
import { uuid } from '@/common/utils';
import BaseAgentManager from './BaseAgentManager';
import { IpcAgentEventEmitter } from './IpcAgentEventEmitter';
import { mainError, mainLog, mainWarn } from '@process/utils/mainLogger';
import { hasCronCommands } from './CronCommandDetector';
import { hasConciergeProposals } from './ConciergeProposeDetector';
import { processCronInMessage } from './MessageMiddleware';
import { extractAndStripThinkTags } from './ThinkTagDetector';
import { ConversationTurnCompletionService } from './ConversationTurnCompletionService';
import { cronBusyGuard } from '@process/services/cron/CronBusyGuard';
import { skillSuggestWatcher } from '@process/services/cron/SkillSuggestWatcher';
import { getCostRecorder } from '@process/services/cost/CostRecorder';
import { getBudgetController } from '@process/services/cost/BudgetController';
import { RunawayMonitor } from '@process/services/runaway/RunawayMonitor';

// ---------------------------------------------------------------------------
// Truncation-heuristic constants (HC-4 - see audit at
// .blackboard/audits/hard-coded-values.md, BD-Fix from Task D).
//
// These are the wrapper-side fallback heuristics for detecting when an LLM
// response was truncated. Task F has shipped engine-emitted
// `finish_reason: 'length'` upstream; once the engine binary that emits it
// is on every supported PATH, the heuristic block in `detectTruncation()`
// becomes pure backward-compat and can shrink to a `finish_reason` check.
// ---------------------------------------------------------------------------

/**
 * If `output_tokens` is at least this fraction of `maxTokens`, the response
 * is considered near-budget. Combined with `EMPTY_CONTENT_THRESHOLD_CHARS`
 * to flag silently-truncated reasoning-model responses.
 */
const NEAR_BUDGET_RATIO = 0.95;

/**
 * Visible-content floor in characters. Responses shorter than this AND
 * near-budget on tokens are treated as truncated (covers the Gemini Pro
 * reasoning-token bug where ~50-60 thinking tokens consume the budget
 * before any visible output renders).
 */
const EMPTY_CONTENT_THRESHOLD_CHARS = 20;

// WCore-specific approval key - reuses same pattern as GeminiApprovalStore
type WCoreApprovalKey = IApprovalKey & {
  action: 'exec' | 'edit' | 'info' | 'mcp';
  identifier?: string;
};

function isValidCommandName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name);
}

export class WCoreApprovalStore extends BaseApprovalStore<WCoreApprovalKey> {
  static createKeysFromConfirmation(action: string, commandType?: string): WCoreApprovalKey[] {
    if (action === 'exec' && commandType) {
      return commandType
        .split(',')
        .map((cmd) => cmd.trim())
        .filter(Boolean)
        .filter(isValidCommandName)
        .map((cmd) => ({ action: 'exec' as const, identifier: cmd }));
    }
    if (action === 'edit' || action === 'info' || action === 'mcp') {
      return [{ action: action as WCoreApprovalKey['action'] }];
    }
    return [];
  }
}

type WCoreManagerData = {
  workspace: string;
  proxy?: string;
  model: TProviderWithModel;
  conversation_id: string;
  yoloMode?: boolean;
  presetRules?: string;
  presetAssistantId?: string;
  /** Assistant-scoped always-on skill names (pinned/preset-enabled).  */
  enabledSkills?: string[];
  /** Builtin skill names to exclude from auto-injection. */
  excludeBuiltinSkills?: string[];
  /** True when this agent should advertise the team-guide MCP. */
  enableTeamGuide?: boolean;
  maxTokens?: number;
  maxTurns?: number;
  sessionMode?: string;
  sessionId?: string;
  resume?: string;
  /** Per-conversation reasoning effort (sent to the engine via set_config). Absent => engine default. */
  effort?: 'low' | 'medium' | 'high';
  /**
   * Per-conversation MCP scoping (#348): the user-server ids active for this
   * chat. `undefined` => all enabled servers; `[]` => no user servers. Forwarded
   * to the same `isServerActiveForSession` predicate the ACP/Gemini paths use.
   */
  activeMcpServers?: string[];
  teamMcpStdioConfig?: {
    name: string;
    command: string;
    args: string[];
    env: Array<{ name: string; value: string }>;
  };
};

/**
 * Net-new tail of a streamed reasoning chunk, given what has already accumulated.
 *
 * The wcore engine streams `thought` reasoning events as CUMULATIVE restates (the
 * full thought-so-far on each chunk), not incremental deltas. Appending them
 * verbatim doubled the text ("The userThe user wants…"). Both the persisted
 * thinking content and the renderer's live append consume this delta, so they
 * stay in sync. Cases, in order:
 * The engine streams a thought as incremental deltas, then re-emits the WHOLE
 * thought as one cumulative restate — and that restate can DIVERGE slightly from
 * the incrementally-built text (e.g. "what make money" -> "what to make money"),
 * so an exact prefix check misses it and the thought doubles. Cases, in order:
 *  - `incoming` extends `prev` exactly (prefix)  -> the part past `prev`
 *  - `incoming` already contained in `prev`      -> '' (stale/shorter restate)
 *  - `incoming` shares a long head with `prev`   -> a (possibly divergent) restate:
 *      append only the positional tail past what we already have, never the whole
 *      thing, so the thought can't double
 *  - otherwise (a genuine incremental delta)     -> `incoming` unchanged
 *
 * A real incremental delta is a short continuation that shares ~no common prefix
 * with `prev`, so it falls through to the last case and is appended whole.
 */
export function dedupeThinkingDelta(prev: string, incoming: string): string {
  if (!incoming) return '';
  if (incoming.startsWith(prev)) return incoming.slice(prev.length);
  if (prev.includes(incoming)) return '';
  let common = 0;
  const max = Math.min(prev.length, incoming.length);
  while (common < max && prev[common] === incoming[common]) common++;
  const isRestate = common >= 10 || (prev.length > 0 && common >= prev.length * 0.5);
  if (isRestate) return incoming.length > prev.length ? incoming.slice(prev.length) : '';
  return incoming;
}

export class WCoreManager extends BaseAgentManager<WCoreManagerData, string> {
  workspace: string;
  model: TProviderWithModel;
  readonly approvalStore = new WCoreApprovalStore();
  private agent: WCoreAgent | null = null;
  private agentReady: Promise<void>;
  /** Captured failure from `start()`, so a failed bootstrap surfaces an honest
   * error+finish on the next `sendMessage` instead of silently hanging the turn. */
  private startError: unknown = null;
  private currentMode: string = 'default';
  private _capabilities: WCoreCapabilities | null = null;
  private _configSentAt: number | null = null;
  private _messageSentAt: number | null = null;
  private currentMsgId: string | null = null;
  private currentMsgContent: string = '';
  // #252 - the most recent turn's msg_id, retained past stream finish so the
  // end-of-session `session_cost` event (which fires after currentMsgId is
  // cleared) can be stamped onto the correct turn's activity card.
  private _lastTurnMsgId: string | null = null;

  // #264 - an auto-mode `approval_required` the engine could not self-resolve is
  // escalated through the existing Confirming gate (see the approval_required
  // handler). That card is resumed by resume_token, but the renderer only routes
  // a callId back to confirm(); map callId -> resumeToken here so confirm() can
  // redirect to resumeApproval(). ONLY escalation callIds are stored, so ordinary
  // interactive tool_group approvals never hit the redirect and cannot double-drive.
  private readonly pendingApprovalTokens = new Map<string, string>();

  // Heartbeat state
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private readonly heartbeatIntervalMs = 30_000;
  private readonly heartbeatMaxMissed = 3;
  private heartbeatMissedCount = 0;
  private heartbeatActive = false;

  // Thinking state
  private thinkingMsgId: string | null = null;
  private thinkingStartTime: number | null = null;
  private thinkingContent: string = '';
  /** How much of `thinkingContent` has already been flushed to the DB. The DB sync
   *  is 'accumulate' (append), so each flush must send only the unflushed tail —
   *  sending the full content every tick re-appended it and doubled the stored
   *  thought ("LetLet me think…"). */
  private lastFlushedThinkingLen = 0;
  /** Per-turn reasoning subject (a short gerund phrase from the engine, #318).
   *  Emitted once per reasoning turn; first one wins. Absent for non-reasoning turns. */
  private thinkingSubject: string | undefined = undefined;
  private thinkingDbFlushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly streamDbFlushIntervalMs: number = 120;

  /** Runaway-loop detector (circuit-breaker Phase 2). Reset each turn. */
  private readonly runawayMonitor = new RunawayMonitor();

  // Stream text DB write buffer
  private readonly bufferedStreamTexts = new Map<
    string,
    { message: Extract<TMessage, { type: 'text' }>; timer: ReturnType<typeof setTimeout> }
  >();

  constructor(data: WCoreManagerData, model: TProviderWithModel) {
    super('wcore', { ...data, model }, new IpcAgentEventEmitter(), false);
    this.workspace = data.workspace;
    this.conversation_id = data.conversation_id;
    this.model = model;
    this.currentMode = data.sessionMode || 'default';

    // enableFork=false skips auto-init in ForkTask, so init manually
    this.init();

    // Start the agent bootstrap - store promise so sendMessage can await it.
    // Capture (don't swallow) a failed start: agentReady still resolves so the
    // sendMessage path is reached, where startError is surfaced as a real
    // error+finish instead of hanging the turn with no reply (S2).
    this.agentReady = this.start().catch((error) => {
      this.startError = error;
      mainError('[WCoreManager]', 'agent bootstrap (start) failed', error);
    });
  }

  /**
   * Determine new vs resume session, then create the WCoreAgent in-process.
   * If the conversation already has messages in the DB, pass --resume;
   * otherwise pass --session-id for a new session.
   */
  override async start() {
    let sessionArgs: { resume?: string; sessionId?: string };
    try {
      const db = await getDatabase();
      const result = db.getConversationMessages(this.conversation_id, 0, 1);
      const hasMessages = (result.data?.length ?? 0) > 0;
      sessionArgs = hasMessages ? { resume: this.conversation_id } : { sessionId: this.conversation_id };
    } catch {
      // Fallback: start as new session if DB check fails
      sessionArgs = { sessionId: this.conversation_id };
    }

    const mergedData = { ...this.data.data, ...sessionArgs };

    // Collect stdio MCP servers to inject. In-team sessions get the team_*
    // coordination MCP (with slot handshake). Solo sessions get the team-guide
    // MCP so aion_create_team / aion_list_models are available. Mirrors
    // GeminiAgentManager's solo branch.
    const stdioMcpServers: StdioMcpOption[] = [];
    if (mergedData.teamMcpStdioConfig) {
      stdioMcpServers.push({ ...mergedData.teamMcpStdioConfig, awaitReady: true });
    } else {
      const teamGuide = await this.buildTeamGuideMcpStdioConfig();
      if (teamGuide) stdioMcpServers.push(teamGuide);
    }

    // Raw-engine (power-user) mode: when `wcore.rawEngineMode` is
    // true, the embedded engine runs on its OWN config.toml exactly like the
    // standalone CLI - so we SKIP (a) the Desktop model override (applied in
    // buildSpawnConfig via the `rawEngineMode` flag passed below), (b) the
    // Constitution/skills/specialist prompt overlay built below, and (c) the
    // Desktop MCP-connector injection below (raw mode uses only the engine's own
    // [mcp.servers] table, like the CLI). The renderer (RuntimePane) only
    // persists the preference; this seam enacts it. A storage read failure falls
    // back to the normal (overridden) path - never raw.
    // Use ProcessConfig (main-process store) NOT ConfigStorage (renderer-bridged):
    // ConfigStorage.get round-trips to the renderer and HANGS when WCore is
    // spawned from a channel (a pure main-process path with no renderer in the
    // loop), wedging every channel-triggered turn. `.catch` cannot save a hang.
    const rawEngineMode = (await ProcessConfig.get('wcore.rawEngineMode').catch(() => false)) === true;

    // Inject the user's enabled stdio MCP connectors (mcp.config) so an
    // app-enabled connector reaches the engine WITHOUT a separate settings
    // toggle - mirroring the ACP session-injection path. wcore otherwise depends
    // entirely on the [mcp.servers] table written by WCoreMcpAgent (settings-time
    // only), which left every connector invisible in a fresh wcore chat. Uses the
    // shared predicate + per-conversation scoping (#348); builtins and hosted
    // (http/sse) connectors are handled elsewhere (see buildWCoreUserStdioMcpServers).
    // #478 dedup: skip any connector already in the active config.toml
    // [mcp.servers] table (WCoreMcpAgent settings-time write) - the engine loads
    // those at startup, so re-adding at runtime would register the server twice.
    // Skipped entirely in raw-engine mode (above). Best-effort: a config read
    // failure must never block the spawn.
    if (!rawEngineMode) {
      try {
        const mcpConfig = await ProcessConfig.get('mcp.config');
        const alreadyInConfig = await readWCoreConfigMcpServerNames();
        const userServers = buildWCoreUserStdioMcpServers(
          mcpConfig as IMcpServer[] | undefined,
          mergedData.activeMcpServers,
          alreadyInConfig
        );
        for (const server of userServers) {
          stdioMcpServers.push({ name: server.name, command: server.command, args: server.args, env: server.env });
        }
      } catch (err) {
        mainWarn('[WCoreManager]', 'failed to load user MCP connectors for injection', err);
      }
    }

    // #468: Output-budget override. When the user picked a Fixed budget, pass it
    // as the per-call `--max-tokens` (via buildSpawnConfig); Auto (default/unset)
    // leaves it unset so the engine sizes per-model (#456). A `fixed` entry with
    // no positive value falls back to Auto. An explicit per-conversation
    // `maxTokens` still wins. Same main-process store rationale as rawEngineMode
    // (ProcessConfig, not the renderer-bridged ConfigStorage which hangs here).
    const outputBudget = await ProcessConfig.get('wcore.outputBudget').catch((): OutputBudget | undefined => undefined);
    // Resolve a Fixed budget (clamped to MIN_FIXED_BUDGET); Auto / no value -> undefined.
    const fixedMaxTokens = resolveFixedBudget(outputBudget);

    // Prepend Wayland Constitution + specialist overlay AND inject the
    // builtin-skills index + `wayland_search_skills` MCP advert into the
    // system prompt. wcore delivers these via `init_history` as
    // `[Assistant System Rules]\n...` on the first turn. The helper returns
    // undefined when there is nothing to inject (no Constitution, no preset,
    // no skills, no library) - in that case we keep the prior "no
    // presetRules" behaviour for fresh installs. (H1: WCoreManager advertise
    // the second channel.) Skipped entirely in raw-engine mode.
    const systemInstructions = rawEngineMode
      ? undefined
      : await buildSystemInstructionsWithSkillsIndex({
          presetContext: mergedData.presetRules,
          enabledSkills: mergedData.enabledSkills,
          excludeBuiltinSkills: mergedData.excludeBuiltinSkills,
          enableTeamGuide: mergedData.enableTeamGuide,
          backend: 'wcore',
          presetAssistantId: mergedData.presetAssistantId,
          capabilitiesManifest: await resolveCapabilitiesManifest({
            presetAssistantId: mergedData.presetAssistantId,
            agentKey: 'wcore',
          }),
        });
    const effectivePresetRules = rawEngineMode ? undefined : (systemInstructions ?? mergedData.presetRules);

    const agent = new WCoreAgent({
      workspace: mergedData.workspace,
      model: mergedData.model,
      proxy: mergedData.proxy,
      yoloMode: mergedData.yoloMode,
      presetRules: effectivePresetRules,
      rawEngineMode,
      maxTokens: mergedData.maxTokens ?? fixedMaxTokens,
      maxTurns: mergedData.maxTurns,
      sessionId: mergedData.sessionId,
      resume: mergedData.resume,
      stdioMcpServers,
      onStreamEvent: (event) => this.emit('wcore.message', event),
      onProcessExit: (code, activeMsgId) => this.handleProcessExit(code, activeMsgId),
      onPong: () => this.handlePong(),
    });

    await agent.start();
    this.agent = agent;
    this._capabilities = agent.capabilities ?? null;

    // Per-conversation reasoning effort: forward to the engine via set_config on
    // spawn so the first (and every subsequent) turn runs at the selected effort.
    // Omitted => the engine keeps its own default.
    if (mergedData.effort) {
      agent.setConfig({ effort: mergedData.effort });
    }

    // #50: On resume, seed recent persisted history so the rebuilt engine keeps
    // prior context. The engine's --resume does not reliably restore history
    // (and falls back to a fresh session on failure), so mirror the proven
    // Gemini precedent and replay the last messages over the existing
    // init_history channel. New sessions have nothing to replay. The current
    // user turn is not persisted yet at start(), so it is not double-injected.
    if (sessionArgs.resume) {
      try {
        const historyDb = await getDatabase();
        const history = historyDb.getConversationMessages(this.conversation_id, 0, 10000);
        // #457: retain tool/file-edit history (not just text) so a rebuilt
        // session keeps the in-progress work instead of restarting from scratch.
        const text = buildResumeSeedTranscript((history.data ?? []) as TMessage[]);
        if (text) await agent.injectConversationHistory(text);
      } catch {
        // Best-effort: resume still proceeds without seeded history.
      }
    }

    // Mirror the resolved CLI budget (which may be the reasoning-model default
    // from envBuilder) into manager data so detectTruncation can compare
    // output_tokens against the real budget. Only fill the gap - never
    // overwrite an explicit caller value.
    if (this.data.data.maxTokens === undefined && agent.resolvedMaxTokens !== undefined) {
      this.data.data.maxTokens = agent.resolvedMaxTokens;
    }
    this.startHeartbeat();

    if (this.data.data.teamMcpStdioConfig) {
      const { notifyMcpReady } = await import('@process/team/mcpReadiness');
      const slotId = this.data.data.teamMcpStdioConfig.env?.find((e) => e.name === 'TEAM_AGENT_SLOT_ID')?.value;
      if (slotId) {
        notifyMcpReady(slotId);
      }
    }
  }

  /**
   * Build the team-guide MCP stdio config for a solo wcore session, or return
   * undefined when the agent is in a team (team_* MCP takes precedence) or when
   * the team-guide service hasn't started.
   */
  private async buildTeamGuideMcpStdioConfig(): Promise<
    { name: string; command: string; args: string[]; env: Array<{ name: string; value: string }> } | undefined
  > {
    if (this.data.data.teamMcpStdioConfig) return undefined;
    const [{ shouldInjectTeamGuideMcp }, { getTeamGuideStdioConfig }] = await Promise.all([
      import('@process/team/prompts/teamGuideCapability'),
      import('@process/team/mcp/guide/teamGuideSingleton'),
    ]);
    if (!(await shouldInjectTeamGuideMcp('wcore'))) return undefined;
    const base = getTeamGuideStdioConfig();
    if (!base) return undefined;
    return {
      name: base.name,
      command: base.command,
      args: base.args,
      env: [
        ...base.env,
        { name: 'AION_MCP_BACKEND', value: 'wcore' },
        { name: 'AION_MCP_CONVERSATION_ID', value: this.conversation_id },
      ],
    };
  }

  async stop() {
    this.stopHeartbeat();
    this.flushAllBufferedStreamTexts();
    cronBusyGuard.setProcessing(this.conversation_id, false);
    this.confirmations = [];
    if (this.agent) {
      this.agent.stop();
    }
  }

  async sendMessage(data: { content: string; msg_id: string; files?: string[] }) {
    // Runaway circuit-breaker Phase 1: pre-turn budget pause gate. If a 'pause'
    // budget for this model/backend is already over its limit, hold the turn
    // before anything is persisted or dispatched (no tokens spent) and surface a
    // resumable card carrying the held message. Default (no pause budget) allows.
    const gate = getBudgetController()?.canStartTurn({ modelId: this.model?.useModel, backend: 'wcore' });
    if (gate && !gate.allowed && gate.budget) {
      ipcBridge.cost.budgetGateBlocked.emit({
        conversationId: this.conversation_id,
        content: data.content,
        files: data.files,
        budgetId: gate.budget.id,
        scope: gate.budget.scope,
        scopeKey: gate.budget.scopeKey,
        limitUsd: gate.budget.limitUsd,
        spentUsd: gate.spentUsd ?? gate.budget.limitUsd,
        period: gate.budget.period,
      });
      return;
    }
    // Fresh turn: clear the runaway-loop counters so detection is per-turn.
    this.runawayMonitor.resetTurn();

    const message: TMessage = {
      id: data.msg_id,
      type: 'text',
      position: 'right',
      conversation_id: this.conversation_id,
      content: { content: data.content },
    };
    addMessage(this.conversation_id, message);
    try {
      (await getDatabase()).updateConversation(this.conversation_id, {});
    } catch {
      // Conversation might not exist in DB yet
    }
    cronBusyGuard.setProcessing(this.conversation_id, true);
    this.status = 'pending';
    this._lastActivityAt = Date.now();
    // Wait for agent bootstrap to complete before sending
    await this.agentReady;

    // S2: if bootstrap failed, the turn would otherwise hang forever (this.agent
    // is null -> the send below is skipped, no reply/error/finish ever emitted).
    // Surface an honest error + finish so the UI shows a real failure instead of
    // an infinite spinner. Triggers on missing/old wcore binary, auth failure,
    // or bad model config.
    if (this.startError || !this.agent) {
      this.emitStartFailure(data.msg_id, this.startError);
      return;
    }

    this._messageSentAt = Date.now();
    mainLog('[WCoreManager]', `message sent: msg_id=${data.msg_id}`);

    // Per-turn skill context, unified with the ACP backend so WCore chats also
    // get (a) skills the user added to this conversation from the composer
    // (injected once) and (b) the smart per-turn match advert + clear-winner
    // auto-load. This - not the always-on index - is how the lean default
    // surfaces the right skill on demand without bulk-injecting the library.
    let contentToSend = data.content;
    try {
      const pending = await consumePendingSessionSkills(this.conversation_id);
      if (pending) {
        contentToSend = `${pending}\n\n${contentToSend}`;
      }
      const turnSkill = await buildTurnSkillContext(data.content, {
        assistantId: this.data.data.presetAssistantId,
        agentKey: 'wcore',
      });
      if (turnSkill.advert) {
        contentToSend = `${turnSkill.advert}\n\n${contentToSend}`;
      }
      if (turnSkill.autoLoaded.length > 0) {
        await mergeLoadedSkillsExtra(this.conversation_id, turnSkill.autoLoaded);
      }
    } catch (error) {
      mainWarn('[WCoreManager]', 'per-turn skill context failed', error);
    }

    if (this.agent) {
      await this.agent.send(contentToSend, data.msg_id, data.files);
    }
  }

  /**
   * Check if a confirmation should be auto-approved based on current mode.
   */
  private tryAutoApprove(content: IMessageToolGroup['content'][number]): boolean {
    const type = content.confirmationDetails?.type;

    if (this.currentMode === 'yolo') {
      // #504: a question needs an answer, not a bare approval - approving an
      // AskUserQuestion with no answer makes the engine run its loud-defensive
      // execute() fallback and error. In full-auto, pick the first choice so
      // the turn proceeds instead of wedging.
      if (type === 'question') {
        const first =
          content.confirmationDetails?.type === 'question' ? content.confirmationDetails.choices[0] : undefined;
        this.agent?.approveTool(content.callId, 'once', first?.label);
      } else {
        this.agent?.approveTool(content.callId, 'once');
      }
      return true;
    }
    if (this.currentMode === 'auto_edit') {
      // Never auto-answer a question - it requires a real user choice, so it
      // falls through to the confirmation dialog.
      if (type === 'edit' || type === 'info') {
        this.agent?.approveTool(content.callId, 'once');
        return true;
      }
    }
    return false;
  }

  private handleConformationMessage(message: IMessageToolGroup) {
    const confirmingTools = message.content.filter((c) => c.status === 'Confirming');

    for (const content of confirmingTools) {
      // Check mode-based auto-approval
      if (this.tryAutoApprove(content)) continue;

      // Check approval store ("always allow" memory)
      const action = content.confirmationDetails?.type ?? 'info';
      const commandType =
        action === 'exec' ? (content.confirmationDetails as { rootCommand?: string })?.rootCommand : undefined;
      const keys = WCoreApprovalStore.createKeysFromConfirmation(action, commandType);
      if (keys.length > 0 && this.approvalStore.allApproved(keys)) {
        this.agent?.approveTool(content.callId, 'once');
        continue;
      }

      // Show confirmation dialog to user. #504: an AskUserQuestion renders its
      // choices as the options (each carries its `answer` label back to the
      // engine), instead of the generic allow/deny buttons.
      const details = content.confirmationDetails;
      const options =
        details?.type === 'question'
          ? [
              ...details.choices.map((choice) => ({
                label: choice.label,
                value: ToolConfirmationOutcome.ProceedOnce,
                answer: choice.label,
                ...(choice.description ? { description: choice.description } : {}),
              })),
              { label: 'messages.confirmation.no', value: ToolConfirmationOutcome.Cancel },
            ]
          : [
              { label: 'messages.confirmation.yesAllowOnce', value: ToolConfirmationOutcome.ProceedOnce },
              { label: 'messages.confirmation.yesAllowAlways', value: ToolConfirmationOutcome.ProceedAlways },
              { label: 'messages.confirmation.no', value: ToolConfirmationOutcome.Cancel },
            ];

      this.addConfirmation({
        title: (details?.type === 'question' ? details.question : details?.title) || content.name || '',
        id: content.callId,
        action,
        description: (details?.type === 'question' ? details.header : content.description) || '',
        callId: content.callId,
        options,
        commandType,
      });
    }
  }

  /**
   * Emit to teamEventBus (terminal events only) and channelEventBus (all events).
   * Mirrors the multi-bus emission pattern in AcpAgentManager.
   */
  private emitToEventBuses(message: IResponseMessage): void {
    if (message.type === 'finish' || message.type === 'error') {
      teamEventBus.emit('responseStream', {
        ...message,
        conversation_id: this.conversation_id,
      });
    }
    channelEventBus.emitAgentMessage(this.conversation_id, {
      ...message,
      conversation_id: this.conversation_id,
    });
  }

  private emitThinkingMessage(content: string, status: 'thinking' | 'done' = 'thinking', subject?: string): void {
    if (!this.thinkingMsgId) {
      this.thinkingMsgId = uuid();
      this.thinkingStartTime = Date.now();
      this.thinkingContent = '';
      this.lastFlushedThinkingLen = 0;
      this.thinkingSubject = undefined;
    }

    // Latest subject wins (#318 v2): Flux emits a generic header (Frame A) then a
    // request-specific refinement (Frame B) within the same turn; replace in place
    // so the refined subject upgrades the placeholder. Reset per turn (above).
    if (subject) {
      this.thinkingSubject = subject;
    }

    // The engine re-streams reasoning as cumulative restates, so emit/persist only
    // the net-new tail — otherwise both the DB content and the renderer's append
    // double it ("The userThe user wants…").
    let delta = content;
    if (status === 'thinking' && content) {
      delta = dedupeThinkingDelta(this.thinkingContent, content);
      this.thinkingContent += delta;
    }

    const duration = status === 'done' && this.thinkingStartTime ? Date.now() - this.thinkingStartTime : undefined;

    ipcBridge.conversation.responseStream.emit({
      type: 'thinking',
      conversation_id: this.conversation_id,
      msg_id: this.thinkingMsgId,
      data: {
        content: delta,
        subject: this.thinkingSubject,
        duration,
        status,
      },
    });

    if (status === 'done') {
      this.flushThinkingToDb(duration, 'done');
    } else if (!this.thinkingDbFlushTimer) {
      this.thinkingDbFlushTimer = setTimeout(() => {
        this.flushThinkingToDb(undefined, 'thinking');
      }, this.streamDbFlushIntervalMs);
    }
  }

  private flushThinkingToDb(duration: number | undefined, status: 'thinking' | 'done'): void {
    if (this.thinkingDbFlushTimer) {
      clearTimeout(this.thinkingDbFlushTimer);
      this.thinkingDbFlushTimer = null;
    }
    if (!this.thinkingMsgId) return;
    // 'accumulate' appends, so send only the tail written since the last flush.
    const tail = this.thinkingContent.slice(this.lastFlushedThinkingLen);
    this.lastFlushedThinkingLen = this.thinkingContent.length;
    const tMessage: TMessage = {
      id: this.thinkingMsgId,
      msg_id: this.thinkingMsgId,
      type: 'thinking',
      position: 'left',
      conversation_id: this.conversation_id,
      content: {
        content: tail,
        subject: this.thinkingSubject,
        duration,
        status,
      },
      createdAt: this.thinkingStartTime || Date.now(),
    };
    addOrUpdateMessage(this.conversation_id, tMessage, 'wcore');
  }

  private clearThinkingState(): void {
    this.thinkingMsgId = null;
    this.thinkingStartTime = null;
    this.thinkingContent = '';
    this.lastFlushedThinkingLen = 0;
    this.thinkingSubject = undefined;
  }

  private queueBufferedStreamText(message: Extract<TMessage, { type: 'text' }>): void {
    const key = `${message.conversation_id}:${message.msg_id || message.id}`;
    const existing = this.bufferedStreamTexts.get(key);
    if (existing) {
      this.bufferedStreamTexts.set(key, {
        ...existing,
        message: {
          ...existing.message,
          content: {
            ...existing.message.content,
            content: existing.message.content.content + message.content.content,
          },
        },
      });
      return;
    }

    const timer = setTimeout(() => {
      this.flushBufferedStreamText(key);
    }, this.streamDbFlushIntervalMs);

    this.bufferedStreamTexts.set(key, {
      message: { ...message, content: { ...message.content } },
      timer,
    });
  }

  private flushBufferedStreamText(key: string): void {
    const buffered = this.bufferedStreamTexts.get(key);
    if (!buffered) return;
    clearTimeout(buffered.timer);
    this.bufferedStreamTexts.delete(key);
    addOrUpdateMessage(this.conversation_id, buffered.message, 'wcore');
  }

  private flushAllBufferedStreamTexts(): void {
    if (this.bufferedStreamTexts.size === 0) return;
    const keys = Array.from(this.bufferedStreamTexts.keys());
    for (const key of keys) {
      this.flushBufferedStreamText(key);
    }
  }

  private notifyTurnCompletion(): void {
    void ConversationTurnCompletionService.getInstance().notifyPotentialCompletion(this.conversation_id, {
      status: this.status ?? 'finished',
      workspace: this.workspace,
      backend: 'wcore',
      pendingConfirmations: this.getConfirmations().length,
      modelId: this.model.useModel,
    });
  }

  /**
   * Return true when the just-finished turn was cut short by the model's token
   * budget. Two detection paths:
   *
   *   1. Explicit: wayland-core ≥0.2 (Task F engine-side fix) emits
   *      `finish_reason: 'length'` in stream_end. Definitive. #457: also treat
   *      a distinct `'max_turns'` value (once Core emits it; engine currently
   *      maps MaxTurns->length) as truncated/continuable - a turn-cap stop is
   *      NOT empty/near-budget, so only this explicit path can catch it; without
   *      it the Continue banner would never show on a max-turns stop.
   *   2. Heuristic: wayland-core ≤0.1.21 doesn't emit finish_reason, so we infer
   *      truncation when `output_tokens` is at or above 95% of the configured
   *      `maxTokens` AND the visible content is empty/very short. This catches
   *      the Gemini Pro reasoning-token bug today (the wrapper fix in Worker B
   *      raises the budget but edge cases will still hit the ceiling).
   */
  private detectTruncation(data: unknown, content: string): boolean {
    if (!data || typeof data !== 'object') return false;
    const d = data as { finish_reason?: string; output_tokens?: number };

    if (d.finish_reason === 'length' || d.finish_reason === 'max_turns') return true;

    const maxTokens = this.data.data.maxTokens;
    if (!maxTokens || typeof d.output_tokens !== 'number') return false;
    const nearBudget = d.output_tokens >= Math.floor(maxTokens * NEAR_BUDGET_RATIO);
    const contentEmpty = content.trim().length < EMPTY_CONTENT_THRESHOLD_CHARS;
    return nearBudget && contentEmpty;
  }

  // TODO(#422 follow-up): auto-retry an empty-content truncation once with a
  // genuinely raised budget. Deferred: there is no clean per-turn budget
  // override today. The wcore budget is a spawn-time CLI arg (`--max-tokens`)
  // and the live protocol's `set_config` has no `max_tokens` field, so raising
  // it requires kill + re-spawn, and a re-spawn uses `--resume` so the failed
  // empty `finish_reason: length` turn is already in engine session history
  // (re-sending appends a NEW turn rather than re-running the same one). The
  // engine already sizes the budget per-model at spawn (#456: it grants
  // flux-auto/flux-reasoning the 32768 reasoning ceiling itself via
  // `size_output_cap`/`UNKNOWN_REASONING_CAP`), so an auto-retry at the same
  // budget would just re-truncate — a real fix needs an engine-side per-turn
  // budget control. Manual recovery ships now via the truncation banner's
  // "Continue with more headroom" action (CHAT_RETRY_EVENT).

  /**
   * Attach `truncatedDueToBudget: true` to the in-flight assistant message.
   * Emits an empty-delta `content` event so the renderer's composeMessage merge
   * preserves accumulated text while picking up the flag via Object.assign, and
   * upserts the same shape into the DB.
   */
  private emitTruncationFlag(msgId: string): void {
    const richData = { content: '', truncatedDueToBudget: true };

    const tMessage: TMessage = {
      id: msgId,
      msg_id: msgId,
      type: 'text',
      position: 'left',
      conversation_id: this.conversation_id,
      content: richData,
      status: 'finish',
      createdAt: Date.now(),
    };
    addOrUpdateMessage(this.conversation_id, tMessage, 'wcore');

    const ipcMsg: IResponseMessage = {
      type: 'content',
      conversation_id: this.conversation_id,
      msg_id: msgId,
      data: richData,
    };
    ipcBridge.conversation.responseStream.emit(ipcMsg);
    this.emitToEventBuses(ipcMsg);
  }

  private saveContextUsage(data: unknown): void {
    if (!data || typeof data !== 'object' || !('input_tokens' in data)) return;
    const usage = data as { input_tokens: number; output_tokens: number };
    const totalTokens = (usage.input_tokens || 0) + (usage.output_tokens || 0);
    if (totalTokens <= 0) return;

    void (async () => {
      try {
        const db = await getDatabase();
        const result = db.getConversation(this.conversation_id);
        if (result.success && result.data && result.data.type === 'wcore') {
          const conversation = result.data;
          db.updateConversation(this.conversation_id, {
            extra: { ...conversation.extra, lastTokenUsage: { totalTokens } },
          } as Partial<typeof conversation>);
        }
      } catch {
        // Non-critical metadata, silently ignore errors
      }
    })();
  }

  /**
   * Record this wcore turn's cost to the ledger. wcore emits a per-turn
   * input/output token split at finish (not a cumulative gauge), so we take the
   * computed path: the recorder prices the split via ModelPricing keyed on the
   * model id actually used (`this.model.useModel`), falling back to
   * cost_source='unknown' (tokens only) when the model is unpriced.
   */
  private recordCost(data: unknown): void {
    if (!data || typeof data !== 'object' || !('input_tokens' in data)) return;
    const usage = data as { input_tokens?: number; output_tokens?: number };
    const inputTokens = typeof usage.input_tokens === 'number' ? usage.input_tokens : 0;
    const outputTokens = typeof usage.output_tokens === 'number' ? usage.output_tokens : 0;
    if (inputTokens + outputTokens <= 0) return;
    getCostRecorder()?.recordTurnFinish({
      conversationId: this.conversation_id,
      backend: 'wcore',
      modelId: this.model?.useModel,
      costSource: 'computed',
      inputTokens,
      outputTokens,
      ts: Date.now(),
    });
  }

  /**
   * Feed completed tool results to the runaway detector (circuit-breaker P2).
   * On a trip (same content re-read N times, or a command failing N times in a
   * row), gracefully stop the looping turn - agent.stop() sends a 'stop' command
   * so the session stays alive and the user can continue - and tell the renderer
   * why, so the user is not silently burning tokens in a loop.
   */
  private checkRunaway(message: IMessageToolGroup): void {
    const items = Array.isArray(message.content) ? message.content : [];
    for (const item of items) {
      if (item.status !== 'Success' && item.status !== 'Error') continue;
      const rd = item.resultDisplay;
      const outputText = typeof rd === 'string' ? rd : ((rd as { fileDiff?: string } | undefined)?.fileDiff ?? '');
      const trip = this.runawayMonitor.observe({
        name: item.name ?? '',
        success: item.status === 'Success',
        outputText,
      });
      if (trip) {
        mainWarn(
          '[WCoreManager]',
          `runaway detected (${trip.kind} x${trip.count}); halting turn for ${this.conversation_id}`
        );
        void this.stop();
        ipcBridge.conversation.runawayHalted.emit({
          conversationId: this.conversation_id,
          kind: trip.kind,
          count: trip.count,
        });
        return;
      }
    }
  }

  private handleProcessExit(code: number | null, activeMsgId: string): void {
    mainError('[WCoreManager]', `wcore process exited unexpectedly (code=${code}) during active turn ${activeMsgId}`);

    this.status = 'finished';
    void this.handleTurnEnd();

    const errorMessage: IResponseMessage = {
      type: 'error',
      conversation_id: this.conversation_id,
      msg_id: activeMsgId,
      data: `Agent process exited unexpectedly (code ${code})`,
    };
    ipcBridge.conversation.responseStream.emit(errorMessage);
    this.emitToEventBuses(errorMessage);

    const finishMessage: IResponseMessage = {
      type: 'finish',
      conversation_id: this.conversation_id,
      msg_id: uuid(),
      data: null,
    };
    ipcBridge.conversation.responseStream.emit(finishMessage);
    this.emitToEventBuses(finishMessage);
  }

  /**
   * S2: Surface a failed agent bootstrap as a real error + finish for the held
   * turn, so the UI shows a failure instead of hanging on an infinite spinner.
   * Mirrors handleProcessExit's emit pattern.
   */
  private emitStartFailure(activeMsgId: string, error: unknown): void {
    mainError('[WCoreManager]', `agent bootstrap failed; turn ${activeMsgId} cannot start`, error);

    this.status = 'finished';
    cronBusyGuard.setProcessing(this.conversation_id, false);

    const detail = error instanceof Error ? error.message : String(error ?? 'unknown error');
    const errorMessage: IResponseMessage = {
      type: 'error',
      conversation_id: this.conversation_id,
      msg_id: activeMsgId,
      data: `Agent failed to start: ${detail}`,
    };
    ipcBridge.conversation.responseStream.emit(errorMessage);
    this.emitToEventBuses(errorMessage);

    const finishMessage: IResponseMessage = {
      type: 'finish',
      conversation_id: this.conversation_id,
      msg_id: uuid(),
      data: null,
    };
    ipcBridge.conversation.responseStream.emit(finishMessage);
    this.emitToEventBuses(finishMessage);
  }

  /** Guards against re-invalidating the same provider on repeated error frames. */
  private authKeyInvalidated = false;

  /**
   * On an unambiguous provider key auth failure (401 / invalid x-api-key), mark
   * the model's provider `error/unauthorized` so Models & Providers stops
   * showing it connected and the next spawn does not reuse the dead key.
   * Mirrors AcpAgentManager.maybeInvalidateProviderKeyOnAuthError but keyed on
   * the single provider this wcore turn used (`this.model.id`). Deliberately
   * narrow: only fires on unambiguous key failures (not transient 429/5xx), and
   * never touches the Flux route. Reversible: re-keying the provider runs a
   * connection test and restores `connected`.
   */
  private maybeInvalidateProviderKeyOnAuthError(text: string): void {
    if (this.authKeyInvalidated) return;
    if (!isProviderKeyAuthFailure(text)) return;
    const providerId = this.model?.id;
    // No provider id, or the turn was routed through Flux (whose key is not this
    // provider's): leave provider state untouched.
    if (!providerId || providerId === 'flux-router') return;
    this.authKeyInvalidated = true;

    void (async () => {
      try {
        const db = await getDatabase();
        const repo = new ProviderRepository(db.getDriver());
        repo.updateRegistryProviderState(providerId, 'error', 'unauthorized');
        mainWarn(
          '[WCoreManager]',
          `Provider '${providerId}' key rejected by Wayland Core (401/invalid x-api-key); ` +
            'marked error/unauthorized. Re-key it in Models & Providers to restore.'
        );
      } catch (err) {
        mainWarn('[WCoreManager]', 'maybeInvalidateProviderKeyOnAuthError failed', err);
      }
    })();
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeat();
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.heartbeatMissedCount = 0;
    this.heartbeatActive = false;
  }

  private handlePong(): void {
    this.heartbeatMissedCount = 0;
  }

  private checkHeartbeat(): void {
    if (!this.heartbeatActive || !this.agent?.isAlive) return;

    this.heartbeatMissedCount++;

    if (this.heartbeatMissedCount >= this.heartbeatMaxMissed) {
      mainError('[WCoreManager]', `wcore process unresponsive after ${this.heartbeatMaxMissed} missed pongs, killing`);
      void this.agent?.kill();
      return;
    }

    this.agent?.ping();
  }

  init() {
    this.on('wcore.message', (data) => {
      // Store capabilities from config_changed events
      if (data.type === 'config_changed') {
        const elapsed = this._configSentAt ? `${Date.now() - this._configSentAt}ms` : 'n/a';
        mainLog('[WCoreManager]', `config_changed received (${elapsed})`, data.data);
        this._configSentAt = null;
        this._capabilities = data.data as WCoreCapabilities;
        ipcBridge.conversation.responseStream.emit({
          type: 'config_changed',
          conversation_id: this.conversation_id,
          msg_id: '',
          data: data.data,
        });
        return;
      }

      // Log info events from wcore (includes set_config/set_mode acknowledgments)
      if (data.type === 'info') {
        const elapsed = this._configSentAt ? ` (${Date.now() - this._configSentAt}ms since command)` : '';
        mainLog('[WCoreManager]', `info: ${data.data}${elapsed}`);
      }

      // v0.9.4 - sub-agent activity events are system-level (empty msg_id) but
      // MUST reach the renderer so SubAgentActivityCard can render one card per
      // sub-agent. Forward before the msg_id guard drops them (mirrors the
      // config_changed pass-through above). The renderer's transformMessage
      // reads `data.{parentCallId,agentName,inner}` + `conversation_id`.
      if (data.type === 'sub_agent_event') {
        ipcBridge.conversation.responseStream.emit({
          type: 'sub_agent_event',
          conversation_id: this.conversation_id,
          msg_id: '',
          data: data.data,
        });
        return;
      }

      // W7 S4 HITL: the engine suspended the turn waiting on `approval_required`
      // (resume_token based — distinct from tool_group confirmations). The engine
      // self-resolves this under --auto-approve, but that path can fail on some
      // provider routes (notably Anthropic-format `toolu_` tool ids routed via
      // Flux), leaving the turn wedged forever with no host response. There is no
      // renderer UI for this HITL path yet, so in an auto mode (Autopilot/Auto
      // Edit) — and for informational (`reason:'info'`, e.g. the internal todo
      // tool) approvals in any mode — send an explicit, idempotent
      // `approval_resume` so the turn can never hang. (A stale/duplicate token is
      // safely ignored engine-side.)
      if (data.type === 'approval_required') {
        const appr = (data.data ?? {}) as {
          callId?: string;
          resumeToken?: string;
          reason?: string;
          context?: unknown;
        };
        const autoMode = this.currentMode === 'yolo' || this.currentMode === 'auto_edit';
        const isInfo = appr.reason === 'info';

        // Informational approvals (e.g. the engine's internal todo tool) are safe
        // to self-resume in ANY mode - unchanged happy path.
        if (appr.resumeToken && isInfo) {
          this.agent?.resumeApproval(appr.resumeToken, true);
          return;
        }

        // #264: a NON-info `approval_required` reached us in an auto mode
        // (Autopilot/Auto Edit). The engine expected to self-resolve but could not
        // (notably Anthropic-format `toolu_` ids routed via Flux), and there is no
        // dedicated HITL UI - so the turn would wedge, and previously we silently
        // auto-resumed(true), which is exactly the silent auto-approve the trust
        // audit fights. Escalate through the EXISTING Confirming gate so the user
        // explicitly allows/denies; the decision resumes by resume_token in
        // confirm() (keyed via pendingApprovalTokens).
        if (autoMode && !isInfo && appr.resumeToken) {
          const callId = appr.callId ?? '';
          // A non-interactive spawn (channel/cron sets this.yoloMode) has no user
          // to prompt. addConfirmation() would auto-pick the first (allow) option
          // under yoloMode and SILENTLY APPROVE - the opposite of what an
          // un-anticipated approval needs. So loud-deny instead: a visible,
          // recorded denial, never a silent approve and never a hang.
          if (this.yoloMode) {
            this.agent?.resumeApproval(appr.resumeToken, false);
            mainError(
              '[WCoreManager]',
              `approval_required reason='${appr.reason}' in a non-interactive (yoloMode) session with no user to prompt; denied`,
              data.data
            );
            return;
          }
          this.pendingApprovalTokens.set(callId, appr.resumeToken);
          const context = typeof appr.context === 'string' && appr.context ? appr.context : '';
          this.addConfirmation({
            title: 'messages.permissionRequest',
            id: callId,
            description: context || `reason: ${appr.reason ?? ''}`,
            callId,
            options: [
              { label: 'messages.confirmation.yesAllowOnce', value: ToolConfirmationOutcome.ProceedOnce },
              { label: 'messages.confirmation.no', value: ToolConfirmationOutcome.Cancel },
            ],
          });
          return;
        }

        // Any other non-info approval. In interactive (non-auto) mode this is
        // EXPECTED: the renderer tool-confirmation gate (the `Confirming`
        // tool_group path above) prompts the user and drives the resume; this
        // `approval_required` is the engine's parallel signal, not a dropped
        // approval. A normal exec/mcp approval legitimately carries no resume
        // token here, so the old resume-token check fired on every exec approval
        // and falsely read as a failure (#390) - keep only a quiet trace. The one
        // genuinely un-actionable case is an auto-mode approval with NO resume
        // token: we can neither resume nor escalate, so surface a diagnostic.
        if (appr.reason && !isInfo) {
          if (autoMode && !appr.resumeToken) {
            mainError(
              '[WCoreManager]',
              `approval_required reason='${appr.reason}' in auto mode has no resume token and no HITL UI; turn may wedge`,
              data.data
            );
          } else {
            mainLog(
              '[WCoreManager]',
              `approval_required reason='${appr.reason}': renderer confirmation gate owns this approval`
            );
          }
        }
        return;
      }

      // #252 - session_cost is end-of-session metadata that fires AFTER the
      // turn's stream finishes, so its msg_id is already empty/cleared and the
      // empty-msg_id guard below would drop it. Force-forward it stamped with
      // the last turn's msg_id so the renderer attaches the per-turn cost rows
      // to that turn's activity card (mirrors the sub_agent_event pass-through).
      if (data.type === 'session_cost') {
        const turnMsgId = data.msg_id || this._lastTurnMsgId || '';
        ipcBridge.conversation.responseStream.emit({
          type: 'session_cost',
          conversation_id: this.conversation_id,
          msg_id: turnMsgId,
          data: data.data,
        });
        return;
      }

      // When the inference provider rejects the key (401 / invalid x-api-key),
      // flip that provider off "connected" so the UI stops showing it healthy
      // and the next spawn does not reuse the dead key. Side-effect only: the
      // error still flows through the pipeline below to the renderer, which
      // surfaces the auth-failure remedy card (WCoreChat). Unlike Claude Code,
      // Wayland Core has no subscription/OAuth fallback, so a dead key is fatal
      // for the turn and the provider must be marked unhealthy.
      if (data.type === 'error') {
        this.maybeInvalidateProviderKeyOnAuthError(typeof data.data === 'string' ? data.data : String(data.data ?? ''));
      }

      // System-level events (empty msg_id) are not part of a conversation turn.
      // Skip stream processing to avoid false-positive running state and fallback timer.
      if (!data.msg_id) return;

      // Any stream event with msg_id counts as activity - reset heartbeat missed count.
      // This provides backward compat with wcore binaries that don't yet support pong.
      this.heartbeatMissedCount = 0;

      const contentTypes = ['content', 'tool_group'];
      if (contentTypes.includes(data.type)) {
        this.status = 'finished';
      }

      if (data.type === 'start') {
        const ttft = this._messageSentAt ? `${Date.now() - this._messageSentAt}ms` : 'n/a';
        mainLog('[WCoreManager]', `stream_start: msg_id=${data.msg_id}, TTFT=${ttft}`);
        this.status = 'running';
        this.heartbeatActive = true;
        this.heartbeatMissedCount = 0;
        this.currentMsgId = data.msg_id ?? null;
        this._lastTurnMsgId = data.msg_id ?? this._lastTurnMsgId;
        this.currentMsgContent = '';

        // Reset thinking state on new turn
        if (this.thinkingMsgId) {
          this.emitThinkingMessage('', 'done');
          this.clearThinkingState();
        }

        ipcBridge.conversation.responseStream.emit({
          type: 'request_trace',
          conversation_id: this.conversation_id,
          msg_id: uuid(),
          data: {
            agentType: 'wcore' as const,
            provider: this.model.name,
            modelId: this.model.useModel,
            baseUrl: this.model.baseUrl,
            platform: this.model.platform,
            timestamp: Date.now(),
          },
        });
        return;
      }

      // Handle thought events - convert to thinking messages.
      // The engine emits an optional per-turn reasoning `subject` (a short gerund
      // phrase) once, immediately before the first reasoning text. Thread it through
      // so the live "Thinking" block header shows the model's own summary (#318).
      if (data.type === 'thought') {
        data.conversation_id = this.conversation_id;
        const content = typeof data.data === 'string' ? data.data : '';
        const subject = typeof data.subject === 'string' ? data.subject : undefined;
        if (content || subject) {
          this.emitThinkingMessage(content, 'thinking', subject);
        }
        return;
      }

      // Non-thought event while thinking → end thinking phase
      if (this.thinkingMsgId) {
        this.emitThinkingMessage('', 'done');
        this.clearThinkingState();
      }

      // Extract inline <think> tags from content before main pipeline
      let processedData = data;
      if (data.type === 'content' && typeof data.data === 'string') {
        const { thinking, content: stripped } = extractAndStripThinkTags(data.data);
        if (thinking) {
          this.emitThinkingMessage(thinking, 'thinking');
        }
        if (stripped !== data.data) {
          processedData = { ...data, data: stripped };
        }
      }

      // Accumulate text content from incremental deltas
      if (processedData.type === 'content' && typeof processedData.data === 'string') {
        this.currentMsgContent += processedData.data;
        this.currentMsgId = processedData.msg_id ?? this.currentMsgId;
      }

      // On turn end, clear fallback timer, persist usage, and check for cron commands
      if (processedData.type === 'finish') {
        const total = this._messageSentAt ? `${Date.now() - this._messageSentAt}ms` : 'n/a';
        mainLog('[WCoreManager]', `stream_end: msg_id=${processedData.msg_id}, total=${total}`, processedData.data);
        // Mark the turn terminal. `this.status` is otherwise only set to 'finished'
        // on a content/tool_group frame, so an error-only turn (provider rejects the
        // request, 0 content) was left 'running' forever — `conversation.get` returns
        // `task.status` (conversationBridge), so the renderer's mount/resume hydration
        // kept restoring a stuck "Processing" spinner that blocked further sends.
        this.status = 'finished';
        this._messageSentAt = null;
        this.heartbeatActive = false;
        this.heartbeatMissedCount = 0;
        this.saveContextUsage(processedData.data);
        this.recordCost(processedData.data);

        // Capture before handleTurnEnd resets msg state, then emit truncation flag
        // after the turn-end flush so the renderer's text-message merge attaches
        // the flag to the already-accumulated content rather than racing it.
        const truncMsgId = this.detectTruncation(processedData.data, this.currentMsgContent) ? this.currentMsgId : null;

        void this.handleTurnEnd();

        if (truncMsgId) {
          this.emitTruncationFlag(truncMsgId);
        }
      }

      processedData.conversation_id = this.conversation_id;

      const pipelineStart = Date.now();

      // Transform and persist message (skip transient UI state)
      const skipTransformTypes = ['finished', 'start', 'finish'];
      if (!skipTransformTypes.includes(processedData.type)) {
        const transformStart = Date.now();
        const tMessage = transformMessage(processedData as IResponseMessage);
        const transformDuration = Date.now() - transformStart;

        if (tMessage) {
          const dbStart = Date.now();
          const isStreamTextChunk = tMessage.type === 'text' && processedData.type === 'content';
          if (isStreamTextChunk) {
            this.queueBufferedStreamText(tMessage as Extract<TMessage, { type: 'text' }>);
          } else {
            this.flushAllBufferedStreamTexts();
            addOrUpdateMessage(this.conversation_id, tMessage, 'wcore');
          }
          const dbDuration = Date.now() - dbStart;

          if (transformDuration > 5 || dbDuration > 5) {
            mainLog(
              '[WCoreManager]',
              `stream: transform ${transformDuration}ms, db ${dbDuration}ms type=${processedData.type}`
            );
          }

          if (tMessage.type === 'tool_group') {
            this.handleConformationMessage(tMessage);
            this.checkRunaway(tMessage);
          }
        }
      }

      const emitStart = Date.now();
      ipcBridge.conversation.responseStream.emit(processedData);
      this.emitToEventBuses(processedData as IResponseMessage);
      const emitDuration = Date.now() - emitStart;

      const totalDuration = Date.now() - pipelineStart;
      if (totalDuration > 10) {
        mainLog(
          '[WCoreManager]',
          `stream: pipeline ${totalDuration}ms (emit=${emitDuration}ms) type=${processedData.type}`
        );
      }
    });
  }

  private async handleTurnEnd(): Promise<void> {
    cronBusyGuard.setProcessing(this.conversation_id, false);
    this.flushAllBufferedStreamTexts();

    // Finalize thinking if still active
    if (this.thinkingMsgId) {
      this.emitThinkingMessage('', 'done');
      this.clearThinkingState();
    }

    const content = this.currentMsgContent;
    const msgId = this.currentMsgId;

    // Reset state immediately to prevent carry-over
    this.currentMsgId = null;
    this.currentMsgContent = '';

    // Notify external services (e.g. cron scheduler) that the turn completed
    this.notifyTurnCompletion();

    // Check for SKILL_SUGGEST.md updates (registered by cron executor)
    skillSuggestWatcher.onFinish(this.conversation_id);

    // Route the completed turn through the middleware when it contains EITHER a
    // cron command OR a Concierge config proposal ([CONCIERGE_PROPOSE]). Without
    // the concierge check the proposal block is never detected and leaks raw.
    if (!content || (!hasCronCommands(content) && !hasConciergeProposals(content))) {
      return;
    }

    try {
      const cronMessage: TMessage = {
        id: msgId || uuid(),
        msg_id: msgId || uuid(),
        type: 'text',
        position: 'left',
        conversation_id: this.conversation_id,
        content: { content },
        status: 'finish',
        createdAt: Date.now(),
      };

      const collectedResponses: string[] = [];
      await processCronInMessage(this.conversation_id, 'wcore', cronMessage, (sysMsg) => {
        collectedResponses.push(sysMsg);
        ipcBridge.conversation.responseStream.emit({
          type: 'system',
          conversation_id: this.conversation_id,
          msg_id: uuid(),
          data: sysMsg,
        });
      });

      if (collectedResponses.length > 0) {
        const feedbackMessage = `[System Response]\n${collectedResponses.join('\n')}`;
        await this.sendMessage({
          content: feedbackMessage,
          msg_id: uuid(),
        });
      }
    } catch (error) {
      mainError('[WCoreManager]', 'Cron command processing failed', error);
    }
  }

  getCapabilities(): WCoreCapabilities | null {
    return this._capabilities;
  }

  setConfig(config: { model?: string; thinking?: string; thinking_budget?: number; effort?: string }): void {
    if (this.agent) {
      this.agent.setConfig(config);
    }
  }

  getMode(): { mode: string; initialized: boolean } {
    return { mode: this.currentMode, initialized: true };
  }

  async setMode(mode: string): Promise<{ success: boolean; data?: { mode: string } }> {
    this.currentMode = mode;
    this.saveSessionMode(mode);
    if (this.agent) {
      this._configSentAt = Date.now();
      mainLog('[WCoreManager]', `set_mode sent: mode=${mode}`);
      this.agent.setMode(mode as 'default' | 'auto_edit' | 'yolo');
    }
    return { success: true, data: { mode: this.currentMode } };
  }

  private async saveSessionMode(mode: string): Promise<void> {
    try {
      const db = await getDatabase();
      const result = db.getConversation(this.conversation_id);
      if (result.success && result.data && result.data.type === 'wcore') {
        const conversation = result.data;
        db.updateConversation(this.conversation_id, {
          extra: { ...conversation.extra, sessionMode: mode },
        } as Partial<typeof conversation>);
      }
    } catch (error) {
      mainError('[WCoreManager]', 'Failed to save session mode', error);
    }
  }

  confirm(id: string, callId: string, data: string, answer?: string) {
    // #264: an escalated auto-mode `approval_required` is resumed by resume_token,
    // NOT by approveTool/denyTool. If this callId was escalated, clear its card,
    // drive the engine's approval_resume, and stop - do not also fall through to
    // approveTool/denyTool. Non-escalation callIds are never in the map, so the
    // ordinary approval path below is byte-unchanged for them.
    const pendingToken = this.pendingApprovalTokens.get(callId);
    if (pendingToken !== undefined) {
      this.pendingApprovalTokens.delete(callId);
      super.confirm(id, callId, data);
      this.agent?.resumeApproval(pendingToken, data !== ToolConfirmationOutcome.Cancel);
      return;
    }

    // Store "always allow" in approval store
    if (data === ToolConfirmationOutcome.ProceedAlways) {
      const confirmation = this.confirmations.find((c) => c.callId === callId);
      if (confirmation?.action) {
        const keys = WCoreApprovalStore.createKeysFromConfirmation(confirmation.action, confirmation.commandType);
        this.approvalStore.approveAll(keys);
      }
    }

    super.confirm(id, callId, data);

    if (this.agent) {
      if (data === ToolConfirmationOutcome.Cancel) {
        this.agent.denyTool(callId, 'User cancelled');
      } else {
        const scope = data === ToolConfirmationOutcome.ProceedAlways ? 'always' : 'once';
        // #504: `answer` carries the picked AskUserQuestion choice back to the
        // engine (undefined for a plain approval).
        this.agent.approveTool(callId, scope, answer);
      }
    }
  }

  override async kill(): Promise<void> {
    if (this.agent) {
      try {
        // Await the engine tree-kill (taskkill /T on Windows) before tearing
        // down the worker, so WorkerTaskManager.clear() on quit doesn't return
        // before wayland-core's child tree is actually gone (#139).
        await this.agent.kill();
      } catch {
        // best-effort
      }
    }
    // super.kill() is async (ForkTask M18); await child exit.
    await super.kill();
  }
}
