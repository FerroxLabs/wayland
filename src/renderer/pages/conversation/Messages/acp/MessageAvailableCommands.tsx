/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Hammer } from 'lucide-react';
import type { IMessageAvailableCommands } from '@/common/chat/chatLib';
import WaylandCollapse from '@/renderer/components/base/WaylandCollapse';
import CollapsibleContent from '@/renderer/components/chat/CollapsibleContent';
import { iconColors } from '@/renderer/styles/colors';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface MessageAvailableCommandsProps {
  message: IMessageAvailableCommands;
}

const MessageAvailableCommands: React.FC<MessageAvailableCommandsProps> = ({ message }) => {
  const { t } = useTranslation();
  const { commands } = message.content;

  if (!commands || commands.length === 0) {
    return null;
  }

  return (
    <div className='w-full'>
      <div className='flex items-center gap-8px mb-8px'>
        <Hammer size={16} color={iconColors.primary} />
        <span className='text-t-secondary text-13px font-medium'>
          {t('messages.availableCommands', { count: commands.length })}
        </span>
      </div>
      <CollapsibleContent maxHeight={150} defaultCollapsed={true}>
        <WaylandCollapse accordion bordered={false} expandIconPosition='right'>
          {commands.map((command) => (
            <WaylandCollapse.Item
              key={command.name}
              name={command.name}
              header={<span className='text-t-primary font-medium'>{command.name}</span>}
            >
              <div className='p-12px text-13px text-t-secondary'>
                {command.description}
                {command.hint && <span className='text-t-tertiary ml-4px'>({command.hint})</span>}
              </div>
            </WaylandCollapse.Item>
          ))}
        </WaylandCollapse>
      </CollapsibleContent>
    </div>
  );
};

export default MessageAvailableCommands;
