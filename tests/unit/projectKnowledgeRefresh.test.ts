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
/** Stable footer closing every injected project-knowledge block. */
const FOOTER = '[/Project Knowledge]';

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

  // A markdown thematic break in the user's own knowledge produces the exact
  // byte sequence blocks are joined with. Removal must not be fooled by it.
  it('replaces the whole block when the knowledge body contains a thematic break', async () => {
    await writeProjectKnowledge(ws, 'context', 'Ship on Fridays.\n\n---\n\nSecret note: OLD VALUE');
    const extra = await frozenExtra('ASSISTANT BASE RULES');
    expect(extra.presetRules).toContain('OLD VALUE');

    await writeProjectKnowledge(ws, 'context', 'Ship on Tuesdays.\n\n---\n\nSecret note: NEW VALUE');

    const conversation = { id: 'c7', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    manager = new WorkerTaskManager(makeFactory(captured), makeRepo(conversation));

    await manager.getOrBuildTask('c7');
    const first = spawnedExtra(captured).presetRules as string;
    expect(first).toContain('NEW VALUE');
    expect(first).not.toContain('OLD VALUE');
    expect(first).toContain('ASSISTANT BASE RULES');
    expect(occurrences(first, HEADER)).toBe(1);

    // ...and it must not grow, or re-persist, on every later spawn.
    await manager.getOrBuildTask('c7', { skipCache: true });
    await manager.getOrBuildTask('c7', { skipCache: true });
    const third = spawnedExtra(captured).presetRules as string;
    expect(third).toBe(first);
    expect(occurrences(third, HEADER)).toBe(1);
  });

  it('is not truncated by sentinel literals typed into the knowledge body', async () => {
    await writeProjectKnowledge(ws, 'context', `Ship on Fridays. ${HEADER} and ${FOOTER} typed by hand.`);
    const extra = await frozenExtra('ASSISTANT BASE RULES');
    await writeProjectKnowledge(ws, 'context', 'Ship on Tuesdays.');

    const conversation = { id: 'c8', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    manager = new WorkerTaskManager(makeFactory(captured), makeRepo(conversation));

    await manager.getOrBuildTask('c8');
    const spawned = spawnedExtra(captured).presetRules as string;
    expect(spawned).toContain('Ship on Tuesdays.');
    expect(spawned).not.toContain('Ship on Fridays.');
    expect(spawned).toBe(`ASSISTANT BASE RULES${SEPARATOR}${await loadProjectKnowledgeBlock(ws)}`);
  });

  it('refreshes a legacy block written before the footer existed, keeping the memory block', async () => {
    await writeProjectKnowledge(ws, 'context', 'Ship on Fridays.\n\n---\n\nSecret note: OLD VALUE');
    // Exactly what the pre-footer composer wrote: header, no footer, memory last.
    const legacyBlock = `${HEADER}\n\n## Project context\n\nShip on Fridays.\n\n---\n\nSecret note: OLD VALUE`;
    const memoryBlock = '[User memory (from Wayland Memory)]\n\n## A note\n\nRemember this.';
    const extra = {
      projectId: 'p1',
      workspace: ws,
      presetRules: ['ASSISTANT BASE RULES', legacyBlock, memoryBlock].join(SEPARATOR),
      presetContext: [legacyBlock, memoryBlock].join(SEPARATOR),
    };
    await writeProjectKnowledge(ws, 'context', 'Ship on Tuesdays.');

    const conversation = { id: 'c9', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    manager = new WorkerTaskManager(makeFactory(captured), makeRepo(conversation));

    await manager.getOrBuildTask('c9');
    const spawned = spawnedExtra(captured);
    for (const field of ['presetRules', 'presetContext'] as const) {
      const value = spawned[field] as string;
      expect(value).toContain('Ship on Tuesdays.');
      expect(value).not.toContain('OLD VALUE');
      expect(value).not.toContain('Ship on Fridays.');
      // The global memory snapshot must survive the legacy cut.
      expect(value).toContain('Remember this.');
      expect(occurrences(value, HEADER)).toBe(1);
    }
    expect(spawned.presetRules).toContain('ASSISTANT BASE RULES');
  });

  it('a footer literal inside a LEGACY body does not orphan the deleted tail', async () => {
    // A legacy block has no footer of its own. Its body was composed before
    // `withoutSentinels` existed, so it was never stripped and CAN contain the
    // literal. Trusting that mid-body match cuts short and strands everything
    // after it with no header, so no later refresh can ever reach it again.
    const legacyBlock =
      `${HEADER}\n\n## Project context\n\nPasted docs: ${FOOTER} was in the paste.\n\n` + 'Secret note: OLD VALUE';
    const extra = {
      projectId: 'p1',
      workspace: ws,
      presetRules: ['ASSISTANT BASE RULES', legacyBlock].join(SEPARATOR),
      presetContext: legacyBlock,
    };
    await writeProjectKnowledge(ws, 'context', 'Ship on Tuesdays.');

    const conversation = { id: 'c8b', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    manager = new WorkerTaskManager(makeFactory(captured), makeRepo(conversation));

    await manager.getOrBuildTask('c8b');
    for (const field of ['presetRules', 'presetContext'] as const) {
      const value = spawnedExtra(captured)[field] as string;
      expect(value).toContain('Ship on Tuesdays.');
      // The whole point: the deleted tail must be GONE, not merely headerless.
      expect(value).not.toContain('OLD VALUE');
      expect(occurrences(value, HEADER)).toBe(1);
    }
  });

  it('a footer literal saved into global MEMORY does not destroy the memory block', async () => {
    // Nobody has to type anything for this one. Once the block ships, the
    // literal appears in every project chat's system prompt, so a user who
    // saves a prompt dump into Wayland Memory acquires it. The cut then runs
    // from the knowledge header PAST the memory block's own opening.
    const legacyBlock = `${HEADER}\n\n## Project context\n\nShip on Fridays.`;
    const memoryBlock =
      `[User memory (from Wayland Memory)]\n\n## KEEP_ME_HEAD\n\nSaved dump containing ${FOOTER} inline.\n\n` +
      '## KEEP_ME_TAIL\n\nStill mine.';
    const extra = {
      projectId: 'p1',
      workspace: ws,
      presetRules: ['ASSISTANT BASE RULES', legacyBlock, memoryBlock].join(SEPARATOR),
      presetContext: [legacyBlock, memoryBlock].join(SEPARATOR),
    };
    await writeProjectKnowledge(ws, 'context', 'Ship on Tuesdays.');

    const conversation = { id: 'c8c', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    manager = new WorkerTaskManager(makeFactory(captured), makeRepo(conversation));

    await manager.getOrBuildTask('c8c');
    for (const field of ['presetRules', 'presetContext'] as const) {
      const value = spawnedExtra(captured)[field] as string;
      expect(value).toContain('Ship on Tuesdays.');
      expect(value).not.toContain('Ship on Fridays.');
      // Both halves of the user's own memory survive intact.
      expect(value).toContain('KEEP_ME_HEAD');
      expect(value).toContain('KEEP_ME_TAIL');
      expect(occurrences(value, HEADER)).toBe(1);
    }
  });

  it('an unreadable knowledge document is not mistaken for a cleared one', async () => {
    await writeProjectKnowledge(ws, 'context', 'Ship on Fridays.');
    const extra = await frozenExtra('ASSISTANT BASE RULES');
    const before = extra.presetRules as string;
    // A read error that is NOT "file is missing": EISDIR here, but EIO, EACCES
    // or a read landing mid-write are the real-world cases. Collapsing these to
    // '' would look exactly like the user clearing the document.
    const contextFile = path.join(ws, '.wayland', 'CONTEXT.md');
    await fs.rm(contextFile);
    await fs.mkdir(contextFile);

    const conversation = { id: 'c10', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    const repo = makeRepo(conversation);
    manager = new WorkerTaskManager(makeFactory(captured), repo);

    await manager.getOrBuildTask('c10');

    expect(spawnedExtra(captured).presetRules).toBe(before);
    expect(repo.updateConversation).not.toHaveBeenCalled();
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

  /**
   * The global-memory block, the only block ever appended after project
   * knowledge. Its label is translated (`memory.injectedLabel`), so a legacy cut
   * cannot match it as a literal - only its SHAPE is stable: a bracketed label
   * alone on its line, a blank line, then its first `## ` section.
   */
  const MEMORY_BLOCK = `[User memory (from Wayland Memory) - the user dropped or saved this]\n\n## A note\n\nRemember this.`;

  /** A legacy (pre-footer) block: the exact bytes the old composer wrote. */
  const legacyBlock = (label: string, body: string): string => `${HEADER}\n\n## ${label}\n\n${body}`;

  /**
   * A decisions.md written the way `bootstrap.ts` seeds it and the knowledge
   * wizard drafts it: dated `[YYYY-MM-DD]` entries with thematic breaks between
   * them. Each break plus the following `[` is byte-identical to the separator
   * injected blocks are joined with.
   */
  const ROTATED_KEY = 'AKIA_ROTATED_9F3B';
  const DECISIONS_WITH_KEY = [
    '[2026-01-05] Postgres over MySQL for the ledger.',
    `[2026-02-11] Staging deploys with ${ROTATED_KEY} until SSO lands.`,
    '[2026-03-02] Staging moved to OIDC; the old key is dead.',
  ].join(SEPARATOR);
  const DECISIONS_KEY_DELETED = [
    '[2026-01-05] Postgres over MySQL for the ledger.',
    '[2026-03-02] Staging moved to OIDC; the old key is dead.',
  ].join(SEPARATOR);

  /**
   * The whole point of #999: a correction must actually LAND. A legacy block has
   * no footer, so its end is inferred - and inferring it from the first `---[`
   * cut short here, leaving the deleted entry behind. That fragment carries no
   * header, so no later refresh can ever find it again: the rotated key would
   * stay in the system prompt for the life of the conversation.
   */
  it('a deleted decision does not survive in a legacy block of separator-joined entries', async () => {
    await writeProjectKnowledge(ws, 'decisions', DECISIONS_WITH_KEY);
    const extra = {
      projectId: 'p1',
      workspace: ws,
      presetRules: ['ASSISTANT BASE RULES', legacyBlock('Project decisions', DECISIONS_WITH_KEY), MEMORY_BLOCK].join(
        SEPARATOR
      ),
      presetContext: [legacyBlock('Project decisions', DECISIONS_WITH_KEY), MEMORY_BLOCK].join(SEPARATOR),
    };
    // The user deletes the superseded decision that names the rotated key.
    await writeProjectKnowledge(ws, 'decisions', DECISIONS_KEY_DELETED);

    const conversation = { id: 'c11', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    const repo = makeRepo(conversation);
    manager = new WorkerTaskManager(makeFactory(captured), repo);

    const expectClean = () => {
      for (const field of ['presetRules', 'presetContext'] as const) {
        const value = spawnedExtra(captured)[field] as string;
        expect(value).not.toContain(ROTATED_KEY);
        expect(value).toContain('Staging moved to OIDC');
        expect(value).toContain('Remember this.'); // memory snapshot survives
        expect(occurrences(value, HEADER)).toBe(1);
      }
      expect(spawnedExtra(captured).presetRules).toContain('ASSISTANT BASE RULES');
    };

    // Three spawns: the fragment must never appear, not once and not by healing
    // later - a headerless fragment is unreachable, so "bounded" is not enough.
    await manager.getOrBuildTask('c11');
    expectClean();
    await manager.getOrBuildTask('c11', { skipCache: true });
    expectClean();
    await manager.getOrBuildTask('c11', { skipCache: true });
    expectClean();
    // One migrating write, then stable.
    expect(repo.updateConversation).toHaveBeenCalledTimes(1);
  });

  // Same legacy shape with no memory block at all: the cut must run to the end of
  // the string, not stop at the last dated entry.
  it('removes a legacy block of separator-joined entries entirely when no memory block follows', async () => {
    await writeProjectKnowledge(ws, 'decisions', DECISIONS_WITH_KEY);
    const extra = {
      projectId: 'p1',
      workspace: ws,
      presetRules: ['ASSISTANT BASE RULES', legacyBlock('Project decisions', DECISIONS_WITH_KEY)].join(SEPARATOR),
    };
    await writeProjectKnowledge(ws, 'decisions', DECISIONS_KEY_DELETED);

    const conversation = { id: 'c12', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    manager = new WorkerTaskManager(makeFactory(captured), makeRepo(conversation));

    await manager.getOrBuildTask('c12');
    expect(spawnedExtra(captured).presetRules).toBe(
      `ASSISTANT BASE RULES${SEPARATOR}${await loadProjectKnowledgeBlock(ws)}`
    );
  });

  // A knowledge body that itself opens like an injected block is the one shape
  // the legacy cut cannot tell from a real block boundary. With a memory block
  // present the real boundary is the LAST one, so the cut is still exact.
  it('removes a legacy block whose own body opens like an injected block', async () => {
    const shapedBody = `Intro.${SEPARATOR}[Pasted label]\n\n## Sub\n\nOLD SECRET VALUE`;
    await writeProjectKnowledge(ws, 'context', shapedBody);
    const extra = {
      projectId: 'p1',
      workspace: ws,
      presetRules: ['ASSISTANT BASE RULES', legacyBlock('Project context', shapedBody), MEMORY_BLOCK].join(SEPARATOR),
    };
    await writeProjectKnowledge(ws, 'context', 'Clean context now.');

    const conversation = { id: 'c13', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    manager = new WorkerTaskManager(makeFactory(captured), makeRepo(conversation));

    await manager.getOrBuildTask('c13');
    const value = spawnedExtra(captured).presetRules as string;
    expect(value).not.toContain('OLD SECRET VALUE');
    expect(value).not.toContain('[Pasted label]');
    expect(value).toContain('Clean context now.');
    expect(value).toContain('Remember this.');
    expect(occurrences(value, HEADER)).toBe(1);
  });

  /**
   * The one disclosed residual of the legacy cut, pinned so a later round cannot
   * "fix" it in the wrong direction: the same block-shaped body as above but
   * with NO memory block after it. There is no later boundary to scan to, so the
   * shaped line inside the body IS the last one and the cut stops there, leaving
   * the tail behind with no header - unreachable by every future refresh.
   *
   * This is not a regression: it behaves identically under the shipped code,
   * under a bare `lastIndexOf`, and under the shape-LAST scan. It needs the user
   * to have pasted block-shaped markdown into their own document, and it cannot
   * arise for any block that carries a footer (every block written since #999).
   * Pinned as the accepted cost, not as desired behaviour.
   */
  it('leaves the tail of a shaped legacy body behind when no memory block follows', async () => {
    const shapedBody = `Intro.${SEPARATOR}[Pasted label]\n\n## Sub\n\nOLD SECRET VALUE`;
    await writeProjectKnowledge(ws, 'context', shapedBody);
    const extra = {
      projectId: 'p1',
      workspace: ws,
      presetRules: ['ASSISTANT BASE RULES', legacyBlock('Project context', shapedBody)].join(SEPARATOR),
    };
    await writeProjectKnowledge(ws, 'context', 'Clean context now.');

    const conversation = { id: 'c18', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    manager = new WorkerTaskManager(makeFactory(captured), makeRepo(conversation));

    await manager.getOrBuildTask('c18');
    const value = spawnedExtra(captured).presetRules as string;
    // The head of the legacy block IS removed, and the fresh block lands.
    expect(value).not.toContain('Intro.');
    expect(value).toContain('Clean context now.');
    expect(occurrences(value, HEADER)).toBe(1);
    // The accepted cost: the tail past the shaped line survives, headerless.
    expect(value).toContain('OLD SECRET VALUE');
  });

  /**
   * The accepted cost of scanning to the LAST boundary, pinned so it stays a
   * decision rather than a surprise: a MEMORY entry whose own body opens like a
   * block moves the last boundary inside the memory block, so part of that
   * creation-time snapshot is lost. Deliberate - the deleted knowledge is still
   * removed in full, and the memory files are still on disk, whereas cutting
   * short would leave deleted knowledge in the prompt permanently.
   */
  it('accepts losing part of a memory snapshot rather than keeping deleted knowledge', async () => {
    const nastyMemory = `${MEMORY_BLOCK}${SEPARATOR}[Quoted block]\n\n## Inner\n\ntail of the memory entry`;
    await writeProjectKnowledge(ws, 'decisions', DECISIONS_WITH_KEY);
    const extra = {
      projectId: 'p1',
      workspace: ws,
      presetRules: ['ASSISTANT BASE RULES', legacyBlock('Project decisions', DECISIONS_WITH_KEY), nastyMemory].join(
        SEPARATOR
      ),
    };
    await writeProjectKnowledge(ws, 'decisions', DECISIONS_KEY_DELETED);

    const conversation = { id: 'c14', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    manager = new WorkerTaskManager(makeFactory(captured), makeRepo(conversation));

    await manager.getOrBuildTask('c14');
    const value = spawnedExtra(captured).presetRules as string;
    // What matters: no deleted knowledge left behind.
    expect(value).not.toContain(ROTATED_KEY);
    // The stale copy is gone: the surviving entries appear once, in the new block.
    expect(occurrences(value, '[2026-01-05]')).toBe(1);
    expect(occurrences(value, HEADER)).toBe(1);
    expect(value).toContain('ASSISTANT BASE RULES');
    // The documented cost: the head of the memory block goes with it.
    expect(value).not.toContain('Remember this.');
    expect(value).toContain('tail of the memory entry');
  });

  /**
   * What the footer is actually load-bearing for. With it, removal is exact for
   * ANY body, including the one shape the legacy scan cannot resolve. Drop the
   * footer from the composer, or stop honouring it here, and this reds.
   */
  it('removes a footer-delimited block exactly, even when its body opens like an injected block', async () => {
    await writeProjectKnowledge(ws, 'context', `Intro.${SEPARATOR}[Pasted label]\n\n## Sub\n\nOLD SECRET VALUE`);
    const extra = await frozenExtra('ASSISTANT BASE RULES');
    expect(extra.presetRules).toContain('OLD SECRET VALUE');
    await writeProjectKnowledge(ws, 'context', 'Clean context now.');

    const conversation = { id: 'c15', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    manager = new WorkerTaskManager(makeFactory(captured), makeRepo(conversation));

    await manager.getOrBuildTask('c15');
    const value = spawnedExtra(captured).presetRules as string;
    expect(value).not.toContain('OLD SECRET VALUE');
    expect(value).not.toContain('[Pasted label]');
    expect(value).toBe(`ASSISTANT BASE RULES${SEPARATOR}${await loadProjectKnowledgeBlock(ws)}`);
  });

  /**
   * A project row whose workspace has been cleared must not be read as "this
   * project has no knowledge". Without the guard the block is stripped AND the
   * loss is persisted, which is the failure direction #999 exists to avoid.
   */
  it('a project whose workspace was cleared keeps its existing block', async () => {
    await writeProjectKnowledge(ws, 'context', 'Ship on Fridays.');
    const extra = await frozenExtra('ASSISTANT BASE RULES');
    const before = extra.presetRules as string;
    mockGetProject.mockResolvedValue({ workspace: '' });

    const conversation = { id: 'c16', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    const repo = makeRepo(conversation);
    manager = new WorkerTaskManager(makeFactory(captured), repo);

    await manager.getOrBuildTask('c16');

    expect(spawnedExtra(captured).presetRules).toBe(before);
    expect(spawnedExtra(captured).presetRules).toContain('Ship on Fridays.');
    expect(repo.updateConversation).not.toHaveBeenCalled();
  });

  /**
   * Creation writes [base, knowledge, memory]; the refresh removes and re-appends
   * the knowledge block, so the first spawn of every project chat that has a
   * memory block reorders it to [base, memory, knowledge] and costs exactly one
   * extra write and one prompt-cache miss. Once, not per spawn - pinned here so a
   * regression to per-spawn churn is visible.
   */
  it('reorders the blocks at most once for a chat created with a memory block', async () => {
    await writeProjectKnowledge(ws, 'context', 'Ship on Fridays.');
    const block = await loadProjectKnowledgeBlock(ws);
    const extra = {
      projectId: 'p1',
      workspace: ws,
      presetRules: ['ASSISTANT BASE RULES', block, MEMORY_BLOCK].join(SEPARATOR),
      presetContext: [block, MEMORY_BLOCK].join(SEPARATOR),
    };

    const conversation = { id: 'c17', type: 'wcore', extra } as unknown as TChatConversation;
    const captured: { conv?: TChatConversation } = {};
    const repo = makeRepo(conversation);
    manager = new WorkerTaskManager(makeFactory(captured), repo);

    await manager.getOrBuildTask('c17');
    const first = spawnedExtra(captured).presetRules as string;
    expect(first).toBe(['ASSISTANT BASE RULES', MEMORY_BLOCK, block].join(SEPARATOR));
    expect(repo.updateConversation).toHaveBeenCalledTimes(1);

    await manager.getOrBuildTask('c17', { skipCache: true });
    await manager.getOrBuildTask('c17', { skipCache: true });
    expect(spawnedExtra(captured).presetRules).toBe(first);
    expect(repo.updateConversation).toHaveBeenCalledTimes(1);
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
