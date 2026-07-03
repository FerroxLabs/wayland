/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #252 - the live "what is this agent doing" line shown under a generating
 * conversation in the history sidebar. Renders the current humanized action and,
 * when the turn spawned sub-agents, an expandable caret that reveals each
 * sub-agent and its own current step. Reads a passive snapshot (see
 * common/chat/activity/conversationActivity.ts) - no message list required.
 */

import type {
  ConversationActivityAgent,
  ConversationActivitySnapshot,
} from '@/common/chat/activity/conversationActivity';
import { Spin } from '@arco-design/web-react';
import { Check, Close, Right } from '@icon-park/react';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Terminal/running glyph for a sub-agent row - mirrors the in-chat timeline. */
const AgentStatusGlyph: React.FC<{ status: ConversationActivityAgent['status'] }> = ({ status }) => {
  if (status === 'running') {
    return <Spin size={10} />;
  }
  if (status === 'failed') {
    return <Close size={12} className='text-[rgb(var(--danger-6))]' />;
  }
  return <Check size={12} className='text-[rgb(var(--success-6))]' />;
};

export const ConversationActivityStatus: React.FC<{ activity: ConversationActivitySnapshot }> = ({ activity }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const { agents } = activity;
  const hasAgents = agents.length > 0;
  const label = activity.label || t('conversation.sidebarActivity.working');

  return (
    <div className='pl-36px pr-10px pb-6px -mt-2px flex flex-col gap-2px'>
      <div className='flex items-center gap-4px min-w-0'>
        {hasAgents && (
          <span
            role='button'
            tabIndex={0}
            aria-label={t('conversation.sidebarActivity.toggleAgents')}
            aria-expanded={expanded}
            className='flex-center shrink-0 cursor-pointer text-[var(--color-text-3)] hover:text-[var(--color-text-2)]'
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((value) => !value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                setExpanded((value) => !value);
              }
            }}
          >
            <Right size={12} className={classNames('transition-transform', { 'rotate-90': expanded })} />
          </span>
        )}
        <span className='text-12px lh-16px text-[var(--color-text-3)] overflow-hidden text-ellipsis whitespace-nowrap min-w-0'>
          {label}
        </span>
        {hasAgents && !expanded && (
          <span
            className='shrink-0 flex-center min-w-14px h-14px px-3px rd-full text-10px lh-none text-[var(--color-text-3)] bg-fill-2'
            aria-hidden='true'
          >
            {agents.length}
          </span>
        )}
      </div>
      {hasAgents && expanded && (
        <ul className='flex flex-col gap-2px m-0 pl-16px list-none'>
          {agents.map((agent) => (
            <li key={agent.id} className='flex items-center gap-4px min-w-0'>
              <span className='flex-center shrink-0 w-12px h-12px'>
                <AgentStatusGlyph status={agent.status} />
              </span>
              <span className='shrink-0 max-w-100px text-11px lh-16px text-[var(--color-text-2)] overflow-hidden text-ellipsis whitespace-nowrap'>
                {agent.name}
              </span>
              <span className='text-11px lh-16px text-[var(--color-text-3)] overflow-hidden text-ellipsis whitespace-nowrap min-w-0'>
                {agent.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ConversationActivityStatus;
