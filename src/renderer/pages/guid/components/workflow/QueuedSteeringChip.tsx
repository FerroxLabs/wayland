/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * QueuedSteeringChip - informational chip rendered above the composer while
 * `run_mode === 'running'` (a step is executing).
 *
 * Tells the user their composer message is queued and will steer the next
 * step. The "Interrupt and apply now" affordance is rendered as a styled
 * element but is a no-op in Phase 3: a trivially-available stop/abort on
 * the running conversation does not exist on the current IPC surface.
 * TODO(W5): wire onInterrupt to a conversation abort/stop call when available.
 *
 * Part of the Phase 3 collaborative-model design (mockup-collaborative.html
 * `.qchip` section).
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './QueuedSteeringChip.module.css';

export type QueuedSteeringChipProps = {
  /**
   * Called when the user clicks "Interrupt and apply now".
   * Currently a no-op placeholder until a conversation stop IPC is available.
   * Pass undefined to render the affordance as visually present but non-functional.
   */
  onInterrupt?: () => void;
};

export const QueuedSteeringChip: React.FC<QueuedSteeringChipProps> = ({ onInterrupt }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.root} data-testid='workflow-queued-chip'>
      <span className={styles.text}>{t('workflow.composer.queued', 'Working on this step - your message is queued and will steer the next step.')}</span>
      {/* TODO(W5): wire to conversation stop IPC when available */}
      <button
        type='button'
        className={styles.interruptBtn}
        onClick={onInterrupt}
        aria-label={t('workflow.composer.interrupt', 'Interrupt and apply now')}
        disabled={onInterrupt == null}
        data-testid='workflow-queued-interrupt'
      >
        {t('workflow.composer.interrupt', 'Interrupt and apply now')}
      </button>
    </div>
  );
};

export default QueuedSteeringChip;
