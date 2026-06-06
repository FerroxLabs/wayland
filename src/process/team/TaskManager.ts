// src/process/team/TaskManager.ts
import type { EventLogger } from './EventLogger';
import type { ITeamRepository } from './repository/ITeamRepository';
import { LEASE_TTL_MS } from './types';
import type { TeamAgent, TeamTask } from './types';
import type { VerificationGate } from './VerificationGate';

/** Parameters for creating a new task */
type CreateTaskParams = {
  teamId: string;
  subject: string;
  description?: string;
  owner?: string;
  blockedBy?: string[];
};

/** Parameters for updating an existing task */
type UpdateTaskParams = {
  status?: TeamTask['status'];
  owner?: string;
  description?: string;
  /** P3: lets the verification gate persist its record onto the task. */
  metadata?: Record<string, unknown>;
};

/** Function returning the current team roster - used for owner validation */
type GetAgentsFn = () => TeamAgent[];

/**
 * Thrown when `team_task_create` / `team_task_update` are called with an
 * `owner` that does not match any slotId on the current team. Surfaced through
 * the MCP TCP transport as a structured `{ error: <message> }` payload so the
 * caller can correct the slotId rather than silently writing an orphan task.
 */
export class TeamTaskOwnerNotFoundError extends Error {
  readonly code = 'TEAM_TASK_OWNER_NOT_FOUND';

  constructor(badSlotId: string, availableSlotIds: string[]) {
    const available = availableSlotIds.length > 0 ? availableSlotIds.join(', ') : '(no agents on team)';
    super(`Task owner "${badSlotId}" is not a slotId on this team. Available slotIds: ${available}.`);
    this.name = 'TeamTaskOwnerNotFoundError';
  }
}

/**
 * Service layer for task CRUD with dependency graph resolution.
 * Maintains bidirectional links between tasks via `blockedBy` / `blocks`.
 *
 * Owner validation: when a task's `owner` is set, it must match the `slotId`
 * of an agent on the team's current roster (looked up via `getAgents`). This
 * prevents typos and stale slotIds from creating tasks no agent can claim.
 */
export class TaskManager {
  /**
   * @param repo         underlying persistence
   * @param getAgents    thunk returning the current roster, for owner validation
   * @param eventLogger  W1e - optional team_event_log writer. Each successful
   *                     `create()` / `update()` appends a `'task'` event. Logger
   *                     absence keeps existing tests + call sites working unchanged.
   */
  constructor(
    private readonly repo: ITeamRepository,
    private readonly getAgents: GetAgentsFn,
    private readonly eventLogger?: EventLogger,
    /**
     * P3 - optional verification gate. When present, a transition to
     * `completed` is routed through it (status held at `verifying` while the
     * cross-audit runs). Absence keeps the legacy direct-complete behavior, so
     * existing call sites and tests work unchanged.
     */
    private readonly verificationGate?: VerificationGate
  ) {}

  /** P3 - task ids with a verification gate in flight, to single-flight the gate. */
  private readonly gating = new Set<string>();

  /**
   * Validate that `owner` is a real slotId on the current team. No-op when
   * owner is undefined or an empty string (both treated as "unassigned").
   */
  private validateOwner(owner: string | undefined): void {
    if (!owner) return;
    const agents = this.getAgents();
    if (!agents.some((a) => a.slotId === owner)) {
      throw new TeamTaskOwnerNotFoundError(
        owner,
        agents.map((a) => a.slotId)
      );
    }
  }

  /**
   * Create a new task. Auto-generates ID and timestamps.
   * When `blockedBy` is provided, also updates the `blocks` array of each
   * upstream task to maintain bidirectional links.
   *
   * @throws {TeamTaskOwnerNotFoundError} when `owner` is set to a slotId not
   *   present on the current team roster.
   */
  async create(params: CreateTaskParams): Promise<TeamTask> {
    this.validateOwner(params.owner);

    const now = Date.now();
    const task: TeamTask = {
      id: crypto.randomUUID(),
      teamId: params.teamId,
      subject: params.subject,
      description: params.description,
      status: 'pending',
      owner: params.owner,
      blockedBy: params.blockedBy ?? [],
      blocks: [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.repo.createTask(task);

    // Atomically append to `blocks` on each upstream task (bidirectional link)
    if (created.blockedBy.length > 0) {
      await Promise.all(created.blockedBy.map((upstreamId) => this.repo.appendToBlocks(upstreamId, created.id)));
    }

    // W1e: log AFTER successful create (skip on validation throw above).
    if (this.eventLogger) {
      void this.eventLogger.append({
        teamId: created.teamId,
        eventType: 'task',
        actorSlotId: created.owner,
        targetSlotId: created.id,
        payload: {
          action: 'create',
          taskId: created.id,
          status: created.status,
          subject: created.subject,
        },
      });
    }

    return created;
  }

  /**
   * Update a task. Auto-updates `updatedAt`. Returns the merged task.
   *
   * @throws {TeamTaskOwnerNotFoundError} when `updates.owner` is reassigned to
   *   a slotId not present on the current team roster.
   */
  async update(taskId: string, updates: UpdateTaskParams): Promise<TeamTask> {
    this.validateOwner(updates.owner);

    // P3 verification gate: intercept a proposed transition to `completed`.
    // The gate runs at most once per proposal - it persists `verifying` while
    // the cross-audit runs, then writes the FINAL status itself - so we must
    // NOT re-enter when the gate's own completing write flows back through.
    if (this.verificationGate && updates.status === 'completed') {
      const current = await this.repo.findTaskById(taskId);
      if (current) {
        // A task escalated to `needs_human` is PARKED: dropping the completion
        // (rather than re-running the paid gate on every re-proposal) so it
        // cannot loop indefinitely. A human must resolve it out of band.
        const verification = current.metadata?.verification as { needsHuman?: boolean } | undefined;
        if (verification?.needsHuman) return current;
        // Only gate a genuine in-flight proposal. If the task is already
        // `verifying` (a re-entrant call) we skip the gate to avoid a
        // verifying -> completed -> verifying loop and complete directly below.
        if (current.status !== 'verifying') {
          // Single-flight: a second concurrent `completed` proposal for the same
          // task is dropped rather than launching a duplicate (paid) cross-audit
          // that would clobber the first's verification record.
          if (this.gating.has(taskId)) return current;
          return this.runVerificationGate(taskId, current, updates);
        }
      }
    }

    const updated = await this.repo.updateTask(taskId, {
      ...updates,
      ...(await this.leaseFieldsForInProgress(taskId, updates)),
      updatedAt: Date.now(),
    });

    // W1e: log AFTER successful update (skip on validation throw above).
    if (this.eventLogger) {
      void this.eventLogger.append({
        teamId: updated.teamId,
        eventType: 'task',
        actorSlotId: updated.owner,
        targetSlotId: updated.id,
        payload: {
          action: 'update',
          taskId: updated.id,
          status: updated.status,
        },
      });
    }

    return updated;
  }

  /**
   * P2 - lease columns to stamp when a task transitions to `in_progress`, so
   * every in_progress task carries a fresh, non-NULL lease and the Watchdog can
   * always reclaim it if the owner later dies (no NULL-lease leak, no reliance on
   * the next wake to stamp). No-op for any other transition, or when no owner can
   * be attributed. Reads the row only when the owner was not in the update.
   */
  private async leaseFieldsForInProgress(
    taskId: string,
    updates: UpdateTaskParams
  ): Promise<Partial<Pick<TeamTask, 'leaseOwner' | 'leaseExpiresAt' | 'lastHeartbeat'>>> {
    if (updates.status !== 'in_progress') return {};
    let owner = updates.owner;
    if (!owner) owner = (await this.repo.findTaskById(taskId))?.owner;
    if (!owner) return {};
    const now = Date.now();
    return { leaseOwner: owner, leaseExpiresAt: now + LEASE_TTL_MS, lastHeartbeat: now };
  }

  /**
   * P3 - route a proposed `completed` transition through the verification gate.
   *
   * 1. Persist `verifying` (so Mission Control shows the second opinion in
   *    flight) carrying any owner/description/metadata the proposal included.
   * 2. Run the gate (it always resolves - never traps a task in `verifying`).
   * 3. On `complete`: write the FINAL `completed` plus the verification record.
   *    On `reject`: write `in_progress` plus the critique (blocking mode only).
   *
   * The gate's own writes go straight to `repo.updateTask` (not back through
   * `update`), so the re-entrancy branch in `update()` is belt-and-suspenders.
   */
  private async runVerificationGate(
    taskId: string,
    current: TeamTask,
    updates: UpdateTaskParams
  ): Promise<TeamTask> {
    // The add AND the `verifying` write are inside the try so that if the
    // verifying write throws, the finally still removes taskId from `gating` -
    // otherwise the single-flight guard would silently drop all future completions.
    this.gating.add(taskId);
    try {
      const verifyingNow = Date.now();
      await this.repo.updateTask(taskId, {
        status: 'verifying',
        ...(updates.owner !== undefined ? { owner: updates.owner } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.metadata !== undefined ? { metadata: { ...current.metadata, ...updates.metadata } } : {}),
        updatedAt: verifyingNow,
      });
      this.logTaskEvent(current.teamId, current.owner, taskId, 'verifying');

      const decision = await this.verificationGate!.verify(current);
      const finalStatus: TeamTask['status'] = decision.kind === 'complete' ? 'completed' : 'in_progress';
      const now = Date.now();

      // A blocking reject sends the task back to in_progress for re-work: stamp a
      // fresh lease so the Watchdog can still reclaim it if the owner then dies.
      const leaseFields =
        finalStatus === 'in_progress' && current.owner
          ? { leaseOwner: current.owner, leaseExpiresAt: now + LEASE_TTL_MS, lastHeartbeat: now }
          : {};

      const result = await this.repo.updateTask(taskId, {
        status: finalStatus,
        ...leaseFields,
        metadata: { ...current.metadata, ...updates.metadata, verification: decision.verification },
        updatedAt: now,
      });
      this.logTaskEvent(result.teamId, result.owner, result.id, finalStatus);
      return result;
    } catch (error) {
      // The gate is throw-free, but the final write can fail (locked DB, disk).
      // Never leave the task stranded in `verifying`: best-effort revert it to a
      // live state so normal flow (or the Watchdog's verify-recovery) picks it up.
      const message = error instanceof Error ? error.message : String(error);
      const reverted = await this.repo
        .updateTask(taskId, {
          status: 'in_progress',
          metadata: {
            ...current.metadata,
            ...updates.metadata,
            verification: { outcome: 'advisory', note: `verify write failed: ${message}`, failCount: 0, checkedAt: Date.now() },
          },
          updatedAt: Date.now(),
        })
        .catch(() => current);
      this.logTaskEvent(current.teamId, current.owner, taskId, 'in_progress');
      return reverted;
    } finally {
      this.gating.delete(taskId);
    }
  }

  /** W1e - append a single `task` event when an event logger is wired. */
  private logTaskEvent(
    teamId: string,
    actorSlotId: string | undefined,
    taskId: string,
    status: TeamTask['status']
  ): void {
    if (!this.eventLogger) return;
    void this.eventLogger.append({
      teamId,
      eventType: 'task',
      actorSlotId,
      targetSlotId: taskId,
      payload: { action: 'update', taskId, status },
    });
  }

  /**
   * List all tasks for a team.
   */
  async list(teamId: string): Promise<TeamTask[]> {
    return this.repo.findTasksByTeam(teamId);
  }

  /**
   * Get tasks assigned to a specific agent.
   */
  async getByOwner(teamId: string, ownerId: string): Promise<TeamTask[]> {
    return this.repo.findTasksByOwner(teamId, ownerId);
  }

  /**
   * Check if completing a task unblocks other tasks.
   * Removes the given taskId from the `blockedBy` array of every task that
   * depends on it. Returns only those tasks whose `blockedBy` became empty
   * (i.e. tasks that are now fully unblocked).
   */
  async checkUnblocks(taskId: string): Promise<TeamTask[]> {
    // Locate the completed task to get its teamId
    const completedTask = await this.repo.findTaskById(taskId);
    if (!completedTask) return [];

    const allTasks = await this.repo.findTasksByTeam(completedTask.teamId);
    const dependents = allTasks.filter((t) => t.blockedBy.includes(taskId));

    if (dependents.length === 0) return [];

    // Atomically remove taskId from each dependent's blockedBy array
    const updated = await Promise.all(dependents.map((t) => this.repo.removeFromBlockedBy(t.id, taskId)));

    // Clear the completed task's stale blocks pointer (Bug #5)
    await this.repo.updateTask(taskId, { blocks: [], updatedAt: Date.now() });

    return updated.filter((t) => t.blockedBy.length === 0);
  }
}
