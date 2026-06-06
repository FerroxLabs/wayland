/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import ModalHOC from '@/renderer/utils/ui/ModalHOC';
import WaylandModal from '@/renderer/components/base/WaylandModal';
import { Button, Input, Message } from '@arco-design/web-react';
import { Check, Folder, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjects } from '../hooks/useProjects';

type AssignToProjectModalProps = {
  /** The conversation being filed into a project. */
  conversationId?: string;
};

/**
 * Pick a project to file an existing chat into - or spin up a new one inline so
 * the user never has to leave this flow to do it (Krug: don't make me go
 * somewhere else first). Assigning is one click; the list closes immediately.
 */
const AssignToProjectModal = ModalHOC<AssignToProjectModalProps>(({ modalProps, modalCtrl, conversationId }) => {
  const { t } = useTranslation();
  const { projects, createProject, assignConversation } = useProjects();
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const assign = async (projectId: string) => {
    if (!conversationId || busy) return;
    setBusy(true);
    try {
      await assignConversation(conversationId, projectId);
      Message.success(t('projects.toast.chatAdded'));
      modalCtrl.close();
    } catch {
      Message.error(t('projects.toast.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const createAndAssign = async () => {
    const name = newName.trim();
    if (!name || !conversationId || busy) return;
    setBusy(true);
    try {
      const project = await createProject({ name });
      await assignConversation(conversationId, project.id);
      Message.success(t('projects.toast.chatAdded'));
      setNewName('');
      modalCtrl.close();
    } catch {
      Message.error(t('projects.toast.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <WaylandModal
      visible={modalProps.visible}
      onCancel={modalCtrl.close}
      header={{ title: t('projects.assign.title'), showClose: true }}
      style={{ width: 460 }}
      contentStyle={{ background: 'var(--dialog-fill-0)', borderRadius: 16, padding: '16px 20px' }}
      footer={null}
    >
      <div className='flex flex-col gap-12px pt-8px'>
        {projects.length > 0 ? (
          <div className='flex flex-col gap-4px max-h-280px overflow-auto'>
            {projects.map((p) => {
              const color = p.iconColor || '#FF6A00';
              return (
                <div
                  key={p.id}
                  role='button'
                  tabIndex={0}
                  onClick={() => assign(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') assign(p.id);
                  }}
                  className='flex items-center gap-10px px-12px py-10px rd-8px cursor-pointer hover:bg-fill-2 transition-colors'
                >
                  <div
                    className='flex items-center justify-center w-28px h-28px rd-7px flex-shrink-0'
                    style={{ background: `${color}1a`, color }}
                  >
                    <Folder size={15} />
                  </div>
                  <span className='text-14px text-t-primary truncate flex-1'>{p.name}</span>
                  <Check size={15} className='text-t-tertiary opacity-0' />
                </div>
              );
            })}
          </div>
        ) : (
          <div className='text-13px text-t-secondary text-center py-8px'>{t('projects.assign.empty')}</div>
        )}

        <div className='h-1px bg-border-2' />

        <div className='flex items-center gap-8px'>
          <Input
            value={newName}
            onChange={setNewName}
            onPressEnter={createAndAssign}
            placeholder={t('projects.assign.newPlaceholder')}
            maxLength={80}
          />
          <Button type='primary' disabled={!newName.trim() || busy} onClick={createAndAssign}>
            <span className='flex items-center gap-4px'>
              <Plus size={14} />
              {t('projects.assign.createButton')}
            </span>
          </Button>
        </div>
      </div>
    </WaylandModal>
  );
});

export default AssignToProjectModal;
