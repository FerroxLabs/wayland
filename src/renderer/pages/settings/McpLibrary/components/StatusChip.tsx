/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Check, LogIn, RefreshCw } from 'lucide-react';
import type { UIStatus } from '../status';
import styles from '../McpLibrary.module.css';

export type StatusChipProps = {
  status: UIStatus;
  className?: string;
};

const ICON_SIZE = 11;

/**
 * Compact status chip shared by the Browse cards and Installed rows. Mirrors
 * the 4-state UIStatus model: a stopped server shows nothing (returns null),
 * the other three each get a colored chip with an icon + short English label
 * (an i18n wave swaps the literals later).
 */
const StatusChip: React.FC<StatusChipProps> = ({ status, className }) => {
  const { t } = useTranslation();
  if (status === 'running') {
    return (
      <span className={classNames(styles.statusChip, styles.statusChipOk, className)}>
        <Check size={ICON_SIZE} />
        {t('mcpLibrary.status.connected', 'Connected')}
      </span>
    );
  }
  if (status === 'warn') {
    return (
      <span className={classNames(styles.statusChip, styles.statusChipWarn, className)}>
        <LogIn size={ICON_SIZE} />
        {t('mcpLibrary.status.signIn', 'Sign in')}
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className={classNames(styles.statusChip, styles.statusChipErr, className)}>
        <RefreshCw size={ICON_SIZE} />
        {t('mcpLibrary.status.reconnect', 'Reconnect')}
      </span>
    );
  }
  return null;
};

export default StatusChip;
