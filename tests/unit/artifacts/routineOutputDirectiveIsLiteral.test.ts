/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * LINK 4: THE RUN'S OUTPUT DIRECTORY REACHES THE MODEL AS TEXT, NOT AS AN ENV VAR.
 *
 * `WAYLAND_OUTPUT_DIR` is set on the ENGINE process, and the engine runs every
 * Bash tool call through a fixed 19-name env allowlist that does not contain it
 * (proven by execution on both the shipped v0.13.3 and the pinned v0.13.4:
 * `wayland-core sandbox exec` prints an empty value for it while `WAYLAND_HOME`
 * comes back populated as the known-positive control). So the shipped skill's
 * `OUT="${WAYLAND_OUTPUT_DIR:-$PWD/<output_dir>}"` ALWAYS took the `$PWD`
 * fallback, the brief landed outside the staging directory, `collectStagedPaths`
 * found nothing, and `commitTaskRun` returned `no-output` - which is verbatim
 * the one line in the live `.runs.jsonl`.
 *
 * The durable channel is TEXT. Two rules make it deterministic rather than
 * hopeful, and both are asserted here:
 *
 *  1. THE PATH HAS EXACTLY ONE PRODUCER. `resolveOutputDir` re-checks
 *     containment because the value becomes a host-blessed write destination
 *     handed to model-authored skill text. Nothing else may derive it. The
 *     executor therefore ASKS that producer and refuses the run when it
 *     disagrees, because that inequality IS the signal the run cannot publish.
 *  2. THE PATH TRAVELS ON THE SYSTEM-PROMPT CHANNEL, NOT IN THE CHAT MESSAGE.
 *     `bridgeAllowlist.ts:279` denies `artifacts.list` to a paired WebUI
 *     specifically because it "enumerates the absolute paths of every workspace
 *     the user has". Conversation reads stay ALLOWED, so putting the absolute
 *     staging path into the run's persisted message would re-disclose through
 *     the open channel exactly what the closed one was shut for. The message
 *     carries only the correction that defeats the already-seeded prompt.
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
import { buildEngineSpawnEnv } from '@process/agent/wcore/envBuilder';
import { listRuns, readLatest } from '@process/services/artifacts/artifactSeries';
import { artifactLedgerPath, readArtifactLedger } from '@process/services/artifacts/artifactLedger';
import { activeRunOutputDir, clearRunOutputDirs } from '@process/services/artifacts/runOutputDir';
import { readdirSync } from 'fs';
import { buildOutputDirective, resolveOutputDir } from '@process/agent/wcore/envBuilder';
import {
  ROUTINE_OUTPUT_DIR_SENTENCE,
  LEGACY_ROUTINE_OUTPUT_DIR_SENTENCE,
} from '@process/services/cron/BuiltinRoutinesSeeder';

const REPO_ROOT = pathMod.resolve(__dirname, '../../..');


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

/** What the stand-in agent does once the run's engine channels exist. */
type Agent = (channels: { env: Record<string, string>; directive: string }, workspace: string) => Promise<void>;

/**
 * Mirrors `WCoreAgent.start` exactly: ONE `resolveOutputDir` call feeds BOTH the
 * spawn env and the `--system-prompt` directive. Deriving it twice is the defect
 * this file exists to prevent, so the harness must not do it either.
 */
function makeHarness(workspace: string, onSpawn?: () => void) {
  const guard = new CronBusyGuard();
  let agent: Agent = async () => {};
  const sent: string[] = [];

  const buildTask = (conversationId: string) => ({
    type: 'wcore',
    workspace,
    sendMessage: vi.fn(async (payload: { content?: string }) => {
      sent.push(payload?.content ?? '');
      const engineOutputDir = resolveOutputDir(workspace, activeRunOutputDir(conversationId), conversationId);
      const env = buildEngineSpawnEnv({ providerEnv: {}, workspace, outputDir: activeRunOutputDir(conversationId) });
      await agent({ env, directive: buildOutputDirective(engineOutputDir) }, workspace);
    }),
  });
  const taskManager = {
    getTask: vi.fn(() => undefined),
    getOrBuildTask: vi.fn(async (conversationId: string) => {
      // The real spawn seam. `WCoreAgent.start` reads the run's output
      // directory HERE, so anything that can close or supersede the run's cell
      // in flight does it in this window.
      onSpawn?.();
      return buildTask(conversationId);
    }),
    kill: vi.fn(),
    buildConversation: vi.fn(),
  };
  const executor = new WorkerTaskManagerJobExecutor(taskManager as any, guard);

  async function run(job: CronJob, behaviour: Agent): Promise<string> {
    agent = behaviour;
    const conversationId = await executor.prepareConversation(job);
    await executor.executeJob(job, undefined, conversationId);
    guard.setProcessing(conversationId, false);
    await vi.waitFor(async () => {
      expect(guard.isProcessing(conversationId)).toBe(false);
    });
    await executor._whenSettledForTests();
    return conversationId;
  }

  return { run, sent, executor, guard };
}

const BODIES_DIR = pathMod.join(REPO_ROOT, 'src/process/resources/bundled-workflows/bodies');

/** Every fenced shell block in every bundled workflow body. */
function bundledShellBlocks(): Array<{ body: string; block: string }> {
  const out: Array<{ body: string; block: string }> = [];
  for (const entry of readdirSync(BODIES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = pathMod.join(BODIES_DIR, entry.name, 'SKILL.md');
    let markdown: string;
    try {
      markdown = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }
    for (const m of markdown.matchAll(/```(?:bash|sh|shell|zsh)\n([\s\S]*?)```/g)) {
      out.push({ body: entry.name, block: m[1] });
    }
  }
  return out;
}

/**
 * The shipped staging-directory block, verbatim.
 *
 * COVERAGE CHANGE: this used to select the block that ran `morning-report.mjs`,
 * a bundled Yahoo scanner that is now DELETED. The routine reads the user's own
 * chart over MCP and the MODEL writes the brief. The block that remains pins and
 * creates the staging directory - which is precisely the property this file is
 * about, so it is still executed below.
 */
function stagingDirBlock(): string {
  const markdown = readFileSync(pathMod.join(BODIES_DIR, 'wayland-morning-report/SKILL.md'), 'utf-8');
  const block = [...markdown.matchAll(/```(?:bash|sh|shell|zsh)\n([\s\S]*?)```/g)]
    .map((m) => m[1])
    .find((b) => b.includes('<deliverables_dir>') && b.includes('mkdir'));
  if (!block) {
    throw new Error('the morning-report SKILL.md no longer contains a staging-directory block');
  }
  return block;
}

/** The absolute deliverables directory the directive names - the model's only source for it. */
function deliverablesDirFromDirective(directive: string): string {
  const m = directive.match(/Deliverables you want the user to keep go in (.+?)\. Create that directory/);
  if (!m) throw new Error(`buildOutputDirective no longer names a directory: ${directive}`);
  return m[1];
}

describe('a scheduled run is told its deliverables directory in text it can actually read', () => {
  let documentsDir: string;
  let dataDir: string;
  let jobs: CronJob[];
  let service: CronService;

  beforeAll(async () => {
    documentsDir = await fsp.mkdtemp(pathMod.join(os.tmpdir(), 'wl-lit-docs-'));
    documentsDirRef.value = documentsDir;
  });
  afterAll(async () => {
    await fsp.rm(documentsDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    dataDir = await fsp.mkdtemp(pathMod.join(os.tmpdir(), 'wl-lit-data-'));
    dataPathRef.value = dataDir;
    conversationStore.clear();
    createConversationMock.mockClear();
    clearRunOutputDirs();
    jobs = [];
    service = makeService(jobs);
    await seedBuiltinRoutines(service);
  });

  afterEach(async () => {
    await fsp.rm(dataDir, { recursive: true, force: true });
    clearRunOutputDirs();
    vi.clearAllMocks();
  });

  async function enable(routineId: string): Promise<CronJob> {
    const seeded = jobs.find((j) => j.metadata.agentConfig?.configOptions?.routineId === routineId);
    if (!seeded) throw new Error(`routine ${routineId} was not seeded`);
    await service.updateJob(seeded.id, { enabled: true });
    return jobs.find((j) => j.id === seeded.id)!;
  }

  it('the SEEDED prompt no longer sends the model at an environment variable', async () => {
    const job = await enable('weekday-morning-report');
    // The retired sentence is gone from what a fresh install seeds...
    expect(job.target.payload.text).not.toContain(LEGACY_ROUTINE_OUTPUT_DIR_SENTENCE);
    expect(job.target.payload.text).not.toMatch(/named by the WAYLAND_OUTPUT_DIR environment variable/);
    // ...and the variable is now named only to be refused, which is what
    // actually defeats a model's prior. Deleting the mention would not.
    expect(job.target.payload.text).toMatch(/Do not read WAYLAND_OUTPUT_DIR/);
    // KNOWN-POSITIVE CONTROL: the prompt IS the seeder's, and it does still name
    // a destination - a prompt that said nothing at all would also pass above.
    expect(job.target.payload.text).toContain(ROUTINE_OUTPUT_DIR_SENTENCE);
    expect(ROUTINE_OUTPUT_DIR_SENTENCE).toMatch(/deliverables directory/i);
  });

  it('the RUN-TIME message defeats an old prompt that is already baked into the job row', async () => {
    // Sean's live `cron_jobs.prompt` still holds the old sentence and no
    // migration can be assumed, so the correction has to arrive at run time.
    const job = await enable('weekday-morning-report');
    job.target.payload.text = `Run it.\n\n${LEGACY_ROUTINE_OUTPUT_DIR_SENTENCE}`;
    const h = makeHarness(job.metadata.agentConfig!.workspace!);
    await h.run(job, async () => {});

    expect(h.sent).toHaveLength(1);
    expect(h.sent[0]).toContain('WAYLAND_OUTPUT_DIR is not visible to shell commands');
  });

  it('the run-time message does NOT carry the absolute staging path', async () => {
    // A conversation read is ALLOWED to a paired WebUI; `artifacts.list` is
    // denied precisely because it discloses absolute workspace paths. The path
    // rides the `--system-prompt` channel, which never enters the message store.
    const job = await enable('weekday-morning-report');
    const workspace = job.metadata.agentConfig!.workspace!;
    const h = makeHarness(workspace);
    let directive = '';
    await h.run(job, async (channels) => {
      directive = channels.directive;
    });

    const staging = deliverablesDirFromDirective(directive);
    expect(staging).toContain(`${pathMod.sep}.staging${pathMod.sep}`);
    // KNOWN-POSITIVE CONTROL: the directive really does carry it, so "the
    // message does not contain it" is a statement about the message.
    expect(directive).toContain(staging);
    expect(h.sent[0]).not.toContain(staging);
    expect(h.sent[0]).not.toContain(workspace);
  });

  it('refuses the run OUT LOUD when the single producer disagrees with the staging dir', async () => {
    // The inequality IS the signal the run cannot publish. Sending the turn
    // anyway is how a run writes into `artifacts/chat/<id>` and settles as
    // `no-output` with nothing anywhere naming the cause.
    //
    // Reproduced at the real seam: the run's cell is closed in the spawn
    // window - which is what a superseded run, a re-armed job, or a retry that
    // reuses the conversation actually does - so `activeRunOutputDir` comes back
    // undefined and `resolveOutputDir` selects the chat namespace instead.
    const job = await enable('weekday-morning-report');
    const workspace = job.metadata.agentConfig!.workspace!;
    const h = makeHarness(workspace, () => clearRunOutputDirs());
    const conversationId = await h.executor.prepareConversation(job);

    await expect(h.executor.executeJob(job, undefined, conversationId)).rejects.toThrow(
      /deliverables directory|cannot publish/i
    );
    expect(h.sent).toHaveLength(0);

    // ...and the failure is on the record, not in a console warning.
    const journal = pathMod.join(workspace, 'artifacts', 'market', '.runs.jsonl');
    expect(await fsp.readFile(journal, 'utf8')).toMatch(/"status":"failed"/);
  });

  it('a task that reports no workspace at all is left exactly as it behaves today', async () => {
    // Without a workspace there is nothing to resolve against, so refusing here
    // would be a guess rather than a reproduction of the spawn. Such a run keeps
    // its existing behaviour - it sends, and settles however it settles.
    const job = await enable('weekday-morning-report');
    const guard = new CronBusyGuard();
    const sent: string[] = [];
    const executor = new WorkerTaskManagerJobExecutor(
      {
        getTask: vi.fn(() => undefined),
        getOrBuildTask: vi.fn(async () => ({
          type: 'wcore',
          // no `workspace` key at all
          sendMessage: vi.fn(async (p: { content?: string }) => {
            sent.push(p?.content ?? '');
          }),
        })),
        kill: vi.fn(),
        buildConversation: vi.fn(),
      } as any,
      guard
    );
    const conversationId = await executor.prepareConversation(job);
    await expect(executor.executeJob(job, undefined, conversationId)).resolves.not.toThrow();
    expect(sent).toHaveLength(1);
    guard.setProcessing(conversationId, false);
    await executor._whenSettledForTests();
  });

  it('KNOWN-POSITIVE CONTROL: the same run with its cell intact is NOT refused', async () => {
    // Without this, a guard that refused every run would pass the test above.
    const job = await enable('weekday-morning-report');
    const h = makeHarness(job.metadata.agentConfig!.workspace!);
    await h.run(job, async () => {});
    expect(h.sent).toHaveLength(1);
  });

  it("the shipped skill's own command block pins the staging directory, with no env var", async () => {
    // PREMISE REWRITTEN, not repointed - say so plainly. This used to EXECUTE a
    // shipped command that produced the brief, and assert on what that command
    // wrote. No such command exists any more: the deleted scanner was the thing
    // that wrote, and a chart-driven run has the MODEL write instead.
    //
    // The property under test survives intact, because it was never about the
    // scanner: the staging directory must reach the run as LITERAL TEXT in the
    // directive, and never through an environment variable. So the shipped block
    // is still executed, still with `WAYLAND_OUTPUT_DIR` unset, and the brief is
    // then written where that block pinned - which is exactly what the model
    // does. If the body ever goes back to reading an env var, the substitution
    // assertion below fails.
    const job = await enable('weekday-morning-report');
    const workspace = job.metadata.agentConfig!.workspace!;
    const h = makeHarness(workspace);

    let staging = '';
    await h.run(job, async (channels, ws) => {
      staging = deliverablesDirFromDirective(channels.directive);
      const block = stagingDirBlock().split('<deliverables_dir>').join(staging);
      expect(block).not.toContain('<');
      execFileSync('bash', ['-c', block], {
        cwd: ws,
        // The engine's Bash tool does NOT forward WAYLAND_OUTPUT_DIR, so the
        // stand-in must not either. Passing it would test a channel the product
        // does not have.
        env: { ...process.env, WAYLAND_OUTPUT_DIR: undefined } as NodeJS.ProcessEnv,
        stdio: 'pipe',
      });
      writeFileSync(pathMod.join(staging, 'morning-brief.html'), '<html>Morning brief bar 2026-08-21</html>', 'utf-8');
    });

    const runs = await listRuns(pathMod.join(workspace, 'artifacts', 'market'));
    expect(runs).toHaveLength(1);
    expect(await fsp.readFile(pathMod.join(runs[0].runDir, 'morning-brief.html'), 'utf8')).toContain('bar 2026-08-21');
    expect(staging).toContain('.staging');
  });

  it('NO bundled workflow body reads $WAYLAND_OUTPUT_DIR in a shell block', () => {
    const blocks = bundledShellBlocks();
    // Floor: a scanner that finds nothing because it scanned nothing is not a
    // finding. Refuse to believe the zero until the corpus is real.
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    const offenders = blocks.filter((b) => /WAYLAND_OUTPUT_DIR/.test(b.block)).map((b) => b.body);
    expect(offenders).toEqual([]);

    // KNOWN-POSITIVE CONTROL: the same predicate on a planted occurrence.
    const planted = { body: 'planted', block: 'OUT="${WAYLAND_OUTPUT_DIR:-$PWD/x}"\n' };
    expect([planted].filter((b) => /WAYLAND_OUTPUT_DIR/.test(b.block)).map((b) => b.body)).toEqual(['planted']);

    // ...and the scanner really is reading the shipped corpus, not an empty one.
    expect(blocks.some((b) => b.body === 'wayland-morning-report')).toBe(true);
  });

  it('NO bundled workflow body tells a run to shell out to `open`', () => {
    const blocks = bundledShellBlocks();
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    // A run cannot open anything: the engine's Seatbelt profile blocks the
    // child's connection to launchservicesd, so `open` returns error -54. The
    // artifact card is the only thing that can put the brief in front of a human.
    const offenders = blocks.filter((b) => /(^|[;&|(\s])open\s+\S/m.test(b.block)).map((b) => b.body);
    expect(offenders).toEqual([]);

    const planted = { body: 'planted', block: 'open morning-brief.html\n' };
    expect([planted].filter((b) => /(^|[;&|(\s])open\s+\S/m.test(b.block)).map((b) => b.body)).toEqual(['planted']);
  });
});
