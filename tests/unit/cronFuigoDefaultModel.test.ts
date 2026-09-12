/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fuigo cutover: a scheduled run on the bundled engine resolves its model from
 * `fuigo.defaultModel` (a pre-cutover Core default is copied there once by
 * `runFuigoCutoverConfigMigration`). Before this, `fuigo` fell into the generic
 * ACP branch and read neither key.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: vi.fn(() => '/tmp') } }));
vi.mock('@/common/utils', () => ({ uuid: vi.fn(() => 'test-uuid') }));
vi.mock('@process/utils', () => ({ copyFilesToDirectory: vi.fn(async () => []) }));
vi.mock('@process/services/conversationServiceSingleton', () => ({
  conversationServiceSingleton: {
    getConversation: vi.fn(async () => undefined),
    createConversation: vi.fn(),
    updateConversation: vi.fn(),
    getConversationsByCronJob: vi.fn(async () => []),
  },
}));
const { configGet } = vi.hoisted(() => ({ configGet: vi.fn() }));
vi.mock('@process/utils/initStorage', () => ({
  getCronSkillsDir: vi.fn(() => '/mock/cronSkills'),
  ProcessConfig: { get: configGet },
}));
vi.mock('@process/utils/message', () => ({ addMessage: vi.fn() }));
vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: { responseStream: { emit: vi.fn() } },
    geminiConversation: { responseStream: { emit: vi.fn() } },
    acpConversation: { responseStream: { emit: vi.fn() } },
    openclawConversation: { responseStream: { emit: vi.fn() } },
  },
}));
vi.mock('@/process/services/cron/cronSkillFile', () => ({
  readCronSkillContent: vi.fn(async () => null),
  parseCronSkillContent: vi.fn(() => null),
  hasCronSkillFile: vi.fn(async () => false),
  getCronSkillDir: vi.fn((jobId: string) => `/mock/cronSkills/${jobId}`),
}));
vi.mock('@/process/services/cron/SkillSuggestWatcher', () => ({
  skillSuggestWatcher: {
    register: vi.fn(),
    unregister: vi.fn(),
    has: vi.fn(() => false),
    onFinish: vi.fn(),
    setLastHash: vi.fn(),
  },
}));

import { WorkerTaskManagerJobExecutor } from '../../src/process/services/cron/WorkerTaskManagerJobExecutor';
import { CronBusyGuard } from '../../src/process/services/cron/CronBusyGuard';
import type { IWorkerTaskManager } from '../../src/process/task/IWorkerTaskManager';

type Probe = { resolveModelForBackend: (backend: string) => Promise<{ useModel?: string; id?: string }> };

const flux = { id: 'flux', platform: 'openai-compatible', model: ['flux-auto', 'gpt-5.4'], useModel: 'flux-auto' };

function config(keys: Record<string, unknown>) {
  configGet.mockImplementation(async (key: string) => keys[key]);
}

function executor(): Probe {
  const taskManager = {
    getTask: vi.fn(),
    getOrBuildTask: vi.fn(),
    addTask: vi.fn(),
    kill: vi.fn(),
    clear: vi.fn(),
    listTasks: vi.fn(() => []),
  } as unknown as IWorkerTaskManager;
  return new WorkerTaskManagerJobExecutor(taskManager, new CronBusyGuard()) as unknown as Probe;
}

describe('WorkerTaskManagerJobExecutor.resolveModelForBackend(fuigo)', () => {
  beforeEach(() => configGet.mockReset());

  it('reads fuigo.defaultModel', async () => {
    config({
      'model.config': [flux],
      'fuigo.defaultModel': { id: 'flux', useModel: 'gpt-5.4' },
    });
    const model = await executor().resolveModelForBackend('fuigo');
    expect(model.useModel).toBe('gpt-5.4');
  });

  it("uses the provider's own default when no fuigo default is set", async () => {
    config({ 'model.config': [flux] });
    const model = await executor().resolveModelForBackend('fuigo');
    expect(model.useModel).toBe('flux-auto');
  });
});
