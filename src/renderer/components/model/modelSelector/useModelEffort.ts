/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { ipcBridge } from '@/common';
import type { TChatConversation } from '@/common/config/storage';
import type { EffortLevel } from '@renderer/components/model/modelSelector/modelSelectorTypes';

/** Backend default when a conversation has no persisted effort. */
const DEFAULT_EFFORT: EffortLevel = 'medium';

/**
 * Read/write the per-conversation reasoning effort for effort-capable backends
 * (Codex / WCore / Claude-ACP). Reads `conversation.get` -> `extra.effort`
 * (default `'medium'`) and persists via `conversation.update` with
 * `mergeExtra: true` so only the `effort` key is touched. The new value reaches
 * the backend on the next turn (each backend's config builder reads
 * `extra.effort`); this hook only owns the persisted field.
 */
export function useModelEffort(conversationId: string): {
  effort: EffortLevel;
  setEffort: (level: EffortLevel) => void;
} {
  const [effort, setEffortState] = useState<EffortLevel>(DEFAULT_EFFORT);

  useEffect(() => {
    let cancelled = false;
    if (!conversationId) {
      setEffortState(DEFAULT_EFFORT);
      return;
    }
    void ipcBridge.conversation.get
      .invoke({ id: conversationId })
      .then((conversation) => {
        if (cancelled) return;
        const stored = (conversation?.extra as { effort?: EffortLevel } | undefined)?.effort;
        setEffortState(stored ?? DEFAULT_EFFORT);
      })
      .catch(() => {
        if (!cancelled) setEffortState(DEFAULT_EFFORT);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const setEffort = useCallback(
    (level: EffortLevel) => {
      setEffortState(level);
      if (!conversationId) return;
      void ipcBridge.conversation.update
        .invoke({
          id: conversationId,
          updates: { extra: { effort: level } } as Partial<TChatConversation>,
          mergeExtra: true,
        })
        .catch(() => {
          // Best-effort persistence; the optimistic local state already updated.
        });
    },
    [conversationId]
  );

  return { effort, setEffort };
}
