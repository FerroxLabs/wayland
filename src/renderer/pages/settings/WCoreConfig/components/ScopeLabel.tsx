/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HardDrive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from '../panes/Panes.module.css';

/**
 * The quiet config-scope line shown on every editable Wayland Core pane. Never
 * hard-code a home-relative path here: active named profiles, platform-native
 * defaults, and raw-engine launches intentionally resolve to different files.
 * The Runtime pane owns the actionable exact-path projection.
 */
const ScopeLabel: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.scopeLabel}>
      <HardDrive size={13} />
      <span>
        {t('settings.wcoreConfig.scopeProfileConfig', {
          defaultValue: 'Core settings used by new sessions. Runtime shows the exact config path for the current mode.',
        })}
      </span>
    </div>
  );
};

export default ScopeLabel;
