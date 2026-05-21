/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Input } from '@arco-design/web-react';
import { Search } from 'lucide-react';
import styles from './LibraryFilterRail.module.css';

export type LibraryFilterRailProps = {
  searchValue: string;
  onSearchChange: (next: string) => void;
  searchPlaceholder?: string;
  ariaLabel?: string;
  testId?: string;
  children?: React.ReactNode;
};

const LibraryFilterRail: React.FC<LibraryFilterRailProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  ariaLabel,
  testId,
  children,
}) => (
  <aside className={styles.rail} aria-label={ariaLabel} data-testid={testId}>
    <Input
      className={styles.search}
      prefix={<Search size={14} />}
      allowClear
      value={searchValue}
      onChange={onSearchChange}
      placeholder={searchPlaceholder}
    />
    {children}
  </aside>
);

export default LibraryFilterRail;
