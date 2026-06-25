import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';
import { resolveExtensionAssetUrl } from '@/renderer/utils/platform';
import type { AssistantKickoff, AssistantListItem, KickoffScenario, KickoffTimeBucket } from './types';

export type AssistantListFilter = 'all' | 'enabled' | 'disabled' | 'builtin' | 'custom' | 'extension';
export type AssistantSource = 'builtin' | 'custom' | 'extension';

/**
 * Check if a builtin assistant has skills config (defaultEnabledSkills or skillFiles).
 *
 * The optional `record` lets callers also qualify native catalog specialists
 * (waylandteams), which are stored as `builtin-<slug>` records that are NOT in
 * ASSISTANT_PRESETS but carry their assigned skills inline on `enabledSkills`.
 * Without this the Settings editor cleared their skills list (they failed the
 * preset lookup), so native specialists could not view/edit their skills.
 */
export const hasBuiltinSkills = (
  assistantId: string,
  record?: { enabledSkills?: string[] | null } | null
): boolean => {
  if (!assistantId.startsWith('builtin-')) return false;
  if (record && Array.isArray(record.enabledSkills) && record.enabledSkills.length > 0) {
    return true;
  }
  const presetId = assistantId.replace('builtin-', '');
  const preset = ASSISTANT_PRESETS.find((p) => p.id === presetId);
  if (!preset) return false;
  const hasDefaultSkills = preset.defaultEnabledSkills && preset.defaultEnabledSkills.length > 0;
  const hasSkillFiles = preset.skillFiles && Object.keys(preset.skillFiles).length > 0;
  return hasDefaultSkills || hasSkillFiles;
};

/**
 * Check if a string is an emoji (simple check for common emoji patterns).
 */
export const isEmoji = (str: string): boolean => {
  if (!str) return false;
  const emojiRegex =
    /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*$/u;
  return emojiRegex.test(str);
};

/**
 * Resolve an avatar string to an image src URL, or undefined if it is not an image.
 */
export const resolveAvatarImageSrc = (
  avatar: string | undefined,
  avatarImageMap: Record<string, string>
): string | undefined => {
  const value = avatar?.trim();
  if (!value) return undefined;

  const mapped = avatarImageMap[value];
  if (mapped) return mapped;

  const resolved = resolveExtensionAssetUrl(value) || value;
  const isImage =
    /\.(svg|png|jpe?g|webp|gif)$/i.test(resolved) || /^(https?:|wayland-asset:\/\/|file:\/\/|data:)/i.test(resolved);
  return isImage ? resolved : undefined;
};

/**
 * Sort assistants according to ASSISTANT_PRESETS order.
 */
export const sortAssistants = (agents: AssistantListItem[]): AssistantListItem[] => {
  const presetOrder = ASSISTANT_PRESETS.map((preset) => `builtin-${preset.id}`);
  return agents
    .filter((agent) => agent.isPreset)
    .toSorted((a, b) => {
      const indexA = presetOrder.indexOf(a.id);
      const indexB = presetOrder.indexOf(b.id);
      if (indexA !== -1 || indexB !== -1) {
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      }
      return 0;
    });
};

const KICKOFF_SCENARIOS: ReadonlySet<KickoffScenario> = new Set([
  'cold-start',
  'continuation-friendly',
  'post-fire-ritual',
]);
const KICKOFF_TIME_BUCKETS: ReadonlySet<KickoffTimeBucket> = new Set(['morning', 'afternoon', 'evening']);

/**
 * Normalize the raw `kickoffs` array off a bundle record into a typed
 * AssistantKickoff[]. Drops entries missing required fields (id/text/prefill/
 * scenario) and clamps optional fields to known enum values. Returns undefined
 * when no valid entries survive so the SuggestionEngine can short-circuit on
 * `no-kickoffs-defined`.
 */
const normalizeKickoffs = (raw: unknown): AssistantKickoff[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const out: AssistantKickoff[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const id = typeof e.id === 'string' ? e.id : '';
    const text = typeof e.text === 'string' ? e.text : '';
    const prefill = typeof e.prefill === 'string' ? e.prefill : '';
    const scenario = typeof e.scenario === 'string' ? (e.scenario as KickoffScenario) : undefined;
    if (!id || !text || !prefill || !scenario || !KICKOFF_SCENARIOS.has(scenario)) continue;
    const bucket = typeof e.timeBucket === 'string' ? (e.timeBucket as KickoffTimeBucket) : undefined;
    out.push({
      id,
      text,
      prefill,
      scenario,
      timeBucket: bucket && KICKOFF_TIME_BUCKETS.has(bucket) ? bucket : undefined,
      requiresRitualOutput: e.requiresRitualOutput === true ? true : undefined,
      beginnerSafe: e.beginnerSafe === true ? true : undefined,
    });
  }
  return out.length > 0 ? out : undefined;
};

/**
 * Normalize raw extension assistant records into typed AssistantListItem[].
 */
export const normalizeExtensionAssistants = (extensionAssistants: Record<string, unknown>[]): AssistantListItem[] => {
  if (!Array.isArray(extensionAssistants) || extensionAssistants.length === 0) return [];

  return extensionAssistants
    .map((ext) => {
      const id = typeof ext.id === 'string' ? ext.id : '';
      const name = typeof ext.name === 'string' ? ext.name : '';
      if (!id || !name) return null;

      return {
        id,
        name,
        nameI18n: ext.nameI18n as Record<string, string> | undefined,
        description: typeof ext.description === 'string' ? ext.description : undefined,
        descriptionI18n: ext.descriptionI18n as Record<string, string> | undefined,
        avatar: typeof ext.avatar === 'string' ? ext.avatar : undefined,
        presetAgentType: typeof ext.presetAgentType === 'string' ? ext.presetAgentType : undefined,
        context: typeof ext.context === 'string' ? ext.context : undefined,
        contextI18n: ext.contextI18n as Record<string, string> | undefined,
        models: Array.isArray(ext.models) ? (ext.models as string[]) : undefined,
        enabledSkills: Array.isArray(ext.enabledSkills) ? (ext.enabledSkills as string[]) : undefined,
        prompts: Array.isArray(ext.prompts) ? (ext.prompts as string[]) : undefined,
        promptsI18n: ext.promptsI18n as Record<string, string[]> | undefined,
        isPreset: true,
        isBuiltin: false,
        enabled: true,
        _source: 'extension',
        _extensionName: typeof ext._extensionName === 'string' ? ext._extensionName : undefined,
        // Prefer the bundle-declared `kind` ('team' | 'specialist' for the
        // /assistants library page). Fall back to legacy `_kind` if older
        // bundles set it.
        _kind:
          typeof ext.kind === 'string'
            ? ext.kind
            : typeof ext._kind === 'string'
              ? ext._kind
              : undefined,
        // W1a - Carry the launcher roster, ritual cadences, and standing flag
        // through to the renderer so W2a (Standing Companies sub-group) and
        // W2b (pre-configured spawn) can render without re-reading bundle.
        _teammates: Array.isArray(ext.teammates) ? (ext.teammates as string[]) : undefined,
        _rituals: Array.isArray(ext.rituals)
          ? (ext.rituals as Array<{ name: string; cadence: string }>)
          : undefined,
        _standing: typeof ext.standing === 'boolean' ? ext.standing : undefined,
        // v0.4.7 - Kickoff cards. Normalize through a strict mapper that drops
        // entries missing required fields rather than passing junk through to
        // the SuggestionEngine where it would silently misfire.
        _kickoffs: normalizeKickoffs(ext.kickoffs),
        // v0.4.7.1 (DATA-2) - Carry the opt-out sentinel from the bundle so
        // renderer-side code can distinguish "no kickoffs authored yet" from
        // "intentionally excluded" (agent-profile assistants).
        _kickoffsExcluded: ext._kickoffsExcluded === true ? true : undefined,
      } as AssistantListItem;
    })
    .filter((item): item is AssistantListItem => item !== null);
};

/**
 * Map a stored (config.assistants) record's native-catalog fields onto the
 * renderer's `_`-prefixed fields. Native built-in catalog records (waylandteams)
 * carry `kind`/`teammates`/`rituals`/`standing`/`kickoffs` on the base config;
 * the library + /teams surfaces read `_kind`/`_teammates`/... (the shape the
 * extension path produced). This bridges the two so a native team launcher
 * surfaces on /teams identically to how it did when loaded as an extension.
 * No-op for records that carry no `kind` (e.g. the 31 ASSISTANT_PRESETS rows).
 */
export const normalizeStoredAssistant = (assistant: AssistantListItem): AssistantListItem => {
  const a = assistant as AssistantListItem & {
    kind?: 'team' | 'specialist';
    teammates?: string[];
    rituals?: Array<{ name: string; cadence: string }>;
    standing?: boolean;
    kickoffs?: unknown;
  };
  if (!a.kind) return assistant;
  return {
    ...assistant,
    _kind: a._kind ?? a.kind,
    _teammates: a._teammates ?? a.teammates,
    _rituals: a._rituals ?? a.rituals,
    _standing: a._standing ?? a.standing,
    _kickoffs: a._kickoffs ?? normalizeKickoffs(a.kickoffs),
  };
};

/**
 * True when an assistant should be offered as a Team leader / teammate.
 *
 * Specialists (native waylandteams + vendored agent-profiles carry
 * `_kind === 'specialist'`) and user-created custom assistants both qualify;
 * team launchers (`_kind === 'team'`) and the 31 generic built-in presets do
 * not. The `!isBuiltin` clause is what surfaces custom Specialists (#115) -
 * including ones saved before they were stamped with `kind: 'specialist'`, which
 * carry no `_kind` at all.
 */
export const isSelectableSpecialist = (assistant: AssistantListItem): boolean =>
  assistant._kind === 'specialist' || (assistant._kind !== 'team' && !assistant.isBuiltin);

/**
 * Check if an assistant originates from an extension or another bundle-vendored
 * source (waylandteams via the resolver, FoundrySkills via the agent-profile
 * merge). All of these are read-only, ship their context inline on the record,
 * and should bypass the local-file context loader used for user-created
 * assistants.
 */
export const isExtensionAssistant = (assistant: AssistantListItem | null | undefined): boolean => {
  if (!assistant) return false;
  return (
    assistant._source === 'extension' ||
    assistant._source === 'vendored-agent-profile' ||
    assistant.id.startsWith('ext-')
  );
};

/**
 * Resolve assistant source label for management UI.
 */
export const getAssistantSource = (assistant: AssistantListItem): AssistantSource => {
  if (isExtensionAssistant(assistant)) return 'extension';
  if (assistant.isBuiltin) return 'builtin';
  return 'custom';
};

/**
 * Apply search and management filter to assistant list.
 */
export const filterAssistants = (
  assistants: AssistantListItem[],
  query: string,
  filter: AssistantListFilter,
  localeKey: string
): AssistantListItem[] => {
  const normalizedQuery = query.trim().toLowerCase();

  return assistants.filter((assistant) => {
    if (normalizedQuery) {
      const searchableText = [
        assistant.nameI18n?.[localeKey] || assistant.name,
        assistant.descriptionI18n?.[localeKey] || assistant.description || '',
      ]
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(normalizedQuery)) return false;
    }

    switch (filter) {
      case 'enabled':
        return assistant.enabled !== false;
      case 'disabled':
        return assistant.enabled === false;
      case 'builtin':
        return getAssistantSource(assistant) !== 'custom';
      case 'custom':
        return getAssistantSource(assistant) === 'custom';
      case 'extension':
        return getAssistantSource(assistant) === 'extension';
      case 'all':
      default:
        return true;
    }
  });
};

/**
 * Split assistants into enabled and disabled groups while preserving order.
 */
export const groupAssistantsByEnabled = (assistants: AssistantListItem[]) => ({
  enabledAssistants: assistants.filter((assistant) => assistant.enabled !== false),
  disabledAssistants: assistants.filter((assistant) => assistant.enabled === false),
});
