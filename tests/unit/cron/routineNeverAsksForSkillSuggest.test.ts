/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * B15a - A ROUTINE WAS ASKED TO INVENT ITS OWN SKILL FILE, AND THE REFUSAL
 * LANDED IN THE USER\'S MORNING REPORT.
 *
 * `needsSkillSuggest` is true for any `new_conversation` job with a workspace
 * and no `hasCronSkillFile(job.id)`. That predicate checks
 * `getCronSkillsDir()/<jobId>/SKILL.md` - the file the USER saves with "Turn
 * into skill". A seeded builtin routine never has one, because its instructions
 * arrive by a completely different mechanism: `resolveRoutineSkillDirs
 * (configOptions.routineId)` copies the authored workflow body into the
 * workspace. So the executor asked a routine that already HAS a fully authored
 * body to write itself a skill file, the safe-write guard correctly refused,
 * and the refusal surfaced as noise at the end of the report.
 *
 * `routineId` is the discriminator and it is already on the job object.
 *
 * NOT the fix: widening `hasCronSkillFile` to look in the routine dirs. That
 * conflates two different files and would break the "Turn into skill" path,
 * which is why the user-cron control below is mandatory rather than decorative
 * - without it, deleting the feature outright passes this file.
 *
 * The harness is the one from `cronWorkspaceSkillPlacement.test.ts`: the REAL
 * seeder over the shipped `routines.json`, the REAL `buildConversationForJob`,
 * the REAL executor, and a capturing `sendMessage` reading the prompt the
 * engine would actually have received.
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

import { skillSuggestWatcher } from '@process/services/cron/SkillSuggestWatcher';

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

/** The task the executor sends into, capturing the prompt verbatim. */
function capturingTaskManager(sent: string[], workspace: string) {
  const task = {
    // LOAD-BEARING. `needsSkillSuggest` reads the workspace off the TASK, not
    // off the job, so a task without one makes the whole predicate false and
    // this file would pass while measuring nothing. The control below is what
    // caught that.
    workspace,
    sendMessage: vi.fn(async (m: { content: string }) => {
      sent.push(m.content);
    }),
    ensureYoloMode: vi.fn(async () => true),
    setMode: vi.fn(async () => true),
    setConfigOptions: vi.fn(async () => true),
    setModel: vi.fn(async () => true),
  };
  return {
    manager: {
      getTask: vi.fn(() => undefined),
      getOrBuildTask: vi.fn(async () => task),
      kill: vi.fn(),
      buildConversation: vi.fn(),
    } as any,
    task,
  };
}

/** A plain user cron - no `routineId` anywhere. The control. */
function userCronJob(workspace: string, conversationId: string): CronJob {
  return {
    id: 'user-cron-1',
    name: 'My own daily thing',
    enabled: true,
    schedule: { expression: '0 9 * * *', description: 'every day at 9', timezone: 'local' },
    target: {
      executionMode: 'new_conversation',
      payload: { text: 'Summarise my inbox and save a note.' },
    },
    metadata: {
      conversationId,
      agentConfig: {
        backend: 'wcore',
        name: 'wcore',
        workspace,
        configOptions: {},
      },
    },
  } as unknown as CronJob;
}

describe('a seeded routine is never asked to write its own SKILL_SUGGEST', () => {
  let workspace: string;
  let dataDir: string;

  beforeEach(async () => {
    capturedParams.length = 0;
    conversationStore.clear();
    mcpConfigRef.value = undefined;
    vi.mocked(skillSuggestWatcher.register).mockClear();
    workspace = await fsp.mkdtemp(path.join(os.tmpdir(), 'wl-b15-ws-'));
    dataDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'wl-b15-data-'));
    dataPathRef.value = dataDir;
    documentsDirRef.value = dataDir;
  });

  afterEach(async () => {
    await fsp.rm(workspace, { recursive: true, force: true });
    await fsp.rm(dataDir, { recursive: true, force: true });
  });

  it("does not put SKILL_SUGGEST.md in the shipped morning routine's prompt", async () => {
    const job = await seededMorningJob(workspace);
    const sent: string[] = [];
    const { manager } = capturingTaskManager(sent, workspace);
    const executor = new WorkerTaskManagerJobExecutor(manager, new CronBusyGuard());

    const conversationId = await executor.prepareConversation(job);
    job.metadata.conversationId = conversationId;
    await executor.executeJob(job);

    expect(sent.length).toBe(1);
    expect(sent[0]).not.toContain('SKILL_SUGGEST');
    expect(skillSuggestWatcher.register).not.toHaveBeenCalled();
  });

  it('CONTROL: a plain user cron with no routineId still gets the SKILL_SUGGEST ask', async () => {
    // Without this, deleting the feature outright passes the test above.
    const seeded = await seededMorningJob(workspace);
    const conversationId = seeded.metadata.conversationId;
    const job = userCronJob(workspace, conversationId);

    const sent: string[] = [];
    const { manager } = capturingTaskManager(sent, workspace);
    const executor = new WorkerTaskManagerJobExecutor(manager, new CronBusyGuard());

    const convId = await executor.prepareConversation(job);
    job.metadata.conversationId = convId;
    await executor.executeJob(job);

    expect(sent.length).toBe(1);
    expect(sent[0]).toContain('SKILL_SUGGEST');
  });
});
