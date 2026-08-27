/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE ACCEPTANCE BAR, STARTING FROM THE SEEDER.
 *
 * "Generate my morning brief, show it to me, and tomorrow show me both days."
 *
 * The publication chain already had an end-to-end test, but it started from a
 * hand-written job and a stand-in agent that wrote wherever the test told it to.
 * Both of those are exactly the two things that were broken in the shipped
 * product: NO bundled skill text mentioned `WAYLAND_OUTPUT_DIR`, and the seeder
 * baked a prompt that named no output directory at all. A stand-in that writes
 * to `WAYLAND_OUTPUT_DIR` because the test handed it that path proves the
 * plumbing and assumes away the defect.
 *
 * So this starts one step earlier and assumes less:
 *
 *   - the job comes from the REAL `seedBuiltinRoutines`, reading the shipped
 *     `routines.json`, through the real `CronService.addJob`;
 *   - enabling it goes through the real enable transition, which allocates a
 *     real durable workspace on a real filesystem;
 *   - the runs go through the real `WorkerTaskManagerJobExecutor`;
 *   - and the agent is `bash`, executing the shipped SKILL.md's own command
 *     block, or reading the exact path the seeded PROMPT names.
 *
 * What is faked: the engine process, Electron, and the conversation store. The
 * scanner binaries are stubbed - they fetch from Yahoo - but they are stubbed
 * AT THE WORKSPACE-RELATIVE PATH THE SKILL NAMES, and they write the argument
 * the skill passes them, so the destination is still decided by the skill.
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
  // The executor resolves the routine's declared skill directories from here so
  // it can copy them INTO the workspace (the engine sandboxes on the workspace,
  // so a skill outside it is refused). Nothing exists under this path, so
  // `resolveRoutineSkillDirs` finds no depends and this test is unaffected -
  // but the export has to be present or the module mock shadows it away.
  getBuiltinSkillsCopyDir: vi.fn(() => '/mock/builtinSkills'),
}));
vi.mock('@/process/services/cron/cronSkillFile', () => ({
  writeCronSkillFile: vi.fn(async () => '/mock/cronSkills/job/SKILL.md'),
  deleteCronSkillFile: vi.fn(async () => {}),
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

import { execFileSync } from 'child_process';
import {readFileSync, writeFileSync} from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import pathMod from 'path';

import { CronService } from '@/process/services/cron/CronService';
import { WorkerTaskManagerJobExecutor } from '@/process/services/cron/WorkerTaskManagerJobExecutor';
import { CronBusyGuard } from '@/process/services/cron/CronBusyGuard';
import type { CronJob } from '@/process/services/cron/CronStore';
import type { ICronRepository } from '@/process/services/cron/ICronRepository';
import type { ICronEventEmitter } from '@/process/services/cron/ICronEventEmitter';
import type { ICronJobExecutor } from '@/process/services/cron/ICronJobExecutor';
import type { IConversationRepository } from '@/process/services/database/IConversationRepository';
import { seedBuiltinRoutines } from '@process/services/cron/BuiltinRoutinesSeeder';
import { buildEngineSpawnEnv, buildOutputDirective, resolveOutputDir } from '@process/agent/wcore/envBuilder';
import { listRuns, readLatest } from '@process/services/artifacts/artifactSeries';
import { artifactLedgerPath, readArtifactLedger } from '@process/services/artifacts/artifactLedger';
import { activeRunOutputDir, clearRunOutputDirs } from '@process/services/artifacts/runOutputDir';

const REPO_ROOT = pathMod.resolve(__dirname, '../../..');
const SKILL_MD = pathMod.join(
  REPO_ROOT,
  'src/process/resources/bundled-workflows/bodies/wayland-morning-report/SKILL.md'
);

/**
 * The shipped staging-directory block, verbatim.
 *
 * COVERAGE CHANGE: this used to select the block that ran `morning-report.mjs`,
 * a bundled Yahoo scanner that is now DELETED. The routine reads the user's own
 * chart over MCP and the MODEL writes the brief, so the body carries no command
 * that produces a deliverable. The block that remains - and that is still
 * executed below - pins and creates the staging directory, which is what keeps
 * `<deliverables_dir>` substitution and the no-env-var property under test.
 *
 * COVERAGE LOST: the shipped body's own command producing the brief.
 */
function stagingDirBlock(): string {
  const markdown = readFileSync(SKILL_MD, 'utf-8');
  const block = [...markdown.matchAll(/```(?:bash|sh|shell|zsh)\n([\s\S]*?)```/g)]
    .map((m) => m[1])
    .find((b) => b.includes('<deliverables_dir>') && b.includes('mkdir'));
  if (!block) {
    throw new Error('the morning-report SKILL.md no longer contains a staging-directory block');
  }
  return block;
}

/**
 * The absolute deliverables directory the run's own `--system-prompt` directive
 * names. This is the ONLY channel the agent has for it: `WAYLAND_OUTPUT_DIR` is
 * set on the engine process and never reaches a Bash tool call.
 */
function deliverablesDirFromDirective(directive: string): string {
  const m = directive.match(/Deliverables you want the user to keep go in (.+?)\. Create that directory/);
  if (!m) throw new Error(`buildOutputDirective no longer names a directory: ${directive}`);
  return m[1];
}

/** `- key: value` lines out of the SEEDED prompt - the agent's only input list. */
function promptInputs(prompt: string): Record<string, string> {
  const inputs: Record<string, string> = {};
  for (const line of prompt.split('\n')) {
    const m = line.match(/^- ([^:]+): (.*)$/);
    if (m) inputs[m[1]] = m[2];
  }
  return inputs;
}

function substitute(block: string, inputs: Record<string, string>): string {
  let out = block;
  for (const [k, v] of Object.entries(inputs)) out = out.split(`<${k}>`).join(v);
  return out;
}


function makeRepo(jobs: CronJob[]): ICronRepository {
  return {
    insert: vi.fn(async (job: CronJob) => {
      jobs.push(job);
    }),
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
}

function makeService(jobs: CronJob[]): CronService {
  return new CronService(
    makeRepo(jobs),
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

/** What the stand-in agent does once the engine env for the run exists. */
type Agent = (env: Record<string, string>, workspace: string, directive: string) => Promise<void>;

function makeHarness(workspace: string) {
  const guard = new CronBusyGuard();
  let agent: Agent = async () => {};
  // Mirrors the real seam exactly: `WCoreManager` is constructed FOR a
  // conversation and passes its own `conversation_id` down, and `WCoreAgent`
  // resolves the run's output directory from that id - not from the workspace.
  // Keying this stand-in on the workspace instead would let the test pass while
  // the product wrote nowhere, which is the whole defect P2-11 fixed.
  const buildTask = (conversationId: string) => ({
    type: 'wcore',
    workspace,
    sendMessage: vi.fn(async () => {
      const env = buildEngineSpawnEnv({
        providerEnv: {},
        workspace,
        outputDir: activeRunOutputDir(conversationId),
      });
      // Mirrors `WCoreAgent.start`: ONE `resolveOutputDir` call feeds BOTH the
      // spawn env and the `--system-prompt` directive. Deriving it twice would
      // let the two channels disagree, which is the defect this rail exists to
      // prevent.
      const engineOutputDir = resolveOutputDir(workspace, activeRunOutputDir(conversationId), conversationId);
      await agent(env, workspace, buildOutputDirective(engineOutputDir));
    }),
  });
  const taskManager = {
    getTask: vi.fn(() => undefined),
    getOrBuildTask: vi.fn(async (conversationId: string) => buildTask(conversationId)),
    kill: vi.fn(),
    buildConversation: vi.fn(),
  };
  const executor = new WorkerTaskManagerJobExecutor(taskManager as any, guard);

  async function run(job: CronJob, behaviour: Agent): Promise<string> {
    agent = behaviour;
    const conversationId = await executor.prepareConversation(job);
    await executor.executeJob(job, undefined, conversationId);
    guard.setProcessing(conversationId, false);
    // The commit is fired from the idle callback without being awaited, exactly
    // as it is in production, so "the conversation is idle" is not "the run is
    // published". A fixed sleep here was a race: under a loaded machine the
    // ledger write had not landed and the assertions read an empty ledger.
    await vi.waitFor(async () => {
      expect(guard.isProcessing(conversationId)).toBe(false);
    });
    await executor._whenSettledForTests();
    return conversationId;
  }

  return { run };
}


/**
 * Execute the shipped block with its placeholder substituted, then have the
 * shell report the directory the block actually pinned in `$OUT`.
 *
 * Capturing `$OUT` is what ties this test to the body's real CONTENT. Without
 * it the block can be replaced by anything - including a decoy path - and every
 * assertion below still passes, because they would only look where the TEST
 * decided the output goes. A mutation run proved exactly that failure.
 */
function runShippedBlockAndReportPinnedDir(rawBlock: string, deliverablesDir: string, ws: string): string {
  const block = rawBlock.split('<deliverables_dir>').join(deliverablesDir);
  expect(block).not.toContain('<');
  const stdout = execFileSync('bash', ['-c', `${block}\nprintf %s "$OUT"`], {
    cwd: ws,
    env: { ...process.env, WAYLAND_OUTPUT_DIR: undefined } as NodeJS.ProcessEnv,
    encoding: 'utf-8',
  });
  return stdout.trim();
}

describe('a bundled routine, seeded the way a real install seeds it, keeps a history', () => {
  let documentsDir: string;
  let dataDir: string;
  let jobs: CronJob[];
  let service: CronService;
  let ledger: string;

  beforeAll(async () => {
    documentsDir = await fsp.mkdtemp(pathMod.join(os.tmpdir(), 'wl-e2e-docs-'));
    documentsDirRef.value = documentsDir;
  });
  afterAll(async () => {
    await fsp.rm(documentsDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    dataDir = await fsp.mkdtemp(pathMod.join(os.tmpdir(), 'wl-e2e-data-'));
    dataPathRef.value = dataDir;
    ledger = artifactLedgerPath(dataDir);
    conversationStore.clear();
    createConversationMock.mockClear();
    clearRunOutputDirs();

    jobs = [];
    service = makeService(jobs);
    // The real seeder, reading the real routines.json.
    await seedBuiltinRoutines(service);
  });

  afterEach(async () => {
    await fsp.rm(dataDir, { recursive: true, force: true });
    clearRunOutputDirs();
    vi.clearAllMocks();
  });

  /** Enable a seeded routine the way the user does, and return the armed job. */
  async function enable(routineId: string): Promise<CronJob> {
    const seeded = jobs.find((j) => j.metadata.agentConfig?.configOptions?.routineId === routineId);
    if (!seeded) throw new Error(`routine ${routineId} was not seeded`);
    expect(seeded.enabled).toBe(false);
    await service.updateJob(seeded.id, { enabled: true });
    return jobs.find((j) => j.id === seeded.id)!;
  }

  it("publishes the shipped skill's own output into the series, and the next day keeps both", async () => {
    const job = await enable('weekday-morning-report');
    const workspace = job.metadata.agentConfig!.workspace!;
    expect(workspace.startsWith(documentsDir)).toBe(true);

    const seriesDir = pathMod.join(workspace, 'artifacts', 'market');
    const h = makeHarness(workspace);

    /**
     * The agent: run the skill's own commands, in the workspace, resolving its
     * one placeholder the only way the product lets it - out of the directive.
     *
     * The engine's env is deliberately NOT spread into the child. The engine
     * runs Bash tool calls through a 19-name allowlist that excludes
     * `WAYLAND_OUTPUT_DIR`, so a stand-in that forwarded it would be testing a
     * channel the product does not have.
     */
    const runSkill = (bar: string): Agent => {
      return async (_env, ws, directive) => {
        const dir = deliverablesDirFromDirective(directive);
        // Write where the BLOCK pinned, not where this test decided - otherwise
        // the block's content is unasserted and a decoy path passes.
        const pinned = runShippedBlockAndReportPinnedDir(stagingDirBlock(), dir, ws);
        expect(pinned, 'the shipped block must pin the directory the directive names').toBe(dir);
        // What the model does after the block: write the brief into the pinned
        // staging directory. One file - the intermediate `mr.json` the deleted
        // scanner used to leave behind has no counterpart in a chart-driven run.
        writeFileSync(
          pathMod.join(pinned, 'morning-brief.html'),
          `<html>Morning brief bar ${bar}</html>`,
          'utf-8'
        );
      };
    };

    await h.run(job, runSkill('2026-08-19'));

    // Day 1 is filed under a dated run directory, not loose in the series.
    const afterDay1 = await listRuns(seriesDir);
    expect(afterDay1).toHaveLength(1);
    expect(await fsp.readFile(pathMod.join(afterDay1[0].runDir, 'morning-brief.html'), 'utf8')).toContain(
      'bar 2026-08-19'
    );
    expect((await readLatest(seriesDir))?.runId).toBe(afterDay1[0].runId);

    // The Workbench can find it: it is in the ledger, under this job.
    const records = await readArtifactLedger(ledger);
    expect(records.map((r) => pathMod.basename(r.relativePath)).toSorted()).toEqual(['morning-brief.html']);
    expect(records[0].taskId).toBe(job.id);

    // And the fixed path a seed-time prompt can name holds day 1.
    const alias = pathMod.join(seriesDir, 'morning-brief.html');
    expect(await fsp.readFile(alias, 'utf8')).toContain('bar 2026-08-19');

    // Day 2, in a brand new conversation, reading day 1 before it writes.
    let priorSeenByDay2 = '';
    await h.run(job, async (env, ws, directive) => {
      priorSeenByDay2 = await fsp.readFile(pathMod.join(ws, 'artifacts', 'market', 'morning-brief.html'), 'utf8');
      await runSkill('2026-08-20')(env, ws, directive);
    });

    expect(priorSeenByDay2).toContain('bar 2026-08-19');

    const afterDay2 = await listRuns(seriesDir);
    expect(afterDay2).toHaveLength(2);
    const bodies = await Promise.all(
      afterDay2.map((r) => fsp.readFile(pathMod.join(r.runDir, 'morning-brief.html'), 'utf8'))
    );
    expect(bodies.map((b) => b.match(/bar (\S+)</)![1])).toEqual(['2026-08-19', '2026-08-20']);
    expect(await fsp.readFile(alias, 'utf8')).toContain('bar 2026-08-20');
  });

  it('closes the prior-run read loop for a routine whose PROMPT names the path', async () => {
    // `friday-weekly-review` is the input-side case: its prompt hands the agent
    // `prior_review_path`, which used to name `~/wayland/outbox/...` - a
    // directory nothing writes. Run 1 must make that path real for run 2.
    const job = await enable('friday-weekly-review');
    const workspace = job.metadata.agentConfig!.workspace!;
    const inputs = promptInputs(job.target.payload.text);
    const priorPath = inputs.prior_review_path;

    expect(priorPath).toBe('artifacts/ops/last-weekly-review.md');
    const deliverable = pathMod.basename(priorPath);

    const h = makeHarness(workspace);

    /** The agent obeys the prompt: read the prior review, write into the output dir. */
    const weeklyAgent = (week: string, seen: { prior: string | null }): Agent => {
      return async (env, ws) => {
        seen.prior = await fsp.readFile(pathMod.join(ws, priorPath), 'utf8').catch(() => null);
        await fsp.writeFile(
          pathMod.join(env.WAYLAND_OUTPUT_DIR, deliverable),
          `week ${week}; prior: ${seen.prior ?? 'none'}`,
          'utf8'
        );
      };
    };

    const week1 = { prior: 'unset' as string | null };
    await h.run(job, weeklyAgent('1', week1));
    expect(week1.prior).toBeNull(); // no prior run, and that is not an error

    const week2 = { prior: 'unset' as string | null };
    await h.run(job, weeklyAgent('2', week2));

    expect(week2.prior).toBe('week 1; prior: none');
    const runs = await listRuns(pathMod.join(workspace, 'artifacts', 'ops'));
    expect(runs).toHaveLength(2);
  });
});
