/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #723 - in-place per-step context reset for in-conversation workflows.
 *
 * An in-conversation multi-step workflow sends each next-step directive into
 * the SAME live backend agent session, which replays turns 1..N-1 to the model
 * on step N. Per-step model input grows O(N); the run costs O(N^2) input tokens
 * (a money bug on the default wcore/Flux path).
 *
 * This HAND performs a HARD per-step reset (NOT a rolling summary, NOT
 * compaction): on a wcore advance it RESPAWNS the backend session
 * (`skipCache: true`, which kills the old engine process and drops the
 * accumulated 1..N-1 context) and re-seeds the fresh session with ONLY the
 * immediately-prior deliverable (`workflowResetSeed`), then sends the directive
 * `hidden: true` exactly as before. Per-step input becomes O(1); the run O(N).
 *
 * The user-visible SQLite transcript is UNTOUCHED: the directive is sent hidden
 * so the control prompt never enters the chat tape, and the reset path only
 * READS the message store (to seed the fresh session) - it never writes or
 * deletes a row. Model input (backend session) and the visible transcript are
 * separate stores.
 *
 * Scope gate (v1): the reset fires ONLY when the conversation's agent type is
 * `wcore` (the money-critical default). Every other type (ACP: codex/claude/
 * qwen) keeps today's exact send path - a wcore DB-seed bound does not apply to
 * a CLI's own session reload; ACP is a tracked follow-on. A type-lookup failure
 * is treated as non-wcore so a launch hiccup can never break the parent chat.
 *
 * This module has NO import of `initBridge` so it is unit-provable in isolation
 * via an injected dependency bag (`getOrBuildTask`, `getConversationType`).
 */

import type { BuildConversationOptions } from '@process/task/agentTypes';
import type { ResumeSeedOptions } from '@process/task/resumeSeed';

/**
 * The carry-forward bound for a per-step reset seed. `priorTurnOnly` carries the
 * WHOLE immediately-prior assistant turn - its text AND tool calls / tool
 * results - back to (not across) the previous `right` boundary, so a dependent
 * step that says "review the file you just wrote" gets the tool/file context and
 * a tool-only prior step is not skipped into an older step. `priorTurnMaxChars`
 * holds one full long deliverable (e.g. a multi-hundred-word draft a later step
 * refines) while staying O(1) per step - it does not grow with the step index -
 * and is isolated from the default `maxChars` so the no-prior-turn FALLBACK uses
 * the standard budget. Starting value (research Open-Q1); tunable in the live
 * sweep - a deliverable longer than this loses its TAIL (head-clip).
 *
 * INVARIANT (#723 wiring): this exact object is passed as the
 * `workflowResetSeed` field of `BuildConversationOptions` and must survive the
 * chain BuildConversationOptions.workflowResetSeed -> the wcore creator's
 * `WCoreManagerData.workflowResetSeed` -> `WCoreManager.start()` ->
 * `composeResetSeed(msgs, mergedData.workflowResetSeed)`. The field name
 * `workflowResetSeed` is identical at every hop by design; `composeResetSeed` is
 * unit-tested and the live-verify `session_cost`-per-step check is the
 * end-to-end guard on that spawn-only path.
 */
export const WORKFLOW_RESET_SEED_BOUND: ResumeSeedOptions = {
  priorTurnOnly: true,
  priorTurnMaxChars: 16000,
};

/** The minimal task surface the reset HAND drives (a hidden directive send). */
interface AdvanceTask {
  sendMessage(message: {
    content: string;
    input: string;
    msg_id: string;
    hidden: boolean;
  }): Promise<unknown>;
}

/**
 * Injected dependencies. Deliberately narrow: the HAND can respawn+seed a task
 * and resolve a conversation's agent type - it has NO message-mutation surface,
 * which is the structural guarantee that the visible transcript is untouched.
 */
export interface WorkflowAdvanceResetDeps {
  getOrBuildTask(conversationId: string, options: BuildConversationOptions): Promise<AdvanceTask>;
  getConversationType(conversationId: string): Promise<string | null>;
}

/**
 * Per-conversation serialization for the reset-send. The reset is DESTRUCTIVE:
 * `getOrBuildTask({ skipCache: true })` kills the live engine process and
 * respawns it. Two advances racing on the SAME conversation (e.g. the
 * `acceptStep` IPC handler and the parent driver / watchdog) could each respawn
 * and kill the other's fresh session mid-flight -> a stalled or double-run
 * workflow. Chaining each send behind the prior one for that conversation makes
 * the respawns strictly sequential (the latest advance cleanly supersedes),
 * never interleaved. Release-on-dispatch is sufficient: `acceptStep` fires only
 * from a run parked at `awaiting_input` (the StepReviewBeat checkpoint), i.e. the
 * prior turn is already terminal, so there is no in-flight step to kill; and in
 * step mode the driver is parked (not advancing) while awaiting the accept. The
 * chain therefore only needs to prevent two respawns from interleaving, which it
 * does. Different conversations are independent (separate chains). The map entry
 * is dropped once its chain is the tail, so it stays bounded. (A fuller
 * per-step context bound belongs in the Core tail-cap, not a desktop timer.)
 */
const advanceChains = new Map<string, Promise<void>>();

/**
 * Send a workflow-advance directive into a conversation, performing the in-place
 * per-step context reset on wcore conversations. See the module header. Reset
 * sends on the same conversation are serialized (destructive respawn guard).
 */
export function sendWorkflowAdvanceDirective(
  conversationId: string,
  directive: string,
  deps: WorkflowAdvanceResetDeps
): Promise<void> {
  const prior = advanceChains.get(conversationId) ?? Promise.resolve();
  const run = (): Promise<void> => runAdvance(conversationId, directive, deps);
  // Swallow the prior result/rejection so one failed advance cannot poison the
  // next; each send owns its own error surface via the parent driver.
  const next: Promise<void> = prior.then(run, run);
  advanceChains.set(conversationId, next);
  void next
    .catch((): void => undefined)
    .finally(() => {
      if (advanceChains.get(conversationId) === next) advanceChains.delete(conversationId);
    });
  return next;
}

async function runAdvance(
  conversationId: string,
  directive: string,
  deps: WorkflowAdvanceResetDeps
): Promise<void> {
  let conversationType: string | null = null;
  try {
    conversationType = await deps.getConversationType(conversationId);
  } catch {
    // A type-lookup failure must not break the advance: treat as non-wcore and
    // take today's (non-reset) send path rather than crashing the parent chat.
    conversationType = null;
  }

  const options: BuildConversationOptions =
    conversationType === 'wcore'
      ? { yoloMode: true, skipCache: true, workflowResetSeed: WORKFLOW_RESET_SEED_BOUND }
      : { yoloMode: true };

  const task = await deps.getOrBuildTask(conversationId, options);

  await task.sendMessage({
    content: directive,
    input: directive,
    msg_id: `workflow-advance-${conversationId}-${Date.now()}`,
    hidden: true,
  });
}
