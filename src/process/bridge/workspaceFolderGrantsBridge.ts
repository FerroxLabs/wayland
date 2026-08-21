/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The Settings half of the boundary axis: read the durable folder-grant list,
 * add to it from a native picker, and remove from it.
 *
 * SECURITY. All three providers are denied to remote WS peers at the wire by
 * bridgeAllowlist - the `workspaceFolderGrants.` prefix AND the three exact
 * keys. That is not defence in depth for its own sake: an external audit on the
 * previous milestone found a paired WebUI could mint a folder grant through the
 * consent card with nobody at the desktop, and this surface grants the same
 * authority by a different door.
 *
 * `add` takes NO path from the renderer. The main process opens the directory
 * picker itself, so the folder that gets granted is the one a human chose in an
 * OS dialog rather than a string the renderer supplied. It deliberately does
 * NOT reuse `ipcBridge.dialog.showOpen`: that provider registers whatever is
 * picked as an approved WRITE destination, and a read grant must never widen
 * the write surface as a side effect.
 *
 * NOTHING here may throw. The IPC bridge cannot carry a rejection - `invoke`
 * has no reject and no timeout - so a throwing provider is a card that spins
 * forever with neither its `catch` nor its `finally` running. Every failure
 * leaves as a classified value, the pattern proven at
 * `workspaceRetentionBridge.ts`.
 */

import { BrowserWindow, dialog } from 'electron';
import { ipcBridge } from '@/common';
import type {
  FolderGrantListResult,
  FolderGrantPickResult,
  FolderGrantRemoveResult,
  FolderGrantWorkspaceView,
} from '@/common/workspace/folderGrantsIpc';
import {
  defaultWorkspaceFolderGrantStore,
  type WorkspaceFolderGrantStore,
} from '@process/services/workspace/folderGrantStore';
import {
  resolveFolderGrantWorkspaces,
  revokeFolderGrantInLiveSessions,
  scanWorkspaceDirectory,
} from '@process/services/workspace/folderGrantSurface';

export type WorkspaceFolderGrantsBridgeDependencies = {
  store?: WorkspaceFolderGrantStore;
  scanDirectory?: typeof scanWorkspaceDirectory;
  revokeLive?: typeof revokeFolderGrantInLiveSessions;
  /** Resolves the folder the human chose, or null when they dismissed the picker. */
  pickDirectory?: () => Promise<string | null>;
};

async function pickDirectoryWithNativeDialog(): Promise<string | null> {
  const parent = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  const options = { properties: ['openDirectory' as const] };
  const result = await (parent ? dialog.showOpenDialog(parent, options) : dialog.showOpenDialog(options));
  if (result.canceled) return null;
  return result.filePaths[0] ?? null;
}

export function initWorkspaceFolderGrantsBridge(deps: WorkspaceFolderGrantsBridgeDependencies = {}): void {
  const store = deps.store ?? defaultWorkspaceFolderGrantStore();
  const scanDirectory = deps.scanDirectory ?? scanWorkspaceDirectory;
  const revokeLive = deps.revokeLive ?? revokeFolderGrantInLiveSessions;
  const pickDirectory = deps.pickDirectory ?? pickDirectoryWithNativeDialog;

  ipcBridge.workspaceFolderGrants.list.provider(async (): Promise<FolderGrantListResult> => {
    try {
      const records = await store.listAll();
      const dirs = await resolveFolderGrantWorkspaces(
        records.map((record) => record.workspaceId),
        scanDirectory
      );
      const workspaces: FolderGrantWorkspaceView[] = records.map((record) => {
        const resolvedDir = dirs.get(record.workspaceId);
        return {
          workspaceId: record.workspaceId,
          displayName: resolvedDir?.displayName ?? null,
          workspaceDir: resolvedDir?.dir ?? null,
          // Newest first: the entry a user is least able to account for is
          // almost always the one added most recently.
          grants: [...record.grants].sort((a, b) => b.grantedAtMs - a.grantedAtMs),
          // Passed through UNFILTERED. The store re-checks every recorded root
          // against the live filesystem on each read; an entry it would not
          // certify is not shown as if it were in effect, and is not hidden
          // either. Dropping these here would put the surface back to showing
          // a list that cannot be acted on.
          withheld: [...record.withheld].sort((a, b) => b.grant.grantedAtMs - a.grant.grantedAtMs),
        };
      });
      return { ok: true, workspaces };
    } catch {
      return { ok: false, errorCode: 'unavailable' };
    }
  });

  ipcBridge.workspaceFolderGrants.remove.provider(async (request): Promise<FolderGrantRemoveResult> => {
    const workspaceId = request?.workspaceId;
    const grantId = request?.grantId;
    if (typeof workspaceId !== 'string' || !workspaceId || typeof grantId !== 'string' || !grantId) {
      return { ok: false, errorCode: 'invalid-request' };
    }

    try {
      // Durable record FIRST, live sessions second. In that order a session
      // spawning concurrently replays the already-shrunk list, so there is no
      // window in which a new engine picks up the grant being withdrawn.
      const removed = await store.remove(workspaceId, grantId);
      if (!removed) return { ok: true, removed: false, liveSessionsRevoked: 0, liveSessionsFailed: 0 };

      const dirs = await resolveFolderGrantWorkspaces([workspaceId], scanDirectory);
      const live = await revokeLive(dirs.get(workspaceId)?.dir ?? null, grantId);
      return { ok: true, removed: true, liveSessionsRevoked: live.revoked, liveSessionsFailed: live.failed };
    } catch {
      return { ok: false, errorCode: 'unavailable' };
    }
  });

  ipcBridge.workspaceFolderGrants.add.provider(async (request): Promise<FolderGrantPickResult> => {
    const workspaceId = request?.workspaceId;
    if (typeof workspaceId !== 'string' || !workspaceId) return { ok: false, reason: 'unavailable' };

    try {
      // Only a workspace this surface can actually SHOW may be added to. A
      // renderer naming an id that resolves to nothing would otherwise create a
      // grant bucket no card can display and no human can later revoke.
      const dirs = await resolveFolderGrantWorkspaces([workspaceId], scanDirectory);
      if (!dirs.has(workspaceId)) return { ok: false, reason: 'unavailable' };

      const root = await pickDirectory();
      if (!root) return { ok: false, reason: 'cancelled' };

      const outcome = await store.add({ workspaceId, root, origin: 'settings' });
      // `=== false`, never `!outcome.ok`: this project does not enable
      // `strictNullChecks`, so a truthiness test will not narrow a
      // boolean-literal discriminant and `outcome.refusal` fails to compile.
      if (outcome.ok === false) return { ok: false, reason: 'refused', refusal: outcome.refusal };

      // Deliberately NOT granted to running sessions. Core refuses `grant_path`
      // outright unless the engine was spawned with `--allow-host-path-grants`,
      // which is only passed when the session HAD grants at spawn - so a live
      // grant here would report a success the engine never accepted. Widening
      // waits for the next session (fail closed); only shrinking takes effect
      // immediately (see `remove`).
      return { ok: true, root: outcome.addition.grant.root, created: outcome.addition.created };
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
  });
}
