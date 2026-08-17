import { Button, Checkbox, Input, Message, Modal } from '@arco-design/web-react';
import { Archive } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, PreferenceRow } from '@renderer/components/settings/shared';
import { storage } from '@/common/adapter/ipcBridge';
import type { LegacyBackupErrorCode } from '@/common/types/storageBackup';
import { isElectronDesktop } from '@renderer/utils/platform';
import { exportBackupHttp, restoreBackupHttp } from '@renderer/services/StorageService';
import type { RestoreReport } from '@renderer/services/StorageService';

/**
 * The desktop backup providers cannot reject - the IPC bridge has no error
 * channel, so a throwing provider leaves this component's `await` unsettled
 * forever. They return `{ok:false, failed:true, errorCode}` instead, and
 * `failed` is what separates a real failure from the user cancelling the native
 * file dialog. Cancelling must stay silent; failing must be reported.
 */
const restoreErrorKey = (code?: LegacyBackupErrorCode): string =>
  code === 'BAD_PASSPHRASE' ? 'restoreBadPassphrase' : 'restoreFailed';

const exportErrorKey = (code?: LegacyBackupErrorCode): string =>
  code === 'PASSPHRASE_REQUIRED' ? 'exportPassphraseRequired' : 'exportFailed';

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
        const result = await storage.exportAll.invoke(opts);
        if (!result.ok) {
          // Cancelling the native save dialog is not a failure and must stay
          // silent; anything else must be named, or the button just stops.
          if (result.failed) Message.error(t(`settings.storagePage.${exportErrorKey(result.errorCode)}`));
          return;
        }
        // Asking for keys and getting none is the norm on a modern install:
        // provider credentials live in the primary database, which a legacy
        // file export does not cover. Say so rather than claim a plain
        // success the archive does not back up (#1021).
        if (result.keysRequestedButAbsent) {
          Message.warning({ content: t('settings.storagePage.exportNoKeys'), duration: 12000 });
          return;
        }
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

  // Both surfaces open the same dialog. The desktop one exists purely to
  // collect the backup passphrase: without it the importer silently drops the
  // archive's encrypted keys, which is how a restore could report success and
  // leave the user with no keys at all (#1021).
  const handleRestoreClick = () => setRestoreOpen(true);

  const closeRestore = () => {
    setRestoreOpen(false);
    setRestoreFile(null);
    setRestorePassword('');
    setRestorePassphrase('');
  };

  /**
   * ONE reporter for both surfaces.
   *
   * The desktop caller was taught to report `applied` and the WebUI caller was
   * not, so #1021 stayed fully live on the WebUI while being fixed on the
   * desktop: the HTTP route discarded the ImportReport and the browser showed a
   * flat "Restore complete" over a no-op. Sharing the decision is what stops the
   * two surfaces drifting apart again, rather than remembering to change both.
   */
  const reportRestore = (report: RestoreReport) => {
    const applied = report.applied ?? [];
    const items = applied.join(', ');
    if (applied.length === 0 && report.keysSkippedNoPassphrase) {
      // A keys-only archive with no passphrase. Tested BEFORE the generic
      // nothing-applied case, because that copy says the archive held no
      // legacy files and that API keys live somewhere a file export does not
      // cover - and for this archive every clause of that is false. The keys
      // ARE in it, one passphrase away. Telling the user otherwise is the
      // same class of harm as #1021 itself.
      Message.warning({ content: t('settings.storagePage.restoreKeysOnlyNoPassphrase'), duration: 15000 });
      return;
    }
    if (applied.length === 0) {
      // The archive parsed and staged cleanly and still moved nothing.
      // Reporting success here is what turned a no-op into silent data
      // loss for the reporter of #1021. An absent `applied` lands here too, on
      // purpose: a warning that names no data is recoverable, a success claim
      // over data that never moved is not.
      Message.warning({ content: t('settings.storagePage.restoreNothingApplied'), duration: 15000 });
      return;
    }
    if (report.keysSkippedNoPassphrase) {
      Message.warning({ content: t('settings.storagePage.restoreKeysSkipped', { items }), duration: 15000 });
      return;
    }
    Message.success(
      report.safetyBackupPath
        ? t('settings.storagePage.restoreAppliedWithSafety', { items, path: report.safetyBackupPath })
        : t('settings.storagePage.restoreApplied', { items })
    );
  };

  const submitRestore = async () => {
    if (isDesktop) {
      setRestoring(true);
      setImporting(true);
      try {
        const result = await storage.importBackup.invoke({ passphrase: restorePassphrase || undefined });
        if (!result.ok) {
          // ok:false with no `failed` means the OS file picker was cancelled -
          // nothing to report. With `failed` the restore really did fail, and
          // saying nothing is what left a mistyped passphrase looking like a
          // frozen panel.
          if (result.failed) Message.error(t(`settings.storagePage.${restoreErrorKey(result.errorCode)}`));
          // A wrong passphrase is retryable, so leave the dialog open with what
          // they typed. Closing it and clearing the field is a poor answer to a
          // typo. Anything else is not retryable from here.
          if (result.errorCode !== 'BAD_PASSPHRASE') closeRestore();
          return;
        }
        reportRestore(result);
        closeRestore();
      } catch {
        Message.error(t('settings.storagePage.restoreFailed'));
      } finally {
        setRestoring(false);
        setImporting(false);
      }
      return;
    }
    if (!restoreFile || !restorePassword) return;
    setRestoring(true);
    try {
      const result = await restoreBackupHttp({
        file: restoreFile,
        password: restorePassword,
        passphrase: restorePassphrase || undefined,
      });
      reportRestore(result);
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
      <div className='mb-12px rounded-8px bg-fill-2 px-12px py-10px text-12px text-t-secondary leading-relaxed'>
        {t('settings.storagePage.backupScopeWarning')}
      </div>

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
        {/* Exporting keys with no passphrase cannot succeed - backupExport refuses
            it - so stop the click rather than only reporting it afterwards. */}
        <Button
          type='primary'
          size='small'
          loading={exporting}
          disabled={includeKeys && !passphrase}
          onClick={() => void handleExport()}
        >
          {t('settings.storagePage.exportAll')}
        </Button>
        <Button size='small' loading={importing} onClick={handleRestoreClick}>
          {t('settings.storagePage.restore')}
        </Button>
      </div>

      <Modal
        title={t('settings.storagePage.restoreModalTitle')}
        visible={restoreOpen}
        onCancel={closeRestore}
        onOk={() => void submitRestore()}
        okText={t('settings.storagePage.restoreConfirm')}
        confirmLoading={restoring}
        okButtonProps={{ status: 'danger', disabled: !isDesktop && (!restoreFile || !restorePassword) }}
      >
        <div className='flex flex-col gap-12px'>
          <div className='text-12px text-t-tertiary leading-relaxed'>{t('settings.storagePage.restoreWarning')}</div>

          {/* Desktop picks the archive through the native dialog in the main
              process, and has no WebUI operator password to step up against. */}
          {!isDesktop && (
            <>
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
                <div className='text-12px text-t-secondary mb-4px'>
                  {t('settings.storagePage.restorePasswordLabel')}
                </div>
                <Input
                  type='password'
                  value={restorePassword}
                  onChange={setRestorePassword}
                  placeholder={t('settings.storagePage.restorePasswordHint')}
                  size='small'
                />
              </div>
            </>
          )}

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
    </Card>
  );
};

export default BackupCard;
