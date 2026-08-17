/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #981 - de-duplication key for the team task board.
 *
 * A leader that retries `team_task_create` (a dropped ACP turn, a re-read of a
 * plan, a wake replay) composes a FRESH tool call rather than replaying a
 * transport frame, so it carries no idempotency key we could match on. The only
 * thing two attempts reliably share is what the task IS: team + subject + owner.
 * So uniqueness is enforced on that, in SQL, where a concurrent second attempt
 * cannot slip between a JS check and a JS write.
 *
 * The fragments live here rather than inline so the migration that CREATEs the
 * index and the repository that writes through it cannot drift: SQLite matches
 * an upsert's conflict target to a partial index by comparing the expressions,
 * so the two must be spelled identically.
 */

/**
 * Statuses a task never comes back from. Restricting the index to everything
 * else is what keeps a finished task from blocking a legitimate later one with
 * the same subject - a run that completes "write the changelog" in beat 1 must
 * still be able to open "write the changelog" again in beat 3.
 *
 * `zombie` is deliberately NOT terminal: it is a live task awaiting reclaim.
 */
export const TERMINAL_TASK_STATUSES = ['completed', 'failed', 'deleted'] as const;

/** SQL predicate selecting the non-terminal (live) rows the index covers. */
export const LIVE_TASK_PREDICATE_SQL = `status NOT IN (${TERMINAL_TASK_STATUSES.map((s) => `'${s}'`).join(', ')})`;

/**
 * Case-, whitespace- and newline-insensitive subject normalization, expressed
 * entirely in deterministic SQLite scalar functions so it can live inside an
 * expression index (SQLite refuses non-deterministic functions there, and has
 * no regex, so this is done with the classic marker-pair collapse rather than a
 * `\s+` replace):
 *
 *   1. tab / LF / CR  -> space
 *   2. every space    -> the two-char marker \x01\x02
 *   3. every \x02\x01 -> ''      (collapses any run of spaces to one marker)
 *   4. every \x01\x02 -> space
 *   5. trim + lower
 *
 * `lower()` is ASCII-only in stock SQLite, so a subject that differs only in
 * the case of a non-ASCII letter still counts as two tasks. That is a narrower
 * miss than the duplicate it prevents, and widening it would mean shipping a
 * custom collation into every connection that ever opens this file.
 */
export function normalizedSubjectSql(expr: string): string {
  const spaced = `replace(replace(replace(${expr}, char(9), ' '), char(10), ' '), char(13), ' ')`;
  const collapsed = `replace(replace(replace(${spaced}, ' ', char(1) || char(2)), char(2) || char(1), ''), char(1) || char(2), ' ')`;
  return `lower(trim(${collapsed}))`;
}

export const TASK_DEDUPE_INDEX_NAME = 'idx_team_tasks_live_dedupe';

/** The indexed key. Reused verbatim as the upsert conflict target. */
export const TASK_DEDUPE_KEY_SQL = `team_id, ${normalizedSubjectSql('subject')}, coalesce(owner, '')`;

export const CREATE_TASK_DEDUPE_INDEX_SQL =
  `CREATE UNIQUE INDEX IF NOT EXISTS ${TASK_DEDUPE_INDEX_NAME} ` +
  `ON team_tasks (${TASK_DEDUPE_KEY_SQL}) WHERE ${LIVE_TASK_PREDICATE_SQL}`;
