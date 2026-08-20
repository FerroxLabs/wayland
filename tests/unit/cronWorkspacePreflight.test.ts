/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * P2-10 - missing / replaced workspace handling.
 *
 * `agentConfig.workspace` is validated nowhere and `WCoreManager` has no mkdir
 * or existsSync at all, so a scheduled run against a folder the user deleted
 * behaves however the engine happens to behave, and a run against a folder the
 * user REPLACED writes into a stranger's directory. Neither is acceptable for
 * an unattended daily job: it holds the user's reports.
 *
 * So: stat before every run, compare the identity marker, and on missing or
 * mismatched fail the run closed. Never silently resurrect the folder - a
 * recreated empty workspace looks identical to one whose history was lost - and
 * never silently write into a folder whose marker does not match.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: vi.fn(() => '/mock/userData'),
    getAppPath: vi.fn(() => '/mock/appPath'),
  },
  ipcMain: { handle: vi.fn(), on: vi.fn(), removeHandler: vi.fn() },
  powerMonitor: { on: vi.fn() },
}));
vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    power: { preventSleep: vi.fn(() => 1), allowSleep: vi.fn() },
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
vi.mock('@process/utils', () => ({ copyFilesToDirectory: vi.fn(async () => {}) }));
vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      responseStream: { emit: vi.fn() },
      listChanged: { emit: vi.fn() },
    },
  },
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => undefined) },
  getCronSkillsDir: vi.fn(() => '/mock/cronSkills'),
}));
vi.mock('@/process/services/cron/cronSkillFile', () => ({
  writeCronSkillFile: vi.fn(async () => '/mock/cronSkills/job/SKILL.md'),
  deleteCronSkillFile: vi.fn(async () => {}),
  hasCronSkillFile: vi.fn(async () => false),
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
  skillSuggestWatcher: { watch: vi.fn(), stop: vi.fn() },
}));
vi.mock('@process/task/AcpSkillManager', () => ({
  AcpSkillManager: {
    getInstance: () => ({
      discoverSkills: vi.fn(async () => {}),
      getSkillsIndex: () => [],
    }),
  },
}));

// The executor lazy-imports the conversation service singleton to break a
// circular dependency; stand in an in-memory implementation.
const conversationStore = new Map<string, any>();
const createConversationMock = vi.fn(async (params: any) => {
  // Mirror the real factories: an empty `extra.workspace` becomes a throwaway
  // `<agent>-temp-<ts>` directory, which is exactly the failure symptom.
  const id = `conv-created-${conversationStore.size}`;
  const workspace = params.extra?.workspace ? params.extra.workspace : `/tmp/wcore-temp-${Date.now()}`;
  const conv = {
    id,
    type: params.type,
    name: params.name,
    createTime: Date.now(),
    modifyTime: Date.now() + 1000,
    model: params.model,
    // wcore's factory whitelist drops `backend`; ConversationServiceImpl then
    // merges back only the keys the factory did not produce.
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
    // Production ordering: `getConversationsByCronJobId` is `ORDER BY created_at DESC`.
    getConversationsByCronJob: vi.fn(async (cronJobId: string) =>
      [...conversationStore.values()]
        .filter((c) => c.extra?.cronJobId === cronJobId)
        .sort((a, b) => b.createTime - a.createTime)
    ),
  },
}));
import os from 'os';
import pathMod from 'path';
import fsp from 'fs/promises';
import { existsSync } from 'fs';
import { WorkerTaskManagerJobExecutor } from '@/process/services/cron/WorkerTaskManagerJobExecutor';
import type { CronJob } from '@/process/services/cron/CronStore';
import { preflightJobWorkspace } from '@/process/services/cron/durableTaskWorkspace';
import { buildWorkspaceMarker, writeWorkspaceMarker } from '@process/services/workspaceIdentity';
import { asCronWorkspaceError } from '@process/bridge/cronWorkspaceError';

let tmp: string;

function makeTaskJob(agentConfig: CronJob['metadata']['agentConfig']): CronJob {
  return {
    id: 'job-brief',
    name: 'Morning Brief',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 7 * * *', description: 'every day at 7:00' },
    target: { payload: { kind: 'message', text: 'brief me' }, executionMode: 'new_conversation' },
    metadata: {
      conversationId: '',
      agentType: 'wcore' as CronJob['metadata']['agentType'],
      createdBy: 'agent',
      createdAt: 1000,
      updatedAt: 1000,
      agentConfig,
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3 },
  };
}

beforeEach(async () => {
  tmp = await fsp.mkdtemp(pathMod.join(os.tmpdir(), 'wl-p210-'));
  conversationStore.clear();
  createConversationMock.mockClear();
});
afterEach(async () => {
  await fsp.rm(tmp, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe('P2-10 preflightJobWorkspace', () => {
  it('passes a durable workspace whose marker still matches', async () => {
    const ws = pathMod.join(tmp, 'Morning Brief');
    await fsp.mkdir(ws);
    const marker = buildWorkspaceMarker({ ownerKind: 'task', ownerId: 'job-brief', displayName: 'Morning Brief' });
    await writeWorkspaceMarker(ws, marker);

    const result = await preflightJobWorkspace(
      makeTaskJob({ backend: 'wcore', name: 'Morning Brief', workspace: ws, workspaceId: marker.workspaceId })
    );
    expect(result).toBe(null);
  });

  it('reports the deleted folder without recreating it', async () => {
    const ws = pathMod.join(tmp, 'Deleted Brief');
    const result = await preflightJobWorkspace(
      makeTaskJob({ backend: 'wcore', name: 'Morning Brief', workspace: ws, workspaceId: 'ws-1' })
    );
    expect(result?.status).toBe('missing');
    expect(result?.workspace).toBe(ws);
    expect(existsSync(ws)).toBe(false);
  });

  it('reports a folder the user replaced with something else', async () => {
    const ws = pathMod.join(tmp, 'Replaced');
    await fsp.mkdir(ws);
    await writeWorkspaceMarker(
      ws,
      buildWorkspaceMarker({ ownerKind: 'project', ownerId: 'p-other', displayName: 'Somebody Else' })
    );
    const result = await preflightJobWorkspace(
      makeTaskJob({ backend: 'wcore', name: 'Morning Brief', workspace: ws, workspaceId: 'ws-ours' })
    );
    expect(result?.status).toBe('mismatch');
  });

  it('reports a folder that lost its marker entirely', async () => {
    const ws = pathMod.join(tmp, 'Unmarked');
    await fsp.mkdir(ws);
    const result = await preflightJobWorkspace(
      makeTaskJob({ backend: 'wcore', name: 'Morning Brief', workspace: ws, workspaceId: 'ws-ours' })
    );
    expect(result?.status).toBe('unmarked');
  });

  it('invents no failure for a workspace allocated before markers existed', async () => {
    const ws = pathMod.join(tmp, 'Legacy');
    await fsp.mkdir(ws);
    const result = await preflightJobWorkspace(makeTaskJob({ backend: 'wcore', name: 'x', workspace: ws }));
    expect(result).toBe(null);
  });

  it('has nothing to check when the job names no workspace', async () => {
    expect(await preflightJobWorkspace(makeTaskJob({ backend: 'wcore', name: 'x' }))).toBe(null);
    expect(await preflightJobWorkspace(makeTaskJob(undefined))).toBe(null);
  });
});

describe('P2-10 the run refuses to start', () => {
  function makeExecutor() {
    const getOrBuildTask = vi.fn();
    const executor = new WorkerTaskManagerJobExecutor(
      { getTask: vi.fn(), getOrBuildTask, kill: vi.fn(), buildConversation: vi.fn() } as any,
      { isProcessing: vi.fn(() => false), setProcessing: vi.fn(), onceIdle: vi.fn() } as any
    );
    return { executor, getOrBuildTask };
  }

  it('throws instead of running, and neither resurrects the folder nor builds a conversation', async () => {
    const ws = pathMod.join(tmp, 'Gone');
    const { executor, getOrBuildTask } = makeExecutor();
    const job = makeTaskJob({ backend: 'wcore', name: 'Morning Brief', workspace: ws, workspaceId: 'ws-1' });

    await expect(executor.executeJob(job)).rejects.toThrow(/workspace/i);

    expect(existsSync(ws)).toBe(false);
    expect(createConversationMock).not.toHaveBeenCalled();
    expect(getOrBuildTask).not.toHaveBeenCalled();
  });

  it('refuses at prepareConversation too, so "Run now" fails before a chat is created', async () => {
    // runNow calls prepareConversation FIRST and returns its conversation id to
    // the renderer, then fires executeJob in the background. Guarding only
    // executeJob would leave an orphan conversation behind and report the
    // failure to nobody.
    const ws = pathMod.join(tmp, 'Gone Too');
    const { executor } = makeExecutor();
    const job = makeTaskJob({ backend: 'wcore', name: 'Morning Brief', workspace: ws, workspaceId: 'ws-1' });

    await expect(executor.prepareConversation(job)).rejects.toThrow(/workspace/i);
    expect(createConversationMock).not.toHaveBeenCalled();
    expect(existsSync(ws)).toBe(false);
  });

  /**
   * H1 - the refusal has to survive the trip to the renderer.
   *
   * These throws are what the cron bridge converts into a RESOLVED
   * `{ ok: false, errorCode, path }` payload, because `buildProvider`'s
   * `invoke` has no reject channel: an unclassified `Error` carrying only a
   * localized sentence would collapse to the catch-all code and the renderer
   * could not tell "folder gone" from "folder replaced" - which is the whole
   * difference the three-option message is written around.
   */
  it('classifies a missing workspace so the bridge can render the right message', async () => {
    const ws = pathMod.join(tmp, 'Gone Classified');
    const { executor } = makeExecutor();
    const job = makeTaskJob({ backend: 'wcore', name: 'Morning Brief', workspace: ws, workspaceId: 'ws-1' });

    const thrown = await executor.prepareConversation(job).then(
      () => null,
      (error: unknown) => error
    );

    const classified = asCronWorkspaceError(thrown);
    expect(classified).not.toBeNull();
    expect(classified!.code).toBe('workspace_missing');
    expect(classified!.path).toBe(ws);
    expect(classified!.message).toContain('workspaceMissing');
  });

  it('classifies a replaced workspace under its own code', async () => {
    const ws = pathMod.join(tmp, 'Stranger Classified');
    await fsp.mkdir(ws);
    await writeWorkspaceMarker(
      ws,
      buildWorkspaceMarker({ ownerKind: 'project', ownerId: 'p-other', displayName: 'Tax Returns' })
    );
    const { executor } = makeExecutor();
    const job = makeTaskJob({ backend: 'wcore', name: 'Morning Brief', workspace: ws, workspaceId: 'ws-ours' });

    const thrown = await executor.executeJob(job).then(
      () => null,
      (error: unknown) => error
    );

    const classified = asCronWorkspaceError(thrown);
    expect(classified).not.toBeNull();
    expect(classified!.code).toBe('workspace_mismatch');
    expect(classified!.path).toBe(ws);
  });

  it('refuses to write into a folder whose marker belongs to someone else', async () => {
    const ws = pathMod.join(tmp, 'Stranger');
    await fsp.mkdir(ws);
    await writeWorkspaceMarker(
      ws,
      buildWorkspaceMarker({ ownerKind: 'project', ownerId: 'p-other', displayName: 'Tax Returns' })
    );
    const { executor, getOrBuildTask } = makeExecutor();
    const job = makeTaskJob({ backend: 'wcore', name: 'Morning Brief', workspace: ws, workspaceId: 'ws-ours' });

    await expect(executor.executeJob(job)).rejects.toThrow(/workspace/i);
    expect(getOrBuildTask).not.toHaveBeenCalled();
    expect(await fsp.readdir(ws)).toEqual(['.wayland-workspace.json']);
  });
});
