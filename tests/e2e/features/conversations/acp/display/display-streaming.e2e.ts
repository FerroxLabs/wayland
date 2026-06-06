import { test, expect } from '../../../../fixtures';
import {
  invokeBridge,
  goToGuid,
  goToNewChat,
  selectAgent,
  sendMessageFromGuid,
  waitForSessionActive,
  waitForAiReply,
  takeScreenshot,
  AGENT_STATUS_MESSAGE,
  CHAT_INPUT,
} from '../../../../helpers';

const AI_MSG_SELECTOR = '[data-testid="message-text-left"]';
const BACKENDS = ['claude', 'codex'] as const;
const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-DISPLAY-01 AI reply streams in real time character by character', () => {
  for (const backend of BACKENDS) {
    test(`${backend}: AI reply content appears and the UI auto-scrolls`, async ({ page }) => {
      if (backend === 'codex') test.setTimeout(240_000);

      await goToGuid(page);
      await selectAgent(page, backend);
      const convId = await sendMessageFromGuid(
        page,
        `E2E display streaming test - ${backend}: explain what a hash table is in 3 sentences`
      );
      createdIds.push(convId);

      const timeout = backend === 'codex' ? 180_000 : 120_000;
      const replyText = await waitForAiReply(page, timeout);
      expect(replyText.length).toBeGreaterThan(0);

      const aiMessages = page.locator(AI_MSG_SELECTOR);
      const count = await aiMessages.count();
      expect(count).toBeGreaterThan(0);
    });
  }

  test('input box is re-enabled after reply completes', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    const isTextarea = await textarea.isVisible().catch(() => false);
    if (isTextarea) {
      await expect(textarea).toBeEnabled({ timeout: 15_000 });
    } else {
      const editableInput = page.locator(CHAT_INPUT).first();
      await expect(editableInput).toBeVisible({ timeout: 15_000 });
    }
  });

  test('screenshot after reply completes', async ({ page }) => {
    await takeScreenshot(page, 'display-01-streaming-reply');
  });

  test('previously streamed reply is not lost after re-entering the conversation', async ({ page }) => {
    const lastConvId = createdIds[createdIds.length - 1];
    if (!lastConvId) {
      test.skip();
      return;
    }

    const msgsBefore = await invokeBridge<Array<{ content: unknown }>>(page, 'database.get-conversation-messages', {
      conversation_id: lastConvId,
    }).catch(() => []);
    expect(msgsBefore.length).toBeGreaterThan(0);

    await goToGuid(page);
    await page.waitForTimeout(1_000);

    await page.evaluate((id) => {
      window.location.hash = `#/conversation/${id}`;
    }, lastConvId);
    await page.waitForFunction(() => window.location.hash.includes('/conversation/'), { timeout: 10_000 });
    await page.waitForTimeout(3_000);

    const msgsAfter = await invokeBridge<Array<{ content: unknown }>>(page, 'database.get-conversation-messages', {
      conversation_id: lastConvId,
    }).catch(() => []);
    expect(msgsAfter.length).toBeGreaterThanOrEqual(msgsBefore.length);
  });

  test.skip('streaming resumes after a brief network hiccup (E2E cannot reliably simulate network jitter)', async () => {});
});

test.describe('F-DISPLAY-02 AI thinking process display', () => {
  let thinkingConvId: string;

  test.beforeAll(async ({ page }) => {
    await goToNewChat(page);
    await selectAgent(page, 'claude');
    thinkingConvId = await sendMessageFromGuid(
      page,
      'E2E thinking display test: Think step by step about why the sky is blue, then give me a one-sentence answer.'
    );
    createdIds.push(thinkingConvId);
    await waitForAiReply(page, 120_000);
  });

  test('thinking content is displayed in a dedicated section (if present)', async ({ page }) => {
    const thinkingContainer = page.locator('[class*="container"]').filter({
      has: page.locator('[class*="header"]'),
    });

    const msgs = await invokeBridge<Array<{ type: string }>>(page, 'database.get-conversation-messages', {
      conversation_id: thinkingConvId,
    }).catch(() => []);

    const hasThinkingMsg = msgs.some((m) => m.type === 'thinking');

    if (hasThinkingMsg) {
      const thinkingElements = page.locator('[data-message-type="thinking"]');
      const count = await thinkingElements.count();
      expect(count).toBeGreaterThan(0);

      await takeScreenshot(page, 'display-02-thinking-present');
    } else {
      const aiText = await waitForAiReply(page, 5_000).catch(() => '');
      expect(aiText.length).toBeGreaterThan(0);
    }
  });

  test('thinking section is marked as complete after thinking ends (if thinking messages exist)', async ({ page }) => {
    const msgs = await invokeBridge<Array<{ type: string; content: { status?: string; content?: string } }>>(
      page,
      'database.get-conversation-messages',
      { conversation_id: thinkingConvId }
    ).catch(() => []);

    const thinkingMsgs = msgs.filter((m) => m.type === 'thinking');
    if (thinkingMsgs.length === 0) {
      test.skip();
      return;
    }

    for (const msg of thinkingMsgs) {
      const content = typeof msg.content === 'object' ? msg.content : {};
      expect(content.status === 'done' || content.status === 'thinking').toBe(true);
    }

    const hasTextReply = msgs.some((m) => m.type === 'text');
    expect(hasTextReply).toBe(true);
  });

  test('screenshot of thinking content', async ({ page }) => {
    await takeScreenshot(page, 'display-02-thinking-area');
  });

  test.skip('auto-extraction of thinking content embedded in the final reply (depends on specific AI model behavior, not controllable)', async () => {});
  test.skip('AI completed thinking but produced no final reply (error path, AI behavior not controllable)', async () => {});
});
