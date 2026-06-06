/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import styles from './LibraryPageHeader.module.css';

export type LibraryPageHeaderProps = {
  title: string;
  countLabel?: string;
  testId?: string;
  countTestId?: string;
  children?: React.ReactNode;
};

const LibraryPageHeader: React.FC<LibraryPageHeaderProps> = ({
  title,
  countLabel,
  testId,
  countTestId,
  children,
}) => (
  <header className={styles.header} data-testid={testId}>
    <h1 className={styles.title}>
      <span className={styles.titleText}>{title}</span>
      {countLabel ? (
        <span className={styles.count} data-testid={countTestId}>
          {countLabel}
        </span>
      ) : null}
    </h1>
    {children ? <div className={styles.actions}>{children}</div> : null}
  </header>
);

export default LibraryPageHeader;
