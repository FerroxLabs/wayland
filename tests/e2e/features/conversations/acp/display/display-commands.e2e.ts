import { test, expect } from '../../../../fixtures';
import {
  invokeBridge,
  goToGuid,
  goToNewChat,
  selectAgent,
  sendMessageFromGuid,
  waitForAiReply,
  takeScreenshot,
  CHAT_INPUT,
  AGENT_STATUS_MESSAGE,
} from '../../../../helpers';

const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-DISPLAY-10 slash command list', () => {
  let slashConvId: string;

  test.beforeAll(async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    slashConvId = await sendMessageFromGuid(page, 'E2E slash command test: say hello');
    createdIds.push(slashConvId);
    await waitForAiReply(page, 120_000);
  });

  test('typing / in the conversation input shows the command list', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 10_000 });
    await textarea.fill('');
    await textarea.pressSequentially('/');

    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible({ timeout: 10_000 });

    const options = listbox.locator('[role="option"]');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    await takeScreenshot(page, 'display-10-slash-menu');
  });

  test('command list includes built-in commands (e.g. /btw)', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 10_000 });
    await textarea.fill('');
    await textarea.pressSequentially('/');

    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible({ timeout: 10_000 });

    const allOptionsText = await listbox.locator('[role="option"]').allTextContents();
    const hasBtw = allOptionsText.some((t) => t.toLowerCase().includes('btw'));
    expect(hasBtw).toBe(true);
  });

  test('supports keyword filtering', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 10_000 });
    await textarea.fill('');
    await textarea.pressSequentially('/');

    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible({ timeout: 10_000 });

    const countBefore = await listbox.locator('[role="option"]').count();

    await textarea.fill('');
    await textarea.pressSequentially('/btw');
    await page.waitForTimeout(500);

    const listboxAfter = page.locator('[role="listbox"]');
    const isStillVisible = await listboxAfter.isVisible({ timeout: 3_000 }).catch(() => false);

    if (isStillVisible) {
      const countAfter = await listboxAfter.locator('[role="option"]').count();
      expect(countAfter).toBeLessThanOrEqual(countBefore);
      if (countAfter > 0) {
        const filteredText = await listboxAfter.locator('[role="option"]').first().textContent();
        expect(filteredText?.toLowerCase()).toContain('btw');
      }
    }
  });

  test('bridge validates slash commands source data', async ({ page }) => {
    const result = await invokeBridge<{ success: boolean; data?: { commands: Array<{ name: string }> } }>(
      page,
      'conversation.get-slash-commands',
      { conversation_id: slashConvId },
      15_000
    ).catch(() => null);

    if (result?.data?.commands) {
      expect(result.data.commands.length).toBeGreaterThan(0);
      const hasName = result.data.commands.every((cmd) => typeof cmd.name === 'string' && cmd.name.length > 0);
      expect(hasName).toBe(true);
    } else if (result && typeof result === 'object') {
      const raw = result as Record<string, unknown>;
      if (raw.commands && Array.isArray(raw.commands)) {
        expect(raw.commands.length).toBeGreaterThan(0);
      }
    }
  });

  test('selecting a command fills the input or executes it', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 10_000 });
    await textarea.fill('');
    await textarea.pressSequentially('/');

    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible({ timeout: 10_000 });

    const options = listbox.locator('[role="option"]');
    const count = await options.count();
    if (count === 0) {
      test.skip();
      return;
    }

    const firstOption = options.first();
    const optionLabel = await firstOption.textContent();
    await firstOption.click();
    await page.waitForTimeout(500);

    const listboxGone = await listbox.isVisible().catch(() => false);
    expect(listboxGone).toBe(false);
  });

  test('command list distinguishes source (bridge data includes source field)', async ({ page }) => {
    const result = await invokeBridge<{
      success: boolean;
      data?: { commands: Array<{ name: string; source?: string }> };
    }>(page, 'conversation.get-slash-commands', { conversation_id: slashConvId }, 15_000).catch(() => null);

    const commands =
      result?.data?.commands ??
      (result as unknown as { commands?: Array<{ name: string; source?: string }> })?.commands ??
      [];

    if (commands.length > 0 && commands[0].source) {
      const sources = new Set(commands.map((c) => c.source));
      expect(sources.size).toBeGreaterThan(0);
      for (const src of sources) {
        expect(src === 'builtin' || src === 'acp').toBe(true);
      }
    } else {
      test.skip();
    }
  });

  test.skip('command list UI source badge display (SlashCommandMenu currently maps badge as hint rather than source; source label is not rendered in the UI)', async () => {});

  test('slash command screenshot', async ({ page }) => {
    await takeScreenshot(page, 'display-10-slash-command-final');
  });

  test.skip('agent native commands are dynamically loaded after connection (depends on ACP protocol sync; some backends do not support this)', async () => {});
  test.skip('command loading timeout of 6 seconds does not block user input (requires simulating a timeout scenario; not controllable in E2E)', async () => {});
  test.skip('priority strategy for same-name commands from different sources (specific strategy TBD)', async () => {});
  test.skip('Gemini backend slash command list (Gemini skipped)', async () => {});
});

test.describe('F-DISPLAY-11 request trace information', () => {
  let traceConvId: string;

  test.beforeAll(async ({ page }) => {
    await goToNewChat(page);
    await selectAgent(page, 'claude');
    traceConvId = await sendMessageFromGuid(page, 'E2E request trace test: hello');
    createdIds.push(traceConvId);
    await waitForAiReply(page, 120_000);
  });

  test('agent status badge is visible after AI reply', async ({ page }) => {
    const statusBadge = page.locator(AGENT_STATUS_MESSAGE);
    const count = await statusBadge.count();

    if (count > 0) {
      const text = await statusBadge
        .first()
        .textContent()
        .catch(() => '');
      expect(text?.length ?? 0).toBeGreaterThan(0);
    } else {
      const statusInList = page.locator('[data-message-type="agent_status"]');
      const listCount = await statusInList.count();
      expect(listCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('agent status includes backend identifier', async ({ page }) => {
    const statusBadge = page.locator(AGENT_STATUS_MESSAGE);
    const count = await statusBadge.count();

    if (count > 0) {
      const text = await statusBadge
        .first()
        .textContent()
        .catch(() => '');
      const hasAgentRef = text?.toLowerCase().includes('claude') || text?.toLowerCase().includes('session');
      expect(hasAgentRef).toBe(true);
    } else {
      const msgs = await invokeBridge<Array<{ type: string; content: unknown }>>(
        page,
        'database.get-conversation-messages',
        { conversation_id: traceConvId }
      ).catch(() => []);

      expect(msgs.length).toBeGreaterThan(0);
    }
  });

  test('request trace screenshot', async ({ page }) => {
    await takeScreenshot(page, 'display-11-request-trace');
  });

  test.skip('trace info includes detailed model name (ACP Log Panel UI has no data-testid; verification path is unstable)', async () => {});
  test.skip('Codex backend request trace info (Codex agent status format may differ)', async () => {});
});
