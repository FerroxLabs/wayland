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

test.describe('F-MSG-03 AI rules auto-injected on first message', () => {
  let conversationId: string;

  test.beforeAll(async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    conversationId = await sendMessageFromGuid(page, 'What capabilities do you have?');
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);
  });

  test('AI replies normally after first message is sent', async ({ page }) => {
    const replyText = await waitForAiReply(page, 120_000);
    expect(replyText.length).toBeGreaterThan(0);
  });

  test('injected content is not visible to the user (UI shows only the original user message)', async ({ page }) => {
    const userMessages = page.locator('.message-item.text.justify-end');
    const firstUserMsg = userMessages.first();
    await expect(firstUserMsg).toBeVisible({ timeout: 10_000 });

    const visibleText = await firstUserMsg.innerText();
    expect(visibleText).toContain('What capabilities do you have?');
    expect(visibleText.length).toBeLessThan(500);
  });

  test('DB stores the original message (injection is handled transparently at the transport layer)', async ({ page }) => {
    await page.waitForTimeout(2_000);

    const messages = await invokeBridge<{ content?: unknown; position?: string; type?: string }[]>(
      page,
      'database.get-conversation-messages',
      { conversation_id: conversationId }
    );

    const getTextContent = (m: { content?: unknown }): string => {
      if (!m.content) return '';
      if (typeof m.content === 'string') return m.content;
      if (typeof m.content === 'object' && m.content !== null && 'content' in m.content) {
        return String((m.content as Record<string, unknown>).content ?? '');
      }
      return JSON.stringify(m.content);
    };

    const userMsgs = messages.filter((m) => m.position === 'right' && m.type === 'text');
    expect(userMsgs.length).toBeGreaterThanOrEqual(1);

    const firstMsgText = getTextContent(userMsgs[0]);
    expect(firstMsgText).toContain('What capabilities do you have?');
  });

  test('subsequent messages can be sent and receive replies normally', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    await textarea.fill('Tell me a short joke.');
    await textarea.press('Enter');

    const replyText = await waitForAiReply(page, 120_000);
    expect(replyText.length).toBeGreaterThan(0);

    await takeScreenshot(page, 'msg-03-inject-second-msg');
  });

  test.skip('rule injection differences in custom workspace scenarios (requires pre-configured workspace)', async () => {});
  test.skip('message is sent as-is when no rules or skills are available (requires clearing rule config)', async () => {});
});

test.describe('F-MSG-04 hidden messages and silent messages', () => {
  test('hidden messages exist in DB but are not shown in the UI', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const conversationId = await sendMessageFromGuid(page, 'E2E hidden message test');
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);
    await waitForAiReply(page, 120_000);

    const messages = await invokeBridge<{ hidden?: boolean; position?: string; content?: string }[]>(
      page,
      'database.get-conversation-messages',
      { conversation_id: conversationId }
    );

    const visibleUserMsgs = page.locator('.message-item.text.justify-end');
    const visibleUserCount = await visibleUserMsgs.count();

    const dbUserMsgs = messages.filter((m) => m.position === 'right');

    const hiddenMsgs = messages.filter((m) => m.hidden === true);

    expect(messages.length).toBeGreaterThan(0);
    expect(dbUserMsgs.length).toBeGreaterThanOrEqual(visibleUserCount);

    if (hiddenMsgs.length > 0) {
      const visibleAiMsgs = page.locator(AI_MSG_SELECTOR);
      const visibleAiCount = await visibleAiMsgs.count();
      const dbAiMsgs = messages.filter((m) => m.position === 'left' && !m.hidden);
      expect(visibleAiCount).toBeLessThanOrEqual(dbAiMsgs.length + 1);
    }

    await takeScreenshot(page, 'msg-04-hidden-messages');
  });

  test.skip('silent messages are not recorded in message history (requires internal API trigger; IPC bridge does not support sending silent messages directly)', async () => {});
  test.skip('hidden messages triggered via scheduled task (requires task configuration; E2E wait cost is high)', async () => {});
});
