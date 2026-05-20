/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ipcBridge } from '@/common';
import { Tag, Typography } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import SettingsPageWrapper from './components/SettingsPageWrapper';

type WCoreAgentInfo = {
  available: boolean;
  version?: string;
  path?: string;
};

const WCoreSettings: React.FC = () => {
  const { t } = useTranslation();
  const [agentInfo, setAgentInfo] = useState<WCoreAgentInfo | null>(null);

  useEffect(() => {
    void ipcBridge.acpConversation.getAvailableAgents.invoke().then((result) => {
      if (result.success) {
        const agent = result.data.find((a) => a.backend === 'wcore');
        setAgentInfo(agent ? { available: true, path: agent.cliPath } : { available: false });
      }
    });
  }, []);

  return (
    <SettingsPageWrapper>
      <div className='flex flex-col gap-16px'>
        <Typography.Title heading={5} className='!mb-0'>
          Wayland Core
        </Typography.Title>

        {/* Status */}
        <div className='flex flex-col gap-8px p-16px rd-12px bg-aou-1'>
          <div className='flex items-center gap-8px'>
            <Typography.Text className='text-14px font-medium'>
              {t('common.status', { defaultValue: 'Status' })}
            </Typography.Text>
            <Tag color={agentInfo?.available ? 'green' : 'red'} size='small'>
              {agentInfo?.available
                ? t('settings.wcore.available', { defaultValue: 'Available' })
                : t('settings.wcore.notFound', { defaultValue: 'Not Found' })}
            </Tag>
          </div>
          {agentInfo?.version && (
            <Typography.Text type='secondary' className='text-12px'>
              {t('settings.wcore.version', { defaultValue: 'Version' })}: {agentInfo.version}
            </Typography.Text>
          )}
          {agentInfo?.path && (
            <Typography.Text type='secondary' className='text-12px break-all'>
              {t('settings.wcore.path', { defaultValue: 'Path' })}: {agentInfo.path}
            </Typography.Text>
          )}
        </div>

        {/* Info */}
        <Typography.Text type='secondary' className='text-12px'>
          {t('settings.wcore.providerNote', {
            defaultValue:
              'Provider and API key settings are managed in the Models page. Wayland Core supports: Anthropic, OpenAI, AWS Bedrock.',
          })}
        </Typography.Text>
      </div>
    </SettingsPageWrapper>
  );
};

export default WCoreSettings;
