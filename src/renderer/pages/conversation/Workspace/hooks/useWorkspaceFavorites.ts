/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IDirOrFile } from '@/common/adapter/ipcBridge';
import { useCallback, useEffect, useState } from 'react';

/**
 * Per-project pinned files for the workspace Files panel (#142). A favorite is
 * stored by its relative path (the stable identity within a project) plus the
 * display name and absolute path so a favorite row can render and act without
 * the file being present in the lazily-loaded tree.
 */
export type WorkspaceFavorite = { relativePath: string; name: string; fullPath: string };

/**
 * Favorites are a project-Files affordance only. Project workspaces address the
 * shared Workspace component with a `project:<id>` conversation id; personal
 * chats use a plain id and never show favorites.
 */
export const isProjectConversation = (conversationId: string): boolean => conversationId.startsWith('project:');

/** localStorage key, namespaced by conversation id so projects never cross-pollinate. */
export const favoritesStorageKey = (conversationId: string): string => `wayland_ws_favorites_${conversationId}`;

/** Add a favorite, de-duplicated by relative path (idempotent). */
export const addFavorite = (list: WorkspaceFavorite[], entry: WorkspaceFavorite): WorkspaceFavorite[] =>
  list.some((f) => f.relativePath === entry.relativePath) ? list : [...list, entry];

/** Remove a favorite by relative path. */
export const removeFavorite = (list: WorkspaceFavorite[], relativePath: string): WorkspaceFavorite[] =>
  list.filter((f) => f.relativePath !== relativePath);

/** Parse persisted favorites, tolerating absent/corrupt/legacy values. */
export const parseFavorites = (raw: string | null): WorkspaceFavorite[] => {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (e): e is WorkspaceFavorite =>
        !!e &&
        typeof (e as WorkspaceFavorite).relativePath === 'string' &&
        typeof (e as WorkspaceFavorite).name === 'string' &&
        typeof (e as WorkspaceFavorite).fullPath === 'string'
    );
  } catch {
    return [];
  }
};

/**
 * Manage the favorites pinned for one project workspace: load + persist to
 * localStorage, and prune any whose backing file no longer exists (deleted or
 * renamed away) so the section never shows a dead row.
 */
export const useWorkspaceFavorites = ({ conversationId }: { conversationId: string }) => {
  const isProject = isProjectConversation(conversationId);
  const [favorites, setFavorites] = useState<WorkspaceFavorite[]>([]);

  const persist = useCallback(
    (next: WorkspaceFavorite[]) => {
      setFavorites(next);
      try {
        localStorage.setItem(favoritesStorageKey(conversationId), JSON.stringify(next));
      } catch {
        // Storage unavailable/full - keep the in-memory copy for this session.
      }
    },
    [conversationId]
  );

  // Load on mount / project switch, then drop favorites whose file is gone.
  useEffect(() => {
    if (!isProject) {
      setFavorites([]);
      return;
    }
    let cancelled = false;
    const loaded = parseFavorites(localStorage.getItem(favoritesStorageKey(conversationId)));
    setFavorites(loaded);
    if (loaded.length === 0) return;
    void Promise.allSettled(loaded.map((f) => ipcBridge.fs.getFileMetadata.invoke({ path: f.fullPath }))).then(
      (results) => {
        if (cancelled) return;
        const live = loaded.filter((_, i) => results[i].status === 'fulfilled');
        if (live.length !== loaded.length) persist(live);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [conversationId, isProject, persist]);

  const isFavorite = useCallback(
    (relativePath?: string | null) => !!relativePath && favorites.some((f) => f.relativePath === relativePath),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (node: IDirOrFile) => {
      if (!node.isFile || !node.relativePath) return;
      const exists = favorites.some((f) => f.relativePath === node.relativePath);
      persist(
        exists
          ? removeFavorite(favorites, node.relativePath)
          : addFavorite(favorites, { relativePath: node.relativePath, name: node.name, fullPath: node.fullPath })
      );
    },
    [favorites, persist]
  );

  return { isProject, favorites, isFavorite, toggleFavorite };
};
