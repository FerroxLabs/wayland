/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bot, ChevronDown, Plus } from 'lucide-react';
import { agentLogoDarkFilter, resolveAgentLogo } from '@/renderer/utils/model/agentLogo';
import { resolveExtensionAssetUrl } from '@/renderer/utils/platform';
import { getLucideIcon } from '@/renderer/utils/lucideAvatar';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import type { AcpBackend, AvailableAgent } from '../types';
import { Dropdown, Menu, Tooltip } from '@arco-design/web-react';
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

/** Resolve an agent's avatar to a renderable icon (Lucide glyph, emoji, logo,
 *  or the Bot fallback). Shared by the desktop pills and the mobile dropdown. */
const renderAgentIcon = (agent: AvailableAgent, size: number): React.ReactNode => {
  const LucideIconComponent = getLucideIcon(agent.avatar);
  if (LucideIconComponent) {
    return <LucideIconComponent size={size} className='flex-shrink-0 text-[var(--color-text-1)]' />;
  }
  const extensionAvatar = resolveExtensionAssetUrl(agent.isExtension ? agent.avatar : undefined);
  const emojiAvatar = agent.backend === 'remote' && agent.avatar ? agent.avatar : undefined;
  if (emojiAvatar && !extensionAvatar) {
    return <span style={{ fontSize: size, lineHeight: 1, flexShrink: 0 }}>{emojiAvatar}</span>;
  }
  const logoSrc =
    extensionAvatar ||
    resolveAgentLogo({ backend: agent.backend, customAgentId: agent.customAgentId, isExtension: agent.isExtension });
  if (logoSrc) {
    return (
      <img
        src={logoSrc}
        alt={`${agent.backend} logo`}
        width={size}
        height={size}
        style={{ objectFit: 'contain', flexShrink: 0, filter: agentLogoDarkFilter(agent.backend) }}
      />
    );
  }
  return <Bot size={size} style={{ flexShrink: 0 }} />;
};

const DISCOVER_AGENTS_KEY = '__discover_agents__';

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

  const selectableAgents = availableAgents.filter((agent) => !agent.isPreset);

  // Mobile: the inline icon strip overflows and gets clipped. Collapse it into a
  // single dropdown showing the selected agent, opening the full list on tap.
  if (isMobile) {
    const selected = selectableAgents.find((agent) => getAgentKey(agent) === selectedAgentKey) ?? selectableAgents[0];
    const droplist = (
      <Menu
        selectedKeys={selected ? [getAgentKey(selected)] : []}
        onClickMenuItem={(key) => {
          if (key === DISCOVER_AGENTS_KEY) {
            navigate('/settings/agent?tab=local');
            return;
          }
          onSelectAgent(key);
        }}
      >
        {selectableAgents.map((agent) => (
          <Menu.Item key={getAgentKey(agent)}>
            <span className='flex items-center gap-8px'>
              {renderAgentIcon(agent, 18)}
              <span className='truncate'>{agent.name}</span>
            </span>
          </Menu.Item>
        ))}
        <Menu.Item key={DISCOVER_AGENTS_KEY}>
          <span className='flex items-center gap-8px'>
            <Plus size={18} className='shrink-0' />
            <span>{t('settings.agentManagement.discoverMoreAgents', { defaultValue: 'Discover more agents' })}</span>
          </span>
        </Menu.Item>
      </Menu>
    );

    return (
      <div className='w-full flex justify-center' style={{ marginBottom: 20 }}>
        <Dropdown droplist={droplist} trigger='click' position='bl'>
          <div
            data-agent-pill='true'
            data-agent-key={selected ? getAgentKey(selected) : ''}
            className='flex items-center gap-8px cursor-pointer'
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-fill-2)',
              border: '1px solid var(--color-border-1)',
              maxWidth: '100%',
              color: 'var(--text-primary)',
            }}
          >
            {selected ? renderAgentIcon(selected, 20) : <Bot size={20} style={{ flexShrink: 0 }} />}
            <span className='font-semibold text-14px truncate'>{selected?.name ?? ''}</span>
            <ChevronDown size={16} className='shrink-0 opacity-60' />
          </div>
        </Dropdown>
      </div>
    );
  }

  return (
    <div className='w-full flex justify-center'>
      <div
        className={`flex items-center ${isMobile ? 'justify-start' : 'justify-center'}`}
        style={{
          marginBottom: 20,
          padding: '5px 8px',
          borderRadius: '9999px',
          backgroundColor: 'var(--color-fill-2)',
          border: '1px solid var(--color-border-1)',
          transition: 'background-color 0.35s ease',
          width: isMobile ? '100%' : 'fit-content',
          maxWidth: '100%',
          // Mobile: a single scrollable row (scroll-snap) instead of wrapping the
          // agent icons into a ragged two-row block. The icons stay one row and
          // scroll horizontally - the #1 mobile layout complaint.
          overflowX: isMobile ? 'auto' : 'hidden',
          overflowY: 'hidden',
          scrollSnapType: isMobile ? 'x proximity' : undefined,
          WebkitOverflowScrolling: 'touch',
          gap: isMobile ? 6 : 2,
          flexWrap: 'nowrap',
          color: 'var(--text-primary)',
        }}
      >
        {availableAgents
          .filter((agent) => !agent.isPreset)
          .map((agent) => {
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
                <div
                  data-agent-pill='true'
                  data-agent-key={getAgentKey(agent)}
                  data-agent-backend={agent.backend}
                  data-agent-selected={isSelected ? 'true' : 'false'}
                  className={`group relative flex items-center shrink-0 cursor-pointer whitespace-nowrap overflow-hidden ${isSelected ? `opacity-100 px-12px py-8px rd-20px mx-2px ${styles.agentItemSelected}` : isMobile ? 'opacity-70 p-4px' : 'opacity-60 p-4px hover:opacity-100'}`}
                  style={{
                    scrollSnapAlign: isMobile ? 'start' : undefined,
                    ...(isSelected
                      ? {
                          ...(isMobile ? { transition: 'opacity 0.2s ease, background-color 0.2s ease' } : undefined),
                          ...(isMobile || suppressSelectionAnimation ? { animation: 'none' } : undefined),
                        }
                      : { transition: 'opacity 0.2s ease' }),
                  }}
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
        <div className='w-1px h-16px mx-4px self-center' style={{ backgroundColor: 'var(--color-border-2)', opacity: 0.5 }} />
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
