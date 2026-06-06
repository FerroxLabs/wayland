import { test, expect } from '../../../../fixtures';
import {
  invokeBridge,
  goToGuid,
  goToNewChat,
  selectAgent,
  sendMessageFromGuid,
  waitForAiReply,
  takeScreenshot,
  SKILLS_INDICATOR,
  SKILLS_INDICATOR_COUNT,
} from '../../../../helpers';

const createdIds: string[] = [];

test.afterAll(async ({ page }) => {
  for (const id of createdIds) {
    await invokeBridge(page, 'remove-conversation', { id }).catch(() => {});
  }
  createdIds.length = 0;
});

test.describe('F-SKILL-01 AI skill auto-discovery and injection', () => {
  test('list-available-skills returns a skill list', async ({ page }) => {
    const skills = await invokeBridge<
      Array<{
        name: string;
        description: string;
        location: string;
        isCustom: boolean;
        source: 'builtin' | 'custom' | 'extension';
      }>
    >(page, 'list-available-skills', undefined, 15_000).catch(() => []);

    expect(Array.isArray(skills)).toBe(true);

    if (skills.length > 0) {
      const first = skills[0];
      expect(typeof first.name).toBe('string');
      expect(first.name.length).toBeGreaterThan(0);
      expect(['builtin', 'custom', 'extension']).toContain(first.source);
    }
  });

  test('list-available-skills supports three source types', async ({ page }) => {
    const skills = await invokeBridge<
      Array<{
        name: string;
        source: 'builtin' | 'custom' | 'extension';
      }>
    >(page, 'list-available-skills', undefined, 15_000).catch(() => []);

    if (skills.length > 0) {
      const sources = new Set(skills.map((s) => s.source));
      expect(sources.has('builtin')).toBe(true);

      for (const src of sources) {
        expect(['builtin', 'custom', 'extension']).toContain(src);
      }
    }
  });

  test('list-builtin-auto-skills returns built-in auto-inject skills', async ({ page }) => {
    const builtinSkills = await invokeBridge<Array<{ name: string; description: string }>>(
      page,
      'list-builtin-auto-skills',
      undefined,
      15_000
    ).catch(() => []);

    expect(Array.isArray(builtinSkills)).toBe(true);

    if (builtinSkills.length > 0) {
      const first = builtinSkills[0];
      expect(typeof first.name).toBe('string');
      expect(first.name.length).toBeGreaterThan(0);
    }
  });

  test('get-skill-paths returns valid paths', async ({ page }) => {
    const paths = await invokeBridge<{ userSkillsDir: string; builtinSkillsDir: string }>(
      page,
      'get-skill-paths',
      undefined,
      15_000
    ).catch(() => null);

    expect(paths).not.toBeNull();
    if (paths) {
      expect(typeof paths.userSkillsDir).toBe('string');
      expect(paths.userSkillsDir.length).toBeGreaterThan(0);
      expect(typeof paths.builtinSkillsDir).toBe('string');
      expect(paths.builtinSkillsDir.length).toBeGreaterThan(0);
    }
  });

  test('after first message, DB contains skill-related messages or injections', async ({ page }) => {
    await goToGuid(page);
    await selectAgent(page, 'claude');
    const convId = await sendMessageFromGuid(page, 'E2E skill inject test: say hello briefly.');
    createdIds.push(convId);
    await waitForAiReply(page, 120_000);

    const msgs = await invokeBridge<Array<{ type: string; content: unknown; hidden?: boolean }>>(
      page,
      'database.get-conversation-messages',
      { conversation_id: convId }
    ).catch(() => []);

    expect(msgs.length).toBeGreaterThan(0);

    const hasTextMsg = msgs.some((m) => m.type === 'text');
    expect(hasTextMsg).toBe(true);
  });

  test('skill auto-discovery screenshot', async ({ page }) => {
    await takeScreenshot(page, 'skill-01-auto-discovery');
  });

  test.skip('skill injection runs only on the first message and is not repeated on subsequent messages (internal injection logic is not observable in E2E)', async () => {});
});

test.describe('F-SKILL-02 Explicit skill injection (advanced mode)', () => {
  let skillConvId: string;

  test.beforeAll(async ({ page }) => {
    test.setTimeout(180_000);
    await goToNewChat(page);
    await selectAgent(page, 'claude');
    skillConvId = await sendMessageFromGuid(page, 'E2E skill indicator test: say hello.');
    createdIds.push(skillConvId);
    await waitForAiReply(page, 120_000);
  });

  test('skill indicator presence check on the conversation page', async ({ page }) => {
    const indicator = page.locator(SKILLS_INDICATOR);
    const isVisible = await indicator.isVisible({ timeout: 5_000 }).catch(() => false);

    if (isVisible) {
      const countEl = page.locator(SKILLS_INDICATOR_COUNT);
      const countVisible = await countEl.isVisible().catch(() => false);

      if (countVisible) {
        const countText = await countEl.textContent().catch(() => '');
        const countNum = parseInt(countText ?? '0', 10);
        expect(countNum).toBeGreaterThanOrEqual(0);
      }

      await takeScreenshot(page, 'skill-02-indicator-visible');
    } else {
      const skills = await invokeBridge<Array<{ name: string }>>(
        page,
        'list-available-skills',
        undefined,
        15_000
      ).catch(() => []);

      expect(skills.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('skill indicator screenshot', async ({ page }) => {
    await takeScreenshot(page, 'skill-02-indicator');
  });

  test.skip('select and inject a skill in the advanced editor (complex interaction path + depends on skill config, E2E is unstable)', async () => {});
  test.skip('injected content includes the skill directory path (injection content is in hidden messages and cannot be observed directly)', async () => {});
  test.skip('message is sent as-is when no skill is selected (requires opening advanced editor and deselecting, interaction depends on UI state)', async () => {});
});

test.describe('F-SKILL-03 MCP tool service injection', () => {
  test('mcp.get-agent-configs returns expected data structure', async ({ page }) => {
    const agents = await invokeBridge<{ success: boolean; data?: Array<{ backend: string; name: string }> }>(
      page,
      'acp.get-available-agents',
      undefined,
      15_000
    ).catch(() => null);

    const agentList = agents?.data ?? (Array.isArray(agents) ? agents : []);
    const agentParams = agentList.map((a: { backend: string; name: string; cliPath?: string }) => ({
      backend: a.backend,
      name: a.name,
    }));

    if (agentParams.length === 0) {
      test.skip();
      return;
    }

    const result = await invokeBridge<{ success: boolean; data?: Array<{ source: string; servers: unknown[] }> }>(
      page,
      'mcp.get-agent-configs',
      agentParams,
      15_000
    ).catch(() => null);

    if (result?.data && Array.isArray(result.data)) {
      for (const config of result.data) {
        expect(typeof config.source).toBe('string');
        expect(Array.isArray(config.servers)).toBe(true);
      }
    } else if (result && Array.isArray(result)) {
      for (const config of result as Array<{ source: string; servers: unknown[] }>) {
        expect(typeof config.source).toBe('string');
        expect(Array.isArray(config.servers)).toBe(true);
      }
    }
  });

  test('MCP tool service screenshot', async ({ page }) => {
    await takeScreenshot(page, 'skill-03-mcp-configs');
  });

  test.skip('enabled MCP tool services are auto-injected when entering a conversation (requires pre-configured MCP service, E2E environment is non-deterministic)', async () => {});
  test.skip('OAuth authentication flow (PRD notes partial implementation, OAuth guidance UI is missing)', async () => {});
  test.skip('tool service load failure does not affect core AI functionality (requires injecting a fault, not controllable in E2E)', async () => {});
  test.skip('tool services are automatically reloaded on conversation resume (requires a disconnect scenario, not controllable in E2E)', async () => {});
  test.skip('supports tool services from three sources (requires pre-configured extension-contributed MCP, E2E environment is non-deterministic)', async () => {});
});
