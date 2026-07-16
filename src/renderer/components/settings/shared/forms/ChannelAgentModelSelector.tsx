/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared agent + default-model selector for messaging channels.
 *
 * Every channel (Telegram, Slack, Discord, WhatsApp, Signal, email, SMS, ...)
 * renders this identical pair of controls so the per-channel agent/model choice
 * is consistent across the whole app. It self-loads and persists the
 * `assistant.<platform>.agent` selection and drives the `assistant.<platform>.defaultModel`
 * selection through the supplied `modelSelection` (see useChannelModelSelection).
 */

import { ChevronDown } from 'lucide-react';
import { acpConversation, channel } from '@/common/adapter/ipcBridge';
import { ConfigStorage } from '@/common/config/storage';
import type { ChannelAgentConfigKey } from '@/common/config/storage';
import GeminiModelSelector from '@/renderer/pages/conversation/platforms/gemini/GeminiModelSelector';
import type { GeminiModelSelection } from '@/renderer/pages/conversation/platforms/gemini/useGeminiModelSelection';
import { Button, Dropdown, Menu, Message } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Preference row - matches the inline shape used by the channel config forms so
 * the extracted selector is visually identical to the previous Telegram markup.
 */
const PreferenceRow: React.FC<{
  label: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div className='flex items-center justify-between gap-24px py-12px'>
    <div className='flex-1'>
      <span className='text-14px text-t-primary'>{label}</span>
      {description && <div className='text-12px text-t-tertiary mt-2px'>{description}</div>}
    </div>
    <div className='flex items-center'>{children}</div>
  </div>
);

type SelectedAgent = { backend: string; name?: string; customAgentId?: string };

type AgentOption = { backend: string; name: string; customAgentId?: string; isExtension?: boolean };

type ChannelAgentModelSelectorProps = {
  /** Channel platform id (e.g. 'telegram', 'slack', 'discord', 'email-imap'). */
  platform: string;
  /** Model selection bound to `assistant.<platform>.defaultModel` (from useChannelModelSelection). */
  modelSelection: GeminiModelSelection;
  /** Optional override for the model-row description copy. */
  modelDescription?: string;
  /** Optional override for the agent-row description copy. */
  agentDescription?: string;
};

const agentKeyOf = (agent: SelectedAgent): string =>
  agent.customAgentId ? `${agent.backend}|${agent.customAgentId}` : agent.backend;

/**
 * Self-contained agent + default-model selector for a single channel platform.
 */
const ChannelAgentModelSelector: React.FC<ChannelAgentModelSelectorProps> = ({
  platform,
  modelSelection,
  modelDescription,
  agentDescription,
}) => {
  const { t } = useTranslation();

  const [availableAgents, setAvailableAgents] = useState<AgentOption[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgent>({ backend: 'gemini' });

  const agentConfigKey = `assistant.${platform}.agent` as ChannelAgentConfigKey;

  // Load available agents + saved selection for this platform
  useEffect(() => {
    const loadAgentsAndSelection = async () => {
      try {
        const [agentsResp, saved] = await Promise.all([
          acpConversation.getAvailableAgents.invoke(),
          ConfigStorage.get(agentConfigKey),
        ]);

        if (agentsResp.success && agentsResp.data) {
          const list = agentsResp.data
            .filter((a) => !a.isPreset)
            .map((a) => ({
              backend: a.backend,
              name: a.name,
              customAgentId: a.customAgentId,
              isExtension: a.isExtension,
            }));
          setAvailableAgents(list);
        }

        if (saved && typeof saved === 'object' && 'backend' in saved && typeof saved.backend === 'string') {
          setSelectedAgent({
            backend: saved.backend,
            customAgentId: saved.customAgentId,
            name: saved.name,
          });
        } else if (typeof saved === 'string') {
          setSelectedAgent({ backend: saved });
        }
      } catch (error) {
        console.error(`[ChannelAgentModelSelector] Failed to load agents for ${platform}:`, error);
      }
    };

    void loadAgentsAndSelection();
  }, [agentConfigKey, platform]);

  const persistSelectedAgent = async (agent: SelectedAgent) => {
    try {
      await ConfigStorage.set(agentConfigKey, agent);
      await channel.syncChannelSettings
        .invoke({ platform, agent })
        .catch((err) => console.warn(`[ChannelAgentModelSelector] syncChannelSettings failed for ${platform}:`, err));
      Message.success(t('settings.assistant.agentSwitched', 'Agent switched successfully'));
    } catch (error) {
      console.error(`[ChannelAgentModelSelector] Failed to save agent for ${platform}:`, error);
      Message.error(t('common.saveFailed', 'Failed to save'));
    }
  };

  const isGeminiAgent = selectedAgent.backend === 'gemini' || selectedAgent.backend === 'wcore';
  const agentOptions: AgentOption[] =
    availableAgents.length > 0 ? availableAgents : [{ backend: 'gemini', name: 'Gemini CLI' }];
  const currentKey = agentKeyOf(selectedAgent);

  return (
    <>
      {/* Agent Selection */}
      <div className='flex flex-col gap-8px'>
        <PreferenceRow
          label={t('settings.agent', 'Agent')}
          description={
            agentDescription ?? t('settings.assistant.agentDescChannel', 'Used for this channel conversations')
          }
        >
          <Dropdown
            trigger='click'
            position='br'
            droplist={
              <Menu selectedKeys={[currentKey]}>
                {agentOptions.map((a) => {
                  const key = agentKeyOf(a);
                  return (
                    <Menu.Item
                      key={key}
                      onClick={() => {
                        if (key === currentKey) return;
                        const next: SelectedAgent = {
                          backend: a.backend,
                          customAgentId: a.customAgentId,
                          name: a.name,
                        };
                        setSelectedAgent(next);
                        void persistSelectedAgent(next);
                      }}
                    >
                      {a.name}
                    </Menu.Item>
                  );
                })}
              </Menu>
            }
          >
            <Button type='secondary' className='min-w-160px flex items-center justify-between gap-8px'>
              <span className='truncate'>
                {selectedAgent.name ||
                  availableAgents.find((a) => agentKeyOf(a) === currentKey)?.name ||
                  selectedAgent.backend}
              </span>
              <ChevronDown size={14} />
            </Button>
          </Dropdown>
        </PreferenceRow>
      </div>

      {/* Default Model Selection */}
      <PreferenceRow
        label={t('settings.assistant.defaultModel', 'Default Model')}
        description={
          modelDescription ??
          t('settings.assistant.defaultModelDescChannel', 'Model used for this channel conversations')
        }
      >
        <GeminiModelSelector
          selection={isGeminiAgent ? modelSelection : undefined}
          disabled={!isGeminiAgent}
          label={
            !isGeminiAgent
              ? t('settings.assistant.autoFollowCliModel', 'Automatically follow the model when CLI is running')
              : undefined
          }
          variant='settings'
        />
      </PreferenceRow>
    </>
  );
};

export default ChannelAgentModelSelector;
