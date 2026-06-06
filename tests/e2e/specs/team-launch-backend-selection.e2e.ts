/**
 * E2E (B3): Backend pill on the launcher - open dropdown, switch backend,
 * launch with the chosen backend.
 *
 * Per `BackendPill.tsx` and `useAvailableBackends`:
 *   - wayland-core is ALWAYS in the available list (process-side fallback).
 *   - detected CLIs (claude / gemini / codex / etc.) are added when installed.
 *   - The launcher pill is always rendered; `AgentBackendPill` (the in-team
 *     header pill) is what hides itself when `options.length < 2`, NOT this
 *     launcher pill.
 *
 * Strategy: open the leader's BackendPill dropdown, count options, pick the
 * one that's NOT the current value (always at least wayland-core present),
 * confirm the pill renders the new value, then launch.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const LAUNCHER_ID = 'ext-marketing-agency';

test.describe('Team Launcher - backend selection', () => {
  test('switch leader backend via pill → launch persists the choice', async ({ page }) => {
    test.setTimeout(120_000);

    // Cleanup.
    const stale = await invokeBridge<Array<{ id: string; name: string }>>(page, 'team.list', {
      userId: 'system_default_user',
    });
    for (const t of stale) {
      if (t.name.startsWith('E2E Backend Sel')) {
        await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => {});
      }
    }

    // /teams → click marketing-agency.
    await navigateTo(page, '#/teams');
    await page.waitForURL(/#\/teams(\?|$)/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({ timeout: 15_000 });

    await page.locator(`[data-testid="team-card-${LAUNCHER_ID}"]`).click();
    await page.waitForURL(new RegExp(`/teams/${LAUNCHER_ID}/launch`), { timeout: 10_000 });
    await expect(page.locator('[data-testid="launcher-row-leader"]')).toBeVisible({ timeout: 15_000 });

    const leaderPill = page.locator('[data-testid="launcher-backend-leader"]');
    await expect(leaderPill).toBeVisible({ timeout: 10_000 });

    // Capture the current backend value rendered in the pill so we can pick
    // a different one from the dropdown.
    const beforeText = (await leaderPill.textContent())?.trim() ?? '';
    expect(beforeText.length).toBeGreaterThan(0);

    // Open the WaylandSelect dropdown. Arco renders options into document.body.
    await leaderPill.click();

    // List the visible option labels - wayland-core is guaranteed; if other
    // CLIs are detected they're also listed.
    const options = page.locator('.arco-select-option');
    await expect(options.first()).toBeVisible({ timeout: 5_000 });
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(1);

    // Find an option whose text differs from the current pill value. If only
    // one is available, picking the same option is a valid no-op assertion -
    // we still verify the dropdown opened + the pill kept a value.
    let pickedValue = '';
    for (let i = 0; i < optionCount; i++) {
      const txt = (await options.nth(i).textContent())?.trim() ?? '';
      if (txt && txt !== beforeText) {
        pickedValue = txt;
        await options.nth(i).click();
        break;
      }
    }
    if (!pickedValue) {
      // Single-backend host - close dropdown by pressing Escape, validate that
      // the pill still shows the same value (the WaylandSelect remains usable).
      await page.keyboard.press('Escape');
      pickedValue = beforeText;
    }

    // Pill text now matches the new value (or the only value).
    await expect(leaderPill).toContainText(pickedValue, { timeout: 5_000 });

    // Personalize + launch.
    const teamName = `E2E Backend Sel ${Date.now()}`;
    await page.locator('[data-testid="launcher-name-input"]').fill(teamName);

    const launchCta = page.locator('[data-testid="launcher-launch-cta"]');
    await expect(launchCta).toBeEnabled({ timeout: 5_000 });
    await launchCta.click();

    await page.waitForURL(/\/team\/[^/]+$/, { timeout: 60_000 });
    const teamId = page.url().match(/\/team\/([^/?#]+)/)?.[1];
    expect(teamId).toBeTruthy();

    // Backend persistence: team.get returns the leader with the agentType we
    // chose. Note: BackendPill renders `id` directly (e.g. "wayland-core"), so
    // pickedValue equals the backend id.
    const state = await invokeBridge<{ agents: Array<{ role: string; agentType: string }> }>(
      page,
      'team.get',
      { id: teamId }
    );
    const leader = state.agents.find((a) => a.role === 'leader');
    expect(leader?.agentType).toBe(pickedValue);

    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });
});
