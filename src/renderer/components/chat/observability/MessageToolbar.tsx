/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Tooltip } from '@arco-design/web-react';
import { Check, Copy, Like, Refresh, Unlike } from '@icon-park/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './MessageToolbar.module.css';

type Feedback = 'up' | 'down';

type Props = {
  text: string;
  onRegenerate?: () => void;
  onFeedback?: (value: Feedback | null) => void;
  revealed?: boolean;
  className?: string;
};

const COPIED_RESET_MS = 2000;

const MessageToolbar: React.FC<Props> = ({ text, onRegenerate, onFeedback, revealed, className }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(text);
      setFailed(false);
      setCopied(true);
      resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      // Surface the failure instead of swallowing it (no silent failure on a
      // primary action): the icon/tooltip flips to a "Copy failed" state.
      setCopied(false);
      setFailed(true);
      resetTimer.current = setTimeout(() => setFailed(false), COPIED_RESET_MS);
    }
  }, [text]);

  const handleFeedback = useCallback(
    (value: Feedback) => {
      const next = feedback === value ? null : value;
      setFeedback(next);
      onFeedback?.(next);
    },
    [feedback, onFeedback]
  );

  const containerClass = [styles.toolbar, revealed ? styles.revealed : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass} role='toolbar'>
      <Tooltip
        content={
          failed
            ? t('conversation.toolbar.copyFailed', { defaultValue: 'Copy failed' })
            : copied
              ? t('conversation.toolbar.copied', { defaultValue: 'Copied' })
              : t('conversation.toolbar.copy', { defaultValue: 'Copy' })
        }
      >
        <Button
          type='text'
          size='mini'
          className={failed ? styles.failed : copied ? styles.success : styles.button}
          aria-label={t('conversation.toolbar.copy', { defaultValue: 'Copy' })}
          icon={copied ? <Check size='16' /> : <Copy size='16' />}
          onClick={handleCopy}
        />
      </Tooltip>

      {onRegenerate && (
        <Tooltip content={t('conversation.toolbar.regenerate', { defaultValue: 'Regenerate' })}>
          <Button
            type='text'
            size='mini'
            className={styles.button}
            aria-label={t('conversation.toolbar.regenerate', { defaultValue: 'Regenerate' })}
            icon={<Refresh size='16' />}
            onClick={onRegenerate}
          />
        </Tooltip>
      )}

      <Tooltip content={t('conversation.toolbar.thumbsUp', { defaultValue: 'Good response' })}>
        <Button
          type='text'
          size='mini'
          className={feedback === 'up' ? styles.selected : styles.button}
          aria-label={t('conversation.toolbar.thumbsUp', { defaultValue: 'Good response' })}
          aria-pressed={feedback === 'up'}
          icon={<Like size='16' />}
          onClick={() => handleFeedback('up')}
        />
      </Tooltip>

      <Tooltip content={t('conversation.toolbar.thumbsDown', { defaultValue: 'Bad response' })}>
        <Button
          type='text'
          size='mini'
          className={feedback === 'down' ? styles.selected : styles.button}
          aria-label={t('conversation.toolbar.thumbsDown', { defaultValue: 'Bad response' })}
          aria-pressed={feedback === 'down'}
          icon={<Unlike size='16' />}
          onClick={() => handleFeedback('down')}
        />
      </Tooltip>
    </div>
  );
};

export default MessageToolbar;
