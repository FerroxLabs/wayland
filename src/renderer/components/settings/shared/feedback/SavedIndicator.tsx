import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type SavedIndicatorProps = {
  state: SaveState;
};

const SavedIndicator: React.FC<SavedIndicatorProps> = ({ state }) => {
  const { t } = useTranslation();

  if (state === 'idle') return null;

  return (
    <span className='inline-flex items-center gap-4px text-12px'>
      {state === 'saving' && (
        <>
          <Loader2 size={12} className='animate-spin text-[var(--text-muted)]' />
          <span className='text-[var(--text-muted)]'>{t('settings.shared.saving')}</span>
        </>
      )}
      {state === 'saved' && (
        <>
          <Check size={12} className='text-[var(--success)]' />
          <span className='text-[var(--success)]'>{t('settings.shared.saved')}</span>
        </>
      )}
      {state === 'error' && (
        <>
          <AlertCircle size={12} className='text-[var(--danger)]' />
          <span className='text-[var(--danger)]'>{t('settings.shared.saveFailed')}</span>
        </>
      )}
    </span>
  );
};

export default SavedIndicator;
