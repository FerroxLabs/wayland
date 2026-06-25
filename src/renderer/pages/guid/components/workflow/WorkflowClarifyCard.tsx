/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowClarifyCard - pre-run setup card shown once after the launch overlay.
 *
 * Asks two things before the run begins:
 *  1. Step-by-step vs Auto-run mode picker.
 *  2. Optional context note for the agent.
 *
 * Styled to match StepReviewBeat (sibling card pattern).
 */

import { Button, Input, Radio } from '@arco-design/web-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { WorkflowInteractivity } from '@/common/types/workflowTypes';

import styles from './WorkflowClarifyCard.module.css';

export type WorkflowClarifyCardProps = {
  workflowTitle: string;
  mode: WorkflowInteractivity;
  onSetMode: (m: WorkflowInteractivity) => void;
  onStart: (note: string) => void;
};

export const WorkflowClarifyCard: React.FC<WorkflowClarifyCardProps> = ({
  workflowTitle,
  mode,
  onSetMode,
  onStart,
}) => {
  const { t } = useTranslation();
  const [note, setNote] = useState('');

  return (
    <div className={styles.root} data-testid='workflow-clarify-card'>
      <div className={styles.text}>
        <strong className={styles.title}>
          {t('workflow.clarify.title', 'Set up {{title}}', { title: workflowTitle })}
        </strong>
        <span className={styles.subtitle}>
          {t('workflow.clarify.subtitle', 'A couple of things before I begin.')}
        </span>
      </div>
      <div className={styles.modeRow}>
        <Radio.Group
          type='button'
          size='small'
          value={mode}
          onChange={(v) => onSetMode(v as WorkflowInteractivity)}
        >
          <Radio value='step'>{t('workflow.header.stepMode', 'Step-by-step')}</Radio>
          <Radio value='auto'>{t('workflow.header.autoMode', 'Auto-run')}</Radio>
        </Radio.Group>
      </div>
      <Input.TextArea
        className={styles.textarea}
        value={note}
        onChange={(v) => setNote(v)}
        placeholder={t(
          'workflow.clarify.notePlaceholder',
          'Anything specific I should know before I begin? (optional)'
        )}
        autoSize={{ minRows: 2, maxRows: 5 }}
      />
      <div className={styles.actions}>
        <Button
          type='primary'
          size='small'
          onClick={() => onStart(note)}
          data-testid='workflow-clarify-start'
        >
          {t('workflow.clarify.start', 'Start')}
        </Button>
      </div>
    </div>
  );
};

export default WorkflowClarifyCard;
