/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * LINK 6: THE HUMAN CLICKS, AND THE BRIEF OPENS IN A BROWSER.
 *
 * This is the link that has never been demonstrated. Everything upstream of it
 * has a test; the last inch - a published deliverable turning into a path the OS
 * default handler is actually asked to open - did not, and a run that cannot be
 * opened is the exact complaint the night is for: "it made a real brief and I
 * could not open it".
 *
 * NOTHING IS SHORT-CIRCUITED. The job comes from the REAL seeder reading the
 * shipped `routines.json`; enabling it allocates a REAL durable workspace on a
 * REAL filesystem; the turn runs the shipped SKILL.md's own command block
 * through `bash`, resolving its destination the only way the product lets it
 * (out of the `--system-prompt` deliverables directive); publication is the REAL
 * `commitTaskRun` writing the REAL ledger; and the open is the REAL
 * `openArtifact` with the REAL `confinePath` and the REAL type gate. Only the
 * final `shell.openPath` is a recorder - so "it opened" means the launcher was
 * handed one specific absolute file, and the assertions can say which.
 *
 * BOTH PATHS ARE PROVEN. A run that reaches real data publishes a card that
 * opens, and a run whose data is unreachable publishes NOTHING, keeps the
 * tombstone, and does not report `ok`. A chain that only ever shows the happy
 * path is how "it ran fine" was printed over a run that produced nothing for a
 * day.
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
  // `confinePath` seeds the app's static roots from here. Pointing it at the
  // same temp data dir keeps the confinement REAL without letting the test's
  // roots leak into the host's.
  getTempPath: () => require('path').join(dataPathRef.value, 'temp'),
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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
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
import { listRuns } from '@process/services/artifacts/artifactSeries';
import { artifactLedgerPath, readArtifactLedger } from '@process/services/artifacts/artifactLedger';
import { activeRunOutputDir, clearRunOutputDirs } from '@process/services/artifacts/runOutputDir';
import { buildOutputDirective, resolveOutputDir } from '@process/agent/wcore/envBuilder';
import { openArtifact, describeArtifactOpenTarget } from '@process/services/artifacts/artifactActions';
import { confinePath, registerAuthorizedRoot } from '@process/bridge/pathConfinement';
import { readRunJournal } from '@process/services/artifacts/artifactRunJournal';
import type { ArtifactHostEffects } from '@process/services/artifacts/artifactActions';


const REPO_ROOT = pathMod.resolve(__dirname, '../../..');
const SCANNER_REL = '.wayland-core/skills/market-open-report';

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

function makeService(jobs: CronJob[], executor?: ICronJobExecutor): CronService {
  return new CronService(
    makeRepo(jobs),
    {
      emitJobCreated: vi.fn(),
      emitJobUpdated: vi.fn(),
      emitJobRemoved: vi.fn(),
      emitJobExecuted: vi.fn(),
      showNotification: vi.fn(async () => {}),
    } as unknown as ICronEventEmitter,
    executor ??
      ({
        isConversationBusy: vi.fn(() => false),
        executeJob: vi.fn(async () => {}),
        onceIdle: vi.fn(),
        setProcessing: vi.fn(),
      } as unknown as ICronJobExecutor),
    {
      getConversation: vi.fn(async () => undefined),
      updateConversation: vi.fn(),
      getConversationsByCronJob: vi.fn(async () => []),
    } as unknown as IConversationRepository
  );
}



/** What the stand-in agent does once the run's engine channels exist. */
type Agent = (directive: string, workspace: string) => Promise<void>;

function makeHarness(workspace: string) {
  const guard = new CronBusyGuard();
  let agent: Agent = async () => {};

  const buildTask = (conversationId: string) => ({
    type: 'wcore',
    workspace,
    sendMessage: vi.fn(async () => {
      // Mirrors `WCoreAgent.start`: ONE `resolveOutputDir` call, threaded into
      // the `--system-prompt` directive the agent reads.
      const engineOutputDir = resolveOutputDir(workspace, activeRunOutputDir(conversationId), conversationId);
      await agent(buildOutputDirective(engineOutputDir), workspace);
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
    await vi.waitFor(async () => {
      expect(guard.isProcessing(conversationId)).toBe(false);
    });
    await executor._whenSettledForTests();
    return conversationId;
  }

  return { run, executor, guard };
}

const BODIES_DIR = pathMod.join(REPO_ROOT, 'src/process/resources/bundled-workflows/bodies');

/** The scanner-running block out of the shipped morning-report body, verbatim. */
function scanCommandBlock(): string {
  const markdown = readFileSync(pathMod.join(BODIES_DIR, 'wayland-morning-report/SKILL.md'), 'utf-8');
  const block = [...markdown.matchAll(/```(?:bash|sh|shell|zsh)\n([\s\S]*?)```/g)]
    .map((m) => m[1])
    .find((b) => b.includes('morning-report.mjs'));
  if (!block) throw new Error('the morning-report SKILL.md no longer contains a scan command block');
  return block;
}

/** The absolute deliverables directory the run's own directive names. */
function deliverablesDirFromDirective(directive: string): string {
  const m = directive.match(/Deliverables you want the user to keep go in (.+?)\. Create that directory/);
  if (!m) throw new Error(`buildOutputDirective no longer names a directory: ${directive}`);
  return m[1];
}

/**
 * Stand-ins for the two bundled node scripts, at the workspace-relative path the
 * skill `cd`s into.
 *
 * `reachable` is the whole point of the pair. With data, they produce a real
 * standalone HTML brief. Without it, the scanner reports what it could not reach
 * and writes NOTHING - which is the honest-tombstone path the run must keep.
 */
function installScannerStubs(workspace: string, reachable: boolean): void {
  const scripts = pathMod.join(workspace, SCANNER_REL, 'scripts');
  mkdirSync(scripts, { recursive: true });
  writeFileSync(
    pathMod.join(scripts, 'morning-report.mjs'),
    reachable
      ? [
          "import { writeFileSync } from 'fs';",
          "const i = process.argv.indexOf('--json');",
          "if (i < 0) { console.error('no --json'); process.exit(2); }",
          'writeFileSync(process.argv[i + 1], JSON.stringify({ bar: process.env.FAKE_BAR, rows: [["SPY", 512.3]] }));',
          "console.log('74 names scanned');",
        ].join('\n')
      : [
          // Exit non-zero and write nothing at all: the shape of a run whose
          // upstream is unreachable.
          "console.error('NO DATA (74) - upstream unreachable');",
          "console.log('0 names scanned');",
          'process.exit(1);',
        ].join('\n'),
    'utf-8'
  );
  writeFileSync(
    pathMod.join(scripts, 'briefHtml.mjs'),
    [
      "import { readFileSync, writeFileSync } from 'fs';",
      "const data = JSON.parse(readFileSync(process.argv[2], 'utf8'));",
      'writeFileSync(',
      '  process.argv[3],',
      '  `<!doctype html><html><body><h1>TC-TIDE MORNING REPORT   Tier 1   bar ${data.bar}</h1>` +',
      "    `<table><tr><td>${data.rows[0][0]}</td><td>${data.rows[0][1]}</td></tr></table></body></html>`",
      ');',
    ].join('\n'),
    'utf-8'
  );
}

/**
 * The agent: run the shipped block, substituting the one placeholder out of the
 * directive. The engine's env is NOT forwarded - the engine runs Bash tool calls
 * through a 19-name allowlist, so a stand-in that passed WAYLAND_OUTPUT_DIR
 * through would be exercising a channel the product does not have.
 */
function runShippedBlock(bar: string): Agent {
  return async (directive, ws) => {
    const block = scanCommandBlock().split('<deliverables_dir>').join(deliverablesDirFromDirective(directive));
    expect(block).not.toContain('<');
    try {
      execFileSync('bash', ['-c', block], {
        cwd: ws,
        env: { ...process.env, WAYLAND_OUTPUT_DIR: undefined, FAKE_BAR: bar } as NodeJS.ProcessEnv,
        stdio: 'pipe',
      });
    } catch {
      // A non-zero scanner exit is a real outcome the workflow classifies as
      // "empty" and reports. It is not a test failure - what the run does NEXT
      // is what this file is about.
    }
  };
}

describe('the brief a scheduled run produces can actually be opened', () => {
  let documentsDir: string;
  let dataDir: string;
  let jobs: CronJob[];
  let service: CronService;
  let ledger: string;

  beforeAll(async () => {
    documentsDir = await fsp.mkdtemp(pathMod.join(os.tmpdir(), 'wl-open-docs-'));
    documentsDirRef.value = documentsDir;
    // The one thing a test must do that the app does at boot: the user's
    // Documents tree is an app root. Registering it makes the confinement check
    // in `openArtifact` REAL here rather than a pass-through.
    registerAuthorizedRoot(documentsDir);
  });
  afterAll(async () => {
    await fsp.rm(documentsDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    dataDir = await fsp.mkdtemp(pathMod.join(os.tmpdir(), 'wl-open-data-'));
    dataPathRef.value = dataDir;
    ledger = artifactLedgerPath(dataDir);
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

  /**
   * The real host effects, with only the OS launcher replaced by a recorder.
   * `confine` is the REAL `confinePath`, so a target outside the authorized
   * roots is refused here exactly as it is in the product.
   */
  function buildEffects() {
    const launch = vi.fn(async () => ({ ok: true as const }));
    const effects: ArtifactHostEffects = {
      readLedger: () => readArtifactLedger(ledger),
      readLedgerEntries: async () => (await readArtifactLedger(ledger)).map((record) => ({ record })) as never,
      confine: (target: string) => confinePath(target),
      launch,
      reveal: vi.fn(async () => ({ ok: true as const })),
      chooseSaveDestination: vi.fn(async () => null),
    } as unknown as ArtifactHostEffects;
    return { effects, launch };
  }

  it('LINK 6: the published brief is handed to the OS opener as one real HTML file', async () => {
    const job = await enable('weekday-morning-report');
    const workspace = job.metadata.agentConfig!.workspace!;
    expect(workspace.startsWith(documentsDir)).toBe(true);
    installScannerStubs(workspace, true);

    const h = makeHarness(workspace);
    await h.run(job, runShippedBlock('2026-08-21'));

    // LINK 5: it is in the ledger, under this job. This file has never been
    // written on the machine the bug was found on, so its existence is the proof.
    const records = await readArtifactLedger(ledger);
    const brief = records.find((r) => pathMod.basename(r.relativePath) === 'morning-brief.html');
    expect(brief, `ledger holds ${JSON.stringify(records.map((r) => r.relativePath))}`).toBeDefined();
    expect(brief!.taskId).toBe(job.id);

    // LINK 6: the real open path, id -> ledger -> confinement -> type gate -> OS.
    const { effects, launch } = buildEffects();
    const result = await openArtifact(brief!.artifactId, effects);

    expect(result.ok).toBe(true);
    expect(launch).toHaveBeenCalledTimes(1);
    const opened = launch.mock.calls[0][0] as unknown as string;
    expect(pathMod.isAbsolute(opened)).toBe(true);
    expect(pathMod.basename(opened)).toBe('morning-brief.html');

    // ...and it is a real brief, not an empty file with the right name.
    const html = await fsp.readFile(opened, 'utf8');
    expect(html).toContain('TC-TIDE MORNING REPORT');
    expect(html).toContain('bar 2026-08-21');
    expect(html.length).toBeGreaterThan(80);

    // The card's label resolves too, so the button is not a bare "Open" on a
    // target the gate would have refused.
    const target = await describeArtifactOpenTarget(brief!.artifactId, effects, async () => 'Safari');
    expect(target.applicationName).toBe('Safari');
  });

  it('KNOWN-NEGATIVE CONTROL: the opener path really is confined', async () => {
    // Without this the `confine` effect could be doing nothing and the test
    // above would still pass. Two refusals the real function must make, using
    // a directory that exists and is under NO authorized root. (The OS temp
    // dir is itself a root - `seedStaticRoots` adds it - so a temp path is not
    // a valid negative here, which is exactly the kind of control that looks
    // like it bites and does not.)
    expect(await confinePath('/private/etc/morning-brief.html')).toBeNull();

    // ...and a traversal out of an authorized root is refused in its own right.
    const traversal = pathMod.join(documentsDir, '..', '..', '..', 'etc', 'morning-brief.html');
    expect(await confinePath(traversal)).toBeNull();

    // KNOWN-POSITIVE CONTROL for the control: a real path inside the root passes.
    expect(await confinePath(pathMod.join(documentsDir, 'morning-brief.html'))).not.toBeNull();
  });

  it('HONEST EMPTY RUN: unreachable data publishes nothing and opens nothing', async () => {
    const job = await enable('weekday-morning-report');
    const workspace = job.metadata.agentConfig!.workspace!;
    installScannerStubs(workspace, false);

    const h = makeHarness(workspace);
    await h.run(job, runShippedBlock('2026-08-21'));

    // Nothing was invented: no brief anywhere in the series, nothing in the
    // ledger, so there is no card and nothing to open.
    expect(await readArtifactLedger(ledger)).toEqual([]);
    const seriesDir = pathMod.join(workspace, 'artifacts', 'market');
    expect(await listRuns(seriesDir)).toEqual([]);
    expect(existsSync(pathMod.join(seriesDir, 'morning-brief.html'))).toBe(false);

    // But it is NOT silent. The run says what it could not reach.
    const journal = await readRunJournal(seriesDir);
    expect(journal).toHaveLength(1);
    expect(journal[0].status).toBe('no-output');
    expect(journal[0].taskId).toBe(job.id);
  });

  it('a run that published nothing does not leave the task reporting ok', async () => {
    // `cron_jobs` read `last_status='ok'` for a run whose `.runs.jsonl` read
    // `no-output`, in all three profiles. The job ledger and the artifact
    // journal disagreed, so nothing in the scheduled-tasks UI could tell the
    // user the routine had never once produced a report - which is why this went
    // unnoticed for a day.
    const job = await enable('weekday-morning-report');
    const workspace = job.metadata.agentConfig!.workspace!;
    installScannerStubs(workspace, false);

    const h = makeHarness(workspace);
    await h.run(job, runShippedBlock('2026-08-21'));

    const settled = await h.executor.lastRunSettlement(job.id);
    expect(settled).toBeDefined();
    expect(settled!.published).toBe(false);
    expect(settled!.reason).toBe('no-output');
  });

  it('L2-6: CronService downgrades last_status for a run that published nothing', async () => {
    // The accessor above is only half the fix. This drives the REAL
    // `CronService.runNow` against the REAL executor, so the assertion is about
    // the row the scheduled-tasks UI actually reads.
    const job = await enable('weekday-morning-report');
    const workspace = job.metadata.agentConfig!.workspace!;
    installScannerStubs(workspace, false);

    const guard = new CronBusyGuard();
    const executor = new WorkerTaskManagerJobExecutor(
      {
        getTask: vi.fn(() => undefined),
        getOrBuildTask: vi.fn(async (conversationId: string) => ({
          type: 'wcore',
          workspace,
          sendMessage: vi.fn(async () => {
            const dir = resolveOutputDir(workspace, activeRunOutputDir(conversationId), conversationId);
            await runShippedBlock('2026-08-21')(buildOutputDirective(dir), workspace);
          }),
        })),
        kill: vi.fn(),
        buildConversation: vi.fn(),
      } as any,
      guard
    );
    const live = makeService(jobs, executor);

    const conversationId = await live.runNow(job.id);
    await vi.waitFor(() => expect(guard.isProcessing(conversationId)).toBe(true));
    guard.setProcessing(conversationId, false);
    await executor._whenSettledForTests();

    await vi.waitFor(async () => {
      const row = jobs.find((j) => j.id === job.id)!;
      // THE BROKEN STATE was `'ok'` here, over a run whose own journal said
      // `no-output`.
      expect(row.state.lastStatus).toBe('error');
      expect(row.state.lastError).toMatch(/produced no deliverable|nothing was published/i);
    });
  });

  it('KNOWN-POSITIVE CONTROL: the same accessor reports a run that DID publish', async () => {
    const job = await enable('weekday-morning-report');
    const workspace = job.metadata.agentConfig!.workspace!;
    installScannerStubs(workspace, true);

    const h = makeHarness(workspace);
    await h.run(job, runShippedBlock('2026-08-21'));

    const settled = await h.executor.lastRunSettlement(job.id);
    expect(settled).toBeDefined();
    expect(settled!.published).toBe(true);
    expect(settled!.reason).toBeUndefined();
  });
});
