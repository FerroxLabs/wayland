/**
 * E2E (G1): Golden-path smoke - the 60-second "does the whole product work"
 * sanity check. Per E2E-TEST-PLAN §G1.
 *
 * Selected canonical team: `cold-outbound` (ext-cold-outbound). It is an
 * ad-hoc launcher present in every vendored bundle build with a 3-teammate
 * roster (research + copy + sales - first promotes to leader, leaving 2
 * teammate rows). Cold Outbound has no rituals, which is fine - we only
 * smoke surfaces guaranteed to render:
 *
 *   1. /teams library loads
 *   2. click Cold Outbound → launcher page
 *   3. click Launch → /team/<id>
 *   4. right rail shows roster
 *   5. teammates section visible
 *   6. back to /teams works (no Failed to load on returning)
 *   7. right-click sidebar entry → typed "delete" → confirm → entry gone
 *
 * Excluded from this smoke: sending live messages + asserting backend
 * responses. Those depend on an installed CLI / live model and are covered
 * in Groups C / F per the plan. The smoke is here to catch wholesale
 * regressions - backend-pinned assertions belong elsewhere.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const LAUNCHER_ID = 'ext-cold-outbound';

test.describe('Golden path smoke - Cold Outbound', () => {
  test('library → launch → /team/<id> → right rail → back → delete', async ({ page }) => {
    test.setTimeout(180_000);

    // Cleanup leftovers.
    const stale = await invokeBridge<Array<{ id: string; name: string }>>(page, 'team.list', {
      userId: 'system_default_user',
    });
    for (const t of stale) {
      if (t.name.startsWith('E2E Smoke ColdOutbound')) {
        await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => {});
      }
    }

    // (1) /teams loads.
    await navigateTo(page, '#/teams');
    await page.waitForURL(/#\/teams(\?|$)/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({ timeout: 15_000 });

    // (2) Click Cold Outbound card.
    const card = page.locator(`[data-testid="team-card-${LAUNCHER_ID}"]`);
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.click();

    // Launcher page renders.
    await page.waitForURL(new RegExp(`/teams/${LAUNCHER_ID}/launch`), { timeout: 10_000 });
    await expect(page.locator('[data-testid="launcher-row-leader"]')).toBeVisible({ timeout: 15_000 });

    // (3) Launch.
    const teamName = `E2E Smoke ColdOutbound ${Date.now()}`;
    await page.locator('[data-testid="launcher-name-input"]').fill(teamName);
    await page.locator('[data-testid="launcher-launch-cta"]').click();

    await page.waitForURL(/\/team\/[^/]+$/, { timeout: 60_000 });
    const teamId = page.url().match(/\/team\/([^/?#]+)/)?.[1];
    expect(teamId).toBeTruthy();

    // No in-place error banner (bug #2 fix).
    await expect(page.locator('[data-testid="team-page-load-error"]')).toHaveCount(0);

    // (4 + 5) Right rail shows roster + teammates section.
    const rightRail = page.locator('[data-testid="team-right-rail"]');
    await expect(rightRail).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="team-right-rail-teammates"]')).toBeVisible();
    // 3 agents (1 leader + 2 teammates) - but the leader is rendered in a
    // separate header surface, so only the teammates list shows non-leader
    // rows. Be lenient: at least one teammate row OR the add-teammate CTA.
    const addBtn = page.locator('[data-testid="team-right-rail-add-teammate"]');
    await expect(addBtn).toBeVisible({ timeout: 10_000 });

    // Backend confirms the team exists with the expected agent count.
    const state = await invokeBridge<{ agents: Array<{ role: string }> }>(page, 'team.get', {
      id: teamId,
    });
    expect(state.agents.length).toBe(3);

    // (6) Back to /teams - no "Failed to load" banner, library re-renders.
    await navigateTo(page, '#/teams');
    await page.waitForURL(/#\/teams(\?|$)/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({ timeout: 15_000 });
    // Library subtitle still reads the bundle count.
    await expect(page.locator('[data-testid="teams-total-count"]')).toBeVisible();

    // (7) Sidebar entry → typed delete.
    const sidebarEntry = page.locator(`text="${teamName}"`).first();
    await expect(sidebarEntry).toBeVisible({ timeout: 10_000 });

    const row = sidebarEntry.locator(
      'xpath=ancestor::div[contains(@class,"group") and contains(@class,"h-40px")][1]'
    );
    await row.hover();
    const threeDot = row.locator('span.flex-center.cursor-pointer').last();
    await expect(threeDot).toBeVisible({ timeout: 5_000 });
    await threeDot.click();

    const deleteItem = page
      .locator('.arco-dropdown-menu .arco-dropdown-menu-item')
      .filter({ hasText: /^Delete$|^删除$/ })
      .first();
    await expect(deleteItem).toBeVisible({ timeout: 5_000 });
    await deleteItem.click();

    const modal = page.locator('[data-testid="delete-team-confirm-modal"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await page.locator('[data-testid="delete-team-confirm-input"]').fill('delete');
    const confirm = page.locator('[data-testid="delete-team-confirm-cta"]');
    await expect(confirm).toBeEnabled({ timeout: 3_000 });
    await confirm.click();

    await expect(modal).toBeHidden({ timeout: 10_000 });
    await expect(page.locator(`text="${teamName}"`)).toHaveCount(0, { timeout: 10_000 });

    const after = await invokeBridge<{ id?: string } | null>(page, 'team.get', { id: teamId });
    expect(after).toBeNull();
  });
});
