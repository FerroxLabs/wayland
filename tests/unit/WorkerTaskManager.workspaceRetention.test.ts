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

  it('blocks and drains a same-ID successor for the entire durable removal operation', async () => {
    const originalShutdown = deferred<void>();
    const successorShutdown = deferred<void>();
    const manager = new WorkerTaskManager(factory as never, repo);
    managers.push(manager);
    manager.addTask('conv-1', agent(() => originalShutdown.promise) as never);

    let preparationStarted = false;
    const commit = vi.fn();
    const removal = manager.withConversationShutdown(
      'conv-1',
      async () => {
        preparationStarted = true;
        expect(manager.listWorkspaceAuthorities()).toEqual([]);
      },
      commit
    );
    await vi.waitFor(() => expect(manager.getTask('conv-1')).toBeUndefined());

    const successor = agent(() => successorShutdown.promise, '/managed/work/wcore-temp-1736900000099');
    expect(() => manager.addTask('conv-1', successor as never)).toThrow('Conversation is shutting down');
    expect(preparationStarted).toBe(false);
    expect(manager.listWorkspaceAuthorities()).toHaveLength(2);

    originalShutdown.resolve();
    await vi.waitFor(() => expect(manager.listWorkspaceAuthorities()).toHaveLength(1));
    expect(preparationStarted).toBe(false);

    successorShutdown.resolve();
    await removal;
    expect(successor.kill).toHaveBeenCalledOnce();
    expect(preparationStarted).toBe(true);
    expect(commit).toHaveBeenCalledOnce();
    expect(manager.listWorkspaceAuthorities()).toEqual([]);
  });

  it('rejects removal when a callback-time successor cannot be stopped', async () => {
    const persistence = deferred<void>();
    const persistenceStarted = deferred<void>();
    const successorShutdown = deferred<void>();
    const manager = new WorkerTaskManager(factory as never, repo);
    managers.push(manager);

    const commit = vi.fn(() => 'removed');
    const removal = manager.withConversationShutdown(
      'conv-1',
      async () => {
        persistenceStarted.resolve();
        await persistence.promise;
        return 'prepared';
      },
      commit
    );
    await persistenceStarted.promise;

    const successor = agent(() => successorShutdown.promise, '/managed/work/wcore-temp-1736900000100');
    expect(() => manager.addTask('conv-1', successor as never)).toThrow('Conversation is shutting down');

    const rejected = expect(removal).rejects.toThrow('callback-time process still alive');
    persistence.resolve();
    successorShutdown.reject(new Error('callback-time process still alive'));
    await rejected;

    expect(commit).not.toHaveBeenCalled();
    expect(manager.listWorkspaceAuthorities()).toEqual([
      { id: 'active-process-1', workspace: '/managed/work/wcore-temp-1736900000100' },
    ]);
    expect(() => manager.addTask('conv-1', agent(async () => undefined) as never)).toThrow(
      'Conversation is shutting down'
    );
  });

  it('commits in the same microtask as the final empty-lease observation', async () => {
    const manager = new WorkerTaskManager(factory as never, repo);
    managers.push(manager);
    const successorAdded = deferred<void>();
    const order: string[] = [];
    const successor = agent(async () => {
      order.push('successor-kill');
    }, '/managed/work/wcore-temp-1736900000101');
    const taskList = (manager as unknown as { taskList: unknown[] }).taskList;
    let someReads = 0;
    (manager as unknown as { taskList: unknown[] }).taskList = new Proxy(taskList, {
      get(target, property, receiver) {
        if (property === 'some') {
          someReads += 1;
          if (someReads === 4) {
            queueMicrotask(() => {
              try {
                manager.addTask('conv-1', successor as never);
              } catch {
                // The permanent terminal gate must refuse this stale successor.
              } finally {
                successorAdded.resolve();
              }
            });
          }
        }
        return Reflect.get(target, property, receiver);
      },
    });

    await manager.withConversationShutdown(
      'conv-1',
      async () => 'prepared',
      () => {
        order.push('commit');
      }
    );
    await successorAdded.promise;

    expect(order).toEqual(['commit', 'successor-kill']);
    expect(manager.listWorkspaceAuthorities()).toEqual([]);
  });

  it('observes and catches idle shutdown rejection without an unhandled promise', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const manager = new WorkerTaskManager(factory as never, repo);
    managers.push(manager);
    const idleAgent = {
      ...agent(async () => {
        throw new Error('idle process still alive');
      }),
      status: 'finished',
      lastActivityAt: 0,
    };
    manager.addTask('conv-idle', idleAgent as never);

    await (
      manager as unknown as {
        killIdleCliAgents(): Promise<void>;
      }
    ).killIdleCliAgents();

    expect(warn).toHaveBeenCalledWith(
      '[WorkerTaskManager] failed to stop idle conversation conv-idle:',
      expect.objectContaining({ message: 'idle process still alive' })
    );
    expect(manager.listWorkspaceAuthorities()).toHaveLength(1);
    warn.mockRestore();
  });

  it('releases the terminal gate when durable removal fails', async () => {
    const manager = new WorkerTaskManager(factory as never, repo);
    managers.push(manager);

    await expect(
      manager.withConversationShutdown(
        'conv-1',
        async () => 'prepared',
        () => {
          throw new Error('database unavailable');
        }
      )
    ).rejects.toThrow('database unavailable');

    expect(() => manager.addTask('conv-1', agent(async () => undefined) as never)).not.toThrow();
  });

  it('tombstones a removed ID against an in-flight stale repository read', async () => {
    const lookup = deferred<{
      id: string;
      extra: { workspace: string };
    }>();
    const localRepo = { getConversation: vi.fn(() => lookup.promise) } as unknown as IConversationRepository;
    const localFactory = { create: vi.fn(() => agent(async () => undefined)), register: vi.fn() };
    const manager = new WorkerTaskManager(localFactory as never, localRepo);
    managers.push(manager);

    const staleBuild = manager.getOrBuildTask('conv-stale');
    await vi.waitFor(() => expect(localRepo.getConversation).toHaveBeenCalledWith('conv-stale'));
    await manager.withConversationShutdown(
      'conv-stale',
      async () => undefined,
      () => undefined
    );

    lookup.resolve({
      id: 'conv-stale',
      extra: { workspace: '/managed/work/wcore-temp-1736900000199' },
    });
    await expect(staleBuild).rejects.toThrow('Conversation is shutting down: conv-stale');
    expect(localFactory.create).not.toHaveBeenCalled();
    expect(manager.listWorkspaceAuthorities()).toEqual([]);
  });
});
