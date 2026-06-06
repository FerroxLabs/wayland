/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessagesSquare } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@arco-design/web-react';
import classNames from 'classnames';
import type { SiderTooltipProps } from '@renderer/utils/ui/siderTooltip';

interface SiderSessionsEntryProps {
  isMobile: boolean;
  isActive: boolean;
  collapsed: boolean;
  siderTooltipProps: SiderTooltipProps;
  onClick: () => void;
}

/**
 * Top-zone entry to the browsable Conversations/Sessions page - the
 * AionUI-style "all my chats" surface.
 */
const SiderSessionsEntry: React.FC<SiderSessionsEntryProps> = ({
  isMobile,
  isActive,
  collapsed,
  siderTooltipProps,
  onClick,
}) => {
  const { t } = useTranslation();
  const label = t('conversations.siderEntry', { defaultValue: 'Conversations' });

  if (collapsed) {
    return (
      <Tooltip {...siderTooltipProps} content={label} position='right'>
        <div
          className={classNames(
            'w-full h-40px flex items-center justify-center cursor-pointer transition-colors rd-8px text-t-primary',
            isActive ? 'bg-[rgba(var(--primary-6),0.12)] text-primary' : 'hover:bg-fill-3 active:bg-fill-4'
          )}
          onClick={onClick}
          data-testid='sider-sessions-entry'
        >
          <MessagesSquare size={20} className='block leading-none shrink-0' style={{ lineHeight: 0 }} />
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip {...siderTooltipProps} content={label} position='right'>
      <div
        className={classNames(
          'box-border h-40px w-full flex items-center justify-start gap-8px px-10px rd-0.5rem cursor-pointer shrink-0 transition-all text-t-primary',
          isMobile && 'sider-action-btn-mobile',
          isActive ? 'bg-[rgba(var(--primary-6),0.12)] text-primary' : 'hover:bg-fill-3 active:bg-fill-4'
        )}
        onClick={onClick}
        data-testid='sider-sessions-entry'
      >
        <span className='w-28px h-28px flex items-center justify-center shrink-0'>
          <MessagesSquare size={20} className='block leading-none' style={{ lineHeight: 0 }} />
        </span>
        <span className='collapsed-hidden text-t-primary text-14px font-medium leading-24px'>{label}</span>
      </div>
    </Tooltip>
  );
};

export default SiderSessionsEntry;
