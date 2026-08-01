/**
 * MCP publication truth – E2E.
 *
 * Seals the packet's terminal claim at the UI: callable MCP tools appear only
 * from the CURRENT correlated publication receipt. Before any conversation
 * publishes/registers a connector, the composer Connectors flyout must WITHHOLD
 * every "tools registered in this chat" callability claim and instead show the
 * receipt-truth copy (waiting / not verified). Saved Library `connected` status
 * is never substituted for a live session receipt.
 *
 * These are UI-surface assertions and run against the built app; the connector
 * inventory is environment-dependent, so connector-specific steps skip cleanly
 * when no connector rows are installed (matching the ACP e2e conventions).
 */
import { test, expect } from '../../fixtures';
import {
  goToGuid,
  goToSettings,
  expectBodyContainsAny,
  expectUrlContains,
  settingsSiderItemById,
  CHAT_INPUT,
} from '../../helpers';

/** The composer "+" dropdown trigger (global class set on Arco triggerProps). */
const COMPOSER_ADD_TRIGGER = '.composer-add-popup';
/** Any claim that a connector is CALLABLE in this chat — must never show pre-publication. */
const CALLABILITY_CLAIM = /tools registered in this chat/i;
/** Receipt-truth withholding copy shown until a live session publishes. */
const WITHHOLDING_COPY = [
  'Waiting for this chat to report its tools',
  'Chat has not verified this connector',
  'waiting for publication',
  'waiting for tool registration',
];

test.describe('MCP publication truth', () => {
  test('MCP capabilities page manages servers without claiming chat callability', async ({ page }) => {
    await goToSettings(page, 'capabilities');
    await expectUrlContains(page, 'capabilities');
    await expect(page.locator(settingsSiderItemById('capabilities')).first()).toBeVisible({ timeout: 8_000 });
    await expectBodyContainsAny(page, ['MCP', 'mcp', 'Server', 'server', '工具', '配置', '添加', 'Add']);
    // The static capabilities surface is configuration authority, not a live
    // session, so it must not assert per-chat tool registration.
    await expect(page.getByText(CALLABILITY_CLAIM)).toHaveCount(0);
  });

  test('composer Connectors flyout withholds callability before any publication', async ({ page }) => {
    await goToGuid(page);
    await expect(page.locator(CHAT_INPUT).first()).toBeVisible({ timeout: 8_000 });

    const trigger = page.locator(COMPOSER_ADD_TRIGGER).first();
    const triggerVisible = await trigger.isVisible().catch(() => false);
    if (!triggerVisible) {
      test.skip(true, 'composer add ("+") trigger not available on this surface');
      return;
    }
    await trigger.click();

    // Open the Connectors pane (hover/click the menu entry).
    const connectorsEntry = page.getByText(/^Connectors$/).first();
    const entryVisible = await connectorsEntry.isVisible().catch(() => false);
    if (!entryVisible) {
      test.skip(true, 'connectors pane entry not rendered');
      return;
    }
    await connectorsEntry.hover().catch(() => {});
    await connectorsEntry.click().catch(() => {});

    // No conversation exists yet (staged composer), so there is no current
    // publication receipt: the flyout must never claim a connector is callable
    // in this chat. It shows configured/waiting/not-verified copy instead.
    await expect(page.getByText(CALLABILITY_CLAIM)).toHaveCount(0);

    // If any connector rows are installed, at least one must carry the
    // receipt-truth withholding copy rather than a callability claim.
    const anyWithholding = await Promise.all(
      WITHHOLDING_COPY.map((copy) => page.getByText(copy, { exact: false }).count())
    );
    const emptyState = await page
      .getByText(/No connectors installed yet/i)
      .count()
      .catch(() => 0);
    if (emptyState === 0) {
      expect(anyWithholding.reduce((sum, n) => sum + n, 0)).toBeGreaterThan(0);
    }
  });
});
