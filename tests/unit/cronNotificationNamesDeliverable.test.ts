/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A scheduled run's banner must name what it produced.
 *
 * The body was `cron.notification.taskDone` - the literal string "Task done" -
 * for every run of every task, and it carried no artifact id, so there was
 * nothing to click through to. That was the ONLY moment the product ever told
 * the user a deliverable existed.
 *
 * The ordering this pins is the reason it was not a one-line fix.
 * `CronBusyGuard.setProcessing` fires idle callbacks SYNCHRONOUSLY and an
 * `IdleCallback` returns `void`, so the guard cannot await the artifact
 * publication - and the completion notification is registered FIRST, from
 * `onAcquired`, before the executor registers the settle. Reading the ledger at
 * idle time therefore reads it before the run has been written to it. The
 * notification has to await `whenRunPublished` instead.
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
  getPlatformServices: () => ({ power: { preventSleep: vi.fn(() => 1), allowSleep: vi.fn() } }),
}));
vi.mock('croner', () => ({ Cron: vi.fn(() => ({ stop: vi.fn(), nextRun: vi.fn(() => null) })) }));
vi.mock('@process/services/i18n', () => ({
  default: {
    // Keys resolve to themselves, with any interpolation values appended, so an
    // assertion can see the file name the caller passed rather than a bare key.
    t: vi.fn((key: string, vars?: Record<string, unknown>) => (vars ? `${key}:${Object.values(vars).join(',')}` : key)),
  },
  i18nReady: Promise.resolve(),
}));
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn() }));
vi.mock('@/common', () => ({
  ipcBridge: { conversation: { responseStream: { emit: vi.fn() }, listChanged: { emit: vi.fn() } } },
}));
vi.mock('@process/utils/initStorage', () => ({
  // The cron notification switch is ON; everything else stays off.
  ProcessConfig: { get: vi.fn(async (key: string) => key === 'system.cronNotificationEnabled') },
  getCronSkillsDir: vi.fn(() => '/mock/cronSkills'),
}));
vi.mock('@/process/services/cron/cronSkillFile', () => ({
  writeCronSkillFile: vi.fn(async () => '/mock/cronSkills/job-id/SKILL.md'),
  deleteCronSkillFile: vi.fn(async () => {}),
}));

import { CronService } from '../../src/process/services/cron/CronService';
import type { ICronRepository } from '../../src/process/services/cron/ICronRepository';
import type { ICronEventEmitter } from '../../src/process/services/cron/ICronEventEmitter';
import type { ICronJobExecutor } from '../../src/process/services/cron/ICronJobExecutor';
import type { IConversationRepository } from '../../src/process/services/database/IConversationRepository';
import type { CronJob } from '../../src/process/services/cron/CronStore';
import type { ArtifactRecord } from '../../src/process/services/artifacts/artifactLedger';

const CONVERSATION_ID = 'conv-brief';

const BRIEF: ArtifactRecord = {
  version: 1,
  artifactId: 'artifact-brief',
  taskId: 'job-brief',
  runId: 'run-1',
  workspace: '/workspace/brief',
  relativePath: 'artifacts/morning/2026-08-21/run-1/brief.html',
  sizeBytes: 10,
  sha256: 'a'.repeat(64),
  declaredBy: 'Morning Market Brief',
  runAt: '2026-08-21T06:00:00.000Z',
  state: 'published',
};

/**
 * A CronService wired to fakes, with the idle callback captured rather than
 * fired, so a test can decide WHEN the conversation goes idle.
 *
 * @param published - what the run's publication resolves to.
 * @returns The service, its emitter, and a trigger for the idle callback.
 */
function buildService(published: Promise<ArtifactRecord[]>) {
  const job: CronJob = {
    id: 'job-brief',
    name: 'Morning Market Brief',
    enabled: true,
    schedule: { kind: 'every', everyMs: 60000, description: 'every 1 min' },
    target: { payload: { kind: 'message', text: 'brief me' } },
    metadata: {
      conversationId: CONVERSATION_ID,
      conversationTitle: 'Morning Market Brief',
      agentType: 'gemini',
      createdBy: 'user',
      createdAt: 1000,
      updatedAt: 1000,
    },
    state: { runCount: 0, retryCount: 0, maxRetries: 3 },
  };

  let idleCallback: (() => Promise<void>) | undefined;

  const repo = {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(() => job),
    list: vi.fn(() => [job]),
    listEnabled: vi.fn(() => [job]),
  } as unknown as ICronRepository;

  const emitter: ICronEventEmitter = {
    emitJobCreated: vi.fn(),
    emitJobUpdated: vi.fn(),
    emitJobRemoved: vi.fn(),
    emitJobExecuted: vi.fn(),
    showNotification: vi.fn(async () => {}),
  };

  const executor: ICronJobExecutor = {
    isConversationBusy: vi.fn(() => false),
    // The real executor calls `onAcquired` while the conversation is busy; that
    // is where the notification registers itself.
    executeJob: vi.fn(async (_job, onAcquired) => {
      onAcquired?.();
    }),
    prepareConversation: vi.fn(async () => CONVERSATION_ID),
    onceIdle: vi.fn((_id: string, cb: () => Promise<void>) => {
      idleCallback = cb;
    }),
    setProcessing: vi.fn(),
    whenRunPublished: vi.fn(() => published),
  };

  const conversationRepo = {
    getConversation: vi.fn(() => undefined),
    getConversationsByCronJob: vi.fn(async () => []),
  } as unknown as IConversationRepository;

  const service = new CronService(repo, emitter, executor, conversationRepo);
  return { service, emitter, executor, job, goIdle: () => idleCallback?.() };
}

describe('cron completion banner', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('names the published deliverable and carries its id', async () => {
    const { service, emitter, goIdle } = buildService(Promise.resolve([BRIEF]));

    await service.init();
    await vi.advanceTimersByTimeAsync(60000);
    await goIdle();

    expect(emitter.showNotification).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(emitter.showNotification).mock.calls[0][0];
    expect(payload.body).toContain('brief.html');
    expect(payload.body).not.toContain('taskDone');
    expect(payload.artifactId).toBe('artifact-brief');
    expect(payload.conversationId).toBe(CONVERSATION_ID);
  });

  it('waits for the publication instead of reading it at idle time', async () => {
    let release!: (records: ArtifactRecord[]) => void;
    const pending = new Promise<ArtifactRecord[]>((r) => {
      release = r;
    });
    const { service, emitter, goIdle } = buildService(pending);

    await service.init();
    await vi.advanceTimersByTimeAsync(60000);
    const idle = goIdle();

    // The conversation is idle but the run has not been published yet. A
    // notification sent now could not possibly name the file.
    await vi.advanceTimersByTimeAsync(0);
    expect(emitter.showNotification).not.toHaveBeenCalled();

    release([BRIEF]);
    await idle;
    expect(vi.mocked(emitter.showNotification).mock.calls[0][0].body).toContain('brief.html');
  });

  it('still shows a banner when the run published nothing', async () => {
    const { service, emitter, goIdle } = buildService(Promise.resolve([]));

    await service.init();
    await vi.advanceTimersByTimeAsync(60000);
    await goIdle();

    const payload = vi.mocked(emitter.showNotification).mock.calls[0][0];
    expect(payload.body).toBe('cron.notification.taskDone');
    expect(payload.artifactId).toBeUndefined();
  });

  it('gives up naming the file rather than losing the banner when publication hangs', async () => {
    const { service, emitter, goIdle } = buildService(new Promise<ArtifactRecord[]>(() => {}));

    await service.init();
    await vi.advanceTimersByTimeAsync(60000);
    const idle = goIdle();
    await vi.advanceTimersByTimeAsync(10_000);
    await idle;

    expect(emitter.showNotification).toHaveBeenCalledTimes(1);
    expect(vi.mocked(emitter.showNotification).mock.calls[0][0].body).toBe('cron.notification.taskDone');
  });
});
