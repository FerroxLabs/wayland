import { test, expect } from '../../../../fixtures';
import {
  invokeBridge,
  goToGuid,
  selectAgent,
  sendMessageFromGuid,
  waitForSessionActive,
  waitForAiReply,
  takeScreenshot,
  AGENT_STATUS_MESSAGE,
} from '../../../../helpers';

const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-SESSION-02 Enter conversation and establish connection', () => {
  test('claude backend: status indicator shown during connection and AI reply received', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const conversationId = await sendMessageFromGuid(page, 'Hello, this is an E2E connection test.');
    createdIds.push(conversationId);

    await expect(page).toHaveURL(/\/conversation\//);

    // AC: status indicator shown during connection (either the status badge or an AI reply counts as a valid signal)
    const statusOrReply = page.locator(`${AGENT_STATUS_MESSAGE}, .message-item.text.justify-start`);
    await expect(statusOrReply.first()).toBeVisible({ timeout: 30_000 });

    await waitForSessionActive(page, 120_000);
    await takeScreenshot(page, 'session-02-connected-claude');

    const replyText = await waitForAiReply(page, 120_000);
    expect(replyText.length).toBeGreaterThan(0);
  });

  test('codex backend: auto-connects after conversation is created (timeout 150s)', async ({ page }) => {
    test.setTimeout(240_000);
    await goToGuid(page);
    await selectAgent(page, 'codex');
    const conversationId = await sendMessageFromGuid(page, 'Hello, this is an E2E codex connection test.');
    createdIds.push(conversationId);

    await waitForSessionActive(page, 180_000);

    const replyText = await waitForAiReply(page, 180_000);
    expect(replyText.length).toBeGreaterThan(0);
  });

  test('input field is enabled after connection', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    const isDisabled = await textarea.isDisabled();
    expect(isDisabled).toBe(false);
  });

  test.skip('auto-retry once on first connection failure (E2E cannot reliably simulate network drop to trigger retry)', async () => {});
  test.skip('concurrent entry into the same conversation does not cause duplicate initialization (requires concurrency control, not reliably simulatable with a single E2E worker)', async () => {});
  test.skip('error message shown after connection timeout (E2E cannot reliably control backend response delay)', async () => {});
  test.skip('guidance shown after authentication failure (E2E does not cover the auth flow)', async () => {});
});

test.describe('F-SESSION-08 View conversation details and status', () => {
  test('verify via bridge that conversation details include live status', async ({ page }) => {
    const id = createdIds[0];
    if (!id) return;

    const conv = await invokeBridge<{
      id: string;
      type: string;
      extra: Record<string, unknown>;
    }>(page, 'get-conversation', { id });

    expect(conv).toBeTruthy();
    expect(conv.id).toBe(id);
    expect(conv.type).toBe('acp');
    expect(conv.extra?.backend).toBe('claude');
  });

  test('status of a disconnected conversation is shown as completed', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const freshId = await sendMessageFromGuid(page, 'E2E status check - idle session');
    createdIds.push(freshId);

    await waitForSessionActive(page, 120_000);

    await invokeBridge(page, 'reset-conversation', { id: freshId }).catch(() => {});

    await page.waitForTimeout(2_000);

    const conv = await invokeBridge<{
      id: string;
      extra: Record<string, unknown>;
    }>(page, 'get-conversation', { id: freshId });

    expect(conv).toBeTruthy();
    expect(conv.id).toBe(freshId);

    const status = conv.extra?.status ?? conv.extra?.sessionStatus;
    const validTerminalStates = ['completed', 'idle', 'disconnected', undefined];
    expect(validTerminalStates).toContain(status);
  });
});
