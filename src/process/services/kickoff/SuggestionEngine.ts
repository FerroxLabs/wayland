/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SignalCollector } from './SignalCollector';
import { findAssistantInRegistry } from './SignalCollector';
import { dateKey, hashSeed, seededShuffle } from './seededShuffle';
import {
  KICKOFF_GRID_MAX,
  THREAD_MIN_DURATION_MS,
  THREAD_MIN_MESSAGES,
  THREAD_RECENT_WINDOW_MS,
  type KickoffAlternate,
  type KickoffCascadeLevel,
  type KickoffCascadeReason,
  type KickoffEntry,
  type KickoffGridItem,
  type KickoffGridResult,
  type KickoffResult,
  type KickoffSignals,
  type KickoffSuggestion,
} from './types';

/**
 * Walks the 5-level cascade defined in the v0.4.7 Kickoff handoff. First
 * match wins; never composes from multiple levels. Levels 1-4 each return
 * a single suggestion + up to 2 same-scenario alternates for the
 * "Something else" redirect ladder. Level 5 = `notRendered` → bare input.
 *
 * Cascade levels (handoff §1):
 *   1. Standing Company ritual fired in last 4h          (gated by scenario only - see A-M-7)
 *   2. Recent thread continuation (≥3 msgs, ≥2 min, not auto-titled, ≤7d old)
 *   3. Cold-start library entry (time-bucket filtered, seeded shuffle)
 *   4. Beginner-touch fallback (beginnerSafe entries)
 *
 * Determinism: level 3's seed is `hash(installUuid + assistantId + dateKey)`
 * so the same install on the same day sees the same primary suggestion.
 * Different installUuids produce different orderings (shape verified in
 * SuggestionEngine.test.ts).
 *
 * v0.4.7.1 (DATA-2) - agent-profile assistants are tagged
 * `_kickoffsExcluded: true` by `agentProfileMerge.ts`. The engine returns
 * `notRendered: 'kickoffs-excluded'` for them so the renderer hides the
 * card and v2 analytics can suppress `not_rendered` telemetry for the
 * opt-out cohort without inflating the generic miss bucket.
 *
 * v0.4.7.1 (A-M-7) - Level 1 no longer requires `requiresRitualOutput`
 * to be `true` on the matched kickoff. The `scenario === 'post-fire-ritual'`
 * + `hasStandingRitualFiredRecently` pair is the load-bearing gate; the
 * flag is now documentation-only so bundle authors can omit it without
 * silently losing the cascade tier.
 */
export type RegistryFinder = (assistantId: string) => Record<string, unknown> | null;

export class SuggestionEngine {
  constructor(
    private readonly signalCollector: SignalCollector,
    private readonly registryFinder: RegistryFinder = findAssistantInRegistry
  ) {}

  async suggest(assistantId: string, now?: number): Promise<KickoffResult> {
    const assistant = this.registryFinder(assistantId);
    if (!assistant) return { notRendered: 'unknown-assistant' };

    // v0.4.7.1 (DATA-2) - opt-out sentinel set by agentProfileMerge.ts.
    // Distinct from `no-kickoffs-defined` so v2 analytics can separate
    // "we deliberately don't surface a card here" from "data gap."
    if ((assistant as { _kickoffsExcluded?: unknown })._kickoffsExcluded === true) {
      return { notRendered: 'kickoffs-excluded' };
    }

    const kickoffs = readKickoffArray(assistant);
    if (kickoffs.length === 0) return { notRendered: 'no-kickoffs-defined' };

    const signals = await this.signalCollector.collect(assistantId, now);

    // Level 1 - Standing ritual fired recently
    if (signals.hasStandingRitualFiredRecently) {
      const candidate = kickoffs.find((k) => k.scenario === 'post-fire-ritual');
      if (candidate) return buildSuggestion(1, 'standing-ritual-fired', candidate, kickoffs);
    }

    // Level 2 - Recent quality thread
    const recent = pickQualityThread(signals);
    if (recent) {
      const candidate = kickoffs.find((k) => k.scenario === 'continuation-friendly');
      if (candidate) return buildSuggestion(2, 'recent-thread-quality-passed', candidate, kickoffs);
    }

    // Level 3 - Cold-start library, time-bucket filtered, seeded shuffle
    const coldStarts = kickoffs.filter(
      (k) =>
        k.scenario === 'cold-start' && k.beginnerSafe !== true && (!k.timeBucket || k.timeBucket === signals.timeBucket)
    );
    if (coldStarts.length > 0) {
      const seed = hashSeed(`${signals.installUuid}:${assistantId}:${dateKey(signals.now)}`);
      const shuffled = seededShuffle(coldStarts, seed);
      const primary = shuffled[0]!;
      return buildSuggestion(3, 'cold-start-library', primary, kickoffs);
    }

    // Level 4 - Beginner touch fallback
    const beginner = kickoffs.find((k) => k.beginnerSafe === true);
    if (beginner) return buildSuggestion(4, 'beginner-touch-fallback', beginner, kickoffs);

    return { notRendered: 'all-levels-missed' };
  }

  /**
   * #375 - per-assistant suggested-prompts GRID. Returns up to `max` browseable
   * starters for the assistant detail view (below the composer), each prefilling
   * the composer on click.
   *
   * Ranking (Sean-approved): beginner-safe first, then entries matching the
   * current time bucket, then a daily-stable seeded shuffle for the remainder
   * (same install + assistant + day → same order). Unlike `suggest`, this does
   * NOT walk the 5-level cascade: the grid is a flat browse surface, not a
   * single confident offer.
   *
   * Fallback: assistants that ship no `kickoffs` (the ASSISTANT_PRESETS like
   * `cowork`, which carry localized `promptsI18n`, and a few catalog rows with
   * only the legacy flat `prompts`) fall back to those prompt strings. This is
   * why the grid (and the previously-empty Cowork detail view) renders at all
   * for kickoff-less assistants. `locale` selects the `promptsI18n` variant;
   * flat `prompts` are locale-agnostic.
   */
  async suggestN(
    assistantId: string,
    max: number = KICKOFF_GRID_MAX,
    locale: string = 'en-US'
  ): Promise<KickoffGridResult> {
    const cap = Math.max(1, Math.min(max, KICKOFF_GRID_MAX));
    const assistant = this.registryFinder(assistantId);
    if (!assistant) return { notRendered: 'unknown-assistant' };
    if ((assistant as { _kickoffsExcluded?: unknown })._kickoffsExcluded === true) {
      return { notRendered: 'kickoffs-excluded' };
    }

    const kickoffs = readKickoffArray(assistant);
    if (kickoffs.length > 0) {
      const signals = await this.signalCollector.collect(assistantId);
      const items = rankGridKickoffs(kickoffs, signals, assistantId)
        .slice(0, cap)
        .map<KickoffGridItem>((k) => ({ kickoffId: k.id, text: k.text, prefill: k.prefill, source: 'kickoff' }));
      return { items };
    }

    // Fallback: legacy prompt strings (presets carry localized promptsI18n;
    // some catalog rows carry only a flat prompts array).
    const prompts = readPromptsFallback(assistant, locale).slice(0, cap);
    if (prompts.length > 0) {
      return { items: prompts.map<KickoffGridItem>((p) => ({ text: p, prefill: p, source: 'prompts' })) };
    }

    return { notRendered: 'no-kickoffs-defined' };
  }
}

/**
 * #375 - grid ordering. Stable across a day for one install: seed the base
 * shuffle with `installUuid:assistantId:dateKey`, then stable-sort so
 * beginner-safe entries lead and current-time-bucket entries follow, with the
 * shuffled order breaking ties. De-dupes by id defensively (readKickoffArray
 * already drops malformed rows, but a bundle could repeat an id).
 */
function rankGridKickoffs(kickoffs: KickoffEntry[], signals: KickoffSignals, assistantId: string): KickoffEntry[] {
  const seed = hashSeed(`${signals.installUuid}:${assistantId}:${dateKey(signals.now)}`);
  const shuffled = seededShuffle(kickoffs, seed);
  const seen = new Set<string>();
  const deduped = shuffled.filter((k) => (seen.has(k.id) ? false : (seen.add(k.id), true)));
  const score = (k: KickoffEntry): number =>
    (k.beginnerSafe === true ? 2 : 0) + (k.timeBucket === signals.timeBucket ? 1 : 0);
  // Stable sort: Array.prototype.sort is stable in V8, so equal scores keep the
  // seeded-shuffle order.
  return deduped.toSorted((a, b) => score(b) - score(a));
}

/**
 * #375 - read legacy prompt strings for the grid fallback. Prefers the flat
 * `prompts` array (catalog rows), then `promptsI18n[locale]` with an `en-US`
 * backstop (ASSISTANT_PRESETS like cowork). Returns trimmed, non-empty,
 * de-duplicated strings; never throws on a malformed shape.
 */
function readPromptsFallback(raw: Record<string, unknown>, locale: string): string[] {
  const out: string[] = [];
  const push = (v: unknown): void => {
    if (typeof v === 'string') {
      const t = v.trim();
      if (t.length > 0) out.push(t);
    }
  };

  const flat = (raw as { prompts?: unknown }).prompts;
  if (Array.isArray(flat)) flat.forEach(push);

  if (out.length === 0) {
    const i18n = (raw as { promptsI18n?: unknown }).promptsI18n;
    if (i18n && typeof i18n === 'object') {
      const byLocale = i18n as Record<string, unknown>;
      const chosen = byLocale[locale] ?? byLocale['en-US'] ?? Object.values(byLocale)[0];
      if (Array.isArray(chosen)) chosen.forEach(push);
    }
  }

  return Array.from(new Set(out));
}

function pickQualityThread(signals: KickoffSignals): KickoffSignals['assistantRecentConversations'][number] | null {
  for (const conv of signals.assistantRecentConversations) {
    // v0.4.7.1 (A-M-2) - also require the thread to be within the recent
    // window (default 7 days). Without this upper bound, a 6-month-old
    // thread that happens to clear the quality gate would surface
    // "picking up from your last session?" in November about a conv from
    // May. Pair with THREAD_RECENT_WINDOW_MS in types.ts.
    if (
      conv.messageCount >= THREAD_MIN_MESSAGES &&
      conv.durationMs >= THREAD_MIN_DURATION_MS &&
      !conv.isAutoTitled &&
      signals.now - conv.modifyTime <= THREAD_RECENT_WINDOW_MS
    ) {
      return conv;
    }
  }
  return null;
}

function buildSuggestion(
  level: KickoffCascadeLevel,
  reason: KickoffCascadeReason,
  primary: KickoffEntry,
  all: KickoffEntry[]
): KickoffSuggestion {
  const alternates: KickoffAlternate[] = all
    .filter((k) => k.id !== primary.id && k.scenario === primary.scenario)
    .slice(0, 2)
    .map((k) => ({ kickoffId: k.id, text: k.text, prefill: k.prefill }));
  return {
    cascadeLevel: level,
    cascadeReason: reason,
    kickoffId: primary.id,
    text: primary.text,
    prefill: primary.prefill,
    alternates,
  };
}

/**
 * v0.4.7.1 (B-M-1) - overlay `kickoffs` enum guards on `scenario` and
 * `timeBucket`. Drop malformed entries with a `console.warn` so bundle
 * typos / schema drift surface in logs instead of silently disabling
 * cascade tiers at runtime.
 */
const VALID_SCENARIOS = new Set<KickoffEntry['scenario']>(['cold-start', 'continuation-friendly', 'post-fire-ritual']);
const VALID_TIME_BUCKETS = new Set<NonNullable<KickoffEntry['timeBucket']>>([
  'late-night',
  'morning',
  'afternoon',
  'evening',
]);

function readKickoffArray(raw: Record<string, unknown>): KickoffEntry[] {
  const candidate = raw.kickoffs;
  if (!Array.isArray(candidate)) return [];
  const assistantId = typeof (raw as { id?: unknown }).id === 'string' ? (raw as { id: string }).id : '<unknown>';
  const out: KickoffEntry[] = [];
  for (const entry of candidate) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const id = typeof e.id === 'string' ? e.id : '';
    const text = typeof e.text === 'string' ? e.text : '';
    const prefill = typeof e.prefill === 'string' ? e.prefill : '';
    const scenarioRaw = typeof e.scenario === 'string' ? e.scenario : '';
    if (!id || !text || !prefill) continue;
    if (!VALID_SCENARIOS.has(scenarioRaw as KickoffEntry['scenario'])) {
      console.warn(
        `[Kickoff] dropping entry "${id}" on assistant "${assistantId}" - invalid scenario "${scenarioRaw}"`
      );
      continue;
    }
    const scenario = scenarioRaw as KickoffEntry['scenario'];

    let timeBucket: KickoffEntry['timeBucket'];
    if (e.timeBucket !== undefined) {
      if (
        typeof e.timeBucket === 'string' &&
        VALID_TIME_BUCKETS.has(e.timeBucket as NonNullable<KickoffEntry['timeBucket']>)
      ) {
        timeBucket = e.timeBucket as KickoffEntry['timeBucket'];
      } else {
        console.warn(
          `[Kickoff] entry "${id}" on assistant "${assistantId}" - invalid timeBucket "${String(e.timeBucket)}"; treating as no bucket`
        );
      }
    }

    out.push({
      id,
      text,
      prefill,
      scenario,
      timeBucket,
      requiresRitualOutput: e.requiresRitualOutput === true ? true : undefined,
      beginnerSafe: e.beginnerSafe === true ? true : undefined,
    });
  }
  return out;
}
