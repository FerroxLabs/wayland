/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TChatConversation } from '@/common/config/storage';
import type { IProject } from '@/common/types/project';
import { getAgentLogo } from '@/renderer/utils/model/agentLogo';
import { Dropdown } from '@arco-design/web-react';
import { Folder, MessageSquare, MoreHorizontal, Star } from 'lucide-react';
import React, { useState } from 'react';
import ConversationMenu, { type ConversationMenuAction } from './ConversationMenu';
import styles from './conversationCards.module.css';

type ConversationRowProps = {
  conversation: TChatConversation;
  pinned: boolean;
  project?: IProject;
  timeLabel: string;
  onOpen: () => void;
  onAction: (action: ConversationMenuAction) => void;
};

/**
 * One conversation in the browse list. A calm resting row that fills on hover;
 * a second meta line (project · model · time) gives it body instead of a bare
 * title, and quick actions (star + ⋯) plus right-click expose the full menu.
 */
const ConversationRow: React.FC<ConversationRowProps> = ({
  conversation,
  pinned,
  project,
  timeLabel,
  onOpen,
  onAction,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const logo = getAgentLogo(conversation.type);
  const model = 'model' in conversation ? conversation.model.useModel : '';

  const runAction = (action: ConversationMenuAction) => {
    setMenuOpen(false);
    onAction(action);
  };

  return (
    <div
      data-testid={`session-row-${conversation.id}`}
      className={`group flex items-center gap-12px px-12px py-9px cursor-pointer ${styles.row}`}
      onClick={onOpen}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
    >
      <span className={`${styles.glyph} w-34px h-34px`}>
        {logo ? (
          <img src={logo} alt='' className='w-19px h-19px rounded-50%' />
        ) : (
          <MessageSquare size={16} className='text-t-tertiary' />
        )}
      </span>

      <div className='flex-1 min-w-0 flex flex-col gap-2px'>
        <div className='flex items-center gap-7px min-w-0'>
          {pinned && <Star size={12} className='shrink-0 text-[rgb(var(--primary-6))]' fill='currentColor' />}
          <span className='text-14px text-t-primary truncate'>{conversation.name || 'Untitled'}</span>
        </div>
        <div className='flex items-center gap-8px min-w-0 text-12px text-t-tertiary'>
          {project && (
            <span className={styles.projectChip}>
              <Folder size={11} style={{ color: project.iconColor || '#FF6A00' }} />
              <span className='truncate'>{project.name}</span>
            </span>
          )}
          {model && <span className='truncate max-w-[200px]'>{model}</span>}
          {model && <span className='opacity-50'>·</span>}
          <span className='shrink-0'>{timeLabel}</span>
        </div>
      </div>

      <div
        className={`flex items-center gap-2px shrink-0 ${styles.rowActions}`}
        data-open={menuOpen ? 'true' : 'false'}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type='button'
          className={`${styles.iconBtn} ${pinned ? styles.iconBtnActive : ''}`}
          aria-label={pinned ? 'Unstar' : 'Star'}
          onClick={() => onAction('pin')}
        >
          <Star size={15} fill={pinned ? 'currentColor' : 'none'} />
        </button>
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
  );
};

export default ConversationRow;
