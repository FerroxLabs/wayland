/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #723 workflow advance - unit tests for the extracted advance HAND
 * (`sendWorkflowAdvanceDirective`).
 *
 * These prove, without spawning a process, that the visible transcript is
 * intact (the directive is sent `hidden: true` and the send path never mutates
 * the message store) and that advances on one conversation never interleave.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  sendWorkflowAdvanceDirective,
  type WorkflowAdvanceResetDeps,
} from '@process/services/workflow/workflowAdvanceReset';

/**
 * A fake `getOrBuildTask` returning a task whose `sendMessage` is a spy, plus a
 * standalone message-store surface (`deleteMessage`/`updateMessage`) that the
 * reset must NEVER touch - the automated proxy for "visible transcript intact".
 */
function makeDeps() {
  const sendMessage = vi.fn().mockResolvedValue(undefined);
  const getOrBuildTask = vi.fn().mockResolvedValue({ sendMessage });
  // A message-mutation surface the module is NOT given and must never reach for.
  const deleteMessage = vi.fn();
  const updateMessage = vi.fn();
  const deps: WorkflowAdvanceResetDeps = { getOrBuildTask };
  return { deps, getOrBuildTask, sendMessage, deleteMessage, updateMessage };
}

describe('sendWorkflowAdvanceDirective (#723 workflow advance)', () => {
  it('2. the directive is still sent hidden (control prompt never enters the visible transcript)', async () => {
    const { deps, sendMessage } = makeDeps();

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

  it('3. builds the live task in yolo mode without respawning it', async () => {
    const { deps, getOrBuildTask, sendMessage } = makeDeps();

    await sendWorkflowAdvanceDirective('conv-acp', 'Proceed to step 2: Draft', deps);

    expect(getOrBuildTask).toHaveBeenCalledTimes(1);
    expect(getOrBuildTask).toHaveBeenCalledWith('conv-acp', { yoloMode: true });
    const opts = getOrBuildTask.mock.calls[0][1];
    expect(opts).not.toHaveProperty('skipCache');
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ hidden: true }));
  });

  it('4. serializes concurrent advances on the same conversation (sends cannot race)', async () => {
    const order: string[] = [];
    let spawnCount = 0;
    let sendCount = 0;
    let releaseFirstSend!: () => void;
    const firstSendGate = new Promise<void>((resolve) => {
      releaseFirstSend = resolve;
    });
    const sendMessage = vi.fn().mockImplementation(async () => {
      const n = ++sendCount;
      order.push(`send${n}-start`);
      if (n === 1) await firstSendGate; // hold the first send open
      order.push(`send${n}-end`);
    });
    const getOrBuildTask = vi.fn().mockImplementation(async () => {
      order.push(`spawn${++spawnCount}`);
      return { sendMessage };
    });
    const deps: WorkflowAdvanceResetDeps = { getOrBuildTask };

    const p1 = sendWorkflowAdvanceDirective('conv-1', 'step 2', deps);
    const p2 = sendWorkflowAdvanceDirective('conv-1', 'step 3', deps);
    // Flush the event loop: the second advance must NOT have respawned yet - the
    // first send is still holding the (single-conversation) chain open.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(spawnCount).toBe(1);
    expect(order).toEqual(['spawn1', 'send1-start']);
    releaseFirstSend();
    await Promise.all([p1, p2]);

    // The second respawn happened strictly AFTER the first send completed - the
    // sends never interleaved.
    expect(order.indexOf('spawn2')).toBeGreaterThan(order.indexOf('send1-end'));
    expect(order).toEqual(['spawn1', 'send1-start', 'send1-end', 'spawn2', 'send2-start', 'send2-end']);
  });

  it('4b. different conversations are not serialized against each other', async () => {
    // A slow reset on conv-A must not block an advance on conv-B (independent chains).
    let releaseA!: () => void;
    const aGate = new Promise<void>((r) => {
      releaseA = r;
    });
    const makeGated = (gate: Promise<void> | null) => {
      const sendMessage = vi.fn().mockImplementation(async () => {
        if (gate) await gate;
      });
      const getOrBuildTask = vi.fn().mockResolvedValue({ sendMessage });
      return { deps: { getOrBuildTask } as WorkflowAdvanceResetDeps, sendMessage };
    };
    const a = makeGated(aGate);
    const b = makeGated(null);

    const pa = sendWorkflowAdvanceDirective('conv-A', 'step 2', a.deps);
    const pb = sendWorkflowAdvanceDirective('conv-B', 'step 2', b.deps);
    // conv-B completes while conv-A is still gated.
    await expect(pb).resolves.toBeUndefined();
    expect(b.sendMessage).toHaveBeenCalledTimes(1);
    releaseA();
    await pa;
  });
});
