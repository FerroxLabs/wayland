/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo, useState } from 'react';
import { ipcBridge } from '@/common';

export type ComposerSkillKind = 'builtin' | 'added';

/** A skill currently scoped to this chat, as rendered in the "on this chat" list. */
export type OnChatSkill = {
  name: string;
  description: string;
  kind: ComposerSkillKind;
  /** Builtins can be toggled off (and stay listed); added skills are always on while present. */
  enabled: boolean;
};

export type UseComposerSkillsOptions = {
  /**
   * `staged` - home/new-chat composer, no conversation yet. Picks are held in
   * local state and applied to the new conversation's `extra.sessionSkills`
   * when the parent creates it on send.
   * `live` - in-chat composer. `addSkill` writes straight through
   * `skills.add-to-conversation` so the body injects on the next turn.
   */
  mode: 'staged' | 'live';
  /** Required in `live` mode for the write-through to target a conversation. */
  conversationId?: string;
  /** Builtin auto-injected skills (always on by default, toggle off to exclude). */
  builtinAutoSkills?: Array<{ name: string; description: string }>;
  /** Builtin skill names the user toggled off for this chat. */
  disabledBuiltinSkills?: string[];
  /** Parent handler that flips a builtin in/out of `disabledBuiltinSkills`. */
  onToggleBuiltinSkill?: (name: string) => void;
};

export type UseComposerSkills = {
  /** Merged "on this chat" rows: builtins (with enabled flag) + added skills. */
  onChatList: OnChatSkill[];
  /** Names of skills explicitly added in this composer session (staged or live). */
  stagedSkills: string[];
  /** Whether a given skill is currently scoped to this chat (added or enabled builtin). */
  isOnChat: (name: string) => boolean;
  addSkill: (name: string, description?: string) => Promise<void>;
  removeSkill: (name: string) => void;
  /** Builtins -> toggle on/off (stay listed); added skills -> remove from chat. */
  toggleSkill: (name: string) => Promise<void>;
};

/**
 * Shared add/remove/toggle logic for the composer "+" Skills flyout. Keeps the
 * staged-vs-live distinction in one place so both the home composer (no
 * conversation yet) and the in-chat composer drive the exact same UI off the
 * same hook. The backend injection (commit 4dde456db) already handles
 * `extra.sessionSkills` on every backend - this hook only collects the picks.
 */
export function useComposerSkills(options: UseComposerSkillsOptions): UseComposerSkills {
  const { mode, conversationId, builtinAutoSkills = [], disabledBuiltinSkills = [], onToggleBuiltinSkill } = options;

  // Skills explicitly added via this composer. In live mode they are ALSO
  // persisted through the IPC; the local copy drives the on-chat list so the
  // user sees the pick immediately without re-reading the conversation.
  const [added, setAdded] = useState<Array<{ name: string; description: string }>>([]);

  const builtinNames = useMemo(() => new Set(builtinAutoSkills.map((s) => s.name)), [builtinAutoSkills]);
  const disabledSet = useMemo(() => new Set(disabledBuiltinSkills), [disabledBuiltinSkills]);

  const addSkill = useCallback(
    async (name: string, description = '') => {
      // Never duplicate a builtin as an "added" row.
      if (builtinNames.has(name)) {
        return;
      }
      if (mode === 'live') {
        if (!conversationId) return;
        const result = await ipcBridge.skills.addToConversation.invoke({ conversationId, name });
        if (!result.ok) {
          throw new Error((result as { error?: string }).error ?? 'failed');
        }
      }
      setAdded((prev) => (prev.some((s) => s.name === name) ? prev : [...prev, { name, description }]));
    },
    [mode, conversationId, builtinNames]
  );

  const removeSkill = useCallback((name: string) => {
    // Local-only removal. In live mode the body was already injected on a prior
    // turn if the user sent in between; removing here just drops it from the
    // composer's on-chat list (a true per-conversation "unload" is a follow-up).
    setAdded((prev) => prev.filter((s) => s.name !== name));
  }, []);

  const toggleSkill = useCallback(
    async (name: string) => {
      if (builtinNames.has(name)) {
        onToggleBuiltinSkill?.(name);
        return;
      }
      removeSkill(name);
    },
    [builtinNames, onToggleBuiltinSkill, removeSkill]
  );

  const onChatList = useMemo<OnChatSkill[]>(() => {
    const builtinRows: OnChatSkill[] = builtinAutoSkills.map((s) => ({
      name: s.name,
      description: s.description,
      kind: 'builtin',
      enabled: !disabledSet.has(s.name),
    }));
    const addedRows: OnChatSkill[] = added.map((s) => ({
      name: s.name,
      description: s.description,
      kind: 'added',
      enabled: true,
    }));
    return [...builtinRows, ...addedRows];
  }, [builtinAutoSkills, disabledSet, added]);

  const stagedSkills = useMemo(() => added.map((s) => s.name), [added]);

  const isOnChat = useCallback(
    (name: string) => {
      if (builtinNames.has(name)) return !disabledSet.has(name);
      return added.some((s) => s.name === name);
    },
    [builtinNames, disabledSet, added]
  );

  return { onChatList, stagedSkills, isOnChat, addSkill, removeSkill, toggleSkill };
}
