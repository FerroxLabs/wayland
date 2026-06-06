/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Brain, ChevronDown, ChevronRight, Pin, Plus, Search } from 'lucide-react';
import { Button, Dropdown, Input, Menu, Message, Tooltip } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import type { IProvider, TProviderWithModel } from '@/common/config/storage';
import type { CuratedModel, ProviderId } from '@process/providers/types';
import { FLUX_MODEL_DISPLAY, FLUX_MODEL_IDS, isFluxModelId, type FluxModelId } from '@/common/config/flux';
import { getFluxCompat } from '@/common/types/acpTypes';
import { useFluxConnected } from '@/renderer/hooks/useFluxConnected';
import { marqueeProviderRank } from '@renderer/utils/model/marquee';
import { useModelRegistry } from '@/renderer/hooks/useModelRegistry';
import { useUsageTelemetry } from '@/renderer/hooks/usage/useUsageTelemetry';
import { useFrequentlyUsedModels, type FrequentlyUsedModel } from '@/renderer/hooks/usage/useFrequentlyUsedModels';
import { useRecentlyUsedModels } from '@/renderer/hooks/usage/useRecentlyUsedModels';
import { pinKey, usePinnedModels } from '@/renderer/hooks/usage/usePinnedModels';
import { resolveAgentScope } from '@/renderer/pages/settings/AgentSettings/agentScopes';
import { iconColors } from '@/renderer/styles/colors';
import FluxRouterMark from '@/renderer/components/icons/FluxRouterMark';
import { getModelDisplayLabel } from '@/renderer/utils/model/agentLogo';
import { formatAcpModelDisplayLabel, getAcpModelSourceLabel } from '@/renderer/utils/model/modelSource';
import type { AcpModelInfo } from '../types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styles from './GuidModelSelector.module.css';

type GuidModelSelectorProps = {
  // Provider-based agent model state (Gemini / Wayland Core)
  isGeminiMode: boolean;
  modelList: IProvider[];
  currentModel: TProviderWithModel | undefined;
  setCurrentModel: (model: TProviderWithModel) => Promise<void>;

  // The currently-selected agent - scopes the curated model list and the
  // plain-language caption. Provider-based agents pass 'gemini' / 'wcore';
  // CLI agents pass their backend key ('claude', 'codex', …).
  agentKey: string;

  // ACP model state (CLI agents)
  currentAcpCachedModelInfo: AcpModelInfo | null;
  selectedAcpModel: string | null;
  setSelectedAcpModel: React.Dispatch<React.SetStateAction<string | null>>;
};

/**
 * Map a model's blended USD-per-million-token cost to a $ / $$ / $$$ tier.
 *
 * The blend weights output 3:1 (output tokens dominate real chat spend).
 * Thresholds are tuned against the live curated set: a blended cost of
 * USD/M ≤ 5 lands at $ (Haiku, GPT mini, Gemini Flash), ≤ 15 at $$ (Sonnet,
 * GPT-5.4), and > 15 at $$$ (Opus, GPT-5.5). A model with no cost data
 * returns `null` - its row shows no tier rather than a fabricated one.
 */
export function costToPriceTier(
  costInPerM: number | undefined,
  costOutPerM: number | undefined
): '$' | '$$' | '$$$' | null {
  const hasIn = typeof costInPerM === 'number' && Number.isFinite(costInPerM);
  const hasOut = typeof costOutPerM === 'number' && Number.isFinite(costOutPerM);
  if (!hasIn && !hasOut) return null;
  const inCost = hasIn ? (costInPerM as number) : (costOutPerM as number);
  const outCost = hasOut ? (costOutPerM as number) : (costInPerM as number);
  const blended = (inCost + outCost * 3) / 4;
  if (blended <= 5) return '$';
  if (blended <= 15) return '$$';
  return '$$$';
}

// Per-provider dot color in the Recommended section. Matches the mockup
// palette so providers visually anchor their group; unknown providers fall
// back to a neutral gray.
const PROVIDER_DOT_COLOR: Partial<Record<ProviderId, string>> = {
  anthropic: 'rgba(244, 114, 182, 0.7)',
  'google-gemini': 'rgba(56, 189, 248, 0.7)',
  openai: 'rgba(16, 185, 129, 0.7)',
  deepseek: 'rgba(139, 92, 246, 0.7)',
  // Wayland Core models surface under their underlying provider id; the
  // built-in fallback dot uses the brand orange via the .providerDot inline
  // style override.
};

const PROVIDER_DISPLAY_NAME: Partial<Record<ProviderId, string>> = {
  anthropic: 'Anthropic',
  'google-gemini': 'Google',
  openai: 'OpenAI',
  'aws-bedrock': 'AWS Bedrock',
  vertex: 'Vertex',
  openrouter: 'OpenRouter',
  groq: 'Groq',
  xai: 'xAI',
  mistral: 'Mistral',
  cohere: 'Cohere',
  perplexity: 'Perplexity',
  together: 'Together',
  fireworks: 'Fireworks',
  cerebras: 'Cerebras',
  replicate: 'Replicate',
  huggingface: 'Hugging Face',
  nvidia: 'NVIDIA',
  anyscale: 'Anyscale',
  deepseek: 'DeepSeek',
  moonshot: 'Moonshot',
  qwen: 'Qwen',
  baichuan: 'Baichuan',
  lingyiwanwu: 'Yi (01.AI)',
  'zhipu-glm': 'Zhipu GLM',
  minimax: 'MiniMax',
  stability: 'Stability',
  deepgram: 'Deepgram',
  assemblyai: 'AssemblyAI',
  elevenlabs: 'ElevenLabs',
  azure: 'Azure',
  'openai-compatible': 'OpenAI-Compatible',
  'flux-router': 'Flux Router',
};

function providerDisplayName(id: ProviderId): string {
  return PROVIDER_DISPLAY_NAME[id] ?? id;
}

/**
 * Group models by provider, preserving each provider's first-seen order.
 * Used both for the Recommended zone (`recommended === true` subset) and the
 * collapsible "All [Provider]" sections (full set).
 */
function groupByProvider(models: CuratedModel[]): Array<{ providerId: ProviderId; models: CuratedModel[] }> {
  const groups: Array<{ providerId: ProviderId; models: CuratedModel[] }> = [];
  const index = new Map<ProviderId, number>();
  for (const model of models) {
    let pos = index.get(model.providerId);
    if (pos === undefined) {
      pos = groups.length;
      index.set(model.providerId, pos);
      groups.push({ providerId: model.providerId, models: [] });
    }
    groups[pos].models.push(model);
  }
  return groups;
}

/**
 * Highlight every occurrence of `query` (case-insensitive) inside `text`.
 * Returns the original string when `query` is empty.
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const q = query.trim();
  if (!q) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const found = lowerText.indexOf(lowerQuery, cursor);
    if (found === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    if (found > cursor) parts.push(text.slice(cursor, found));
    parts.push(
      <span key={`hl-${found}`} className={styles.highlight}>
        {text.slice(found, found + q.length)}
      </span>
    );
    cursor = found + q.length;
  }
  return <>{parts}</>;
}

/**
 * True when the model matches the user's search query - checked against the
 * display name, the bare id, the family, and the provider display name so a
 * search for "google" finds every Gemini model.
 */
function matchesQuery(model: CuratedModel, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (model.displayName.toLowerCase().includes(q)) return true;
  if (model.id.toLowerCase().includes(q)) return true;
  if (model.family.toLowerCase().includes(q)) return true;
  if (providerDisplayName(model.providerId).toLowerCase().includes(q)) return true;
  return false;
}

/**
 * Models nobody should be silently dropped onto as a default: previews /
 * experimental / dated betas. `antigravity` is named explicitly because its
 * model id does not always carry "preview", and Google now lists a dead
 * `antigravity-preview` (enabled:false) FIRST in its Gemini set, so `curated[0]`
 * is no longer a safe fallback.
 */
const EXPERIMENTAL_CURATED_PATTERN = /\b(preview|experimental|exp|nightly|alpha|beta|antigravity)\b/i;
const isExperimentalCurated = (m: CuratedModel): boolean =>
  EXPERIMENTAL_CURATED_PATTERN.test(m.id) || EXPERIMENTAL_CURATED_PATTERN.test(m.displayName);

/**
 * The first curated model safe to silently fall a chat back onto: an enabled,
 * non-experimental model (recommended first). Returns undefined when only
 * preview/experimental models exist - callers must then leave the user's pin
 * and label untouched rather than surface a preview they never chose. This is
 * the guard that stops the picker booting to "Antigravity Preview".
 */
export const firstSafeCuratedModel = (list: CuratedModel[]): CuratedModel | undefined =>
  list.find((m) => m.recommended && m.enabled && !isExperimentalCurated(m)) ??
  list.find((m) => m.enabled && !isExperimentalCurated(m)) ??
  list.find((m) => !isExperimentalCurated(m));

const GuidModelSelector: React.FC<GuidModelSelectorProps> = ({
  isGeminiMode,
  modelList,
  currentModel,
  setCurrentModel,
  agentKey,
  currentAcpCachedModelInfo,
  selectedAcpModel,
  setSelectedAcpModel,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { curatedForAgent, registryVersion } = useModelRegistry();
  const recordTelemetry = useUsageTelemetry();
  const defaultModelLabel = t('common.defaultModel');

  // Open state - exposed so the frequently-used hook can defer its IPC until
  // the panel is actually visible.
  const [panelOpen, setPanelOpen] = React.useState(false);

  // Plain-language scope sentence for the selected agent. Reuses the same
  // copy as the Agents settings page so the explanation lives at the point
  // of friction (spec §4.8) without diverging from §4.7.
  const scopeCaption = React.useMemo(() => {
    const scope = resolveAgentScope(agentKey);
    return t(`settings.agentsPage.scope.${scope.scopeKey}`);
  }, [agentKey, t]);

  // ── Curated set, scoped to the selected agent ────────────────────────────
  // Re-fetched whenever the agent changes (`agentKey` in the deps) AND whenever
  // the registry's `listChanged` invalidation counter advances - a background /
  // manual `refreshAll` lands a new catalog, so an already-open picker updates
  // live (SPEC §4.4). May resolve to `[]` for a non-enumerable CLI whose
  // provider isn't connected.
  const [curated, setCurated] = React.useState<CuratedModel[] | undefined>(undefined);
  // Only blank the panel back to its loading state when the *agent* changes; a
  // `listChanged`-triggered re-fetch keeps the current list on screen until the
  // new one resolves so the open dropdown doesn't flash empty mid-refresh.
  React.useEffect(() => {
    setCurated(undefined);
  }, [agentKey]);
  React.useEffect(() => {
    let cancelled = false;
    curatedForAgent(agentKey)
      .then((models) => {
        if (!cancelled) setCurated(models);
      })
      .catch(() => {
        if (!cancelled) setCurated((prev) => prev ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [agentKey, curatedForAgent, registryVersion]);

  // Resolve the currently-selected curated model so its row is highlighted
  // and its label shown on the button.
  //
  // Wave 3 Fix 15: the menu keys items by `${providerId}:${id}`. To match, build
  // the selection key from `currentModel.id` (which `setCurrentModel` wrote from
  // `provider.providerId` per Wave 3 Fix 11 in useGuidModelSelection.ts:167) +
  // the saved `useModel`. Fall back to `platform` (legacy persisted rows that
  // wrote the platform string here pre-Wave-3-Fix-11) and then bare `useModel`.
  //
  // v0.6.2.5 fix: previously this used `currentModel.platform` exclusively,
  // which holds the LLM platform string (`'gemini'`) NOT the providerId
  // (`'google-gemini'`). For every provider where the two differ, the
  // stale-pin auto-fallback below saw the just-picked model as "not in
  // curated" and silently reverted to curated[0]. OpenAI accidentally worked
  // because `'openai' === 'openai'`.
  const selectedCuratedKey = React.useMemo(() => {
    if (!currentModel?.useModel) return null;
    if (currentModel.id) return `${currentModel.id}:${currentModel.useModel}`;
    if (currentModel.platform) return `${currentModel.platform}:${currentModel.useModel}`;
    return currentModel.useModel;
  }, [currentModel?.id, currentModel?.platform, currentModel?.useModel]);

  const selectedCuratedModel = React.useMemo(() => {
    if (!curated || !selectedCuratedKey) return null;
    return curated.find((m) => `${m.providerId}:${m.id}` === selectedCuratedKey || m.id === selectedCuratedKey) ?? null;
  }, [curated, selectedCuratedKey]);

  const curatedButtonLabel = React.useMemo(() => {
    if (!curated || curated.length === 0) return defaultModelLabel;
    return getModelDisplayLabel({
      selectedValue: selectedCuratedModel?.id,
      selectedLabel: selectedCuratedModel?.displayName,
      defaultModelLabel,
      // When the pinned model isn't in this agent's curated subset, show the
      // model that will actually run (e.g. a user-set `gpt-5.5`), then the
      // first safe curated model - NEVER curated[0], which is now Google's
      // dead antigravity preview.
      fallbackLabel: currentModel?.useModel || firstSafeCuratedModel(curated)?.displayName || defaultModelLabel,
    });
  }, [curated, defaultModelLabel, selectedCuratedModel, currentModel?.useModel]);

  // Pick a curated model: resolve its credentials through the modelRegistry
  // IPC (Packet 3B) so the chat-start flow no longer depends on the legacy
  // `model.config` row. The resolver hands back the platform / apiKey /
  // baseUrl / bedrockConfig the main-process dispatch needs verbatim.
  const handlePickCurated = React.useCallback(
    async (model: CuratedModel, opts?: { silent?: boolean }) => {
      const result = await ipcBridge.modelRegistry.resolveForChatStart
        .invoke({
          providerId: model.providerId,
          modelId: model.id,
        })
        .catch((error) => {
          console.error('Failed to resolve curated model for chat-start:', error);
          return { ok: false as const, error: 'unknown' as const };
        });

      if (!result.ok) {
        // `silent` callers (the stale-pin auto-fallback effect below) just
        // wanted to repair their own state and must not yank the user off
        // /guid. The user did not click anything; navigating them to
        // /settings/models would interrupt whatever they were doing
        // (e.g. starting a chat with a preset assistant whose backend
        // happens to be unconfigured).
        if (opts?.silent) return;

        // Wave 3 Fix 9 - differentiate `undecryptable` from `not-connected`.
        // `undecryptable` means the provider row exists but its ciphertext is
        // unreadable; the user needs to re-enter the key, not "connect a new
        // provider". Surface that distinction in the toast before navigating.
        const failureError = 'error' in result ? result.error : 'unknown';
        if (failureError === 'undecryptable') {
          Message.error(t('settings.modelsPage.connect.undecryptableHint'));
        }
        navigate('/settings/models');
        return;
      }

      const provider = result.provider;
      // Build the `TProviderWithModel` the chat-start pipeline expects. We
      // synthesize a `capabilities` array (text) - the legacy modelList path
      // exposed `provider.capabilities`, but the registry doesn't carry
      // explicit IProvider-shaped capabilities; chat-start consumers only
      // read the fields below. A previous-curated lookup in `modelList`
      // remains as a last-resort fallback for richer fields (e.g. an
      // existing `modelProtocols` block on a `new-api` row), but the
      // resolved registry data wins for credentials.
      const legacyMatch =
        modelList.find((p) => p.platform === provider.platform && p.model?.includes(model.id)) ||
        modelList.find((p) => p.model?.includes(model.id));
      const next: TProviderWithModel = {
        ...legacyMatch,
        id: provider.id,
        platform: provider.platform,
        name: provider.name,
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        useModel: provider.modelId,
        ...(provider.bedrockConfig ? { bedrockConfig: provider.bedrockConfig } : {}),
      } as TProviderWithModel;

      setCurrentModel(next).catch((error) => {
        console.error('Failed to set current model:', error);
      });

      // Fire-and-forget telemetry on a user-driven selection. The silent
      // auto-fallback effect below uses `opts.silent` and must NOT log a
      // selection - that would skew the Frequently-used aggregation toward
      // models the user never actively chose.
      if (!opts?.silent) {
        recordTelemetry({
          eventType: 'guid.model_selected',
          cliBackend: model.providerId,
          metadata: { modelId: model.id, source: 'curated' },
        });
      }

      setPanelOpen(false);
    },
    [modelList, navigate, recordTelemetry, setCurrentModel, t]
  );

  // ── Graceful fallback for chats pinned to a dropped model ────────────────
  // When the curated set has loaded for the current agent and the currently-
  // pinned model is no longer in it (e.g. an older model id that fell out of
  // the catalog after the Packet 3B migration), fall back to the first
  // curated model. Without this the picker would silently keep dispatching
  // chat-start against a model the user can no longer pick. Skipping
  // conditions: not in provider-agent mode (only relevant to gemini/wcore),
  // no curated yet (still loading), curated empty (no recommendation), or
  // no pinned selection at all.
  const fallbackFiredRef = React.useRef<string | null>(null);
  // Tracks whether the currently-selected key was present in the *previously
  // resolved* curated set, keyed by `${agentKey}:${selectedCuratedKey}`. This
  // is the no-flip guard's memory: a key that existed before a refresh and is
  // momentarily absent after one is a refresh artifact (re-flag / re-order /
  // mid-fetch), NOT a genuine drop, so the silent re-pin must not fire.
  const previouslyPresentRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!isGeminiMode) return;
    if (!curated || curated.length === 0) return;
    if (!selectedCuratedKey) return;
    const presenceKey = `${agentKey}:${selectedCuratedKey}`;
    const stillAvailable = curated.some(
      (m) => `${m.providerId}:${m.id}` === selectedCuratedKey || m.id === selectedCuratedKey
    );
    if (stillAvailable) {
      // Record that this (agent, selection) pair is currently selectable so a
      // later refresh that transiently drops it is recognized as an artifact.
      previouslyPresentRef.current = presenceKey;
      return;
    }
    // NO-FLIP GUARD (SPEC §4.4 + §6): the selected model is absent from the
    // curated set. `curatedForAgent` returns the FULL per-agent catalog (every
    // persisted model, not just the recommended subset), so a true absence
    // means the model id is genuinely gone. But a background `refreshAll`
    // re-assembles that catalog, and we must NEVER silently change the user's
    // selection as a *reaction* to a refresh. If this exact (agent, selection)
    // pair was present before - i.e. the user could select it earlier this
    // session - treat its post-refresh absence as a refresh artifact and do
    // NOT re-pin. The fallback then only ever fires for a selection that was
    // never selectable for this agent (a genuinely-dropped / never-present id,
    // e.g. an old pin migrated in from a deleted model), which is the original
    // intent of this effect.
    if (previouslyPresentRef.current === presenceKey) return;
    // The pin may also be a real, configured model that simply isn't in THIS
    // agent's curated subset (e.g. a user-set `wcore.defaultModel = gpt-5.5`).
    // That is a deliberate choice, not a dropped pin - keep it rather than
    // repair onto a curated model. Only genuinely-missing models fall through.
    if (currentModel?.useModel && modelList.some((p) => p.model?.includes(currentModel.useModel))) return;
    // Guard against re-firing on every render. Keyed by the pair so a
    // new agent or new pinned-model retries the fallback decision once.
    const guardKey = `${agentKey}:${selectedCuratedKey}`;
    if (fallbackFiredRef.current === guardKey) return;
    fallbackFiredRef.current = guardKey;
    // silent: this fallback is internal repair. If the chosen provider is
    // unconfigured, leaving the user on /guid is correct - they may have
    // selected a preset assistant whose backend will be configured later.
    // Pick the first recommended/enabled model, never a blind curated[0]: the
    // list is in provider-model order, so index 0 can be a disabled preview
    // (e.g. the dead `antigravity-preview-…` Google returns first), which is
    // what silently re-pinned the home composer to it on every boot.
    const fallbackModel = firstSafeCuratedModel(curated);
    if (!fallbackModel) return;
    void handlePickCurated(fallbackModel, { silent: true });
  }, [agentKey, curated, isGeminiMode, selectedCuratedKey, handlePickCurated, currentModel?.useModel, modelList]);

  // Resolve a price tier for an ACP model entry. CLI-agent options use short
  // ids/labels (`sonnet`, `haiku`, `Sonnet (1M context)`) that almost never
  // equal a curated model id (`claude-sonnet-4-5`). Wave 4B R3 fix: match the
  // ACP option against the curated set by family/displayName tokens so the
  // tier badge actually renders. Exact-id match wins (handles a future ACP
  // model that uses real catalog ids); fall back to a token-substring match
  // against `family` and `displayName`. Returns null when nothing matches -
  // the row shows no tier rather than a fabricated one.
  const acpTierFor = React.useCallback(
    (modelId: string, modelLabel: string): '$' | '$$' | '$$$' | null => {
      if (!curated || curated.length === 0) return null;
      // 1. Exact id match - preserves the previous behavior when the ACP id
      //    happens to align with the catalog.
      const exact = curated.find((m) => m.id === modelId);
      if (exact) return costToPriceTier(exact.costInPerM, exact.costOutPerM);
      // 2. Token match: try the ACP id and label against each curated family
      //    + displayName. Lowercased, alphanumeric-only token list, longest
      //    token first so `sonnet` matches `claude-sonnet` before `claude`.
      const tokens = Array.from(
        new Set(
          `${modelId} ${modelLabel}`
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((token) => token.length >= 3)
        )
      ).toSorted((a, b) => b.length - a.length);
      for (const token of tokens) {
        const match = curated.find(
          (m) => m.family.toLowerCase().includes(token) || m.displayName.toLowerCase().includes(token)
        );
        if (match) return costToPriceTier(match.costInPerM, match.costOutPerM);
      }
      return null;
    },
    [curated]
  );

  // ── ACP model state (CLI agents) ─────────────────────────────────────────
  // Flux tiers appear atop the ACP picker for Flux-capable backends while the
  // flux-router provider is connected, so a connected user can pick Flux Auto
  // here at launch (mirrors the in-chat AcpModelSelector).
  const fluxConnected = useFluxConnected();
  const showAcpFlux = React.useMemo(() => {
    const compat = getFluxCompat(agentKey);
    return fluxConnected && (compat === 'env' || compat === 'setup');
  }, [agentKey, fluxConnected]);

  const acpSelectedLabel = React.useMemo(() => {
    if (isFluxModelId(selectedAcpModel)) return FLUX_MODEL_DISPLAY[selectedAcpModel as FluxModelId];
    return (
      currentAcpCachedModelInfo?.availableModels?.find((m) => m.id === selectedAcpModel)?.label ||
      currentAcpCachedModelInfo?.currentModelLabel ||
      currentAcpCachedModelInfo?.currentModelId ||
      ''
    );
  }, [
    currentAcpCachedModelInfo?.availableModels,
    currentAcpCachedModelInfo?.currentModelId,
    currentAcpCachedModelInfo?.currentModelLabel,
    selectedAcpModel,
  ]);

  const acpButtonLabel = React.useMemo(() => {
    return getModelDisplayLabel({
      selectedValue: selectedAcpModel || currentAcpCachedModelInfo?.currentModelId,
      selectedLabel: acpSelectedLabel,
      defaultModelLabel,
      fallbackLabel: defaultModelLabel,
    });
  }, [acpSelectedLabel, currentAcpCachedModelInfo?.currentModelId, defaultModelLabel, selectedAcpModel]);
  const acpSourceLabel = React.useMemo(
    () => getAcpModelSourceLabel(currentAcpCachedModelInfo),
    [currentAcpCachedModelInfo]
  );
  const acpButtonDisplayLabel = React.useMemo(
    () => formatAcpModelDisplayLabel(acpButtonLabel, acpSourceLabel),
    [acpButtonLabel, acpSourceLabel]
  );

  // ── Provider-based agents (Gemini / Wayland Core) - three-tier picker ────
  if (isGeminiMode) {
    return (
      <Dropdown
        trigger='click'
        position='bl'
        popupVisible={panelOpen}
        onVisibleChange={setPanelOpen}
        droplist={
          <ModelSelectorPanel
            agentKey={agentKey}
            curated={curated}
            selectedCuratedKey={selectedCuratedKey}
            selectedProviderId={selectedCuratedModel?.providerId ?? null}
            onPick={(model) => void handlePickCurated(model)}
            onAddProvider={() => navigate('/settings/models')}
            scopeCaption={scopeCaption}
            panelOpen={panelOpen}
            recordTelemetry={recordTelemetry}
          />
        }
      >
        <Button className={'sendbox-model-btn guid-config-btn'} shape='round' size='small'>
          <span className='flex items-center gap-6px min-w-0'>
            <Brain size={14} color={iconColors.secondary} className='shrink-0' />
            <span>{curatedButtonLabel}</span>
            <ChevronDown size={12} color={iconColors.secondary} className='shrink-0' />
          </span>
        </Button>
      </Dropdown>
    );
  }

  // ── CLI agents - ACP cached model selector ───────────────────────────────
  if (currentAcpCachedModelInfo && currentAcpCachedModelInfo.availableModels?.length > 0) {
    if (currentAcpCachedModelInfo.canSwitch) {
      // Inline scope caption - keeps the Arco Menu legal (no raw <div> kids).
      const scopeCaptionItem = (
        <Menu.Item
          key='scope-caption'
          disabled
          className='px-12px pt-8px pb-6px text-11px text-t-tertiary leading-snug'
        >
          {scopeCaption}
        </Menu.Item>
      );
      return (
        <Dropdown
          trigger='click'
          droplist={
            <Menu selectedKeys={selectedAcpModel ? [selectedAcpModel] : []}>
              {showAcpFlux && (
                <Menu.ItemGroup title={t('conversation.welcome.fluxGroupLabel')}>
                  {FLUX_MODEL_IDS.map((fluxId) => (
                    <Menu.Item
                      key={fluxId}
                      onClick={() => {
                        setSelectedAcpModel(fluxId);
                        recordTelemetry({
                          eventType: 'guid.model_selected',
                          cliBackend: agentKey,
                          metadata: { modelId: fluxId, source: 'flux' },
                        });
                      }}
                    >
                      <div className='flex items-center gap-8px w-full'>
                        <FluxRouterMark size={14} className='shrink-0' />
                        <span className='flex-1 min-w-0 truncate'>{FLUX_MODEL_DISPLAY[fluxId]}</span>
                      </div>
                    </Menu.Item>
                  ))}
                </Menu.ItemGroup>
              )}
              {scopeCaptionItem}
              {currentAcpCachedModelInfo.availableModels.map((model) => {
                const tier = acpTierFor(model.id, model.label);
                return (
                  <Menu.Item
                    key={model.id}
                    onClick={() => {
                      setSelectedAcpModel(model.id);
                      recordTelemetry({
                        eventType: 'guid.model_selected',
                        cliBackend: agentKey,
                        metadata: { modelId: model.id, source: 'acp' },
                      });
                    }}
                  >
                    <div className='flex items-center gap-8px w-full'>
                      <span className='flex-1 min-w-0 truncate'>{model.label}</span>
                      {tier && (
                        <span
                          className='text-11px font-600 text-t-tertiary tracking-wider shrink-0'
                          aria-label={t('settings.modelsPage.homePicker.priceTierAria', { tier })}
                        >
                          {tier}
                        </span>
                      )}
                    </div>
                  </Menu.Item>
                );
              })}
            </Menu>
          }
        >
          <Button className={'sendbox-model-btn guid-config-btn'} shape='round' size='small'>
            <span className='flex items-center gap-6px min-w-0'>
              <Brain size={14} color={iconColors.secondary} className='shrink-0' />
              <span>{acpButtonDisplayLabel}</span>
              <ChevronDown size={12} color={iconColors.secondary} className='shrink-0' />
            </span>
          </Button>
        </Dropdown>
      );
    }

    return (
      <Tooltip content={t('conversation.welcome.modelSwitchNotSupported')} position='top'>
        <Button
          className={'sendbox-model-btn guid-config-btn'}
          shape='round'
          size='small'
          style={{ cursor: 'default' }}
        >
          <span className='flex items-center gap-6px min-w-0'>
            <Brain size={14} color={iconColors.secondary} className='shrink-0' />
            <span>{acpButtonDisplayLabel}</span>
          </span>
        </Button>
      </Tooltip>
    );
  }

  // ── Fallback: no model switching ─────────────────────────────────────────
  return (
    <Tooltip content={t('conversation.welcome.modelSwitchNotSupported')} position='top'>
      <Button className={'sendbox-model-btn guid-config-btn'} shape='round' size='small' style={{ cursor: 'default' }}>
        <span className='flex items-center gap-6px min-w-0'>
          <Brain size={14} color={iconColors.secondary} className='shrink-0' />
          <span>{defaultModelLabel}</span>
        </span>
      </Button>
    </Tooltip>
  );
};

// ───────────────────────────────────────────────────────────────────────────
// ModelSelectorPanel - the three-tier custom dropdown panel rendered as the
// Arco Dropdown's droplist for provider-agent (Gemini / Wayland Core) mode.
// ───────────────────────────────────────────────────────────────────────────

type ModelSelectorPanelProps = {
  agentKey: string;
  curated: CuratedModel[] | undefined;
  selectedCuratedKey: string | null;
  selectedProviderId: ProviderId | null;
  onPick: (model: CuratedModel) => void;
  onAddProvider: () => void;
  scopeCaption: string;
  panelOpen: boolean;
  recordTelemetry: ReturnType<typeof useUsageTelemetry>;
};

export const ModelSelectorPanel: React.FC<ModelSelectorPanelProps> = ({
  agentKey: _agentKey,
  curated,
  selectedCuratedKey,
  selectedProviderId,
  onPick,
  onAddProvider,
  scopeCaption,
  panelOpen,
  recordTelemetry: _recordTelemetry,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState('');
  // Wraps the search input - used to locate the underlying `<input>` for ⌘K
  // focus without depending on Arco's internal ref shape.
  const searchWrapRef = React.useRef<HTMLDivElement | null>(null);

  // Fetch frequently-used / recently-used only while the panel is open -
  // avoids hammering the IPC on every renderer mount.
  const { models: frequentlyUsed } = useFrequentlyUsedModels(panelOpen);
  const { models: recentlyUsed } = useRecentlyUsedModels(panelOpen);
  const { pinned, toggle: togglePinKey } = usePinnedModels(panelOpen);

  const onTogglePin = React.useCallback(
    (model: CuratedModel) => togglePinKey(pinKey(model.providerId, model.id)),
    [togglePinKey]
  );
  const isPinned = React.useCallback((model: CuratedModel) => pinned.has(pinKey(model.providerId, model.id)), [pinned]);

  // ⌘K / Ctrl+K focuses the search input while the panel is open.
  React.useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = searchWrapRef.current?.querySelector<HTMLInputElement>('input');
        input?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen]);

  // Reset query when the panel is closed so the next open is clean.
  React.useEffect(() => {
    if (!panelOpen) setQuery('');
  }, [panelOpen]);

  // Which "All [Provider]" sections are expanded. Default-expand the section
  // containing the currently-selected model.
  const [openProviders, setOpenProviders] = React.useState<Set<ProviderId>>(() => {
    return selectedProviderId ? new Set([selectedProviderId]) : new Set();
  });
  // Re-seed when the selection's provider changes (e.g. user just picked a
  // model from a different provider and re-opens the panel).
  React.useEffect(() => {
    if (!selectedProviderId) return;
    setOpenProviders((prev) => {
      if (prev.has(selectedProviderId)) return prev;
      const next = new Set(prev);
      next.add(selectedProviderId);
      return next;
    });
  }, [selectedProviderId]);

  const isSelected = React.useCallback(
    (model: CuratedModel): boolean => {
      if (!selectedCuratedKey) return false;
      return `${model.providerId}:${model.id}` === selectedCuratedKey || model.id === selectedCuratedKey;
    },
    [selectedCuratedKey]
  );

  // Filtered set for search; empty query passes through.
  const filtered = React.useMemo(() => {
    if (!curated) return undefined;
    if (!query.trim()) return curated;
    return curated.filter((m) => matchesQuery(m, query));
  }, [curated, query]);

  const recommended = React.useMemo(() => {
    if (!filtered) return [];
    return filtered.filter((m) => m.recommended);
  }, [filtered]);

  const recommendedGroups = React.useMemo(() => {
    // Lead with the marquee makers (Claude / Gemini / GPT / DeepSeek / Kimi) so
    // the recommended zone opens with the models people actually reach for,
    // ahead of every-provider flagships (e.g. Groq's open ALLaM / Compound).
    // `toSorted` is stable, so non-marquee providers keep their first-seen order.
    return groupByProvider(recommended).toSorted(
      (a, b) => marqueeProviderRank(a.providerId) - marqueeProviderRank(b.providerId)
    );
  }, [recommended]);
  const fluxHero = React.useMemo(() => {
    if (!filtered) return [];
    const order = FLUX_MODEL_IDS;
    return filtered
      .filter((m) => isFluxModelId(m.id))
      .toSorted((a, b) => order.indexOf(a.id as FluxModelId) - order.indexOf(b.id as FluxModelId));
  }, [filtered]);

  const allByProvider = React.useMemo(() => {
    if (!filtered) return [];
    // Alpha-sort within each provider for the All section.
    const grouped = groupByProvider(filtered);
    return grouped.map((g) => ({
      providerId: g.providerId,
      models: g.models.toSorted((a, b) => a.displayName.localeCompare(b.displayName)),
    }));
  }, [filtered]);

  // Resolve frequently-used into renderable rows: every frequently-used
  // modelId is looked up against the full curated catalog so the row carries
  // its display name + provider colors. Entries whose model no longer exists
  // in the catalog are dropped silently.
  const frequentlyUsedRows = React.useMemo(() => {
    if (!curated || curated.length === 0) return [];
    const idMap = new Map<string, CuratedModel>();
    for (const m of curated) {
      idMap.set(m.id, m);
      idMap.set(`${m.providerId}:${m.id}`, m);
    }
    const rows: Array<{ model: CuratedModel; useCount: number; lastUsedMs: number }> = [];
    for (const usage of frequentlyUsed) {
      const model = idMap.get(usage.modelId);
      if (!model) continue;
      rows.push({ model, useCount: usage.useCount, lastUsedMs: usage.lastUsedMs });
    }
    return rows;
  }, [curated, frequentlyUsed]);

  const filteredFrequentlyUsed = React.useMemo(() => {
    if (!query.trim()) return frequentlyUsedRows;
    return frequentlyUsedRows.filter((r) => matchesQuery(r.model, query));
  }, [frequentlyUsedRows, query]);

  // Resolve recently-used (recency-sorted) into renderable rows, same lookup
  // against the curated catalog as the frequently-used zone. Order from the
  // IPC is already most-recent-first; entries whose model fell out of the
  // catalog are dropped silently.
  const recentlyUsedRows = React.useMemo(() => {
    if (!curated || curated.length === 0) return [];
    const idMap = new Map<string, CuratedModel>();
    for (const m of curated) {
      idMap.set(m.id, m);
      idMap.set(`${m.providerId}:${m.id}`, m);
    }
    const rows: CuratedModel[] = [];
    for (const usage of recentlyUsed) {
      const model = idMap.get(usage.modelId);
      if (model) rows.push(model);
    }
    return rows;
  }, [curated, recentlyUsed]);

  const filteredRecentlyUsed = React.useMemo(() => {
    if (!query.trim()) return recentlyUsedRows;
    return recentlyUsedRows.filter((m) => matchesQuery(m, query));
  }, [recentlyUsedRows, query]);

  // Zone 0 - user-pinned models, resolved from the curated catalog. Pins that
  // no longer exist in the catalog are dropped silently.
  const pinnedRows = React.useMemo(() => {
    if (!curated || pinned.size === 0) return [];
    return curated.filter((m) => pinned.has(pinKey(m.providerId, m.id)));
  }, [curated, pinned]);
  const filteredPinned = React.useMemo(() => {
    if (!query.trim()) return pinnedRows;
    return pinnedRows.filter((m) => matchesQuery(m, query));
  }, [pinnedRows, query]);

  const totalMatches = filtered?.length ?? 0;
  const searching = query.trim().length > 0;

  const toggleProvider = (providerId: ProviderId) => {
    setOpenProviders((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) next.delete(providerId);
      else next.add(providerId);
      return next;
    });
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (curated === undefined) {
    return (
      <div className={styles.panel}>
        <div className={styles.loadingRow}>{t('common.loading')}</div>
      </div>
    );
  }

  // ── Empty curated set (no connected providers) ─────────────────────────
  if (curated.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.scopeCaption}>{scopeCaption}</div>
        <div className={styles.loadingRow}>{t('settings.modelsPage.homePicker.empty')}</div>
        <div className={styles.footerAction} onClick={onAddProvider}>
          <Plus size={12} />
          {t('settings.addModel')}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
      {/* Search header */}
      <div className={styles.searchHeader}>
        <Search size={14} className={styles.searchIcon} />
        <div className={styles.searchInputWrap} ref={searchWrapRef}>
          <Input
            value={query}
            onChange={setQuery}
            placeholder={t('settings.modelsPage.homePicker.searchPlaceholder')}
            allowClear
            size='small'
          />
        </div>
        {!searching && <span className={styles.kbdHint}>⌘K</span>}
      </div>

      <div className={styles.scrollArea}>
        {/* Scope caption */}
        <div className={styles.scopeCaption}>{scopeCaption}</div>

        {searching ? (
          /* Search-active layout: flat list, match count, no section groupings */
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <span>{t('settings.modelsPage.homePicker.searchMatches', { count: totalMatches })}</span>
            </div>
            {totalMatches === 0 ? (
              <div className={styles.empty}>
                <span>{t('settings.modelsPage.homePicker.searchNoMatches')}</span>
              </div>
            ) : (
              filtered?.map((model) => (
                <ModelRow
                  key={`flat-${model.providerId}:${model.id}`}
                  model={model}
                  selected={isSelected(model)}
                  query={query}
                  onPick={onPick}
                  pinned={isPinned(model)}
                  onTogglePin={onTogglePin}
                />
              ))
            )}
          </div>
        ) : (
          <>
            {/* Zone -1 - Flux Auto hero (only when Flux models are present) */}
            {fluxHero.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHead}>
                  <span>{t('settings.modelsPage.homePicker.sectionFluxHero')}</span>
                  <span className={styles.sectionHeadMeta}>
                    {t('settings.modelsPage.homePicker.sectionFluxHeroSubtitle')}
                  </span>
                </div>
                {fluxHero.map((model) => (
                  <ModelRow
                    key={`flux-${model.providerId}:${model.id}`}
                    model={model}
                    selected={isSelected(model)}
                    query={query}
                    onPick={onPick}
                    pinned={isPinned(model)}
                    onTogglePin={onTogglePin}
                  />
                ))}
              </div>
            )}

            {/* Zone 0 - Pinned (hidden until the user pins something) */}
            {filteredPinned.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHead}>
                  <span>{t('settings.modelsPage.homePicker.sectionPinned')}</span>
                  <span className={styles.sectionHeadMeta}>
                    {t('settings.modelsPage.homePicker.sectionPinnedSubtitle')}
                  </span>
                </div>
                {filteredPinned.map((model) => (
                  <ModelRow
                    key={`pin-${model.providerId}:${model.id}`}
                    model={model}
                    selected={isSelected(model)}
                    query={query}
                    onPick={onPick}
                    pinned
                    onTogglePin={onTogglePin}
                  />
                ))}
              </div>
            )}

            {/* Zone 1 - Recently used (hidden until there's history) */}
            {filteredRecentlyUsed.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHead}>
                  <span>{t('settings.modelsPage.homePicker.sectionRecentlyUsed')}</span>
                  <span className={styles.sectionHeadMeta}>
                    {t('settings.modelsPage.homePicker.sectionRecentlyUsedSubtitle')}
                  </span>
                </div>
                {filteredRecentlyUsed.map((model) => (
                  <ModelRow
                    key={`ru-${model.providerId}:${model.id}`}
                    model={model}
                    selected={isSelected(model)}
                    query={query}
                    onPick={onPick}
                    pinned={isPinned(model)}
                    onTogglePin={onTogglePin}
                  />
                ))}
              </div>
            )}

            {/* Zone 2 - Recommended */}
            {recommendedGroups.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHead}>
                  <span>★ {t('settings.modelsPage.homePicker.sectionRecommended')}</span>
                  <span className={styles.sectionHeadMeta}>
                    {t('settings.modelsPage.homePicker.sectionRecommendedSubtitle')}
                  </span>
                </div>
                {recommendedGroups.map((group) => (
                  <div key={`rec-${group.providerId}`} className={styles.providerGroup}>
                    <div className={styles.providerHead}>
                      <ProviderDot providerId={group.providerId} />
                      {providerDisplayName(group.providerId)}
                    </div>
                    {group.models.map((model) => (
                      <ModelRow
                        key={`rec-${group.providerId}:${model.id}`}
                        model={model}
                        selected={isSelected(model)}
                        query={query}
                        onPick={onPick}
                        pinned={isPinned(model)}
                        onTogglePin={onTogglePin}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Zone 3 - Frequently used */}
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <span>{t('settings.modelsPage.homePicker.sectionFrequentlyUsed')}</span>
                <span className={styles.sectionHeadMeta}>
                  {t('settings.modelsPage.homePicker.sectionFrequentlyUsedSubtitle')}
                </span>
              </div>
              {filteredFrequentlyUsed.length === 0 ? (
                <div className={styles.empty}>
                  <span className={styles.emptyStrong}>
                    {t('settings.modelsPage.homePicker.frequentlyUsedEmptyTitle')}
                  </span>{' '}
                  {t('settings.modelsPage.homePicker.frequentlyUsedEmptyBody')}
                </div>
              ) : (
                filteredFrequentlyUsed.map(({ model, useCount }) => (
                  <FrequentlyUsedRow
                    key={`fu-${model.providerId}:${model.id}`}
                    model={model}
                    useCount={useCount}
                    selected={isSelected(model)}
                    onPick={onPick}
                    t={t}
                  />
                ))
              )}
            </div>

            {/* Zone 4 - All [Provider] sections */}
            <div className={styles.section}>
              {allByProvider.map((group) => {
                const isOpen = openProviders.has(group.providerId);
                return (
                  <React.Fragment key={`all-${group.providerId}`}>
                    <div className={styles.collapseHead} onClick={() => toggleProvider(group.providerId)}>
                      <span>
                        {t('settings.modelsPage.homePicker.sectionAllProvider', {
                          provider: providerDisplayName(group.providerId),
                        })}
                      </span>
                      <span className={styles.collapseHeadRight}>
                        <span className={styles.collapseCount}>{group.models.length}</span>
                        <ChevronRight size={12} className={styles.collapseChev} data-open={isOpen} />
                      </span>
                    </div>
                    {isOpen &&
                      group.models.map((model) => (
                        <ModelRow
                          key={`all-${group.providerId}:${model.id}`}
                          model={model}
                          selected={isSelected(model)}
                          query={query}
                          onPick={onPick}
                          pinned={isPinned(model)}
                          onTogglePin={onTogglePin}
                        />
                      ))}
                  </React.Fragment>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className={styles.footerAction} onClick={onAddProvider}>
        <Plus size={12} />
        {t('settings.addModel')}
      </div>
    </div>
  );
};

// ─── Row primitives ────────────────────────────────────────────────────────

const ProviderDot: React.FC<{ providerId: ProviderId }> = ({ providerId }) => {
  // Flux Router is the hero product - anchor its group with the real brand
  // mark instead of a generic colour dot.
  if (providerId === 'flux-router') {
    return <FluxRouterMark size={14} className='shrink-0' />;
  }
  const color = PROVIDER_DOT_COLOR[providerId] ?? 'var(--primary)';
  return <span className={styles.providerDot} style={{ background: color }} aria-hidden />;
};

type ModelRowProps = {
  model: CuratedModel;
  selected: boolean;
  query: string;
  onPick: (model: CuratedModel) => void;
  /** Whether this model is pinned. Omit `onTogglePin` to hide the pin control. */
  pinned?: boolean;
  onTogglePin?: (model: CuratedModel) => void;
};

const ModelRow: React.FC<ModelRowProps> = ({ model, selected, query, onPick, pinned, onTogglePin }) => {
  const { t } = useTranslation();
  const isFlagship = model.role === 'flagship';
  const isPreview = model.status === 'preview';
  const isLegacy = model.status === 'deprecated';
  return (
    <div className={styles.row} data-selected={selected} onClick={() => onPick(model)}>
      <span className={styles.rowName} title={model.displayName}>
        {highlightMatch(model.displayName, query)}
      </span>
      {isFlagship && (
        <span className={`${styles.badge} ${styles.badgeTag}`}>
          {t('settings.modelsPage.homePicker.badgeFlagship')}
        </span>
      )}
      {isPreview && <span className={styles.badge}>{t('settings.modelsPage.homePicker.badgePreview')}</span>}
      {isLegacy && <span className={styles.badge}>{t('settings.modelsPage.homePicker.badgeLegacy')}</span>}
      {selected && <span className={styles.check}>✓</span>}
      {onTogglePin && (
        <button
          type='button'
          className={styles.pinButton}
          data-pinned={pinned}
          title={t(pinned ? 'settings.modelsPage.homePicker.unpinModel' : 'settings.modelsPage.homePicker.pinModel')}
          aria-label={t(
            pinned ? 'settings.modelsPage.homePicker.unpinModel' : 'settings.modelsPage.homePicker.pinModel'
          )}
          aria-pressed={pinned}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(model);
          }}
        >
          <Pin size={12} />
        </button>
      )}
    </div>
  );
};

type FrequentlyUsedRowProps = {
  model: CuratedModel;
  useCount: number;
  selected: boolean;
  onPick: (model: CuratedModel) => void;
  t: ReturnType<typeof useTranslation>['t'];
};

const FrequentlyUsedRow: React.FC<FrequentlyUsedRowProps> = ({ model, useCount, selected, onPick, t }) => {
  return (
    <div className={styles.row} data-selected={selected} onClick={() => onPick(model)}>
      <span className={styles.rowName} title={model.displayName}>
        {model.displayName}
      </span>
      <span className={`${styles.badge} ${styles.badgeUses}`}>
        {t('settings.modelsPage.homePicker.useCountBadge', { count: useCount })}
      </span>
      {selected && <span className={styles.check}>✓</span>}
    </div>
  );
};

// Re-export for tests so they can mount the panel without the Arco Dropdown
// shell.
export type { ModelSelectorPanelProps, FrequentlyUsedModel };

export default GuidModelSelector;
