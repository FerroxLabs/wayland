/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import AgentModalContent from '@/renderer/components/settings/SettingsModal/contents/AgentModalContent';
import PageHeader from '@renderer/components/settings/shared/forms/PageHeader';
import SettingsPageWrapper from '../components/SettingsPageWrapper';

const AgentSettings: React.FC = () => {
  const { t } = useTranslation();
  return (
    <SettingsPageWrapper contentClassName='md:max-w-[1600px]'>
      <PageHeader
        title={t('settings.sider.agents', { defaultValue: 'Agents' })}
        subtitle={t(
          'settings.agentsPage.subtitle',
          'Auto-detected local agents and remote agent connections. Built-in agents are always available.'
        )}
      />
      <AgentModalContent />
    </SettingsPageWrapper>
  );
};

export default AgentSettings;
