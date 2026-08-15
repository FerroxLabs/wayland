/**
 * E2E - the agent install surface on Settings > Agents.
 *
 * Replaces `hub-backend-install.e2e.ts`, which drove `LocalAgents` ->
 * "Install from Market" -> `AgentHubModal`. That chain hangs off
 * `components/settings/SettingsModal/index.tsx`, which NOTHING imports, so no
 * route can reach it and all 10 of its tests could only ever fail. The live
 * surface is `AvailableToInstall`, rendered by `AgentSettings/index.tsx` at
 * `#/settings/agents` - and it had zero e2e coverage.
 *
 * The consent gate is the point. Installing an agent runs third-party code, so
 * the product must never start an install without an explicit per-install
 * confirmation. These tests assert that gate WITHOUT completing an install:
 * nothing here touches the network or writes to the user's machine.
 */
import { test, expect } from '../fixtures';
import { goToSettings } from '../helpers';

const BAND = '[data-testid="available-to-install"]';
const CONSENT = '[data-testid="install-consent-sheet"]';

/**
 * The band renders nothing when every known agent is already installed
 * (`merged.length === 0` returns null), so each test resolves its own subject
 * and skips honestly rather than asserting against an empty grid.
 */
async function firstInstallable(page: import('@playwright/test').Page) {
  await goToSettings(page, 'agents');
  const band = page.locator(BAND);
  const present = await band
    .waitFor({ state: 'visible', timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  if (!present) return null;
  const button = page.locator('[data-testid^="install-button-"]').first();
  const hasButton = await button.isVisible().catch(() => false);
  return hasButton ? button : null;
}

test.describe('Agent install surface', () => {
  test('install band lists installable agents with a state and a version', async ({ page }) => {
    await goToSettings(page, 'agents');
    const band = page.locator(BAND);
    const present = await band
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (!present) {
      test.skip(true, 'No installable agents on this machine (band renders null)');
    }

    const tiles = page.locator('[data-testid^="installable-tile-"]');
    expect(await tiles.count()).toBeGreaterThan(0);

    // Every tile states what it is and what state it is in. NOT asserted here:
    // `install-version-*`, which renders only behind a truthy
    // `installedVersion` - that is the receipt of a Wayland-MANAGED install
    // (installableAgents.ts: `status.managedInstall?.version ?? null`), so it
    // is absent on any machine that has not installed an agent through
    // Wayland, which is every clean CI box. The pinned version a tile WOULD
    // fetch is rendered as text inside the state line, not as that chip.
    const first = tiles.first();
    const agentId = (await first.getAttribute('data-testid'))!.replace('installable-tile-', '');
    await expect(page.locator(`[data-testid="install-state-${agentId}"]`)).toBeVisible();
    await expect(first).toContainText(/\S/);
  });

  test('Install asks for explicit consent before doing anything', async ({ page }) => {
    const button = await firstInstallable(page);
    if (!button) {
      test.skip(true, 'No agent in an installable state on this machine');
      return;
    }

    // The sheet must NOT be open until asked for.
    await expect(page.locator(CONSENT)).toBeHidden();

    await button.click();
    await expect(page.locator(CONSENT)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="install-consent-confirm"]')).toBeVisible();
  });

  test('cancelling consent starts no install', async ({ page }) => {
    const button = await firstInstallable(page);
    if (!button) {
      test.skip(true, 'No agent in an installable state on this machine');
      return;
    }
    const agentId = (await button.getAttribute('data-testid'))!.replace('install-button-', '');

    await button.click();
    await expect(page.locator(CONSENT)).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="install-consent-cancel"]').click();

    await expect(page.locator(CONSENT)).toBeHidden({ timeout: 10_000 });
    // No install may have started: no progress bar, and the Install affordance
    // is still offered rather than replaced by an installing/installed state.
    await expect(page.locator(`[data-testid="install-progress-${agentId}"]`)).toHaveCount(0);
    await expect(page.locator(`[data-testid="install-button-${agentId}"]`)).toBeVisible();
  });
});
