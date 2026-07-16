/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IGitCloneAuth } from '@/common/types/project';
import WaylandModal from '@/renderer/components/base/WaylandModal';
import { Button, Input, Message, Radio } from '@arco-design/web-react';
import { FileKey } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'none' | 'token' | 'ssh';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Clone a git repository into a fresh project workspace. Public repos need only
 * a URL; private repos authenticate with an HTTPS token or an SSH key. On
 * success the new project opens and its workspace is the cloned checkout.
 */
const CloneFromGitModal: React.FC<Props> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<AuthMode>('none');
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [keyPath, setKeyPath] = useState('');
  const [cloning, setCloning] = useState(false);

  const reset = () => {
    setUrl('');
    setMode('none');
    setUsername('');
    setToken('');
    setKeyPath('');
  };

  const buildAuth = (): IGitCloneAuth => {
    if (mode === 'token') return { kind: 'token', username: username.trim() || undefined, token: token.trim() };
    if (mode === 'ssh') return { kind: 'ssh', privateKeyPath: keyPath.trim() || undefined };
    return { kind: 'none' };
  };

  const chooseKey = () => {
    ipcBridge.dialog.showOpen
      .invoke({ properties: ['openFile'] })
      .then((files) => {
        if (files && files[0]) setKeyPath(files[0]);
      })
      .catch((err) => console.error('[CloneFromGitModal] key picker failed:', err));
  };

  const canClone = url.trim().length > 0 && (mode !== 'token' || token.trim().length > 0) && !cloning;

  const close = () => {
    if (cloning) return;
    reset();
    onClose();
  };

  const handleClone = async () => {
    if (!canClone) return;
    setCloning(true);
    try {
      const { project } = await ipcBridge.project.cloneFromGit.invoke({ url: url.trim(), auth: buildAuth() });
      Message.success(t('projects.clone.success'));
      reset();
      onClose();
      navigate(`/project/${project.id}`);
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setCloning(false);
    }
  };

  const footer = (
    <div className='flex justify-end gap-12px'>
      <Button onClick={close} disabled={cloning} className='px-16px min-w-80px' style={{ borderRadius: 8 }}>
        {t('common.cancel')}
      </Button>
      <Button type='primary' onClick={handleClone} loading={cloning} disabled={!canClone} className='min-w-80px'>
        {t('projects.clone.cloneButton')}
      </Button>
    </div>
  );

  return (
    <WaylandModal
      visible={visible}
      onCancel={close}
      header={{ title: t('projects.clone.title'), showClose: true }}
      style={{ width: 520 }}
      contentStyle={{ background: 'var(--dialog-fill-0)', borderRadius: 16, padding: '20px 24px' }}
      footer={footer}
    >
      <div className='flex flex-col gap-16px pt-12px'>
        <div className='space-y-6px'>
          <div className='text-13px font-500 text-t-secondary'>{t('projects.clone.urlLabel')}</div>
          <Input
            autoFocus
            value={url}
            onChange={setUrl}
            onPressEnter={handleClone}
            placeholder={t('projects.clone.urlPlaceholder')}
            allowClear
          />
        </div>

        <div className='space-y-6px'>
          <div className='text-13px font-500 text-t-secondary'>{t('projects.clone.authLabel')}</div>
          <Radio.Group type='button' value={mode} onChange={(v) => setMode(v as AuthMode)}>
            <Radio value='none'>{t('projects.clone.authNone')}</Radio>
            <Radio value='token'>{t('projects.clone.authToken')}</Radio>
            <Radio value='ssh'>{t('projects.clone.authSsh')}</Radio>
          </Radio.Group>
        </div>

        {mode === 'token' && (
          <>
            <div className='space-y-6px'>
              <div className='text-13px font-500 text-t-secondary'>{t('projects.clone.usernameLabel')}</div>
              <Input
                value={username}
                onChange={setUsername}
                placeholder={t('projects.clone.usernamePlaceholder')}
                allowClear
              />
            </div>
            <div className='space-y-6px'>
              <div className='text-13px font-500 text-t-secondary'>{t('projects.clone.tokenLabel')}</div>
              <Input.Password
                value={token}
                onChange={setToken}
                placeholder={t('projects.clone.tokenPlaceholder')}
                allowClear
              />
            </div>
          </>
        )}

        {mode === 'ssh' && (
          <div className='space-y-6px'>
            <div className='text-13px font-500 text-t-secondary'>{t('projects.clone.keyLabel')}</div>
            {keyPath ? (
              <div className='flex items-center gap-8px bg-fill-1 rd-8px px-12px py-8px border border-solid border-2'>
                <FileKey size={14} className='flex-shrink-0 text-t-secondary' />
                <span className='text-13px truncate flex-1' title={keyPath}>
                  {keyPath}
                </span>
                <Button type='text' size='mini' onClick={() => setKeyPath('')}>
                  {t('common.cancel')}
                </Button>
              </div>
            ) : (
              <Button size='small' shape='round' onClick={chooseKey}>
                <span className='flex items-center gap-6px'>
                  <FileKey size={14} />
                  {t('projects.clone.chooseKey')}
                </span>
              </Button>
            )}
            <div className='text-11px text-t-tertiary leading-4'>{t('projects.clone.keyHint')}</div>
          </div>
        )}

        <div className='text-11px text-t-tertiary leading-4'>{t('projects.clone.hint')}</div>
      </div>
    </WaylandModal>
  );
};

export default CloneFromGitModal;
