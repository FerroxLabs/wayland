/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Brain, ChevronDown, Plus } from 'lucide-react';
import { Message } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import type { IProvider, TProviderWithModel } from '@/common/config/storage';
import type { CuratedModel } from '@process/providers/types';
import { useModelRegistry } from '@/renderer/hooks/useModelRegistry';
import { resolveAgentScope } from '@/renderer/pages/settings/AgentSettings/agentScopes';
import { iconColors } from '@/renderer/styles/colors';
import { getModelDisplayLabel } from '@/renderer/utils/model/agentLogo';
import { formatAcpModelDisplayLabel, getAcpModelSourceLabel } from '@/renderer/utils/model/modelSource';
import type { AcpModelInfo } from '../types';
import { Button, Dropdown, Menu, Tooltip } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

type GuidModelSelectorProps = {
  // Provider-based agent model state (Gemini / Wayland Core)
  isGeminiMode: boolean;
  modelList: IProvider[];
  currentModel: TProviderWithModel | undefined;
  setCurrentModel: (model: TProviderWithModel) => Promise<void>;

  // The currently-selected agent — scopes the curated model list and the
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
 * returns `null` — its row shows no tier rather than a fabricated one.
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
  const { curatedForAgent } = useModelRegistry();
  const defaultModelLabel = t('common.defaultModel');

  // Plain-language scope sentence for the selected agent. Reuses the same
  // copy as the Agents settings page so the explanation lives at the point
  // of friction (spec §4.8) without diverging from §4.7.
  const scopeCaption = React.useMemo(() => {
    const scope = resolveAgentScope(agentKey);
    return t(`settings.agentsPage.scope.${scope.scopeKey}`);
  }, [agentKey, t]);

  // Render the scope caption as a disabled `Menu.Item` so it lives inside
  // the Arco `<Menu>` legally (raw `<div>` children break keyboard arrow-nav)
  // while still reading as a non-selectable header.
  const scopeCaptionItem = (
    <Menu.Item key='scope-caption' disabled className='px-12px pt-8px pb-6px text-11px text-t-tertiary leading-snug'>
      {scopeCaption}
    </Menu.Item>
  );

  // ── Curated set, scoped to the selected agent ────────────────────────────
  // Re-fetched whenever the agent changes (`agentKey` in the deps). May
  // resolve to `[]` for a non-enumerable CLI whose provider isn't connected.
  const [curated, setCurated] = React.useState<CuratedModel[] | undefined>(undefined);
  React.useEffect(() => {
    let cancelled = false;
    setCurated(undefined);
    curatedForAgent(agentKey)
      .then((models) => {
        if (!cancelled) setCurated(models);
      })
      .catch(() => {
        if (!cancelled) setCurated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [agentKey, curatedForAgent]);

  // Group the curated set by family for the droplist, preserving the order
  // `curatedForAgent` returned (already release-date sorted by the Curator).
  const curatedGroups = React.useMemo(() => {
    if (!curated) return [];
    const groups: Array<{ family: string; models: CuratedModel[] }> = [];
    const index = new Map<string, number>();
    for (const model of curated) {
      const family = model.family || model.displayName;
      let pos = index.get(family);
      if (pos === undefined) {
        pos = groups.length;
        index.set(family, pos);
        groups.push({ family, models: [] });
      }
      groups[pos].models.push(model);
    }
    return groups;
  }, [curated]);

  // Resolve the currently-selected curated model so its row is highlighted
  // and its label shown on the button.
  //
  // Wave 3 Fix 15: the menu now keys items by `${providerId}:${id}`. To match,
  // build the selection key from `currentModel.platform` (which `setCurrentModel`
  // wrote from `provider.providerId`) + the saved `useModel`. Fall back to a
  // bare-id match for resilience with legacy persisted state.
  const selectedCuratedKey = React.useMemo(() => {
    if (!currentModel?.useModel) return null;
    if (currentModel.platform) return `${currentModel.platform}:${currentModel.useModel}`;
    return currentModel.useModel;
  }, [currentModel?.platform, currentModel?.useModel]);

  const curatedButtonLabel = React.useMemo(() => {
    if (!curated || curated.length === 0) return defaultModelLabel;
    const match = curated.find(
      (m) =>
        `${m.providerId}:${m.id}` === selectedCuratedKey ||
        // Fallback for older state — a bare model id without a provider scope.
        m.id === selectedCuratedKey
    );
    return getModelDisplayLabel({
      selectedValue: match?.id,
      selectedLabel: match?.displayName,
      defaultModelLabel,
      fallbackLabel: curated[0]?.displayName || defaultModelLabel,
    });
  }, [curated, defaultModelLabel, selectedCuratedKey]);

  // Pick a curated model: resolve its credentials through the modelRegistry
  // IPC (Packet 3B) so the chat-start flow no longer depends on the legacy
  // `model.config` row. The resolver hands back the platform / apiKey /
  // baseUrl / bedrockConfig the main-process dispatch needs verbatim.
  const handlePickCurated = React.useCallback(
    async (model: CuratedModel) => {
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
        // Wave 3 Fix 9 — differentiate `undecryptable` from `not-connected`.
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
      // synthesize a `capabilities` array (text) — the legacy modelList path
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
    },
    [modelList, navigate, setCurrentModel]
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
  React.useEffect(() => {
    if (!isGeminiMode) return;
    if (!curated || curated.length === 0) return;
    if (!selectedCuratedKey) return;
    const stillAvailable = curated.some(
      (m) => `${m.providerId}:${m.id}` === selectedCuratedKey || m.id === selectedCuratedKey
    );
    if (stillAvailable) return;
    // Guard against re-firing on every render. Keyed by the pair so a
    // new agent or new pinned-model retries the fallback decision once.
    const guardKey = `${agentKey}:${selectedCuratedKey}`;
    if (fallbackFiredRef.current === guardKey) return;
    fallbackFiredRef.current = guardKey;
    void handlePickCurated(curated[0]);
  }, [agentKey, curated, isGeminiMode, selectedCuratedKey, handlePickCurated]);

  // ── ACP model state (CLI agents) ─────────────────────────────────────────
  const acpSelectedLabel = React.useMemo(() => {
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

  // ── Provider-based agents (Gemini / Wayland Core) — curated picker ────────
  if (isGeminiMode) {
    return (
      <Dropdown
        trigger='click'
        droplist={
          <Menu selectedKeys={selectedCuratedKey ? [selectedCuratedKey] : []} key='curated-menu'>
            {scopeCaptionItem}
            {curated === undefined
              ? [
                  <Menu.Item
                    key='loading'
                    className='px-12px py-12px text-t-secondary text-14px text-center flex justify-center items-center'
                    disabled
                  >
                    {t('common.loading')}
                  </Menu.Item>,
                ]
              : curated.length === 0
                ? [
                    <Menu.Item
                      key='no-models'
                      className='px-12px py-12px text-t-secondary text-14px text-center flex justify-center items-center'
                      disabled
                    >
                      {t('settings.modelsPage.homePicker.empty')}
                    </Menu.Item>,
                    <Menu.Item
                      key='add-model'
                      className='text-12px text-t-secondary'
                      onClick={() => navigate('/settings/models')}
                    >
                      <Plus size={12} />
                      {t('settings.addModel')}
                    </Menu.Item>,
                  ]
                : [
                    ...curatedGroups.map((group) => (
                      <Menu.ItemGroup title={group.family} key={group.family}>
                        {group.models.map((model) => {
                          const tier = costToPriceTier(model.costInPerM, model.costOutPerM);
                          // Wave 3 Fix 15 — wcore unions models across providers,
                          // so `model.id` alone isn't unique. Key by
                          // `${providerId}:${id}` everywhere we group across
                          // providers to prevent React key collisions.
                          return (
                            <Menu.Item
                              key={`${model.providerId}:${model.id}`}
                              onClick={() => void handlePickCurated(model)}
                            >
                              <div className='flex items-center gap-8px w-full'>
                                <span className='flex-1 min-w-0 truncate'>{model.displayName}</span>
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
                      </Menu.ItemGroup>
                    )),
                    <Menu.Item
                      key='add-model'
                      className='text-12px text-t-secondary'
                      onClick={() => navigate('/settings/models')}
                    >
                      <Plus size={12} />
                      {t('settings.addModel')}
                    </Menu.Item>,
                  ]}
          </Menu>
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

  // ── CLI agents — ACP cached model selector ───────────────────────────────
  if (currentAcpCachedModelInfo && currentAcpCachedModelInfo.availableModels?.length > 0) {
    if (currentAcpCachedModelInfo.canSwitch) {
      // Cost lookup for the agent's curated set — CLI model lists carry no
      // cost data themselves, so the tier is sourced from the curated catalog.
      const tierFor = (modelId: string): '$' | '$$' | '$$$' | null => {
        const match = curated?.find((m) => m.id === modelId);
        return match ? costToPriceTier(match.costInPerM, match.costOutPerM) : null;
      };
      return (
        <Dropdown
          trigger='click'
          droplist={
            <Menu selectedKeys={selectedAcpModel ? [selectedAcpModel] : []}>
              {scopeCaptionItem}
              {currentAcpCachedModelInfo.availableModels.map((model) => {
                const tier = tierFor(model.id);
                return (
                  <Menu.Item key={model.id} onClick={() => setSelectedAcpModel(model.id)}>
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

export default GuidModelSelector;
