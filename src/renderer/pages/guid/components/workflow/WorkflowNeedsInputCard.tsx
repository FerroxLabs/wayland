/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowNeedsInputCard - the blue "your move" banner.
 *
 * Shown when the agent's turn has ended and the current step is not done (it
 * asked you something / is waiting on you). It is deliberately loud - blue,
 * a clear heading - and points to the ONE input that already exists: the
 * conversation composer at the bottom. There is no second input here, so the
 * user is never asked "which box?". Clicking the banner (or the run reaching
 * this state) focuses + scrolls to the composer.
 */

import { ArrowDown, MessageCircleQuestion } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './WorkflowNeedsInputCard.module.css';

export type WorkflowNeedsInputCardProps = {
  /** Focus + scroll the composer. Wired by the parent (it owns the composer DOM). */
  onActivate?: () => void;
};

export const WorkflowNeedsInputCard: React.FC<WorkflowNeedsInputCardProps> = ({ onActivate }) => {
  const { t } = useTranslation();
  return (
    <button
      type='button'
      className={styles.card}
      data-testid='workflow-needs-input-card'
      onClick={onActivate}
    >
      <span className={styles.icon}>
        <MessageCircleQuestion size={17} aria-hidden='true' />
      </span>
      <span className={styles.text}>
        <span className={styles.title}>
          {t('workflow.needsInput.title', { defaultValue: 'Wayland needs your input' })}
        </span>
        <span className={styles.sub}>
          {t('workflow.needsInput.sub', {
            defaultValue: 'Type your answer in the message box below and the run picks up where it left off.',
          })}
        </span>
      </span>
      <span className={styles.cue} aria-hidden='true'>
        <ArrowDown size={16} />
      </span>
    </button>
  );
};

export default WorkflowNeedsInputCard;
