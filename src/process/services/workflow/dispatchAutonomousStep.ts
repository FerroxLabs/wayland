/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * `dispatchAutonomousStep` - v1 implementation of the Run-autonomously path
 * described in SPEC §11. The original spec assumed a `FleetDispatcher`
 * primitive from `wcore` (the Rust engine); that primitive is NOT available
 * in the app's TypeScript layer. The pragmatic v1 here spawns a CHILD
 * conversation scoped to a single step and sends it a focused directive.
 *
 * Flow:
 *   1. Load the parent {@link WorkflowSession}; fail loudly if missing.
 *   2. Resolve the target step's body/title; fail if step N is out of range.
 *   3. Create a child {@link TChatConversation} via the
 *      {@link IConversationService}. The child reuses the parent's agent
 *      type + model so the same backend is on the other end. Its `extra.
 *      autonomousDispatch` field carries `{parentWorkflowSessionId, stepN,
 *      dispatchId}` - the completion listener (wired in `initBridge`) reads
 *      this back when `conversation.turnCompleted` fires on the child.
 *   4. Send a focused directive to the child as its first message via
 *      {@link IWorkerTaskManager.getOrBuildTask} + `task.sendMessage`. This
 *      mirrors `conversationBridge.sendMessage.provider` but skips the IPC
 *      hop since we're already in the main process.
 *   5. Mark the parent step's `autonomous_run` as `running` and apply a
 *      `source='worker'` step transition flipping the step to `now`. The
 *      monotonic rules in §11.1 still gate the flip; the rail polls the
 *      session through `findById` and renders the running indicator.
 *   6. Emit `workflow.autonomous_step_dispatched` telemetry.
 *
 * Loop-back to `done`: the completion listener in `initBridge.ts` calls
 * `recordAutonomousCompletion` + `applyStepTransition({status:'done',
 * source:'worker', dispatch_id})` when the child's first turn finishes.
 */

import { randomUUID } from 'crypto';
import type { TProviderWithModel } from '@/common/config/storage';
import type { AgentBackend } from '@/common/types/acpTypes';
import type { CreateConversationParams, IConversationService } from '../IConversationService';
import type { UsageEventLogger } from '../usage/UsageEventLogger';
import type { IWorkerTaskManager } from '@process/task/IWorkerTaskManager';
import type { WorkflowSessionService } from './WorkflowSessionService';

export type AutonomousDispatchParams = {
  parentSessionId: string;
  stepN: number;
};

export type AutonomousDispatchResult = {
  dispatchId: string; // child conversation id
  childConversationId: string;
};

export type AutonomousDispatchDeps = {
  workflowSessionService: WorkflowSessionService;
  conversationService: IConversationService;
  workerTaskManager: IWorkerTaskManager;
  telemetry: UsageEventLogger;
  /**
   * Resolver for the model the child conversation should run on. We can't
   * read `parent.model` directly because most conversation backends
   * (`acp`, `codex`, `openclaw-gateway`, `nanobot`, `remote`, `wcore`) Omit
   * `model` from `TChatConversation` - the model lives in backend-specific
   * extras instead (e.g. `currentModelId`). The cleanest v1 reuse: the
   * caller supplies the same default-model resolver the workflow service
   * uses at `start()` time, so a child runs on the same logical default.
   */
  getDefaultModel: () => TProviderWithModel | Promise<TProviderWithModel>;
};

/**
 * Compose the focused directive the child agent receives as its first
 * message. Tight + actionable - the autonomous worker should know exactly
 * which step it's executing and that it must produce a Markdown deliverable.
 */
function composeDirective(stepN: number, title: string, bodyExcerpt: string): string {
  const trimmedExcerpt = bodyExcerpt.trim();
  const excerptBlock = trimmedExcerpt.length > 0 ? `\n\n${trimmedExcerpt}` : '';
  return [
    `You are an autonomous worker spawned to execute ONLY step ${stepN} of a workflow.`,
    '',
    `Step ${stepN}: ${title}${excerptBlock}`,
    '',
    'Produce concrete deliverables. Use whatever tools you need.',
    'When finished, report your output as Markdown - no preamble, no meta-commentary.',
  ].join('\n');
}

export async function dispatchAutonomousStep(
  params: AutonomousDispatchParams,
  deps: AutonomousDispatchDeps
): Promise<AutonomousDispatchResult> {
  const { parentSessionId, stepN } = params;
  const {
    workflowSessionService,
    conversationService,
    workerTaskManager,
    telemetry,
    getDefaultModel,
  } = deps;

  // 1. Load parent session.
  const parent = await workflowSessionService.findById(parentSessionId);
  if (parent === null) {
    throw new Error(`dispatchAutonomousStep: unknown parent session ${parentSessionId}`);
  }

  // 2. Resolve target step.
  const step = parent.steps.find((s) => s.n === stepN);
  if (step === undefined) {
    throw new Error(
      `dispatchAutonomousStep: step ${stepN} not found in session ${parentSessionId}`
    );
  }

  // 2b. Double-dispatch guard (W2). A step that already has a running worker, or
  //     that is already terminal, must not spawn a second child conversation.
  //     The rail hides the Run button while a step is running, but a rapid
  //     double-invoke, React double-render, or an auto-advance landing step N+1
  //     under the cursor can still race two dispatches onto one step - one intent
  //     must equal exactly one worker.
  if (step.autonomous_run?.state === 'running') {
    throw new Error(
      `dispatchAutonomousStep: step ${stepN} in session ${parentSessionId} already has a running autonomous worker`
    );
  }
  if (step.status === 'done') {
    throw new Error(
      `dispatchAutonomousStep: step ${stepN} in session ${parentSessionId} is already done`
    );
  }

  // 3. Reuse the parent conversation's backend type so the child runs on
  //    the same agent surface the user is chatting with. The model field
  //    is Omitted on most non-Gemini backends (it lives in extras instead),
  //    so we ask the caller's `getDefaultModel` for a fresh resolution -
  //    same source `WorkflowSessionService.start()` uses.
  const parentConv = await conversationService.getConversation(parent.conversation_id);
  if (parentConv === undefined) {
    throw new Error(
      `dispatchAutonomousStep: parent conversation ${parent.conversation_id} not found`
    );
  }
  const childType = parentConv.type as CreateConversationParams['type'];
  const childModel = await getDefaultModel();

  // The model lives in backend-specific extras, but the worker selects which
  // CLI to spawn from `extra.backend` (+ cliPath/agentName/sessionMode). If the
  // child doesn't inherit these, its ACP session starts with
  // `backend: undefined` and fails to connect ("Starting session with backend
  // undefined") - the step never runs. Carry the parent's backend identity
  // through. (FINDING-2.)
  const parentExtra = (parentConv.extra ?? {}) as Record<string, unknown>;
  const inheritedBackend =
    typeof parentExtra.backend === 'string' ? (parentExtra.backend as AgentBackend) : undefined;
  const inheritedCliPath = typeof parentExtra.cliPath === 'string' ? parentExtra.cliPath : undefined;
  const inheritedAgentName =
    typeof parentExtra.agentName === 'string' ? parentExtra.agentName : undefined;
  const inheritedSessionMode =
    typeof parentExtra.sessionMode === 'string' ? parentExtra.sessionMode : undefined;

  const dispatchId = randomUUID();
  const childName = `${parent.workflow_title} - Step ${stepN}`;

  // 4. Create the child conversation. Carries the back-pointer the
  //    completion listener consumes (initBridge wires the listener).
  const childParams: CreateConversationParams = {
    type: childType,
    name: childName,
    model: childModel,
    source: 'wayland',
    extra: {
      workspace: '',
      backend: inheritedBackend,
      cliPath: inheritedCliPath,
      agentName: inheritedAgentName,
      sessionMode: inheritedSessionMode,
      autonomousDispatch: {
        parentWorkflowSessionId: parentSessionId,
        stepN,
        dispatchId,
      },
    },
  };

  const child = await conversationService.createConversation(childParams);
  const childConversationId = child.id;

  // 5. Mark the parent step `running` BEFORE the (turn-blocking) send.
  //    `AcpAgentManager.sendMessage` awaits the ENTIRE agent turn, not just the
  //    send. If we recorded `running` afterwards (the original order):
  //      (a) the rail never shows the running indicator during execution - the
  //          step sits visibly `todo` for minutes, then jumps to done; and
  //      (b) a worker that hangs mid-turn leaves the step `todo` with
  //          `autonomous_run = null` - INVISIBLE to the 30-min stalled-step
  //          watchdog (it only sweeps `running` steps), i.e. a permanently
  //          stuck step that nothing recovers.
  //    Recording `running` up-front fixes both and removes the running-vs-done
  //    write race with the completion listener. (FINDING-2b.)
  await workflowSessionService.recordAutonomousDispatch(parentSessionId, stepN, dispatchId);
  await workflowSessionService.applyStepTransition(parentSessionId, {
    step_n: stepN,
    status: 'now',
    source: 'worker',
    dispatch_id: dispatchId,
    timestamp: Date.now(),
  });

  // 6. Build the agent for the child and send the focused directive as the
  //    first message. The same path conversationBridge.sendMessage uses,
  //    just without the IPC hop. On a send failure, fail the step fast
  //    (errored) instead of leaving it `running` for the watchdog to sweep
  //    30 min later.
  const directive = composeDirective(stepN, step.title, step.body_excerpt);
  const task = await workerTaskManager.getOrBuildTask(childConversationId);
  try {
    await task.sendMessage({
      input: directive,
      msg_id: randomUUID(),
      conversation_id: childConversationId,
      content: directive,
      files: [],
      agentContent: directive,
    });
  } catch (err) {
    await workflowSessionService.recordAutonomousCompletion(parentSessionId, stepN, false);
    await workflowSessionService.applyStepTransition(parentSessionId, {
      step_n: stepN,
      status: 'errored',
      source: 'worker',
      dispatch_id: dispatchId,
      timestamp: Date.now(),
    });
    throw err;
  }

  // 7. Telemetry.
  await telemetry.record({
    eventType: 'workflow.autonomous_step_dispatched',
    metadata: {
      session_id: parentSessionId,
      workflow_name: parent.workflow_name,
      step_n: stepN,
      dispatch_id: dispatchId,
      child_conversation_id: childConversationId,
    },
  });

  return { dispatchId, childConversationId };
}
