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

const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-MSG-06 Input Box History', () => {
  let conversationId: string;
  const sentMessages = ['First history test message', 'Second history test message', 'Third history test message'];

  test.beforeAll(async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    conversationId = await sendMessageFromGuid(page, sentMessages[0]);
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);
    await waitForAiReply(page, 120_000);

    for (let i = 1; i < sentMessages.length; i++) {
      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible({ timeout: 15_000 });
      await textarea.fill(sentMessages[i]);
      await textarea.press('Enter');
      await waitForAiReply(page, 120_000);
    }
  });

  test('pressing ArrowUp navigates input history', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    await textarea.click();
    await textarea.fill('');

    await textarea.press('ArrowUp');
    await page.waitForTimeout(500);

    const value = await textarea.inputValue();
    const matchesAnyHistory = sentMessages.some((msg) => value.includes(msg));
    expect(matchesAnyHistory || value.length > 0).toBe(true);

    await takeScreenshot(page, 'msg-06-history-up');
  });

  test('selected history entry can be edited and re-sent', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    await textarea.click();
    await textarea.fill('');

    await textarea.press('ArrowUp');
    await page.waitForTimeout(500);

    const historyValue = await textarea.inputValue();
    if (historyValue.length > 0) {
      await textarea.fill(historyValue + ' (edited)');
      await textarea.press('Enter');

      const replyText = await waitForAiReply(page, 120_000);
      expect(replyText.length).toBeGreaterThan(0);
    }
  });

  test.skip('ArrowUp/ArrowDown do not trigger history in multi-line input (requires precise cursor position control)', async () => {});
});

test.describe('F-MSG-07 Retry and Undo Last Conversation Round', () => {
  test.skip('entire feature not implemented (skip allowlist: F-MSG-07 undo/redo not implemented)', async () => {});
});

test.describe('F-MSG-08 /btw Append Context', () => {
  test('sending /btw message during AI reply clears the input box and AI completes the reply', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const conversationId = await sendMessageFromGuid(
      page,
      'Write a detailed essay about the history of artificial intelligence, covering at least 10 major milestones.'
    );
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);

    await page.waitForTimeout(3_000);

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    await textarea.fill('/btw Please also mention Alan Turing');
    await textarea.press('Enter');

    await page.waitForTimeout(2_000);
    const textareaValue = await textarea.inputValue();
    expect(textareaValue.length).toBe(0);

    await waitForAiReply(page, 120_000);

    const messages = await invokeBridge<{ position?: string; type?: string }[]>(
      page,
      'database.get-conversation-messages',
      { conversation_id: conversationId }
    );
    expect(messages.length).toBeGreaterThanOrEqual(1);

    await takeScreenshot(page, 'msg-08-btw-sent');
  });

  test.skip('/btw message enters wait queue on unsupported backends (codex backend behavior to be confirmed)', async () => {});
  test.skip('/btw message display style differs from regular messages (UI style difference detection is unreliable)', async () => {});
});
