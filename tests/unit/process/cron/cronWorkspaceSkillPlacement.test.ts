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
  // The skill the morning routine ACTUALLY declares (`depends: morning-prep`),
  // seeded exactly as it ships: one SKILL.md, no `scripts/`, no `data/`.
  fs.mkdirSync(p.join(builtin, 'morning-prep'), { recursive: true });
  fs.writeFileSync(p.join(builtin, 'morning-prep', 'SKILL.md'), '# morning-prep\n');
  // The DELETED Yahoo scanner, seeded here ON PURPOSE even though it no longer
  // ships. Leaving it on disk is what makes "the scanner does not travel" a real
  // assertion instead of a vacuous one: the copy step can SEE it and must still
  // not take it, because the routine no longer declares it. If someone ever
  // re-adds `market-open-report` to `depends`, this test fails loudly.
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

  it("places the workflow's declared skill inside the task workspace", async () => {
    // COVERAGE CHANGE, stated plainly: this used to assert that an executable
    // scanner (`market-open-report/scripts/morning-report.mjs`) and its data
    // file (`data/TC-MASTER-WATCHLIST.csv`) landed here. That skill is DELETED -
    // the routine now reads the user's own chart over MCP instead of running a
    // bundled Yahoo scanner - so "a scheduled run carries an executable plus its
    // data" is a capability that no longer exists and can no longer be covered.
    //
    // What survives is the capability that actually matters and is still live:
    // the workflow's DECLARED skill (`depends: morning-prep`) is placed into the
    // task workspace, the workflow BODY travels with it, and NOTHING WIDER is
    // copied. That last assertion is a privacy guard, not a tidiness one - see
    // the comment below - and it is the reason this test is repointed rather
    // than deleted.
    const job = await seededMorningJob(workspace);
    const executor = new WorkerTaskManagerJobExecutor(
      { getTask: vi.fn(), getOrBuildTask: vi.fn(), kill: vi.fn(), buildConversation: vi.fn() } as any,
      new CronBusyGuard()
    );

    await executor.prepareConversation(job);

    const skillsDir = path.join(workspace, '.wayland-core', 'skills');
    // `depends: morning-prep` in bundled-workflows/index.json. morning-prep
    // ships exactly one file, so its SKILL.md IS the whole declared skill.
    const declaredSkill = path.join(skillsDir, 'morning-prep', 'SKILL.md');

    expect(await exists(skillsDir)).toBe(true);
    expect(await exists(declaredSkill)).toBe(true);
    // The deleted scanner must NOT reappear: if a stale copy is ever vendored
    // back in, the run would silently prefer a Yahoo scan over the real chart.
    expect(await exists(path.join(skillsDir, 'market-open-report'))).toBe(false);
    // The workflow BODY travels too: it is the only place the run instructions'
    // steps exist, and it lives in `bundled-workflows/`, outside every workspace.
    expect(await exists(path.join(skillsDir, 'wayland-morning-report', 'SKILL.md'))).toBe(true);

    // ...and NOTHING WIDER. `~/Documents` is a synced folder on a stock macOS,
    // so a scheduled job that copied the whole builtin-skills tree (or the
    // user's globally pinned skills) would be uploading them to a third party.
    expect((await fsp.readdir(skillsDir)).toSorted()).toEqual([
      'morning-prep',
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

  it('NO shipped routine names a connector, so an unattended run is granted nothing', async () => {
    // POLICY ASSERTION - and the policy CHANGED under it, so read this before
    // touching it. It has now been retargeted twice and both moves are recorded
    // here deliberately, because a reader who assumes the current shape was
    // always the shape will "fix" it back into a hole.
    //
    // ROUND 1 (historical): this asserted `connectors === ['com.ferroxlabs/tvcontrol']`.
    // It was retargeted to `[]` in favour of a host-side `prefetch` that pulled
    // daily bars in the MAIN process, outside the seatbelt, for a bundled Yahoo
    // scanner to read.
    //
    // ROUND 2 (this change): THAT SCANNER AND THAT PREFETCH ARE BOTH DELETED.
    // The routine now reads the user's OWN chart over MCP instead of scraping
    // Yahoo, so there is no prefetch left to point at - which is why the old
    // known-positive control (`prefetch === 'market-daily-bars'`) had to be
    // replaced rather than kept.
    //
    // WHY THE ANSWER IS STILL `[]`, even though the routine now genuinely wants
    // chart access: the grant is SERVER-level, not per-tool. `toWCoreConfig`
    // emits no tool key and the engine's curation is `off | top_k`, a ranking -
    // so naming tvcontrol hands an unattended `{yoloMode:true}` 07:00 run its
    // WHOLE tool inventory, including `watchlist_remove_bulk`, `alert_delete`,
    // `draw_clear`, `pine_save` and `tv_launch`, against a real trading account,
    // with model behaviour as the only thing in between.
    //
    // Shipping the grant now and mitigating it later is backwards, so this lands
    // with the grant ABSENT. The connector is added back only in the SAME change
    // that gives TVControl a read-only mode, and at that point this assertion is
    // rewritten a third time to demand the read-only entry SPECIFICALLY. Until
    // then, the honest state is that a scheduled run cannot read a chart.
    //
    // The grant MECHANISM is untouched and still fully covered by
    // `routineConnectorAllowlist.test.ts` over a fixture declaration; what is
    // asserted here is only that nothing SHIPPED opts into it.
    const routines = (await loadBundledRoutines()) ?? [];
    const morning = routines.find((r) => r.id === MORNING_ROUTINE_ID);
    expect(morning, 'the morning routine must still ship').toBeTruthy();

    // KNOWN POSITIVE, and it has to be here: every assertion below passes
    // vacuously against `undefined`, so a typo'd id or a corpus that failed to
    // load would read as "no routine names a connector" - the exact false green
    // this control exists to refuse. These two fields are the routine's
    // identity, so they cannot rot the way `prefetch` did.
    expect(morning?.workflow).toBe('wayland-morning-report');
    expect(morning?.schedule).toBe('0 7 * * 1-5');

    expect(morning?.connectors ?? []).toEqual([]);
    expect(routines.filter((r) => Array.isArray(r.connectors) && r.connectors.length > 0).map((r) => r.id)).toEqual([]);
  });

  it('hands the shipped morning run NOTHING, through the REAL executor, with tvcontrol installed', async () => {
    // RETARGETED alongside the corpus assertion above, to the safety property
    // rather than the grant. Same end-to-end chain - the shipped routines.json,
    // the real seeder, the real `buildConversationForJob`, the real wcore
    // launch selector - and the same two installed connectors. What changed is
    // that the shipped routine declares none, so an unattended 07:00 run gets
    // neither of them. The grant path itself keeps its coverage in
    // `routineConnectorAllowlist.test.ts`, over a fixture declaration.
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

    expect(conv.extra.activeMcpServers).toEqual([]);
    const selected = buildWCoreSessionMcpServers(mcpConfigRef.value as IMcpServer[], conv.extra.activeMcpServers);
    expect(selected.map((s) => s.name)).toEqual([]);

    // KNOWN-POSITIVE CONTROL, and the reason the empty array above means
    // something: the SAME selector over the SAME two installed connectors, with
    // no selection - which is what a cron bag sent before this narrowing - hands
    // the engine both of them.
    expect(buildWCoreSessionMcpServers(mcpConfigRef.value as IMcpServer[], undefined).map((s) => s.name)).toEqual([
      'tvcontrol',
      'slack',
    ]);
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
