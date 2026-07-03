/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@arco-design/web-react';
import WaylandScrollArea from '@/renderer/components/base/WaylandScrollArea';
import SettingsPageWrapper from '../components/SettingsPageWrapper';
import { TOGGLEABLE_NAV_ITEMS } from '@/renderer/components/layout/Sider/navRegistry';
import { useSiderVisibility } from '@/renderer/hooks/ui/useSiderVisibility';
import { readLogoVisible, writeLogoVisible } from '@/renderer/utils/ui/logoVisibility';

/**
 * Preference row: label + control in a unified horizontal layout, matching the
 * Theme & Display page rows.
 */
const PreferenceRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className='flex flex-col items-stretch gap-10px py-12px md:flex-row md:items-center md:justify-between md:gap-24px'>
    <div className='text-14px text-t-primary leading-22px'>{label}</div>
    <div className='w-full flex md:flex-1 md:justify-end'>{children}</div>
  </div>
);

/**
 * Navigation settings (#118).
 *
 * Controls the left navigation: show/hide the redundant sidebar logo, and
 * show/hide each individual nav destination. Hidden destinations remain
 * reachable from this pane (the "manage nav" control) so nothing is orphaned.
 * Mission Control is pinned first and is not hideable.
 */
const NavigationSettings: React.FC = () => {
  const { t } = useTranslation();
  const { isHidden, toggle } = useSiderVisibility();
  const [logoVisible, setLogoVisible] = useState(readLogoVisible);

  const onLogoChange = (checked: boolean) => {
    setLogoVisible(writeLogoVisible(checked));
  };

  return (
    <SettingsPageWrapper>
      <div className='flex flex-col h-full w-full'>
        <WaylandScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow>
          <div className='space-y-16px'>
            {/* Sidebar logo */}
            <div className='px-16px md:px-24px lg:px-28px py-14px md:py-16px bg-[var(--color-bg-2)] border-2 border-solid border-[var(--color-border-2)] rd-12px'>
              <div className='mb-4px'>
                <div className='text-14px font-600 text-[var(--color-text-1)]'>
                  {t('settings.navigationPage.logoTitle', { defaultValue: 'Sidebar logo' })}
                </div>
                <div className='text-12px text-[var(--color-text-3)] mt-2px'>
                  {t('settings.navigationPage.logoHint', {
                    defaultValue:
                      'The sidebar logo duplicates the one in the titlebar. Hide it to reclaim vertical space for navigation.',
                  })}
                </div>
              </div>
              <div className='w-full flex flex-col divide-y divide-border-2'>
                <PreferenceRow label={t('settings.navigationPage.showLogo', { defaultValue: 'Show sidebar logo' })}>
                  <Switch checked={logoVisible} onChange={onLogoChange} data-testid='nav-settings-logo-switch' />
                </PreferenceRow>
              </div>
            </div>

            {/* Nav items */}
            <div className='px-16px md:px-24px lg:px-28px py-14px md:py-16px bg-[var(--color-bg-2)] border-2 border-solid border-[var(--color-border-2)] rd-12px'>
              <div className='mb-4px'>
                <div className='text-14px font-600 text-[var(--color-text-1)]'>
                  {t('settings.navigationPage.itemsTitle', { defaultValue: 'Navigation items' })}
                </div>
                <div className='text-12px text-[var(--color-text-3)] mt-2px'>
                  {t('settings.navigationPage.itemsHint', {
                    defaultValue:
                      'Hide destinations you do not use. Re-enable them here anytime. Mission Control is always pinned to the top.',
                  })}
                </div>
              </div>
              <div className='w-full flex flex-col divide-y divide-border-2'>
                {TOGGLEABLE_NAV_ITEMS.map((item) => (
                  <PreferenceRow key={item.id} label={t(item.labelKey)}>
                    <Switch
                      checked={!isHidden(item.id)}
                      onChange={() => toggle(item.id)}
                      data-testid={`nav-settings-item-switch-${item.id}`}
                    />
                  </PreferenceRow>
                ))}
              </div>
            </div>
          </div>
        </WaylandScrollArea>
      </div>
    </SettingsPageWrapper>
  );
};

export default NavigationSettings;
