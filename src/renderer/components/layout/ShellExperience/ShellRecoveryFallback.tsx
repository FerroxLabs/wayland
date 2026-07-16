/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

export type ShellRecoveryPersistenceState = 'saving' | 'saved' | 'failed';

type ShellRecoveryFallbackProps = Readonly<{
  error: Error;
  persistenceState: ShellRecoveryPersistenceState;
  onRetry: () => void;
  onClose: () => void;
}>;

const ShellRecoveryFallback: React.FC<ShellRecoveryFallbackProps> = ({ error, persistenceState, onRetry, onClose }) => {
  const { t } = useTranslation();

  return (
    <aside
      className='fixed right-20px top-56px z-200 w-[min(520px,calc(100vw-40px))] rd-16px border border-solid border-border bg-2 p-20px shadow-lg'
      data-testid='shell-recovery-fallback'
      data-persistence-state={persistenceState}
      aria-live='polite'
    >
      <section>
        <p className='m-0 text-12px font-semibold uppercase tracking-0.08em text-t-secondary'>Cockpit preview</p>
        <h1 className='mt-8px mb-8px text-22px text-t-primary'>This view could not open safely.</h1>
        <p className='m-0 mb-20px text-14px leading-22px text-t-secondary'>
          Classic is active for this session. Your chats, Projects, settings, agent state, and current route have not
          moved.
        </p>
        {persistenceState === 'failed' && (
          <p className='m-0 mb-12px text-14px text-status-error' role='alert'>
            {t('common.saveFailed')}
          </p>
        )}
        {process.env.NODE_ENV === 'development' && (
          <pre className='mb-16px max-h-120px overflow-auto rd-8px bg-fill-1 p-12px text-12px'>{error.message}</pre>
        )}
        <div className='flex justify-end gap-8px'>
          <Button onClick={onClose} data-testid='shell-recovery-close'>
            {t('common.close')}
          </Button>
          {persistenceState !== 'saved' && (
            <Button
              type='primary'
              loading={persistenceState === 'saving'}
              onClick={onRetry}
              data-testid='shell-recovery-retry'
            >
              {t('common.retry')}
            </Button>
          )}
        </div>
      </section>
    </aside>
  );
};

export default ShellRecoveryFallback;
