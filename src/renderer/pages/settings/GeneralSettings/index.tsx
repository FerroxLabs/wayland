import React from 'react';
import { useTranslation } from 'react-i18next';
import SystemModalContent from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent';
import PageHeader from '@renderer/components/settings/shared/forms/PageHeader';
import SettingsPageWrapper from '../components/SettingsPageWrapper';

const GeneralSettings: React.FC = () => {
  const { t } = useTranslation();
  return (
    <SettingsPageWrapper>
      <PageHeader
        title={t('settings.sider.general', { defaultValue: 'General' })}
        subtitle={t(
          'settings.generalPage.subtitle',
          'App-wide preferences: language, startup behaviour, timeouts, notifications, and storage paths.'
        )}
      />
      <SystemModalContent />
    </SettingsPageWrapper>
  );
};

export default GeneralSettings;
