/**
 * E2E: Launchpad customisation flow.
 *
 * Validates the editable LaunchpadBar end-to-end:
 *   1. Add - open picker, pick an unpinned assistant, card lands at end of bar.
 *   2. Remove - click × on a card, card disappears + bar order is persisted.
 *   3. Persistence - reload the page, customisations survive.
 *
 * The bar state lives under ConfigStorage key `launchpad.barOrder`. We
 * clear it at the start of each test (via the invokeBridge helper) so
 * the bar starts from defaults; the persistence test reads the key
 * back after reload to assert the user's mutation survived.
 *
 * Drag/drop reorder is exercised by unit tests + the dnd-kit library's
 * own e2e - Playwright drag synthesis on a sortable grid is flakey
 * across CI environments and the unit tests already cover the
 * arrayMove path; this spec sticks to add/remove/persistence which are
 * the load-bearing user flows.
 *
 * Selectors:
 *   - [data-quicklaunch-id]              - bar card body buttons (inner)
 *   - [data-launchpad-entry]             - bar card wrapper (outer, holds dnd attrs)
 *   - [data-testid="launchpad-add-chip"] - the + chip at end of bar
 *   - [data-testid="launchpad-picker"]   - the picker drawer (mounted on +)
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo, ROUTES } from '../helpers';

const CARD = '[data-quicklaunch-id]';
const ADD_CHIP = '[data-testid="launchpad-add-chip"]';
const PICKER = '[data-testid="launchpad-picker"]';
const PICKER_SEARCH = '[data-testid="launchpad-picker-search"]';

async function ensureColdStartGuid(page: import('@playwright/test').Page) {
  await navigateTo(page, ROUTES.guid);
  await invokeBridge(page, 'agent.config.storage.set', { key: 'guid.lastSelectedAgent', data: '' });
  // Wipe any prior customisation so each test starts from defaults.
  await invokeBridge(page, 'agent.config.storage.set', { key: 'launchpad.barOrder', data: null });
  await page.reload();
  // Cold-launch boot can take longer than the default 10s on a fresh worker;
  // mirror what launchpad-quick-launch.e2e.ts waits for (the inner button).
  await page.locator(CARD).first().waitFor({ state: 'visible', timeout: 30_000 });
}

test.describe('Launchpad customisation - add / remove / persist', () => {
  test('shows the + chip and the 6 default cards on cold-start', async ({ page }) => {
    await ensureColdStartGuid(page);
    await expect(page.locator(CARD)).toHaveCount(6);
    await expect(page.locator(ADD_CHIP)).toBeVisible();
  });

  test('clicking + opens the picker drawer with the search input', async ({ page }) => {
    await ensureColdStartGuid(page);
    await page.locator(ADD_CHIP).click();

    await expect(page.locator(PICKER)).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(PICKER_SEARCH)).toBeVisible();
  });

  test('removing a card drops it from the bar and persists', async ({ page }) => {
    await ensureColdStartGuid(page);

    // Hover the card so the remove button reveals (CSS uses :hover/:focus-within).
    const quietMoney = page.locator(`${CARD}[data-quicklaunch-id="ext-quiet-money"]`);
    await quietMoney.hover();

    const removeBtn = page.locator('[data-testid="launchpad-remove-ext-quiet-money"]');
    await removeBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await removeBtn.click({ force: true });

    await expect(page.locator(CARD)).toHaveCount(5);
    await expect(page.locator(`${CARD}[data-quicklaunch-id="ext-quiet-money"]`)).toHaveCount(0);

    // Persistence: reload the page and verify the bar still has 5 cards.
    await page.reload();
    await page.locator(CARD).first().waitFor({ state: 'visible', timeout: 30_000 });
    await expect(page.locator(CARD)).toHaveCount(5);
    await expect(page.locator(`${CARD}[data-quicklaunch-id="ext-quiet-money"]`)).toHaveCount(0);

    // And the value is persisted under the canonical key.
    const stored = await invokeBridge<string[]>(page, 'agent.config.storage.get', 'launchpad.barOrder');
    expect(Array.isArray(stored)).toBe(true);
    expect(stored).not.toContain('ext-quiet-money');
  });

  test('adding an assistant from the picker appends it to the bar', async ({ page }) => {
    await ensureColdStartGuid(page);

    // Open the picker.
    await page.locator(ADD_CHIP).click();
    await page.locator(PICKER).waitFor({ state: 'visible', timeout: 5_000 });

    // Find an unpinned card in the picker. The picker enumerates the
    // catalogue; the exact set depends on the install's extensions, so
    // we walk the grid and pick the first card with data-pinned="false".
    const unpinnedCards = page.locator('[data-testid^="launchpad-picker-card-"][data-pinned="false"]');
    const unpinnedCount = await unpinnedCards.count();
    test.skip(
      unpinnedCount === 0,
      'no unpinned assistants in the picker - install lacks extensions beyond the default 6'
    );

    const firstUnpinned = unpinnedCards.first();
    const cardTestId = await firstUnpinned.getAttribute('data-testid');
    expect(cardTestId).toBeTruthy();
    const pickedId = cardTestId!.replace('launchpad-picker-card-', '');

    const initialBarCount = await page.locator(CARD).count();
    await firstUnpinned.click();

    // The bar should now contain the picked card at the end.
    await expect(page.locator(CARD)).toHaveCount(initialBarCount + 1);
    await expect(page.locator(`${CARD}[data-quicklaunch-id="${pickedId}"]`)).toBeVisible();
  });
});
