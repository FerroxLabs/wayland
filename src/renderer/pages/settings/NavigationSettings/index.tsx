/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Switch } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Card, PreferenceRow } from '@renderer/components/settings/shared';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import { SIDER_NAV_ITEMS } from '@renderer/components/layout/Sider/navItems';
import { useHiddenSiderNavIds, useTitlebarBrandHidden } from '@renderer/hooks/ui/useNavPreferences';
import { resetNavPreferences, setSiderNavHidden, writeTitlebarBrandHidden } from '@renderer/utils/ui/navPreferences';

/**
 * Settings > Navigation (#118). Controls the left-navigation appearance:
 * which sider entries are shown and whether the titlebar brand lockup is
 * visible. Reads live via the nav-preference hooks (which react to the same
 * localStorage-backed store the sider/titlebar consume), so toggles reflect
 * everywhere instantly.
 */
const NavigationSettings: React.FC = () => {
  const { t } = useTranslation();
  const hiddenNavIds = useHiddenSiderNavIds();
  const brandHidden = useTitlebarBrandHidden();

  return (
    <SettingsPageShell
      title={t('settings.sider.navigation', { defaultValue: 'Navigation' })}
      subtitle={t('settings.navigationPage.subtitle', {
        defaultValue: 'Choose which entries appear in the sidebar and titlebar.',
      })}
    >
      <Card title={t('settings.navigationPage.sidebarEntriesTitle', { defaultValue: 'Sidebar entries' })}>
        {SIDER_NAV_ITEMS.map((item) => (
          <PreferenceRow
            key={item.id}
            label={
              <span className='flex items-center gap-8px'>
                <span className='w-16px h-16px flex items-center justify-center shrink-0 text-t-secondary'>
                  {item.icon}
                </span>
                <span>{t(item.labelKey, { defaultValue: item.defaultLabel })}</span>
              </span>
            }
          >
            <Switch
              checked={!hiddenNavIds.has(item.id)}
              onChange={(checked) => setSiderNavHidden(item.id, !checked)}
              data-testid={`nav-visibility-${item.id}`}
            />
          </PreferenceRow>
        ))}
      </Card>

      <Card title={t('settings.navigationPage.titlebarTitle', { defaultValue: 'Titlebar' })}>
        <PreferenceRow
          label={t('settings.navigationPage.showLogo', { defaultValue: 'Show Wayland logo' })}
          help={t('settings.navigationPage.showLogoHelp', {
            defaultValue: 'Display the brand lockup in the desktop titlebar.',
          })}
        >
          <Switch
            checked={!brandHidden}
            onChange={(checked) => writeTitlebarBrandHidden(!checked)}
            data-testid='nav-visibility-titlebar-logo'
          />
        </PreferenceRow>
      </Card>

      <div className='flex justify-end'>
        <Button onClick={() => resetNavPreferences()} data-testid='nav-reset-defaults'>
          {t('settings.navigationPage.resetDefaults', { defaultValue: 'Reset to defaults' })}
        </Button>
      </div>
    </SettingsPageShell>
  );
};

export default NavigationSettings;
