/**
 * E2E: Team agent lifecycle (add + fire) via leader chat input.
 *
 * Parameterized by leader type. Each test:
 *   1. Creates the team in beforeAll if it doesn't exist (self-contained, no dependency on team-create.e2e.ts).
 *   2. Navigates to the team page.
 *   3. Sends "Add a claude type member named ..." via leader chat input.
 *   4. Asserts new member tab appears in tab bar.
 *   5. Sends "Fire the member named ..." via leader chat input.
 *   6. Asserts member tab disappears from tab bar.
 *
 * Operations MUST go through leader chat input - invokeBridge is only for setup.
 */
import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo, TEAM_SUPPORTED_BACKENDS } from '../helpers';

/** Map leader type to agentType + conversationType values used in team.create */
const AGENT_TYPE_MAP: Record<string, { agentType: string; conversationType: string }> = {
  gemini: { agentType: 'gemini', conversationType: 'gemini' },
  claude: { agentType: 'claude', conversationType: 'acp' },
  codex: { agentType: 'codex', conversationType: 'acp' },
};

const LEADER_CONFIGS = [...TEAM_SUPPORTED_BACKENDS].map((leaderType) => ({
  leaderType,
  teamName: `E2E Team (${leaderType})`,
}));

for (const { leaderType, teamName } of LEADER_CONFIGS) {
  test(`team lifecycle: ${leaderType} leader`, async ({ page }) => {
    test.setTimeout(300_000); // LLM inference + MCP calls need ~2-3 min total

    // [setup] Find or create the team - self-contained, no cross-file dependency
    const agentMeta = AGENT_TYPE_MAP[leaderType];
    if (!agentMeta) {
      test.skip(true, `Leader type "${leaderType}" not in AGENT_TYPE_MAP - skipping`);
      return;
    }

    const teams = await invokeBridge<Array<{ id: string; name: string }>>(page, 'team.list', {
      userId: 'system_default_user',
    });
    const existing = teams.find((t) => t.name === teamName);
    let resolvedTeamId: string;

    if (existing) {
      resolvedTeamId = existing.id;
    } else {
      const created = await invokeBridge<{ id: string } | null>(page, 'team.create', {
        userId: 'system_default_user',
        name: teamName,
        workspace: '',
        workspaceMode: 'shared',
        agents: [
          {
            slotId: 'slot-lead',
            conversationId: '',
            role: 'leader',
            agentType: agentMeta.agentType,
            agentName: 'Leader',
            conversationType: agentMeta.conversationType,
            status: 'idle',
          },
        ],
      }).catch(() => null);

      if (!created?.id) {
        test.skip(true, `Team "${teamName}" could not be created - agent type may not be installed`);
        return;
      }
      resolvedTeamId = created.id;
    }

    // [setup] Navigate to team page, wait for leader chat input
    await navigateTo(page, '#/team/' + resolvedTeamId);
    await page.waitForURL(/\/team\//);
    const chatInput = page.locator('textarea').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    const tabBar = page.locator('[data-testid="team-tab-bar"]');

    // [action] add member via the leader
    const memberName = `E2E-member-${Date.now()}`;
    await chatInput.fill(`Add a claude type member named ${memberName}`);
    await chatInput.press('Enter');

    // [assert] new member tab appears in the tab bar
    await expect(tabBar.locator(`text=${memberName}`)).toBeVisible({ timeout: 120000 });

    // [wait] for member initialization to complete (active badge disappears) before sending fire; otherwise shutdown_request is ignored
    const memberActiveBadge = tabBar
      .locator('span')
      .filter({ hasText: memberName })
      .locator('xpath=following-sibling::span[@aria-label="active"]');
    await expect(memberActiveBadge).not.toBeVisible({ timeout: 60000 });

    // [action] click the leader tab first to ensure chatInput belongs to the leader
    await tabBar.locator('span').filter({ hasText: 'Leader' }).first().click();

    // [wait] handle all pending MCP tool confirmation dialogs (auto-approve "Yes, allow always")
    // When the Gemini leader calls an MCP tool a confirmation dialog appears; the leader cannot continue/finish until it is confirmed
    const mcpConfirmBtn = page.locator('button').filter({ hasText: /Yes.*allow always|是.*始终允许/i });
    // Poll-click until no confirmation button is visible (wait up to 60s)
    const mcpConfirmDeadline = Date.now() + 60_000;
    while (Date.now() < mcpConfirmDeadline) {
      const visible = await mcpConfirmBtn
        .first()
        .isVisible()
        .catch(() => false);
      if (!visible) break;
      await mcpConfirmBtn
        .first()
        .click()
        .catch(() => {});
      await page.waitForTimeout(500);
    }

    // [wait] for the leader to be idle (no in-flight inference) before sending fire; otherwise Enter is blocked by sendbox
    const leaderActiveBadge = tabBar
      .locator('span')
      .filter({ hasText: 'Leader' })
      .locator('xpath=following-sibling::span[@aria-label="active"]');
    await expect(leaderActiveBadge).not.toBeVisible({ timeout: 60000 });

    // [screenshot] state before fire
    await page.screenshot({ path: 'tests/e2e/results/lifecycle-before-fire.png' });

    // [action] fire the member via the leader
    await chatInput.fill(`Fire the member named ${memberName}`);
    await chatInput.press('Enter');

    // [verify] message was sent (input is cleared); if Enter is blocked the message will linger
    await expect(chatInput).toHaveValue('', { timeout: 5000 });

    // [screenshot] state after the fire command is sent
    await page.screenshot({ path: 'tests/e2e/results/lifecycle-after-fire.png' });

    // [wait] handle MCP tool confirmation dialogs that pop up during fire
    const mcpConfirmBtn2 = page.locator('button').filter({ hasText: /Yes.*allow always|是.*始终允许/i });
    const mcpConfirmDeadline2 = Date.now() + 60_000;
    while (Date.now() < mcpConfirmDeadline2) {
      const visible = await mcpConfirmBtn2
        .first()
        .isVisible()
        .catch(() => false);
      if (!visible) break;
      await mcpConfirmBtn2
        .first()
        .click()
        .catch(() => {});
      await page.waitForTimeout(500);
    }

    // [assert] member tab disappears from the tab bar (leader inference + 2-phase shutdown protocol takes longer)
    await expect(tabBar.locator(`text=${memberName}`)).not.toBeVisible({ timeout: 120000 });
  });
}
