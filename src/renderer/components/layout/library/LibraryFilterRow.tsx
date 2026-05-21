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
};

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
}) => (
  <div
    role='button'
    tabIndex={0}
    aria-pressed={active}
    data-testid={testId}
    className={classNames(styles.row, active && styles.rowActive)}
    onClick={onClick}
    onKeyDown={handleKey(onClick)}
  >
    <span className={styles.label}>{label}</span>
    {count != null ? <span className={styles.count}>{count}</span> : null}
  </div>
);

export default LibraryFilterRow;
