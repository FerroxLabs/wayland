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

import { isSafeRelPath, previewPromotion, runPromotion } from '@process/services/promotion/promotionService';

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
  // The journal is keyed on (conversationId, jobId) and both are constants here,
  // so without this every promote after the first short-circuits as
  // `alreadyPromoted` and silently tests nothing.
  await fsp.rm(path.join(configDirRef.value, 'workspace-promotions.json'), { force: true });
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

/**
 * H3 - `runPromotion` validated the renderer-supplied conversationId and then
 * passed the renderer-supplied relPath straight through.
 *
 * The renderer is untrusted input. `importEarlierRunDeliverables` rejected an
 * absolute path and a LEXICALLY escaping one, which reads like confinement and
 * is not: `path.resolve` does not resolve symlinks, and `fs.lstat` only refuses
 * to follow the FINAL component - so `artifacts/<link>/secret.txt`, where
 * `<link>` is a symlinked directory an agent left in the chat workspace,
 * resolves lexically inside, statted as a regular file, and got copied into the
 * user's Documents. The same gap let a relPath that was never OFFERED name any
 * file in the workspace, including the identity marker the scan deliberately
 * hides.
 *
 * The fix is the milestone's own rule applied properly: the renderer chooses
 * among what the OFFER enumerated, and nothing else is a legal selection.
 */
describe('H3 the renderer cannot aim the import with a path', () => {
  async function twoRuns(seed: number): Promise<{ current: string; earlier: string }> {
    const current = await workspace(`wcore-temp-${seed}`, 'today.md', '# today');
    const earlier = await workspace(`wcore-temp-${seed + 1}`, 'yesterday.md', '# yesterday');
    state.conversations.set(CURRENT, { id: CURRENT, createTime: 1, extra: { workspace: current, cronJobId: JOB } });
    state.conversations.set(EARLIER, { id: EARLIER, createTime: 1, extra: { workspace: earlier, cronJobId: JOB } });
    return { current, earlier };
  }

  it('rejects a traversal relPath', async () => {
    const { earlier } = await twoRuns(1700000000010);
    const secret = path.join(sandbox, 'outside-secret.txt');
    await fsp.writeFile(secret, 'TOP SECRET', 'utf8');

    const result = await runPromotion({
      conversationId: CURRENT,
      jobId: JOB,
      keep: [{ conversationId: EARLIER, relPath: '../../outside-secret.txt' }],
    });

    expect(result.outcome.ok).toBe(true);
    expect(result.imported).toEqual([]);
    expect(result.importFailed.map((f) => f.relPath)).toEqual(['../../outside-secret.txt']);
    void earlier;
  });

  it('rejects an absolute relPath', async () => {
    await twoRuns(1700000000020);
    const secret = path.join(sandbox, 'absolute-secret.txt');
    await fsp.writeFile(secret, 'TOP SECRET', 'utf8');

    const result = await runPromotion({
      conversationId: CURRENT,
      jobId: JOB,
      keep: [{ conversationId: EARLIER, relPath: secret }],
    });

    expect(result.imported).toEqual([]);
    expect(result.importFailed).toHaveLength(1);
  });

  /** The one the lexical check cannot see. */
  it('rejects a path whose ANCESTOR is a symlink out of the workspace', async () => {
    const { earlier } = await twoRuns(1700000000030);
    const outside = path.join(sandbox, 'outside-dir');
    await fsp.mkdir(outside, { recursive: true });
    await fsp.writeFile(path.join(outside, 'secret.txt'), 'TOP SECRET', 'utf8');
    await fsp.symlink(outside, path.join(earlier, 'artifacts', 'escape'), 'dir');

    const result = await runPromotion({
      conversationId: CURRENT,
      jobId: JOB,
      keep: [{ conversationId: EARLIER, relPath: 'artifacts/escape/secret.txt' }],
    });

    expect(result.outcome.ok).toBe(true);
    if (!result.outcome.ok) return;
    expect(result.imported).toEqual([]);
    expect(result.importFailed).toHaveLength(1);
    // Nothing from outside the workspace reached the user's Documents.
    const files = await fsp.readdir(path.join(result.outcome.workspace, 'artifacts'), { recursive: true });
    expect(files.some((f) => String(f).includes('secret'))).toBe(false);
  });

  it('rejects a symlinked FILE inside the workspace', async () => {
    const { earlier } = await twoRuns(1700000000040);
    const secret = path.join(sandbox, 'linked-secret.txt');
    await fsp.writeFile(secret, 'TOP SECRET', 'utf8');
    await fsp.symlink(secret, path.join(earlier, 'artifacts', 'innocent.md'));

    const result = await runPromotion({
      conversationId: CURRENT,
      jobId: JOB,
      keep: [{ conversationId: EARLIER, relPath: 'artifacts/innocent.md' }],
    });

    expect(result.imported).toEqual([]);
    expect(result.importFailed).toHaveLength(1);
  });

  /**
   * A real regular file, inside the workspace, that the OFFER deliberately does
   * not list. Accepting it is how a caller reads (or republishes) a control file
   * the picker was written to hide.
   */
  it('rejects a real in-workspace file that the offer never listed', async () => {
    const { earlier } = await twoRuns(1700000000050);
    await fsp.writeFile(path.join(earlier, '.wayland-workspace.json'), '{"workspaceId":"ws-earlier"}', 'utf8');

    const offer = await previewPromotion({ conversationId: CURRENT, jobId: JOB });
    // Control: the marker really is absent from the offer, so the case below is
    // testing what it claims to test.
    expect(offer.earlierRuns.map((c) => c.relPath)).toEqual(['artifacts/yesterday.md']);

    const result = await runPromotion({
      conversationId: CURRENT,
      jobId: JOB,
      keep: [{ conversationId: EARLIER, relPath: '.wayland-workspace.json' }],
    });

    expect(result.imported).toEqual([]);
    expect(result.importFailed).toHaveLength(1);
  });

  it('still imports a file the offer DID list (control)', async () => {
    await twoRuns(1700000000060);

    const result = await runPromotion({
      conversationId: CURRENT,
      jobId: JOB,
      keep: [{ conversationId: EARLIER, relPath: 'artifacts/yesterday.md' }],
    });

    expect(result.importFailed).toEqual([]);
    expect(result.imported).toHaveLength(1);
  });
});

describe('H3 isSafeRelPath', () => {
  it('accepts an ordinary nested relative path', () => {
    expect(isSafeRelPath('artifacts/2026-08-20/report.md')).toBe(true);
  });

  for (const bad of [
    '',
    '.',
    '..',
    '../escape.md',
    'artifacts/../../escape.md',
    'artifacts/./report.md',
    '/etc/passwd',
    'C:\\Windows\\win.ini',
    'artifacts//report.md',
    'artifacts/re\u0000port.md',
  ]) {
    it(`refuses ${JSON.stringify(bad)}`, () => {
      expect(isSafeRelPath(bad)).toBe(false);
    });
  }
});
