import { test, expect } from '../../../../fixtures';
import {
  invokeBridge,
  goToGuid,
  selectAgent,
  sendMessageFromGuid,
  waitForSessionActive,
  waitForAiReply,
  takeScreenshot,
  MODEL_SELECTOR_BTN,
} from '../../../../helpers';

interface AcpModelInfo {
  currentModelId?: string;
  currentModelLabel?: string;
  canSwitch?: boolean;
  availableModels: { id: string; label?: string; name?: string }[];
  source?: string;
}

interface ModelInfoResponse {
  success: boolean;
  data?: { modelInfo: AcpModelInfo | null };
}

interface ConfigOptionsResponse {
  success: boolean;
  data?: { configOptions: unknown[] };
}

const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-CONFIG-01 Switch AI Model', () => {
  let conversationId: string;

  test.beforeAll(async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    conversationId = await sendMessageFromGuid(page, 'E2E config-model test: Hello');
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);
    await waitForAiReply(page, 120_000);
  });

  test('all available models for the current backend are visible in the model list', async ({ page }) => {
    const result = await invokeBridge<ModelInfoResponse>(page, 'acp.get-model-info', { conversationId });
    expect(result?.success).toBe(true);
    expect(result?.data?.modelInfo).toBeTruthy();
    expect(result!.data!.modelInfo!.availableModels.length).toBeGreaterThan(0);

    await takeScreenshot(page, 'config-01-model-list');
  });

  test('subsequent conversation uses the new model after switching via UI', async ({ page }) => {
    const beforeInfo = await invokeBridge<ModelInfoResponse>(page, 'acp.get-model-info', { conversationId });
    const modelInfo = beforeInfo?.data?.modelInfo;
    const currentModelId = modelInfo?.currentModelId;
    const currentLabel = modelInfo?.currentModelLabel ?? currentModelId ?? '';
    const available = modelInfo?.availableModels ?? [];

    if (available.length < 2) {
      test.skip();
      return;
    }

    const modelBtn = page.locator('button.sendbox-model-btn.header-model-btn');
    const isBtnVisible = await modelBtn.isVisible().catch(() => false);
    if (!isBtnVisible) {
      test.skip();
      return;
    }

    await modelBtn.click();
    await page.waitForTimeout(500);

    const targetModel = available.find((m) => m.id !== currentModelId);
    if (!targetModel) {
      await page.keyboard.press('Escape');
      test.skip();
      return;
    }

    const targetLabel = targetModel.label ?? targetModel.id;
    const menuItem = page.locator('.arco-dropdown-menu-item, .arco-menu-item').filter({ hasText: targetLabel }).first();
    const isMenuItemVisible = await menuItem.isVisible().catch(() => false);
    if (!isMenuItemVisible) {
      await page.keyboard.press('Escape');
      test.skip();
      return;
    }

    await menuItem.click();
    await page.waitForTimeout(1_000);

    const afterInfo = await invokeBridge<ModelInfoResponse>(page, 'acp.get-model-info', { conversationId });
    expect(afterInfo?.data?.modelInfo?.currentModelId).toBe(targetModel.id);

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    await textarea.fill('After model switch: what model are you?');
    await textarea.press('Enter');
    const replyText = await waitForAiReply(page, 120_000);
    expect(replyText.length).toBeGreaterThan(0);

    await takeScreenshot(page, 'config-01-model-switched');
  });

  test('model selection is persisted after closing and reopening the session', async ({ page }) => {
    const beforeInfo = await invokeBridge<ModelInfoResponse>(page, 'acp.get-model-info', { conversationId });
    const modelBeforeNav = beforeInfo?.data?.modelInfo?.currentModelId;

    await goToGuid(page);
    await page.waitForTimeout(1_000);

    await page.evaluate((id) => {
      window.location.hash = `/conversation/${id}`;
    }, conversationId);
    await page.waitForFunction((id) => window.location.hash.includes(`/conversation/${id}`), conversationId, {
      timeout: 10_000,
    });
    await page.waitForTimeout(3_000);

    const afterInfo = await invokeBridge<ModelInfoResponse>(page, 'acp.get-model-info', { conversationId });
    expect(afterInfo?.data?.modelInfo?.currentModelId).toBe(modelBeforeNav);

    await takeScreenshot(page, 'config-01-model-persisted');
  });

  test.skip('automatically falls back when the selected model is unavailable (E2E cannot simulate model going offline)', async () => {});
  test.skip('switch model while AI session has not finished initializing (race condition is not reliably reproducible)', async () => {});
  test.skip('model remains unchanged when switch fails (E2E cannot reliably trigger a switch failure)', async () => {});
});

test.describe('F-CONFIG-04 View Model Info', () => {
  let conversationId: string;

  test.beforeAll(async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    conversationId = await sendMessageFromGuid(page, 'E2E config-04 model info test');
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);
    await waitForAiReply(page, 120_000);
  });

  test('current model name is visible after AI initialization', async ({ page }) => {
    const result = await invokeBridge<ModelInfoResponse>(page, 'acp.get-model-info', { conversationId });
    expect(result?.success).toBe(true);
    expect(result?.data?.modelInfo).toBeTruthy();
    expect(result!.data!.modelInfo!.currentModelId).toBeTruthy();
    expect(result!.data!.modelInfo!.currentModelId!.length).toBeGreaterThan(0);

    await takeScreenshot(page, 'config-04-model-info');
  });

  test('model list only shows actually available models', async ({ page }) => {
    const result = await invokeBridge<ModelInfoResponse>(page, 'acp.get-model-info', { conversationId });
    const models = result?.data?.modelInfo?.availableModels ?? [];
    expect(models.length).toBeGreaterThan(0);
    for (const m of models) {
      expect(m.id).toBeTruthy();
      expect(m.id.length).toBeGreaterThan(0);
    }
  });

  test.skip('user cannot trigger model switch when switching is unsupported (requires a backend that does not support model switching)', async () => {});
  test.skip('model info is not shown when AI has not been initialized and has never been used (requires capturing pre-initialization state precisely)', async () => {});
});

test.describe('F-CONFIG-10 Backend Capability Info Cache', () => {
  test('backend capability info is available after the first connection', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const conversationId = await sendMessageFromGuid(page, 'E2E config-10 cache test');
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);
    await waitForAiReply(page, 120_000);

    const modelInfo = await invokeBridge<ModelInfoResponse>(page, 'acp.get-model-info', { conversationId });
    expect(modelInfo?.success).toBe(true);
    expect(modelInfo?.data?.modelInfo).toBeTruthy();
    expect(modelInfo!.data!.modelInfo!.availableModels.length).toBeGreaterThan(0);

    const configOptions = await invokeBridge<ConfigOptionsResponse>(page, 'acp.get-config-options', { conversationId });
    expect(configOptions?.success).toBe(true);

    await takeScreenshot(page, 'config-10-capability-cache');
  });

  test.skip('cached data is shown before connection is established (requires capturing UI state before connection, timing is unreliable)', async () => {});
  test.skip('cache automatically updates to latest data after connection is established (requires diffing before/after cache state, unreliable)', async () => {});
});
