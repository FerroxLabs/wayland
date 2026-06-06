/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { Button, Message } from '@arco-design/web-react';
import { FileText, FolderOpen, Paperclip, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspaceDragImport } from '@/renderer/pages/conversation/Workspace/hooks/useWorkspaceDragImport';
import styles from './projectCards.module.css';

type ReferenceFile = { name: string; path: string; size: number };

const fmtSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Reference files as their own tab: material the AI can draw on (specs, brand
 * docs, data). Dropped into `.wayland/reference/`, available to chats in the
 * project. A grid of cards plus a drop zone - no other concerns mixed in.
 */
const ProjectReferencePanel: React.FC<{
  projectId: string;
  hasWorkspace: boolean;
  onSetWorkspace: () => void;
}> = ({ projectId, hasWorkspace, onSetWorkspace }) => {
  const { t } = useTranslation();
  const [refs, setRefs] = useState<ReferenceFile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!hasWorkspace) {
      setLoading(false);
      return;
    }
    try {
      const r = await ipcBridge.project.listReference.invoke({ id: projectId });
      setRefs(Array.isArray(r) ? r : []);
    } catch (err) {
      console.error('[ProjectReferencePanel] load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, hasWorkspace]);

  useEffect(() => {
    void load();
  }, [load]);

  const onFilesDropped = useCallback(
    async (files: Array<{ path: string; name: string }>) => {
      try {
        const updated = await ipcBridge.project.addReference.invoke({
          id: projectId,
          filePaths: files.map((f) => f.path),
        });
        setRefs(Array.isArray(updated) ? updated : []);
        Message.success(t('projects.knowledge.fileAdded', { count: files.length }));
      } catch {
        Message.error(t('projects.knowledge.fileAddFailed'));
      }
    },
    [projectId, t]
  );

  const { isDragging, dragHandlers } = useWorkspaceDragImport({
    onFilesDropped,
    messageApi: Message,
    t,
    conversationId: `project-reference-${projectId}`,
  });

  const browse = useCallback(async () => {
    const paths = await ipcBridge.dialog.showOpen.invoke({ properties: ['openFile', 'multiSelections'] });
    if (paths && paths.length > 0) await onFilesDropped(paths.map((p) => ({ path: p, name: p })));
  }, [onFilesDropped]);

  const removeRef = useCallback(
    async (name: string) => {
      try {
        const updated = await ipcBridge.project.removeReference.invoke({ id: projectId, name });
        setRefs(Array.isArray(updated) ? updated : []);
      } catch {
        Message.error(t('projects.knowledge.fileRemoveFailed'));
      }
    },
    [projectId, t]
  );

  if (!hasWorkspace) {
    return (
      <div className='flex flex-col items-center justify-center gap-12px text-center px-20px py-48px'>
        <div className='flex items-center justify-center w-48px h-48px rd-12px bg-fill-1 text-t-tertiary'>
          <FolderOpen size={22} />
        </div>
        <div className='text-14px font-600 text-t-primary'>{t('projects.knowledge.noWorkspaceTitle')}</div>
        <div className='text-12px text-t-secondary max-w-320px leading-relaxed'>
          {t('projects.knowledge.noWorkspaceBody')}
        </div>
        <Button type='outline' onClick={onSetWorkspace}>
          {t('projects.knowledge.setWorkspace')}
        </Button>
      </div>
    );
  }

  if (loading) return null;

  return (
    <div className='flex flex-col gap-16px max-w-820px mx-auto'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col gap-2px'>
          <div className='text-15px font-700 text-t-primary'>{t('projects.reference.title')}</div>
          <div className='text-12px text-t-tertiary leading-relaxed'>{t('projects.reference.subtitle')}</div>
        </div>
        <Button size='small' type='outline' icon={<Paperclip size={13} />} onClick={() => void browse()}>
          {t('projects.knowledge.reference.add')}
        </Button>
      </div>

      {refs.length > 0 && (
        <div className='grid gap-12px' style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {refs.map((f) => (
            <div
              key={f.name}
              className={`group flex flex-col gap-8px px-14px py-13px ${styles.card}`}
            >
              <div className='flex items-start justify-between'>
                <div className='flex items-center justify-center w-32px h-32px rd-8px bg-fill-2 text-t-secondary'>
                  <FileText size={16} />
                </div>
                <button
                  type='button'
                  aria-label={t('projects.knowledge.reference.remove')}
                  className='flex items-center justify-center w-18px h-18px rd-4px bg-transparent border-none cursor-pointer text-t-tertiary opacity-0 group-hover:opacity-100 transition-opacity hover:text-t-primary'
                  onClick={() => void removeRef(f.name)}
                >
                  <X size={13} />
                </button>
              </div>
              <div className='text-12.5px font-500 text-t-primary break-words leading-snug' title={f.name}>
                {f.name}
              </div>
              <div className='text-11px text-t-tertiary'>{fmtSize(f.size)}</div>
            </div>
          ))}
        </div>
      )}

      <div
        {...dragHandlers}
        className='flex flex-col items-center justify-center gap-8px rd-12px px-16px py-28px text-center transition-colors cursor-pointer'
        style={{
          border: `1.5px dashed ${isDragging ? 'var(--color-primary-6)' : 'var(--color-border-2)'}`,
          background: isDragging ? 'var(--color-primary-light-1)' : 'transparent',
        }}
        onClick={() => void browse()}
      >
        <Paperclip size={20} className='text-t-tertiary' />
        <div className='text-12px text-t-secondary font-500'>{t('projects.reference.dropTitle')}</div>
        <div className='text-11px text-t-tertiary'>{t('projects.reference.dropHint')}</div>
      </div>
    </div>
  );
};

export default ProjectReferencePanel;
