/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Menu } from '@arco-design/web-react';
import { FolderInput, Pencil, Pin, PinOff, SquareArrowOutUpRight, Trash2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type ConversationMenuAction = 'open' | 'rename' | 'pin' | 'move' | 'delete';

type ConversationMenuProps = {
  pinned: boolean;
  onAction: (action: ConversationMenuAction) => void;
};

/**
 * The shared conversation context menu (right-click + ⋯). One menu definition
 * for both the resume cards and the list rows, so the actions stay identical
 * everywhere. Mirrors the project card menu: primary actions first, the
 * destructive delete last and color-coded.
 */
const ConversationMenu: React.FC<ConversationMenuProps> = ({ pinned, onAction }) => {
  const { t } = useTranslation();
  return (
    <Menu onClickMenuItem={(key) => onAction(key as ConversationMenuAction)} style={{ minWidth: 184 }}>
      <Menu.Item key='open'>
        <div className='flex items-center gap-8px'>
          <SquareArrowOutUpRight size={14} />
          <span>{t('conversations.menu.open', { defaultValue: 'Open' })}</span>
        </div>
      </Menu.Item>
      <Menu.Item key='rename'>
        <div className='flex items-center gap-8px'>
          <Pencil size={14} />
          <span>{t('conversations.menu.rename', { defaultValue: 'Rename' })}</span>
        </div>
      </Menu.Item>
      <Menu.Item key='pin'>
        <div className='flex items-center gap-8px'>
          {pinned ? <PinOff size={14} /> : <Pin size={14} />}
          <span>
            {pinned
              ? t('conversations.menu.unstar', { defaultValue: 'Unstar' })
              : t('conversations.menu.star', { defaultValue: 'Star' })}
          </span>
        </div>
      </Menu.Item>
      <Menu.Item key='move'>
        <div className='flex items-center gap-8px'>
          <FolderInput size={14} />
          <span>{t('conversations.menu.move', { defaultValue: 'Move to project' })}</span>
        </div>
      </Menu.Item>
      <Menu.Item key='delete'>
        <div className='flex items-center gap-8px text-[rgb(var(--warning-6))]'>
          <Trash2 size={14} />
          <span>{t('conversations.menu.delete', { defaultValue: 'Delete' })}</span>
        </div>
      </Menu.Item>
    </Menu>
  );
};

export default ConversationMenu;
