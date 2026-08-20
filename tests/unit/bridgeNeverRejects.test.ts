/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * H1/H4 - no cron or promotion provider may ever REJECT.
 *
 * `buildProvider(...).invoke` in @office-ai/platform is
 * `new Promise(function(resolve){...})`: no reject, no timeout. The provider
 * half calls `handler(data).then(cb)` with no `.catch`. Proven by execution
 * against the installed package - a resolving provider settled in 1ms, a
 * throwing provider never settled at all.
 *
 * So a throw inside a provider body is not an error the renderer can catch. It
 * is a promise that never settles: `TaskDetailPage.handleRunNow` sets
 * `runningNow(true)`, awaits, and its `catch` AND its `finally` never run. The
 * button spins forever and the carefully written three-option workspace message
 * is shown to nobody. The product has already shipped three hangs this way.
 *
 * The rule this file pins is therefore blunt: EVERY registered cron and
 * promotion provider resolves, whatever its dependencies do. The generic suite
 * makes every dependency throw and asserts nothing rejects; the classified
 * suites assert the user-facing payload is specific enough to render.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

type Handler = (payload: any) => Promise<unknown>;

const h = vi.hoisted(() => {
  const handlers = new Map<string, Handler>();
  const provider = (key: string) => ({
    provider: (fn: Handler) => {
      handlers.set(key, fn);
    },
    invoke: () => Promise.resolve(undefined),
    emit: () => undefined,
    on: () => () => undefined,
  });
  return { handlers, provider };
});

vi.mock('@/common', () => ({
  ipcBridge: {
    cron: {
      listJobs: h.provider('cron.list-jobs'),
      listArchivedJobs: h.provider('cron.list-archived-jobs'),
      listJobsByConversation: h.provider('cron.list-jobs-by-conversation'),
      getJob: h.provider('cron.get-job'),
      addJob: h.provider('cron.add-job'),
      updateJob: h.provider('cron.update-job'),
      removeJob: h.provider('cron.remove-job'),
      restoreArchivedJob: h.provider('cron.restore-archived-job'),
      runNow: h.provider('cron.run-now'),
      saveSkill: h.provider('cron.save-skill'),
      hasSkill: h.provider('cron.has-skill'),
      confirmProposal: h.provider('cron.confirm-proposal'),
    },
    promotion: {
      preview: h.provider('promotion.preview'),
      promote: h.provider('promotion.promote'),
    },
    conversation: {
      responseStream: { emit: vi.fn() },
    },
  },
}));

const svc = vi.hoisted(() => {
  const boom = () => {
    throw new Error('dependency exploded');
  };
  return {
    boom,
    cronService: {
      listJobs: vi.fn(async () => boom()),
      listArchivedJobs: vi.fn(async () => boom()),
      listJobsByConversation: vi.fn(async () => boom()),
      getJob: vi.fn(async () => boom()),
      addJob: vi.fn(async () => boom()),
      updateJob: vi.fn(async () => boom()),
      removeJob: vi.fn(async () => boom()),
      restoreArchivedJob: vi.fn(async () => boom()),
      runNow: vi.fn(async () => boom()),
    },
    previewPromotion: vi.fn(async () => boom()),
    runPromotion: vi.fn(async () => boom()),
  };
});

vi.mock('@process/services/cron/cronServiceSingleton', () => ({ cronService: svc.cronService }));
vi.mock('@process/services/cron/cronSkillFile', () => ({
  writeRawCronSkillFile: vi.fn(async () => svc.boom()),
  hasCronSkillFile: vi.fn(async () => svc.boom()),
}));
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn(async () => svc.boom()) }));
vi.mock('@process/services/database/SqliteConversationRepository', () => ({
  SqliteConversationRepository: class {
    getConversation = vi.fn(async () => svc.boom());
  },
}));
vi.mock('@process/services/promotion/promotionService', () => ({
  previewPromotion: svc.previewPromotion,
  runPromotion: svc.runPromotion,
}));

import { initCronBridge } from '@/process/bridge/cronBridge';
import { initPromotionBridge } from '@/process/bridge/promotionBridge';
import { CronWorkspaceError } from '@/process/bridge/cronWorkspaceError';
import { isCronBridgeFailure } from '@/common/adapter/ipcBridge';

initCronBridge();
initPromotionBridge();

/**
 * One payload that satisfies every provider's destructuring at once. Passing
 * the same object to all of them is deliberate: the assertion is about the
 * TRANSPORT, not about any handler's happy path.
 */
const ANY_PAYLOAD = {
  jobId: 'job-1',
  conversationId: 'conv-1',
  msgId: 'msg-1',
  action: 'cancel' as const,
  archiveId: 'archive-1',
  updates: {},
  allowHighFrequency: false,
  content: 'x',
  keep: [],
  name: 'Morning Brief',
};

describe('H1 the provider registry is actually populated (control)', () => {
  it('registered every cron and promotion provider', () => {
    // A zero here, or a missing key, would make every case below vacuous.
    expect([...h.handlers.keys()].toSorted()).toEqual(
      [
        'cron.add-job',
        'cron.confirm-proposal',
        'cron.get-job',
        'cron.has-skill',
        'cron.list-archived-jobs',
        'cron.list-jobs',
        'cron.list-jobs-by-conversation',
        'cron.remove-job',
        'cron.restore-archived-job',
        'cron.run-now',
        'cron.save-skill',
        'cron.update-job',
        'promotion.preview',
        'promotion.promote',
      ].toSorted()
    );
  });
});

describe('H1/H4 no provider rejects, whatever its dependencies do', () => {
  for (const key of [
    'cron.list-jobs',
    'cron.list-archived-jobs',
    'cron.list-jobs-by-conversation',
    'cron.get-job',
    'cron.add-job',
    'cron.update-job',
    'cron.remove-job',
    'cron.restore-archived-job',
    'cron.run-now',
    'cron.save-skill',
    'cron.has-skill',
    'cron.confirm-proposal',
    'promotion.preview',
    'promotion.promote',
  ]) {
    it(`${key} resolves instead of rejecting`, async () => {
      const handler = h.handlers.get(key);
      expect(handler).toBeTypeOf('function');
      // A rejection here is a renderer that hangs forever, not an error it can
      // show. `.resolves` is the whole assertion.
      await expect(handler!(ANY_PAYLOAD)).resolves.toBeDefined();
    });
  }
});

describe('H1 the workspace failure arrives classified and renderable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('run-now reports a missing workspace instead of hanging', async () => {
    svc.cronService.runNow.mockImplementationOnce(async () => {
      throw new CronWorkspaceError('workspace_missing', 'Scheduled task did not run: its folder is gone.', '/gone');
    });
    const result = await h.handlers.get('cron.run-now')!(ANY_PAYLOAD);
    expect(result).toEqual({
      ok: false,
      errorCode: 'workspace_missing',
      path: '/gone',
      message: 'Scheduled task did not run: its folder is gone.',
    });
    expect(isCronBridgeFailure(result)).toBe(true);
  });

  it('run-now reports a replaced workspace under its own code', async () => {
    svc.cronService.runNow.mockImplementationOnce(async () => {
      throw new CronWorkspaceError('workspace_mismatch', 'no longer its workspace', '/elsewhere');
    });
    expect(await h.handlers.get('cron.run-now')!(ANY_PAYLOAD)).toMatchObject({
      ok: false,
      errorCode: 'workspace_mismatch',
      path: '/elsewhere',
    });
  });

  it('the enable toggle reports a failed allocation instead of hanging', async () => {
    // macOS TCC: the base dir is a protected Documents path and the grant is
    // missing, so allocation throws inside CronService.updateJob.
    svc.cronService.updateJob.mockImplementationOnce(async () => {
      throw new CronWorkspaceError('workspace_alloc_failed', 'could not create the task folder', '/Users/x/Documents');
    });
    expect(await h.handlers.get('cron.update-job')!(ANY_PAYLOAD)).toMatchObject({
      ok: false,
      errorCode: 'workspace_alloc_failed',
      path: '/Users/x/Documents',
    });
  });

  it('add-job reports a failed allocation the same way', async () => {
    svc.cronService.addJob.mockImplementationOnce(async () => {
      throw new CronWorkspaceError('workspace_alloc_failed', 'could not create the task folder');
    });
    expect(await h.handlers.get('cron.add-job')!(ANY_PAYLOAD)).toMatchObject({
      ok: false,
      errorCode: 'workspace_alloc_failed',
    });
  });

  it('an unclassified throw still resolves, under the catch-all code', async () => {
    svc.cronService.updateJob.mockImplementationOnce(async () => {
      throw new Error('something nobody predicted');
    });
    expect(await h.handlers.get('cron.update-job')!(ANY_PAYLOAD)).toMatchObject({
      ok: false,
      errorCode: 'cron_operation_failed',
    });
  });

  it('a successful update still returns the job itself, unwrapped', async () => {
    const job = { id: 'job-1', name: 'Morning Brief' };
    svc.cronService.updateJob.mockImplementationOnce(async () => job as never);
    expect(await h.handlers.get('cron.update-job')!(ANY_PAYLOAD)).toBe(job);
  });

  it('a successful run-now still returns the conversation id', async () => {
    svc.cronService.runNow.mockImplementationOnce(async () => 'conv-created' as never);
    expect(await h.handlers.get('cron.run-now')!(ANY_PAYLOAD)).toEqual({ conversationId: 'conv-created' });
  });
});

describe('H4 promotion failures arrive as refusals, never as rejections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preview reports a refusal when the service throws', async () => {
    svc.previewPromotion.mockImplementationOnce(async () => {
      throw new Error('journal unreadable');
    });
    expect(await h.handlers.get('promotion.preview')!(ANY_PAYLOAD)).toEqual({
      eligible: false,
      refusal: 'promotion-failed',
      earlierRuns: [],
      earlierRunsTruncated: false,
    });
  });

  it('promote reports a refusal when the copy throws mid-flight', async () => {
    svc.runPromotion.mockImplementationOnce(async () => {
      throw new Error('promotion copy failed verification');
    });
    expect(await h.handlers.get('promotion.promote')!(ANY_PAYLOAD)).toEqual({
      ok: false,
      refusal: 'promotion-failed',
      skipped: [],
      imported: [],
      importFailed: [],
    });
  });
});
