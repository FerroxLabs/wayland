/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Module-level singleton accessor for the live `WorkflowSessionService`.
 *
 * The service itself is dependency-injected through `initWorkflowBridge` (see
 * `src/process/utils/initBridge.ts`), but call sites outside the bridge -
 * notably `agentUtils.buildSystemInstructions*` - need a no-arg way to reach
 * it so they can compose the `WORKFLOW_PROTOCOL` system block for any
 * conversation that carries a `workflowSessionId` in its config. Using a
 * lazy singleton keeps the agentUtils module free of construction-order
 * coupling and avoids a heavier DI rewrite.
 *
 * Initialization order: `initBridge.ts` constructs the service inside the
 * usage-bridge `.then` and immediately calls `setWorkflowSessionService`.
 * If a caller hits the getter before that lands, it returns `null` and the
 * caller is expected to soft-fail (the protocol block is best-effort -
 * losing it is non-fatal to the first-message build).
 */

import type { WorkflowSessionService } from './WorkflowSessionService';

let instance: WorkflowSessionService | null = null;

/** Publish the live service instance. Called once from `initBridge.ts`. */
export function setWorkflowSessionService(service: WorkflowSessionService): void {
  instance = service;
}

/**
 * Returns the live service, or `null` when it has not yet been wired (cold
 * start before the usage-bridge `.then` resolves). Callers MUST treat `null`
 * as a soft miss - never throw.
 */
export function getWorkflowSessionService(): WorkflowSessionService | null {
  return instance;
}
