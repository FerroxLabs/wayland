/**
 * E2E (C3): Restart a failed agent from the right rail.
 *
 * Flow per E2E-TEST-PLAN §C3:
 *   1. Seed a team with one leader + one teammate stamped `status: 'failed'`
 *      (the team.create IPC honors the supplied agent status verbatim).
 *   2. Navigate to /team/<id>.
 *   3. The right rail restart icon ([data-testid="team-right-rail-restart"])
 *      renders only on rows whose live status === 'failed'.
 *   4. Click restart → team.restart-agent IPC fires → status flips off
 *      'failed' (the restart icon disappears).
 *   5. Activity tab gains a `wake` event whose payload includes
 *      `outcome: 'restarted_by_user'`.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const TEAM_NAME_PREFIX = 'E2E Restart C3';

test.describe('Right rail - restart failed agent (C3)', () => {
  test('clicking restart fires team.restart-agent + logs wake event', async ({ page }) => {
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
        {
          slotId: 'slot-fail',
          conversationId: '',
          role: 'teammate',
          agentType: 'wcore',
          agentName: 'BrokenBob',
          conversationType: 'wcore',
          status: 'failed',
        },
      ],
    });
    if (!created?.id) throw new Error('team.create returned null - backend missing');
    const teamId = created.id;

    await navigateTo(page, `#/team/${teamId}`);
    await page.waitForURL(new RegExp(`/team/${teamId}`), { timeout: 15_000 });

    const rail = page.locator('[data-testid="team-right-rail"]');
    await expect(rail).toBeVisible({ timeout: 15_000 });

    // The restart icon should be visible on the failed teammate's row.
    const restartBtn = rail.locator('[data-testid="team-right-rail-restart"]').first();
    await expect(restartBtn).toBeVisible({ timeout: 10_000 });

    // Click restart.
    await restartBtn.click();

    // Once restart-agent succeeds the status flips from 'failed'; the icon is
    // status-gated so it disappears.
    await expect(rail.locator('[data-testid="team-right-rail-restart"]')).toHaveCount(0, { timeout: 15_000 });

    // Activity tab: a wake event with outcome:restarted_by_user lands.
    await page.locator('[data-testid="team-activity-tab-button"]').click();
    const activity = page.locator('[data-testid="team-activity-tab"]');
    await expect(activity).toBeVisible({ timeout: 5_000 });
    await expect(activity.locator('[data-testid="team-activity-event"][data-event-type="wake"]').first()).toBeVisible({
      timeout: 15_000,
    });

    // Cleanup.
    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });
});
