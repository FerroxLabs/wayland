/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * @api-frozen - Do not modify props or markup contract mid-wave. W1 agents depend on this.
 */

import { ChevronRight } from 'lucide-react';
import React, { useId } from 'react';
import classNames from 'classnames';
import styles from './SiderAccordionShell.module.css';

export interface SiderAccordionShellProps {
  icon: React.ReactNode;
  label: string;
  badgeCount: number;
  isLive: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  /** Optional override for badge aria-label (e.g. "3 in-flight workflows"). */
  badgeAriaLabel?: string;
  testId?: string;
}

export const SiderAccordionShell: React.FC<SiderAccordionShellProps> = ({
  icon,
  label,
  badgeCount,
  isLive,
  open,
  onToggle,
  children,
  badgeAriaLabel,
  testId,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  // Stable ID fallback when caller omits testId - prevents `undefined-body`
  // collisions across multiple accordions in the same tree.
  const reactId = useId();
  const bodyId = `${testId ?? reactId}-body`;
  const showBadge = badgeCount > 0;

  return (
    <div className={classNames(styles.acc, open && styles.open)} data-testid={testId}>
      <div
        role='button'
        tabIndex={0}
        aria-expanded={open}
        aria-controls={bodyId}
        aria-label={label}
        className={styles.header}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
      >
        <ChevronRight size={10} className={classNames(styles.chev, open && styles.chevOpen)} />
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
        {showBadge && (
          <span
            data-testid='sider-accordion-badge'
            className={classNames(styles.badge, isLive && styles.live, isLive && 'live')}
            role='status'
            aria-live='polite'
            aria-label={badgeAriaLabel ?? `${badgeCount}`}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
      {open && (
        <div id={bodyId} className={styles.body}>
          {children}
        </div>
      )}
    </div>
  );
};
