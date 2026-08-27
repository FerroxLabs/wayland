/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #982 - the durable folder-grant list is REPLAYED, so prior consent survives
 * the end of a session.
 *
 * v0.12.4 shipped the read half: grants are persisted in app user-data keyed by
 * workspace, vetted host-side, revocable by a stable id, and surfaced in
 * Settings. Nothing re-applied them. `FOLDER_GRANT_REPLAY_AVAILABLE` was false
 * for a documented reason - Core added `grant_path` to its protocol but shipped
 * no command fixture, so it is not representable in the pinned v1 schema and
 * `validateOutboundCommand` throws on it before a frame is written
 * (`FerroxLabs/wayland-core#314`, still open).
 *
 * `tool_approve` with `scope: { always_path: { root, write: false } }` IS
 * representable - the v0.13.4 corpus import added it, and
 * `pathGrantSeam.test.ts` pins that it validates. That is the same command the
 * consent card already sends when a user clicks "allow this folder". So the
 * replay does not need `grant_path`: it needs the host to answer the boundary
 * card the user has ALREADY answered, with the root they already consented to.
 *
 * THE BOUNDARY OF THE AUTHORITY, precisely:
 *  - the root must come out of the REVALIDATING read (`WorkspaceFolderGrantStore.list`),
 *    so a folder that has been renamed, re-pointed or replaced since consent is
 *    withheld rather than replayed;
 *  - it must then pass `vetFolderGrantRoot`, the SAME gate the card answer
 *    passes, so a root Wayland refuses to hand out is refused here too;
 *  - and what is handed over is the vetted CANONICAL granted root, never the
 *    string the engine asked about.
 * Nothing is widened: this replays a recorded decision, it cannot mint one.
 */

import { afterAll, describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { FolderGrant, WorkspaceFolderGrants } from '@/common/workspace/folderGrants';
import type { FolderGrantRootContext } from '@process/services/workspace/folderGrantRoots';
import { resolveReplayableGrantRoot } from '@process/services/workspace/folderGrantReplay';

const canonical = (p: string): string => realpathSync.native(p);

const FIXTURE = canonical(mkdtempSync(path.join(canonical(os.tmpdir()), 'wl-grant-replay-')));
const HOME = path.join(FIXTURE, 'home');
const GRANTED = path.join(HOME, 'Documents', 'reports');
const INSIDE = path.join(GRANTED, 'q3');
/** A sibling whose PATH STRING starts with the granted root. Not inside it. */
const PREFIX_SIBLING = path.join(HOME, 'Documents', 'reports-archive');
const UNGRANTED = path.join(HOME, 'Documents', 'invoices');
const WAYLAND_PRIVATE = path.join(FIXTURE, 'app-data');

mkdirSync(INSIDE, { recursive: true });
mkdirSync(PREFIX_SIBLING, { recursive: true });
mkdirSync(UNGRANTED, { recursive: true });
mkdirSync(WAYLAND_PRIVATE, { recursive: true });

afterAll(() => {
  try {
    rmSync(FIXTURE, { recursive: true, force: true });
  } catch {
    // Temp dirs are reaped by the OS.
  }
});

const WORKSPACE = path.join(FIXTURE, 'workspace');
mkdirSync(WORKSPACE, { recursive: true });

const context = (): Promise<FolderGrantRootContext> =>
  Promise.resolve({ homeDir: HOME, waylandPrivateRoots: [WAYLAND_PRIVATE] });

const grant = (root: string): FolderGrant => ({
  grantId: `g-${root}`,
  root,
  access: 'read',
  grantedAtMs: 1,
  origin: 'consent_card',
});

const listing = (over: Partial<WorkspaceFolderGrants> = {}): WorkspaceFolderGrants =>
  ({ workspaceId: `path:${WORKSPACE}`, grants: [], withheld: [], ...over }) as WorkspaceFolderGrants;

function deps(over: Partial<Parameters<typeof resolveReplayableGrantRoot>[2]> = {}) {
  return {
    resolveWorkspaceId: vi.fn(async () => `path:${WORKSPACE}`),
    listGrants: vi.fn(async () => listing({ grants: [grant(GRANTED)] as never })),
    resolveContext: context,
    ...over,
  } as Parameters<typeof resolveReplayableGrantRoot>[2];
}

describe('#982 a recorded folder grant answers the boundary card it already answered', () => {
  it('replays the grant when the engine asks about the granted folder itself', async () => {
    expect(await resolveReplayableGrantRoot(WORKSPACE, GRANTED, deps())).toBe(GRANTED);
  });

  it('replays the GRANTED root, not the narrower folder the engine named', async () => {
    // The user consented to the folder. Handing back the sub-folder would be a
    // different, undocumented decision, and would re-raise a card for every
    // sibling under a folder the user already opened.
    expect(await resolveReplayableGrantRoot(WORKSPACE, INSIDE, deps())).toBe(GRANTED);
  });

  it('does not replay for a folder nobody granted', async () => {
    expect(await resolveReplayableGrantRoot(WORKSPACE, UNGRANTED, deps())).toBeNull();
  });

  it('does not replay for a sibling that merely shares the granted root as a string prefix', async () => {
    expect(await resolveReplayableGrantRoot(WORKSPACE, PREFIX_SIBLING, deps())).toBeNull();
  });

  it('never replays a WITHHELD entry - the folder moved, so the consent did not transfer', async () => {
    const withheld = listing({ grants: [], withheld: [{ grant: grant(GRANTED), reason: 'root_changed' }] as never });
    expect(await resolveReplayableGrantRoot(WORKSPACE, GRANTED, deps({ listGrants: async () => withheld }))).toBeNull();
  });

  it('refuses a recorded root the host authority gate rejects today', async () => {
    // Wayland's own user-data tree is a host-only concept Core has never heard
    // of. A hand-edited grants file naming it must not become authority.
    const wayland = listing({ grants: [grant(WAYLAND_PRIVATE)] as never });
    expect(
      await resolveReplayableGrantRoot(WORKSPACE, WAYLAND_PRIVATE, deps({ listGrants: async () => wayland }))
    ).toBeNull();
  });

  it('replays nothing when the workspace has no honest grant key', async () => {
    const resolveWorkspaceId = vi.fn(async () => null);
    const listGrants = vi.fn(async () => listing({ grants: [grant(GRANTED)] as never }));
    expect(await resolveReplayableGrantRoot(WORKSPACE, GRANTED, deps({ resolveWorkspaceId, listGrants }))).toBeNull();
    expect(listGrants).not.toHaveBeenCalled();
  });

  it('fails closed when the list cannot be read', async () => {
    const listGrants = vi.fn(async () => {
      throw new Error('unreadable');
    });
    expect(await resolveReplayableGrantRoot(WORKSPACE, GRANTED, deps({ listGrants }))).toBeNull();
  });

  it('fails closed when the root context cannot be enumerated', async () => {
    const resolveContext = vi.fn(async () => {
      throw new Error('no context');
    });
    expect(await resolveReplayableGrantRoot(WORKSPACE, GRANTED, deps({ resolveContext } as never))).toBeNull();
  });

  it('replays nothing for a root that is not a usable path at all', async () => {
    for (const bad of [undefined, null, '', 42, 'relative/path']) {
      expect(await resolveReplayableGrantRoot(WORKSPACE, bad, deps())).toBeNull();
    }
  });
});
