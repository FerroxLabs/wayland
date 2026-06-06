/**
 * E2E (A1): /teams library page renders the vendored bundle.
 *
 * Boots the app, navigates to /teams, and asserts the two-section layout
 * (Standing Companies + Teams) with the expected 5 / 19 split from the
 * vendored bundle. Each card variant is verified via data-card-variant.
 *
 * Source of truth for testids: `TeamsLibraryPage.tsx`, `TeamCard.tsx`,
 * `BuildMyOwnTeamCard.tsx`. Bundle layout: 5 standing companies
 * (marketing-agency, sales-org, customer-success-org, editorial-newsroom,
 * dev-shop) + 19 ad-hoc launchers (per `bundle-vendored/assistants.json`).
 *
 * NOTE: assistant ids are prefixed `ext-` by AssistantResolver, so the
 * rendered testid for marketing-agency is `team-card-ext-marketing-agency`.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const STANDING_IDS = [
  'ext-marketing-agency',
  'ext-sales-org',
  'ext-customer-success-org',
  'ext-editorial-newsroom',
  'ext-dev-shop',
];

const EXPECTED_TOTAL = 24;
const EXPECTED_STANDING = 5;
const EXPECTED_TEAMS = 19;

test.describe('Teams Library - load', () => {
  test('renders Standing Companies + Teams sections with vendored bundle', async ({ page }) => {
    test.setTimeout(60_000);

    // Settle the renderer's bridge layer before navigating - matches the
    // pattern used by team-empty-state / team-communication specs. Without
    // this, ProtectedLayout can redirect us to /login mid-navigation while
    // the auth check is still resolving on first paint.
    await invokeBridge(page, 'team.list', { userId: 'system_default_user' }).catch(() => undefined);

    // Hash-route navigation: TeamsLibraryPage lives at /teams. Use the helper
    // (handles settings escape + waits for body content > 50 chars).
    await navigateTo(page, '#/teams');
    await page.waitForURL(/#\/teams(\?|$)/, { timeout: 10_000 });

    const pageRoot = page.locator('[data-testid="teams-library-page"]');
    await expect(pageRoot).toBeVisible({ timeout: 15_000 });

    // Action bar - title + subtitle + import + build CTAs.
    await expect(page.locator('[data-testid="teams-action-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="teams-import-cta"]')).toBeVisible();
    await expect(page.locator('[data-testid="teams-build-my-own-cta"]')).toBeVisible();

    // Total count subtitle. The label is i18n'd ("24 teams" in en-US),
    // so we assert via the data-testid containing the count token.
    const totalCount = page.locator('[data-testid="teams-total-count"]');
    await expect(totalCount).toBeVisible();
    await expect(totalCount).toContainText(String(EXPECTED_TOTAL), { timeout: 10_000 });

    // Standing Companies section header + 5 cards.
    const standingSection = page.locator('[data-testid="teams-group-standing"]');
    await expect(standingSection).toBeVisible();
    const standingCards = standingSection.locator('[data-card-variant="standing"]');
    await expect(standingCards).toHaveCount(EXPECTED_STANDING, { timeout: 10_000 });

    // Every expected standing card is in the DOM with the standing variant.
    for (const id of STANDING_IDS) {
      const card = page.locator(`[data-testid="team-card-${id}"]`);
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute('data-card-variant', 'standing');
    }

    // Teams section + 19 ad-hoc cards + Build-my-own at end.
    const teamsSection = page.locator('[data-testid="teams-group-teams"]');
    await expect(teamsSection).toBeVisible();
    const teamCards = teamsSection.locator('[data-card-variant="team"]');
    await expect(teamCards).toHaveCount(EXPECTED_TEAMS, { timeout: 10_000 });

    // BuildMyOwn card lives at the end of the Teams grid.
    await expect(page.locator('[data-testid="team-card-build-my-own"]')).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/results/teams-library-load.png', fullPage: true });
  });
});
