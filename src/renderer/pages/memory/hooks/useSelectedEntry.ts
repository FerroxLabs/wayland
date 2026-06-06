/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * useSelectedEntry - syncs the inspector selection to the URL.
 *
 * `?entry=<id>` in the URL is the source of truth. `selectEntry(id)` writes
 * it; `clearSelection()` removes it. Esc key clears while mounted.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { memory as memoryBridge } from '@/common/adapter/ipcBridge';
import type { MemoryEntry } from '@/common/types/memory';

type ExtendedEntry = MemoryEntry & { body: string };

export type UseSelectedEntryResult = {
  selectedId: string | null;
  selected: ExtendedEntry | null;
  selectEntry: (id: string) => void;
  clearSelection: () => void;
};

export function useSelectedEntry(): UseSelectedEntryResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('entry');
  const [selected, setSelected] = useState<ExtendedEntry | null>(null);

  // Fetch full entry whenever selectedId changes.
  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    let cancelled = false;
    memoryBridge.getEntry
      .invoke({ id: selectedId })
      .then((entry) => {
        if (!cancelled) setSelected(entry);
      })
      .catch(() => {
        if (!cancelled) setSelected(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selectEntry = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams);
      next.set('entry', id);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearSelection = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('entry');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Esc key clears the selection.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [clearSelection]);

  return { selectedId, selected, selectEntry, clearSelection };
}
