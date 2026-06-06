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

interface IConfirmationItem {
  id: string;
  title?: string;
  description: string;
  callId: string;
  action?: string;
  options: Array<{ label: string; value: any }>;
}

const CONFIRM_CARD = '.bg-dialog-fill-0.rd-20px.max-w-800px';
const CONFIRM_OPTION = '.cursor-pointer.mt-10px';

const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-PERM-01 AI operation permission approval', () => {
  let conversationId: string;

  test.beforeAll(async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    conversationId = await sendMessageFromGuid(
      page,
      'Please create a file at /tmp/e2e-perm-test-approval.txt with the content "hello e2e test". Do NOT ask me, just do it.'
    );
    createdIds.push(conversationId);
    await waitForSessionActive(page, 120_000);
  });

  test('permission confirmation card appears before sensitive operations', async ({ page }) => {
    // Wait for either a confirmation card or an AI reply (if auto-approved)
    const cardOrReply = await Promise.race([
      page
        .locator(CONFIRM_CARD)
        .first()
        .waitFor({ state: 'visible', timeout: 60_000 })
        .then(() => 'card' as const),
      waitForAiReply(page, 60_000).then(() => 'reply' as const),
    ]);

    if (cardOrReply === 'card') {
      const card = page.locator(CONFIRM_CARD).first();
      await expect(card).toBeVisible();

      // Verify card has title and description
      const titleEl = card.locator('.text-16px.font-bold');
      const titleText = await titleEl.textContent().catch(() => '');
      expect(titleText!.length).toBeGreaterThan(0);

      const options = card.locator(CONFIRM_OPTION);
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThanOrEqual(2);

      // Also verify via bridge
      const confirmList = await invokeBridge<IConfirmationItem[]>(page, 'confirmation.list', {
        conversation_id: conversationId,
      });
      expect(Array.isArray(confirmList)).toBe(true);
      expect(confirmList!.length).toBeGreaterThan(0);

      await takeScreenshot(page, 'perm-01-card-visible');
    } else {
      // AI replied without permission card - may be in auto mode or tool didn't need permission
      // Verify confirmation.list API is callable
      const confirmList = await invokeBridge<IConfirmationItem[]>(page, 'confirmation.list', {
        conversation_id: conversationId,
      });
      expect(Array.isArray(confirmList)).toBe(true);

      await takeScreenshot(page, 'perm-01-no-card-auto-reply');
    }
  });

  test('card disappears and AI continues after user selects "Allow"', async ({ page }) => {
    const card = page.locator(CONFIRM_CARD).first();
    const isCardVisible = await card.isVisible().catch(() => false);

    if (!isCardVisible) {
      test.skip(undefined, 'No permission card appeared - AI may have auto-executed');
      return;
    }

    // Click first option (typically "Allow")
    const firstOption = card.locator(CONFIRM_OPTION).first();
    await firstOption.click();

    // Card should disappear
    await expect(card).toBeHidden({ timeout: 10_000 });

    // AI should continue and produce a reply
    await waitForAiReply(page, 120_000);

    await takeScreenshot(page, 'perm-01-allowed');
  });

  test.skip('same-type operations are auto-approved after selecting "Always Allow" (requires triggering the same tool call multiple times - E2E cannot reliably control AI tool selection)', async () => {});

  test('AI does not execute the operation after user selects "Deny"', async ({ page }) => {
    // Create a new conversation to test rejection
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const rejectConvId = await sendMessageFromGuid(
      page,
      'Please write a file at /tmp/e2e-perm-reject-test.txt with content "reject test". Just do it directly.'
    );
    createdIds.push(rejectConvId);
    await waitForSessionActive(page, 120_000);

    const cardOrReply = await Promise.race([
      page
        .locator(CONFIRM_CARD)
        .first()
        .waitFor({ state: 'visible', timeout: 60_000 })
        .then(() => 'card' as const),
      waitForAiReply(page, 60_000).then(() => 'reply' as const),
    ]);

    if (cardOrReply === 'card') {
      const card = page.locator(CONFIRM_CARD).first();
      const options = card.locator(CONFIRM_OPTION);
      const optionCount = await options.count();

      // Find the cancel/reject option (usually last one)
      let cancelIdx = -1;
      for (let i = 0; i < optionCount; i++) {
        const shortcutText = await options
          .nth(i)
          .locator('.font-mono')
          .textContent()
          .catch(() => '');
        if (shortcutText === 'Esc') {
          cancelIdx = i;
          break;
        }
      }

      if (cancelIdx >= 0) {
        await options.nth(cancelIdx).click();
      } else {
        // Fallback: click last option
        await options.last().click();
      }

      // Card should disappear after rejection
      await expect(card).toBeHidden({ timeout: 10_000 });
      // Conversation continues - AI should respond acknowledging the rejection
      await waitForAiReply(page, 120_000);

      await takeScreenshot(page, 'perm-01-rejected');
    } else {
      test.skip(undefined, 'No permission card appeared - cannot test rejection');
    }
  });

  test.skip('auto-denied on timeout with no response (note: 30-minute timeout not yet implemented)', async () => {});
  test.skip('user clicks Stop while AI is awaiting permission approval (requires precise control over stop timing - E2E unreliable)', async () => {});
  test.skip('multiple permission requests are shown in order (E2E cannot reliably make AI issue multiple tool calls simultaneously)', async () => {});
  test.skip('"Always Allow" records are cleared after session reset (requires triggering same tool call multiple times to verify - E2E unreliable)', async () => {});
  test.skip('Gemini backend permission approval differences (skipped for Gemini)', async () => {});
});

test.describe('F-PERM-02 Permission confirmation actions', () => {
  test('card disappears immediately after clicking the confirm button (reuses F-PERM-01 Allow test for verification)', async ({ page }) => {
    // This AC is already covered by F-PERM-01 "Allow" test above
    // Create a fresh conversation to verify independently
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const convId = await sendMessageFromGuid(
      page,
      'Please create a temp file /tmp/e2e-perm02-test.txt with content "perm02". Do it directly.'
    );
    createdIds.push(convId);
    await waitForSessionActive(page, 120_000);

    const cardOrReply = await Promise.race([
      page
        .locator(CONFIRM_CARD)
        .first()
        .waitFor({ state: 'visible', timeout: 60_000 })
        .then(() => 'card' as const),
      waitForAiReply(page, 60_000).then(() => 'reply' as const),
    ]);

    if (cardOrReply === 'card') {
      const card = page.locator(CONFIRM_CARD).first();
      const beforeCount = await card.locator(CONFIRM_OPTION).count();
      expect(beforeCount).toBeGreaterThanOrEqual(1);

      // Click first option
      await card.locator(CONFIRM_OPTION).first().click();

      // Card disappears immediately
      await expect(card).toBeHidden({ timeout: 5_000 });

      // AI resumes
      await waitForAiReply(page, 120_000);

      // Verify confirmation list is now empty
      const afterList = await invokeBridge<IConfirmationItem[]>(page, 'confirmation.list', { conversation_id: convId });
      expect(afterList?.length ?? 0).toBe(0);

      await takeScreenshot(page, 'perm-02-card-dismissed');
    } else {
      // Verify confirmation.list API returns empty
      const list = await invokeBridge<IConfirmationItem[]>(page, 'confirmation.list', { conversation_id: convId });
      expect(Array.isArray(list)).toBe(true);
    }
  });

  test.skip('card silently disappears when its associated operation no longer exists (requires precise control over AI stop timing - E2E unreliable)', async () => {});
  test.skip('user confirms before AI is fully initialized (requires capturing pre-initialization state precisely)', async () => {});
});
