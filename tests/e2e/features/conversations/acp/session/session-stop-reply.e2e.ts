import { test, expect } from '../../../../fixtures';
import {
  invokeBridge,
  goToGuid,
  selectAgent,
  sendMessageFromGuid,
  waitForSessionActive,
  waitForAiReply,
  takeScreenshot,
} from '../../../../helpers';

const AI_MSG_SELECTOR = '.message-item.text.justify-start';

const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-SESSION-03 Stop the current AI reply', () => {
  let conversationId: string;

  test.beforeAll(async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    conversationId = await sendMessageFromGuid(
      page,
      'Write a very long essay about the history of computing, covering at least 20 major milestones in detail.'
    );
    createdIds.push(conversationId);
  });

  test('Stop button is visible and clickable while AI is replying', async ({ page }) => {
    const stopButton = page.locator('button[class*="stop"], [data-testid="stop-button"], [aria-label*="stop" i]');
    await expect(stopButton.first()).toBeVisible({ timeout: 30_000 });
    await stopButton.first().click();

    await page.waitForTimeout(2_000);

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    const isDisabled = await textarea.isDisabled();
    expect(isDisabled).toBe(false);
  });

  test.skip('Clicking stop before session initializes does not crash (timing is hard to reproduce precisely in E2E)', async () => {});

  test('Partial reply output is retained after stop and further messages can be sent', async ({ page }) => {
    const messages = await page.evaluate(() => {
      const items = document.querySelectorAll('.message-item.text');
      return items.length;
    });
    expect(messages).toBeGreaterThan(0);

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    await textarea.fill('Follow-up after stop');
    await textarea.press('Enter');

    await waitForAiReply(page, 120_000);

    const updatedCount = await page.evaluate(() => {
      const items = document.querySelectorAll('.message-item.text.justify-start');
      return items.length;
    });
    expect(updatedCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe('F-SESSION-10 AI reply completion handling', () => {
  test('UI returns to an editable state after AI finishes replying', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const conversationId = await sendMessageFromGuid(page, 'Say hello in one sentence.');
    createdIds.push(conversationId);

    const replyText = await waitForAiReply(page, 120_000);
    expect(replyText.length).toBeGreaterThan(0);

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    const isDisabled = await textarea.isDisabled();
    expect(isDisabled).toBe(false);

    await takeScreenshot(page, 'session-10-reply-complete');
  });

  test.skip('turn completion boundary (pending confirmation)', async () => {});
});
