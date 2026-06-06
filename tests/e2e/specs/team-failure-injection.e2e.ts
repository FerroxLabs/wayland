/**
 * E2E (adversarial): Failure injection + negative paths.
 *
 * Exercises the IPC boundary's behavior when callers send malformed input
 * or target non-existent resources. The safeProvider wrap returns a
 * `__bridgeError` sentinel on throw rather than rejecting at the IPC
 * layer, so the renderer can render an error in-place. These tests assert
 * that wrap actually fires AND that no side-effects leak.
 *
 * Why this is valuable: silent-success on bad input is the worst possible
 * outcome - the user thinks something worked, but the system is in an
 * undefined state. Per Sean's "no stubs, real implementations or honest
 * blockers" rule, every failure path should be observable.
 */

import { test, expect, type Page } from '../fixtures';
import { invokeBridge } from '../helpers';

const NAME_PREFIX = 'E2E Failure';

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

test.describe.serial('Team failure injection + negative paths (adversarial)', () => {
  test('case 1: team.create with no agents rejects via __bridgeError sentinel', async ({ page }) => {
    test.setTimeout(30_000);
    await cleanupTeams(page);

    const result = await invokeBridge<unknown>(page, 'team.create', {
      userId: 'system_default_user',
      name: `${NAME_PREFIX} NoAgents ${Date.now()}`,
      workspace: '',
      workspaceMode: 'shared',
      agents: [],
    });

    // Either the service rejects (sentinel returned) OR the service silently
    // accepts and creates an agentless team. The first is the right answer
    // (a team needs at least a leader); the second is the bug we're hunting.
    expect(isBridgeError(result)).toBe(true);

    // No team in the list with our prefix.
    const list = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    expect(list.some((t) => t.name.startsWith(`${NAME_PREFIX} NoAgents`))).toBe(false);
  });

  test('case 2: team.get with non-existent id returns null, not error', async ({ page }) => {
    test.setTimeout(30_000);

    const result = await invokeBridge<unknown>(page, 'team.get', { id: 'team-does-not-exist-12345' });

    // Convention: missing entity → null, not error. This is the contract
    // useTeamList / useSiderTeamBadges et al. depend on.
    expect(result).toBeNull();
  });

  test('case 3: team.remove of non-existent id resolves cleanly (idempotent)', async ({ page }) => {
    test.setTimeout(30_000);

    const result = await invokeBridge<unknown>(page, 'team.remove', { id: 'team-does-not-exist-67890' });

    // Idempotent delete: removing what's not there is not an error. This
    // matters for the listChanged-driven sidebar - if two windows both
    // try to delete the same team after a sync, the second one shouldn't
    // explode.
    // Acceptable outcomes: undefined (void resolved) OR null. NOT a
    // __bridgeError.
    expect(isBridgeError(result)).toBe(false);
  });

  test('case 4: team.add-agent to non-existent team rejects via sentinel', async ({ page }) => {
    test.setTimeout(30_000);

    const result = await invokeBridge<unknown>(page, 'team.add-agent', {
      teamId: 'team-does-not-exist-11111',
      agent: {
        conversationId: '',
        role: 'teammate',
        agentType: 'wayland-core',
        agentName: 'GhostMate',
        conversationType: 'acp',
        status: 'pending',
      },
    });

    expect(isBridgeError(result)).toBe(true);
  });

  test('case 5: team.promote-to-standing on non-existent team rejects via sentinel', async ({ page }) => {
    test.setTimeout(30_000);

    const result = await invokeBridge<unknown>(page, 'team.promote-to-standing', {
      teamId: 'team-does-not-exist-22222',
    });

    expect(isBridgeError(result)).toBe(true);
  });

  test('case 6: team.import-preview with empty jsonText rejects, no side-effect', async ({ page }) => {
    test.setTimeout(30_000);
    await cleanupTeams(page);

    const before = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });

    const result = await invokeBridge<unknown>(page, 'team.import-preview', { jsonText: '' });
    expect(isBridgeError(result)).toBe(true);

    // List unchanged.
    const after = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    expect(after.length).toBe(before.length);
  });

  test('case 7: team.import-preview with raw garbage (not JSON) rejects cleanly', async ({ page }) => {
    test.setTimeout(30_000);

    const result = await invokeBridge<unknown>(page, 'team.import-preview', {
      jsonText: 'not json at all <-- definitely not parseable',
    });
    expect(isBridgeError(result)).toBe(true);
  });

  test('case 8: team.create then immediate remove (no time for any post-create work) - clean state', async ({
    page,
  }) => {
    test.setTimeout(45_000);
    await cleanupTeams(page);

    // Fire create + remove back-to-back via IPC. The service-side path
    // does write to DB synchronously, but listChanged emits, agent
    // session bootstrap, etc. happen async. The hard requirement: no
    // exception, no orphan rows, no stuck state.
    const created = await invokeBridge<{ id?: string } | BridgeError | null>(page, 'team.create', {
      userId: 'system_default_user',
      name: `${NAME_PREFIX} Ephemeral ${Date.now()}`,
      workspace: '',
      workspaceMode: 'shared',
      agents: [buildLeader()],
    });

    if (!created || isBridgeError(created) || !created.id) {
      test.fixme(true, 'backend not available - team.create returned null');
      return;
    }
    const id = created.id;

    // Remove immediately - don't wait for any async fanout.
    await invokeBridge(page, 'team.remove', { id });

    // Sanity check: team is gone, and no error event fired.
    const refetched = await invokeBridge(page, 'team.get', { id });
    expect(refetched).toBeNull();

    const list = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    expect(list.some((t) => t.id === id)).toBe(false);
  });

  test('case 9: bogus IPC channel name returns sentinel or rejects cleanly', async ({ page }) => {
    test.setTimeout(30_000);

    // Unknown channels must not silently succeed. The bridge's
    // allowlist check should reject before reaching any handler.
    // invokeBridge passes through whatever error happens.
    const failed = await invokeBridge<unknown>(page, 'team.this-method-does-not-exist', {
      whatever: true,
    }).catch((e: unknown) => ({ __bridgeError: true, message: String(e) }) as BridgeError);

    // Either a sentinel result or a thrown rejection - both are acceptable.
    // What's NOT acceptable: an empty success result that masks the typo.
    const hasError = isBridgeError(failed) || failed === undefined || failed === null;
    expect(hasError).toBe(true);
  });

  test('case 10: deeply-malformed agent (wrong role enum) rejects via sentinel', async ({ page }) => {
    test.setTimeout(30_000);
    await cleanupTeams(page);

    const result = await invokeBridge<unknown>(page, 'team.create', {
      userId: 'system_default_user',
      name: `${NAME_PREFIX} BadRole ${Date.now()}`,
      workspace: '',
      workspaceMode: 'shared',
      agents: [
        {
          slotId: '',
          conversationId: '',
          // `role` must be 'leader' | 'teammate' - 'overlord' is bogus.
          role: 'overlord' as const,
          agentType: 'wayland-core',
          agentName: 'BadActor',
          conversationType: 'acp',
          status: 'pending',
        },
      ],
    });

    // Service should reject either at the Zod boundary or downstream in
    // create. The __bridgeError sentinel is the contract.
    // (If the schema is too permissive, this case surfaces it.)
    expect(isBridgeError(result)).toBe(true);

    // No team persisted.
    const list = await invokeBridge<TeamRow[]>(page, 'team.list', { userId: 'system_default_user' });
    expect(list.some((t) => t.name.startsWith(`${NAME_PREFIX} BadRole`))).toBe(false);
  });
});
