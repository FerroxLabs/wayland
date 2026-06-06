/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Collapse } from '@arco-design/web-react';
import { Bot } from 'lucide-react';
import classNames from 'classnames';
import React from 'react';
import { iconColors } from '@renderer/styles/colors';
import type { TTeam, TeamAgent } from '@/common/types/teamTypes';

interface ActiveTeamGroupProps {
  team: TTeam;
  /** Persisted expanded/collapsed state. */
  expanded: boolean;
  onToggle: () => void;
  /** Rendered as the Collapse header - typically the existing per-team `SiderItem` row. */
  header: React.ReactNode;
  /** Click on a teammate row - typically navigates to the team page + activates that slot. */
  onTeammateClick: (teammate: TeamAgent) => void;
  /** Slot id of the teammate that should render as currently active inside the body. */
  activeTeammateSlotId?: string;
}

const ActiveTeamGroup: React.FC<ActiveTeamGroupProps> = ({
  team,
  expanded,
  onToggle,
  header,
  onTeammateClick,
  activeTeammateSlotId,
}) => {
  const teammates = team.agents;

  return (
    <div
      data-testid={`team-group-${team.id}`}
      data-team-id={team.id}
      data-expanded={expanded ? 'true' : 'false'}
      className='relative group'
    >
      <Collapse
        bordered={false}
        activeKey={expanded ? [team.id] : []}
        onChange={onToggle}
        className={classNames(
          // Strip Arco chrome so the panel matches the rest of the sidebar.
          '[&_.arco-collapse-item]:!border-0 [&_.arco-collapse-item-header]:!border-0',
          '[&_.arco-collapse-item-header]:!p-0 [&_.arco-collapse-item-header]:!bg-transparent',
          '[&_.arco-collapse-item-header-title]:!flex-1 [&_.arco-collapse-item-header-title]:!min-w-0',
          '[&_.arco-collapse-item-content]:!bg-transparent [&_.arco-collapse-item-content]:!border-0',
          '[&_.arco-collapse-item-content-box]:!px-0 [&_.arco-collapse-item-content-box]:!py-2px',
          // Anchor Arco's absolute-positioned chevron over the SiderItem icon (12px from left).
          '[&_.arco-collapse-item-header]:!relative',
          '[&_.arco-collapse-item-icon-hover]:!absolute [&_.arco-collapse-item-icon-hover]:!left-12px',
          '[&_.arco-collapse-item-icon-hover]:!top-1/2 [&_.arco-collapse-item-icon-hover]:!-translate-y-1/2',
          '[&_.arco-collapse-item-icon-hover]:!z-1'
        )}
      >
        <Collapse.Item name={team.id} header={header} showExpandIcon={teammates.length > 0}>
          {teammates.length > 0 && (
            <div className='flex flex-col gap-1px pl-22px pr-6px' data-testid={`team-group-body-${team.id}`}>
              {teammates.map((agent) => {
                const isActiveTeammate = activeTeammateSlotId === agent.slotId;
                return (
                  <div
                    key={agent.slotId}
                    role='button'
                    tabIndex={0}
                    data-testid={`team-group-teammate-${team.id}-${agent.slotId}`}
                    className={classNames(
                      'h-28px rd-6px flex items-center gap-6px px-8px cursor-pointer transition-colors min-w-0',
                      isActiveTeammate
                        ? 'bg-[rgba(var(--primary-6),0.14)] text-t-primary'
                        : 'text-t-secondary hover:bg-fill-3 hover:text-t-primary'
                    )}
                    onClick={() => onTeammateClick(agent)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onTeammateClick(agent);
                      }
                    }}
                  >
                    <Bot
                      size={14}
                      color={isActiveTeammate ? iconColors.primary : 'var(--color-text-2)'}
                      style={{ lineHeight: 0, flexShrink: 0 }}
                    />
                    <span className='truncate text-12px leading-18px min-w-0 flex-1'>{agent.agentName}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Collapse.Item>
      </Collapse>
    </div>
  );
};

export default ActiveTeamGroup;
