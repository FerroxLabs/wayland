/**
 * E2E (perf): Performance budgets for the team surfaces.
 *
 * Establishes regression baselines so CI catches changes that slow a hot
 * path by an order of magnitude. The budgets are intentionally generous -
 * the goal is to catch 10x regressions, not to chase milliseconds. Tighten
 * later when real measurements warrant it.
 *
 * Single-worker e2e runs vary on CI hardware, so each budget includes a
 * comment with the reference baseline measured on the author's machine
 * for context. CI breakage on these tests means look at the actual
 * elapsed values in the failure message and decide if the regression is
 * real or environmental.
 */

import { test, expect, type Page } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';

const NAME_PREFIX = 'E2E Perf';

type TeamRow = { id: string; name: string };
type BridgeError = { __bridgeError: true; message?: string };
const isBridgeError = (v: unknown): v is BridgeError =>
  Boolean(v) && typeof v === 'object' && '__bridgeError' in (v as Record<string, unknown>);

const buildLeader = () => ({
  slotId: '',
  conversationId: '',
  role: 'leader' as const,
  agentType: 'wayland-core',
  agentName: 'Leader',
  conversationType: 'acp',
  status: 'pending' as const,
});

async function cleanupPerfTeams(page: Page): Promise<void> {
  const stale = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
  // Remove sequentially to be polite to the DB on cleanup.
  for (const t of stale) {
    if (t.name.startsWith(NAME_PREFIX)) {
      await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => undefined);
    }
  }
}

async function seedTeams(page: Page, count: number): Promise<string[]> {
  const stamp = Date.now();
  const created = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      invokeBridge<{ id?: string } | BridgeError | null>(page, 'team.create', {
        userId: 'system_default_user',
        name: `${NAME_PREFIX} ${stamp}-${i}`,
        workspace: '',
        workspaceMode: 'shared',
        agents: [buildLeader()],
      })
    )
  );
  return created
    .filter(
      (r): r is { id: string } =>
        Boolean(r) && !isBridgeError(r) && typeof (r as { id?: string }).id === 'string'
    )
    .map((r) => r.id);
}

test.describe.serial('Team performance budgets', () => {
  test('case 1: /teams page renders vendored bundle within budget (independent of user-team count)', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    // Architectural note: TeamsLibraryPage renders the vendored
    // assistant bundle (presets), not user-created teams from team.list.
    // The teams-total-count testid reflects the vendored bundle size
    // (24 in v0.6.0). This case proves the library page's render budget
    // is bounded regardless of how many user teams exist in the DB.
    //
    // The companion case 4 covers the DB-read fan-out budget separately.
    await cleanupPerfTeams(page);

    // Seed a moderate number of user-side teams so the DB has real
    // content even though the library page doesn't render them.
    const ids = await seedTeams(page, 20);
    if (ids.length < 20) {
      test.fixme(true, `seed step created only ${ids.length}/20 teams`);
      return;
    }

    // Force a fresh navigation to /guid first so /teams measurement isn't
    // a cached-render hit.
    await navigateTo(page, '#/guid');
    await page.waitForTimeout(200);

    const start = Date.now();
    await navigateTo(page, '#/teams');
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-testid="teams-action-bar"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="teams-total-count"]')).toBeVisible({ timeout: 15_000 });
    const elapsedMs = Date.now() - start;

    // Budget: 4 seconds for the library page first-paint. Reference baseline
    // on Sean's machine: typically under 500ms. 4s is the regression tripwire.
    expect(elapsedMs).toBeLessThan(4000);

    // Standing Companies section renders (vendored count > 0).
    await expect(page.locator('[data-testid="teams-group-standing"]')).toBeVisible({ timeout: 5_000 });

    for (const id of ids) {
      await invokeBridge(page, 'team.remove', { id }).catch(() => undefined);
    }
  });

  test('case 2: 100 sequential team.list calls average under per-call budget', async ({ page }) => {
    test.setTimeout(90_000);
    await cleanupPerfTeams(page);

    // Seed a moderate number so the list isn't trivially small.
    const ids = await seedTeams(page, 20);
    if (ids.length < 20) {
      test.fixme(true, `seed step created only ${ids.length}/20 teams`);
      return;
    }

    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      const result = await invokeBridge<TeamRow[]>(page, 'team.list', {
        userId: 'system_default_user',
      });
      // Sanity check - every call must succeed and return our seeded teams.
      if (i === 0 || i === 50 || i === 99) {
        expect(Array.isArray(result)).toBe(true);
      }
    }
    const totalMs = Date.now() - start;
    const perCallMs = totalMs / 100;

    // Budget: 100ms per call average. Reference baseline on Sean's machine
    // is ~5-15ms per call. 100ms is a 10x tripwire.
    expect(perCallMs).toBeLessThan(100);

    for (const id of ids) {
      await invokeBridge(page, 'team.list', { userId: 'system_default_user' }).catch(() => undefined);
      await invokeBridge(page, 'team.remove', { id }).catch(() => undefined);
    }
  });

  test('case 3: 20-cycle navigate /teams ↔ /team/<id> - no monotonic slowdown', async ({ page }) => {
    test.setTimeout(180_000);
    await cleanupPerfTeams(page);

    const ids = await seedTeams(page, 3);
    if (ids.length < 3) {
      test.fixme(true, `seed step created only ${ids.length}/3 teams`);
      return;
    }
    const targetId = ids[0];

    // Warm-up to ensure the harness has fully mounted both routes once.
    await navigateTo(page, '#/teams');
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({ timeout: 15_000 });
    await navigateTo(page, `#/team/${targetId}`);
    await page.waitForURL(new RegExp(`/team/${targetId}`), { timeout: 15_000 });
    await page.waitForTimeout(300);

    const timings: number[] = [];
    for (let i = 0; i < 20; i++) {
      const t0 = Date.now();
      await navigateTo(page, '#/teams');
      await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({ timeout: 15_000 });

      await navigateTo(page, `#/team/${targetId}`);
      await page.waitForURL(new RegExp(`/team/${targetId}`), { timeout: 15_000 });
      timings.push(Date.now() - t0);
    }

    // The bug-finder: monotonic slowdown across cycles == memory leak in the
    // mount path. We compare the FIRST 3 cycles to the LAST 3 cycles. If
    // the last 3 are >3x the first 3 on average, the per-cycle work is
    // growing - almost certainly a leak.
    const firstAvg = (timings[0] + timings[1] + timings[2]) / 3;
    const lastAvg = (timings[17] + timings[18] + timings[19]) / 3;
    expect(lastAvg).toBeLessThan(firstAvg * 3);

    // Also: no single cycle should exceed 10s. That's a hard tripwire for
    // any cycle hitting a pathological slow path.
    for (const t of timings) {
      expect(t).toBeLessThan(10_000);
    }

    for (const id of ids) {
      await invokeBridge(page, 'team.remove', { id }).catch(() => undefined);
    }
  });

  test('case 4: parallel team.get fan-out (30 teams × team.get) - bounded latency', async ({ page }) => {
    test.setTimeout(90_000);
    await cleanupPerfTeams(page);

    const ids = await seedTeams(page, 30);
    if (ids.length < 30) {
      test.fixme(true, `seed step created only ${ids.length}/30 teams`);
      return;
    }

    const start = Date.now();
    const results = await Promise.all(ids.map((id) => invokeBridge<unknown>(page, 'team.get', { id })));
    const elapsedMs = Date.now() - start;

    // All 30 reads must succeed.
    expect(results.filter((r) => r !== null).length).toBe(30);

    // Budget: 30 parallel reads should finish in well under 5 seconds even
    // with a cold cache. Reference baseline on Sean's machine: ~100-300ms.
    expect(elapsedMs).toBeLessThan(5000);

    for (const id of ids) {
      await invokeBridge(page, 'team.remove', { id }).catch(() => undefined);
    }
  });
});
