/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Message, Modal, Radio, Select, Switch } from '@arco-design/web-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, PreferenceRow } from '@renderer/components/settings/shared';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import { SIDER_NAV_ITEMS } from '@renderer/components/layout/Sider/navItems';
import { useHiddenSiderNavIds, useTitlebarBrandHidden } from '@renderer/hooks/ui/useNavPreferences';
import { resetNavPreferences, setSiderNavHidden, writeTitlebarBrandHidden } from '@renderer/utils/ui/navPreferences';
import { useShellExperience } from '@renderer/hooks/ui/useShellExperience';
import type { ShellExperience } from '@/common/shellExperience';
import { COCKPIT_RETURN_REASONS, type CockpitReturnReason } from '@/common/types/cohortRollout';

import CohortEvidenceConsent from './CohortEvidenceConsent';

const RETURN_REASON_LABELS: Record<CockpitReturnReason, string> = {
  performance: 'It felt slow',
  'confusing-navigation': 'Navigation was confusing',
  'missing-capability': 'I could not find a capability',
  reliability: 'Something did not work reliably',
  accessibility: 'It was difficult to access or use',
  'trust-or-control': 'I needed clearer control or evidence',
  'other-no-text': 'Another reason',
};

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
  const { shell, loading: shellLoading, cockpitRollout, setShell } = useShellExperience();
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState<CockpitReturnReason>('confusing-navigation');
  const [returningToClassic, setReturningToClassic] = useState(false);

  const chooseShell = (next: ShellExperience): void => {
    if (next === 'classic' && shell === 'cockpit') {
      setReturnDialogOpen(true);
      return;
    }
    void setShell(next);
  };

  const confirmReturnToClassic = async (): Promise<void> => {
    setReturningToClassic(true);
    try {
      await setShell('classic', returnReason);
      setReturnDialogOpen(false);
    } catch {
      // The hook has already switched the live session to Classic. Keep the
      // user safe and explain only that the restart preference was not saved.
      setReturnDialogOpen(false);
      Message.warning(
        t('settings.navigationPage.returnToClassicSaveFailed', {
          defaultValue: 'Classic is active now, but the restart preference could not be saved.',
        })
      );
    } finally {
      setReturningToClassic(false);
    }
  };

  return (
    <SettingsPageShell
      title={t('settings.sider.navigation', { defaultValue: 'Navigation' })}
      subtitle={t('settings.navigationPage.subtitle', {
        defaultValue: 'Choose which entries appear in the sidebar and titlebar.',
      })}
    >
      <Card title={t('settings.navigationPage.experienceTitle', { defaultValue: 'Interface experience' })}>
        <PreferenceRow
          label={t('settings.navigationPage.experienceLabel', { defaultValue: 'Wayland interface' })}
          help={t('settings.navigationPage.experienceHelp', {
            defaultValue:
              'Classic keeps the interface you already know. Cockpit is the new progressively disclosed layout over the same chats, Projects, agents, and settings.',
          })}
        >
          <Radio.Group
            type='button'
            value={shell}
            disabled={shellLoading}
            onChange={(value) => chooseShell(value as ShellExperience)}
            data-testid='shell-experience-selector'
          >
            <Radio value='classic'>{t('settings.navigationPage.classicShell', { defaultValue: 'Classic' })}</Radio>
            <Radio value='cockpit' disabled={!cockpitRollout.eligible}>
              {t('settings.navigationPage.cockpitShell', { defaultValue: 'Cockpit preview' })}
            </Radio>
          </Radio.Group>
        </PreferenceRow>
        {!shellLoading && !cockpitRollout.eligible && (
          <p className='mt-8px text-12px text-t-secondary' data-testid='cockpit-rollout-unavailable'>
            {t('settings.navigationPage.cockpitInvitationRequired', {
              defaultValue: 'Cockpit remains in controlled preview. This installation has not been invited yet.',
            })}
          </p>
        )}
        <CohortEvidenceConsent />
      </Card>

      <Modal
        visible={returnDialogOpen}
        title={t('settings.navigationPage.returnToClassicTitle', { defaultValue: 'Return to Classic' })}
        onCancel={() => setReturnDialogOpen(false)}
        onOk={() => void confirmReturnToClassic()}
        confirmLoading={returningToClassic}
        okText={t('settings.navigationPage.returnToClassicConfirm', { defaultValue: 'Use Classic' })}
      >
        <p className='mb-12px text-13px text-t-secondary'>
          {t('settings.navigationPage.returnToClassicHelp', {
            defaultValue: 'What made you switch back? Wayland records only this category, never your chat content.',
          })}
        </p>
        <Select
          value={returnReason}
          onChange={(value) => setReturnReason(value as CockpitReturnReason)}
          className='w-full'
          data-testid='return-to-classic-reason'
        >
          {COCKPIT_RETURN_REASONS.map((reason) => (
            <Select.Option key={reason} value={reason}>
              {RETURN_REASON_LABELS[reason]}
            </Select.Option>
          ))}
        </Select>
      </Modal>

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
