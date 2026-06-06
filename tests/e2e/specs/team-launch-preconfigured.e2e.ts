/**
 * E2E (B1): Pre-configured launch flow - Standing Company marketing-agency.
 *
 * Flow per E2E-TEST-PLAN §B1:
 *   1. /teams → click marketing-agency card (Standing Company, present in
 *      every vendored bundle build - `assistants.json`).
 *   2. URL becomes /teams/ext-marketing-agency/launch.
 *   3. Launcher page shows pre-filled roster: leader (research) + 4 teammates
 *      (mira, beacon, copy, lens). Marketing-agency bundle lists 5 teammates;
 *      TeamLauncherPage promotes the first to leader, leaving 4 teammate rows.
 *   4. Each row has slot-name input + backend pill.
 *   5. Backend pill defaults to wayland-core (fallback) on hosts without
 *      detected CLIs; with detected CLIs it picks the preset's recommendation.
 *   6. Click "Launch team" → navigates to /team/<new-id>.
 *
 * The marketing-agency Standing Company is the SAFEST canonical pick - it
 * carries 5 teammates + rituals so we exercise the standing-badge path too.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const LAUNCHER_ID = 'ext-marketing-agency';
const EXPECTED_TEAMMATE_COUNT = 4; // 5 teammates in bundle; first becomes leader.

test.describe('Team Launcher - pre-configured (marketing-agency)', () => {
  test('roster pre-fills + launch navigates to /team/<id>', async ({ page }) => {
    test.setTimeout(120_000);

    // Cleanup any leftover teams from prior runs.
    const stale = await invokeBridge<Array<{ id: string; name: string }>>(page, 'team.list', {
      userId: 'system_default_user',
    });
    for (const t of stale) {
      if (t.name.startsWith('Marketing Agency') || t.name.startsWith('E2E Launcher')) {
        await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => {});
      }
    }

    // /teams → click the marketing-agency Standing card.
    await navigateTo(page, '#/teams');
    await page.waitForURL(/#\/teams(\?|$)/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({ timeout: 15_000 });

    const standingCard = page.locator(`[data-testid="team-card-${LAUNCHER_ID}"]`);
    await expect(standingCard).toBeVisible({ timeout: 10_000 });
    await standingCard.click();

    // URL becomes /teams/ext-marketing-agency/launch.
    await page.waitForURL(new RegExp(`/teams/${LAUNCHER_ID}/launch`), { timeout: 10_000 });
    await expect(page.locator('[data-testid="team-launcher-page"]')).toBeVisible({ timeout: 15_000 });

    // Header + Standing badge.
    await expect(page.locator('[data-testid="launcher-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="launcher-standing-badge"]')).toBeVisible();

    // Roster - leader row pre-populated + 4 teammate rows.
    const leaderRow = page.locator('[data-testid="launcher-row-leader"]');
    await expect(leaderRow).toBeVisible({ timeout: 10_000 });

    const teammateRows = page.locator('[data-testid^="launcher-row-teammate-"]');
    await expect(teammateRows).toHaveCount(EXPECTED_TEAMMATE_COUNT, { timeout: 10_000 });

    // Each row exposes slot-name input + backend pill.
    await expect(page.locator('[data-testid="launcher-slotname-leader"]')).toBeVisible();
    await expect(page.locator('[data-testid="launcher-backend-leader"]')).toBeVisible();
    for (let i = 0; i < EXPECTED_TEAMMATE_COUNT; i++) {
      await expect(page.locator(`[data-testid="launcher-slotname-teammate-${i}"]`)).toBeVisible();
      await expect(page.locator(`[data-testid="launcher-backend-teammate-${i}"]`)).toBeVisible();
    }

    // Pre-filled team name (from the bundle's launcher name).
    const nameInput = page.locator('[data-testid="launcher-name-input"]');
    await expect(nameInput).toBeVisible();
    const prefilled = await nameInput.inputValue();
    expect(prefilled.length).toBeGreaterThan(0);

    // Personalize name to make cleanup deterministic.
    const teamName = `E2E Launcher MA ${Date.now()}`;
    await nameInput.fill(teamName);

    // Click Launch.
    const launchCta = page.locator('[data-testid="launcher-launch-cta"]');
    await expect(launchCta).toBeEnabled({ timeout: 5_000 });
    await launchCta.click();

    // Navigate to /team/<new-id> (singular per Router.tsx).
    await page.waitForURL(/\/team\/[^/]+$/, { timeout: 60_000 });
    const url = page.url();
    const teamId = url.match(/\/team\/([^/?#]+)/)?.[1];
    expect(teamId).toBeTruthy();

    // Team header renders with the team name.
    await expect(page.locator(`text="${teamName}"`).first()).toBeVisible({ timeout: 15_000 });

    // Backend agrees the team has leader + 4 teammates.
    const teamState = await invokeBridge<{ agents: Array<{ role: string }> }>(page, 'team.get', {
      id: teamId,
    });
    expect(teamState.agents.length).toBe(1 + EXPECTED_TEAMMATE_COUNT);

    // Cleanup.
    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });
});
