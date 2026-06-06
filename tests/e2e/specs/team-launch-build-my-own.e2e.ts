/**
 * E2E (B2): Build-my-own team flow - empty roster → suggest → add → create.
 *
 * Flow per E2E-TEST-PLAN §B2:
 *   1. /teams → click BuildMyOwn → URL /teams/new.
 *   2. Empty roster + goal text-box visible.
 *   3. Suggest button DISABLED with empty textarea.
 *   4. Type a goal → Suggest enables.
 *   5. Click Suggest → roster populates with leader + teammates (suggestRoster
 *      returns 4-6 specialists deterministically based on keyword scoring).
 *   6. Click +Add teammate → picker opens → pick a specialist → row added.
 *   7. Type team name → click Create team → navigates to /team/<id>.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

test.describe('Team Launcher - build my own', () => {
  test('empty → suggest → add → create flow', async ({ page }) => {
    test.setTimeout(120_000);

    // Cleanup leftovers.
    const stale = await invokeBridge<Array<{ id: string; name: string }>>(page, 'team.list', {
      userId: 'system_default_user',
    });
    for (const t of stale) {
      if (t.name.startsWith('E2E Build My Own')) {
        await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => {});
      }
    }

    // /teams → BuildMyOwn card.
    await navigateTo(page, '#/teams');
    await page.waitForURL(/#\/teams(\?|$)/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({ timeout: 15_000 });

    const buildCard = page.locator('[data-testid="team-card-build-my-own"]');
    await expect(buildCard).toBeVisible({ timeout: 10_000 });
    await buildCard.click();

    // URL becomes /teams/new.
    await page.waitForURL(/\/teams\/new(\?|$)/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="team-launcher-page"]')).toBeVisible({ timeout: 10_000 });

    // Empty roster - no leader, no teammates yet. The "pick a leader" CTA
    // is rendered when state.leader is null.
    await expect(page.locator('[data-testid="launcher-no-leader"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid^="launcher-row-teammate-"]')).toHaveCount(0);

    // Goal card visible only in build-my-own mode.
    const goalInput = page.locator('[data-testid="launcher-goal-input"]');
    await expect(page.locator('[data-testid="launcher-goal-card"]')).toBeVisible();
    await expect(goalInput).toBeVisible();

    // Suggest button starts DISABLED (goal text is empty).
    const suggestBtn = page.locator('[data-testid="launcher-suggest-btn"]');
    await expect(suggestBtn).toBeDisabled();

    // Type a goal - Suggest enables.
    await goalInput.fill('ship a marketing site in 2 weeks');
    await expect(suggestBtn).toBeEnabled({ timeout: 3_000 });

    // Click Suggest → roster populates.
    await suggestBtn.click();
    // Wait for leader row to appear (suggestRoster is deterministic; even
    // the fellBackToDefaults path returns a leader + 3-4 teammates).
    await expect(page.locator('[data-testid="launcher-row-leader"]')).toBeVisible({ timeout: 15_000 });
    const teammateCountAfterSuggest = await page
      .locator('[data-testid^="launcher-row-teammate-"]')
      .count();
    expect(teammateCountAfterSuggest).toBeGreaterThanOrEqual(2);

    // +Add teammate opens the picker.
    const addBtn = page.locator('[data-testid="launcher-add-teammate"]');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const picker = page.locator('[data-testid="teams-launcher-picker"]');
    await expect(picker).toBeVisible({ timeout: 5_000 });

    // Pick the first specialist in the picker list (excluding already-on-roster).
    const firstOption = page
      .locator('[data-testid^="teams-launcher-picker-option-"]')
      .first();
    await expect(firstOption).toBeVisible({ timeout: 5_000 });
    await firstOption.click();

    // Picker closes + one more teammate row appears.
    await expect(picker).toBeHidden({ timeout: 5_000 });
    await expect(page.locator('[data-testid^="launcher-row-teammate-"]')).toHaveCount(
      teammateCountAfterSuggest + 1,
      { timeout: 5_000 }
    );

    // Name + Create team.
    const teamName = `E2E Build My Own ${Date.now()}`;
    await page.locator('[data-testid="launcher-name-input"]').fill(teamName);

    const createCta = page.locator('[data-testid="launcher-launch-cta"]');
    await expect(createCta).toBeEnabled({ timeout: 3_000 });
    await createCta.click();

    // Navigate to /team/<id>.
    await page.waitForURL(/\/team\/[^/]+$/, { timeout: 60_000 });
    const teamId = page.url().match(/\/team\/([^/?#]+)/)?.[1];
    expect(teamId).toBeTruthy();

    await expect(page.locator(`text="${teamName}"`).first()).toBeVisible({ timeout: 15_000 });

    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });
});
