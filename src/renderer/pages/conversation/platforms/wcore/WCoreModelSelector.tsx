/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WCoreModelSelection } from './useWCoreModelSelection';
import { usePreviewContext } from '@/renderer/pages/conversation/Preview';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import { getModelDisplayLabel } from '@/renderer/utils/model/agentLogo';
import { Button, Dropdown, Tooltip } from '@arco-design/web-react';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import type { IProvider } from '@/common/config/storage';
import ModelSelectorFlyout from '@renderer/components/model/modelSelector/ModelSelectorFlyout';
import {
  resolveActiveModelKey,
  resolveSelectedProvider,
} from '@renderer/components/model/modelSelector/resolveSelectedProvider';
import { useModelSelectorViewModel } from '@renderer/components/model/modelSelector/useModelSelectorViewModel';
import { useModelEffort } from '@renderer/components/model/modelSelector/useModelEffort';
import { usePinnedModels } from '@renderer/hooks/usage/usePinnedModels';
import { useModelDisplayName } from '@renderer/hooks/agent/useModelDisplayName';

const WCoreModelSelector: React.FC<{
  selection?: WCoreModelSelection;
  disabled?: boolean;
  /** Drives per-conversation effort persistence (Wayland Core supports effort). */
  conversationId?: string;
}> = ({ selection, disabled = false, conversationId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOpen: isPreviewOpen } = usePreviewContext();
  const layout = useLayoutContext();
  const compact = isPreviewOpen || layout?.isMobile;
  const isMobileHeaderCompact = Boolean(layout?.isMobile);
  const defaultModelLabel = t('common.defaultModel');

  const { data: modelConfig, mutate: mutateModelConfig } = useSWR<IProvider[]>('model.config', () =>
    ipcBridge.mode.getModelConfig.invoke()
  );

  // Unified flyout: the active row key + pins. A Flux selection keys off the
  // canonical `flux-router:<id>` so the Flux Auto hero shows its active check
  // even though the live Flux provider in model.config carries an opaque id.
  const currentSelection = selection?.currentModel;
  // Key the active flyout row by the registry ProviderId recovered from the
  // selection's owning bridge row, not the legacy storage id (#124).
  const activeModelKey = useMemo(
    () => resolveActiveModelKey(modelConfig, currentSelection),
    [modelConfig, currentSelection?.id, currentSelection?.useModel]
  );
  const vm = useModelSelectorViewModel('wcore', activeModelKey);
  const resolveModelDisplayName = useModelDisplayName('wcore');
  const { toggle } = usePinnedModels(true);
  const { effort, setEffort } = useModelEffort(conversationId ?? '');

  // Re-read the model list when the registry catalog changes (connect / rekey /
  // refresh emit `modelRegistry.listChanged`). Without this the Wayland Core
  // picker shows "no models" right after connecting a provider on a fresh
  // install, until the app is reloaded.
  useEffect(() => {
    return ipcBridge.modelRegistry.listChanged.on(() => {
      void mutateModelConfig();
    });
  }, [mutateModelConfig]);

  const currentModel = selection?.currentModel;
  const currentModelHealth = useMemo(() => {
    if (!currentModel || !modelConfig) return { status: 'unknown', color: 'bg-gray-400' };
    const matchedProvider = modelConfig.find((p) => p.id === currentModel.id);
    const healthStatus = matchedProvider?.modelHealth?.[currentModel.useModel]?.status || 'unknown';
    const healthColor =
      healthStatus === 'healthy' ? 'bg-green-500' : healthStatus === 'unhealthy' ? 'bg-red-500' : 'bg-gray-400';
    return { status: healthStatus, color: healthColor };
  }, [currentModel, modelConfig]);

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
    selectedLabel: currentModel?.useModel ? resolveModelDisplayName(currentModel.useModel) : '',
    defaultModelLabel,
    fallbackLabel: t('conversation.welcome.selectModel'),
  });

  // The flyout emits `(modelId, providerId)`; route it through the existing
  // `handleSelectModel(provider, modelName)` path. The flyout's providerId is
  // the registry ProviderId, not the legacy storage provider.id, so resolve the
  // owning provider robustly (see resolveSelectedProvider) - matching on
  // provider.id alone silently dropped every non-Flux selection (#99/102/103/104).
  const onSelect = (modelId: string, providerId: string) => {
    const provider = resolveSelectedProvider(providers, getAvailableModels, modelId, providerId);
    if (!provider) return;
    void handleSelectModel(provider, modelId);
  };

  return (
    <Dropdown
      trigger='click'
      droplist={
        <ModelSelectorFlyout
          vm={vm}
          onSelect={onSelect}
          onTogglePin={toggle}
          onManage={() => navigate('/settings/models')}
          effort={effort}
          onSetEffort={setEffort}
          draftSearch
        />
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
        </span>
      </Button>
    </Dropdown>
  );
};

export default WCoreModelSelector;
