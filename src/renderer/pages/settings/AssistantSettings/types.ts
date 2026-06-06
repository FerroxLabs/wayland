import type { AcpBackendConfig } from '@/common/types/acpTypes';

// Skill info type
export type SkillSource = 'builtin' | 'custom' | 'extension';

export type SkillInfo = {
  name: string;
  description: string;
  location: string;
  isCustom: boolean;
  source: SkillSource;
};

// External source type
export type ExternalSource = {
  name: string;
  path: string;
  source: string;
  skills: Array<{ name: string; description: string; path: string }>;
};

// Pending skill to import
export type PendingSkill = {
  path: string;
  name: string;
  description: string;
};

// Builtin auto-injected skill info
export type BuiltinAutoSkill = {
  name: string;
  description: string;
};

export type AssistantListItem = AcpBackendConfig & {
  _source?: string;
  _extensionName?: string;
  _kind?: string;
  /** W1a - Roster of specialist assistant IDs that compose this launcher (kind==='team' only). */
  _teammates?: string[];
  /** W1a - Recurring rituals declared by the launcher (e.g. weekly standup). */
  _rituals?: Array<{ name: string; cadence: string }>;
  /** W1a / TRIAGE C4 - True only for the 5 Standing Companies. */
  _standing?: boolean;
  /** v0.4.7 - Hand-curated kickoffs surfaced by the SuggestionEngine on empty-state. */
  _kickoffs?: AssistantKickoff[];
  /**
   * v0.4.7.1 (DATA-2) - Sentinel set by the agent-profile merge in the main
   * process to mark assistants that should intentionally opt out of the
   * Kickoff cascade. The engine returns `notRendered: 'kickoffs-excluded'`
   * for these and the renderer suppresses the `not_rendered` telemetry. Kept
   * on the renderer type so any downstream renderer code can reason about
   * the opt-out without re-querying the engine.
   */
  _kickoffsExcluded?: boolean;
};

/**
 * v0.4.7 - Kickoff card data carried per assistant. Authored in
 * .planning/kickoff-library/v3-consolidated.yaml, spliced into the vendored
 * bundle (assistants.json) and overlayed at runtime via vendoredAssistantOverlay.
 *
 * scenario gates which cascade level the SuggestionEngine matches:
 *   - cold-start            → level 3 (default empty-state library)
 *   - continuation-friendly → level 2 (recent-thread quality-gated)
 *   - post-fire-ritual      → level 1 (Standing Company ritual fired in last 4h)
 *
 * beginnerSafe entries are the level-4 fallback for first-touch users.
 * requiresRitualOutput hard-gates a card on actual ritual output existing.
 */
export type KickoffTimeBucket = 'morning' | 'afternoon' | 'evening';
export type KickoffScenario = 'cold-start' | 'continuation-friendly' | 'post-fire-ritual';

export type AssistantKickoff = {
  id: string;
  text: string;
  prefill: string;
  scenario: KickoffScenario;
  timeBucket?: KickoffTimeBucket;
  requiresRitualOutput?: boolean;
  beginnerSafe?: boolean;
};
