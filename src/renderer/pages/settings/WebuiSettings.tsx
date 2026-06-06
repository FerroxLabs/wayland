/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import WebuiModalContent from '@/renderer/components/settings/SettingsModal/contents/WebuiModalContent';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import PairedDevicesCard from './WebuiSettings/PairedDevicesCard';
import ActivityLogCard from './WebuiSettings/ActivityLogCard';

const WebuiSettings: React.FC = () => {
  return (
    <SettingsPageWrapper>
      <WebuiModalContent />
      <div className="flex flex-col gap-12px mt-12px px-[12px] md:px-[28px]">
        <PairedDevicesCard />
        <ActivityLogCard />
      </div>
    </SettingsPageWrapper>
  );
};

export default WebuiSettings;
