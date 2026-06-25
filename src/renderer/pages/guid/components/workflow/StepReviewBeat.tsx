/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * StepReviewBeat - amber-accented review card rendered when `run_mode === 'awaiting_input'`.
 *
 * Presents three actions:
 *  - Accept & continue  -> `onAccept()` which calls `resumeRun()`
 *  - Revise this step   -> `onRevise()` which sends a "please revise" prompt
 *  - Go back to step N  -> `onGoBack()` which calls `backtrackToStep(currentStep - 1)`
 *
 * Part of the Phase 3 collaborative-model design (mockup-collaborative.html
 * `.review-beat` section). Replaces the old `continueBar` in WorkflowSurface.
 */

import React from 'react';
import { Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

import styles from './StepReviewBeat.module.css';

export type StepReviewBeatProps = {
  currentStep: number;
  totalSteps: number;
  /** Resume the driver loop (accept the current step output). */
  onAccept: () => void;
  /**
   * Revise the current step: sends a "Please revise step N" message to the
   * agent so it rewrites the step output before the driver loop advances.
   */
  onRevise: () => void;
  /**
   * Backtrack to the previous step. Guard: only rendered when currentStep > 1.
   * Calls `backtrackToStep(currentStep - 1)`.
   */
  onGoBack: () => void;
};

export const StepReviewBeat: React.FC<StepReviewBeatProps> = ({
  currentStep,
  totalSteps,
  onAccept,
  onRevise,
  onGoBack,
}) => {
  const { t } = useTranslation();
  const canGoBack = currentStep > 1;

  return (
    <div className={styles.root} data-testid='workflow-step-review-beat'>
      <div className={styles.text}>
        <strong className={styles.title}>{t('workflow.review.title', 'Happy with this step?')}</strong>
        <span className={styles.subtitle}>
          {t(
            'workflow.review.subtitle',
            'Accept to continue, revise this step, or go back.'
          )}
        </span>
      </div>
      <div className={styles.actions}>
        <Button
          type='primary'
          size='small'
          onClick={onAccept}
          data-testid='workflow-review-accept'
        >
          {t('workflow.review.accept', 'Accept & continue')}
        </Button>
        <Button
          type='secondary'
          size='small'
          onClick={onRevise}
          data-testid='workflow-review-revise'
        >
          {t('workflow.review.revise', 'Revise this step')}
        </Button>
        {canGoBack && (
          <Button
            type='text'
            size='small'
            onClick={onGoBack}
            data-testid='workflow-review-go-back'
          >
            {t('workflow.review.goBack', 'Go back to step {{n}}', { n: currentStep - 1 })}
          </Button>
        )}
      </div>
      <div className={styles.progress}>
        {t('workflow.rail.title', 'Steps')} {currentStep} / {totalSteps}
      </div>
    </div>
  );
};

export default StepReviewBeat;
