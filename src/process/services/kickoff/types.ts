/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared Kickoff types - main-process side. Mirrors the renderer's
 * AssistantKickoff (src/renderer/pages/settings/AssistantSettings/types.ts)
 * so the IPC contract crosses cleanly without a serde shim.
 */

export type KickoffTimeBucket = 'late-night' | 'morning' | 'afternoon' | 'evening';
export type KickoffScenario = 'cold-start' | 'continuation-friendly' | 'post-fire-ritual';

export type KickoffEntry = {
  id: string;
  text: string;
  prefill: string;
  scenario: KickoffScenario;
  timeBucket?: KickoffTimeBucket;
  requiresRitualOutput?: boolean;
  beginnerSafe?: boolean;
};

export type KickoffCascadeLevel = 1 | 2 | 3 | 4;
export type KickoffCascadeReason =
  | 'standing-ritual-fired'
  | 'recent-thread-quality-passed'
  | 'cold-start-library'
  | 'beginner-touch-fallback';

/**
 * v0.4.7.1 - extended set so post-ship telemetry can distinguish real cascade
 * misses from infrastructure issues (engine errors, init races, opt-out
 * sentinels). Adds 'engine-error' (IPC-2), 'registry-not-ready' (INIT-1),
 * 'kickoffs-excluded' (DATA-2 - agent-profile assistants opt out), and
 * 'ipc-error' (D-M-5, renderer-side IPC failure path).
 */
export type NotRenderedReason =
  | 'no-kickoffs-defined'
  | 'unknown-assistant'
  | 'all-levels-missed'
  | 'engine-error'
  | 'registry-not-ready'
  | 'kickoffs-excluded'
  | 'ipc-error'
  | 'error';

export type KickoffAlternate = {
  kickoffId: string;
  text: string;
  prefill: string;
};

export type KickoffSuggestion = {
  cascadeLevel: KickoffCascadeLevel;
  cascadeReason: KickoffCascadeReason;
  kickoffId: string;
  text: string;
  prefill: string;
  alternates: KickoffAlternate[];
};

/**
 * v0.4.7.1 - `errorName` carries the sanitized `err.name` when notRendered
 * is `'engine-error'` so v2 analytics can group by error class without
 * leaking the message (which may carry PII or local paths).
 */
export type KickoffNotRendered = {
  notRendered: NotRenderedReason;
  errorName?: string;
};

export type KickoffResult = KickoffSuggestion | KickoffNotRendered;

/**
 * #375 - a single card in the per-assistant suggested-prompts GRID rendered
 * below the composer in the assistant detail view. Distinct from the single
 * yes-bias KickoffSuggestion: the grid shows several browseable starters, each
 * of which prefills (not auto-sends) the composer on click.
 *
 * `source` records where the entry came from so the renderer + tests can tell
 * a ranked kickoff from a legacy-prompt fallback. `kickoffId` is only set for
 * `source: 'kickoff'` (legacy prompts have no stable id).
 */
export type KickoffGridItem = {
  kickoffId?: string;
  text: string;
  prefill: string;
  source: 'kickoff' | 'prompts';
};

export type KickoffGridResult = { items: KickoffGridItem[] } | KickoffNotRendered;

/** #375 - default + hard cap on grid card count (Sean-approved 4-6 range). */
export const KICKOFF_GRID_MAX = 6;

/**
 * v0.4.7.1 (D-M-3) - `reason` discriminator on dismiss lets v2 analytics
 * separate "user clicked ×" from "user just started typing past the card."
 * Both are dismissals but they mean very different things for cold-start
 * library quality measurement.
 */
export type KickoffTelemetryEvent = {
  event: 'accepted' | 'redirected' | 'dismissed' | 'not_rendered';
  kickoffId?: string;
  cascadeLevel?: KickoffCascadeLevel;
  notRenderedReason?: NotRenderedReason;
  dismissReason?: 'interaction' | 'typing';
};

/**
 * Snapshot of all signals SuggestionEngine needs to walk the cascade.
 * Collected by SignalCollector in one main-process pass to avoid the
 * round-trip overhead of querying repos per cascade level.
 */
export type KickoffSignals = {
  now: number;
  timeBucket: KickoffTimeBucket;
  installUuid: string;
  /**
   * Recent conversations scoped to this assistant id, newest-first. Already
   * quality-gate-eligible by source (presetAssistantId match); the engine
   * applies the message-count / duration / auto-title filter itself.
   */
  assistantRecentConversations: Array<{
    id: string;
    modifyTime: number;
    messageCount: number;
    durationMs: number;
    subject: string;
    isAutoTitled: boolean;
  }>;
  /** True iff a Standing-Company ritual cron for this assistant fired ok in the configured window. */
  hasStandingRitualFiredRecently: boolean;
};

export const RITUAL_RECENT_WINDOW_MS = 4 * 60 * 60 * 1000;
/** v0.4.7.1 (A-M-2) - upper bound on "recent thread" eligibility for Level 2. */
export const THREAD_RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const THREAD_MIN_MESSAGES = 3;
export const THREAD_MIN_DURATION_MS = 2 * 60 * 1000;
