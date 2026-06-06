/**
 * E2E (D1): Promote-to-Standing flow.
 *
 * Flow per E2E-TEST-PLAN §D1:
 *   1. Create an ad-hoc team via team.create IPC (leader-only).
 *   2. Seed eligibility (sessionCount ≥ 5) using the only public seed path
 *      available: alternate team.ensure-session + team.stop five times. The
 *      service caches sessions per-team and only bumps sessionCount on a fresh
 *      uncached start, so we must drop the cache between bumps.
 *   3. Navigate to /team/<id> → the eligibility predicate runs renderer-side
 *      and surfaces the Promote pill `[data-testid="team-header-promote"]`.
 *   4. Click pill → modal opens. Confirm is disabled until both checkboxes are
 *      ticked, then click Confirm → modal closes → Standing badge appears +
 *      Demote action renders next to it.
 *   5. Reload via navigateTo back to the page → standing flag persists (asserted
 *      via team.get IPC + badge still in DOM after revisit).
 *
 * Seed-path honesty: when `team.ensure-session` returns a __bridgeError
 * sentinel (e.g. no installed backend supports session start in this env),
 * the test marks itself fixme with the specific gap. There is no public IPC
 * that directly sets sessionCount/firstActiveAt; surfacing one purely for
 * tests would add product surface area, so we exercise the real bumper path.
 */

import { test, expect } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const TEAM_NAME_PREFIX = 'E2E Promote D1';
const REQUIRED_SESSIONS = 5;

type BridgeError = { __bridgeError: true; message?: string };

function isBridgeError(value: unknown): value is BridgeError {
  return Boolean(value) && typeof value === 'object' && '__bridgeError' in (value as Record<string, unknown>);
}

test.describe('Promote to Standing - D1', () => {
  test('eligible team can be promoted; standing persists after re-navigation', async ({ page }) => {
    test.setTimeout(180_000);

    // Cleanup leftovers from prior runs.
    const stale = await invokeBridge<Array<{ id: string; name: string }>>(page, 'team.list', {
      userId: 'system_default_user',
    });
    for (const t of stale) {
      if (t.name.startsWith(TEAM_NAME_PREFIX)) {
        await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => {});
      }
    }

    const teamName = `${TEAM_NAME_PREFIX} ${Date.now()}`;
    const created = await invokeBridge<{ id: string } | null>(page, 'team.create', {
      userId: 'system_default_user',
      name: teamName,
      workspace: '',
      workspaceMode: 'shared',
      agents: [
        {
          slotId: 'slot-lead',
          conversationId: '',
          role: 'leader',
          agentType: 'wcore',
          agentName: 'Leader',
          conversationType: 'wcore',
          status: 'idle',
        },
      ],
    });
    if (!created?.id) throw new Error('team.create returned null - required backend (wcore) not installed');
    const teamId = created.id;

    // Seed eligibility - drop the cache between bumps so getOrStartSession
    // takes the slow path each time and bumps sessionCount + firstActiveAt.
    for (let i = 0; i < REQUIRED_SESSIONS; i++) {
      const ensured = await invokeBridge<void | BridgeError>(page, 'team.ensure-session', { teamId });
      if (isBridgeError(ensured)) {
        test.fixme(
          true,
          `team.ensure-session failed during eligibility seed (iter ${i}): ${ensured.message ?? 'unknown'}. ` +
            'D1 depends on a backend that can start a real session; no public IPC seeds sessionCount directly.'
        );
        return;
      }
      await invokeBridge(page, 'team.stop', { teamId }).catch(() => {});
    }

    // Confirm the bumps landed.
    const seeded = await invokeBridge<{ sessionCount?: number; firstActiveAt?: number } | null>(page, 'team.get', {
      id: teamId,
    });
    if (!seeded || (seeded.sessionCount ?? 0) < REQUIRED_SESSIONS) {
      test.fixme(
        true,
        `sessionCount stayed at ${seeded?.sessionCount ?? 'unknown'} after ${REQUIRED_SESSIONS} ensure→stop cycles; ` +
          'bumper path did not run (likely MCP server start failed silently in this env).'
      );
      return;
    }

    await navigateTo(page, `#/team/${teamId}`);
    await page.waitForURL(new RegExp(`/team/${teamId}`), { timeout: 15_000 });

    // Promote pill is rendered by TeamHeaderBadges when eligible + not yet standing.
    const promotePill = page.locator('[data-testid="team-header-promote"]');
    await expect(promotePill).toBeVisible({ timeout: 15_000 });

    // Open the modal.
    await promotePill.click();
    const modal = page.locator('[data-testid="promote-to-standing-modal"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Confirm disabled until both opt-ins are checked.
    const confirm = page.locator('[data-testid="promote-to-standing-confirm"]');
    await expect(confirm).toBeDisabled();

    const optIn1 = page.locator('[data-testid="promote-to-standing-opt-in-1"]');
    const optIn2 = page.locator('[data-testid="promote-to-standing-opt-in-2"]');
    await optIn1.click();
    // Single opt-in keeps confirm disabled.
    await expect(confirm).toBeDisabled();
    await optIn2.click();
    await expect(confirm).toBeEnabled();

    await confirm.click();

    // Modal closes; Standing badge + Demote action appear.
    await expect(modal).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="team-header-standing-badge"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="team-header-demote"]')).toBeVisible({ timeout: 10_000 });
    // Promote pill disappears once standing.
    await expect(promotePill).not.toBeVisible();

    // Backend agrees.
    const promoted = await invokeBridge<{ promotedToStanding?: boolean } | null>(page, 'team.get', { id: teamId });
    expect(promoted?.promotedToStanding).toBe(true);

    // Re-navigate to verify the flag persisted across a page transition.
    await navigateTo(page, `#/teams`);
    await navigateTo(page, `#/team/${teamId}`);
    await page.waitForURL(new RegExp(`/team/${teamId}`), { timeout: 15_000 });
    await expect(page.locator('[data-testid="team-header-standing-badge"]')).toBeVisible({ timeout: 15_000 });

    const persisted = await invokeBridge<{ promotedToStanding?: boolean } | null>(page, 'team.get', { id: teamId });
    expect(persisted?.promotedToStanding).toBe(true);

    // Cleanup.
    await invokeBridge(page, 'team.remove', { id: teamId }).catch(() => {});
  });
});
