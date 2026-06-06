/**
 * E2E (Adversarial): extreme input values in every team-blitz text field.
 *
 * Cases:
 *   1. Team name in launcher - empty / whitespace / 5000-char / emoji /
 *      HTML script / SQL injection. Each must either be rejected with a
 *      clear UX signal OR persisted verbatim with no XSS / SQL leakage.
 *   2. BuildMyOwn goal text - empty (Suggest disabled), 1-char (enabled
 *      OR no-op), 10000-char essay (no timeout, returns something).
 *   3. Typed-delete confirmation - "delet" disabled, "DELETE " enabled
 *      (case-insensitive trim per DeleteTeamConfirmModal.tsx), newline
 *      tolerated, 10000-char paste does not crash.
 *   4. Slot name input - empty falls back to specialist name, duplicate
 *      slot names are allowed (per current product behavior).
 */

import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const LAUNCHER_ID = 'ext-cold-outbound';
const NAME_PREFIX = 'E2E InputEdge';

type TeamRow = { id: string; name: string };

async function cleanupTeams(page: Page): Promise<void> {
  const stale = await invokeBridge<TeamRow[]>(page, 'team.list', {
    userId: 'system_default_user',
  });
  for (const t of stale) {
    if (t.name.startsWith(NAME_PREFIX)) {
      await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => {});
    }
  }
}

async function gotoColdOutboundLauncher(page: Page): Promise<void> {
  await navigateTo(page, '#/teams');
  await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({
    timeout: 15_000,
  });
  await page.locator(`[data-testid="team-card-${LAUNCHER_ID}"]`).click();
  await page.waitForURL(new RegExp(`/teams/${LAUNCHER_ID}/launch`), { timeout: 10_000 });
  await expect(page.locator('[data-testid="launcher-row-leader"]')).toBeVisible({
    timeout: 15_000,
  });
}

// Flipped from `describe.serial` to `describe` so every adversarial case
// reports independently - Playwright's serial mode skips remaining tests
// after the first failure. Each test pre-cleans its own state.
test.describe('Team Blitz - input edge cases', () => {
  test('launcher name: empty + whitespace warn instead of disabling (UX bug)', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);
    await gotoColdOutboundLauncher(page);

    const before = await invokeBridge<TeamRow[]>(page, 'team.list', {
      userId: 'system_default_user',
    });
    const beforeCount = before.length;

    const nameInput = page.locator('[data-testid="launcher-name-input"]');
    const launchCta = page.locator('[data-testid="launcher-launch-cta"]');

    // Empty name - clicking Launch should NOT create a team. The current
    // implementation warns via Message.warning but leaves the CTA enabled.
    // Either behavior is acceptable; what matters is no team is created.
    await nameInput.fill('');
    await launchCta.click({ force: true });
    await page.waitForTimeout(1_500);

    let after = await invokeBridge<TeamRow[]>(page, 'team.list', {
      userId: 'system_default_user',
    });
    expect(after.length, 'empty-name click must NOT create a team').toBe(beforeCount);
    expect(page.url(), 'empty-name click must NOT navigate away').toMatch(
      new RegExp(`/teams/${LAUNCHER_ID}/launch$`)
    );

    // Whitespace-only - same.
    await nameInput.fill('   ');
    await launchCta.click({ force: true });
    await page.waitForTimeout(1_500);

    after = await invokeBridge<TeamRow[]>(page, 'team.list', {
      userId: 'system_default_user',
    });
    expect(after.length, 'whitespace-name click must NOT create a team').toBe(beforeCount);
  });

  test('launcher name: 5000-char string is accepted or truncated cleanly', async ({ page }) => {
    test.setTimeout(120_000);
    await cleanupTeams(page);
    await gotoColdOutboundLauncher(page);

    const hugeName = `${NAME_PREFIX} Huge ${'A'.repeat(5000)}`;
    await page.locator('[data-testid="launcher-name-input"]').fill(hugeName);
    await page.locator('[data-testid="launcher-launch-cta"]').click();

    await page.waitForURL(/\/team\/[^/]+$/, { timeout: 60_000 });
    const teamId = page.url().match(/\/team\/([^/?#]+)/)?.[1];
    expect(teamId).toBeTruthy();

    const state = await invokeBridge<{ name: string } | null>(page, 'team.get', { id: teamId });
    expect(state).toBeTruthy();
    // Either truncated or accepted as-is. Verify SOME prefix survived.
    expect(state!.name.startsWith(`${NAME_PREFIX} Huge`)).toBe(true);

    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });

  test('launcher name: emoji is preserved end-to-end', async ({ page }) => {
    test.setTimeout(90_000);
    await cleanupTeams(page);
    await gotoColdOutboundLauncher(page);

    const emojiName = `${NAME_PREFIX} 🚀 Rocket 🚀 ${Date.now()}`;
    await page.locator('[data-testid="launcher-name-input"]').fill(emojiName);
    await page.locator('[data-testid="launcher-launch-cta"]').click();

    await page.waitForURL(/\/team\/[^/]+$/, { timeout: 60_000 });
    const teamId = page.url().match(/\/team\/([^/?#]+)/)?.[1];
    expect(teamId).toBeTruthy();

    // Name renders correctly in the team page.
    await expect(page.locator(`text="${emojiName}"`).first()).toBeVisible({ timeout: 10_000 });

    const state = await invokeBridge<{ name: string }>(page, 'team.get', { id: teamId });
    expect(state.name).toBe(emojiName);

    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });

  test('launcher name: HTML / script tags are rendered as literal text (no XSS)', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await cleanupTeams(page);
    await gotoColdOutboundLauncher(page);

    // Wire a dialog listener; if alert(1) executes we fail the test.
    let alertFired = false;
    page.on('dialog', (dialog) => {
      alertFired = true;
      void dialog.dismiss();
    });

    const xssName = `${NAME_PREFIX} <script>alert(1)</script> ${Date.now()}`;
    await page.locator('[data-testid="launcher-name-input"]').fill(xssName);
    await page.locator('[data-testid="launcher-launch-cta"]').click();

    await page.waitForURL(/\/team\/[^/]+$/, { timeout: 60_000 });
    const teamId = page.url().match(/\/team\/([^/?#]+)/)?.[1];
    expect(teamId).toBeTruthy();

    // Settle so any deferred script-execution path would have fired.
    await page.waitForTimeout(2_000);
    expect(alertFired).toBe(false);

    // Page does NOT contain an actual <script> element with our payload.
    const scriptCount = await page.evaluate((needle) => {
      return Array.from(document.scripts).filter((s) => s.textContent?.includes(needle)).length;
    }, 'alert(1)');
    expect(scriptCount).toBe(0);

    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });

  test('launcher name: SQL injection - team created, list call still works', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await cleanupTeams(page);
    await gotoColdOutboundLauncher(page);

    const sqlName = `${NAME_PREFIX} '; DROP TABLE teams;-- ${Date.now()}`;
    await page.locator('[data-testid="launcher-name-input"]').fill(sqlName);
    await page.locator('[data-testid="launcher-launch-cta"]').click();

    await page.waitForURL(/\/team\/[^/]+$/, { timeout: 60_000 });
    const teamId = page.url().match(/\/team\/([^/?#]+)/)?.[1];
    expect(teamId).toBeTruthy();

    // Backend list still works - the SQL payload didn't drop the table.
    const list = await invokeBridge<TeamRow[]>(page, 'team.list', {
      userId: 'system_default_user',
    });
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((t) => t.name === sqlName)).toBe(true);

    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });

  test('BuildMyOwn goal: empty disables Suggest, 1-char enables, 10000-char no crash', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await navigateTo(page, '#/teams');
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({
      timeout: 15_000,
    });
    await page.locator('[data-testid="team-card-build-my-own"]').click();
    await page.waitForURL(/\/teams\/new(\?|$)/, { timeout: 10_000 });

    const goalInput = page.locator('[data-testid="launcher-goal-input"]');
    const suggestBtn = page.locator('[data-testid="launcher-suggest-btn"]');

    // Empty - disabled.
    await expect(suggestBtn).toBeDisabled();

    // 1 char - enabled (button only checks .trim().length === 0).
    await goalInput.fill('a');
    await expect(suggestBtn).toBeEnabled({ timeout: 3_000 });

    // 10000-char essay - Suggest still works (no timeout) and returns
    // something. We're not asserting the quality of the roster - only
    // that the call completes without throwing.
    const essay = 'we need to launch a marketing campaign. '.repeat(250); // ~10000 chars
    expect(essay.length).toBeGreaterThan(9000);
    await goalInput.fill(essay);
    await expect(suggestBtn).toBeEnabled();
    await suggestBtn.click();

    // Roster appears OR the Message.error toast surfaces - either way,
    // the page remains alive and the suggesting flag clears.
    await expect(async () => {
      const leaderVisible = await page
        .locator('[data-testid="launcher-row-leader"]')
        .isVisible()
        .catch(() => false);
      const buttonReEnabled = await suggestBtn.isEnabled().catch(() => false);
      // Either the suggest succeeded (leader row) OR it failed and
      // re-enabled the button - both mean the call completed.
      expect(leaderVisible || buttonReEnabled).toBe(true);
    }).toPass({ timeout: 30_000 });
  });

  test('delete modal: case-insensitive trim, newline tolerated, 10k-char paste no crash', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await cleanupTeams(page);

    const teamName = `${NAME_PREFIX} DeleteEdge ${Date.now()}`;
    const created = await invokeBridge<{ id?: string } | null>(page, 'team.create', {
      userId: 'system_default_user',
      name: teamName,
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

    // Open delete modal.
    const sidebarEntry = page.locator(`text="${teamName}"`).first();
    await expect(sidebarEntry).toBeVisible({ timeout: 10_000 });
    const row = sidebarEntry.locator(
      'xpath=ancestor::div[contains(@class,"group") and contains(@class,"h-40px")][1]'
    );
    await row.hover();
    await row.locator('span.flex-center.cursor-pointer').last().click();
    await page
      .locator('.arco-dropdown-menu .arco-dropdown-menu-item')
      .filter({ hasText: /^Delete$|^删除$/ })
      .first()
      .click();

    const modal = page.locator('[data-testid="delete-team-confirm-modal"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const input = page.locator('[data-testid="delete-team-confirm-input"]');
    const cta = page.locator('[data-testid="delete-team-confirm-cta"]');

    // "delet" → disabled.
    await input.fill('delet');
    await expect(cta).toBeDisabled();

    // "DELETE " with trailing space - case-insensitive trim → enabled.
    await input.fill('DELETE ');
    await expect(cta).toBeEnabled({ timeout: 3_000 });

    // 10000-char paste - does not crash; button stays disabled.
    await input.fill('x'.repeat(10000));
    await expect(cta).toBeDisabled();
    // Modal still alive.
    await expect(modal).toBeVisible();

    // Newline path - fill via the underlying Arco Input. The current
    // Input is single-line (not TextArea), so newline injection just
    // becomes a literal char that fails the equality check.
    await input.fill('delete\n');
    // Equality `'delete\n'.trim().toLowerCase() === 'delete'` → true,
    // so the CTA should enable. If single-line strips the newline,
    // also enabled.
    await expect(cta).toBeEnabled({ timeout: 3_000 });

    // Restore canonical "delete" and confirm.
    await input.fill('delete');
    await cta.click();
    await expect(modal).toBeHidden({ timeout: 10_000 });

    const after = await invokeBridge<{ id?: string } | null>(page, 'team.get', {
      id: created.id,
    });
    expect(after).toBeNull();
  });

  test('slot name input: empty falls back to default, duplicates are allowed', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await cleanupTeams(page);
    await gotoColdOutboundLauncher(page);

    // Cold Outbound has 1 leader + 2 teammates after the first specialist
    // promotes to leader. Set both teammates' slot names to the same
    // string to verify the product allows duplicates.
    const t0 = page.locator('[data-testid="launcher-slotname-teammate-0"]');
    const t1 = page.locator('[data-testid="launcher-slotname-teammate-1"]');
    await expect(t0).toBeVisible({ timeout: 10_000 });
    await expect(t1).toBeVisible({ timeout: 10_000 });

    await t0.fill('Twin');
    await t1.fill('Twin');

    // Leader slot name left empty - should fall back to the specialist
    // name (per buildAgent in TeamLauncherPage).
    await page.locator('[data-testid="launcher-slotname-leader"]').fill('');

    const teamName = `${NAME_PREFIX} SlotDups ${Date.now()}`;
    await page.locator('[data-testid="launcher-name-input"]').fill(teamName);

    // Launch must NOT block on duplicate slot names - there's no
    // validation today; this case documents the current contract.
    const launchCta = page.locator('[data-testid="launcher-launch-cta"]');
    await expect(launchCta).toBeEnabled();
    await launchCta.click();

    await page.waitForURL(/\/team\/[^/]+$/, { timeout: 60_000 });
    const teamId = page.url().match(/\/team\/([^/?#]+)/)?.[1];
    expect(teamId).toBeTruthy();

    const state = await invokeBridge<{
      agents: Array<{ role: string; agentName: string }>;
    }>(page, 'team.get', { id: teamId });

    const teammates = state.agents.filter((a) => a.role === 'teammate');
    expect(teammates).toHaveLength(2);
    // Both teammates carry the duplicated slot name "Twin".
    expect(teammates[0].agentName).toBe('Twin');
    expect(teammates[1].agentName).toBe('Twin');

    // Leader fell back to a non-empty default (the specialist name).
    const leader = state.agents.find((a) => a.role === 'leader');
    expect(leader).toBeTruthy();
    expect(leader!.agentName.length).toBeGreaterThan(0);

    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });
});
