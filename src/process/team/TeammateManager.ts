// src/process/team/TeammateManager.ts
import { EventEmitter } from 'events';
import { ipcBridge } from '@/common';
import { teamEventBus } from './teamEventBus';
import { addMessage } from '@process/utils/message';
import { getDatabase } from '@process/services/database';
import { extractTextFromMessage } from '@process/task/MessageMiddleware';
import type { IWorkerTaskManager } from '@process/task/IWorkerTaskManager';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { LEASE_TTL_MS } from './types';
import type { TeamAgent, TeammateStatus } from './types';
import { isTeamCapableBackend } from '@/common/types/teamTypes';
import { ProcessConfig } from '@process/utils/initStorage';
import type { EventLogger } from './EventLogger';
import type { Mailbox } from './Mailbox';
import type { ITaskRepository } from './repository/ITeamRepository';
import { buildRolePrompt } from './prompts/buildRolePrompt';
import { formatMessages } from './prompts/formatHelpers';
import { agentRegistry } from '@process/agent/AgentRegistry';
// W4 audit CRIT-1 (2026-05-19): register / unregister team context for
// each agent conversation so the ACP file-op gate can resolve the team
// when sandboxed imported agents request file ops.
import type { TTeam } from './types';
import { registerTeamConversation, unregisterTeamConversation } from './sandbox/acpTeamContextRegistry';

type TeammateManagerParams = {
  teamId: string;
  agents: TeamAgent[];
  mailbox: Mailbox;
  workerTaskManager: IWorkerTaskManager;
  hasMcpTools?: boolean;
  teamWorkspace?: string;
  /**
   * W4c - When true, role prompts emitted by this manager are wrapped in
   * `<!-- IMPORTED-UNTRUSTED-CONTENT -->` markers and (for the leader)
   * suffixed with a non-overridable SYSTEM SANDBOX NOTICE.
   */
  isSandboxed?: boolean;
  /**
   * W4 audit CRIT-1 (2026-05-19): true when the team was imported (i.e.
   * `team.importedFrom != null`). When set, every agent's conversation id
   * is registered with the ACP file-op gate so sandboxed reads/writes go
   * through `withOpenInsideWorkspace`. Distinct from `isSandboxed`: the
   * `isImported` flag is the SECURITY trigger; `isSandboxed` is the
   * cosmetic/prompt-wrap trigger.
   */
  isImported?: boolean;
  /**
   * W4 audit CRIT-1 (2026-05-19): async accessor for the current TTeam
   * snapshot used by the ACP file-op gate. Required when `isImported` is
   * true so the gate can re-check the per-cap grant map after live edits.
   */
  getTeamSnapshot?: () => Promise<TTeam | null>;
  /** Called after an agent is removed from in-memory list, so the caller can persist the change (e.g. update DB) */
  onAgentRemoved?: (teamId: string, agents: TeamAgent[]) => void;
  /**
   * W1e - optional team_event_log writer. When present, `wake()` logs a
   * `'wake'` event on completion and `acp_context_usage` stream messages
   * log a `'token_usage'` event.
   */
  eventLogger?: EventLogger;
  /**
   * P2 durable execution - optional task repository used to stamp/renew/clear
   * the lease on a slot's `in_progress` tasks across the wake lifecycle. When
   * absent (existing tests / standalone), lease bookkeeping is skipped and the
   * wake loop behaves exactly as before.
   */
  taskRepo?: ITaskRepository;
};

/** One reading of the ACP cumulative usage gauge for an agent session. */
export type UsageSnapshot = { used: number; cost: number };

/**
 * DESK-1 - per-event spend delta between two CUMULATIVE usage snapshots.
 *
 * ACP's `acp_context_usage` gauge is a running session total, so summing raw
 * snapshots N-counts. The meter must sum deltas instead:
 *   - no previous snapshot (genuinely fresh session) -> delta = full `next`
 *     (a fresh session's first snapshot is real new spend);
 *   - gauge grew  -> delta = next - prev;
 *   - gauge dropped (compaction / session reset) -> delta = 0. The spend that
 *     produced the drop is unknowable; undercounting is safer than
 *     overcounting. The caller then tracks `next` as the new baseline so
 *     growth from the lower value is counted again.
 * Token and cost gauges are clamped independently.
 */
export function computeUsageDelta(
  prev: UsageSnapshot | undefined,
  next: UsageSnapshot
): { tokensDelta: number; costDelta: number } {
  if (!prev) return { tokensDelta: next.used, costDelta: next.cost };
  return {
    tokensDelta: next.used >= prev.used ? next.used - prev.used : 0,
    costDelta: next.cost >= prev.cost ? next.cost - prev.cost : 0,
  };
}

/**
 * Core orchestration engine that manages teammate state machines
 * and coordinates agent communication via mailbox and task board.
 */
export class TeammateManager extends EventEmitter {
  private readonly teamId: string;
  private agents: TeamAgent[];
  private readonly mailbox: Mailbox;
  private readonly workerTaskManager: IWorkerTaskManager;
  private readonly onAgentRemovedFn?: (teamId: string, agents: TeamAgent[]) => void;
  /** Shared team workspace path (leader's working directory) */
  private readonly teamWorkspace: string | undefined;
  /** W4c - when true, wrap outgoing role prompts as imported untrusted content */
  private readonly isSandboxed: boolean;
  /** W4 audit CRIT-1 - true when the team was imported (gates ACP fs ops). */
  private readonly isImported: boolean;
  /** W4 audit CRIT-1 - async accessor used by the ACP file-op gate. */
  private readonly getTeamSnapshot: (() => Promise<TTeam | null>) | undefined;
  /** W1e - optional team_event_log writer */
  private readonly eventLogger: EventLogger | undefined;
  /** P2 - optional task repo for lease stamp/renew/clear on in_progress tasks */
  private readonly taskRepo: ITaskRepository | undefined;

  /** Tracks which slotIds currently have an in-progress wake to avoid loops */
  private readonly activeWakes = new Set<string>();
  /** Timeout handles for active wakes, keyed by slotId */
  private readonly wakeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  /** O(1) lookup set of conversationIds owned by this team, for fast IPC event filtering */
  private readonly ownedConversationIds = new Set<string>();
  /** Tracks conversationIds whose turn has already been finalized, to prevent double processing */
  private readonly finalizedTurns = new Set<string>();
  /** Maps slotId → original name before rename, for "formerly: X" hints in prompts */
  private readonly renamedAgents = new Map<string, string>();

  /**
   * DESK-1 - previous ACP cumulative usage gauge snapshot per agent session,
   * keyed by conversationId (one conversation per (teamId, slotId) session in
   * this team-scoped manager). ACP re-emits `acp_context_usage.used` +
   * `cost.amount` as CUMULATIVE session values on every update; each
   * `token_usage` row records the raw snapshot PLUS the per-event spend delta
   * against this previous snapshot (see {@link computeUsageDelta}). Cleared
   * whenever the agent session ends/restarts (killAgentProcess /
   * handleAgentCrash / removeAgent / dispose) so a fresh session's first
   * snapshot counts fully.
   */
  private readonly tokenUsageBaselines = new Map<string, UsageSnapshot>();

  /**
   * Lease-renew throttle (ms): maybeRenewLease writes the persisted lease at
   * most once per this window. MUST stay well under LEASE_TTL_MS (180s) so a
   * live owner's lease never lapses between renewals and the out-of-process
   * Watchdog can't falsely reclaim its task. Deliberately distinct from the
   * inactivity watchdog below - conflating them is why #747 bit.
   */
  private static readonly LEASE_RENEW_THROTTLE_MS = 60 * 1000;

  /**
   * Default inactivity-watchdog budget (ms): if a teammate streams NO activity
   * (text, tool call, or thought) for this long, the leader is told it may be
   * stalled. Raised from 60s (#747): a single silent tool/test run or slow
   * first-token latency routinely exceeds a minute, which falsely flagged live,
   * still-working teammates (and the leader itself) as "failed" and derailed
   * runs. 180s aligns with LEASE_TTL_MS so the in-memory watchdog and the
   * persisted-lease Watchdog surface a genuine stall at the same horizon.
   * Override with env WAYLAND_TEAM_WAKE_TIMEOUT_MS (floored at 30s to reject
   * garbage / a value low enough to re-introduce the false positives).
   */
  private static readonly DEFAULT_INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000;

  private static resolveInactivityTimeoutMs(): number {
    const raw = process.env.WAYLAND_TEAM_WAKE_TIMEOUT_MS;
    if (!raw) return TeammateManager.DEFAULT_INACTIVITY_TIMEOUT_MS;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 30_000) return TeammateManager.DEFAULT_INACTIVITY_TIMEOUT_MS;
    // Clamp to the 32-bit setTimeout ceiling: a larger delay overflows and fires
    // after ~1ms, which would flag every teammate failed immediately - the exact
    // opposite of a long timeout. 2^31-1 ms is ~24.8 days, far past any real use.
    return Math.min(parsed, 2_147_483_647);
  }

  /** Resolved once per manager: the inactivity-watchdog budget for this team. */
  private readonly inactivityTimeoutMs = TeammateManager.resolveInactivityTimeoutMs();

  /**
   * P2 - the persisted lease ({@link LEASE_TTL_MS}, shared with TaskManager) is
   * stamped at wake start, RENEWED on streaming activity (throttled to once per
   * LEASE_RENEW_THROTTLE_MS, see {@link maybeRenewLease}) REGARDLESS of in-memory status,
   * and renewed again at turn completion - so a still-alive turn keeps its lease
   * fresh even after a soft `failed` flip (inactivity/429 that did not kill the
   * process) and is never falsely reclaimed. The lease only lapses when the owner
   * truly stops streaming (e.g. the process died), which is when the Watchdog
   * should reclaim the task.
   */

  /** P2 - last persisted-lease renewal per slot, to throttle mid-turn writes. */
  private readonly lastLeaseRenewMs = new Map<string, number>();

  private readonly unsubResponseStream: () => void;

  constructor(params: TeammateManagerParams) {
    super();
    this.teamId = params.teamId;
    this.agents = [...params.agents];
    this.mailbox = params.mailbox;
    this.workerTaskManager = params.workerTaskManager;
    this.onAgentRemovedFn = params.onAgentRemoved;
    this.teamWorkspace = params.teamWorkspace;
    this.isSandboxed = params.isSandboxed === true;
    this.isImported = params.isImported === true;
    this.getTeamSnapshot = params.getTeamSnapshot;
    this.eventLogger = params.eventLogger;
    this.taskRepo = params.taskRepo;

    for (const agent of this.agents) {
      this.ownedConversationIds.add(agent.conversationId);
      this.registerAcpTeamContext(agent.conversationId);
    }

    // Listen on teamEventBus instead of ipcBridge: ipcBridge.emit() routes through
    // webContents.send() and never triggers same-process .on() listeners.
    const boundHandler = (msg: IResponseMessage) => this.handleResponseStream(msg);
    teamEventBus.on('responseStream', boundHandler);
    this.unsubResponseStream = () => teamEventBus.removeListener('responseStream', boundHandler);
  }

  /** Get the current agents list */
  getAgents(): TeamAgent[] {
    return [...this.agents];
  }

  /** Add a new agent to the team and notify renderer */
  addAgent(agent: TeamAgent): void {
    this.agents = [...this.agents, agent];
    this.ownedConversationIds.add(agent.conversationId);
    this.registerAcpTeamContext(agent.conversationId);
    // Notify renderer so it can refresh team data (tabs, status, etc.)
    ipcBridge.team.agentSpawned.emit({ teamId: this.teamId, agent });
  }

  /**
   * W4 audit CRIT-1 (2026-05-19) - Register the ACP file-op gate context
   * for an agent's conversation. No-op for non-imported teams; the gate
   * checks `isImported` and falls through to the legacy direct-fs path.
   */
  private registerAcpTeamContext(conversationId: string | undefined | null): void {
    if (!conversationId || !this.isImported || !this.getTeamSnapshot) return;
    const getTeam = this.getTeamSnapshot;
    registerTeamConversation(conversationId, {
      teamId: this.teamId,
      isImported: true,
      getTeam,
    });
  }

  /**
   * W4 audit CRIT-1 (2026-05-19) - Unregister an agent's ACP file-op gate
   * context. Safe to call for non-imported teams.
   */
  private unregisterAcpTeamContext(conversationId: string | undefined | null): void {
    if (!conversationId) return;
    unregisterTeamConversation(conversationId);
  }

  /**
   * Kill the underlying CLI process for a slot and clear in-memory wake state,
   * but keep the agent in the roster. Used by both crash handling (lifecycle
   * managed internally) and by `TeamSessionService.restartAgent` (user-driven
   * recovery) so neither path duplicates the kill/timeout cleanup logic.
   */
  killAgentProcess(slotId: string): void {
    const agent = this.agents.find((a) => a.slotId === slotId);
    if (!agent) return;

    if (agent.conversationId) {
      // W5 audit HIGH-2 fix (2026-05-19): drop the ACP team context BEFORE
      // killing the worker so a racing file-op request between kill + the
      // next addAgent/registerAcpTeamContext cannot resolve the stale ctx.
      // The conversationId is reused when the slot restarts, so leaving the
      // registry entry from a prior process is a latent UAF on the ctx
      // accessor. `unregisterAcpTeamContext` is safe to call for non-imported
      // teams (no-ops below the guard).
      this.unregisterAcpTeamContext(agent.conversationId);
      this.workerTaskManager.kill(agent.conversationId);
      this.finalizedTurns.delete(agent.conversationId);
      // DESK-1: the session died - the next process starts a fresh cumulative
      // gauge, whose first snapshot must count fully (no stale baseline).
      this.tokenUsageBaselines.delete(agent.conversationId);
    }

    const timeoutHandle = this.wakeTimeouts.get(slotId);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      this.wakeTimeouts.delete(slotId);
    }
    this.activeWakes.delete(slotId);
  }

  /** True when a wake is currently in flight for the given slot. */
  isWakeActive(slotId: string): boolean {
    return this.activeWakes.has(slotId);
  }

  /**
   * Wake an agent: read unread mailbox, build payload, send to agent.
   * Sets status to 'active' during API call, 'idle' when done.
   * Skips if the agent's wake is already in progress.
   */
  async wake(slotId: string): Promise<void> {
    if (this.activeWakes.has(slotId)) {
      console.debug(`[TeammateManager] wake(${slotId}): SKIPPED (activeWakes)`);
      return;
    }

    const agent = this.agents.find((a) => a.slotId === slotId);
    if (!agent) return;

    console.log(`[TeammateManager] wake(${agent.agentName}): status=${agent.status}, proceeding`);

    // W1e: capture wall-clock duration of the wake for the event log
    const wakeStart = Date.now();
    this.activeWakes.add(slotId);
    // P2: stamp the durable lease on this slot's in_progress tasks using the
    // same wall-clock the wake/timeout code uses. Fire-and-forget so lease
    // persistence never blocks the wake dispatch.
    void this.stampTaskLease(slotId, wakeStart);
    // Clear any stale finalizedTurns entry so a re-woken agent's finish event
    // is not silently dropped by the 5-second dedup window from a prior turn.
    if (agent.conversationId) {
      this.finalizedTurns.delete(agent.conversationId);
    }
    try {
      // Determine if this is the first activation or a crash recovery -
      // these need the full role prompt with static instructions.
      // Subsequent wakes only need a lightweight status update.
      const needsFullPrompt = agent.status === 'pending' || agent.status === 'failed';

      // Transition pending -> idle on first activation
      if (agent.status === 'pending') {
        this.setStatus(slotId, 'idle');
      }

      this.setStatus(slotId, 'active');

      const mailboxMessages = await this.mailbox.readUnread(this.teamId, slotId);
      const teammates = this.agents.filter((a) => a.slotId !== slotId);

      // Write each mailbox message into agent's conversation as user bubble
      // so the UI shows what triggered this agent's response.
      // Skip for leader: messages are included in the prompt sent to the agent.
      if (agent.conversationId && mailboxMessages.length > 0 && agent.role !== 'leader') {
        for (const msg of mailboxMessages) {
          // Skip user messages - already written by TeamSession.sendMessage()
          if (msg.fromAgentId === 'user') continue;
          const sender = this.agents.find((a) => a.slotId === msg.fromAgentId);
          const senderName = msg.fromAgentId === 'user' ? 'User' : (sender?.agentName ?? msg.fromAgentId);
          const displayContent = mailboxMessages.length > 1 ? `[${senderName}] ${msg.content}` : msg.content;
          const msgId = crypto.randomUUID();
          // All messages written to target conversation are incoming from target's perspective
          const teammateMsg = {
            id: msgId,
            msg_id: msgId,
            type: 'text' as const,
            position: 'left' as const,
            conversation_id: agent.conversationId,
            content: {
              content: displayContent,
              teammateMessage: true,
              senderName,
              senderAgentType: sender?.agentType,
              senderConversationId: sender?.conversationId,
            },
            createdAt: Date.now(),
          };
          addMessage(agent.conversationId, teammateMsg);
          ipcBridge.acpConversation.responseStream.emit({
            type: 'teammate_message',
            conversation_id: agent.conversationId,
            msg_id: msgId,
            data: teammateMsg,
          });
        }
      }

      // Build the message to send to the agent:
      // - First wake (pending/failed): static role prompt + any mailbox messages
      // - Subsequent wakes: just the mailbox messages
      // Agents pull tasks and teammates on demand via team_task_list / team_members MCP tools.
      let message: string;
      if (needsFullPrompt) {
        // Compute availableAgentTypes + availableAssistants only for leader's first prompt
        let availableAgentTypes: Array<{ type: string; name: string }> | undefined;
        let availableAssistants: Array<{ customAgentId: string; name: string; backend: string }> | undefined;
        if (agent.role === 'leader') {
          const cachedInitResults = await ProcessConfig.get('acp.cachedInitializeResult');
          availableAgentTypes = agentRegistry
            .getDetectedAgents()
            .filter((a) => isTeamCapableBackend(a.backend, cachedInitResults))
            .map((a) => ({
              type: a.backend,
              name: a.name,
            }));

          const assistants = (await ProcessConfig.get('assistants')) ?? [];
          // Extension-contributed assistants (ext-*) live in ExtensionRegistry,
          // not ProcessConfig. Merge them so the leader's "Available Preset
          // Assistants for Spawning" list includes ext-* specialists (e.g.
          // Quiet Money Council layer specialists). Dedupe by id with config
          // entries winning (config can override extension fields if the user
          // edited the assistant).
          let extensionAssistants: Array<{
            id?: string;
            name?: string;
            presetAgentType?: string;
            description?: string;
            enabledSkills?: string[];
            isPreset?: boolean;
            enabled?: boolean;
          }> = [];
          try {
            const { ExtensionRegistry } = await import('@process/extensions/ExtensionRegistry');
            extensionAssistants = ExtensionRegistry.getInstance().getAssistants() as typeof extensionAssistants;
          } catch {
            // Registry not initialized - leader sees only ProcessConfig entries.
          }
          const configIds = new Set(assistants.map((a) => a.id));
          const mergedAssistants = [
            ...assistants,
            ...extensionAssistants.filter((a) => typeof a.id === 'string' && !configIds.has(a.id as string)),
          ];
          // Emit id+name+backend only. The per-assistant description and skills
          // list are intentionally omitted from the leader's static prompt (they
          // were the largest slice of the catalog and are re-billed every turn);
          // the leader loads them on demand via the team_describe_assistant tool.
          availableAssistants = mergedAssistants
            .filter((a) => a.isPreset && a.enabled !== false)
            .map((a) => ({
              customAgentId: a.id as string,
              name: a.name as string,
              backend: (a.presetAgentType as string) || 'gemini',
            }))
            .filter((a) => isTeamCapableBackend(a.backend, cachedInitResults));
        }

        const staticPrompt = buildRolePrompt({
          agent,
          teammates,
          availableAgentTypes,
          availableAssistants,
          renamedAgents: this.renamedAgents,
          teamWorkspace: this.teamWorkspace,
          isSandboxed: this.isSandboxed,
        });

        message =
          mailboxMessages.length > 0
            ? `${staticPrompt}\n\n## Unread Messages\n${formatMessages(mailboxMessages, this.agents)}`
            : staticPrompt;
      } else {
        // Subsequent wakes: just forward the mailbox messages
        if (mailboxMessages.length === 0) {
          // Nothing to send - restore idle status and release wake
          this.setStatus(slotId, 'idle');
          this.activeWakes.delete(slotId);
          this.logWakeEvent(slotId, wakeStart, true, { noop: true });
          return;
        }
        message = formatMessages(mailboxMessages, this.agents);
      }

      console.log(
        `[TeammateManager] wake(${agent.agentName}): sendPrompt type=${needsFullPrompt ? 'full' : 'messages-only'}, length=${message.length}, preview=${JSON.stringify(message.slice(0, 200))}`
      );

      const agentTask = await this.workerTaskManager.getOrBuildTask(agent.conversationId);
      const msgId = crypto.randomUUID();

      // Extract files from user messages in this batch
      const userFiles = mailboxMessages
        .filter((m) => m.fromAgentId === 'user' && m.files?.length)
        .flatMap((m) => m.files!);

      // Each AgentManager implementation expects a specific object shape.
      // Gemini uses { input, msg_id }, all others use { content, msg_id }.
      const messageData =
        agent.conversationType === 'gemini'
          ? { input: message, msg_id: msgId, silent: true, ...(userFiles.length > 0 ? { files: userFiles } : {}) }
          : { content: message, msg_id: msgId, silent: true, ...(userFiles.length > 0 ? { files: userFiles } : {}) };

      await agentTask.sendMessage(messageData);

      // Release wake lock immediately after message is sent.
      // finalizeTurn will also delete it (safe no-op). This prevents permanent
      // deadlock when finish events are lost or finalizeTurn never fires.
      this.activeWakes.delete(slotId);

      // Arm the inactivity watchdog. Any streaming output from this agent
      // resets it via handleResponseStream → resetWakeTimeout. It only fires
      // when the agent has been silent for inactivityTimeoutMs with no finish event.
      this.resetWakeTimeout(slotId);

      // W1e: log the successful wake (post-sendMessage, before turn completes).
      this.logWakeEvent(slotId, wakeStart, true, {
        promptKind: needsFullPrompt ? 'full' : 'messages-only',
        mailboxCount: mailboxMessages.length,
      });
    } catch (error) {
      console.error(`[TeammateManager] wake(${slotId}) failed:`, error);
      this.setStatus(slotId, 'failed');
      this.activeWakes.delete(slotId);
      this.logWakeEvent(slotId, wakeStart, false, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    // activeWakes entry is removed when turnCompleted fires (or by timeout)
  }

  /** Set agent status, update the local agents array, and emit IPC event */
  setStatus(slotId: string, status: TeammateStatus, lastMessage?: string): void {
    this.agents = this.agents.map((a) => (a.slotId === slotId ? { ...a, status } : a));
    ipcBridge.team.agentStatusChanged.emit({ teamId: this.teamId, slotId, status, lastMessage });
    this.emit('agentStatusChanged', { teamId: this.teamId, slotId, status, lastMessage });
  }

  /** Clean up all IPC listeners, timers, and EventEmitter handlers */
  dispose(): void {
    this.unsubResponseStream();
    for (const handle of this.wakeTimeouts.values()) {
      clearTimeout(handle);
    }
    this.wakeTimeouts.clear();
    this.activeWakes.clear();
    this.tokenUsageBaselines.clear();
    // W5 audit HIGH-2 fix (2026-05-19): drain ACP team-context registry
    // entries for every owned conversation so a disposed session cannot
    // leak gate-routing data into the next team that reuses any of these
    // conversation IDs. Safe for non-imported teams.
    for (const agent of this.agents) {
      this.unregisterAcpTeamContext(agent.conversationId);
    }
    this.removeAllListeners();
  }

  // ---------------------------------------------------------------------------
  // P2 durable execution - task lease stamp / renew
  // ---------------------------------------------------------------------------

  /**
   * P2 - stamp or renew the durable lease on every `in_progress` task owned by
   * this slot. Called at wake start (stamp) and on `turnCompleted` (renew). The
   * lease lets the out-of-process Watchdog reclaim a task whose owner died
   * without ever firing the in-memory inactivity timeout.
   *
   * - `nowMs` doubles as `lastHeartbeat` and the base for `leaseExpiresAt`
   *   (`nowMs + LEASE_TTL_MS`), using the same `Date.now()` millisecond clock the
   *   wake/timeout code already uses (caller passes the wake's `wakeStart`).
   * - `leaseOwner` is set to the slotId so the Watchdog can attribute the lease.
   *
   * No-op when no `taskRepo` was provided (existing tests / standalone). Writes
   * go straight through the repo (not `TaskManager.update`) so lease bookkeeping
   * does not spam `team_event_log` with a `'task'` row on every turn.
   */
  private async stampTaskLease(slotId: string, nowMs: number): Promise<void> {
    const repo = this.taskRepo;
    if (!repo) return;
    try {
      const owned = await repo.findTasksByOwner(this.teamId, slotId);
      const inProgress = owned.filter((t) => t.status === 'in_progress');
      if (inProgress.length === 0) return;
      const leaseExpiresAt = nowMs + LEASE_TTL_MS;
      // Targeted, guarded renew (WHERE owner+status='in_progress') so a lease
      // write can never resurrect a zombie or clobber a concurrent transition.
      await Promise.all(inProgress.map((t) => repo.renewLease(t.id, slotId, leaseExpiresAt, nowMs)));
    } catch (error) {
      // Lease bookkeeping must never break the wake loop. The Watchdog tolerates
      // a missed renew (it only acts once leaseExpiresAt has fully lapsed).
      console.warn(
        `[TeammateManager] stampTaskLease(${slotId}) failed:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Private stream handlers
  // ---------------------------------------------------------------------------

  /**
   * W1e - emit a `'wake'` event with duration + success flag. Helper so the
   * three wake() exit points (noop, success, failure) all share one schema.
   */
  private logWakeEvent(slotId: string, startedAt: number, success: boolean, extra: Record<string, unknown> = {}): void {
    if (!this.eventLogger) return;
    void this.eventLogger.append({
      teamId: this.teamId,
      eventType: 'wake',
      actorSlotId: slotId,
      payload: {
        success,
        duration_ms: Date.now() - startedAt,
        ...extra,
      },
    });
  }

  private handleResponseStream(msg: IResponseMessage): void {
    // Fast O(1) check: skip events for conversations not owned by this team
    if (!this.ownedConversationIds.has(msg.conversation_id)) return;

    const agent = this.agents.find((a) => a.conversationId === msg.conversation_id);
    if (!agent) return;

    // W1e/DESK-1: token-usage events flow through the response stream as
    // `acp_context_usage`. ACP emits `used`/`cost` as a per-conversation
    // CUMULATIVE session gauge re-sent on every update (acpTypes: "total
    // tokens currently in context"), so summing raw rows N-counts. Each
    // `token_usage` row therefore carries BOTH the raw snapshot fields
    // (prompt_tokens / total_tokens / cost_estimate_usd - the original W1e
    // shape, kept for back-compat) AND the per-event spend deltas
    // (`tokens_delta` / `cost_delta`) computed against the previous snapshot
    // for this agent session ({@link computeUsageDelta}). The W2d cost meter
    // sums ONLY the delta fields. The baseline tracks the LATEST snapshot
    // (not a high-water mark): after a compaction/reset drop the gauge
    // legitimately grows again from the lower value, and that growth is real
    // new spend that must be counted. ACP gives a `used` total only (no
    // prompt/completion split), so completion_tokens stays 0.
    if (msg.type === 'acp_context_usage') {
      const usage = msg.data as { used?: number; size?: number; cost?: { amount?: number; currency?: string } } | null;
      if (usage && typeof usage.used === 'number') {
        const cumulativeUsed = usage.used;
        const costAmount = typeof usage.cost?.amount === 'number' ? usage.cost.amount : 0;
        const currency = usage.cost?.currency ?? 'USD';
        // Only USD cost estimates are meaningful for the W2d meter; other
        // currencies are recorded but normalized to 0 in cost_estimate_usd.
        const cumulativeCostUsd = currency === 'USD' ? costAmount : 0;

        const prev = this.tokenUsageBaselines.get(msg.conversation_id);
        const next: UsageSnapshot = { used: cumulativeUsed, cost: cumulativeCostUsd };
        const { tokensDelta, costDelta } = computeUsageDelta(prev, next);
        this.tokenUsageBaselines.set(msg.conversation_id, next);

        if (this.eventLogger && (tokensDelta > 0 || costDelta > 0)) {
          void this.eventLogger.append({
            teamId: this.teamId,
            eventType: 'token_usage',
            actorSlotId: agent.slotId,
            payload: {
              slot_id: agent.slotId,
              backend: agent.agentType,
              // Raw cumulative session snapshot (back-compat W1e shape).
              prompt_tokens: cumulativeUsed,
              completion_tokens: 0,
              total_tokens: cumulativeUsed,
              cost_estimate_usd: cumulativeCostUsd,
              // Per-event spend deltas - the ONLY fields the meter sums.
              tokens_delta: tokensDelta,
              cost_delta: costDelta,
              currency,
              context_window: typeof usage.size === 'number' ? usage.size : 0,
            },
          });
        }
      }
    }

    // Detect agent crash:
    // 1. AcpAgent.handleDisconnect emits finish with agentCrash flag (wrapper process dies)
    // 2. Inner claude dies but wrapper lives → error string contains crash keywords
    const msgData = msg.data as { agentCrash?: boolean; error?: string } | null;
    if (msg.type === 'finish' && msgData?.agentCrash) {
      void this.handleAgentCrash(agent, msgData.error ?? 'Unknown error');
      return;
    }
    if (msg.type === 'error') {
      const errorText = typeof msg.data === 'string' ? msg.data : (msgData?.error ?? '');
      if (errorText.includes('process exited unexpectedly') || errorText.includes('Session not found')) {
        void this.handleAgentCrash(agent, errorText);
        return;
      }
      // Detect quota/rate-limit errors (429) and mark agent as failed
      if (/429|rate.?limit|quota|too many requests/i.test(errorText)) {
        this.setStatus(agent.slotId, 'failed', errorText.slice(0, 200));
        return;
      }
    }

    // Detect terminal stream messages and trigger turn completion.
    if (msg.type === 'finish' || msg.type === 'error') {
      void this.finalizeTurn(msg.conversation_id, msg.turnId);
      return;
    }

    // Heartbeat: any non-terminal streaming activity (text, tool calls, thoughts)
    // proves the agent is still alive. Reset the inactivity watchdog so a genuinely
    // long-running turn (e.g. Codex emitting extended reasoning before its first
    // team_send_message) isn't prematurely declared dead.
    if (agent.status === 'active' && this.wakeTimeouts.has(agent.slotId)) {
      this.resetWakeTimeout(agent.slotId);
    }
    // Persisted-lease renewal is DECOUPLED from in-memory status: a process still
    // streaming after a soft `failed` flip (inactivity timeout / 429 that did NOT
    // kill it) keeps renewing its lease, so the Watchdog never reclaims a live
    // owner and re-dispatches its work. Throttled + internally guarded to the
    // slot's in_progress owned tasks, so it is a cheap no-op once a turn is done.
    this.maybeRenewLease(agent.slotId);
  }

  /**
   * P2 - renew the persisted lease on streaming activity, at most once per
   * LEASE_RENEW_THROTTLE_MS to avoid spamming the DB. Without this the persisted
   * lease would only refresh at wake start / turn end, so a turn that streams for
   * longer than LEASE_TTL_MS would let its lease lapse and be falsely reclaimed
   * while still alive.
   */
  private maybeRenewLease(slotId: string): void {
    if (!this.taskRepo) return;
    const now = Date.now();
    const last = this.lastLeaseRenewMs.get(slotId) ?? 0;
    if (now - last < TeammateManager.LEASE_RENEW_THROTTLE_MS) return;
    this.lastLeaseRenewMs.set(slotId, now);
    void this.stampTaskLease(slotId, now);
  }

  /**
   * (Re)arm the inactivity watchdog for an agent's current wake.
   * Fired from wake() after dispatching the prompt, and from handleResponseStream
   * whenever fresh streaming activity arrives. When it finally fires (agent silent
   * for inactivityTimeoutMs), escalates to handleInactivityTimeout so the leader
   * learns about the stall instead of the agent dropping silently to idle.
   */
  private resetWakeTimeout(slotId: string): void {
    const existing = this.wakeTimeouts.get(slotId);
    if (existing) clearTimeout(existing);

    const timeoutHandle = setTimeout(() => {
      this.wakeTimeouts.delete(slotId);
      const currentAgent = this.agents.find((a) => a.slotId === slotId);
      if (currentAgent?.status === 'active') {
        void this.handleInactivityTimeout(currentAgent);
      }
    }, this.inactivityTimeoutMs);
    this.wakeTimeouts.set(slotId, timeoutHandle);
  }

  /**
   * A teammate went silent for inactivityTimeoutMs with no streaming activity and
   * no finish event. Treat it as a soft failure: mark the agent 'failed' (not
   * 'idle', which hides the problem), write an explanatory message into the
   * leader's mailbox, and wake the leader so it can decide the next move (retry,
   * replace, escalate).
   *
   * Previously the timeout just setStatus(slotId, 'idle'), which left the leader
   * unaware - it would eventually re-wake on some other signal and guess that
   * the teammate was "idle-spinning" with no concrete evidence.
   */
  private async handleInactivityTimeout(agent: TeamAgent): Promise<void> {
    const timeoutSeconds = Math.floor(this.inactivityTimeoutMs / 1000);
    const reason = `has not streamed any update in ${timeoutSeconds}s and may be stalled`;

    console.warn(`[TeammateManager] ${agent.agentName} (${agent.slotId}) ${reason}`);
    this.setStatus(agent.slotId, 'failed', reason);

    // Don't escalate to leader if the stuck agent IS the leader - nobody to notify.
    if (agent.role === 'leader') return;

    const leadAgent = this.agents.find((a) => a.role === 'leader');
    if (!leadAgent) return;

    try {
      await this.mailbox.write({
        teamId: this.teamId,
        toAgentId: leadAgent.slotId,
        fromAgentId: agent.slotId,
        type: 'idle_notification',
        content:
          `Teammate ${agent.agentName} (${agent.agentType}) ${reason}. ` +
          `Their session may be stuck or the model may be generating an overlong silent turn. ` +
          `Decide whether to retry by sending them a fresh message, replace them with another agent, or continue without them.`,
      });
      await this.wake(leadAgent.slotId);
    } catch (err) {
      console.error('[TeammateManager] Failed to notify leader of inactivity timeout:', err);
    }
  }

  /**
   * Turn completion handler. Triggered by responseStream 'finish'/'error' events.
   * Manages state machine transitions and sends idle notifications to the leader.
   * All agent coordination (send_message, task_create, etc.) is handled via MCP tool calls
   * in TeamMcpServer - this method only needs to manage lifecycle.
   */
  private async finalizeTurn(conversationId: string, turnId?: string | number): Promise<void> {
    // #787: dedup per (conversation, turn). A late duplicate of a prior turn's
    // finish that arrives AFTER the agent was re-woken must still be suppressed,
    // yet the re-wake's own fresh turn must be free to finalize. Keying by
    // conversation alone can't distinguish them: `wake()` clears the entry so
    // the new turn isn't wrongly deduped, which simultaneously un-dedups the old
    // turn's straggler → a duplicate idle_notification. A per-turn key fixes
    // both: the straggler (turnId=A) stays deduped while the re-wake (turnId=B)
    // uses a distinct key. Non-ACP / signal-channel finishes carry no turnId and
    // fall back to conversation-only keying (unchanged behaviour) — and note
    // `wake()`'s bare-`conversationId` delete only removes that fallback key, so
    // it never disturbs a live `${conv}#${turnId}` entry.
    const dedupKey = turnId === undefined ? conversationId : `${conversationId}#${turnId}`;
    // Dedup: skip if this turn was already finalized
    if (this.finalizedTurns.has(dedupKey)) return;
    this.finalizedTurns.add(dedupKey);
    // Clean up the dedup entry after a short delay so future turns can be processed
    setTimeout(() => this.finalizedTurns.delete(dedupKey), 5000);

    const agent = this.agents.find((a) => a.conversationId === conversationId);
    if (!agent) return;

    this.activeWakes.delete(agent.slotId);

    // P2: renew the lease on this slot's still-in_progress tasks now that a turn
    // completed (extends leaseExpiresAt + bumps lastHeartbeat). A task the agent
    // marked completed this turn is no longer in_progress, so stampTaskLease
    // skips it - the lease is effectively cleared when a task leaves in_progress.
    void this.stampTaskLease(agent.slotId, Date.now());

    // Clear the wake timeout since the turn completed normally
    const timeoutHandle = this.wakeTimeouts.get(agent.slotId);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      this.wakeTimeouts.delete(agent.slotId);
    }

    if (agent.status === 'active') {
      this.setStatus(agent.slotId, 'idle');
    }

    // Auto-send idle notification to leader.
    // Must run AFTER setStatus(idle) so maybeWakeLeaderWhenAllIdle sees the updated state.
    //
    // 2026-05-26 (v0.6.2.4): include the specialist's most-recent assistant text
    // in the notification. Without this the leader only saw "Turn completed" and
    // had no idea what the specialist actually produced - the architecture
    // *expected* specialists to call `team_send_message` explicitly to report
    // results, but LLM tool-call compliance is unreliable (Gemini in particular
    // often answered in its own chat without ever calling the report tool, leaving
    // the leader blind despite a full visible response in the specialist column).
    // Auto-forwarding the content as a fallback closes that gap deterministically;
    // specialists that DO call `team_send_message` simply produce a duplicate
    // mailbox entry, which is acceptable for robustness.
    if (agent.role !== 'leader') {
      const leadAgent = this.agents.find((a) => a.role === 'leader');
      if (leadAgent && leadAgent.slotId !== agent.slotId) {
        const excerpt = await this.readLastAssistantExcerpt(agent.conversationId);
        const content = excerpt ? `Turn completed\n\n${excerpt}` : 'Turn completed';
        await this.mailbox.write({
          teamId: this.teamId,
          toAgentId: leadAgent.slotId,
          fromAgentId: agent.slotId,
          content,
          type: 'idle_notification',
        });
        // Only wake leader when ALL non-leader teammates are idle/completed/failed/pending.
        // This prevents death loops where each idle notification triggers a new leader turn.
        this.maybeWakeLeaderWhenAllIdle(leadAgent.slotId);
      }

      // #781: a mailbox message that arrives while this agent's wake is in
      // flight is skipped by the activeWakes guard and would otherwise sit
      // undelivered until some unrelated future wake. Observed live: the
      // leader's shutdown_request landed during the member's long spawn turn,
      // the member never saw it, and "fire the member" hung forever. Now that
      // the turn is over, drain anything still unread. wake() re-checks the
      // mailbox atomically (readUnreadAndMark), so a concurrent wake cannot
      // double-deliver. Leader re-delivery stays gated by
      // maybeWakeLeaderWhenAllIdle to avoid notification-per-turn churn.
      try {
        const pending = await this.mailbox.peekUnread(this.teamId, agent.slotId);
        if (pending.length > 0) {
          console.log(
            `[TeammateManager] finalizeTurn(${agent.agentName}): ${pending.length} unread message(s) arrived mid-turn, re-waking`
          );
          void this.wake(agent.slotId).catch((err) => {
            console.error(`[TeammateManager] finalizeTurn re-wake(${agent.slotId}) failed:`, err);
          });
        }
      } catch (err) {
        console.warn(
          `[TeammateManager] finalizeTurn(${agent.slotId}) unread-mailbox check failed:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    } else {
      // #786: the leader has the SAME mid-wake delivery race as members - a
      // message written to the leader's mailbox while its wake is in flight is
      // skipped by the activeWakes guard (e.g. a user follow-up sent during the
      // leader's long first-spawn turn). The member drain above intentionally
      // excludes the leader because an unconditional re-wake would re-introduce
      // the notification-per-turn churn that maybeWakeLeaderWhenAllIdle exists to
      // prevent. So drain the leader's own unread mailbox here, but re-wake ONLY
      // when it holds real content (a user follow-up or a member report) - never
      // for idle_notifications alone. Otherwise a leader message can rot when no
      // member finishes a turn afterward (or there are no members at all) to
      // trip maybeWakeLeaderWhenAllIdle. wake() drains ALL unread atomically
      // (readUnreadAndMark), so any idle_notifications ride along on that wake.
      try {
        const pending = await this.mailbox.peekUnread(this.teamId, agent.slotId);
        const actionable = pending.filter((m) => m.type !== 'idle_notification');
        if (actionable.length > 0) {
          console.log(
            `[TeammateManager] finalizeTurn(leader ${agent.agentName}): ${actionable.length} actionable unread message(s) arrived mid-turn, re-waking`
          );
          void this.wake(agent.slotId).catch((err) => {
            console.error(`[TeammateManager] finalizeTurn leader re-wake(${agent.slotId}) failed:`, err);
          });
        }
      } catch (err) {
        console.warn(
          `[TeammateManager] finalizeTurn(leader ${agent.slotId}) unread-mailbox check failed:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }
  }

  /**
   * Read the most recent assistant text from a specialist's conversation, capped
   * for safe inclusion in the leader's mailbox. Used by `finalizeTurn` to make
   * sure the leader sees what the specialist actually produced even when the
   * specialist forgets (or refuses) to call `team_send_message` explicitly.
   *
   * Returns null when no assistant text is available (DB error, no messages,
   * empty content, or unknown conversationId).
   *
   * The cap is intentionally generous: a chunk of conversation is more useful
   * to the leader than a terse summary, and the leader's downstream prompt
   * has its own context budget that already handles long mailbox content.
   * 3000 chars is roughly 750 tokens - about one model-response worth - and
   * still small relative to the leader's typical ~28KB role prompt.
   */
  private async readLastAssistantExcerpt(conversationId: string | undefined): Promise<string | null> {
    if (!conversationId) return null;
    const MAX_CHARS = 3000;
    try {
      const db = await getDatabase();
      // DESC so the latest assistant message is at index 0. Limit 10 to skip
      // over interleaved tool-call / thinking messages and find the most recent
      // text content.
      const result = db.getConversationMessages(conversationId, 0, 10, 'DESC');
      const messages = result.data ?? [];
      for (const msg of messages) {
        if (msg.position !== 'left') continue; // skip user-side messages
        if (msg.type !== 'text') continue; // skip tool calls, thinking, etc.
        const text = extractTextFromMessage(msg).trim();
        if (!text) continue;
        if (text.length <= MAX_CHARS) return text;
        return `${text.slice(0, MAX_CHARS)}\n…[truncated, ${text.length - MAX_CHARS} more chars]`;
      }
      return null;
    } catch (error) {
      // Swallow - the lifecycle notification must still fire even if the DB
      // read fails. The leader will get the bare "Turn completed" notification
      // and can ask the specialist to repeat its response.
      console.warn(
        `[TeammateManager] readLastAssistantExcerpt(${conversationId}) failed:`,
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  /**
   * Wake the leader only when ALL non-leader teammates are settled (idle/completed/failed/pending).
   * Prevents death loops where each individual idle notification triggers a new leader turn
   * before other teammates have finished, causing the leader to re-dispatch work repeatedly.
   */
  private maybeWakeLeaderWhenAllIdle(leadSlotId: string): void {
    const nonLeadAgents = this.agents.filter((a) => a.role !== 'leader');
    if (nonLeadAgents.length === 0) return;
    const allSettled = nonLeadAgents.every(
      (a) => a.status === 'idle' || a.status === 'completed' || a.status === 'failed' || a.status === 'pending'
    );
    console.log(
      `[TeammateManager] maybeWakeLeaderWhenAllIdle: ${nonLeadAgents.map((a) => `${a.agentName}:${a.status}`).join(', ')} → ${allSettled ? 'WAKE' : 'SKIP'}`
    );
    if (allSettled) {
      void this.wake(leadSlotId);
    }
  }

  /**
   * Handle an agent whose CLI process crashed unexpectedly.
   * For **members**: kills the process, clears wake locks, marks as failed (tab stays),
   * writes a testament to the leader's mailbox, and wakes the leader.
   * Local data and the agent slot are preserved so the agent can be recovered.
   * For **leader**: only marks it as failed - leader must never be auto-removed.
   */
  private async handleAgentCrash(agent: TeamAgent, errorMessage: string): Promise<void> {
    // DESK-1: crashed session -> reset the usage-gauge baseline so the
    // recovered session's first cumulative snapshot counts fully.
    if (agent.conversationId) {
      this.tokenUsageBaselines.delete(agent.conversationId);
    }

    // Leader crash: mark as failed so the frontend shows the error, but never auto-remove.
    if (agent.role === 'leader') {
      console.warn(
        `[TeammateManager] Leader ${agent.slotId} (${agent.agentName}) crashed: ${errorMessage}. Marked as failed (not removed).`
      );

      // Kill the crashed process (clean up residual child process)
      if (agent.conversationId) {
        this.workerTaskManager.kill(agent.conversationId);
      }

      // Clear wake locks to prevent future wake() calls from being permanently skipped
      const timeoutHandle = this.wakeTimeouts.get(agent.slotId);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.wakeTimeouts.delete(agent.slotId);
      }
      this.activeWakes.delete(agent.slotId);

      this.setStatus(agent.slotId, 'failed', errorMessage.slice(0, 200));
      return;
    }

    const leadAgent = this.agents.find((a) => a.role === 'leader');
    if (!leadAgent) {
      // No leader to notify - kill process and mark failed, keep the slot
      // 1. Kill the crashed process
      if (agent.conversationId) {
        this.workerTaskManager.kill(agent.conversationId);
      }

      // 2. Clear wake locks to prevent deadlock on next wake
      const timeoutHandle = this.wakeTimeouts.get(agent.slotId);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.wakeTimeouts.delete(agent.slotId);
      }
      this.activeWakes.delete(agent.slotId);

      // 3. Mark as failed (frontend shows error status, tab stays)
      this.setStatus(agent.slotId, 'failed', errorMessage.slice(0, 200));
      return;
    }

    const testament =
      `[System] Member "${agent.agentName}" (${agent.conversationType}) crashed. ` +
      `Error: ${errorMessage}. ` +
      `The member slot is preserved and can be recovered if needed.`;

    // 1. Write testament to leader's mailbox
    await this.mailbox.write({
      teamId: this.teamId,
      toAgentId: leadAgent.slotId,
      fromAgentId: agent.slotId,
      content: testament,
      type: 'message',
      summary: `${agent.agentName} crashed`,
    });

    console.warn(
      `[TeammateManager] Agent ${agent.slotId} (${agent.agentName}) crashed: ${errorMessage}. Testament sent to leader.`
    );

    // 2. Kill the crashed process (clean up residual child process + remove from taskList cache)
    if (agent.conversationId) {
      this.workerTaskManager.kill(agent.conversationId);
    }

    // 3. Clear wake locks to prevent deadlock on next wake
    const timeoutHandle = this.wakeTimeouts.get(agent.slotId);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      this.wakeTimeouts.delete(agent.slotId);
    }
    this.activeWakes.delete(agent.slotId);

    // 4. Mark as failed (frontend shows error status, tab stays)
    this.setStatus(agent.slotId, 'failed', errorMessage.slice(0, 200));

    // 5. Wake leader to process the testament
    void this.wake(leadAgent.slotId);
  }

  /** Remove an agent: kill process, cancel pending wake, clear buffers, remove from in-memory list.
   *  Leader cannot be removed - callers must not pass leader's slotId. */
  removeAgent(slotId: string): void {
    const agent = this.agents.find((a) => a.slotId === slotId);
    if (!agent) return;

    if (agent.role === 'leader') {
      console.warn(`[TeammateManager] Attempted to remove leader ${slotId} - blocked.`);
      return;
    }

    // Kill the underlying ACP process
    if (agent.conversationId) {
      this.workerTaskManager.kill(agent.conversationId);
    }

    // Cancel any pending wake timeout
    const timeoutHandle = this.wakeTimeouts.get(slotId);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      this.wakeTimeouts.delete(slotId);
    }
    this.activeWakes.delete(slotId);

    // Clean up owned conversation tracking
    if (agent.conversationId) {
      this.ownedConversationIds.delete(agent.conversationId);
      this.unregisterAcpTeamContext(agent.conversationId);
      this.finalizedTurns.delete(agent.conversationId);
      this.tokenUsageBaselines.delete(agent.conversationId);
    }

    this.agents = this.agents.filter((a) => a.slotId !== slotId);
    console.log(`[TeammateManager] Agent ${slotId} (${agent.agentName}) removed`);
    ipcBridge.team.agentRemoved.emit({ teamId: this.teamId, slotId });

    // Notify upper layer to persist the removal (e.g. update DB)
    this.onAgentRemovedFn?.(this.teamId, this.agents);
  }

  /** Normalize agent name for case-insensitive comparison. */
  private static normalize(s: string): string {
    return s
      .trim()
      .toLowerCase()
      .replace(/\u00a0|\u200b|\u200c|\u200d|\ufeff/g, ' ')
      .replace(/[\u201c\u201d\u201e\u2018\u2019"']/g, '')
      .replace(/\s+/g, ' ');
  }

  /** Rename an agent. Updates in-memory state; caller is responsible for persistence. */
  renameAgent(slotId: string, newName: string): void {
    const trimmed = newName.trim();
    if (!trimmed) throw new Error('Agent name cannot be empty');

    const agent = this.agents.find((a) => a.slotId === slotId);
    if (!agent) throw new Error(`Agent "${slotId}" not found`);

    const needle = TeammateManager.normalize(trimmed);
    const duplicate = this.agents.find((a) => a.slotId !== slotId && TeammateManager.normalize(a.agentName) === needle);
    if (duplicate) throw new Error(`Agent name "${trimmed}" is already taken by ${duplicate.slotId}`);

    const oldName = agent.agentName;
    // Only store the very first original name so multiple renames show the original
    if (!this.renamedAgents.has(slotId)) {
      this.renamedAgents.set(slotId, oldName);
    }
    this.agents = this.agents.map((a) => (a.slotId === slotId ? { ...a, agentName: trimmed } : a));
    console.log(`[TeammateManager] Agent ${slotId} renamed: "${oldName}" → "${trimmed}"`);
    ipcBridge.team.agentRenamed.emit({ teamId: this.teamId, slotId, oldName, newName: trimmed });
  }
}
