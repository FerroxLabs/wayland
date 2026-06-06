/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import classNames from 'classnames';
import styles from './LibrarySectionHeader.module.css';

export type LibrarySectionHeaderProps = {
  label: string;
  count?: number;
  hint?: string;
  variant?: 'muted' | 'tier' | 'primary';
  divider?: boolean;
  testId?: string;
};

const LibrarySectionHeader: React.FC<LibrarySectionHeaderProps> = ({
  label,
  count,
  hint,
  variant = 'muted',
  divider = false,
  testId,
}) => (
  <header className={styles.sectionHeader} data-testid={testId}>
    <h2
      className={classNames(
        styles.title,
        variant === 'tier' && styles.titleTier,
        variant === 'primary' && styles.titlePrimary,
      )}
    >
      <span>{label}</span>
      {count != null ? <span className={styles.count}>· {count}</span> : null}
    </h2>
    {hint ? <span className={styles.hint}>{hint}</span> : null}
    {divider ? <div className={styles.divider} aria-hidden /> : null}
  </header>
);

export default LibrarySectionHeader;
