/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IProject, ICreateProjectParams, IUpdateProjectParams } from '@/common/types/project';
import type { TChatConversation } from '@/common/config/storage';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Renderer data hook for Projects. Lists projects, keeps per-project chat
 * counts, and exposes CRUD + conversation re-parenting. Auto-refreshes whenever
 * the backend emits `project.changed`. A project is an umbrella - there is no
 * "active conversation" / lock anywhere here.
 */
export function useProjects() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const aliveRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const list = await ipcBridge.project.list.invoke();
      if (!aliveRef.current) return;
      const safe = Array.isArray(list) ? list : [];
      setProjects(safe);
      // Per-project chat counts. The project set is small (handful), so an
      // N-query fan-out is fine and avoids loading every conversation up front.
      const entries = await Promise.all(
        safe.map(async (p) => {
          try {
            const convs = await ipcBridge.project.getConversations.invoke({ projectId: p.id });
            return [p.id, Array.isArray(convs) ? convs.length : 0] as const;
          } catch {
            return [p.id, 0] as const;
          }
        })
      );
      if (!aliveRef.current) return;
      setCounts(Object.fromEntries(entries));
    } catch (err) {
      console.error('[useProjects] refresh failed:', err);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    void refresh();
    // PERF-IPC-01: a targeted payload ({ id, count }) means only one project's
    // chat count changed - patch that single row instead of re-listing every
    // project and re-fanning out the per-project count queries. A payload-less
    // signal (structural change) still triggers the full refresh.
    const unsub = ipcBridge.project.changed.on((payload) => {
      if (payload && payload.id && typeof payload.count === 'number') {
        const { id, count } = payload;
        setCounts((prev) => ({ ...prev, [id]: count }));
        return;
      }
      void refresh();
    });
    return () => {
      aliveRef.current = false;
      unsub();
    };
  }, [refresh]);

  const createProject = useCallback(
    (params: ICreateProjectParams): Promise<IProject> => ipcBridge.project.create.invoke(params),
    []
  );

  const updateProject = useCallback(
    (id: string, updates: IUpdateProjectParams): Promise<void> => ipcBridge.project.update.invoke({ id, updates }),
    []
  );

  const removeProject = useCallback((id: string): Promise<void> => ipcBridge.project.remove.invoke({ id }), []);

  const getProjectConversations = useCallback(
    (projectId: string): Promise<TChatConversation[]> => ipcBridge.project.getConversations.invoke({ projectId }),
    []
  );

  const assignConversation = useCallback(
    (conversationId: string, projectId: string): Promise<void> =>
      ipcBridge.project.assignConversation.invoke({ conversationId, projectId }),
    []
  );

  const removeConversationFromProject = useCallback(
    (conversationId: string): Promise<void> => ipcBridge.project.removeConversation.invoke({ conversationId }),
    []
  );

  return {
    projects,
    counts,
    loading,
    refresh,
    createProject,
    updateProject,
    removeProject,
    getProjectConversations,
    assignConversation,
    removeConversationFromProject,
  };
}
