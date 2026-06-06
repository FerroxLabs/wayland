/**
 * E2E (C1): Inside-team layout - header, tab bar, chat area, right rail.
 *
 * Flow per E2E-TEST-PLAN §C1:
 *   1. Create a team via team.create IPC (leader-only).
 *   2. navigateTo(#/team/<id>) → wait for stable URL.
 *   3. Assert: header (team name + backend rollup badge), tab bar with
 *      Leader 👑 tab + Activity tab, main chat area, right rail with
 *      Teammates + Workspace + Rituals sections.
 *   4. Ad-hoc team (no source launcher) → rituals section shows the
 *      "No rituals - not a Standing Company." hint.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const TEAM_NAME_PREFIX = 'E2E Layout C1';

test.describe('Team page layout - C1', () => {
  test('header + tab bar + chat area + right rail render for ad-hoc team', async ({ page }) => {
    test.setTimeout(120_000);

    // Cleanup leftovers from prior runs.
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
    if (!created?.id) {
      throw new Error('team.create returned null - required backend (wcore) not installed');
    }
    const teamId = created.id;

    await navigateTo(page, `#/team/${teamId}`);
    await page.waitForURL(new RegExp(`/team/${teamId}`), { timeout: 15_000 });

    // Header - the ChatLayout renders the team name as the title; the
    // backend rollup ("1 × wcore") appears in TeamHeaderBadges next to it.
    await expect(page.locator('[data-testid="team-header-badges"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="team-header-backend-rollup"]')).toBeVisible({ timeout: 10_000 });

    // Tab bar with Leader tab + Activity tab.
    await expect(page.locator('[data-testid="team-tab-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-activity-tab-button"]')).toBeVisible();

    // Right rail sections.
    const rail = page.locator('[data-testid="team-right-rail"]');
    await expect(rail).toBeVisible({ timeout: 10_000 });
    await expect(rail.locator('[data-testid="team-right-rail-teammates"]')).toBeVisible();
    await expect(rail.locator('[data-testid="team-right-rail-workspace"]')).toBeVisible();
    await expect(rail.locator('[data-testid="team-right-rail-rituals"]')).toBeVisible();

    // Right rail shows the single leader teammate row with a status dot.
    await expect(rail.locator('[data-testid="team-right-rail-teammate"]')).toHaveCount(1);
    await expect(rail.locator('[data-testid="team-right-rail-status-dot"]').first()).toBeVisible();

    // Ad-hoc team (no source launcher) → rituals section shows the hint copy.
    await expect(rail.locator('[data-testid="team-right-rail-rituals"]')).toContainText(
      /No rituals|not a Standing Company/
    );

    // Cleanup.
    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });
});
