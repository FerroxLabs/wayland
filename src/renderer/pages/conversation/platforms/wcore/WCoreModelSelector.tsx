/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WCoreModelSelection } from './useWCoreModelSelection';
import { usePreviewContext } from '@/renderer/pages/conversation/Preview';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import { getModelDisplayLabel } from '@/renderer/utils/model/agentLogo';
import { Button, Dropdown, Menu, Tooltip } from '@arco-design/web-react';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import type { IProvider } from '@/common/config/storage';
import type { IOllamaRuntimeState } from '@/common/adapter/ipcBridge';

type ModelStatusView = {
  status: 'healthy' | 'unhealthy' | 'unknown' | 'warming';
  color: string;
  label?: string;
  tooltip?: string;
};

function getModelStatusView(args: {
  providerId?: string;
  modelName?: string;
  modelHealthStatus?: 'unknown' | 'healthy' | 'unhealthy';
  ollamaRuntimeState?: IOllamaRuntimeState;
  warmingModelId?: string | null;
}): ModelStatusView {
  const { providerId, modelName, modelHealthStatus = 'unknown', ollamaRuntimeState, warmingModelId } = args;
  if (providerId === 'ollama-local' && modelName) {
    if (warmingModelId === modelName) {
      return {
        status: 'warming',
        color: 'bg-orange-400',
        label: 'Warming',
        tooltip: 'Wayland is asking Ollama to load this model into memory.',
      };
    }
    if (!ollamaRuntimeState?.reachable) {
      return {
        status: 'unhealthy',
        color: 'bg-red-500',
        label: 'Unavailable',
        tooltip: ollamaRuntimeState?.error || 'Wayland cannot reach the local Ollama runtime.',
      };
    }
    if (ollamaRuntimeState.models[modelName]?.loaded) {
      return {
        status: 'healthy',
        color: 'bg-green-500',
        label: 'Loaded',
        tooltip: 'This model is currently loaded in Ollama memory.',
      };
    }
    return {
      status: 'unknown',
      color: 'bg-gray-400',
      label: 'Cold',
      tooltip: 'This model is installed in Ollama but not currently loaded.',
    };
  }

  const healthColor =
    modelHealthStatus === 'healthy' ? 'bg-green-500' : modelHealthStatus === 'unhealthy' ? 'bg-red-500' : 'bg-gray-400';
  return { status: modelHealthStatus, color: healthColor };
}

const WCoreModelSelector: React.FC<{
  selection?: WCoreModelSelection;
  disabled?: boolean;
}> = ({ selection, disabled = false }) => {
  const { t } = useTranslation();
  const { isOpen: isPreviewOpen } = usePreviewContext();
  const layout = useLayoutContext();
  const compact = isPreviewOpen || layout?.isMobile;
  const isMobileHeaderCompact = Boolean(layout?.isMobile);
  const defaultModelLabel = t('common.defaultModel');

  const { data: modelConfig, mutate: mutateModelConfig } = useSWR<IProvider[]>('model.config', () =>
    ipcBridge.mode.getModelConfig.invoke()
  );

  // Re-read the model list when the registry catalog changes (connect / rekey /
  // refresh emit `modelRegistry.listChanged`). Without this the Wayland Core
  // picker shows "no models" right after connecting a provider on a fresh
  // install, until the app is reloaded.
  useEffect(() => {
    return ipcBridge.modelRegistry.listChanged.on(() => {
      void mutateModelConfig();
    });
  }, [mutateModelConfig]);

  const hasOllamaProvider = Boolean(selection?.providers.some((provider) => provider.id === 'ollama-local'));
  const { data: ollamaRuntimeState, mutate: mutateOllamaRuntimeState } = useSWR<IOllamaRuntimeState | null>(
    hasOllamaProvider ? 'modelRegistry.ollama.runtime' : null,
    () => ipcBridge.modelRegistry.getOllamaRuntimeState.invoke()
  );

  useEffect(() => {
    if (!hasOllamaProvider) return;
    void mutateOllamaRuntimeState();
  }, [hasOllamaProvider, mutateOllamaRuntimeState, selection?.currentModel?.id, selection?.currentModel?.useModel, selection?.runtimeRefreshNonce]);

  const currentModel = selection?.currentModel;
  const currentModelHealth = useMemo(() => {
    if (!currentModel || !modelConfig) return { status: 'unknown', color: 'bg-gray-400' } as ModelStatusView;
    const matchedProvider = modelConfig.find((p) => p.id === currentModel.id);
    return getModelStatusView({
      providerId: currentModel.id,
      modelName: currentModel.useModel,
      modelHealthStatus: matchedProvider?.modelHealth?.[currentModel.useModel]?.status || 'unknown',
      ollamaRuntimeState: ollamaRuntimeState ?? undefined,
      warmingModelId: selection?.warmingModelId,
    });
  }, [currentModel, modelConfig, ollamaRuntimeState, selection?.warmingModelId]);

  if (disabled || !selection) {
    return (
      <Tooltip content={t('conversation.welcome.modelSwitchNotSupported')} position='top'>
        <Button
          className={classNames(
            'sendbox-model-btn header-model-btn',
            compact && '!max-w-[120px]',
            isMobileHeaderCompact && '!max-w-[160px]'
          )}
          shape='round'
          size='small'
          style={{ cursor: 'default' }}
        >
          <span className='flex items-center gap-6px min-w-0'>
            <span className={compact ? 'block truncate' : undefined}>{t('conversation.welcome.useCliModel')}</span>
          </span>
        </Button>
      </Tooltip>
    );
  }

  const { providers, getAvailableModels, handleSelectModel } = selection;

  const label = getModelDisplayLabel({
    selectedValue: currentModel?.useModel,
    selectedLabel: currentModel?.useModel || '',
    defaultModelLabel,
    fallbackLabel: t('conversation.welcome.selectModel'),
  });

  return (
    <Dropdown
      trigger='click'
      droplist={
        <Menu>
          {providers.map((provider) => {
            const models = getAvailableModels(provider);
            if (!models.length) return null;

            return (
              <Menu.ItemGroup title={provider.name} key={provider.id}>
                {models.map((modelName) => {
                  const matchedProvider = modelConfig?.find((p) => p.id === provider.id);
                  const statusView = getModelStatusView({
                    providerId: provider.id,
                    modelName,
                    modelHealthStatus: matchedProvider?.modelHealth?.[modelName]?.status || 'unknown',
                    ollamaRuntimeState: ollamaRuntimeState ?? undefined,
                    warmingModelId: selection.warmingModelId,
                  });

                  return (
                    <Menu.Item
                      key={`${provider.id}-${modelName}`}
                      className={currentModel?.id + currentModel?.useModel === provider.id + modelName ? '!bg-2' : ''}
                      onClick={() => void handleSelectModel(provider, modelName)}
                    >
                      <div className='flex items-center gap-8px w-full'>
                        {statusView.status !== 'unknown' && (
                          <div className={`w-6px h-6px rounded-full shrink-0 ${statusView.color}`} />
                        )}
                        <span className='flex-1 min-w-0 truncate'>{modelName}</span>
                        {statusView.label && (
                          <span className='text-12px opacity-60 shrink-0' title={statusView.tooltip}>
                            {statusView.label}
                          </span>
                        )}
                      </div>
                    </Menu.Item>
                  );
                })}
              </Menu.ItemGroup>
            );
          })}
        </Menu>
      }
    >
      <Button
        className={classNames(
          'sendbox-model-btn header-model-btn',
          compact && '!max-w-[120px]',
          isMobileHeaderCompact && '!max-w-[160px]'
        )}
        shape='round'
        size='small'
      >
        <span className='flex items-center gap-6px min-w-0'>
          {currentModelHealth.status !== 'unknown' && (
            <div className={`w-6px h-6px rounded-full shrink-0 ${currentModelHealth.color}`} />
          )}
          <span className={compact ? 'block truncate' : undefined}>{label}</span>
          {!compact && currentModelHealth.label && <span className='text-12px opacity-60 shrink-0'>{currentModelHealth.label}</span>}
        </span>
      </Button>
    </Dropdown>
  );
};

export default WCoreModelSelector;
