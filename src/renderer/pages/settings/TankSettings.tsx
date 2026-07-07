/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Settings > Tank — persistent home for the Tank (autopilot) connection, so it
 * can be changed anytime, not just from the Tank page's not-configured state.
 * The form itself is shared with that page (TankConnectionForm).
 */

import React from 'react';
import { Card } from '@renderer/components/settings/shared';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import TankConnectionForm from '@/renderer/components/tank/TankConnectionForm';

const TankSettings: React.FC = () => {
  return (
    <SettingsPageShell title='Tank' subtitle='Connect Wayland to a Tank autopilot server (URL + token).'>
      <Card>
        <div className='max-w-480px'>
          <TankConnectionForm />
        </div>
      </Card>
    </SettingsPageShell>
  );
};

export default TankSettings;
