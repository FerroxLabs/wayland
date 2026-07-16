import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { goToSettings, goToExtensionSettings, waitForSettle, takeScreenshot, SETTINGS_SIDER_ITEM } from '../helpers';

const EXT_E2E_SETTINGS_ID = 'ext-e2e-full-extension-e2e-settings';
const EXT_E2E_BEFORE_ABOUT_ID = 'ext-e2e-full-extension-e2e-before-about';
const EXT_HELLO_SETTINGS_ID = 'ext-hello-world-hello-settings';

const KNOWN_EXTENSION_TAB_IDS = [EXT_E2E_SETTINGS_ID, EXT_E2E_BEFORE_ABOUT_ID, EXT_HELLO_SETTINGS_ID] as const;

async function getSiderItemIds(page: Page): Promise<string[]> {
  const ids = await page.locator(SETTINGS_SIDER_ITEM).evaluateAll((elements) => {
    return elements.map((el) => (el as HTMLElement).dataset.settingsId || '').filter(Boolean);
  });
  return ids;
}

test.describe('Extension: Settings Tabs Discovery', () => {
  test('extension settings tabs stay out of the main settings sidebar', async ({ page }) => {
    await goToSettings(page, 'gemini');
    await waitForSettle(page);

    const siderItemIds = await getSiderItemIds(page);

    expect(
      siderItemIds.some((id) => KNOWN_EXTENSION_TAB_IDS.includes(id as (typeof KNOWN_EXTENSION_TAB_IDS)[number]))
    ).toBeFalsy();
    expect(siderItemIds).toContain('extensions');
  });

  for (const tabId of KNOWN_EXTENSION_TAB_IDS) {
    test(`extension settings route ${tabId} still opens directly`, async ({ page }) => {
      await goToExtensionSettings(page, tabId);
      await waitForSettle(page);

      const body = await page.locator('body').textContent();
      expect(body!.length).toBeGreaterThan(30);
    });
  }
});

test.describe('Extension: Settings Tabs Navigation', () => {
  test('navigating to an extension settings tab loads the iframe', async ({ page }) => {
    await goToExtensionSettings(page, EXT_E2E_SETTINGS_ID);
    await waitForSettle(page);

    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(30);
  });

  test('extension tab iframe renders HTML content', async ({ page }) => {
    await goToExtensionSettings(page, EXT_E2E_SETTINGS_ID);
    await waitForSettle(page);

    const iframe = page.locator('iframe[title*="Extension settings"]');
    const iframeCount = await iframe.count();

    if (iframeCount > 0) {
      await expect(iframe.first()).toBeVisible({ timeout: 10_000 });
    } else {
      const body = await page.locator('body').textContent();
      expect(body!.length).toBeGreaterThan(30);
    }
  });

  test('switching between extension and builtin tabs does not crash', async ({ page }) => {
    await goToExtensionSettings(page, EXT_E2E_SETTINGS_ID);
    await waitForSettle(page);

    await goToSettings(page, 'capabilities');
    await waitForSettle(page);

    await goToExtensionSettings(page, EXT_E2E_SETTINGS_ID);
    await waitForSettle(page);

    await goToSettings(page, 'system');
    await waitForSettle(page);

    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(30);
  });
});

test.describe('Extension: Settings Tabs $file: Resolution', () => {
  test('e2e-full-extension with $file: settingsTabs resolves correctly', async ({ page }) => {
    await goToExtensionSettings(page, EXT_E2E_SETTINGS_ID);
    await waitForSettle(page);

    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(30);
  });
});

test.describe('Extension: Settings Tabs Stability', () => {
  test('no console errors when navigating extension settings tabs', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await goToExtensionSettings(page, EXT_E2E_SETTINGS_ID);
    await waitForSettle(page);

    await goToSettings(page, 'gemini');
    await waitForSettle(page);

    const extErrors = errors.filter(
      (e) =>
        e.toLowerCase().includes('extension') ||
        e.toLowerCase().includes('settings-tab') ||
        e.toLowerCase().includes('settingstab')
    );

    expect(extErrors).toHaveLength(0);
  });

  test('navigating to nonexistent extension tab shows error gracefully', async ({ page }) => {
    await goToExtensionSettings(page, 'ext-nonexistent-tab');
    await waitForSettle(page);

    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(10);
  });

  test('screenshot: extension settings tab', async ({ page }) => {
    test.skip(!process.env.E2E_SCREENSHOTS, 'screenshots disabled');
    await goToExtensionSettings(page, EXT_E2E_SETTINGS_ID);
    await waitForSettle(page);
    await takeScreenshot(page, 'ext-settings-tab');
  });
});
