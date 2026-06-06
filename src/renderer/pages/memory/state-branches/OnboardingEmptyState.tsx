/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * OnboardingEmptyState - Wave 4 surface shown when IJFW is installed but has
 * no memories yet. Wave 5 will gate this branch on a real "has memories?"
 * check against the active brain scope; for now MemoryPage routes here for
 * any `installed_current` status (see MemoryPage.tsx).
 *
 * Layout: centered title + subtitle, an autofocused multiline textarea, three
 * clickable starter chips that pre-fill the textarea, and a submit button
 * that wires through `ipcBridge.ijfw.brainInvoke` with verb `memory_store`.
 * Success clears the textarea and surfaces an Arco toast.
 */

import { Button, Input, Message } from '@arco-design/web-react';
import type { RefTextAreaType } from '@arco-design/web-react/es/Input/textarea';
import { Sparkles } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import styles from './OnboardingEmptyState.module.css';

const OnboardingEmptyState: React.FC = () => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<RefTextAreaType>(null);

  useEffect(() => {
    // Autofocus the textarea on mount. Cleanup keeps this strict-mode-safe:
    // the second invocation's focus call is a no-op if the element is gone.
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (cancelled) return;
      textareaRef.current?.focus?.();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  const handleChipClick = useCallback((chipText: string) => {
    setValue(chipText);
    textareaRef.current?.focus?.();
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await ipcBridge.ijfw.brainInvoke.invoke({
        verb: 'memory_store',
        args: { content: trimmed },
      });
      if (result && result.ok) {
        setValue('');
        Message.success(t('memory.empty.save_ok'));
      } else {
        Message.error(t('memory.empty.save_err'));
      }
    } catch {
      Message.error(t('memory.empty.save_err'));
    } finally {
      setIsSubmitting(false);
    }
  }, [value, isSubmitting, t]);

  const chips: Array<{ key: string; text: string }> = [
    { key: 'chip1', text: t('memory.empty.chip1') },
    { key: 'chip2', text: t('memory.empty.chip2') },
    { key: 'chip3', text: t('memory.empty.chip3') },
  ];

  return (
    <div className={styles.center} data-testid='memory-onboarding-empty'>
      <div className={styles.card}>
        <h2 className='text-24px font-semibold text-t-primary leading-32px m-0 text-center'>
          {t('memory.empty.title')}
        </h2>
        <p className='text-14px text-t-secondary leading-22px m-0 text-center'>
          {t('memory.empty.subtitle')}
        </p>
        <Input.TextArea
          ref={textareaRef}
          value={value}
          onChange={setValue}
          placeholder={t('memory.empty.placeholder')}
          autoSize={{ minRows: 3, maxRows: 6 }}
          data-testid='memory-onboarding-empty-textarea'
        />
        <ul className={styles.chips}>
          {chips.map((chip) => (
            <li key={chip.key}>
              <Button
                type='secondary'
                size='small'
                className={styles.chip}
                onClick={() => handleChipClick(chip.text)}
                data-testid={`memory-onboarding-empty-${chip.key}`}
              >
                <span className={styles.chipInner}>
                  <Sparkles size={14} className={styles.chipIcon} aria-hidden />
                  <span>{chip.text}</span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <Button
            type='primary'
            size='large'
            loading={isSubmitting}
            disabled={isSubmitting || value.trim().length === 0}
            onClick={handleSubmit}
            data-testid='memory-onboarding-empty-submit'
          >
            {t('memory.empty.save_button')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingEmptyState;
