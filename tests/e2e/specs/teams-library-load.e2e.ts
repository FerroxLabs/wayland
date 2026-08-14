/**
 * E2E (A1): /teams library page renders the native built-in catalog.
 *
 * Boots the app, navigates to /teams, and asserts the two-section layout
 * (Standing Companies + Teams) against the shipped catalog.
 *
 * Ground truth is `src/process/resources/builtin-catalog/assistants.json`:
 * 88 records, of which 60 are `kind: "team"` - 7 with `standing: true` and 53
 * ad-hoc. The teams no longer ship as extension contributions, so their ids
 * carry the native `builtin-` prefix rather than `ext-`; this spec asserts the
 * slug and tolerates either prefix so a future re-homing does not silently
 * turn into a red suite.
 *
 * The grid is paginated at DEFAULT_CATALOG_PAGE_SIZE = 48 over the combined
 * [...standing, ...teams] list, so page one holds all 7 standing cards and the
 * first 41 ad-hoc ones. Asserting the full 53 here would fail on a window that
 * is working exactly as designed.
 *
 * Source of truth for testids: `TeamsLibraryPage.tsx` (which passes `testId` /
 * `countTestId` through `PageShell`), `TeamCard.tsx`, `BuildMyOwnTeamCard.tsx`.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

/** Every `standing: true` record in the shipped catalog, by bare slug. */
const STANDING_SLUGS = [
  'quiet-money-standing',
  'marketing-agency',
  'sales-org',
  'customer-success-org',
  'editorial-newsroom',
  'dev-shop',
  'book-publishing-house',
];

const EXPECTED_TOTAL = 60;
const EXPECTED_STANDING = STANDING_SLUGS.length;
/** Page one: 48-item window minus the 7 standing cards that lead the list. */
const EXPECTED_TEAMS_ON_PAGE_ONE = 48 - EXPECTED_STANDING;

/** Strip whichever catalog prefix a card id carries, so we compare slugs. */
const toSlug = (testId: string): string =>
  testId.replace(/^team-card-/, '').replace(/^(?:builtin-|ext-)/, '');

test.describe('Teams Library - load', () => {
  test('renders Standing Companies + Teams sections from the built-in catalog', async ({ page }) => {
    test.setTimeout(60_000);

    // Settle the renderer's bridge layer before navigating - matches the
    // pattern used by team-empty-state / team-communication specs. Without
    // this, ProtectedLayout can redirect us to /login mid-navigation while
    // the auth check is still resolving on first paint.
    await invokeBridge(page, 'team.list', { userId: 'system_default_user' }).catch(() => undefined);

    await navigateTo(page, '#/teams');
    await page.waitForURL(/#\/teams(\?|$)/, { timeout: 10_000 });

    const pageRoot = page.locator('[data-testid="teams-library-page"]');
    await expect(pageRoot).toBeVisible({ timeout: 15_000 });

    // Header actions. There is no wrapper testid - PageShell renders the two
    // buttons directly into its actions slot - so assert the buttons.
    await expect(page.locator('[data-testid="teams-import-cta"]')).toBeVisible();
    await expect(page.locator('[data-testid="teams-build-my-own-cta"]')).toBeVisible();

    // Total count is the FULL catalog (60), not the paginated window.
    const totalCount = page.locator('[data-testid="teams-total-count"]');
    await expect(totalCount).toBeVisible();
    await expect(totalCount).toContainText(String(EXPECTED_TOTAL), { timeout: 10_000 });

    // Standing Companies: all 7 fit inside page one.
    const standingSection = page.locator('[data-testid="teams-group-standing"]');
    await expect(standingSection).toBeVisible();
    const standingCards = standingSection.locator('[data-card-variant="standing"]');
    await expect(standingCards).toHaveCount(EXPECTED_STANDING, { timeout: 10_000 });

    // Every standing company is present, compared as a set so ordering (which
    // the sort control owns) is not baked into this assertion.
    const renderedSlugs = await standingCards.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-testid') ?? '')
    );
    expect(renderedSlugs.map(toSlug).sort()).toEqual([...STANDING_SLUGS].sort());

    // Teams section: the remainder of the 48-item page-one window.
    const teamsSection = page.locator('[data-testid="teams-group-teams"]');
    await expect(teamsSection).toBeVisible();
    const teamCards = teamsSection.locator('[data-card-variant="team"]');
    await expect(teamCards).toHaveCount(EXPECTED_TEAMS_ON_PAGE_ONE, { timeout: 10_000 });

    // The rest are reachable, not lost: the pagination control must be offering
    // the remaining cards rather than the grid having silently truncated.
    await expect(page.locator('[data-testid="teams-load-more-status"]')).toBeVisible();

    // BuildMyOwn card lives at the end of the Teams grid.
    await expect(page.locator('[data-testid="team-card-build-my-own"]')).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/results/teams-library-load.png', fullPage: true });
  });
});
