/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Gauge } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@arco-design/web-react';
import classNames from 'classnames';
import type { SiderTooltipProps } from '@renderer/utils/ui/siderTooltip';

interface SiderMissionControlEntryProps {
  isMobile: boolean;
  isActive: boolean;
  collapsed: boolean;
  siderTooltipProps: SiderTooltipProps;
  onClick: () => void;
}

const SiderMissionControlEntry: React.FC<SiderMissionControlEntryProps> = ({
  isActive,
  collapsed,
  siderTooltipProps,
  onClick,
}) => {
  const { t } = useTranslation();
  const label = t('missionControl.sidebarLabel', { defaultValue: 'Mission Control' });

  if (collapsed) {
    return (
      <Tooltip {...siderTooltipProps} content={label} position='right'>
        <div
          className={classNames(
            'w-full h-26px flex items-center justify-center cursor-pointer transition-colors rd-8px text-t-primary',
            isActive ? 'bg-[rgba(var(--primary-6),0.12)] text-primary' : 'hover:bg-fill-3 active:bg-fill-4'
          )}
          onClick={onClick}
          data-testid='sider-mission-control-entry'
        >
          <Gauge size={16} className='block leading-none shrink-0' style={{ lineHeight: 0 }} />
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip {...siderTooltipProps} content={label} position='right'>
      <div
        className={classNames(
          'box-border h-26px w-full flex items-center justify-start gap-8px px-8px rd-0.5rem cursor-pointer shrink-0 transition-all text-t-primary',
          isActive ? 'bg-[rgba(var(--primary-6),0.12)] text-primary' : 'hover:bg-fill-3 active:bg-fill-4'
        )}
        onClick={onClick}
        data-testid='sider-mission-control-entry'
      >
        <span className='w-20px h-20px flex items-center justify-center shrink-0'>
          <Gauge size={16} className='block leading-none' style={{ lineHeight: 0 }} />
        </span>
        <span className='collapsed-hidden text-t-primary text-12px font-medium leading-20px'>{label}</span>
      </div>
    </Tooltip>
  );
};

export default SiderMissionControlEntry;
