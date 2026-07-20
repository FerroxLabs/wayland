/**
 * Navigation – route transitions and sidebar.
 *
 * Ensures the app can navigate between the guid/chat page and all
 * settings sub-pages without errors.
 */
import { test, expect } from '../fixtures';
import { goToGuid, goToSettings, ROUTES, expectUrlContains, takeScreenshot, type SettingsTab } from '../helpers';
import classicJourneyBaseline from '../../../contracts/recovery/classic-journey-baseline.json';

type ClassicBaselineRoute = { id: string; kind: 'guid' | 'settings'; tab?: string };
const CLASSIC_CURRENT_ROUTES = classicJourneyBaseline.currentRoutes as ClassicBaselineRoute[];

// ── Guid Page ────────────────────────────────────────────────────────────────

test.describe('Guid Page', () => {
  test('navigates to guid page', async ({ page }) => {
    await goToGuid(page);
    await expectUrlContains(page, 'guid');
  });

  test('chat input area is present', async ({ page }) => {
    await goToGuid(page);
    const textarea = page.locator('textarea, [contenteditable="true"], [role="textbox"]').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });
  });

  test('can type in chat input', async ({ page }) => {
    await goToGuid(page);
    const input = page.locator('textarea, [contenteditable="true"], [role="textbox"]').first();
    await input.click();
    await input.fill('E2E test message');
    const value = await input.inputValue().catch(() => input.textContent());
    expect(value).toContain('E2E test');
  });

  test('screenshot: guid page', async ({ page }) => {
    test.skip(!process.env.E2E_SCREENSHOTS, 'screenshots disabled');
    await goToGuid(page);
    await takeScreenshot(page, 'guid-page', { fullPage: true });
  });
});

// ── Settings Pages ───────────────────────────────────────────────────────────

test.describe('Settings Pages', () => {
  const tabs: { tab: SettingsTab; name: string }[] = [
    { tab: 'assistants', name: 'Assistants Settings' },
    { tab: 'skills', name: 'Skills & Tools Settings' },
    { tab: 'commands', name: 'Slash Commands Settings' },
    { tab: 'constitution', name: 'Constitution Settings' },
    { tab: 'models', name: 'Models Settings' },
    { tab: 'agents', name: 'Agents Settings' },
    { tab: 'images', name: 'Image Generation Settings' },
    { tab: 'voice', name: 'Voice Settings' },
    { tab: 'wcore', name: 'Wayland Core Settings' },
    { tab: 'webui', name: 'WebUI Settings' },
    { tab: 'channels', name: 'Channels Settings' },
    { tab: 'mcp-library', name: 'MCP Library' },
    { tab: 'extensions', name: 'Extensions Settings' },
    { tab: 'migrate', name: 'Migration Settings' },
    { tab: 'theme', name: 'Theme & Display Settings' },
    { tab: 'editor', name: 'Editor Settings' },
    { tab: 'navigation', name: 'Navigation Settings' },
    { tab: 'general', name: 'General Settings' },
    { tab: 'notifications', name: 'Notifications Settings' },
    { tab: 'storage', name: 'Storage Settings' },
    { tab: 'ijfw', name: 'IJFW Memory Settings' },
    { tab: 'doctor', name: 'Doctor Settings' },
    { tab: 'about', name: 'About Page' },
  ];

  for (const { tab, name } of tabs) {
    test(`${name} loads`, async ({ page }) => {
      await goToSettings(page, tab);
      await expectUrlContains(page, ROUTES.settings[tab].slice(1));
      const body = await page.locator('body').textContent();
      expect(body!.length).toBeGreaterThan(10);
    });
  }

  test('screenshot: settings pages', async ({ page }) => {
    test.skip(!process.env.E2E_SCREENSHOTS, 'screenshots disabled');
    for (const { tab } of tabs) {
      await goToSettings(page, tab);
      await takeScreenshot(page, `settings-${tab}`);
    }
  });
});

// ── Classic v0.11.18 current-route baseline ──────────────────────────────────
//
// Repairs and proves the exact v0.11.18 current-route navigation set that every
// M0A target cell consumes. Each route in the sealed baseline must load. This is
// baseline construction only; it makes no six-target package acceptance claim.

test.describe('Classic v0.11.18 current-route baseline', () => {
  for (const route of CLASSIC_CURRENT_ROUTES) {
    test(`current route loads: ${route.id}`, async ({ page }) => {
      if (route.kind === 'guid') {
        await goToGuid(page);
        await expectUrlContains(page, 'guid');
        return;
      }
      const tab = route.tab as SettingsTab;
      await goToSettings(page, tab);
      await expectUrlContains(page, ROUTES.settings[tab].slice(1));
      const body = await page.locator('body').textContent();
      expect(body!.length).toBeGreaterThan(10);
    });
  }
});

// ── Cross-page navigation ────────────────────────────────────────────────────

test.describe('Sidebar Navigation', () => {
  test('can navigate between pages via URL', async ({ page }) => {
    await goToGuid(page);
    expect(page.url()).toContain('guid');

    await goToSettings(page, 'about');
    expect(page.url()).toContain('about');

    await goToGuid(page);
    expect(page.url()).toContain('guid');
  });
});
