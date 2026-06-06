/**
 * E2E (C2): Right-rail "+ Add teammate" picker flow.
 *
 * Flow per E2E-TEST-PLAN §C2:
 *   1. Create a leader-only team and navigate to /team/<id>.
 *   2. Click [data-testid="team-right-rail-add-teammate"] → AddTeammatePicker
 *      modal opens (data-testid="teams-launcher-picker").
 *   3. Click the first specialist row → modal closes.
 *   4. Assert the right rail Teammates list grew from 1 → 2.
 *   5. Assert Activity tab now has a `spawn` event for the new teammate.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const TEAM_NAME_PREFIX = 'E2E AddTeammate C2';

test.describe('Right rail - add teammate (C2)', () => {
  test('picker adds a specialist + logs a spawn event', async ({ page }) => {
    test.setTimeout(120_000);

    // Cleanup leftovers.
    const stale = await invokeBridge<Array<{ id: string; name: string }>>(page, 'team.list', {
      userId: 'system_default_user',
    });
    for (const t of stale) {
      if (t.name.startsWith(TEAM_NAME_PREFIX)) {
        await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => {});
      }
    }

    const teamName = `${TEAM_NAME_PREFIX} ${Date.now()}`;
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
          agentType: 'wcore',
          agentName: 'Leader',
          conversationType: 'wcore',
          status: 'idle',
        },
      ],
    });
    if (!created?.id) throw new Error('team.create returned null - backend missing');
    const teamId = created.id;

    await navigateTo(page, `#/team/${teamId}`);
    await page.waitForURL(new RegExp(`/team/${teamId}`), { timeout: 15_000 });

    const rail = page.locator('[data-testid="team-right-rail"]');
    await expect(rail).toBeVisible({ timeout: 15_000 });
    await expect(rail.locator('[data-testid="team-right-rail-teammate"]')).toHaveCount(1);

    // Click "+ Add teammate".
    const addBtn = page.locator('[data-testid="team-right-rail-add-teammate"]');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Modal opens.
    const picker = page.locator('[data-testid="teams-launcher-picker"]');
    await expect(picker).toBeVisible({ timeout: 5_000 });

    // Pick the first available specialist option.
    const firstOption = picker.locator('[data-testid^="teams-launcher-picker-option-"]').first();
    await expect(firstOption).toBeVisible({ timeout: 5_000 });
    await firstOption.click();

    // Modal closes.
    await expect(picker).not.toBeVisible({ timeout: 10_000 });

    // Teammates list grew. The addAgent IPC + agentSpawned subscription is
    // async; allow a few seconds for the new row to render.
    await expect(rail.locator('[data-testid="team-right-rail-teammate"]')).toHaveCount(2, {
      timeout: 15_000,
    });

    // Backend agrees a new agent was added.
    const teamState = await invokeBridge<{ agents: Array<{ role: string }> }>(page, 'team.get', { id: teamId });
    expect(teamState.agents.length).toBe(2);

    // Activity tab - switch to it and assert a spawn event appeared.
    await page.locator('[data-testid="team-activity-tab-button"]').click();
    const activity = page.locator('[data-testid="team-activity-tab"]');
    await expect(activity).toBeVisible({ timeout: 5_000 });
    await expect(activity.locator('[data-testid="team-activity-event"][data-event-type="spawn"]').first()).toBeVisible(
      { timeout: 10_000 }
    );

    // Cleanup.
    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });
});
