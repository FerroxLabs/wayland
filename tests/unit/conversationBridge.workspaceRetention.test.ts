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
import { WorkerTaskManager } from '@/process/task/WorkerTaskManager';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Provider = (payload?: unknown) => Promise<unknown>;

type TreeSnapshotEntry = {
  path: string;
  kind: 'directory' | 'file' | 'symlink' | 'other';
  mode: number;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  dev: number;
  ino: number;
  nlink: number;
  bytes?: string;
  target?: string;
};

async function snapshotTree(root: string): Promise<TreeSnapshotEntry[]> {
  const entries: TreeSnapshotEntry[] = [];
  const visit = async (absolute: string, relative: string): Promise<void> => {
    const stat = await fs.lstat(absolute);
    const kind = stat.isDirectory()
      ? 'directory'
      : stat.isFile()
        ? 'file'
        : stat.isSymbolicLink()
          ? 'symlink'
          : 'other';
    const entry: TreeSnapshotEntry = {
      path: relative,
      kind,
      mode: stat.mode,
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      ctimeMs: stat.ctimeMs,
      birthtimeMs: stat.birthtimeMs,
      dev: stat.dev,
      ino: stat.ino,
      nlink: stat.nlink,
    };
    if (kind === 'file') entry.bytes = (await fs.readFile(absolute)).toString('base64');
    if (kind === 'symlink') entry.target = await fs.readlink(absolute);
    entries.push(entry);
    if (kind === 'directory') {
      const children = (await fs.readdir(absolute)).toSorted();
      await Promise.all(
        children.map((child) => visit(path.join(absolute, child), relative === '.' ? child : `${relative}/${child}`))
      );
    }
  };
  await visit(root, '.');
  return entries.toSorted((left, right) => left.path.localeCompare(right.path));
}

const {
  handlers,
  createCommand,
  mockConversationService,
  mockWorkerTaskManager,
  mockListJobsByConversation,
  mockDatabase,
  mockCleanupConversation,
} = vi.hoisted(() => {
  const registered: Record<string, Provider> = {};
  const commandFactory = (key: string) => ({
    provider: vi.fn((handler: Provider) => {
      registered[key] = handler;
    }),
    invoke: vi.fn(),
    emit: vi.fn(),
  });

  const workerTaskManager = {
    getTask: vi.fn(),
    getOrBuildTask: vi.fn(),
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
    handlers: registered,
    createCommand: commandFactory,
    mockListJobsByConversation: vi.fn(async () => []),
    mockCleanupConversation: vi.fn(async () => {}),
    mockDatabase: {
      getConversation: vi.fn(),
      deleteConversation: vi.fn(() => ({ success: true, data: true })),
      getUserConversations: vi.fn(() => ({ data: [] })),
    },
    mockConversationService: {
      createConversation: vi.fn(),
      prepareDeleteConversation: vi.fn(async (id: string) => () => {
        void deleteConversation(id);
      }),
      deleteConversation,
      updateConversation: vi.fn(),
      getConversation: vi.fn(),
      createWithMigration: vi.fn(),
      listAllConversations: vi.fn(async () => []),
      getConversationsByCronJob: vi.fn(async () => []),
    },
    mockWorkerTaskManager: workerTaskManager,
  };
});

vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: { listJobsByConversation: mockListJobsByConversation },
}));

vi.mock('@process/channels/core/ChannelManager', () => ({
  getChannelManager: vi.fn(() => ({
    isInitialized: vi.fn(() => true),
    cleanupConversation: mockCleanupConversation,
  })),
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

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('conversation.remove managed-workspace retention', () => {
  let root: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockWorkerTaskManager.withConversationShutdown.mockImplementation(
      async (id: string, prepare: () => Promise<unknown>, commit: (prepared: unknown) => unknown) => {
        await mockWorkerTaskManager.kill(id);
        const prepared = await prepare();
        await mockWorkerTaskManager.kill(id);
        return commit(prepared);
      }
    );
    for (const key of Object.keys(handlers)) delete handlers[key];
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-conversation-remove-'));
    mockListJobsByConversation.mockResolvedValue([]);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('severs the database reference while preserving the complete managed workspace tree', async () => {
    const workspace = path.join(root, 'wcore-temp-1736900000000');
    const nested = path.join(workspace, 'drafts', 'chapter-1');
    const artifact = path.join(nested, 'report.bin');
    const notes = path.join(workspace, 'notes.md');
    const empty = path.join(nested, 'empty.txt');
    const hardlink = path.join(workspace, 'report-hardlink.bin');
    const symlink = path.join(workspace, 'report-link.bin');
    const expectedBytes = Uint8Array.from([0, 1, 2, 127, 128, 254, 255]);
    await fs.mkdir(nested, { recursive: true });
    await fs.writeFile(artifact, expectedBytes);
    await fs.writeFile(notes, '# retained\nEvery byte matters.\n');
    await fs.writeFile(empty, '');
    let hardlinkSupported = true;
    let symlinkSupported = true;
    try {
      await fs.link(artifact, hardlink);
    } catch {
      hardlinkSupported = false;
    }
    try {
      await fs.symlink(artifact, symlink, 'file');
    } catch {
      symlinkSupported = false;
    }
    const fixedTime = new Date('2026-06-01T12:34:56.000Z');
    if (process.platform !== 'win32') {
      await fs.chmod(workspace, 0o750);
      await fs.chmod(nested, 0o710);
      await fs.chmod(artifact, 0o640);
      await fs.chmod(notes, 0o600);
    }
    await fs.utimes(artifact, fixedTime, fixedTime);
    await fs.utimes(notes, fixedTime, fixedTime);
    await fs.utimes(empty, fixedTime, fixedTime);
    await fs.utimes(nested, fixedTime, fixedTime);
    await fs.utimes(path.dirname(nested), fixedTime, fixedTime);
    await fs.utimes(workspace, fixedTime, fixedTime);
    const before = await snapshotTree(workspace);
    if (hardlinkSupported) {
      const artifactEntry = before.find((entry) => entry.path === 'drafts/chapter-1/report.bin');
      const hardlinkEntry = before.find((entry) => entry.path === 'report-hardlink.bin');
      expect(hardlinkEntry?.ino).toBe(artifactEntry?.ino);
      expect(hardlinkEntry?.nlink).toBeGreaterThanOrEqual(2);
    }
    if (symlinkSupported) expect(before.find((entry) => entry.path === 'report-link.bin')?.kind).toBe('symlink');
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
    expect(await snapshotTree(workspace)).toEqual(before);
    await expect(fs.readFile(artifact)).resolves.toEqual(Buffer.from(expectedBytes));
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

  it('keeps persistence until every replaced same-ID process has stopped', async () => {
    let finishOriginal!: () => void;
    let finishSuccessor!: () => void;
    const originalShutdown = new Promise<void>((resolve) => {
      finishOriginal = resolve;
    });
    const successorShutdown = new Promise<void>((resolve) => {
      finishSuccessor = resolve;
    });
    const manager = new WorkerTaskManager(
      { create: vi.fn(), register: vi.fn() } as never,
      { getConversation: vi.fn() } as never
    );
    const makeAgent = (workspace: string, kill: () => Promise<void>) =>
      ({
        type: 'acp',
        status: 'running',
        workspace,
        conversation_id: 'conv-replaced',
        lastActivityAt: Date.now(),
        kill: vi.fn(kill),
      }) as never;
    manager.addTask(
      'conv-replaced',
      makeAgent(path.join(root, 'wcore-temp-1736900000010'), () => originalShutdown)
    );
    manager.addTask(
      'conv-replaced',
      makeAgent(path.join(root, 'wcore-temp-1736900000011'), () => successorShutdown)
    );
    mockConversationService.getConversation.mockResolvedValue({
      id: 'conv-replaced',
      source: 'wayland',
      extra: { workspace: path.join(root, 'wcore-temp-1736900000011') },
    });

    try {
      initConversationBridge(mockConversationService as unknown as IConversationService, manager);
      const removal = handlers['conversation.remove']({ id: 'conv-replaced' });

      finishSuccessor();
      await vi.waitFor(() => expect(manager.listWorkspaceAuthorities()).toHaveLength(1));
      expect(mockConversationService.deleteConversation).not.toHaveBeenCalled();

      finishOriginal();
      await expect(removal).resolves.toBe(true);
      expect(manager.listWorkspaceAuthorities()).toEqual([]);
      expect(mockConversationService.deleteConversation).toHaveBeenCalledWith('conv-replaced');
    } finally {
      finishOriginal();
      finishSuccessor();
      await manager.clear();
    }
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

  it('does not destroy channel resources when deletion later fails closed', async () => {
    mockConversationService.getConversation.mockResolvedValue({
      id: 'conv-channel-rollback',
      source: 'telegram',
      extra: { workspace: path.join(root, 'wcore-temp-1736900000100') },
    });
    mockWorkerTaskManager.withConversationShutdown.mockImplementation(
      async (_id: string, prepare: () => Promise<unknown>) => {
        await prepare();
        throw new Error('process successor remains alive');
      }
    );

    initConversationBridge(
      mockConversationService as unknown as IConversationService,
      mockWorkerTaskManager as unknown as IWorkerTaskManager
    );

    await expect(handlers['conversation.remove']({ id: 'conv-channel-rollback' })).resolves.toBe(false);
    expect(mockConversationService.prepareDeleteConversation).toHaveBeenCalledWith('conv-channel-rollback');
    expect(mockCleanupConversation).not.toHaveBeenCalled();
  });

  it('cleans channel resources only after durable deletion commits', async () => {
    const order: string[] = [];
    mockWorkerTaskManager.kill.mockResolvedValue(undefined);
    mockConversationService.getConversation.mockResolvedValue({
      id: 'conv-channel-success',
      source: 'telegram',
      extra: { workspace: path.join(root, 'wcore-temp-1736900000101') },
    });
    mockConversationService.prepareDeleteConversation.mockResolvedValue(() => {
      order.push('delete');
    });
    mockCleanupConversation.mockImplementation(async () => {
      order.push('channel-cleanup');
    });

    initConversationBridge(
      mockConversationService as unknown as IConversationService,
      mockWorkerTaskManager as unknown as IWorkerTaskManager
    );

    await expect(handlers['conversation.remove']({ id: 'conv-channel-success' })).resolves.toBe(true);
    expect(order).toEqual(['delete', 'channel-cleanup']);
  });

  it('does not let a stale Wayland source snapshot suppress commit-authorized cleanup', async () => {
    const order: string[] = [];
    mockConversationService.getConversation.mockResolvedValue({
      id: 'conv-source-race',
      source: 'wayland',
      extra: { workspace: path.join(root, 'wcore-temp-1736900000103') },
    });
    mockConversationService.prepareDeleteConversation.mockResolvedValue(() => {
      // The production transaction re-reads the authoritative source here and
      // records a durable intent when it changed to a channel source.
      order.push('commit-authorized-intent');
    });
    mockCleanupConversation.mockImplementation(async () => {
      order.push('channel-cleanup');
      return true;
    });

    initConversationBridge(
      mockConversationService as unknown as IConversationService,
      mockWorkerTaskManager as unknown as IWorkerTaskManager
    );

    await expect(handlers['conversation.remove']({ id: 'conv-source-race' })).resolves.toBe(true);
    expect(order).toEqual(['commit-authorized-intent', 'channel-cleanup']);
  });

  it('deletes exactly once after a failed shutdown is later verified', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const manager = new WorkerTaskManager(
      { create: vi.fn(), register: vi.fn() } as never,
      { getConversation: vi.fn() } as never
    );
    let shutdownAttempts = 0;
    const running = {
      type: 'acp',
      status: 'running',
      workspace: path.join(root, 'wcore-temp-1736900000104'),
      conversation_id: 'conv-shutdown-retry',
      lastActivityAt: Date.now(),
      kill: vi.fn(async () => {
        shutdownAttempts += 1;
        if (shutdownAttempts === 1) throw new Error('transient shutdown proof failure');
      }),
    };
    const deleteCommit = vi.fn();
    mockConversationService.getConversation.mockResolvedValue({
      id: 'conv-shutdown-retry',
      source: 'wayland',
      extra: { workspace: running.workspace },
    });
    mockConversationService.prepareDeleteConversation.mockResolvedValue(deleteCommit);
    manager.addTask('conv-shutdown-retry', running as never);

    try {
      initConversationBridge(mockConversationService as unknown as IConversationService, manager);
      await expect(handlers['conversation.remove']({ id: 'conv-shutdown-retry' })).resolves.toBe(false);
      expect(deleteCommit).not.toHaveBeenCalled();
      expect(manager.listWorkspaceAuthorities()).toHaveLength(1);

      await expect(handlers['conversation.remove']({ id: 'conv-shutdown-retry' })).resolves.toBe(true);
      expect(running.kill).toHaveBeenCalledTimes(2);
      expect(deleteCommit).toHaveBeenCalledOnce();
      expect(manager.listWorkspaceAuthorities()).toEqual([]);
    } finally {
      errorLog.mockRestore();
      await manager.clear();
    }
  });

  it('rejects a deferred removal when a callback-time process refuses to stop', async () => {
    const preparation = deferred<void>();
    const preparationStarted = deferred<void>();
    const successorShutdown = deferred<void>();
    const deleteCommit = vi.fn();
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const manager = new WorkerTaskManager(
      { create: vi.fn(), register: vi.fn() } as never,
      { getConversation: vi.fn() } as never
    );
    const successor = {
      type: 'acp',
      status: 'running',
      workspace: path.join(root, 'wcore-temp-1736900000200'),
      conversation_id: 'conv-callback-race',
      lastActivityAt: Date.now(),
      kill: vi.fn(() => successorShutdown.promise),
    };
    mockConversationService.getConversation.mockResolvedValue({
      id: 'conv-callback-race',
      source: 'wayland',
      extra: { workspace: successor.workspace },
    });
    mockConversationService.prepareDeleteConversation.mockImplementation(async () => {
      preparationStarted.resolve();
      await preparation.promise;
      return deleteCommit;
    });

    try {
      initConversationBridge(mockConversationService as unknown as IConversationService, manager);
      const removal = handlers['conversation.remove']({ id: 'conv-callback-race' });
      await preparationStarted.promise;

      expect(() => manager.addTask('conv-callback-race', successor as never)).toThrow('Conversation is shutting down');
      const result = expect(removal).resolves.toBe(false);
      preparation.resolve();
      successorShutdown.reject(new Error('callback-time process still alive'));
      await result;

      expect(deleteCommit).not.toHaveBeenCalled();
      expect(mockConversationService.deleteConversation).not.toHaveBeenCalled();
      expect(manager.listWorkspaceAuthorities()).toEqual([{ id: 'active-process-1', workspace: successor.workspace }]);
      expect(errorLog).toHaveBeenCalledWith('[conversationBridge] Failed to remove conversation:', expect.any(Error));
    } finally {
      preparation.resolve();
      successorShutdown.resolve();
      await manager.clear();
      errorLog.mockRestore();
    }
  });
});
