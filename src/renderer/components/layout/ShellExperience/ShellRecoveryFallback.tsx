/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

export type ShellRecoveryPersistenceState = 'idle' | 'saving' | 'saved' | 'failed';

type ShellRecoveryFallbackProps = Readonly<{
  error: Error;
  persistenceState: ShellRecoveryPersistenceState;
  onSaveDefault: () => void;
  onClose: () => void;
}>;

const ShellRecoveryFallback: React.FC<ShellRecoveryFallbackProps> = ({
  error,
  persistenceState,
  onSaveDefault,
  onClose,
}) => {
  const { t } = useTranslation();
  const actionLabel =
    persistenceState === 'failed'
      ? t('common.shellRecovery.retrySave')
      : persistenceState === 'saving'
        ? t('common.shellRecovery.savingDefault')
        : t('common.shellRecovery.useClassicDefault');

  return (
    <aside
      className='fixed right-20px top-56px z-200 w-[min(520px,calc(100vw-40px))] rd-16px border border-solid border-border bg-2 p-20px shadow-lg'
      data-testid='shell-recovery-fallback'
      data-persistence-state={persistenceState}
      aria-live='polite'
    >
      <section>
        <p className='m-0 text-12px font-semibold uppercase tracking-0.08em text-t-secondary'>
          {t('common.shellRecovery.preview')}
        </p>
        <h1 className='mt-8px mb-8px text-22px text-t-primary'>{t('common.shellRecovery.title')}</h1>
        <p className='m-0 mb-20px text-14px leading-22px text-t-secondary'>{t('common.shellRecovery.sessionBody')}</p>
        {persistenceState === 'saved' && (
          <p className='m-0 mb-12px text-14px text-success' role='status'>
            {t('common.shellRecovery.savedDefault')}
          </p>
        )}
        {persistenceState === 'failed' && (
          <p className='m-0 mb-12px text-14px text-status-error' role='alert'>
            {t('common.shellRecovery.saveFailed')}
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
              disabled={persistenceState === 'saving'}
              onClick={onSaveDefault}
              data-testid='shell-recovery-save-default'
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </section>
    </aside>
  );
};

export default ShellRecoveryFallback;
