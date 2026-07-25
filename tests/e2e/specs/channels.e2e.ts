/**
 * Channels settings index (route `/settings/channels`).
 *
 * Channels was lifted out of the WebUI settings tab into its own top-level
 * route (`Router.tsx` -> `/settings/channels`, `ChannelsIndex/index.tsx`).
 * The page is a card grid grouped into three "Tier" tabs; each card is an
 * `<article role="button">` whose accessible name carries the channel's
 * display name. Clicking a card routes to `/settings/channels/:id` where the
 * per-channel setup + disconnect UI lives - there are no inline toggle
 * switches on the index anymore, so the old `data-channel-switch-for`
 * assertions no longer apply.
 *
 * Covers:
 *  - The channels index renders on its own route with known cards.
 *  - Tier-1 mass-market channels (Telegram / Slack / Discord) are listed.
 *  - The Tier-2 tab reveals the regional channels (Lark / DingTalk).
 *  - Clicking a channel card navigates to that channel's detail route.
 */
import { test, expect } from '../fixtures';
import { goToChannelsTab, takeScreenshot } from '../helpers';
import type { Page } from '@playwright/test';

/** Match a channel card on the index by its visible display name. */
function channelCard(page: Page, name: string | RegExp) {
  return page.getByRole('button', { name }).first();
}

test.describe('Channels', () => {
  test('channels settings page renders', async ({ page }) => {
    await goToChannelsTab(page);
    await expect(channelCard(page, /Telegram/i)).toBeVisible({ timeout: 8_000 });
  });

  test('known tier-1 channels are listed', async ({ page }) => {
    await goToChannelsTab(page);

    // Telegram / Slack / Discord all live in Tier 1, which is the default tab.
    for (const name of [/Telegram/i, /Slack/i, /Discord/i]) {
      await expect(channelCard(page, name)).toBeVisible({ timeout: 8_000 });
    }
  });

  test('tier-2 tab reveals regional channels', async ({ page }) => {
    await goToChannelsTab(page);

    // Lark / DingTalk are Tier-2 entries and only render once the Tier 2 tab
    // is active. Click the tab by its title, then assert the cards mount.
    const tier2Tab = page.locator('.arco-tabs-header-title').filter({ hasText: /Tier 2/i }).first();
    await tier2Tab.waitFor({ state: 'visible', timeout: 8_000 });
    await tier2Tab.click();

    await expect(channelCard(page, /Lark/i)).toBeVisible({ timeout: 8_000 });
    await expect(channelCard(page, /DingTalk/i)).toBeVisible({ timeout: 8_000 });
  });

  test('clicking a channel card opens its detail route', async ({ page }) => {
    await goToChannelsTab(page);

    // The channels page persists its Arco tab selection across SPA navigations,
    // so a prior test may have left a non-Tier-1 tab active. Telegram is a
    // Tier-1 entry - make sure Tier 1 is active before selecting its card.
    await page.locator('.arco-tabs-header-title').filter({ hasText: /Tier 1/i }).first().click();

    await channelCard(page, /Telegram/i).click();

    // The card navigates to `/settings/channels/telegram`; assert the hash
    // route settled and the detail shell rendered its Telegram title.
    await page.waitForFunction(() => window.location.hash.includes('/settings/channels/telegram'), undefined, {
      timeout: 8_000,
    });
    await expect(page.getByText(/Telegram/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('screenshot: channels settings', async ({ page }) => {
    test.skip(!process.env.E2E_SCREENSHOTS, 'screenshots disabled');
    await goToChannelsTab(page);
    await takeScreenshot(page, 'channels-settings');
  });
});
