import { Button } from '@arco-design/web-react';
import { AlertTriangle } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import UsageCard from './UsageCard';
import DirectoriesCard from './DirectoriesCard';
import BackupCard from './BackupCard';
import SyncCard from './SyncCard';
import ManagedWorkspacesCard from './ManagedWorkspacesCard';
import FolderAccessCard from './FolderAccessCard';
import { FOLDER_GRANT_REPLAY_AVAILABLE } from '@/common/chat/pathBoundaryConsent';
import TransferCard from './TransferCard';

const StorageSettings: React.FC = () => {
  const { t } = useTranslation();
  return (
    <SettingsPageShell
      title={t('settings.sider.storage')}
      subtitle={t(
        'settings.storagePage.subtitleLine',
        'Where Wayland keeps your data on disk, plus backup and end-to-end encrypted sync.'
      )}
    >
      <UsageCard />
      <ManagedWorkspacesCard />
      {/* Hidden while a remembered folder is not re-applied at session start:
          the list would only ever be empty, and an empty list of folders the
          user believes they granted is its own false statement. One constant
          brings the card and the consent button back together. */}
      {FOLDER_GRANT_REPLAY_AVAILABLE ? <FolderAccessCard /> : null}
      <DirectoriesCard />
      <TransferCard />
      <BackupCard />
      <SyncCard />

      {/* Danger zone */}
      <div className='flex items-center justify-between gap-16px px-16px py-12px rounded-8px bg-[var(--danger-soft-bg)] border border-[var(--danger-soft-border)]'>
        <div className='flex items-center gap-10px'>
          <AlertTriangle size={16} className='text-[var(--danger)] shrink-0' />
          <div className='flex flex-col gap-2px'>
            <span className='text-13px font-medium text-[var(--text-primary)]'>
              {t('settings.storagePage.resetTitle')}
            </span>
            <span className='text-12px text-[var(--text-secondary)]'>{t('settings.storagePage.resetDescription')}</span>
            <span className='text-11px text-[var(--color-text-3)]'>
              {t('settings.storagePage.resetRecoveryRequired')}
            </span>
          </div>
        </div>
        <Button size='small' status='danger' disabled>
          {t('settings.storagePage.resetUnavailable')}
        </Button>
      </div>
    </SettingsPageShell>
  );
};

export default StorageSettings;
