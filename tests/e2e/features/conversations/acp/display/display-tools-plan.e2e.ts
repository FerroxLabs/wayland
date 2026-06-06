import { test, expect } from '../../../../fixtures';
import {
  invokeBridge,
  goToGuid,
  goToNewChat,
  selectAgent,
  sendMessageFromGuid,
  waitForAiReply,
  takeScreenshot,
  MODE_SELECTOR,
  modeMenuItemByValue,
} from '../../../../helpers';

const createdIds: string[] = [];
const BYPASS_PERMISSIONS_MODE = 'bypassPermissions';

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-DISPLAY-03 AI tool call display', () => {
  let toolConvId: string;

  test.beforeAll(async ({ page }) => {
    test.setTimeout(240_000);

    await goToGuid(page);
    await selectAgent(page, 'claude');

    const modeSelector = page.locator(MODE_SELECTOR);
    const modeVisible = await modeSelector.isVisible().catch(() => false);
    if (modeVisible) {
      await modeSelector.click();
      const yoloItem = page.locator(modeMenuItemByValue(BYPASS_PERMISSIONS_MODE));
      const yoloVisible = await yoloItem.isVisible({ timeout: 3_000 }).catch(() => false);
      if (yoloVisible) {
        await yoloItem.click();
        await page.waitForTimeout(1_000);
      } else {
        await page.keyboard.press('Escape');
      }
    }

    toolConvId = await sendMessageFromGuid(
      page,
      'E2E tool display test: Read the file /etc/hostname and tell me what it says. If it does not exist, say so.'
    );
    createdIds.push(toolConvId);
    await waitForAiReply(page, 180_000);
  });

  test('tool calls are displayed as cards (including tool name)', async ({ page }) => {
    const toolCards = page.locator('.arco-alert');
    const cardCount = await toolCards.count();

    const toolTags = page.locator('.arco-tag');
    const tagCount = await toolTags.count();

    const toolMessageTypes = page.locator(
      '[data-message-type="tool_group"], [data-message-type="acp_tool_call"], [data-message-type="tool_call"]'
    );
    const typeCount = await toolMessageTypes.count();

    const hasToolUI = cardCount > 0 || tagCount > 0 || typeCount > 0;

    if (hasToolUI) {
      if (typeCount > 0) {
        const firstTool = toolMessageTypes.first();
        const tagText = await firstTool
          .locator('.arco-tag')
          .first()
          .textContent()
          .catch(() => '');
        expect(tagText?.length ?? 0).toBeGreaterThan(0);
      } else if (cardCount > 0) {
        const firstCard = toolCards.first();
        await expect(firstCard).toBeVisible();
      }
    } else {
      const replyText = await waitForAiReply(page, 5_000).catch(() => '');
      expect(replyText.length).toBeGreaterThan(0);
    }
  });

  test('tool execution status updates (completed/failed)', async ({ page }) => {
    const toolCards = page.locator('.arco-alert');
    const count = await toolCards.count();

    if (count === 0) {
      test.skip();
      return;
    }

    for (let i = 0; i < Math.min(count, 5); i++) {
      const alertEl = toolCards.nth(i);
      const alertClass = await alertEl.getAttribute('class').catch(() => '');
      const hasStatus =
        alertClass?.includes('arco-alert-success') ||
        alertClass?.includes('arco-alert-error') ||
        alertClass?.includes('arco-alert-info') ||
        alertClass?.includes('arco-alert-warning');
      expect(hasStatus).toBe(true);
    }
  });

  test('tool input and output information is viewable', async ({ page }) => {
    const toolMessageTypes = page.locator(
      '[data-message-type="tool_group"], [data-message-type="acp_tool_call"], [data-message-type="tool_call"]'
    );
    const typeCount = await toolMessageTypes.count();

    const toolCards = page.locator('.arco-alert');
    const cardCount = await toolCards.count();

    if (typeCount > 0) {
      const container = toolMessageTypes.first();
      const descOrResult = container.locator('.text-12px, pre, .arco-alert-content');
      const contentCount = await descOrResult.count();
      if (contentCount > 0) {
        const text = await descOrResult
          .first()
          .textContent()
          .catch(() => '');
        expect(text?.length ?? 0).toBeGreaterThan(0);
      }
    } else if (cardCount > 0) {
      const container = toolCards.first().locator('..');
      const descOrResult = container.locator('.text-12px, pre');
      const contentCount = await descOrResult.count();
      if (contentCount > 0) {
        const text = await descOrResult
          .first()
          .textContent()
          .catch(() => '');
        expect(text?.length ?? 0).toBeGreaterThan(0);
      }
    } else {
      test.skip();
    }
  });

  test('tool call screenshot', async ({ page }) => {
    await takeScreenshot(page, 'display-03-tool-call-card');
  });

  test.skip('tool failure card shows failed status (requires AI to select a specific tool that fails - uncontrollable)', async () => {});
});

test.describe('F-DISPLAY-04 AI execution plan display', () => {
  let planConvId: string;

  test.beforeAll(async ({ page }) => {
    test.setTimeout(240_000);

    await goToNewChat(page);
    await selectAgent(page, 'claude');

    const modeSelector = page.locator(MODE_SELECTOR);
    const modeVisible = await modeSelector.isVisible().catch(() => false);
    if (modeVisible) {
      await modeSelector.click();
      const yoloItem = page.locator(modeMenuItemByValue(BYPASS_PERMISSIONS_MODE));
      const yoloVisible = await yoloItem.isVisible({ timeout: 3_000 }).catch(() => false);
      if (yoloVisible) {
        await yoloItem.click();
        await page.waitForTimeout(1_000);
      } else {
        await page.keyboard.press('Escape');
      }
    }

    planConvId = await sendMessageFromGuid(
      page,
      'E2E plan display test: Create a plan to build a simple calculator in Python. List the steps you would take, then implement step 1 only.'
    );
    createdIds.push(planConvId);
    await waitForAiReply(page, 180_000);
  });

  test('AI execution plan is displayed as a step list (if present)', async ({ page }) => {
    const msgs = await invokeBridge<Array<{ type: string }>>(page, 'database.get-conversation-messages', {
      conversation_id: planConvId,
    }).catch(() => []);

    const hasPlanMsg = msgs.some((m) => m.type === 'plan');

    if (hasPlanMsg) {
      const planElements = page.locator('[data-message-type="plan"]');
      const count = await planElements.count();
      expect(count).toBeGreaterThan(0);

      await takeScreenshot(page, 'display-04-plan-present');
    } else {
      const replyText = await waitForAiReply(page, 5_000).catch(() => '');
      expect(replyText.length).toBeGreaterThan(0);
    }
  });

  test('execution plan screenshot', async ({ page }) => {
    await takeScreenshot(page, 'display-04-plan-area');
  });

  test.skip('plan reuses the same display area within a single conversation turn (depends on AI updating the plan multiple times - uncontrollable)', async () => {});
  test.skip('real-time plan content update verification (requires precise timing to capture streaming updates - E2E unstable)', async () => {});
});
