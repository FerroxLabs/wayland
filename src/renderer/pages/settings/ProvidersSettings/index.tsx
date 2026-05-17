import React from 'react';
import { Spin } from '@arco-design/web-react';
import { Plug2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import { useProviders } from '@renderer/hooks/useProviders';
import HeroConnectCard from './HeroConnectCard';
import ProviderConnectionCard from './ProviderConnectionCard';
import DefaultsPane from './DefaultsPane';

const ProvidersSettings = () => {
  const { t } = useTranslation();
  const { providers, defaults, loading, refresh, disconnect, setDefault, reload } = useProviders();

  const showEmptyState = !loading && providers.length === 0;

  return (
    <SettingsPageShell
      title={t('settings.providersPage.title')}
      subtitle={t(
        'settings.providersPage.subtitle',
        'Connect AI model providers. Paste a key to auto-detect the provider and fetch its model catalog.'
      )}
    >
      <HeroConnectCard onConnected={reload} />

      {loading && providers.length === 0 && (
        <div className='flex justify-center py-32px'>
          <Spin />
        </div>
      )}

      {showEmptyState && (
        <div className='flex flex-col items-center gap-8px py-24px text-center text-[var(--text-muted)]'>
          <Plug2 size={28} className='opacity-60' />
          <div className='text-13px'>
            {t(
              'settings.providersPage.emptyHint',
              'No providers connected yet. Paste a key above to get started.'
            )}
          </div>
        </div>
      )}

      {providers.length > 0 && (
        <div className='flex flex-col gap-12px'>
          {providers.map((p) => (
            <ProviderConnectionCard key={p.id} provider={p} onRefresh={refresh} onDisconnect={disconnect} />
          ))}
        </div>
      )}

      {providers.length > 0 && (
        <DefaultsPane providers={providers} defaults={defaults} onSetDefault={setDefault} />
      )}
    </SettingsPageShell>
  );
};

export default ProvidersSettings;
