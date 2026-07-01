/**
 * #457 True Continue - in-app live verification.
 *
 * Drives the REAL production wiring in the launched Electron app against a real
 * wayland-core engine session:
 *   - Clicking Continue (the banner's wl:chat-continue event) sends the
 *     continuation DIRECTIVE into the SAME conversation - NOT a re-send of the
 *     original prompt (no restart). The engine resumes in the same --resume
 *     session and replies again.
 *
 * The inverse (normal Retry still re-sends the original prompt unchanged) is
 * covered deterministically by platformSendBoxes.dom.
 *
 * Forcing a real token/length truncation deterministically needs an output-cap
 * seam the UI doesn't expose + model cooperation, and the engine-resumes-and-
 * finishes half is the Core max_turns leg; the truncation BANNER rendering +
 * affordance are covered deterministically by the vitest DOM tests
 * (messageTextContinueBanner.dom, platformSendBoxes.dom). This spec proves the
 * end-to-end Continue dispatch->engine path that those unit tests stub.
 *
 * Gate: needs a wcore-capable model selectable in the app (a discovered
 * provider key). Skips cleanly otherwise so CI without keys stays green.
 */
import path from 'path';
import fs from 'fs';
import { test, expect } from '../fixtures';
import { goToGuid, selectAgent, sendMessageFromGuid, waitForAiReply } from '../helpers';

const CONTINUE_DIRECTIVE = 'Continue exactly where you left off. Do not restart or repeat completed work.';
const SCREENSHOT_DIR = '/tmp/457-verify';

function ensureDir() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const MODEL_PLACEHOLDERS = new Set(['select model', 'no model', 'choose model', '']);

/** Wait until the current turn finishes (the stop button is gone), mirroring the
 * real UX where the truncation/Continue affordance only appears post-turn. */
async function waitForTurnIdle(page: import('@playwright/test').Page, timeoutMs = 90_000): Promise<void> {
  await page
    .locator('.sendbox-stop-button')
    .waitFor({ state: 'hidden', timeout: timeoutMs })
    .catch(() => {
      /* already idle */
    });
}

/** Return the selected model label, or '' if none is selected/available. */
async function selectedModelLabel(page: import('@playwright/test').Page): Promise<string> {
  const btn = page.locator('button.sendbox-model-btn.guid-config-btn').first();
  if (!(await btn.isVisible({ timeout: 8_000 }).catch(() => false))) return '';
  const text = (await btn.textContent().catch(() => ''))?.trim() ?? '';
  return MODEL_PLACEHOLDERS.has(text.toLowerCase()) ? '' : text;
}

test.describe('#457 True Continue (in-app, real engine)', () => {
  test('Continue sends the directive (not the original prompt) into the same live session', async ({ page }) => {
    ensureDir();
    await goToGuid(page);
    await selectAgent(page, 'wcore');

    const modelLabel = await selectedModelLabel(page);
    test.skip(!modelLabel, 'no wcore model selected (no provider) - skipping live drive');
    console.log(`[#457] driving live wcore turn with model="${modelLabel}"`);

    const ORIGINAL_PROMPT = 'Reply with exactly: STEP-ONE-DONE';
    const conversationId = await sendMessageFromGuid(page, ORIGINAL_PROMPT);
    const firstReply = await waitForAiReply(page, 90_000);
    expect(firstReply.length, 'expected a real wcore reply (session is live)').toBeGreaterThan(0);
    // The turn must fully end before Continue - the sendbox blocks sends while
    // busy (isBusy guard), exactly as the banner only appears once the turn stops.
    await waitForTurnIdle(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-first-reply.png') });

    const userBubblesBefore = await page.locator('.message-item.text.justify-end').count();

    // Fire the SAME event the truncation banner's Continue button dispatches.
    await page.evaluate(
      ({ id }) => {
        window.dispatchEvent(new CustomEvent('wl:chat-continue', { detail: { conversationId: id } }));
      },
      { id: conversationId }
    );

    // A new user bubble must appear, and it must carry the continuation
    // DIRECTIVE - never a re-send of the original prompt.
    await expect
      .poll(async () => page.locator('.message-item.text.justify-end').count(), { timeout: 15_000 })
      .toBeGreaterThan(userBubblesBefore);

    const lastUserBubble = await page.evaluate(() => {
      const items = document.querySelectorAll('.message-item.text.justify-end');
      return items[items.length - 1]?.textContent?.trim() ?? '';
    });
    expect(lastUserBubble, 'Continue must send the directive').toContain(CONTINUE_DIRECTIVE);
    expect(lastUserBubble, 'Continue must NOT re-send the original prompt').not.toContain('STEP-ONE-DONE');

    // The engine resumes in the same session and replies again.
    const resumeReply = await waitForAiReply(page, 90_000);
    expect(resumeReply.length, 'expected a resume reply from the same session').toBeGreaterThan(0);
    await waitForTurnIdle(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-after-continue.png') });
    console.log(
      `[#457] Continue directive sent="${lastUserBubble.slice(0, 60)}" resumeReply="${resumeReply.slice(0, 60)}"`
    );

    // Note: the inverse gate - normal Retry still re-sends the ORIGINAL prompt
    // unchanged - is covered deterministically by the vitest DOM test
    // (platformSendBoxes.dom: 'wcore Retry still re-sends the original prompt').
    // This live spec's unique value is the Continue -> real-engine-resume path.
  });
});
