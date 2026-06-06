/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Button, Input, InputNumber } from '@arco-design/web-react';
import { Send, Star } from 'lucide-react';

import type { AskRecord } from '@/common/types/workflowTypes';

import styles from './AskCard.module.css';

/**
 * Renders an `<ask>` marker as a focused, contextual input pinned to the
 * chat tape. Switches on `ask.type` to choose the right input shape:
 * text / number / choice / boolean / rating.
 *
 * The caller owns the ANSWER ENVELOPE wrapping (SPEC §7.1) - this
 * component just calls `onSubmit(rawAnswer)` with a plain string.
 *
 * Source of truth: SPEC §5.6 + §7.1.
 */

export type AskCardProps = {
  ask: AskRecord;
  /** Called with the user's answer as a plain string. Caller wraps in the envelope before sending. */
  onSubmit: (answer: string) => void;
  onSkip: () => void;
};

const SEND_LABEL = 'Send';
const SKIP_LABEL = 'or skip';
const ANSWERED_LABEL = '(answered)';

export const AskCard: React.FC<AskCardProps> = ({ ask, onSubmit, onSkip }) => {
  const [textValue, setTextValue] = useState('');
  const [numberValue, setNumberValue] = useState<number | undefined>(undefined);
  const [choiceValue, setChoiceValue] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);

  // Read-only collapsed state when this ask has already been answered.
  if (ask.answer !== null) {
    return (
      <div
        className={`${styles.root} ${styles.answered}`}
        data-testid='askcard'
        data-state='answered'
      >
        <div className={styles.question}>{ask.question}</div>
        <div className={styles.answeredRow}>
          <span className={styles.answeredAnswer}>{ask.answer}</span>
          <span className={styles.answeredLabel}>{ANSWERED_LABEL}</span>
        </div>
      </div>
    );
  }

  const handleSendText = (): void => {
    if (textValue.trim().length === 0) return;
    onSubmit(textValue);
  };

  const handleSendNumber = (): void => {
    if (numberValue === undefined || Number.isNaN(numberValue)) return;
    onSubmit(String(numberValue));
  };

  const handleSendChoice = (): void => {
    if (choiceValue === null) return;
    onSubmit(choiceValue);
  };

  const handleSendRating = (): void => {
    if (rating <= 0) return;
    onSubmit(String(rating));
  };

  const handleBoolean = (yes: boolean): void => {
    onSubmit(yes ? 'Yes' : 'No');
  };

  const placeholder = ask.placeholder ?? '';

  const renderInput = (): React.ReactNode => {
    switch (ask.type) {
      case 'text':
        return (
          <Input
            value={textValue}
            onChange={(v: string) => setTextValue(v)}
            placeholder={placeholder}
            onPressEnter={handleSendText}
            data-testid='askcard-text-input'
          />
        );
      case 'number':
        return (
          <InputNumber
            value={numberValue}
            onChange={(v: number | undefined) => setNumberValue(v)}
            placeholder={placeholder}
            style={{ width: '100%' }}
            data-testid='askcard-number-input'
          />
        );
      case 'choice': {
        const options = ask.options ?? [];
        return (
          <div className={styles.chipRow} data-testid='askcard-choice-row'>
            {options.map((option) => {
              const selected = choiceValue === option;
              return (
                <Button
                  key={option}
                  size='small'
                  type={selected ? 'primary' : 'secondary'}
                  shape='round'
                  onClick={() => setChoiceValue(option)}
                  aria-pressed={selected}
                >
                  {option}
                </Button>
              );
            })}
          </div>
        );
      }
      case 'boolean':
        return (
          <div className={styles.chipRow} data-testid='askcard-boolean-row'>
            <Button
              size='small'
              type='secondary'
              shape='round'
              onClick={() => handleBoolean(true)}
            >
              Yes
            </Button>
            <Button
              size='small'
              type='secondary'
              shape='round'
              onClick={() => handleBoolean(false)}
            >
              No
            </Button>
          </div>
        );
      case 'rating': {
        const max = ask.max ?? 5;
        const stars: number[] = [];
        for (let i = 1; i <= max; i += 1) stars.push(i);
        return (
          <div className={styles.starRow} data-testid='askcard-rating-row'>
            {stars.map((n) => {
              const filled = n <= rating;
              return (
                <Button
                  key={n}
                  size='mini'
                  type='text'
                  shape='circle'
                  className={`${styles.starBtn} ${filled ? styles.starBtnOn : ''}`}
                  onClick={() => setRating(n)}
                  aria-label={`Rate ${n}`}
                  data-testid={`askcard-star-${n}`}
                  data-filled={filled ? 'true' : 'false'}
                  icon={<Star size={16} fill={filled ? 'currentColor' : 'none'} />}
                />
              );
            })}
          </div>
        );
      }
      default:
        return null;
    }
  };

  const handleSend = (): void => {
    switch (ask.type) {
      case 'text':
        handleSendText();
        return;
      case 'number':
        handleSendNumber();
        return;
      case 'choice':
        handleSendChoice();
        return;
      case 'rating':
        handleSendRating();
        return;
      case 'boolean':
        // Boolean submits on click; Send is hidden.
        return;
    }
  };

  return (
    <div className={styles.root} data-testid='askcard' data-state='pending' data-type={ask.type}>
      <div className={styles.question}>{ask.question}</div>
      <div className={styles.inputZone}>{renderInput()}</div>
      {ask.type !== 'boolean' && (
        <div className={styles.actionRow}>
          <Button
            type='primary'
            size='small'
            icon={<Send size={12} />}
            onClick={handleSend}
            data-testid='askcard-send'
          >
            {SEND_LABEL}
          </Button>
          <Button
            type='text'
            size='mini'
            className={styles.skipLink}
            onClick={onSkip}
            data-testid='askcard-skip'
          >
            {SKIP_LABEL}
          </Button>
        </div>
      )}
      {ask.type === 'boolean' && (
        <div className={styles.actionRow}>
          <Button
            type='text'
            size='mini'
            className={styles.skipLink}
            onClick={onSkip}
            data-testid='askcard-skip'
          >
            {SKIP_LABEL}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AskCard;
