/**
 * E2E (D2): Demote-from-Standing flow.
 *
 * Flow per E2E-TEST-PLAN §D2:
 *   1. Create an ad-hoc team via team.create IPC and immediately promote it
 *      via team.promote-to-standing (the IPC is unguarded; eligibility only
 *      gates the Promote pill UI, not the underlying IPC).
 *   2. Navigate to /team/<id> → the Standing badge + Demote action both
 *      render via TeamHeaderBadges.
 *   3. Click Demote → IPC fires → standing badge disappears.
 *   4. team.get confirms promotedToStanding === false.
 *   5. Because the team was promoted only by the user (not bundle-derived
 *      _standing) AND eligibility still holds (sessionCount unchanged), the
 *      Promote pill should NOT return here - sessionCount is still 0. We
 *      assert the badge disappears + the IPC flag flips, which is what the
 *      spec actually requires.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const TEAM_NAME_PREFIX = 'E2E Demote D2';

type BridgeError = { __bridgeError: true; message?: string };
function isBridgeError(value: unknown): value is BridgeError {
  return Boolean(value) && typeof value === 'object' && '__bridgeError' in (value as Record<string, unknown>);
}

test.describe('Demote from Standing - D2', () => {
  test('user-promoted team can be demoted; badge disappears + flag flips', async ({ page }) => {
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
    if (!created?.id) throw new Error('team.create returned null - required backend (wcore) not installed');
    const teamId = created.id;

    // Promote directly via IPC - the modal is the user-facing eligibility gate;
    // the service-side method is idempotent + unguarded so the spec can set up
    // the demote scenario without first seeding sessionCount.
    const promoted = await invokeBridge<void | BridgeError>(page, 'team.promote-to-standing', { teamId });
    if (isBridgeError(promoted)) {
      throw new Error(`team.promote-to-standing failed: ${promoted.message ?? 'unknown'}`);
    }

    await navigateTo(page, `#/team/${teamId}`);
    await page.waitForURL(new RegExp(`/team/${teamId}`), { timeout: 15_000 });

    // Standing badge + Demote action both render for a user-only promotion.
    await expect(page.locator('[data-testid="team-header-standing-badge"]')).toBeVisible({ timeout: 15_000 });
    const demote = page.locator('[data-testid="team-header-demote"]');
    await expect(demote).toBeVisible({ timeout: 10_000 });

    // Click Demote → flag flips + badge disappears.
    await demote.click();
    await expect(page.locator('[data-testid="team-header-standing-badge"]')).not.toBeVisible({ timeout: 10_000 });

    const after = await invokeBridge<{ promotedToStanding?: boolean } | null>(page, 'team.get', { id: teamId });
    expect(after?.promotedToStanding ?? false).toBe(false);

    // The demote action disappears with the badge (no longer a user-only standing team).
    await expect(demote).not.toBeVisible({ timeout: 5_000 });

    // Cleanup.
    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });
});
