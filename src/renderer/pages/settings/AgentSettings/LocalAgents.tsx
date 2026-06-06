/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, Plus } from 'lucide-react';
import { ipcBridge } from '@/common';
import { ConfigStorage } from '@/common/config/storage';
import type { AcpBackendConfig } from '@/common/types/acpTypes';
import WaylandModal from '@/renderer/components/base/WaylandModal';
import { Alert, Button, Typography } from '@arco-design/web-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import AgentCard from './AgentCard';
import { AgentHubModal } from './AgentHubModal';
import InlineAgentEditor from './InlineAgentEditor';

const LocalAgents: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hubModalVisible, setHubModalVisible] = useState(false);

  // Detected agents (include built-in backends and extension-contributed agents, exclude user custom and remote)
  const { data: detectedAgents } = useSWR('acp.agents.available.settings', async () => {
    const result = await ipcBridge.acpConversation.getAvailableAgents.invoke();
    if (result.success && result.data) {
      return result.data.filter((agent) => agent.backend !== 'remote' && agent.backend !== 'custom' && !agent.isPreset);
    }
    return [];
  });

  // AUDIT-05 F19: AgentRegistry sub-detector failures (e.g. remote-agent DB
  // read error) come back through a separate IPC endpoint so the user can
  // tell "no remote agents configured" apart from "remote loading failed".
  const { data: loadErrors } = useSWR('acp.agents.loadErrors.settings', async () => {
    const result = await ipcBridge.acpConversation.getLoadErrors.invoke();
    if (result.success && result.data) {
      return result.data;
    }
    return [] as string[];
  });

  // Custom agents (user-defined, stored in 'acp.customAgents')
  const { data: customAgents, mutate: mutateCustomAgents } = useSWR('acp.customAgents.settings', async () => {
    const agents = await ConfigStorage.get('acp.customAgents');
    return (agents || []) as AcpBackendConfig[];
  });

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AcpBackendConfig | null>(null);

  const handleSaveCustomAgent = useCallback(
    async (agent: AcpBackendConfig) => {
      const current = ((await ConfigStorage.get('acp.customAgents')) || []) as AcpBackendConfig[];
      const existingIndex = current.findIndex((a) => a.id === agent.id);
      const updatedAgents =
        existingIndex >= 0 ? current.map((a, i) => (i === existingIndex ? agent : a)) : [...current, agent];
      await ConfigStorage.set('acp.customAgents', updatedAgents);
      await mutateCustomAgents();
      setEditorVisible(false);
      setEditingAgent(null);
    },
    [mutateCustomAgents]
  );

  const handleDeleteCustomAgent = useCallback(
    async (agentId: string) => {
      const current = ((await ConfigStorage.get('acp.customAgents')) || []) as AcpBackendConfig[];
      const agents = current.filter((a) => a.id !== agentId);
      await ConfigStorage.set('acp.customAgents', agents);
      await mutateCustomAgents();
    },
    [mutateCustomAgents]
  );

  const handleToggleCustomAgent = useCallback(
    async (agentId: string, enabled: boolean) => {
      const current = ((await ConfigStorage.get('acp.customAgents')) || []) as AcpBackendConfig[];
      const updatedAgents = current.map((a) => (a.id === agentId ? { ...a, enabled } : a));
      if (updatedAgents.some((a) => a.id === agentId)) {
        await ConfigStorage.set('acp.customAgents', updatedAgents);
        await mutateCustomAgents();
      }
    },
    [mutateCustomAgents]
  );

  // Wayland Core and Gemini CLI first among detected agents
  const wcoreAgent = detectedAgents?.find((a) => a.backend === 'wcore');
  const geminiAgent = detectedAgents?.find((a) => a.backend === 'gemini');
  const otherDetected = detectedAgents?.filter((a) => a.backend !== 'gemini' && a.backend !== 'wcore') ?? [];

  const openCustomAgentEditor = useCallback(() => {
    setEditingAgent(null);
    setEditorVisible(true);
  }, []);

  return (
    <div className='flex flex-col gap-8px py-16px'>
      <div className='px-16px text-12px text-t-secondary'>
        <span>{t('settings.agentManagement.localAgentsDescription')} </span>
        <Button
          type='text'
          size='mini'
          className='!h-auto !p-0 !align-baseline !text-12px !font-normal !text-primary-6 hover:!text-primary-7 hover:!underline underline-offset-2'
          onClick={openCustomAgentEditor}
        >
          {t('settings.agentManagement.detectCustomAgent')}
        </Button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className='px-16px mt-8px'>
          <div className='flex flex-col gap-14px rounded-12px border border-solid border-[rgba(var(--primary-6),0.18)] bg-[rgba(var(--primary-6),0.06)] p-16px md:flex-row md:items-center md:justify-between'>
            <div className='flex items-center gap-12px'>
              <div className='flex h-40px w-40px items-center justify-center leading-none rounded-10px border border-solid border-[rgba(var(--primary-6),0.12)] bg-[rgba(var(--primary-6),0.10)] text-primary-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]'>
                <Home size={20} strokeWidth={2} className='block' />
              </div>
              <div className='min-w-0'>
                <Typography.Text className='mb-4px block text-15px font-medium text-t-primary'>
                  {t('settings.agentManagement.installFromMarket')}
                </Typography.Text>
                <Typography.Text className='block text-12px leading-18px text-t-secondary'>
                  {t('settings.agentManagement.discoverMoreAgents')}
                </Typography.Text>
              </div>
            </div>

            <Button
              type='primary'
              size='small'
              icon={<Plus size={14} />}
              className='md:!min-w-144px'
              onClick={() => setHubModalVisible(true)}
            >
              {t('settings.agentManagement.installFromMarket')}
            </Button>
          </div>
        </div>
      )}

      {/* AUDIT-05 F19: surface AgentRegistry sub-detector failures so users can
          distinguish "no remote agents configured" from "remote loading failed". */}
      {loadErrors && loadErrors.length > 0 && (
        <div className='px-16px mt-8px'>
          <Alert
            type='warning'
            content={
              <div className='flex flex-col gap-4px'>
                <Typography.Text className='text-12px font-medium'>
                  {t('settings.agentManagement.loadErrorsTitle', {
                    defaultValue: 'Some agents failed to load',
                  })}
                </Typography.Text>
                {loadErrors.map((err, idx) => (
                  <Typography.Text key={idx} className='text-12px'>
                    {err}
                  </Typography.Text>
                ))}
              </div>
            }
          />
        </div>
      )}

      {/* Detected Agents section */}
      <div className='px-16px mt-8px'>
        <Typography.Text className='text-12px font-medium text-t-secondary mb-4px block'>
          {t('settings.agentManagement.detected')}
        </Typography.Text>
      </div>
      <div className='grid grid-cols-1 gap-10px px-16px sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
        {wcoreAgent && (
          <AgentCard
            type='detected'
            agent={wcoreAgent}
            settingsDisabled={false}
            onSettings={() => navigate('/settings/wcore')}
            variant='grid'
          />
        )}
        {geminiAgent && (
          <AgentCard
            type='detected'
            agent={geminiAgent}
            settingsDisabled={false}
            onSettings={() => navigate('/settings/models')}
            variant='grid'
          />
        )}
        {otherDetected.map((agent) => (
          <AgentCard key={agent.backend} type='detected' agent={agent} variant='grid' />
        ))}
      </div>
      {(!detectedAgents || detectedAgents.length === 0) && (
        <Typography.Text type='secondary' className='block px-16px py-16px text-center text-12px'>
          {t('settings.agentManagement.localAgentsEmpty')}
        </Typography.Text>
      )}

      {/* Custom Agents section */}
      {(editorVisible || (customAgents && customAgents.length > 0)) && (
        <div className='px-16px mt-16px'>
          <Typography.Text className='text-12px font-medium text-t-secondary mb-4px block'>
            {t('settings.agentManagement.customAgents', { defaultValue: 'Custom Agents' })}
          </Typography.Text>
        </div>
      )}

      <WaylandModal
        visible={editorVisible}
        onCancel={() => {
          setEditorVisible(false);
          setEditingAgent(null);
        }}
        header={{
          title: editingAgent
            ? t('settings.agentManagement.editCustomAgent')
            : t('settings.agentManagement.detectCustomAgent'),
          showClose: true,
        }}
        footer={null}
        style={{ maxWidth: '92vw', borderRadius: 16 }}
        contentStyle={{
          background: 'var(--dialog-fill-0)',
          borderRadius: 16,
          padding: '20px 24px 16px',
          overflow: 'auto',
        }}
      >
        <InlineAgentEditor
          agent={editingAgent}
          onSave={(agent) => void handleSaveCustomAgent(agent)}
          onCancel={() => {
            setEditorVisible(false);
            setEditingAgent(null);
          }}
        />
      </WaylandModal>

      <div className='flex flex-col gap-4px px-0'>
        {customAgents?.map((agent) => (
          <AgentCard
            key={agent.id}
            type='custom'
            agent={agent}
            onEdit={() => {
              setEditingAgent(agent);
              setEditorVisible(true);
            }}
            onDelete={() => void handleDeleteCustomAgent(agent.id)}
            onToggle={(enabled) => void handleToggleCustomAgent(agent.id, enabled)}
          />
        ))}
      </div>

      {hubModalVisible && <AgentHubModal visible={hubModalVisible} onCancel={() => setHubModalVisible(false)} />}
    </div>
  );
};

export default LocalAgents;
