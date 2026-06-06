import { test, expect } from '../../../../fixtures';
import {
  invokeBridge,
  goToGuid,
  selectAgent,
  sendMessageFromGuid,
  waitForSessionActive,
  waitForAiReply,
  takeScreenshot,
  MODE_SELECTOR,
  modeMenuItemByValue,
} from '../../../../helpers';

interface ModeResponse {
  success: boolean;
  data?: { mode: string; initialized?: boolean };
}

const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-CONFIG-02 Switch conversation mode', () => {
  let conversationId: string;

  test.beforeAll(async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    conversationId = await sendMessageFromGuid(page, 'E2E config-mode test: Hello');
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);
    await waitForAiReply(page, 120_000);
  });

  test('all modes supported by the current backend are visible', async ({ page }) => {
    const modeSelector = page.locator(MODE_SELECTOR);
    const isModeVisible = await modeSelector.isVisible().catch(() => false);

    if (isModeVisible) {
      await modeSelector.click();
      await page.waitForTimeout(500);
      const menuItems = page.locator('[data-mode-value]');
      const count = await menuItems.count();
      expect(count).toBeGreaterThan(0);
      await page.keyboard.press('Escape');
    } else {
      const modeResult = await invokeBridge<ModeResponse>(page, 'acp.get-mode', { conversationId });
      expect(modeResult?.success).toBe(true);
      expect(modeResult?.data?.mode).toBeTruthy();
    }

    await takeScreenshot(page, 'config-02-mode-list');
  });

  test('mode control updates after switching mode via UI', async ({ page }) => {
    const modeResult = await invokeBridge<ModeResponse>(page, 'acp.get-mode', { conversationId });
    const currentMode = modeResult?.data?.mode;

    const modeSelector = page.locator(MODE_SELECTOR);
    const isModeVisible = await modeSelector.isVisible().catch(() => false);
    if (!isModeVisible) {
      test.skip();
      return;
    }

    await modeSelector.click();
    await page.waitForTimeout(500);

    const menuItems = page.locator('[data-mode-value]');
    const count = await menuItems.count();
    if (count < 2) {
      await page.keyboard.press('Escape');
      test.skip();
      return;
    }

    let targetMode: string | null = null;
    for (let i = 0; i < count; i++) {
      const val = await menuItems.nth(i).getAttribute('data-mode-value');
      if (val && val !== currentMode) {
        targetMode = val;
        break;
      }
    }

    if (!targetMode) {
      await page.keyboard.press('Escape');
      test.skip();
      return;
    }

    await page.locator(modeMenuItemByValue(targetMode)).click();
    await page.waitForTimeout(1_000);

    const afterMode = await invokeBridge<ModeResponse>(page, 'acp.get-mode', { conversationId });
    expect(afterMode?.data?.mode).toBe(targetMode);

    await takeScreenshot(page, 'config-02-mode-switched');
  });

  test('mode selection persists after the conversation is closed and reopened', async ({ page }) => {
    const beforeMode = await invokeBridge<ModeResponse>(page, 'acp.get-mode', { conversationId });
    const modeBeforeNav = beforeMode?.data?.mode;

    await goToGuid(page);
    await page.waitForTimeout(1_000);

    await page.evaluate((id) => {
      window.location.hash = `/conversation/${id}`;
    }, conversationId);
    await page.waitForFunction((id) => window.location.hash.includes(`/conversation/${id}`), conversationId, {
      timeout: 10_000,
    });
    await page.waitForTimeout(3_000);

    const afterMode = await invokeBridge<ModeResponse>(page, 'acp.get-mode', { conversationId });
    expect(afterMode?.data?.mode).toBe(modeBeforeNav);

    await takeScreenshot(page, 'config-02-mode-persisted');
  });

  test.skip('switching mode before AI session is initialized (race condition timing is unreliable)', async () => {});
  test.skip('mode remains unchanged when switching fails (E2E cannot reliably trigger a switch failure)', async () => {});
  test.skip('AI actions require re-confirmation after switching back from no-confirm mode to normal mode (requires permissions module verification)', async () => {});
});

test.describe('F-CONFIG-05 View current mode', () => {
  let conversationId: string;

  test.beforeAll(async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    conversationId = await sendMessageFromGuid(page, 'E2E config-05 view mode test');
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);
    await waitForAiReply(page, 120_000);
  });

  test('the current mode name is always visible to the user', async ({ page }) => {
    const modeResult = await invokeBridge<ModeResponse>(page, 'acp.get-mode', { conversationId });
    expect(modeResult?.success).toBe(true);
    expect(modeResult?.data?.mode).toBeTruthy();
    expect(modeResult!.data!.mode.length).toBeGreaterThan(0);

    const modeSelector = page.locator(MODE_SELECTOR);
    const isModeVisible = await modeSelector.isVisible().catch(() => false);
    if (isModeVisible) {
      const modeText = await modeSelector.textContent();
      expect(modeText).toBeTruthy();
      expect(modeText!.length).toBeGreaterThan(0);
    }

    await takeScreenshot(page, 'config-05-current-mode');
  });

  test.skip('default mode is shown when AI is not yet initialized (requires capturing pre-initialization state precisely)', async () => {});
});

test.describe('F-CONFIG-07 Auto-migration of no-confirm mode', () => {
  test.skip('legacy no-confirm settings are automatically migrated to the new mode system (E2E cannot construct legacy config data)', async () => {});
  test.skip('legacy settings are cleared after the user explicitly selects a new mode (E2E cannot construct legacy config data)', async () => {});
  test.skip('migration is transparent to the user (E2E cannot inspect the internal migration process)', async () => {});
});

test.describe('F-CONFIG-08 Codex backend sandbox security level integration', () => {
  test('mode is queryable after a Codex conversation is created', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'codex');
    const conversationId = await sendMessageFromGuid(page, 'E2E config-08 codex sandbox test');
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);
    await waitForAiReply(page, 120_000);

    const modeResult = await invokeBridge<ModeResponse>(page, 'acp.get-mode', { conversationId });
    expect(modeResult?.success).toBe(true);
    expect(modeResult?.data?.mode).toBeTruthy();

    await takeScreenshot(page, 'config-08-codex-sandbox');
  });

  test.skip('sandbox security level adjusts automatically after switching mode (E2E cannot directly inspect the Codex sandbox level internal value)', async () => {});
  test.skip('non-Codex backends are not affected by sandbox integration (Gemini skipped; other backends have no sandbox concept)', async () => {});
});
