/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TChatConversation } from '@/common/config/storage';
import { getAgentLogo } from '@/renderer/utils/model/agentLogo';
import { Dropdown } from '@arco-design/web-react';
import { MessageSquare, MoreHorizontal, Star } from 'lucide-react';
import React, { useState } from 'react';
import ConversationMenu, { type ConversationMenuAction } from './ConversationMenu';
import styles from './conversationCards.module.css';

type ResumeCardProps = {
  conversation: TChatConversation;
  pinned: boolean;
  timeLabel: string;
  onOpen: () => void;
  onAction: (action: ConversationMenuAction) => void;
};

/**
 * A "jump back in" card in the top rail. Bigger target than a row, two-line
 * title, and the same context menu - so resuming the last few chats is one
 * glance and one click.
 */
const ResumeCard: React.FC<ResumeCardProps> = ({ conversation, pinned, timeLabel, onOpen, onAction }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const logo = getAgentLogo(conversation.type);
  const model = 'model' in conversation ? conversation.model.useModel : '';

  const runAction = (action: ConversationMenuAction) => {
    setMenuOpen(false);
    onAction(action);
  };

  return (
    <div
      role='button'
      tabIndex={0}
      className={`relative flex flex-col gap-10px p-14px cursor-pointer ${styles.card}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
    >
      <div className='flex items-start justify-between'>
        <span className={`${styles.glyph} w-36px h-36px`}>
          {logo ? (
            <img src={logo} alt='' className='w-20px h-20px rounded-50%' />
          ) : (
            <MessageSquare size={17} className='text-t-tertiary' />
          )}
        </span>
        <div className='flex items-center gap-3px' onClick={(e) => e.stopPropagation()}>
          {pinned && <Star size={13} className='text-[rgb(var(--primary-6))]' fill='currentColor' />}
          <Dropdown
            trigger='click'
            position='br'
            popupVisible={menuOpen}
            onVisibleChange={setMenuOpen}
            getPopupContainer={() => document.body}
            droplist={<ConversationMenu pinned={pinned} onAction={runAction} />}
          >
            <button type='button' className={styles.iconBtn} aria-label='More actions'>
              <MoreHorizontal size={16} />
            </button>
          </Dropdown>
        </div>
      </div>

      <div className='flex flex-col gap-3px min-w-0'>
        <span
          className='text-14px font-500 text-t-primary'
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {conversation.name || 'Untitled'}
        </span>
        <div className='flex items-center gap-6px text-12px text-t-tertiary min-w-0'>
          {model && <span className='truncate max-w-[120px]'>{model}</span>}
          {model && <span className='opacity-50'>·</span>}
          <span className='shrink-0'>{timeLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default ResumeCard;
