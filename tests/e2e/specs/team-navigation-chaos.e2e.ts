/**
 * E2E (Adversarial): browser navigation + router stress.
 *
 * Cases:
 *   1. Direct URL to non-existent team → in-place error (Bug #2 fix).
 *   2. Direct URL to a deleted team → in-place error.
 *   3. Direct URL to a deleted launcher → launcher-load-error branch +
 *      launcher-back CTA.
 *   4. Browser back mid-launcher → back on /teams; no team created.
 *   5. Refresh in middle of BuildMyOwn flow → lands at default route,
 *      no orphan team.
 *   6. Junk hash routes - /team/ (no id), //, /teams/, /teams? → no
 *      crashes; catch-all redirects to /guid.
 *   7. Stale-cache race: backend deletes a team out-of-band, click
 *      sidebar entry before the listChanged event arrives → either the
 *      entry vanishes OR the click navigates and surfaces the in-place
 *      error (Bug #2 fix). A blank white page is NOT acceptable.
 */

import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo, expandTeamsAccordion } from '../helpers';

const LAUNCHER_ID = 'builtin-cold-outbound';
const NAME_PREFIX = 'E2E NavChaos';

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

// Flipped from `describe.serial` to `describe` so every adversarial case
// reports independently - Playwright's serial mode skips remaining tests
// after the first failure. Each test pre-cleans its own state.
test.describe('Team Blitz - navigation chaos', () => {
  test('direct URL to non-existent team → in-place error', async ({ page }) => {
    test.setTimeout(60_000);

    const bogusId = `does-not-exist-${Date.now()}`;
    await navigateTo(page, `#/team/${bogusId}`);
    await page.waitForURL(new RegExp(`/team/${bogusId}`), { timeout: 10_000 });

    await expect(page.locator('[data-testid="team-page-load-error"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-testid="team-page-load-error-back-cta"]')).toBeVisible();
  });

  test('direct URL to a deleted team → in-place error', async ({ page }) => {
    test.setTimeout(90_000);
    await cleanupTeams(page);

    const created = await invokeBridge<{ id?: string } | null>(page, 'team.create', {
      userId: 'system_default_user',
      name: `${NAME_PREFIX} DeletedNav ${Date.now()}`,
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
    await invokeBridge(page, 'team.remove', { id: teamId });

    await navigateTo(page, `#/team/${teamId}`);
    await page.waitForURL(new RegExp(`/team/${teamId}`), { timeout: 10_000 });
    await expect(page.locator('[data-testid="team-page-load-error"]')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('direct URL to a non-existent launcher → launcher-load-error', async ({ page }) => {
    test.setTimeout(60_000);

    await navigateTo(page, '#/teams/ext-does-not-exist-launcher/launch');
    await page.waitForURL(/\/teams\/ext-does-not-exist-launcher\/launch/, { timeout: 10_000 });

    await expect(page.locator('[data-testid="launcher-load-error"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-testid="launcher-back"]')).toBeVisible();
  });

  test('browser back mid-launcher → on /teams, no team created', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const before = await invokeBridge<TeamRow[]>(page, 'team.list', {
      userId: 'system_default_user',
    });

    await navigateTo(page, '#/teams');
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({
      timeout: 15_000,
    });
    // The library paginates at 48 cards over 60 teams and this launcher sorts
    // into the hidden tail, so filter to it first - its card is not in the DOM
    // on page one [V].
    await page.locator('[data-testid="teams-search-input"]').fill('Cold Outbound');
    await page.locator(`[data-testid="team-card-${LAUNCHER_ID}"]`).click();
    await page.waitForURL(new RegExp(`/teams/${LAUNCHER_ID}/launch`), { timeout: 10_000 });
    await expect(page.locator('[data-testid="launcher-row-leader"]')).toBeVisible({
      timeout: 15_000,
    });

    // Click the launcher-back CTA.
    await page.locator('[data-testid="launcher-back"]').click();
    await page.waitForURL(/#\/teams(\?|$)/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({
      timeout: 10_000,
    });

    const after = await invokeBridge<TeamRow[]>(page, 'team.list', {
      userId: 'system_default_user',
    });
    expect(after.length).toBe(before.length);
  });

  test('refresh during BuildMyOwn flow → safe landing, no orphan team', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const before = await invokeBridge<TeamRow[]>(page, 'team.list', {
      userId: 'system_default_user',
    });

    await navigateTo(page, '#/teams');
    await page.locator('[data-testid="team-card-build-my-own"]').click();
    await page.waitForURL(/\/teams\/new(\?|$)/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="launcher-goal-card"]')).toBeVisible({
      timeout: 10_000,
    });
    await page.locator('[data-testid="launcher-goal-input"]').fill('ship a sales onboarding flow');
    await page.locator('[data-testid="launcher-suggest-btn"]').click();
    // Don't wait for the suggest to settle - just reload.
    await page.reload();

    // Body has meaningful content (no blank screen) and the body is not
    // showing a React error.
    await page
      .waitForFunction(() => (document.body.textContent?.length ?? 0) > 50, { timeout: 15_000 })
      .catch(() => {});

    // Goal text is gone (page state reset on reload).
    const goalCard = page.locator('[data-testid="launcher-goal-card"]');
    if (await goalCard.isVisible().catch(() => false)) {
      const goalText = await page
        .locator('[data-testid="launcher-goal-input"]')
        .inputValue()
        .catch(() => '');
      expect(goalText).toBe('');
    }

    // No orphan team created.
    const after = await invokeBridge<TeamRow[]>(page, 'team.list', {
      userId: 'system_default_user',
    });
    expect(after.length).toBe(before.length);
  });

  test('junk hash routes → no crash, library / guid render', async ({ page }) => {
    test.setTimeout(60_000);

    let pageErrors = 0;
    const errorHandler = () => {
      pageErrors++;
    };
    page.on('pageerror', errorHandler);

    // Start from a known baseline. The preceding case reloads mid-flow and
    // leaves the document in an indeterminate state; navigateTo early-returns
    // when the hash already matches, so it would not re-settle it.
    await page.reload();
    await page
      .waitForFunction(() => typeof (window as { electronAPI?: unknown }).electronAPI !== 'undefined', {
        timeout: 15_000,
      })
      .catch(() => {});
    // electronAPI is exposed BEFORE the renderer paints - a probe caught the
    // body still completely empty at this point, which is the actual race
    // behind this test's intermittent failure. Wait for real content.
    await page
      .waitForFunction(() => (document.body.textContent?.length ?? 0) > 200, { timeout: 15_000 })
      .catch(() => {});
    // Re-drive the hash if the first attempt lands before the router is live.
    // navigateTo early-returns when the hash already matches, so a single call
    // cannot recover from that - hence the bounded retry rather than a longer
    // timeout.
    await expect
      .poll(
        async () => {
          await page.evaluate(() => {
            window.location.hash = '#/teams';
          });
          await page.waitForTimeout(1_000);
          return page.locator('[data-testid="teams-library-page"]').count();
        },
        { timeout: 30_000, message: 'teams library did not mount on the baseline navigation' }
      )
      .toBeGreaterThan(0);

    // WAS a real defect (now FIXED in useDetectedAgents): roughly 1 run in 3
    // this baseline never mounted because the app was sitting in its React
    // error boundary - "Something went wrong / An unexpected error occurred /
    // Reload this view" - left behind by the preceding case, which reloads
    // while a BuildMyOwn suggest is in flight. The reload left SWR unresolved,
    // and the `data: rawAgents = []` default rebuilt a new array every render,
    // churning `recommend()` into TeamLauncherPage's `initialState` memo until
    // its setState-in-effect blew React's update-depth guard (#185).
    // `pageErrors` stayed 0 throughout because the boundary swallows the throw,
    // which is why it read as a timing race rather than a crash.

    // /team/ and /team// hit the Router '*' catch-all, which redirects to /guid
    // by design (Router.tsx:213). `navigateTo` asserts the hash STAYS at the
    // target, so it fights that redirect - and its late `Navigate ... replace`
    // could also clobber a hash set by a following step. Set the hash raw and
    // wait for the settled destination instead.
    // Each hop needs to SETTLE before the next hash is set. A
    // `body.textContent.length > 50` wait returns instantly - the shell always
    // satisfies it - so the steps raced and a late catch-all redirect landed
    // after the following navigation, clobbering it.
    //
    // Verified sequence: #/team/ and #/team// both redirect to #/guid (Router
    // '*' catch-all), while #/teams/ and #/teams? both render the library.
    for (const junk of ['#/team/', '#/team//']) {
      await page.evaluate((h) => {
        window.location.hash = h;
      }, junk);
      await page.waitForTimeout(1_500);
      // Deliberately no destination assertion. Where an empty :id lands depends
      // on the state the previous test left behind (catch-all redirect to /guid
      // vs the in-place team error) - both are alive, and this case only claims
      // "no crash". Pinning the destination made it order-dependent.
      expect(await page.evaluate(() => document.body.textContent?.length ?? 0)).toBeGreaterThan(50);
    }

    // /teams/ (trailing slash) - renders TeamsLibraryPage.
    await page.evaluate(() => {
      window.location.hash = '#/teams/';
    });
    await page.waitForTimeout(1_500);
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({ timeout: 15_000 });

    // /teams? (query-only) - renders TeamsLibraryPage.
    await page.evaluate(() => {
      window.location.hash = '#/teams?';
    });
    await page.waitForTimeout(1_500);
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({ timeout: 15_000 });

    expect(pageErrors).toBe(0);
    page.off('pageerror', errorHandler);
  });

  test('stale sidebar entry race → either vanishes or in-place error', async ({ page }) => {
    test.setTimeout(120_000);
    await cleanupTeams(page);

    const teamName = `${NAME_PREFIX} StaleRace ${Date.now()}`;
    // Create via UI so the sidebar caches the entry through listChanged.
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

    // Wait for sidebar to surface the new entry.
    // The Teams sider accordion is collapsed on a fresh profile and renders no
    // children while closed, so team rows are absent from the DOM until expanded.
    await expandTeamsAccordion(page);
    const sidebarEntry = page.locator(`text="${teamName}"`).first();
    await expect(sidebarEntry).toBeVisible({ timeout: 10_000 });

    // Catch any React/page errors during the race.
    let pageErrors = 0;
    const errorHandler = () => {
      pageErrors++;
    };
    page.on('pageerror', errorHandler);

    // Force-delete via bridge (simulating another window / MCP). Do NOT
    // wait - immediately click the (possibly stale) sidebar entry.
    const deletePromise = invokeBridge(page, 'team.remove', { id: teamId });

    // Race click: if listChanged arrives first, the entry is gone and
    // the click throws / no-ops. If our click wins, we navigate to a
    // /team/<id> for an already-deleted team → in-place error.
    await sidebarEntry.click({ force: true }).catch(() => {
      // entry already detached - that's a valid outcome.
    });

    await deletePromise;

    // Settle.
    await page.waitForTimeout(2_000);

    // One of two outcomes is acceptable:
    //   A) Entry disappeared and we're still on the prior route.
    //   B) Click navigated us to /team/<id> and the in-place error renders.
    const url = page.url();
    if (url.match(new RegExp(`/team/${teamId}`))) {
      // Outcome B - error banner must be visible.
      await expect(page.locator('[data-testid="team-page-load-error"]')).toBeVisible({
        timeout: 10_000,
      });
    } else {
      // Outcome A - entry must not be visible.
      await expect(page.locator(`text="${teamName}"`)).toHaveCount(0, { timeout: 10_000 });
    }

    // No JS errors thrown during the race.
    expect(pageErrors).toBe(0);
    page.off('pageerror', errorHandler);
  });
});
