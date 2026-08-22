/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * LINK 1 OF THE MORNING-REPORT CHAIN: can a scheduled run reach its own scanner?
 *
 * A routine's workspace is a durable task folder the APP created
 * (`~/Documents/Wayland/Tasks/<name>`). `buildWorkspaceWidthFiles` infers
 * `customWorkspace = !!workspace`, so it comes out `true`, and
 * `setupWorkspaceSkills` returns early for a custom non-project workspace - the
 * folder gets no `.wayland-core/skills` at all. The engine sandboxes on the
 * workspace, so the bundled scanner (which lives in the app's config dir,
 * outside every workspace) is unreachable and the run dies on
 * `Glob refused: path ... is outside sandbox root`.
 *
 * NOTHING HERE IS HAND-BUILT. The job comes from the REAL `seedBuiltinRoutines`
 * reading the shipped `routines.json`; the extra bag comes from the REAL
 * `WorkerTaskManagerJobExecutor.buildConversationForJob`; and the conversation
 * factory is the REAL `createWCoreAgent` writing to a REAL filesystem with only
 * the app's storage directories redirected. A hand-copied extra bag is exactly
 * the fixture shape that let `tests/unit/execution/adapters.test.ts:43-47` stay
 * green through a real bug for months.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

/**
 * The app's storage roots, redirected into a temp tree. `market-open-report` is
 * seeded here as a NON-auto builtin exactly as it ships: it is not in `_builtin`,
 * so nothing places it unless the run asks for it by name.
 */
const roots = vi.hoisted(() => {
  const fs = require('fs');
  const os2 = require('os');
  const p = require('path');
  const base = fs.mkdtempSync(p.join(os2.tmpdir(), 'wl-cronskills-'));
  const builtin = p.join(base, 'builtin-skills');
  const auto = p.join(builtin, '_builtin');
  const user = p.join(base, 'skills');
  const system = p.join(base, 'system');
  const cronSkills = p.join(base, 'cron-skills');
  fs.mkdirSync(auto, { recursive: true });
  fs.mkdirSync(user, { recursive: true });
  fs.mkdirSync(system, { recursive: true });
  fs.mkdirSync(cronSkills, { recursive: true });
  // The real `_builtin` auto set on a shipped install: cron, office-cli,
  // skill-creator. `cron` is excluded for cron-spawned conversations; the other
  // two are placed unconditionally and are the whole of the unavoidable cost.
  for (const name of ['cron', 'office-cli', 'skill-creator']) {
    fs.mkdirSync(p.join(auto, name), { recursive: true });
    fs.writeFileSync(p.join(auto, name, 'SKILL.md'), `# ${name}\n`);
  }
  // A skill the user has installed but the routine does not declare. It must
  // NOT travel into ~/Documents on a schedule.
  fs.mkdirSync(p.join(builtin, 'star-office-helper'), { recursive: true });
  fs.writeFileSync(p.join(builtin, 'star-office-helper', 'SKILL.md'), '# undeclared\n');
  fs.mkdirSync(p.join(builtin, 'market-open-report', 'scripts'), { recursive: true });
  fs.mkdirSync(p.join(builtin, 'market-open-report', 'data'), { recursive: true });
  fs.writeFileSync(p.join(builtin, 'market-open-report', 'SKILL.md'), '# market-open-report\n');
  fs.writeFileSync(p.join(builtin, 'market-open-report', 'scripts', 'morning-report.mjs'), '// scanner\n');
  fs.writeFileSync(p.join(builtin, 'market-open-report', 'scripts', 'briefHtml.mjs'), '// html\n');
  fs.writeFileSync(p.join(builtin, 'market-open-report', 'data', 'TC-MASTER-WATCHLIST.csv'), 'SPY\n');
  return { base, builtin, auto, user, system, cronSkills };
});

/**
 * The connectors "installed" on this machine, as `mcp.config` really holds
 * them. Mutable so one test can prove the grant lands and another can prove a
 * disabled connector is refused, without either hand-writing an `extra` bag.
 */
const mcpConfigRef = vi.hoisted(() => ({ value: undefined as unknown }));

vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: () => roots.user,
  getBuiltinSkillsCopyDir: () => roots.builtin,
  getAutoSkillsDir: () => roots.auto,
  getSystemDir: () => ({ workDir: roots.system }),
  ProcessConfig: { get: vi.fn(async (key: string) => (key === 'mcp.config' ? mcpConfigRef.value : undefined)) },
  getCronSkillsDir: vi.fn(() => roots.cronSkills),
}));
vi.mock('@process/utils/openclawUtils', () => ({ computeOpenClawIdentityHash: async () => 'mock-hash' }));
vi.mock('@/process/services/cron/cronSkillFile', () => ({
  writeCronSkillFile: vi.fn(async () => 'mock/SKILL.md'),
  deleteCronSkillFile: vi.fn(async () => {}),
  hasCronSkillFile: vi.fn(async () => false),
  getCronSkillDir: vi.fn(() => require('path').join(roots.cronSkills, 'job')),
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

/**
 * The conversation factory is REAL. This mock is only the service shell around
 * it, and it reproduces `ConversationServiceImpl.createConversation`'s own
 * novel-key merge verbatim so a key the factory does not consume is persisted
 * onto `conversation.extra` here exactly as it is in production.
 */
const capturedParams: any[] = [];
const conversationStore = new Map<string, any>();
vi.mock('@process/services/conversationServiceSingleton', async () => {
  const { createWCoreAgent } = await import('@process/utils/initAgent');
  return {
    conversationServiceSingleton: {
      getConversation: vi.fn(async (id: string) => conversationStore.get(id)),
      createConversation: vi.fn(async (params: any) => {
        capturedParams.push(params);
        const conv: any = await createWCoreAgent(params);
        const factoryExtra = conv.extra as Record<string, unknown>;
        for (const [key, value] of Object.entries(params.extra ?? {})) {
          if (value !== undefined && !(key in factoryExtra)) factoryExtra[key] = value;
        }
        conv.id = `conv-${conversationStore.size}`;
        conv.name = params.name;
        conversationStore.set(conv.id, conv);
        return conv;
      }),
      updateConversation: vi.fn(async (id: string, patch: any) => {
        const conv = conversationStore.get(id);
        if (conv) conversationStore.set(id, { ...conv, ...patch });
      }),
      getConversationsByCronJob: vi.fn(async () => []),
    },
  };
});

const documentsDirRef = vi.hoisted(() => ({ value: '' }));
vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/mock/appPath', getPath: () => documentsDirRef.value },
  ipcMain: { handle: vi.fn(), on: vi.fn(), removeHandler: vi.fn() },
  powerMonitor: { on: vi.fn() },
}));

import fsp from 'fs/promises';
import os from 'os';
import path from 'path';

import { CronService } from '@/process/services/cron/CronService';
import { WorkerTaskManagerJobExecutor } from '@/process/services/cron/WorkerTaskManagerJobExecutor';
import { CronBusyGuard } from '@/process/services/cron/CronBusyGuard';
import type { CronJob } from '@/process/services/cron/CronStore';
import type { ICronRepository } from '@/process/services/cron/ICronRepository';
import type { ICronEventEmitter } from '@/process/services/cron/ICronEventEmitter';
import type { ICronJobExecutor } from '@/process/services/cron/ICronJobExecutor';
import type { IConversationRepository } from '@/process/services/database/IConversationRepository';
import { loadBundledRoutines, seedBuiltinRoutines } from '@process/services/cron/BuiltinRoutinesSeeder';
import { buildWCoreSessionMcpServers } from '@process/agent/acp/mcpSessionConfig';
import type { IMcpServer } from '@/common/mcp';

const MORNING_ROUTINE_ID = 'weekday-morning-report';

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

async function exists(p: string): Promise<boolean> {
  try {
    await fsp.stat(p);
    return true;
  } catch {
    return false;
  }
}

/** Seed the shipped routines, point the morning one at `workspace`, return it. */
async function seededMorningJob(workspace: string): Promise<CronJob> {
  const jobs: CronJob[] = [];
  const service = makeService(jobs);
  await seedBuiltinRoutines(service);
  const job = jobs.find((j) => j.metadata.agentConfig?.configOptions?.routineId === MORNING_ROUTINE_ID);
  if (!job) throw new Error(`${MORNING_ROUTINE_ID} was not seeded from the shipped routines.json`);
  job.metadata.agentConfig!.workspace = workspace;
  return job;
}

describe('a scheduled routine gets the skills its workflow declares', () => {
  let workspace: string;
  let dataDir: string;

  beforeEach(async () => {
    capturedParams.length = 0;
    conversationStore.clear();
    mcpConfigRef.value = undefined;
    workspace = await fsp.mkdtemp(path.join(os.tmpdir(), 'wl-taskroot-'));
    dataDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'wl-data-'));
    dataPathRef.value = dataDir;
    documentsDirRef.value = dataDir;
  });

  afterEach(async () => {
    await fsp.rm(workspace, { recursive: true, force: true });
    await fsp.rm(dataDir, { recursive: true, force: true });
  });

  it("places the workflow's declared scanner inside the task workspace", async () => {
    const job = await seededMorningJob(workspace);
    const executor = new WorkerTaskManagerJobExecutor(
      { getTask: vi.fn(), getOrBuildTask: vi.fn(), kill: vi.fn(), buildConversation: vi.fn() } as any,
      new CronBusyGuard()
    );

    await executor.prepareConversation(job);

    const skillsDir = path.join(workspace, '.wayland-core', 'skills');
    const scanner = path.join(skillsDir, 'market-open-report', 'scripts', 'morning-report.mjs');
    const watchlist = path.join(skillsDir, 'market-open-report', 'data', 'TC-MASTER-WATCHLIST.csv');

    expect(await exists(skillsDir)).toBe(true);
    expect(await exists(scanner)).toBe(true);
    expect(await exists(watchlist)).toBe(true);
    // The workflow BODY travels too: it is the only place the run instructions'
    // steps exist, and it lives in `bundled-workflows/`, outside every workspace.
    expect(await exists(path.join(skillsDir, 'wayland-morning-report', 'SKILL.md'))).toBe(true);

    // ...and NOTHING WIDER. `~/Documents` is a synced folder on a stock macOS,
    // so a scheduled job that copied the whole builtin-skills tree (or the
    // user's globally pinned skills) would be uploading them to a third party.
    expect((await fsp.readdir(skillsDir)).toSorted()).toEqual([
      'market-open-report',
      'office-cli',
      'skill-creator',
      'wayland-morning-report',
    ]);
  });

  it('does not write a managed .gitignore into the user’s own folder', async () => {
    const job = await seededMorningJob(workspace);
    const executor = new WorkerTaskManagerJobExecutor(
      { getTask: vi.fn(), getOrBuildTask: vi.fn(), kill: vi.fn(), buildConversation: vi.fn() } as any,
      new CronBusyGuard()
    );
    await executor.prepareConversation(job);
    expect(await exists(path.join(workspace, '.gitignore'))).toBe(false);
  });

  it('leaves customWorkspace TRUE, so Doctor still calls the task folder durable', async () => {
    // `customWorkspace:false` would place the skills too - and would also make
    // `workspaceChecks.ts:151` and `conciergeDiagServer.ts:1020` classify this
    // Documents folder as a temporary/default one and WARN the user to go set a
    // persistent workspace, and would blank the conversation's `desc`. Skill
    // placement must not be bought with a lie about what the folder is.
    const job = await seededMorningJob(workspace);
    const executor = new WorkerTaskManagerJobExecutor(
      { getTask: vi.fn(), getOrBuildTask: vi.fn(), kill: vi.fn(), buildConversation: vi.fn() } as any,
      new CronBusyGuard()
    );
    const conversationId = await executor.prepareConversation(job);
    const conv = conversationStore.get(conversationId);
    expect(conv.extra.customWorkspace).toBe(true);
    expect(conv.desc).toBe(workspace);
  });

  it('scopes every user MCP connector OUT of the unattended run', async () => {
    // A scheduled run is acquired with `{ yoloMode: true }`, i.e. blanket
    // auto-approve. `isServerActiveForSession` treats an ABSENT selection as
    // "every enabled server, with its FULL tool inventory" - so an unattended
    // 07:00 job inherits every connector the user has, mutating tools included,
    // with no human at the keyboard. `[]` is the documented way to scope them
    // out, and this chain is proven to need none.
    const job = await seededMorningJob(workspace);
    const executor = new WorkerTaskManagerJobExecutor(
      { getTask: vi.fn(), getOrBuildTask: vi.fn(), kill: vi.fn(), buildConversation: vi.fn() } as any,
      new CronBusyGuard()
    );
    const conversationId = await executor.prepareConversation(job);
    const conv = conversationStore.get(conversationId);

    const userServer = {
      id: 'tvcontrol',
      name: 'tvcontrol',
      enabled: true,
      status: 'connected',
      transport: { type: 'stdio', command: 'bun', args: [] },
    } as unknown as IMcpServer;

    // Through the REAL selector the wcore launch profile uses.
    const selected = buildWCoreSessionMcpServers([userServer], conv.extra.activeMcpServers);
    expect(selected.map((s) => s.name)).toEqual([]);

    // KNOWN-POSITIVE CONTROL: the same selector, same server, with no selection
    // - which is what the cron bag sends today - DOES hand it to the engine. If
    // this ever goes red the assertion above is measuring nothing.
    expect(buildWCoreSessionMcpServers([userServer], undefined).map((s) => s.name)).toEqual(['tvcontrol']);
  });

  it('grants the ONE connector the shipped morning routine names, and nothing else', async () => {
    // B9. The run's shell has no network at all - measured on the pinned
    // v0.13.4 engine, where `sandbox exec` answers `curl: (6) Could not resolve
    // host` for Yahoo, refuses raw-IP TCP, and refuses 127.0.0.1:9222, while
    // the identical curl on the host returns http=429. So the morning brief has
    // no data route unless a connector is granted. This is that grant, read out
    // of the SHIPPED routines.json rather than a fixture.
    const routines = (await loadBundledRoutines()) ?? [];
    const morning = routines.find((r) => r.id === MORNING_ROUTINE_ID);
    expect(morning?.connectors).toEqual(['com.ferroxlabs/tvcontrol']);

    // ...and it is the ONLY routine that names anything. A grant that spread to
    // the other twelve would re-create the posture the narrowing removed.
    expect(routines.filter((r) => Array.isArray(r.connectors) && r.connectors.length > 0).map((r) => r.id)).toEqual([
      MORNING_ROUTINE_ID,
    ]);
  });

  it('hands the declared connector to the run, through the REAL executor', async () => {
    // End to end: the shipped routines.json declaration, the real seeder, the
    // real `buildConversationForJob`, and the real wcore launch selector.
    mcpConfigRef.value = [
      {
        id: 'srv-tv',
        name: 'tvcontrol',
        enabled: true,
        status: 'connected',
        libraryEntryId: 'com.ferroxlabs/tvcontrol',
        transport: { type: 'stdio', command: 'bun', args: ['x', '@ferroxlabs/tvcontrol@2.3.1'] },
        createdAt: 0,
        updatedAt: 0,
        originalJson: '{}',
      },
      {
        id: 'srv-slack',
        name: 'slack',
        enabled: true,
        status: 'connected',
        libraryEntryId: 'com.slack/slack-mcp',
        transport: { type: 'stdio', command: 'bun', args: [] },
        createdAt: 0,
        updatedAt: 0,
        originalJson: '{}',
      },
    ];

    const job = await seededMorningJob(workspace);
    const executor = new WorkerTaskManagerJobExecutor(
      { getTask: vi.fn(), getOrBuildTask: vi.fn(), kill: vi.fn(), buildConversation: vi.fn() } as any,
      new CronBusyGuard()
    );
    const conversationId = await executor.prepareConversation(job);
    const conv = conversationStore.get(conversationId);

    expect(conv.extra.activeMcpServers).toEqual(['srv-tv']);
    const selected = buildWCoreSessionMcpServers(mcpConfigRef.value as IMcpServer[], conv.extra.activeMcpServers);
    expect(selected.map((s) => s.name)).toEqual(['tvcontrol']);
    // Slack is enabled, connected and installed, and the run must NOT get it.
    expect(selected.map((s) => s.name)).not.toContain('slack');
  });

  it('grants nothing to a routine that names no connector, even with tvcontrol installed', async () => {
    // The default is unchanged for the other twelve routines. Same installed
    // connectors, a routine that declares none, and the run still gets `[]`.
    mcpConfigRef.value = [
      {
        id: 'srv-tv',
        name: 'tvcontrol',
        enabled: true,
        status: 'connected',
        libraryEntryId: 'com.ferroxlabs/tvcontrol',
        transport: { type: 'stdio', command: 'bun', args: [] },
        createdAt: 0,
        updatedAt: 0,
        originalJson: '{}',
      },
    ];

    const jobs: CronJob[] = [];
    const service = makeService(jobs);
    await seedBuiltinRoutines(service);
    const other = jobs.find((j) => j.metadata.agentConfig?.configOptions?.routineId === 'weekly-support-review');
    if (!other) throw new Error('weekly-support-review was not seeded from the shipped routines.json');
    other.metadata.agentConfig!.workspace = workspace;

    const executor = new WorkerTaskManagerJobExecutor(
      { getTask: vi.fn(), getOrBuildTask: vi.fn(), kill: vi.fn(), buildConversation: vi.fn() } as any,
      new CronBusyGuard()
    );
    const conversationId = await executor.prepareConversation(other);
    const conv = conversationStore.get(conversationId);

    expect(conv.extra.activeMcpServers).toEqual([]);
    expect(
      buildWCoreSessionMcpServers(mcpConfigRef.value as IMcpServer[], conv.extra.activeMcpServers).map((s) => s.name)
    ).toEqual([]);
  });

  it('refuses the grant when the declared connector is installed but DISABLED', async () => {
    mcpConfigRef.value = [
      {
        id: 'srv-tv',
        name: 'tvcontrol',
        enabled: false,
        status: 'connected',
        libraryEntryId: 'com.ferroxlabs/tvcontrol',
        transport: { type: 'stdio', command: 'bun', args: [] },
        createdAt: 0,
        updatedAt: 0,
        originalJson: '{}',
      },
    ];

    const job = await seededMorningJob(workspace);
    const executor = new WorkerTaskManagerJobExecutor(
      { getTask: vi.fn(), getOrBuildTask: vi.fn(), kill: vi.fn(), buildConversation: vi.fn() } as any,
      new CronBusyGuard()
    );
    const conversationId = await executor.prepareConversation(job);
    expect(conversationStore.get(conversationId).extra.activeMcpServers).toEqual([]);
  });
});
