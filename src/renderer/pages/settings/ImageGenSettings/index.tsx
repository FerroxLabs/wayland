/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Divider, Form, Switch, Tooltip, Message } from '@arco-design/web-react';
import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ConfigStorage, BUILTIN_IMAGE_GEN_ID, type IConfigStorageRefer, type IMcpServer } from '@/common/config/storage';
import useConfigModelListWithImage from '@renderer/hooks/agent/useConfigModelListWithImage';
import {
  useMcpServers,
  useMcpAgentStatus,
  useMcpOperations,
} from '@renderer/hooks/mcp';
import WaylandSelect from '@renderer/components/base/WaylandSelect';
import McpAgentStatusDisplay from '@renderer/pages/settings/ToolsSettings/McpAgentStatusDisplay';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';

const isBuiltinImageGenServer = (server: IMcpServer) =>
  server.builtin === true && server.id === BUILTIN_IMAGE_GEN_ID;

const ImageGenSettings: React.FC = () => {
  const { t } = useTranslation();
  const [messageApi, messageContext] = Message.useMessage({ maxCount: 5 });

  const { modelListWithImage } = useConfigModelListWithImage();
  const { mcpServers, saveMcpServers } = useMcpServers();
  const { agentInstallStatus, setAgentInstallStatus, isServerLoading, checkSingleServerInstallStatus } =
    useMcpAgentStatus();
  const { syncMcpToAgents, removeMcpFromAgents } = useMcpOperations(mcpServers, messageApi);

  const [imageGenerationModel, setImageGenerationModel] = useState<
    IConfigStorageRefer['tools.imageGenerationModel'] | undefined
  >();
  const [isUpdating, setIsUpdating] = useState(false);
  const skipNextAutoCheckRef = useRef(false);

  const builtinImageGenServer = useMemo(() => mcpServers.find(isBuiltinImageGenServer), [mcpServers]);

  const imageGenerationInstalledAgents = builtinImageGenServer?.name
    ? (agentInstallStatus[builtinImageGenServer.name] ?? [])
    : [];

  // Filter providers to only those with image-capable models
  const imageModelList = useMemo(() => {
    const isImageModel = (modelName: string) => {
      const n = modelName.toLowerCase();
      return n.includes('image') || n.includes('banana') || n.includes('imagine');
    };
    return (modelListWithImage || [])
      .filter((p) => p.model.some(isImageModel))
      .map((p) => ({ ...p, model: p.model.filter(isImageModel) }));
  }, [modelListWithImage]);

  // Load persisted model selection on mount
  useEffect(() => {
    void ConfigStorage.get('tools.imageGenerationModel').then((stored) => {
      if (stored) setImageGenerationModel(stored);
    });
  }, []);

  // Auto-check agent install status when the server is enabled
  useEffect(() => {
    if (!builtinImageGenServer?.name || !builtinImageGenServer.enabled) return;
    if (skipNextAutoCheckRef.current) {
      skipNextAutoCheckRef.current = false;
      return;
    }
    void checkSingleServerInstallStatus(builtinImageGenServer.name);
  }, [builtinImageGenServer?.enabled, builtinImageGenServer?.name, checkSingleServerInstallStatus]);

  // Keep imageGenerationModel apiKey in sync when the provider's key changes
  useEffect(() => {
    if (!imageGenerationModel || !modelListWithImage) return;
    const currentProvider = modelListWithImage.find((p) => p.id === imageGenerationModel.id);
    if (currentProvider && currentProvider.apiKey !== imageGenerationModel.apiKey) {
      const updated = { ...imageGenerationModel, apiKey: currentProvider.apiKey };
      setImageGenerationModel(updated);
      void ConfigStorage.set('tools.imageGenerationModel', updated);
      void syncMcpEnv(updated);
    } else if (!currentProvider) {
      setImageGenerationModel(undefined);
      void ConfigStorage.remove('tools.imageGenerationModel');
      void syncMcpEnv({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelListWithImage, imageGenerationModel?.id, imageGenerationModel?.apiKey]);

  const syncMcpEnv = useCallback(
    async (model: Partial<IConfigStorageRefer['tools.imageGenerationModel']>) => {
      const server = mcpServers.find(isBuiltinImageGenServer);
      if (!server || server.transport.type !== 'stdio') return;

      const env: Record<string, string> = { ...server.transport.env };
      if (model.platform) env.WAYLAND_IMG_PLATFORM = model.platform;
      else delete env.WAYLAND_IMG_PLATFORM;
      if (model.baseUrl) env.WAYLAND_IMG_BASE_URL = model.baseUrl;
      else delete env.WAYLAND_IMG_BASE_URL;
      if (model.apiKey) env.WAYLAND_IMG_API_KEY = model.apiKey;
      else delete env.WAYLAND_IMG_API_KEY;
      if (model.useModel) env.WAYLAND_IMG_MODEL = model.useModel;
      else delete env.WAYLAND_IMG_MODEL;

      const updated: IMcpServer = { ...server, transport: { ...server.transport, env }, updatedAt: Date.now() };
      const next = mcpServers.map((s) => (s.id === BUILTIN_IMAGE_GEN_ID ? updated : s));
      await saveMcpServers(next);
      if (updated.enabled) await syncMcpToAgents(updated, true);
    },
    [mcpServers, saveMcpServers, syncMcpToAgents]
  );

  const handleModelChange = useCallback(
    (value: string) => {
      const [platformId, modelName] = value.split('|');
      const platform = imageModelList.find((p) => p.id === platformId);
      if (!platform) return;
      const next = { ...platform, useModel: modelName };
      setImageGenerationModel(next);
      void ConfigStorage.set('tools.imageGenerationModel', next);
      void syncMcpEnv(next);
    },
    [imageModelList, syncMcpEnv]
  );

  const clearAgentStatus = useCallback(
    (serverName: string) => {
      const updated = { ...agentInstallStatus };
      delete updated[serverName];
      setAgentInstallStatus(updated);
      void ConfigStorage.set('mcp.agentInstallStatus', updated);
    },
    [agentInstallStatus, setAgentInstallStatus]
  );

  const handleToggle = useCallback(
    async (checked: boolean) => {
      if (!builtinImageGenServer) return;
      const updated: IMcpServer = { ...builtinImageGenServer, enabled: checked, updatedAt: Date.now() };

      setIsUpdating(true);
      skipNextAutoCheckRef.current = checked;
      try {
        await saveMcpServers((prev) => prev.map((s) => (isBuiltinImageGenServer(s) ? updated : s)));

        setImageGenerationModel((prev) => {
          if (!prev) return prev;
          const next = { ...prev, switch: checked };
          void ConfigStorage.set('tools.imageGenerationModel', next);
          return next;
        });

        if (checked) {
          clearAgentStatus(updated.name);
          await syncMcpToAgents(updated, true);
          await checkSingleServerInstallStatus(updated.name);
        } else {
          await removeMcpFromAgents(updated.name, undefined, updated.transport.type);
          clearAgentStatus(updated.name);
        }
      } catch (err) {
        skipNextAutoCheckRef.current = false;
        console.error('[ImageGenSettings] toggle failed:', err);
        messageApi.error(t('settings.imageGenPage.toggleError'));
      } finally {
        if (!checked) skipNextAutoCheckRef.current = false;
        setIsUpdating(false);
      }
    },
    [
      builtinImageGenServer,
      checkSingleServerInstallStatus,
      clearAgentStatus,
      messageApi,
      removeMcpFromAgents,
      saveMcpServers,
      syncMcpToAgents,
      t,
    ]
  );

  const selectedValue =
    imageGenerationModel?.id && imageGenerationModel?.useModel
      ? `${imageGenerationModel.id}|${imageGenerationModel.useModel}`
      : undefined;

  const toggleDisabled =
    isUpdating || !builtinImageGenServer || !imageModelList.length || !imageGenerationModel?.useModel;

  return (
    <SettingsPageShell
      title={t('settings.imageGenPage.title')}
      subtitle={t('settings.imageGenPage.subtitle')}
    >
      {messageContext}

      {/* MCP server enable/disable */}
      <div className='px-[12px] md:px-[32px] py-[24px] bg-[var(--color-bg-2)] rd-12px border border-solid border-[var(--color-border-2)]'>
        <div className='flex items-center justify-between gap-12px mb-16px'>
          <div className='flex flex-col gap-4px'>
            <span className='text-14px text-t-primary'>{t('settings.imageGenPage.mcpToggleLabel')}</span>
            <span className='text-13px text-t-secondary'>{t('settings.imageGenPage.mcpToggleDescription')}</span>
          </div>
          <div className='flex items-center gap-8px'>
            {builtinImageGenServer?.enabled && builtinImageGenServer.name && (
              <McpAgentStatusDisplay
                serverName={builtinImageGenServer.name}
                agentInstallStatus={agentInstallStatus}
                isLoadingAgentStatus={
                  isServerLoading(builtinImageGenServer.name) && imageGenerationInstalledAgents.length === 0
                }
                alwaysVisible
              />
            )}
            <Switch
              disabled={toggleDisabled}
              checked={Boolean(builtinImageGenServer?.enabled)}
              onChange={handleToggle}
            />
          </div>
        </div>

        <Divider className='mt-0px mb-20px' />

        {/* Default model picker */}
        <Form layout='horizontal' labelAlign='left'>
          <Form.Item label={t('settings.imageGenPage.defaultModelLabel')}>
            {imageModelList.length > 0 ? (
              <WaylandSelect value={selectedValue} onChange={handleModelChange}>
                {imageModelList.map(({ model, ...platform }) => (
                  <WaylandSelect.OptGroup label={platform.name} key={platform.id}>
                    {model.map((modelName) => (
                      <WaylandSelect.Option key={platform.id + modelName} value={`${platform.id}|${modelName}`}>
                        {modelName}
                      </WaylandSelect.Option>
                    ))}
                  </WaylandSelect.OptGroup>
                ))}
              </WaylandSelect>
            ) : (
              <div className='flex items-center gap-8px text-t-secondary text-13px'>
                <span>{t('settings.imageGenPage.noModels')}</span>
                <Tooltip
                  content={
                    <span>
                      {t('settings.needHelpTooltip')}{' '}
                      <a
                        href='https://github.com/FerroxLabs/wayland/wiki/Wayland-Image-Generation-Tool-Model-Configuration-Guide'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-[rgb(var(--primary-6))] underline'
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t('settings.configGuide')}
                      </a>
                    </span>
                  }
                >
                  <a
                    href='https://github.com/FerroxLabs/wayland/wiki/Wayland-Image-Generation-Tool-Model-Configuration-Guide'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-[rgb(var(--primary-6))] cursor-pointer'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HelpCircle size={14} />
                  </a>
                </Tooltip>
              </div>
            )}
          </Form.Item>
        </Form>
      </div>
    </SettingsPageShell>
  );
};

export default ImageGenSettings;
