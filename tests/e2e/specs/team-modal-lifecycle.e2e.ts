/**
 * E2E (adversarial): Modal dismissal + state-reset behavior.
 *
 * Exercises the destructive-intent modals (DeleteTeamConfirmModal,
 * CapabilityReviewModal) the way a confused user would: backdrop click,
 * ESC key, rapid open/close, navigate-away mid-flow, extreme team names.
 *
 * Each case isolates its own team via a per-test name prefix + cleanup
 * helper, so flake from one case can't contaminate the next.
 */

import path from 'path';
import { test, expect, type Page } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const NAME_PREFIX = 'E2E ModalLifecycle';
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/team-imports');
const FIX_VALID = path.join(FIXTURES_DIR, 'valid-trusted.json');

type TeamRow = { id: string; name: string };

async function cleanupTeams(page: Page): Promise<void> {
  const stale = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
  for (const t of stale) {
    if (t.name.startsWith(NAME_PREFIX)) {
      await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => undefined);
    }
  }
}

async function createTeam(page: Page, label: string): Promise<string | null> {
  const created = await invokeBridge<{ id?: string } | null>(page, 'team.create', {
    userId: 'system_default_user',
    name: `${NAME_PREFIX} ${label} ${Date.now()}`,
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
  return created?.id ?? null;
}

async function openDeleteModal(page: Page, teamName: string): Promise<void> {
  const sidebarEntry = page.locator(`text="${teamName}"`).first();
  await expect(sidebarEntry).toBeVisible({ timeout: 10_000 });
  const row = sidebarEntry.locator(
    'xpath=ancestor::div[contains(@class,"group") and contains(@class,"h-40px")][1]'
  );
  await row.hover();
  const threeDot = row.locator('span.flex-center.cursor-pointer').last();
  await expect(threeDot).toBeVisible({ timeout: 5_000 });
  await threeDot.click();

  const deleteItem = page
    .locator('.arco-dropdown-menu .arco-dropdown-menu-item')
    .filter({ hasText: /^Delete$|^删除$/ })
    .first();
  await expect(deleteItem).toBeVisible({ timeout: 5_000 });
  await deleteItem.click();
  await expect(page.locator('[data-testid="delete-team-confirm-modal"]')).toBeVisible({
    timeout: 5_000,
  });
}

test.describe('Team modal lifecycle (adversarial)', () => {
  test('case 1: Delete modal - backdrop click closes, team preserved', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const id = await createTeam(page, 'BackdropClose');
    if (!id) {
      test.skip(true, 'team.create returned null (no installed backend)');
      return;
    }
    const teams = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    const teamName = teams.find((t) => t.id === id)?.name ?? '';
    expect(teamName).toBeTruthy();

    await openDeleteModal(page, teamName);

    // Arco renders the backdrop as `.arco-modal-mask`. Click it.
    await page.locator('.arco-modal-mask').click({ position: { x: 5, y: 5 }, force: true });
    await expect(page.locator('[data-testid="delete-team-confirm-modal"]')).toBeHidden({
      timeout: 5_000,
    });

    // Team still exists.
    const stillThere = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    expect(stillThere.some((t) => t.id === id)).toBe(true);

    await invokeBridge(page, 'team.remove', { id }).catch(() => undefined);
  });

  test('case 2: Delete modal - ESC key closes, team preserved', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const id = await createTeam(page, 'EscClose');
    if (!id) {
      test.skip(true, 'team.create returned null (no installed backend)');
      return;
    }
    const teams = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    const teamName = teams.find((t) => t.id === id)?.name ?? '';

    await openDeleteModal(page, teamName);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="delete-team-confirm-modal"]')).toBeHidden({
      timeout: 5_000,
    });

    const stillThere = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    expect(stillThere.some((t) => t.id === id)).toBe(true);

    await invokeBridge(page, 'team.remove', { id }).catch(() => undefined);
  });

  test('case 3: Delete modal - typed state resets across open/close cycles', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const id = await createTeam(page, 'TypedReset');
    if (!id) {
      test.skip(true, 'team.create returned null (no installed backend)');
      return;
    }
    const teams = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    const teamName = teams.find((t) => t.id === id)?.name ?? '';

    await openDeleteModal(page, teamName);
    await page.locator('[data-testid="delete-team-confirm-input"]').fill('delete');
    await expect(page.locator('[data-testid="delete-team-confirm-cta"]')).toBeEnabled({ timeout: 3_000 });

    // Cancel via the dedicated cancel button.
    await page.locator('[data-testid="delete-team-confirm-cancel"]').click();
    await expect(page.locator('[data-testid="delete-team-confirm-modal"]')).toBeHidden({
      timeout: 5_000,
    });

    // Re-open. Input must be empty + CTA disabled (typed state did NOT leak).
    await openDeleteModal(page, teamName);
    const inputValue = await page.locator('[data-testid="delete-team-confirm-input"]').inputValue();
    expect(inputValue).toBe('');
    await expect(page.locator('[data-testid="delete-team-confirm-cta"]')).toBeDisabled();

    // Cleanup.
    await page.keyboard.press('Escape');
    await invokeBridge(page, 'team.remove', { id }).catch(() => undefined);
  });

  test('case 4: Capability modal - Cancel CTA closes without importing', async ({ page }) => {
    test.setTimeout(45_000);
    await navigateTo(page, '#/teams');

    const before = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });

    await page.locator('[data-testid="teams-import-cta"]').click();
    await page.locator('[data-testid="teams-import-file-input"]').setInputFiles(FIX_VALID);

    await expect(page.locator('[data-testid="capability-review-modal"]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-testid="capability-review-cancel"]').click();
    await expect(page.locator('[data-testid="capability-review-modal"]')).toBeHidden({ timeout: 5_000 });

    const after = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    expect(after.length).toBe(before.length);
  });

  test('case 5: Capability modal - backdrop click during cool-off (documented behavior)', async ({ page }) => {
    test.setTimeout(45_000);
    await navigateTo(page, '#/teams');

    const before = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });

    await page.locator('[data-testid="teams-import-cta"]').click();
    await page.locator('[data-testid="teams-import-file-input"]').setInputFiles(FIX_VALID);
    await expect(page.locator('[data-testid="capability-review-modal"]')).toBeVisible({ timeout: 10_000 });

    // Click backdrop during 5s cool-off.
    await page.locator('.arco-modal-mask').click({ position: { x: 5, y: 5 }, force: true }).catch(() => undefined);
    await page.waitForTimeout(500);

    // Document the actual behavior. Whether the modal closes or stays open
    // on backdrop-click is a UX choice; either is acceptable for a destructive
    // intent. The hard requirement: nothing imports without an explicit Trust
    // or Sandbox confirmation.
    const after = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    expect(after.length).toBe(before.length);

    // Ensure we leave a clean state for the next test.
    const modalStillOpen = await page
      .locator('[data-testid="capability-review-modal"]')
      .isVisible()
      .catch(() => false);
    if (modalStillOpen) {
      await page.locator('[data-testid="capability-review-cancel"]').click().catch(() => undefined);
    }
  });

  test('case 6: spam-open delete modal 10x → no stale ghosts, clean final state', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const id = await createTeam(page, 'SpamOpen');
    if (!id) {
      test.skip(true, 'team.create returned null (no installed backend)');
      return;
    }
    const teams = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    const teamName = teams.find((t) => t.id === id)?.name ?? '';

    let errorThrown = false;
    page.on('pageerror', () => {
      errorThrown = true;
    });

    for (let i = 0; i < 10; i++) {
      await openDeleteModal(page, teamName);
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="delete-team-confirm-modal"]')).toBeHidden({
        timeout: 5_000,
      });
    }

    expect(errorThrown).toBe(false);

    // Final open should still work cleanly + typed flow still enables.
    await openDeleteModal(page, teamName);
    await page.locator('[data-testid="delete-team-confirm-input"]').fill('delete');
    await expect(page.locator('[data-testid="delete-team-confirm-cta"]')).toBeEnabled({ timeout: 3_000 });
    await page.keyboard.press('Escape');

    // Verify exactly one modal in DOM at any time (no stale ghosts).
    const ghostCount = await page.locator('[data-testid="delete-team-confirm-modal"]').count();
    expect(ghostCount).toBeLessThanOrEqual(1);

    await invokeBridge(page, 'team.remove', { id }).catch(() => undefined);
  });

  test('case 7: open delete modal, navigate away → modal unmounts cleanly', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const id = await createTeam(page, 'NavAway');
    if (!id) {
      test.skip(true, 'team.create returned null (no installed backend)');
      return;
    }
    const teams = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    const teamName = teams.find((t) => t.id === id)?.name ?? '';

    await openDeleteModal(page, teamName);

    let errorThrown = false;
    page.on('pageerror', () => {
      errorThrown = true;
    });

    // Navigate away while modal is open.
    await navigateTo(page, '#/teams');

    // Modal should not block navigation - it may close gracefully OR remain
    // open on top of the new page. The hard requirements: no React errors,
    // and the modal does NOT trap the user (can be dismissed/escaped from
    // the new page).
    expect(errorThrown).toBe(false);

    // Force-dismiss if still hanging around.
    const modalStillOpen = await page
      .locator('[data-testid="delete-team-confirm-modal"]')
      .isVisible()
      .catch(() => false);
    if (modalStillOpen) {
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="delete-team-confirm-modal"]')).toBeHidden({
        timeout: 5_000,
      });
    }

    await invokeBridge(page, 'team.remove', { id }).catch(() => undefined);
  });

  test('case 8: modal renders cleanly with 200-char team name (no layout break)', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const longName = `${NAME_PREFIX} ${'X'.repeat(180)} ${Date.now()}`;
    const created = await invokeBridge<{ id?: string } | null>(page, 'team.create', {
      userId: 'system_default_user',
      name: longName,
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
      test.skip(true, 'team.create returned null (no installed backend)');
      return;
    }
    const id = created.id;

    await openDeleteModal(page, longName);

    // The Delete CTA must remain in-viewport (long names shouldn't push it off-screen).
    const cta = page.locator('[data-testid="delete-team-confirm-cta"]');
    const box = await cta.boundingBox();
    expect(box).not.toBeNull();
    const viewportSize = page.viewportSize();
    if (box && viewportSize) {
      expect(box.x + box.width).toBeLessThanOrEqual(viewportSize.width);
      expect(box.y + box.height).toBeLessThanOrEqual(viewportSize.height);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
    }

    await page.keyboard.press('Escape');
    await invokeBridge(page, 'team.remove', { id }).catch(() => undefined);
  });
});
