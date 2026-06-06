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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import MarqueePillLabel from './MarqueePillLabel';

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
  const [modelInfo, setModelInfo] = useState<AcpModelInfo | null>(null);
  const fluxConnected = useFluxConnected();
  // Flux models appear at the top of the picker only for Flux-capable backends
  // and only while the flux-router provider is actually connected.
  const showFlux = isFluxCapableBackend(backend) && fluxConnected;
  // Track whether user has manually switched model via dropdown
  const hasUserChangedModel = useRef(false);
  // Track the last conversationId to detect tab switches
  const prevConversationIdRef = useRef(conversationId);

  const updateModelInfo = useCallback((nextModelInfo: AcpModelInfo) => {
    setModelInfo((prev) => (isSameModelInfo(prev, nextModelInfo) ? prev : nextModelInfo));
  }, []);

  const loadCachedModelInfo = useCallback(
    async (backendKey: string, options?: { preserveInitialModel?: boolean }) => {
      try {
        const cached = await ConfigStorage.get('acp.cachedModels');
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
      const result = await ipcBridge.acpConversation.getModelInfo.invoke({ conversationId });

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
      prevConversationIdRef.current = conversationId;
    }

    void reloadModelInfo({ preserveInitialModel: true }).catch(() => {
      // loadCachedModelInfo is already handled inside reloadModelInfo
    });
  }, [conversationId, backend, initialModelId, reloadModelInfo]);

  useEffect(() => {
    if (backend !== 'claude') return;

    const refresh = () => {
      void reloadModelInfo().catch(() => {
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

  // State 1: No model info - show disabled "Use CLI model" button
  if (!modelInfo) {
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

  // State 2: Has model info but cannot switch - read-only display
  if (!modelInfo.canSwitch) {
    return (
      <Tooltip content={tooltipContent} position='top'>
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
        <Menu>
          {modelInfo.availableModels.map((model) => {
            // Get model health status
            const providerConfig = modelConfig?.find((p) => p.platform?.includes(backend || ''));
            const healthStatus = providerConfig?.modelHealth?.[model.id]?.status || 'unknown';
            const healthColor =
              healthStatus === 'healthy' ? 'bg-green-500' : healthStatus === 'unhealthy' ? 'bg-red-500' : 'bg-gray-400';

            return (
              <Menu.Item
                key={model.id}
                className={model.id === modelInfo.currentModelId ? 'bg-2!' : ''}
                onClick={() => handleSelectModel(model.id)}
              >
                <div className='flex items-center gap-8px w-full'>
                  {healthStatus !== 'unknown' && <div className={`w-6px h-6px rounded-full shrink-0 ${healthColor}`} />}
                  <span>{model.label}</span>
                </div>
              </Menu.Item>
            );
          })}
        </Menu>
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
