/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { getPlatformServices } from '@/common/platform';
import * as os from 'node:os';
import { join } from 'node:path';
import type { CronMessageMeta, IMessageToolGroup, TMessage } from '@/common/chat/chatLib';
import { transformMessage } from '@/common/chat/chatLib';
import {
  PATH_BOUNDARY_DENY,
  PATH_BOUNDARY_GRANT_FOLDER,
  FOLDER_GRANT_REPLAY_AVAILABLE,
  PATH_BOUNDARY_REMEMBER_FOLDER,
  PATH_BOUNDARY_ROOT_PARAM,
  isPathBoundaryConfirmation,
  isPathBoundaryGrantValue,
  isPathBoundaryOptionValue,
  pathBoundaryRootOf,
} from '@/common/chat/pathBoundaryConsent';
import type { FolderGrantRefusal } from '@/common/workspace/folderGrants';
import {
  defaultFolderGrantRootContext,
  defaultWorkspaceFolderGrantStore,
} from '@process/services/workspace/folderGrantStore';
import { vetFolderGrantRoot } from '@process/services/workspace/folderGrantAuthority';
import { resolveFolderGrantWorkspaceId } from '@process/services/workspace/folderGrantWorkspaceId';
import { composeResetSeed, type ResumeSeedOptions } from '@process/task/resumeSeed';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { channelEventBus } from '@process/channels/agent/ChannelEventBus';
import { teamEventBus } from '@process/team/teamEventBus';
import type { TProviderWithModel } from '@/common/config/storage';
import { buildWCoreSessionMcpServers } from '@process/agent/acp/mcpSessionConfig';
import { WCoreMcpAgent } from '@process/services/mcpServices/agents/WCoreMcpAgent';
import { mcpService } from '@process/services/mcpServices/McpService';
import { normalizeMcpServerForSpawn } from '@/common/mcp/normalizeMcpServer';
import { applyBuiltinMcpRuntime } from '@process/services/mcpServices/builtinMcpRuntime';
import { validateMcpServer } from '@process/services/mcpServices/validateMcpServer';
import { getCandidateTools } from '@process/services/mcpServices/getCandidateTools';
import type { CandidateTool } from '@process/services/tools/toolContract';
import type { IMcpServer } from '@/common/config/storage';
import {
  createMcpSessionState,
  recordDesktopMcpSessionFailure,
  recordDesktopMcpSessionPublication,
  reduceMcpSessionTerminal,
  type McpSessionExpectedServer,
  type McpSessionState,
  type McpSessionTerminalEvent,
} from '@/common/mcp/sessionReceipt';
import { resolveFixedBudget } from '@/common/config/outputBudget';
import { ProcessConfig } from '@process/utils/initStorage';
import { readOutputBudgetPreference, readRawEngineModePreference } from '@process/agent/wcore/effectiveRuntimeActions';
import { BaseApprovalStore, type IApprovalKey } from '@/common/chat/approval';
import { trustedWorkspaceAutoApprovesConfirmationType } from '@/common/security/workspaceTrust';
import { isWorkspaceTrusted } from '@process/permissions/workspaceTrust';
import { ToolConfirmationOutcome } from '../agent/gemini/cli/tools/tools';
import { WCoreAgent, type StdioMcpOption } from '@process/agent/wcore';
import { describeExitReason } from '@process/agent/wcore/execFailureReason';
import { acquireRuntimeLaunchAuthority } from '@process/agent/wcore/profilePaths';
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
import { emitModelRegistryChanged } from '@process/providers/modelRegistryEvents';
import { isProviderKeyAuthFailure } from '@process/providers/detection/authFailure';
import { registryProviderIdForModel } from '@process/providers/ipc/modelRegistryIpc';
import { addMessage, addOrUpdateMessage } from '@process/utils/message';
import { uuid } from '@/common/utils';
import BaseAgentManager from './BaseAgentManager';
import { IpcAgentEventEmitter } from './IpcAgentEventEmitter';
import { mainError, mainLog, mainWarn } from '@process/utils/mainLogger';
import { redactCommandSecrets } from '@/common/utils/redactCommandSecrets';
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
import { loadRuntimeMcpServers } from '@process/services/mcpServices/runtimeMcpServers';
import {
  createMcpSessionDigestKey,
  createMcpSessionExpectedServer,
} from '@process/services/mcpServices/mcpSessionTruthGate';
import { ConstitutionFsTransactionError } from '@process/services/constitution/constitutionFsTransaction';
import { DesktopProfileSpliceError } from '@process/agent/wcore/desktopProfileSplice';

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

/**
 * W-1b: minimum gap between bootstrap RETRIES (the first one is immediate).
 * A failed `start()` is bounded by its own 30s ready timeout, so 60s keeps a
 * pathological automatic caller - a scheduled task firing against a broken
 * config - to well under one spawn per minute.
 */
const BOOTSTRAP_RETRY_COOLDOWN_MS = 60_000;

const WCORE_PREFERENCE_AUTHORITY = {
  get: (key: string) => ProcessConfig.get(key as never) as Promise<unknown>,
  set: (key: string, value: unknown) => ProcessConfig.set(key as never, value as never),
  remove: (key: string) => ProcessConfig.remove(key as never),
};

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

/**
 * The assistant persona for a wcore conversation, from whichever key holds it.
 *
 * Nullish coalescing, deliberately, not `||`: an assistant that carries an
 * empty rules string has said something, and must not be silently overridden by
 * a stale value on the other key.
 */
export const resolveWCorePresetRules = (data: { presetRules?: string; presetContext?: string }): string | undefined =>
  data.presetRules ?? data.presetContext;

type WCoreManagerData = {
  workspace: string;
  proxy?: string;
  model: TProviderWithModel;
  conversation_id: string;
  yoloMode?: boolean;
  presetRules?: string;
  /**
   * The same rules under the key the ACP backends use.
   *
   * wcore reads `presetRules` and always has. But preset assistants created
   * through `buildAgentConversationParams` before that was fixed wrote their
   * rules to `presetContext`, and `ConversationServiceImpl` copies unconsumed
   * `extra` keys onto the stored row - so the persona was persisted the whole
   * time, on a key nothing here ever looked at. Every wcore preset conversation
   * created from the "+" menu or as a team specialist is still carrying one.
   *
   * Reading it as a fallback is what makes those conversations recover. Without
   * it, rewriting an assistant's persona reaches only chats created after the
   * fix, and the ones already open stay wrong forever.
   */
  presetContext?: string;
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
   * #723 per-step context reset: when set, start()'s resume branch seeds the
   * fresh engine with ONLY this bounded carry-forward (the immediately-prior
   * deliverable) instead of the default #457 resume seed. Threaded verbatim from
   * `BuildConversationOptions.workflowResetSeed`. Absent => default seed (today).
   * The field name `workflowResetSeed` is identical across every hop (INVARIANT).
   */
  workflowResetSeed?: ResumeSeedOptions;
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

/**
 * Cap for wcore `info` event text in the persistent log (#714). These events
 * include full tool results ("[Grep success] <matched content>") — observed
 * single entries up to ~600 KB — so the daily electron-log file was a plaintext
 * copy of everything the agent read, API keys included. A short head is all a
 * debugging session needs; the full output still reaches the renderer via the
 * normal message stream.
 */
export const INFO_LOG_PREVIEW_MAX_CHARS = 400;

/**
 * Reduce a wcore `info` payload to something safe to persist to the on-disk
 * log (#714): truncate to a short preview, then mask recognizable secret
 * shapes with the same redactor the activity timeline uses (#610). Truncation
 * runs FIRST so the redaction regexes never scan a multi-hundred-KB string; a
 * secret cut by the boundary either still matches (the prefixed-key regex
 * needs only 6 chars past the prefix) or has too little of it left to matter.
 * Non-string payloads (e.g. the `approval_required` diagnostic's structured
 * data, whose engine-supplied `context` is free-form) are JSON-stringified so
 * they stay readable AND pass through the same redaction. This is the desktop
 * log-file surface; engine-side transports are #584.
 */
export function toSafeInfoLogPreview(info: unknown): string {
  let text: string;
  if (typeof info === 'string') {
    text = info;
  } else {
    try {
      text = JSON.stringify(info) ?? String(info);
    } catch {
      text = String(info); // circular/unserializable - type tag beats nothing
    }
  }
  const truncated =
    text.length > INFO_LOG_PREVIEW_MAX_CHARS
      ? `${text.slice(0, INFO_LOG_PREVIEW_MAX_CHARS)}… [+${text.length - INFO_LOG_PREVIEW_MAX_CHARS} chars truncated]`
      : text;
  return redactCommandSecrets(truncated);
}

/** Why a folder the user granted could not be added to the durable list. */
export type FolderGrantNotRememberedReason =
  | FolderGrantRefusal
  /** No absolute workspace path, so there is no honest key to file it under. */
  | 'no_workspace_identity'
  /** The list itself could not be read or written. */
  | 'write_failed';

/**
 * What the user is told when the grant worked but remembering it did not.
 *
 * Every string opens with the fact that the folder IS open now, because that is
 * the part that decides whether they need to do anything about the call in
 * front of them, and closes with what will be different next time. Plain
 * English rather than an i18n key for the same reason every other main-process
 * `tips` notice in this file is (see the bootstrap-failure notice and
 * `constitutionReclaimNotice`): this text is composed process-side, where the
 * renderer's translation catalogue is not loaded.
 */
export function folderGrantNotRememberedText(root: string, reason: FolderGrantNotRememberedReason): string {
  const opened = `Wayland opened ${root} for this chat, but could not remember it for next time.`;
  switch (reason) {
    case 'grant_cap_reached':
      return `${opened} This workspace already has the maximum number of remembered folders. Remove one to make room, then try again.`;
    case 'credential_store':
    case 'wayland_private':
      return `${opened} Folders that hold sign-in credentials are never remembered, so you will be asked again next time.`;
    case 'home_directory':
    case 'root_of_filesystem':
      return `${opened} A folder this broad is never remembered, so you will be asked again next time.`;
    case 'not_an_absolute_directory':
    case 'no_workspace_identity':
    case 'write_failed':
    default:
      return `${opened} You will be asked again next time.`;
  }
}

/**
 * What the user is told when Wayland REFUSED the folder they just granted.
 *
 * Different event, different sentence, deliberately not a variant of
 * {@link folderGrantNotRememberedText}: there the read went ahead and only the
 * record failed, here the read did NOT go ahead. A user who saw "Wayland opened
 * ..." on a call that was denied would go looking for the wrong problem.
 *
 * Names the folder and the reason, because the alternative is a tool call that
 * fails with the agent's own guess at why. Plain English rather than an i18n
 * key, like every other main-process `tips` notice in this file: this text is
 * composed process-side, where the renderer's catalogue is not loaded.
 */
export function folderGrantRefusedText(root: string, refusal: FolderGrantRefusal): string {
  const refused = `Wayland did not open ${root}, and the tool call was denied.`;
  switch (refusal) {
    case 'wayland_private':
      return `${refused} That folder holds Wayland's own configuration and saved sign-in details, which are never opened to an agent.`;
    case 'credential_store':
      return `${refused} That folder holds sign-in credentials, which are never opened to an agent.`;
    case 'home_directory':
    case 'root_of_filesystem':
      return `${refused} A folder that broad is never opened to an agent - pick the specific folder the agent needs.`;
    case 'not_an_absolute_directory':
    case 'grant_cap_reached':
    default:
      return `${refused} That folder could not be opened.`;
  }
}

/**
 * The folder-grant card's options, in the order the card renders them.
 *
 * Exported so the tests exercise THIS function rather than a copy of it. A test
 * file on the previous milestone reimplemented the thing it claimed to be
 * testing, and passed while production was broken; the fix is that there is one
 * definition and everyone reads it.
 */
export function buildPathBoundaryOptions(suggestedRoot: string) {
  return [
    {
      label: 'messages.confirmation.grantFolderAlways',
      value: PATH_BOUNDARY_GRANT_FOLDER,
      params: { [PATH_BOUNDARY_ROOT_PARAM]: suggestedRoot },
      description: 'messages.confirmation.grantFolderAlwaysHint',
    },
    // The same grant, also written to this workspace's durable list.
    // SECOND, not first: `options[0]` is what both index-keyed
    // auto-confirm paths pick, and while both exclude this card, the
    // ordering decides the blast radius if either exclusion regresses.
    // The narrower grant is the one that sits in that slot.
    //
    // Built from the SAME `suggestedRoot` as the option above -
    // one value, read back by one accessor (`pathBoundaryRootOf`), so
    // the two buttons cannot come to name different folders.
    //
    // OFFERED ONLY WHEN A REMEMBERED FOLDER IS ACTUALLY RE-APPLIED.
    // Its label promises the folder is still open next time; until
    // `grant_path` is sendable that promise is false, and a false
    // promise on a consent surface is worse than a missing button.
    // See `FOLDER_GRANT_REPLAY_AVAILABLE` for what has to land.
    ...(FOLDER_GRANT_REPLAY_AVAILABLE
      ? [
          {
            label: 'messages.confirmation.grantFolderRemember',
            value: PATH_BOUNDARY_REMEMBER_FOLDER,
            params: { [PATH_BOUNDARY_ROOT_PARAM]: suggestedRoot },
            description: 'messages.confirmation.grantFolderRememberHint',
          },
        ]
      : []),
    { label: 'messages.confirmation.grantFolderDeny', value: PATH_BOUNDARY_DENY },
  ];
}

/** Test alias, kept explicit so the export's purpose is legible at the call site. */
export const buildPathBoundaryOptionsForTest = buildPathBoundaryOptions;

export class WCoreManager extends BaseAgentManager<WCoreManagerData, string> {
  workspace: string;
  model: TProviderWithModel;
  readonly approvalStore = new WCoreApprovalStore();
  private agent: WCoreAgent | null = null;
  private agentReady: Promise<void>;
  /** Captured failure from `start()`, so a failed bootstrap surfaces an honest
   * error+finish on the next `sendMessage` instead of silently hanging the turn. */
  private startError: unknown = null;
  /** W-1b: bounds automatic callers; see `ensureBootstrap`. */
  private bootstrapRetries = 0;
  private lastBootstrapAttemptAt = 0;
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
  /**
   * Whether an `error` frame arrived during the current turn.
   *
   * Turn end alone cannot tell a successful turn from a failed one: the engine
   * emits the same `finish` either way, so a turn that died on a provider 400
   * settled with a green "completed" tag over a visible error message. Observed
   * live - the run reported success while the transcript showed
   * "Provider error: API error 400" - which is the same class of lie as the
   * "running forever" bug the turn-end verdict was added to fix, only pointing
   * the other way.
   */
  private _turnSawError = false;

  // #264 - an auto-mode `approval_required` the engine could not self-resolve is
  // escalated through the existing Confirming gate (see the approval_required
  // handler). That card is resumed by resume_token, but the renderer only routes
  // a callId back to confirm(); map callId -> resumeToken here so confirm() can
  // redirect to resumeApproval(). ONLY escalation callIds are stored, so ordinary
  // interactive tool_group approvals never hit the redirect and cannot double-drive.
  private readonly pendingApprovalTokens = new Map<string, string>();

  /**
   * A2 - callIds this turn has already put through the `Confirming` tool_group
   * gate. Populated in `handleConformationMessage` BEFORE `tryAutoApprove`, so
   * an auto-approved request registers too; cleared at turn end.
   *
   * WHY IT EXISTS. wayland-core v0.13.4's `GatingProtocolWriter::emit`
   * synthesizes an `ApprovalRequired` with an EMPTY `resume_token` after EVERY
   * gated `ToolRequest`. On the wire that is byte-indistinguishable from a
   * genuine bridge-backed HITL suspend that we can neither resume nor escalate,
   * so the diagnostic below shouted "turn may wedge" at ERROR on turns that
   * were never wedged - 23 occurrences in one live log, every one of them
   * answered by the ordinary tool_group path 60-200ms later.
   *
   * The engine gave us no discriminator, but the companion always FOLLOWS a
   * `tool_request` for the SAME call_id, and that call_id has already come
   * through here. So: known call_id -> the tool_group gate owns it, log at
   * info. Unknown call_id -> genuinely un-actionable, stays a loud error.
   * See `A4` in the plan for the Core-side ask that would let us delete this.
   */
  private readonly gatedToolCallIds = new Set<string>();

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

  /** Session-scoped MCP truth. Serialized so simultaneous Core receipts cannot clobber each other in DB. */
  private readonly mcpSessionGeneration = uuid();
  private readonly mcpSessionDigestKey = createMcpSessionDigestKey();
  private mcpSessionState: McpSessionState;
  /** Exact servers that produced this launch's receipts; the candidate gate's allowedTools/description source. */
  private sessionMcpServers: IMcpServer[] = [];
  private mcpSessionPersistQueue: Promise<void> = Promise.resolve();
  private releaseProfileLease: (() => Promise<void>) | null = null;
  /** One exact engine identity may have only one tree-shutdown proof attempt in
   * flight. A rejected attempt is forgotten only as an attempt; `agent` stays
   * published so a later manager kill retries that same identity. */
  private engineShutdownAttempt: { agent: WCoreAgent; promise: Promise<void> } | null = null;
  private disposed = false;

  constructor(data: WCoreManagerData, model: TProviderWithModel) {
    super('wcore', { ...data, model }, new IpcAgentEventEmitter(), false);
    this.workspace = data.workspace;
    this.conversation_id = data.conversation_id;
    this.mcpSessionState = createMcpSessionState(this.mcpSessionGeneration, [], {
      conversationId: this.conversation_id,
      backend: 'wcore',
    });
    this.model = model;
    this.currentMode = data.sessionMode || 'default';

    // enableFork=false skips auto-init in ForkTask, so init manually
    this.init();

    // Start the agent bootstrap - store promise so sendMessage can await it.
    // Capture (don't swallow) a failed start: agentReady still resolves so the
    // sendMessage path is reached, where startError is surfaced as a real
    // error+finish instead of hanging the turn with no reply (S2).
    this.agentReady = this.start().catch((error) => this.captureBootstrapFailure(error));
  }

  private async captureBootstrapFailure(error: unknown): Promise<void> {
    let surfacedError = error;

    // A bootstrap path that never published an engine identity owns no
    // process tree, so its profile can be returned. If an identity remains,
    // shutdown failed and both it and the lease are deliberately retained for
    // an identity-bound retry through kill().
    if (!this.agent) {
      try {
        await this.releaseProfileLaunchLease();
      } catch (releaseError) {
        surfacedError = new AggregateError(
          [error, releaseError],
          'Wayland Core bootstrap failed and its runtime profile lease could not be released'
        );
      }
    }

    this.startError = surfacedError;
    mainError('[WCoreManager]', 'agent bootstrap (start) failed', surfacedError);
  }

  /**
   * W-1b: let a later turn retry a failed bootstrap.
   *
   * `startError` had exactly one writer and no reset, so the FIRST failure was
   * cached for the life of the conversation: every later turn replayed the
   * identical error without spawning anything. Observed live - the same message
   * and the same PID reported 95 seconds apart, with no second
   * `(start) failed` line between them, and the crash sentinel it named already
   * gone from disk. The cache outlived the condition, and the only recovery was
   * restarting the whole app.
   *
   * Deliberately synchronous check-and-assign. Writing this as
   * `await this.agentReady; if (this.startError) {...}` would race: a second
   * turn could observe `startError` already cleared by the first while `agent`
   * is still null, and fall through to `emitStartFailure` with no reason.
   *
   * One lazy attempt per user-initiated turn, serialized by the shared promise.
   * No timer, no backoff, no background retry: `start()` takes the project-config
   * and profile leases, so unattended retries would contend with live sibling
   * chats for exactly the resources whose contention causes this failure class.
   */
  private ensureBootstrap(): Promise<void> {
    // Automatic callers are not bounded by "once per turn". A scheduled task
    // drives sendMessage on every firing, and `emitStartFailure` returns
    // normally rather than throwing, so cron records the run as SUCCESSFUL and
    // clears its own retry state - nothing upstream backs off. Without this,
    // a broken config turns every cron firing into a fresh engine spawn.
    //
    // The first retry is immediate, because that is the case a human hits: a
    // stale crash sentinel, a contended lease, or a config they just fixed.
    // Every retry after that is rate-limited, which bounds any automatic
    // caller regardless of origin - more robust than sniffing for `cronMeta`,
    // which would miss other automatic paths.
    const now = Date.now();
    const withinCooldown = this.bootstrapRetries > 0 && now - this.lastBootstrapAttemptAt < BOOTSTRAP_RETRY_COOLDOWN_MS;

    const canRetry =
      !withinCooldown &&
      this.startError !== null &&
      // An engine identity survived, so a process tree may still own this
      // profile; respawning would put a second engine on it. kill() owns that
      // path.
      !this.agent &&
      // A retained lease means the same thing. releaseProfileLaunchLease()
      // nulls it on success, so null is exactly "safe to re-acquire".
      !this.releaseProfileLease &&
      // kill() sets disposed synchronously before awaiting agentReady, so no
      // retry can begin after teardown has started.
      !this.disposed;

    if (canRetry) {
      this.bootstrapRetries += 1;
      this.lastBootstrapAttemptAt = now;
      this.startError = null;
      this.agentReady = this.start().catch((error) => this.captureBootstrapFailure(error));
    }
    return this.agentReady;
  }

  private async releaseProfileLaunchLease(): Promise<void> {
    const release = this.releaseProfileLease;
    if (!release) return;
    await release();
    if (this.releaseProfileLease === release) this.releaseProfileLease = null;
  }

  private stopEngineWithTreeProof(agent: WCoreAgent): Promise<void> {
    const inFlight = this.engineShutdownAttempt;
    if (inFlight?.agent === agent) return inFlight.promise;

    const attempt = { agent, promise: Promise.resolve() };
    attempt.promise = Promise.resolve()
      .then(() => agent.kill())
      .then(() => {
        if (this.agent === agent) this.agent = null;
      })
      .finally(() => {
        if (this.engineShutdownAttempt === attempt) this.engineShutdownAttempt = null;
      });
    this.engineShutdownAttempt = attempt;
    return attempt.promise;
  }

  private async stopBootstrapEngine(agent: WCoreAgent, bootstrapError: unknown): Promise<void> {
    if (this.agent !== agent) return;
    try {
      await this.stopEngineWithTreeProof(agent);
    } catch (shutdownError) {
      const failure = new AggregateError(
        [bootstrapError, shutdownError],
        'Wayland Core bootstrap failed and engine-tree shutdown is unproved'
      );
      failure.cause = shutdownError;
      throw failure;
    }
  }

  /**
   * Determine new vs resume session, then create the WCoreAgent in-process.
   * If the conversation already has messages in the DB, pass --resume;
   * otherwise pass --session-id for a new session.
   */
  override async start() {
    if (this.disposed) throw new Error('Wayland Core manager was stopped before bootstrap');
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
    // selected user MCP-connector injection below (raw mode uses the engine's
    // own [mcp.servers] table, like the CLI). Host-owned team/team-guide stdio
    // declared above is deliberately preserved, as are WCoreAgent's allowlisted
    // tool credentials and Desktop ACP/permission/host-message protocol. The
    // renderer (RuntimePane) requests the preference; this seam enacts it. A
    // storage read failure is an authority failure: silently selecting either
    // mode would launch behavior the user did not authorize.
    // Use ProcessConfig (main-process store) NOT ConfigStorage (renderer-bridged):
    // ConfigStorage.get round-trips to the renderer and HANGS when WCore is
    // spawned from a channel (a pure main-process path with no renderer in the
    // loop), wedging every channel-triggered turn. `.catch` cannot save a hang.
    // Capture raw-mode authority, the exact managed profile identity, and its
    // launch lease in one profile-authority transaction. Malformed local raw
    // preference data is removed and safely defaults to managed mode; storage
    // failures remain fatal because authority could not be proved.
    const launchAuthority = await acquireRuntimeLaunchAuthority(() =>
      readRawEngineModePreference(WCORE_PREFERENCE_AUTHORITY)
    );
    const rawEngineMode = launchAuthority.raw;
    const launchWaylandHome = launchAuthority.identity?.dir;
    this.releaseProfileLease = launchAuthority.release;
    if (this.disposed) {
      await this.releaseProfileLaunchLease();
      throw new Error('Wayland Core manager was stopped during bootstrap');
    }

    // Publish selected connectors into Core's trusted startup config BEFORE
    // spawning it. Current Core deliberately rejects untrusted wire-added stdio
    // processes, so the former add_mcp_server path produced a green Library row
    // but no chat tools. The launch-local Core profile below then narrows the
    // global config to exactly this conversation's selection (all transports).
    let sessionMcpServerNames: string[] | undefined;
    let expectedSessionMcpNames: string[] = [];
    let expectedSessionMcpServers: McpSessionExpectedServer[] = [];
    if (!rawEngineMode) {
      try {
        const mcpConfig = await loadRuntimeMcpServers();
        const selectedServers = buildWCoreSessionMcpServers(mcpConfig, mergedData.activeMcpServers);
        expectedSessionMcpNames = selectedServers.map((server) => server.name);

        if (selectedServers.length === 0) {
          this.beginMcpSession([]);
          sessionMcpServerNames = [];
        } else {
          const normalizedServers = selectedServers.map((server) => normalizeMcpServerForSpawn(server, os.homedir()));
          expectedSessionMcpServers = normalizedServers.map((server) =>
            createMcpSessionExpectedServer(server, 'wcore', this.mcpSessionDigestKey)
          );
          this.beginMcpSession(expectedSessionMcpServers);
          for (const server of normalizedServers) validateMcpServer(server);
          // #1015 F1: this launch-local config.toml is the ONLY thing the wcore
          // chat loads its connectors from, and it is NOT one of the
          // `McpService.syncMcpToAgents` targets — so the shared builtin-runtime
          // rewrite has to be applied here too. Without it the four bundled
          // @wayland servers (Apple/IMAP/News/Cal.com — `builtin` is not set on
          // them, so `buildWCoreSessionMcpServers` does select them) reached Core
          // as `node` + a bare relative filename: ENOENT on a stock macOS, and
          // MODULE_NOT_FOUND against Core's cwd where a system node exists, while
          // the Library probe and every ACP serializer emitted resolved Bun plus
          // an absolute path for the SAME record. Applied AFTER validateMcpServer
          // for the same reason McpService does: validation grades the
          // user-visible declaration, never Wayland's own trusted runtime path.
          // The absolute path is safe to publish HERE (unlike the global
          // config.toml `WCoreMcpAgent` deliberately keeps portable for Linux
          // AppImage) because this file is rewritten on every launch.
          const spawnableServers = normalizedServers.map((server) => applyBuiltinMcpRuntime(server));
          const authedServers = await mcpService.attachOAuthTokens(spawnableServers);
          // OAuth refresh can change the exact launch definition. Rebind before
          // publication so a receipt can only correlate to what Core received.
          expectedSessionMcpServers = authedServers.map((server) =>
            createMcpSessionExpectedServer(server, 'wcore', this.mcpSessionDigestKey)
          );
          // Retain the exact servers that minted the expected receipts so the
          // receipt-bound ToolSearch candidate gate scopes over this launch.
          this.sessionMcpServers = authedServers;
          this.beginMcpSession(expectedSessionMcpServers);
          const publication = await new WCoreMcpAgent(join(launchWaylandHome!, 'config.toml'), true).installMcpServers(
            authedServers
          );
          if (publication.success) {
            sessionMcpServerNames = expectedSessionMcpNames;
            for (const name of expectedSessionMcpNames) this.publishMcpSessionServer(name);
          } else {
            sessionMcpServerNames = [];
            const reason = publication.error || 'Desktop could not publish connector into trusted Core startup config';
            for (const name of expectedSessionMcpNames) this.failMcpSessionServer(name, reason);
          }
        }
      } catch (err) {
        sessionMcpServerNames = [];
        // Keep the exact requested connector set visible and terminal. Erasing
        // it here made OAuth/validation/config-write failures look like a chat
        // that requested no connectors at all.
        if (this.mcpSessionState.expectedServers.length === 0 && expectedSessionMcpServers.length > 0) {
          this.beginMcpSession(expectedSessionMcpServers);
        }
        const reason = err instanceof Error ? err.message : String(err);
        for (const name of expectedSessionMcpNames) this.failMcpSessionServer(name, reason);
        mainWarn('[WCoreManager]', 'failed to publish trusted Core MCP startup config', err);
      }
    } else {
      this.beginMcpSession([]);
    }

    // #468: Output-budget override. When the user picked a Fixed budget, pass it
    // as the per-call `--max-tokens` (via buildSpawnConfig); Auto (default/unset)
    // leaves it unset so the engine sizes per-model (#456). A `fixed` entry with
    // no positive value falls back to Auto. An explicit per-conversation
    // `maxTokens` still wins. Same main-process store rationale as rawEngineMode
    // (ProcessConfig, not the renderer-bridged ConfigStorage which hangs here).
    // Imported/hand-edited malformed data is locally removed and recovers to
    // Auto. A storage read or repair failure still aborts the launch.
    const outputBudget = await readOutputBudgetPreference(WCORE_PREFERENCE_AUTHORITY);
    // Resolve a validated Fixed budget; Auto / absent -> undefined.
    const fixedMaxTokens = resolveFixedBudget(outputBudget);

    // Prepend Wayland Constitution + specialist overlay AND inject the
    // builtin-skills index + `wayland_search_skills` MCP advert into the
    // system prompt. wcore delivers these via `init_history` as
    // `[Assistant System Rules]\n...` on the first turn. The helper returns
    // undefined when there is nothing to inject (no Constitution, no preset,
    // no skills, no library) - in that case we keep the prior "no
    // presetRules" behaviour for fresh installs. (H1: WCoreManager advertise
    // the second channel.) Skipped entirely in raw-engine mode.
    const presetRules = resolveWCorePresetRules(mergedData);
    const systemInstructions = rawEngineMode
      ? undefined
      : await buildSystemInstructionsWithSkillsIndex({
          conversationId: this.conversation_id,
          presetContext: presetRules,
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
    const effectivePresetRules = rawEngineMode ? undefined : (systemInstructions ?? presetRules);

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
      mcpServerNames: sessionMcpServerNames,
      waylandHome: launchWaylandHome,
      // P2-11: the identity a scheduled run's output claim is keyed on.
      conversationId: this.conversation_id,
      onStreamEvent: (event) => this.emit('wcore.message', event),
      onProcessExit: (code, activeMsgId, signal) => {
        this.handleProcessExit(code, activeMsgId, signal);
      },
      onPong: () => this.handlePong(),
    });

    if (this.disposed) {
      await this.releaseProfileLaunchLease();
      throw new Error('Wayland Core manager was stopped during bootstrap');
    }
    this.agent = agent;
    try {
      await agent.start();
    } catch (error) {
      await this.stopBootstrapEngine(agent, error);
      if (!this.agent) await this.releaseProfileLaunchLease();
      throw error;
    }
    if (this.disposed) {
      const stoppedDuringBootstrap = new Error('Wayland Core manager was stopped during bootstrap');
      await this.stopBootstrapEngine(agent, stoppedDuringBootstrap);
      if (!this.agent) await this.releaseProfileLaunchLease();
      throw stoppedDuringBootstrap;
    }
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
        // #723: on a workflow-advance reset spawn (mergedData.workflowResetSeed
        // set), composeResetSeed seeds ONLY the immediately-prior turn so
        // per-step model input stays O(1); absent the flag it is byte-identical
        // to the #457 default seed. The field name is identical at every hop.
        const text = composeResetSeed((history.data ?? []) as TMessage[], mergedData.workflowResetSeed);
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

  async sendMessage(data: {
    content: string;
    msg_id: string;
    files?: string[];
    /** Absolute paths the local user attached. See IMessageText.content.files. */
    attachedFiles?: string[];
    cronMeta?: CronMessageMeta;
    hidden?: boolean;
  }) {
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
      msg_id: data.msg_id,
      type: 'text',
      position: 'right',
      conversation_id: this.conversation_id,
      createdAt: data.cronMeta ? Math.max(Date.now(), data.cronMeta.triggeredAt + 1) : Date.now(),
      content: {
        content: data.content,
        ...(data.attachedFiles?.length && { files: data.attachedFiles }),
        ...(data.cronMeta && { cronMeta: data.cronMeta }),
      },
      ...(data.hidden && { hidden: true }),
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
    // Wait for agent bootstrap to complete before sending. W-1b: if a PREVIOUS
    // turn's bootstrap failed, retry it once here rather than replaying that
    // turn's cached error forever - the condition that caused it is usually
    // gone by now (a stale crash sentinel, a transient lease, a config the user
    // has since fixed).
    await this.ensureBootstrap();

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

    // #1099: a filesystem boundary is never auto-approved by THIS HOST, in any
    // mode. Two independent reasons, either of which alone is decisive:
    //   SECURITY - it widens the session's authority BEYOND the workspace, so
    //     an autopilot answer would hand out standing read access to a folder
    //     the user never saw named.
    //   CORRECTNESS - every path below approves with `once`, and Core cannot
    //     run the call under a one-shot grant. An auto-approved boundary is a
    //     refused read that also skipped the only question that could fix it.
    //
    // ⚠️ SCOPE OF THAT CLAIM. It is about host behaviour and nothing more. In
    // Autopilot the escalation never arrives in the first place: `yoloMode`
    // becomes `--auto-approve` (`wcore/index.ts:539` → `envBuilder.ts:606`),
    // which puts Core in `force` mode, and Core suppresses the classifier
    // outright — `let path_boundary = if globally_approved || recovered_approval
    // { None }` (`wcore-agent/src/orchestration/mod.rs:3150`, and their own
    // comment at :3144 says force "still bypasses"). So under Autopilot there is
    // no card, and the user meets the same dead-end refusal this feature exists
    // to replace. Fail-closed — no grant is ever minted — but ABSENT, not
    // enforced, and the scheduled-task executor sets `yoloMode` on every task.
    // Note also that `resolveBlanketAutoApprove`, which lets Guarded Auto
    // override a blanket yolo, is applied in `AcpAgentManager` only and never on
    // this path. Do not read the guard below as covering Autopilot.
    if (type === 'path_boundary') return false;

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
    // #671: a trusted-edits workspace auto-approves edits, still prompts on
    // exec/network. Only 'edit' - NOT the 'info' catch-all (which the engine also
    // uses for unclassified/network confirmations) - so a persisted always-on
    // posture stays stricter than the user-chosen auto_edit mode. Persisted
    // per-workspace; question/exec/mcp fall through to the confirmation dialog.
    if (isWorkspaceTrusted(this.workspace) && trustedWorkspaceAutoApprovesConfirmationType(type)) {
      this.agent?.approveTool(content.callId, 'once');
      return true;
    }
    return false;
  }

  private handleConformationMessage(message: IMessageToolGroup) {
    const confirmingTools = message.content.filter((c) => c.status === 'Confirming');

    for (const content of confirmingTools) {
      // A2 - register BEFORE the auto-approve check: an auto-approved request
      // is still a call the tool_group gate owns, and the engine synthesizes
      // its companion `approval_required` for it just the same.
      if (content.callId) this.gatedToolCallIds.add(content.callId);

      // Check mode-based auto-approval
      if (this.tryAutoApprove(content)) continue;

      // #1099 note: the persisted "always allow" memory cannot speak for a
      // folder grant, and structurally never does. Its keys are category-shaped
      // (exec/edit/info/mcp) and say nothing about WHICH root was approved, so
      // a `path_boundary` action yields no keys and the branch below cannot
      // fire. The card is likewise emitted with no `action`, so the renderer's
      // mirror of this check (ConversationChatConfirm.checkAndAutoConfirm) has
      // nothing to key on either.
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
        // #1099: the folder-grant card. Its own option values, never
        // `proceed_once`/`proceed_always` — those are what every other approval
        // matcher in this app keys on, so reusing them would let a stored
        // "always allow" for an unrelated tool replay as a filesystem grant.
        //
        // The grant is FIRST because it is the primary action: Core cannot
        // resolve a boundary with a one-shot approval, so there is no "allow
        // once" here at all. A Once button would refuse the read anyway and
        // read to the user as a broken feature.
        //
        // The root travels in `params`, which is also what the label
        // interpolates — so the folder named on the button and the folder the
        // grant opens are one value and cannot drift apart.
        details?.type === 'path_boundary'
          ? buildPathBoundaryOptions(details.suggestedRoot)
          : details?.type === 'question'
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
        // #1099: a boundary card carries NO `action`. The approval store is
        // category-keyed and cannot describe which root was approved, so there
        // is no key it would be honest to store or replay — and the renderer's
        // auto-confirm bails on a missing action before it reaches any value
        // match (ConversationChatConfirm.checkAndAutoConfirm).
        ...(details?.type === 'path_boundary' ? {} : { action }),
        description:
          details?.type === 'path_boundary'
            ? details.target
            : (details?.type === 'question' ? details.header : content.description) || '',
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

  /**
   * #853: a discoverable, redacted logs-path suffix appended to an exec/process
   * failure so the user can reach the log that holds the detail. Path-as-text
   * (the clickable "Open logs" affordance is deferred). Degrades to an empty
   * string if no logs dir is available; never throws.
   */
  private logLinkSuffix(): string {
    try {
      const dir = getPlatformServices().paths.getLogsDir?.();
      return dir ? `\n\nLogs: ${dir}` : '';
    } catch {
      return '';
    }
  }

  private handleProcessExit(code: number | null, activeMsgId: string, signal?: NodeJS.Signals | null): void {
    mainError(
      '[WCoreManager]',
      `wcore process exited unexpectedly (code=${code}, signal=${signal ?? 'none'}) during active turn ${activeMsgId}`
    );

    this.status = 'finished';
    // K-03: the engine died mid-turn - the turn ended, and it ended badly.
    void this.handleTurnEnd('failed');

    // #853: name the real exit reason (a kill signal, not "code null") and point
    // the user at the log holding the detail, redacted before it is surfaced.
    const errorMessage: IResponseMessage = {
      type: 'error',
      conversation_id: this.conversation_id,
      msg_id: activeMsgId,
      data: redactCommandSecrets(`Agent process ${describeExitReason(code, signal ?? null)}${this.logLinkSuffix()}`),
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
    // #853: `detail` already carries the errno/signal launch reason from the
    // agent-side reject. Append the discoverable logs path and redact the whole
    // user-facing string before surfacing.
    const surfaced = redactCommandSecrets(`Agent failed to start: ${detail}${this.logLinkSuffix()}`);
    // K-02: PERSIST before emitting. The stream emit alone is transient - it is
    // delivered once, to whoever happens to be subscribed at that instant, and
    // is never replayed. A bootstrap failure is precisely the case where nobody
    // reliably is: the turn is sent from the new-chat surface, the renderer is
    // still mounting the conversation view it just navigated to, and the engine
    // can refuse in well under that. Live-verified on Core v0.12.26 - the main
    // process logged the reason and emitted error+finish, and the chat showed
    // the user nothing at all, indefinitely.
    //
    // Persisting makes the reason a fact about the conversation rather than an
    // event someone had to be present for: it renders whenever the view loads,
    // it survives a reload, and it shows up in a bug report. This mirrors how
    // every engine-side error the user actually sees already reaches them.
    addMessage(this.conversation_id, {
      id: uuid(),
      conversation_id: this.conversation_id,
      type: 'tips',
      position: 'center',
      createdAt: Date.now(),
      content: { content: surfaced, type: 'error' },
    } as TMessage);

    const errorMessage: IResponseMessage = {
      type: 'error',
      conversation_id: this.conversation_id,
      msg_id: activeMsgId,
      data: surfaced,
      // Carry the bootstrap failure's own classification alongside the prose so
      // the renderer can route it to a remedy card by code. Constitution
      // authority failures are the case that needs it: the fix is a recovery
      // flow the user cannot reach from an error bubble.
      // #1024: the same treatment for an unparseable engine `config.toml`. The
      // splice's refusal is correct and stays correct - it protects the user's
      // providers/credentials - but the prose it produced ('Fix the file by
      // hand') was a dead end. The code routes it to the recovery card instead.
      ...(error instanceof DesktopProfileSpliceError ? { code: error.code } : {}),
      ...(error instanceof ConstitutionFsTransactionError ? { code: error.code } : {}),
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
    const providerId = this.model ? (registryProviderIdForModel(this.model) ?? this.model.id) : undefined;
    // No provider id, or the turn was routed through Flux (whose key is not this
    // provider's): leave provider state untouched.
    if (!providerId || providerId === 'flux-router') return;
    this.authKeyInvalidated = true;

    void (async () => {
      try {
        const db = await getDatabase();
        const repo = new ProviderRepository(db.getDriver());
        repo.updateRegistryProviderState(providerId, 'error', 'unauthorized');
        emitModelRegistryChanged();
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

  private beginMcpSession(expectedServers: readonly McpSessionExpectedServer[]): void {
    this.mcpSessionState = createMcpSessionState(this.mcpSessionGeneration, expectedServers, {
      conversationId: this.conversation_id,
      backend: 'wcore',
    });
    this.publishMcpSessionState();
  }

  private publishMcpSessionServer(serverName: string): void {
    this.mcpSessionState = recordDesktopMcpSessionPublication(this.mcpSessionState, serverName);
    this.publishMcpSessionState();
  }

  private failMcpSessionServer(serverName: string, reason: string): void {
    this.mcpSessionState = recordDesktopMcpSessionFailure(this.mcpSessionState, serverName, reason);
    this.publishMcpSessionState();
  }

  private acceptMcpSessionTerminal(event: McpSessionTerminalEvent): void {
    this.mcpSessionState = reduceMcpSessionTerminal(this.mcpSessionState, event);
    this.publishMcpSessionState();
    // Project the receipt-bound candidate gate immediately after Core registers,
    // proving callable tools track the current publication, not saved status.
    const candidates = this.getMcpCandidateTools();
    mainLog(
      '[WCoreManager]',
      `MCP ToolSearch candidate pool: ${candidates.length} tools from current-session receipts`
    );
  }

  /** Persist and broadcast the whole immutable snapshot; queued DB writes prevent lost concurrent receipts. */
  private publishMcpSessionState(): void {
    const snapshot: McpSessionState = {
      ...this.mcpSessionState,
      expectedServers: this.mcpSessionState.expectedServers.map((server) => ({ ...server })),
      expectedServerNames: [...this.mcpSessionState.expectedServerNames],
      receipts: { ...this.mcpSessionState.receipts },
    };

    ipcBridge.conversation.responseStream.emit({
      type: 'mcp_session_state',
      conversation_id: this.conversation_id,
      msg_id: '',
      data: snapshot,
    });

    this.mcpSessionPersistQueue = this.mcpSessionPersistQueue
      .then(async () => {
        const db = await getDatabase();
        const result = db.getConversation(this.conversation_id);
        if (!result.success || !result.data || result.data.type !== 'wcore') return;
        const conversation = result.data;
        db.updateConversation(this.conversation_id, {
          extra: { ...conversation.extra, mcpSessionState: snapshot },
        } as Partial<typeof conversation>);
      })
      .catch((err) => {
        mainWarn('[WCoreManager]', 'failed to persist MCP session receipt state', err);
      });
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

      // Log info events from wcore (includes set_config/set_mode acknowledgments).
      // These also carry full tool results, so persist only a truncated,
      // secret-redacted preview — never the verbatim output (#714).
      if (data.type === 'info') {
        const elapsed = this._configSentAt ? ` (${Date.now() - this._configSentAt}ms since command)` : '';
        mainLog('[WCoreManager]', `info: ${toSafeInfoLogPreview(data.data)}${elapsed}`);
      }

      // v0.9.4 - sub-agent activity events are system-level (empty msg_id) but
      // MUST reach the renderer so the inline activity timeline can render one
      // step per sub-agent. Forward before the msg_id guard drops them (mirrors the
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

      // Core Desktop contract v1 authority/evidence is session-level and
      // intentionally carries no turn msg_id. It has already passed the pinned
      // schema and semantic reducer in WCoreAgent; forward it before the generic
      // empty-msg_id guard so Cockpit consumers see only accepted evidence.
      if (
        [
          'execution_policy',
          'workflow_started',
          'workflow_node_event',
          'workflow_finished',
          'anvil_receipt',
          'anvil_receipt_invalidated',
          'anvil_trust_changed',
          'mcp_ready',
          'mcp_failed',
        ].includes(data.type)
      ) {
        if (data.type === 'mcp_ready' || data.type === 'mcp_failed') {
          this.acceptMcpSessionTerminal(data as McpSessionTerminalEvent);
        }
        ipcBridge.conversation.responseStream.emit({
          type: data.type,
          conversation_id: this.conversation_id,
          msg_id: '',
          data: data.data,
        });

        // Persist a separate main-process acceptance envelope for authority
        // events. The raw stream frame above remains backwards compatible but
        // is intentionally inert in the renderer. Only this envelope is
        // eligible for canonical receipt/policy projection, which prevents a
        // raw renderer-side IPC injection from manufacturing verified state.
        if (
          ['execution_policy', 'anvil_receipt', 'anvil_receipt_invalidated', 'anvil_trust_changed'].includes(data.type)
        ) {
          const acceptedAt = Date.now();
          const evidenceResponse: IResponseMessage = {
            type: 'execution_evidence',
            conversation_id: this.conversation_id,
            msg_id: '',
            data: {
              acceptedBy: 'desktop-core-v1-consumer',
              acceptedAt,
              event: { type: data.type, ...(data.data as Record<string, unknown>) },
            },
          };
          const evidenceMessage = transformMessage(evidenceResponse);
          if (evidenceMessage) {
            addOrUpdateMessage(this.conversation_id, evidenceMessage, 'wcore');
            ipcBridge.conversation.responseStream.emit(evidenceResponse);
          }
        }
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
          // A non-interactive spawn (channel/cron sets this.yoloMode) is genuinely
          // autonomous - there is no user to prompt, and it opted into full-auto.
          // Escalating to the Confirming gate here would hang the turn forever
          // (no one to answer), so auto-resume(true) as this path always did
          // before #264's escalation was added. Interactive auto modes (below)
          // still route to the user's confirmation gate.
          if (this.yoloMode) {
            this.agent?.resumeApproval(appr.resumeToken, true);
            mainLog(
              '[WCoreManager]',
              `approval_required reason='${appr.reason}' in a non-interactive (yoloMode) session; auto-approved`
            );
            return;
          }
          this.pendingApprovalTokens.set(callId, appr.resumeToken);
          const context = typeof appr.context === 'string' && appr.context ? appr.context : '';
          this.addConfirmation({
            title: 'messages.permissionRequest',
            id: callId,
            description: appr.reason ? `reason: ${appr.reason}` : context,
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
            // Preview, not the raw payload: `context` is engine-supplied
            // free-form text and this persists to the on-disk log (#714).
            const callId = appr.callId ?? '';
            if (callId && this.gatedToolCallIds.has(callId)) {
              // A2 - the engine's synthesized companion, not a wedge. The
              // `Confirming` tool_group for this exact call_id already went
              // through the approval gate above, so the turn has a way home.
              // Kept at info (not dropped) because this line and its payload
              // preview are the only greppable evidence that Desktop's mode and
              // Core's posture disagree.
              mainLog(
                '[WCoreManager]',
                `approval_required reason='${appr.reason}' callId=${callId} has no resume token, but the ` +
                  `tool_group approval gate already owns this call_id: this is engine v0.13.4's synthesized ` +
                  `companion to its own tool_request, not a wedge`,
                toSafeInfoLogPreview(data.data)
              );
            } else {
              mainError(
                '[WCoreManager]',
                `approval_required reason='${appr.reason}' in auto mode has no resume token and no HITL UI; turn may wedge`,
                toSafeInfoLogPreview(data.data)
              );
            }
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
        // Recorded here, ABOVE the msg_id guard below, on purpose: a provider
        // failure frequently arrives as a system-level frame with no msg_id, and
        // that is precisely the case that was settling as "completed".
        this._turnSawError = true;
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
        // A new turn starts clean: last turn's failure must not condemn this one.
        this._turnSawError = false;
        // A2 - and last turn's gated call_ids must not demote this turn's
        // diagnostics. Cleared HERE as well as at turn end because the case
        // this whole branch exists for is a turn that never finishes.
        this.gatedToolCallIds.clear();

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

        // A turn can fail WITHOUT ever producing an `error` frame. When the
        // provider stream dies - e.g. the model emits tool-call arguments that
        // are not valid JSON - Core retries, gives up, and reports the outcome
        // only as `stream_end` carrying `finish_reason: 'error'`, which reaches
        // us as this `finish` frame. Observed live: a turn failed exactly this
        // way and the rail would still have called it done.
        const finishReason =
          processedData.data && typeof processedData.data === 'object'
            ? (processedData.data as Record<string, unknown>).finish_reason
            : undefined;
        if (finishReason === 'error') this._turnSawError = true;

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

  /**
   * K-03 - settle the turn's activity card.
   *
   * The engine's `stream_end` arrives as an IResponseMessage `finish`, which
   * sits in `skipTransformTypes` and therefore produces NO TMessage: nothing
   * durable ever recorded that the turn ended. The only other completion signal
   * the execution rail has is the activity card's own `status`, and that is
   * pinned 'running' by construction (`rollUpStatus` reports 'running' for a
   * zero-node card, and the per-turn `session_cost` card has zero nodes) - so a
   * wcore turn could never reach `lifecycle: 'completed'` and the rail's elapsed
   * timer climbed indefinitely after the assistant had already answered.
   *
   * This forwards a synthetic `activity_turn_end` frame down the SAME path every
   * other activity update takes: transformMessage builds a card delta, the
   * compose merge folds it into the accumulated card (settling any node the
   * stream never terminalized), and addOrUpdateMessage persists it so the
   * verdict survives a reload. Emitted on the response stream too so a mounted
   * renderer settles immediately rather than at the next hydration.
   */
  private settleTurnActivityCard(outcome: 'done' | 'failed'): void {
    const turnId = this.currentMsgId || this._lastTurnMsgId;
    if (!turnId) return;

    const frame: IResponseMessage = {
      type: 'activity_turn_end',
      conversation_id: this.conversation_id,
      msg_id: turnId,
      data: { outcome },
    };

    const tMessage = transformMessage(frame);
    if (tMessage) {
      addOrUpdateMessage(this.conversation_id, tMessage, 'wcore');
    }
    // Response stream only - deliberately NOT emitToEventBuses. This is a UI/rail
    // settlement signal, and the channel bus relays agent output to Discord /
    // WhatsApp surfaces that have nothing to do with the activity card.
    ipcBridge.conversation.responseStream.emit(frame);
  }

  private async handleTurnEnd(outcome: 'done' | 'failed' = 'done'): Promise<void> {
    cronBusyGuard.setProcessing(this.conversation_id, false);
    this.flushAllBufferedStreamTexts();
    // An error seen anywhere in this turn outranks the default 'done'. The
    // engine emits the same `finish` frame whether the turn succeeded or died,
    // so without this the rail reports success over a visible error. A caller
    // that already knows the turn failed (process exit) still wins outright.
    const settled = outcome === 'failed' || this._turnSawError ? 'failed' : 'done';
    this.settleTurnActivityCard(settled);
    this._turnSawError = false;
    // A2 - the turn's approval gates are closed; drop their call_ids so a later
    // tokenless approval cannot be demoted by a gate that is no longer open.
    this.gatedToolCallIds.clear();

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

  /**
   * Receipt-bound ToolSearch candidate pool for THIS launch. Callable tools come
   * only from the current correlated publication receipts; saved/probed/stale
   * connectors are withheld.
   */
  getMcpCandidateTools(): CandidateTool[] {
    return getCandidateTools(this.mcpSessionState, this.sessionMcpServers);
  }

  setConfig(config: { model?: string; thinking?: string; thinking_budget?: number; effort?: string }): void {
    if (this.agent) {
      this.agent.setConfig(config);
    }
  }

  getMode(): { mode: string; initialized: boolean } {
    return { mode: this.currentMode, initialized: true };
  }

  /**
   * @param options.persist - false applies the mode to the LIVE session only and
   *   leaves the conversation's stored `sessionMode` alone. Used by the cron
   *   executor when a scheduled run borrows a chat the user owns: the run needs
   *   full-auto, but the user's chat must not be left in it.
   */
  async setMode(mode: string, options?: { persist?: boolean }): Promise<{ success: boolean; data?: { mode: string } }> {
    this.currentMode = mode;
    if (options?.persist !== false) this.saveSessionMode(mode);
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

    // #1099: the folder-grant answer. Routed before the ordinary approval path
    // because it needs a scope no other card can produce — `always_path`, which
    // EXPANDS the session's filesystem authority to one root outside the
    // workspace, read-only. `write: false` is not a default we could widen
    // later from here: write access outside the workspace is not grantable at
    // all, so Core never raises a boundary asking for it.
    const boundaryConfirmation = this.confirmations.find((c) => c.callId === callId && isPathBoundaryConfirmation(c));
    if (boundaryConfirmation) {
      // A folder grant answers ONLY in its own vocabulary. Anything else that
      // reaches this callId came from a surface that never rendered THIS card:
      // today that is the remote chat gateway, whose generic `default:` arm in
      // `ActionExecutor` offers "Confirm"/"Cancel" carrying `proceed_once`.
      //
      // Falling through was the bug. `super.confirm` clears the card and
      // `approveTool(callId, 'once')` approves the tool WITHOUT the grant, so
      // the read still fails for want of authority AND the desktop user's card
      // is gone, leaving the folder ungrantable for the rest of the session.
      // Refuse instead, and leave the card standing for the surface that owns
      // the decision.
      //
      // LEGACY `cancel` IS FOREIGN VOCABULARY TOO, and used to be honoured here
      // as a decline. No local surface produces it on this card - the desktop
      // renders `PathBoundaryConfirmCard`, whose three buttons are this card's
      // own values, and both remote surfaces that build option lists
      // (`ActionExecutor`, `GeminiAgentManager`) return NO options for a
      // `path_boundary`. The only caller that could send it is a paired WebUI
      // posting `confirmation.confirm` by hand, and the wire gate does not
      // block `cancel` because on an ORDINARY card a remote decline is a
      // feature. Honouring it here let a remote peer make the desktop user's
      // security prompt vanish and the call be denied - it minted no authority,
      // but "the desktop owns this decision" has to mean the whole decision,
      // including the No. Treated as foreign now: the card stays up.
      if (!isPathBoundaryOptionValue(data)) return;
      const root = pathBoundaryRootOf(boundaryConfirmation);
      super.confirm(id, callId, data);
      if (isPathBoundaryGrantValue(data) && root) {
        // `.catch` and not a bare `void`: the answer is asynchronous now, and
        // `writeCommand` throws when the transport dies mid-answer. Before, that
        // throw propagated to `conversationBridge`, which already swallows it;
        // from inside a detached promise it would be an unhandled rejection.
        void this.grantFolderRoot(callId, root, data === PATH_BOUNDARY_REMEMBER_FOLDER).catch((error: unknown) => {
          mainWarn('[WCoreManager]', 'the folder-grant answer was not delivered', error);
        });
      } else {
        this.agent?.denyTool(callId, 'User declined access to the folder');
      }
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

  /**
   * Answer a folder-grant card: vet the root HOST-SIDE, then either hand it to
   * the engine or deny the call and say why.
   *
   * WHY THE CHECK IS HERE AND NOT IN `rememberFolderGrant`. This is the ONE
   * place a boundary card turns into filesystem authority, and both grant
   * buttons reach it - the session-only grant and the durable one. Putting the
   * check on the durable path alone was the shipped bug an external audit
   * found: `classifyFolderGrantRoot` was reached only through the store, which
   * is fire-and-forget and deliberately does not gate the approval, so the
   * session-only button (and the durable one, whose approval had already gone
   * out) handed over any root at all. A root Wayland refuses to PERSIST must
   * also be a root Wayland refuses to GRANT, and `vetFolderGrantRoot` is
   * literally the same function the store calls, so the two cannot drift.
   *
   * THE ROOT THAT GOES OUT IS THE ROOT THAT WAS VETTED - `check.root`, the
   * canonical directory, not the string the card carried. A file becomes its
   * parent, a symlink is resolved, a Windows 8.3 name is expanded. Sending the
   * raw string instead would leave a window in which the name we approved and
   * the directory the engine resolves are no longer the same place, and it is
   * also what the durable record stores, so the in-band grant and the persisted
   * entry now name one folder by construction.
   *
   * Not awaited by `confirm`: the vet touches the filesystem, and the click
   * must not wait on disk I/O. The card is already cleared by then, so every
   * outcome below is an answer the user has already committed to.
   */
  private async grantFolderRoot(callId: string, root: string, durable: boolean): Promise<void> {
    const check = await vetFolderGrantRoot(root, defaultFolderGrantRootContext);
    // `=== false`, not `!check.ok`: without `strictNullChecks` TypeScript will
    // not narrow a boolean-literal discriminant through truthiness and
    // `check.refusal` fails to compile. See FolderGrantRootCheck.
    if (check.ok === false) {
      this.agent?.denyTool(callId, `Wayland does not open ${root} to an agent`);
      this.emitFolderGrantNotice(folderGrantRefusedText(root, check.refusal));
      return;
    }

    // "Remember" is the SAME in-band grant plus a durable record, and the two
    // are deliberately independent. The in-band approval is what unblocks the
    // call the user is looking at; the record is what makes the folder open
    // again tomorrow. Persisting is fire-and-forget and never gates the
    // approval - see `rememberFolderGrant` for why a refusal to remember must
    // not also refuse the read.
    if (durable) void this.rememberFolderGrant(check.root);
    // NOTE: the engine acks this as approved whether or not the grant took
    // — `apply_path_grant`'s refusal bool is discarded at both call sites
    // (wcore-protocol/src/lib.rs:424 and :497). A refused grant is reported
    // on the session output, not here, so this ack is not proof of access.
    this.agent?.approveTool(callId, { always_path: { root: check.root, write: false } });
  }

  /**
   * Write the folder the user just granted to this workspace's durable list.
   *
   * WHY A REFUSAL HERE DOES NOT REFUSE THE CALL. The in-band `always_path`
   * approval has already been sent, and it is byte-identical to the one the
   * session-only button sends — so failing to remember hands out no authority
   * the other button would not have handed out anyway, and the read the user
   * asked for still happens. Refusing the call instead would mean a button
   * advertised as doing MORE quietly did LESS, which is the one outcome a
   * consent surface may never produce.
   *
   * The user is TOLD, in the thread, whenever the record did not land. A
   * silent failure here is the worst of both: they believe the folder is
   * remembered, and next session it is not. `wayland_private` /
   * `credential_store` / `home_directory` / `root_of_filesystem` are the store
   * deciding this root may never be durable; `grant_cap_reached` is the one the
   * user can act on, which is why it names the fix.
   *
   * Not awaited by `confirm` — nothing in the approval path depends on the
   * write, and making the answer wait on disk I/O would put a filesystem stall
   * between the click and the engine.
   */
  private async rememberFolderGrant(root: string): Promise<void> {
    let notice: string;
    try {
      const workspaceId = await resolveFolderGrantWorkspaceId(this.workspace);
      if (!workspaceId) {
        notice = folderGrantNotRememberedText(root, 'no_workspace_identity');
      } else {
        const result = await defaultWorkspaceFolderGrantStore().add({
          workspaceId,
          root,
          origin: 'consent_card',
        });
        // `=== false`, not `!result.ok`: without `strictNullChecks` TypeScript
        // will not narrow a boolean-literal discriminant through truthiness and
        // `result.refusal` fails to compile. See FolderGrantAddResult.
        if (result.ok === false) notice = folderGrantNotRememberedText(root, result.refusal);
        else return;
      }
    } catch (error) {
      mainWarn('[WCoreManager]', 'failed to remember a folder grant', error);
      notice = folderGrantNotRememberedText(root, 'write_failed');
    }
    this.emitFolderGrantNotice(notice);
  }

  /**
   * Persist AND emit, the way `emitConstitutionReclaimNotice` does: the stream
   * emit alone is delivered once to whoever is subscribed at that instant and
   * never replayed, and the row alone renders only after a reload. The user is
   * owed this on the screen they are looking at AND in the thread afterwards.
   */
  private emitFolderGrantNotice(content: string): void {
    const id = uuid();
    addMessage(this.conversation_id, {
      id,
      msg_id: id,
      conversation_id: this.conversation_id,
      type: 'tips',
      position: 'center',
      createdAt: Date.now(),
      content: { type: 'warning', content },
    } as TMessage);
    ipcBridge.conversation.responseStream.emit({
      type: 'tips',
      conversation_id: this.conversation_id,
      msg_id: id,
      data: { type: 'warning', content },
    });
  }

  override async kill(): Promise<void> {
    this.disposed = true;
    let engineFailure: unknown;
    let workerFailure: unknown;

    const stopCurrentEngine = async (): Promise<void> => {
      const engine = this.agent;
      if (!engine) return;
      try {
        // This is process-tree proof, not best effort. WorkerTaskManager may
        // retire its active-process lease only when this promise resolves.
        await this.stopEngineWithTreeProof(engine);
      } catch (error) {
        engineFailure = error;
      }
    };

    // Stop an engine already published by bootstrap, then await bootstrap and
    // stop a successor that may have appeared during that wait. A failed exact
    // identity is retained for a later verified attempt.
    await stopCurrentEngine();
    await this.agentReady;
    if (!engineFailure) await stopCurrentEngine();

    try {
      await super.kill();
    } catch (error) {
      workerFailure = error;
    }

    if (engineFailure) {
      if (workerFailure)
        mainWarn('[WCoreManager]', 'worker teardown also failed during engine shutdown', workerFailure);
      throw engineFailure;
    }
    if (workerFailure) throw workerFailure;

    // Do not let another launch reuse the profile until both engine and worker
    // exit have been proved. A failed release itself remains retryable.
    await this.releaseProfileLaunchLease();
  }
}
