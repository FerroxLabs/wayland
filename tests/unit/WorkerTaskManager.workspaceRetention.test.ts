/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkerTaskManager } from '@/process/task/WorkerTaskManager';
import type { IConversationRepository } from '@/process/services/database/IConversationRepository';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: vi.fn(() => '/tmp') } }));

const repo = { getConversation: vi.fn() } as unknown as IConversationRepository;
const factory = { create: vi.fn(), register: vi.fn() };
const managers: WorkerTaskManager[] = [];

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function agent(kill: () => Promise<void>, workspace = '/managed/work/claude-temp-1736900000000') {
  return {
    type: 'acp',
    status: 'running',
    workspace,
    conversation_id: 'conv-1',
    lastActivityAt: Date.now(),
    kill: vi.fn(kill),
  };
}

afterEach(async () => {
  await Promise.all(managers.splice(0).map((manager) => manager.clear()));
});

describe('WorkerTaskManager retention authority', () => {
  it('retains a terminating process lease until shutdown actually resolves', async () => {
    const shutdown = deferred<void>();
    const manager = new WorkerTaskManager(factory as never, repo);
    managers.push(manager);
    manager.addTask('conv-1', agent(() => shutdown.promise) as never);

    const termination = manager.kill('conv-1');
    expect(manager.getTask('conv-1')).toBeUndefined();
    expect(manager.listTasks()).toEqual([{ id: 'conv-1', type: 'acp' }]);
    expect(manager.listWorkspaceAuthorities()).toEqual([
      { id: 'active-process-1', workspace: '/managed/work/claude-temp-1736900000000' },
    ]);

    shutdown.resolve();
    await termination;
    expect(manager.listTasks()).toEqual([]);
  });

  it('keeps the process lease authoritative when shutdown rejects', async () => {
    const manager = new WorkerTaskManager(factory as never, repo);
    managers.push(manager);
    const running = agent(async () => {
      throw new Error('process still alive');
    });
    manager.addTask('conv-1', running as never);

    await expect(manager.kill('conv-1')).rejects.toThrow('process still alive');
    expect(manager.listTasks()).toEqual([{ id: 'conv-1', type: 'acp' }]);
    expect(running.kill).toHaveBeenCalledOnce();
  });

  it('preserves each same-ID terminating lease under its real original workspace', async () => {
    const shutdown = deferred<void>();
    const manager = new WorkerTaskManager(factory as never, repo);
    managers.push(manager);
    const originalWorkspace = '/managed/work/claude-temp-1736900000001';
    const successorWorkspace = '/managed/work/claude-temp-1736900000002';

    manager.addTask('conv-1', agent(() => shutdown.promise, originalWorkspace) as never);
    manager.addTask('conv-1', agent(async () => undefined, successorWorkspace) as never);

    expect(manager.getTask('conv-1')?.workspace).toBe(successorWorkspace);
    expect(manager.listWorkspaceAuthorities()).toEqual([
      { id: 'active-process-1', workspace: originalWorkspace },
      { id: 'active-process-2', workspace: successorWorkspace },
    ]);

    shutdown.resolve();
    await vi.waitFor(() =>
      expect(manager.listWorkspaceAuthorities()).toEqual([{ id: 'active-process-2', workspace: successorWorkspace }])
    );
  });

  it('awaits every same-ID lease before conversation shutdown is complete', async () => {
    const originalShutdown = deferred<void>();
    const successorShutdown = deferred<void>();
    const manager = new WorkerTaskManager(factory as never, repo);
    managers.push(manager);

    manager.addTask('conv-1', agent(() => originalShutdown.promise, '/managed/work/wcore-temp-1736900000010') as never);
    manager.addTask(
      'conv-1',
      agent(() => successorShutdown.promise, '/managed/work/wcore-temp-1736900000011') as never
    );

    let settled = false;
    const termination = manager.kill('conv-1').then(() => {
      settled = true;
    });
    successorShutdown.resolve();
    await vi.waitFor(() => expect(manager.listWorkspaceAuthorities()).toHaveLength(1));
    expect(settled).toBe(false);
    expect(manager.listWorkspaceAuthorities()).toEqual([
      { id: 'active-process-1', workspace: '/managed/work/wcore-temp-1736900000010' },
    ]);

    originalShutdown.resolve();
    await termination;
    expect(manager.listWorkspaceAuthorities()).toEqual([]);
  });

  it('fails same-ID shutdown closed when an older terminating lease rejects', async () => {
    const manager = new WorkerTaskManager(factory as never, repo);
    managers.push(manager);
    manager.addTask(
      'conv-1',
      agent(async () => {
        throw new Error('older process still alive');
      }, '/managed/work/wcore-temp-1736900000012') as never
    );
    manager.addTask('conv-1', agent(async () => undefined, '/managed/work/wcore-temp-1736900000013') as never);

    await expect(manager.kill('conv-1')).rejects.toThrow('older process still alive');
    expect(manager.listWorkspaceAuthorities()).toEqual([
      { id: 'active-process-1', workspace: '/managed/work/wcore-temp-1736900000012' },
    ]);
  });
});
