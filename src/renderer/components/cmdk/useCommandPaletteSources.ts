/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useConversationAgents } from '@/renderer/pages/conversation/hooks/useConversationAgents';
import { useConversationHistoryContext } from '@/renderer/hooks/context/ConversationHistoryContext';
import type { AvailableAgent } from '@/renderer/utils/model/agentTypes';
import type { TChatConversation } from '@/common/config/storage';

/**
 * Preset assistant entry surfaced in the command palette.
 *
 * Mirrors the shape `selectPresetAssistant` (Phase 1) accepts, with the
 * extra display fields the palette needs to render rows. `presetAgentType`
 * carries the backend hint so Rory defaulting fires when the user picks
 * the row.
 */
export type PaletteAssistant = {
  id: string;
  name: string;
  presetAgentType?: string;
  avatar?: string;
  /** Coarse bucket used for grouping (Teams / Specialists / Built-ins). */
  category: 'team' | 'specialist' | 'builtin';
};

/** Recent chat entry surfaced in the palette. */
export type PaletteRecent = {
  id: string;
  title: string;
  modifyTime?: number;
};

/** Starter prompt entry surfaced in the palette. */
export type PaletteStarterPrompt = {
  id: string;
  label: string;
  text: string;
};

/**
 * Action entry surfaced in the palette — a command that does something (opens
 * a URL, toggles a panel) rather than launching a chat. `label` is an i18n
 * key; `url` is the external link the action opens, when applicable.
 */
export type PaletteAction = {
  id: string;
  label: string;
  url?: string;
};

export type CommandPaletteSources = {
  assistants: PaletteAssistant[];
  recents: PaletteRecent[];
  prompts: PaletteStarterPrompt[];
  actions: PaletteAction[];
};

/**
 * Default starter prompts when Phase 2's INTENTS map is not yet on the
 * branch. Phase 6 polish will replace this with the canonical intents.
 * Each label maps to an i18n key under `common.cmdk.prompts.*`; the value
 * the palette inserts into the chat input is the plain English text.
 */
const FALLBACK_STARTER_PROMPTS: PaletteStarterPrompt[] = [
  { id: 'brainstorm', label: 'common.cmdk.prompts.brainstorm', text: 'Help me brainstorm ideas about ' },
  { id: 'summarize', label: 'common.cmdk.prompts.summarize', text: 'Summarize the following: ' },
  { id: 'code-review', label: 'common.cmdk.prompts.codeReview', text: 'Review this code and suggest improvements: ' },
  { id: 'explain', label: 'common.cmdk.prompts.explain', text: 'Explain how ' },
  { id: 'plan', label: 'common.cmdk.prompts.plan', text: 'Draft a plan for ' },
];

const MAX_RECENT_PALETTE_ROWS = 10;

/**
 * Canonical Wayland documentation URL opened by the "Search documentation"
 * palette action.
 * TODO(docs): confirm this is the live docs URL before release — no docs URL
 * constant existed elsewhere in the app at the time this was added.
 */
const DOCS_URL = 'https://getwayland.com/docs';

/** Static palette actions (commands that are not chat launches). */
const PALETTE_ACTIONS: PaletteAction[] = [
  { id: 'docs', label: 'common.cmdk.actions.docs', url: DOCS_URL },
];

/**
 * Coarse categorization for assistants.
 *
 * The full chat-redesign spec adds a richer `category` field to assistant
 * configs (Phase 1 ground-truth). Until every assistant carries that field,
 * we infer the bucket from the agent shape: extension-contributed agents
 * are surfaced as Specialists, built-in CLI presets as Built-ins. Teams are
 * a forward-compatible bucket - empty for now, no rows rendered.
 */
function bucketFor(agent: AvailableAgent): PaletteAssistant['category'] {
  if (agent.isExtension) {
    return 'specialist';
  }
  return 'builtin';
}

/**
 * Hook that aggregates the three data sources rendered by the ⌘K palette:
 *
 *   - Assistants: merged built-in presets + extension-contributed entries
 *     (same merge `useConversationAgents` already produces for the chat
 *     surface, so the palette stays in lockstep with what the user sees in
 *     the assistant selector).
 *   - Recents: top N conversations from the existing history context
 *     (already loaded for the sidebar; no extra IPC roundtrip).
 *   - Prompts: starter prompts. Falls back to a fixed list until Phase 2
 *     ships the shared INTENTS map; Phase 6 polish unifies the source.
 */
export function useCommandPaletteSources(): CommandPaletteSources {
  const { presetAssistants } = useConversationAgents();
  const { conversations } = useConversationHistoryContext();

  const assistants = useMemo<PaletteAssistant[]>(() => {
    return presetAssistants
      .filter((agent): agent is AvailableAgent & { customAgentId: string } => Boolean(agent.customAgentId))
      .map((agent) => ({
        id: agent.customAgentId,
        name: agent.name,
        presetAgentType: agent.presetAgentType,
        avatar: agent.avatar,
        category: bucketFor(agent),
      }));
  }, [presetAssistants]);

  const recents = useMemo<PaletteRecent[]>(() => {
    return conversations
      .slice()
      .sort((a: TChatConversation, b: TChatConversation) => (b.modifyTime ?? 0) - (a.modifyTime ?? 0))
      .slice(0, MAX_RECENT_PALETTE_ROWS)
      .map((conv: TChatConversation) => ({
        id: conv.id,
        title: conv.name || conv.id,
        modifyTime: conv.modifyTime,
      }));
  }, [conversations]);

  return {
    assistants,
    recents,
    prompts: FALLBACK_STARTER_PROMPTS,
    actions: PALETTE_ACTIONS,
  };
}
