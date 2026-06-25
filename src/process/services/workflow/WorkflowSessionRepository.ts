/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ISqliteDriver } from '@process/services/database/drivers/ISqliteDriver';
import {
  isWorkflowInteractivity,
  isWorkflowRunMode,
  type AskRecord,
  type ResolvedSkill,
  type StepState,
  type WorkflowInteractivity,
  type WorkflowRunMode,
  type WorkflowSession,
  type WorkflowSessionStatus,
} from '@/common/types/workflowTypes';

/**
 * Partial update payload for {@link WorkflowSessionRepository.update}. Only
 * the fields explicitly present in the patch are written; everything else is
 * preserved. `updated_at` is always bumped to `Date.now()` server-side.
 */
export type WorkflowSessionPatch = Partial<{
  current_step: number;
  total_steps: number;
  steps: StepState[];
  skills: ResolvedSkill[];
  asks: AskRecord[];
  status: WorkflowSessionStatus;
  palette: string | null;
  category: string | null;
  completed_at: number | null;
  begin_sent_at: number | null;
  run_mode: WorkflowRunMode;
  interactivity: WorkflowInteractivity;
}>;

type Row = {
  id: string;
  workflow_name: string;
  workflow_title: string;
  conversation_id: string;
  current_step: number;
  total_steps: number;
  steps_json: string;
  skills_json: string;
  asks_json: string;
  status: string;
  palette: string | null;
  category: string | null;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
  begin_sent_at: number | null;
  run_mode: string;
  interactivity: string;
};

const RESUME_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const DEFAULT_ACTIVE_LIMIT = 3;

const rowToSession = (r: Row): WorkflowSession => ({
  id: r.id,
  workflow_name: r.workflow_name,
  workflow_title: r.workflow_title,
  conversation_id: r.conversation_id,
  current_step: r.current_step,
  total_steps: r.total_steps,
  steps: JSON.parse(r.steps_json) as StepState[],
  skills: JSON.parse(r.skills_json) as ResolvedSkill[],
  asks: JSON.parse(r.asks_json) as AskRecord[],
  status: r.status as WorkflowSessionStatus,
  palette: r.palette,
  category: r.category,
  created_at: r.created_at,
  updated_at: r.updated_at,
  completed_at: r.completed_at,
  begin_sent_at: r.begin_sent_at,
  // Defensive coercion: a malformed persisted value falls back to the safe
  // default rather than poisoning the run driver.
  run_mode: isWorkflowRunMode(r.run_mode) ? r.run_mode : 'running',
  interactivity: isWorkflowInteractivity(r.interactivity) ? r.interactivity : 'step',
});

/**
 * SQLite-backed data layer for workflow sessions. Round-trips
 * {@link WorkflowSession} rows to/from the `workflow_sessions` table created
 * in migration v41 (see SPEC §4.1, §10). JSON-typed columns
 * (`steps_json` / `skills_json` / `asks_json`) are (de)serialized at the
 * boundary so callers only ever see real arrays.
 *
 * Resume semantics (SPEC §10.2):
 *  - `findActiveByWorkflowName`: most-recent `active` row for a workflow
 *    within the last 14 days (the resume offer cutoff).
 *  - `findAllActive`: most-recent N active rows across all workflows,
 *    powering the right-rail "in flight" surface.
 *
 * Methods are synchronous to mirror the underlying better-sqlite3 driver.
 */
export class WorkflowSessionRepository {
  constructor(private readonly driver: ISqliteDriver) {}

  insert(session: WorkflowSession): void {
    const now = Date.now();
    const created_at = session.created_at && session.created_at > 0 ? session.created_at : now;
    const updated_at = session.updated_at && session.updated_at > 0 ? session.updated_at : now;
    this.driver
      .prepare(
        `INSERT INTO workflow_sessions (
           id, workflow_name, workflow_title, conversation_id,
           current_step, total_steps,
           steps_json, skills_json, asks_json,
           status, palette, category,
           created_at, updated_at, completed_at, begin_sent_at,
           run_mode, interactivity
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        session.id,
        session.workflow_name,
        session.workflow_title,
        session.conversation_id,
        session.current_step,
        session.total_steps,
        JSON.stringify(session.steps),
        JSON.stringify(session.skills),
        JSON.stringify(session.asks),
        session.status,
        session.palette,
        session.category,
        created_at,
        updated_at,
        session.completed_at,
        session.begin_sent_at ?? null,
        session.run_mode,
        session.interactivity
      );
  }

  findById(id: string): WorkflowSession | null {
    const row = this.driver.prepare('SELECT * FROM workflow_sessions WHERE id = ?').get(id) as Row | undefined;
    return row ? rowToSession(row) : null;
  }

  findByConversationId(conversationId: string): WorkflowSession | null {
    const row = this.driver
      .prepare('SELECT * FROM workflow_sessions WHERE conversation_id = ? LIMIT 1')
      .get(conversationId) as Row | undefined;
    return row ? rowToSession(row) : null;
  }

  /**
   * Most-recent `active` session for `workflowName` updated within the last
   * 14 days. Returns null if none qualify. Drives the
   * `findActiveByWorkflowName(workflow_name)` resume probe in SPEC §6.3.
   */
  findActiveByWorkflowName(workflowName: string): WorkflowSession | null {
    const cutoff = Date.now() - RESUME_WINDOW_MS;
    const row = this.driver
      .prepare(
        `SELECT * FROM workflow_sessions
         WHERE workflow_name = ? AND status = 'active' AND updated_at > ?
         ORDER BY updated_at DESC
         LIMIT 1`
      )
      .get(workflowName, cutoff) as Row | undefined;
    return row ? rowToSession(row) : null;
  }

  /**
   * Top-N most-recent `active` sessions across all workflows. Powers the
   * right-rail "in flight" surface and command-palette resume entries.
   */
  findAllActive(limit: number = DEFAULT_ACTIVE_LIMIT): WorkflowSession[] {
    const rows = this.driver
      .prepare(
        `SELECT * FROM workflow_sessions
         WHERE status = 'active'
         ORDER BY updated_at DESC
         LIMIT ?`
      )
      .all(limit) as Row[];
    return rows.map(rowToSession);
  }

  /**
   * Count of currently-active sessions. Lightweight COUNT(*) path for the
   * sidebar Workflows-section badge - avoids materializing full session rows
   * just to take `.length`.
   */
  countActive(): number {
    const row = this.driver
      .prepare(`SELECT COUNT(*) AS n FROM workflow_sessions WHERE status = 'active'`)
      .get() as { n: number } | undefined;
    return row?.n ?? 0;
  }

  /**
   * Partial update. Only fields present in `patch` are written;
   * `updated_at` is always bumped to `Date.now()`. Returns the resulting
   * row. Throws if `id` does not exist.
   */
  update(id: string, patch: WorkflowSessionPatch): WorkflowSession {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (patch.current_step !== undefined) {
      sets.push('current_step = ?');
      params.push(patch.current_step);
    }
    if (patch.total_steps !== undefined) {
      sets.push('total_steps = ?');
      params.push(patch.total_steps);
    }
    if (patch.steps !== undefined) {
      sets.push('steps_json = ?');
      params.push(JSON.stringify(patch.steps));
    }
    if (patch.skills !== undefined) {
      sets.push('skills_json = ?');
      params.push(JSON.stringify(patch.skills));
    }
    if (patch.asks !== undefined) {
      sets.push('asks_json = ?');
      params.push(JSON.stringify(patch.asks));
    }
    if (patch.status !== undefined) {
      sets.push('status = ?');
      params.push(patch.status);
    }
    if (patch.palette !== undefined) {
      sets.push('palette = ?');
      params.push(patch.palette);
    }
    if (patch.category !== undefined) {
      sets.push('category = ?');
      params.push(patch.category);
    }
    if (patch.completed_at !== undefined) {
      sets.push('completed_at = ?');
      params.push(patch.completed_at);
    }
    if (patch.begin_sent_at !== undefined) {
      sets.push('begin_sent_at = ?');
      params.push(patch.begin_sent_at);
    }
    if (patch.run_mode !== undefined) {
      sets.push('run_mode = ?');
      params.push(patch.run_mode);
    }
    if (patch.interactivity !== undefined) {
      sets.push('interactivity = ?');
      params.push(patch.interactivity);
    }

    // Always bump updated_at server-side.
    sets.push('updated_at = ?');
    params.push(Date.now());

    params.push(id);

    const result = this.driver.prepare(`UPDATE workflow_sessions SET ${sets.join(', ')} WHERE id = ?`).run(...params);

    if (result.changes === 0) {
      throw new Error(`WorkflowSessionRepository.update: no row with id=${id}`);
    }

    const updated = this.findById(id);
    if (!updated) {
      throw new Error(`WorkflowSessionRepository.update: row vanished after update id=${id}`);
    }
    return updated;
  }

  delete(id: string): void {
    this.driver.prepare('DELETE FROM workflow_sessions WHERE id = ?').run(id);
  }
}
