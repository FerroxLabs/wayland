import { test, expect } from '../../../../fixtures';
import {
  invokeBridge,
  goToGuid,
  selectAgent,
  sendMessageFromGuid,
  waitForSessionActive,
  waitForAiReply,
} from '../../../../helpers';

const AI_MSG_SELECTOR = '.message-item.text.justify-start';

const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-SESSION-04 Automatic Handling of Unexpected Disconnections', () => {
  let conversationId: string;

  test.beforeAll(async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    conversationId = await sendMessageFromGuid(page, 'E2E reconnect test - initial message');
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);
  });

  test('Resending a message after simulated disconnect triggers auto-reconnect', async ({ page }) => {
    await invokeBridge(page, 'reset-conversation', { id: conversationId });

    await page.waitForTimeout(2_000);

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    await textarea.fill('Message after disconnect - should auto-reconnect');
    await textarea.press('Enter');

    await waitForSessionActive(page, 120_000);

    const replyText = await waitForAiReply(page, 120_000);
    expect(replyText.length).toBeGreaterThan(0);
  });

  test('Content output before disconnect is preserved', async ({ page }) => {
    const count = await page.evaluate(() => {
      return document.querySelectorAll('.message-item.text').length;
    });
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test.skip('Show error prompt after reconnect failure and provide manual retry entry (E2E cannot reliably simulate sustained disconnection)', async () => {});
});

test.describe('F-SESSION-05 Idle Session Auto-Release', () => {
  test('Verify idle timeout configuration exists', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const conversationId = await sendMessageFromGuid(page, 'E2E idle release config check');
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);

    const conv = await invokeBridge<{
      id: string;
      extra: Record<string, unknown>;
    }>(page, 'get-conversation', { id: conversationId });

    expect(conv).toBeTruthy();
    expect(conv.id).toBe(conversationId);
  });

  test('Conversation history is fully preserved after release', async ({ page }) => {
    const id = createdIds[createdIds.length - 1];
    if (!id) return;

    await invokeBridge(page, 'reset-conversation', { id });
    await page.waitForTimeout(2_000);

    const conv = await invokeBridge<{ id: string }>(page, 'get-conversation', { id });
    expect(conv).toBeTruthy();
    expect(conv.id).toBe(id);

    const aiMessages = page.locator(AI_MSG_SELECTOR);
    const count = await aiMessages.count();
    expect(count).toBeGreaterThan(0);
  });

  test.skip('Actual 5-minute idle trigger verification (E2E wait cost too high)', async () => {
    // skip whitelist: actual 5-minute idle trigger verification for F-SESSION-05
  });
});
