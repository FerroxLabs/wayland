/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CuratedModel } from '@/process/providers/types';

/** Re-exported so consumers of the view model don't reach into the process layer. */
export type { CuratedModel };

/** Backend-gated effort levels (Codex / WCore / Claude-ACP). */
export type EffortLevel = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

/**
 * Reasoning levels each effort-capable backend actually accepts.
 *
 * These sets are provider-specific and load-bearing: sending a level a backend
 * rejects breaks the spawn. Claude Code's `settings.effortLevel` supports the
 * full range (`xhigh` is its own default); Codex's `model_reasoning_effort`
 * config knob only accepts `low`/`medium`/`high` (Codex exposes its higher
 * reasoning tiers as distinct model ids like `gpt-5.4/xhigh`, chosen via the
 * model picker, not this knob); WCore mirrors Codex's three.
 */
export const EFFORT_LEVELS_BY_BACKEND: Record<string, readonly EffortLevel[]> = {
  claude: ['low', 'medium', 'high', 'xhigh', 'max'],
  codex: ['low', 'medium', 'high'],
  wcore: ['low', 'medium', 'high'],
};

/** Fallback when a backend has no explicit level set. */
const DEFAULT_EFFORT_LEVELS: readonly EffortLevel[] = ['low', 'medium', 'high'];

/** The reasoning levels selectable for a given backend id. */
export function effortLevelsForBackend(backend: string | undefined): readonly EffortLevel[] {
  return (backend && EFFORT_LEVELS_BY_BACKEND[backend]) || DEFAULT_EFFORT_LEVELS;
}

/** A single selectable row in the flyout. */
export type ModelRow = {
  /** `providerId:id` (modelKey) - matches the `pinnedModels` storage key format. */
  key: string;
  /** Model id passed to `onSelect`. */
  id: string;
  providerId: string;
  /** Display label (flux ids use `FLUX_MODEL_DISPLAY`, else `displayName`). */
  label: string;
  /** One-line descriptor, e.g. "200K context · Anthropic". */
  descriptor: string;
  price?: '$' | '$$' | '$$$';
  pinned: boolean;
  /** false => greyed "Currently unavailable" (still listed for discoverability). */
  available: boolean;
  isFlux?: boolean;
};

/** A labelled group of rows (pinned / recent / recommended-for-<provider>). */
export type ModelZone = { id: string; label: string; rows: ModelRow[] };

/** The composed view model the flyout renders. Pure output of the adapter hook. */
export type ModelSelectorViewModel = {
  /** Present only when flux is connected - the single primary CTA. */
  fluxHero?: ModelRow;
  /** Pinned, recent, recommended (grouped) zones, in display order. */
  zones: ModelZone[];
  /** Long tail behind "More models", grouped by provider. */
  moreZones: ModelZone[];
  /** `providerId:id` of the active model, or null. */
  activeKey: string | null;
  /** Whether the effort sub-row should render for this backend. */
  effortSupported: boolean;
  /** The reasoning levels selectable for this backend (provider-specific). */
  effortLevels: readonly EffortLevel[];
  /** No provider connected and flux off - render the empty card. */
  empty: boolean;
};

/** Recovery action that asks the runtime to resume provider-owned model selection. */
export type ModelSelectorDefaultAction = {
  label: string;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

/** Presentational flyout props (consumed in Wave B). */
export type ModelSelectorProps = {
  vm: ModelSelectorViewModel;
  effort?: EffortLevel;
  onSelect: (modelId: string, providerId: string) => void;
  onTogglePin: (key: string) => void;
  onSetEffort?: (level: EffortLevel) => void;
  onManage: () => void;
  /** Always-available recovery path that clears an explicit model request. */
  defaultAction?: ModelSelectorDefaultAction;
  /** Autofocus the search input on open. */
  draftSearch?: boolean;
  /**
   * Optional one-line informational banner shown above the model list (and in
   * the empty state). Used by the Claude-Code picker to explain that the agent
   * runs on the user's subscription while subscription-as-chat-models isn't
   * supported yet (#335 interim). Plain text; no markup.
   */
  notice?: string;
};
