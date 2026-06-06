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

const USER_MSG_SELECTOR = '.message-item.text.justify-end';
const AI_MSG_SELECTOR = '.message-item.text.justify-start';

const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-MSG-01 Send text message', () => {
  let conversationId: string;

  test.beforeAll(async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    conversationId = await sendMessageFromGuid(page, 'E2E msg-send test: Hello AI');
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);
  });

  test('User message appears immediately in the conversation area after sending', async ({ page }) => {
    const userMessages = page.locator(USER_MSG_SELECTOR);
    await expect(userMessages.first()).toBeVisible({ timeout: 10_000 });
    const count = await userMessages.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('AI streaming reply received after sending', async ({ page }) => {
    const replyText = await waitForAiReply(page, 120_000);
    expect(replyText.length).toBeGreaterThan(0);
    await takeScreenshot(page, 'msg-01-ai-reply');
  });

  test('Conversation appears in the sidebar list after sending', async ({ page }) => {
    const row = page.locator(`#c-${conversationId}`);
    await expect(row).toBeVisible({ timeout: 10_000 });
  });

  test('Empty message is not sent', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10_000 });

    const msgCountBefore = await page.locator(USER_MSG_SELECTOR).count();

    await textarea.fill('');
    await textarea.press('Enter');
    await page.waitForTimeout(1_000);

    const msgCountAfter = await page.locator(USER_MSG_SELECTOR).count();
    expect(msgCountAfter).toBe(msgCountBefore);
  });

  test('Input box is enabled and accepts follow-up messages after AI reply completes', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    expect(await textarea.isDisabled()).toBe(false);

    await textarea.fill('Follow-up message for F-MSG-01');
    await textarea.press('Enter');

    const replyText = await waitForAiReply(page, 120_000);
    expect(replyText.length).toBeGreaterThan(0);
  });

  test('Verify via bridge that messages are persisted to the database', async ({ page }) => {
    await page.waitForTimeout(2_000);

    const messages = await invokeBridge<{ content?: unknown; position?: string; type?: string }[]>(
      page,
      'database.get-conversation-messages',
      { conversation_id: conversationId }
    );
    expect(messages.length).toBeGreaterThanOrEqual(1);

    const userMsgs = messages.filter((m) => m.position === 'right');
    expect(userMsgs.length).toBeGreaterThanOrEqual(1);

    await takeScreenshot(page, 'msg-01-db-verified');
  });

  test.skip('Multiple queued messages merged and sent (partially implemented, to be completed when full feature ships)', async () => {});
  test.skip('Error message shown when AI connection fails (E2E cannot reliably simulate backend connection failure)', async () => {});
  test.skip('Prompt shows conversation not found when session does not exist (defensive boundary)', async () => {});
});
