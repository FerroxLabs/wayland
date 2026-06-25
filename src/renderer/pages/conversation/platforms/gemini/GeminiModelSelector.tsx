import { ChevronDown } from 'lucide-react';
import type { GeminiModelSelection } from '@/renderer/pages/conversation/platforms/gemini/useGeminiModelSelection';
import { usePreviewContext } from '@/renderer/pages/conversation/Preview';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import { getModelDisplayLabel } from '@/renderer/utils/model/agentLogo';
import { Button, Dropdown, Menu, Tooltip } from '@arco-design/web-react';
import React, { useMemo } from 'react';
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
import { usePinnedModels } from '@renderer/hooks/usage/usePinnedModels';

// Unified model dropdown for chat header, send box, and channel settings
const GeminiModelSelector: React.FC<{
  selection?: GeminiModelSelection;
  disabled?: boolean;
  label?: string;
  variant?: 'header' | 'settings';
}> = ({ selection, disabled = false, label: customLabel, variant = 'header' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOpen: isPreviewOpen } = usePreviewContext();
  const layout = useLayoutContext();
  const compact = variant === 'header' && (isPreviewOpen || layout?.isMobile);
  const isMobileHeaderCompact = variant === 'header' && Boolean(layout?.isMobile);
  const defaultModelLabel = t('common.defaultModel');

  // Fetch model configuration data (including health status)
  const { data: modelConfig } = useSWR<IProvider[]>('model.config', () => ipcBridge.mode.getModelConfig.invoke());

  // Get current model's health status (must be called before any early return to keep hooks count stable)
  const currentModel = selection?.currentModel;
  const currentModelHealth = React.useMemo(() => {
    if (!currentModel || !modelConfig) return { status: 'unknown', color: 'bg-gray-400' };
    const matchedProvider = modelConfig.find((p) => p.id === currentModel.id);
    const healthStatus = matchedProvider?.modelHealth?.[currentModel.useModel]?.status || 'unknown';
    const healthColor =
      healthStatus === 'healthy' ? 'bg-green-500' : healthStatus === 'unhealthy' ? 'bg-red-500' : 'bg-gray-400';
    return { status: healthStatus, color: healthColor };
  }, [currentModel, modelConfig]);

  // Unified flyout state (in-chat header variant only). A Flux selection keys
  // off the canonical `flux-router:<id>` so the Flux Auto hero shows its active
  // check even though the live Flux provider carries an opaque id. Hooks run
  // unconditionally to keep the hook count stable across early returns.
  // Key the active flyout row by the registry ProviderId recovered from the
  // selection's owning bridge row, not the legacy storage id (#124).
  const activeModelKey = useMemo(
    () => resolveActiveModelKey(modelConfig, currentModel),
    [modelConfig, currentModel?.id, currentModel?.useModel]
  );
  const vm = useModelSelectorViewModel('gemini', activeModelKey);
  const { toggle } = usePinnedModels(true);

  // Disabled state (non-Gemini Agent): render a simple Tooltip + Button, no Dropdown needed
  if (disabled || !selection) {
    const displayLabel = customLabel || t('conversation.welcome.useCliModel');

    if (variant === 'settings') {
      return <div className='text-14px text-t-secondary min-w-160px'>{displayLabel}</div>;
    }

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
            <span className={compact ? 'block truncate' : undefined}>{displayLabel}</span>
          </span>
        </Button>
      </Tooltip>
    );
  }

  const { providers, geminiModeLookup, getAvailableModels, handleSelectModel, formatModelLabel } = selection;

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

  // formatModelLabel returns the friendly label for known modes (e.g. 'Auto (Gemini 3)')
  // and falls back to the raw model name for manual sub-model selections.
  const rawLabel = currentModel ? formatModelLabel(currentModel, currentModel.useModel) : '';
  const label =
    customLabel ||
    getModelDisplayLabel({
      selectedValue: currentModel?.useModel,
      selectedLabel: rawLabel,
      defaultModelLabel,
      fallbackLabel: t('conversation.welcome.selectModel'),
    });

  const triggerButton =
    variant === 'settings' ? (
      <Button type='secondary' className='min-w-160px flex items-center justify-between gap-8px'>
        <div className='flex items-center gap-8px min-w-0'>
          {currentModelHealth.status !== 'unknown' && (
            <div className={`w-6px h-6px rounded-full shrink-0 ${currentModelHealth.color}`} />
          )}
          <span className='truncate'>{label}</span>
        </div>
        <ChevronDown size={14} />
      </Button>
    ) : (
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
          <ChevronDown size={12} className='shrink-0' />
        </span>
      </Button>
    );

  // In-chat header: the unified flyout (search + pins + Flux hero, provider-
  // gated). Settings/channel variant keeps the Arco Menu with its manual
  // Google-auth sub-mode submenus, which the curated flyout does not model.
  if (variant === 'header') {
    return (
      <Dropdown
        trigger='click'
        droplist={
          <ModelSelectorFlyout
            vm={vm}
            onSelect={onSelect}
            onTogglePin={toggle}
            onManage={() => navigate('/settings/models')}
            draftSearch
          />
        }
      >
        {triggerButton}
      </Dropdown>
    );
  }

  return (
    <Dropdown
      trigger='click'
      position={variant === 'settings' ? 'br' : undefined}
      droplist={
        <Menu>
          {providers.map((provider) => {
            const models = getAvailableModels(provider);
            if (!models.length) return null;

            return (
              <Menu.ItemGroup title={provider.name} key={provider.id}>
                {models.map((modelName) => {
                  const isGoogleProvider = provider.platform?.toLowerCase().includes('gemini-with-google-auth');
                  const option = isGoogleProvider ? geminiModeLookup.get(modelName) : undefined;

                  // Manual mode: show submenu with specific models
                  if (option?.subModels && option.subModels.length > 0) {
                    return (
                      <Menu.SubMenu
                        key={`${provider.id}-${modelName}`}
                        title={
                          <div className='flex items-center justify-between gap-12px w-full'>
                            <span>{option.label}</span>
                          </div>
                        }
                      >
                        {option.subModels.map((subModel) => (
                          <Menu.Item
                            key={`${provider.id}-${subModel.value}`}
                            className={
                              currentModel?.id + currentModel?.useModel === provider.id + subModel.value ? '!bg-2' : ''
                            }
                            onClick={() => void handleSelectModel(provider, subModel.value)}
                          >
                            {subModel.label}
                          </Menu.Item>
                        ))}
                      </Menu.SubMenu>
                    );
                  }

                  // Normal mode: show single item
                  return (
                    <Menu.Item
                      key={`${provider.id}-${modelName}`}
                      onClick={() => void handleSelectModel(provider, modelName)}
                    >
                      {(() => {
                        // Get model health status
                        const matchedProvider = modelConfig?.find((p) => p.id === provider.id);
                        const healthStatus = matchedProvider?.modelHealth?.[modelName]?.status || 'unknown';
                        const healthColor =
                          healthStatus === 'healthy'
                            ? 'bg-green-500'
                            : healthStatus === 'unhealthy'
                              ? 'bg-red-500'
                              : 'bg-gray-400';

                        if (!option) {
                          return (
                            <div className='flex items-center gap-8px w-full'>
                              {healthStatus !== 'unknown' && (
                                <div className={`w-6px h-6px rounded-full shrink-0 ${healthColor}`} />
                              )}
                              <span>{modelName}</span>
                            </div>
                          );
                        }
                        return (
                          <Tooltip
                            position='right'
                            trigger='hover'
                            content={
                              <div className='max-w-240px space-y-6px'>
                                <div className='text-12px text-t-tertiary leading-5'>{option.description}</div>
                                {option.modelHint && (
                                  <div className='text-11px text-t-tertiary'>{option.modelHint}</div>
                                )}
                              </div>
                            }
                          >
                            <div className='flex items-center gap-8px w-full'>
                              {healthStatus !== 'unknown' && (
                                <div className={`w-6px h-6px rounded-full shrink-0 ${healthColor}`} />
                              )}
                              <span>{option.label}</span>
                            </div>
                          </Tooltip>
                        );
                      })()}
                    </Menu.Item>
                  );
                })}
              </Menu.ItemGroup>
            );
          })}
        </Menu>
      }
    >
      {triggerButton}
    </Dropdown>
  );
};

export default GeminiModelSelector;
