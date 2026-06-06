/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * useMemoryIndex - central data-fetch hook for the Memory Archive page.
 *
 * Subscribes to `ipcBridge.memory.onIndexChanged` so the UI refreshes
 * automatically when the file watcher re-indexes. All IPC calls are
 * initiated in parallel on mount; filter changes re-fetch entries and
 * tags (debounced 150ms for search).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { memory as memoryBridge } from '@/common/adapter/ipcBridge';
import type {
  ListFilter,
  MemoryEntry,
  MemoryStats,
  MemoryType,
  ProjectSummary,
  TagCount,
  GetStatsResult,
} from '@/common/types/memory';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UseMemoryIndexResult = {
  stats: MemoryStats | null;
  entries: MemoryEntry[];
  projects: ProjectSummary[];
  tags: TagCount[];
  /** Per-type counts derived client-side from the current entry list. */
  typeCounts: Record<MemoryType, number>;
  total: number;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
};

const MEMORY_TYPES: MemoryType[] = [
  'decision',
  'pattern',
  'observation',
  'session',
  'wiki',
  'preference',
];

const EMPTY_TYPE_COUNTS: Record<MemoryType, number> = {
  decision: 0,
  pattern: 0,
  observation: 0,
  session: 0,
  wiki: 0,
  preference: 0,
};

function deriveTypeCounts(entries: MemoryEntry[]): Record<MemoryType, number> {
  const counts = { ...EMPTY_TYPE_COUNTS };
  for (const e of entries) {
    if (e.type in counts) {
      counts[e.type] = (counts[e.type] ?? 0) + 1;
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMemoryIndex(filter: ListFilter): UseMemoryIndexResult {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const filterRef = useRef(filter);
  filterRef.current = filter;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(() => {
    setReloadCount((n) => n + 1);
  }, []);

  // Initial + reload: fetch stats, projects, entries, tags in parallel.
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const f = filterRef.current;
        const tp =
          f.project && f.project !== 'all' ? { project: f.project } : undefined;
        // buildProvider<Data, Params|void> resolves to invoke(params: Params|void)
        // which TypeScript evaluates via conditional type narrowing. Cast through
        // unknown to satisfy the conditional type without losing safety elsewhere.
        type ListInvoke = (p: ListFilter | void) => Promise<{ entries: MemoryEntry[]; total: number }>;
        type TagsInvoke = (p: { project?: string } | void) => Promise<TagCount[]>;
        const [statsResult, entriesResult, projectsResult, tagsResult] = await Promise.all([
          memoryBridge.getStats.invoke() as unknown as Promise<GetStatsResult>,
          (memoryBridge.listEntries.invoke as unknown as ListInvoke)(f),
          memoryBridge.getProjects.invoke(),
          (memoryBridge.getTags.invoke as unknown as TagsInvoke)(tp),
        ]);
        if (cancelled) return;
        if (statsResult.ok === true) {
          setStats(statsResult.stats);
        } else if (statsResult.ok === false) {
          setError(statsResult.error);
        }
        setEntries(entriesResult.entries);
        setTotal(entriesResult.total);
        setProjects(projectsResult);
        setTags(tagsResult);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load memories');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchAll();

    const unsubscribe = memoryBridge.onIndexChanged.on(() => {
      if (cancelled) return;
      void fetchAll();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
    // reloadCount triggers a full re-fetch; filter is captured via filterRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadCount]);

  // Re-fetch entries + tags when filter changes (debounced for search).
  useEffect(() => {
    let cancelled = false;

    const doFetch = async (): Promise<void> => {
      try {
        const tp =
          filter.project && filter.project !== 'all'
            ? { project: filter.project }
            : undefined;
        type ListInvoke = (p: ListFilter | void) => Promise<{ entries: MemoryEntry[]; total: number }>;
        type TagsInvoke = (p: { project?: string } | void) => Promise<TagCount[]>;
        const [entriesResult, tagsResult] = await Promise.all([
          (memoryBridge.listEntries.invoke as unknown as ListInvoke)(filter),
          (memoryBridge.getTags.invoke as unknown as TagsInvoke)(tp),
        ]);
        if (cancelled) return;
        setEntries(entriesResult.entries);
        setTotal(entriesResult.total);
        setTags(tagsResult);
      } catch {
        // Non-fatal - keep previous entries visible on transient error.
      }
    };

    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    // Debounce only when search string changes; other filter changes are immediate.
    const delay = filter.search !== undefined && filter.search !== '' ? 150 : 0;
    debounceRef.current = setTimeout(() => {
      void doFetch();
    }, delay);

    return () => {
      cancelled = true;
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filter.project,
    filter.search,
    filter.sort,
    filter.timeWindow,
    filter.offset,
    filter.limit,
    // tags serialized to avoid referential inequality on every render:
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter.types),
    JSON.stringify(filter.tags),
  ]);

  const typeCounts = deriveTypeCounts(entries);

  return { stats, entries, projects, tags, typeCounts, total, isLoading, error, reload };
}
