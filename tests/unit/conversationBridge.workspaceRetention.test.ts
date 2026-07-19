/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { IConversationService } from '@/process/services/IConversationService';
import type { IWorkerTaskManager } from '@/process/task/IWorkerTaskManager';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Provider = (payload?: unknown) => Promise<unknown>;

const {
  handlers,
  createCommand,
  mockConversationService,
  mockWorkerTaskManager,
  mockListJobsByConversation,
  mockDatabase,
} = vi.hoisted(() => {
  const registered: Record<string, Provider> = {};
  const commandFactory = (key: string) => ({
    provider: vi.fn((handler: Provider) => {
      registered[key] = handler;
    }),
    invoke: vi.fn(),
    emit: vi.fn(),
  });

  return {
    handlers: registered,
    createCommand: commandFactory,
    mockListJobsByConversation: vi.fn(async () => []),
    mockDatabase: {
      getConversation: vi.fn(),
      deleteConversation: vi.fn(),
      getUserConversations: vi.fn(() => ({ data: [] })),
    },
    mockConversationService: {
      createConversation: vi.fn(),
      deleteConversation: vi.fn(async () => {}),
      updateConversation: vi.fn(),
      getConversation: vi.fn(),
      createWithMigration: vi.fn(),
      listAllConversations: vi.fn(async () => []),
      getConversationsByCronJob: vi.fn(async () => []),
    },
    mockWorkerTaskManager: {
      getTask: vi.fn(),
      getOrBuildTask: vi.fn(),
      addTask: vi.fn(),
      kill: vi.fn(),
      clear: vi.fn(),
      listTasks: vi.fn(() => []),
    },
  };
});

vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: { listJobsByConversation: mockListJobsByConversation },
}));

vi.mock('@/agent/gemini', () => ({
  GeminiAgent: vi.fn(),
  GeminiApprovalStore: { getInstance: vi.fn(() => ({})) },
}));

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() => mockDatabase),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    openclawConversation: { getRuntime: createCommand('openclawConversation.getRuntime') },
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
      approval: { check: createCommand('conversation.approval.check') },
    },
  },
}));

vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: vi.fn(() => '/mock/skills'),
  getBuiltinSkillsCopyDir: vi.fn(() => '/mock/builtin-skills'),
  getSystemDir: vi.fn(() => ({ cacheDir: '/mock/cache' })),
  ProcessChat: { get: vi.fn(async () => []) },
  ProcessConfig: { get: vi.fn(async (key: string) => (key === 'language' ? 'en' : [])) },
}));

vi.mock('@/process/task/agentUtils', () => ({ prepareFirstMessage: vi.fn() }));
vi.mock('@process/utils/tray', () => ({ refreshTrayMenu: vi.fn(async () => {}) }));
vi.mock('@process/utils/message', () => ({ removeFromMessageCache: vi.fn() }));
vi.mock('@/process/utils', () => ({ copyFilesToDirectory: vi.fn(), readDirectoryRecursive: vi.fn() }));
vi.mock('@/process/utils/openclawUtils', () => ({ computeOpenClawIdentityHash: vi.fn(async () => 'hash') }));
vi.mock('@process/bridge/migrationUtils', () => ({ migrateConversationToDatabase: vi.fn() }));

const { initConversationBridge } = await import('@/process/bridge/conversationBridge');
const { ConversationServiceImpl } = await import('@/process/services/ConversationServiceImpl');
const { SqliteConversationRepository } = await import('@/process/services/database/SqliteConversationRepository');

describe('conversation.remove managed-workspace retention', () => {
  let root: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    for (const key of Object.keys(handlers)) delete handlers[key];
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-conversation-remove-'));
    mockListJobsByConversation.mockResolvedValue([]);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('severs the database reference while preserving exact managed workspace bytes', async () => {
    const workspace = path.join(root, 'wcore-temp-1736900000000');
    const artifact = path.join(workspace, 'report.bin');
    const expectedBytes = Uint8Array.from([0, 1, 2, 127, 128, 254, 255]);
    await fs.mkdir(workspace);
    await fs.writeFile(artifact, expectedBytes);
    const conversation = {
      id: 'conv-1',
      source: 'wayland',
      extra: { workspace },
    };
    mockDatabase.getConversation.mockReturnValue({ success: true, data: conversation });
    const conversationService = new ConversationServiceImpl(new SqliteConversationRepository());

    initConversationBridge(conversationService, mockWorkerTaskManager as unknown as IWorkerTaskManager);
    const remove = handlers['conversation.remove'];
    expect(remove).toBeTypeOf('function');

    await expect(remove({ id: 'conv-1' })).resolves.toBe(true);

    expect(mockDatabase.deleteConversation).toHaveBeenCalledWith('conv-1');
    await expect(fs.readFile(artifact)).resolves.toEqual(Buffer.from(expectedBytes));
    await expect(fs.stat(workspace)).resolves.toMatchObject({ size: expect.any(Number) });
  });

  it('retains active-process authority until the agent has actually stopped', async () => {
    let finishShutdown!: () => void;
    const shutdown = new Promise<void>((resolve) => {
      finishShutdown = resolve;
    });
    mockConversationService.getConversation.mockResolvedValue({
      id: 'conv-pending',
      source: 'wayland',
      extra: { workspace: path.join(root, 'wcore-temp-1736900000001') },
    });
    mockWorkerTaskManager.kill.mockReturnValue(shutdown);

    initConversationBridge(
      mockConversationService as unknown as IConversationService,
      mockWorkerTaskManager as unknown as IWorkerTaskManager
    );
    const remove = handlers['conversation.remove'];
    const removal = remove({ id: 'conv-pending' });

    await vi.waitFor(() => expect(mockWorkerTaskManager.kill).toHaveBeenCalledWith('conv-pending'));
    expect(mockConversationService.deleteConversation).not.toHaveBeenCalled();

    finishShutdown();
    await expect(removal).resolves.toBe(true);
    expect(mockConversationService.deleteConversation).toHaveBeenCalledWith('conv-pending');
  });

  it('keeps the conversation reference when process shutdown fails', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockConversationService.getConversation.mockResolvedValue({
      id: 'conv-running',
      source: 'wayland',
      extra: { workspace: path.join(root, 'wcore-temp-1736900000002') },
    });
    mockWorkerTaskManager.kill.mockRejectedValue(new Error('process still alive'));

    initConversationBridge(
      mockConversationService as unknown as IConversationService,
      mockWorkerTaskManager as unknown as IWorkerTaskManager
    );
    const remove = handlers['conversation.remove'];

    await expect(remove({ id: 'conv-running' })).resolves.toBe(false);
    expect(mockConversationService.deleteConversation).not.toHaveBeenCalled();
    expect(errorLog).toHaveBeenCalledWith('[conversationBridge] Failed to remove conversation:', expect.any(Error));
    errorLog.mockRestore();
  });
});
