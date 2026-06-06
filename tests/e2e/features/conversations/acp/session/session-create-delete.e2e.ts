import { test, expect } from '../../../../fixtures';
import {
  invokeBridge,
  goToGuid,
  selectAgent,
  sendMessageFromGuid,
  deleteConversation,
  goToNewChat,
  waitForSessionActive,
  takeScreenshot,
  AGENT_PILL,
  agentPillByBackend,
} from '../../../../helpers';

const BACKENDS = ['claude', 'codex'] as const;
const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-SESSION-01 Create new session', () => {
  test('guid page shows available agent pill', async ({ page }) => {
    await goToGuid(page);
    await expect(page.locator(AGENT_PILL).first()).toBeVisible({ timeout: 15_000 });
  });

  for (const backend of BACKENDS) {
    test(`select ${backend} backend and create session`, async ({ page }) => {
      if (backend === 'codex') test.setTimeout(240_000);

      await goToGuid(page);
      await selectAgent(page, backend);

      const selectedPill = page.locator(`${agentPillByBackend(backend)}[data-agent-selected="true"]`);
      await expect(selectedPill).toBeVisible({ timeout: 5_000 });

      const conversationId = await sendMessageFromGuid(page, `E2E session create test - ${backend}`);
      createdIds.push(conversationId);

      expect(conversationId).toBeTruthy();
      expect(conversationId.length).toBeGreaterThan(0);

      await expect(page.locator(`#c-${conversationId}`)).toBeVisible({ timeout: 15_000 });

      const timeout = backend === 'codex' ? 180_000 : 120_000;
      await waitForSessionActive(page, timeout);
    });
  }

  test('sidebar screenshot after successful creation', async ({ page }) => {
    await takeScreenshot(page, 'session-01-sidebar-after-create');
  });

  test.skip('create session via tray menu (E2E cannot interact with system-level tray menu)', async () => {});
  test.skip('create session with invalid agent type (defensive boundary, not covered by E2E)', async () => {});

  test('verify session data exists via bridge', async ({ page }) => {
    for (const id of createdIds) {
      const conv = await invokeBridge<{ id: string; type: string }>(page, 'get-conversation', { id });
      expect(conv).toBeTruthy();
      expect(conv.id).toBe(id);
    }
  });
});

test.describe('F-SESSION-07 Delete session', () => {
  let deleteTargetId: string;

  test.beforeAll(async ({ page }) => {
    await goToNewChat(page);
    await selectAgent(page, 'claude');
    deleteTargetId = await sendMessageFromGuid(page, 'E2E session delete test');
    createdIds.push(deleteTargetId);
    await waitForSessionActive(page, 120_000);
  });

  test('delete session via bridge and verify it disappears', async ({ page }) => {
    const row = page.locator(`#c-${deleteTargetId}`);
    await expect(row).toBeVisible({ timeout: 10_000 });

    const msgsBefore = await invokeBridge<unknown[]>(page, 'database.get-conversation-messages', {
      conversation_id: deleteTargetId,
    }).catch(() => []);
    expect(msgsBefore.length).toBeGreaterThan(0);

    await invokeBridge(page, 'remove-conversation', { id: deleteTargetId });
    await page.waitForTimeout(3_000);

    await expect(row).not.toBeVisible({ timeout: 10_000 });

    const idx = createdIds.indexOf(deleteTargetId);
    if (idx !== -1) createdIds.splice(idx, 1);
  });

  test('message history is also cleared after deletion', async ({ page }) => {
    const msgsAfter = await invokeBridge<unknown[]>(page, 'database.get-conversation-messages', {
      conversation_id: deleteTargetId,
    }).catch(() => []);
    expect(msgsAfter.length).toBe(0);
  });

  test('bridge query returns empty after deletion', async ({ page }) => {
    const conv = await invokeBridge<Record<string, unknown> | null>(page, 'get-conversation', {
      id: deleteTargetId,
    }).catch(() => null);
    const isGone = !conv || !conv.id;
    expect(isGone).toBe(true);
  });

  test.skip('delete via tray menu (E2E cannot interact with system-level tray menu)', async () => {});
  test.skip('delete with invalid id (boundary case, not covered by E2E)', async () => {});
});
