// src/process/team/repository/ITeamRepository.ts
import type { MailboxMessage, TeamAgent, TeamEvent, TeamEventType, TeamTask, TTeam } from '../types';

/** Team CRUD + cascade-delete operations */
export interface ITeamCrudRepository {
  create(team: TTeam): Promise<TTeam>;
  findById(id: string): Promise<TTeam | null>;
  findAll(userId: string): Promise<TTeam[]>;
  update(id: string, updates: Partial<TTeam>): Promise<TTeam>;
  /**
   * #980 - atomically apply teammate STATUS changes and nothing else.
   *
   * `update` re-writes the whole row from the caller's snapshot, so it cannot be
   * used by a high-frequency status writer without losing concurrent writes.
   * This one reads, merges by slotId and writes inside a single transaction, and
   * only ever touches the `agents` and `updated_at` columns - so a concurrent
   * rename, backend swap or session-mode change survives. Unknown slotIds are
   * ignored. Returns null when the team no longer exists.
   *
   * SCOPE: status, and only status. Every OTHER roster change - spawn, rename,
   * backend swap, removal - goes through {@link ITeamCrudRepository.mutateAgents}
   * (#1057), which is the same transactional read-merge-write generalised to the
   * whole `agents` column. Between the two, no roster writer re-writes the blob
   * from a caller snapshot any more, so the lost update this method was created
   * for is closed for the system and not merely for this one writer.
   */
  updateAgentStatuses(
    id: string,
    statuses: Array<{ slotId: string; status: TeamAgent['status'] }>
  ): Promise<TTeam | null>;
  /**
   * #1057 - the field-scoped roster writer.
   *
   * Reads the LIVE `agents` blob, hands it to `mutate`, and writes the result
   * back inside ONE transaction, touching only the `agents` and `updated_at`
   * columns. `update` cannot do this: it re-writes every column from a
   * `{...current, ...updates}` merge, so a caller that only wanted to add,
   * rename, retype or drop one slot still stamps `name`, `workspace`,
   * `session_mode` and - critically - every teammate's `status` from ITS
   * snapshot. `TeammateManager.setStatus` persists on every transition, so a
   * status committed between the caller's read and its write was reverted. The
   * stale value then met `reconcilePersistedStatuses` on the next session load
   * and became `pending`: a wrong right-rail dot for a member that is actually
   * idle, plus a full role prompt re-sent on its next wake. A clobbered `failed`
   * lost the durable failure record outright.
   *
   * `mutate` MUST derive its result from the roster it is HANDED, never from a
   * snapshot captured earlier - that is the whole point. Returning the same
   * array, or `null`, writes nothing.
   *
   * Returns the committed team, or `null` when the team no longer exists.
   */
  mutateAgents(id: string, mutate: (agents: TeamAgent[]) => TeamAgent[] | null): Promise<TTeam | null>;
  delete(id: string): Promise<void>;
  deleteMailboxByTeam(teamId: string): Promise<void>;
  deleteTasksByTeam(teamId: string): Promise<void>;
}

/** Mailbox message persistence */
export interface IMailboxRepository {
  writeMessage(message: MailboxMessage): Promise<MailboxMessage>;
  readUnread(teamId: string, toAgentId: string): Promise<MailboxMessage[]>;
  /** Atomically read all unread messages and mark them as read in one transaction. */
  readUnreadAndMark(teamId: string, toAgentId: string): Promise<MailboxMessage[]>;
  markRead(messageId: string): Promise<void>;
  getMailboxHistory(teamId: string, toAgentId: string, limit?: number): Promise<MailboxMessage[]>;
}

/**
 * #981 - raised by `createTask` when the insert collapsed onto a task that is
 * already live for the same (team, normalized subject, owner). Carries the row
 * that survived so the caller can hand it straight back to whoever asked.
 *
 * Thrown rather than returned so the "a task was created" return type stays
 * honest: on this path nothing was written.
 */
export class TeamTaskDuplicateError extends Error {
  readonly code = 'TEAM_TASK_DUPLICATE';

  constructor(readonly existing: TeamTask) {
    super(`A live task with subject "${existing.subject}" already exists on this team (${existing.id}).`);
    this.name = 'TeamTaskDuplicateError';
  }
}

/** Task board persistence */
export interface ITaskRepository {
  /**
   * Insert a task.
   *
   * @throws {TeamTaskDuplicateError} when a live task already covers the same
   *   (team, normalized subject, owner) - nothing is written in that case.
   */
  createTask(task: TeamTask): Promise<TeamTask>;
  findTaskById(id: string): Promise<TeamTask | null>;
  updateTask(id: string, updates: Partial<TeamTask>): Promise<TeamTask>;
  findTasksByTeam(teamId: string): Promise<TeamTask[]>;
  findTasksByOwner(teamId: string, owner: string): Promise<TeamTask[]>;
  /**
   * P2 - cross-team sweep source for the Watchdog. Returns `in_progress` tasks
   * whose lease has fully lapsed (`lease_expires_at` is set and `< now`). Tasks
   * without a lease, or already moved off `in_progress`, are never returned.
   */
  findStaleLeasedTasks(now: number): Promise<TeamTask[]>;
  /**
   * P2 - targeted, guarded lease renew. Updates ONLY the lease columns and ONLY
   * when the task is still `in_progress` and owned by `owner`. Avoids the
   * full-row read-merge-write of `updateTask` so a renew can never resurrect a
   * `zombie` row or clobber a concurrent status/metadata change. Returns true
   * when a row was actually renewed.
   */
  renewLease(id: string, owner: string, leaseExpiresAt: number, now: number): Promise<boolean>;
  /**
   * P2 - atomically flip ONE lapsed-lease task from `in_progress` to `zombie`.
   * The write is guarded (`WHERE id=? AND status='in_progress' AND lease_expires_at < ?`)
   * so a task already moved off `in_progress` (a re-woken owner, a concurrent
   * sweep, the gate) is left untouched. Returns true only when this call is the
   * one that performed the flip - which is what makes detection idempotent and
   * dedupes the `zombie` event across sweeps.
   */
  markZombie(id: string, now: number): Promise<boolean>;
  /** P2 - tasks currently parked in `zombie` (detected dead, awaiting reclaim). */
  findZombieTasks(): Promise<TeamTask[]>;
  /**
   * P2 - atomically reclaim ONE `zombie` task. In a single transaction, guarded
   * by `WHERE status='zombie'`, it either re-queues to `pending` (incrementing
   * `retries_used` via SQL, clearing the lease) while `retries_used < retry_budget`,
   * or terminates to `deleted` (with a `failed`/`failureReason` metadata stamp)
   * once the budget is spent. The budget compare + increment read the PERSISTED
   * row, never a caller snapshot, so concurrent sweeps cannot double-increment.
   * Returns the outcome, or `skipped` when the row is no longer `zombie`.
   */
  reclaimZombie(id: string, now: number): Promise<'requeued' | 'exhausted' | 'skipped'>;
  /**
   * P3 - recovery source for tasks orphaned mid-verification. Returns tasks in
   * `verifying` whose `updated_at` is older than `now - staleMs` (the gate or the
   * whole process died after the `verifying` write but before the final write).
   * `verifying` carries no lease, so staleness is judged on `updated_at` age.
   */
  findStaleVerifyingTasks(now: number, staleMs: number): Promise<TeamTask[]>;
  /**
   * P3 - atomically complete-through ONE orphaned `verifying` task, guarded by
   * `WHERE status='verifying'` so it no-ops if the gate already moved the row.
   * Merges `metadataPatch` onto the persisted metadata read inside the txn (not
   * a caller snapshot). Returns true when a row was completed.
   */
  recoverVerifyingTask(id: string, metadataPatch: Record<string, unknown>, now: number): Promise<boolean>;
  deleteTask(id: string): Promise<void>;
  /** Atomically append a single ID to a task's `blocks` JSON array. */
  appendToBlocks(taskId: string, blockId: string): Promise<void>;
  /** Atomically remove a single ID from a task's `blockedBy` JSON array and return the updated task. */
  removeFromBlockedBy(taskId: string, unblockedId: string): Promise<TeamTask>;
}

/** Append-only team event log persistence (W1e) */
export interface ITeamEventRepository {
  /** Persist a single event row. Append-only - no update or delete API. */
  appendEvent(event: TeamEvent): Promise<void>;
  /**
   * List events for a team, newest first.
   * @param since   When provided, returns only events strictly newer than this `createdAt` (ms epoch).
   * @param limit   When provided, caps the result set (default 100).
   * @param eventType Optional filter for a single event type (used by the W2d cost meter).
   */
  listEvents(
    teamId: string,
    options?: { since?: number; limit?: number; eventType?: TeamEventType }
  ): Promise<TeamEvent[]>;
}

/**
 * Combined repository interface for backward compatibility.
 * New code should prefer the focused sub-interfaces above.
 */
export type ITeamRepository = ITeamCrudRepository & IMailboxRepository & ITaskRepository & ITeamEventRepository;
