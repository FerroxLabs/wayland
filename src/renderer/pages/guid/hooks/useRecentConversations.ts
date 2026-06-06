/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';
import { useConversationListSync } from '@/renderer/pages/conversation/GroupedHistory/hooks/useConversationListSync';

const MAX_RECENTS = 3;

type ExtensionAssistantSummary = {
  id?: unknown;
  name?: unknown;
  avatar?: unknown;
};

export type RecentConversation = {
  /** Conversation id used to resume the chat. */
  id: string;
  /** Display name of the conversation (assistant or topic). */
  name: string;
  /** Preset/bundle assistant id when the conversation has one attached. */
  assistantId: string | undefined;
  /** Human-readable assistant name (built-in or extension), if resolvable. */
  assistantName: string | undefined;
  /** Icon for the conversation card - usually an emoji avatar. */
  assistantIcon: string | undefined;
  /** Wall-clock timestamp (ms) of the most recent edit. Higher = newer. */
  modifyTime: number;
};

const PRESET_LOOKUP: Record<string, { name: string; avatar: string }> = (() => {
  const lookup: Record<string, { name: string; avatar: string }> = {};
  for (const preset of ASSISTANT_PRESETS) {
    const name = preset.nameI18n['en-US'] ?? preset.id;
    lookup[preset.id] = { name, avatar: preset.avatar };
  }
  return lookup;
})();

function resolveAssistantId(extra: unknown): string | undefined {
  if (!extra || typeof extra !== 'object') return undefined;
  const value = (extra as { presetAssistantId?: unknown }).presetAssistantId;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * Returns the 3 most-recently-edited conversations, sorted by modifyTime DESC,
 * for the new-chat starter Recents strip. Health-check and team conversations
 * are excluded by the upstream `useConversationListSync` store.
 *
 * Assistant metadata (name + icon) is resolved from `ASSISTANT_PRESETS` first,
 * then from the extension assistants SWR cache (`extensions.assistants`, the
 * same key used by `useConversationAgents`).
 */
export const useRecentConversations = (): { recents: RecentConversation[] } => {
  const { conversations } = useConversationListSync();

  const { data: extensionAssistants } = useSWR(
    'extensions.assistants',
    () => ipcBridge.extensions.getAssistants.invoke().catch(() => [] as Record<string, unknown>[])
  );

  const extensionLookup = useMemo(() => {
    const lookup: Record<string, { name: string; avatar: string | undefined }> = {};
    for (const ext of (extensionAssistants ?? []) as ExtensionAssistantSummary[]) {
      const id = typeof ext.id === 'string' ? ext.id : undefined;
      if (!id) continue;
      const name = typeof ext.name === 'string' && ext.name.length > 0 ? ext.name : id;
      const avatar = typeof ext.avatar === 'string' && ext.avatar.length > 0 ? ext.avatar : undefined;
      lookup[id] = { name, avatar };
    }
    return lookup;
  }, [extensionAssistants]);

  const recents = useMemo<RecentConversation[]>(() => {
    if (!conversations || conversations.length === 0) return [];
    const sorted = conversations.toSorted((a, b) => (b.modifyTime ?? 0) - (a.modifyTime ?? 0));
    const top = sorted.slice(0, MAX_RECENTS);
    return top.map((conv) => {
      const assistantId = resolveAssistantId(conv.extra);
      const preset = assistantId ? PRESET_LOOKUP[assistantId] : undefined;
      const extension = assistantId ? extensionLookup[assistantId] : undefined;
      return {
        id: conv.id,
        name: conv.name,
        assistantId,
        assistantName: preset?.name ?? extension?.name,
        assistantIcon: preset?.avatar ?? extension?.avatar,
        modifyTime: conv.modifyTime ?? 0,
      };
    });
  }, [conversations, extensionLookup]);

  return { recents };
};
