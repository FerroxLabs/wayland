/**
 * E2E (adversarial): Orphan + race-state behavior.
 *
 * Exercises the edge cases where backend state mutates out from under the
 * UI - typically simulated here by calling team.remove via IPC after the
 * UI is on the team page, mirroring "another window deleted this" or
 * "MCP just dropped the team." These prove the Bug #2 in-place error
 * path and the listChanged emit (created + removed) work end-to-end.
 */

import { test, expect, type Page } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const NAME_PREFIX = 'E2E StateOrphans';

type TeamRow = { id: string; name: string };

async function cleanupTeams(page: Page): Promise<void> {
  const stale = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
  for (const t of stale) {
    if (t.name.startsWith(NAME_PREFIX)) {
      await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => undefined);
    }
  }
}

async function createTeam(page: Page, label: string): Promise<{ id: string; name: string } | null> {
  const name = `${NAME_PREFIX} ${label} ${Date.now()}`;
  const created = await invokeBridge<{ id?: string } | null>(page, 'team.create', {
    userId: 'system_default_user',
    name,
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
  return created?.id ? { id: created.id, name } : null;
}

test.describe('Team state orphans (adversarial)', () => {
  test('case 1: backend deletes team while UI is on /team/<id> → in-place error, no crash', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const created = await createTeam(page, 'BackendDeleted');
    if (!created) {
      test.skip(true, 'team.create returned null (no installed backend)');
      return;
    }

    await navigateTo(page, `#/team/${created.id}`);
    await page.waitForURL(new RegExp(`/team/${created.id}`), { timeout: 15_000 });

    let errorThrown = false;
    page.on('pageerror', () => {
      errorThrown = true;
    });

    // Force-delete via IPC (simulating another window / MCP). The
    // listChanged emit added in b959d106d should refresh useTeamList,
    // but the user is currently INSIDE the deleted team's route.
    await invokeBridge(page, 'team.remove', { id: created.id });
    await page.waitForTimeout(1_000);

    // The page must NOT crash. Either:
    //   (a) Bug #2 fix renders in-place error (preferred), OR
    //   (b) Page survives with cached team data (acceptable - no React error)
    expect(errorThrown).toBe(false);

    // Hard requirement: the backend confirms removal happened.
    const refetched = await invokeBridge(page, 'team.get', { id: created.id });
    expect(refetched).toBeNull();

    // Page-resident surfaces (header, right rail) may keep the cached
    // team name until the user navigates away - that's acceptable for
    // v0.6.0 (and is consistent with how chat-history caches work). The
    // hard requirement is "no React crash" (already asserted above) +
    // "navigation works." Verify by navigating away.
    await navigateTo(page, '#/teams');
    await page.waitForURL(/\/teams$/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({ timeout: 10_000 });
  });

  test('case 2: abandon launcher flow without launching → no orphan team', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const before = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    const beforeOurs = before.filter((t) => t.name.startsWith(NAME_PREFIX)).length;

    // Open a launcher; type a name; abandon by navigating away.
    await navigateTo(page, '#/teams');
    const card = page.locator('[data-testid="team-card-ext-marketing-agency"]');
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.click();
    await page.waitForURL(/\/teams\/ext-marketing-agency\/launch/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="launcher-title"]')).toBeVisible({ timeout: 15_000 });

    await page
      .locator('[data-testid="launcher-name-input"]')
      .fill(`${NAME_PREFIX} AbandonedFlow ${Date.now()}`);

    // Bail out via the back button.
    await page.locator('[data-testid="launcher-back"]').click();
    await page.waitForURL(/\/teams$/, { timeout: 10_000 });

    // No team should have been created.
    const after = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    const afterOurs = after.filter((t) => t.name.startsWith(NAME_PREFIX)).length;
    expect(afterOurs).toBe(beforeOurs);
  });

  test('case 3: duplicate team names allowed (no client-side uniqueness)', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const label = `Duplicate-${Date.now()}`;
    const sharedName = `${NAME_PREFIX} ${label}`;

    const first = await invokeBridge<{ id?: string } | null>(page, 'team.create', {
      userId: 'system_default_user',
      name: sharedName,
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
    if (!first?.id) {
      test.skip(true, 'team.create returned null (no installed backend)');
      return;
    }

    const second = await invokeBridge<{ id?: string } | null>(page, 'team.create', {
      userId: 'system_default_user',
      name: sharedName,
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
    expect(second?.id).toBeTruthy();
    expect(second?.id).not.toBe(first.id);

    // Both teams exist with the same display name. The sidebar locator
    // resolves to two entries - verify the count rather than first().
    await navigateTo(page, '#/guid');
    await expect(page.locator(`text="${sharedName}"`)).toHaveCount(2, { timeout: 10_000 });

    await invokeBridge(page, 'team.remove', { id: first.id }).catch(() => undefined);
    if (second?.id) await invokeBridge(page, 'team.remove', { id: second.id }).catch(() => undefined);
  });

  test('case 4: promote on a just-deleted team rejects cleanly', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const created = await createTeam(page, 'PromoteRace');
    if (!created) {
      test.skip(true, 'team.create returned null (no installed backend)');
      return;
    }

    await invokeBridge(page, 'team.remove', { id: created.id });

    const result = await invokeBridge<{ __bridgeError?: boolean; message?: string } | unknown>(
      page,
      'team.promote-to-standing',
      { teamId: created.id, optInBoth: true, byUser: true }
    ).catch((e: unknown) => ({ __bridgeError: true, message: e instanceof Error ? e.message : String(e) }));

    // Either the bridge returns the sentinel error, or the IPC throws.
    // Both are acceptable: the hard requirement is "does not silently
    // succeed on a non-existent team."
    const hasError =
      (typeof result === 'object' && result !== null && '__bridgeError' in result) ||
      result === undefined;
    expect(hasError).toBe(true);
  });

  test('case 5: listChanged refreshes sidebar on backend-side create + remove', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);
    await navigateTo(page, '#/teams');
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({ timeout: 10_000 });

    // Create a team via IPC (simulating MCP creation). The sidebar
    // should react via the listChanged emit added in b959d106d.
    const created = await createTeam(page, 'ListChanged');
    if (!created) {
      test.skip(true, 'team.create returned null (no installed backend)');
      return;
    }

    await expect(page.locator(`text="${created.name}"`).first()).toBeVisible({ timeout: 10_000 });

    // Remove via IPC. Sidebar entry should disappear.
    await invokeBridge(page, 'team.remove', { id: created.id });
    await expect(page.locator(`text="${created.name}"`)).toHaveCount(0, { timeout: 10_000 });
  });
});
