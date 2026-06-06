/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IMessageToolGroup, TMessage } from '@/common/chat/chatLib';
import { transformMessage } from '@/common/chat/chatLib';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { channelEventBus } from '@process/channels/agent/ChannelEventBus';
import { teamEventBus } from '@process/team/teamEventBus';
import type { TProviderWithModel } from '@/common/config/storage';
import { BaseApprovalStore, type IApprovalKey } from '@/common/chat/approval';
import { ToolConfirmationOutcome } from '../agent/gemini/cli/tools/tools';
import { WCoreAgent, type StdioMcpOption } from '@process/agent/wcore';
import type { WCoreCapabilities } from '@process/agent/wcore/protocol';
import { buildSystemInstructionsWithSkillsIndex } from './agentUtils';
import { getDatabase } from '@process/services/database';
import { addMessage, addOrUpdateMessage } from '@process/utils/message';
import { uuid } from '@/common/utils';
import BaseAgentManager from './BaseAgentManager';
import { IpcAgentEventEmitter } from './IpcAgentEventEmitter';
import { mainError, mainLog, mainWarn } from '@process/utils/mainLogger';
import { hasCronCommands } from './CronCommandDetector';
import { processCronInMessage } from './MessageMiddleware';
import { extractAndStripThinkTags } from './ThinkTagDetector';
import { ConversationTurnCompletionService } from './ConversationTurnCompletionService';
import { cronBusyGuard } from '@process/services/cron/CronBusyGuard';
import { skillSuggestWatcher } from '@process/services/cron/SkillSuggestWatcher';

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
  teamMcpStdioConfig?: {
    name: string;
    command: string;
    args: string[];
    env: Array<{ name: string; value: string }>;
  };
};

export class WCoreManager extends BaseAgentManager<WCoreManagerData, string> {
  workspace: string;
  model: TProviderWithModel;
  readonly approvalStore = new WCoreApprovalStore();
  private agent: WCoreAgent | null = null;
  private agentReady: Promise<void>;
  private currentMode: string = 'default';
  private _capabilities: WCoreCapabilities | null = null;
  private _configSentAt: number | null = null;
  private _messageSentAt: number | null = null;
  private currentMsgId: string | null = null;
  private currentMsgContent: string = '';

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
  private thinkingDbFlushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly streamDbFlushIntervalMs: number = 120;

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

    // Start the agent bootstrap - store promise so sendMessage can await it
    this.agentReady = this.start().catch(() => {});
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

    // Prepend Wayland Constitution + specialist overlay AND inject the
    // builtin-skills index + `wayland_search_skills` MCP advert into the
    // system prompt. wcore delivers these via `init_history` as
    // `[Assistant System Rules]\n...` on the first turn. The helper returns
    // undefined when there is nothing to inject (no Constitution, no preset,
    // no skills, no library) - in that case we keep the prior "no
    // presetRules" behaviour for fresh installs. (H1: WCoreManager advertise
    // the second channel.)
    const systemInstructions = await buildSystemInstructionsWithSkillsIndex({
      presetContext: mergedData.presetRules,
      enabledSkills: mergedData.enabledSkills,
      excludeBuiltinSkills: mergedData.excludeBuiltinSkills,
      enableTeamGuide: mergedData.enableTeamGuide,
      backend: 'wcore',
      presetAssistantId: mergedData.presetAssistantId,
    });
    const effectivePresetRules = systemInstructions ?? mergedData.presetRules;

    const agent = new WCoreAgent({
      workspace: mergedData.workspace,
      model: mergedData.model,
      proxy: mergedData.proxy,
      yoloMode: mergedData.yoloMode,
      presetRules: effectivePresetRules,
      maxTokens: mergedData.maxTokens,
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
    this._messageSentAt = Date.now();
    mainLog('[WCoreManager]', `message sent: msg_id=${data.msg_id}`);
    if (this.agent) {
      await this.agent.send(data.content, data.msg_id, data.files);
    }
  }

  /**
   * Check if a confirmation should be auto-approved based on current mode.
   */
  private tryAutoApprove(content: IMessageToolGroup['content'][number]): boolean {
    const type = content.confirmationDetails?.type;

    if (this.currentMode === 'yolo') {
      this.agent?.approveTool(content.callId, 'once');
      return true;
    }
    if (this.currentMode === 'auto_edit') {
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

      // Show confirmation dialog to user
      const options = [
        { label: 'messages.confirmation.yesAllowOnce', value: ToolConfirmationOutcome.ProceedOnce },
        { label: 'messages.confirmation.yesAllowAlways', value: ToolConfirmationOutcome.ProceedAlways },
        { label: 'messages.confirmation.no', value: ToolConfirmationOutcome.Cancel },
      ];

      this.addConfirmation({
        title: content.confirmationDetails?.title || content.name || '',
        id: content.callId,
        action,
        description: content.description || '',
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

  private emitThinkingMessage(content: string, status: 'thinking' | 'done' = 'thinking'): void {
    if (!this.thinkingMsgId) {
      this.thinkingMsgId = uuid();
      this.thinkingStartTime = Date.now();
      this.thinkingContent = '';
    }

    if (status === 'thinking') {
      this.thinkingContent += content;
    }

    const duration = status === 'done' && this.thinkingStartTime ? Date.now() - this.thinkingStartTime : undefined;

    ipcBridge.conversation.responseStream.emit({
      type: 'thinking',
      conversation_id: this.conversation_id,
      msg_id: this.thinkingMsgId,
      data: {
        content,
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
    const tMessage: TMessage = {
      id: this.thinkingMsgId,
      msg_id: this.thinkingMsgId,
      type: 'thinking',
      position: 'left',
      conversation_id: this.conversation_id,
      content: {
        content: this.thinkingContent,
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
   *      `finish_reason: 'length'` in stream_end. Definitive.
   *   2. Heuristic: wayland-core ≤0.1.21 doesn't emit finish_reason, so we infer
   *      truncation when `output_tokens` is at or above 95% of the configured
   *      `maxTokens` AND the visible content is empty/very short. This catches
   *      the Gemini Pro reasoning-token bug today (the wrapper fix in Worker B
   *      raises the budget but edge cases will still hit the ceiling).
   */
  private detectTruncation(data: unknown, content: string): boolean {
    if (!data || typeof data !== 'object') return false;
    const d = data as { finish_reason?: string; output_tokens?: number };

    if (d.finish_reason === 'length') return true;

    const maxTokens = this.data.data.maxTokens;
    if (!maxTokens || typeof d.output_tokens !== 'number') return false;
    const nearBudget = d.output_tokens >= Math.floor(maxTokens * NEAR_BUDGET_RATIO);
    const contentEmpty = content.trim().length < EMPTY_CONTENT_THRESHOLD_CHARS;
    return nearBudget && contentEmpty;
  }

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
      mainError(
        '[WCoreManager]',
        `wcore process unresponsive after ${this.heartbeatMaxMissed} missed pongs, killing`
      );
      this.agent?.kill();
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

      // Handle thought events - convert to thinking messages
      if (data.type === 'thought') {
        data.conversation_id = this.conversation_id;
        const content = typeof data.data === 'string' ? data.data : '';
        if (content) {
          this.emitThinkingMessage(content, 'thinking');
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
        this._messageSentAt = null;
        this.heartbeatActive = false;
        this.heartbeatMissedCount = 0;
        this.saveContextUsage(processedData.data);

        // Capture before handleTurnEnd resets msg state, then emit truncation flag
        // after the turn-end flush so the renderer's text-message merge attaches
        // the flag to the already-accumulated content rather than racing it.
        const truncMsgId = this.detectTruncation(processedData.data, this.currentMsgContent)
          ? this.currentMsgId
          : null;

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

    if (!content || !hasCronCommands(content)) {
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

  confirm(id: string, callId: string, data: string) {
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
        this.agent.approveTool(callId, scope);
      }
    }
  }

  override kill(): Promise<void> {
    if (this.agent) {
      try {
        this.agent.kill();
      } catch {
        // best-effort
      }
    }
    // super.kill() is async (ForkTask M18); return its promise so callers
    // (WorkerTaskManager.clear) can await child exit.
    return Promise.resolve(super.kill());
  }
}
