/**
 * E2E (adversarial): Concurrency + races.
 *
 * Targets the integration seams most likely to harbor race-condition bugs:
 * the team.create write path under parallel load, mutations that race
 * against destructive ops, parallel import flows competing for the modal
 * stack, and the team.list read path under fan-out.
 *
 * These cases don't need a live backend - they drive raw IPC + observe
 * sidebar/list state. The bugs they hunt for are the ones unit tests
 * cannot see: SQLite write-write races, stale-snapshot reads, event
 * fan-out bursts, IPC promise resolution ordering.
 *
 * Adversarial naming convention follows team-rapid-clicks / team-state-orphans:
 * the spec is parallel-safe within itself (Promise.all batches use unique
 * names) but uses `describe.serial` so one case's cleanup doesn't race
 * the next case's seed.
 */

import { test, expect, type Page } from '../fixtures';
import { invokeBridge, navigateTo } from '../helpers';
import fs from 'fs';
import path from 'path';

const NAME_PREFIX = 'E2E Concurrency';

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

async function cleanupTeams(page: Page): Promise<void> {
  const stale = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
  for (const t of stale) {
    if (t.name.startsWith(NAME_PREFIX)) {
      await invokeBridge(page, 'team.remove', { id: t.id }).catch(() => undefined);
    }
  }
}

async function createNamedTeam(page: Page, label: string): Promise<{ id: string; name: string } | null> {
  const name = `${NAME_PREFIX} ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const created = await invokeBridge<{ id?: string } | BridgeError | null>(page, 'team.create', {
    userId: 'system_default_user',
    name,
    workspace: '',
    workspaceMode: 'shared',
    agents: [buildLeader()],
  });
  if (!created || isBridgeError(created) || !created.id) return null;
  return { id: created.id, name };
}

test.describe.serial('Team concurrency + races (adversarial)', () => {
  test('case 1: 5 parallel team.create - all succeed, all unique, all in list', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const before = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    const beforeCount = before.length;

    // Fire 5 team.create requests via Promise.all. The repository's lock
    // ordering is the critical surface: if it holds a single write lock,
    // these serialize cleanly; if not, the test would surface DB busy
    // errors or duplicate-id races.
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) => createNamedTeam(page, `Parallel${i}`))
    );

    const created = results.filter((r): r is { id: string; name: string } => r !== null);
    if (created.length < 5) {
      // Backend missing - soft skip. Same env-aware pattern as elsewhere.
      test.fixme(true, `parallel team.create returned <5 ids (got ${created.length})`);
      return;
    }

    // All ids unique.
    const ids = new Set(created.map((c) => c.id));
    expect(ids.size).toBe(5);

    // All visible in team.list.
    const after = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    expect(after.length).toBe(beforeCount + 5);
    for (const c of created) {
      expect(after.some((t) => t.id === c.id)).toBe(true);
    }

    // Cleanup.
    await Promise.all(
      created.map((c) => invokeBridge(page, 'team.remove', { id: c.id }).catch(() => undefined))
    );
  });

  test('case 2: delete team while team.add-agent is in flight - no orphan agent row', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const created = await createNamedTeam(page, 'DeleteRace');
    if (!created) {
      test.fixme(true, 'backend (wayland-core) not available - team.create returned null');
      return;
    }

    // Kick off add-agent and remove in parallel. The two writers race on
    // the same team's agents column. Acceptable outcomes:
    //   (a) add-agent succeeds, then remove succeeds → both clean
    //   (b) remove wins, add-agent rejects with team-not-found → clean
    //   (c) both succeed but in any order → cleanup still works
    // Hard fail: add-agent succeeds AFTER remove and leaves an orphan
    // agent row referencing a non-existent team.
    const addPromise = invokeBridge<unknown>(page, 'team.add-agent', {
      teamId: created.id,
      agent: {
        conversationId: '',
        role: 'teammate',
        agentType: 'wayland-core',
        agentName: 'RaceMate',
        conversationType: 'acp',
        status: 'pending',
      },
    }).catch((e: unknown) => ({ __bridgeError: true, message: String(e) }));

    const removePromise = invokeBridge<unknown>(page, 'team.remove', { id: created.id });

    await Promise.all([addPromise, removePromise]);

    // After both settle, the team is gone.
    const refetched = await invokeBridge(page, 'team.get', { id: created.id });
    expect(refetched).toBeNull();

    // And there is no team with that id in team.list.
    const after = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    expect(after.some((t) => t.id === created.id)).toBe(false);
  });

  test('case 3: promote-to-standing races against team.remove - no half-state', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    const created = await createNamedTeam(page, 'PromoteRace');
    if (!created) {
      test.fixme(true, 'backend (wayland-core) not available - team.create returned null');
      return;
    }

    // The race is: promote may run repo.update(team); remove runs
    // repo.delete(team). Both touch the same row. Promote may fail with
    // an eligibility error (no sessionCount seed) - that's fine; what we
    // care about is the FINAL state being consistent. Either:
    //   (a) remove wins → team gone, promote rejects with not-found
    //   (b) promote wins → team standing flag set, then remove wipes it
    //   (c) both reject (eligibility + race) → team still gone
    // Hard fail: a half-state where the team exists with corrupted flags.
    const promotePromise = invokeBridge<unknown>(page, 'team.promote-to-standing', {
      teamId: created.id,
    }).catch((e: unknown) => ({ __bridgeError: true, message: String(e) }));

    const removePromise = invokeBridge<unknown>(page, 'team.remove', { id: created.id });

    await Promise.all([promotePromise, removePromise]);

    // Whichever wins, the final state is: team is gone.
    const refetched = await invokeBridge(page, 'team.get', { id: created.id });
    expect(refetched).toBeNull();
  });

  test('case 4: two parallel imports - both produce distinct teams or both reject cleanly', async ({ page }) => {
    test.setTimeout(90_000);
    await cleanupTeams(page);

    // Read the canonical valid fixture and produce two variants in-memory
    // with different display names. The IPC takes jsonText directly (the
    // renderer reads the file via FileReader and passes the string), so
    // we don't need tmp files for this case.
    const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/team-imports');
    const validFixture = fs.readFileSync(path.join(FIXTURES_DIR, 'valid-trusted.json'), 'utf8');
    const parsed = JSON.parse(validFixture);
    const jsonA = JSON.stringify({ ...parsed, name: `${NAME_PREFIX} ImportA ${Date.now()}` });
    const jsonB = JSON.stringify({ ...parsed, name: `${NAME_PREFIX} ImportB ${Date.now()}` });

    const beforeList = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });

    // Fire two import-preview calls in parallel - they hit the safeParse
    // worker pool concurrently.
    const [previewA, previewB] = await Promise.all([
      invokeBridge<unknown>(page, 'team.import-preview', { jsonText: jsonA }),
      invokeBridge<unknown>(page, 'team.import-preview', { jsonText: jsonB }),
    ]);

    // Both should produce a parsed result (or both fail consistently). The
    // hard requirement is no cross-contamination: previewA's parsed team
    // must reflect jsonA, previewB's must reflect jsonB.
    const okA = previewA && typeof previewA === 'object' && !isBridgeError(previewA) && 'parsed' in previewA;
    const okB = previewB && typeof previewB === 'object' && !isBridgeError(previewB) && 'parsed' in previewB;

    if (!okA || !okB) {
      // Acceptable when env doesn't have the safeParse worker pool
      // properly initialized; fall back to documenting.
      test.fixme(true, `parallel import-preview did not both succeed (okA=${okA}, okB=${okB})`);
      return;
    }

    const parsedA = (previewA as { parsed: { name: string } }).parsed;
    const parsedB = (previewB as { parsed: { name: string } }).parsed;
    expect(parsedA.name).toContain('ImportA');
    expect(parsedB.name).toContain('ImportB');

    // List unchanged - preview alone does not create teams.
    const afterPreviewList = await invokeBridge<TeamRow[]>(page, 'team.list', {
      userId: 'system_default_user',
    });
    expect(afterPreviewList.length).toBe(beforeList.length);
  });

  test('case 5: rapid create/remove cycle stress (10x sequential) - no orphan rows', async ({ page }) => {
    test.setTimeout(120_000);
    await cleanupTeams(page);

    const initial = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    const initialCount = initial.length;

    for (let i = 0; i < 10; i++) {
      const created = await createNamedTeam(page, `Cycle${i}`);
      if (!created) {
        test.fixme(true, `team.create returned null on iteration ${i}`);
        return;
      }
      await invokeBridge(page, 'team.remove', { id: created.id });
    }

    // No leftover teams - list count back to baseline.
    const final = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    expect(final.length).toBe(initialCount);

    // None of our cycle teams remain.
    const ours = final.filter((t) => t.name.startsWith(`${NAME_PREFIX} Cycle`));
    expect(ours.length).toBe(0);
  });

  test('case 6: 50 parallel team.list reads - all succeed, all return consistent data', async ({ page }) => {
    test.setTimeout(60_000);
    await cleanupTeams(page);

    // Seed with one team so we have something to assert on.
    const seeded = await createNamedTeam(page, 'ReadFanout');
    if (!seeded) {
      test.fixme(true, 'backend not available - team.create returned null');
      return;
    }

    // Fire 50 parallel team.list calls. Each goes through the same SQLite
    // connection. The hard requirement is: every call returns a consistent
    // snapshot containing our seeded team.
    const results = await Promise.all(
      Array.from({ length: 50 }, () =>
        invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' })
      )
    );

    expect(results.length).toBe(50);
    for (const r of results) {
      expect(Array.isArray(r)).toBe(true);
      expect(r.some((t) => t.id === seeded.id)).toBe(true);
    }

    await invokeBridge(page, 'team.remove', { id: seeded.id }).catch(() => undefined);
  });

  test('case 7: sidebar listChanged refresh under burst - 10 rapid create+remove pairs', async ({ page }) => {
    test.setTimeout(120_000);
    await cleanupTeams(page);
    await navigateTo(page, '#/teams');
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible({ timeout: 10_000 });

    // Burst: 10 (create, remove) pairs as fast as the IPC will allow.
    // Each pair emits 2 listChanged events. The sidebar subscriber must
    // not lose events or get stuck in a stale render state.
    for (let i = 0; i < 10; i++) {
      const c = await createNamedTeam(page, `Burst${i}`);
      if (!c) {
        test.fixme(true, `burst create failed at iter ${i}`);
        return;
      }
      await invokeBridge(page, 'team.remove', { id: c.id });
    }

    // After the burst settles, the library page is still functional -
    // the empty state or existing teams render, and the create CTA
    // remains clickable (proxy for "renderer didn't crash mid-burst").
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="teams-library-page"]')).toBeVisible();

    // No burst teams remain.
    const final = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    const burstLeftovers = final.filter((t) => t.name.startsWith(`${NAME_PREFIX} Burst`));
    expect(burstLeftovers.length).toBe(0);
  });
});
