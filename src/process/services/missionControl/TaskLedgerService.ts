/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TeamSessionService } from '@process/team/TeamSessionService';
import type { TeamTask, TTeam } from '@process/team/types';
import { cronService } from '@process/services/cron/cronServiceSingleton';
import type { ICronJob } from '@/common/adapter/ipcBridge';
import type { WorkflowSession } from '@/common/types/workflowTypes';
import type {
  ActivityGroup,
  ActivityGroupCounts,
  ActivityObservation,
  ActivitySourceHealth,
  LedgerCounts,
  LedgerEntry,
  LedgerSource,
  LedgerStatus,
  MissionControlSnapshot,
  ScheduleRunRecord,
} from '@/common/types/missionControl';

export type TaskLedgerSources = {
  listScheduleRuns?: (jobs: readonly ICronJob[]) => Promise<TaskLedgerScheduleRead>;
  listDesktopWorkflows?: () => Promise<WorkflowSession[]>;
  /** Canonical Core projector. Empty is valid; absence is reported as unavailable. */
  listCoreActivity?: () => Promise<TaskLedgerSourceRead>;
  /** Pending approvals only. Resolved approvals belong in Recent runtime activity. */
  listPendingApprovals?: () => Promise<TaskLedgerSourceRead>;
};

export type TaskLedgerScheduleRead = {
  runs: ScheduleRunRecord[];
  status?: 'ok' | 'partial';
  detail?: string;
};

export type TaskLedgerSourceRead = {
  observations: ActivityObservation[];
  /** `partial` is required when the producer cannot observe the full declared source. */
  status?: 'ok' | 'partial';
  detail?: string;
};

type SourceResult = { entries: LedgerEntry[]; health: ActivitySourceHealth };

export class TaskLedgerService {
  constructor(
    private readonly teams: TeamSessionService,
    private readonly sources: TaskLedgerSources = {}
  ) {}

  async snapshot(userId: string): Promise<MissionControlSnapshot> {
    const results = await Promise.all([
      this.collectTeamEntries(userId),
      this.collectCronEntries(),
      this.collectDesktopWorkflowEntries(),
      this.collectExternal('core-execution', this.sources.listCoreActivity),
      this.collectExternal('approvals', this.sources.listPendingApprovals),
    ]);
    const entries = results.flatMap((result) => result.entries);
    entries.sort(compareEntries);
    const sourceHealth = results.map((result) => result.health);
    const usableSources = sourceHealth.filter((health) => health.status === 'ok' || health.status === 'partial').length;
    const degraded = sourceHealth.some((health) => health.status !== 'ok');
    return {
      generatedAt: Date.now(),
      entries,
      counts: tally(entries),
      groupCounts: tallyGroups(entries),
      sourceHealth,
      completeness: usableSources === 0 ? 'unavailable' : degraded ? 'partial' : 'complete',
    };
  }

  private async collectTeamEntries(userId: string): Promise<SourceResult> {
    const observedAt = Date.now();
    let teams: TTeam[];
    try {
      teams = await this.teams.listTeams(userId);
    } catch (error) {
      return failedSource('desktop-teams', observedAt, error);
    }

    const settled = await Promise.allSettled(teams.map((team) => this.teams.listTasksForTeam(team.id)));
    const entries: LedgerEntry[] = [];
    let failures = 0;
    settled.forEach((result, index) => {
      if (result.status === 'rejected') {
        failures += 1;
        return;
      }
      const team = teams[index];
      entries.push(
        ...result.value.filter((task) => task.status !== 'deleted').map((task) => normalize(mapTeamTask(team, task)))
      );
    });
    return {
      entries,
      health: {
        source: 'desktop-teams',
        status: failures > 0 ? 'partial' : 'ok',
        observedAt,
        ...(failures > 0 ? { detail: `${failures}/${teams.length} team task boards unavailable` } : {}),
      },
    };
  }

  private async collectCronEntries(): Promise<SourceResult> {
    const observedAt = Date.now();
    try {
      const jobs = await Promise.resolve(cronService.listJobs());
      const definitions = jobs.map(mapCronDefinition);
      let runs: ScheduleRunRecord[];
      let sourceStatus: 'ok' | 'partial' = 'ok';
      let sourceDetail: string | undefined;
      if (this.sources.listScheduleRuns) {
        try {
          const read = await this.sources.listScheduleRuns(jobs);
          runs = read.runs;
          sourceStatus = read.status ?? 'ok';
          sourceDetail = read.detail;
        } catch (error) {
          runs = jobs.flatMap(fallbackScheduleRun);
          sourceStatus = 'partial';
          sourceDetail = `run evidence unavailable: ${error instanceof Error ? error.message : 'projection failed'}`;
        }
      } else {
        runs = jobs.flatMap(fallbackScheduleRun);
        if (runs.length > 0) {
          sourceStatus = 'partial';
          sourceDetail = 'run evidence projector is not initialized';
        }
      }
      const incomplete = runs.filter(
        (run) =>
          run.outcome.status !== 'available' || run.result.status !== 'available' || run.receipt.status !== 'verified'
      ).length;
      if (incomplete > 0) {
        sourceStatus = 'partial';
        sourceDetail ??= `${incomplete}/${runs.length} scheduled runs have partial or unavailable evidence`;
      }
      return {
        entries: [...definitions, ...runs.map(mapScheduleRun)],
        health: {
          source: 'scheduler',
          status: sourceStatus,
          observedAt,
          ...(sourceDetail ? { detail: sourceDetail } : {}),
        },
      };
    } catch (error) {
      return failedSource('scheduler', observedAt, error);
    }
  }

  private async collectDesktopWorkflowEntries(): Promise<SourceResult> {
    const observedAt = Date.now();
    if (!this.sources.listDesktopWorkflows) {
      return unavailableSource('desktop-workflows', observedAt, 'workflow projector is not initialized');
    }
    try {
      const sessions = await this.sources.listDesktopWorkflows();
      return {
        entries: sessions.map((session) => normalize(mapDesktopWorkflow(session))),
        health: { source: 'desktop-workflows', status: 'ok', observedAt },
      };
    } catch (error) {
      return failedSource('desktop-workflows', observedAt, error);
    }
  }

  private async collectExternal(
    source: 'core-execution' | 'approvals',
    reader: (() => Promise<TaskLedgerSourceRead>) | undefined
  ): Promise<SourceResult> {
    const observedAt = Date.now();
    if (!reader) return unavailableSource(source, observedAt, `${source} projector is not initialized`);
    try {
      const result = await reader();
      return {
        entries: result.observations.map(normalize),
        health: {
          source,
          status: result.status ?? 'ok',
          observedAt,
          ...(result.detail ? { detail: result.detail } : {}),
        },
      };
    } catch (error) {
      return failedSource(source, observedAt, error);
    }
  }
}

function normalize(observation: ActivityObservation): LedgerEntry {
  const { origin, kind } = observation.provenance;
  return {
    ...observation,
    id: `${origin}:${kind}:${observation.sourceId}`,
    source: sourceFor(observation.provenance),
    group: classify(observation),
  };
}

function sourceFor(provenance: ActivityObservation['provenance']): LedgerSource {
  if (provenance.kind === 'approval') return 'approvals';
  if (provenance.origin === 'core') return 'core-execution';
  if (provenance.kind === 'team') return 'desktop-teams';
  if (provenance.kind === 'workflow') return 'desktop-workflows';
  return 'scheduler';
}

/** Human-priority classification. It never promotes unknown state to active progress. */
export function classify(observation: ActivityObservation): ActivityGroup {
  if (
    observation.needsHuman ||
    observation.provenance.kind === 'approval' ||
    ['blocked', 'failed', 'zombie'].includes(observation.status)
  ) {
    return 'needs-you';
  }
  if (observation.status === 'running' || observation.status === 'verifying') return 'running';
  if (observation.status === 'pending' && observation.nextRunAtMs !== undefined) return 'upcoming';
  return 'recent';
}

function mapTeamTask(team: TTeam, task: TeamTask): ActivityObservation {
  const blockedByCount = task.blockedBy?.length ?? 0;
  let status: LedgerStatus;
  if (task.status === 'in_progress') status = 'running';
  else if (task.status === 'verifying') status = 'verifying';
  else if (task.status === 'zombie') status = 'zombie';
  else if (task.status === 'failed') status = 'failed';
  else if (task.status === 'completed') status = 'done';
  else status = blockedByCount > 0 ? 'blocked' : 'pending';
  return {
    sourceId: task.id,
    provenance: { origin: 'desktop', kind: 'team' },
    title: task.subject,
    status,
    action: { kind: 'navigate', path: `/team/${team.id}`, label: 'Open team' },
    owner: task.owner,
    detail: task.description,
    context: team.name,
    blockedByCount,
    lastHeartbeat: task.lastHeartbeat,
    retriesUsed: task.retriesUsed,
    retryBudget: task.retryBudget,
    verdict: task.status === 'verifying' ? undefined : readVerdict(task.metadata),
    needsHuman: readNeedsHuman(task.metadata),
    startedAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function readNeedsHuman(metadata: Record<string, unknown>): boolean | undefined {
  const v = metadata?.verification as { needsHuman?: unknown } | undefined;
  return v?.needsHuman === true ? true : undefined;
}

function readVerdict(metadata: Record<string, unknown>): 'pass' | 'fail' | undefined {
  const v = metadata?.verification as { outcome?: unknown; verdict?: unknown } | undefined;
  if (!v) return undefined;
  if (v.outcome === 'pass') return 'pass';
  if (v.outcome === 'fail' || v.outcome === 'needs_human') return 'fail';
  if (v.outcome === 'advisory' && v.verdict === 'FAIL') return 'fail';
  return undefined;
}

function mapCronDefinition(job: ICronJob): LedgerEntry {
  return normalize({
    sourceId: job.id,
    provenance: { origin: 'desktop', kind: 'schedule' },
    title: job.name,
    status: job.enabled ? 'pending' : 'idle',
    action: { kind: 'navigate', path: `/scheduled/${job.id}`, label: 'Open schedule' },
    owner: 'schedule',
    detail: job.description,
    context: job.metadata.conversationTitle,
    nextRunAtMs: job.state.nextRunAtMs,
    startedAt: job.metadata.createdAt,
    updatedAt: job.metadata.updatedAt,
  });
}

function fallbackScheduleRun(job: ICronJob): ScheduleRunRecord[] {
  if (job.state.lastRunAtMs === undefined) return [];
  return [
    {
      jobId: job.id,
      runId: `${job.id}:${job.state.lastRunAtMs}`,
      title: `${job.name} run`,
      triggeredAt: job.state.lastRunAtMs,
      outcome: job.state.lastStatus
        ? { status: 'available', value: job.state.lastStatus, source: 'scheduler-state' }
        : { status: 'unavailable', reason: 'scheduler outcome is missing' },
      result: { status: 'unavailable', reason: 'no persisted result is correlated to this run' },
      receipt: { status: 'unavailable', reason: 'no accepted receipt is correlated to this run' },
      action: { kind: 'navigate', path: `/scheduled/${job.id}`, label: 'Open scheduled job' },
    },
  ];
}

function mapScheduleRun(run: ScheduleRunRecord): LedgerEntry {
  const outcome = run.outcome.status === 'available' ? run.outcome.value : undefined;
  const failed = outcome === 'error' || outcome === 'missed';
  const completed = outcome === 'ok';
  return normalize({
    sourceId: run.runId,
    provenance: { origin: 'desktop', kind: 'schedule-run' },
    title: run.title,
    status: failed ? 'failed' : completed ? 'done' : 'unknown',
    action: run.action,
    owner: 'schedule',
    detail: run.result.status === 'available' ? run.result.summary : run.result.reason,
    context:
      run.receipt.status === 'verified'
        ? `Receipt ${run.receipt.receiptId}`
        : run.receipt.status === 'partial'
          ? 'Receipt partial'
          : 'Receipt unavailable',
    lastRunStatus: outcome,
    scheduleRun: { outcome: run.outcome, result: run.result, receipt: run.receipt },
    startedAt: run.triggeredAt,
    updatedAt: run.triggeredAt,
  });
}

function mapDesktopWorkflow(session: WorkflowSession): ActivityObservation {
  const needsInput = session.run_mode === 'awaiting_input';
  const status: LedgerStatus =
    session.status === 'errored'
      ? 'failed'
      : session.status === 'complete' || session.status === 'ended' || session.run_mode === 'done'
        ? 'done'
        : session.run_mode === 'running'
          ? 'running'
          : session.run_mode === 'paused' || needsInput
            ? 'blocked'
            : 'unknown';
  return {
    sourceId: session.id,
    provenance: { origin: 'desktop', kind: 'workflow' },
    title: session.workflow_title,
    status,
    action: { kind: 'navigate', path: `/conversation/${session.conversation_id}`, label: 'Open workflow' },
    context: `${session.current_step}/${session.total_steps} steps`,
    needsHuman: needsInput || undefined,
    startedAt: session.created_at,
    updatedAt: session.updated_at,
  };
}

function failedSource(source: LedgerSource, observedAt: number, error: unknown): SourceResult {
  return {
    entries: [],
    health: { source, status: 'error', observedAt, detail: error instanceof Error ? error.message : 'source failed' },
  };
}

function unavailableSource(source: LedgerSource, observedAt: number, detail: string): SourceResult {
  return { entries: [], health: { source, status: 'unavailable', observedAt, detail } };
}

const GROUP_RANK: Record<ActivityGroup, number> = { 'needs-you': 0, running: 1, upcoming: 2, recent: 3 };

function compareEntries(a: LedgerEntry, b: LedgerEntry): number {
  const groupRank = GROUP_RANK[a.group] - GROUP_RANK[b.group];
  if (groupRank !== 0) return groupRank;
  if (a.group === 'upcoming')
    return (a.nextRunAtMs ?? Number.MAX_SAFE_INTEGER) - (b.nextRunAtMs ?? Number.MAX_SAFE_INTEGER);
  const time = b.updatedAt - a.updatedAt;
  return time !== 0 ? time : a.id.localeCompare(b.id);
}

export function emptyCounts(): LedgerCounts {
  return {
    running: 0,
    verifying: 0,
    pending: 0,
    blocked: 0,
    done: 0,
    failed: 0,
    zombie: 0,
    idle: 0,
    unknown: 0,
    total: 0,
  };
}

function tally(entries: LedgerEntry[]): LedgerCounts {
  const counts = emptyCounts();
  counts.total = entries.length;
  for (const entry of entries) counts[entry.status] += 1;
  return counts;
}

function tallyGroups(entries: LedgerEntry[]): ActivityGroupCounts {
  const counts: ActivityGroupCounts = { 'needs-you': 0, running: 0, upcoming: 0, recent: 0 };
  for (const entry of entries) counts[entry.group] += 1;
  return counts;
}
