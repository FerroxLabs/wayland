/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Modal } from '@arco-design/web-react';
import { LockKeyhole } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  requestConstitutionEditGrantHttp,
  type ConstitutionEditGrant,
  type ConstitutionEditScope,
} from '@renderer/services/ConstitutionService';

type HostedEditAuthorizationProps = {
  scopes: readonly ConstitutionEditScope[];
  onGranted: (grant: ConstitutionEditGrant) => void;
  compact?: boolean;
};

/**
 * Hosted-only step-up. The password lives only in this modal state and is
 * cleared immediately after success/cancel; autosave receives only the opaque
 * short-lived grant.
 */
const HostedEditAuthorization: React.FC<HostedEditAuthorizationProps> = ({ scopes, onGranted, compact = false }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = (): void => {
    if (submitting) return;
    setOpen(false);
    setPassword('');
    setError(null);
  };

  const submit = async (): Promise<void> => {
    if (!password) return;
    setSubmitting(true);
    setError(null);
    try {
      const grant = await requestConstitutionEditGrantHttp(password, scopes);
      setPassword('');
      if (!grant) {
        setError(
          t(
            'settings.constitutionPage.unlockFailed',
            'Editing could not be unlocked. Check the password and use a trusted local or Tailscale connection.'
          )
        );
        return;
      }
      setOpen(false);
      onGranted(grant);
    } catch {
      setError(
        t(
          'settings.constitutionPage.unlockNetworkFailed',
          'Wayland could not reach the authorization service. Your password was not retained; check the connection and try again.'
        )
      );
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type={compact ? 'secondary' : 'primary'}
        size='small'
        icon={<LockKeyhole size={14} />}
        onClick={() => setOpen(true)}
      >
        {t('settings.constitutionPage.unlockEditing', 'Unlock editing')}
      </Button>
      <Modal
        visible={open}
        title={t('settings.constitutionPage.unlockTitle', 'Unlock Constitution editing')}
        onCancel={close}
        onOk={() => void submit()}
        okText={t('settings.constitutionPage.unlockEditing', 'Unlock editing')}
        confirmLoading={submitting}
        okButtonProps={{ disabled: !password }}
      >
        <div className='flex flex-col gap-8px'>
          <div className='text-12px text-t-secondary'>
            {t(
              'settings.constitutionPage.unlockBody',
              'Confirm your WebUI password once. Wayland will use a short-lived, scoped grant for autosave and will not retain your password.'
            )}
          </div>
          <Input.Password
            value={password}
            onChange={(value) => {
              setPassword(value);
              setError(null);
            }}
            onPressEnter={() => void submit()}
            placeholder={t('settings.constitutionPage.passwordPlaceholder', 'WebUI password')}
            autoComplete='current-password'
          />
          {error && <div className='text-12px text-danger'>{error}</div>}
        </div>
      </Modal>
    </>
  );
};

export default HostedEditAuthorization;
