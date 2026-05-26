/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Brain } from 'lucide-react';
import React from 'react';
import { Tooltip } from '@arco-design/web-react';
import classNames from 'classnames';
import type { SiderTooltipProps } from '@renderer/utils/ui/siderTooltip';

/**
 * SiderMemoryEntry — top-zone navigation row for the IJFW Memory page
 * (Wave 3 of v0.6.3). Matches the visual contract of `SiderScheduledEntry`,
 * `SiderWorkflowsEntry`, and `SiderTeamsEntry` so the four top-zone entries
 * stay visually aligned (icon size, padding, active treatment, collapsed
 * fallback). Wave 6 will swap the literal `'Memory'` label for
 * `t('sider.memory')`.
 */
interface SiderMemoryEntryProps {
  isMobile: boolean;
  isActive: boolean;
  collapsed: boolean;
  siderTooltipProps: SiderTooltipProps;
  onClick: () => void;
}

const SiderMemoryEntry: React.FC<SiderMemoryEntryProps> = ({
  isMobile,
  isActive,
  collapsed,
  siderTooltipProps,
  onClick,
}) => {
  // TODO: i18n — Wave 6 will replace this literal with `t('sider.memory')`.
  const label = 'Memory';

  if (collapsed) {
    return (
      <Tooltip {...siderTooltipProps} content={label} position='right'>
        <div
          className={classNames(
            'w-full h-40px flex items-center justify-center cursor-pointer transition-colors rd-8px text-t-primary',
            isActive ? 'bg-[rgba(var(--primary-6),0.12)] text-primary' : 'hover:bg-fill-3 active:bg-fill-4'
          )}
          onClick={onClick}
          data-testid='sider-memory-entry'
        >
          <Brain
            size={20}
            className='block leading-none shrink-0'
            style={{ lineHeight: 0 }}
          />
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
        data-testid='sider-memory-entry'
      >
        <span className='w-28px h-28px flex items-center justify-center shrink-0'>
          <Brain
            size={20}
            className='block leading-none'
            style={{ lineHeight: 0 }}
          />
        </span>
        <span className='collapsed-hidden text-t-primary text-14px font-medium leading-24px'>{label}</span>
      </div>
    </Tooltip>
  );
};

export default SiderMemoryEntry;
