import type { AcpAgent } from '@process/agent/acp';
import { AcpAgentV2 } from '@process/acp/compat';
import { channelEventBus } from '@process/channels/agent/ChannelEventBus';
import { teamEventBus } from '@process/team/teamEventBus';
import { ipcBridge } from '@/common';
import type { CronMessageMeta, TMessage } from '@/common/chat/chatLib';
import { isCodexAutoApproveMode } from '@/common/types/codex/codexModes';
import { isAutoGuardedMode, shouldAutoApproveAcpEdit } from '@/common/types/agentModes';
import { classifyDestructiveToolCall } from '@/common/security/destructiveCommand';
import type { SlashCommandItem } from '@/common/chat/slash/types';
import { transformMessage } from '@/common/chat/chatLib';
import type { IConfigStorageRefer } from '@/common/config/storage';
import { WAYLAND_FILES_MARKER } from '@/common/config/constants';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { parseError, uuid } from '@/common/utils';
import { claudeSlotForModelId } from '@process/agent/acp/utils';
import type {
  AcpBackend,
  AcpModelInfo,
  AcpPermissionOption,
  AcpPermissionRequest,
  AcpResult,
  AcpBackendConfig,
  AcpSessionConfigOption,
} from '@/common/types/acpTypes';
import { ACP_BACKENDS_ALL, getCurrentWrapperVersion, getFluxCompat } from '@/common/types/acpTypes';
import { isFluxModelId } from '@/common/config/flux';
import { ExtensionRegistry } from '@process/extensions';
import { getDatabase } from '@process/services/database';
import { ProviderRepository } from '@process/providers/storage/ProviderRepository';
import { PROVIDER_ENV_VARS } from '@process/providers/detection/KeyDiscovery';
import type { ProviderId } from '@process/providers/types';
import { BACKEND_AUTH_KEYS } from '@process/acp/compat/typeBridge';
import { selectAuthFailureCulprits } from '@process/providers/detection/authFailure';
import { ProcessConfig } from '@process/utils/initStorage';
import {
  readClaudeModelInfoFromCcSwitch,
  readClaudeModelInfoFromSettings,
} from '@process/services/ccSwitchModelSource';
import { codexBearerEnvVar } from '@process/services/mcpServices/agents/CodexMcpAgent';
import type { IMcpServer } from '@/common/config/storage';
import { addMessage, addOrUpdateMessage, nextTickToLocalFinish } from '@process/utils/message';
import { handlePreviewOpenEvent } from '@process/utils/previewUtils';
import { cronBusyGuard } from '@process/services/cron/CronBusyGuard';
import { mainWarn, mainError } from '@process/utils/mainLogger';
import {
  getCodexSandboxModeForSessionMode,
  materializeFluxCodexHome,
  normalizeCodexSandboxMode,
  type CodexSandboxMode,
  writeCodexSandboxMode,
} from '@process/task/codexConfig';
import { materializeFluxClaudeConfigDir } from '@process/task/claudeConfig';
import { materializeFluxHermesHome } from '@process/task/hermesConfig';
import { app } from 'electron';
import BaseAgentManager from './BaseAgentManager';
import { IpcAgentEventEmitter } from './IpcAgentEventEmitter';
import { hasCronCommands } from './CronCommandDetector';
import { skillSuggestWatcher } from '@process/services/cron/SkillSuggestWatcher';
import { getCostRecorder } from '@process/services/cost/CostRecorder';
import { extractAndStripThinkTags } from './ThinkTagDetector';
import type { AgentKillReason } from './IAgentManager';
import { hasNativeSkillSupport } from '@/common/types/acpTypes';
import {
  prepareFirstMessageWithSkillsIndex,
  buildTurnSkillContext,
  mergeLoadedSkillsExtra,
  consumePendingSessionSkills,
} from '@process/task/agentUtils';
import { composePrompt } from '@process/services/constitution/composePrompt';
import { shouldInjectTeamGuideMcp } from '@process/team/prompts/teamGuideCapability.ts';
import { extractTextFromMessage, processCronInMessage } from './MessageMiddleware';
import { ConversationTurnCompletionService } from './ConversationTurnCompletionService';
import { resolveFluxRouting, type FluxRoutingResult, type RoutingDecision } from '@process/task/fluxRouting';
import { readConnectedFluxKey } from '@process/connectors/fluxKey';

interface AcpAgentManagerData {
  workspace?: string;
  backend: AcpBackend;
  cliPath?: string;
  customWorkspace?: boolean;
  conversation_id: string;
  customAgentId?: string; // UUID for identifying specific custom agent
  /** Preset assistant id (builtin or custom) shown in the conversation header */
  presetAssistantId?: string;
  /** Display name for the agent (from extension or custom config) */
  agentName?: string;
  presetContext?: string; // Preset context from smart assistant
  /** Enabled skills list for filtering SkillManager skills */
  enabledSkills?: string[];
  /** Builtin auto-injected skills to exclude */
  excludeBuiltinSkills?: string[];
  /** Force yolo mode (auto-approve) - used by CronService for scheduled tasks */
  yoloMode?: boolean;
  /** ACP session ID for resume support */
  acpSessionId?: string;
  /** Last update time of ACP session */
  acpSessionUpdatedAt?: number;
  /** Wrapper version pinned when acpSessionId was created (`<backend>@<version>`). */
  acpWrapperVersion?: string;
  /** Persisted session mode for resume support */
  sessionMode?: string;
  /** Persisted model ID for resume support */
  currentModelId?: string;
  sandboxMode?: CodexSandboxMode;
  /** Pending config option selections from Guid page (applied after session creation) */
  pendingConfigOptions?: Record<string, string>;
  /** Per-conversation reasoning effort (codex/claude). Absent => backend default. */
  effort?: 'low' | 'medium' | 'high';
  /** Per-conversation active MCP server ids (#348): undefined = all enabled, [] = none. */
  activeMcpServers?: string[];
}

type BufferedStreamTextMessage = {
  conversationId: string;
  backend: AcpBackend;
  message: Extract<TMessage, { type: 'text' }>;
  timer: ReturnType<typeof setTimeout>;
};

type CustomAgentLaunchConfig = Pick<AcpBackendConfig, 'id' | 'name' | 'defaultCliPath' | 'acpArgs' | 'env'>;

class AcpAgentManager extends BaseAgentManager<AcpAgentManagerData, AcpPermissionOption> {
  workspace: string;
  agent: AcpAgentV2;
  private bootstrap: Promise<AcpAgentV2> | undefined;
  private bootstrapping: boolean = false;
  private isFirstMessage: boolean = true;
  options: AcpAgentManagerData;
  private currentMode: string = 'default';
  private persistedModelId: string | null = null;
  /**
   * Latest cumulative usage gauge from `acp_context_usage` this turn. ACP emits
   * `used`/`cost` as a per-conversation CUMULATIVE high-water mark on every
   * update, so we stash the most recent values and let the CostRecorder compute
   * the per-turn delta at finish. `undefined` until the first usage event of a
   * turn; reset to undefined after each finish records (or skips) it so a turn
   * with no usage event records nothing.
   */
  private lastAcpCumulative: { used?: number; cost?: number } | undefined;
  // Track current message for cron detection (accumulated from streaming chunks)
  private currentMsgId: string | null = null;
  private currentMsgContent: string = '';
  /** Current turn's thinking message msg_id for accumulating content */
  private thinkingMsgId: string | null = null;
  /** Timestamp when thinking started for duration calculation */
  private thinkingStartTime: number | null = null;
  /** Accumulated thinking content for persistence */
  private thinkingContent: string = '';
  private thinkingDbFlushTimer: ReturnType<typeof setTimeout> | null = null;
  private acpAvailableSlashCommands: SlashCommandItem[] = [];
  private acpAvailableSlashWaiters: Array<(commands: SlashCommandItem[]) => void> = [];
  private readonly streamDbFlushIntervalMs = 120;
  private readonly bufferedStreamTextMessages = new Map<string, BufferedStreamTextMessage>();
  private nextTrackedTurnId: number = 0;
  private activeTrackedTurnId: number | null = null;
  private activeTrackedTurnHasRuntimeActivity: boolean = false;
  private readonly completedTrackedTurnIds = new Set<number>();
  private missingFinishFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private missingFinishFallbackTurnId: number | null = null;
  private readonly missingFinishFallbackDelayMs = 15000;
  /** True while `agent.sendMessage()` is awaiting (prompt in flight).
   *  The idle-finish fallback timer is suppressed during this window because
   *  long tool-call gaps (>15 s) between stream events are normal and do not
   *  indicate a missing finish signal. */
  private promptInFlight: boolean = false;

  constructor(data: AcpAgentManagerData) {
    super('acp', data, new IpcAgentEventEmitter(), false);
    this.conversation_id = data.conversation_id;
    this.workspace = data.workspace;
    this.options = data;
    this.currentMode = data.sessionMode || 'default';
    this.persistedModelId = data.currentModelId || null;
    this.status = 'pending';
    // Sync yoloMode from sessionMode so addConfirmation auto-approves when Full Auto is selected
    this.yoloMode = this.yoloMode || this.isYoloMode(this.currentMode);
  }

  private makeStreamBufferKey(message: Extract<TMessage, { type: 'text' }>): string {
    return `${message.conversation_id}:${message.msg_id || message.id}`;
  }

  private queueBufferedStreamTextMessage(message: Extract<TMessage, { type: 'text' }>, backend: AcpBackend): void {
    const key = this.makeStreamBufferKey(message);
    const existing = this.bufferedStreamTextMessages.get(key);
    if (existing) {
      this.bufferedStreamTextMessages.set(key, {
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

    const bufferedMessage: Extract<TMessage, { type: 'text' }> = {
      ...message,
      content: { ...message.content },
    };
    const timer = setTimeout(() => {
      this.flushBufferedStreamTextMessage(key);
    }, this.streamDbFlushIntervalMs);

    this.bufferedStreamTextMessages.set(key, {
      conversationId: message.conversation_id,
      backend,
      message: bufferedMessage,
      timer,
    });
  }

  private flushBufferedStreamTextMessage(key: string): void {
    const buffered = this.bufferedStreamTextMessages.get(key);
    if (!buffered) return;

    clearTimeout(buffered.timer);
    this.bufferedStreamTextMessages.delete(key);
    addOrUpdateMessage(buffered.conversationId, buffered.message, buffered.backend);
  }

  private flushBufferedStreamTextMessages(): void {
    if (this.bufferedStreamTextMessages.size === 0) return;
    const keys = Array.from(this.bufferedStreamTextMessages.keys());
    for (const key of keys) {
      this.flushBufferedStreamTextMessage(key);
    }
  }

  private beginTrackedTurn(): number {
    this.clearMissingFinishFallback();
    const turnId = this.nextTrackedTurnId + 1;
    this.nextTrackedTurnId = turnId;
    this.activeTrackedTurnId = turnId;
    this.activeTrackedTurnHasRuntimeActivity = false;
    return turnId;
  }

  private markTrackedTurnFinished(turnId: number): void {
    if (this.activeTrackedTurnId === turnId) {
      this.activeTrackedTurnId = null;
      this.activeTrackedTurnHasRuntimeActivity = false;
      this.clearMissingFinishFallback();
    }
    this.completedTrackedTurnIds.add(turnId);
  }

  private markActiveTurnFinished(): void {
    if (this.activeTrackedTurnId !== null) {
      this.markTrackedTurnFinished(this.activeTrackedTurnId);
    }
  }

  private consumeTrackedTurnFinished(turnId: number): boolean {
    const hasFinished = this.completedTrackedTurnIds.has(turnId);
    if (hasFinished) {
      if (this.activeTrackedTurnId === turnId) {
        this.activeTrackedTurnId = null;
      }
      this.completedTrackedTurnIds.delete(turnId);
    }
    return hasFinished;
  }

  private clearTrackedTurn(turnId: number): void {
    if (this.activeTrackedTurnId === turnId) {
      this.activeTrackedTurnId = null;
      this.activeTrackedTurnHasRuntimeActivity = false;
      this.clearMissingFinishFallback();
    }
    this.completedTrackedTurnIds.delete(turnId);
  }

  private markTrackedTurnRuntimeActivity(): void {
    this._lastActivityAt = Date.now();

    if (this.activeTrackedTurnId === null) {
      return;
    }

    this.activeTrackedTurnHasRuntimeActivity = true;
    this.scheduleMissingFinishFallback();
  }

  private clearMissingFinishFallback(): void {
    if (this.missingFinishFallbackTimer) {
      clearTimeout(this.missingFinishFallbackTimer);
      this.missingFinishFallbackTimer = null;
    }
    this.missingFinishFallbackTurnId = null;
  }

  private scheduleMissingFinishFallback(): void {
    const turnId = this.activeTrackedTurnId;
    if (turnId === null) {
      return;
    }

    // While the prompt is still awaiting (`agent.sendMessage()` hasn't resolved),
    // don't schedule the idle timer.  Long gaps between stream events are normal
    // during tool-call execution (e.g. Codex running shell commands).  The timer
    // is only meaningful *after* sendMessage resolves without a finish signal.
    if (this.promptInFlight) {
      return;
    }

    this.clearMissingFinishFallback();
    this.missingFinishFallbackTurnId = turnId;
    this.missingFinishFallbackTimer = setTimeout(() => {
      void this.handleMissingFinishFallback(turnId);
    }, this.missingFinishFallbackDelayMs);
  }

  private async handleMissingFinishFallback(turnId: number): Promise<void> {
    if (this.missingFinishFallbackTurnId !== turnId) {
      return;
    }

    this.clearMissingFinishFallback();
    if (this.activeTrackedTurnId !== turnId || this.completedTrackedTurnIds.has(turnId)) {
      return;
    }

    if (this.getConfirmations().length > 0) {
      return;
    }

    this.markTrackedTurnFinished(turnId);
    mainWarn(
      '[AcpAgentManager]',
      `ACP turn became idle without finish signal; synthesizing finish for ${this.conversation_id} (${this.options.backend})`
    );

    await this.handleFinishSignal(
      {
        type: 'finish',
        conversation_id: this.conversation_id,
        msg_id: uuid(),
        data: null,
      },
      this.options.backend,
      { trackActiveTurn: false }
    );
  }

  private async handleFinishSignal(
    message: IResponseMessage,
    backend: AcpBackend,
    options: { trackActiveTurn?: boolean } = {}
  ): Promise<void> {
    if (options.trackActiveTurn !== false) {
      this.markActiveTurnFinished();
    }
    this.clearMissingFinishFallback();
    this.flushBufferedStreamTextMessages();

    cronBusyGuard.setProcessing(this.conversation_id, false);
    this.status = 'finished';

    if (this.thinkingMsgId) {
      this.emitThinkingMessage('', 'done');
      this.thinkingMsgId = null;
      this.thinkingStartTime = null;
      this.thinkingContent = '';
    }

    skillSuggestWatcher.onFinish(this.conversation_id);

    if (this.currentMsgContent && hasCronCommands(this.currentMsgContent)) {
      const cronMessage: TMessage = {
        id: this.currentMsgId || uuid(),
        msg_id: this.currentMsgId || uuid(),
        type: 'text',
        position: 'left',
        conversation_id: this.conversation_id,
        content: { content: this.currentMsgContent },
        status: 'finish',
        createdAt: Date.now(),
      };
      const collectedResponses: string[] = [];
      await processCronInMessage(this.conversation_id, backend, cronMessage, (sysMsg) => {
        collectedResponses.push(sysMsg);
        const systemMessage: IResponseMessage = {
          type: 'system',
          conversation_id: this.conversation_id,
          msg_id: uuid(),
          data: sysMsg,
        };
        ipcBridge.acpConversation.responseStream.emit(systemMessage);
      });
      if (collectedResponses.length > 0 && this.agent) {
        const feedbackMessage = `[System Response]
${collectedResponses.join('\n')}`;
        await this.agent.sendMessage({ content: feedbackMessage });
      }
    }

    this.currentMsgId = null;
    this.currentMsgContent = '';

    const finishMessage: IResponseMessage = {
      ...(message as IResponseMessage),
      conversation_id: this.conversation_id,
    };
    ipcBridge.acpConversation.responseStream.emit(finishMessage);
    teamEventBus.emit('responseStream', finishMessage);
    channelEventBus.emitAgentMessage(this.conversation_id, finishMessage);

    void ConversationTurnCompletionService.getInstance().notifyPotentialCompletion(this.conversation_id, {
      status: this.status ?? 'finished',
      workspace: this.workspace,
      backend: this.options.backend,
      pendingConfirmations: this.getConfirmations().length,
      modelId: this.persistedModelId ?? this.agent?.getModelInfo?.()?.currentModelId ?? undefined,
    });

    // Cost ledger: ACP backends report `used`/`cost` as a per-conversation
    // CUMULATIVE gauge, so we pass the latest high-water mark and the recorder
    // computes the per-turn delta from its baseline (cost_source='engine'). Skip
    // entirely when no acp_context_usage arrived this turn so a no-usage turn
    // records nothing. Reset the stash so the next turn starts clean.
    const cumulative = this.lastAcpCumulative;
    this.lastAcpCumulative = undefined;
    if (cumulative && (cumulative.used !== undefined || cumulative.cost !== undefined)) {
      getCostRecorder()?.recordTurnFinish({
        conversationId: this.conversation_id,
        backend: this.options.backend,
        modelId: this.persistedModelId ?? this.agent?.getModelInfo?.()?.currentModelId ?? undefined,
        costSource: 'engine',
        cumulativeUsd: cumulative.cost,
        cumulativeTokens: cumulative.used,
        ts: Date.now(),
      });
    }
  }

  private async sendAgentMessageWithFinishFallback(
    data: Parameters<AcpAgent['sendMessage']>[0] & Record<string, unknown>
  ): Promise<AcpResult> {
    const turnId = this.beginTrackedTurn();
    this.promptInFlight = true;

    try {
      const result = await this.agent.sendMessage(data);
      this.promptInFlight = false;

      // The agent turn failed (provider 5xx/429/disconnect after the backend's
      // internal retries, auth error, etc.). Surface it to the conversation so
      // the user sees what went wrong instead of a spinner that silently clears
      // with no answer, then synthesize a finish to release the loading state.
      if (!result.success) {
        const turnError = (result as { error?: { message?: string } }).error;
        this.emitTurnError(turnError, (data as { msg_id?: string }).msg_id);
        // Release the loading state. The backend may already have emitted a
        // finish (consumeTrackedTurnFinished) - only synthesize one if not, to
        // avoid a double finish.
        if (!this.consumeTrackedTurnFinished(turnId)) {
          this.clearTrackedTurn(turnId);
          await this.handleFinishSignal(
            {
              type: 'finish',
              conversation_id: this.conversation_id,
              msg_id: (data as { msg_id?: string }).msg_id || uuid(),
              data: null,
            },
            this.options.backend,
            { trackActiveTurn: false }
          );
        }
        return result;
      }

      if (this.consumeTrackedTurnFinished(turnId)) {
        return result;
      }

      if (this.activeTrackedTurnId === turnId && this.activeTrackedTurnHasRuntimeActivity) {
        // Finish signal hasn't arrived yet but prompt resolved and there was
        // runtime activity.  Now that promptInFlight is false the idle timer
        // can be armed to catch a genuinely missing finish signal.
        this.scheduleMissingFinishFallback();
        return result;
      }

      this.clearTrackedTurn(turnId);
      mainWarn(
        '[AcpAgentManager]',
        `ACP turn resolved without runtime activity or finish signal; synthesizing finish for ${this.conversation_id} (${this.options.backend})`
      );
      await this.handleFinishSignal(
        {
          type: 'finish',
          conversation_id: this.conversation_id,
          msg_id: (data as { msg_id?: string }).msg_id || uuid(),
          data: null,
        },
        this.options.backend,
        { trackActiveTurn: false }
      );
      return result;
    } catch (error) {
      this.promptInFlight = false;
      this.clearTrackedTurn(turnId);
      throw error;
    }
  }

  /**
   * Surface a failed agent turn to the conversation (and any bound channels) as
   * a visible error message. Without this, a provider 5xx/429/auth/disconnect
   * failure that the backend returns (rather than throws) leaves the user with a
   * spinner that clears and no answer.
   */
  private emitTurnError(error: { message?: string } | undefined, msgId?: string): void {
    const detail = error?.message ? String(error.message) : 'The agent could not complete this request.';
    // If the turn failed because an injected provider key was rejected, disable it
    // so the next spawn falls back to the backend's native auth.
    this.maybeInvalidateProviderKeyOnAuthError(detail);
    const message = {
      type: 'error' as const,
      conversation_id: this.conversation_id,
      msg_id: msgId ? `${msgId}_error` : `turn_error_${uuid()}`,
      data: detail,
    };
    ipcBridge.acpConversation.responseStream.emit(message);
    channelEventBus.emitAgentMessage(this.conversation_id, message);
  }

  /**
   * Check native skill support: for builtin backends, consult ACP_BACKENDS_ALL;
   * for extension agents, check the adapter's skillsDirs from the manifest.
   */
  private resolveNativeSkillSupport(): boolean {
    if (hasNativeSkillSupport(this.options.backend)) return true;

    // For extension agents (backend: 'custom'), check the adapter's skillsDirs
    if (this.options.backend === 'custom' && this.options.customAgentId?.startsWith('ext:')) {
      try {
        const [, extensionName, ...idParts] = this.options.customAgentId.split(':');
        const adapterId = idParts.join(':');
        const adapter = ExtensionRegistry.getInstance()
          .getAcpAdapters()
          .find((item) => {
            const r = item as Record<string, unknown>;
            return r._extensionName === extensionName && r.id === adapterId;
          }) as Record<string, unknown> | undefined;
        if (adapter && Array.isArray(adapter.skillsDirs) && adapter.skillsDirs.length > 0) {
          return true;
        }
      } catch {
        // ExtensionRegistry not available
      }
    }

    return false;
  }

  // ── Config resolution helpers for initAgent ──────────────────────────

  /**
   * Resolve agent CLI configuration based on backend type.
   * Dispatches to custom or built-in resolution.
   */
  /**
   * Build the scoped env vars Codex reads HTTP MCP bearer tokens from. For each
   * enabled hosted MCP server, fetch the current OAuth token (getValidToken
   * refreshes when expired) and map it to the deterministic env-var name. Never
   * throws and never blocks a spawn on a single failure.
   */
  private async buildCodexMcpBearerEnv(): Promise<Record<string, string>> {
    const env: Record<string, string> = {};
    try {
      const raw = await ProcessConfig.get('mcp.config');
      if (!Array.isArray(raw)) return env;
      const hosted = (raw as IMcpServer[]).filter(
        (s) => s?.enabled && (s.transport?.type === 'http' || s.transport?.type === 'streamable_http')
      );
      if (hosted.length === 0) return env;
      // Dynamic import avoids an OAuth module-init cycle (HybridTokenStorage TDZ).
      const { mcpOAuthService } = await import('@process/services/mcpServices/McpOAuthService');
      const tokens = await Promise.all(
        hosted.map((s) => mcpOAuthService.getValidToken(s).catch((): string | null => null))
      );
      hosted.forEach((server, i) => {
        const token = tokens[i];
        if (token) env[codexBearerEnvVar(server.name)] = token;
      });
    } catch (err) {
      mainWarn('[AcpAgentManager]', 'buildCodexMcpBearerEnv failed', err);
    }
    return env;
  }

  private async resolveAgentCliConfig(data: AcpAgentManagerData): Promise<{
    cliPath?: string;
    customArgs?: string[];
    customEnv?: Record<string, string>;
    yoloMode?: boolean;
  }> {
    const resolved = data.customAgentId
      ? await this.resolveCustomAgentCliConfig(data)
      : await this.resolveBuiltinBackendConfig(data);

    // Bridge connected-provider API keys (from the in-app model registry) into
    // the spawned agent's env. A custom agent's explicit env wins over the
    // auto-injected keys, which in turn win over the inherited shell env.
    const providerEnv = await this.buildConnectedProviderEnv();
    const mergedEnv: Record<string, string> = { ...providerEnv, ...resolved.customEnv };

    // Codex ignores manual Authorization headers and reads each HTTP MCP server's
    // bearer from an env var (see CodexMcpAgent.codexBearerEnvVar). Inject the
    // CURRENT (refreshed) token for every enabled hosted MCP so a Codex chat
    // connects without launching its OWN interactive OAuth flow. Best-effort and
    // scoped to this spawn; an explicit custom-agent env var still wins.
    if (data.backend === 'codex') {
      const bearerEnv = await this.buildCodexMcpBearerEnv();
      for (const [key, value] of Object.entries(bearerEnv)) {
        if (!(key in mergedEnv)) mergedEnv[key] = value;
      }
    }

    // Flux routing (openai-surface generic backends + claude via the anthropic
    // surface; codex/codebuddy route separately).
    const decision = await this.computeFluxRouting(data.backend, data.currentModelId ?? undefined);
    this.lastRouting = decision.routing;
    if (decision.routing === 'flux') {
      for (const k of decision.stripKeys) delete mergedEnv[k];
      Object.assign(mergedEnv, decision.env);

      // codex selects its provider from CODEX_HOME/config.toml, not from env.
      // Point flux-routed codex spawns at a Wayland-scoped CODEX_HOME whose
      // config selects model_provider=flux + flux-auto, so the user's real
      // ~/.codex config stays native for non-flux model picks.
      if (data.backend === 'codex') {
        try {
          const sandboxMode = normalizeCodexSandboxMode(data.sandboxMode);
          const codexHome = await materializeFluxCodexHome(
            app.getPath('userData'),
            sandboxMode,
            undefined,
            undefined,
            data.effort
          );
          mergedEnv.CODEX_HOME = codexHome;
        } catch (err) {
          mainWarn('[AcpAgentManager]', 'materializeFluxCodexHome failed', err);
        }
      }

      // claude's bridge only accepts the (non-SDK) `flux-auto` id when it is in
      // the `availableModels` allowlist of <CLAUDE_CONFIG_DIR>/settings.json.
      // Point flux-routed claude spawns at a Wayland-scoped CLAUDE_CONFIG_DIR
      // (seeded from the user's real settings.json) that lists the Flux ids, so
      // ANTHROPIC_MODEL=flux-auto resolves instead of falling back to the
      // `default` slot (which the Flux Anthropic surface rejects). The user's
      // real ~/.claude is never modified.
      if (data.backend === 'claude') {
        try {
          mergedEnv.CLAUDE_CONFIG_DIR = await materializeFluxClaudeConfigDir(
            app.getPath('userData'),
            undefined,
            data.effort
          );
        } catch (err) {
          mainWarn('[AcpAgentManager]', 'materializeFluxClaudeConfigDir failed', err);
        }
      }

      // hermes selects its provider from <HERMES_HOME>/config.yaml, not from env.
      // Point flux-routed hermes spawns at a Wayland-scoped HERMES_HOME whose
      // config pins model.provider=custom at the Flux openai surface + flux-auto
      // (reading FLUX_API_KEY at request time), so the user's real ~/.hermes
      // config (and active profile) stays native for non-flux model picks.
      if (data.backend === 'hermes') {
        try {
          // hermes ignores FLUX_API_KEY for a custom provider, so the connector
          // writes the connected flux key inline into the scoped config.
          mergedEnv.HERMES_HOME = await materializeFluxHermesHome(
            app.getPath('userData'),
            decision.env.FLUX_API_KEY ?? ''
          );
        } catch (err) {
          mainWarn('[AcpAgentManager]', 'materializeFluxHermesHome failed', err);
        }
      }
    }

    // Native (non-Flux) claude slot picks (sonnet/opus/haiku) get no model list
    // from the bridge under subscription/OAuth auth, so an in-place set_model is
    // unreliable. Back the pick with ANTHROPIC_MODEL at spawn so the chosen slot
    // actually runs (#184). Flux routing already injected its own model above.
    if (data.backend === 'claude' && decision.routing !== 'flux') {
      const slot = claudeSlotForModelId(data.currentModelId);
      if (slot) {
        mergedEnv.ANTHROPIC_MODEL = slot;
      }
    }

    if (Object.keys(mergedEnv).length > 0) {
      return { ...resolved, customEnv: mergedEnv };
    }
    return resolved;
  }

  /**
   * Bridge connected-provider API keys (from the in-app model registry) into a
   * spawned agent's environment under each provider's well-known env var name.
   *
   * Why: ACP backends inherit the user's full shell env. When the shell exports
   * a STALE key (e.g. an old OPENROUTER_API_KEY left in ~/.zshrc), it silently
   * overrides the valid key the user connected in-app, and the CLI fails - qwen
   * routes Qwen models through OpenRouter and a stale key yields "401 User not
   * found". The registry is the source of truth (a connected provider passed
   * live validation), so its key must win. We inject via customEnv, which
   * createSpawnConfig applies OVER the shell env (Object.assign last).
   */
  /**
   * Provider keys injected into the most recent spawn (providerId + the env vars
   * it set). Used to invalidate exactly the offending provider on an auth failure
   * (see maybeInvalidateProviderKeyOnAuthError) so a dead key stops overriding the
   * backend's native (subscription/OAuth) auth on the next spawn.
   */
  private injectedProviderKeys: Array<{ providerId: ProviderId; envVars: readonly string[] }> = [];

  private async buildConnectedProviderEnv(): Promise<Record<string, string>> {
    const env: Record<string, string> = {};
    this.injectedProviderKeys = [];
    try {
      const db = await getDatabase();
      const repo = new ProviderRepository(db.getDriver());
      for (const provider of repo.listRegistryProviders()) {
        if (provider.state !== 'connected') continue;
        const envVars = PROVIDER_ENV_VARS[provider.providerId];
        if (!envVars || envVars.length === 0) continue;
        const stored = repo.getRegistryProviderCreds(provider.providerId);
        if (stored.status !== 'ok') continue;
        // Stored API-key creds carry the key under `key` (see
        // modelRegistryIpc transformCredsToPayload), not `apiKey`.
        const apiKey = stored.creds.key;
        if (typeof apiKey !== 'string' || apiKey.length === 0) continue;
        for (const name of envVars) env[name] = apiKey;
        this.injectedProviderKeys.push({ providerId: provider.providerId, envVars });
      }
    } catch (err) {
      mainWarn('[AcpAgentManager]', 'buildConnectedProviderEnv failed', err);
    }
    return env;
  }

  /**
   * A spawned backend can authenticate against an injected provider API key OR
   * its own native login (subscription/OAuth). When the injected key is invalid,
   * the CLI prefers it and fails with "Invalid API key" (and the desktop user
   * sees a cryptic "process exited (code: 0)"). On that specific failure, flip
   * the offending provider to `error/unauthorized` so buildConnectedProviderEnv
   * stops injecting it next spawn and the backend falls back to native auth.
   *
   * Deliberately conservative: only fires on unambiguous key-auth failures (not
   * transient 429/5xx/network), and only invalidates the provider whose injected
   * env var matches THIS backend's auth var (a claude spawn also injects
   * openai/google keys; those must not be touched). Reversible: re-keying the
   * provider runs a connection test and restores `connected`.
   */
  private maybeInvalidateProviderKeyOnAuthError(errorData: unknown): void {
    if (this.injectedProviderKeys.length === 0) return;
    const text = typeof errorData === 'string' ? errorData : '';
    const backendAuthVars = BACKEND_AUTH_KEYS[this.options.backend] ?? [];
    const culpritIds = selectAuthFailureCulprits(text, backendAuthVars, this.injectedProviderKeys);
    if (culpritIds.length === 0) return;

    void (async () => {
      try {
        const db = await getDatabase();
        const repo = new ProviderRepository(db.getDriver());
        for (const providerId of culpritIds) {
          repo.updateRegistryProviderState(providerId, 'error', 'unauthorized');
          mainWarn(
            '[AcpAgentManager]',
            `Provider '${providerId}' key rejected by backend '${this.options.backend}' ` +
              '(Invalid API key); marked error/unauthorized and will not be injected next spawn ' +
              '(falling back to native auth). Re-key the provider to restore it.'
          );
        }
        // Drop them from this spawn's record so we don't re-invalidate on repeats.
        const culpritSet = new Set<ProviderId>(culpritIds);
        this.injectedProviderKeys = this.injectedProviderKeys.filter((inj) => !culpritSet.has(inj.providerId));
      } catch (err) {
        mainWarn('[AcpAgentManager]', 'maybeInvalidateProviderKeyOnAuthError failed', err);
      }
    })();
  }

  /** Routing decision for the most recent spawn - surfaced on request_trace (badge). */
  private lastRouting: RoutingDecision = 'unknown';

  /**
   * Compute the Flux routing decision for a given backend + selected model using
   * the SAME inputs the spawn path (`resolveAgentCliConfig`) uses. Centralizing
   * this keeps the spawn-time env and the model-change boundary check in lockstep:
   * a model switch that would change `routing` (native<->flux) is exactly a switch
   * that would change the injected env, so the agent must be re-spawned.
   */
  private async computeFluxRouting(backend: string, selectedModelId: string | undefined): Promise<FluxRoutingResult> {
    const fluxKey = await this.readFluxKey();
    const routeThroughFlux = (await ProcessConfig.get('system.routeThroughFlux')) ?? false;
    return resolveFluxRouting({
      backend,
      selectedModelId,
      fluxConnected: Boolean(fluxKey),
      fluxKey,
      routeThroughFlux: Boolean(routeThroughFlux),
    });
  }

  /** The connected flux-router key, or undefined when not connected (R13 safety gate). */
  private async readFluxKey(): Promise<string | undefined> {
    return readConnectedFluxKey();
  }

  /**
   * Resolve CLI config for a custom agent backend.
   * Looks up assistants config by UUID, falling back to extension-contributed adapters.
   */
  private async resolveCustomAgentCliConfig(data: AcpAgentManagerData): Promise<{
    cliPath?: string;
    customArgs?: string[];
    customEnv?: Record<string, string>;
  }> {
    const customAgents = await ProcessConfig.get('assistants');
    let customAgentConfig: CustomAgentLaunchConfig | undefined = customAgents?.find(
      (agent) => agent.id === data.customAgentId
    );

    // Fallback: extension adapter (customAgentId format: ext:{extensionName}:{adapterId})
    if (!customAgentConfig && data.customAgentId!.startsWith('ext:')) {
      const [, extensionName, ...idParts] = data.customAgentId!.split(':');
      const adapterId = idParts.join(':');
      const adapter = ExtensionRegistry.getInstance()
        .getAcpAdapters()
        .find((item) => {
          const record = item as Record<string, unknown>;
          return record._extensionName === extensionName && record.id === adapterId;
        }) as Record<string, unknown> | undefined;

      if (adapter) {
        customAgentConfig = {
          id: data.customAgentId,
          name: typeof adapter.name === 'string' ? adapter.name : data.customAgentId,
          defaultCliPath: typeof adapter.defaultCliPath === 'string' ? adapter.defaultCliPath : undefined,
          acpArgs: Array.isArray(adapter.acpArgs)
            ? adapter.acpArgs.filter((v): v is string => typeof v === 'string')
            : undefined,
          env: typeof adapter.env === 'object' && adapter.env ? (adapter.env as Record<string, string>) : undefined,
        };
      }
    }

    if (!customAgentConfig?.defaultCliPath) {
      return { cliPath: data.cliPath };
    }

    return {
      cliPath: customAgentConfig.defaultCliPath.trim(),
      customArgs: customAgentConfig.acpArgs,
      customEnv: customAgentConfig.env,
    };
  }

  /**
   * Resolve CLI config for a built-in backend (claude, qwen, codex, etc.).
   * Also handles yoloMode migration and codex sandbox mode.
   */
  private async resolveBuiltinBackendConfig(data: AcpAgentManagerData): Promise<{
    cliPath?: string;
    customArgs?: string[];
    customEnv?: Record<string, string>;
    yoloMode?: boolean;
  }> {
    const config = await ProcessConfig.get('acp.config');
    const codexConfig = data.backend === 'codex' ? await ProcessConfig.get('codex.config') : undefined;

    let cliPath = data.cliPath;
    if (!cliPath && config?.[data.backend]?.cliPath) {
      cliPath = config[data.backend].cliPath;
    }

    // yoloMode priority: data.yoloMode (from CronService) > config setting
    const legacyYoloMode = data.yoloMode ?? config?.[data.backend]?.yoloMode;

    // Migrate legacy yoloMode config (from SecurityModalContent) to currentMode.
    // Maps to each backend's native yolo mode value for correct protocol behavior.
    // Skip when sessionMode was explicitly provided (user made a choice on Guid page).
    if (legacyYoloMode && this.currentMode === 'default' && !data.sessionMode) {
      const yoloModeValues: Record<string, string> = {
        claude: 'bypassPermissions',
        qwen: 'yolo',
        codex: 'yolo',
      };
      this.currentMode = yoloModeValues[data.backend] || 'yolo';
      this.yoloMode = true;
    }

    // When legacy config has yoloMode=true but user explicitly chose a non-yolo mode
    // on the Guid page, clear the legacy config so it won't re-activate next time.
    if (legacyYoloMode && data.sessionMode && !this.isYoloMode(data.sessionMode)) {
      void this.clearLegacyYoloConfig();
    }

    // Derive effective yoloMode from currentMode so that the agent respects
    // the user's explicit mode choice. data.yoloMode (cron jobs) always takes priority.
    const yoloMode = data.yoloMode ?? this.isYoloMode(this.currentMode);

    // Get acpArgs from backend config (for goose, auggie, opencode, etc.)
    const backendConfig = ACP_BACKENDS_ALL[data.backend];
    let customArgs: string[] | undefined;
    if (backendConfig?.acpArgs) {
      customArgs = backendConfig.acpArgs;
    }

    // If cliPath is not configured, fallback to default cliCommand from ACP_BACKENDS_ALL
    if (!cliPath && backendConfig?.cliCommand) {
      cliPath = backendConfig.cliCommand;
    }

    if (data.backend === 'codex') {
      const sandboxMode = getCodexSandboxModeForSessionMode(
        data.sessionMode || this.currentMode,
        data.sandboxMode || codexConfig?.sandboxMode || 'workspace-write'
      ) as CodexSandboxMode;
      await writeCodexSandboxMode(sandboxMode);
      data.sandboxMode = sandboxMode;
    }

    return { cliPath, customArgs, yoloMode };
  }

  // ── initAgent callback handlers ──────────────────────────────────────

  /**
   * Handle ACP agent's available slash commands update.
   * Deduplicates commands, caches them, and notifies the frontend.
   */
  private handleAvailableCommandsUpdate(commands: Array<{ name: string; description?: string; hint?: string }>): void {
    const nextCommands: SlashCommandItem[] = [];
    const seen = new Set<string>();
    for (const command of commands) {
      const name = command.name.trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      nextCommands.push({
        name,
        description: command.description || name,
        hint: command.hint,
        kind: 'template',
        source: 'acp',
      });
    }
    this.acpAvailableSlashCommands = nextCommands;
    const waiters = this.acpAvailableSlashWaiters.splice(0, this.acpAvailableSlashWaiters.length);
    for (const resolve of waiters) {
      resolve(this.getAcpSlashCommands());
    }

    // Notify frontend that slash commands are now available.
    // During bootstrap, agent_status events are suppressed, so the
    // frontend acpStatus never updates and useSlashCommands never
    // re-fetches. This dedicated event bypasses the bootstrap filter.
    ipcBridge.acpConversation.responseStream.emit({
      type: 'slash_commands_updated',
      conversation_id: this.conversation_id,
      msg_id: '',
      data: null,
    });
  }

  /**
   * Handle stream events from the ACP agent.
   * Processes thinking, content, status, and tool call messages through the
   * full pipeline: filter → transform → persist → emit to all buses.
   */
  private handleStreamEvent(message: IResponseMessage, backend: AcpBackend): void {
    // During bootstrap (warmup or session/load replay), suppress UI stream
    // events to avoid (a) triggering sidebar loading spinner before user
    // sends a message and (b) re-inserting replayed turns as new SQLite rows
    // on ACP session resume (upstream #2887 / H9).
    //
    // Allowlist: `agent_status` frames are emitted directly to the IPC bus
    // (no transform / no DB write) so init progress remains visible to the UI
    // while replayed content events stay gated.
    if (this.bootstrapping) {
      if (message.type === 'agent_status') {
        ipcBridge.acpConversation.responseStream.emit(message);
      }
      return;
    }

    this.markTrackedTurnRuntimeActivity();

    const pipelineStart = Date.now();

    // Reduce status noise: show full lifecycle only for the first turn.
    // After first turn, only keep failure statuses to avoid reconnect chatter.
    if (message.type === 'agent_status') {
      const status = (message.data as { status?: string } | null)?.status;
      const shouldDisplayStatus = this.isFirstMessage || status === 'error' || status === 'disconnected';
      if (!shouldDisplayStatus) return;
    }

    // Handle preview_open event (chrome-devtools navigation interception)
    if (handlePreviewOpenEvent(message)) return;

    // Mark as finished when content is output (visible to user)
    const contentTypes = ['content', 'agent_status', 'acp_tool_call', 'plan'];
    if (contentTypes.includes(message.type)) {
      this.status = 'finished';
    }

    // Emit request trace on each model generation start
    if (message.type === 'start') {
      const modelInfo = this.agent?.getModelInfo();
      ipcBridge.acpConversation.responseStream.emit({
        type: 'request_trace',
        conversation_id: this.conversation_id,
        msg_id: uuid(),
        data: {
          agentType: 'acp' as const,
          backend,
          modelId: modelInfo?.currentModelId || this.persistedModelId || 'unknown',
          cliPath: this.options?.cliPath,
          sessionMode: this.currentMode,
          routing: this.lastRouting,
          timestamp: Date.now(),
        },
      });
    }

    // Persist config options to DB so AcpConfigSelector can render from cache
    if (message.type === 'acp_model_info') {
      const configOptions = this.getConfigOptions();
      if (configOptions.length > 0) {
        void this.saveConfigOptions(configOptions);
      }
    }

    // Persist context usage to conversation extra for restore on page switch.
    // Also stash the cumulative {used, cost} gauge so handleFinishSignal can
    // record the per-turn delta to the cost ledger (cost_source='engine').
    if (message.type === 'acp_context_usage') {
      const usage = message.data as { used: number; size: number; cost?: { amount?: number; currency?: string } };
      this.saveContextUsage(usage);
      this.lastAcpCumulative = {
        used: typeof usage.used === 'number' ? usage.used : this.lastAcpCumulative?.used,
        cost: typeof usage.cost?.amount === 'number' ? usage.cost.amount : this.lastAcpCumulative?.cost,
      };
    }

    // Convert thought events to thinking messages in conversation flow
    if (message.type === 'thought') {
      const thoughtData = message.data as { subject?: string; description?: string };
      const content = thoughtData?.description || thoughtData?.subject || '';
      if (content) {
        this.emitThinkingMessage(content, 'thinking');
      }
    } else if (this.thinkingMsgId) {
      // Any non-thought message means thinking phase is over
      this.emitThinkingMessage('', 'done');
      this.thinkingMsgId = null;
      this.thinkingStartTime = null;
      this.thinkingContent = '';
    }

    // Strip inline <think> tags from content messages BEFORE transform/DB/emit
    // so thinking appears before main content and DB stores clean text
    // (e.g. MiniMax models embed think tags in content)
    let processedMessage = message;
    if (message.type === 'content' && typeof message.data === 'string') {
      const { thinking, content: stripped } = extractAndStripThinkTags(message.data);
      if (thinking) {
        this.emitThinkingMessage(thinking, 'thinking');
      }
      if (stripped !== message.data) {
        processedMessage = { ...message, data: stripped };
      }
    }

    if (
      processedMessage.type !== 'thought' &&
      processedMessage.type !== 'thinking' &&
      processedMessage.type !== 'acp_model_info' &&
      processedMessage.type !== 'acp_context_usage'
    ) {
      const transformStart = Date.now();
      const tMessage = transformMessage(processedMessage);
      const transformDuration = Date.now() - transformStart;

      if (tMessage) {
        const dbStart = Date.now();
        const isStreamTextChunk = tMessage.type === 'text' && processedMessage.type === 'content';
        if (isStreamTextChunk) {
          this.queueBufferedStreamTextMessage(tMessage, backend);
        } else {
          this.flushBufferedStreamTextMessages();
          addOrUpdateMessage(processedMessage.conversation_id, tMessage, backend);
        }
        const dbDuration = Date.now() - dbStart;

        if (transformDuration > 5 || dbDuration > 5) {
          console.log(
            `[ACP-PERF] stream: transform ${transformDuration}ms, db ${dbDuration}ms type=${processedMessage.type}`
          );
        }

        // Track streaming content for cron detection when turn ends
        if (isStreamTextChunk) {
          const textContent = extractTextFromMessage(tMessage);
          if (tMessage.msg_id !== this.currentMsgId) {
            this.currentMsgId = tMessage.msg_id || null;
            this.currentMsgContent = textContent;
          } else {
            this.currentMsgContent += textContent;
          }
        }
      }
    }

    const emitStart = Date.now();
    ipcBridge.acpConversation.responseStream.emit(processedMessage);
    // Forward to team bus:
    //  - `finish`/`error`: terminal lifecycle events TeammateManager uses for wake watchdog
    //  - `acp_context_usage`: per-turn token accounting that W1e's TeammateManager
    //    listens for to write `team_event_log` event_type='token_usage' rows
    //    (foundation for the W2d cost meter). Without this branch the W1e
    //    token_usage hook is a dead code path.
    if (
      processedMessage.type === 'finish' ||
      processedMessage.type === 'error' ||
      processedMessage.type === 'acp_context_usage'
    ) {
      teamEventBus.emit('responseStream', {
        ...processedMessage,
        conversation_id: this.conversation_id,
      });
    }
    const emitDuration = Date.now() - emitStart;

    channelEventBus.emitAgentMessage(this.conversation_id, {
      ...processedMessage,
      conversation_id: this.conversation_id,
    });

    const totalDuration = Date.now() - pipelineStart;
    if (totalDuration > 10) {
      console.log(
        `[ACP-PERF] stream: onStreamEvent pipeline ${totalDuration}ms (emit=${emitDuration}ms) type=${processedMessage.type}`
      );
    }
  }

  /**
   * Handle signal events (permission requests, finish, errors) from the ACP agent.
   * Auto-approves permissions in yolo mode and for team MCP tools,
   * delegates finish handling to handleFinishSignal.
   */
  private async handleSignalEvent(v: IResponseMessage, backend: AcpBackend): Promise<void> {
    this.flushBufferedStreamTextMessages();
    this.markTrackedTurnRuntimeActivity();

    if (v.type === 'acp_permission') {
      const { toolCall, options } = v.data as AcpPermissionRequest;

      // Auto-approve ALL tools when in yolo/bypassPermissions mode.
      if (this.isYoloMode(this.currentMode) && options.length > 0) {
        const autoOption = options[0];
        setTimeout(() => {
          void this.confirm(v.msg_id, toolCall.toolCallId || v.msg_id, autoOption);
        }, 50);
        return;
      }

      // Auto-approve team MCP tools - internal tools provided by Wayland.
      const toolTitle = toolCall.title || '';
      if (toolTitle.includes('wayland-team') && options.length > 0) {
        const autoOption = options[0];
        setTimeout(() => {
          void this.confirm(v.msg_id, toolCall.toolCallId || v.msg_id, autoOption);
        }, 50);
        return;
      }

      // Auto-approve file edits when in "Accept Edits" mode. The claude ACP bridge
      // still forwards a permission request for edit tools after session/set_mode,
      // so Wayland honors the mode here (mirroring Gemini autoEdit / WCore auto_edit).
      // Commands and other tool kinds still surface a confirmation.
      if (shouldAutoApproveAcpEdit(this.currentMode, toolCall.kind) && options.length > 0) {
        const allowOption = options.find((option) => !option.kind.startsWith('reject')) ?? options[0];
        setTimeout(() => {
          void this.confirm(v.msg_id, toolCall.toolCallId || v.msg_id, allowOption);
        }, 50);
        return;
      }

      // Autopilot guardrail. In guarded-auto mode (workflows / Autopilot run the
      // bridge in 'default' so it escalates risky tool calls) the run proceeds
      // unattended, so auto-approve every escalated request EXCEPT a catastrophic
      // command - that must never fire without a human. A flagged command is NOT
      // auto-approved; it falls through to addConfirmation so it surfaces for an
      // explicit decision (the run pauses rather than nuking the machine).
      if (isAutoGuardedMode(this.currentMode) && options.length > 0) {
        const verdict = classifyDestructiveToolCall(toolCall);
        if (!verdict.destructive) {
          const allowOption = options.find((option) => !option.kind.startsWith('reject')) ?? options[0];
          setTimeout(() => {
            void this.confirm(v.msg_id, toolCall.toolCallId || v.msg_id, allowOption);
          }, 50);
          return;
        }
        mainWarn(
          '[AcpAgentManager]',
          `Autopilot guardrail held a destructive command (${verdict.reason}); surfacing for confirmation: ${toolCall.title || ''}`
        );
        // fall through to addConfirmation below
      }

      this.addConfirmation({
        title: toolCall.title || 'messages.permissionRequest',
        action: 'messages.command',
        id: v.msg_id,
        description: toolCall.rawInput?.description || 'messages.agentRequestingPermission',
        callId: toolCall.toolCallId || v.msg_id,
        options: options.map((option) => ({
          label: option.name,
          value: option,
        })),
      });

      channelEventBus.emitAgentMessage(this.conversation_id, {
        type: 'error',
        conversation_id: this.conversation_id,
        msg_id: v.msg_id,
        data: 'Permission required. Please open Wayland and confirm the pending request in the conversation panel.',
      });
      return;
    }

    if (v.type === 'finish') {
      await this.handleFinishSignal(v, backend);
      return;
    }

    // An invalid injected provider key surfaces here as an error signal (the
    // backend rejected the key). Invalidate it so it stops overriding native auth.
    if (v.type === 'error') {
      this.maybeInvalidateProviderKeyOnAuthError(v.data);
    }

    ipcBridge.acpConversation.responseStream.emit(v);

    channelEventBus.emitAgentMessage(this.conversation_id, {
      ...v,
      conversation_id: this.conversation_id,
    });
  }

  /**
   * Re-apply persisted mode and model after agent session starts/resumes.
   * Also caches the model list for Guid page pre-selection.
   */
  private async restorePersistedState(): Promise<void> {
    if (this.currentMode && this.currentMode !== 'default') {
      try {
        await this.agent.setMode(this.currentMode);
      } catch (error) {
        mainWarn('[AcpAgentManager]', `Failed to re-apply mode ${this.currentMode}`, error);
      }
    }

    if (this.persistedModelId) {
      const currentInfo = this.agent.getModelInfo();
      const isModelAvailable = currentInfo?.availableModels?.some((m) => m.id === this.persistedModelId);
      // A Flux model id (flux-auto, ...) on a Flux-capable backend is carried by
      // the spawn env (ANTHROPIC_MODEL/OPENAI_MODEL=flux-auto), not by an in-place
      // set_model. The backend's native catalog (opus/sonnet/...) never lists it,
      // so DO NOT clear it as "unavailable" and DO NOT re-send it via set_model
      // (the claude bridge rejects an unlisted id). The env already selected it.
      const isFluxOnFluxBackend = isFluxModelId(this.persistedModelId) && Boolean(getFluxCompat(this.options.backend));
      if (isFluxOnFluxBackend) {
        // Keep persistedModelId as-is; the env carries the route.
      } else if (!isModelAvailable) {
        mainWarn('[AcpAgentManager]', `Persisted model ${this.persistedModelId} is not in available models, clearing`);
        this.persistedModelId = null;
      } else if (currentInfo?.currentModelId !== this.persistedModelId) {
        try {
          await this.agent.setModelByConfigOption(this.persistedModelId);
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          mainWarn('[AcpAgentManager]', `Failed to re-apply model ${this.persistedModelId}`, error);
          if (errMsg.includes('model_not_found') || errMsg.includes('无可用渠道')) {
            ipcBridge.acpConversation.responseStream.emit({
              type: 'error',
              conversation_id: this.conversation_id,
              msg_id: `model_error_${Date.now()}`,
              data:
                `Model "${this.persistedModelId}" is not available on your API relay service. ` +
                `Please add this model to your relay's channel configuration. Falling back to the default model.`,
            });
          }
          this.persistedModelId = null;
        }
      }
    }

    // Note: model list caching is now handled by AcpAgent.cacheSessionCapabilities()
    // during start(), so we don't need to call cacheModelList() here.
  }

  // ── initAgent ────────────────────────────────────────────────────────

  initAgent(data: AcpAgentManagerData = this.options) {
    if (this.bootstrap) return this.bootstrap;

    this.bootstrapping = true;
    const bootstrapPromise = (async () => {
      const { cliPath, customArgs, customEnv, yoloMode } = await this.resolveAgentCliConfig(data);

      const agentConfig = {
        id: data.conversation_id,
        backend: data.backend,
        cliPath: cliPath,
        workingDir: data.workspace,
        customArgs: customArgs,
        customEnv: customEnv,
        extra: {
          workspace: data.workspace,
          backend: data.backend,
          cliPath: cliPath,
          customWorkspace: data.customWorkspace,
          customArgs: customArgs,
          customEnv: customEnv,
          yoloMode: yoloMode,
          agentName: data.agentName,
          acpSessionId: data.acpSessionId,
          acpSessionUpdatedAt: data.acpSessionUpdatedAt,
          acpWrapperVersion: data.acpWrapperVersion,
          currentModelId: this.persistedModelId ?? undefined,
          sessionMode: this.currentMode,
          pendingConfigOptions: data.pendingConfigOptions,
          // Per-conversation MCP scoping (#348): forward to loadBuiltinSessionMcpServers.
          activeMcpServers: data.activeMcpServers,
          // Forward team MCP stdio config so AcpAgent.loadBuiltinSessionMcpServers() can inject it
          teamMcpStdioConfig: (data as unknown as Record<string, unknown>).teamMcpStdioConfig as
            | { name: string; command: string; args: string[]; env: Array<{ name: string; value: string }> }
            | undefined,
        },
        onSessionIdUpdate: (sessionId: string) => {
          // Save ACP session ID to database for resume support
          this.saveAcpSessionId(sessionId);
        },
        onAvailableCommandsUpdate: (commands: Array<{ name: string; description?: string; hint?: string }>) => {
          this.handleAvailableCommandsUpdate(commands);
        },
        onStreamEvent: (message: IResponseMessage) => {
          this.handleStreamEvent(message as IResponseMessage, data.backend);
        },
        onSignalEvent: async (v: IResponseMessage) => {
          await this.handleSignalEvent(v as IResponseMessage, data.backend);
        },
      };

      this.agent = new AcpAgentV2(agentConfig);
      return this.agent.start().then(async () => {
        await this.restorePersistedState();
        this.bootstrapping = false;
        return this.agent;
      });
    })();
    // If bootstrap rejects (e.g. session-start timeout on a slow cold start),
    // clear the cached promise so the NEXT sendMessage re-inits a fresh agent
    // instead of re-throwing the poisoned promise forever. Without this, one
    // timeout permanently bricks the task - every later cron fire / user turn
    // immediately re-throws the original error (BUG-5 crash loop). Guard on
    // identity so a newer bootstrap is never clobbered.
    bootstrapPromise.catch(() => {
      if (this.bootstrap === bootstrapPromise) {
        this.bootstrap = undefined;
        this.bootstrapping = false;
      }
    });
    this.bootstrap = bootstrapPromise;
    return this.bootstrap;
  }

  async sendMessage(data: {
    content: string;
    files?: string[];
    msg_id?: string;
    cronMeta?: CronMessageMeta;
    hidden?: boolean;
    silent?: boolean;
  }): Promise<{
    success: boolean;
    msg?: string;
    message?: string;
  }> {
    // NOTE: Do NOT flip `bootstrapping = false` here. On ACP session resume
    // (Claude Code / Codex / Qwen / Goose), `initAgent → agent.start()` triggers
    // a `session/load` replay that emits historical events. If `bootstrapping`
    // is false during that replay, those events flow through transformMessage
    // → addOrUpdateMessage and get inserted as fresh SQLite rows with new
    // client-side UUIDs (upstream upstream issue #2887 / H9). The bootstrap
    // gate is now released only inside initAgent() AFTER `agent.start()`
    // resolves; the `agent_status` allowlist in handleStreamEvent keeps init
    // progress visible to the UI in the meantime.
    this._lastActivityAt = Date.now();

    const managerSendStart = Date.now();
    // Mark conversation as busy to prevent cron jobs from running
    cronBusyGuard.setProcessing(this.conversation_id, true);
    // Set status to running when message is being processed
    this.status = 'running';
    try {
      // Emit/persist user message immediately so UI can refresh without waiting
      // for ACP connection/auth/session initialization.
      if (data.msg_id && data.content && !data.silent) {
        const userMessage: TMessage = {
          id: data.msg_id,
          msg_id: data.msg_id,
          type: 'text',
          position: 'right',
          conversation_id: this.conversation_id,
          content: {
            content: data.content,
            ...(data.cronMeta && { cronMeta: data.cronMeta }),
          },
          createdAt: Date.now(),
          ...(data.hidden && { hidden: true }),
        };
        addMessage(this.conversation_id, userMessage);
        // Ensure conversation list sorting updates immediately after user sends.
        try {
          (await getDatabase()).updateConversation(this.conversation_id, {});
        } catch (error) {
          // Graceful degrade: the conversation row might not exist in the DB
          // yet, so a failure here is non-fatal to the turn. But log it (S6) so
          // real failures (corruption, disk-full) are no longer swallowed
          // silently with zero diagnostics.
          mainWarn('[AcpAgentManager]', 'updateConversation (touch for list sort) failed', error);
        }
        const userResponseMessage: IResponseMessage = {
          type: 'user_content',
          conversation_id: this.conversation_id,
          msg_id: data.msg_id,
          data: data.cronMeta
            ? { content: userMessage.content.content, cronMeta: data.cronMeta }
            : userMessage.content.content,
          ...(data.hidden && { hidden: true }),
        };
        ipcBridge.acpConversation.responseStream.emit(userResponseMessage);
      }

      await this.initAgent(this.options);

      if (data.msg_id && data.content) {
        let contentToSend = data.content;
        if (contentToSend.includes(WAYLAND_FILES_MARKER)) {
          contentToSend = contentToSend.split(WAYLAND_FILES_MARKER)[0].trimEnd();
        }

        // Inject preset rules and skills on first message
        //
        // Symlinks are only created for temp workspaces; custom workspaces skip symlinks.
        // So custom workspaces or backends without native skill discovery need prompt injection.
        if (this.isFirstMessage) {
          const isInTeam = Boolean((this.options as unknown as Record<string, unknown>).teamMcpStdioConfig);
          const useNativeSkills = this.resolveNativeSkillSupport() && !this.options.customWorkspace;
          if (useNativeSkills) {
            // Native skill discovery via workspace symlinks - inject preset rules + team guide
            const parts: string[] = [];
            if (this.options.presetContext) parts.push(this.options.presetContext);
            if (!isInTeam && (await shouldInjectTeamGuideMcp(this.options.backend))) {
              const [{ getTeamGuidePrompt }, { resolveLeaderAssistantLabel }] = await Promise.all([
                import('@process/team/prompts/teamGuidePrompt.ts'),
                import('@process/team/prompts/teamGuideAssistant.ts'),
              ]);
              const leaderLabel = await resolveLeaderAssistantLabel(
                this.options.presetAssistantId || this.options.customAgentId
              );
              parts.push(getTeamGuidePrompt({ backend: this.options.backend, leaderLabel }));
            }
            // Prepend Wayland Constitution + optional specialist overlay above
            // the preset rules + team guide. composePrompt returns '' when no
            // Constitution file exists, preserving the prior "skip rules block
            // when empty" behaviour for fresh installs.
            const rulesBody = composePrompt({
              assistantId: this.options.presetAssistantId || this.options.customAgentId,
              basePrompt: parts.join('\n\n'),
            }).text;
            if (rulesBody.length > 0) {
              contentToSend = `[Assistant Rules - You MUST follow these instructions]\n${rulesBody}\n\n[User Request]\n${contentToSend}`;
            }
          } else {
            // Custom workspace or no native support - inject rules + skills via prompt
            const { content: injectedContent } = await prepareFirstMessageWithSkillsIndex(contentToSend, {
              presetContext: this.options.presetContext,
              enabledSkills: this.options.enabledSkills,
              excludeBuiltinSkills: this.options.excludeBuiltinSkills,
              enableTeamGuide: !isInTeam && (await shouldInjectTeamGuideMcp(this.options.backend)),
              backend: this.options.backend,
              presetAssistantId: this.options.presetAssistantId || this.options.customAgentId,
            });
            contentToSend = injectedContent;
          }
        }

        // Per-turn skill auto-load (every genuine user turn, all backends).
        // Proactively surfaces the most relevant skills for this message and
        // inline-injects the single clear winner - works mid-chat, not just at
        // session start. Skipped for hidden/silent system feedback turns.
        if (!data.hidden && !data.silent) {
          try {
            // Rank against the original user text (not the rules-wrapped / augmented content).
            const rawUserText = data.content.includes(WAYLAND_FILES_MARKER)
              ? data.content.split(WAYLAND_FILES_MARKER)[0]
              : data.content;
            // Skills the user added to this chat from the composer - inject once.
            const pending = await consumePendingSessionSkills(this.conversation_id);
            if (pending) {
              contentToSend = `${pending}\n\n${contentToSend}`;
            }
            const turnSkill = await buildTurnSkillContext(rawUserText, {
              alwaysOnNames: this.options.enabledSkills,
            });
            if (turnSkill.advert) {
              contentToSend = `${turnSkill.advert}\n\n${contentToSend}`;
            }
            if (turnSkill.autoLoaded.length > 0) {
              await mergeLoadedSkillsExtra(this.conversation_id, turnSkill.autoLoaded);
            }
          } catch (error) {
            mainWarn('[AcpAgentManager]', 'per-turn skill context failed', error);
          }
        }

        const result = await this.sendAgentMessageWithFinishFallback({
          ...data,
          content: contentToSend,
        });
        // Mark after first message is sent, regardless of presetContext
        if (this.isFirstMessage) {
          this.isFirstMessage = false;
        }
        // Note: cronBusyGuard.setProcessing(false) is not called here
        // because the response streaming is still in progress.
        // It will be cleared when the conversation ends or on error.
        // Exception: if the agent returns a failure (e.g. timeout), clean up
        // immediately so the conversation isn't stuck in a busy/running state.
        if (!result.success) {
          this.clearBusyState();
        }
        return result;
      }
      const agentSendStart = Date.now();
      const result = await this.sendAgentMessageWithFinishFallback(data);
      console.log(
        `[ACP-PERF] manager: agent.sendMessage completed ${Date.now() - agentSendStart}ms (total manager.sendMessage: ${
          Date.now() - managerSendStart
        }ms)`
      );
      if (!result.success) {
        this.clearBusyState();
      }
      return result;
    } catch (e) {
      this.flushBufferedStreamTextMessages();
      this.clearBusyState();
      // Turn the raw session-start timeout into something a user can act on, so a
      // cron-fired (or interactive) run that hits a slow cold start surfaces a
      // clear, non-cryptic message instead of leaving the surface dead (BUG-5).
      const errorData =
        e instanceof Error && e.message === 'Session start timed out'
          ? 'The agent took too long to start (startup timed out). This usually means a slow cold start - it will retry on the next run.'
          : parseError(e);
      const message: IResponseMessage = {
        type: 'error',
        conversation_id: this.conversation_id,
        msg_id: data.msg_id || uuid(),
        data: errorData,
      };

      // Backend handles persistence before emitting to frontend
      const tMessage = transformMessage(message);
      if (tMessage) {
        addOrUpdateMessage(this.conversation_id, tMessage);
      }

      // Emit to frontend for UI display only
      ipcBridge.acpConversation.responseStream.emit(message);

      // Emit finish signal so the frontend resets loading state
      // (mirrors AcpAgent.handleDisconnect pattern)
      const finishMessage: IResponseMessage = {
        type: 'finish',
        conversation_id: this.conversation_id,
        msg_id: uuid(),
        data: null,
      };
      ipcBridge.acpConversation.responseStream.emit(finishMessage);

      // Emit a TERMINAL turn-completed event with state:'error'. Without this, a
      // crashed/disconnected/timed-out turn never fires `turnCompleted`, so any
      // autonomous workflow step dispatched onto this conversation hangs forever
      // (BUG-6 GAP-B) and cron-fired runs leave the surface dead with no terminal
      // signal (BUG-5). The initBridge listener treats state:'error' as terminal
      // and flips the parent workflow step to `errored`. The service dedupes a
      // double-emit within 1s, so this is safe alongside any later finish.
      void ConversationTurnCompletionService.getInstance().notifyPotentialCompletion(this.conversation_id, {
        status: 'finished',
        state: 'error',
        detail: errorData,
        workspace: this.workspace,
        backend: this.options.backend,
      });

      return new Promise((_, reject) => {
        nextTickToLocalFinish(() => {
          reject(e);
        });
      });
    }
  }

  getAcpSlashCommands(): SlashCommandItem[] {
    return this.acpAvailableSlashCommands.map((item) => ({ ...item }));
  }

  async loadAcpSlashCommands(timeoutMs: number = 6000): Promise<SlashCommandItem[]> {
    // Return cached commands immediately if available
    if (this.acpAvailableSlashCommands.length > 0) {
      return this.getAcpSlashCommands();
    }

    // Don't start agent process just to load slash commands.
    // The frontend (useSlashCommands) re-fetches when agentStatus changes,
    // so commands will be loaded once the agent is naturally initialized.
    if (!this.bootstrap) {
      return [];
    }

    // Wait for ongoing initialization to complete
    try {
      await this.bootstrap;
    } catch (error) {
      console.warn('[AcpAgentManager] Agent initialization failed while loading ACP slash commands:', error);
      return this.getAcpSlashCommands();
    }

    if (this.acpAvailableSlashCommands.length > 0) {
      return this.getAcpSlashCommands();
    }

    return await new Promise<SlashCommandItem[]>((resolve) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      const wrappedResolve = (commands: SlashCommandItem[]) => {
        if (timer) {
          clearTimeout(timer);
        }
        resolve(commands);
      };
      timer = setTimeout(() => {
        this.acpAvailableSlashWaiters = this.acpAvailableSlashWaiters.filter((waiter) => waiter !== wrappedResolve);
        resolve(this.getAcpSlashCommands());
      }, timeoutMs);

      this.acpAvailableSlashWaiters.push(wrappedResolve);
    });
  }

  async confirm(id: string, callId: string, data: AcpPermissionOption) {
    super.confirm(id, callId, data);
    await this.bootstrap;
    void this.agent.confirmMessage({
      confirmKey: data.optionId,
      // msg_id: dat;
      callId: callId,
    });
  }

  /**
   * Emit a thinking message to the UI stream.
   * Creates a new thinking msg_id on first call per turn, reuses it for subsequent calls.
   */
  private emitThinkingMessage(content: string, status: 'thinking' | 'done' = 'thinking'): void {
    if (!this.thinkingMsgId) {
      this.thinkingMsgId = uuid();
      this.thinkingStartTime = Date.now();
      this.thinkingContent = '';
    }

    // Accumulate content during streaming
    if (status === 'thinking') {
      this.thinkingContent += content;
    }

    const duration = status === 'done' && this.thinkingStartTime ? Date.now() - this.thinkingStartTime : undefined;

    ipcBridge.acpConversation.responseStream.emit({
      type: 'thinking',
      conversation_id: this.conversation_id,
      msg_id: this.thinkingMsgId,
      data: {
        content,
        duration,
        status,
      },
    });

    // Persist: done flushes immediately, streaming chunks use buffered timer
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
    addOrUpdateMessage(this.conversation_id, tMessage, this.options.backend);
  }

  /**
   * Ensure yoloMode is enabled for cron job reuse.
   * If already enabled, returns true immediately.
   * If not, enables yoloMode on the active ACP session dynamically.
   */
  async ensureYoloMode(): Promise<boolean> {
    if (this.options.yoloMode) {
      return true;
    }
    this.options.yoloMode = true;
    if (this.agent?.isConnected && this.agent?.hasActiveSession) {
      try {
        await this.agent.enableYoloMode();
        return true;
      } catch (error) {
        mainError('[AcpAgentManager]', 'Failed to enable yoloMode dynamically', error);
        return false;
      }
    }
    // Agent not connected yet - yoloMode will be applied on next start()
    return true;
  }

  /**
   * Override stop() to cancel the current prompt without killing the backend process.
   * Uses ACP session/cancel so the connection stays alive for subsequent messages.
   */
  async stop() {
    if (this.agent) {
      this.agent.cancelPrompt();
    }
  }

  /**
   * Get the current session mode for this agent.
   *
   * @returns Object with current mode and whether agent is initialized
   */
  getMode(): { mode: string; initialized: boolean } {
    return { mode: this.currentMode, initialized: !!this.agent };
  }

  /**
   * Get model info from the underlying ACP agent.
   * If agent is not initialized but a model ID was persisted, return read-only info.
   */
  getModelInfo(): AcpModelInfo | null {
    if (!this.agent) {
      // Return persisted model info when agent is not yet initialized
      if (this.persistedModelId) {
        return {
          source: 'models',
          sourceDetail: 'persisted-model',
          currentModelId: this.persistedModelId,
          currentModelLabel: this.persistedModelId,
          canSwitch: false,
          availableModels: [],
        };
      }
      return null;
    }
    return this.agent.getModelInfo();
  }

  /**
   * Model info for a backend BEFORE any task/agent exists (cold start on a new
   * chat). Claude Code never reports through the ACP `models` API, so its catalog
   * is not in `acp.cachedModels`; instead it is derivable offline from the
   * cc-switch local config (provider DB + `~/.claude/settings.json`), with no live
   * ACP connection. We compute it here so the picker shows the current model +
   * switch list immediately, and persist it into `acp.cachedModels` so later cold
   * starts hit the renderer's warm-cache path and it survives as last-known.
   *
   * Returns null for every other backend (their pre-connection catalog already
   * comes from `acp.cachedModels`, populated by a previous live session), so this
   * cannot regress models-API backends (kimi/opencode) or backends that genuinely
   * expose nothing.
   */
  static async getStaticModelInfo(backend: string): Promise<AcpModelInfo | null> {
    if (backend !== 'claude') return null;

    // cc-switch users get richer per-provider ids; everyone else with the Claude
    // Code CLI set up falls back to native ~/.claude/settings.json slots.
    const modelInfo = readClaudeModelInfoFromCcSwitch() ?? readClaudeModelInfoFromSettings();
    if (!modelInfo?.availableModels?.length) return null;

    try {
      const cached = (await ProcessConfig.get('acp.cachedModels')) || {};
      const existing = cached[backend];
      await ProcessConfig.set('acp.cachedModels', {
        ...cached,
        [backend]: {
          ...modelInfo,
          // Preserve the original default from the first live session, mirroring
          // cacheModelList — a derived default must not clobber a real one.
          currentModelId: existing?.currentModelId ?? modelInfo.currentModelId,
          currentModelLabel: existing?.currentModelLabel ?? modelInfo.currentModelLabel,
        },
      });
    } catch (error) {
      mainWarn('[AcpAgentManager]', 'Failed to cache static claude model info', error);
    }

    return modelInfo;
  }

  /**
   * Switch model for the underlying ACP agent.
   * Persists the model ID to database for resume support.
   *
   * Flux routing is injected as process env AT SPAWN (ANTHROPIC_BASE_URL for
   * claude, the OpenAI/Responses surface for the others). An in-place
   * `set_model` only tells the already-running CLI to use a different model id;
   * it cannot change that env. So when a model switch crosses the routing
   * boundary (native<->flux), the CLI is still pointed at the wrong endpoint and
   * the request fails (e.g. asking api.anthropic.com for `flux-auto`). In that
   * case we re-spawn the agent so `resolveAgentCliConfig` re-injects the correct
   * env. Same-routing switches (flux-auto->flux-reasoning, sonnet->opus) keep the
   * cheap in-place path.
   */
  async setModel(modelId: string): Promise<AcpModelInfo | null> {
    if (!this.agent) {
      try {
        await this.initAgent(this.options);
      } catch {
        return null;
      }
    }
    if (!this.agent) return null;

    // Detect a routing-boundary crossing: does the NEW model route differently
    // than what is currently live? `this.lastRouting` was set by the spawn that
    // produced the running agent. `unknown` means the backend is not Flux-routable
    // at all (env can't be changed by a re-spawn), so never re-spawn for it.
    const nextRouting = (await this.computeFluxRouting(this.options.backend, modelId)).routing;
    const crossesRoutingBoundary =
      nextRouting !== 'unknown' && this.lastRouting !== 'unknown' && nextRouting !== this.lastRouting;

    // A native claude slot pick is carried by ANTHROPIC_MODEL at spawn (see
    // resolveAgentCliConfig), so it only takes effect on a respawn — the bridge's
    // in-place set_model is unreliable when it advertises no model list (#184).
    // The picker offers registry catalog ids (`claude-opus-4-8`), so normalize to
    // the slot the CLI actually accepts; respawn (and persist) with that slot, or
    // the pick falls through to set_model and the CLI rejects it with -32601.
    const claudeSlot =
      this.options.backend === 'claude' && nextRouting !== 'flux' ? claudeSlotForModelId(modelId) : undefined;
    const nativeClaudeSlotChange = claudeSlot !== undefined;

    if (crossesRoutingBoundary || nativeClaudeSlotChange) {
      return this.respawnForRoutingChange(claudeSlot ?? modelId);
    }

    // Same-routing switch TO a Flux id (e.g. the chat is already flux-routed and
    // the user re-picks Flux Auto): the model is carried by the spawn env
    // (ANTHROPIC_MODEL/OPENAI_MODEL=flux-auto). The claude bridge rejects an
    // unlisted id via set_model, so persist + skip the in-place call.
    if (isFluxModelId(modelId)) {
      this.persistedModelId = modelId;
      await this.saveModelId(modelId);
      return this.getModelInfo();
    }

    const result = await this.agent.setModelByConfigOption(modelId);
    if (result) {
      this.persistedModelId = result.currentModelId;
      // S6: await (was fire-and-forget) so a persist failure can't surface as an
      // unhandled rejection and the selected model is actually persisted before
      // returning (matters for resume).
      await this.saveModelId(result.currentModelId);
      // Update cached models so Guid page defaults to the newly selected model
      if (result.availableModels?.length > 0) {
        void this.cacheModelList(result);
      }
    }
    return result;
  }

  /**
   * Tear down the running agent and re-create it with the new model so
   * `resolveAgentCliConfig` injects the correct Flux/native env. Conversation
   * continuity is preserved by the existing session-resume path: the persisted
   * `acpSessionId` (+ pinned wrapper version) is reloaded from the DB into
   * `this.options`, so the fresh spawn resumes the same ACP session (or, on a
   * wrapper-version mismatch, takes AcpAgentV2's self-healing history-replay
   * path). The new model is persisted BEFORE re-spawn so initAgent's
   * `this.persistedModelId` carries it into `agentConfig.extra.currentModelId`.
   */
  private async respawnForRoutingChange(modelId: string): Promise<AcpModelInfo | null> {
    // Persist the new model first so the re-spawn picks it up.
    this.persistedModelId = modelId;
    this.options.currentModelId = modelId;
    await this.saveModelId(modelId);

    // Reload the latest resume markers so the fresh spawn resumes this session
    // (these are written async by saveAcpSessionId during the prior session).
    try {
      const db = await getDatabase();
      const result = db.getConversation(this.conversation_id);
      if (result.success && result.data && result.data.type === 'acp') {
        const extra = (result.data.extra ?? {}) as {
          acpSessionId?: string;
          acpSessionUpdatedAt?: number;
          acpWrapperVersion?: string;
        };
        this.options.acpSessionId = extra.acpSessionId ?? this.options.acpSessionId;
        this.options.acpSessionUpdatedAt = extra.acpSessionUpdatedAt ?? this.options.acpSessionUpdatedAt;
        this.options.acpWrapperVersion = extra.acpWrapperVersion ?? this.options.acpWrapperVersion;
      }
    } catch (err) {
      mainWarn('[AcpAgentManager]', 'respawnForRoutingChange: failed to reload resume markers', err);
    }

    // Tear down the current CLI process + worker (same path kill() uses), then
    // clear the cached bootstrap so initAgent spawns a fresh agent.
    try {
      await (this.agent?.kill?.() ?? Promise.resolve());
    } catch (err) {
      mainWarn('[AcpAgentManager]', 'respawnForRoutingChange: agent.kill failed', err);
    }
    this.bootstrap = undefined;
    this.bootstrapping = false;

    await this.initAgent(this.options);
    return this.getModelInfo();
  }

  /**
   * Get non-model config options from the underlying ACP agent.
   * Returns options like reasoning effort, output format, etc.
   */
  getConfigOptions(): AcpSessionConfigOption[] {
    if (!this.agent) return [];
    return this.agent.getConfigOptions();
  }

  /**
   * Set a config option value on the underlying ACP agent.
   * Used for reasoning effort and other non-model config options.
   */
  async setConfigOption(configId: string, value: string): Promise<AcpSessionConfigOption[]> {
    if (!this.agent) {
      try {
        await this.initAgent(this.options);
      } catch {
        return [];
      }
    }
    if (!this.agent) return [];
    const updated = await this.agent.setConfigOption(configId, value);
    if (updated.length > 0) {
      void this.saveConfigOptions(updated);
    }
    return updated;
  }

  /**
   * Set the session mode for this agent (e.g., plan, default, bypassPermissions, yolo).
   *
   * Note: Agent must be initialized (user must have sent at least one message)
   * before mode switching is possible, as we need an active ACP session.
   *
   * @param mode - The mode ID to set
   * @returns Promise that resolves with success status and current mode
   */
  async setMode(mode: string): Promise<{ success: boolean; msg?: string; data?: { mode: string } }> {
    // Codex (via codex-acp bridge) does not support ACP session/set_mode - it uses MCP
    // and manages approval at the Manager layer. Update local state only to avoid
    // "Invalid params" JSON-RPC error from the bridge.
    if (this.options.backend === 'codex') {
      const prev = this.currentMode;
      this.currentMode = mode;
      this.yoloMode = this.isYoloMode(mode);
      const sandboxMode = getCodexSandboxModeForSessionMode(mode, this.options.sandboxMode);
      this.options.sandboxMode = sandboxMode;
      await writeCodexSandboxMode(sandboxMode);
      this.saveSessionMode(mode);

      if (this.isYoloMode(prev) && !this.isYoloMode(mode)) {
        void this.clearLegacyYoloConfig();
      }
      return { success: true, data: { mode: this.currentMode } };
    }

    // Snow CLI does not support ACP session/set_mode - it returns "Method not found".
    // Like Codex, manage mode at the Manager layer only.
    if (this.options.backend === 'snow') {
      const prev = this.currentMode;
      this.currentMode = mode;
      this.yoloMode = this.isYoloMode(mode);
      this.saveSessionMode(mode);

      if (this.isYoloMode(prev) && !this.isYoloMode(mode)) {
        void this.clearLegacyYoloConfig();
      }
      return { success: true, data: { mode: this.currentMode } };
    }

    // If agent is not initialized, try to initialize it first
    if (!this.agent) {
      try {
        await this.initAgent(this.options);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          msg: `Agent initialization failed: ${errorMsg}`,
        };
      }
    }

    // Check again after initialization attempt
    if (!this.agent) {
      return { success: false, msg: 'Agent not initialized' };
    }

    const result = await this.agent.setMode(mode);
    if (result.success) {
      const prev = this.currentMode;
      this.currentMode = mode;
      this.yoloMode = this.isYoloMode(mode);
      this.saveSessionMode(mode);

      // Sync legacy yoloMode config: when leaving yolo mode, clear the old
      // SecurityModalContent setting to prevent it from re-activating on next session.
      if (this.isYoloMode(prev) && !this.isYoloMode(mode)) {
        void this.clearLegacyYoloConfig();
      }
    }
    return {
      success: result.success,
      msg: result.error,
      data: { mode: this.currentMode },
    };
  }

  /** Check if a mode value represents YOLO mode for any backend */
  private isYoloMode(mode: string): boolean {
    return mode === 'yolo' || mode === 'bypassPermissions' || isCodexAutoApproveMode(mode);
  }

  /**
   * Clear legacy yoloMode in acp.config for the current backend.
   * This syncs back to the old SecurityModalContent config key so that
   * switching away from YOLO mode persists across new sessions.
   */
  private async clearLegacyYoloConfig(): Promise<void> {
    try {
      const config = await ProcessConfig.get('acp.config');
      const backendConfig = config?.[this.options.backend];
      if (backendConfig?.yoloMode) {
        await ProcessConfig.set('acp.config', {
          ...config,
          [this.options.backend]: { ...backendConfig, yoloMode: false },
        } as IConfigStorageRefer['acp.config']);
      }
    } catch (error) {
      mainError('[AcpAgentManager]', 'Failed to clear legacy yoloMode config', error);
    }
  }

  /**
   * Save model ID to database for resume support.
   */
  private async saveModelId(modelId: string): Promise<void> {
    try {
      const db = await getDatabase();
      const result = db.getConversation(this.conversation_id);
      if (result.success && result.data && result.data.type === 'acp') {
        const conversation = result.data;
        const updatedExtra = {
          ...conversation.extra,
          currentModelId: modelId,
        };
        db.updateConversation(this.conversation_id, {
          extra: updatedExtra,
        } as Partial<typeof conversation>);
      }
    } catch (error) {
      mainWarn('[AcpAgentManager]', 'Failed to save model ID', error);
    }
  }

  /**
   * Save context usage to database for restore on page switch.
   */
  private clearBusyState(): void {
    cronBusyGuard.setProcessing(this.conversation_id, false);
    this.status = 'finished';
  }

  private async saveContextUsage(usage: { used: number; size: number }): Promise<void> {
    try {
      const db = await getDatabase();
      const result = db.getConversation(this.conversation_id);
      if (result.success && result.data && result.data.type === 'acp') {
        const conversation = result.data;
        const updatedExtra = {
          ...conversation.extra,
          lastTokenUsage: { totalTokens: usage.used },
          lastContextLimit: usage.size,
        };
        db.updateConversation(this.conversation_id, {
          extra: updatedExtra,
        } as Partial<typeof conversation>);
      }
    } catch {
      // Non-critical metadata, silently ignore errors
    }
  }

  /**
   * Save session mode to database for resume support.
   */
  private async saveSessionMode(mode: string): Promise<void> {
    try {
      const db = await getDatabase();
      const result = db.getConversation(this.conversation_id);
      if (result.success && result.data && result.data.type === 'acp') {
        const conversation = result.data;
        const updatedExtra = {
          ...conversation.extra,
          sessionMode: mode,
        };
        db.updateConversation(this.conversation_id, {
          extra: updatedExtra,
        } as Partial<typeof conversation>);
      }
    } catch (error) {
      mainError('[AcpAgentManager]', 'Failed to save session mode', error);
    }
  }

  /**
   * Save non-model/mode config options to database for resume support.
   * Allows AcpConfigSelector to render immediately from cached data
   * even when the ACP session has expired.
   */
  private async saveConfigOptions(configOptions: AcpSessionConfigOption[]): Promise<void> {
    try {
      const db = await getDatabase();
      const result = db.getConversation(this.conversation_id);
      if (result.success && result.data && result.data.type === 'acp') {
        const conversation = result.data;
        db.updateConversation(this.conversation_id, {
          extra: { ...conversation.extra, cachedConfigOptions: configOptions },
        } as Partial<typeof conversation>);
      }
    } catch (error) {
      mainError('[AcpAgentManager]', 'Failed to save config options', error);
    }
  }

  /**
   * Override kill() to ensure ACP CLI process is terminated.
   *
   * Problem: AcpAgentManager spawns CLI agents (claude, codex, etc.) as child
   * processes via AcpConnection. The default kill() from the base class only
   * kills the immediate worker, leaving the CLI process running as an orphan.
   *
   * Solution: Call agent.kill() first, which triggers AcpConnection.disconnect()
   * → ChildProcess.kill(). We add a grace period for the process to exit
   * cleanly before calling super.kill() to tear down the worker.
   *
   * A hard timeout ensures we don't hang forever if agent.kill() gets stuck.
   * An idempotent doKill() guard prevents double super.kill() when the hard
   * timeout and graceful path race against each other.
   */
  kill(_reason?: AgentKillReason): Promise<void> {
    this.flushBufferedStreamTextMessages();
    this.flushThinkingToDb(undefined, 'done');

    let killed = false;
    const GRACE_PERIOD_MS = 500; // Allow child process time to exit cleanly
    const HARD_TIMEOUT_MS = 1500; // Force kill if agent.kill() hangs

    // Clear pending slash command waiters to prevent memory leaks
    const waiters = this.acpAvailableSlashWaiters.splice(0, this.acpAvailableSlashWaiters.length);
    for (const resolve of waiters) {
      resolve([]);
    }
    this.acpAvailableSlashCommands = [];

    // Resolved when super.kill() (the underlying worker teardown) has actually
    // completed, regardless of whether we got there via grace path or hard
    // timeout. AUDIT-05 F20 / M18: callers (WorkerTaskManager.clear) await this.
    return new Promise<void>((resolveOuter) => {
      const doKill = () => {
        if (killed) return;
        killed = true;
        clearTimeout(hardTimer);
        // super.kill() is now async (ForkTask M18); await it before resolving.
        void Promise.resolve(super.kill()).finally(resolveOuter);
      };

      // Hard fallback: force kill after timeout regardless
      const hardTimer = setTimeout(doKill, HARD_TIMEOUT_MS);

      // Graceful path: agent.kill → grace period → super.kill
      void (this.agent?.kill?.() || Promise.resolve())
        .catch((err) => {
          mainWarn('[AcpAgentManager]', 'agent.kill() failed during kill', err);
        })
        .then(() => new Promise<void>((r) => setTimeout(r, GRACE_PERIOD_MS)))
        .finally(doKill);
    });
  }

  /**
   * Cache model list to storage for Guid page pre-selection.
   * Keyed by backend name (e.g., 'claude', 'qwen').
   */
  private async cacheModelList(modelInfo: AcpModelInfo): Promise<void> {
    try {
      const cached = (await ProcessConfig.get('acp.cachedModels')) || {};
      const nextCachedInfo = {
        ...modelInfo,
        // Keep the original default from initial session, not from user switches
        currentModelId: cached[this.options.backend]?.currentModelId ?? modelInfo.currentModelId,
        currentModelLabel: cached[this.options.backend]?.currentModelLabel ?? modelInfo.currentModelLabel,
      };
      // Cache the available model list only. Don't overwrite currentModelId from
      // session-level switches - that should not affect the Guid page default.
      // The Guid page default is managed separately via acp.config[backend].preferredModelId.
      await ProcessConfig.set('acp.cachedModels', {
        ...cached,
        [this.options.backend]: nextCachedInfo,
      });
    } catch (error) {
      mainWarn('[AcpAgentManager]', 'Failed to cache model list', error);
    }
  }

  /**
   * Save ACP session ID to database for resume support.
   */
  private async saveAcpSessionId(sessionId: string): Promise<void> {
    try {
      const db = await getDatabase();
      const result = db.getConversation(this.conversation_id);
      if (result.success && result.data && result.data.type === 'acp') {
        const conversation = result.data;
        const wrapperVersion = getCurrentWrapperVersion(this.options.backend);
        const updatedExtra = {
          ...conversation.extra,
          acpSessionId: sessionId,
          acpSessionConversationId: this.conversation_id,
          acpSessionUpdatedAt: Date.now(),
          ...(wrapperVersion ? { acpWrapperVersion: wrapperVersion } : {}),
        };
        db.updateConversation(this.conversation_id, {
          extra: updatedExtra,
        } as Partial<typeof conversation>);
      }
    } catch (error) {
      mainError('[AcpAgentManager]', 'Failed to save ACP session ID', error);
    }
  }
}

export default AcpAgentManager;
