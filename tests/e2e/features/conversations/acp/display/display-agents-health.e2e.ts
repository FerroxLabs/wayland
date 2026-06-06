import { test, expect } from '../../../../fixtures';
import {
  invokeBridge,
  goToGuid,
  selectAgent,
  sendMessageFromGuid,
  waitForAiReply,
  takeScreenshot,
  AGENT_PILL,
  agentPillByBackend,
} from '../../../../helpers';

const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-DISPLAY-13 Available AI backend list', () => {
  test('guid page shows available AI backend pill list', async ({ page }) => {
    await goToGuid(page);
    const pills = page.locator(AGENT_PILL);
    await expect(pills.first()).toBeVisible({ timeout: 15_000 });

    const count = await pills.count();
    expect(count).toBeGreaterThan(0);
  });

  test('bridge returns available agents list', async ({ page }) => {
    type AgentInfo = { backend: string; name: string; kind?: string };
    const result = await invokeBridge<{ success: boolean; data?: AgentInfo[] }>(
      page,
      'acp.get-available-agents',
      {},
      15_000
    ).catch(() => null);

    expect(result).toBeTruthy();

    const agents = result?.data ?? (Array.isArray(result) ? (result as AgentInfo[]) : []);
    expect(agents.length).toBeGreaterThan(0);

    for (const agent of agents) {
      expect(agent.backend || agent.name).toBeTruthy();
      expect(agent.name).toBeTruthy();
    }
  });

  test('each backend displays basic info such as name and type', async ({ page }) => {
    await goToGuid(page);
    const pills = page.locator(AGENT_PILL);
    const count = await pills.count();

    for (let i = 0; i < count; i++) {
      const pill = pills.nth(i);
      const backend = await pill.getAttribute('data-agent-backend');
      expect(backend).toBeTruthy();

      const text = await pill.textContent();
      expect(text?.length ?? 0).toBeGreaterThan(0);
    }
  });

  test('claude backend pill is visible', async ({ page }) => {
    await goToGuid(page);
    const claudePill = page.locator(agentPillByBackend('claude'));
    await expect(claudePill).toBeVisible({ timeout: 10_000 });
  });

  test('screenshot of available backend list', async ({ page }) => {
    await goToGuid(page);
    await takeScreenshot(page, 'display-13-available-agents');
  });

  test.skip('extended backends have clear identification (identification method to be confirmed)', async () => {});
  test.skip('Gemini backend pill verification (Gemini skipped)', async () => {});
});

test.describe('F-DISPLAY-12 Environment check and AI backend health check', () => {
  test('bridge env check returns a result', async ({ page }) => {
    const result = await invokeBridge<{ env?: Record<string, string> } | Record<string, unknown>>(
      page,
      'acp.check.env',
      {},
      15_000
    ).catch(() => null);

    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  test('env check result contains backend configuration info', async ({ page }) => {
    const result = await invokeBridge<{ env?: Record<string, string> } | Record<string, unknown>>(
      page,
      'acp.check.env',
      {},
      15_000
    ).catch(() => null);

    if (result) {
      const envData = (result as { env?: Record<string, string> }).env ?? result;
      const keys = Object.keys(envData);
      expect(keys.length).toBeGreaterThan(0);
    }
  });

  test('env check screenshot', async ({ page }) => {
    await takeScreenshot(page, 'display-12-env-check');
  });

  test.skip('health check detects backend availability and shows latency (requires navigating to settings page and finding the health check button; UI path is unstable)', async () => {});
  test.skip('shows unauthenticated prompt when backend is not authenticated (auth flow skipped)', async () => {});
  test.skip('shows specific error message when backend is unavailable (requires constructing a backend-unavailable scenario; not controllable in E2E)', async () => {});
  test.skip('Gemini env check (Gemini skipped)', async () => {});
});

test.describe('F-DISPLAY-06 Web preview open', () => {
  test.skip('preview panel opens automatically when AI invokes browser navigation tool (AI tool selection is not controllable; requires AI to actively call the browser navigation tool)', async () => {});
  test.skip('preview panel correctly displays the target web page (depends on F-DISPLAY-06 trigger; skipped)', async () => {});
});

test.describe('F-DISPLAY-07 Context usage display', () => {
  test('context usage indicator exists within a conversation (if token data is available)', async ({ page }) => {
    if (createdIds.length === 0) {
      await goToGuid(page);
      await selectAgent(page, 'claude');
      const convId = await sendMessageFromGuid(page, 'E2E context usage test: hello');
      createdIds.push(convId);
      await waitForAiReply(page, 120_000);
    }

    const indicator = page.locator('.context-usage-indicator');
    const isVisible = await indicator.isVisible({ timeout: 10_000 }).catch(() => false);

    if (isVisible) {
      await expect(indicator).toBeVisible();
      const svg = indicator.locator('svg');
      await expect(svg).toBeVisible({ timeout: 5_000 });
    }
  });

  test('context usage screenshot', async ({ page }) => {
    await takeScreenshot(page, 'display-07-context-usage');
  });

  test.skip('context usage data persistence verification (dual-path consistency to be confirmed)', async () => {});
  test.skip('visual warning when usage approaches the limit (requires exhausting context through many interactions; E2E cost too high)', async () => {});
  test.skip('some backends do not report context limit info (backend behavior difference; not controllable)', async () => {});
  test.skip('Gemini backend context usage (Gemini skipped)', async () => {});
});
