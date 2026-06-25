/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: vi.fn(() => '/tmp') } }));
vi.mock('@process/utils/initStorage', () => ({ ProcessConfig: { get: vi.fn(async () => false) } }));
vi.mock('@process/services/cron/CronBusyGuard', () => ({ cronBusyGuard: { isBusy: vi.fn(() => false) } }));

const mockGetProject = vi.hoisted(() => vi.fn(async (_id: string) => null as { workspace?: string } | null));
vi.mock('@process/services/database/SqliteProjectRepository', () => ({
  SqliteProjectRepository: class {
    getProject = mockGetProject;
  },
}));

import { WorkerTaskManager } from '../../src/process/task/WorkerTaskManager';
import type { IAgentFactory } from '../../src/process/task/IAgentFactory';
import type { IConversationRepository } from '../../src/process/services/database/IConversationRepository';
import type { TChatConversation } from '../../src/common/config/storage';

function makeRepo(conversation: TChatConversation | undefined, overrides: Partial<IConversationRepository> = {}): IConversationRepository {
  return {
    getConversation: vi.fn(async () => conversation),
    createConversation: vi.fn(),
    updateConversation: vi.fn(async () => {}),
    deleteConversation: vi.fn(),
    getMessages: vi.fn(() => ({ data: [], total: 0, hasMore: false })),
    insertMessage: vi.fn(),
    getUserConversations: vi.fn(() => ({ data: [], total: 0, hasMore: false })),
    listAllConversations: vi.fn(async () => []),
    searchMessages: vi.fn(async () => ({ data: [], total: 0, hasMore: false })),
    getConversationsByCronJob: vi.fn(async () => []),
    ...overrides,
  } as unknown as IConversationRepository;
}

function makeFactory(captured: { conv?: TChatConversation }): IAgentFactory {
  return {
    register: vi.fn(),
    create: vi.fn((conv: TChatConversation) => {
      captured.conv = conv;
      return { task: { kill: vi.fn() } } as any;
    }),
  } as unknown as IAgentFactory;
}

describe('WorkerTaskManager #30 spawn-time no-drift', () => {
  let manager: WorkerTaskManager | undefined;

  beforeEach(() => {
    mockGetProject.mockReset();
    mockGetProject.mockResolvedValue(null);
  });

  afterEach(async () => {
    await manager?.clear();
    manager = undefined;
  });

  it('corrects a drifted project chat and persists the fix before spawn', async () => {
    mockGetProject.mockResolvedValueOnce({ workspace: '/projects/alpha' });
    const conversation = {
      id: 'c1',
      type: 'wcore',
      extra: { projectId: 'p1', workspace: '/tmp/wcore-temp-123' },
    } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    const repo = makeRepo(conversation);
    const factory = makeFactory(captured);
    manager = new WorkerTaskManager(factory, repo);

    await manager.getOrBuildTask('c1');

    // The agent factory must see the corrected (project) workspace.
    expect(((captured.conv as TChatConversation).extra as Record<string, unknown>).workspace).toBe('/projects/alpha');
    // The correction must be persisted so it survives the next restart.
    expect(repo.updateConversation).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ extra: expect.objectContaining({ workspace: '/projects/alpha' }) })
    );
  });

  it('does not persist when a project chat is already correctly pinned', async () => {
    mockGetProject.mockResolvedValueOnce({ workspace: '/projects/alpha' });
    const conversation = {
      id: 'c2',
      type: 'wcore',
      extra: { projectId: 'p1', workspace: '/projects/alpha' },
    } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    const repo = makeRepo(conversation);
    manager = new WorkerTaskManager(makeFactory(captured), repo);

    await manager.getOrBuildTask('c2');

    expect(repo.updateConversation).not.toHaveBeenCalled();
    expect(((captured.conv as TChatConversation).extra as Record<string, unknown>).workspace).toBe('/projects/alpha');
  });

  it('leaves a non-project chat untouched', async () => {
    const conversation = {
      id: 'c3',
      type: 'wcore',
      extra: { workspace: '/tmp/wcore-temp-999' },
    } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    const repo = makeRepo(conversation);
    manager = new WorkerTaskManager(makeFactory(captured), repo);

    await manager.getOrBuildTask('c3');

    expect(mockGetProject).not.toHaveBeenCalled();
    expect(repo.updateConversation).not.toHaveBeenCalled();
    expect(((captured.conv as TChatConversation).extra as Record<string, unknown>).workspace).toBe('/tmp/wcore-temp-999');
  });
});
