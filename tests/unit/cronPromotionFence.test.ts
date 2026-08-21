/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Promotion rule 3, executor side. Pausing the job is not enough: a fire croner
 * has already scheduled reads as zero activity, dispatches mid-copy, and writes
 * its report into the OLD workspace after the digest pass has been over it. So
 * the executor asks the lock at the moment it resolves a conversation for a run.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@process/services/i18n', () => ({
  default: { t: vi.fn((key: string) => key) },
  i18nReady: Promise.resolve(),
}));
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn() }));
vi.mock('@process/utils', () => ({ copyFilesToDirectory: vi.fn(async () => {}) }));
vi.mock('@/common', () => ({
  ipcBridge: { conversation: { responseStream: { emit: vi.fn() }, listChanged: { emit: vi.fn() } } },
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => undefined) },
  getCronSkillsDir: vi.fn(() => '/mock/cronSkills'),
}));
vi.mock('@/process/services/cron/cronSkillFile', () => ({
  hasCronSkillFile: vi.fn(async () => false),
  getCronSkillDir: vi.fn(() => '/mock/cronSkills/job'),
}));
vi.mock('@process/task/AcpSkillManager', () => ({
  AcpSkillManager: { getInstance: () => ({ discoverSkills: vi.fn(async () => {}), getSkillsIndex: () => [] }) },
}));
vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/mock/appPath', getPath: () => '/mock/documents' },
}));

const conversationStore = new Map<string, any>();
const createConversationMock = vi.fn(async (params: any) => {
  const id = `conv-created-${conversationStore.size}`;
  const conv = {
    id,
    type: params.type,
    name: params.name,
    createTime: Date.now(),
    modifyTime: Date.now(),
    model: params.model,
    extra: { ...params.extra },
  };
  conversationStore.set(id, conv);
  return conv;
});
vi.mock('@process/services/conversationServiceSingleton', () => ({
  conversationServiceSingleton: {
    getConversation: vi.fn(async (id: string) => conversationStore.get(id)),
    createConversation: createConversationMock,
    updateConversation: vi.fn(async () => {}),
    getConversationsByCronJob: vi.fn(async (cronJobId: string) =>
      [...conversationStore.values()].filter((c) => c.extra?.cronJobId === cronJobId)
    ),
  },
}));

import { WorkerTaskManagerJobExecutor } from '@/process/services/cron/WorkerTaskManagerJobExecutor';
import {
  acquirePromotionLock,
  releasePromotionLock,
  ConversationPromotingError,
} from '@process/services/promotion/promotionLock';
import type { CronJob } from '@/process/services/cron/CronStore';

const CONV = 'conv-source';
const JOB = 'job-1';

function job(): CronJob {
  return {
    id: JOB,
    name: 'Smart Trader',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 7 * * *', description: '0 7 * * *' },
    target: { payload: { kind: 'message', text: 'run' }, executionMode: 'existing' },
    metadata: {
      conversationId: CONV,
      agentType: 'wcore' as CronJob['metadata']['agentType'],
      createdBy: 'agent',
      createdAt: 1,
      updatedAt: 1,
      agentConfig: { backend: 'wcore' as CronJob['metadata']['agentType'], name: 'Smart Trader' },
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3 },
  };
}

function makeExecutor(): WorkerTaskManagerJobExecutor {
  return new WorkerTaskManagerJobExecutor(
    { getTask: vi.fn(), getOrBuildTask: vi.fn(), kill: vi.fn(), buildConversation: vi.fn() } as any,
    { isProcessing: vi.fn(() => false), setProcessing: vi.fn(), onceIdle: vi.fn() } as any
  );
}

beforeEach(() => {
  conversationStore.clear();
  conversationStore.set(CONV, {
    id: CONV,
    type: 'wcore',
    createTime: 1,
    extra: { workspace: '/tmp/wcore-temp-1700000000', cronJobId: JOB },
  });
});
afterEach(() => {
  releasePromotionLock(CONV);
  vi.clearAllMocks();
});

describe('the executor refuses a conversation that is being promoted', () => {
  it('prepareConversation throws rather than running against the workspace mid-copy', async () => {
    const executor = makeExecutor();
    expect(acquirePromotionLock(CONV)).toBe(true);

    await expect(executor.prepareConversation(job())).rejects.toBeInstanceOf(ConversationPromotingError);
    // Above all: it must not sidestep the fence by minting a fresh conversation.
    expect(createConversationMock).not.toHaveBeenCalled();
  });

  it('executeJob throws even when a conversation id was already prepared', async () => {
    const executor = makeExecutor();
    acquirePromotionLock(CONV);

    await expect(executor.executeJob(job(), undefined, CONV)).rejects.toBeInstanceOf(ConversationPromotingError);
  });

  it('runs normally once the lock is released', async () => {
    const executor = makeExecutor();
    acquirePromotionLock(CONV);
    releasePromotionLock(CONV);

    await expect(executor.prepareConversation(job())).resolves.toBe(CONV);
  });
});
