import React, { useState } from 'react';
import { Button, Tag } from '@arco-design/web-react';
import { Cloud, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '@renderer/components/settings/shared/cards/Card';
import ConfirmDialog from '@renderer/components/settings/shared/dialogs/ConfirmDialog';
import { useSyncStatus } from '@renderer/hooks/useSyncStatus';
import { sync } from '@/common/adapter/ipcBridge';
import SyncPassphraseDialog from './SyncPassphraseDialog';

const formatRelative = (ts: number | undefined, label: string): string => {
  if (!ts) return label;
  const delta = Date.now() - ts;
  const s = Math.floor(delta / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const SyncCard: React.FC = () => {
  const { t } = useTranslation();
  const { status, refresh } = useSyncStatus();
  const [enableOpen, setEnableOpen] = useState(false);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const title = (
    <div className='flex items-center gap-8px'>
      <Cloud size={16} className='text-[var(--brand)]' />
      <span>{t('settings.storagePage.sync.title')}</span>
      <Tag color='orange' size='small' bordered>
        {t('settings.storagePage.sync.betaTag')}
      </Tag>
    </div>
  );

  if (!status.enabled) {
    return (
      <>
        <Card title={title}>
          <div className='flex flex-col gap-12px'>
            <div className='text-13px text-[var(--text-secondary)] leading-relaxed'>
              {t('settings.storagePage.sync.disabledDescription')}
            </div>
            <div className='flex justify-end'>
              <Button type='primary' onClick={() => setEnableOpen(true)}>
                {t('settings.storagePage.sync.enableButton')}
              </Button>
            </div>
          </div>
        </Card>
        <SyncPassphraseDialog
          open={enableOpen}
          onClose={() => setEnableOpen(false)}
          onEnabled={refresh}
        />
      </>
    );
  }

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await sync.forceSync.invoke();
      await refresh();
    } finally {
      setSyncing(false);
    }
  };

  const handleDisable = async () => {
    await sync.disable.invoke();
    await refresh();
  };

  return (
    <>
      <Card title={title}>
        <div className='flex flex-col gap-12px'>
          <div className='flex items-center gap-10px text-13px'>
            <ShieldCheck size={14} className='text-[var(--success)]' />
            <span className='text-[var(--text-primary)]'>
              {t('settings.storagePage.sync.enabledStatus')}
            </span>
            <span className='text-[var(--text-muted)]'>·</span>
            <span className='text-[var(--text-muted)]'>
              {t('settings.storagePage.sync.lastSync')}{': '}
              {formatRelative(status.lastSync, t('settings.storagePage.sync.never'))}
            </span>
            {typeof status.itemsCount === 'number' && (
              <>
                <span className='text-[var(--text-muted)]'>·</span>
                <span className='text-[var(--text-muted)]'>
                  {t('settings.storagePage.sync.itemsCount', { count: status.itemsCount })}
                </span>
              </>
            )}
          </div>
          <div className='flex justify-end gap-8px'>
            <Button onClick={() => setDisableConfirmOpen(true)}>
              {t('settings.storagePage.sync.disableButton')}
            </Button>
            <Button type='primary' loading={syncing} onClick={handleSyncNow}>
              {t('settings.storagePage.sync.syncNow')}
            </Button>
          </div>
        </div>
      </Card>
      <ConfirmDialog
        open={disableConfirmOpen}
        onClose={() => setDisableConfirmOpen(false)}
        onConfirm={handleDisable}
        title={t('settings.storagePage.sync.disableConfirmTitle')}
        body={t('settings.storagePage.sync.disableConfirmBody')}
        confirmLabel={t('settings.storagePage.sync.disableButton')}
        destructive
      />
    </>
  );
};

export default SyncCard;
