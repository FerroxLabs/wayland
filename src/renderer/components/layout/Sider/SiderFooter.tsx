/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@arco-design/web-react';
import { ArrowLeftCircle, LogOut, Moon, Settings, Sun } from 'lucide-react';
import classNames from 'classnames';
import { iconColors } from '@renderer/styles/colors';
import type { SiderTooltipProps } from '@renderer/utils/ui/siderTooltip';
import { SiderFooterQuickActions } from './SiderFooter/SiderFooterQuickActions';

interface SiderFooterProps {
  isMobile: boolean;
  isSettings: boolean;
  collapsed?: boolean;
  theme: string;
  siderTooltipProps: SiderTooltipProps;
  onSettingsClick: () => void;
  onThemeToggle: () => void;
  showLogout?: boolean;
  onLogoutClick?: () => void;
  /** Optional handlers forwarded into SiderFooterQuickActions (W2c). */
  onOpenBugReport?: () => void;
  onOpenLink?: (url: string) => void;
}

const SiderFooter: React.FC<SiderFooterProps> = ({
  isMobile,
  isSettings,
  collapsed = false,
  theme,
  siderTooltipProps,
  onSettingsClick,
  onThemeToggle,
  showLogout = false,
  onLogoutClick,
  onOpenBugReport,
  onOpenLink,
}) => {
  const { t } = useTranslation();

  const settingsIcon = isSettings ? (
    <ArrowLeftCircle size={20} color={iconColors.primary} className='block leading-none' style={{ lineHeight: 0 }} />
  ) : (
    <Settings size={20} color={iconColors.primary} className='block leading-none' style={{ lineHeight: 0 }} />
  );
  const showThemeToggle = isSettings && !collapsed;
  const themeTooltip = theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode');

  return (
    <div className='shrink-0 sider-footer mt-auto pt-4px pb-8px'>
      <div className={classNames('flex', collapsed ? 'flex-col gap-2px' : 'items-center gap-2px')}>
        <Tooltip {...siderTooltipProps} content={isSettings ? t('common.back') : t('common.settings')} position='right'>
          <div
            onClick={onSettingsClick}
            className={classNames(
              'h-40px flex items-center rd-0.5rem cursor-pointer transition-colors',
              collapsed ? 'w-full justify-center' : 'flex-1 min-w-0 justify-start gap-8px px-10px',
              isMobile && 'sider-footer-btn-mobile',
              {
                'bg-[rgba(var(--primary-6),0.12)] text-primary': isSettings,
                'hover:bg-[rgba(var(--primary-6),0.14)] active:bg-fill-2': !isSettings,
              }
            )}
          >
            <span className='w-28px h-24px flex items-center justify-center shrink-0'>{settingsIcon}</span>
            <span className='collapsed-hidden text-t-primary text-14px font-medium leading-24px truncate'>
              {isSettings ? t('common.back') : t('common.settings')}
            </span>
          </div>
        </Tooltip>
        {showLogout && onLogoutClick && (
          <Tooltip {...siderTooltipProps} content={t('settings.googleLogout')} position='right'>
            <div
              onClick={onLogoutClick}
              className={classNames(
                'h-40px flex items-center rd-0.5rem cursor-pointer transition-colors hover:bg-[rgba(var(--primary-6),0.14)] active:bg-fill-2',
                collapsed ? 'w-full justify-center' : 'flex-1 min-w-0 justify-start gap-8px px-10px',
                isMobile && 'sider-footer-btn-mobile'
              )}
            >
              <span className='w-28px h-24px flex items-center justify-center shrink-0'>
                <LogOut size={18} color={iconColors.primary} className='block leading-none' style={{ lineHeight: 0 }} />
              </span>
              <span className='collapsed-hidden text-t-primary text-14px font-medium leading-24px truncate'>
                {t('settings.googleLogout')}
              </span>
            </div>
          </Tooltip>
        )}
        {/* W2c - quick actions row (Bug · WebUI · GitHub). Hidden in collapsed mode. */}
        {!collapsed && !isSettings && (
          <SiderFooterQuickActions onOpenBugReport={onOpenBugReport} onOpenLink={onOpenLink} collapsed={collapsed} />
        )}
        {/* Theme toggle - lightweight icon button, only while inside Settings page (not in collapsed mode) */}
        {showThemeToggle && (
          <Tooltip {...siderTooltipProps} content={themeTooltip} position='right'>
            <div
              onClick={onThemeToggle}
              className={classNames(
                'h-40px w-40px shrink-0 flex items-center justify-center cursor-pointer rd-0.5rem transition-colors text-t-secondary hover:bg-fill-2 hover:text-t-primary active:bg-fill-3',
                isMobile && 'sider-footer-btn-mobile'
              )}
              aria-label={themeTooltip}
            >
              <span className='w-28px h-28px flex items-center justify-center shrink-0'>
                {theme === 'dark' ? (
                  <Sun size={18} className='block leading-none' />
                ) : (
                  <Moon size={18} className='block leading-none' />
                )}
              </span>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default SiderFooter;
