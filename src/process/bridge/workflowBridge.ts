/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Workflow launch surface IPC bridge. All six provider handlers route
 * renderer calls into {@link WorkflowSessionService}; `dispatchAutonomousStep`
 * additionally needs the conversation service + worker task manager + a
 * telemetry logger to spawn a child conversation per SPEC §11. See SPEC §6 in
 * `.planning/brainstorm/2026-05-25-workflow-launch-surface/SPEC.md`.
 *
 * Two-step boot to mirror the usage bridge (cross-audit Gemini-HIGH race):
 *  - `registerWorkflowBridge()` is called eagerly at module load so the
 *    renderer-side adapter routing resolves on cold start.
 *  - `initWorkflowBridge(svc, deps?)` is called once the SQLite-backed
 *    dependencies have resolved - it swaps the live `WorkflowSessionService`
 *    plus the optional dispatch deps into the closure. Calls that arrive
 *    before the service lands fail loudly with "not yet wired" so we never
 *    silently swallow a workflow mutation.
 */

import type { StepStatus, WorkflowSession } from '@/common/types/workflowTypes';
import type { WorkflowUpdateSessionStatePatch } from '@/common/adapter/ipcBridge';
import { ipcBridge } from '@/common';
import type { WorkflowSessionService } from '@process/services/workflow/WorkflowSessionService';
import type { TProviderWithModel } from '@/common/config/storage';
import type { IConversationService } from '@process/services/IConversationService';
import type { IWorkerTaskManager } from '@process/task/IWorkerTaskManager';
import type { UsageEventLogger } from '@process/services/usage/UsageEventLogger';
import { dispatchAutonomousStep } from '@process/services/workflow/dispatchAutonomousStep';

export type WorkflowDispatchDeps = {
  conversationService: IConversationService;
  workerTaskManager: IWorkerTaskManager;
  telemetry: UsageEventLogger;
  getDefaultModel: () => TProviderWithModel | Promise<TProviderWithModel>;
};

let registered = false;
let liveService: WorkflowSessionService | null = null;
let liveDispatchDeps: WorkflowDispatchDeps | null = null;

function requireService(endpoint: string): WorkflowSessionService {
  if (liveService === null) {
    throw new Error(
      `workflow.${endpoint}: WorkflowSessionService not yet wired - initWorkflowBridge must run before any renderer call.`
    );
  }
  return liveService;
}

/**
 * Dispatch a {@link WorkflowUpdateSessionStatePatch} to the right service
 * method. The IPC patch shape lives in `ipcBridge.ts` (SPEC §6.4); the
 * dispatcher fans the union out into discrete service calls. Renderer-driven
 * patches always carry `source = 'user'` and no dispatch id - worker-driven
 * transitions land via the W5 `dispatchAutonomousStep` path instead.
 */
async function applyPatch(
  service: WorkflowSessionService,
  sessionId: string,
  patch: WorkflowUpdateSessionStatePatch
): Promise<WorkflowSession> {
  if (patch.setStepStatus) {
    const completedAt = patch.setStepStatus.completed_at ?? Date.now();
    return service.applyStepTransition(sessionId, {
      step_n: patch.setStepStatus.n,
      status: patch.setStepStatus.status as StepStatus,
      source: 'user',
      dispatch_id: null,
      timestamp: completedAt,
    });
  }
  if (patch.appendAsk) {
    return service.appendAsk(sessionId, patch.appendAsk);
  }
  if (patch.answerAsk) {
    return service.answerAsk(sessionId, patch.answerAsk.askId, patch.answerAsk.answer);
  }
  if (patch.setSessionStatus === 'complete') {
    return service.completeSession(sessionId);
  }
  if (patch.setSessionStatus === 'ended') {
    return service.endSession(sessionId);
  }
  if (patch.setBeginSent !== undefined) {
    // Forward the renderer's proposed timestamp so the round-trip lets the
    // renderer detect whether its call won the cross-mount race (otherwise
    // duplicate begin sends slip through and the agent sees two kickoffs).
    return service.markBeginSent(sessionId, patch.setBeginSent);
  }
  // `setCurrentStep`, `setSessionStatus = 'active' | 'errored'`,
  // `recordAutonomousDispatch`, and `recordAutonomousResult` are reserved
  // for W5 (FleetDispatcher hand-off). Reject loudly so a renderer that
  // ships ahead of the backend never silently no-ops.
  throw new Error('workflow.updateSessionState: empty or unsupported patch');
}

/**
 * Register the renderer-facing IPC providers for the workflow namespace.
 * Idempotent - safe to call more than once. Each provider closes over the
 * module-scope `liveService` so {@link initWorkflowBridge} can land the
 * real service after eager registration without re-registering channels.
 */
export function registerWorkflowBridge(): void {
  if (registered) return;
  registered = true;

  ipcBridge.workflow.start.provider(async (input) => {
    const svc = requireService('start');
    return svc.start(input);
  });

  ipcBridge.workflow.resolveSkills.provider(async (input) => {
    const svc = requireService('resolveSkills');
    return svc.resolveSkills(input.slugs);
  });

  ipcBridge.workflow.findActive.provider(async (input) => {
    const svc = requireService('findActive');
    const session = await svc.findActive(input.workflow_name);
    return { session };
  });

  ipcBridge.workflow.findAllActive.provider(async (input) => {
    const svc = requireService('findAllActive');
    const sessions = await svc.findAllActive(input?.limit);
    return { sessions };
  });

  ipcBridge.workflow.countActive.provider(async () => {
    const svc = requireService('countActive');
    return svc.countActive();
  });

  ipcBridge.workflow.updateSessionState.provider(async (input) => {
    const svc = requireService('updateSessionState');
    const session = await applyPatch(svc, input.sessionId, input.patch);
    return { session };
  });

  ipcBridge.workflow.deleteSession.provider(async (input) => {
    const svc = requireService('deleteSession');
    await svc.deleteSession(input.sessionId);
  });

  ipcBridge.workflow.dispatchAutonomousStep.provider(async (input) => {
    const svc = requireService('dispatchAutonomousStep');
    if (liveDispatchDeps === null) {
      throw new Error(
        'workflow.dispatchAutonomousStep: dispatch deps not yet wired - initWorkflowBridge(service, deps) must run before any renderer call.'
      );
    }
    const result = await dispatchAutonomousStep(
      { parentSessionId: input.sessionId, stepN: input.stepN },
      {
        workflowSessionService: svc,
        conversationService: liveDispatchDeps.conversationService,
        workerTaskManager: liveDispatchDeps.workerTaskManager,
        telemetry: liveDispatchDeps.telemetry,
        getDefaultModel: liveDispatchDeps.getDefaultModel,
      }
    );
    return { dispatchId: result.dispatchId };
  });
}

/**
 * Inject the live {@link WorkflowSessionService} plus the dispatch deps the
 * autonomous-step path needs (conversation service + worker task manager +
 * telemetry logger). Must be called once the SQLite driver, skill library,
 * telemetry logger, conversation service, and default-model provider have
 * all resolved. Subsequent calls replace the service in place - useful for
 * tests and hot-reload, harmless in prod.
 *
 * `deps` is optional so existing routing tests that only exercise the five
 * non-dispatch handlers can pass `(service)` alone. Real production callers
 * (initBridge) always pass the full triple.
 *
 * Also calls `registerWorkflowBridge` so callers can wire the service
 * without remembering the two-step dance.
 */
export function initWorkflowBridge(service: WorkflowSessionService, deps?: WorkflowDispatchDeps): void {
  liveService = service;
  if (deps !== undefined) {
    liveDispatchDeps = deps;
  }
  registerWorkflowBridge();
}

/**
 * Test-only reset hook so the routing tests can re-register providers per
 * spec and inspect the captured callbacks. Not used in production paths.
 */
export function __resetWorkflowBridgeForTests(): void {
  registered = false;
  liveService = null;
  liveDispatchDeps = null;
}
