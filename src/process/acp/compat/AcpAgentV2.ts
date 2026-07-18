// src/process/acp/compat/AcpAgentV2.ts
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import type { IMessageAcpToolCall, TMessage } from '@/common/chat/chatLib';
import { NavigationInterceptor } from '@/common/chat/navigation';
import { isFluxModelId } from '@/common/config/flux';
import type {
  AcpModelInfo,
  AcpModelSelectionFailureCode,
  AcpResult,
  AcpSessionConfigOption,
} from '@/common/types/acpTypes';
import { AcpErrorType, getCurrentWrapperVersion, parseInitializeResult } from '@/common/types/acpTypes';
import { buildHistoryReplayContext } from '@process/acp/historyReplay';
import { parseCodexModelId } from '@process/acp/codexModelId';
import { getFullAutoMode } from '@/common/types/agentModes';
import { LegacyConnectorFactory } from '@process/acp/compat/LegacyConnectorFactory';
import {
  loadAuthCredentials,
  mapAcpErrorCodeToType,
  toAcpConfigOptions,
  toAcpModelInfo,
  toAgentConfig,
  toResponseMessage,
  type OldAcpAgentConfig,
} from '@process/acp/compat/typeBridge';
import { AcpError as AcpSessionError } from '@process/acp/errors/AcpError';
import { AcpSession, type SessionOptions } from '@process/acp/session/AcpSession';
import { readClaudeModelInfoFromCcSwitch } from '@process/services/ccSwitchModelSource';
import { buildClaudeSlotModelInfo } from '@process/agent/acp/utils';
// TODO(ACP Discovery): Re-enable when acp_session persistence is restored.
// import type { IAcpSessionRepository } from '@process/services/database/IAcpSessionRepository';
import { getTeamGuideStdioConfig } from '@/process/team/mcp/guide/teamGuideSingleton';
import { waitForMcpReady, isMcpDegraded } from '@/process/team/mcpReadiness';
import { shouldInjectTeamGuideMcp } from '@/process/team/prompts/teamGuideCapability';
import type { McpServer } from '@agentclientprotocol/sdk';
import type {
  AgentConfig,
  ConfigSnapshot,
  ContextUsage,
  ModelSnapshot,
  ModeSnapshot,
  SessionCallbacks,
  SessionStatus,
} from '@process/acp/types';
import { ProcessConfig } from '@process/utils/initStorage';
import { getEnhancedEnv } from '@process/utils/shellEnv';
import { spawn } from 'node:child_process';
import { McpConfig } from '../session/McpConfig';
import type { IMcpServer } from '@/common/config/storage';

/**
 * Temporary: backend-specific CLI login arguments.
 * Will be replaced by `authCommand + args` config in PR #2349.
 */
const BACKEND_LOGIN_ARGS: Record<string, string[] | undefined> = {
  claude: ['/login'],
  qwen: ['login'],
};

const LOGIN_TIMEOUT_MS = 70_000;

/**
 * Wall-clock budget for an ACP session to reach `active` (or `error`) before we
 * give up. A cold first run (bunx download + CLI init, e.g. Claude) genuinely
 * takes ~90-120s on a slow disk / cold cache, which exceeded the old 2-minute
 * cap and made cron-fired runs reliably time out (BUG-5). 3 minutes clears the
 * observed cold-start window while still bounding a truly hung start.
 */
export const SESSION_START_TIMEOUT_MS = 180_000;

/**
 * Refresh backend credentials by running the backend CLI login command.
 * Will be replaced by `authCommand + args` config when Agent Hub lands (PR #2349).
 */
async function runBackendLogin(backend: string, cliCommand?: string): Promise<void> {
  const env = getEnhancedEnv();
  const loginArgs = BACKEND_LOGIN_ARGS[backend];
  if (!loginArgs) return;

  const command = cliCommand ?? backend;
  console.log(`[AcpAgentV2] Running ${command} ${loginArgs.join(' ')}`);
  const child = spawn(command, loginArgs, {
    stdio: 'pipe',
    timeout: LOGIN_TIMEOUT_MS,
    env,
  });

  return new Promise<void>((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${backend} ${loginArgs.join(' ')} exited with code ${code}`));
    });
    child.on('error', (err) => {
      reject(new Error(`Failed to spawn ${backend}: ${err.message}`));
    });
  });
}

type PendingOp<T> = {
  resolve: (value: T) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

type PendingModelOp = PendingOp<AcpModelInfo> & {
  requestedModelId: string;
  generation: number;
  baselineModelId: string | null;
  responseIsCorrelated: boolean;
  exactConfirmation: AcpModelInfo | null;
  dispatchComplete: boolean;
};

function modelSelectionError(
  code: AcpModelSelectionFailureCode,
  message: string
): Error & { code: AcpModelSelectionFailureCode } {
  return Object.assign(new Error(message), { code });
}

/**
 * AcpAgentV2 - Compatibility adapter that presents the OLD AcpAgent interface
 * while internally delegating to the NEW AcpSession.
 *
 * This adapter:
 * - Converts OldAcpAgentConfig → AgentConfig + SessionCallbacks
 * - Routes new SessionCallbacks → old event format (onStreamEvent, onSignalEvent)
 * - Caches model/config state from callbacks for sync getters
 * - Bridges async old API ↔ void new API via pending promises
 */
export class AcpAgentV2 {
  private session: AcpSession | null = null;
  private readonly agentConfig: AgentConfig;
  private conversationId: string;
  private onStreamEvent: (data: IResponseMessage) => void;
  private onSignalEvent?: (data: IResponseMessage) => void;
  private onSessionIdUpdate?: (sessionId: string) => void;
  private onAvailableCommandsUpdate?: (commands: Array<{ name: string; description?: string; hint?: string }>) => void;

  // Cached state from callbacks
  private cachedModelInfo: AcpModelInfo | null = null;
  private cachedConfigOptions: AcpSessionConfigOption[] = [];
  private cachedModes: ModeSnapshot | null = null;
  private lastSessionId: string | null = null;
  private lastStatus: SessionStatus = 'idle';
  // Most recent error signal message, captured so a failed start rejects with the
  // engine's real reason rather than a generic string (#483/#369). Set by the
  // onSignal 'error' handler (which fires just before status flips to 'error')
  // and cleared when a new start begins or the session reaches 'active'.
  private lastErrorMessage: string | null = null;

  // Stable msg_id for the CURRENT error/crash episode. The renderer upserts
  // stream messages by msg_id (Messages/hooks.ts), so a unique id per emission
  // (the old `signal_${Date.now()}`) made every retry crash a NEW transcript row
  // — a start-retry storm (maxStartRetries) flooded the chat with identical
  // "process exited unexpectedly" banners (#676). Reusing one id across a burst
  // collapses them into a single, upserted banner (mirrors the agent_status fix
  // that uses `status_${conversationId}`). It is reset on forward progress (a new
  // turn, the session reaching 'active', or a turn finishing) so a later,
  // unrelated error still gets its own banner instead of overwriting an old one.
  private errorBannerId: string | null = null;
  // Monotonic episode counter so each new episode's id is unique even when two
  // episodes open within the same millisecond (a Date.now() suffix could collide).
  private errorEpisodeSeq = 0;

  // Promise bridges for async methods (Tasks 4-6)
  private startOp: PendingOp<void> | null = null;
  private modelOp: PendingModelOp | null = null;
  private modelGeneration = 0;
  private readonly supersededModelIds = new Map<string, number>();
  private modeOp: PendingOp<{ success: boolean; error?: string }> | null = null;
  private configOp: PendingOp<AcpSessionConfigOption[]> | null = null;

  // Tool call merge state (compat concern - MessageTranslator is stateless)
  private activeToolCalls = new Map<string, IMessageAcpToolCall>();
  // Auth retry guard - prevent infinite auth loops
  private authRetryAttempted = false;
  // Serialize concurrent capability cache writes across backends
  private static cacheQueue: Promise<void> = Promise.resolve();
  // Claude: inject model identity notice into next prompt after setModel
  private pendingModelSwitchNotice: string | null = null;
  // Persistent user model override - never cleared once set (mirrors V1).
  // Used to re-assert model before every prompt in case CLI loses state
  // (e.g. Claude internal compaction resets model to default).
  private userModelOverride: string | null = null;
  // Self-healing replay: set when ensureSession detects a wrapper-version
  // mismatch and forces a fresh session. Drained on the next sendMessage
  // so the agent recovers prior conversation context transparently.
  private pendingReplayContext: string | null = null;

  constructor(config: OldAcpAgentConfig) {
    this.conversationId = config.id;
    this.onStreamEvent = config.onStreamEvent as (data: IResponseMessage) => void;
    this.onSignalEvent = config.onSignalEvent as ((data: IResponseMessage) => void) | undefined;
    this.onSessionIdUpdate = config.onSessionIdUpdate;
    this.onAvailableCommandsUpdate = config.onAvailableCommandsUpdate;
    this.agentConfig = toAgentConfig(config);
  }

  /**
   * Create AcpSession (deferred from constructor so authCredentials
   * can be loaded asynchronously from the full shell environment).
   */
  private async ensureSession(): Promise<AcpSession> {
    if (this.session) return this.session;

    // Load credentials from full shell env (survives Gemini's delete process.env.*)
    const creds = await loadAuthCredentials(this.agentConfig.agentBackend, this.agentConfig.env);
    if (creds) {
      (this.agentConfig as { authCredentials?: Record<string, string> }).authCredentials = creds;
    }

    // Inject team-guide MCP server for solo agents (not in team mode) so the
    // agent has the aion_create_team tool available - mirrors AcpAgent.loadBuiltinSessionMcpServers().
    if (!this.agentConfig.teamMcpConfig) {
      if (await shouldInjectTeamGuideMcp(this.agentConfig.agentBackend)) {
        const aionStdioConfig = getTeamGuideStdioConfig();
        if (aionStdioConfig) {
          const guideServer: McpServer = {
            name: aionStdioConfig.name,
            command: aionStdioConfig.command,
            args: aionStdioConfig.args,
            env: [
              ...aionStdioConfig.env,
              { name: 'AION_MCP_BACKEND', value: this.agentConfig.agentBackend },
              { name: 'AION_MCP_CONVERSATION_ID', value: this.conversationId },
            ],
          };
          (this.agentConfig as { presetMcpServers?: McpServer[] }).presetMcpServers = [
            ...(this.agentConfig.presetMcpServers || []),
            guideServer,
          ];
        }
      }
    }

    // Load user-configured (builtin) MCP servers from settings, filtered by
    // cached agent MCP capabilities. Mirrors AcpAgent.loadBuiltinSessionMcpServers().

    const rawMcpServers = await ProcessConfig.get('mcp.config');
    if (Array.isArray(rawMcpServers) && rawMcpServers.length > 0) {
      const cachedInit = await ProcessConfig.get('acp.cachedInitializeResult');
      const rawCaps = cachedInit?.[this.agentConfig.agentBackend]?.capabilities?.mcpCapabilities;
      // Enable http/sse so hosted OAuth connectors (e.g. Notion) reach the
      // session - agents advertise http:false by default, which dropped every
      // hosted MCP and left it uncallable in chat. An agent that can't use an
      // http session server simply ignores it.
      const caps = { stdio: rawCaps?.stdio ?? true, http: true, sse: true };
      // Attach the CURRENT (refreshed) OAuth bearer so the session connects with
      // a live token rather than the stale one baked into the CLI/engine config
      // at sync time (the "401 invalid token" / silently-dropped-connector cause).
      // Dynamic import: pulling McpService at module-init would create an OAuth
      // init cycle (HybridTokenStorage TDZ); deferring it to call-time avoids that.
      // On failure fall back to the stored headers (no worse than before).
      let freshened = rawMcpServers as IMcpServer[];
      try {
        const { mcpService } = await import('@process/services/mcpServices/McpService');
        freshened = await mcpService.attachOAuthTokens(freshened);
      } catch (err) {
        console.warn('[AcpAgentV2] attachOAuthTokens failed; using stored MCP headers:', err);
      }
      const userServers = McpConfig.fromStorageConfig(freshened, caps);
      if (userServers.length > 0) {
        (this.agentConfig as { mcpServers?: McpServer[] }).mcpServers = [
          ...(this.agentConfig.mcpServers || []),
          ...userServers,
        ];
      }
    }

    // Self-healing replay: if a stored resumeSessionId was created by a different
    // wrapper version than the one we'd run now, the wrapper's loadSession may
    // accept the id but the restored session state is corrupt (verified against
    // @agentclientprotocol/claude-agent-acp 0.29.x → 0.33.x). Bypass the resume
    // path and prepend a textual conversation summary to the next user message
    // so the agent recovers context without any user intervention.
    const currentWrapperVersion = getCurrentWrapperVersion(this.agentConfig.agentBackend);
    const storedWrapperVersion = this.agentConfig.acpWrapperVersion;
    if (
      this.agentConfig.resumeSessionId &&
      currentWrapperVersion &&
      storedWrapperVersion &&
      currentWrapperVersion !== storedWrapperVersion
    ) {
      console.log(
        `[AcpAgentV2] Wrapper version mismatch for conversation ${this.conversationId} ` +
          `(stored=${storedWrapperVersion}, current=${currentWrapperVersion}); ` +
          'creating fresh session with history replay.'
      );
      try {
        this.pendingReplayContext = await buildHistoryReplayContext(this.conversationId);
      } catch (err) {
        console.warn('[AcpAgentV2] Failed to build replay context, proceeding without it:', err);
        this.pendingReplayContext = null;
      }
      // Drop the stale session id so SessionLifecycle takes the createSession path.
      (this.agentConfig as { resumeSessionId?: string }).resumeSessionId = undefined;
    } else if (this.agentConfig.resumeSessionId) {
      // Normal resume attempt (wrapper version unchanged). claude-agent-acp
      // sessions are in-memory and don't survive a process restart, so the
      // stored sessionId may be unloadable. Arm history replay SPECULATIVELY
      // before we try to resume: if loadSession succeeds, SessionLifecycle
      // signals 'session_loaded' and the onSignal handler clears this; if it
      // fails, it signals 'session_recovered' and we keep the replay so the
      // first prompt against the fresh session restores context. Awaited here
      // (before session.start) so it is ready before any prompt is consumed.
      try {
        this.pendingReplayContext = await buildHistoryReplayContext(this.conversationId);
      } catch (err) {
        console.warn('[AcpAgentV2] Failed to build speculative replay context, proceeding without it:', err);
        this.pendingReplayContext = null;
      }
    }

    const callbacks: SessionCallbacks = this.buildCallbacks();
    const clientFactory = new LegacyConnectorFactory();

    // Resolve prompt timeout: per-backend → global → default (300s)
    const acpConfig = (await ProcessConfig.get('acp.config')) as Record<string, { promptTimeout?: number }> | undefined;
    const backendTimeout = acpConfig?.[this.agentConfig.agentBackend]?.promptTimeout;
    const globalTimeout = await ProcessConfig.get('acp.promptTimeout');
    const timeoutSec = backendTimeout || globalTimeout || 300;
    const promptTimeoutMs = Math.max(30, timeoutSec) * 1000;

    const sessionOptions: SessionOptions = {
      promptTimeoutMs,
      maxStartRetries: 3,
      maxResumeRetries: 2,
      initialDesired: this.agentConfig.initialDesired,
    };

    this.session = new AcpSession(this.agentConfig, clientFactory, callbacks, sessionOptions);

    // Wait for team MCP tools to complete handshake before allowing messages.
    // The stdio script sends mcp_ready with TEAM_AGENT_SLOT_ID after server.connect().
    const teamMcp = this.agentConfig.teamMcpConfig;
    const teamSlotId =
      teamMcp && 'env' in teamMcp
        ? teamMcp.env.find((e: { name: string }) => e.name === 'TEAM_AGENT_SLOT_ID')?.value
        : undefined;
    if (teamSlotId) {
      await waitForMcpReady(teamSlotId, 30_000).catch(() => {
        // waitForMcpReady resolves on timeout (never rejects); this guards an
        // unexpected throw only.
        console.warn('[AcpAgentV2] Team MCP readiness wait threw, proceeding anyway');
      });
      // #7: readiness resolves even on timeout so the session degrades
      // gracefully. When it degraded (team tools never registered), warn - the
      // agent is running without team tools. isMcpDegraded(teamSlotId) stays the
      // readable flag consumed by status/finalizeTurn.
      if (isMcpDegraded(teamSlotId)) {
        console.warn(
          `[AcpAgentV2] Team MCP tools unavailable for ${teamSlotId} (readiness timeout); proceeding degraded`
        );
      }
    }

    return this.session;
  }

  /**
   * Build SessionCallbacks that route new events → old event format
   */
  private buildCallbacks(): SessionCallbacks {
    return {
      onInitialize: (result: unknown) => {
        this.cacheInitializeResult(result).catch((err) => {
          console.warn('[AcpAgentV2] Failed to cache initialize result:', err);
        });
      },

      onMessage: (message: TMessage) => {
        // Merge tool call updates with their original tool_call before emitting
        const resolved =
          message.type === 'acp_tool_call' ? this.mergeToolCall(message as IMessageAcpToolCall) : message;

        const oldMsg = toResponseMessage(resolved, this.conversationId);
        // Skip empty messages (e.g., filtered available_commands)
        if (oldMsg.type) {
          this.onStreamEvent(oldMsg);
        }

        // Intercept navigation tools → emit preview_open for chrome-devtools preview
        if (message.type === 'acp_tool_call') {
          this.emitPreviewIfNavigation(message as IMessageAcpToolCall);
        }
      },

      onSessionId: (sessionId: string) => {
        this.lastSessionId = sessionId;
        if (this.onSessionIdUpdate) {
          this.onSessionIdUpdate(sessionId);
        }
      },

      onStatusChange: (status: SessionStatus) => {
        this.lastStatus = status;
        this.persistStatus(status);

        // Session made forward progress — end the current error/crash episode so a
        // later, unrelated error surfaces as its own banner (#676).
        if (status === 'active') {
          this.errorBannerId = null;
        }

        // Resolve startOp when reaching active/error
        if (status === 'active' && this.startOp) {
          this.lastErrorMessage = null;
          this.resolveOp(this.startOp, undefined);
          this.startOp = null;
        } else if (status === 'error' && this.startOp) {
          // Surface the engine's real failure reason (captured from the error
          // signal enterError emits just before this status change) instead of a
          // generic "Session failed to start" (#483/#369).
          this.rejectOp(this.startOp, new Error(this.lastErrorMessage ?? 'Session failed to start'));
          this.startOp = null;
        }

        // Emit old-style agent_status event
        if (['active', 'suspended', 'error'].includes(status)) {
          const oldStatusName = this.mapStatusToOldName(status);
          this.onStreamEvent({
            type: 'agent_status',
            conversation_id: this.conversationId,
            // Stable per-conversation id so the renderer upserts (collapses) the
            // status banner instead of appending a new one per spawn. A Date.now()
            // id made every respawn a distinct row, stacking "Active session"
            // banners. The legacy agent used a fixed id; V2 had dropped it.
            msg_id: `status_${this.conversationId}`,
            data: { status: oldStatusName, backend: this.agentConfig.agentBackend },
          });
        }
      },

      onModelUpdate: (model: ModelSnapshot, operationGeneration?: number) => {
        if (operationGeneration !== undefined && operationGeneration !== this.modelOp?.generation) {
          return;
        }
        let next = toAcpModelInfo(model);
        if (model.modelConflict) {
          const op = this.modelOp;
          const confirmedModelId = this.cachedModelInfo?.currentModelId ?? null;
          const availableModels =
            next.availableModels.length > 0 ? next.availableModels : (this.cachedModelInfo?.availableModels ?? []);
          const selected = confirmedModelId
            ? availableModels.find((candidate) => candidate.id === confirmedModelId)
            : undefined;
          const blockedInfo: AcpModelInfo = {
            ...next,
            currentModelId: confirmedModelId,
            currentModelLabel: selected?.label ?? this.cachedModelInfo?.currentModelLabel ?? confirmedModelId,
            availableModels,
            canSwitch: availableModels.length > 0,
            confirmationSource: this.cachedModelInfo?.confirmationSource,
            selectionState: 'blocked',
            requestedModelId: op?.requestedModelId,
            selectionFailureCode: 'model_mismatch',
          };
          if (op) {
            this.tombstoneModelOp(op);
            this.modelOp = null;
          }
          this.publishModelInfo(blockedInfo);
          if (op) {
            this.rejectOp(
              op,
              modelSelectionError(
                'model_mismatch',
                `Provider model sources disagree: ${model.modelConflict.modelId} vs ${model.modelConflict.configModelId}`
              )
            );
          }
          return;
        }
        const reportedModelId = next.currentModelId;
        if (!reportedModelId) {
          if (next.availableModels.length === 0) return;
          const confirmedModelId = this.cachedModelInfo?.currentModelId ?? null;
          const selected = confirmedModelId
            ? next.availableModels.find((candidate) => candidate.id === confirmedModelId)
            : undefined;
          this.cachedModelInfo = {
            ...next,
            currentModelId: confirmedModelId,
            currentModelLabel: selected?.label ?? this.cachedModelInfo?.currentModelLabel ?? confirmedModelId,
            confirmationSource: this.cachedModelInfo?.confirmationSource,
          };
          this.onStreamEvent({
            type: 'acp_model_info',
            conversation_id: this.conversationId,
            msg_id: `model_${Date.now()}`,
            data: this.cachedModelInfo,
          });
          this.persistSessionCapabilities();
          return;
        }

        const supersededGeneration = this.supersededModelIds.get(reportedModelId);
        if (supersededGeneration !== undefined && reportedModelId !== this.modelOp?.requestedModelId) {
          return;
        }

        if (next.availableModels.length === 0 && this.cachedModelInfo?.availableModels.length) {
          const selected = this.cachedModelInfo.availableModels.find((candidate) => candidate.id === reportedModelId);
          next = {
            ...next,
            currentModelLabel: selected?.label ?? reportedModelId,
            availableModels: this.cachedModelInfo.availableModels,
            canSwitch: this.cachedModelInfo.canSwitch,
          };
        }
        const op = this.modelOp;
        // An unchanged baseline before any exact confirmation is only the
        // provider's pre-switch snapshot, so keep waiting. Once an exact
        // confirmation has arrived, however, every later non-exact update is
        // authoritative evidence that the provider moved away again — even
        // when it moved back to that same baseline.
        const correlatedExactResponse =
          op?.responseIsCorrelated === true &&
          operationGeneration === op.generation &&
          reportedModelId === op.requestedModelId;
        if (
          op &&
          (reportedModelId !== op.baselineModelId || op.exactConfirmation !== null || correlatedExactResponse)
        ) {
          const catalog = next.availableModels;
          if (catalog.length > 0 && !catalog.some((candidate) => candidate.id === op.requestedModelId)) {
            this.tombstoneModelOp(op);
            this.modelOp = null;
            // The provider's replacement catalog/current model are
            // authoritative even though the requested ID is no longer
            // supported. Publish the actual snapshot, then reject the request.
            this.publishModelInfo(next);
            this.rejectOp(
              op,
              modelSelectionError('unsupported_model', `Provider does not advertise model: ${op.requestedModelId}`)
            );
          } else if (reportedModelId === op.requestedModelId) {
            op.exactConfirmation = next;
            if (op.dispatchComplete) {
              this.modelOp = null;
              this.publishModelInfo(next);
              this.resolveOp(op, next);
            }
          } else {
            this.tombstoneModelOp(op);
            this.modelOp = null;
            // A mismatch is still an authoritative provider snapshot. Publish
            // the actual non-requested model while rejecting the transaction;
            // only the staged requested model is withheld until joint success.
            this.publishModelInfo(next);
            this.rejectOp(
              op,
              modelSelectionError(
                'model_mismatch',
                `Provider reported ${reportedModelId} after requesting ${op.requestedModelId}`
              )
            );
          }
        }
        // Provider state remains staged while a selection transaction is
        // waiting for dispatch. Only joint dispatch + exact confirmation can
        // become visible or persistent.
        if (op) return;
        this.publishModelInfo(next);
      },

      onModeUpdate: (mode: ModeSnapshot) => {
        this.cachedModes = mode;

        // Resolve modeOp if pending
        if (this.modeOp) {
          this.resolveOp(this.modeOp, { success: true });
          this.modeOp = null;
        }

        this.persistSessionCapabilities();
      },

      onConfigUpdate: (config: ConfigSnapshot, operationGeneration?: number) => {
        if (operationGeneration !== undefined && operationGeneration !== this.modelOp?.generation) {
          return;
        }
        this.cachedConfigOptions = toAcpConfigOptions(config.configOptions);

        // Resolve configOp if pending
        if (this.configOp) {
          this.resolveOp(this.configOp, this.cachedConfigOptions);
          this.configOp = null;
        }

        // Forward availableCommands to old callback
        if (this.onAvailableCommandsUpdate && config.availableCommands.length > 0) {
          this.onAvailableCommandsUpdate(config.availableCommands);
        }

        this.persistSessionCapabilities();
      },

      onContextUsage: (usage: ContextUsage) => {
        this.onStreamEvent({
          type: 'acp_context_usage',
          conversation_id: this.conversationId,
          msg_id: `usage_${Date.now()}`,
          data: { used: usage.used, size: usage.total, cost: usage.cost },
        });
      },

      onPermissionRequest: (data) => {
        if (this.onSignalEvent) {
          this.onSignalEvent({
            type: 'acp_permission',
            conversation_id: this.conversationId,
            msg_id: data.callId,
            data: {
              sessionId: this.lastSessionId ?? '',
              toolCall: {
                toolCallId: data.callId,
                title: data.title,
                kind: data.kind,
                rawInput: data.rawInput,
                status: 'pending',
                content: [],
                locations: data.locations ?? [],
              },
              options: data.options.map((opt) => ({
                optionId: opt.optionId,
                name: opt.label,
                kind: opt.kind,
              })),
            },
          });
        }
      },

      onSignal: (event) => {
        // Retain the real reason so a pending start op can reject with it
        // (#483/#369). enterError emits this signal immediately before the status
        // flips to 'error', so it is set in time for the reject in onStatusChange.
        // Captured before the onSignalEvent guard so it works even when no signal
        // sink is wired (the reject path does not depend on onSignalEvent).
        if (event.type === 'error') {
          this.lastErrorMessage = event.message;
        }

        if (!this.onSignalEvent) return;

        switch (event.type) {
          case 'turn_finished':
            // Forward progress — end the current error/crash episode (#676).
            this.errorBannerId = null;
            this.onSignalEvent({
              type: 'finish',
              conversation_id: this.conversationId,
              msg_id: `finish_${Date.now()}`,
              data: null,
            });
            break;

          case 'session_loaded':
            // Resume succeeded; drop the speculative replay so we don't re-send
            // history the resumed session already has.
            this.pendingReplayContext = null;
            break;

          case 'session_recovered':
            // loadSession failed and SessionLifecycle created a fresh session.
            // The speculative replay armed in ensureSession stays set and is
            // consumed by the in-flight prompt (sendMessage), restoring context.
            // Deliberately emit NO error/finish: the turn continues normally.
            console.log(
              `[AcpAgentV2] Session resume failed for conversation ${this.conversationId}; ` +
                'recovered with a fresh session + history replay.'
            );
            break;

          case 'session_expired':
            this.onSignalEvent({
              type: 'error',
              conversation_id: this.conversationId,
              msg_id: `signal_${Date.now()}`,
              data: 'Session expired',
            });
            // Emit finish signal after session_expired
            this.onSignalEvent({
              type: 'finish',
              conversation_id: this.conversationId,
              msg_id: `finish_${Date.now()}`,
              data: null,
            });
            break;

          case 'auth_required':
            // Temporary: run backend-specific login command, then retry.
            // Will be replaced by authCommand + args when Agent Hub lands (PR #2349).
            void this.handleAuthRequired();
            break;

          case 'error': {
            // Detect process crash from error message keywords to emit agentCrash
            // flag that TeammateManager.handleResponseStream relies on (V1 parity).
            const isCrash =
              event.message.includes('process exited unexpectedly') ||
              event.message.includes('PROCESS_CRASHED') ||
              event.message.includes('Process disconnected');

            // Collapse a burst of error/crash banners (start-retry storm, #676)
            // into ONE upserted transcript row by reusing a stable per-episode
            // msg_id. The id is reset on forward progress (new turn / active /
            // turn_finished), so an unrelated later error still gets its own row.
            this.errorBannerId ??= `error_${this.conversationId}_${++this.errorEpisodeSeq}`;
            this.onSignalEvent({
              type: 'error',
              conversation_id: this.conversationId,
              msg_id: this.errorBannerId,
              data: event.message,
            });

            if (isCrash) {
              this.onSignalEvent({
                type: 'finish',
                conversation_id: this.conversationId,
                msg_id: `finish_crash_${Date.now()}`,
                data: {
                  error: event.message,
                  agentCrash: true,
                },
              });
            }
            break;
          }
        }
      },
    };
  }

  /**
   * Merge tool_call_update into existing tool_call to produce a complete message.
   * The renderer does full replacement by toolCallId, so we must preserve fields
   * (title, kind, etc.) that partial updates don't include.
   */
  private mergeToolCall(message: IMessageAcpToolCall): IMessageAcpToolCall {
    const toolCallId = message.content?.update?.toolCallId;
    if (!toolCallId) return message;

    const existing = this.activeToolCalls.get(toolCallId);
    if (!existing) {
      // First time seeing this toolCallId - store and pass through
      this.activeToolCalls.set(toolCallId, message);
      return message;
    }

    // Merge: new fields override, missing fields preserved from existing
    const merged: IMessageAcpToolCall = {
      ...existing,
      msg_id: toolCallId,
      status: message.status,
      content: {
        ...existing.content,
        update: {
          ...existing.content.update,
          ...message.content.update,
          // Only override non-fallback values
          title:
            message.content.update.title !== 'unknown' ? message.content.update.title : existing.content.update.title,
          kind: message.content.update.kind !== 'execute' ? message.content.update.kind : existing.content.update.kind,
          content: message.content.update.content ?? existing.content.update.content,
          rawInput: message.content.update.rawInput ?? existing.content.update.rawInput,
        },
      },
    };

    this.activeToolCalls.set(toolCallId, merged);

    // Clean up completed/failed tool calls after a delay
    if (message.content.update.status === 'completed' || message.content.update.status === 'failed') {
      setTimeout(() => this.activeToolCalls.delete(toolCallId), 60_000);
    }

    return merged;
  }

  /**
   * Map new 7-state FSM to old status names
   */
  /** Persist status: 7 in-memory states → 4 stable DB states. */
  private persistStatus(_status: SessionStatus): void {
    // TODO(ACP Discovery): Re-enable after fixing agent_id.
    // const stable = this.toStableStatus(status);
    // const suspendedAt = status === 'suspended' ? Date.now() : null;
    // this.acpSessionRepo?.updateStatus(this.conversationId, stable, suspendedAt);
  }

  private toStableStatus(status: SessionStatus): 'idle' | 'active' | 'suspended' | 'error' {
    switch (status) {
      case 'idle':
        return 'idle';
      case 'starting':
      case 'active':
      case 'prompting':
      case 'resuming':
        return 'active';
      case 'suspended':
        return 'suspended';
      case 'error':
        return 'error';
    }
  }

  private mapStatusToOldName(status: SessionStatus): string {
    switch (status) {
      case 'idle':
        return 'disconnected';
      case 'starting':
        return 'connecting';
      case 'active':
        return 'session_active';
      case 'prompting':
        return 'session_active';
      case 'suspended':
        return 'disconnected';
      case 'resuming':
        return 'connecting';
      case 'error':
        return 'error';
      default:
        console.warn(`[AcpAgentV2] Unrecognized status: ${status}`);
        return 'disconnected';
    }
  }

  // ─── Public Getters ─────────────────────────────────────────────

  get isConnected(): boolean {
    return this.lastStatus !== 'idle' && this.lastStatus !== 'error';
  }

  get hasActiveSession(): boolean {
    return this.lastStatus === 'active' || this.lastStatus === 'prompting';
  }

  get currentSessionId(): string | null {
    return this.lastSessionId;
  }

  // ─── Lifecycle Methods (Task 4) ────────────────────────────────

  async start(): Promise<void> {
    // Clear any stale error from a prior attempt so this start rejects only with
    // its own failure reason (#483/#369).
    this.lastErrorMessage = null;
    const session = await this.ensureSession();
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.startOp = null;
        reject(new Error('Session start timed out'));
      }, SESSION_START_TIMEOUT_MS);
      this.startOp = { resolve, reject, timer };
      session.start();
    });
  }

  async kill(): Promise<void> {
    await this.session?.stop();
    this.activeToolCalls.clear();
  }

  cancelPrompt(): void {
    this.session?.cancelPrompt();
  }

  // ─── Messaging + Permission Methods (Task 5) ───────────

  async sendMessage(data: { content: string; files?: string[]; msg_id?: string }): Promise<AcpResult> {
    try {
      // A new user turn starts a fresh error/crash episode (#676) so a failure
      // here surfaces as its own banner rather than overwriting a prior one.
      this.errorBannerId = null;
      // Auto-reconnect if session is in error/idle state (mirrors V1 behavior).
      // V1 checks isConnected/hasActiveSession before every prompt and calls start().
      if (this.lastStatus === 'error' || this.lastStatus === 'idle') {
        try {
          await this.kill();
          await this.start();
        } catch (reconnectError) {
          const errorMsg = reconnectError instanceof Error ? reconnectError.message : String(reconnectError);
          return {
            success: false,
            error: {
              type: AcpErrorType.CONNECTION_NOT_READY,
              code: 'CONNECTION_FAILED',
              message: `Failed to reconnect: ${errorMsg}`,
              retryable: true,
            },
          };
        }
      }

      // Reject while session is still booting - caller should retry after
      // the status transitions to active (onStatusChange fires agent_status).
      if (this.lastStatus === 'starting' || this.lastStatus === 'resuming') {
        return {
          success: false,
          error: {
            type: AcpErrorType.CONNECTION_NOT_READY,
            code: 'SESSION_NOT_READY',
            message: `Session is ${this.lastStatus}, please retry shortly`,
            retryable: true,
          },
        };
      }

      // Emit start event via stream channel so AcpAgentManager.handleStreamEvent
      // can emit request_trace (which checks message.type === 'start')
      if (this.onStreamEvent) {
        this.onStreamEvent({
          type: 'start',
          data: null,
          msg_id: data.msg_id ?? `start_${Date.now()}`,
          conversation_id: this.conversationId,
        });
      }

      // Claude: inject model switch notice so the AI knows its identity changed.
      // In terminal "/model X" outputs into conversation; ACP set_model is silent.
      let content = data.content;

      // Self-healing replay: if ensureSession dropped a stale-wrapper resume id,
      // prepend the locally-rebuilt conversation history so the agent recovers
      // context on its first turn against the fresh session.
      if (this.pendingReplayContext) {
        content = this.pendingReplayContext + '\n[CURRENT MESSAGE]\n' + content;
        this.pendingReplayContext = null;
      }

      if (this.pendingModelSwitchNotice) {
        content =
          `<system-reminder>\n` +
          `Model switch: The active model has been changed to ${this.pendingModelSwitchNotice} via the /model command. ` +
          `You are now running as ${this.pendingModelSwitchNotice}. ` +
          `The ANTHROPIC_MODEL environment variable and the earlier "You are powered by" text in the system prompt are stale (cached from session start) and no longer reflect the actual model. ` +
          `When asked which model you are, answer ${this.pendingModelSwitchNotice}.\n` +
          `</system-reminder>\n\n` +
          content;
        this.pendingModelSwitchNotice = null;
      }

      if (!this.session) {
        throw new AcpSessionError('INVALID_STATE', 'Session not available after reconnect');
      }
      await this.session.sendMessage(content, data.files);
      return { success: true, data: null };
    } catch (err) {
      let errorType = err instanceof AcpSessionError ? mapAcpErrorCodeToType(err.code) : AcpErrorType.UNKNOWN;
      let errorMessage = err instanceof Error ? err.message : String(err);
      const retryable = err instanceof AcpSessionError ? err.retryable : false;

      // Qwen backend: enhance "Internal error" with actionable troubleshooting steps
      if (this.agentConfig.agentBackend === 'qwen' && errorMessage.includes('Internal error')) {
        errorType = AcpErrorType.AUTHENTICATION_FAILED;
        errorMessage =
          'Qwen ACP Internal Error: This usually means authentication failed or ' +
          'the Qwen CLI has compatibility issues. Please try: 1) Restart the application ' +
          '2) Use the packaged bun launcher instead of a global qwen install ' +
          '3) Check if you have valid Qwen credentials.';
      }

      // Emit finish signal to reset frontend loading state and Manager turn tracking.
      // Without this the UI stays in loading state until the 15s
      // missingFinishFallbackTimer fires. PromptExecutor.handlePromptError
      // re-throws without emitting turn_finished, so no duplicate.
      this.onSignalEvent?.({
        type: 'finish',
        conversation_id: this.conversationId,
        msg_id: `finish_${Date.now()}`,
        data: null,
      });

      return {
        success: false,
        error: {
          type: errorType,
          code: err instanceof AcpSessionError ? err.code : 'UNKNOWN',
          message: errorMessage,
          retryable,
        },
      };
    }
  }

  async confirmMessage(data: { confirmKey: string; callId: string }): Promise<AcpResult> {
    try {
      this.session!.confirmPermission(data.callId, data.confirmKey);
      return { success: true, data: null };
    } catch (err) {
      return {
        success: false,
        error: {
          type: AcpErrorType.UNKNOWN,
          code: 'UNKNOWN',
          message: err instanceof Error ? err.message : String(err),
          retryable: false,
        },
      };
    }
  }

  // ─── Config/Model/Mode Methods (Task 6 - partial) ──────────────

  getModelInfo(): AcpModelInfo | null {
    // Claude: prefer cc-switch model source for accurate model names and slot mapping
    if (this.agentConfig.agentBackend === 'claude') {
      const ccSwitchInfo = readClaudeModelInfoFromCcSwitch();
      if (ccSwitchInfo) {
        const currentId = this.cachedModelInfo?.currentModelId ?? null;
        const selected = currentId ? ccSwitchInfo.availableModels.find((model) => model.id === currentId) : undefined;
        return {
          ...this.cachedModelInfo,
          ...ccSwitchInfo,
          currentModelId: currentId,
          currentModelLabel: selected?.label ?? this.cachedModelInfo?.currentModelLabel ?? currentId,
          confirmationSource: this.cachedModelInfo?.confirmationSource,
        };
      }
      // Claude Code's ACP wrapper never advertises a switchable model list, so
      // cachedModelInfo stays null and the picker is stuck on "Select Model"
      // (#184). Fall back to the static Sonnet/Opus/Haiku slots (applied via
      // --model / ANTHROPIC_MODEL on (re)spawn) so the user can pick a model.
      if (!this.cachedModelInfo || this.cachedModelInfo.availableModels.length === 0) {
        const slots = buildClaudeSlotModelInfo();
        const currentId = this.cachedModelInfo?.currentModelId ?? null;
        const selected = currentId ? slots.availableModels.find((model) => model.id === currentId) : undefined;
        return {
          ...this.cachedModelInfo,
          ...slots,
          currentModelId: currentId,
          currentModelLabel: selected?.label ?? this.cachedModelInfo?.currentModelLabel ?? currentId,
          confirmationSource: this.cachedModelInfo?.confirmationSource,
        };
      }
      return this.cachedModelInfo;
    }

    // Non-claude ACP backends (codex, qwen, …): a background model event / poll
    // overwrites cachedModelInfo with the agent's DEFAULT after a turn, which
    // drops the user's in-chat pick (userModelOverride) — the same revert #136/
    // #146/#149 fixed for claude, but claude was the only backend the override
    // was honored for. When we hold an override the cached list still offers (or
    // the list is empty), report the override instead of the reverted default so
    // a codex pick sticks. Flux ids ride the spawn env and are surfaced by the
    // renderer's flux pin, so they are intentionally not overlaid here.
    const override = this.userModelOverride;
    const cached = this.cachedModelInfo;
    if (override && !isFluxModelId(override) && cached && cached.currentModelId !== override) {
      const models = cached.availableModels ?? [];
      if (models.length === 0 || models.some((m) => m.id === override)) {
        const selected = models.find((m) => m.id === override);
        return {
          ...cached,
          currentModelId: override,
          currentModelLabel: selected?.label ?? override,
        };
      }
    }
    return this.cachedModelInfo;
  }

  getConfigOptions(): AcpSessionConfigOption[] {
    return this.cachedConfigOptions.filter((opt) => opt.category !== 'model' && opt.category !== 'mode');
  }

  async setModelByConfigOption(modelId: string): Promise<AcpModelInfo> {
    const generation = ++this.modelGeneration;
    const responseIsCorrelated = this.cachedConfigOptions.some(
      (option) => option.category === 'model' && option.type === 'select'
    );
    const previousOp = this.modelOp;
    if (previousOp) {
      this.tombstoneModelOp(previousOp);
      this.modelOp = null;
      this.rejectOp(
        previousOp,
        modelSelectionError('model_rejected', `Model selection was superseded: ${previousOp.requestedModelId}`)
      );
    }
    const modelConfig = this.cachedConfigOptions.find(
      (option) => option.category === 'model' && option.type === 'select'
    );
    const configCatalog = modelConfig?.options?.map((option) => option.value) ?? [];
    let providerModelId = modelId;
    if (
      modelConfig &&
      this.agentConfig.agentBackend === 'codex' &&
      configCatalog.length > 0 &&
      !configCatalog.includes(modelId)
    ) {
      const parsed = parseCodexModelId(modelId);
      if (parsed.effort && configCatalog.includes(parsed.baseModelId)) {
        providerModelId = parsed.baseModelId;
      }
    }
    const advertisedModelIds =
      configCatalog.length > 0
        ? configCatalog
        : (this.cachedModelInfo?.availableModels.map((candidate) => candidate.id) ?? []);
    if (advertisedModelIds.length > 0 && !advertisedModelIds.includes(providerModelId)) {
      throw modelSelectionError('unsupported_model', `Provider does not advertise model: ${modelId}`);
    }

    if (isFluxModelId(modelId)) {
      if (this.cachedModelInfo?.currentModelId === modelId && this.cachedModelInfo.confirmationSource) {
        this.supersededModelIds.delete(modelId);
        return this.cachedModelInfo;
      }
      throw modelSelectionError(
        'confirmation_unavailable',
        `Flux model requires provider session confirmation: ${modelId}`
      );
    }

    this.supersededModelIds.delete(providerModelId);

    const confirmation = new Promise<AcpModelInfo>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.modelOp?.generation !== generation) return;
        this.tombstoneModelOp(this.modelOp);
        this.modelOp = null;
        reject(modelSelectionError('model_switch_timeout', `Model confirmation timed out: ${modelId}`));
      }, 60_000);
      this.modelOp = {
        requestedModelId: providerModelId,
        generation,
        baselineModelId: this.cachedModelInfo?.currentModelId ?? null,
        responseIsCorrelated,
        exactConfirmation: null,
        dispatchComplete: false,
        resolve,
        reject,
        timer,
      };
    });

    const dispatch = this.dispatchModelSelection(providerModelId, generation)
      .then(() => {
        const op = this.modelOp;
        if (op?.generation !== generation) return;
        op.dispatchComplete = true;
        if (op.exactConfirmation) {
          const confirmed = op.exactConfirmation;
          this.modelOp = null;
          this.publishModelInfo(confirmed);
          this.resolveOp(op, confirmed);
        }
      })
      .catch((error) => {
        const failure = modelSelectionError('model_rejected', error instanceof Error ? error.message : String(error));
        if (this.modelOp?.generation === generation) {
          const op = this.modelOp;
          this.tombstoneModelOp(op);
          this.modelOp = null;
          this.rejectOp(op, failure);
        }
        throw failure;
      });

    const [, confirmed] = await Promise.all([dispatch, confirmation]);
    if (generation !== this.modelGeneration) {
      throw modelSelectionError('model_rejected', `Model selection was superseded: ${modelId}`);
    }
    if (this.modelOp?.generation === generation) this.modelOp = null;
    this.userModelOverride = modelId;
    if (this.agentConfig.agentBackend === 'claude') {
      this.pendingModelSwitchNotice = modelId;
    }
    return confirmed;
  }

  private async dispatchModelSelection(modelId: string, generation: number): Promise<void> {
    const modelConfig = this.cachedConfigOptions.find(
      (option) => option.category === 'model' && option.type === 'select'
    );
    if (modelConfig) {
      await this.session!.setConfigOption(
        modelConfig.id,
        modelId,
        generation,
        () => this.modelOp?.generation === generation
      );
      return;
    }
    await this.session!.setModel(modelId);
  }

  async setMode(mode: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.modeOp = null;
        resolve({ success: true }); // Optimistic timeout
      }, 10_000);
      this.modeOp = { resolve, reject, timer };
      this.session!.setMode(mode);
    });
  }

  async setConfigOption(configId: string, value: string): Promise<AcpSessionConfigOption[]> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.configOp = null;
        resolve(this.cachedConfigOptions); // Fallback to cached
      }, 10_000);
      this.configOp = { resolve, reject, timer };
      this.session!.setConfigOption(configId, value);
    });
  }

  async enableYoloMode(): Promise<void> {
    await this.setMode(getFullAutoMode(this.agentConfig.agentBackend));
  }

  // ─── Helper Methods ─────────────────────────────────────────────

  /**
   * Check if an acp_tool_call is a navigation tool (chrome-devtools) and emit
   * a preview_open event so the URL shows in the preview panel.
   */
  private emitPreviewIfNavigation(message: IMessageAcpToolCall): void {
    const title = message.content?.update?.title;
    const rawInput = message.content?.update?.rawInput as Record<string, unknown> | undefined;
    if (!title) return;

    if (!NavigationInterceptor.isNavigationTool(title)) return;

    const url = NavigationInterceptor.extractUrl({ arguments: rawInput });
    if (!url) return;

    const previewMsg = NavigationInterceptor.createPreviewMessage(url, this.conversationId);
    this.onStreamEvent(previewMsg);
  }

  /**
   * Temporary auth recovery: run backend CLI login command, then retry session.
   *
   * Claude Code doesn't support ACP's authenticate() method - it requires
   * `claude /login` to refresh OAuth tokens. The non-official ACP bridge
   * (claude-agent-acp) can't do this itself.
   *
   * Will be replaced by `authCommand + args` config when Agent Hub lands (PR #2349).
   */
  private async handleAuthRequired(): Promise<void> {
    // Guard: only attempt login once to prevent infinite loops
    // (e.g., expired AWS SSO that can't be refreshed non-interactively)
    if (this.authRetryAttempted) {
      console.warn('[AcpAgentV2] Auth already retried once, giving up');
      this.onSignalEvent?.({
        type: 'error',
        conversation_id: this.conversationId,
        msg_id: `signal_${Date.now()}`,
        data: 'Authentication failed after retry. Please authenticate manually and restart.',
      });
      return;
    }
    this.authRetryAttempted = true;

    const backend = this.agentConfig.agentBackend;
    try {
      await runBackendLogin(backend, this.agentConfig.command);
      // Reload credentials from env after login refreshes tokens
      const creds = await loadAuthCredentials(backend, this.agentConfig.env);
      this.session?.retryAuth(creds ?? undefined);
    } catch (err) {
      console.warn(`[AcpAgentV2] ${backend} auth refresh failed:`, err);
      this.onSignalEvent?.({
        type: 'error',
        conversation_id: this.conversationId,
        msg_id: `signal_${Date.now()}`,
        data: `Authentication failed for ${backend}. Please authenticate manually and restart.`,
      });
    }
  }

  private resolveOp<T>(op: PendingOp<T>, value: T): void {
    clearTimeout(op.timer);
    op.resolve(value);
  }

  private tombstoneModelOp(op: PendingModelOp): void {
    if (!op.responseIsCorrelated) {
      this.supersededModelIds.set(op.requestedModelId, op.generation);
    }
  }

  private publishModelInfo(modelInfo: AcpModelInfo): void {
    this.cachedModelInfo = modelInfo;
    this.onStreamEvent({
      type: 'acp_model_info',
      conversation_id: this.conversationId,
      msg_id: 'model_' + Date.now(),
      data: modelInfo,
    });
    this.persistSessionCapabilities();
  }

  private rejectOp<T>(op: PendingOp<T>, err: Error): void {
    clearTimeout(op.timer);
    op.reject(err);
  }

  /**
   * Persist initialize result to disk so team MCP, MCP filtering, and other
   * consumers can read agent capabilities before an active session exists.
   */
  private async cacheInitializeResult(initResult: unknown): Promise<void> {
    const backend = this.agentConfig.agentBackend;
    const cached = (await ProcessConfig.get('acp.cachedInitializeResult')) || {};
    await ProcessConfig.set('acp.cachedInitializeResult', {
      ...cached,
      [backend]: parseInitializeResult(initResult),
    });
  }

  /**
   * Persist session capabilities to disk so Guid page / selectors can render
   * from cache before an active session exists. Uses a static queue to
   * serialize writes when multiple backends start concurrently.
   */
  private persistSessionCapabilities(): void {
    const backend = this.agentConfig.agentBackend;
    const modelInfo = this.cachedModelInfo;
    const configOptions = this.cachedConfigOptions;
    const modes = this.cachedModes;

    const job = AcpAgentV2.cacheQueue.then(async () => {
      if (modelInfo && modelInfo.availableModels && modelInfo.availableModels.length > 0) {
        const cached = (await ProcessConfig.get('acp.cachedModels')) || {};
        const existing = cached[backend];
        await ProcessConfig.set('acp.cachedModels', {
          ...cached,
          [backend]: {
            ...modelInfo,
            // Preserve the original default model from the first session
            currentModelId: existing?.currentModelId ?? modelInfo.currentModelId,
            currentModelLabel: existing?.currentModelLabel ?? modelInfo.currentModelLabel,
          },
        });
      }

      if (configOptions.length > 0) {
        const cached = (await ProcessConfig.get('acp.cachedConfigOptions')) || {};
        await ProcessConfig.set('acp.cachedConfigOptions', {
          ...cached,
          [backend]: configOptions,
        });
      }

      if (modes && modes.availableModes.length > 0) {
        const cached = (await ProcessConfig.get('acp.cachedModes')) || {};
        await ProcessConfig.set('acp.cachedModes', {
          ...cached,
          [backend]: {
            currentModeId: modes.currentModeId ?? undefined,
            availableModes: modes.availableModes.map((m) => ({
              id: m.id,
              name: m.name,
              description: m.description,
            })),
          },
        });
      }
    });
    AcpAgentV2.cacheQueue = job.catch(() => {});
  }
}
