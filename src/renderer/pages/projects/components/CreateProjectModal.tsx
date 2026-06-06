/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IProject, ICreateProjectParams } from '@/common/types/project';
import ModalHOC from '@/renderer/utils/ui/ModalHOC';
import WaylandModal from '@/renderer/components/base/WaylandModal';
import { Button, Input } from '@arco-design/web-react';
import { FolderOpen, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** A small, fixed palette of icon-chip colors. Optional - the first is the default. */
const PROJECT_COLORS = ['#FF6A00', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];

type CreateProjectModalProps = {
  /** When provided, the modal is in edit mode and pre-fills from this project. */
  project?: IProject;
  onSubmit: (params: ICreateProjectParams) => void | Promise<void>;
};

/**
 * Create / edit a project. Deliberately low-friction: only the name is
 * required. Workspace, description and color are all optional so a user can
 * spin up a project in one keystroke and flesh it out later (the opposite of
 * Foundry, which forced a workspace up front).
 */
const CreateProjectModal = ModalHOC<CreateProjectModalProps>(({ modalProps, modalCtrl, project, onSubmit }) => {
  const { t } = useTranslation();
  const isEdit = !!project;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [iconColor, setIconColor] = useState(PROJECT_COLORS[0]);

  // Re-seed fields whenever the modal opens (edit vs create).
  useEffect(() => {
    if (!modalProps.visible) return;
    setName(project?.name ?? '');
    setDescription(project?.description ?? '');
    setWorkspace(project?.workspace ?? '');
    setIconColor(project?.iconColor ?? PROJECT_COLORS[0]);
  }, [modalProps.visible, project]);

  const chooseFolder = () => {
    ipcBridge.dialog.showOpen
      .invoke({ properties: ['openDirectory', 'createDirectory'] })
      .then((dirs) => {
        if (dirs && dirs[0]) setWorkspace(dirs[0]);
      })
      .catch((error) => console.error('Failed to open directory dialog:', error));
  };

  const handleConfirm = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit({
      name: trimmed,
      description: description.trim() || undefined,
      workspace: workspace.trim() || undefined,
      iconColor,
    });
    modalCtrl.close();
  };

  return (
    <WaylandModal
      visible={modalProps.visible}
      onCancel={modalCtrl.close}
      header={{ title: isEdit ? t('projects.modal.editTitle') : t('projects.modal.createTitle'), showClose: true }}
      style={{ width: 520 }}
      contentStyle={{ background: 'var(--dialog-fill-0)', borderRadius: 16, padding: '20px 24px' }}
      onOk={handleConfirm}
      okText={isEdit ? t('common.save') : t('projects.modal.createButton')}
      cancelText={t('common.cancel')}
      okButtonProps={{ disabled: !name.trim() }}
    >
      <div className='flex flex-col gap-16px pt-12px'>
        <div className='space-y-6px'>
          <div className='text-13px font-500 text-t-secondary'>{t('projects.modal.nameLabel')}</div>
          <Input
            autoFocus
            value={name}
            onChange={setName}
            onPressEnter={handleConfirm}
            placeholder={t('projects.modal.namePlaceholder')}
            maxLength={80}
            showWordLimit
          />
        </div>

        <div className='space-y-6px'>
          <div className='text-13px font-500 text-t-secondary'>{t('projects.modal.descriptionLabel')}</div>
          <Input.TextArea
            value={description}
            onChange={setDescription}
            placeholder={t('projects.modal.descriptionPlaceholder')}
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={400}
          />
        </div>

        <div className='space-y-6px'>
          <div className='text-13px font-500 text-t-secondary'>{t('projects.modal.workspaceLabel')}</div>
          {workspace ? (
            <div className='flex items-center gap-8px bg-fill-1 rd-8px px-12px py-8px border border-solid border-2'>
              <FolderOpen size={14} className='flex-shrink-0 text-t-secondary' />
              <span className='text-13px truncate flex-1' title={workspace}>
                {workspace}
              </span>
              <Button type='text' size='mini' icon={<X size={14} />} onClick={() => setWorkspace('')} />
            </div>
          ) : (
            <Button size='small' shape='round' onClick={chooseFolder}>
              <span className='flex items-center gap-6px'>
                <FolderOpen size={14} />
                {t('projects.modal.chooseFolder')}
              </span>
            </Button>
          )}
          <div className='text-11px text-t-tertiary leading-4'>{t('projects.modal.workspaceHint')}</div>
        </div>

        <div className='space-y-6px'>
          <div className='text-13px font-500 text-t-secondary'>{t('projects.modal.colorLabel')}</div>
          <div className='flex items-center gap-8px'>
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type='button'
                onClick={() => setIconColor(c)}
                aria-label={c}
                className='flex items-center justify-center w-28px h-28px rd-full border-2 border-solid cursor-pointer bg-transparent p-0 transition-colors'
                style={{ borderColor: iconColor === c ? 'var(--color-text-1)' : 'transparent' }}
              >
                <span className='block w-18px h-18px rd-full' style={{ background: c }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </WaylandModal>
  );
});

export default CreateProjectModal;
