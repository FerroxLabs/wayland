// src/process/team/repository/ITeamRepository.ts
import type { MailboxMessage, TeamEvent, TeamEventType, TeamTask, TTeam } from '../types';

/** Team CRUD + cascade-delete operations */
export interface ITeamCrudRepository {
  create(team: TTeam): Promise<TTeam>;
  findById(id: string): Promise<TTeam | null>;
  findAll(userId: string): Promise<TTeam[]>;
  update(id: string, updates: Partial<TTeam>): Promise<TTeam>;
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

/** Task board persistence */
export interface ITaskRepository {
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
