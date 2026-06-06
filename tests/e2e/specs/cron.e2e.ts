/**
 * Cron - bridge-level lifecycle.
 *
 * Sister spec to `cron-crud.e2e.ts` (which drives the full AI conversation
 * flow). This file exercises the cron IPC bridge directly, so we have a fast
 * negative-result harness independent of the LLM:
 *
 *   - one-shot job scheduled ~1s in the future fires and updates state
 *   - cancelled job before its fire time never executes
 *   - two concurrent jobs don't share state (independent runCounts / nextRunAtMs)
 *
 * Direct bridge invocation means the LLM/agent layer never runs - these tests
 * stay green on a clean dev launch with no credentials.
 */
import { test, expect } from '../fixtures';
import { invokeBridge } from '../helpers';

interface ICronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: { kind: 'at' | 'every' | 'cron'; atMs?: number; everyMs?: number; expr?: string; description: string };
  target: { payload: { kind: 'message'; text: string }; executionMode?: 'existing' | 'new_conversation' };
  metadata: { conversationId: string; agentType: string; createdBy: 'user' | 'agent'; createdAt: number; updatedAt: number };
  state: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: 'ok' | 'error' | 'skipped' | 'missed';
    runCount: number;
    retryCount: number;
    maxRetries: number;
  };
}

interface ICreateCronJobParams {
  name: string;
  description?: string;
  schedule: { kind: 'at' | 'every' | 'cron'; atMs?: number; everyMs?: number; expr?: string; description: string };
  prompt?: string;
  message?: string;
  conversationId: string;
  conversationTitle?: string;
  agentType: string;
  createdBy: 'user' | 'agent';
  executionMode?: 'existing' | 'new_conversation';
}

async function addJob(page: import('@playwright/test').Page, params: ICreateCronJobParams): Promise<ICronJob> {
  return invokeBridge<ICronJob>(page, 'cron.add-job', params, 8_000);
}

async function getJob(page: import('@playwright/test').Page, jobId: string): Promise<ICronJob | null> {
  return invokeBridge<ICronJob | null>(page, 'cron.get-job', { jobId }, 5_000);
}

async function removeJob(page: import('@playwright/test').Page, jobId: string): Promise<void> {
  return invokeBridge<void>(page, 'cron.remove-job', { jobId }, 5_000);
}

const TEST_CONVO = 'e2e-cron-test-conversation';

function baseParams(name: string, atMs: number): ICreateCronJobParams {
  return {
    name,
    schedule: { kind: 'at', atMs, description: `once at ${new Date(atMs).toISOString()}` },
    message: 'e2e-cron probe',
    conversationId: TEST_CONVO,
    agentType: 'gemini',
    createdBy: 'user',
    executionMode: 'existing',
  };
}

test.describe('Cron bridge lifecycle', () => {
  // ── One-shot fires ────────────────────────────────────────────────────────
  test('a one-shot job scheduled ~1s out fires and updates runCount', async ({ page }) => {
    const fireAt = Date.now() + 1_000;
    const created = await addJob(page, baseParams('e2e-cron-fires', fireAt));
    expect(created, 'job created').toBeDefined();
    expect(created.id, 'has id').toBeTruthy();
    expect(created.state.runCount, 'starts at 0').toBe(0);

    try {
      // Poll for up to 12s - fire window is ~1s but the cron tick + executor
      // may add a bit of latency, especially under CI load. Stop early once
      // we see runCount tick or lastRunAtMs land.
      const deadline = Date.now() + 12_000;
      let final: ICronJob | null = null;
      while (Date.now() < deadline) {
        final = await getJob(page, created.id);
        if (final && (final.state.runCount > 0 || final.state.lastRunAtMs)) break;
        await new Promise((r) => setTimeout(r, 500));
      }

      // We don't require the message to actually round-trip through the agent
      // (no LLM here). What we require is the *scheduler* tick observed the
      // job. That manifests as runCount > 0 OR lastRunAtMs set OR lastStatus
      // present. Any of those proves the fire path executed.
      const fired = !!(
        final &&
        (final.state.runCount > 0 || final.state.lastRunAtMs || final.state.lastStatus)
      );
      // If the executor errored we still get lastStatus='error' - that counts
      // as "fired". A complete no-op state means the scheduler never ticked,
      // which IS a regression we want to catch.
      expect(fired, `cron tick observed for ${created.id} (state=${JSON.stringify(final?.state)})`).toBe(true);
    } finally {
      await removeJob(page, created.id).catch(() => {});
    }
  });

  // ── Cancellation before fire ──────────────────────────────────────────────
  test('a job removed before its fire time never updates runCount', async ({ page }) => {
    const fireAt = Date.now() + 5_000;
    const created = await addJob(page, baseParams('e2e-cron-cancel', fireAt));
    expect(created.state.runCount, 'starts at 0').toBe(0);

    // Cancel well before the fire window.
    await removeJob(page, created.id);

    // After cancellation, get-job must return null (or otherwise indicate
    // removed). Wait past the original fire time + a safety margin and confirm
    // no state was created.
    await new Promise((r) => setTimeout(r, 7_000));
    const fetched = await getJob(page, created.id);
    expect(fetched, 'removed job no longer resolvable').toBeNull();
  });

  // ── Independence: two jobs don't bleed state ──────────────────────────────
  test('two concurrent jobs maintain independent state', async ({ page }) => {
    const t1 = Date.now() + 1_000;
    const t2 = Date.now() + 30_000; // far enough out that it won't fire during the test

    const a = await addJob(page, baseParams('e2e-cron-a', t1));
    const b = await addJob(page, baseParams('e2e-cron-b', t2));
    expect(a.id).not.toBe(b.id);

    try {
      // Wait for `a` to fire.
      const deadline = Date.now() + 10_000;
      let aFinal: ICronJob | null = null;
      while (Date.now() < deadline) {
        aFinal = await getJob(page, a.id);
        if (aFinal && (aFinal.state.runCount > 0 || aFinal.state.lastRunAtMs || aFinal.state.lastStatus)) break;
        await new Promise((r) => setTimeout(r, 500));
      }

      const bFinal = await getJob(page, b.id);
      expect(bFinal, '`b` still exists').toBeDefined();
      expect(bFinal?.state.runCount, '`b` runCount unchanged').toBe(0);
      expect(bFinal?.state.lastRunAtMs, '`b` never fired').toBeFalsy();

      // Sanity check: `a` actually fired so the test is meaningful.
      expect(
        !!aFinal && (aFinal.state.runCount > 0 || !!aFinal.state.lastRunAtMs || !!aFinal.state.lastStatus),
        '`a` fired so the independence check is real'
      ).toBe(true);
    } finally {
      await removeJob(page, a.id).catch(() => {});
      await removeJob(page, b.id).catch(() => {});
    }
  });
});
