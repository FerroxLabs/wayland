/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity, Info, Minus, PenSquare, Plus, Trash2 } from 'lucide-react';
import { ipcBridge } from '@/common';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import type { IProvider } from '@/common/config/storage';
import { uuid } from '@/common/utils';
import { Button, Divider, Message, Popconfirm, Collapse, Tag, Switch, Tooltip } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import AddModelModal from '@/renderer/pages/settings/components/AddModelModal';
import AddPlatformModal from '@/renderer/pages/settings/components/AddPlatformModal';
import { isNewApiPlatform, NEW_API_PROTOCOL_OPTIONS } from '@/renderer/utils/model/modelPlatforms';
import EditModeModal from '@/renderer/pages/settings/components/EditModeModal';
import WaylandScrollArea from '@/renderer/components/base/WaylandScrollArea';
import { useSettingsViewMode } from '../settingsViewContext';
import { consumePendingDeepLink } from '@/renderer/hooks/system/useDeepLink';
import { classifyHealthCheckMessage } from './healthCheckUtils';
import '../model-provider.css';

/**
 * Get protocol badge color
 */
const getProtocolColor = (protocol: string): string => {
  switch (protocol) {
    case 'gemini':
      return 'blue';
    case 'anthropic':
      return 'orange';
    case 'openai':
    default:
      return 'green';
  }
};

/**
 * Get protocol display name
 */
const getProtocolLabel = (protocol: string): string => {
  return NEW_API_PROTOCOL_OPTIONS.find((p) => p.value === protocol)?.label || 'OpenAI';
};

/**
 * Get next protocol (cycle through options)
 */
const getNextProtocol = (current: string): string => {
  const idx = NEW_API_PROTOCOL_OPTIONS.findIndex((p) => p.value === current);
  const nextIdx = (idx + 1) % NEW_API_PROTOCOL_OPTIONS.length;
  return NEW_API_PROTOCOL_OPTIONS[nextIdx].value;
};

// Calculate API Key count
const getApiKeyCount = (apiKey: string): number => {
  if (!apiKey) return 0;
  return apiKey.split(/[,\n]/).filter((k) => k.trim().length > 0).length;
};

/**
 * Get provider enable state (all/partial/none)
 */
const getProviderState = (platform: IProvider): { checked: boolean; indeterminate: boolean } => {
  if (!platform.modelEnabled) {
    // No modelEnabled record; treat as all enabled by default
    return { checked: true, indeterminate: false };
  }

  const models = platform.model ?? [];
  const enabledCount = models.filter((model) => platform.modelEnabled?.[model] !== false).length;
  const totalCount = models.length;

  if (enabledCount === 0) {
    return { checked: false, indeterminate: false }; // none selected
  } else if (enabledCount === totalCount) {
    return { checked: true, indeterminate: false }; // all selected
  } else {
    return { checked: true, indeterminate: true }; // partial (some models enabled; shown as enabled)
  }
};

/**
 * Check if model is enabled
 */
const isModelEnabled = (platform: IProvider, model: string): boolean => {
  if (!platform.modelEnabled) return true; // enabled by default
  return platform.modelEnabled[model] !== false;
};

const HEALTH_CHECK_FIRST_RESPONSE_TIMEOUT_MS = 30000;

const ModelModalContent: React.FC = () => {
  const { t } = useTranslation();
  const viewMode = useSettingsViewMode();
  const isPageMode = viewMode === 'page';
  const [collapseKey, setCollapseKey] = useState<Record<string, boolean>>({});
  const [healthCheckLoading, setHealthCheckLoading] = useState<Record<string, boolean>>({});
  const { data, mutate } = useSWR('model.config', () => {
    return ipcBridge.mode.getModelConfig.invoke().then((data) => {
      if (!data) return [];
      return data;
    });
  });
  const [message, messageContext] = Message.useMessage();

  const saveModelConfig = (newData: IProvider[], success?: () => void) => {
    // Optimistic update: refresh UI immediately
    void mutate(newData, false);

    ipcBridge.mode.saveModelConfig
      .invoke(newData)
      .then((data) => {
        if (data.success) {
          // Revalidate data after a successful save
          void mutate();
          success?.();
        } else {
          // Save failed; roll back to server data
          void mutate();
          message.error(data.msg);
        }
      })
      .catch((error) => {
        // Save failed; roll back to server data
        void mutate();
        console.error('Failed to save model config:', error);
        message.error(t('settings.saveModelConfigFailed'));
      });
  };

  const updatePlatform = (platform: IProvider, success: () => void) => {
    const newData = (data || []).map((item) => (item.id === platform.id ? { ...item, ...platform } : item));
    // If it's a new platform, append it to the list
    if (!newData.find((item) => item.id === platform.id)) {
      newData.push(platform);
    }
    saveModelConfig(newData, success);
  };

  const removePlatform = (id: string) => {
    const newData = (data ?? []).filter((item: IProvider) => item.id !== id);
    saveModelConfig(newData);
  };

  // Toggle provider enabled state (all-on <-> all-off)
  const toggleProviderEnabled = (platform: IProvider) => {
    const { checked } = getProviderState(platform);
    const newState = !checked; // toggled state

    // Batch update state for all models
    const modelEnabled: Record<string, boolean> = {};
    (platform.model ?? []).forEach((model) => {
      modelEnabled[model] = newState;
    });

    const updated = {
      ...platform,
      modelEnabled,
    };
    updatePlatform(updated, () => {});
  };

  // Toggle model enabled state
  const toggleModelEnabled = (platform: IProvider, model: string, enabled: boolean) => {
    const modelEnabled = { ...platform.modelEnabled };
    modelEnabled[model] = enabled;

    const updated = {
      ...platform,
      modelEnabled,
    };

    updatePlatform(updated, () => {});
  };

  // Run a health check (reusing the existing conversation request flow)
  const performHealthCheck = async (platform: IProvider, modelName: string) => {
    const loadingKey = `${platform.id}-${modelName}`;
    setHealthCheckLoading((prev) => ({ ...prev, [loadingKey]: true }));

    const startTime = Date.now();
    let tempConversationId: string | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let unsubscribe: (() => void) | null = null;

    try {
      // Health checks go through the unified conversation pipeline, matching the normal request path
      const responseStream = ipcBridge.conversation.responseStream;

      // 1. Create a temporary conversation
      const conversation = await ipcBridge.conversation.create.invoke({
        type: 'gemini',
        name: `[Health Check] ${platform.name} - ${modelName}`,
        model: {
          ...platform,
          useModel: modelName,
        },
        extra: {
          workspace: '',
          isHealthCheck: true,
        },
      });

      tempConversationId = conversation.id;

      // 2. Set up response listener
      const responsePromise = new Promise<{ success: boolean; error?: string; latency: number }>((resolve, reject) => {
        let hasResolved = false;
        let requestTraceData: { backend?: string; modelId?: string; provider?: string } | null = null;

        const resolveOnce = (result: { success: boolean; error?: string; latency: number }) => {
          if (hasResolved) return;
          hasResolved = true;
          resolve(result);
        };

        const responseListener = (msg: IResponseMessage) => {
          if (msg.conversation_id !== tempConversationId) return;

          // Emit request_trace to the console (same format as conversations)
          if (msg.type === 'request_trace') {
            const trace = msg.data as Record<string, unknown>;
            requestTraceData = {
              backend: String(trace.backend || ''),
              modelId: String(trace.modelId || ''),
              provider: String(trace.platform || trace.provider || ''),
            };
            const displayName = requestTraceData.backend || requestTraceData.provider || 'unknown';
            console.log(
              `%c[Health Check]%c ➡️ START | ${displayName} → ${trace.modelId} | ${new Date().toISOString()}`,
              'color: #1890ff; font-weight: bold',
              'color: inherit',
              trace
            );
          }

          const action = classifyHealthCheckMessage(msg.type);

          if (action === 'skip') {
            return;
          }

          if (action === 'error') {
            const duration = Date.now() - startTime;
            // Emit error trace to console
            if (requestTraceData) {
              const displayName = requestTraceData.backend || requestTraceData.provider || 'unknown';
              console.log(
                `%c[Health Check]%c ❌ ERROR | ${displayName} → ${requestTraceData.modelId} | ${duration}ms | ${new Date().toISOString()}`,
                'color: #ff4d4f; font-weight: bold',
                'color: inherit',
                msg.data
              );
            }
            resolveOnce({
              success: false,
              error: (msg.data as { error?: string } | undefined)?.error || 'Unknown error',
              latency: duration,
            });
            return;
          }

          // Use "first response packet arrival time" as the health signal to avoid long streaming completion times affecting detection
          const duration = Date.now() - startTime;
          if (requestTraceData) {
            const displayName = requestTraceData.backend || requestTraceData.provider || 'unknown';
            console.log(
              `%c[Health Check]%c ✅ FIRST_RESPONSE | ${displayName} → ${requestTraceData.modelId} | ${duration}ms | ${new Date().toISOString()}`,
              'color: #52c41a; font-weight: bold',
              'color: inherit'
            );
          }
          resolveOnce({ success: true, latency: duration });
        };

        unsubscribe = responseStream.on(responseListener);

        // First-response timeout (default 30s)
        timeoutId = setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            if (requestTraceData) {
              const duration = Date.now() - startTime;
              const displayName = requestTraceData.backend || requestTraceData.provider || 'unknown';
              console.log(
                `%c[Health Check]%c ⏱️ FIRST_RESPONSE_TIMEOUT | ${displayName} → ${requestTraceData.modelId} | ${duration}ms | ${new Date().toISOString()}`,
                'color: #faad14; font-weight: bold',
                'color: inherit'
              );
            }
            reject(
              new Error(`Health check timeout (${HEALTH_CHECK_FIRST_RESPONSE_TIMEOUT_MS / 1000}s to first response)`)
            );
          }
        }, HEALTH_CHECK_FIRST_RESPONSE_TIMEOUT_MS);
      });

      // Prevent unhandled rejection if timeout fires while sendMessage is still pending.
      // The actual error is still caught by `await responsePromise` below.
      responsePromise.catch(() => {});

      // 3. Send test message
      await ipcBridge.conversation.sendMessage.invoke({
        conversation_id: tempConversationId,
        input: 'ping',
        msg_id: uuid(),
      });

      // 4. Wait for response
      const result = await responsePromise;

      // 5. Update health status
      const latency = result.latency;

      // Save directly without optimistic update to avoid concurrent overwrites
      try {
        // Fetch the latest data first to avoid overwriting other concurrent updates
        const latestData = await ipcBridge.mode.getModelConfig.invoke();
        const newData = (latestData || []).map((item) => {
          if (item.id === platform.id) {
            const modelHealth = { ...item.modelHealth };
            modelHealth[modelName] = {
              status: result.success ? 'healthy' : 'unhealthy',
              lastCheck: Date.now(),
              latency,
              error: result.error,
            };
            return { ...item, modelHealth };
          }
          return item;
        });

        const saveResult = await ipcBridge.mode.saveModelConfig.invoke(newData);
        if (saveResult.success) {
          // Revalidate data after a successful save
          await mutate();
          if (result.success) {
            Message.success({
              content: `${platform.name} - ${modelName}: ${t('common.success')} (${latency}ms)`,
              duration: 3000,
            });
          } else {
            Message.error({
              content: `${platform.name} - ${modelName}: ${t('common.failed')} - ${result.error}`,
              duration: 5000,
            });
          }
        } else {
          Message.error({
            content: saveResult.msg || t('settings.saveModelConfigFailed'),
            duration: 3000,
          });
        }
      } catch (saveError) {
        console.error('Failed to save health check result:', saveError);
        Message.error({
          content: t('settings.saveModelConfigFailed'),
          duration: 3000,
        });
      }
    } catch (error: unknown) {
      const latency = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      Message.error({
        content: `${platform.name} - ${modelName}: ${t('common.failed')} - ${errorMessage}`,
        duration: 5000,
      });

      // Save directly without optimistic update
      try {
        // Fetch the latest data first to avoid overwriting other concurrent updates
        const latestData = await ipcBridge.mode.getModelConfig.invoke();
        const newData = (latestData || []).map((item) => {
          if (item.id === platform.id) {
            const modelHealth = { ...item.modelHealth };
            modelHealth[modelName] = {
              status: 'unhealthy',
              lastCheck: Date.now(),
              latency,
              error: errorMessage,
            };
            return { ...item, modelHealth };
          }
          return item;
        });

        const saveResult = await ipcBridge.mode.saveModelConfig.invoke(newData);
        if (saveResult.success) {
          await mutate();
        }
      } catch (saveError) {
        console.error('Failed to save health check result:', saveError);
      }
    } finally {
      // Cleanup
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
      if (tempConversationId) {
        // Delete the temporary conversation
        ipcBridge.conversation.remove.invoke({ id: tempConversationId }).catch(() => {});
      }
      setHealthCheckLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const clearAllHealthData = () => {
    if (!data) return;
    const newData: IProvider[] = data.map((platform: IProvider) => ({
      ...platform,
      modelHealth: undefined as IProvider['modelHealth'],
    }));
    saveModelConfig(newData, () => {
      Message.success({
        content: t('settings.healthStatusCleared'),
        duration: 2000,
      });
    });
  };

  const [addPlatformModalCtrl, addPlatformModalContext] = AddPlatformModal.useModal({
    onSubmit(platform) {
      updatePlatform(platform, () => addPlatformModalCtrl.close());
    },
  });

  // Consume pending deep-link data on mount (set by useDeepLink hook before navigation)
  useEffect(() => {
    const pending = consumePendingDeepLink();
    if (pending) {
      addPlatformModalCtrl.open({ deepLinkData: pending });
    }
  }, [addPlatformModalCtrl]);

  const [addModelModalCtrl, addModelModalContext] = AddModelModal.useModal({
    onSubmit(platform) {
      updatePlatform(platform, () => {
        addModelModalCtrl.close();
      });
    },
  });

  const [editModalCtrl, editModalContext] = EditModeModal.useModal({
    onChange(platform) {
      updatePlatform(platform, () => editModalCtrl.close());
    },
  });

  return (
    <div className='flex flex-col bg-2 rd-16px px-16px md:px-24px lg:px-28px py-16px md:py-18px'>
      {messageContext}
      {addPlatformModalContext}
      {editModalContext}
      {addModelModalContext}

      {/* Header with Add Button */}
      <div className='flex-shrink-0 border-b border-[var(--color-border-2)] pb-12px mb-14px flex flex-col gap-10px'>
        <div className='flex items-center justify-between gap-8px flex-wrap'>
          <div className='text-20px font-600 text-t-primary leading-34px'>{t('settings.model')}</div>
          <div className='flex items-center gap-8px flex-wrap'>
            <Button
              type='outline'
              shape='round'
              size='small'
              onClick={clearAllHealthData}
              className='rd-100px border-1 border-solid border-[var(--color-border-2)] h-34px px-14px text-t-secondary hover:text-t-primary'
            >
              {t('settings.clearStatus')}
            </Button>
            <Button
              type='outline'
              shape='round'
              icon={<Plus size={16} />}
              onClick={() => addPlatformModalCtrl.open()}
              className='rd-100px border-1 border-solid border-[var(--color-border-2)] h-34px px-14px text-t-secondary hover:text-t-primary'
            >
              {t('settings.addModel')}
            </Button>
          </div>
        </div>
        <div
          className='rd-8px px-12px py-8px text-12px leading-5 border border-solid'
          style={{
            borderColor: 'rgba(var(--primary-6),0.32)',
            backgroundColor: 'rgba(var(--primary-6),0.08)',
            color: 'rgb(var(--primary-6))',
          }}
        >
          {t('settings.customModelSupportNote')}
        </div>
      </div>

      {/* Content Area */}
      <WaylandScrollArea className='flex-1 min-h-0' disableOverflow={isPageMode}>
        {!data || data.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-40px'>
            <Info size={48} className='text-t-secondary mb-16px' />
            <h3 className='text-16px font-500 text-t-primary mb-8px'>{t('settings.noConfiguredModels')}</h3>
            <p className='text-14px text-t-secondary text-center max-w-400px'>
              {t('settings.needHelpConfigGuide')}
              <a
                href='https://github.com/TradeCanyon/Wayland/wiki/LLM-Configuration'
                target='_blank'
                rel='noopener noreferrer'
                className='text-[rgb(var(--primary-6))] hover:text-[rgb(var(--primary-5))] underline ml-4px'
              >
                {t('settings.configGuide')}
              </a>
              {t('settings.configGuideSuffix')}
            </p>
          </div>
        ) : (
          <div className='space-y-16px'>
            {(data || []).map((platform: IProvider) => {
              const key = platform.id;
              const isExpanded = collapseKey[platform.id] ?? false;
              return (
                <Collapse
                  activeKey={isExpanded ? ['image-generation'] : []}
                  onChange={(_, activeKeys) => {
                    const expanded = activeKeys.includes('image-generation');
                    setCollapseKey((prev) => ({ ...prev, [platform.id]: expanded }));
                  }}
                  key={key}
                  bordered
                  expandIconPosition='left'
                  className={`[&_.arco-collapse-item]:!border-0 [&_.arco-collapse-item]:!rounded-12px [&_.arco-collapse-item]:!overflow-hidden [&_.arco-collapse-item]:!bg-[var(--color-bg-2)] [&_.arco-collapse-item-header]:!bg-[var(--fill-0)] [&_.arco-collapse-item-header]:!pl-36px [&_.arco-collapse-item-header]:!pr-12px [&_.arco-collapse-item-header]:!py-8px [&_.arco-collapse-item-header]:transition-colors [&_.arco-collapse-item-header]:hover:!bg-[var(--color-bg-2)] [&_.arco-collapse-item-header]:!gap-8px [&_.arco-collapse-item-header-title]:!min-w-0 [&_.arco-collapse-item-header-icon]:!text-2 [&_.arco-collapse-item-header:hover_.arco-collapse-item-header-icon]:!text-1 [&_.arco-collapse-item-content]:!bg-fill-1 [&_.arco-collapse-item-content-box]:!px-10px [&_.arco-collapse-item-content-box]:!py-8px [&_.arco-collapse-item-content]:!border-t [&_.arco-collapse-item-content]:!border-[var(--color-border-2)] ${
                    isExpanded
                      ? '[&_.arco-collapse-item-header]:!rounded-t-12px [&_.arco-collapse-item-header]:!rounded-b-0 [&_.arco-collapse-item-content]:!rounded-b-12px'
                      : '[&_.arco-collapse-item-header]:!rounded-12px'
                  }`}
                >
                  <Collapse.Item
                    name='image-generation'
                    className='[&_.arco-collapse-item-header-title]:flex-1 group'
                    header={
                      <div className='group flex items-center justify-between w-full min-h-32px gap-8px min-w-0'>
                        <span
                          className={`text-14px font-500 truncate min-w-0 transition-colors ${isExpanded ? 'text-t-primary' : 'text-2 group-hover:text-1'}`}
                        >
                          {platform.name}
                        </span>
                        <div
                          className='flex items-center gap-8px shrink-0'
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <span className='text-12px text-t-secondary whitespace-nowrap hidden md:inline-flex items-center overflow-hidden max-w-0 opacity-0 group-hover:max-w-320px group-hover:opacity-100 transition-all duration-180'>
                            <span
                              className='cursor-pointer hover:text-t-primary transition-colors'
                              onClick={() => setCollapseKey((prev) => ({ ...prev, [platform.id]: !isExpanded }))}
                            >
                              {t('settings.modelCount')}（{(platform.model ?? []).length}）
                            </span>
                            <span className='mx-6px'>|</span>
                            <span
                              className='cursor-pointer hover:text-t-primary transition-colors'
                              onClick={() => editModalCtrl.open({ data: platform })}
                            >
                              {t('settings.apiKeyCount')}（{getApiKeyCount(platform.apiKey)}）
                            </span>
                          </span>
                          <span className='text-12px text-t-secondary whitespace-nowrap md:hidden'>
                            {(platform.model ?? []).length} / {getApiKeyCount(platform.apiKey)}
                          </span>
                          {/* Provider enable switch */}
                          <Switch
                            size='small'
                            checked={getProviderState(platform).checked}
                            onChange={() => toggleProviderEnabled(platform)}
                          />
                          <div className='flex items-center gap-4px'>
                            <Button
                              size='mini'
                              className='model-provider-action-btn !w-28px !h-28px !min-w-28px text-t-secondary hover:text-t-primary'
                              icon={<Plus size={14} />}
                              onClick={() => addModelModalCtrl.open({ data: platform })}
                            />
                            <Popconfirm
                              title={t('settings.deleteAllModelConfirm')}
                              onOk={() => removePlatform(platform.id)}
                            >
                              <Button
                                size='mini'
                                className='model-provider-action-btn !w-28px !h-28px !min-w-28px text-t-secondary hover:text-t-primary'
                                icon={<Minus size={14} />}
                              />
                            </Popconfirm>
                            <Button
                              size='mini'
                              className='model-provider-action-btn !w-28px !h-28px !min-w-28px text-t-secondary hover:text-t-primary'
                              icon={<PenSquare size={14} />}
                              onClick={() => editModalCtrl.open({ data: platform })}
                            />
                          </div>
                        </div>
                      </div>
                    }
                  >
                    {(platform.model ?? []).map((model: string, index: number, arr: string[]) => {
                      const isNewApiProvider = isNewApiPlatform(platform.platform);
                      const modelProtocol = platform.modelProtocols?.[model] || 'openai';
                      const modelHealth = platform.modelHealth?.[model];
                      const healthStatus = modelHealth?.status || 'unknown';

                      return (
                        <div key={model}>
                          <div className='flex items-center justify-between px-8px py-12px transition-colors hover:bg-[var(--fill-0)]'>
                            <div className='flex items-center gap-8px'>
                              {/* Health status indicator */}
                              {healthStatus !== 'unknown' && (
                                <Tooltip
                                  content={
                                    <div>
                                      <div className='flex items-center gap-4px'>
                                        <span>{healthStatus === 'healthy' ? '✅' : '❌'}</span>
                                        <span>
                                          {healthStatus === 'healthy' ? t('common.success') : t('common.failed')}
                                        </span>
                                      </div>
                                      {modelHealth?.latency && (
                                        <div className='text-12px mt-4px'>
                                          {t('settings.latency')}: {modelHealth.latency}ms
                                        </div>
                                      )}
                                      {modelHealth?.error && (
                                        <div className='text-12px mt-4px'>{modelHealth.error}</div>
                                      )}
                                      {modelHealth?.lastCheck && (
                                        <div className='text-12px mt-4px'>
                                          {t('mcp.lastCheck')}: {new Date(modelHealth.lastCheck).toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  }
                                >
                                  <div
                                    className={`w-8px h-8px rounded-full ${healthStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}
                                  />
                                </Tooltip>
                              )}

                              <span className='text-14px text-t-primary'>{model}</span>

                              {/* New API protocol badge (click to cycle) */}
                              {isNewApiProvider && (
                                <Tag
                                  size='small'
                                  color={getProtocolColor(modelProtocol)}
                                  className='cursor-pointer select-none'
                                  onClick={() => {
                                    const nextProtocol = getNextProtocol(modelProtocol);
                                    const newProtocols = { ...platform.modelProtocols };
                                    newProtocols[model] = nextProtocol;
                                    updatePlatform({ ...platform, modelProtocols: newProtocols }, () => {});
                                  }}
                                >
                                  {getProtocolLabel(modelProtocol)}
                                </Tag>
                              )}

                              {/* Model enable switch */}
                              <Switch
                                size='small'
                                checked={isModelEnabled(platform, model)}
                                onChange={(checked) => toggleModelEnabled(platform, model, checked)}
                              />
                            </div>

                            <div className='flex items-center gap-6px shrink-0'>
                              {/* Health check button */}
                              <Tooltip content={t('settings.healthCheck')}>
                                <Button
                                  size='mini'
                                  className='!w-28px !h-28px !min-w-28px !bg-[var(--color-bg-1)] text-t-secondary hover:text-t-primary hover:!bg-[var(--fill-0)]'
                                  icon={<Activity size={16} />}
                                  loading={healthCheckLoading[`${platform.id}-${model}`]}
                                  onClick={() => performHealthCheck(platform, model)}
                                />
                              </Tooltip>

                              <Popconfirm
                                title={t('settings.deleteModelConfirm')}
                                onOk={() => {
                                  const newModels = platform.model.filter((item: string) => item !== model);
                                  // Also clear model-related state to avoid reusing stale state when models are re-added after deletion
                                  // Clean all per-model state to avoid stale state on re-add.
                                  const newProtocols = { ...platform.modelProtocols };
                                  const newModelEnabled = { ...platform.modelEnabled };
                                  const newModelHealth = { ...platform.modelHealth };
                                  delete newProtocols[model];
                                  delete newModelEnabled[model];
                                  delete newModelHealth[model];

                                  updatePlatform(
                                    {
                                      ...platform,
                                      model: newModels,
                                      modelProtocols: Object.keys(newProtocols).length > 0 ? newProtocols : undefined,
                                      modelEnabled:
                                        Object.keys(newModelEnabled).length > 0 ? newModelEnabled : undefined,
                                      modelHealth: Object.keys(newModelHealth).length > 0 ? newModelHealth : undefined,
                                    },
                                    () => {}
                                  );
                                }}
                              >
                                <Button
                                  size='mini'
                                  className='!w-28px !h-28px !min-w-28px !bg-[var(--color-bg-1)] text-t-secondary hover:text-t-primary hover:!bg-[var(--fill-0)]'
                                  icon={<Trash2 size={18} strokeWidth={2} />}
                                />
                              </Popconfirm>
                            </div>
                          </div>
                          {index < arr.length - 1 && <Divider className='!my-0 !border-[var(--color-border-2)]/70' />}
                        </div>
                      );
                    })}
                  </Collapse.Item>
                </Collapse>
              );
            })}
          </div>
        )}
      </WaylandScrollArea>
    </div>
  );
};

export default ModelModalContent;
