/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The service layer's one security property: the renderer sends IDs, and main
 * resolves every filesystem path from the job's own conversations. A
 * conversation id the job does not own must not be able to aim the copy.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import os from 'os';
import path from 'path';
import fsp from 'fs/promises';
import { existsSync } from 'fs';

const documentsDirRef = vi.hoisted(() => ({ value: '' }));
const configDirRef = vi.hoisted(() => ({ value: '' }));
vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/mock/appPath', getPath: () => documentsDirRef.value },
}));
// The journal lives under the real config dir. Without this the suite writes
// into the developer's own ~/.wayland-*/config and the committed record makes
// the NEXT run short-circuit as already-promoted.
vi.mock('@process/utils', () => ({ getConfigPath: () => configDirRef.value }));

const state = vi.hoisted(() => ({
  jobs: new Map<string, any>(),
  conversations: new Map<string, any>(),
  updates: [] as Array<{ id: string; extra: Record<string, unknown> }>,
  enabled: [] as Array<{ jobId: string; enabled: boolean }>,
}));

vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: {
    getJob: async (id: string) => state.jobs.get(id) ?? null,
    updateJob: async (jobId: string, updates: any) => {
      state.enabled.push({ jobId, enabled: updates.enabled });
      const job = state.jobs.get(jobId);
      if (job) state.jobs.set(jobId, { ...job, ...updates });
    },
  },
}));
vi.mock('@process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: { isProcessing: () => false },
}));
vi.mock('@process/services/conversationServiceSingleton', () => ({
  conversationServiceSingleton: {
    getConversation: async (id: string) => state.conversations.get(id),
    updateConversation: async (id: string, patch: any) => {
      state.updates.push({ id, extra: patch.extra });
      const conv = state.conversations.get(id);
      if (conv) state.conversations.set(id, { ...conv, extra: patch.extra });
    },
    getConversationsByCronJob: async (jobId: string) =>
      [...state.conversations.values()].filter((c) => c.extra?.cronJobId === jobId),
  },
}));

import { previewPromotion, runPromotion } from '@process/services/promotion/promotionService';

const JOB = 'job-brief';
const CURRENT = 'conv-current';
const EARLIER = 'conv-earlier';
const FOREIGN = 'conv-foreign';

let sandbox: string;
let documentsDir: string;

beforeAll(async () => {
  sandbox = await fsp.mkdtemp(path.join(os.tmpdir(), 'wl-promo-svc-'));
  documentsDir = path.join(sandbox, 'Documents');
  await fsp.mkdir(documentsDir, { recursive: true });
  documentsDirRef.value = documentsDir;
  configDirRef.value = path.join(sandbox, 'config');
  await fsp.mkdir(configDirRef.value, { recursive: true });
});
afterAll(async () => {
  await fsp.rm(sandbox, { recursive: true, force: true });
});

async function workspace(name: string, file: string, body: string): Promise<string> {
  const ws = path.join(sandbox, name);
  await fsp.mkdir(path.join(ws, 'artifacts'), { recursive: true });
  await fsp.writeFile(path.join(ws, 'artifacts', file), body, 'utf8');
  return ws;
}

beforeEach(async () => {
  await fsp.rm(path.join(documentsDir, 'Wayland'), { recursive: true, force: true });
  state.jobs.clear();
  state.conversations.clear();
  state.updates.length = 0;
  state.enabled.length = 0;
  state.jobs.set(JOB, {
    id: JOB,
    name: 'Morning Brief',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 7 * * *', description: '' },
    target: { payload: { kind: 'message', text: 'brief' }, executionMode: 'existing' },
    metadata: {
      conversationId: CURRENT,
      agentType: 'wcore',
      createdBy: 'agent',
      createdAt: 1,
      updatedAt: 1,
      agentConfig: { backend: 'wcore', name: 'Morning Brief' },
    },
    state: { runCount: 2, retryCount: 0, maxRetries: 3 },
  });
});

describe('the promotion offer', () => {
  it('reports what would be copied and which earlier runs were found', async () => {
    const current = await workspace(`wcore-temp-${1700000000001}`, 'today.md', '# today');
    const earlier = await workspace(`wcore-temp-${1700000000002}`, 'yesterday.md', '# yesterday');
    state.conversations.set(CURRENT, { id: CURRENT, createTime: 1, extra: { workspace: current, cronJobId: JOB } });
    state.conversations.set(EARLIER, { id: EARLIER, createTime: 1, extra: { workspace: earlier, cronJobId: JOB } });

    const offer = await previewPromotion({ conversationId: CURRENT, jobId: JOB });

    expect(offer.eligible).toBe(true);
    expect(offer.sourceWorkspace).toBe(current);
    expect(offer.targetName).toBe('Morning Brief');
    // The chat being promoted brings its own files across; only the STRANDED
    // runs are offered as separate choices.
    expect(offer.earlierRuns.map((c) => c.relPath)).toEqual(['artifacts/yesterday.md']);
    expect(offer.earlierRuns[0].conversationId).toBe(EARLIER);
    // Purely an offer: nothing was allocated.
    expect(existsSync(path.join(documentsDir, 'Wayland'))).toBe(false);
  });
});

describe('accepting the offer', () => {
  it('imports only files from conversations the job actually owns', async () => {
    const current = await workspace(`wcore-temp-${1700000000003}`, 'today.md', '# today');
    const earlier = await workspace(`wcore-temp-${1700000000004}`, 'yesterday.md', '# yesterday');
    const foreign = await workspace(`wcore-temp-${1700000000005}`, 'private.md', 'someone else');
    state.conversations.set(CURRENT, { id: CURRENT, createTime: 1, extra: { workspace: current, cronJobId: JOB } });
    state.conversations.set(EARLIER, { id: EARLIER, createTime: 1, extra: { workspace: earlier, cronJobId: JOB } });
    // Belongs to a DIFFERENT job. The renderer can name it; main must not honour it.
    state.conversations.set(FOREIGN, {
      id: FOREIGN,
      createTime: 1,
      extra: { workspace: foreign, cronJobId: 'some-other-job' },
    });

    const result = await runPromotion({
      conversationId: CURRENT,
      jobId: JOB,
      keep: [
        { conversationId: EARLIER, relPath: 'artifacts/yesterday.md' },
        { conversationId: FOREIGN, relPath: 'artifacts/private.md' },
      ],
    });

    expect(result.outcome.ok).toBe(true);
    if (!result.outcome.ok) return;
    const target = result.outcome.workspace;
    expect(target).toBe(path.join(documentsDir, 'Wayland', 'Tasks', 'Morning Brief'));
    // Today's work came across with the copy.
    expect(await fsp.readFile(path.join(target, 'artifacts', 'today.md'), 'utf8')).toBe('# today');
    // Yesterday's was imported...
    expect(result.imported).toHaveLength(1);
    expect(await fsp.readFile(path.join(target, result.imported[0].relPath), 'utf8')).toBe('# yesterday');
    // ...and the foreign one was dropped without even being reported as a
    // failure: it was never a legal selection to begin with.
    expect(result.importFailed).toEqual([]);
    expect(await fsp.readFile(path.join(foreign, 'artifacts', 'private.md'), 'utf8')).toBe('someone else');

    // The schedule was fenced and re-armed around the copy.
    expect(state.enabled).toEqual([
      { jobId: JOB, enabled: false },
      { jobId: JOB, enabled: true },
    ]);
    // Commit is one write, onto the conversation.
    expect(state.updates).toHaveLength(1);
    expect(state.updates[0].id).toBe(CURRENT);
    expect(state.updates[0].extra.workspace).toBe(target);
  });
});
