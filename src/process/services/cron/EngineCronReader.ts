/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE ENGINE HAS ITS OWN SCHEDULER, AND THE USER COULD NOT SEE IT.
 *
 * Wayland has two cron stores. Desktop's `cron_propose` card writes the SQLite
 * `cron_jobs` table; the engine's own `cronjob` tool writes
 * `<engine home>/cron/jobs.json`. Which one an assistant reaches for is
 * NONDETERMINISTIC - measured: the same request produced a Desktop card in one
 * run and an engine-store write in another.
 *
 * When it lands in the engine store the assistant is telling the truth ("your
 * brief will run weekdays at 07:00") and Scheduled Tasks shows nothing, so the
 * user cannot see, trust, or disable the job they were just promised. This
 * reader closes that gap by surfacing the engine's jobs in the same list,
 * tagged `origin: 'engine'`.
 *
 * READ-ONLY BY CONSTRUCTION. Desktop does not own this file - the engine writes
 * it, and it carries an `integrity` digest Desktop cannot recompute. So these
 * jobs are surfaced for visibility and the mutating paths refuse them by id
 * rather than silently failing against a SQLite row that does not exist.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { ICronJob } from '@/common/adapter/ipcBridge';

/** Engine-origin ids are namespaced so they can never collide with a SQLite id. */
export const ENGINE_JOB_ID_PREFIX = 'engine:';

export function isEngineJobId(jobId: string): boolean {
  return jobId.startsWith(ENGINE_JOB_ID_PREFIX);
}

/** The engine's on-disk job record. Only the fields Desktop renders are typed. */
interface EngineCronRecord {
  id?: unknown;
  expression?: unknown;
  enabled?: unknown;
  created_at?: unknown;
  last_fired?: unknown;
  target?: { kind?: unknown; name?: unknown; args?: { prompt?: unknown } };
  retry_state?: { attempts?: unknown };
}

function asMs(value: unknown, fallback: number): number {
  if (typeof value !== 'string') return fallback;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Pure mapper, split from the read so it can be tested without a filesystem.
 * A malformed or partially written file must yield [] rather than throw: this
 * runs on the Scheduled Tasks list path, and a parse error there would blank
 * the user's ENTIRE task list, including their own Desktop jobs.
 */
export function mapEngineCronJobs(raw: string, now: number = Date.now()): ICronJob[] {
  let parsed: { jobs?: unknown };
  try {
    parsed = JSON.parse(raw) as { jobs?: unknown };
  } catch {
    return [];
  }
  if (!parsed || !Array.isArray(parsed.jobs)) return [];

  const out: ICronJob[] = [];
  for (const entry of parsed.jobs as EngineCronRecord[]) {
    if (!entry || typeof entry !== 'object') continue;
    const id = typeof entry.id === 'string' ? entry.id : null;
    const expr = typeof entry.expression === 'string' ? entry.expression : null;
    // Without an id there is nothing stable to address, and without an
    // expression there is no schedule to show. Skip rather than invent either.
    if (!id || !expr) continue;

    const skillName = typeof entry.target?.name === 'string' ? entry.target.name : 'scheduled task';
    const prompt = typeof entry.target?.args?.prompt === 'string' ? entry.target.args.prompt : skillName;
    const createdAt = asMs(entry.created_at, now);

    out.push({
      id: `${ENGINE_JOB_ID_PREFIX}${id}`,
      name: skillName,
      description: prompt,
      enabled: entry.enabled === true,
      origin: 'engine',
      schedule: { kind: 'cron', expr, description: expr },
      target: { payload: { kind: 'message', text: prompt }, executionMode: 'new_conversation' },
      metadata: {
        conversationId: '',
        agentType: 'wcore',
        createdBy: 'agent',
        createdAt,
        updatedAt: createdAt,
      },
      state: {
        lastRunAtMs: typeof entry.last_fired === 'string' ? asMs(entry.last_fired, 0) || undefined : undefined,
        runCount: 0,
        retryCount: typeof entry.retry_state?.attempts === 'number' ? entry.retry_state.attempts : 0,
        maxRetries: 0,
      },
    });
  }
  return out;
}

/**
 * Read the engine's cron store. Never throws: a missing file is the normal case
 * (the engine only writes it once something schedules a job).
 */
export function readEngineCronJobs(engineConfigDir: string, now: number = Date.now()): ICronJob[] {
  try {
    const file = path.join(engineConfigDir, 'cron', 'jobs.json');
    if (!fs.existsSync(file)) return [];
    return mapEngineCronJobs(fs.readFileSync(file, 'utf8'), now);
  } catch {
    return [];
  }
}
