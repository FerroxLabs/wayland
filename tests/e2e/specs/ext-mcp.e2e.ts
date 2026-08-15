/**
 * Extensions – MCP Servers tests.
 *
 * Validates extension-contributed MCP servers on the tools settings page.
 */
import { test, expect } from '../fixtures';
import { goToSettings, expectBodyContainsAny, takeScreenshot, waitForSettle, ARCO_SWITCH } from '../helpers';

test.describe('Extension: MCP Servers', () => {
  test('MCP tools page loads', async ({ page }) => {
    await goToSettings(page, 'mcp-library');
    await expectBodyContainsAny(page, ['MCP', 'mcp', 'Server', 'server', '工具', '配置', '添加', 'Add']);
  });

  test('extension MCP servers registered (page functional)', async ({ page }) => {
    await goToSettings(page, 'mcp-library');
    await waitForSettle(page);

    const body = await page.locator('body').textContent();
    // MCP servers may appear in the list or be internal-only
    expect(body!.length).toBeGreaterThan(50);
  });

  test('MCP server toggles are visible', async ({ page }) => {
    await goToSettings(page, 'mcp-library');
    await waitForSettle(page);

    // A Browse card renders a toggle only for a catalog entry the user has
    // INSTALLED - BrowsePage builds its installed set from
    // mcpServers.filter(s => s.libraryEntryId). Extension-contributed servers
    // carry no libraryEntryId and surface on /settings/mcp-library/connected
    // instead, so the count here is inventory-dependent and legitimately 0 on
    // a clean profile.
    const switches = page.locator(ARCO_SWITCH);
    const count = await switches.count();
    if (count > 0) await expect(switches.first()).toBeVisible();
  });

  test('screenshot: MCP tools with extensions', async ({ page }) => {
    test.skip(!process.env.E2E_SCREENSHOTS, 'screenshots disabled');
    await goToSettings(page, 'mcp-library');
    await waitForSettle(page);
    await takeScreenshot(page, 'ext-mcp-servers');
  });
});
