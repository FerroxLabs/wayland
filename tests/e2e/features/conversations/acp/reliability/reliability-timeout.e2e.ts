import { test, expect } from '../../../../fixtures';
import {
  invokeBridge,
  goToGuid,
  selectAgent,
  sendMessageFromGuid,
  waitForAiReply,
  takeScreenshot,
  AGENT_STATUS_MESSAGE,
} from '../../../../helpers';

const AI_MSG_SELECTOR = '.message-item.text.justify-start';
const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-RELIABILITY-01 Automatic connection timeout handling', () => {
  let connConvId: string;

  test.beforeAll(async ({ page }) => {
    test.setTimeout(180_000);
    await goToGuid(page);
    await selectAgent(page, 'claude');
    connConvId = await sendMessageFromGuid(page, 'E2E reliability connection test: say hello briefly.');
    createdIds.push(connConvId);
    await waitForAiReply(page, 120_000);
  });

  test('agent_status is not error after successful connection (baseline verification)', async ({ page }) => {
    const msgs = await invokeBridge<Array<{ type: string; content: unknown }>>(
      page,
      'database.get-conversation-messages',
      { conversation_id: connConvId }
    ).catch(() => []);

    const statusMsgs = msgs.filter((m) => m.type === 'agent_status');

    if (statusMsgs.length > 0) {
      const lastStatus = statusMsgs[statusMsgs.length - 1];
      const content = lastStatus.content as { status?: string };
      expect(content.status).not.toBe('error');
    }

    const aiMsgs = page.locator(AI_MSG_SELECTOR);
    const count = await aiMsgs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('sending a new message triggers reconnection verification (UI does not freeze + interaction continues)', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 10_000 });
    const isDisabled = await textarea.isDisabled();
    expect(isDisabled).toBe(false);

    await textarea.fill('Follow-up message after connection established');
    await textarea.press('Enter');

    const replyText = await waitForAiReply(page, 120_000);
    expect(replyText.length).toBeGreaterThan(0);
  });

  test('connection timeout screenshot', async ({ page }) => {
    await takeScreenshot(page, 'reliability-01-connection-baseline');
  });

  test.skip('clear error shown after connection timeout (requires network fault injection, not controllable in E2E)', async () => {});
  test.skip('auto-retry once on first connection failure (requires network fault injection, not controllable in E2E)', async () => {});
  test.skip('verify connection wait time differences across backends (requires simulated slow connection, not controllable in E2E)', async () => {});
});

test.describe('F-RELIABILITY-02 Automatic AI reply timeout handling', () => {
  let timeoutConvId: string;

  test.beforeAll(async ({ page }) => {
    test.setTimeout(240_000);
    await goToGuid(page);
    await selectAgent(page, 'claude');
    timeoutConvId = await sendMessageFromGuid(
      page,
      'Write a very long essay about the history of computing, covering at least 20 major milestones in detail.'
    );
    createdIds.push(timeoutConvId);
  });

  test('normal AI response does not trigger timeout (baseline verification)', async ({ page }) => {
    const replyText = await waitForAiReply(page, 180_000);
    expect(replyText.length).toBeGreaterThan(0);

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    const isDisabled = await textarea.isDisabled();
    expect(isDisabled).toBe(false);
  });

  test('user can send a new message after stopping AI reply', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const stopConvId = await sendMessageFromGuid(
      page,
      'Write an extremely detailed analysis of every Shakespeare play ever written, with full plot summaries.'
    );
    createdIds.push(stopConvId);

    const stopButton = page.locator('button[class*="stop"], [data-testid="stop-button"], [aria-label*="stop" i]');
    const stopVisible = await stopButton
      .first()
      .isVisible({ timeout: 30_000 })
      .catch(() => false);

    if (stopVisible) {
      await stopButton.first().click();
      await page.waitForTimeout(2_000);
    } else {
      await waitForAiReply(page, 120_000);
    }

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    const isDisabled = await textarea.isDisabled();
    expect(isDisabled).toBe(false);

    await textarea.fill('Can you respond after stop?');
    await textarea.press('Enter');

    const replyText = await waitForAiReply(page, 120_000);
    expect(replyText.length).toBeGreaterThan(0);
  });

  test('AI reply timeout screenshot', async ({ page }) => {
    await takeScreenshot(page, 'reliability-02-timeout-baseline');
  });

  test.skip('auto-cancel with prompt when AI is unresponsive beyond configured time (requires AI non-response, not controllable in E2E)', async () => {});
  test.skip('timeout not triggered during tool calls and permission approvals (requires precise timing control, unstable in E2E)', async () => {});
  test.skip('timeout not triggered while AI has continuous output (requires output pace control, not controllable in E2E)', async () => {});
});
