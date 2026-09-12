/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #723 - the workflow-advance send for in-conversation workflows.
 *
 * An in-conversation multi-step workflow sends each next-step directive into
 * the SAME live backend agent session. The directive is sent `hidden: true` so
 * the control prompt never enters the chat tape; the user-visible SQLite
 * transcript is UNTOUCHED - this module has no message-mutation surface at all.
 *
 * The per-step hard context reset that once respawned the retired Core engine
 * with a bounded carry-forward seed is gone with that engine; ACP backends own
 * their own session reload.
 *
 * This module has NO import of `initBridge` so it is unit-provable in isolation
 * via an injected dependency bag (`getOrBuildTask`).
 */

import type { BuildConversationOptions } from '@process/task/agentTypes';

/** The minimal task surface the advance drives (a hidden directive send). */
interface AdvanceTask {
  sendMessage(message: { content: string; input: string; msg_id: string; hidden: boolean }): Promise<unknown>;
}

/**
 * Injected dependencies. Deliberately narrow: the HAND can build a task and
 * send into it - it has NO message-mutation surface, which is the structural
 * guarantee that the visible transcript is untouched.
 */
export interface WorkflowAdvanceResetDeps {
  getOrBuildTask(conversationId: string, options: BuildConversationOptions): Promise<AdvanceTask>;
}

/**
 * Per-conversation serialization for the advance send. Two advances racing on
 * the SAME conversation (e.g. the `acceptStep` IPC handler and the parent
 * driver / watchdog) must not interleave; chaining each send behind the prior
 * one for that conversation keeps them strictly sequential. Different
 * conversations are independent (separate chains). The map entry is dropped
 * once its chain is the tail, so it stays bounded.
 */
const advanceChains = new Map<string, Promise<void>>();

/**
 * Send a workflow-advance directive into a conversation. Sends on the same
 * conversation are serialized.
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

async function runAdvance(conversationId: string, directive: string, deps: WorkflowAdvanceResetDeps): Promise<void> {
  const task = await deps.getOrBuildTask(conversationId, { yoloMode: true });

  await task.sendMessage({
    content: directive,
    input: directive,
    msg_id: `workflow-advance-${conversationId}-${Date.now()}`,
    hidden: true,
  });
}
