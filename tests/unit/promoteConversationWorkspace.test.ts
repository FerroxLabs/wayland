/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * P2-4 promotion protocol. The allocator, the identity marker, the journal, the
 * copier and the filesystem are all real; only Electron's `app.getPath`, the
 * cron repository and the conversation store are stood in.
 *
 * The two tests that matter are the ones that lose data when they fail:
 * a crash between the allocation and the copy, and a source file that changes
 * while it is being copied.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import os from 'os';
import path from 'path';
import fsp from 'fs/promises';
import { existsSync } from 'fs';

const documentsDirRef = vi.hoisted(() => ({ value: '' }));
vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/mock/appPath', getPath: () => documentsDirRef.value },
}));

import { allocateWorkspace } from '@process/services/projectWorkspace';
import { readWorkspaceMarker, WORKSPACE_MARKER_FILE } from '@process/services/workspaceIdentity';
import { PromotionJournal, promotionKey, type PromotionRecord } from '@process/services/promotion/promotionJournal';
import { isPromotionInProgress } from '@process/services/promotion/promotionLock';
import {
  promoteConversationWorkspace,
  type PromotionDeps,
} from '@process/services/promotion/promoteConversationWorkspace';
import type { CronJob } from '@process/services/cron/CronStore';

let root: string;
let documentsDir: string;
let tempWorkRoot: string;
let journal: PromotionJournal;

const CONV = 'conv-smart-trader';
const JOB = 'job-smart-trader';

type Conversation = { id: string; extra: Record<string, unknown> };

let conversations: Map<string, Conversation>;
let job: CronJob | null;
let enabledCalls: Array<{ jobId: string; enabled: boolean }>;
let busyQueue: boolean[];
let allocateCalls: string[];

function makeJob(overrides: Partial<CronJob['metadata']['agentConfig']> = {}): CronJob {
  return {
    id: JOB,
    name: 'Smart Trader',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 7 * * *', description: '0 7 * * *' },
    target: { payload: { kind: 'message', text: 'run it' }, executionMode: 'existing' },
    metadata: {
      conversationId: CONV,
      agentType: 'wcore' as CronJob['metadata']['agentType'],
      createdBy: 'agent',
      createdAt: 1,
      updatedAt: 1,
      // A chat-propose job as CronService.init() leaves it: a backfilled
      // agentConfig carrying a backend and NO workspace.
      agentConfig: { backend: 'wcore' as CronJob['metadata']['agentType'], name: 'Smart Trader', ...overrides },
    },
    state: { runCount: 2, retryCount: 0, maxRetries: 3 },
  };
}

function makeDeps(over: Partial<PromotionDeps> = {}): PromotionDeps {
  return {
    journal,
    getJob: async (jobId) => (job && job.id === jobId ? job : null),
    setJobEnabled: async (jobId, enabled) => {
      enabledCalls.push({ jobId, enabled });
      if (job) job = { ...job, enabled };
    },
    isConversationBusy: () => (busyQueue.length ? (busyQueue.shift() as boolean) : false),
    getConversation: async (id) => conversations.get(id),
    updateConversation: async (id, patch) => {
      const conv = conversations.get(id);
      if (conv) conversations.set(id, { ...conv, extra: patch.extra });
    },
    allocate: async (displayName, options) => {
      allocateCalls.push(displayName);
      return allocateWorkspace(displayName, options);
    },
    sleep: async () => {},
    ...over,
  };
}

/** A `*-temp-*` workspace holding two runs' worth of real output. */
async function makeTempWorkspace(name = `wcore-temp-${Date.now()}`): Promise<string> {
  const ws = path.join(tempWorkRoot, name);
  await fsp.mkdir(path.join(ws, 'artifacts'), { recursive: true });
  await fsp.writeFile(path.join(ws, 'artifacts', 'monday.md'), '# Monday', 'utf8');
  await fsp.writeFile(path.join(ws, 'watchlist.json'), '["AAPL"]', 'utf8');
  await fsp.mkdir(path.join(ws, '.wayland-core', 'skills', 'market'), { recursive: true });
  await fsp.writeFile(path.join(ws, '.wayland-core', 'skills', 'market', 'SKILL.md'), 'machinery', 'utf8');
  return ws;
}

// `defaultWorkspaceBaseDir` memoises `app.getPath('documents')` for the process
// lifetime, so the fake Documents folder has to be stable for the whole file;
// only its `Wayland` subtree is reset per test.
let documentsRoot: string;
beforeAll(async () => {
  documentsRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'wl-promote-docs-'));
  documentsDir = path.join(documentsRoot, 'Documents');
  await fsp.mkdir(documentsDir, { recursive: true });
  documentsDirRef.value = documentsDir;
});
afterAll(async () => {
  await fsp.rm(documentsRoot, { recursive: true, force: true });
});

beforeEach(async () => {
  root = await fsp.mkdtemp(path.join(os.tmpdir(), 'wl-promote-'));
  tempWorkRoot = path.join(root, 'work');
  await fsp.rm(path.join(documentsDir, 'Wayland'), { recursive: true, force: true });
  await fsp.mkdir(tempWorkRoot, { recursive: true });
  journal = new PromotionJournal(path.join(root, 'promotions.json'));
  conversations = new Map();
  job = makeJob();
  enabledCalls = [];
  busyQueue = [];
  allocateCalls = [];
});

afterEach(async () => {
  await fsp.rm(root, { recursive: true, force: true });
});

describe('promotion of an existing chat', () => {
  it('copies the workspace into Documents and points the conversation at it', async () => {
    const source = await makeTempWorkspace();
    conversations.set(CONV, { id: CONV, extra: { workspace: source, customWorkspace: true, backend: undefined } });

    const outcome = await promoteConversationWorkspace({ conversationId: CONV, jobId: JOB }, makeDeps());

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.workspace).toBe(path.join(documentsDir, 'Wayland', 'Tasks', 'Smart Trader'));
    expect(await fsp.readFile(path.join(outcome.workspace, 'artifacts', 'monday.md'), 'utf8')).toBe('# Monday');
    // Machinery is not user content and must not be uploaded to iCloud per task.
    expect(existsSync(path.join(outcome.workspace, '.wayland-core'))).toBe(false);
    // Rule 9: the source is left completely intact.
    expect(await fsp.readFile(path.join(source, 'artifacts', 'monday.md'), 'utf8')).toBe('# Monday');
    expect(existsSync(path.join(source, '.wayland-core', 'skills', 'market', 'SKILL.md'))).toBe(true);

    // Rule 7: commit is ONE write, onto the conversation.
    const conv = conversations.get(CONV)!;
    expect(conv.extra.workspace).toBe(outcome.workspace);
    expect(conv.extra.customWorkspace).toBe(true);
    const marker = await readWorkspaceMarker(outcome.workspace);
    expect(conv.extra.workspaceId).toBe(marker!.workspaceId);
    expect(marker!.ownerKind).toBe('task');
    // The job keeps stating no workspace: the conversation is the source of truth.
    expect(job!.metadata.agentConfig!.workspace).toBeUndefined();
    // No staging directory survives.
    expect((await fsp.readdir(path.join(documentsDir, 'Wayland', 'Tasks'))).toSorted()).toEqual(['Smart Trader']);
  });

  it('resumes after a crash mid-copy instead of allocating a second folder', async () => {
    const source = await makeTempWorkspace();
    conversations.set(CONV, { id: CONV, extra: { workspace: source, customWorkspace: true } });

    // Reproduce the state the app dies in: the target allocated and journalled,
    // a half-written staging tree, nothing committed.
    const allocated = await allocateWorkspace('Smart Trader', { ownerKind: 'task', ownerId: JOB });
    const operationId = 'op-crashed';
    const stagingDir = `${allocated.dir}.promoting-${operationId}`;
    await fsp.mkdir(path.join(stagingDir, 'artifacts'), { recursive: true });
    await fsp.writeFile(path.join(stagingDir, 'artifacts', 'monday.md'), '# Mon', 'utf8');
    const crashed: PromotionRecord = {
      schemaVersion: 1,
      key: promotionKey(CONV, JOB),
      operationId,
      conversationId: CONV,
      jobId: JOB,
      sourceWorkspace: source,
      targetWorkspace: allocated.dir,
      stagingDir,
      workspaceId: allocated.marker!.workspaceId,
      state: 'staged',
      startedAtMs: 1,
    };
    await journal.write(crashed);

    const outcome = await promoteConversationWorkspace({ conversationId: CONV, jobId: JOB }, makeDeps());

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    // THE assertion: the crashed attempt's folder is reused, not orphaned.
    expect(outcome.workspace).toBe(allocated.dir);
    expect(allocateCalls).toEqual([]);
    expect((await fsp.readdir(path.join(documentsDir, 'Wayland', 'Tasks'))).toSorted()).toEqual(['Smart Trader']);
    // And the half-written tree was replaced, not merged into.
    expect(await fsp.readFile(path.join(outcome.workspace, 'artifacts', 'monday.md'), 'utf8')).toBe('# Monday');
    expect(await fsp.readFile(path.join(outcome.workspace, 'watchlist.json'), 'utf8')).toBe('["AAPL"]');
    expect((await journal.read(promotionKey(CONV, JOB)))!.state).toBe('committed');
  });

  it('resumes after a crash between the rename and the commit', async () => {
    const source = await makeTempWorkspace();
    conversations.set(CONV, { id: CONV, extra: { workspace: source, customWorkspace: true } });

    // The published tree is already in place; only the conversation write is
    // missing. Re-copying would hit "target is not empty" and abort a promotion
    // that had actually succeeded.
    const allocated = await allocateWorkspace('Smart Trader', { ownerKind: 'task', ownerId: JOB });
    await fsp.cp(path.join(source, 'artifacts'), path.join(allocated.dir, 'artifacts'), { recursive: true });
    await journal.write({
      schemaVersion: 1,
      key: promotionKey(CONV, JOB),
      operationId: 'op-published',
      conversationId: CONV,
      jobId: JOB,
      sourceWorkspace: source,
      targetWorkspace: allocated.dir,
      stagingDir: `${allocated.dir}.promoting-op-published`,
      workspaceId: allocated.marker!.workspaceId,
      state: 'copied',
      startedAtMs: 1,
    });

    const outcome = await promoteConversationWorkspace({ conversationId: CONV, jobId: JOB }, makeDeps());

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.workspace).toBe(allocated.dir);
    expect(allocateCalls).toEqual([]);
    expect(conversations.get(CONV)!.extra.workspace).toBe(allocated.dir);
    expect((await journal.read(promotionKey(CONV, JOB)))!.state).toBe('committed');
  });

  it('is idempotent: a second accept returns the first result and allocates nothing', async () => {
    const source = await makeTempWorkspace();
    conversations.set(CONV, { id: CONV, extra: { workspace: source, customWorkspace: true } });

    const first = await promoteConversationWorkspace({ conversationId: CONV, jobId: JOB }, makeDeps());
    const second = await promoteConversationWorkspace({ conversationId: CONV, jobId: JOB }, makeDeps());

    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.workspace).toBe(first.workspace);
    expect(second.alreadyPromoted).toBe(true);
    expect(allocateCalls).toEqual(['Smart Trader']);
    expect((await fsp.readdir(path.join(documentsDir, 'Wayland', 'Tasks'))).toSorted()).toEqual(['Smart Trader']);
  });

  it('fences the scheduler for the duration and restores the job afterwards', async () => {
    const source = await makeTempWorkspace();
    conversations.set(CONV, { id: CONV, extra: { workspace: source, customWorkspace: true } });
    let lockedDuringCopy: boolean | null = null;
    let jobEnabledDuringCopy: boolean | null = null;

    await promoteConversationWorkspace(
      { conversationId: CONV, jobId: JOB },
      makeDeps({
        allocate: async (displayName, options) => {
          allocateCalls.push(displayName);
          lockedDuringCopy = isPromotionInProgress(CONV);
          jobEnabledDuringCopy = job!.enabled;
          return allocateWorkspace(displayName, options);
        },
      })
    );

    expect(lockedDuringCopy).toBe(true);
    expect(jobEnabledDuringCopy).toBe(false);
    expect(isPromotionInProgress(CONV)).toBe(false);
    expect(enabledCalls).toEqual([
      { jobId: JOB, enabled: false },
      { jobId: JOB, enabled: true },
    ]);
    expect(job!.enabled).toBe(true);
  });

  it('refuses when an in-flight run will not drain, and leaves the job armed', async () => {
    const source = await makeTempWorkspace();
    conversations.set(CONV, { id: CONV, extra: { workspace: source, customWorkspace: true } });
    const deps = makeDeps({ isConversationBusy: () => true, drainTimeoutMs: 5, sleep: async () => {} });

    const outcome = await promoteConversationWorkspace({ conversationId: CONV, jobId: JOB }, deps);

    expect(outcome).toEqual({ ok: false, refusal: 'run-in-flight' });
    expect(job!.enabled).toBe(true);
    expect(existsSync(path.join(documentsDir, 'Wayland'))).toBe(false);
  });

  it('rule 8: refuses a workspace the user actually chose', async () => {
    const chosen = path.join(root, 'MyStuff');
    await fsp.mkdir(chosen, { recursive: true });
    conversations.set(CONV, { id: CONV, extra: { workspace: chosen, customWorkspace: true } });

    const outcome = await promoteConversationWorkspace({ conversationId: CONV, jobId: JOB }, makeDeps());

    expect(outcome).toEqual({ ok: false, refusal: 'user-chosen-workspace' });
    expect(allocateCalls).toEqual([]);
  });

  it('refuses when the job names its own workspace, so commit stays one write', async () => {
    const source = await makeTempWorkspace();
    conversations.set(CONV, { id: CONV, extra: { workspace: source, customWorkspace: true } });
    job = makeJob({ workspace: '/somewhere/else' });

    const outcome = await promoteConversationWorkspace({ conversationId: CONV, jobId: JOB }, makeDeps());

    expect(outcome).toEqual({ ok: false, refusal: 'job-owns-workspace' });
    expect(allocateCalls).toEqual([]);
  });

  it('aborts on an escaping symlink without burning the folder name', async () => {
    const source = await makeTempWorkspace();
    await fsp.writeFile(path.join(root, 'secret.txt'), 'not yours', 'utf8');
    await fsp.symlink(path.join(root, 'secret.txt'), path.join(source, 'leak'));
    conversations.set(CONV, { id: CONV, extra: { workspace: source, customWorkspace: true } });

    await expect(promoteConversationWorkspace({ conversationId: CONV, jobId: JOB }, makeDeps())).rejects.toThrow(
      /escapes the workspace/
    );

    // Nothing half-copied is left behind, and the name is free for the retry.
    expect(existsSync(path.join(documentsDir, 'Wayland', 'Tasks', 'Smart Trader'))).toBe(false);
    expect(await fsp.readdir(path.join(documentsDir, 'Wayland', 'Tasks'))).toEqual([]);
    expect((await journal.read(promotionKey(CONV, JOB)))!.state).toBe('aborted');
    expect(isPromotionInProgress(CONV)).toBe(false);
    expect(job!.enabled).toBe(true);

    // The retry lands on the real name, not `Smart Trader (2)`.
    await fsp.rm(path.join(source, 'leak'));
    const retry = await promoteConversationWorkspace({ conversationId: CONV, jobId: JOB }, makeDeps());
    expect(retry.ok && retry.workspace).toBe(path.join(documentsDir, 'Wayland', 'Tasks', 'Smart Trader'));
  });

  it('survives a source file being appended while it is copied', async () => {
    const source = await makeTempWorkspace();
    conversations.set(CONV, { id: CONV, extra: { workspace: source, customWorkspace: true } });
    const growing = path.join(source, 'artifacts', 'monday.md');

    let appends = 0;
    const outcome = await promoteConversationWorkspace(
      { conversationId: CONV, jobId: JOB },
      makeDeps({
        copyOptions: {
          quiesceMs: 0,
          hooks: {
            afterCopyAttempt: async (rel) => {
              if (rel === 'artifacts/monday.md' && appends < 1) {
                appends += 1;
                await fsp.appendFile(growing, '\nappended mid-copy\n', 'utf8');
              }
            },
          },
        },
      })
    );

    expect(appends).toBe(1);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(await fsp.readFile(path.join(outcome.workspace, 'artifacts', 'monday.md'), 'utf8')).toBe(
      await fsp.readFile(growing, 'utf8')
    );
    expect((await journal.read(promotionKey(CONV, JOB)))!.state).toBe('committed');
  });

  it('publishes a tree carrying its own identity marker', async () => {
    const source = await makeTempWorkspace();
    conversations.set(CONV, { id: CONV, extra: { workspace: source, customWorkspace: true } });

    const outcome = await promoteConversationWorkspace({ conversationId: CONV, jobId: JOB }, makeDeps());
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(existsSync(path.join(outcome.workspace, WORKSPACE_MARKER_FILE))).toBe(true);
    const marker = await readWorkspaceMarker(outcome.workspace);
    expect(marker!.ownerId).toBe(JOB);
    expect(outcome.workspaceId).toBe(marker!.workspaceId);
  });
});
