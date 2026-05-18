// src/process/team/repository/SqliteTeamRepository.ts
import { getDatabase } from '@process/services/database';
import type { ISqliteDriver } from '@process/services/database/drivers/ISqliteDriver';
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
      `INSERT INTO teams (id, user_id, name, workspace, workspace_mode, lead_agent_id, agents, session_mode, source_launcher_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
       SET name = ?, workspace = ?, workspace_mode = ?, lead_agent_id = ?, agents = ?, session_mode = ?, source_launcher_id = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      merged.name,
      merged.workspace,
      merged.workspaceMode,
      merged.leaderAgentId,
      JSON.stringify(merged.agents),
      merged.sessionMode ?? null,
      merged.sourceLauncherId ?? null,
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
      `INSERT INTO team_tasks (id, team_id, subject, description, status, owner, blocked_by, blocks, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      task.updatedAt
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
           blocked_by = ?, blocks = ?, metadata = ?, updated_at = ?
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
  // Team event log (W1e — append-only)
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
