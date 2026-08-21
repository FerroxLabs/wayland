/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The Settings half of the boundary axis.
 *
 * TWO THINGS THIS FILE EXISTS TO STOP.
 *
 * 1. A remove that is only a file edit. Core holds grants in session memory and
 *    nothing re-reads the durable list mid-session, so deleting the record
 *    alone leaves every running engine still reading the folder. The user
 *    watched a revoke succeed and nothing happened. So the live revoke is
 *    asserted as a CALL the provider makes, in the right ORDER, not as an
 *    outcome some other rule could supply.
 *
 * 2. A refusal reported as a generic failure. The store returns six distinct
 *    refusals so a person can act on them; collapsing them into "could not add"
 *    would be green and useless.
 *
 * NOTHING here may reject. `buildProvider(...).invoke` has no reject and no
 * timeout, so a throwing provider is a card that spins forever. Every test that
 * drives a failure therefore asserts a RESOLVED classified value - and would
 * fail loudly (unhandled rejection) if the provider ever threw instead.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FolderGrantRefusal } from '@/common/workspace/folderGrants';

type Handler<T, R> = (request: T) => Promise<R>;

const { providers } = vi.hoisted(() => ({
  providers: {
    list: { handler: null as Handler<void, unknown> | null },
    remove: { handler: null as Handler<unknown, unknown> | null },
    add: { handler: null as Handler<unknown, unknown> | null },
  },
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    workspaceFolderGrants: {
      list: { provider: (h: never) => (providers.list.handler = h) },
      remove: { provider: (h: never) => (providers.remove.handler = h) },
      add: { provider: (h: never) => (providers.add.handler = h) },
    },
  },
}));

// Electron is only reached by the REAL picker, which every test replaces.
vi.mock('electron', () => ({
  BrowserWindow: { getFocusedWindow: () => null, getAllWindows: () => [] },
  dialog: {
    showOpenDialog: async () => {
      throw new Error('the native picker must never be reached in a unit test');
    },
  },
}));

import { initWorkspaceFolderGrantsBridge } from '@process/bridge/workspaceFolderGrantsBridge';

const WS_ON_DISK = 'ws-on-disk';
const WS_GONE = 'ws-gone';
const DIR_ON_DISK = '/Users/x/Documents/Wayland/Projects/Ledger';

const grant = (over: Partial<{ grantId: string; root: string; grantedAtMs: number; origin: string }> = {}) => ({
  grantId: over.grantId ?? 'g-1',
  root: over.root ?? '/Users/x/Reference',
  access: 'read' as const,
  grantedAtMs: over.grantedAtMs ?? 1_700_000_000_000,
  origin: (over.origin ?? 'consent_card') as 'consent_card' | 'settings',
});

type Harness = {
  store: {
    listAll: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
  };
  scanDirectory: ReturnType<typeof vi.fn>;
  revokeLive: ReturnType<typeof vi.fn>;
  pickDirectory: ReturnType<typeof vi.fn>;
  /** Every call in the order it happened, so ORDER can be asserted, not inferred. */
  calls: string[];
};

let h: Harness;

beforeEach(() => {
  const calls: string[] = [];
  h = {
    calls,
    store: {
      listAll: vi.fn(async () => [
        {
          workspaceId: WS_ON_DISK,
          grants: [grant()],
          // The store re-checks every recorded root on each read and hands back
          // the ones it would not certify separately. A workspace with nothing
          // withheld still carries the field.
          withheld: [],
        },
        {
          workspaceId: WS_GONE,
          grants: [grant({ grantId: 'g-2', root: '/Users/x/Old', origin: 'settings' })],
          withheld: [{ grant: grant({ grantId: 'g-3', root: '/Users/x/Reports' }), reason: 'root_changed' as const }],
        },
      ]),
      remove: vi.fn(async (_workspaceId: string, grantId: string) => {
        calls.push(`store.remove:${grantId}`);
        return grantId === 'g-1' ? grant() : null;
      }),
      add: vi.fn(async (input: { root: string }) => {
        calls.push(`store.add:${input.root}`);
        return { ok: true, addition: { grant: grant({ root: input.root }), created: true, superseded: [] } };
      }),
    },
    scanDirectory: vi.fn(async () => [{ workspaceId: WS_ON_DISK, dir: DIR_ON_DISK, displayName: 'Ledger' }]),
    revokeLive: vi.fn(async (dir: string | null, grantId: string) => {
      calls.push(`revokeLive:${dir}:${grantId}`);
      return { revoked: 1, failed: 0 };
    }),
    pickDirectory: vi.fn(async () => {
      calls.push('pickDirectory');
      return '/Users/x/Reference';
    }),
  };

  providers.list.handler = null;
  providers.remove.handler = null;
  providers.add.handler = null;
  initWorkspaceFolderGrantsBridge({
    store: h.store as never,
    scanDirectory: h.scanDirectory as never,
    revokeLive: h.revokeLive as never,
    pickDirectory: h.pickDirectory as never,
  });
  expect(providers.list.handler).toBeTypeOf('function');
  expect(providers.remove.handler).toBeTypeOf('function');
  expect(providers.add.handler).toBeTypeOf('function');
});

/**
 * Unwrap an accepted result.
 *
 * Written as a helper because `result.ok && result.something` silently
 * collapses a REFUSAL to `false`, which makes every `.toBe(false)` assertion
 * pass on the exact failure it was written to catch. That idiom survived a
 * mutation on the store lane.
 */
function accepted<T extends { ok: boolean }>(result: T): Extract<T, { ok: true }> {
  if (!result.ok) throw new Error(`expected an accepted result, got: ${JSON.stringify(result)}`);
  return result as Extract<T, { ok: true }>;
}

describe('workspaceFolderGrants.list', () => {
  it('carries the origin and the grant time for every entry', async () => {
    const result = accepted((await providers.list.handler!()) as { ok: boolean; workspaces: unknown[] });
    const workspace = (result.workspaces as { workspaceId: string; grants: unknown[] }[]).find(
      (w) => w.workspaceId === WS_ON_DISK
    )!;
    // Both fields are persisted precisely so a user can account for an entry.
    // Dropping either from the projection makes the list unauditable.
    expect(workspace.grants[0]).toMatchObject({ origin: 'consent_card', grantedAtMs: 1_700_000_000_000 });
  });

  it('resolves the workspace name from disk', async () => {
    const result = accepted((await providers.list.handler!()) as { ok: boolean; workspaces: unknown[] });
    expect(result.workspaces).toContainEqual(
      expect.objectContaining({ workspaceId: WS_ON_DISK, displayName: 'Ledger', workspaceDir: DIR_ON_DISK })
    );
  });

  it('still lists a workspace whose folder is gone - that is the entry a user most needs to revoke', async () => {
    const result = accepted((await providers.list.handler!()) as { ok: boolean; workspaces: unknown[] });
    expect(result.workspaces).toContainEqual(
      expect.objectContaining({ workspaceId: WS_GONE, displayName: null, workspaceDir: null })
    );
    // Positive control: the resolvable one is present too, so the assertion
    // above is not passing because the projection returned everything or nothing.
    expect((result.workspaces as { workspaceId: string }[]).map((w) => w.workspaceId)).toContain(WS_ON_DISK);
  });

  /**
   * An entry the store would no longer certify - its folder was renamed and
   * re-pointed since the user allowed it - must reach the card. Dropping it
   * here would put the surface back to showing a list nobody can act on: the
   * record is still on disk, still replayable by anything that skips the check,
   * and the one entry the user most needs to remove.
   */
  it('carries WITHHELD entries through with their reason, and does not mix them into the live list', async () => {
    const result = accepted((await providers.list.handler!()) as { ok: boolean; workspaces: unknown[] });
    const rows = result.workspaces as {
      workspaceId: string;
      grants: { grantId: string }[];
      withheld: { grant: { grantId: string }; reason: string }[];
    }[];

    const gone = rows.find((row) => row.workspaceId === WS_GONE)!;
    expect(gone.withheld).toEqual([expect.objectContaining({ reason: 'root_changed' })]);
    // MECHANISM: it is NOT in `grants`, which is the half the engine is handed.
    expect(gone.grants.map((entry) => entry.grantId)).toEqual(['g-2']);
    // Positive control: a workspace with nothing withheld reports an empty
    // list, so the assertion above is the projection and not a shared object.
    expect(rows.find((row) => row.workspaceId === WS_ON_DISK)!.withheld).toEqual([]);
  });

  it('resolves a classified failure instead of rejecting when the store is unreadable', async () => {
    h.store.listAll.mockRejectedValueOnce(new Error('disk on fire'));
    // If this ever rejects, the Storage card hangs forever with no message.
    await expect(providers.list.handler!()).resolves.toEqual({ ok: false, errorCode: 'unavailable' });
  });
});

describe('workspaceFolderGrants.remove', () => {
  it('withdraws the grant from live sessions, not just from the file', async () => {
    const result = accepted(
      (await providers.remove.handler!({ workspaceId: WS_ON_DISK, grantId: 'g-1' })) as {
        ok: boolean;
        liveSessionsRevoked: number;
      }
    );
    expect(h.revokeLive).toHaveBeenCalledWith(DIR_ON_DISK, 'g-1');
    expect(result.liveSessionsRevoked).toBe(1);
  });

  it('drops the durable record BEFORE it revokes, so a concurrent spawn replays the shrunk list', async () => {
    await providers.remove.handler!({ workspaceId: WS_ON_DISK, grantId: 'g-1' });
    expect(h.calls).toEqual(['store.remove:g-1', `revokeLive:${DIR_ON_DISK}:g-1`]);
  });

  it('reports a live revoke that did not land instead of claiming success', async () => {
    // Today this is the REAL path: `revoke_path` is absent from the pinned
    // host-command schema, so the outbound validator throws and the engine
    // never sees it (FerroxLabs/wayland-core#314). A remove that could not
    // reach a running engine must say so.
    h.revokeLive.mockResolvedValueOnce({ revoked: 0, failed: 2 });
    const result = accepted(
      (await providers.remove.handler!({ workspaceId: WS_ON_DISK, grantId: 'g-1' })) as {
        ok: boolean;
        removed: boolean;
        liveSessionsRevoked: number;
        liveSessionsFailed: number;
      }
    );
    expect(result).toMatchObject({ removed: true, liveSessionsRevoked: 0, liveSessionsFailed: 2 });
  });

  it('refuses a request with no grant id, while a complete one still succeeds', async () => {
    expect(await providers.remove.handler!({ workspaceId: WS_ON_DISK, grantId: '' })).toEqual({
      ok: false,
      errorCode: 'invalid-request',
    });
    expect(await providers.remove.handler!(undefined)).toEqual({ ok: false, errorCode: 'invalid-request' });
    // Positive control: the refusals above are a decision, not a dead provider.
    expect(
      accepted((await providers.remove.handler!({ workspaceId: WS_ON_DISK, grantId: 'g-1' })) as { ok: boolean })
    ).toBeTruthy();
    // And nothing was removed or revoked on the refused calls.
    expect(h.store.remove).toHaveBeenCalledTimes(1);
  });

  it('revokes nothing when the grant was not there to remove', async () => {
    const result = accepted(
      (await providers.remove.handler!({ workspaceId: WS_ON_DISK, grantId: 'never-existed' })) as {
        ok: boolean;
        removed: boolean;
      }
    );
    expect(result.removed).toBe(false);
    expect(h.revokeLive).not.toHaveBeenCalled();
    // Positive control: a grant that IS there does reach the revoke.
    await providers.remove.handler!({ workspaceId: WS_ON_DISK, grantId: 'g-1' });
    expect(h.revokeLive).toHaveBeenCalledTimes(1);
  });

  it('resolves a classified failure instead of rejecting when the store throws', async () => {
    h.store.remove.mockRejectedValueOnce(new Error('disk on fire'));
    await expect(providers.remove.handler!({ workspaceId: WS_ON_DISK, grantId: 'g-1' })).resolves.toEqual({
      ok: false,
      errorCode: 'unavailable',
    });
  });
});

describe('workspaceFolderGrants.add', () => {
  it('takes no path from the caller - the folder comes from the native picker', async () => {
    await providers.add.handler!({ workspaceId: WS_ON_DISK, root: '/etc' } as never);
    // The smuggled `root` is ignored; what gets granted is what the picker returned.
    expect(h.store.add).toHaveBeenCalledWith({
      workspaceId: WS_ON_DISK,
      root: '/Users/x/Reference',
      origin: 'settings',
    });
  });

  it('refuses a workspace that resolves to nothing on disk, without opening the picker', async () => {
    expect(await providers.add.handler!({ workspaceId: WS_GONE })).toEqual({ ok: false, reason: 'unavailable' });
    expect(h.pickDirectory).not.toHaveBeenCalled();
    // Positive control: a workspace that IS on disk gets the picker and a grant.
    expect(accepted((await providers.add.handler!({ workspaceId: WS_ON_DISK })) as { ok: boolean })).toBeTruthy();
    expect(h.pickDirectory).toHaveBeenCalledTimes(1);
  });

  it('stays silent when the picker is dismissed, and records nothing', async () => {
    h.pickDirectory.mockResolvedValueOnce(null);
    expect(await providers.add.handler!({ workspaceId: WS_ON_DISK })).toEqual({ ok: false, reason: 'cancelled' });
    expect(h.store.add).not.toHaveBeenCalled();
    // Positive control: the very next add, with a folder chosen, is recorded.
    expect(accepted((await providers.add.handler!({ workspaceId: WS_ON_DISK })) as { ok: boolean })).toBeTruthy();
    expect(h.store.add).toHaveBeenCalledTimes(1);
  });

  const REFUSALS: FolderGrantRefusal[] = [
    'root_of_filesystem',
    'home_directory',
    'wayland_private',
    'credential_store',
    'grant_cap_reached',
    'not_an_absolute_directory',
  ];

  it.each(REFUSALS)('surfaces the %s refusal verbatim rather than as a generic failure', async (refusal) => {
    h.store.add.mockResolvedValueOnce({ ok: false, refusal });
    expect(await providers.add.handler!({ workspaceId: WS_ON_DISK })).toEqual({
      ok: false,
      reason: 'refused',
      refusal,
    });
    // Positive control: the refusal above is the store deciding, not the
    // provider failing everything.
    expect(accepted((await providers.add.handler!({ workspaceId: WS_ON_DISK })) as { ok: boolean })).toBeTruthy();
  });

  it('reports a redundant add honestly instead of claiming a new grant', async () => {
    h.store.add.mockResolvedValueOnce({
      ok: true,
      addition: { grant: grant({ root: '/Users/x/Reference' }), created: false, superseded: [] },
    });
    const result = accepted(
      (await providers.add.handler!({ workspaceId: WS_ON_DISK })) as { ok: boolean; created: boolean }
    );
    expect(result.created).toBe(false);
  });

  it('resolves a classified failure instead of rejecting when the picker throws', async () => {
    h.pickDirectory.mockRejectedValueOnce(new Error('no window'));
    await expect(providers.add.handler!({ workspaceId: WS_ON_DISK })).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });
});
