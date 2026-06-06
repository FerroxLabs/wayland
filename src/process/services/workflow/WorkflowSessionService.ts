/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Orchestration layer for the Workflow Launch Surface (SPEC §6, §10, §11).
 *
 * `WorkflowSessionService` owns the full lifecycle of a {@link WorkflowSession}:
 *  - `start` loads the workflow body, parses steps, resolves dependent skills,
 *    creates the underlying chat conversation row, persists the session, and
 *    emits `workflow.session_started` telemetry. It returns the static
 *    `WORKFLOW_PROTOCOL` system-prompt directive that the IPC bridge (W2.3)
 *    will hand to the agent send-path.
 *  - `findById`, `findActive`, `findAllActive` are read paths used by the
 *    resume probes and the in-flight launchpad strip.
 *  - `resolveSkills` powers the `WorkflowDetailModal` chip rendering before
 *    launch (separate from `start`).
 *  - `applyStepTransition` calls the pure `applyTransition` resolver,
 *    persists on accept, and emits the right telemetry on accept/reject.
 *  - `appendAsk` / `answerAsk` mutate the `asks` array.
 *  - `completeSession` / `endSession` flip the session status terminally.
 *
 * The service is dependency-injected: repository, skill library, telemetry
 * logger, and conversation service are all passed in by the bridge (W2.3).
 * A separate `defaultModel` provider keeps model resolution out of this
 * file - the bridge supplies a sensible default per current settings.
 */

import { randomUUID } from 'crypto';
import { ipcBridge } from '@/common';
import type { TProviderWithModel } from '@/common/config/storage';
import type {
  AskRecord,
  ResolvedSkill,
  StepState,
  StepTransition,
  WorkflowSession,
} from '@/common/types/workflowTypes';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import type { AgentType } from '@process/task/agentTypes';
import type { IConversationService, CreateConversationParams } from '../IConversationService';
import type { UsageEventLogger } from '../usage/UsageEventLogger';
import type { WorkflowSessionPatch, WorkflowSessionRepository } from './WorkflowSessionRepository';
import { parseSteps, type ParsedStep } from './parseSteps';
import { applyTransition } from './applyTransition';
import { composeWorkflowSystemPrompt } from './composeWorkflowSystemPrompt';
import { resolveWorkflowPalette } from '@renderer/pages/guid/components/workflow/workflowPalette';

// ---------------------------------------------------------------------------
// Lightweight structural interfaces - keeps the service decoupled from the
// real singletons (which are hard to construct in unit tests).
// ---------------------------------------------------------------------------

export type SkillLibraryLike = {
  loadBody(name: string): Promise<string | null>;
  get(name: string): Promise<SkillIndexEntry | null>;
};

/**
 * The service does not know how to resolve a "current default model"; the
 * bridge supplies it. Returning a `Promise` keeps async settings lookups in
 * scope for the production path.
 *
 * `getDefaultLaunchTarget()` returns the model AND the backend/cliPath the
 * agent spawner needs - without these the conversation lands without a
 * spawnable agent and errors with "No CLI path for backend undefined".
 */
export type WorkflowLaunchTarget = {
  model: TProviderWithModel;
  backend: string;
  cliPath: string | undefined;
};

export type DefaultModelProvider = {
  getDefaultModel(): TProviderWithModel | Promise<TProviderWithModel>;
  getDefaultLaunchTarget?(): WorkflowLaunchTarget | Promise<WorkflowLaunchTarget>;
};

export type StartWorkflowResult = {
  sessionId: string;
  session: WorkflowSession;
  systemPromptDirective: string;
};

/**
 * Map a backend slug to the conversation `type` discriminator the
 * platform-chat router uses. Mirrors `WorkerTaskManagerJobExecutor.getAgentType`
 * exactly so workflow-launched conversations route through the same spawner
 * path as cron-launched ones.
 */
const agentTypeForBackend = (backend: string): AgentType => {
  if (backend === 'gemini') return 'gemini';
  if (backend === 'wcore') return 'wcore';
  if (backend === 'nanobot') return 'nanobot';
  if (backend === 'openclaw-gateway' || backend === 'openclaw') return 'openclaw-gateway';
  if (backend === 'remote') return 'remote';
  // All Claude / Codex / ACP-protocol backends route through 'acp'.
  return 'acp';
};

/** Length cap for `conversation_preview` strings in `findAllActive`. */
const PREVIEW_MAX_CHARS = 80;

/**
 * Maps a {@link SkillIndexEntry} (workflow or skill) to a {@link ResolvedSkill}.
 * `display_name` falls back to the slug when the entry has no separate title;
 * the entry's `name` field is the canonical slug.
 */
const entryToResolvedSkill = (entry: SkillIndexEntry): ResolvedSkill => ({
  slug: entry.name,
  display_name: entry.name,
  icon: null,
  description: entry.description,
});

/**
 * Build a fresh {@link StepState} from a parsed step. All start times,
 * completion times, and ETAs are null - the session begins as `todo`.
 */
const parsedToStepState = (parsed: ParsedStep): StepState => ({
  n: parsed.n,
  title: parsed.title,
  body_excerpt: parsed.body_excerpt,
  status: 'todo',
  started_at: null,
  completed_at: null,
  eta_seconds: null,
  eta_source: null,
  autonomous_run: null,
});

export class WorkflowSessionService {
  constructor(
    private readonly repo: WorkflowSessionRepository,
    private readonly skillLibrary: SkillLibraryLike,
    private readonly telemetry: UsageEventLogger,
    private readonly conversationService: IConversationService,
    private readonly modelProvider: DefaultModelProvider
  ) {}

  /**
   * Create a new workflow session. See SPEC §6.1.
   *
   * Steps:
   *   1. Load the workflow body. Throw if missing.
   *   2. `parseSteps` to extract `## Step N: <title>` headers.
   *   3. Resolve the workflow entry from the library for metadata
   *      (category, depends, description as `workflow_title` fallback).
   *   4. Resolve depended-on skills (missing slugs are silently dropped here;
   *      `resolveSkills` exposes the unresolved list for the modal path).
   *   5. Resolve launch target: use renderer-supplied params directly when all
   *      three of (backend, model, cliPath) are present; otherwise fall back
   *      to `getDefaultLaunchTarget()` for any missing fields.
   *   6. Create the underlying chat conversation row with cron-style extras so
   *      the agent spawner can locate the CLI binary.
   *   7. Build the {@link WorkflowSession}, persist via the repository.
   *   8. Compose the static `WORKFLOW_PROTOCOL` directive.
   *   9. Emit `workflow.session_started` telemetry (with truncated flag).
   */
  async start(params: {
    workflow_name: string;
    backend?: string;
    cliPath?: string | undefined;
    model?: TProviderWithModel;
    agentName?: string | undefined;
    customAgentId?: string | undefined;
    presetAssistantId?: string | undefined;
    sessionMode?: string | undefined;
  }): Promise<StartWorkflowResult> {
    const {
      workflow_name,
      backend: paramsBackend,
      cliPath: paramsCliPath,
      model: paramsModel,
      agentName,
      customAgentId,
      presetAssistantId,
      sessionMode,
    } = params;

    const body = await this.skillLibrary.loadBody(workflow_name);
    if (body === null) {
      throw new Error(`Workflow body not found: ${workflow_name}`);
    }

    const { steps: parsedSteps, truncated } = parseSteps(body);
    const steps = parsedSteps.map(parsedToStepState);
    const totalSteps = steps.length;

    const entry = await this.skillLibrary.get(workflow_name);
    const workflowTitle = entry?.description?.trim() || workflow_name;
    const category = entry?.metadata?.category ?? null;
    const palette = resolveWorkflowPalette(category);

    const depends = entry?.metadata?.depends ?? [];
    const resolved = await this.resolveSkillEntries(depends);
    const skills = resolved.skills;

    const sessionId = randomUUID();

    // Resolve the launch target. When the renderer supplied all three critical
    // fields (backend, model, cliPath) use them directly - no injector call.
    // When any field is absent, call getDefaultLaunchTarget() (which reads
    // guid.lastSelectedAgent + AgentRegistry) and fill only the missing slots.
    // Callers that only implement the legacy getDefaultModel() accessor are
    // handled by the outer fallback so older test injectors continue to work.
    let backend: string;
    let resolvedModel: TProviderWithModel;
    let cliPath: string | undefined;

    if (paramsBackend !== undefined && paramsModel !== undefined) {
      // Renderer provided a complete target - use it as-is.
      backend = paramsBackend;
      resolvedModel = paramsModel;
      cliPath = paramsCliPath;
    } else {
      // Fall back to the injected resolver for any missing fields.
      const launchTarget = this.modelProvider.getDefaultLaunchTarget
        ? await this.modelProvider.getDefaultLaunchTarget()
        : { model: await this.modelProvider.getDefaultModel(), backend: 'claude', cliPath: undefined };

      backend = paramsBackend ?? launchTarget.backend;
      resolvedModel = paramsModel ?? launchTarget.model;
      cliPath = paramsCliPath ?? launchTarget.cliPath;
    }

    const conversationParams: CreateConversationParams = {
      type: agentTypeForBackend(backend),
      name: workflowTitle,
      model: resolvedModel,
      source: 'wayland',
      extra: {
        workspace: '',
        backend: backend as CreateConversationParams['extra']['backend'],
        ...(cliPath ? { cliPath } : {}),
        ...(agentName ? { agentName } : {}),
        ...(customAgentId ? { customAgentId } : {}),
        ...(presetAssistantId ? { presetAssistantId } : {}),
        ...(sessionMode ? { sessionMode } : {}),
        workflowSessionId: sessionId,
        workflowName: workflow_name,
      },
    };

    const conversation = await this.conversationService.createConversation(conversationParams);

    // Sidebar + conversation-tab refresh trigger - mirrors the cron pattern
    // at WorkerTaskManagerJobExecutor.ts:254-258. Without this, the newly
    // created workflow conversation does not appear in ChatSider until some
    // other conversation-list change fires.
    ipcBridge.conversation.listChanged.emit({
      conversationId: conversation.id,
      action: 'created',
      source: conversation.source ?? 'wayland',
    });

    const now = Date.now();
    const session: WorkflowSession = {
      id: sessionId,
      workflow_name,
      workflow_title: workflowTitle,
      conversation_id: conversation.id,
      // current_step indexes the first todo step; 0 when the workflow has no
      // step headers at all (fallback 5c renders chrome without a rail).
      current_step: totalSteps > 0 ? 1 : 0,
      total_steps: totalSteps,
      steps,
      skills,
      asks: [],
      status: 'active',
      palette,
      category,
      created_at: now,
      updated_at: now,
      completed_at: null,
      begin_sent_at: null,
    };

    this.repo.insert(session);

    // Sidebar listeners (Workflows section + in-flight strip) consume this
    // emit to refresh without re-fetching the full session payload.
    ipcBridge.workflow.sessionChanged.emit({ session_id: sessionId, action: 'start' });

    const systemPromptDirective = composeWorkflowSystemPrompt(session);

    await this.telemetry.record({
      eventType: 'workflow.session_started',
      metadata: {
        workflow_name,
        total_steps: totalSteps,
        truncated,
        category: category ?? null,
        skills_resolved: skills.length,
        skills_unresolved: resolved.unresolved.length,
      },
    });

    return { sessionId, session, systemPromptDirective };
  }

  async findById(sessionId: string): Promise<WorkflowSession | null> {
    return this.repo.findById(sessionId);
  }

  async findActive(workflow_name: string): Promise<WorkflowSession | null> {
    return this.repo.findActiveByWorkflowName(workflow_name);
  }

  /**
   * Top-N most-recent active sessions across all workflows, each paired with
   * an 80-char preview drawn from the underlying conversation's `name`. See
   * SPEC §6.3.1 - drives the launchpad in-flight strip. If a conversation
   * has been pruned, the preview is the empty string.
   */
  async findAllActive(limit: number = 3): Promise<Array<{ session: WorkflowSession; conversation_preview: string }>> {
    const sessions = this.repo.findAllActive(limit);
    const out: Array<{ session: WorkflowSession; conversation_preview: string }> = [];
    for (const session of sessions) {
      let preview = '';
      try {
        const conv = await this.conversationService.getConversation(session.conversation_id);
        if (conv) {
          const raw = conv.name ?? '';
          preview = raw.length > PREVIEW_MAX_CHARS ? raw.slice(0, PREVIEW_MAX_CHARS) : raw;
        }
      } catch {
        preview = '';
      }
      out.push({ session, conversation_preview: preview });
    }
    return out;
  }

  /**
   * Resolve a list of skill slugs to {@link ResolvedSkill} entries via the
   * skill library. Unknown slugs are returned in `unresolved` so the modal
   * can render a "missing dependency" hint. See SPEC §6.2.
   */
  async resolveSkills(slugs: string[]): Promise<{ skills: ResolvedSkill[]; unresolved: string[] }> {
    return this.resolveSkillEntries(slugs);
  }

  /**
   * Internal helper that powers both `start()` (where unresolved is silently
   * dropped) and the public `resolveSkills()` endpoint.
   */
  private async resolveSkillEntries(slugs: string[]): Promise<{ skills: ResolvedSkill[]; unresolved: string[] }> {
    const skills: ResolvedSkill[] = [];
    const unresolved: string[] = [];
    for (const slug of slugs) {
      const entry = await this.skillLibrary.get(slug);
      if (entry === null) {
        unresolved.push(slug);
        continue;
      }
      skills.push(entryToResolvedSkill(entry));
    }
    return { skills, unresolved };
  }

  /**
   * Apply a step transition. Pure resolution lives in `applyTransition`; this
   * method threads the result through persistence and telemetry per SPEC §11.1.
   *
   * - On accept: update the matching step's status (and `started_at` /
   *   `completed_at` timestamps when the new status is `now` / `done`),
   *   advance `current_step` if appropriate, persist, and emit
   *   `workflow.step_transition` telemetry.
   * - On reject: emit the resolver's telemetry event verbatim
   *   (`workflow.regress_attempt`) and return the current session unchanged.
   */
  async applyStepTransition(sessionId: string, transition: StepTransition): Promise<WorkflowSession> {
    const current = this.repo.findById(sessionId);
    if (current === null) {
      throw new Error(`WorkflowSessionService.applyStepTransition: unknown session ${sessionId}`);
    }

    const stepIdx = current.steps.findIndex((s) => s.n === transition.step_n);
    if (stepIdx < 0) {
      throw new Error(
        `WorkflowSessionService.applyStepTransition: step ${transition.step_n} not found in session ${sessionId}`
      );
    }

    // W6: the parent agent narrates progress via `<step n status>` markers in its
    // streamed reply. A single verbose turn can emit `now` for several steps at
    // once; because applyTransition is per-step, each would be accepted and the
    // rail would paint multiple steps `now` / jump current_step with no work
    // actually done. A PARENT may only move a step to `now` once every earlier
    // step is terminal (done/skipped/errored). Worker (intentional out-of-order
    // autonomous runs) and user (explicit rail jumps) sources are not gated.
    if (transition.status === 'now' && transition.source === 'parent') {
      const earlierIncomplete = current.steps.some(
        (s, i) => i < stepIdx && (s.status === 'todo' || s.status === 'now')
      );
      if (earlierIncomplete) {
        await this.telemetry.record({
          eventType: 'workflow.regress_attempt',
          metadata: {
            session_id: sessionId,
            workflow_name: current.workflow_name,
            step_n: transition.step_n,
            incoming_status: transition.status,
            current_status: current.steps[stepIdx].status,
            source: transition.source,
            reason: 'out_of_order',
          },
        });
        return current;
      }
    }

    const result = applyTransition(current.steps[stepIdx].status, transition);

    if (result.accepted === false) {
      await this.telemetry.record({
        eventType: 'workflow.regress_attempt',
        metadata: {
          session_id: sessionId,
          workflow_name: current.workflow_name,
          step_n: transition.step_n,
          incoming_status: transition.status,
          current_status: current.steps[stepIdx].status,
          source: transition.source,
          reason: result.reason,
        },
      });
      return current;
    }

    const newStatus = result.newStatus;
    const updatedStep: StepState = { ...current.steps[stepIdx], status: newStatus };
    if (newStatus === 'now' && updatedStep.started_at === null) {
      updatedStep.started_at = transition.timestamp;
    }
    if (newStatus === 'done') {
      updatedStep.completed_at = transition.timestamp;
      if (updatedStep.started_at === null) {
        updatedStep.started_at = transition.timestamp;
      }
    }

    const newSteps = current.steps.map((s, i) => (i === stepIdx ? updatedStep : s));

    let newCurrentStep = current.current_step;
    if (newStatus === 'now') {
      newCurrentStep = transition.step_n;
    } else if (newStatus === 'done' && transition.step_n === current.total_steps) {
      // Final step done → park current_step one past the end so the rail
      // knows the workflow has reached its terminal cursor (status flip to
      // `complete` is a separate explicit call).
      newCurrentStep = current.total_steps + 1;
    } else if (newStatus === 'done' && transition.step_n >= current.current_step) {
      newCurrentStep = transition.step_n + 1;
    }

    const patch: WorkflowSessionPatch = {
      steps: newSteps,
      current_step: newCurrentStep,
    };
    const updated = this.repo.update(sessionId, patch);

    await this.telemetry.record({
      eventType: 'workflow.step_transition',
      metadata: {
        session_id: sessionId,
        workflow_name: current.workflow_name,
        step_n: transition.step_n,
        new_status: newStatus,
        source: transition.source,
        dispatch_id: transition.dispatch_id,
      },
    });

    ipcBridge.workflow.sessionChanged.emit({ session_id: sessionId, action: 'update' });

    return updated;
  }

  /** Append a new {@link AskRecord} to the session's asks tape. */
  async appendAsk(sessionId: string, ask: AskRecord): Promise<WorkflowSession> {
    const current = this.repo.findById(sessionId);
    if (current === null) {
      throw new Error(`WorkflowSessionService.appendAsk: unknown session ${sessionId}`);
    }
    const nextAsks = [...current.asks, ask];
    const updated = this.repo.update(sessionId, { asks: nextAsks });
    ipcBridge.workflow.sessionChanged.emit({ session_id: sessionId, action: 'update' });
    return updated;
  }

  /**
   * Mark an ask answered and emit `workflow.ask_answered` telemetry with the
   * time-to-answer measurement.
   */
  async answerAsk(sessionId: string, askId: string, answer: string): Promise<WorkflowSession> {
    const current = this.repo.findById(sessionId);
    if (current === null) {
      throw new Error(`WorkflowSessionService.answerAsk: unknown session ${sessionId}`);
    }
    const askIdx = current.asks.findIndex((a) => a.id === askId);
    if (askIdx < 0) {
      throw new Error(`WorkflowSessionService.answerAsk: ask ${askId} not found in session ${sessionId}`);
    }
    const now = Date.now();
    const updatedAsk: AskRecord = {
      ...current.asks[askIdx],
      answer,
      answered_at: now,
    };
    const nextAsks = current.asks.map((a, i) => (i === askIdx ? updatedAsk : a));
    const updated = this.repo.update(sessionId, { asks: nextAsks });

    await this.telemetry.record({
      eventType: 'workflow.ask_answered',
      metadata: {
        session_id: sessionId,
        workflow_name: current.workflow_name,
        ask_id: askId,
        ask_type: updatedAsk.type,
        step_n: updatedAsk.step_n,
        time_to_answer_ms: now - updatedAsk.asked_at,
      },
    });

    ipcBridge.workflow.sessionChanged.emit({ session_id: sessionId, action: 'update' });

    return updated;
  }

  /**
   * Flip the session to `complete` and emit `workflow.session_completed`
   * telemetry. `duration_ms` is measured from `created_at` to now.
   */
  async completeSession(sessionId: string): Promise<WorkflowSession> {
    const current = this.repo.findById(sessionId);
    if (current === null) {
      throw new Error(`WorkflowSessionService.completeSession: unknown session ${sessionId}`);
    }
    const completedAt = Date.now();
    const updated = this.repo.update(sessionId, {
      status: 'complete',
      completed_at: completedAt,
    });
    await this.telemetry.record({
      eventType: 'workflow.session_completed',
      metadata: {
        session_id: sessionId,
        workflow_name: current.workflow_name,
        duration_ms: completedAt - current.created_at,
        total_steps: current.total_steps,
      },
    });
    ipcBridge.workflow.sessionChanged.emit({ session_id: sessionId, action: 'complete' });
    return updated;
  }

  /**
   * Flip the session to `ended` - a user-driven termination distinct from a
   * natural completion. No completion telemetry is emitted here; the
   * `ended` state itself is the audit trail.
   */
  async endSession(sessionId: string): Promise<WorkflowSession> {
    const current = this.repo.findById(sessionId);
    if (current === null) {
      throw new Error(`WorkflowSessionService.endSession: unknown session ${sessionId}`);
    }
    const updated = this.repo.update(sessionId, { status: 'ended' });
    ipcBridge.workflow.sessionChanged.emit({ session_id: sessionId, action: 'complete' });
    return updated;
  }

  /**
   * Permanently remove a session and its row - distinct from `endSession`,
   * which only flips status to `ended`. Lets the user clear a stuck or unwanted
   * in-flight workflow. Idempotent: deleting an already-gone session is a no-op.
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.repo.delete(sessionId);
    ipcBridge.workflow.sessionChanged.emit({ session_id: sessionId, action: 'delete' });
  }

  /**
   * Mark that the hidden "begin" message has been sent for this session.
   * Idempotent - subsequent calls are no-ops because the field is already
   * set. Used by WorkflowSurface's auto-send guard to guarantee
   * exactly-once begin semantics across mount/unmount and refresh.
   *
   * The optional `at` parameter is the renderer's proposed timestamp. The
   * service uses it (rather than its own `Date.now()`) so the renderer can
   * verify whether its specific call won the race by comparing the returned
   * `begin_sent_at` against the value it passed in. Without this round-trip
   * the cross-mount race produces duplicate "begin" sends in the chat tape.
   */
  async markBeginSent(sessionId: string, at?: number): Promise<WorkflowSession> {
    const current = this.repo.findById(sessionId);
    if (current === null) {
      throw new Error(`WorkflowSessionService.markBeginSent: unknown session ${sessionId}`);
    }
    if (current.begin_sent_at !== null) {
      return current;
    }
    const updated = this.repo.update(sessionId, { begin_sent_at: at ?? Date.now() });
    ipcBridge.workflow.sessionChanged.emit({ session_id: sessionId, action: 'update' });
    return updated;
  }

  /**
   * Mark step N's `autonomous_run` as `running` and stamp the dispatch id.
   * Called by `dispatchAutonomousStep` after the child conversation has been
   * created - the rail consumes this through the next `findById` poll. See
   * SPEC §11 (run-autonomously dispatch).
   *
   * Note: this only writes the `autonomous_run` field on the target step.
   * The accompanying `status='now'` transition is applied separately via
   * `applyStepTransition({ source: 'worker', dispatch_id })` so the
   * monotonic rules in §11.1 still gate the status flip.
   */
  async recordAutonomousDispatch(sessionId: string, stepN: number, dispatchId: string): Promise<WorkflowSession> {
    const current = this.repo.findById(sessionId);
    if (current === null) {
      throw new Error(`WorkflowSessionService.recordAutonomousDispatch: unknown session ${sessionId}`);
    }
    const idx = current.steps.findIndex((s) => s.n === stepN);
    if (idx < 0) {
      throw new Error(
        `WorkflowSessionService.recordAutonomousDispatch: step ${stepN} not found in session ${sessionId}`
      );
    }
    const startedAt = Date.now();
    const updatedStep: StepState = {
      ...current.steps[idx],
      autonomous_run: {
        dispatch_id: dispatchId,
        started_at: startedAt,
        state: 'running',
      },
    };
    const newSteps = current.steps.map((s, i) => (i === idx ? updatedStep : s));
    const updated = this.repo.update(sessionId, { steps: newSteps });
    ipcBridge.workflow.sessionChanged.emit({ session_id: sessionId, action: 'update' });
    return updated;
  }

  /**
   * Mark step N's `autonomous_run` as `done` or `failed` once the child
   * conversation reports completion. The accompanying `status='done'`
   * monotonic transition is applied by the caller (the completion listener)
   * through `applyStepTransition` so the §11.1 rules still gate the flip.
   * See SPEC §11 (run-autonomously dispatch).
   */
  async recordAutonomousCompletion(sessionId: string, stepN: number, success: boolean): Promise<WorkflowSession> {
    const current = this.repo.findById(sessionId);
    if (current === null) {
      throw new Error(`WorkflowSessionService.recordAutonomousCompletion: unknown session ${sessionId}`);
    }
    const idx = current.steps.findIndex((s) => s.n === stepN);
    if (idx < 0) {
      throw new Error(
        `WorkflowSessionService.recordAutonomousCompletion: step ${stepN} not found in session ${sessionId}`
      );
    }
    const existing = current.steps[idx].autonomous_run;
    if (existing === null) {
      // Nothing to update - the renderer never saw a dispatch for this step.
      // Soft no-op rather than throw so a stale turnCompleted event from an
      // unrelated child conversation can never break the parent session.
      return current;
    }
    const updatedStep: StepState = {
      ...current.steps[idx],
      autonomous_run: {
        ...existing,
        state: success ? 'done' : 'failed',
      },
    };
    const newSteps = current.steps.map((s, i) => (i === idx ? updatedStep : s));
    const updated = this.repo.update(sessionId, { steps: newSteps });
    ipcBridge.workflow.sessionChanged.emit({ session_id: sessionId, action: 'update' });
    return updated;
  }

  /**
   * Count of currently-active (non-complete, non-ended) workflow sessions.
   * Backs the sidebar Workflows-section badge. Delegates to the repository's
   * lightweight `SELECT COUNT(*)` path - does not materialize rows.
   */
  async countActive(): Promise<number> {
    return this.repo.countActive();
  }
}
