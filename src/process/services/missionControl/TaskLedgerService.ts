/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TeamSessionService } from '@process/team/TeamSessionService';
import type { TeamTask, TTeam } from '@process/team/types';
import { cronService } from '@process/services/cron/cronServiceSingleton';
import type { ICronJob } from '@/common/adapter/ipcBridge';
import type { LedgerCounts, LedgerEntry, LedgerStatus, MissionControlSnapshot } from '@/common/types/missionControl';

/**
 * Projects team tasks + cron jobs into one normalized {@link MissionControlSnapshot}.
 *
 * Strictly passive: it reads team metadata + the persisted task board (never
 * starts a session) and the cron job list. Any single source failing degrades
 * to an empty contribution rather than failing the whole snapshot, so Mission
 * Control still renders what it can.
 */
export class TaskLedgerService {
  constructor(private readonly teams: TeamSessionService) {}

  async snapshot(userId: string): Promise<MissionControlSnapshot> {
    const entries: LedgerEntry[] = [];

    for (const entry of await this.collectTeamEntries(userId)) entries.push(entry);
    for (const entry of await this.collectCronEntries()) entries.push(entry);

    entries.sort(compareEntries);
    return { generatedAt: Date.now(), entries, counts: tally(entries) };
  }

  private async collectTeamEntries(userId: string): Promise<LedgerEntry[]> {
    const teams = await this.teams.listTeams(userId).catch(() => [] as TTeam[]);
    const perTeam = await Promise.all(
      teams.map(async (team) => {
        const tasks = await this.teams.listTasksForTeam(team.id).catch(() => [] as TeamTask[]);
        return tasks.filter((task) => task.status !== 'deleted').map((task) => mapTeamTask(team, task));
      })
    );
    return perTeam.flat();
  }

  private async collectCronEntries(): Promise<LedgerEntry[]> {
    const jobs = await Promise.resolve(cronService.listJobs()).catch(() => [] as ICronJob[]);
    return jobs.map(mapCronJob);
  }
}

function mapTeamTask(team: TTeam, task: TeamTask): LedgerEntry {
  const blockedByCount = task.blockedBy?.length ?? 0;
  let status: LedgerStatus;
  if (task.status === 'in_progress') status = 'running';
  else if (task.status === 'verifying') status = 'verifying';
  else if (task.status === 'zombie') status = 'zombie';
  else if (task.status === 'failed') status = 'failed';
  else if (task.status === 'completed') status = 'done';
  else status = blockedByCount > 0 ? 'blocked' : 'pending';

  return {
    id: `team:${task.id}`,
    source: 'team',
    title: task.subject,
    status,
    owner: task.owner,
    detail: task.description,
    context: team.name,
    blockedByCount,
    lastHeartbeat: task.lastHeartbeat,
    retriesUsed: task.retriesUsed,
    retryBudget: task.retryBudget,
    // A new audit overwrites the prior verdict only once it finishes; suppress
    // the stale chip while the task sits in `verifying`.
    verdict: task.status === 'verifying' ? undefined : readVerdict(task.metadata),
    needsHuman: readNeedsHuman(task.metadata),
    startedAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

/** Reads the P3 needs-human escalation flag off task metadata. */
function readNeedsHuman(metadata: Record<string, unknown>): boolean | undefined {
  const v = metadata?.verification as { needsHuman?: unknown } | undefined;
  return v?.needsHuman === true ? true : undefined;
}

/**
 * Reads the P3 verification result off `metadata.verification`. Derived from the
 * gate's `outcome` (the applied decision), not its raw converge `verdict` string:
 * `pass` -> pass; `fail`/`needs_human` -> fail; an `advisory` record that carried
 * a FAIL verdict surfaces as fail; a clean/ skipped advisory shows nothing.
 */
function readVerdict(metadata: Record<string, unknown>): 'pass' | 'fail' | undefined {
  const v = metadata?.verification as { outcome?: unknown; verdict?: unknown } | undefined;
  if (!v) return undefined;
  if (v.outcome === 'pass') return 'pass';
  if (v.outcome === 'fail' || v.outcome === 'needs_human') return 'fail';
  if (v.outcome === 'advisory' && v.verdict === 'FAIL') return 'fail';
  return undefined;
}

function mapCronJob(job: ICronJob): LedgerEntry {
  const lastRunStatus = job.state.lastStatus;
  let status: LedgerStatus;
  if (!job.enabled) status = 'idle';
  else if (lastRunStatus === 'error' || lastRunStatus === 'missed') status = 'failed';
  else status = 'pending';

  return {
    id: `cron:${job.id}`,
    source: 'cron',
    title: job.name,
    status,
    owner: 'schedule',
    detail: job.state.lastError ?? job.description,
    context: job.metadata.conversationTitle,
    nextRunAtMs: job.state.nextRunAtMs,
    lastRunStatus,
    startedAt: job.metadata.createdAt,
    updatedAt: job.metadata.updatedAt,
  };
}

/** Active work first (running, failed, blocked, pending), then most-recently-updated. */
const STATUS_RANK: Record<LedgerStatus, number> = {
  running: 0,
  verifying: 1,
  failed: 2,
  zombie: 3,
  blocked: 4,
  pending: 5,
  idle: 6,
  done: 7,
};

function compareEntries(a: LedgerEntry, b: LedgerEntry): number {
  const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (rank !== 0) return rank;
  return b.updatedAt - a.updatedAt;
}

function tally(entries: LedgerEntry[]): LedgerCounts {
  const counts: LedgerCounts = { running: 0, verifying: 0, pending: 0, blocked: 0, failed: 0, zombie: 0, done: 0, idle: 0, total: entries.length };
  for (const e of entries) counts[e.status] += 1;
  return counts;
}
