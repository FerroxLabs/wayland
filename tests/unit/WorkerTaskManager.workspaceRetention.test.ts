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

function agent(kill: () => Promise<void>) {
  return {
    type: 'acp',
    status: 'running',
    workspace: '/managed/work/claude-temp-1736900000000',
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
});
