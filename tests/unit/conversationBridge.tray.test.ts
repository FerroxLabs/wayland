/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs. Changes are documented in the project history.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IConversationService } from '@/process/services/IConversationService';
import type { IWorkerTaskManager } from '@/process/task/IWorkerTaskManager';
import { initConversationBridge } from '@process/bridge/conversationBridge';

type Provider = (payload?: unknown) => Promise<unknown>;

const {
  getHandlers,
  resetHandlers,
  createCommand,
  mockRefreshTrayMenu,
  mockConversationService,
  mockWorkerTaskManager,
  mockRemoveFromMessageCache,
  mockListJobsByConversation,
} = vi.hoisted(() => {
  const handlers: Record<string, Provider> = {};

  const reset = () => {
    for (const key of Object.keys(handlers)) {
      delete handlers[key];
    }
  };

  const commandFactory = (key: string) => ({
    provider: vi.fn((fn: Provider) => {
      handlers[key] = fn;
    }),
    invoke: vi.fn(),
    emit: vi.fn(),
  });

  const workerTaskManager = {
    getTask: vi.fn(),
    getOrBuildTask: vi.fn(async () => ({})),
    addTask: vi.fn(),
    kill: vi.fn(),
    clear: vi.fn(),
    listTasks: vi.fn(() => []),
    withConversationShutdown: vi.fn(),
  };
  workerTaskManager.withConversationShutdown.mockImplementation(
    async (id: string, prepare: () => Promise<unknown>, commit: (prepared: unknown) => unknown) => {
      await workerTaskManager.kill(id);
      const prepared = await prepare();
      await workerTaskManager.kill(id);
      return commit(prepared);
    }
  );

  const deleteConversation = vi.fn(async () => {});

  return {
    getHandlers: () => handlers,
    resetHandlers: reset,
    createCommand: commandFactory,
    mockRefreshTrayMenu: vi.fn(async () => {}),
    mockRemoveFromMessageCache: vi.fn(),
    mockListJobsByConversation: vi.fn(async () => []),
    mockConversationService: {
      createConversation: vi.fn(async () => ({ id: 'conv-created', name: 'Created Conversation', source: 'wayland' })),
      prepareDeleteConversation: vi.fn(async (id: string) => () => {
        void deleteConversation(id);
      }),
      deleteConversation,
      updateConversation: vi.fn(async () => {}),
      getConversation: vi.fn(async () => ({ id: 'conv-1', source: 'wayland', name: 'Original Name', type: 'gemini' })),
      createWithMigration: vi.fn(async () => ({ id: 'conv-migrated', source: 'wayland' })),
    },
    mockWorkerTaskManager: workerTaskManager,
  };
});

vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: {
    listJobsByConversation: mockListJobsByConversation,
  },
}));

vi.mock('@/agent/gemini', () => ({
  GeminiAgent: vi.fn(),
  GeminiApprovalStore: { getInstance: vi.fn(() => ({})) },
}));

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() => ({
    getUserConversations: vi.fn(() => ({ data: [] })),
  })),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    openclawConversation: {
      getRuntime: createCommand('openclawConversation.getRuntime'),
    },
    conversation: {
      create: createCommand('conversation.create'),
      reloadContext: createCommand('conversation.reloadContext'),
      getAssociateConversation: createCommand('conversation.getAssociateConversation'),
      createWithConversation: createCommand('conversation.createWithConversation'),
      remove: createCommand('conversation.remove'),
      update: createCommand('conversation.update'),
      reset: createCommand('conversation.reset'),
      get: createCommand('conversation.get'),
      getWorkspace: createCommand('conversation.getWorkspace'),
      responseSearchWorkSpace: { invoke: vi.fn() },
      stop: createCommand('conversation.stop'),
      setConfig: createCommand('conversation.setConfig'),
      getSlashCommands: createCommand('conversation.getSlashCommands'),
      askSideQuestion: createCommand('conversation.askSideQuestion'),
      sendMessage: createCommand('conversation.sendMessage'),
      warmup: createCommand('conversation.warmup'),
      generateTitle: createCommand('conversation.generateTitle'),
      responseStream: { emit: vi.fn() },
      listChanged: { emit: vi.fn() },
      listByCronJob: createCommand('conversation.listByCronJob'),
      deleteMessagesAfter: createCommand('conversation.deleteMessagesAfter'),
      confirmation: {
        confirm: createCommand('conversation.confirmation.confirm'),
        list: createCommand('conversation.confirmation.list'),
      },
      approval: {
        check: createCommand('conversation.approval.check'),
      },
    },
  },
}));

vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: vi.fn(() => '/mock/skills'),
  getBuiltinSkillsCopyDir: vi.fn(() => '/mock/builtin-skills'),
  getSystemDir: vi.fn(() => ({ cacheDir: '/mock/cache' })),
  ProcessChat: { get: vi.fn(async () => []) },
  ProcessConfig: { get: vi.fn(async () => []) },
}));

vi.mock('@/process/task/agentUtils', () => ({
  prepareFirstMessage: vi.fn(),
}));

vi.mock('@process/utils/tray', () => ({
  refreshTrayMenu: mockRefreshTrayMenu,
}));

vi.mock('@process/utils/message', () => ({
  removeFromMessageCache: mockRemoveFromMessageCache,
}));

vi.mock('@/process/utils', () => ({
  copyFilesToDirectory: vi.fn(),
  readDirectoryRecursive: vi.fn(),
}));

vi.mock('@/process/utils/openclawUtils', () => ({
  computeOpenClawIdentityHash: vi.fn(async () => 'identity-hash'),
}));

vi.mock('@process/bridge/migrationUtils', () => ({
  migrateConversationToDatabase: vi.fn(),
}));

const getProvider = (key: string): Provider => {
  const provider = getHandlers()[key];
  if (!provider) {
    throw new Error(`Provider ${key} not registered`);
  }

  return provider;
};

describe('conversationBridge tray sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkerTaskManager.withConversationShutdown.mockImplementation(
      async (id: string, prepare: () => Promise<unknown>, commit: (prepared: unknown) => unknown) => {
        await mockWorkerTaskManager.kill(id);
        const prepared = await prepare();
        await mockWorkerTaskManager.kill(id);
        return commit(prepared);
      }
    );
    mockListJobsByConversation.mockResolvedValue([]);
    resetHandlers();
    initConversationBridge(
      mockConversationService as unknown as IConversationService,
      mockWorkerTaskManager as unknown as IWorkerTaskManager
    );
  });

  it('refreshes tray menu after removing a conversation', async () => {
    const removeProvider = getProvider('conversation.remove');

    const result = await removeProvider({ id: 'conv-1' });

    expect(result).toBe(true);
    expect(mockWorkerTaskManager.kill).toHaveBeenCalledWith('conv-1');
    expect(mockConversationService.deleteConversation).toHaveBeenCalledWith('conv-1');
    expect(mockRemoveFromMessageCache).toHaveBeenCalledWith('conv-1');
    expect(mockRefreshTrayMenu).toHaveBeenCalledOnce();
  });

  it('preserves a chat when scheduled tasks still reference it', async () => {
    mockListJobsByConversation.mockResolvedValue([{ id: 'schedule-1' }]);
    const removeProvider = getProvider('conversation.remove');

    await expect(removeProvider({ id: 'conv-1' })).resolves.toBe(false);

    expect(mockWorkerTaskManager.kill).not.toHaveBeenCalled();
    expect(mockConversationService.deleteConversation).not.toHaveBeenCalled();
    expect(mockRemoveFromMessageCache).not.toHaveBeenCalled();
    expect(mockRefreshTrayMenu).not.toHaveBeenCalled();
  });

  it('fails closed when schedule authority cannot prove deletion is safe', async () => {
    mockListJobsByConversation.mockRejectedValue(new Error('schedule database unavailable'));
    const removeProvider = getProvider('conversation.remove');

    await expect(removeProvider({ id: 'conv-1' })).resolves.toBe(false);

    expect(mockWorkerTaskManager.kill).not.toHaveBeenCalled();
    expect(mockConversationService.deleteConversation).not.toHaveBeenCalled();
    expect(mockRemoveFromMessageCache).not.toHaveBeenCalled();
    expect(mockRefreshTrayMenu).not.toHaveBeenCalled();
  });

  it('refreshes tray menu after creating a conversation', async () => {
    const createProvider = getProvider('conversation.create');

    const result = await createProvider({ type: 'gemini' });

    expect(result).toEqual({ id: 'conv-created', name: 'Created Conversation', source: 'wayland' });
    expect(mockConversationService.createConversation).toHaveBeenCalledOnce();
    expect(mockRefreshTrayMenu).toHaveBeenCalledOnce();
  });

  it('refreshes tray menu after renaming a conversation', async () => {
    const updateProvider = getProvider('conversation.update');

    const result = await updateProvider({
      id: 'conv-1',
      updates: { name: 'Renamed Conversation' },
    });

    expect(result).toBe(true);
    expect(mockConversationService.updateConversation).toHaveBeenCalledWith(
      'conv-1',
      { name: 'Renamed Conversation' },
      undefined
    );
    expect(mockRefreshTrayMenu).toHaveBeenCalledOnce();
  });
});
