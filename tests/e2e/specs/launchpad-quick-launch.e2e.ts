/**
 * E2E: Launchpad quick-launch cards (cold-start /guid).
 *
 * Validates the 6-card LaunchpadBar surface end-to-end:
 *   1. Cold-start /guid renders exactly 6 cards with Cowork as the place-anchor.
 *   2. Clicking "Write copy" enters preset mode (hero header mounts + prefill).
 *   3. Clicking "Cowork" enters preset mode with the Cowork name in the hero.
 *
 * Why the hero header and not PresetAgentTag?
 *   GuidPage.tsx hardcodes `hidePresetTag` on its GuidActionRow render - when
 *   the page enters preset mode the assistant identity is surfaced via the
 *   `heroHeader` (assistant title + avatar + back chevron) sitting ABOVE the
 *   input, not via the action-row chip. `PresetAgentTag` only mounts when
 *   another surface opts back in (e.g. a future drawer). We still add a
 *   `data-testid='preset-agent-tag'` to that component so the few surfaces
 *   that DO show it can be selected, but the launchpad UI signal under this
 *   design is the hero. Asserting the hero is the truthful test.
 *
 * Selectors:
 *   - [data-quicklaunch-id="<assistantId>"] - card buttons (rendered by
 *     LaunchpadBar; data-quicklaunch-id now carries the runtime assistantId,
 *     e.g. 'builtin-cowork' or 'ext-copy' - same value the bar uses for its
 *     sortable key and persists in app_config under `launchpad.barOrder`).
 *   - [class*="heroHeader"]             - preset-mode hero block (CSS module
 *     hash-suffixed; `*=` match survives renames of the source class)
 *   - [class*="heroTitle"]              - preset assistant name inside the hero
 *   - textarea.arco-textarea            - the visible Arco input (NOT a bare
 *     `'textarea'`; per `kickoff-card.e2e.ts` notes the bare selector matches
 *     a hidden Arco autosize-measurement textarea).
 *
 * Per Sean's `feedback-playwright-cdp-for-electron-verify`: interactions go
 * through Playwright's real click driver, never synthetic dispatchEvent.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo, ROUTES } from '../helpers';

const QL_CARD = '[data-quicklaunch-id]';
const HERO_HEADER = '[class*="heroHeader"]';
const HERO_TITLE = '[class*="heroTitle"]';
const GUID_TEXTAREA = 'textarea.arco-textarea';

/**
 * The Electron user-data dir is NOT isolated per E2E run (fixtures only
 * sandbox the extension-states file), so a prior session's
 * `guid.lastSelectedAgent` persists and pushes the page into preset mode -
 * which hides the QuickLaunchRow we are validating. Clear the key, then
 * reload so `useGuidAgentSelection.restoreSavedSelection` sees no saved
 * preference and falls back to the first non-preset CLI agent (which
 * leaves `isPresetAgent === false` and mounts the launchpad).
 */
async function ensureColdStartGuid(page: import('@playwright/test').Page) {
  await navigateTo(page, ROUTES.guid);
  await invokeBridge(page, 'agent.config.storage.set', { key: 'guid.lastSelectedAgent', data: '' });
  // Reset bar customisation so a prior test in this session can't influence
  // the default-6 count assertion below.
  await invokeBridge(page, 'agent.config.storage.set', { key: 'launchpad.barOrder', data: null });
  await page.reload();
}

test.describe('Launchpad quick-launch row - cold-start /guid', () => {
  test('renders 6 quick-launch cards on cold-start, Cowork is first', async ({ page }) => {
    await ensureColdStartGuid(page);
    await page.locator(QL_CARD).first().waitFor({ state: 'visible', timeout: 10_000 });

    await expect(page.locator(QL_CARD)).toHaveCount(6);

    const first = page.locator(QL_CARD).first();
    await expect(first).toHaveAttribute('data-quicklaunch-id', 'builtin-cowork');
  });

  test('clicking "Write copy" card enters preset mode and prefills input', async ({ page }) => {
    await ensureColdStartGuid(page);
    const card = page.locator('[data-quicklaunch-id="ext-copy"]');
    await card.waitFor({ state: 'visible', timeout: 10_000 });
    await card.click();

    // Preset-mode signal: hero header mounts (replaces the launchpad).
    await expect(page.locator(HERO_HEADER).first()).toBeVisible({ timeout: 5_000 });

    const inputValue = await page.locator(GUID_TEXTAREA).first().inputValue();
    expect(inputValue).toContain('Draft me');
  });

  test('clicking "Cowork" card enters preset mode with Cowork in the hero', async ({ page }) => {
    await ensureColdStartGuid(page);
    const card = page.locator('[data-quicklaunch-id="builtin-cowork"]');
    await card.waitFor({ state: 'visible', timeout: 10_000 });
    await card.click();

    await expect(page.locator(HERO_HEADER).first()).toBeVisible({ timeout: 5_000 });

    const heroText = await page.locator(HERO_TITLE).first().textContent();
    expect(heroText?.toLowerCase()).toContain('cowork');
  });
});
