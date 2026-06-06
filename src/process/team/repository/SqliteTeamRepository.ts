// src/process/team/repository/SqliteTeamRepository.ts
import { getDatabase } from '@process/services/database';
import type { ISqliteDriver } from '@process/services/database/drivers/ISqliteDriver';
import { DEFAULT_RETRY_BUDGET, LEASE_TTL_MS } from '../types';
import type { MailboxMessage, TeamAgent, TeamEvent, TeamEventType, TeamTask, TTeam } from '../types';
import type { ITeamRepository } from './ITeamRepository';

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

type TeamRow = {
  id: string;
  user_id: string;
  name: string;
  workspace: string;
  workspace_mode: string;
  lead_agent_id: string;
  agents: string;
  session_mode: string | null;
  source_launcher_id: string | null;
  promoted_to_standing: number;
  session_count: number;
  first_active_at: number | null;
  imported_from: string | null;
  imported_at: number | null;
  imported_signature_status: string | null;
  import_capability_grants: string | null;
  is_sandboxed: number;
  verification_policy: string | null;
  created_at: number;
  updated_at: number;
};

type MailboxRow = {
  id: string;
  team_id: string;
  to_agent_id: string;
  from_agent_id: string;
  type: string;
  content: string;
  summary: string | null;
  files: string | null;
  read: number;
  created_at: number;
};

type TaskRow = {
  id: string;
  team_id: string;
  subject: string;
  description: string | null;
  status: string;
  owner: string | null;
  blocked_by: string;
  blocks: string;
  metadata: string;
  created_at: number;
  updated_at: number;
  lease_owner: string | null;
  lease_expires_at: number | null;
  last_heartbeat: number | null;
  retry_budget: number;
  retries_used: number;
};

type EventRow = {
  id: string;
  team_id: string;
  event_type: string;
  actor_slot_id: string | null;
  target_slot_id: string | null;
  payload: string;
  created_at: number;
};

// ---------------------------------------------------------------------------
// Row -> domain converters
// ---------------------------------------------------------------------------

function rowToTeam(row: TeamRow): TTeam {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    workspace: row.workspace,
    workspaceMode: row.workspace_mode as TTeam['workspaceMode'],
    leaderAgentId: row.lead_agent_id,
    agents: JSON.parse(row.agents) as TeamAgent[],
    sessionMode: row.session_mode ?? undefined,
    sourceLauncherId: row.source_launcher_id ?? undefined,
    promotedToStanding: row.promoted_to_standing === 1,
    sessionCount: row.session_count,
    firstActiveAt: row.first_active_at ?? undefined,
    importedFrom: row.imported_from ?? undefined,
    importedAt: row.imported_at ?? undefined,
    importedSignatureStatus: row.imported_signature_status ?? undefined,
    importCapabilityGrants: row.import_capability_grants
      ? (JSON.parse(row.import_capability_grants) as Record<string, { granted_at: number; by_user: boolean }>)
      : undefined,
    isSandboxed: row.is_sandboxed === 1,
    // P3 - NULL resolves to the `advisory` default at the gate (TeamSession),
    // so existing teams (pre-policy) record verdicts without blocking.
    verificationPolicy: (row.verification_policy as TTeam['verificationPolicy']) ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToMailbox(row: MailboxRow): MailboxMessage {
  return {
    id: row.id,
    teamId: row.team_id,
    toAgentId: row.to_agent_id,
    fromAgentId: row.from_agent_id,
    type: row.type as MailboxMessage['type'],
    content: row.content,
    summary: row.summary ?? undefined,
    files: row.files ? (JSON.parse(row.files) as string[]) : undefined,
    read: Boolean(row.read),
    createdAt: row.created_at,
  };
}

function rowToEvent(row: EventRow): TeamEvent {
  return {
    id: row.id,
    teamId: row.team_id,
    eventType: row.event_type as TeamEventType,
    actorSlotId: row.actor_slot_id ?? undefined,
    targetSlotId: row.target_slot_id ?? undefined,
    payload: JSON.parse(row.payload) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

function rowToTask(row: TaskRow): TeamTask {
  return {
    id: row.id,
    teamId: row.team_id,
    subject: row.subject,
    description: row.description ?? undefined,
    status: row.status as TeamTask['status'],
    owner: row.owner ?? undefined,
    blockedBy: JSON.parse(row.blocked_by) as string[],
    blocks: JSON.parse(row.blocks) as string[],
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    leaseOwner: row.lease_owner ?? undefined,
    leaseExpiresAt: row.lease_expires_at ?? undefined,
    lastHeartbeat: row.last_heartbeat ?? undefined,
    retryBudget: row.retry_budget,
    retriesUsed: row.retries_used,
  };
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class SqliteTeamRepository implements ITeamRepository {
  private readonly _driver: ISqliteDriver | undefined;

  /**
   * @param driver - Optional ISqliteDriver for constructor injection (e.g., tests).
   *   When omitted, the global database singleton is used via getDatabase().
   */
  constructor(driver?: ISqliteDriver) {
    this._driver = driver;
  }

  private async getDb(): Promise<ISqliteDriver> {
    if (this._driver) return this._driver;
    const aionDb = await getDatabase();
    return aionDb.getDriver();
  }

  // -------------------------------------------------------------------------
  // Team CRUD
  // -------------------------------------------------------------------------

  async create(team: TTeam): Promise<TTeam> {
    const db = await this.getDb();
    db.prepare(
      `INSERT INTO teams (
         id, user_id, name, workspace, workspace_mode, lead_agent_id, agents,
         session_mode, source_launcher_id, promoted_to_standing, session_count, first_active_at,
         imported_from, imported_at, imported_signature_status, import_capability_grants, is_sandboxed,
         verification_policy, created_at, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      team.id,
      team.userId,
      team.name,
      team.workspace,
      team.workspaceMode,
      team.leaderAgentId,
      JSON.stringify(team.agents),
      team.sessionMode ?? null,
      team.sourceLauncherId ?? null,
      team.promotedToStanding ? 1 : 0,
      team.sessionCount ?? 0,
      team.firstActiveAt ?? null,
      team.importedFrom ?? null,
      team.importedAt ?? null,
      team.importedSignatureStatus ?? null,
      team.importCapabilityGrants ? JSON.stringify(team.importCapabilityGrants) : null,
      team.isSandboxed ? 1 : 0,
      team.verificationPolicy ?? null,
      team.createdAt,
      team.updatedAt
    );
    return team;
  }

  async findById(id: string): Promise<TTeam | null> {
    const db = await this.getDb();
    const row = db.prepare('SELECT * FROM teams WHERE id = ?').get(id) as TeamRow | undefined;
    return row ? rowToTeam(row) : null;
  }

  async findAll(userId: string): Promise<TTeam[]> {
    const db = await this.getDb();
    const rows = db.prepare('SELECT * FROM teams WHERE user_id = ? ORDER BY updated_at DESC').all(userId) as TeamRow[];
    return rows.map(rowToTeam);
  }

  async update(id: string, updates: Partial<TTeam>): Promise<TTeam> {
    const current = await this.findById(id);
    if (!current) throw new Error(`Team "${id}" not found`);
    const merged: TTeam = { ...current, ...updates };
    const db = await this.getDb();
    db.prepare(
      `UPDATE teams
       SET name = ?, workspace = ?, workspace_mode = ?, lead_agent_id = ?, agents = ?,
           session_mode = ?, source_launcher_id = ?, promoted_to_standing = ?, session_count = ?, first_active_at = ?,
           imported_from = ?, imported_at = ?, imported_signature_status = ?, import_capability_grants = ?, is_sandboxed = ?,
           verification_policy = ?,
           updated_at = ?
       WHERE id = ?`
    ).run(
      merged.name,
      merged.workspace,
      merged.workspaceMode,
      merged.leaderAgentId,
      JSON.stringify(merged.agents),
      merged.sessionMode ?? null,
      merged.sourceLauncherId ?? null,
      merged.promotedToStanding ? 1 : 0,
      merged.sessionCount ?? 0,
      merged.firstActiveAt ?? null,
      merged.importedFrom ?? null,
      merged.importedAt ?? null,
      merged.importedSignatureStatus ?? null,
      merged.importCapabilityGrants ? JSON.stringify(merged.importCapabilityGrants) : null,
      merged.isSandboxed ? 1 : 0,
      merged.verificationPolicy ?? null,
      merged.updatedAt,
      id
    );
    return merged;
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    db.prepare('DELETE FROM teams WHERE id = ?').run(id);
  }

  async deleteMailboxByTeam(teamId: string): Promise<void> {
    const db = await this.getDb();
    db.prepare('DELETE FROM mailbox WHERE team_id = ?').run(teamId);
  }

  async deleteTasksByTeam(teamId: string): Promise<void> {
    const db = await this.getDb();
    db.prepare('DELETE FROM team_tasks WHERE team_id = ?').run(teamId);
  }

  // -------------------------------------------------------------------------
  // Mailbox operations
  // -------------------------------------------------------------------------

  async writeMessage(message: MailboxMessage): Promise<MailboxMessage> {
    const db = await this.getDb();
    db.prepare(
      `INSERT INTO mailbox (id, team_id, to_agent_id, from_agent_id, type, content, summary, files, read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      message.id,
      message.teamId,
      message.toAgentId,
      message.fromAgentId,
      message.type,
      message.content,
      message.summary ?? null,
      message.files ? JSON.stringify(message.files) : null,
      Number(message.read),
      message.createdAt
    );
    return message;
  }

  async readUnread(teamId: string, toAgentId: string): Promise<MailboxMessage[]> {
    const db = await this.getDb();
    const rows = db
      .prepare(
        `SELECT * FROM mailbox WHERE team_id = ? AND to_agent_id = ? AND read = 0
         ORDER BY created_at ASC`
      )
      .all(teamId, toAgentId) as MailboxRow[];
    return rows.map(rowToMailbox);
  }

  async readUnreadAndMark(teamId: string, toAgentId: string): Promise<MailboxMessage[]> {
    const db = await this.getDb();
    const rows = db.transaction(() => {
      const unread = db
        .prepare(
          `SELECT * FROM mailbox WHERE team_id = ? AND to_agent_id = ? AND read = 0
           ORDER BY created_at ASC`
        )
        .all(teamId, toAgentId) as MailboxRow[];
      if (unread.length > 0) {
        const ids = unread.map((r) => r.id);
        db.prepare(`UPDATE mailbox SET read = 1 WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids);
      }
      return unread;
    })();
    return rows.map(rowToMailbox);
  }

  async markRead(messageId: string): Promise<void> {
    const db = await this.getDb();
    db.prepare('UPDATE mailbox SET read = 1 WHERE id = ?').run(messageId);
  }

  async getMailboxHistory(teamId: string, toAgentId: string, limit = 50): Promise<MailboxMessage[]> {
    const db = await this.getDb();
    const rows = db
      .prepare(
        `SELECT * FROM mailbox WHERE team_id = ? AND to_agent_id = ?
         ORDER BY created_at DESC LIMIT ?`
      )
      .all(teamId, toAgentId, limit) as MailboxRow[];
    return rows.map(rowToMailbox);
  }

  // -------------------------------------------------------------------------
  // Task operations
  // -------------------------------------------------------------------------

  async createTask(task: TeamTask): Promise<TeamTask> {
    const db = await this.getDb();
    db.prepare(
      `INSERT INTO team_tasks (id, team_id, subject, description, status, owner, blocked_by, blocks, metadata, created_at, updated_at, lease_owner, lease_expires_at, last_heartbeat, retry_budget, retries_used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      task.id,
      task.teamId,
      task.subject,
      task.description ?? null,
      task.status,
      task.owner ?? null,
      JSON.stringify(task.blockedBy),
      JSON.stringify(task.blocks),
      JSON.stringify(task.metadata),
      task.createdAt,
      task.updatedAt,
      task.leaseOwner ?? null,
      task.leaseExpiresAt ?? null,
      task.lastHeartbeat ?? null,
      task.retryBudget ?? DEFAULT_RETRY_BUDGET,
      task.retriesUsed ?? 0
    );
    return task;
  }

  async findTaskById(id: string): Promise<TeamTask | null> {
    const db = await this.getDb();
    // Exact match first
    let row = db.prepare('SELECT * FROM team_tasks WHERE id = ?').get(id) as TaskRow | undefined;
    if (!row && id.length < 36) {
      // Support short-ID prefix match (agents receive truncated IDs)
      row = db.prepare('SELECT * FROM team_tasks WHERE id LIKE ? LIMIT 1').get(`${id}%`) as TaskRow | undefined;
    }
    return row ? rowToTask(row) : null;
  }

  async updateTask(id: string, updates: Partial<TeamTask>): Promise<TeamTask> {
    const current = await this.findTaskById(id);
    if (!current) throw new Error(`Task "${id}" not found`);
    const merged: TeamTask = { ...current, ...updates };
    const db = await this.getDb();
    db.prepare(
      `UPDATE team_tasks
       SET subject = ?, description = ?, status = ?, owner = ?,
           blocked_by = ?, blocks = ?, metadata = ?, updated_at = ?,
           lease_owner = ?, lease_expires_at = ?, last_heartbeat = ?, retry_budget = ?, retries_used = ?
       WHERE id = ?`
    ).run(
      merged.subject,
      merged.description ?? null,
      merged.status,
      merged.owner ?? null,
      JSON.stringify(merged.blockedBy),
      JSON.stringify(merged.blocks),
      JSON.stringify(merged.metadata),
      merged.updatedAt,
      merged.leaseOwner ?? null,
      merged.leaseExpiresAt ?? null,
      merged.lastHeartbeat ?? null,
      merged.retryBudget ?? DEFAULT_RETRY_BUDGET,
      merged.retriesUsed ?? 0,
      id
    );
    return merged;
  }

  async findTasksByTeam(teamId: string): Promise<TeamTask[]> {
    const db = await this.getDb();
    const rows = db
      .prepare('SELECT * FROM team_tasks WHERE team_id = ? ORDER BY created_at ASC')
      .all(teamId) as TaskRow[];
    return rows.map(rowToTask);
  }

  async findTasksByOwner(teamId: string, owner: string): Promise<TeamTask[]> {
    const db = await this.getDb();
    const rows = db
      .prepare(`SELECT * FROM team_tasks WHERE team_id = ? AND owner = ? ORDER BY created_at ASC`)
      .all(teamId, owner) as TaskRow[];
    return rows.map(rowToTask);
  }

  async findStaleLeasedTasks(now: number): Promise<TeamTask[]> {
    const db = await this.getDb();
    // Two stale shapes: (1) a stamped lease that has lapsed, and (2) a legacy /
    // pre-v45 in_progress row with NO lease whose owner appears long gone
    // (updated_at older than a full TTL) - otherwise such rows could never be
    // reclaimed and would leak forever.
    const legacyCutoff = now - LEASE_TTL_MS;
    const rows = db
      .prepare(
        `SELECT * FROM team_tasks
         WHERE status = 'in_progress'
           AND ((lease_expires_at IS NOT NULL AND lease_expires_at < ?)
                OR (lease_expires_at IS NULL AND updated_at < ?))
         ORDER BY lease_expires_at IS NULL, lease_expires_at ASC`
      )
      .all(now, legacyCutoff) as TaskRow[];
    return rows.map(rowToTask);
  }

  async renewLease(id: string, owner: string, leaseExpiresAt: number, now: number): Promise<boolean> {
    const db = await this.getDb();
    // Targeted, guarded write: only the lease columns, only while still owned +
    // in_progress. Cannot resurrect a zombie or clobber a concurrent status change.
    const info = db
      .prepare(
        `UPDATE team_tasks SET lease_owner = ?, lease_expires_at = ?, last_heartbeat = ?, updated_at = ?
         WHERE id = ? AND owner = ? AND status = 'in_progress'`
      )
      .run(owner, leaseExpiresAt, now, now, id, owner);
    return info.changes > 0;
  }

  async markZombie(id: string, now: number): Promise<boolean> {
    const db = await this.getDb();
    // Guarded CAS: only flips a task that is STILL in_progress and stale (lapsed
    // lease, or a legacy NULL-lease row untouched for a full TTL). A re-woken
    // owner / concurrent sweep / the gate having moved it on makes this a no-op
    // (changes === 0), so the same task is zombied at most once.
    const legacyCutoff = now - LEASE_TTL_MS;
    const info = db
      .prepare(
        `UPDATE team_tasks SET status = 'zombie', updated_at = ?
         WHERE id = ? AND status = 'in_progress'
           AND ((lease_expires_at IS NOT NULL AND lease_expires_at < ?)
                OR (lease_expires_at IS NULL AND updated_at < ?))`
      )
      .run(now, id, now, legacyCutoff);
    return info.changes > 0;
  }

  async findZombieTasks(): Promise<TeamTask[]> {
    const db = await this.getDb();
    const rows = db
      .prepare(`SELECT * FROM team_tasks WHERE status = 'zombie' ORDER BY updated_at ASC`)
      .all() as TaskRow[];
    return rows.map(rowToTask);
  }

  async reclaimZombie(id: string, now: number): Promise<'requeued' | 'exhausted' | 'skipped'> {
    const db = await this.getDb();
    // Whole decision in one transaction: read the PERSISTED budget, then write
    // the outcome guarded by `status='zombie'`. Increment is a SQL expression on
    // the column, never a JS snapshot, so two passes cannot double-increment.
    const run = db.transaction((): 'requeued' | 'exhausted' | 'skipped' => {
      const row = db.prepare('SELECT status, metadata, retry_budget, retries_used FROM team_tasks WHERE id = ?').get(id) as
        | Pick<TaskRow, 'status' | 'metadata' | 'retry_budget' | 'retries_used'>
        | undefined;
      if (!row || row.status !== 'zombie') return 'skipped';

      if (row.retries_used < row.retry_budget) {
        db.prepare(
          `UPDATE team_tasks
           SET status = 'pending', owner = NULL,
               lease_owner = NULL, lease_expires_at = NULL, last_heartbeat = NULL,
               retries_used = retries_used + 1, updated_at = ?
           WHERE id = ? AND status = 'zombie'`
        ).run(now, id);
        return 'requeued';
      }

      const metadata = { ...(JSON.parse(row.metadata) as Record<string, unknown>), failed: true, failureReason: 'lease exhausted' };
      // Terminal state is `failed` (NOT `deleted`): a permanently-failed task
      // must stay VISIBLE in Mission Control's attention surface, not vanish.
      db.prepare(
        `UPDATE team_tasks
         SET status = 'failed',
             lease_owner = NULL, lease_expires_at = NULL, last_heartbeat = NULL,
             metadata = ?, updated_at = ?
         WHERE id = ? AND status = 'zombie'`
      ).run(JSON.stringify(metadata), now, id);
      return 'exhausted';
    });
    return run();
  }

  async recoverVerifyingTask(id: string, metadataPatch: Record<string, unknown>, now: number): Promise<boolean> {
    const db = await this.getDb();
    // Guarded, atomic complete-through of an orphaned verifying task. Reads
    // metadata fresh inside the txn (not a stale caller snapshot) and no-ops if
    // the gate already moved the row off `verifying`.
    const run = db.transaction((): boolean => {
      const row = db.prepare('SELECT status, metadata FROM team_tasks WHERE id = ?').get(id) as
        | Pick<TaskRow, 'status' | 'metadata'>
        | undefined;
      if (!row || row.status !== 'verifying') return false;
      const metadata = { ...(JSON.parse(row.metadata) as Record<string, unknown>), ...metadataPatch };
      db.prepare(
        `UPDATE team_tasks SET status = 'completed', metadata = ?, updated_at = ?
         WHERE id = ? AND status = 'verifying'`
      ).run(JSON.stringify(metadata), now, id);
      return true;
    });
    return run();
  }

  async findStaleVerifyingTasks(now: number, staleMs: number): Promise<TeamTask[]> {
    const db = await this.getDb();
    const rows = db
      .prepare(`SELECT * FROM team_tasks WHERE status = 'verifying' AND updated_at < ? ORDER BY updated_at ASC`)
      .all(now - staleMs) as TaskRow[];
    return rows.map(rowToTask);
  }

  async deleteTask(id: string): Promise<void> {
    const db = await this.getDb();
    db.prepare('DELETE FROM team_tasks WHERE id = ?').run(id);
  }

  async appendToBlocks(taskId: string, blockId: string): Promise<void> {
    const db = await this.getDb();
    const now = Date.now();
    db.transaction(() => {
      const row = db.prepare('SELECT blocks FROM team_tasks WHERE id = ?').get(taskId) as
        | Pick<TaskRow, 'blocks'>
        | undefined;
      if (!row) return;
      const blocks = JSON.parse(row.blocks) as string[];
      if (!blocks.includes(blockId)) {
        blocks.push(blockId);
      }
      db.prepare('UPDATE team_tasks SET blocks = ?, updated_at = ? WHERE id = ?').run(
        JSON.stringify(blocks),
        now,
        taskId
      );
    })();
  }

  async removeFromBlockedBy(taskId: string, unblockedId: string): Promise<TeamTask> {
    const db = await this.getDb();
    const now = Date.now();
    const row = db.transaction(() => {
      const current = db.prepare('SELECT * FROM team_tasks WHERE id = ?').get(taskId) as TaskRow | undefined;
      if (!current) throw new Error(`Task "${taskId}" not found`);
      const blockedBy = (JSON.parse(current.blocked_by) as string[]).filter((id) => id !== unblockedId);
      db.prepare('UPDATE team_tasks SET blocked_by = ?, updated_at = ? WHERE id = ?').run(
        JSON.stringify(blockedBy),
        now,
        taskId
      );
      return { ...current, blocked_by: JSON.stringify(blockedBy), updated_at: now };
    })();
    return rowToTask(row);
  }

  // -------------------------------------------------------------------------
  // Team event log (W1e - append-only)
  // -------------------------------------------------------------------------

  async appendEvent(event: TeamEvent): Promise<void> {
    const db = await this.getDb();
    db.prepare(
      `INSERT INTO team_event_log (id, team_id, event_type, actor_slot_id, target_slot_id, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      event.id,
      event.teamId,
      event.eventType,
      event.actorSlotId ?? null,
      event.targetSlotId ?? null,
      JSON.stringify(event.payload),
      event.createdAt
    );
  }

  async listEvents(
    teamId: string,
    options: { since?: number; limit?: number; eventType?: TeamEventType } = {}
  ): Promise<TeamEvent[]> {
    const db = await this.getDb();
    const limit = options.limit ?? 100;
    const since = options.since ?? 0;

    // Build query in pieces so we can conditionally add the event_type filter.
    // The two indexes (team_id, created_at) and (team_id, event_type, created_at)
    // both cover this access path; SQLite picks whichever matches the WHERE clause.
    if (options.eventType) {
      const rows = db
        .prepare(
          `SELECT * FROM team_event_log
           WHERE team_id = ? AND event_type = ? AND created_at > ?
           ORDER BY created_at DESC LIMIT ?`
        )
        .all(teamId, options.eventType, since, limit) as EventRow[];
      return rows.map(rowToEvent);
    }

    const rows = db
      .prepare(
        `SELECT * FROM team_event_log
         WHERE team_id = ? AND created_at > ?
         ORDER BY created_at DESC LIMIT ?`
      )
      .all(teamId, since, limit) as EventRow[];
    return rows.map(rowToEvent);
  }
}
