/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import React from 'react';
import DisplayModalContent from '@/renderer/components/settings/SettingsModal/contents/DisplayModalContent';
import SettingsPageWrapper from '../components/SettingsPageWrapper';

const DisplaySettings: React.FC = () => {
  return (
    <SettingsPageWrapper>
      <DisplayModalContent />
    </SettingsPageWrapper>
  );
};

export default DisplaySettings;
