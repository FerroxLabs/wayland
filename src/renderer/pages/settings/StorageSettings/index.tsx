import { Button, Input, Message, Modal } from '@arco-design/web-react';
import { AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import { storage } from '@/common/adapter/ipcBridge';
import UsageCard from './UsageCard';
import DirectoriesCard from './DirectoriesCard';
import BackupCard from './BackupCard';
import SyncCard from './SyncCard';

const StorageSettings: React.FC = () => {
  const { t } = useTranslation();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (resetText !== 'reset') return;
    setResetting(true);
    try {
      await storage.resetAll.invoke();
      setResetOpen(false);
    } catch (error) {
      console.error('Storage reset failed:', error);
      Message.error(t('settings.storagePage.resetFailed'));
    } finally {
      setResetting(false);
    }
  };

  return (
    <SettingsPageShell
      title={t('settings.sider.storage')}
      subtitle={t(
        'settings.storagePage.subtitleLine',
        'Where Wayland keeps your data on disk, plus backup and end-to-end encrypted sync.'
      )}
    >
      <UsageCard />
      <DirectoriesCard />
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
          </div>
        </div>
        <Button size='small' status='danger' onClick={() => setResetOpen(true)}>
          {t('settings.storagePage.resetAction')}
        </Button>
      </div>

      <Modal
        visible={resetOpen}
        onCancel={() => {
          setResetOpen(false);
          setResetText('');
        }}
        title={
          <div className='flex items-center gap-8px'>
            <AlertTriangle size={18} className='text-[var(--danger)]' />
            <span>{t('settings.storagePage.resetConfirmTitle')}</span>
          </div>
        }
        footer={
          <div className='flex justify-end gap-8px'>
            <Button
              onClick={() => {
                setResetOpen(false);
                setResetText('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type='primary'
              status='danger'
              disabled={resetText !== 'reset'}
              loading={resetting}
              onClick={handleReset}
            >
              {t('settings.storagePage.resetAction')}
            </Button>
          </div>
        }
      >
        <p className='text-13px text-[var(--text-secondary)] mb-12px'>{t('settings.storagePage.resetConfirmBody')}</p>
        <Input
          value={resetText}
          onChange={setResetText}
          placeholder={t('settings.storagePage.resetTypePlaceholder')}
          size='small'
        />
      </Modal>
    </SettingsPageShell>
  );
};

export default StorageSettings;
