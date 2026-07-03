/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { ConfigStorage } from '@/common/config/storage';
import type { IProvider } from '@/common/config/storage';
import { FLUX_MODEL_DISPLAY, FLUX_MODEL_IDS, isFluxModelId, type FluxModelId } from '@/common/config/flux';
import { getFluxCompat } from '@/common/types/acpTypes';
import type { AcpModelInfo } from '@/common/types/acpTypes';
import { useFluxConnected } from '@/renderer/hooks/useFluxConnected';
import { getModelDisplayLabel } from '@/renderer/utils/model/agentLogo';
import { formatAcpModelDisplayLabel, getAcpModelSourceLabel } from '@/renderer/utils/model/modelSource';
import { Button, Dropdown, Menu, Tooltip } from '@arco-design/web-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import MarqueePillLabel from './MarqueePillLabel';
import { resolvePinnedModelInfo } from './acpModelPin';
import ModelSelectorFlyout from '@renderer/components/model/modelSelector/ModelSelectorFlyout';
import { useModelSelectorViewModel } from '@renderer/components/model/modelSelector/useModelSelectorViewModel';
import { usePinnedModels } from '@renderer/hooks/usage/usePinnedModels';
import { useModelEffort } from '@renderer/components/model/modelSelector/useModelEffort';

/**
 * The four Flux virtual models, in canonical picker order (auto first).
 * Selecting one routes that chat through Flux: the process side keys on the
 * selected model id being a Flux id, so the renderer only needs to make these
 * appear, be selectable, and persist through the normal `setModel` path.
 */
const FLUX_PICKER_MODELS: ReadonlyArray<{ id: FluxModelId; label: string }> = FLUX_MODEL_IDS.map((id) => ({
  id,
  label: FLUX_MODEL_DISPLAY[id],
}));

/**
 * Module-level mirror of the persisted `acp.cachedModels` catalog, keyed by
 * backend. ConfigStorage.get is async (there is no synchronous read), so a
 * picker mounting for a NEW chat would otherwise flash the "available after
 * first connection" tooltip until its post-mount Effect resolved. We warm this
 * map once at import (`prefetchCachedModels`) and on every cache read, so any
 * later picker can initialize its state synchronously and render the real
 * catalog with no null flash. Populated only with backends that have a non-empty
 * `availableModels`.
 */
const memCache: Record<string, AcpModelInfo> = {};

/** True once `prefetchCachedModels` has resolved, so a synchronous init from
 * `memCache` can distinguish "warmed, genuinely empty" from "not warmed yet". */
let prefetchDone = false;

/** Module-level one-shot prefetch promise so the ConfigStorage read happens at
 * most once regardless of how many pickers mount. */
let prefetchPromise: Promise<void> | null = null;

function warmMemCacheFrom(cached: Record<string, AcpModelInfo> | undefined): void {
  if (!cached) return;
  for (const [key, info] of Object.entries(cached)) {
    if (info?.availableModels?.length) memCache[key] = info;
  }
}

function prefetchCachedModels(): Promise<void> {
  if (!prefetchPromise) {
    prefetchPromise = ConfigStorage.get('acp.cachedModels')
      .then((cached) => {
        warmMemCacheFrom(cached ?? undefined);
      })
      .catch(() => {
        // Silently ignore — pickers fall back to their post-mount load.
      })
      .finally(() => {
        prefetchDone = true;
      });
  }
  return prefetchPromise;
}

// Kick the prefetch off at module import so the catalog is usually warm before
// the first picker even mounts.
void prefetchCachedModels();

/**
 * Whether this backend can route through Flux. `getFluxCompat` returns 'env' or
 * 'setup' for Flux-capable backends (and covers wcore/gemini), 'vendor' for
 * backends locked to their own service, and undefined when unclassified.
 */
function isFluxCapableBackend(backend: string | undefined): boolean {
  const compat = getFluxCompat(backend);
  return compat === 'env' || compat === 'setup';
}

function isSameModelInfo(a: AcpModelInfo | null | undefined, b: AcpModelInfo | null | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (
    a.currentModelId !== b.currentModelId ||
    a.currentModelLabel !== b.currentModelLabel ||
    a.canSwitch !== b.canSwitch ||
    a.source !== b.source ||
    a.sourceDetail !== b.sourceDetail ||
    a.availableModels.length !== b.availableModels.length
  ) {
    return false;
  }

  return a.availableModels.every((model, index) => {
    const other = b.availableModels[index];
    return other && other.id === model.id && other.label === model.label;
  });
}

/**
 * Model selector for ACP-based agents.
 * Fetches model info via IPC and listens for real-time updates via responseStream.
 * Renders three states:
 * - null model info: disabled "Use CLI model" button (backward compatible)
 * - canSwitch=false: read-only display of current model name
 * - canSwitch=true: clickable dropdown selector
 *
 * When backend and initialModelId are provided, the component can show
 * cached model info before the agent manager is created (pre-first-message).
 * Uses MarqueePillLabel for adaptive width with marquee on hover.
 */
const AcpModelSelector: React.FC<{
  conversationId: string;
  /** ACP backend name for loading cached models (e.g., 'claude', 'qwen') */
  backend?: string;
  /** Pre-selected model ID from Guid page */
  initialModelId?: string;
}> = ({ conversationId, backend, initialModelId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Initialize synchronously from the warmed module cache so a NEW chat for a
  // backend used before in this session shows its catalog immediately, with no
  // null flash and no "first connection" tooltip. The post-mount load below
  // refreshes from ConfigStorage / live IPC.
  const [modelInfo, setModelInfo] = useState<AcpModelInfo | null>(() => {
    const cached = backend ? memCache[backend] : undefined;
    if (!cached) return null;
    const effectiveModelId = initialModelId ?? cached.currentModelId ?? null;
    return {
      ...cached,
      currentModelId: effectiveModelId,
      currentModelLabel:
        (effectiveModelId && cached.availableModels.find((m) => m.id === effectiveModelId)?.label) || effectiveModelId,
    };
  });
  // Whether the cache lookup (prefetch + this picker's first load) has settled.
  // Lets the render tell "still loading, no models yet" (neutral) apart from
  // "load finished, genuinely no models" (show the first-connection guidance).
  // Seeded true when we already had a synchronous cache hit or the module
  // prefetch resolved before mount.
  const [cacheChecked, setCacheChecked] = useState<boolean>(
    () => prefetchDone || (backend ? Boolean(memCache[backend]) : false)
  );
  const fluxConnected = useFluxConnected();
  // Unified flyout: view model is driven off `curatedForAgent(backend)` (claude
  // ->anthropic, codex->openai, vendor CLIs->[]). `activeKey` is resolved below
  // from the agent's reported current model against the curated rows, so no
  // process-layer provider map is imported here.
  const vm = useModelSelectorViewModel(backend ?? '');
  const { toggle: togglePin } = usePinnedModels(true);
  // Per-conversation effort (codex/claude only — the flyout's EffortSubRow is
  // gated by `vm.effortSupported`, so this is inert for non-effort backends).
  const { effort, setEffort } = useModelEffort(conversationId);
  // Flux models appear at the top of the picker only for Flux-capable backends
  // and only while the flux-router provider is actually connected.
  const showFlux = isFluxCapableBackend(backend) && fluxConnected;
  // Track whether user has manually switched model via dropdown
  const hasUserChangedModel = useRef(false);
  // Track the last conversationId to detect tab switches
  const prevConversationIdRef = useRef(conversationId);
  // A user-selected Flux tier (flux-auto, ...) is carried by the spawn env, so the
  // agent never reports it as its current model. Pin it so model-info reloads, the
  // claude 1.5s poll, and stream updates do not wipe the selection back to the
  // native model (mirrors AcpAgentManager's isFluxOnFluxBackend guard).
  const selectedFluxModelRef = useRef<FluxModelId | null>(
    isFluxModelId(initialModelId) ? (initialModelId as FluxModelId) : null
  );
  // The native (non-Flux) model the user picked in THIS chat. Like the flux pin
  // above, this survives the background refreshes (the claude 1.5s poll, model-
  // info reloads, stream updates) that otherwise revert the pick to the agent's
  // default (#136 / #146 / #149). Null until the user switches models in-chat;
  // cleared on conversation switch.
  const selectedModelRef = useRef<string | null>(null);

  const updateModelInfo = useCallback(
    (nextModelInfo: AcpModelInfo) => {
      setModelInfo((prev) => {
        const next = resolvePinnedModelInfo(nextModelInfo, {
          fluxModelId: selectedFluxModelRef.current,
          showFlux,
          userChangedModel: hasUserChangedModel.current,
          selectedModelId: selectedModelRef.current,
          backend,
        });
        return isSameModelInfo(prev, next) ? prev : next;
      });
    },
    [showFlux, backend]
  );

  const loadCachedModelInfo = useCallback(
    async (backendKey: string, options?: { preserveInitialModel?: boolean }) => {
      try {
        const cached = await ConfigStorage.get('acp.cachedModels');
        // Warm the module cache for every backend so sibling/later pickers can
        // initialize synchronously from this read.
        warmMemCacheFrom(cached ?? undefined);
        const cachedInfo = cached?.[backendKey];
        if (!cachedInfo?.availableModels?.length) return;

        if (backendKey === 'codex') {
          console.log('[AcpModelSelector][codex] Loaded cached model info:', cachedInfo);
        }

        const effectiveModelId =
          options?.preserveInitialModel && initialModelId ? initialModelId : (cachedInfo.currentModelId ?? null);

        updateModelInfo({
          ...cachedInfo,
          currentModelId: effectiveModelId,
          currentModelLabel:
            (effectiveModelId && cachedInfo.availableModels.find((m) => m.id === effectiveModelId)?.label) ||
            effectiveModelId,
        });
      } catch {
        // Silently ignore
      }
    },
    [initialModelId, updateModelInfo]
  );

  const reloadModelInfo = useCallback(
    async (options?: { preserveInitialModel?: boolean }) => {
      // Pass `backend` so the process can derive a cold-start catalog (e.g.
      // Claude Code's cc-switch model list) before a task exists, instead of
      // returning null and forcing the first-connection tooltip.
      const result = await ipcBridge.acpConversation.getModelInfo.invoke({ conversationId, backend });

      if (result.success && result.data?.modelInfo) {
        const info = result.data.modelInfo;
        if (backend === 'codex') {
          console.log('[AcpModelSelector][codex] Initial model info:', info);
        }
        if (info.availableModels?.length > 0) {
          if (
            options?.preserveInitialModel &&
            initialModelId &&
            !hasUserChangedModel.current &&
            info.currentModelId !== initialModelId
          ) {
            const match = info.availableModels.find((m) => m.id === initialModelId);
            if (match) {
              updateModelInfo({
                ...info,
                currentModelId: initialModelId,
                currentModelLabel: match.label || initialModelId,
              });
              return;
            }
          }
          updateModelInfo(info);
          return;
        }
      }

      if (backend) {
        await loadCachedModelInfo(backend, options);
      }
    },
    [backend, conversationId, initialModelId, loadCachedModelInfo, updateModelInfo]
  );

  // Fetch initial model info on mount, fallback to cached models if manager not ready
  useEffect(() => {
    // If user manually changed model and we're returning to the same conversation, skip reload
    if (hasUserChangedModel.current && prevConversationIdRef.current === conversationId) return;

    // Reset flag when switching to a different conversation
    if (prevConversationIdRef.current !== conversationId) {
      hasUserChangedModel.current = false;
      selectedModelRef.current = null;
      prevConversationIdRef.current = conversationId;
    }

    // Wait for the module prefetch too, so `cacheChecked` only flips once the
    // persisted catalog has truly been consulted (avoids a premature "first
    // connection" message while ConfigStorage is mid-read).
    void Promise.all([prefetchCachedModels(), reloadModelInfo({ preserveInitialModel: true })])
      .catch(() => {
        // loadCachedModelInfo is already handled inside reloadModelInfo
      })
      .finally(() => {
        setCacheChecked(true);
      });
  }, [conversationId, backend, initialModelId, reloadModelInfo]);

  useEffect(() => {
    if (backend !== 'claude') return;

    const refresh = () => {
      // preserveInitialModel keeps the Guid-page model before any in-chat change;
      // once the user has switched, updateModelInfo's pin keeps THAT selection.
      // Without either, this 1.5s poll reports the agent default and reverts the
      // user's model to Default (#136 / #146 / #149).
      void reloadModelInfo({ preserveInitialModel: true }).catch(() => {
        // loadCachedModelInfo is already handled inside reloadModelInfo
      });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const intervalId = window.setInterval(refresh, 1500);

    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [backend, reloadModelInfo]);

  // Listen for acp_model_info / codex_model_info events from responseStream
  useEffect(() => {
    const handler = (message: IResponseMessage) => {
      if (message.conversation_id !== conversationId) return;
      if (message.type === 'acp_model_info' && message.data) {
        const incoming = message.data as AcpModelInfo;
        if (backend === 'codex') {
          console.log('[AcpModelSelector][codex] Stream model info:', incoming);
        }
        // Preserve pre-selected model from Guid page until user manually switches.
        // The agent emits its default model during start (before re-apply), which
        // would otherwise overwrite the user's Guid page selection.
        if (initialModelId && !hasUserChangedModel.current && incoming.availableModels?.length > 0) {
          const match = incoming.availableModels.find((m) => m.id === initialModelId);
          if (match && incoming.currentModelId !== initialModelId) {
            updateModelInfo({
              ...incoming,
              currentModelId: initialModelId,
              currentModelLabel: match.label || initialModelId,
            });
            return;
          }
        }
        updateModelInfo(incoming);
      } else if (message.type === 'codex_model_info' && message.data) {
        // Codex model info: always read-only display
        const data = message.data as { model: string };
        if (data.model) {
          updateModelInfo({
            source: 'models',
            sourceDetail: 'codex-stream',
            currentModelId: data.model,
            currentModelLabel: data.model,
            canSwitch: false,
            availableModels: [],
          });
        }
      }
    };
    return ipcBridge.acpConversation.responseStream.on(handler);
  }, [conversationId, initialModelId, updateModelInfo]);

  const handleSelectModel = useCallback(
    (modelId: string) => {
      hasUserChangedModel.current = true;
      // Pin or clear the Flux selection so reloads/polls/streams cannot overwrite it.
      selectedFluxModelRef.current = isFluxModelId(modelId) ? (modelId as FluxModelId) : null;
      // Pin the user's pick (native models too) against the same refreshes.
      selectedModelRef.current = modelId;
      const fluxLabel = isFluxModelId(modelId) ? FLUX_MODEL_DISPLAY[modelId as FluxModelId] : undefined;
      setModelInfo((prev) => {
        if (!prev) return prev;
        const selectedModel = prev.availableModels.find((model) => model.id === modelId);
        return {
          ...prev,
          currentModelId: modelId,
          currentModelLabel: selectedModel?.label || fluxLabel || modelId,
        };
      });
      ipcBridge.acpConversation.setModel
        .invoke({ conversationId, modelId })
        .then((result) => {
          if (result.success && result.data?.modelInfo) {
            updateModelInfo(result.data.modelInfo);
          }
        })
        .catch((error) => {
          console.error('[AcpModelSelector] Failed to set model:', error);
        });
    },
    [conversationId, updateModelInfo]
  );

  const defaultModelLabel = t('common.defaultModel');
  const currentIsFlux = isFluxModelId(modelInfo?.currentModelId);
  const rawDisplayLabel = currentIsFlux
    ? FLUX_MODEL_DISPLAY[modelInfo!.currentModelId as FluxModelId]
    : modelInfo?.currentModelLabel || modelInfo?.currentModelId || '';
  const displayLabel = getModelDisplayLabel({
    selectedValue: modelInfo?.currentModelId,
    selectedLabel: rawDisplayLabel,
    defaultModelLabel,
    fallbackLabel: t('conversation.welcome.useCliModel'),
  });
  const modelSourceLabel = getAcpModelSourceLabel(modelInfo);
  const buttonLabel = formatAcpModelDisplayLabel(displayLabel, modelSourceLabel);
  const tooltipContent =
    modelSourceLabel && displayLabel
      ? `${displayLabel}\nSource: ${modelSourceLabel}`
      : displayLabel || modelSourceLabel;
  // Fetch model configuration data (includes health status)
  const { data: modelConfig } = useSWR<IProvider[]>('model.config', () => ipcBridge.mode.getModelConfig.invoke());

  // Get health status for the current model
  const currentModelHealth = React.useMemo(() => {
    if (!modelInfo?.currentModelId || !modelConfig) return { status: 'unknown', color: 'bg-gray-400' };
    const providerConfig = modelConfig.find((p) => p.platform?.includes(backend || ''));
    const healthStatus = providerConfig?.modelHealth?.[modelInfo.currentModelId]?.status || 'unknown';
    const healthColor =
      healthStatus === 'healthy' ? 'bg-green-500' : healthStatus === 'unhealthy' ? 'bg-red-500' : 'bg-gray-400';
    return { status: healthStatus, color: healthColor };
  }, [modelInfo?.currentModelId, modelConfig, backend]);

  const healthDot = (modelId: string) => {
    const providerConfig = modelConfig?.find((p) => p.platform?.includes(backend || ''));
    const healthStatus = providerConfig?.modelHealth?.[modelId]?.status || 'unknown';
    if (healthStatus === 'unknown') return null;
    const healthColor =
      healthStatus === 'healthy' ? 'bg-green-500' : healthStatus === 'unhealthy' ? 'bg-red-500' : 'bg-gray-400';
    return <div className={`w-6px h-6px rounded-full shrink-0 ${healthColor}`} />;
  };

  // Resolve the active row key from the agent's reported current model. Flux ids
  // map to the canonical `flux-router:<id>` (the hero key); native ids match a
  // curated row by bare id, whatever underlying provider it resolved to.
  const resolvedVm = useMemo(() => {
    const currentId = modelInfo?.currentModelId;
    if (!currentId) return { ...vm, activeKey: null };
    if (isFluxModelId(currentId)) return { ...vm, activeKey: `flux-router:${currentId}` };
    const match = [...vm.zones.flatMap((z) => z.rows), ...vm.moreZones.flatMap((z) => z.rows)].find(
      (r) => r.id === currentId
    );
    return { ...vm, activeKey: match ? match.key : null };
  }, [vm, modelInfo?.currentModelId]);

  // The flyout emits `(modelId, providerId)`; route it through the existing
  // `handleSelectModel` path so the #66 flux-pin guard (`selectedFluxModelRef`)
  // still holds for a Flux selection.
  const onSelect = useCallback((modelId: string) => handleSelectModel(modelId), [handleSelectModel]);
  const onManage = useCallback(() => navigate('/settings/models'), [navigate]);
  // #550 / #335: a Claude Code chat runs the Claude Code CLI as its ACP agent, so
  // it is Anthropic-native by construction — the picker only ever offers Claude
  // models. A true mid-chat backend swap to ChatGPT/Gemini is not coherent (it
  // would tear down the running agent = a new chat). Instead of leaving the picker
  // looking broken when the user wants a different vendor, explain the scoping and
  // point them at the honest path: start a new chat and pick that agent.
  const claudeChatGuidance =
    backend === 'claude'
      ? t('conversation.modelSelector.claudeSubscriptionNotice', {
          defaultValue:
            'Claude Code runs on your Claude subscription (Anthropic), so this chat stays on Claude models. To use a different provider like ChatGPT or Gemini, start a new chat and pick that agent.',
        })
      : undefined;
  // When Flux is connected the flyout surfaces Flux routing tiers as the
  // keep-going path (they route cross-provider), so "this chat stays on Claude
  // models / start a new chat" would contradict them — only show the notice when
  // Flux is off. (State 2 below is only reachable with Flux off, so its read-only
  // tooltip can carry the guidance unconditionally.)
  const notice = claudeChatGuidance && !showFlux ? claudeChatGuidance : undefined;
  const flyoutDroplist = (
    <ModelSelectorFlyout
      vm={resolvedVm}
      onSelect={onSelect}
      onTogglePin={togglePin}
      onManage={onManage}
      effort={effort}
      onSetEffort={setEffort}
      draftSearch
      notice={notice}
    />
  );

  // `curatedForAgent` only returns real models for CLIs mapped to a connected
  // provider (claude->anthropic, codex->openai). Vendor CLIs (qwen, goose, ...)
  // return [], and their switchable models live only in `modelInfo.availableModels`.
  // Drive the unified flyout where real curated provider rows exist; otherwise
  // fall back to the native Arco menu (which still surfaces the agent's own
  // models + Flux tiers). The synthesized 'flux' routing zone is always present
  // when Flux is connected, so it must NOT flip a vendor CLI (curated == []) to
  // the flyout - exclude it from the gate.
  const hasCuratedModels =
    resolvedVm.zones.some((z) => z.id !== 'flux' && z.rows.length > 0) ||
    resolvedVm.moreZones.some((z) => z.rows.length > 0);

  // Flux-capable backend + connected Flux provider: render a switchable dropdown
  // with the Flux tiers at the top (selecting one routes the chat through Flux)
  // and the agent's own native models below, unchanged. This wraps all native
  // states (null / read-only / switchable) so Flux is always selectable here.
  if (showFlux) {
    const nativeModels = modelInfo?.availableModels ?? [];
    return (
      <Dropdown
        trigger='click'
        droplist={
          hasCuratedModels ? (
            flyoutDroplist
          ) : (
            <Menu>
              <Menu.ItemGroup title={t('conversation.welcome.fluxGroupLabel')}>
                {FLUX_PICKER_MODELS.map((model) => (
                  <Menu.Item
                    key={model.id}
                    className={model.id === modelInfo?.currentModelId ? 'bg-2!' : ''}
                    onClick={() => handleSelectModel(model.id)}
                  >
                    <div className='flex items-center gap-8px w-full'>
                      <span>{model.label}</span>
                    </div>
                  </Menu.Item>
                ))}
              </Menu.ItemGroup>
              {nativeModels.length > 0 && (
                <Menu.ItemGroup title={t('conversation.welcome.nativeModelsGroupLabel')}>
                  {nativeModels.map((model) => (
                    <Menu.Item
                      key={model.id}
                      className={model.id === modelInfo?.currentModelId ? 'bg-2!' : ''}
                      onClick={() => handleSelectModel(model.id)}
                    >
                      <div className='flex items-center gap-8px w-full'>
                        {healthDot(model.id)}
                        <span>{model.label}</span>
                      </div>
                    </Menu.Item>
                  ))}
                </Menu.ItemGroup>
              )}
            </Menu>
          )
        }
      >
        <Button className='sendbox-model-btn header-model-btn agent-mode-compact-pill' shape='round' size='small'>
          <span className='flex items-center gap-6px min-w-0 leading-none'>
            {!currentIsFlux && currentModelHealth.status !== 'unknown' && (
              <div className={`w-6px h-6px rounded-full shrink-0 ${currentModelHealth.color}`} />
            )}
            <MarqueePillLabel>{currentIsFlux ? displayLabel : buttonLabel}</MarqueePillLabel>
          </span>
        </Button>
      </Dropdown>
    );
  }

  // State 1a: No model info yet AND the cache lookup is still in flight - show a
  // neutral, quiet "Loading models…" state instead of the alarming "available
  // after first connection" tooltip. Most backends resolve to a cached catalog,
  // so this is the honest interim message.
  if (!modelInfo && !cacheChecked) {
    const loadingLabel = t('conversation.welcome.modelLoading', { defaultValue: 'Loading models…' });
    return (
      <Tooltip content={loadingLabel} position='top'>
        <Button
          className='sendbox-model-btn header-model-btn agent-mode-compact-pill'
          shape='round'
          size='small'
          loading
          style={{ cursor: 'default' }}
        >
          <span className='flex items-center gap-6px min-w-0 leading-none'>
            <MarqueePillLabel>{loadingLabel}</MarqueePillLabel>
          </span>
        </Button>
      </Tooltip>
    );
  }

  // State 1b: Cache lookup finished and the agent has not produced live/cached
  // model info yet. When this backend maps to a connected provider whose curated
  // catalog is non-empty (claude->anthropic, codex->openai), surface that catalog
  // as a selectable dropdown instead of dead-ending on the "first connection"
  // tooltip - the curated registry is authoritative even before the agent reports
  // its own models, so the picker should never be stuck closed here (#345; mirrors
  // GuidModelSelector's cold-start picker, which renders off `curatedForAgent`).
  // Selecting a row routes through `handleSelectModel` -> `setModel`, whose IPC
  // result lands the real `modelInfo`. Fall back to the guidance tooltip only when
  // there are genuinely no curated models (vendor CLIs, or no provider connected).
  if (!modelInfo) {
    if (hasCuratedModels) {
      return (
        <Dropdown trigger='click' droplist={flyoutDroplist}>
          <Button className='sendbox-model-btn header-model-btn agent-mode-compact-pill' shape='round' size='small'>
            <span className='flex items-center gap-6px min-w-0 leading-none'>
              <MarqueePillLabel>{defaultModelLabel}</MarqueePillLabel>
            </span>
          </Button>
        </Dropdown>
      );
    }
    return (
      <Tooltip content={t('conversation.welcome.modelSwitchNotSupported')} position='top'>
        <Button
          className='sendbox-model-btn header-model-btn agent-mode-compact-pill'
          shape='round'
          size='small'
          style={{ cursor: 'default' }}
        >
          <span className='flex items-center gap-6px min-w-0 leading-none'>
            <MarqueePillLabel>{t('conversation.welcome.useCliModel')}</MarqueePillLabel>
          </span>
        </Button>
      </Tooltip>
    );
  }

  // State 2: Has model info but cannot switch - read-only display. This branch is
  // reached only with Flux off (showFlux returns earlier), so a claude-code chat
  // here has no in-picker path forward at all; fold the #550 guidance into the
  // tooltip so the user still learns how to reach another provider.
  if (!modelInfo.canSwitch) {
    const readOnlyTooltip = claudeChatGuidance
      ? [tooltipContent, claudeChatGuidance].filter(Boolean).join('\n\n')
      : tooltipContent;
    return (
      <Tooltip content={readOnlyTooltip} position='top'>
        <Button
          className='sendbox-model-btn header-model-btn agent-mode-compact-pill'
          shape='round'
          size='small'
          style={{ cursor: 'default' }}
        >
          <span className='flex items-center gap-6px min-w-0 leading-none'>
            {currentModelHealth.status !== 'unknown' && (
              <div className={`w-6px h-6px rounded-full shrink-0 ${currentModelHealth.color}`} />
            )}
            <MarqueePillLabel>{buttonLabel}</MarqueePillLabel>
          </span>
        </Button>
      </Tooltip>
    );
  }

  // State 3: Can switch - dropdown selector
  return (
    <Dropdown
      trigger='click'
      droplist={
        hasCuratedModels ? (
          flyoutDroplist
        ) : (
          <Menu>
            {modelInfo.availableModels.map((model) => {
              // Get model health status
              const providerConfig = modelConfig?.find((p) => p.platform?.includes(backend || ''));
              const healthStatus = providerConfig?.modelHealth?.[model.id]?.status || 'unknown';
              const healthColor =
                healthStatus === 'healthy'
                  ? 'bg-green-500'
                  : healthStatus === 'unhealthy'
                    ? 'bg-red-500'
                    : 'bg-gray-400';

              return (
                <Menu.Item
                  key={model.id}
                  className={model.id === modelInfo.currentModelId ? 'bg-2!' : ''}
                  onClick={() => handleSelectModel(model.id)}
                >
                  <div className='flex items-center gap-8px w-full'>
                    {healthStatus !== 'unknown' && (
                      <div className={`w-6px h-6px rounded-full shrink-0 ${healthColor}`} />
                    )}
                    <span>{model.label}</span>
                  </div>
                </Menu.Item>
              );
            })}
          </Menu>
        )
      }
    >
      <Button className='sendbox-model-btn header-model-btn agent-mode-compact-pill' shape='round' size='small'>
        <span className='flex items-center gap-6px min-w-0 leading-none'>
          {currentModelHealth.status !== 'unknown' && (
            <div className={`w-6px h-6px rounded-full shrink-0 ${currentModelHealth.color}`} />
          )}
          <MarqueePillLabel>{buttonLabel}</MarqueePillLabel>
        </span>
      </Button>
    </Dropdown>
  );
};

export default AcpModelSelector;
