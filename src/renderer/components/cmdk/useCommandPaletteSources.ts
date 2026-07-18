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
import { COCKPIT_NAVIGATION_DESTINATIONS } from '@/common/navigation';

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
export type PaletteCapability =
  | 'chat'
  | 'projects'
  | 'assistants'
  | 'workflows'
  | 'teams'
  | 'skills'
  | 'connections'
  | 'automations'
  | 'activity'
  | 'memory'
  | 'wiki'
  | 'settings'
  | 'help';

export type PaletteActionIntent = 'create' | 'invoke' | 'browse' | 'manage' | 'diagnose' | 'learn';
export type PaletteActionAvailability = 'available' | 'degraded' | 'unavailable';

export type PaletteActionTarget =
  | { kind: 'route'; path: string; state?: Record<string, unknown> }
  | { kind: 'external'; url: string };

export type PaletteAction = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  capability: PaletteCapability;
  intent: PaletteActionIntent;
  target: PaletteActionTarget;
  /** Unavailable actions remain visible and searchable, but cannot activate. */
  availability: PaletteActionAvailability;
  unavailableReason?: string;
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

type ActionSeed = Omit<PaletteAction, 'availability'>;

const cockpitPath = (id: string): string => {
  const destination = COCKPIT_NAVIGATION_DESTINATIONS.find((item) => item.id === id);
  if (!destination) throw new Error(`Command palette destination is missing: ${id}`);
  return destination.path;
};

/**
 * Canonical capability/action inventory for universal search.
 *
 * Top-level destinations resolve from the same Cockpit navigation registry as
 * the sidebar. The palette therefore cannot silently drift to a second route
 * for Chats, Projects, Library members, Automations, Activity, or Settings.
 * Nested management actions use their already-supported deep links.
 */
const ACTION_SEEDS: readonly ActionSeed[] = [
  {
    id: 'chat.new',
    label: 'New chat',
    description: 'Start a fresh conversation',
    keywords: ['chat', 'conversation', 'ask', 'message'],
    capability: 'chat',
    intent: 'create',
    target: { kind: 'route', path: '/guid', state: { resetAssistant: true } },
  },
  {
    id: 'chats.browse',
    label: 'Chats',
    description: 'Browse and resume conversations',
    keywords: ['chat', 'conversation', 'history', 'recent'],
    capability: 'chat',
    intent: 'browse',
    target: { kind: 'route', path: cockpitPath('chats') },
  },
  {
    id: 'projects.browse',
    label: 'Projects',
    description: 'Browse project chat groups and shared context',
    keywords: ['project', 'workspace', 'context', 'folder'],
    capability: 'projects',
    intent: 'browse',
    target: { kind: 'route', path: cockpitPath('projects') },
  },
  {
    id: 'assistants.manage',
    label: 'Assistants',
    description: 'Launch, create, and manage assistants',
    keywords: ['assistant', 'agent', 'specialist', 'cowork'],
    capability: 'assistants',
    intent: 'manage',
    target: { kind: 'route', path: cockpitPath('assistants') },
  },
  {
    id: 'workflows.manage',
    label: 'Workflows',
    description: 'Run, build, import, and schedule workflows',
    keywords: ['workflow', 'recipe', 'procedure', 'run', 'schedule'],
    capability: 'workflows',
    intent: 'manage',
    target: { kind: 'route', path: cockpitPath('workflows') },
  },
  {
    id: 'teams.manage',
    label: 'Teams',
    description: 'Launch and manage durable Desktop teams',
    keywords: ['team', 'agents', 'company', 'roster'],
    capability: 'teams',
    intent: 'manage',
    target: { kind: 'route', path: cockpitPath('teams') },
  },
  {
    id: 'teams.create',
    label: 'Build a team',
    description: 'Create a durable Desktop team',
    keywords: ['team', 'build', 'create', 'roster'],
    capability: 'teams',
    intent: 'create',
    target: { kind: 'route', path: '/teams/new' },
  },
  {
    id: 'skills.manage',
    label: 'Skills',
    description: 'Browse, build, import, and manage skills',
    keywords: ['skill', 'tool', 'capability', 'import'],
    capability: 'skills',
    intent: 'manage',
    target: { kind: 'route', path: cockpitPath('skills') },
  },
  {
    id: 'connections.manage',
    label: 'Connections',
    description: 'Browse, connect, diagnose, and revoke MCP connectors',
    keywords: ['mcp', 'connector', 'connection', 'tool', 'integration'],
    capability: 'connections',
    intent: 'manage',
    target: { kind: 'route', path: cockpitPath('connections') },
  },
  {
    id: 'connections.connected',
    label: 'Connected MCPs',
    description: 'Manage connected, disabled, and degraded MCP servers',
    keywords: ['mcp', 'connected', 'server', 'disable', 'revoke', 'diagnose'],
    capability: 'connections',
    intent: 'diagnose',
    target: { kind: 'route', path: '/settings/mcp-library/connected' },
  },
  {
    id: 'automations.manage',
    label: 'Automations',
    description: 'Create, run, pause, restore, and inspect schedules',
    keywords: ['automation', 'schedule', 'scheduled task', 'cron', 'recurring'],
    capability: 'automations',
    intent: 'manage',
    target: { kind: 'route', path: cockpitPath('automations') },
  },
  {
    id: 'activity.inspect',
    label: 'Activity',
    description: 'Inspect work that needs you, is running, upcoming, or recent',
    keywords: ['activity', 'running', 'progress', 'needs you', 'upcoming', 'mission control'],
    capability: 'activity',
    intent: 'diagnose',
    target: { kind: 'route', path: cockpitPath('activity') },
  },
  {
    id: 'memory.manage',
    label: 'Memory',
    description: 'Browse and manage durable knowledge',
    keywords: ['memory', 'knowledge', 'archive', 'recall'],
    capability: 'memory',
    intent: 'manage',
    target: { kind: 'route', path: cockpitPath('knowledge') },
  },
  {
    id: 'wiki.browse',
    label: 'Wiki',
    description: 'Browse structured project knowledge',
    keywords: ['wiki', 'knowledge', 'notes', 'reference'],
    capability: 'wiki',
    intent: 'browse',
    target: { kind: 'route', path: '/wiki' },
  },
  {
    id: 'settings.manage',
    label: 'Settings',
    description: 'Configure models, agents, permissions, and the app',
    keywords: ['settings', 'preferences', 'configure', 'model', 'permission'],
    capability: 'settings',
    intent: 'manage',
    target: { kind: 'route', path: cockpitPath('settings') },
  },
  {
    id: 'help.docs',
    label: 'Search documentation',
    description: 'Open the Wayland documentation',
    keywords: ['docs', 'documentation', 'help', 'guide'],
    capability: 'help',
    intent: 'learn',
    target: { kind: 'external', url: DOCS_URL },
  },
] as const;

export type PaletteAvailabilityOverrides = Partial<
  Record<PaletteAction['id'], { availability: PaletteActionAvailability; reason?: string }>
>;

/** Build a fresh index so runtime availability can be overlaid without mutating the canonical inventory. */
export function buildCapabilityActionIndex(overrides: PaletteAvailabilityOverrides = {}): PaletteAction[] {
  const seen = new Set<string>();
  return ACTION_SEEDS.map((seed) => {
    if (seen.has(seed.id)) throw new Error(`Duplicate command palette action id: ${seed.id}`);
    seen.add(seed.id);
    const override = overrides[seed.id];
    const action: PaletteAction = {
      id: seed.id,
      label: seed.label,
      description: seed.description,
      keywords: [...seed.keywords],
      capability: seed.capability,
      intent: seed.intent,
      target: seed.target.kind === 'route' ? { ...seed.target } : { ...seed.target },
      availability: override?.availability ?? 'available',
    };
    if (override?.reason) action.unavailableReason = override.reason;
    return action;
  });
}

const PALETTE_ACTIONS = buildCapabilityActionIndex();

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
      .toSorted((a: TChatConversation, b: TChatConversation) => (b.modifyTime ?? 0) - (a.modifyTime ?? 0))
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
