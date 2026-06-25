/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for the Stage 1 workflow auto-progression: the driver-owned completion
 * block in `WorkflowSessionService.continueRun` plus `acceptStep`. These mark
 * the active step terminal at the turn boundary (the "clock edge") so a run
 * advances WITHOUT depending on the model emitting `<step status="done">`.
 *
 * Dependencies are injected; this suite uses the same in-memory mock-repo
 * harness as `WorkflowSessionService.test.ts` (no native better-sqlite3 - the
 * real SQLite repo is covered in `WorkflowSessionRepository.test.ts`), so no
 * native-ABI skip is needed here.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @/common so the service's ipcBridge.*.emit calls are inert + spy-able.
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
import type { AskRecord, WorkflowSession } from '@/common/types/workflowTypes';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import type { WorkflowSessionRepository } from '@process/services/workflow/WorkflowSessionRepository';
import { WorkflowSessionService } from '@process/services/workflow/WorkflowSessionService';

// ---------------------------------------------------------------------------
// Fakes (mirrors WorkflowSessionService.test.ts)
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

const skillEntry = (over: Partial<SkillIndexEntry> = {}): SkillIndexEntry =>
  ({
    name: over.name ?? 'sample',
    description: over.description ?? 'desc',
    type: over.type ?? 'skill',
    source: over.source ?? 'wayland-library',
    metadata: over.metadata ?? { tags: [] },
    path: over.path ?? `bodies/${over.name ?? 'sample'}.md`,
    ...over,
  }) as SkillIndexEntry;

function makeSkillLibrary(map: SkillMap) {
  return {
    loadBody: vi.fn(async (name: string) => map.get(name)?.body ?? null),
    get: vi.fn(async (name: string) => map.get(name)?.entry ?? null),
  };
}

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
    findActiveByWorkflowName: vi.fn(() => null),
    findAllActive: vi.fn(() => []),
    countActive: vi.fn(() => 0),
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

function makeTelemetry() {
  return { record: vi.fn(async () => undefined) };
}

function makeConversationService() {
  const conversations = new Map<string, TChatConversation>();
  let counter = 0;
  return {
    conversations,
    createConversation: vi.fn(async (params: Record<string, unknown>) => {
      counter += 1;
      const id = `conv-${counter}`;
      const conv = {
        id,
        type: params.type,
        name: (params.name as string) ?? 'Workflow',
        createTime: Date.now(),
        modifyTime: Date.now(),
        model: params.model,
        extra: params.extra,
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

// Body with 2 well-formed steps.
const TWO_STEP_BODY = `# Demo Workflow

Intro prose.

## Step 1: Audit

Audit the thing.

## Step 2: Ship

Ship the thing.
`;

function buildService() {
  const skillMap: SkillMap = new Map();
  const skills = makeSkillLibrary(skillMap);
  const { repo, rows } = makeRepo();
  const telemetry = makeTelemetry();
  const conversationService = makeConversationService();

  const service = new WorkflowSessionService(
    repo as unknown as WorkflowSessionRepository,
    skills as unknown as never,
    telemetry as unknown as never,
    conversationService as unknown as never,
    { getDefaultModel: () => DEFAULT_MODEL }
  );

  return { service, skills, repo, rows, telemetry, conversationService, skillMap };
}

type Parts = ReturnType<typeof buildService>;

/** Start a 2-step demo workflow with the requested interactivity. */
async function startDemo(interactivity: 'auto' | 'step'): Promise<{ parts: Parts; sessionId: string }> {
  const parts = buildService();
  parts.skillMap.set('demo', {
    entry: skillEntry({ name: 'demo', type: 'workflow', description: 'Demo', metadata: { tags: [], interactivity } }),
    body: TWO_STEP_BODY,
  });
  const { sessionId } = await parts.service.start({ workflow_name: 'demo' });
  return { parts, sessionId };
}

/** Build a minimal answered/unanswered AskRecord on a given step. */
function ask(stepN: number, answered: boolean): AskRecord {
  return {
    id: `ask-${stepN}-${answered ? 'a' : 'o'}`,
    step_n: stepN,
    question: 'q?',
    type: 'text',
    options: null,
    max: null,
    placeholder: null,
    answer: answered ? 'yes' : null,
    asked_at: 1,
    answered_at: answered ? 2 : null,
  };
}

// ---------------------------------------------------------------------------
// continueRun - driver-owned completion block (Stage 1)
// ---------------------------------------------------------------------------

describe('continueRun - driver auto-completion (Stage 1)', () => {
  beforeEach(() => {
    sessionChangedEmitMock.mockClear();
    listChangedEmitMock.mockClear();
  });

  it('AUTO + active now + normal turn (no open ask): marks active done, advances, next step now, directive', async () => {
    const { parts, sessionId } = await startDemo('auto');
    // First drive (boot edge) flips step 1 todo->now and emits its directive.
    await parts.service.continueRun(sessionId, { turnState: 'ai_waiting_input' });
    let s = await parts.service.findById(sessionId);
    expect(s?.steps[0].status).toBe('now');

    // Turn completes normally for step 1. Driver marks it done + advances to 2.
    const res = await parts.service.continueRun(sessionId, { turnState: 'ai_waiting_input' });
    expect(res.decision).toBe('advance');
    expect(res.directive).toContain('step 2');
    expect(res.directive).toContain('Ship');
    s = await parts.service.findById(sessionId);
    expect(s?.steps[0].status).toBe('done');
    expect(s?.steps[1].status).toBe('now');
    expect(parts.telemetry.record).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'workflow.step_auto_completed' })
    );
  });

  it('#123: AUTO + active now + pending confirmation: parks (await_input), does NOT auto-advance', async () => {
    const { parts, sessionId } = await startDemo('auto');
    // Boot edge flips step 1 todo->now.
    await parts.service.continueRun(sessionId, { turnState: 'ai_waiting_input' });
    let s = await parts.service.findById(sessionId);
    expect(s?.steps[0].status).toBe('now');

    // The turn finished while the agent was blocked on a tool/permission
    // confirmation (default `ai_waiting_input` state, non-zero count). The brain
    // must park instead of marking the step done and cascading forward.
    const res = await parts.service.continueRun(sessionId, { turnState: 'ai_waiting_input', pendingConfirmations: 1 });
    expect(res.decision).toBe('await_input');
    expect(res.directive).toBeNull();
    s = await parts.service.findById(sessionId);
    expect(s?.steps[0].status).toBe('now'); // not done
    expect(s?.steps[1].status).toBe('todo'); // not advanced
    expect(s?.run_mode).toBe('awaiting_input');
  });

  it('#123: AUTO + active now + endedWithUserQuestion: parks (await_input), does NOT auto-advance', async () => {
    const { parts, sessionId } = await startDemo('auto');
    await parts.service.continueRun(sessionId, { turnState: 'ai_waiting_input' });
    let s = await parts.service.findById(sessionId);
    expect(s?.steps[0].status).toBe('now');

    // The turn finished with the agent's final message reading as a prose
    // question to the user (no marker, no confirmation). Park, don't cascade.
    const res = await parts.service.continueRun(sessionId, {
      turnState: 'ai_waiting_input',
      endedWithUserQuestion: true,
    });
    expect(res.decision).toBe('await_input');
    expect(res.directive).toBeNull();
    s = await parts.service.findById(sessionId);
    expect(s?.steps[0].status).toBe('now'); // not done
    expect(s?.steps[1].status).toBe('todo'); // not advanced
    expect(s?.run_mode).toBe('awaiting_input');
  });

  it('AUTO + last step now + others done + normal turn: all terminal -> complete + run_mode done', async () => {
    const { parts, sessionId } = await startDemo('auto');
    // Mark step 1 done, step 2 now (the agent is finishing the last step).
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'done',
      source: 'worker',
      dispatch_id: null,
      timestamp: 1,
    });
    await parts.service.applyStepTransition(sessionId, {
      step_n: 2,
      status: 'now',
      source: 'worker',
      dispatch_id: null,
      timestamp: 2,
    });

    const res = await parts.service.continueRun(sessionId, { turnState: 'ai_waiting_input' });
    expect(res.decision).toBe('complete');
    expect(res.directive).toBeNull();
    expect(res.session.status).toBe('complete');
    expect(res.session.run_mode).toBe('done');
    expect(res.session.steps[1].status).toBe('done');
  });

  it('STEP + active now + normal turn: active stays now, await_input, run_mode awaiting_input', async () => {
    const { parts, sessionId } = await startDemo('step');
    // Put step 1 at `now` (the agent is on it).
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'now',
      source: 'worker',
      dispatch_id: null,
      timestamp: 1,
    });

    const res = await parts.service.continueRun(sessionId, { turnState: 'ai_waiting_input' });
    expect(res.decision).toBe('await_input');
    expect(res.directive).toBeNull();
    expect(res.session.run_mode).toBe('awaiting_input');
    const s = await parts.service.findById(sessionId);
    expect(s?.steps[0].status).toBe('now');
  });

  it('turnState error: active becomes errored, run_mode awaiting_input, await_input', async () => {
    const { parts, sessionId } = await startDemo('auto');
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'now',
      source: 'worker',
      dispatch_id: null,
      timestamp: 1,
    });

    const res = await parts.service.continueRun(sessionId, { turnState: 'error' });
    expect(res.decision).toBe('await_input');
    expect(res.directive).toBeNull();
    expect(res.session.run_mode).toBe('awaiting_input');
    const s = await parts.service.findById(sessionId);
    expect(s?.steps[0].status).toBe('errored');
  });

  it('open ask on active step: active stays now, run_mode awaiting_input, await_input (auto mode)', async () => {
    const { parts, sessionId } = await startDemo('auto');
    // Step 1 now, with an UNANSWERED ask on step 1.
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'now',
      source: 'worker',
      dispatch_id: null,
      timestamp: 1,
    });
    await parts.service.appendAsk(sessionId, ask(1, false));

    const res = await parts.service.continueRun(sessionId, { turnState: 'ai_waiting_input' });
    expect(res.decision).toBe('await_input');
    expect(res.directive).toBeNull();
    expect(res.session.run_mode).toBe('awaiting_input');
    const s = await parts.service.findById(sessionId);
    expect(s?.steps[0].status).toBe('now');
  });

  it('an ANSWERED ask does NOT block auto-completion (auto mode advances)', async () => {
    const { parts, sessionId } = await startDemo('auto');
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'now',
      source: 'worker',
      dispatch_id: null,
      timestamp: 1,
    });
    await parts.service.appendAsk(sessionId, ask(1, true));

    const res = await parts.service.continueRun(sessionId, { turnState: 'ai_waiting_input' });
    expect(res.decision).toBe('advance');
    const s = await parts.service.findById(sessionId);
    expect(s?.steps[0].status).toBe('done');
    expect(s?.steps[1].status).toBe('now');
  });

  it('turnState undefined (boot-resume): NO auto-completion, active step unchanged', async () => {
    const { parts, sessionId } = await startDemo('auto');
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'now',
      source: 'worker',
      dispatch_id: null,
      timestamp: 1,
    });

    // No turnState => boot-resume. The completion block is skipped entirely; the
    // existing advance path leaves the already-`now` step untouched (no done).
    const res = await parts.service.continueRun(sessionId);
    expect(res.decision).toBe('advance');
    const s = await parts.service.findById(sessionId);
    expect(s?.steps[0].status).toBe('now');
    expect(parts.telemetry.record).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'workflow.step_auto_completed' })
    );
  });

  it('AUTO paused run: completion block is skipped entirely, step stays now (pause wins)', async () => {
    const { parts, sessionId } = await startDemo('auto');
    // Step 1 is `now` (the agent is mid-step), then the user pauses.
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'now',
      source: 'worker',
      dispatch_id: null,
      timestamp: 1,
    });
    await parts.service.pause(sessionId);

    // An in-flight turn completes AFTER the pause. The completion block must NOT
    // mark step 1 done; decideAfterTurn halts a non-running run.
    const res = await parts.service.continueRun(sessionId, { turnState: 'ai_waiting_input' });
    expect(res.decision).toBe('halt');
    const s = await parts.service.findById(sessionId);
    expect(s?.steps[0].status).toBe('now');
    expect(s?.run_mode).toBe('paused');
    expect(parts.telemetry.record).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'workflow.step_auto_completed' })
    );
  });

  it('AUTO awaiting_input run: stray turn does NOT auto-advance (mid-ask park holds)', async () => {
    const { parts, sessionId } = await startDemo('auto');
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'now',
      source: 'worker',
      dispatch_id: null,
      timestamp: 1,
    });
    // The run was parked at awaiting_input (e.g. an ask surfaced). A stale turn
    // event fires; the completion block must be skipped (run_mode !== running).
    await parts.service.setRunMode(sessionId, 'awaiting_input');

    const res = await parts.service.continueRun(sessionId, { turnState: 'ai_waiting_input' });
    expect(res.decision).toBe('halt');
    const s = await parts.service.findById(sessionId);
    expect(s?.steps[0].status).toBe('now');
    expect(s?.run_mode).toBe('awaiting_input');
    expect(parts.telemetry.record).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'workflow.step_auto_completed' })
    );
  });

  it('turnState undefined + repokeActiveStep re-pokes the still-now step once (boot resume)', async () => {
    const { parts, sessionId } = await startDemo('auto');
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'now',
      source: 'worker',
      dispatch_id: null,
      timestamp: 1,
    });
    const res = await parts.service.continueRun(sessionId, { repokeActiveStep: true });
    expect(res.decision).toBe('advance');
    expect(res.directive).toContain('step 1');
  });

  it('poke cap: once advance directives exceed total_steps*3, parks at awaiting_input + telemetry', async () => {
    const { parts, sessionId } = await startDemo('auto');
    // total_steps = 2 => cap = 6 (7th directive trips it). Each cycle re-arms the
    // run via backtrack (step 1 -> now, step 2 -> todo) then drives a normal turn:
    // continueRun marks step 1 done and flips step 2 todo->now => exactly one
    // advance directive, +1 on the cumulative per-session counter.
    let parkedRes: Awaited<ReturnType<typeof parts.service.continueRun>> | null = null;
    for (let i = 0; i < 8; i += 1) {
      await parts.service.backtrackToStep(sessionId, 1); // step1 now, step2 todo, run_mode running
      const res = await parts.service.continueRun(sessionId, { turnState: 'ai_waiting_input' });
      if (res.decision === 'await_input' && res.directive === null) {
        parkedRes = res;
        break;
      }
    }
    expect(parkedRes).not.toBeNull();
    expect(parkedRes?.session.run_mode).toBe('awaiting_input');
    expect(parts.telemetry.record).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'workflow.poke_cap_hit' })
    );
  });
});

// ---------------------------------------------------------------------------
// acceptStep - step-mode advance
// ---------------------------------------------------------------------------

describe('acceptStep - step-mode advance', () => {
  beforeEach(() => {
    sessionChangedEmitMock.mockClear();
  });

  it('active now -> marked done, run_mode running, next step now, returns directive', async () => {
    const { parts, sessionId } = await startDemo('step');
    // Step 1 now, run parked at awaiting_input (the StepReviewBeat state).
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'now',
      source: 'worker',
      dispatch_id: null,
      timestamp: 1,
    });
    await parts.service.setRunMode(sessionId, 'awaiting_input');

    const res = await parts.service.acceptStep(sessionId);
    expect(res.decision).toBe('advance');
    expect(res.directive).toContain('step 2');
    expect(res.session.steps[0].status).toBe('done');
    expect(res.session.steps[1].status).toBe('now');
    expect(res.session.run_mode).toBe('running');
    expect(parts.telemetry.record).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'workflow.step_auto_completed' })
    );
  });

  it('accepting the last step completes the run (run_mode done, status complete)', async () => {
    const { parts, sessionId } = await startDemo('step');
    await parts.service.applyStepTransition(sessionId, {
      step_n: 1,
      status: 'done',
      source: 'worker',
      dispatch_id: null,
      timestamp: 1,
    });
    await parts.service.applyStepTransition(sessionId, {
      step_n: 2,
      status: 'now',
      source: 'worker',
      dispatch_id: null,
      timestamp: 2,
    });
    await parts.service.setRunMode(sessionId, 'awaiting_input');

    const res = await parts.service.acceptStep(sessionId);
    expect(res.decision).toBe('complete');
    expect(res.directive).toBeNull();
    expect(res.session.status).toBe('complete');
    expect(res.session.run_mode).toBe('done');
  });

  it('halts a non-active (ended) session without driving it', async () => {
    const { parts, sessionId } = await startDemo('step');
    await parts.service.endSession(sessionId);
    const res = await parts.service.acceptStep(sessionId);
    expect(res.decision).toBe('halt');
    expect(res.directive).toBeNull();
  });

  it('throws on an unknown session', async () => {
    const parts = buildService();
    await expect(parts.service.acceptStep('nope')).rejects.toThrow(/unknown session/);
  });
});
