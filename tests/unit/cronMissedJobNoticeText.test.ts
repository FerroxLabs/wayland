/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A missed scheduled run posts an in-thread notice. The notice body is built in
 * the MAIN process, and the main-process i18next instance loads every locale
 * module under ONE namespace (`translation`) - see src/process/services/i18n.
 * A `namespace:key` lookup therefore names a namespace that does not exist, and
 * i18next hands back the remainder of the key. That is how the literal string
 * `error.missedJob` ended up persisted as a tips row and rendered to the user.
 *
 * These tests deliberately do NOT mock `@process/services/i18n`. The rest of the
 * cron suite stubs it with `t: (key) => key`, which can never tell a translated
 * sentence apart from a raw key path.
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
  Cron: vi.fn(() => ({ stop: vi.fn(), nextRun: vi.fn(() => null) })),
}));
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn() }));
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
  writeCronSkillFile: vi.fn(async () => '/mock/cronSkills/job-id/SKILL.md'),
  deleteCronSkillFile: vi.fn(async () => {}),
}));

import { ipcBridge } from '@/common';
import { addMessage } from '@process/utils/message';
import { CronService } from '@process/services/cron/CronService';
import type { CronJob } from '@process/services/cron/CronStore';
import type { ICronRepository } from '@process/services/cron/ICronRepository';
import type { ICronEventEmitter } from '@process/services/cron/ICronEventEmitter';
import type { ICronJobExecutor } from '@process/services/cron/ICronJobExecutor';
import type { IConversationRepository } from '@process/services/database/IConversationRepository';

/**
 * A dotted identifier and nothing else - `error.missedJob`, `cron.error.x`.
 * A translated sentence never matches this: it has spaces, punctuation, or an
 * interpolated value.
 */
const KEY_PATH_SHAPE = /^[a-z][a-zA-Z]*(\.[a-zA-Z]+)+$/;

function makeJob(overrides?: Partial<CronJob>): CronJob {
  return {
    id: 'job-1',
    name: 'Morning digest',
    enabled: true,
    schedule: { kind: 'every', everyMs: 60000, description: 'every 1 min' },
    target: { payload: { kind: 'message', text: 'hello' } },
    metadata: {
      conversationId: 'conv-1',
      agentType: 'gemini',
      createdBy: 'user',
      createdAt: 1000,
      updatedAt: 1000,
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3, nextRunAtMs: 1000 },
    ...overrides,
  };
}

describe('missed cron run notice text', () => {
  let job: CronJob;
  let service: CronService;

  beforeEach(async () => {
    vi.clearAllMocks();
    job = makeJob();
    const repo: ICronRepository = {
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getById: vi.fn(() => job),
      listAll: vi.fn(() => []),
      listEnabled: vi.fn(() => [job]),
      listByConversation: vi.fn(() => []),
      deleteByConversation: vi.fn(() => 0),
    };
    const emitter: ICronEventEmitter = {
      emitJobCreated: vi.fn(),
      emitJobUpdated: vi.fn(),
      emitJobRemoved: vi.fn(),
      emitJobExecuted: vi.fn(),
      showNotification: vi.fn(async () => {}),
    };
    const executor: ICronJobExecutor = {
      isConversationBusy: vi.fn(() => false),
      executeJob: vi.fn(async () => {}),
      onceIdle: vi.fn(),
      setProcessing: vi.fn(),
    };
    const conversationRepo = {
      getConversation: vi.fn(() => undefined),
      createConversation: vi.fn(),
      updateConversation: vi.fn(),
      deleteConversation: vi.fn(),
      getMessages: vi.fn(() => ({ data: [], total: 0, hasMore: false })),
      insertMessage: vi.fn(),
      getUserConversations: vi.fn(() => ({ data: [], total: 0, hasMore: false })),
      listAllConversations: vi.fn(() => []),
      searchMessages: vi.fn(async () => ({ data: [], total: 0, hasMore: false })),
      getConversationsByCronJob: vi.fn(async () => []),
    } as unknown as IConversationRepository;

    service = new CronService(repo, emitter, executor, conversationRepo);
    await service.init();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('persists a human sentence, never a raw i18n key path', () => {
    expect(addMessage).toHaveBeenCalledTimes(1);
    const [, message] = vi.mocked(addMessage).mock.calls[0] as [string, { content: { content: string } }];
    const body = message.content.content;

    expect(body).not.toBe('error.missedJob');
    expect(body).not.toMatch(KEY_PATH_SHAPE);
    expect(body).toContain('Morning digest');
    expect(body).toContain('was not executed');
  });

  it('streams the same human sentence to the open conversation', () => {
    const emit = vi.mocked(ipcBridge.conversation.responseStream.emit);
    expect(emit).toHaveBeenCalledTimes(1);
    const frame = emit.mock.calls[0][0] as { data: { content: string } };
    const body = frame.data.content;

    expect(body).not.toBe('error.missedJob');
    expect(body).not.toMatch(KEY_PATH_SHAPE);
    expect(body).toContain('Morning digest');
  });

  // `lastError` is persisted job state rather than something the schedules UI
  // renders today, so this is not the leak the user saw. It is asserted anyway:
  // it is written from the same call, it is what a bug report will contain, and
  // it is one `{job.state.lastError}` away from being on screen.
  it('records a human sentence on the persisted job state', () => {
    expect(job.state.lastStatus).toBe('missed');
    expect(job.state.lastError).not.toBe('error.missedJob');
    expect(job.state.lastError).not.toMatch(KEY_PATH_SHAPE);
  });
});
