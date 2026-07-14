/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Brain, ChevronDown } from 'lucide-react';
import { Button, Dropdown, Menu, Message, Tooltip } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import type { IProvider, TProviderWithModel } from '@/common/config/storage';
import type { CuratedModel, ProviderId } from '@process/providers/types';
import { FLUX_MODEL_DISPLAY, FLUX_MODEL_IDS, isFluxModelId, type FluxModelId } from '@/common/config/flux';
import { getFluxCompat } from '@/common/types/acpTypes';
import { useFluxConnected } from '@/renderer/hooks/useFluxConnected';
import { peekCuratedForAgent, useModelRegistry } from '@/renderer/hooks/useModelRegistry';
import { useUsageTelemetry } from '@/renderer/hooks/usage/useUsageTelemetry';
import { usePinnedModels } from '@/renderer/hooks/usage/usePinnedModels';
import { useModelSelectorViewModel } from '@/renderer/components/model/modelSelector/useModelSelectorViewModel';
import ModelSelectorFlyout from '@/renderer/components/model/modelSelector/ModelSelectorFlyout';
import { resolveAgentScope } from '@/renderer/pages/settings/AgentSettings/agentScopes';
import { iconColors } from '@/renderer/styles/colors';
import FluxRouterMark from '@/renderer/components/icons/FluxRouterMark';
import { getModelDisplayLabel } from '@/renderer/utils/model/agentLogo';
import { sortModelsNewestFirst } from '@/renderer/utils/model/modelOrder';
import { formatAcpModelDisplayLabel, getAcpModelSourceLabel } from '@/renderer/utils/model/modelSource';
import type { AcpModelInfo } from '../types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

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
    // Paint the cached catalog synchronously on agent (re)select so the picker
    // shows real models instantly instead of flashing the Flux-only placeholder
    // while the IPC/CLI enumeration resolves. `undefined` (never fetched) still
    // shows the loading state; the fetch effect below refreshes either way.
    setCurated(peekCuratedForAgent(agentKey));
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
      // Build the `TProviderWithModel` the chat-start pipeline expects from the
      // NON-SECRET handle (audit C4): the decrypted key is no longer returned to
      // the renderer, so `next` carries only the binding (provider / account /
      // model) and `apiKey` stays empty. The main process re-resolves the key
      // at dispatch (`hydrateModelForSpawn`). A previous-curated lookup in
      // `modelList` remains as a last-resort fallback for richer non-secret
      // fields (e.g. an existing `modelProtocols` block on a `new-api` row).
      const legacyMatch =
        modelList.find((p) => p.platform === provider.platform && p.model?.includes(model.id)) ||
        modelList.find((p) => p.model?.includes(model.id));
      const next: TProviderWithModel = {
        ...legacyMatch,
        id: provider.id,
        platform: provider.platform,
        name: provider.name,
        baseUrl: provider.baseUrl,
        // Handle only - no plaintext key crosses IPC; resolved in main at spawn.
        apiKey: '',
        useModel: provider.modelId,
        accountId: provider.accountId,
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

  // ── Cold-start default: pick the recommended curated model when NOTHING is
  // selected yet (distinct from the dropped-pin repair above, which needs an
  // existing selection). The legacy getModelConfig-based default in
  // useGuidModelSelection can resolve empty on a remote/headless WebUI - the
  // `model.config` legacy mirror lands after the picker's cold SWR snapshot and
  // never revalidates for an already-connected provider - leaving a brand-new
  // user stuck on "No model configured yet" until they manually open the picker.
  // The registry curated list IS the authoritative, populated source here, so
  // auto-pick the first safe/recommended model (e.g. Flux Auto) through the same
  // proven chat-start path a manual pick uses. Silent + once-per-agent; the
  // `!currentModel` guard means it never overrides the desktop's working default
  // or a real saved pin (a later setDefaultModel result still wins).
  const coldStartPickedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!isGeminiMode) return;
    if (!curated || curated.length === 0) return;
    if (currentModel?.useModel || selectedCuratedKey) return; // a selection already exists
    if (coldStartPickedRef.current === agentKey) return;
    const recommended = firstSafeCuratedModel(curated);
    if (!recommended) return;
    coldStartPickedRef.current = agentKey;
    void handlePickCurated(recommended, { silent: true });
  }, [agentKey, curated, isGeminiMode, currentModel?.useModel, selectedCuratedKey, handlePickCurated]);

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

  // Unified ACP model list (PRINCIPLE: no hardcoded lists). Prefer the live
  // cached catalog when a session has populated it; otherwise fall back to the
  // self-updating curated catalog (`curatedForAgent`, e.g. enumerable Codex →
  // live GPT models). For an enumerable CLI the curated `id` IS the model name
  // the CLI expects, so `setSelectedAcpModel(model.id)` reaches the send path
  // identically to a cached entry. This is what kills the cold-start dead-end.
  const acpModels = React.useMemo<AcpModelInfo['availableModels']>(() => {
    if (currentAcpCachedModelInfo?.availableModels?.length) {
      return sortModelsNewestFirst(currentAcpCachedModelInfo.availableModels);
    }
    // Sort the curated rows (which carry releaseDate) newest-first BEFORE mapping
    // to `{id,label}`, so the picker shows e.g. GPT-5.6 above 5.5 above 5.4
    // instead of the catalog store's ascending alphabetical order.
    return sortModelsNewestFirst(curated ?? []).map((m) => ({ id: m.id, label: m.displayName }));
  }, [currentAcpCachedModelInfo?.availableModels, curated]);

  const acpSelectedLabel = React.useMemo(() => {
    if (isFluxModelId(selectedAcpModel)) return FLUX_MODEL_DISPLAY[selectedAcpModel as FluxModelId];
    // Resolve the label from the SAME unified list the dropdown renders
    // (`acpModels` = live session cache when present, else the curated catalog).
    // On a brand-new chat there is no spawned session yet, so
    // `currentAcpCachedModelInfo` is null; looking only there left the button
    // stuck on "Default Model" after picking e.g. gpt-5.6-sol for Codex, making
    // the selection look like it did nothing. `acpModels` carries the curated
    // rows, so the freshly-picked model resolves to its real label immediately.
    return (
      acpModels.find((m) => m.id === selectedAcpModel)?.label ||
      currentAcpCachedModelInfo?.currentModelLabel ||
      currentAcpCachedModelInfo?.currentModelId ||
      ''
    );
  }, [
    acpModels,
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

  // ── CLI agents - ACP model selector ──────────────────────────────────────
  // Render the picker whenever Flux Auto is offered OR there is any real model
  // to show (live cache or curated catalog). This kills the cold-start dead-end:
  // a connected Flux user sees Flux Auto from the first frame, and an enumerable
  // CLI (Codex) surfaces its live GPT models even before a session caches them.
  if (showAcpFlux || acpModels.length > 0) {
    // Inline scope caption - keeps the Arco Menu legal (no raw <div> kids).
    const scopeCaptionItem = (
      <Menu.Item key='scope-caption' disabled className='px-12px pt-8px pb-6px text-11px text-t-tertiary leading-snug'>
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
            {acpModels.map((model) => {
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

  // ── Fallback: nothing real to show (no Flux, no native, no curated) ──────
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
  agentKey,
  curated,
  selectedCuratedKey,
  selectedProviderId: _selectedProviderId,
  onPick,
  onAddProvider,
  scopeCaption: _scopeCaption,
  panelOpen,
  recordTelemetry: _recordTelemetry,
}) => {
  // Pins are read here (not inside the view-model) so a toggle re-renders the
  // panel immediately; the shared hook reads the same `pinnedModels` store on
  // its next open. `panelOpen` gates the IPC reads exactly as before.
  const { toggle: togglePinKey } = usePinnedModels(panelOpen);

  // Compose the EXISTING home data (curatedForAgent / flux / pins / recent) into
  // the unified view model and render it through the shared flyout so the home
  // composer picker is visually identical to the in-chat selector + the locked
  // mockup. The hook re-derives `curated` internally off `curatedForAgent(agentKey)`;
  // `selectedCuratedKey` (`providerId:id`) flags the active row.
  const vm = useModelSelectorViewModel(agentKey, selectedCuratedKey);

  // Map the flyout's `(modelId, providerId)` selection back to the home pick
  // path. The full `CuratedModel` is resolved from the parent's already-loaded
  // `curated` set (which includes the flux-router provider's models when
  // connected, so the Flux Auto hero resolves here too). A pick whose model is
  // not in the curated set is ignored - the flyout only ever surfaces rows the
  // view model built from that same set.
  const onSelect = React.useCallback(
    (modelId: string, providerId: string) => {
      const model = curated?.find((m) => m.providerId === providerId && m.id === modelId);
      if (model) onPick(model);
    },
    [curated, onPick]
  );

  return <ModelSelectorFlyout vm={vm} onSelect={onSelect} onTogglePin={togglePinKey} onManage={onAddProvider} />;
};

// Re-export for tests so they can mount the panel without the Arco Dropdown
// shell.
export type { ModelSelectorPanelProps };

export default GuidModelSelector;
