/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import classNames from 'classnames';
import styles from './LibraryFilterRow.module.css';

export type LibraryFilterRowProps = {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  testId?: string;
  /** Leading icon (lucide at size 14), rendered before the label. */
  icon?: React.ReactNode;
  /** A 7px status dot before the label. Ignored when `icon` is also passed. */
  leadingDot?: 'ok' | 'warn' | 'neutral';
  /** When true AND active, use the MCP orange accent treatment instead of the default fill-2 active look. */
  accent?: boolean;
};

const dotClass = {
  ok: styles.dotOk,
  warn: styles.dotWarn,
  neutral: styles.dotNeutral,
} as const;

const handleKey =
  (handler: () => void): React.KeyboardEventHandler<HTMLDivElement> =>
  (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handler();
    }
  };

const LibraryFilterRow: React.FC<LibraryFilterRowProps> = ({
  label,
  count,
  active,
  onClick,
  testId,
  icon,
  leadingDot,
  accent,
}) => (
  <div
    role='button'
    tabIndex={0}
    aria-pressed={active}
    data-testid={testId}
    className={classNames(
      styles.row,
      active && styles.rowActive,
      accent && active && styles.rowAccentActive,
    )}
    onClick={onClick}
    onKeyDown={handleKey(onClick)}
  >
    {icon != null ? (
      <span className={styles.icon}>{icon}</span>
    ) : leadingDot != null ? (
      <span className={classNames(styles.dot, dotClass[leadingDot])} />
    ) : null}
    <span className={styles.label}>{label}</span>
    {count != null ? <span className={styles.count}>{count}</span> : null}
  </div>
);

export default LibraryFilterRow;
