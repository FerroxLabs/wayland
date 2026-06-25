import { Button, Checkbox, Input, Message, Modal } from '@arco-design/web-react';
import { Archive } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, PreferenceRow } from '@renderer/components/settings/shared';
import { storage } from '@/common/adapter/ipcBridge';
import { isElectronDesktop } from '@renderer/utils/platform';
import { exportBackupHttp, restoreBackupHttp } from '@renderer/services/StorageService';

const BackupCard: React.FC = () => {
  const { t } = useTranslation();
  const isDesktop = isElectronDesktop();
  const [includeKeys, setIncludeKeys] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Browser restore step-up dialog state.
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassword, setRestorePassword] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [restoring, setRestoring] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const opts = { includeKeys, passphrase: includeKeys ? passphrase : undefined };
      if (isDesktop) {
        await storage.exportAll.invoke(opts);
      } else {
        await exportBackupHttp(opts);
      }
      Message.success(t('settings.storagePage.exportSuccess'));
    } catch {
      Message.error(t('settings.storagePage.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleRestoreClick = () => {
    if (isDesktop) {
      setImporting(true);
      void storage.importBackup.invoke({}).finally(() => setImporting(false));
      return;
    }
    setRestoreOpen(true);
  };

  const closeRestore = () => {
    setRestoreOpen(false);
    setRestoreFile(null);
    setRestorePassword('');
    setRestorePassphrase('');
  };

  const submitRestore = async () => {
    if (!restoreFile || !restorePassword) return;
    setRestoring(true);
    try {
      await restoreBackupHttp({
        file: restoreFile,
        password: restorePassword,
        passphrase: restorePassphrase || undefined,
      });
      Message.success(t('settings.storagePage.restoreSuccess'));
      closeRestore();
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      const key =
        code === 'RESTORE_NOT_OPERATOR'
          ? 'restoreNotOperator'
          : code === 'RESTORE_BAD_PASSWORD'
            ? 'restoreBadPassword'
            : code === 'FILE_TOO_LARGE'
              ? 'restoreTooLarge'
              : 'restoreFailed';
      Message.error(t(`settings.storagePage.${key}`));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Card title={t('settings.storagePage.backupTitle')} titleIcon={Archive}>
      <PreferenceRow label={t('settings.storagePage.exportIncludeKeys')}>
        <Checkbox checked={includeKeys} onChange={setIncludeKeys} />
      </PreferenceRow>

      {includeKeys && (
        <PreferenceRow label={t('settings.storagePage.exportPassphraseLabel')}>
          <Input
            type='password'
            value={passphrase}
            onChange={setPassphrase}
            placeholder={t('settings.storagePage.exportPassphrasePlaceholder')}
            style={{ width: 220 }}
            size='small'
          />
        </PreferenceRow>
      )}

      <div className='flex gap-8px mt-4px'>
        <Button type='primary' size='small' loading={exporting} onClick={() => void handleExport()}>
          {t('settings.storagePage.exportAll')}
        </Button>
        <Button size='small' loading={importing} onClick={handleRestoreClick}>
          {t('settings.storagePage.restore')}
        </Button>
      </div>

      {!isDesktop && (
        <Modal
          title={t('settings.storagePage.restoreModalTitle')}
          visible={restoreOpen}
          onCancel={closeRestore}
          onOk={() => void submitRestore()}
          okText={t('settings.storagePage.restoreConfirm')}
          confirmLoading={restoring}
          okButtonProps={{ status: 'danger', disabled: !restoreFile || !restorePassword }}
        >
          <div className='flex flex-col gap-12px'>
            <div className='text-12px text-t-tertiary leading-relaxed'>{t('settings.storagePage.restoreWarning')}</div>

            <input
              ref={fileRef}
              type='file'
              accept='.zip'
              className='hidden'
              onChange={(e) => setRestoreFile(e.target.files?.[0] ?? null)}
            />
            <div className='flex items-center gap-8px'>
              <Button size='small' onClick={() => fileRef.current?.click()}>
                {t('settings.storagePage.restorePickFile')}
              </Button>
              <span className='text-12px text-t-secondary break-all'>
                {restoreFile?.name ?? t('settings.storagePage.restoreNoFile')}
              </span>
            </div>

            <div>
              <div className='text-12px text-t-secondary mb-4px'>{t('settings.storagePage.restorePasswordLabel')}</div>
              <Input
                type='password'
                value={restorePassword}
                onChange={setRestorePassword}
                placeholder={t('settings.storagePage.restorePasswordHint')}
                size='small'
              />
            </div>

            <div>
              <div className='text-12px text-t-secondary mb-4px'>{t('settings.storagePage.restorePassphraseLabel')}</div>
              <Input
                type='password'
                value={restorePassphrase}
                onChange={setRestorePassphrase}
                placeholder={t('settings.storagePage.restorePassphraseHint')}
                size='small'
              />
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};

export default BackupCard;
