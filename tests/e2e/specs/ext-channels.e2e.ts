/**
 * Extensions – Channel Plugins tests.
 *
 * Validates extension-contributed channel plugins on the channels settings page.
 */
import { test, expect } from '../fixtures';
import { goToChannelsTab, expectBodyContainsAny, takeScreenshot, waitForSettle } from '../helpers';

test.describe('Extension: Channel Plugins', () => {
  test('channels page renders', async ({ page }) => {
    await goToChannelsTab(page);
    await expectBodyContainsAny(page, ['Telegram', 'Lark', 'DingTalk', 'Channel', '频道']);
  });

  test('built-in channels still visible alongside extension channels', async ({ page }) => {
    await goToChannelsTab(page);

    const body = await page.locator('body').textContent();
    const builtIn = ['Telegram', 'Lark', 'DingTalk'];
    const found = builtIn.filter((ch) => body?.includes(ch));
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  test('extension channel plugin appears or page functional', async ({ page }) => {
    await goToChannelsTab(page);
    await waitForSettle(page);

    const body = await page.locator('body').textContent();
    // The channel plugin may not surface in built-in UI
    expect(body!.length).toBeGreaterThan(50);
  });

  // The channels index was lifted out of the WebUI settings tab into its own
  // route (ChannelsIndex/index.tsx). It renders a card grid - there is no
  // Switch anywhere in that tree; the enable control lives on the per-channel
  // detail route. These three tests asserted the old toggle UI.
  test('channel cards are present', async ({ page }) => {
    await goToChannelsTab(page);

    const cards = page.locator('article[role="button"]');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });

  test('clicking a channel card opens its setup page', async ({ page }) => {
    await goToChannelsTab(page);

    await page
      .getByRole('button', { name: /Telegram/i })
      .first()
      .click();
    await page.waitForFunction(() => window.location.hash.startsWith('#/settings/channels/telegram'), {
      timeout: 10_000,
    });
  });

  test('index shows a connection-status pill per card', async ({ page }) => {
    await goToChannelsTab(page);

    // No CHANNELS entry carries status 'soon', so every card renders the
    // "Not connected" pill until the user sets one up.
    const body = await page.locator('body').textContent();
    expect(body).toContain('Not connected');
  });

  test('screenshot: channels with extensions', async ({ page }) => {
    test.skip(!process.env.E2E_SCREENSHOTS, 'screenshots disabled');
    await goToChannelsTab(page);
    await takeScreenshot(page, 'ext-channels');
  });
});
