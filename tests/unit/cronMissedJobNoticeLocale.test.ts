/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The main-process i18n instance boots on en-US and only switches to the user's
 * saved language once `ProcessConfig.get('language')` has come back - that is
 * what `i18nReady` resolves on. The missed-run catch-up runs from `init()`,
 * early enough to lose that race, so without awaiting `i18nReady` the notice is
 * persisted in English and stays English forever.
 *
 * The language read here is deliberately held open until after `init()` has been
 * kicked off, so the race is decided rather than observed: a build that does not
 * await `i18nReady` writes the notice before German is loaded.
 */

import { describe, it, expect, vi } from 'vitest';

// `vi.mock` factories are hoisted above every module-scope binding, so the
// deferred language read has to be hoisted with them.
const { languageRead, releaseLanguage } = vi.hoisted(() => {
  let release: (value: string) => void = () => {};
  const promise = new Promise<string>((resolve) => {
    release = resolve;
  });
  return { languageRead: promise, releaseLanguage: release };
});

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
  ProcessConfig: {
    get: vi.fn((key: string) => (key === 'language' ? languageRead : Promise.resolve(undefined))),
  },
  getCronSkillsDir: vi.fn(() => '/mock/cronSkills'),
}));
vi.mock('@/process/services/cron/cronSkillFile', () => ({
  writeCronSkillFile: vi.fn(async () => '/mock/cronSkills/job-id/SKILL.md'),
  deleteCronSkillFile: vi.fn(async () => {}),
}));

import { addMessage } from '@process/utils/message';
import { CronService } from '@process/services/cron/CronService';
import type { CronJob } from '@process/services/cron/CronStore';
import type { ICronRepository } from '@process/services/cron/ICronRepository';
import type { ICronEventEmitter } from '@process/services/cron/ICronEventEmitter';
import type { ICronJobExecutor } from '@process/services/cron/ICronJobExecutor';
import type { IConversationRepository } from '@process/services/database/IConversationRepository';

describe('missed cron run notice locale', () => {
  it('waits for the user language before writing the notice', async () => {
    const job: CronJob = {
      id: 'job-1',
      name: 'Morgenbericht',
      enabled: true,
      schedule: { kind: 'every', everyMs: 60000, description: 'every 1 min' },
      target: { payload: { kind: 'message', text: 'hallo' } },
      metadata: {
        conversationId: 'conv-1',
        agentType: 'gemini',
        createdBy: 'user',
        createdAt: 1000,
        updatedAt: 1000,
      },
      state: { runCount: 0, retryCount: 0, maxRetries: 3, nextRunAtMs: 1000 },
    };
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

    const service = new CronService(repo, emitter, executor, conversationRepo);
    const initDone = service.init();
    // Let every already-resolved microtask drain. A build that does not await
    // `i18nReady` has written its English notice by the end of this tick.
    await new Promise((resolve) => setTimeout(resolve, 0));
    releaseLanguage('de-DE');
    await initDone;

    expect(addMessage).toHaveBeenCalledTimes(1);
    const [, message] = vi.mocked(addMessage).mock.calls[0] as [string, { content: { content: string } }];
    expect(message.content.content).toContain('Geplante Aufgabe');
    expect(message.content.content).not.toContain('Scheduled task');
  });
});
