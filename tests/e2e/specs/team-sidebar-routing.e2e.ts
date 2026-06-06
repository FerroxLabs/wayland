/**
 * E2E (A3): Team sidebar - entry visible, routing to /team/<id>, in-place
 * error banner absent, and the typed-"delete" confirmation modal (Live-smoke
 * fix #3, commit 567bf65a7) gates the destructive CTA correctly.
 *
 * The team is seeded via `ipcBridge.team.create` (allowed by README rule:
 * setup may use invokeBridge). Sidebar visibility, navigation, and deletion
 * all go through real UI interaction:
 *   1. hover the row to surface the three-dot menu (SiderItem.tsx renders
 *      it via group-hover)
 *   2. click the three-dot trigger to open the Arco Dropdown menu
 *   3. click "Delete" inside the dropdown
 *   4. drive the typed-delete WaylandModal
 */

import { test, expect } from '../fixtures';
import { invokeBridge } from '../helpers';

const TEAM_NAME = `E2E Sidebar Routing ${Date.now()}`;

test.describe('Team Sidebar - routing + typed-delete', () => {
  test('sidebar entry routes to /team/<id>, then typed-delete removes it', async ({ page }) => {
    test.setTimeout(120_000);

    // Cleanup leftover same-named teams from prior runs.
    const stale = await invokeBridge<Array<{ id: string; name: string }>>(page, 'team.list', {
      userId: 'system_default_user',
    });
    for (const t of stale) {
      if (t.name.startsWith('E2E Sidebar Routing')) {
        await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => {});
      }
    }

    // Seed a team via bridge (setup path - UI verifies the result).
    const created = await invokeBridge<{ id?: string } | null>(page, 'team.create', {
      userId: 'system_default_user',
      name: TEAM_NAME,
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
      test.skip(true, 'team.create returned null (no installed backend on this host)');
      return;
    }
    const teamId = created.id;

    // Sidebar Teams group should expose the newly-created entry.
    const teamSection = page.locator('text=Teams').or(page.locator('text=团队'));
    await expect(teamSection.first()).toBeVisible({ timeout: 15_000 });

    // Match the sidebar row by name. SiderItem renders the team name inside
    // a span; we scope to the row container that holds it so the hover
    // surface lights up the three-dot menu.
    const sidebarEntry = page.locator(`text="${TEAM_NAME}"`).first();
    await expect(sidebarEntry).toBeVisible({ timeout: 10_000 });

    // --- (A3.a) Routing: click row → /team/<id>.
    await sidebarEntry.click();
    await page.waitForURL(new RegExp(`/team/${teamId}`), { timeout: 10_000 });

    // Team header / page renders. No in-place error banners (bug #2 fix).
    await expect(page.locator(`text="${TEAM_NAME}"`).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="team-load-error"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="launcher-load-error"]')).toHaveCount(0);

    // --- (A3.b) Open the dropdown by hovering the row then clicking the
    // three-dot trigger that SiderItem renders inside `group-hover:flex`.
    // The row is the closest container of the name span that has the
    // `.group` class - match by walking up from the visible text.
    const row = sidebarEntry.locator(
      'xpath=ancestor::div[contains(@class,"group") and contains(@class,"h-40px")][1]'
    );
    await expect(row).toBeVisible({ timeout: 5_000 });
    await row.hover();

    // The three-dot trigger is the only clickable span inside the row that
    // has the 16x16 dot column. Use a robust locator: the hover-revealed
    // span inside the row.
    const threeDot = row.locator('span.flex-center.cursor-pointer').last();
    await expect(threeDot).toBeVisible({ timeout: 5_000 });
    await threeDot.click();

    // --- (A3.c) Click "Delete" item in the dropdown menu (renders into
    // document.body via getPopupContainer).
    const deleteItem = page
      .locator('.arco-dropdown-menu .arco-dropdown-menu-item')
      .filter({ hasText: /^Delete$|^删除$/ })
      .first();
    await expect(deleteItem).toBeVisible({ timeout: 5_000 });
    await deleteItem.click();

    // --- (A3.d) Typed-delete WaylandModal gates the destructive CTA.
    const modal = page.locator('[data-testid="delete-team-confirm-modal"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const confirmCta = page.locator('[data-testid="delete-team-confirm-cta"]');
    const typedInput = page.locator('[data-testid="delete-team-confirm-input"]');

    // Initially: CTA must be disabled (no input).
    await expect(confirmCta).toBeDisabled();

    // Partial "del" → still disabled (typed.trim().toLowerCase() !== 'delete').
    await typedInput.fill('del');
    await expect(confirmCta).toBeDisabled();

    // Full "DELETE" (case-insensitive per DeleteTeamConfirmModal.tsx) → enabled.
    await typedInput.fill('DELETE');
    await expect(confirmCta).toBeEnabled({ timeout: 3_000 });

    // Confirm → team disappears from the sidebar.
    await confirmCta.click();
    await expect(modal).toBeHidden({ timeout: 10_000 });
    await expect(page.locator(`text="${TEAM_NAME}"`)).toHaveCount(0, { timeout: 10_000 });

    // Backend confirms it's gone.
    const after = await invokeBridge<{ id?: string } | null>(page, 'team.get', { id: teamId });
    expect(after).toBeNull();
  });
});
