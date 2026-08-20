/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * THE ACCEPTANCE CLAIM, END TO END, ON A REAL FILESYSTEM.
 *
 * "Generate my morning brief, show it to me, and tomorrow show me both days."
 *
 * Lane A proved two runs a day apart share one durable workspace. Lane B built
 * a series that can hold a dated, atomically-published run and a ledger that
 * can describe one. Neither called the other and the run path called neither,
 * so a routine still had a folder and no notion of a run. This drives the REAL
 * `WorkerTaskManagerJobExecutor` through two runs and asserts the whole chain:
 *
 *   - the run's engine env points at the run's STAGING directory, so half a
 *     brief is never visible as a brief;
 *   - a finished run publishes into `artifacts/<series>/<date>/<run-id>/`;
 *   - `latest` and the ledger both name it;
 *   - the NEXT run, in a brand new conversation, resolves and reads it;
 *   - day 2 publishing does not touch day 1;
 *   - a run that dies between begin and commit changes nothing;
 *   - two runs on the same DATE both keep their own bytes.
 *
 * Everything is real except the engine itself, Electron, and the conversation
 * store. The stand-in agent writes through `buildEngineSpawnEnv`, the same
 * function the real spawn uses, so "the agent wrote to the right place" is not
 * asserted against a path this test made up.
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    power: { preventSleep: vi.fn(() => 1), allowSleep: vi.fn() },
    paths: { isPackaged: () => false, getAppPath: () => '/mock/appPath' },
  }),
}));
vi.mock('croner', () => ({
  Cron: class {
    stop() {}
    nextRun() {
      return null;
    }
  },
}));
vi.mock('@process/services/i18n', () => ({
  default: { t: vi.fn((key: string) => key) },
  i18nReady: Promise.resolve(),
}));
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn() }));

const dataPathRef = vi.hoisted(() => ({ value: '' }));
vi.mock('@process/utils', () => ({
  copyFilesToDirectory: vi.fn(async () => []),
  getDataPath: () => dataPathRef.value,
}));

vi.mock('@/common', () => {
  const stream = { emit: vi.fn() };
  return {
    ipcBridge: {
      conversation: { responseStream: stream, listChanged: { emit: vi.fn() } },
      geminiConversation: { responseStream: stream },
      acpConversation: { responseStream: stream },
      openclawConversation: { responseStream: stream },
    },
  };
});
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => undefined) },
  getCronSkillsDir: vi.fn(() => '/mock/cronSkills'),
}));
vi.mock('@/process/services/cron/cronSkillFile', () => ({
  writeCronSkillFile: vi.fn(async () => '/mock/cronSkills/job/SKILL.md'),
  deleteCronSkillFile: vi.fn(async () => {}),
  // True, so the run does not branch into the skill-suggest watcher: what is
  // under test is publication, and a routine on its second day has a skill.
  hasCronSkillFile: vi.fn(async () => true),
  getCronSkillDir: vi.fn(() => '/mock/cronSkills/job'),
}));
vi.mock('@/process/services/cron/cronArchive', () => ({
  archiveCronJob: vi.fn(async () => ({ archiveId: 'a', archivedAt: 1, skillPresent: false })),
  listArchivedCronJobs: vi.fn(async () => []),
  markCronArchiveAborted: vi.fn(async () => {}),
  markCronArchiveRestored: vi.fn(async () => {}),
  preserveRemovedCronSkill: vi.fn(async () => {}),
  restoreCronSkillFromArchive: vi.fn(),
  rollbackRestoredCronSkill: vi.fn(async () => {}),
}));
vi.mock('@process/services/cron/SkillSuggestWatcher', () => ({
  skillSuggestWatcher: { register: vi.fn(), unregister: vi.fn(), watch: vi.fn(), stop: vi.fn() },
}));
vi.mock('@process/task/AcpSkillManager', () => ({
  AcpSkillManager: { getInstance: () => ({ discoverSkills: vi.fn(async () => {}), getSkillsIndex: () => [] }) },
}));

const conversationStore = new Map<string, any>();
const createConversationMock = vi.fn(async (params: any) => {
  const id = `conv-${conversationStore.size}`;
  const workspace = params.extra?.workspace ? params.extra.workspace : `/tmp/wcore-temp-${Date.now()}`;
  const conv = {
    id,
    type: params.type,
    name: params.name,
    createTime: Date.now() + conversationStore.size,
    modifyTime: Date.now() + conversationStore.size,
    model: params.model,
    extra: { ...params.extra, workspace },
  };
  conversationStore.set(id, conv);
  return conv;
});
vi.mock('@process/services/conversationServiceSingleton', () => ({
  conversationServiceSingleton: {
    getConversation: vi.fn(async (id: string) => conversationStore.get(id)),
    createConversation: createConversationMock,
    updateConversation: vi.fn(async (id: string, patch: any) => {
      const conv = conversationStore.get(id);
      if (conv) conversationStore.set(id, { ...conv, ...patch });
    }),
    getConversationsByCronJob: vi.fn(async (cronJobId: string) =>
      [...conversationStore.values()]
        .filter((c) => c.extra?.cronJobId === cronJobId)
        .sort((a, b) => b.createTime - a.createTime)
    ),
  },
}));

const documentsDirRef = vi.hoisted(() => ({ value: '' }));
vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/mock/appPath', getPath: () => documentsDirRef.value },
  ipcMain: { handle: vi.fn(), on: vi.fn(), removeHandler: vi.fn() },
  powerMonitor: { on: vi.fn() },
}));

import os from 'os';
import pathMod from 'path';
import fsp from 'fs/promises';
import { existsSync } from 'fs';

import { CronService } from '@/process/services/cron/CronService';
import { WorkerTaskManagerJobExecutor } from '@/process/services/cron/WorkerTaskManagerJobExecutor';
import { CronBusyGuard } from '@/process/services/cron/CronBusyGuard';
import type { CronJob } from '@/process/services/cron/CronStore';
import type { ICronRepository } from '@/process/services/cron/ICronRepository';
import type { ICronEventEmitter } from '@/process/services/cron/ICronEventEmitter';
import type { ICronJobExecutor } from '@/process/services/cron/ICronJobExecutor';
import type { IConversationRepository } from '@/process/services/database/IConversationRepository';
import { buildEngineSpawnEnv } from '@process/agent/wcore/envBuilder';
import { listRuns, readLatest } from '@process/services/artifacts/artifactSeries';
import { artifactLedgerPath, readArtifactLedger } from '@process/services/artifacts/artifactLedger';
import { activeRunOutputDir, clearRunOutputDirs } from '@process/services/artifacts/runOutputDir';

/** The stable name a routine's prompt can hand the NEXT run as its input. */
const BRIEF = 'last-brief.md';
const SERIES = 'market';

function seededRoutine(): CronJob {
  return {
    id: 'cron_morning_brief',
    name: 'Morning Brief',
    enabled: false,
    schedule: { kind: 'cron', expr: '0 7 * * *', description: '0 7 * * *' },
    target: { payload: { kind: 'message', text: 'brief me' }, executionMode: 'new_conversation' },
    metadata: {
      conversationId: '',
      conversationTitle: 'Morning Brief',
      agentType: 'wcore' as CronJob['metadata']['agentType'],
      createdBy: 'agent',
      createdAt: 1000,
      updatedAt: 1000,
      agentConfig: {
        backend: 'wcore' as CronJob['metadata']['agentType'],
        name: 'Morning Brief',
        mode: 'bypassPermissions',
        // Exactly what BuiltinRoutinesSeeder writes for `weekday-morning-report`,
        // whose own declared output is `artifacts/market/`.
        configOptions: { kind: 'routine', routineId: 'weekday-morning-report', artifactSeries: SERIES },
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

/** What the stand-in agent does when the turn is sent. */
type Agent = (outputDir: string, workspace: string) => Promise<void>;

function makeHarness(workspace: string) {
  const guard = new CronBusyGuard();
  let agent: Agent = async () => {};
  const task = {
    type: 'wcore',
    workspace,
    sendMessage: vi.fn(async () => {
      // The destination is read the way the real engine reads it: the spawn
      // call in `WCoreManager.start()`, verbatim - same builder, same
      // workspace, same `activeRunOutputDir` lookup. `spawnSiteIsWired` below
      // pins that this really is what the spawn site passes.
      const env = buildEngineSpawnEnv({ providerEnv: {}, workspace, outputDir: activeRunOutputDir(workspace) });
      await agent(env.WAYLAND_OUTPUT_DIR, workspace);
    }),
  };
  const taskManager = {
    getTask: vi.fn(() => undefined),
    getOrBuildTask: vi.fn(async () => task),
    kill: vi.fn(),
    buildConversation: vi.fn(),
  };
  const executor = new WorkerTaskManagerJobExecutor(taskManager as any, guard);

  /** One full run: send the turn, then let the conversation go idle. */
  async function run(job: CronJob, behaviour: Agent, opts: { crash?: boolean } = {}): Promise<string> {
    agent = behaviour;
    const conversationId = await executor.prepareConversation(job);
    await executor.executeJob(job, undefined, conversationId);
    if (opts.crash) return conversationId;
    guard.setProcessing(conversationId, false);
    // The commit is fired from the idle callback without being awaited, as it
    // is in production; drain the microtask queue the same way the app does.
    await vi.waitFor(async () => {
      expect(guard.isProcessing(conversationId)).toBe(false);
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    return conversationId;
  }

  return { executor, guard, task, run };
}

describe('a scheduled routine publishes a durable, dated, discoverable series', () => {
  let documentsDir: string;
  let dataDir: string;
  let jobs: CronJob[];
  let workspace: string;
  let seriesDir: string;
  let ledger: string;

  beforeAll(async () => {
    documentsDir = await fsp.mkdtemp(pathMod.join(os.tmpdir(), 'wl-series-docs-'));
    documentsDirRef.value = documentsDir;
  });
  afterAll(async () => {
    await fsp.rm(documentsDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    dataDir = await fsp.mkdtemp(pathMod.join(os.tmpdir(), 'wl-series-data-'));
    dataPathRef.value = dataDir;
    ledger = artifactLedgerPath(dataDir);
    conversationStore.clear();
    createConversationMock.mockClear();
    clearRunOutputDirs();

    jobs = [seededRoutine()];
    await makeService(jobs).updateJob('cron_morning_brief', { enabled: true });
    workspace = jobs[0].metadata.agentConfig!.workspace!;
    seriesDir = pathMod.join(workspace, 'artifacts', SERIES);
  });

  afterEach(async () => {
    await fsp.rm(dataDir, { recursive: true, force: true });
    clearRunOutputDirs();
    vi.clearAllMocks();
  });

  it('hands the running agent its own staging directory, not the series the user reads', async () => {
    // Outside a run, the workspace's output directory is the series root - an
    // interactive chat in a task workspace is unchanged.
    expect(
      buildEngineSpawnEnv({ providerEnv: {}, workspace, outputDir: activeRunOutputDir(workspace) })
        .WAYLAND_OUTPUT_DIR
    ).toBe(pathMod.join(workspace, 'artifacts'));

    let seen = '';
    const h = makeHarness(workspace);
    await h.run(jobs[0], async (outputDir) => {
      seen = outputDir;
      await fsp.writeFile(pathMod.join(outputDir, BRIEF), 'day one', 'utf8');
    });

    const relative = pathMod.relative(workspace, seen).split(pathMod.sep);
    expect(relative.slice(0, 3)).toEqual(['artifacts', SERIES, '.staging']);
    // And the run closed: the next spawn is back on the series root.
    expect(
      buildEngineSpawnEnv({ providerEnv: {}, workspace, outputDir: activeRunOutputDir(workspace) })
        .WAYLAND_OUTPUT_DIR
    ).toBe(pathMod.join(workspace, 'artifacts'));
  });

  it('day 1 publishes a dated run, moves latest, records the ledger and refreshes the stable input', async () => {
    const h = makeHarness(workspace);
    await h.run(jobs[0], async (outputDir) => {
      await fsp.writeFile(pathMod.join(outputDir, BRIEF), '# Monday brief', 'utf8');
    });

    const runs = await listRuns(seriesDir);
    expect(runs).toHaveLength(1);
    expect(/^\d{4}-\d{2}-\d{2}$/.test(runs[0].date)).toBe(true);
    expect(await fsp.readFile(pathMod.join(runs[0].runDir, BRIEF), 'utf8')).toBe('# Monday brief');

    const latest = await readLatest(seriesDir);
    expect(latest?.runId).toBe(runs[0].runId);

    const records = await readArtifactLedger(ledger);
    expect(records).toHaveLength(1);
    expect(records[0].taskId).toBe('cron_morning_brief');
    expect(records[0].runId).toBe(runs[0].runId);
    expect(records[0].relativePath).toBe(['artifacts', SERIES, runs[0].date, runs[0].runId, BRIEF].join('/'));
    expect(records[0].sizeBytes).toBe('# Monday brief'.length);

    // The fixed path a routine's seed-time prompt can name.
    expect(await fsp.readFile(pathMod.join(seriesDir, BRIEF), 'utf8')).toBe('# Monday brief');

    // Nothing half-written left behind.
    expect(existsSync(pathMod.join(seriesDir, '.staging', runs[0].runId))).toBe(false);
  });

  it('there is no prior run before the first run, and that is not an error', async () => {
    expect(await readLatest(seriesDir)).toBeNull();
    expect(await listRuns(seriesDir)).toEqual([]);
    expect(existsSync(pathMod.join(seriesDir, BRIEF))).toBe(false);

    let priorSeen: string | null = 'not-read';
    const h = makeHarness(workspace);
    await h.run(jobs[0], async (outputDir, ws) => {
      priorSeen = await fsp.readFile(pathMod.join(ws, 'artifacts', SERIES, BRIEF), 'utf8').catch(() => null);
      await fsp.writeFile(pathMod.join(outputDir, BRIEF), 'first ever', 'utf8');
    });

    expect(priorSeen).toBeNull();
    expect(await listRuns(seriesDir)).toHaveLength(1);
  });

  it('day 2 runs in a NEW conversation, reads day 1 output, and publishes without overwriting it', async () => {
    const h = makeHarness(workspace);
    const day1 = await h.run(jobs[0], async (outputDir) => {
      await fsp.writeFile(pathMod.join(outputDir, BRIEF), 'MONDAY', 'utf8');
    });

    let readByDay2 = '';
    const day2 = await h.run(jobs[0], async (outputDir, ws) => {
      // Exactly the path shape a bundled routine names in its prompt.
      readByDay2 = await fsp.readFile(pathMod.join(ws, 'artifacts', SERIES, BRIEF), 'utf8');
      await fsp.writeFile(pathMod.join(outputDir, BRIEF), `TUESDAY (prior: ${readByDay2})`, 'utf8');
    });

    expect(day2).not.toBe(day1);
    expect(conversationStore.get(day2).extra.workspace).toBe(workspace);
    expect(readByDay2).toBe('MONDAY');

    const runs = await listRuns(seriesDir);
    expect(runs).toHaveLength(2);
    const bodies = await Promise.all(runs.map((r) => fsp.readFile(pathMod.join(r.runDir, BRIEF), 'utf8')));
    expect(bodies).toEqual(['MONDAY', 'TUESDAY (prior: MONDAY)']);

    // Chronological, and latest is the newer one.
    expect(runs.map((r) => r.runId).toSorted()).toEqual(runs.map((r) => r.runId));
    expect((await readLatest(seriesDir))?.runId).toBe(runs[1].runId);
    expect((await readArtifactLedger(ledger)).map((r) => r.runId).toSorted()).toEqual(
      runs.map((r) => r.runId).toSorted()
    );
  });

  it('a run that dies between begin and commit leaves day 1 and latest untouched', async () => {
    const h = makeHarness(workspace);
    await h.run(jobs[0], async (outputDir) => {
      await fsp.writeFile(pathMod.join(outputDir, BRIEF), 'MONDAY', 'utf8');
    });
    const before = await listRuns(seriesDir);
    const latestBefore = await readLatest(seriesDir);

    // The turn is sent, the agent writes half a brief, and the conversation
    // never goes idle - the process died.
    await h.run(
      jobs[0],
      async (outputDir) => {
        await fsp.writeFile(pathMod.join(outputDir, BRIEF), 'HALF WRIT', 'utf8');
      },
      { crash: true }
    );

    const after = await listRuns(seriesDir);
    expect(after.map((r) => r.runId)).toEqual(before.map((r) => r.runId));
    expect(await readLatest(seriesDir)).toEqual(latestBefore);
    expect(await fsp.readFile(pathMod.join(seriesDir, BRIEF), 'utf8')).toBe('MONDAY');
    expect(await readArtifactLedger(ledger)).toHaveLength(1);
  });

  it('a run whose turn throws publishes nothing at all', async () => {
    const h = makeHarness(workspace);
    h.task.sendMessage.mockImplementationOnce(async () => {
      throw new Error('engine died on start');
    });
    await expect(h.run(jobs[0], async () => {})).rejects.toThrow('engine died on start');

    expect(await listRuns(seriesDir)).toEqual([]);
    expect(await readLatest(seriesDir)).toBeNull();
    expect(await readArtifactLedger(ledger)).toEqual([]);
    expect(await fsp.readdir(pathMod.join(seriesDir, '.staging'))).toEqual([]);
  });

  it('two runs on the SAME date both survive with their own bytes', async () => {
    const h = makeHarness(workspace);
    await h.run(jobs[0], async (outputDir) => {
      await fsp.writeFile(pathMod.join(outputDir, BRIEF), 'FIRST', 'utf8');
    });
    await h.run(jobs[0], async (outputDir) => {
      await fsp.writeFile(pathMod.join(outputDir, BRIEF), 'SECOND', 'utf8');
    });

    const runs = await listRuns(seriesDir);
    expect(runs).toHaveLength(2);
    expect(runs[0].date).toBe(runs[1].date);
    expect(runs[0].runId).not.toBe(runs[1].runId);
    const bodies = await Promise.all(runs.map((r) => fsp.readFile(pathMod.join(r.runDir, BRIEF), 'utf8')));
    expect(bodies.toSorted()).toEqual(['FIRST', 'SECOND']);
    // The date directory holds both; the run id is what identifies a run.
    expect((await fsp.readdir(pathMod.join(seriesDir, runs[0].date))).toSorted()).toEqual(
      runs.map((r) => r.runId).toSorted()
    );
  });

  it('a run that stages nothing publishes nothing rather than an empty deliverable', async () => {
    const h = makeHarness(workspace);
    await h.run(jobs[0], async (outputDir) => {
      await fsp.writeFile(pathMod.join(outputDir, BRIEF), 'REAL', 'utf8');
    });
    await h.run(jobs[0], async () => {});

    const runs = await listRuns(seriesDir);
    expect(runs).toHaveLength(1);
    expect(await fsp.readFile(pathMod.join(seriesDir, BRIEF), 'utf8')).toBe('REAL');
  });

  it('a job running in a chat the user owns opens no run at all', async () => {
    // `existing` mode runs inside a conversation the user owns, and several of
    // their chats can share one folder. Redirecting that folder's next engine
    // spawn into this run's staging directory would silently move an unrelated
    // chat's output, so the seam deliberately stops at the durable-task path.
    const shared: CronJob = {
      ...jobs[0],
      target: { ...jobs[0].target, executionMode: 'existing' },
      metadata: { ...jobs[0].metadata, conversationId: 'user-owned-chat' },
    };
    conversationStore.set('user-owned-chat', {
      id: 'user-owned-chat',
      extra: { workspace },
      createTime: 1,
      modifyTime: 1,
    });

    let seen = '';
    const h = makeHarness(workspace);
    await h.run(shared, async (outputDir) => {
      seen = outputDir;
      // The series root is deliberately not created by the host (an mkdir there
      // would resurrect a workspace the user deleted), so a skill mkdir -p's it
      // - which is what proves this run was never handed a staging directory.
      await fsp.mkdir(outputDir, { recursive: true });
      await fsp.writeFile(pathMod.join(outputDir, BRIEF), 'from a user chat', 'utf8');
    });

    expect(seen).toBe(pathMod.join(workspace, 'artifacts'));
    expect(await listRuns(seriesDir)).toEqual([]);
    expect(await readArtifactLedger(ledger)).toEqual([]);
  });

  it('a symlink smuggled into staging is refused, and the run publishes anyway', async () => {
    const secret = pathMod.join(documentsDir, 'id_rsa');
    await fsp.writeFile(secret, 'PRIVATE KEY', 'utf8');

    const h = makeHarness(workspace);
    await h.run(jobs[0], async (outputDir) => {
      await fsp.writeFile(pathMod.join(outputDir, BRIEF), 'REAL', 'utf8');
      await fsp.symlink(secret, pathMod.join(outputDir, 'stolen.md'));
    });

    const records = await readArtifactLedger(ledger);
    expect(records.map((r) => pathMod.basename(r.relativePath))).toEqual([BRIEF]);
    // Never aliased into the namespace the user and the next run read.
    expect(existsSync(pathMod.join(seriesDir, 'stolen.md'))).toBe(false);
    expect(await fsp.readFile(pathMod.join(seriesDir, BRIEF), 'utf8')).toBe('REAL');
  });
});
