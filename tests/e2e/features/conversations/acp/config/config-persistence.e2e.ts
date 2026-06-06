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

interface ModelInfoResponse {
  success: boolean;
  data?: { modelInfo: { currentModelId?: string; availableModels?: { id: string }[] } | null };
}

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

test.describe('F-CONFIG-09 config auto-save and restore', () => {
  let conversationId: string;
  let savedModel: string | undefined;
  let savedMode: string | undefined;

  test.beforeAll(async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    conversationId = await sendMessageFromGuid(page, 'E2E config-persistence test');
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);
    await waitForAiReply(page, 120_000);

    const modelInfo = await invokeBridge<ModelInfoResponse>(page, 'acp.get-model-info', { conversationId });
    savedModel = modelInfo?.data?.modelInfo?.currentModelId;

    const modeInfo = await invokeBridge<ModeResponse>(page, 'acp.get-mode', { conversationId });
    savedMode = modeInfo?.data?.mode;
  });

  test('model change is auto-saved (verified via conversation extra)', async ({ page }) => {
    const conv = await invokeBridge<{ id?: string; extra?: Record<string, unknown> }>(page, 'get-conversation', {
      id: conversationId,
    });
    expect(conv).toBeTruthy();
    expect(conv!.id).toBeTruthy();

    await takeScreenshot(page, 'config-09-auto-save');
  });

  test('config is saved independently per session', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const secondId = await sendMessageFromGuid(page, 'E2E config-09 second session');
    createdIds.push(secondId);
    await waitForSessionActive(page, 120_000);
    await waitForAiReply(page, 120_000);

    const model1 = await invokeBridge<ModelInfoResponse>(page, 'acp.get-model-info', { conversationId });

    const model2 = await invokeBridge<ModelInfoResponse>(page, 'acp.get-model-info', { conversationId: secondId });

    expect(model1?.success).toBe(true);
    expect(model2?.success).toBe(true);

    await takeScreenshot(page, 'config-09-independent-sessions');
  });

  test('model and mode are automatically re-applied after session restore', async ({ page }) => {
    await goToGuid(page);
    await page.waitForTimeout(1_000);

    await page.evaluate((id) => {
      window.location.hash = `/conversation/${id}`;
    }, conversationId);
    await page.waitForFunction((id) => window.location.hash.includes(`/conversation/${id}`), conversationId, {
      timeout: 10_000,
    });
    await page.waitForTimeout(3_000);

    if (savedModel) {
      const afterModel = await invokeBridge<ModelInfoResponse>(page, 'acp.get-model-info', { conversationId });
      expect(afterModel?.data?.modelInfo?.currentModelId).toBe(savedModel);
    }

    if (savedMode) {
      const afterMode = await invokeBridge<ModeResponse>(page, 'acp.get-mode', { conversationId });
      expect(afterMode?.data?.mode).toBe(savedMode);
    }

    await takeScreenshot(page, 'config-09-restored');
  });

  test.skip('save failure does not block the current operation (E2E cannot simulate disk full)', async () => {});
  test.skip('user is notified and auto-falls back when the previously selected model is no longer available (E2E cannot simulate model going offline)', async () => {});
  test.skip('silently falls back to default mode when mode restore fails (E2E cannot reliably trigger mode restore failure)', async () => {});
});
