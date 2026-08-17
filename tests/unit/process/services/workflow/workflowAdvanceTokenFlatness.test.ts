/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #986 (follow-up to #723): per-step model input must stay FLAT as the step
 * count grows.
 *
 * The original bug was invisible - a workflow produced correct output and
 * simply cost a fortune, because each advance was sent into the SAME live
 * backend session, which replayed turns 1..N-1 to the model on step N. Nothing
 * failed and nothing errored; only the bill moved. Behavioural tests stay green
 * through that regression by construction, so this file is a MEASUREMENT gate:
 * it runs a multi-step workflow and asserts the per-step input does not grow
 * with the step index.
 *
 * What "flat" means concretely here. On a wcore advance,
 * `sendWorkflowAdvanceDirective` passes `skipCache: true` (which kills the
 * engine process and drops its accumulated 1..N-1 context) plus
 * `workflowResetSeed: WORKFLOW_RESET_SEED_BOUND`. On respawn,
 * `WCoreManager.start()` reseeds the fresh session with
 * `composeResetSeed(persistedMessages, workflowResetSeed)`, which under
 * `priorTurnOnly` carries ONLY the immediately-prior turn, head-clipped to
 * `priorTurnMaxChars`. So the persisted transcript grows linearly with N while
 * the model's input per step is bounded by a constant. Both reseed branches are
 * O(1) in N; that constant-ness is what is asserted.
 *
 * The engine is faked, but the two things that decide the answer are REAL: the
 * production `sendWorkflowAdvanceDirective` chooses the options, and the
 * production `composeResetSeed` computes the reseed. The fake only models the
 * one engine property that matters - a respawn drops context, a reuse keeps it.
 * Remove the reset from the production ternary and these assertions go red.
 */

import { describe, expect, it } from 'vitest';
import { sendWorkflowAdvanceDirective, type WorkflowAdvanceResetDeps } from '@process/services/workflow/workflowAdvanceReset';
import { composeResetSeed } from '@process/task/resumeSeed';
import type { TMessage } from '@/common/chat/chatLib';

const STEP_COUNT = 6;
/** Realistic per-step deliverable: well under priorTurnMaxChars (16000) so the
 * whole prior turn is carried, and large enough that accumulation is obvious. */
const DELIVERABLE_CHARS = 1500;

/**
 * Input size in tokens. Characters are converted with the standard ~4-chars-per
 * token approximation; the conversion is monotone, so flat characters prove flat
 * tokens and growth in one is growth in the other. A unit test has no real
 * tokenizer, and the property under test is a ratio, not an absolute count.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

let nextId = 0;
const rightMsg = (content: string): TMessage =>
  ({
    id: `m${nextId++}`,
    type: 'text',
    position: 'right',
    conversation_id: 'c1',
    content: { content },
    createdAt: 1,
  }) as TMessage;

const assistantMsg = (content: string): TMessage =>
  ({
    id: `m${nextId++}`,
    type: 'text',
    position: 'left',
    conversation_id: 'c1',
    content: { content },
    createdAt: 1,
  }) as TMessage;

const deliverable = (step: number): string => `Step ${step} deliverable. `.padEnd(DELIVERABLE_CHARS, 'x');

/**
 * Run a `STEP_COUNT`-step in-conversation workflow and return the per-step model
 * input size, in tokens, for steps 2..N (step 1 is the opening turn, not an
 * advance).
 *
 * Two stores are modelled separately because that separation IS the fix: the
 * persisted SQLite transcript (`store`) grows with every step and is never
 * truncated, while the live engine's context (`engineContext`) is what the model
 * is actually billed for.
 */
async function runWorkflow(): Promise<number[]> {
  const store: TMessage[] = [];
  let engineContext: string[] = [];
  const perStepInputTokens: number[] = [];

  // Step 1: the opening user turn and its deliverable, before any advance.
  store.push(rightMsg('Run the 6-step workflow.'));
  engineContext.push('Run the 6-step workflow.');
  store.push(assistantMsg(deliverable(1)));
  engineContext.push(deliverable(1));

  const deps: WorkflowAdvanceResetDeps = {
    getConversationType: async () => 'wcore',
    getOrBuildTask: async (_conversationId, options) => {
      // The one engine property that decides the answer: `skipCache` kills the
      // process, so the fresh session starts from the reseed alone. Without it
      // the live session is reused and keeps everything it has already seen.
      if (options.skipCache) {
        const seed = composeResetSeed(store, options.workflowResetSeed);
        engineContext = seed ? [seed] : [];
      }
      return {
        sendMessage: async (message: { content: string }) => {
          engineContext.push(message.content);
        },
      };
    },
  };

  for (let step = 2; step <= STEP_COUNT; step++) {
    const directive = `Proceed to step ${step}.`;
    // The live path persists the hidden directive BEFORE start() reads history.
    store.push(rightMsg(directive));

    // oxlint-disable-next-line no-await-in-loop -- steps are inherently sequential; step N's input depends on step N-1 having completed
    await sendWorkflowAdvanceDirective('c1', directive, deps);

    // Everything the engine now holds is the model's input for this step.
    perStepInputTokens.push(estimateTokens(engineContext.join('\n')));

    // The model answers; a live session retains its own output, and the
    // transcript persists it.
    engineContext.push(deliverable(step));
    store.push(assistantMsg(deliverable(step)));
  }

  return perStepInputTokens;
}

describe('#986 workflow auto-advance keeps per-step input flat', () => {
  it('does not grow per-step input tokens across the run', async () => {
    const perStep = await runWorkflow();
    expect(perStep).toHaveLength(STEP_COUNT - 1);

    // Compare against step 2, not step 1: step 2 is the first reset step, so it
    // carries no cold-start difference.
    const [baseline] = perStep;
    const last = perStep[perStep.length - 1];

    expect(baseline).toBeGreaterThan(0);
    // Flat, not a multiple of the baseline. A reintroduced 1..N-1 replay makes
    // the last step a multiple of this, not a neighbour of it.
    expect(last).toBeLessThanOrEqual(Math.ceil(baseline * 1.1));

    // And no step in between drifts upward either - growth anywhere in the run
    // is the regression, not just at the tail.
    for (const tokens of perStep) {
      expect(tokens).toBeLessThanOrEqual(Math.ceil(baseline * 1.1));
    }
  });

  it('stays bounded by the carry-forward constant, not by the step count', async () => {
    const perStep = await runWorkflow();

    // The persisted transcript over 6 steps holds ~6 deliverables. If per-step
    // input were proportional to the run, the last step would exceed a single
    // deliverable's worth of tokens by roughly the step count. Bound it to a
    // small multiple of ONE deliverable to catch that directly.
    const oneDeliverable = estimateTokens(deliverable(1));
    expect(perStep[perStep.length - 1]).toBeLessThan(oneDeliverable * 2);
  });

  /**
   * Instrument check: the measurement above must be capable of reporting growth
   * at all. Drive the same harness with an engine that is never respawned (the
   * pre-#723 behaviour) and confirm the numbers climb. Without this, a harness
   * that always reported a constant would pass the flatness assertions for the
   * wrong reason.
   */
  it('the measurement detects accumulation when the session is never reset', async () => {
    const store: TMessage[] = [];
    const engineContext: string[] = [];
    const perStep: number[] = [];

    store.push(rightMsg('Run the 6-step workflow.'));
    engineContext.push('Run the 6-step workflow.');
    store.push(assistantMsg(deliverable(1)));
    engineContext.push(deliverable(1));

    for (let step = 2; step <= STEP_COUNT; step++) {
      const directive = `Proceed to step ${step}.`;
      store.push(rightMsg(directive));
      engineContext.push(directive); // reused session: nothing is ever dropped
      perStep.push(estimateTokens(engineContext.join('\n')));
      engineContext.push(deliverable(step));
      store.push(assistantMsg(deliverable(step)));
    }

    const last = perStep[perStep.length - 1];
    expect(last).toBeGreaterThan(perStep[0] * 2);
  });
});
