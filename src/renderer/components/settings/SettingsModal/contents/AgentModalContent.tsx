/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tabs, Message } from '@arco-design/web-react';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LocalAgents from '@/renderer/pages/settings/AgentSettings/LocalAgents';
import RemoteAgents from '@/renderer/pages/settings/AgentSettings/RemoteAgents';
import WaylandScrollArea from '@/renderer/components/base/WaylandScrollArea';
import { useSettingsViewMode } from '../settingsViewContext';

const AgentModalContent: React.FC = () => {
  const { t } = useTranslation();
  const [agentMessage, agentMessageContext] = Message.useMessage({ maxCount: 10 });
  const viewMode = useSettingsViewMode();
  const isPageMode = viewMode === 'page';
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('local');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'remote' || tabParam === 'local') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  return (
    <div className='flex flex-col h-full w-full'>
      {agentMessageContext}

      <Tabs
        activeTab={activeTab}
        onChange={handleTabChange}
        type='line'
        className='flex flex-col flex-1 min-h-0 [&>.arco-tabs-content]:pt-0'
      >
        <Tabs.TabPane key='local' title={t('settings.agentManagement.localAgents')}>
          <WaylandScrollArea className='flex-1 min-h-0 pb-16px scrollbar-hide' disableOverflow={isPageMode}>
            <LocalAgents />
          </WaylandScrollArea>
        </Tabs.TabPane>
        <Tabs.TabPane key='remote' title={t('settings.agentManagement.remoteAgents')}>
          <WaylandScrollArea className='flex-1 min-h-0 pb-16px scrollbar-hide' disableOverflow={isPageMode}>
            <RemoteAgents />
          </WaylandScrollArea>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default AgentModalContent;
