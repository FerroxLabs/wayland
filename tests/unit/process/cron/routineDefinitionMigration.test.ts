/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE INSTALL THAT ALREADY EXISTS.
 *
 * Everything the milestone fixed about a bundled routine - the input paths that
 * were repointed out of `~/wayland/outbox/` and into the task's own series, the
 * prompt that now names a write destination, the `artifactSeries` tag that
 * decides which folder a run publishes into - is applied by the SEEDER, and the
 * seeder is first-write-wins. So a fresh install gets all of it and an existing
 * install gets none of it, silently, forever.
 *
 * Each test below first asserts the BROKEN state on a job built exactly the way
 * the shipped seeder built it before this change, so the assertion that follows
 * the migration is measuring a real move and not a tautology. The legacy prompt
 * is assembled from the input values recorded in commit a54d512c9, not invented.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@process/services/i18n', () => ({
  default: { t: vi.fn((key: string) => key) },
  i18nReady: Promise.resolve(),
}));
vi.mock('croner', () => ({
  Cron: class {
    stop() {}
    nextRun() {
      return null;
    }
  },
}));
// Only `power` is stubbed: CronService's power blocker is the one platform
// call that would reach Electron here. Everything else uses the real Node
// platform services, so no path helper is a hand-written half of the interface.
vi.mock('@/common/platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/common/platform')>();
  const real = actual.getPlatformServices();
  return {
    ...actual,
    getPlatformServices: () => ({ ...real, power: { preventSleep: () => 1, allowSleep: () => {} } }),
  };
});
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn() }));
vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/mock/appPath', getPath: () => '/mock/documents' },
  ipcMain: { handle: vi.fn(), on: vi.fn(), removeHandler: vi.fn() },
  powerMonitor: { on: vi.fn() },
}));

/**
 * Allocation is the ONE side effect this migration must never have: it runs on
 * every boot, and a folder per forgotten routine in the user's Documents is a
 * sweep. Spying rather than stubbing, so "it was never called" is an assertion.
 */
const allocateWorkspace = vi.hoisted(() =>
  vi.fn(async () => ({ dir: '/mock/documents/Wayland/Tasks/X', marker: null }))
);
vi.mock('@process/services/projectWorkspace', () => ({ allocateWorkspace }));

import { readFileSync } from 'fs';
import path from 'path';

import { CronService } from '@process/services/cron/CronService';
import type { CronJob } from '@process/services/cron/CronStore';
import type { ICronRepository } from '@process/services/cron/ICronRepository';
import type { ICronEventEmitter } from '@process/services/cron/ICronEventEmitter';
import type { ICronJobExecutor } from '@process/services/cron/ICronJobExecutor';
import type { IConversationRepository } from '@process/services/database/IConversationRepository';
import { artifactSeriesForJob } from '@process/services/cron/durableTaskWorkspace';
import {
  buildRoutinePrompt,
  LEGACY_ROUTINE_OUTPUT_DIR_SENTENCE,
  ROUTINE_NO_ATTACHMENT_SENTENCE,
  ROUTINE_OUTPUT_DIR_SENTENCE,
  type RoutineDef,
} from '@process/services/cron/BuiltinRoutinesSeeder';
import {
  PROMPT_BACKUP_KEY,
  isSeederGeneratedPrompt,
  migrateSeededRoutines,
} from '@process/services/cron/routineDefinitionMigration';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const ROUTINES = JSON.parse(
  readFileSync(path.join(REPO_ROOT, 'src/process/resources/bundled-workflows/routines.json'), 'utf-8')
) as RoutineDef[];

function routine(id: string): RoutineDef {
  const found = ROUTINES.find((r) => r.id === id);
  if (!found) throw new Error(`routines.json no longer declares ${id}`);
  return found;
}

/** The prompt shape the seeder emitted before this change, for arbitrary inputs. */
function legacyPrompt(workflow: string, inputs: Record<string, string>): string {
  const lines = Object.entries(inputs).map(([k, v]) => `- ${k}: ${v}`);
  return [
    `Run the "${workflow}" workflow now as a scheduled, unattended routine.`,
    `Inputs:\n${lines.join('\n')}`,
    ROUTINE_NO_ATTACHMENT_SENTENCE,
  ].join('\n');
}

/**
 * A routine as an install seeded months ago holds it: no `artifactSeries`, and
 * a prompt carrying the input values of the day.
 */
function legacyJob(over: {
  id: string;
  routineId: string;
  workflow: string;
  inputs: Record<string, string>;
  enabled?: boolean;
  prompt?: string;
  configOptions?: Record<string, string>;
}): CronJob {
  return {
    id: over.id,
    name: over.routineId,
    enabled: over.enabled ?? false,
    schedule: { kind: 'cron', expr: '0 7 * * *', description: '0 7 * * *' },
    target: {
      payload: { kind: 'message', text: over.prompt ?? legacyPrompt(over.workflow, over.inputs) },
      executionMode: 'new_conversation',
    },
    metadata: {
      conversationId: '',
      conversationTitle: over.routineId,
      agentType: 'wcore' as CronJob['metadata']['agentType'],
      createdBy: 'agent',
      createdAt: 1000,
      updatedAt: 1000,
      agentConfig: {
        backend: 'wcore' as CronJob['metadata']['agentType'],
        name: over.routineId,
        mode: 'bypassPermissions',
        configOptions: over.configOptions ?? { kind: 'routine', routineId: over.routineId },
      },
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3 },
  };
}

function makeService(jobs: CronJob[]) {
  const repo = {
    insert: vi.fn(async () => {}),
    update: vi.fn(async (jobId: string, updates: Partial<CronJob>) => {
      const idx = jobs.findIndex((j) => j.id === jobId);
      if (idx >= 0) jobs[idx] = { ...jobs[idx], ...updates };
    }),
    delete: vi.fn(async () => {}),
    getById: vi.fn(async (id: string) => jobs.find((j) => j.id === id) ?? null),
    listAll: vi.fn(async () => jobs),
    listEnabled: vi.fn(async () => jobs.filter((j) => j.enabled)),
    listByConversation: vi.fn(async () => []),
    deleteByConversation: vi.fn(async () => 0),
  } as unknown as ICronRepository;

  return new CronService(
    repo,
    {
      emitJobCreated: vi.fn(),
      emitJobUpdated: vi.fn(),
      emitJobRemoved: vi.fn(),
      emitJobExecuted: vi.fn(),
      showNotification: vi.fn(async () => {}),
    } as unknown as ICronEventEmitter,
    {
      isConversationBusy: vi.fn(() => false),
      executeJob: vi.fn(async () => {}),
      onceIdle: vi.fn(),
      setProcessing: vi.fn(),
    } as unknown as ICronJobExecutor,
    {
      getConversation: vi.fn(async () => undefined),
      updateConversation: vi.fn(),
      getConversationsByCronJob: vi.fn(async () => []),
    } as unknown as IConversationRepository
  );
}

describe('an already-seeded routine is brought up to the shipped definition', () => {
  beforeEach(() => {
    allocateWorkspace.mockClear();
  });

  it('repoints a prior-run input that still names ~/wayland/outbox, which nothing ever writes', async () => {
    const def = routine('friday-weekly-review');
    // The value shipped before commit a54d512c9.
    const jobs = [
      legacyJob({
        id: 'cron_9f3a',
        routineId: 'friday-weekly-review',
        workflow: def.workflow,
        inputs: {
          data_dirs: def.inputs!.data_dirs,
          prior_review_path: '~/wayland/outbox/ops/last-weekly-review.md',
        },
      }),
    ];

    // Broken today: the prompt sends the agent to a directory no code writes.
    expect(jobs[0].target.payload.text).toContain('~/wayland/outbox/ops/last-weekly-review.md');

    const migrated = await migrateSeededRoutines(makeService(jobs), ROUTINES);

    expect(migrated).toEqual([
      { jobId: 'cron_9f3a', routineId: 'friday-weekly-review', changes: ['series', 'prompt'] },
    ]);
    expect(jobs[0].target.payload.text).toContain('- prior_review_path: artifacts/ops/last-weekly-review.md');
    expect(jobs[0].target.payload.text).not.toContain('outbox');
  });

  it('repoints the morning report off a watchlist path that has never existed on any machine', async () => {
    // `~/wayland/market/watchlist.csv` was never written by anything. Step 2
    // exported it as MARKET_OPEN_REPORT_LIST, which OVERRODE the watchlist the
    // scanner actually ships with - turning a run that would have worked into
    // an ENOENT stack trace. The 2026-08-20 routine migration repointed four
    // other routines' `~/wayland/...` inputs and missed this one.
    const def = routine('weekday-morning-report');
    const jobs = [
      legacyJob({
        id: 'cron_4d3c2198',
        routineId: 'weekday-morning-report',
        workflow: def.workflow,
        // The values shipped before this change, verbatim.
        inputs: {
          watchlist_path: '~/wayland/market/watchlist.csv',
          positions_path: '~/wayland/market/positions.csv',
          output_dir: 'artifacts/market/',
        },
      }),
    ];
    // THE BROKEN STATE, asserted first so the move below is real.
    expect(jobs[0].target.payload.text).toContain('~/wayland/market/watchlist.csv');

    const service = makeService(jobs);
    const migrated = await migrateSeededRoutines(service, ROUTINES);

    expect(migrated.map((m) => m.routineId)).toContain('weekday-morning-report');
    expect(jobs[0].target.payload.text).not.toContain('~/wayland/market/');
    expect(jobs[0].target.payload.text).not.toContain('watchlist_path');
    expect(jobs[0].target.payload.text).not.toContain('positions_path');
    // The one input that survives still names the series the run publishes into.
    expect(jobs[0].target.payload.text).toContain('- output_dir: artifacts/market/');
    // ...and the original is recoverable from the job itself.
    expect(jobs[0].metadata.agentConfig!.configOptions![PROMPT_BACKUP_KEY]).toContain('~/wayland/market/');
  });

  it('still recognises a prompt carrying the RETIRED output-directory sentence', async () => {
    // This is the exact prompt shape on Sean's machine: seeded by the shipped
    // build, so it carries the "read WAYLAND_OUTPUT_DIR" sentence AND the two
    // retired inputs. Retire that sentence out of ROUTINE_GENERATED_SENTENCES
    // and this prompt stops parsing as seeder output, so the migration refuses
    // to touch the one row it exists to repair - silently, on every boot.
    const def = routine('weekday-morning-report');
    const shipped = [
      `Run the "${def.workflow}" workflow now as a scheduled, unattended routine.`,
      'Inputs:\n- watchlist_path: ~/wayland/market/watchlist.csv\n- positions_path: ~/wayland/market/positions.csv\n- output_dir: artifacts/market/',
      LEGACY_ROUTINE_OUTPUT_DIR_SENTENCE,
      ROUTINE_NO_ATTACHMENT_SENTENCE,
    ].join('\n');

    expect(isSeederGeneratedPrompt(shipped, def)).toBe(true);

    const jobs = [
      legacyJob({
        id: 'cron_4d3c2198',
        routineId: def.id,
        workflow: def.workflow,
        inputs: def.inputs!,
        prompt: shipped,
      }),
    ];
    const migrated = await migrateSeededRoutines(makeService(jobs), ROUTINES);
    expect(migrated.map((m) => m.routineId)).toContain(def.id);
    expect(jobs[0].target.payload.text).toBe(buildRoutinePrompt(def));
    expect(jobs[0].target.payload.text).not.toContain(LEGACY_ROUTINE_OUTPUT_DIR_SENTENCE);
  });

  it('the morning report names no ~/wayland/... path, and the remaining ones may only shrink', () => {
    const offenders: string[] = [];
    for (const def of ROUTINES) {
      for (const [key, value] of Object.entries(def.inputs ?? {})) {
        if (value.startsWith('~/wayland/')) offenders.push(`${def.id}.${key}`);
      }
    }

    // The one routine that was executed end to end and PROVEN broken by it.
    expect(offenders.filter((o) => o.startsWith('weekday-morning-report.'))).toEqual([]);

    // A RATCHET, not a clean bill of health. Nine other routines still read
    // `~/wayland/...` inputs that nothing has ever written; only this one was
    // verified, and shipping an unproven repoint of nine more is worse than
    // shipping one proven repoint. The count may fall, never rise.
    expect(offenders.length).toBeLessThanOrEqual(18);

    // Floor + KNOWN-POSITIVE CONTROL: the corpus is real and the predicate bites.
    expect(ROUTINES.length).toBeGreaterThanOrEqual(10);
    expect(['~/wayland/market/watchlist.csv'].filter((v) => v.startsWith('~/wayland/'))).toHaveLength(1);
  });

  it('gives the prompt the write destination it never named, so the run stages something', async () => {
    const def = routine('weekday-morning-report');
    const jobs = [legacyJob({ id: 'cron_1', routineId: def.id, workflow: def.workflow, inputs: def.inputs! })];

    expect(jobs[0].target.payload.text).not.toContain('WAYLAND_OUTPUT_DIR');

    await migrateSeededRoutines(makeService(jobs), ROUTINES);

    expect(jobs[0].target.payload.text).toContain(ROUTINE_OUTPUT_DIR_SENTENCE);
    expect(jobs[0].target.payload.text).toContain('WAYLAND_OUTPUT_DIR');
  });

  it('stops the run publishing into artifacts/cron_<uuid>/ while its prompt reads artifacts/market/', async () => {
    const def = routine('weekday-morning-report');
    const jobs = [legacyJob({ id: 'cron_88ab12cd', routineId: def.id, workflow: def.workflow, inputs: def.inputs! })];

    // The defect, verbatim: the write side falls back to the job id while the
    // prompt's own output_dir names `artifacts/market/`.
    expect(artifactSeriesForJob(jobs[0])).toBe('cron_88ab12cd');
    expect(jobs[0].target.payload.text).toContain('artifacts/market/');

    await migrateSeededRoutines(makeService(jobs), ROUTINES);

    expect(artifactSeriesForJob(jobs[0])).toBe('market');
  });

  it('keeps the ORIGINAL prompt on the job across repeated rewrites, so the change can be undone', async () => {
    const def = routine('friday-weekly-review');
    const oldest = legacyPrompt(def.workflow, {
      data_dirs: def.inputs!.data_dirs,
      prior_review_path: '~/wayland/outbox/ops/last-weekly-review.md',
    });
    const jobs = [
      legacyJob({ id: 'cron_1', routineId: def.id, workflow: def.workflow, inputs: def.inputs!, prompt: oldest }),
    ];

    await migrateSeededRoutines(makeService(jobs), ROUTINES);
    expect(jobs[0].metadata.agentConfig!.configOptions![PROMPT_BACKUP_KEY]).toBe(oldest);

    // A LATER migration rewrites a prompt this one already rewrote once (here:
    // an install that shipped the repointed inputs but not the output-dir
    // sentence). The backup must still hold the ORIGINAL, not the intermediate
    // - a backup that moves forward every release is not a way back.
    const intermediate = legacyPrompt(def.workflow, def.inputs!);
    expect(intermediate).not.toBe(oldest);
    jobs[0].target.payload.text = intermediate;

    const again = await migrateSeededRoutines(makeService(jobs), ROUTINES);
    expect(again[0].changes).toEqual(['prompt']);
    expect(jobs[0].metadata.agentConfig!.configOptions![PROMPT_BACKUP_KEY]).toBe(oldest);
  });

  it('is idempotent: a second boot finds nothing to do', async () => {
    const def = routine('weekday-morning-report');
    const jobs = [legacyJob({ id: 'cron_1', routineId: def.id, workflow: def.workflow, inputs: def.inputs! })];

    expect(await migrateSeededRoutines(makeService(jobs), ROUTINES)).toHaveLength(1);
    expect(await migrateSeededRoutines(makeService(jobs), ROUTINES)).toEqual([]);
  });

  it('never allocates a workspace: this runs on every boot and a folder per forgotten routine is a sweep', async () => {
    const def = routine('weekday-morning-report');
    const jobs = [
      legacyJob({ id: 'cron_1', routineId: def.id, workflow: def.workflow, inputs: def.inputs!, enabled: true }),
    ];

    await migrateSeededRoutines(makeService(jobs), ROUTINES);

    expect(allocateWorkspace).not.toHaveBeenCalled();
    expect(jobs[0].metadata.agentConfig!.workspace).toBeUndefined();
  });
});

describe('the migration refuses anything it cannot prove is its own', () => {
  it('leaves a prompt the user edited exactly as it is', async () => {
    const def = routine('weekday-morning-report');
    const edited = `${legacyPrompt(def.workflow, def.inputs!)}\nAlso cc me on Slack when it is done.`;
    const jobs = [
      legacyJob({ id: 'cron_1', routineId: def.id, workflow: def.workflow, inputs: def.inputs!, prompt: edited }),
    ];

    const migrated = await migrateSeededRoutines(makeService(jobs), ROUTINES);

    // The series is still filled in - that is metadata we own and the prompt
    // does not name it - but not one byte of the user's text moves.
    expect(migrated[0].changes).toEqual(['series']);
    expect(jobs[0].target.payload.text).toBe(edited);
    expect(jobs[0].metadata.agentConfig!.configOptions![PROMPT_BACKUP_KEY]).toBeUndefined();
  });

  it('leaves a job that is not a bundled routine completely alone', async () => {
    const def = routine('weekday-morning-report');
    const jobs = [
      legacyJob({
        id: 'cron_user',
        routineId: def.id,
        workflow: def.workflow,
        inputs: def.inputs!,
        configOptions: { kind: 'ritual' },
      }),
    ];
    const snapshot = JSON.stringify(jobs[0]);

    expect(await migrateSeededRoutines(makeService(jobs), ROUTINES)).toEqual([]);
    expect(JSON.stringify(jobs[0])).toBe(snapshot);
  });

  it('leaves a routine id that no longer ships alone', async () => {
    const jobs = [
      legacyJob({
        id: 'cron_gone',
        routineId: 'retired-routine',
        workflow: 'wayland-morning-report',
        inputs: { a: 'b' },
      }),
    ];
    expect(await migrateSeededRoutines(makeService(jobs), ROUTINES)).toEqual([]);
  });

  it('never rewrites a series that is already declared', async () => {
    const def = routine('weekday-morning-report');
    const jobs = [
      legacyJob({
        id: 'cron_1',
        routineId: def.id,
        workflow: def.workflow,
        inputs: def.inputs!,
        configOptions: { kind: 'routine', routineId: def.id, artifactSeries: 'chosen-elsewhere' },
      }),
    ];

    await migrateSeededRoutines(makeService(jobs), ROUTINES);
    expect(artifactSeriesForJob(jobs[0])).toBe('chosen-elsewhere');
  });
});

describe('the seeder-generated fingerprint', () => {
  const def = routine('weekday-morning-report');

  it('accepts the old shape and the new shape, and nothing in between', () => {
    expect(isSeederGeneratedPrompt(legacyPrompt(def.workflow, def.inputs!), def)).toBe(true);
    expect(
      isSeederGeneratedPrompt(
        [
          `Run the "${def.workflow}" workflow now as a scheduled, unattended routine.`,
          `Inputs:\n${Object.entries(def.inputs!)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n')}`,
          ROUTINE_OUTPUT_DIR_SENTENCE,
          ROUTINE_NO_ATTACHMENT_SENTENCE,
        ].join('\n'),
        def
      )
    ).toBe(true);
  });

  it('accepts a RETIRED input key, and only the ones actually retired', () => {
    // Retiring an input otherwise makes every prompt already on disk fail the
    // fingerprint, so the migration refuses to touch the rows the retirement
    // was for. `watchlist_path`/`positions_path` are the retired pair.
    const withRetired = legacyPrompt(def.workflow, {
      watchlist_path: '~/wayland/market/watchlist.csv',
      positions_path: '~/wayland/market/positions.csv',
      ...def.inputs!,
    });
    expect(isSeederGeneratedPrompt(withRetired, def)).toBe(true);

    // KNOWN-NEGATIVE CONTROL: a key that was never ours is still a user edit.
    const withInvented = legacyPrompt(def.workflow, { ...def.inputs!, slack_channel: '#ops' });
    expect(isSeederGeneratedPrompt(withInvented, def)).toBe(false);

    // ...and a retired key on a DIFFERENT routine is not accepted either.
    const other = routine('friday-weekly-review');
    expect(
      isSeederGeneratedPrompt(legacyPrompt(other.workflow, { ...other.inputs!, watchlist_path: 'x' }), other)
    ).toBe(false);
  });

  it('rejects a prompt for a different workflow, an added line, a dropped input and an added one', () => {
    const { output_dir: _dropped, ...fewer } = def.inputs!;

    expect(isSeederGeneratedPrompt(legacyPrompt('some-other-workflow', def.inputs!), def)).toBe(false);
    expect(isSeederGeneratedPrompt(`${legacyPrompt(def.workflow, def.inputs!)}\nand email it`, def)).toBe(false);
    expect(isSeederGeneratedPrompt(legacyPrompt(def.workflow, fewer), def)).toBe(false);
    expect(isSeederGeneratedPrompt(legacyPrompt(def.workflow, { ...def.inputs!, extra_input: 'x' }), def)).toBe(false);
  });
});
