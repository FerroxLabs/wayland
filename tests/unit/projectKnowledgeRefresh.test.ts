/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #999 - project knowledge must not freeze at conversation creation.
 *
 * The project's `.wayland/` knowledge is composed into the conversation's
 * system-rules channel (`extra.presetRules` / `extra.presetContext`) once, when
 * the chat is created, and then persisted. Every later agent spawn re-used that
 * frozen string, so editing CONTEXT.md never reached an existing conversation -
 * the user had to start a brand new chat.
 *
 * These tests drive the real spawn seam (`WorkerTaskManager.getOrBuildTask`),
 * which is where every backend's manager is handed the conversation's `extra`.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: vi.fn(() => '/tmp') } }));
vi.mock('@process/utils/initStorage', () => ({ ProcessConfig: { get: vi.fn(async () => false) } }));
vi.mock('@process/services/cron/CronBusyGuard', () => ({ cronBusyGuard: { isBusy: vi.fn(() => false) } }));

const mockGetProject = vi.hoisted(() => vi.fn(async (_id: string) => null as { workspace?: string } | null));
vi.mock('@process/services/database/SqliteProjectRepository', () => ({
  SqliteProjectRepository: class {
    getProject = mockGetProject;
  },
}));

import { loadProjectKnowledgeBlock, writeProjectKnowledge } from '@process/services/projectKnowledge/knowledge';
import { WorkerTaskManager } from '../../src/process/task/WorkerTaskManager';
import type { IAgentFactory } from '../../src/process/task/IAgentFactory';
import type { IConversationRepository } from '../../src/process/services/database/IConversationRepository';
import type { TChatConversation } from '../../src/common/config/storage';

/** Same separator `ConversationServiceImpl` uses between injected blocks. */
const SEPARATOR = '\n\n---\n\n';
/** Stable header every injected project-knowledge block starts with. */
const HEADER = '[Project Knowledge - shared context for every chat in this project]';

function makeRepo(
  conversation: TChatConversation | undefined,
  overrides: Partial<IConversationRepository> = {}
): IConversationRepository {
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
      return { kill: vi.fn() } as any;
    }),
  } as unknown as IAgentFactory;
}

const spawnedExtra = (captured: { conv?: TChatConversation }): Record<string, unknown> =>
  (captured.conv as TChatConversation).extra as Record<string, unknown>;

const occurrences = (haystack: string, needle: string): number => haystack.split(needle).length - 1;

describe('#999 project knowledge is re-read at spawn, not frozen at creation', () => {
  let ws: string;
  let manager: WorkerTaskManager | undefined;

  beforeEach(async () => {
    ws = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-knowledge-refresh-'));
    mockGetProject.mockReset();
    mockGetProject.mockResolvedValue({ workspace: ws });
  });

  afterEach(async () => {
    await manager?.clear();
    manager = undefined;
    await fs.rm(ws, { recursive: true, force: true });
  });

  /** Build the `extra` a chat is created with today: base rules + the block as of creation. */
  async function frozenExtra(baseRules: string): Promise<Record<string, unknown>> {
    const block = await loadProjectKnowledgeBlock(ws);
    return {
      projectId: 'p1',
      workspace: ws,
      presetRules: [baseRules, block].filter(Boolean).join(SEPARATOR),
      presetContext: block,
    };
  }

  it('an edit to CONTEXT.md after creation reaches the next agent spawn', async () => {
    await writeProjectKnowledge(ws, 'context', 'Ship on Fridays.');
    const extra = await frozenExtra('ASSISTANT BASE RULES');
    expect(extra.presetRules).toContain('Ship on Fridays.');

    // The user fixes a mistake in the project's knowledge, mid-conversation.
    await writeProjectKnowledge(ws, 'context', 'Ship on Tuesdays.');

    const conversation = { id: 'c1', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    const repo = makeRepo(conversation);
    manager = new WorkerTaskManager(makeFactory(captured), repo);

    await manager.getOrBuildTask('c1');

    const spawned = spawnedExtra(captured);
    expect(spawned.presetRules).toContain('Ship on Tuesdays.');
    expect(spawned.presetRules).not.toContain('Ship on Fridays.');
    expect(spawned.presetContext).toContain('Ship on Tuesdays.');
    expect(spawned.presetContext).not.toContain('Ship on Fridays.');
    // The assistant's own rules must survive the refresh untouched.
    expect(spawned.presetRules).toContain('ASSISTANT BASE RULES');
    // Exactly one knowledge block - a refresh must replace, never append.
    expect(occurrences(spawned.presetRules as string, HEADER)).toBe(1);
    // The refreshed value is persisted so it survives a restart.
    expect(repo.updateConversation).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ extra: expect.objectContaining({ presetRules: spawned.presetRules }) })
    );
  });

  it('is idempotent: an unchanged knowledge file neither duplicates nor re-persists', async () => {
    await writeProjectKnowledge(ws, 'context', 'Ship on Fridays.');
    const extra = await frozenExtra('ASSISTANT BASE RULES');
    const conversation = { id: 'c2', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    const repo = makeRepo(conversation);
    manager = new WorkerTaskManager(makeFactory(captured), repo);

    await manager.getOrBuildTask('c2');
    await manager.getOrBuildTask('c2', { skipCache: true });

    const spawned = spawnedExtra(captured);
    expect(occurrences(spawned.presetRules as string, HEADER)).toBe(1);
    expect(occurrences(spawned.presetContext as string, HEADER)).toBe(1);
    expect(repo.updateConversation).not.toHaveBeenCalled();
  });

  it('emptied project knowledge is removed from the system-rules channel', async () => {
    await writeProjectKnowledge(ws, 'context', 'Ship on Fridays.');
    const extra = await frozenExtra('ASSISTANT BASE RULES');
    // The user clears the document.
    await writeProjectKnowledge(ws, 'context', '');

    const conversation = { id: 'c3', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    manager = new WorkerTaskManager(makeFactory(captured), makeRepo(conversation));

    await manager.getOrBuildTask('c3');

    const spawned = spawnedExtra(captured);
    expect(spawned.presetRules).toBe('ASSISTANT BASE RULES');
    expect(spawned.presetContext).toBeUndefined();
  });

  it('a chat moved into a project after creation gets its knowledge at spawn', async () => {
    // ProjectServiceImpl.assignConversation only stamps extra.projectId, so a
    // re-parented chat never had a knowledge block at all.
    await writeProjectKnowledge(ws, 'context', 'Ship on Tuesdays.');
    const conversation = {
      id: 'c6',
      type: 'wcore',
      extra: { projectId: 'p1', workspace: ws, presetRules: 'ASSISTANT BASE RULES' },
    } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    manager = new WorkerTaskManager(makeFactory(captured), makeRepo(conversation));

    await manager.getOrBuildTask('c6');

    const spawned = spawnedExtra(captured);
    expect(spawned.presetRules).toContain('ASSISTANT BASE RULES');
    expect(spawned.presetRules).toContain('Ship on Tuesdays.');
    expect(spawned.presetContext).toContain('Ship on Tuesdays.');
  });

  it('leaves a chat that is not in a project untouched', async () => {
    const conversation = {
      id: 'c4',
      type: 'wcore',
      extra: { workspace: '/tmp/wcore-temp-999', presetRules: 'ASSISTANT BASE RULES' },
    } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    const repo = makeRepo(conversation);
    manager = new WorkerTaskManager(makeFactory(captured), repo);

    await manager.getOrBuildTask('c4');

    expect(mockGetProject).not.toHaveBeenCalled();
    expect(spawnedExtra(captured).presetRules).toBe('ASSISTANT BASE RULES');
    expect(repo.updateConversation).not.toHaveBeenCalled();
  });

  it('a failed project lookup leaves the frozen block in place rather than dropping it', async () => {
    await writeProjectKnowledge(ws, 'context', 'Ship on Fridays.');
    const extra = await frozenExtra('ASSISTANT BASE RULES');
    const before = extra.presetRules as string;
    mockGetProject.mockRejectedValue(new Error('db offline'));

    const conversation = { id: 'c5', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    const repo = makeRepo(conversation);
    manager = new WorkerTaskManager(makeFactory(captured), repo);

    await manager.getOrBuildTask('c5');

    expect(spawnedExtra(captured).presetRules).toBe(before);
    expect(repo.updateConversation).not.toHaveBeenCalled();
  });
});
