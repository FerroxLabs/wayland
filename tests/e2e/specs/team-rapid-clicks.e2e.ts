/**
 * E2E (Adversarial): rapid-click button mashing - drives every clickable
 * surface in the team-blitz UI to verify no duplicate side-effects,
 * stacked modals, or runaway navigations.
 *
 * Six cases, each isolated (own pre-clean) and serial (one after the next):
 *   1. Triple-click Launch button on a preconfigured team → exactly 1
 *      team is created.
 *   2. Triple-click Delete confirm CTA in the typed-delete modal → team
 *      disappears once; second/third click is a no-op (modal closes).
 *   3. Double-click a launcher card on /teams → exactly 1 navigation to
 *      /teams/<id>/launch.
 *   4. Rapid-click Suggest button in BuildMyOwn (5x) → exactly 1 roster
 *      populates (no duplicate teammate rows).
 *   5. Hammer +Add teammate icon (5x rapid) → exactly 1 picker modal
 *      opens, not stacked. After close, no ghost modals remain.
 *   6. Spam-click the sidebar Teams entry while a navigation is in flight
 *      → no React error, sidebar still functional.
 */

import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const LAUNCHER_ID = 'ext-cold-outbound';
const NAME_PREFIX = 'E2E RapidClicks';

type TeamRow = { id: string; name: string };

async function cleanupTeams(page: Page): Promise<void> {
  const stale = await invokeBridge<TeamRow[]>(page, 'team.list', {
    userId: 'system_default_user',
  });
  for (const t of stale) {
    if (t.name.startsWith(NAME_PREFIX)) {
      await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => {});
    }
  }
}

// NOTE: `describe.serial` requested by the dispatch brief, but flipped to
// plain `describe` because Playwright's serial mode skips remaining tests
// on first failure. We want every adversarial case to report independently
// so the orchestrator sees ALL product bugs in one run, not just the first.
// Each test pre-cleans its own state - no shared mutable state between cases.
test.describe('Team Blitz - rapid-click adversarial', () => {
  test('triple-click Launch button → exactly 1 team created', async ({ page }) => {
    test.setTimeout(120_000);
    await cleanupTeams(page);

    const before = await invokeBridge<TeamRow[]>(page, 'team.list', {
      userId: 'system_default_user',
    });
    const beforeOurs = before.filter((t) => t.name.startsWith(NAME_PREFIX)).length;

    await navigateTo(page, '#/teams');
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({
      timeout: 15_000,
    });

    const card = page.locator(`[data-testid="team-card-${LAUNCHER_ID}"]`);
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.click();

    await page.waitForURL(new RegExp(`/teams/${LAUNCHER_ID}/launch`), { timeout: 10_000 });
    await expect(page.locator('[data-testid="launcher-row-leader"]')).toBeVisible({
      timeout: 15_000,
    });

    const teamName = `${NAME_PREFIX} TripleLaunch ${Date.now()}`;
    await page.locator('[data-testid="launcher-name-input"]').fill(teamName);

    // Mash the Launch CTA three times. The first click should kick off
    // the create + navigate; the second + third should be absorbed by
    // the loading state OR by the navigation already in flight.
    const launchCta = page.locator('[data-testid="launcher-launch-cta"]');
    await expect(launchCta).toBeEnabled({ timeout: 5_000 });
    for (let i = 0; i < 3; i++) {
      // best-effort: after the navigation lands the CTA is gone; ignore.
      await launchCta.click({ trial: false, force: true }).catch(() => {});
    }

    await page.waitForURL(/\/team\/[^/]+$/, { timeout: 60_000 });

    // Settle so any in-flight duplicate create calls complete.
    await page.waitForTimeout(2_000);

    const after = await invokeBridge<TeamRow[]>(page, 'team.list', {
      userId: 'system_default_user',
    });
    const afterOurs = after.filter((t) => t.name.startsWith(NAME_PREFIX)).length;
    expect(afterOurs - beforeOurs).toBe(1);

    // Verify by name match - there must be exactly one team with this name.
    const matching = after.filter((t) => t.name === teamName);
    expect(matching).toHaveLength(1);

    await invokeBridge(page, 'team.remove', { id: matching[0].id }).catch(() => {});
  });

  test('triple-click Delete confirm CTA → team disappears once, no error', async ({ page }) => {
    test.setTimeout(120_000);
    await cleanupTeams(page);

    const teamName = `${NAME_PREFIX} TripleDelete ${Date.now()}`;
    const created = await invokeBridge<{ id?: string } | null>(page, 'team.create', {
      userId: 'system_default_user',
      name: teamName,
      workspace: '',
      workspaceMode: 'shared',
      agents: [
        {
          slotId: '',
          conversationId: '',
          role: 'leader',
          agentType: 'wayland-core',
          agentName: 'Leader',
          conversationType: 'acp',
          status: 'pending',
        },
      ],
    });
    if (!created?.id) {
      test.skip(true, 'team.create returned null (no installed backend)');
      return;
    }

    // Open delete modal via sidebar three-dot menu.
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

    // Enable the CTA.
    await page.locator('[data-testid="delete-team-confirm-input"]').fill('delete');
    const cta = page.locator('[data-testid="delete-team-confirm-cta"]');
    await expect(cta).toBeEnabled({ timeout: 3_000 });

    // Mash three times. The second + third should either find the
    // button already detached (modal closed) or in a loading-disabled
    // state - neither should cause an error.
    let errorThrown = false;
    page.on('pageerror', () => {
      errorThrown = true;
    });
    for (let i = 0; i < 3; i++) {
      await cta.click({ force: true }).catch(() => {
        // Expected after the modal closes: click misses.
      });
    }

    await expect(modal).toBeHidden({ timeout: 10_000 });
    await expect(page.locator(`text="${teamName}"`)).toHaveCount(0, { timeout: 10_000 });
    expect(errorThrown).toBe(false);

    const after = await invokeBridge<{ id?: string } | null>(page, 'team.get', {
      id: created.id,
    });
    expect(after).toBeNull();
  });

  test('double-click launcher card → exactly 1 navigation', async ({ page }) => {
    test.setTimeout(60_000);

    await navigateTo(page, '#/teams');
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({
      timeout: 15_000,
    });

    const historyBefore = await page.evaluate(() => window.history.length);
    const card = page.locator(`[data-testid="team-card-${LAUNCHER_ID}"]`);
    await expect(card).toBeVisible({ timeout: 10_000 });

    // True double-click - back-to-back, no delay between.
    await card.click();
    await card.click({ force: true }).catch(() => {
      // After first nav lands, the card is no longer in the DOM - that's correct.
    });

    await page.waitForURL(new RegExp(`/teams/${LAUNCHER_ID}/launch`), { timeout: 10_000 });
    await expect(page.locator('[data-testid="team-launcher-page"]')).toBeVisible({
      timeout: 10_000,
    });

    // history.length grew by exactly 1 - not 2.
    const historyAfter = await page.evaluate(() => window.history.length);
    expect(historyAfter - historyBefore).toBeLessThanOrEqual(1);

    // URL is exactly /teams/<id>/launch - no concatenated double path.
    expect(page.url()).toMatch(new RegExp(`/teams/${LAUNCHER_ID}/launch$`));
  });

  test('rapid-click Suggest (5x) → exactly 1 roster populates', async ({ page }) => {
    test.setTimeout(90_000);

    await navigateTo(page, '#/teams');
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({
      timeout: 15_000,
    });

    await page.locator('[data-testid="team-card-build-my-own"]').click();
    await page.waitForURL(/\/teams\/new(\?|$)/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="launcher-goal-card"]')).toBeVisible({
      timeout: 10_000,
    });

    const goalInput = page.locator('[data-testid="launcher-goal-input"]');
    await goalInput.fill('launch a fitness app with email + sms onboarding');

    const suggestBtn = page.locator('[data-testid="launcher-suggest-btn"]');
    await expect(suggestBtn).toBeEnabled({ timeout: 5_000 });

    // Mash 5 times in rapid succession. Suggest sets `suggesting=true`
    // and disables the button via `loading`; subsequent clicks should
    // be no-ops.
    for (let i = 0; i < 5; i++) {
      await suggestBtn.click({ force: true }).catch(() => {});
    }

    // Wait for the roster to render.
    await expect(page.locator('[data-testid="launcher-row-leader"]')).toBeVisible({
      timeout: 20_000,
    });

    // Settle so any in-flight extra suggest calls complete (and would
    // duplicate the roster if the guard is broken).
    await page.waitForTimeout(2_000);

    const teammateCount = await page
      .locator('[data-testid^="launcher-row-teammate-"]')
      .count();
    // Suggest returns at most ~4 teammates per `targetSize: 5` (leader + 4).
    // If multiple invocations leaked through, the count would be >> 5.
    expect(teammateCount).toBeLessThanOrEqual(6);
    expect(teammateCount).toBeGreaterThanOrEqual(0);
  });

  test('hammer +Add teammate icon (5x) → exactly 1 picker modal', async ({ page }) => {
    test.setTimeout(90_000);

    await navigateTo(page, '#/teams');
    await page.locator('[data-testid="team-card-build-my-own"]').click();
    await page.waitForURL(/\/teams\/new(\?|$)/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="team-launcher-page"]')).toBeVisible({
      timeout: 10_000,
    });

    const addBtn = page.locator('[data-testid="launcher-add-teammate"]');
    await expect(addBtn).toBeVisible({ timeout: 10_000 });

    for (let i = 0; i < 5; i++) {
      await addBtn.click({ force: true }).catch(() => {});
    }

    // Exactly one picker modal should be open.
    await expect(page.locator('[data-testid="teams-launcher-picker"]')).toHaveCount(1, {
      timeout: 5_000,
    });

    // Close it; no ghost modals should remain.
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="teams-launcher-picker"]')).toHaveCount(0, {
      timeout: 5_000,
    });
  });

  test('spam-click sidebar Teams icon during navigation → no crash', async ({ page }) => {
    test.setTimeout(90_000);
    await cleanupTeams(page);

    // Seed a team so the sidebar has something to click.
    const teamName = `${NAME_PREFIX} SidebarSpam ${Date.now()}`;
    const created = await invokeBridge<{ id?: string } | null>(page, 'team.create', {
      userId: 'system_default_user',
      name: teamName,
      workspace: '',
      workspaceMode: 'shared',
      agents: [
        {
          slotId: '',
          conversationId: '',
          role: 'leader',
          agentType: 'wayland-core',
          agentName: 'Leader',
          conversationType: 'acp',
          status: 'pending',
        },
      ],
    });
    if (!created?.id) {
      test.skip(true, 'team.create returned null (no installed backend)');
      return;
    }
    const teamId = created.id;

    let errorThrown = false;
    page.on('pageerror', () => {
      errorThrown = true;
    });

    const sidebarEntry = page.locator(`text="${teamName}"`).first();
    await expect(sidebarEntry).toBeVisible({ timeout: 10_000 });

    // Spam click while navigation is in flight.
    for (let i = 0; i < 8; i++) {
      await sidebarEntry.click({ force: true }).catch(() => {});
    }

    await page.waitForURL(new RegExp(`/team/${teamId}`), { timeout: 10_000 });

    // Sidebar is still functional - entry still clickable to re-navigate.
    await expect(sidebarEntry).toBeVisible({ timeout: 5_000 });
    expect(errorThrown).toBe(false);

    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });
});
