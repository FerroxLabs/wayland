/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bot, Plus } from 'lucide-react';
import { agentLogoDarkFilter, resolveAgentLogo } from '@/renderer/utils/model/agentLogo';
import { resolveExtensionAssetUrl } from '@/renderer/utils/platform';
import { getLucideIcon } from '@/renderer/utils/lucideAvatar';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import type { AcpBackend, AvailableAgent } from '../types';
import { Tooltip } from '@arco-design/web-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../index.module.css';

type AgentPillBarProps = {
  availableAgents: AvailableAgent[];
  selectedAgentKey: string;
  getAgentKey: (agent: { backend: AcpBackend; customAgentId?: string }) => string;
  onSelectAgent: (key: string) => void;
  suppressSelectionAnimation?: boolean;
};

const AgentPillBar: React.FC<AgentPillBarProps> = ({
  availableAgents,
  selectedAgentKey,
  getAgentKey,
  onSelectAgent,
  suppressSelectionAnimation = false,
}) => {
  const layout = useLayoutContext();
  const isMobile = layout?.isMobile ?? false;
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className='w-full flex justify-center'>
      <div
        className='flex items-center justify-center'
        style={{
          marginBottom: 20,
          padding: '6px',
          borderRadius: '30px',
          backgroundColor: 'var(--color-fill-2)',
          border: '1px solid var(--color-border-2)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          transition: 'background-color 0.35s ease',
          width: isMobile ? 'calc(100% + 28px)' : 'fit-content',
          maxWidth: isMobile ? 'none' : '100%',
          marginLeft: isMobile ? -14 : 0,
          marginRight: isMobile ? -14 : 0,
          overflow: isMobile ? 'visible' : 'hidden',
          gap: isMobile ? 6 : 4,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          color: 'var(--text-primary)',
        }}
      >
        {availableAgents
          .filter((agent) => !agent.isPreset)
          .map((agent, index) => {
            const isSelected = selectedAgentKey === getAgentKey(agent);
            const LucideIconComponent = getLucideIcon(agent.avatar);
            const extensionAvatar = LucideIconComponent
              ? undefined
              : resolveExtensionAssetUrl(agent.isExtension ? agent.avatar : undefined);
            // Remote agents use emoji avatars - not image URLs
            const emojiAvatar =
              !LucideIconComponent && agent.backend === 'remote' && agent.avatar ? agent.avatar : undefined;
            const logoSrc =
              LucideIconComponent
                ? undefined
                : extensionAvatar ||
                  (!emojiAvatar
                    ? resolveAgentLogo({
                        backend: agent.backend,
                        customAgentId: agent.customAgentId,
                        isExtension: agent.isExtension,
                      })
                    : undefined);

            return (
              <React.Fragment key={getAgentKey(agent)}>
                {!isMobile && index > 0 && <div className='text-16px lh-1 p-2px select-none opacity-30'>|</div>}
                <div
                  data-agent-pill='true'
                  data-agent-key={getAgentKey(agent)}
                  data-agent-backend={agent.backend}
                  data-agent-selected={isSelected ? 'true' : 'false'}
                  className={`group relative flex items-center cursor-pointer whitespace-nowrap overflow-hidden ${isSelected ? `opacity-100 px-12px py-8px rd-20px mx-2px ${styles.agentItemSelected}` : isMobile ? 'opacity-70 p-4px' : 'opacity-60 p-4px hover:opacity-100'}`}
                  style={
                    isSelected
                      ? {
                          ...(isMobile ? { transition: 'opacity 0.2s ease, background-color 0.2s ease' } : undefined),
                          ...(isMobile || suppressSelectionAnimation ? { animation: 'none' } : undefined),
                        }
                      : { transition: 'opacity 0.2s ease' }
                  }
                  onClick={() => onSelectAgent(getAgentKey(agent))}
                >
                  {LucideIconComponent ? (
                    <LucideIconComponent size={20} className='flex-shrink-0 text-[var(--color-text-1)]' />
                  ) : emojiAvatar ? (
                    <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{emojiAvatar}</span>
                  ) : logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={`${agent.backend} logo`}
                      width={20}
                      height={20}
                      style={{ objectFit: 'contain', flexShrink: 0, filter: agentLogoDarkFilter(agent.backend) }}
                    />
                  ) : (
                    <Bot size={20} style={{ flexShrink: 0 }} />
                  )}
                  <span
                    className={`font-medium text-14px ${isSelected ? 'font-semibold ml-4px' : isMobile ? 'max-w-0 opacity-0 overflow-hidden' : 'max-w-0 opacity-0 overflow-hidden group-hover:max-w-100px group-hover:opacity-100 group-hover:ml-8px'}`}
                    style={{
                      color: 'var(--text-primary)',
                      transition: isSelected
                        ? 'color 0.2s ease, font-weight 0.2s ease'
                        : isMobile
                          ? 'none'
                          : 'max-width 0.6s cubic-bezier(0.2, 0.8, 0.3, 1), opacity 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) 0.05s, margin 0.6s cubic-bezier(0.2, 0.8, 0.3, 1)',
                    }}
                  >
                    {agent.name}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        {!isMobile && <div className='text-16px lh-1 p-2px select-none opacity-30'>|</div>}
        <Tooltip content={t('settings.agentManagement.discoverMoreAgents', { defaultValue: 'Discover more agents' })}>
          <div
            className='flex items-center justify-center cursor-pointer p-4px opacity-60 hover:opacity-100 self-center'
            style={{ transition: 'opacity 0.2s ease', flexShrink: 0, marginTop: 4 }}
            onClick={() => navigate('/settings/agent?tab=local')}
          >
            <Plus size={20} style={{ flexShrink: 0 }} />
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

export default AgentPillBar;
