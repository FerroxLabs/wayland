/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #723 in-place per-step context reset - unit tests for the extracted
 * reset-aware advance HAND (`sendWorkflowAdvanceDirective`).
 *
 * These prove, without spawning a process, the three-part acceptance:
 *  - step-N model input is bounded (a wcore advance RESPAWNS the backend
 *    session with `skipCache: true` and a carry-forward-bounded seed), AND
 *  - the visible transcript is intact (the directive is sent `hidden: true`
 *    and the reset path never mutates the message store), AND
 *  - dependent steps still work (the bound is threaded so the fresh session
 *    is seeded with the immediately-prior deliverable).
 *
 * The scope gate (wcore-only) and the safe fallback on a type-lookup failure
 * are proven here too - a launch failure must never break the parent chat.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  sendWorkflowAdvanceDirective,
  WORKFLOW_RESET_SEED_BOUND,
  type WorkflowAdvanceResetDeps,
} from '@process/services/workflow/workflowAdvanceReset';

/**
 * A fake `getOrBuildTask` returning a task whose `sendMessage` is a spy, plus a
 * standalone message-store surface (`deleteMessage`/`updateMessage`) that the
 * reset must NEVER touch - the automated proxy for "visible transcript intact".
 */
function makeDeps(conversationType: string | null | (() => never)) {
  const sendMessage = vi.fn().mockResolvedValue(undefined);
  const getOrBuildTask = vi.fn().mockResolvedValue({ sendMessage });
  const getConversationType = vi.fn().mockImplementation(async () => {
    if (typeof conversationType === 'function') return conversationType();
    return conversationType;
  });
  // A message-mutation surface the module is NOT given and must never reach for.
  const deleteMessage = vi.fn();
  const updateMessage = vi.fn();
  const deps: WorkflowAdvanceResetDeps = { getOrBuildTask, getConversationType };
  return { deps, getOrBuildTask, getConversationType, sendMessage, deleteMessage, updateMessage };
}

describe('sendWorkflowAdvanceDirective (#723 per-step reset)', () => {
  it('1. wcore advance respawns with the carry-forward bound (skipCache + seed, yoloMode preserved)', async () => {
    const { deps, getOrBuildTask } = makeDeps('wcore');

    await sendWorkflowAdvanceDirective('conv-1', 'Proceed to step 2: Draft', deps);

    expect(getOrBuildTask).toHaveBeenCalledTimes(1);
    expect(getOrBuildTask).toHaveBeenCalledWith('conv-1', {
      yoloMode: true,
      skipCache: true,
      workflowResetSeed: WORKFLOW_RESET_SEED_BOUND,
    });
  });

  it('2. the directive is still sent hidden (control prompt never enters the visible transcript)', async () => {
    const { deps, sendMessage } = makeDeps('wcore');

    await sendWorkflowAdvanceDirective('conv-1', 'Proceed to step 2: Draft', deps);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Proceed to step 2: Draft',
        input: 'Proceed to step 2: Draft',
        hidden: true,
      })
    );
    // The synthetic advance id is namespaced to the conversation.
    const arg = sendMessage.mock.calls[0][0];
    expect(String(arg.msg_id)).toContain('workflow-advance-conv-1-');
  });

  it('3. scope gate: a non-wcore (ACP) advance keeps today’s exact behavior - no skipCache, no seed', async () => {
    const { deps, getOrBuildTask, sendMessage } = makeDeps('acp');

    await sendWorkflowAdvanceDirective('conv-acp', 'Proceed to step 2: Draft', deps);

    expect(getOrBuildTask).toHaveBeenCalledTimes(1);
    expect(getOrBuildTask).toHaveBeenCalledWith('conv-acp', { yoloMode: true });
    const opts = getOrBuildTask.mock.calls[0][1];
    expect(opts).not.toHaveProperty('skipCache');
    expect(opts).not.toHaveProperty('workflowResetSeed');
    // Directive still sent hidden on the ACP path.
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ hidden: true }));
  });

  it('4. visible transcript untouched: no message-store mutation on either branch', async () => {
    for (const type of ['wcore', 'acp'] as const) {
      const { deps, deleteMessage, updateMessage } = makeDeps(type);
      await sendWorkflowAdvanceDirective('conv-x', 'Proceed to step 2', deps);
      // The reset only respawns + seeds + sends hidden; it never deletes or
      // rewrites a persisted message row.
      expect(deleteMessage).not.toHaveBeenCalled();
      expect(updateMessage).not.toHaveBeenCalled();
      // The module is not even GIVEN a message-mutation surface.
      expect(deps).not.toHaveProperty('deleteMessage');
      expect(deps).not.toHaveProperty('updateMessage');
    }
  });

  it('5. type-lookup failure is safe: falls back to the non-reset send, never crashes the advance', async () => {
    const throwing = makeDeps(() => {
      throw new Error('conversation lookup exploded');
    });
    await expect(
      sendWorkflowAdvanceDirective('conv-1', 'Proceed to step 2', throwing.deps)
    ).resolves.toBeUndefined();
    // On a lookup failure we take the safe (non-reset) path, not the respawn.
    expect(throwing.getOrBuildTask).toHaveBeenCalledWith('conv-1', { yoloMode: true });
    expect(throwing.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ hidden: true }));

    // A null type (no such conversation / unknown) is treated the same way.
    const nul = makeDeps(null);
    await sendWorkflowAdvanceDirective('conv-2', 'Proceed to step 2', nul.deps);
    expect(nul.getOrBuildTask).toHaveBeenCalledWith('conv-2', { yoloMode: true });
  });
});
