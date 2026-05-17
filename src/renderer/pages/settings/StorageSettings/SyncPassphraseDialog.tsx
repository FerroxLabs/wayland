import React, { useState } from 'react';
import { Button, Input, Modal, Radio } from '@arco-design/web-react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dialog, sync } from '@/common/adapter/ipcBridge';

type Props = {
  open: boolean;
  onClose: () => void;
  onEnabled: () => void;
};

const MIN_PASSPHRASE_LEN = 16;

const SyncPassphraseDialog: React.FC<Props> = ({ open, onClose, onEnabled }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'passphrase' | 'backend'>('passphrase');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [backendType] = useState<'local-file'>('local-file');
  const [backendPath, setBackendPath] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passphraseValid =
    passphrase.length >= MIN_PASSPHRASE_LEN && passphrase === confirmPassphrase;

  const reset = () => {
    setStep('passphrase');
    setPassphrase('');
    setConfirmPassphrase('');
    setBackendPath('');
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickFolder = async () => {
    const result = await dialog.showOpen.invoke({ properties: ['openDirectory'] });
    if (result && Array.isArray(result) && typeof result[0] === 'string') {
      setBackendPath(result[0]);
    }
  };

  const enable = async () => {
    if (!backendPath) {
      setError(t('settings.storagePage.sync.pickFolderFirst'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await sync.enable.invoke({ passphrase, backendType, backendPath });
      onEnabled();
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={open}
      onCancel={handleClose}
      title={
        <div className='flex items-center gap-8px'>
          <AlertTriangle size={18} className='text-[var(--warning)]' />
          <span>{t('settings.storagePage.sync.enableTitle')}</span>
        </div>
      }
      footer={null}
      maskClosable={false}
    >
      {step === 'passphrase' && (
        <div className='flex flex-col gap-12px'>
          <div className='text-12px text-[var(--text-muted)] leading-relaxed'>
            {t('settings.storagePage.sync.passphraseWarning')}
          </div>
          <div className='flex flex-col gap-4px'>
            <div className='text-13px text-[var(--text-primary)]'>
              {t('settings.storagePage.sync.passphrase')}
            </div>
            <Input.Password
              value={passphrase}
              onChange={setPassphrase}
              placeholder={t('settings.storagePage.sync.passphrasePlaceholder')}
            />
          </div>
          <div className='flex flex-col gap-4px'>
            <div className='text-13px text-[var(--text-primary)]'>
              {t('settings.storagePage.sync.passphraseConfirm')}
            </div>
            <Input.Password
              value={confirmPassphrase}
              onChange={setConfirmPassphrase}
              placeholder={t('settings.storagePage.sync.passphraseConfirmPlaceholder')}
            />
            {passphrase.length > 0 && passphrase.length < MIN_PASSPHRASE_LEN && (
              <div className='text-12px text-[var(--danger)]'>
                {t('settings.storagePage.sync.passphraseTooShort', { min: MIN_PASSPHRASE_LEN })}
              </div>
            )}
            {confirmPassphrase.length > 0 && passphrase !== confirmPassphrase && (
              <div className='text-12px text-[var(--danger)]'>
                {t('settings.storagePage.sync.passphraseMismatch')}
              </div>
            )}
          </div>
          <div className='flex justify-end gap-8px'>
            <Button onClick={handleClose}>{t('common.cancel')}</Button>
            <Button type='primary' disabled={!passphraseValid} onClick={() => setStep('backend')}>
              {t('settings.shared.next')}
            </Button>
          </div>
        </div>
      )}

      {step === 'backend' && (
        <div className='flex flex-col gap-12px'>
          <div className='text-13px text-[var(--text-secondary)]'>
            {t('settings.storagePage.sync.backendIntro')}
          </div>
          <Radio.Group value={backendType} direction='vertical'>
            <Radio value='local-file'>{t('settings.storagePage.sync.backendLocalFile')}</Radio>
            <Radio value='cloud-relay' disabled>
              {t('settings.storagePage.sync.backendCloudRelay')}
            </Radio>
          </Radio.Group>
          <div className='flex flex-col gap-4px'>
            <div className='text-13px text-[var(--text-primary)]'>
              {t('settings.storagePage.sync.folderPath')}
            </div>
            <div className='flex gap-8px'>
              <Input value={backendPath} readOnly className='flex-1' />
              <Button onClick={pickFolder}>{t('settings.storagePage.sync.pickFolder')}</Button>
            </div>
          </div>
          {error && <div className='text-12px text-[var(--danger)]'>{error}</div>}
          <div className='flex justify-end gap-8px'>
            <Button onClick={() => setStep('passphrase')}>{t('settings.shared.back')}</Button>
            <Button type='primary' loading={submitting} disabled={!backendPath} onClick={enable}>
              {t('settings.storagePage.sync.enable')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SyncPassphraseDialog;
