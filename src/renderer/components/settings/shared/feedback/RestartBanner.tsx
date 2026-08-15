import React from 'react';
import { Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useRestartPending } from '@renderer/hooks/settings/useRestartPending';

const RestartBanner: React.FC = () => {
  const { t } = useTranslation();
  const { isPending, restartNow, discardChange } = useRestartPending();

  if (!isPending) return null;

  return (
    <div className='flex items-center gap-12px px-16px py-10px rounded-8px bg-[var(--warning)] bg-opacity-15 border border-[var(--warning)] border-opacity-40 mb-16px'>
      {/* The banner fill is a solid --warning (bg-opacity-15 is a no-op against an
          arbitrary var() background - UnoCSS emits the custom property but never
          the rgba() that would read it). So the label rides --warning-on, which
          flips with the mode, not --text-primary, which is 3.53:1 on the light fill. */}
      <span className='flex-1 text-13px text-[var(--warning-on)]'>{t('settings.shared.restartRequired')}</span>
      <Button size='small' status='warning' onClick={discardChange}>
        {t('settings.shared.discardChange')}
      </Button>
      <Button size='small' type='primary' status='warning' onClick={restartNow}>
        {t('settings.shared.restartNow')}
      </Button>
    </div>
  );
};

export default RestartBanner;
