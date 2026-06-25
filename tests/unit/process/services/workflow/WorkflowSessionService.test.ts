/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for WorkflowSessionService - the orchestration layer that owns the
 * lifecycle of a {@link WorkflowSession}. See SPEC §6, §10, §11.
 *
 * Dependencies are all injectable so this suite mocks them with vi.fn() and
 * thin in-memory fakes. The real SQLite repository is tested in
 * `WorkflowSessionRepository.test.ts`; here we only verify the service's
 * orchestration logic (parsing, transitions, telemetry, persistence calls).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

// ---------------------------------------------------------------------------
// Mock @/common so ipcBridge.conversation.listChanged.emit is spy-able.
// WorkflowSessionService calls this singleton directly (mirrors the cron
// pattern at WorkerTaskManagerJobExecutor.ts:254-258).
//
// Also stub ipcBridge.workflow.sessionChanged.emit so the W0.2 lifecycle
// emit assertions below can spy on it. Downstream sidebar listeners react
// to this emit to refresh the in-flight strip + badge counts without
// re-fetching the full session payload.
// ---------------------------------------------------------------------------
const listChangedEmitMock = vi.fn();
const sessionChangedEmitMock = vi.fn();
vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      listChanged: { emit: (...args: unknown[]) => listChangedEmitMock(...args) },
    },
    workflow: {
      sessionChanged: { emit: (...args: unknown[]) => sessionChangedEmitMock(...args) },
    },
  },
}));
import type { TChatConversation, TProviderWithModel } from '@/common/config/storage';
import type { AskRecord, StepState, StepTransition, WorkflowSession } from '@/common/types/workflowTypes';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import type { CreateConversationParams } from '@process/services/IConversationService';
import type { WorkflowSessionRepository } from '@process/services/workflow/WorkflowSessionRepository';
import { WorkflowSessionService } from '@process/services/workflow/WorkflowSessionService';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

const DEFAULT_MODEL: TProviderWithModel = {
  id: 'anthropic',
  platform: 'anthropic',
  name: 'Anthropic',
  baseUrl: 'https://api.anthropic.com',
  apiKey: 'test-key',
  useModel: 'claude-sonnet-4-5',
};

type SkillMap = Map<string, { entry: SkillIndexEntry; body: string | null }>;

/** Build a minimal SkillIndexEntry. */
const skillEntry = (over: Partial<SkillIndexEntry> = {}): SkillIndexEntry => ({
  name: over.name ?? 'sample',
  description: over.description ?? 'desc',
  type: over.type ?? 'skill',
  source: over.source ?? 'wayland-library',
  metadata: over.metadata ?? { tags: [] },
  path: over.path ?? `bodies/${over.name ?? 'sample'}.md`,
  ...over,
});

/** In-memory SkillLibrary stand-in. Only the two methods we use are needed. */
function makeSkillLibrary(map: SkillMap) {
  return {
    loadBody: vi.fn(async (name: string) => map.get(name)?.body ?? null),
    get: vi.fn(async (name: string) => map.get(name)?.entry ?? null),
  };
}

/** In-memory repository fake matching WorkflowSessionRepository's surface. */
function makeRepo() {
  const rows = new Map<string, WorkflowSession>();
  const repo = {
    insert: vi.fn((session: WorkflowSession) => {
      rows.set(session.id, { ...session });
    }),
    findById: vi.fn((id: string) => {
      const row = rows.get(id);
      return row ? { ...row, steps: row.steps.map((s) => ({ ...s })), asks: row.asks.map((a) => ({ ...a })) } : null;
    }),
    findByConversationId: vi.fn((conversationId: string) => {
      for (const row of rows.values()) {
        if (row.conversation_id === conversationId) return { ...row };
      }
      return null;
    }),
    findActiveByWorkflowName: vi.fn((name: string) => {
      const matches = Array.from(rows.values()).filter((r) => r.workflow_name === name && r.status === 'active');
      matches.sort((a, b) => b.updated_at - a.updated_at);
      return matches[0] ?? null;
    }),
    findAllActive: vi.fn((limit?: number) => {
      const matches = Array.from(rows.values()).filter((r) => r.status === 'active');
      matches.sort((a, b) => b.updated_at - a.updated_at);
      return matches.slice(0, limit ?? 3);
    }),
    countActive: vi.fn(() => {
      return Array.from(rows.values()).filter((r) => r.status === 'active').length;
    }),
    update: vi.fn((id: string, patch: Record<string, unknown>) => {
      const row = rows.get(id);
      if (!row) throw new Error(`no row ${id}`);
      const next: WorkflowSession = { ...row, ...(patch as Partial<WorkflowSession>), updated_at: Date.now() };
      rows.set(id, next);
      return { ...next };
    }),
    delete: vi.fn((id: string) => {
      rows.delete(id);
    }),
  };
  return { repo, rows };
}

/** Telemetry stub - record() returns void; record calls for assertions. */
function makeTelemetry() {
  return {
    record: vi.fn(async () => undefined),
  };
}

/** Conversation service fake - createConversation returns a row; getConversation reads it. */
function makeConversationService() {
  const conversations = new Map<string, TChatConversation>();
  let counter = 0;
  return {
    conversations,
    createConversation: vi.fn(async (params: Parameters<typeof Object>[0]) => {
      counter += 1;
      const id = `conv-${counter}`;
      const p = params as {
        type: string;
        name?: string;
        model: TProviderWithModel;
        extra: Record<string, unknown>;
      };
      const conv = {
        id,
        type: p.type,
        name: p.name ?? 'Workflow',
        createTime: Date.now(),
        modifyTime: Date.now(),
        model: p.model,
        extra: p.extra,
      } as unknown as TChatConversation;
      conversations.set(id, conv);
      return conv;
    }),
    deleteConversation: vi.fn(async () => undefined),
    updateConversation: vi.fn(async () => undefined),
    getConversation: vi.fn(async (id: string) => conversations.get(id)),
    createWithMigration: vi.fn(),
    listAllConversations: vi.fn(async () => Array.from(conversations.values())),
    getConversationsByCronJob: vi.fn(async () => []),
  };
}

// Body containing 2 well-formed steps.
const TWO_STEP_BODY = `# Demo Workflow

Intro prose.

## Step 1: Audit

Audit the thing.

## Step 2: Ship

Ship the thing.
`;

const NO_STEP_BODY = `# One-shot workflow

This body has no \`## Step N:\` headers at all.
`;

type ServiceParts = ReturnType<typeof buildService>;

function buildService() {
  const skillMap: SkillMap = new Map();
  const skills = makeSkillLibrary(skillMap);
  const { repo, rows } = makeRepo();
  const telemetry = makeTelemetry();
  const conversationService = makeConversationService();

  const service = new WorkflowSessionService(
    repo as unknown as WorkflowSessionRepository,
    skills as unknown as Parameters<typeof WorkflowSessionService.prototype.resolveSkills>[0] extends never
      ? never
      : never,
    telemetry as unknown as never,
    conversationService as unknown as never,
    { getDefaultModel: () => DEFAULT_MODEL }
  );

  return { service, skills, repo, rows, telemetry, conversationService, skillMap };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WorkflowSessionService.start()', () => {
  let parts: ServiceParts;

  beforeEach(() => {
    parts = buildService();
    listChangedEmitMock.mockClear();
  });

  it('throws when the workflow body cannot be loaded', async () => {
    await expect(parts.service.start({ workflow_name: 'missing' })).rejects.toThrow(/Workflow body not found: missing/);
  });

  it('happy path: parses steps, creates conversation, inserts session, emits telemetry', async () => {
    parts.skillMap.set('demo', {
      entry: skillEntry({
        name: 'demo',
        description: 'Demo workflow',
        type: 'workflow',
        metadata: { tags: [], category: 'Business Operations', depends: [] },
      }),
      body: TWO_STEP_BODY,
    });

    const result = await parts.service.start({ workflow_name: 'demo' });

    expect(result.sessionId).toBeDefined();
    expect(result.session.workflow_name).toBe('demo');
    expect(result.session.total_steps).toBe(2);
    expect(result.session.steps).toHaveLength(2);
    expect(result.session.steps[0]).toMatchObject({ n: 1, title: 'Audit', status: 'todo' });
    expect(result.session.steps[1]).toMatchObject({ n: 2, title: 'Ship', status: 'todo' });
    expect(result.session.current_step).toBe(1);
    expect(result.session.status).toBe('active');
    expect(result.session.category).toBe('Business Operations');
    expect(result.session.palette).toBeTruthy();
    expect(result.session.conversation_id).toBe('conv-1');
    // workflow_title is the humanized NAME ("demo" -> "Demo"), not the long description.
    expect(result.systemPromptDirective).toContain('"Demo"');

    expect(parts.conversationService.createConversation).toHaveBeenCalledTimes(1);
    expect(parts.repo.insert).toHaveBeenCalledTimes(1);
    expect(parts.telemetry.record).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'workflow.session_started' })
    );

    // session_started metadata exposes the truncated flag.
    const startedCall = (parts.telemetry.record as Mock).mock.calls.find(
      (c) => c[0].eventType === 'workflow.session_started'
    );
    expect(startedCall?.[0].metadata).toMatchObject({ truncated: false, total_steps: 2 });
  });

  it('no-step body produces total_steps:0 and current_step:0', async () => {
    parts.skillMap.set('oneshot', {
      entry: skillEntry({ name: 'oneshot', type: 'workflow', description: 'One shot' }),
      body: NO_STEP_BODY,
    });

    const result = await parts.service.start({ workflow_name: 'oneshot' });
    expect(result.session.total_steps).toBe(0);
    expect(result.session.steps).toHaveLength(0);
    expect(result.session.current_step).toBe(0);
  });

  it('resolves depends slugs into the session.skills array; missing slugs are silently dropped on start', async () => {
    parts.skillMap.set('demo', {
      entry: skillEntry({
        name: 'demo',
        type: 'workflow',
        metadata: { tags: [], depends: ['known-skill', 'ghost-skill'] },
      }),
      body: TWO_STEP_BODY,
    });
    parts.skillMap.set('known-skill', {
      entry: skillEntry({
        name: 'known-skill',
        description: 'A known dependency',
        type: 'skill',
      }),
      body: 'body',
    });

    const result = await parts.service.start({ workflow_name: 'demo' });
    expect(result.session.skills).toHaveLength(1);
    expect(result.session.skills[0]).toMatchObject({
      slug: 'known-skill',
      display_name: 'known-skill',
      description: 'A known dependency',
    });
  });

  it('derives workflow_title as the humanized slug (clean header/sidebar name, not the long description)', async () => {
    parts.skillMap.set('plain-name', {
      entry: skillEntry({
        name: 'plain-name',
        description: 'Plain Title Override',
        type: 'workflow',
        metadata: { tags: [] },
      }),
      body: TWO_STEP_BODY,
    });
    const result = await parts.service.start({ workflow_name: 'plain-name' });
    expect(result.session.workflow_title).toBe('Plain Name');
  });

  it('emits ipcBridge.conversation.listChanged after creating the conversation (Audit B MED-2)', async () => {
    // Mirrors the cron pattern at WorkerTaskManagerJobExecutor.ts:254-258.
    // Without this emit the new workflow conversation does not appear in
    // ChatSider until some unrelated conversation-list change fires.
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow', description: 'Demo workflow' }),
      body: TWO_STEP_BODY,
    });

    const result = await parts.service.start({ workflow_name: 'demo' });

    expect(listChangedEmitMock).toHaveBeenCalledTimes(1);
    expect(listChangedEmitMock).toHaveBeenCalledWith({
      conversationId: result.session.conversation_id,
      action: 'created',
      source: 'wayland',
    });
  });
});

describe('WorkflowSessionService.findById()', () => {
  it('returns null for missing sessions', async () => {
    const parts = buildService();
    expect(await parts.service.findById('nope')).toBeNull();
  });

  it('returns the persisted session when found', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    const found = await parts.service.findById(sessionId);
    expect(found?.id).toBe(sessionId);
  });
});

describe('WorkflowSessionService.findActive()', () => {
  it('delegates to repo.findActiveByWorkflowName and returns its result', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });

    const active = await parts.service.findActive('demo');
    expect(active?.id).toBe(sessionId);
    expect(parts.repo.findActiveByWorkflowName).toHaveBeenCalledWith('demo');

    expect(await parts.service.findActive('other')).toBeNull();
  });
});

describe('WorkflowSessionService.findAllActive()', () => {
  it('returns each session paired with an 80-char conversation preview', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    parts.skillMap.set('other', {
      entry: skillEntry({ name: 'other', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });

    const a = await parts.service.start({ workflow_name: 'demo' });
    // Give a deterministic preview by giving the conversation a longer name.
    const conv = parts.conversationService.conversations.get(a.session.conversation_id)!;
    conv.name = 'X'.repeat(200);
    await parts.service.start({ workflow_name: 'other' });

    const list = await parts.service.findAllActive();
    expect(list.length).toBeGreaterThanOrEqual(2);
    const aRow = list.find((r) => r.session.id === a.sessionId)!;
    expect(aRow.conversation_preview.length).toBeLessThanOrEqual(80);
  });

  it('uses empty preview when the underlying conversation is missing', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const a = await parts.service.start({ workflow_name: 'demo' });
    parts.conversationService.conversations.delete(a.session.conversation_id);

    const list = await parts.service.findAllActive();
    expect(list[0].conversation_preview).toBe('');
  });

  it('honors the limit argument (default 3)', async () => {
    const parts = buildService();
    for (const slug of ['a', 'b', 'c', 'd']) {
      parts.skillMap.set(slug, {
        entry: skillEntry({ name: slug, type: 'workflow' }),
        body: TWO_STEP_BODY,
      });
      await parts.service.start({ workflow_name: slug });
    }
    const list = await parts.service.findAllActive();
    expect(list).toHaveLength(3);
    const list2 = await parts.service.findAllActive(2);
    expect(list2).toHaveLength(2);
  });
});

describe('WorkflowSessionService.resolveSkills()', () => {
  it('splits found skills from unresolved slugs', async () => {
    const parts = buildService();
    parts.skillMap.set('found-1', {
      entry: skillEntry({ name: 'found-1', description: 'one' }),
      body: 'b1',
    });
    parts.skillMap.set('found-2', {
      entry: skillEntry({ name: 'found-2', description: 'two' }),
      body: 'b2',
    });

    const result = await parts.service.resolveSkills(['found-1', 'missing', 'found-2']);
    expect(result.skills.map((s) => s.slug)).toEqual(['found-1', 'found-2']);
    expect(result.unresolved).toEqual(['missing']);
  });
});

describe('WorkflowSessionService.applyStepTransition()', () => {
  it('throws when the session id is unknown', async () => {
    const parts = buildService();
    const transition: StepTransition = {
      step_n: 1,
      status: 'now',
      source: 'parent',
      dispatch_id: null,
      timestamp: Date.now(),
    };
    await expect(parts.service.applyStepTransition('nope', transition)).rejects.toThrow();
  });

  it('throws when the transition targets a step that does not exist', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    const transition: StepTransition = {
      step_n: 99,
      status: 'now',
      source: 'parent',
      dispatch_id: null,
      timestamp: Date.now(),
    };
    await expect(parts.service.applyStepTransition(sessionId, transition)).rejects.toThrow();
  });

  it('accepts a valid transition, persists the step + current_step, and emits step_transition telemetry', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    const t1: StepTransition = {
      step_n: 1,
      status: 'now',
      source: 'parent',
      dispatch_id: null,
      timestamp: 1_700_000_000_000,
    };
    const updated = await parts.service.applyStepTransition(sessionId, t1);
    expect(updated.steps[0].status).toBe('now');
    expect(updated.steps[0].started_at).toBe(1_700_000_000_000);
    expect(updated.current_step).toBe(1);
    expect(parts.repo.update).toHaveBeenCalled();
    expect(parts.telemetry.record).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'workflow.step_transition' })
    );

    // done bumps completed_at.
    const t2: StepTransition = { ...t1, status: 'done', timestamp: 1_700_000_100_000 };
    const after = await parts.service.applyStepTransition(sessionId, t2);
    expect(after.steps[0].status).toBe('done');
    expect(after.steps[0].completed_at).toBe(1_700_000_100_000);
  });

  it('rejects a parent `now` on a later step while an earlier step is not terminal (W6 multi-advance gate)', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    // Step 1 → now (legitimate begin).
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'now',
      source: 'parent',
      dispatch_id: null,
      timestamp: 1_700_000_000_000,
    });
    // A verbose parent turn ALSO emits a `now` marker for step 2 while step 1 is
    // still running. It must NOT advance - steps are sequential.
    const after = await parts.service.applyStepTransition(sessionId, {
      step_n: 2,
      status: 'now',
      source: 'parent',
      dispatch_id: null,
      timestamp: 1_700_000_000_500,
    });
    expect(after.steps[1].status).toBe('todo');
    expect(after.steps[0].status).toBe('now');
    expect(after.current_step).toBe(1);
  });

  it('allows step 2 → now once step 1 is done (sequential advance still works)', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'now',
      source: 'parent',
      dispatch_id: null,
      timestamp: 1_700_000_000_000,
    });
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'done',
      source: 'parent',
      dispatch_id: null,
      timestamp: 1_700_000_000_100,
    });
    const after = await parts.service.applyStepTransition(sessionId, {
      step_n: 2,
      status: 'now',
      source: 'parent',
      dispatch_id: null,
      timestamp: 1_700_000_000_200,
    });
    expect(after.steps[1].status).toBe('now');
    expect(after.current_step).toBe(2);
  });

  it('does NOT gate worker/user sources (out-of-order autonomous runs / explicit jumps stay allowed)', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    // A worker dispatched onto step 2 while step 1 is still todo is intentional.
    const after = await parts.service.applyStepTransition(sessionId, {
      step_n: 2,
      status: 'now',
      source: 'worker',
      dispatch_id: 'd1',
      timestamp: 1_700_000_000_000,
    });
    expect(after.steps[1].status).toBe('now');
  });

  it('rejects a regress transition WITHOUT persisting and emits regress_attempt telemetry', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    // Drive step 1 to done.
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'done',
      source: 'parent',
      dispatch_id: null,
      timestamp: 1_700_000_000_000,
    });

    parts.repo.update.mockClear();
    parts.telemetry.record.mockClear();

    // Try to regress step 1 back to now.
    const result = await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'now',
      source: 'parent',
      dispatch_id: null,
      timestamp: 1_700_000_500_000,
    });

    expect(result.steps[0].status).toBe('done');
    expect(parts.repo.update).not.toHaveBeenCalled();
    expect(parts.telemetry.record).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'workflow.regress_attempt' })
    );
  });

  it('advances current_step to total_steps+1 when the final step is marked done', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'done',
      source: 'parent',
      dispatch_id: null,
      timestamp: 1,
    });
    const after = await parts.service.applyStepTransition(sessionId, {
      step_n: 2,
      status: 'done',
      source: 'parent',
      dispatch_id: null,
      timestamp: 2,
    });
    expect(after.current_step).toBeGreaterThanOrEqual(2);
  });
});

describe('WorkflowSessionService.appendAsk()', () => {
  it('appends a new AskRecord to the session', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    const ask: AskRecord = {
      id: 'ask-1',
      step_n: 1,
      question: 'Q?',
      type: 'text',
      options: null,
      max: null,
      placeholder: null,
      answer: null,
      asked_at: 100,
      answered_at: null,
    };
    const updated = await parts.service.appendAsk(sessionId, ask);
    expect(updated.asks).toHaveLength(1);
    expect(updated.asks[0].id).toBe('ask-1');
  });
});

describe('WorkflowSessionService.answerAsk()', () => {
  it('flips the matching ask answer + answered_at and emits ask_answered telemetry', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    const ask: AskRecord = {
      id: 'ask-1',
      step_n: 1,
      question: 'Q?',
      type: 'text',
      options: null,
      max: null,
      placeholder: null,
      answer: null,
      asked_at: 100,
      answered_at: null,
    };
    await parts.service.appendAsk(sessionId, ask);
    parts.telemetry.record.mockClear();

    const updated = await parts.service.answerAsk(sessionId, 'ask-1', 'the answer');
    expect(updated.asks[0].answer).toBe('the answer');
    expect(updated.asks[0].answered_at).not.toBeNull();
    expect(parts.telemetry.record).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'workflow.ask_answered' })
    );
  });

  it('throws when the askId is not present', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    await expect(parts.service.answerAsk(sessionId, 'ghost', 'x')).rejects.toThrow();
  });
});

describe('WorkflowSessionService.completeSession()', () => {
  it('sets status=complete + completed_at + emits session_completed telemetry', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    parts.telemetry.record.mockClear();

    const updated = await parts.service.completeSession(sessionId);
    expect(updated.status).toBe('complete');
    expect(updated.completed_at).not.toBeNull();
    expect(parts.telemetry.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'workflow.session_completed',
        metadata: expect.objectContaining({ duration_ms: expect.any(Number) }),
      })
    );
  });
});

describe('WorkflowSessionService.endSession()', () => {
  it('sets status=ended (no completion telemetry)', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    parts.telemetry.record.mockClear();

    const updated = await parts.service.endSession(sessionId);
    expect(updated.status).toBe('ended');
    // We do not require any specific telemetry here; just that the row updated.
    expect(parts.repo.update).toHaveBeenCalled();
  });
});

describe('WorkflowSessionService.markBeginSent()', () => {
  it('throws when the session id is unknown', async () => {
    const parts = buildService();
    await expect(parts.service.markBeginSent('ghost')).rejects.toThrow(
      /WorkflowSessionService.markBeginSent: unknown session ghost/
    );
  });

  it('first call sets begin_sent_at to approximately now', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });

    const before = Date.now();
    const updated = await parts.service.markBeginSent(sessionId);
    const after = Date.now();

    expect(updated.begin_sent_at).not.toBeNull();
    expect(updated.begin_sent_at).toBeGreaterThanOrEqual(before);
    expect(updated.begin_sent_at).toBeLessThanOrEqual(after);
    expect(parts.repo.update).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ begin_sent_at: expect.any(Number) })
    );
  });

  it('second call is a no-op - timestamp unchanged', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });

    const first = await parts.service.markBeginSent(sessionId);
    const firstTs = first.begin_sent_at;

    parts.repo.update.mockClear();

    const second = await parts.service.markBeginSent(sessionId);
    expect(second.begin_sent_at).toBe(firstTs);
    // update should NOT have been called on the idempotent second call
    expect(parts.repo.update).not.toHaveBeenCalled();
  });

  it('uses the passed `at` value when set, not its own Date.now()', async () => {
    // Cross-mount race dedup contract: the renderer compares the returned
    // begin_sent_at against the timestamp it passed in to decide whether
    // its specific call won the race. The service MUST use the passed
    // value (not its own Date.now()) for that check to be meaningful.
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });

    const proposedAt = 1_234_567_890_000;
    const updated = await parts.service.markBeginSent(sessionId, proposedAt);

    expect(updated.begin_sent_at).toBe(proposedAt);
    expect(parts.repo.update).toHaveBeenCalledWith(sessionId, { begin_sent_at: proposedAt });
  });

  it("cross-mount race: only the first caller wins; second call returns the first call's timestamp", async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });

    const winnerAt = 1_111_111_111_000;
    const loserAt = 2_222_222_222_000;

    const winnerResult = await parts.service.markBeginSent(sessionId, winnerAt);
    const loserResult = await parts.service.markBeginSent(sessionId, loserAt);

    // Winner's timestamp is what stuck; loser's call returns the same
    // value (the renderer compares loserResult.begin_sent_at !== loserAt
    // and skips its sendMessage).
    expect(winnerResult.begin_sent_at).toBe(winnerAt);
    expect(loserResult.begin_sent_at).toBe(winnerAt);
    expect(loserResult.begin_sent_at).not.toBe(loserAt);
  });
});

// ---------------------------------------------------------------------------
// agentTypeForBackend mapping + launch target consumption
// ---------------------------------------------------------------------------

/** Expose the helper indirectly by checking what type the conversation gets. */
describe('WorkflowSessionService.start() - launch target consumption', () => {
  it('renderer-supplied backend+model are used directly without calling getDefaultLaunchTarget', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });

    const wcoreModel: TProviderWithModel = {
      id: 'wcore',
      platform: 'wcore',
      name: 'Wayland Core',
      baseUrl: '',
      apiKey: '',
      useModel: 'default',
    };

    const launchTargetSpy = vi.fn(async () => ({
      backend: 'claude',
      cliPath: '/usr/local/bin/claude',
      model: DEFAULT_MODEL,
    }));
    // Override the injector so we can verify it is NOT called.
    (
      parts.service as unknown as {
        modelProvider: { getDefaultLaunchTarget: typeof launchTargetSpy };
      }
    ).modelProvider.getDefaultLaunchTarget = launchTargetSpy;

    await parts.service.start({
      workflow_name: 'demo',
      backend: 'wcore',
      cliPath: '/usr/local/bin/wcore',
      model: wcoreModel,
    });

    expect(launchTargetSpy).not.toHaveBeenCalled();

    const callArg = (parts.conversationService.createConversation as Mock).mock.calls[0][0] as CreateConversationParams;
    expect(callArg.extra.backend).toBe('wcore');
    expect(callArg.extra.cliPath).toBe('/usr/local/bin/wcore');
    // agentTypeForBackend('wcore') → 'wcore'
    expect(callArg.type).toBe('wcore');
    expect(callArg.model).toMatchObject({ id: 'wcore' });
  });

  it('propagates the selected codex model id into extra.currentModelId so the spawn does not fall back to the codex default (GitHub #111)', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });

    const codexModel: TProviderWithModel = {
      id: 'codex',
      platform: 'codex',
      name: 'Codex',
      baseUrl: '',
      apiKey: '',
      useModel: 'gpt-5.1-codex-mini',
    };

    await parts.service.start({
      workflow_name: 'demo',
      backend: 'codex',
      cliPath: '/usr/local/bin/codex',
      model: codexModel,
    });

    const callArg = (parts.conversationService.createConversation as Mock).mock.calls[0][0] as CreateConversationParams;
    expect(callArg.extra.backend).toBe('codex');
    // agentTypeForBackend('codex') → 'acp'
    expect(callArg.type).toBe('acp');
    // The user-selected model must reach the ACP spawn via extra.currentModelId,
    // otherwise codex runs on its CLI default (gpt-5.3-codex), unusable on a
    // ChatGPT account.
    expect(callArg.extra.currentModelId).toBe('gpt-5.1-codex-mini');
  });

  it('does not set extra.currentModelId for non-ACP backends (wcore reads model elsewhere)', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });

    const wcoreModel: TProviderWithModel = {
      id: 'wcore',
      platform: 'wcore',
      name: 'Wayland Core',
      baseUrl: '',
      apiKey: '',
      useModel: 'default',
    };

    await parts.service.start({
      workflow_name: 'demo',
      backend: 'wcore',
      cliPath: '/usr/local/bin/wcore',
      model: wcoreModel,
    });

    const callArg = (parts.conversationService.createConversation as Mock).mock.calls[0][0] as CreateConversationParams;
    expect(callArg.type).toBe('wcore');
    expect(callArg.extra.currentModelId).toBeUndefined();
  });

  it('missing backend/model falls through to getDefaultLaunchTarget()', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });

    const launchTargetSpy = vi.fn(async () => ({
      backend: 'claude',
      cliPath: '/opt/homebrew/bin/claude',
      model: DEFAULT_MODEL,
    }));
    (
      parts.service as unknown as {
        modelProvider: { getDefaultLaunchTarget: typeof launchTargetSpy };
      }
    ).modelProvider.getDefaultLaunchTarget = launchTargetSpy;

    await parts.service.start({ workflow_name: 'demo' });

    expect(launchTargetSpy).toHaveBeenCalledTimes(1);
    const callArg = (parts.conversationService.createConversation as Mock).mock.calls[0][0] as CreateConversationParams;
    expect(callArg.extra.backend).toBe('claude');
    expect(callArg.extra.cliPath).toBe('/opt/homebrew/bin/claude');
    // agentTypeForBackend('claude') → 'acp'
    expect(callArg.type).toBe('acp');
  });

  it('agentTypeForBackend maps backends to correct AgentType discriminators', async () => {
    const backends: Array<{ backend: string; expectedType: string }> = [
      { backend: 'claude', expectedType: 'acp' },
      { backend: 'codex', expectedType: 'acp' },
      { backend: 'qwen', expectedType: 'acp' },
      { backend: 'wcore', expectedType: 'wcore' },
      { backend: 'gemini', expectedType: 'gemini' },
      { backend: 'nanobot', expectedType: 'nanobot' },
      { backend: 'openclaw-gateway', expectedType: 'openclaw-gateway' },
      { backend: 'openclaw', expectedType: 'openclaw-gateway' },
      { backend: 'remote', expectedType: 'remote' },
    ];

    for (const { backend, expectedType } of backends) {
      const { skillMap, service, conversationService } = buildService();
      const slug = `demo-${backend}`;
      skillMap.set(slug, {
        entry: skillEntry({ name: slug, type: 'workflow' }),
        body: TWO_STEP_BODY,
      });

      await service.start({
        workflow_name: slug,
        backend,
        model: DEFAULT_MODEL,
      });

      const callArg = (conversationService.createConversation as Mock).mock.calls[0][0] as CreateConversationParams;
      expect(callArg.type, `backend '${backend}' should produce type '${expectedType}'`).toBe(expectedType);
    }
  });

  it('extra fields (agentName, customAgentId, presetAssistantId, sessionMode) are forwarded into conversation extra', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });

    await parts.service.start({
      workflow_name: 'demo',
      backend: 'claude',
      model: DEFAULT_MODEL,
      agentName: 'My Agent',
      customAgentId: 'custom-abc',
      presetAssistantId: 'preset-xyz',
      sessionMode: 'auto',
    });

    const callArg = (parts.conversationService.createConversation as Mock).mock.calls[0][0] as CreateConversationParams;
    expect(callArg.extra.agentName).toBe('My Agent');
    expect(callArg.extra.customAgentId).toBe('custom-abc');
    expect(callArg.extra.presetAssistantId).toBe('preset-xyz');
    expect(callArg.extra.sessionMode).toBe('auto');
    // workflowSessionId + workflowName must also be present.
    expect(callArg.extra.workflowSessionId).toBeDefined();
    expect(callArg.extra.workflowName).toBe('demo');
  });

  it('legacy injector with only getDefaultModel() still works', async () => {
    // Verifies backward compat for test injectors that do not implement
    // getDefaultLaunchTarget.
    const parts = buildService(); // buildService injects { getDefaultModel: () => DEFAULT_MODEL }
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });

    const result = await parts.service.start({ workflow_name: 'demo' });
    expect(result.sessionId).toBeDefined();

    const callArg = (parts.conversationService.createConversation as Mock).mock.calls[0][0] as CreateConversationParams;
    // backend must fall back to 'claude' and type to 'acp'
    expect(callArg.extra.backend).toBe('claude');
    expect(callArg.type).toBe('acp');
  });
});

describe('WorkflowSessionService - sessionChanged emitter + countActive', () => {
  beforeEach(() => {
    sessionChangedEmitMock.mockClear();
  });

  it('emits sessionChanged with action=start on start()', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });

    const result = await parts.service.start({ workflow_name: 'demo' });

    expect(sessionChangedEmitMock).toHaveBeenCalledWith({
      session_id: result.sessionId,
      action: 'start',
    });
  });

  it('emits sessionChanged with action=update on session state update (applyStepTransition)', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });

    sessionChangedEmitMock.mockClear();

    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'now',
      source: 'parent',
      dispatch_id: null,
      timestamp: 1_700_000_000_000,
    });

    expect(sessionChangedEmitMock).toHaveBeenCalledWith({
      session_id: sessionId,
      action: 'update',
    });
  });

  it('emits sessionChanged with action=complete on completeSession()', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });

    sessionChangedEmitMock.mockClear();

    await parts.service.completeSession(sessionId);

    expect(sessionChangedEmitMock).toHaveBeenCalledWith({
      session_id: sessionId,
      action: 'complete',
    });
  });

  it('countActive() returns the number of active (non-complete) sessions', async () => {
    const parts = buildService();
    parts.skillMap.set('a', {
      entry: skillEntry({ name: 'a', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });
    parts.skillMap.set('b', {
      entry: skillEntry({ name: 'b', type: 'workflow' }),
      body: TWO_STEP_BODY,
    });

    expect(await parts.service.countActive()).toBe(0);

    const first = await parts.service.start({ workflow_name: 'a' });
    expect(await parts.service.countActive()).toBe(1);

    await parts.service.start({ workflow_name: 'b' });
    expect(await parts.service.countActive()).toBe(2);

    await parts.service.completeSession(first.sessionId);
    expect(await parts.service.countActive()).toBe(1);
  });
});

describe('WorkflowSessionService - run-state machine (Phase 1)', () => {
  const startDemo = async (over: Partial<SkillIndexEntry> = {}) => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow', description: 'Demo', ...over }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    return { parts, sessionId };
  };

  it('start() defaults run_mode=running and interactivity=step', async () => {
    const { parts, sessionId } = await startDemo();
    const s = await parts.service.findById(sessionId);
    expect(s?.run_mode).toBe('running');
    expect(s?.interactivity).toBe('step');
  });

  it('start() honours metadata.interactivity=auto', async () => {
    const { parts, sessionId } = await startDemo({ metadata: { tags: [], interactivity: 'auto' } });
    const s = await parts.service.findById(sessionId);
    expect(s?.interactivity).toBe('auto');
  });

  it('start() ignores an invalid metadata.interactivity and falls back to step', async () => {
    const { parts, sessionId } = await startDemo({ metadata: { tags: [], interactivity: 'nonsense' } });
    const s = await parts.service.findById(sessionId);
    expect(s?.interactivity).toBe('step');
  });

  it('pause() flips running -> paused; resume() flips back; both idempotent', async () => {
    const { parts, sessionId } = await startDemo();
    expect((await parts.service.pause(sessionId)).run_mode).toBe('paused');
    // idempotent: pausing a paused run is a no-op (no second update)
    parts.repo.update.mockClear();
    expect((await parts.service.pause(sessionId)).run_mode).toBe('paused');
    expect(parts.repo.update).not.toHaveBeenCalled();
    expect((await parts.service.resume(sessionId)).run_mode).toBe('running');
  });

  it('resume() lifts awaiting_input back to running', async () => {
    const { parts, sessionId } = await startDemo();
    await parts.service.setRunMode(sessionId, 'awaiting_input');
    expect((await parts.service.resume(sessionId)).run_mode).toBe('running');
  });

  it('backtrackToStep() re-runs from N, re-arms run_mode, returns a snapshot, emits telemetry', async () => {
    const { parts, sessionId } = await startDemo();
    // Drive both steps to done.
    await parts.service.applyStepTransition(sessionId, { step_n: 1, status: 'done', source: 'user', dispatch_id: null, timestamp: 1 });
    await parts.service.applyStepTransition(sessionId, { step_n: 2, status: 'done', source: 'user', dispatch_id: null, timestamp: 2 });
    await parts.service.pause(sessionId);

    const { session, snapshot } = await parts.service.backtrackToStep(sessionId, 1);
    expect(session.steps[0].status).toBe('now');
    expect(session.steps[1].status).toBe('todo');
    expect(session.current_step).toBe(1);
    expect(session.run_mode).toBe('running'); // re-armed
    expect(snapshot[0].status).toBe('done'); // pre-backtrack snapshot
    expect(parts.telemetry.record).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'workflow.backtrack' })
    );
  });

  it('continueRun() returns complete and finalizes when all steps are terminal', async () => {
    const { parts, sessionId } = await startDemo();
    await parts.service.applyStepTransition(sessionId, { step_n: 1, status: 'done', source: 'user', dispatch_id: null, timestamp: 1 });
    await parts.service.applyStepTransition(sessionId, { step_n: 2, status: 'done', source: 'user', dispatch_id: null, timestamp: 2 });
    const { decision, directive, session } = await parts.service.continueRun(sessionId);
    expect(decision).toBe('complete');
    expect(directive).toBeNull();
    expect(session.status).toBe('complete');
    expect(session.run_mode).toBe('done');
  });

  it('continueRun() in step mode halts to awaiting_input with no directive', async () => {
    const { parts, sessionId } = await startDemo();
    const { decision, directive, session } = await parts.service.continueRun(sessionId);
    expect(decision).toBe('await_input');
    expect(directive).toBeNull();
    expect(session.run_mode).toBe('awaiting_input');
  });

  it('continueRun() in auto mode advances: marks the next step now and returns its directive', async () => {
    const { parts, sessionId } = await startDemo({ metadata: { tags: [], interactivity: 'auto' } });
    const { decision, directive, session } = await parts.service.continueRun(sessionId);
    expect(decision).toBe('advance');
    expect(session.steps[0].status).toBe('now');
    expect(directive).toContain('step 1');
    expect(directive).toContain('Audit');
  });

  it('rejects a parent leapfrog marker (later step now while an earlier step is non-terminal)', async () => {
    const { parts, sessionId } = await startDemo();
    // Step 1 is still `todo`; a parent-narrated `<step 2 now>` must be rejected
    // by the stepCursor leapfrog guard (F2: now live for parent markers).
    const after = await parts.service.applyStepTransition(sessionId, {
      step_n: 2,
      status: 'now',
      source: 'parent',
      dispatch_id: null,
      timestamp: Date.now(),
    });
    expect(after.steps[1].status).toBe('todo');
    expect(after.current_step).toBe(1);
    expect(parts.telemetry.record).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'workflow.regress_attempt' })
    );
  });

  it('accepts a user rail-jump to the same later step (user source is ungated)', async () => {
    const { parts, sessionId } = await startDemo();
    const after = await parts.service.applyStepTransition(sessionId, {
      step_n: 2,
      status: 'now',
      source: 'user',
      dispatch_id: null,
      timestamp: Date.now(),
    });
    expect(after.steps[1].status).toBe('now');
  });

  it('continueRun() halts (no state change) when the run is paused', async () => {
    const { parts, sessionId } = await startDemo({ metadata: { tags: [], interactivity: 'auto' } });
    await parts.service.pause(sessionId);
    parts.repo.update.mockClear();
    const { decision, directive } = await parts.service.continueRun(sessionId);
    expect(decision).toBe('halt');
    expect(directive).toBeNull();
    expect(parts.repo.update).not.toHaveBeenCalled();
  });

  it('continueRun() in auto mode does NOT re-send while the active step is still now (storm gate)', async () => {
    const { parts, sessionId } = await startDemo({ metadata: { tags: [], interactivity: 'auto' } });
    // First drive flips step 1 todo->now and emits its directive.
    const first = await parts.service.continueRun(sessionId);
    expect(first.decision).toBe('advance');
    expect(first.directive).toContain('step 1');
    // The agent has not yet emitted <step done>, so step 1 is still `now`. A
    // second driver turn must advance the state machine but emit NO directive -
    // re-sending the same directive every turn was the infinite send-storm.
    const second = await parts.service.continueRun(sessionId);
    expect(second.decision).toBe('advance');
    expect(second.directive).toBeNull();
  });

  it('continueRun({ repokeActiveStep }) re-pokes a still-now step once (boot resume / Continue)', async () => {
    const { parts, sessionId } = await startDemo({ metadata: { tags: [], interactivity: 'auto' } });
    await parts.service.continueRun(sessionId); // step 1 -> now
    const repoke = await parts.service.continueRun(sessionId, { repokeActiveStep: true });
    expect(repoke.decision).toBe('advance');
    expect(repoke.directive).toContain('step 1');
  });

  it('continueRun() halts an ended session without driving it (no state change)', async () => {
    const { parts, sessionId } = await startDemo({ metadata: { tags: [], interactivity: 'auto' } });
    await parts.service.endSession(sessionId);
    parts.repo.update.mockClear();
    const { decision, directive } = await parts.service.continueRun(sessionId);
    expect(decision).toBe('halt');
    expect(directive).toBeNull();
    expect(parts.repo.update).not.toHaveBeenCalled();
  });
});

describe('WorkflowSessionService.start() - space-delimited depends', () => {
  it('resolves N skills when depends is a space-delimited string (not char-iterating it)', async () => {
    const parts = buildService();
    parts.skillMap.set('skill-a', {
      entry: skillEntry({ name: 'skill-a', description: 'Alpha', type: 'skill' }),
      body: 'body-a',
    });
    parts.skillMap.set('skill-b', {
      entry: skillEntry({ name: 'skill-b', description: 'Beta', type: 'skill' }),
      body: 'body-b',
    });
    parts.skillMap.set('skill-c', {
      entry: skillEntry({ name: 'skill-c', description: 'Gamma', type: 'skill' }),
      body: 'body-c',
    });
    parts.skillMap.set('string-depends', {
      entry: skillEntry({
        name: 'string-depends',
        type: 'workflow',
        // Space-delimited string - the shape from vendored index.json
        metadata: { tags: [], depends: 'skill-a skill-b skill-c' } as never,
      }),
      body: TWO_STEP_BODY,
    });

    const result = await parts.service.start({ workflow_name: 'string-depends' });
    // Must resolve exactly 3 skills, not 30+ chars
    expect(result.session.skills).toHaveLength(3);
    expect(result.session.skills.map((s) => s.slug)).toEqual(['skill-a', 'skill-b', 'skill-c']);
  });

  it('handles an already-array depends without double-splitting', async () => {
    const parts = buildService();
    parts.skillMap.set('skill-x', {
      entry: skillEntry({ name: 'skill-x', description: 'X', type: 'skill' }),
      body: 'body-x',
    });
    parts.skillMap.set('array-depends', {
      entry: skillEntry({
        name: 'array-depends',
        type: 'workflow',
        metadata: { tags: [], depends: ['skill-x'] },
      }),
      body: TWO_STEP_BODY,
    });

    const result = await parts.service.start({ workflow_name: 'array-depends' });
    expect(result.session.skills).toHaveLength(1);
    expect(result.session.skills[0].slug).toBe('skill-x');
  });
});

describe('WorkflowSessionService.setInteractivity()', () => {
  it('throws when the session id is unknown', async () => {
    const parts = buildService();
    await expect(parts.service.setInteractivity('nope', 'auto')).rejects.toThrow(
      /WorkflowSessionService.setInteractivity: unknown session/
    );
  });

  it('flips step -> auto and emits sessionChanged', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow', metadata: { tags: [], interactivity: 'step' } }),
      body: TWO_STEP_BODY,
    });
    sessionChangedEmitMock.mockClear();
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    sessionChangedEmitMock.mockClear();

    const updated = await parts.service.setInteractivity(sessionId, 'auto');
    expect(updated.interactivity).toBe('auto');
    expect(parts.repo.update).toHaveBeenCalled();
    expect(sessionChangedEmitMock).toHaveBeenCalledWith({ session_id: sessionId, action: 'update' });
  });

  it('is idempotent: same mode returns current session without a repo write', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow', metadata: { tags: [], interactivity: 'step' } }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
    const updateCallsBefore = (parts.repo.update as Mock).mock.calls.length;

    const result = await parts.service.setInteractivity(sessionId, 'step');
    expect(result.interactivity).toBe('step');
    expect((parts.repo.update as Mock).mock.calls.length).toBe(updateCallsBefore);
  });

  it('flips auto -> step', async () => {
    const parts = buildService();
    parts.skillMap.set('demo', {
      entry: skillEntry({ name: 'demo', type: 'workflow', metadata: { tags: [], interactivity: 'auto' } }),
      body: TWO_STEP_BODY,
    });
    const { sessionId } = await parts.service.start({ workflow_name: 'demo' });

    const updated = await parts.service.setInteractivity(sessionId, 'step');
    expect(updated.interactivity).toBe('step');
  });
});

// Suppress unused-variable warnings for imported types kept for documentation.
void ({} as StepState);
