/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import Markdown from '@/renderer/components/Markdown';
import { Button, Input, Message } from '@arco-design/web-react';
import { FolderOpen, Pencil, Plus, Sparkles } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import KnowledgeEditDrawer from './KnowledgeEditDrawer';
import styles from './projectCards.module.css';

/** Drop the seeded heading/blockquote boilerplate for the "is it empty" check. */
const substantive = (raw: string): string =>
  raw
    .split('\n')
    .filter((l) => {
      const tt = l.trim();
      return !tt.startsWith('>') && !/^#\s/.test(tt);
    })
    .join('\n')
    .trim();

/**
 * Project memory: the running log of decisions for this project. It is the
 * project's own `.wayland/decisions.md` - which also rides into every chat in
 * the project - surfaced as a readable feed with a one-line "add a decision"
 * composer and a full editor. Honest source of truth: what's on disk is what
 * chats see.
 */
const ProjectMemoryPanel: React.FC<{
  projectId: string;
  hasWorkspace: boolean;
  onSetWorkspace: () => void;
}> = ({ projectId, hasWorkspace, onSetWorkspace }) => {
  const { t } = useTranslation();
  const [decisions, setDecisions] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ijfwFiles, setIjfwFiles] = useState<Array<{ name: string; content: string }>>([]);

  const load = useCallback(async () => {
    if (!hasWorkspace) {
      setLoading(false);
      return;
    }
    try {
      const [k, ijfw] = await Promise.all([
        ipcBridge.project.readKnowledge.invoke({ id: projectId }),
        ipcBridge.project.readIjfwMemory.invoke({ id: projectId }),
      ]);
      setDecisions(k.decisions || '');
      setIjfwFiles(ijfw.available ? ijfw.files : []);
    } catch (err) {
      console.error('[ProjectMemoryPanel] load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, hasWorkspace]);

  /** Friendly label for IJFW's memory files. */
  const ijfwLabel = (name: string): string => {
    const base = name.replace(/\.md$/i, '');
    if (/journal/i.test(base)) return t('projects.memory.ijfwJournal');
    if (/handoff/i.test(base)) return t('projects.memory.ijfwHandoff');
    return base;
  };

  useEffect(() => {
    void load();
  }, [load]);

  const addDecision = useCallback(async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const { decisions: updated } = await ipcBridge.project.appendDecision.invoke({ id: projectId, text: draft.trim() });
      setDecisions(updated);
      setDraft('');
      setAdding(false);
    } catch {
      Message.error(t('projects.memory.addFailed'));
    } finally {
      setSaving(false);
    }
  }, [draft, projectId, t]);

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
  const isEmpty = !substantive(decisions);

  return (
    <div className='flex flex-col gap-14px max-w-820px mx-auto'>
      <div className='flex items-start justify-between gap-8px'>
        <div className='flex flex-col gap-2px'>
          <div className='text-15px font-700 text-t-primary'>{t('projects.memory.title')}</div>
          <div className='text-12px text-t-tertiary leading-relaxed'>{t('projects.memory.subtitle')}</div>
        </div>
        <div className='flex items-center gap-8px'>
          <Button size='small' type='text' icon={<Pencil size={13} />} onClick={() => setEditing(true)}>
            {t('projects.knowledge.edit')}
          </Button>
          <Button size='small' type='outline' icon={<Plus size={13} />} onClick={() => setAdding((v) => !v)}>
            {t('projects.memory.add')}
          </Button>
        </div>
      </div>

      {adding && (
        <div className='flex flex-col gap-8px rd-10px border border-solid border-2 bg-fill-1 px-14px py-12px'>
          <Input.TextArea
            value={draft}
            onChange={setDraft}
            placeholder={t('projects.memory.placeholder')}
            autoSize={{ minRows: 2, maxRows: 5 }}
            autoFocus
          />
          <div className='flex items-center justify-end gap-8px'>
            <Button
              size='small'
              type='text'
              onClick={() => {
                setAdding(false);
                setDraft('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button size='small' type='primary' loading={saving} disabled={!draft.trim()} onClick={() => void addDecision()}>
              {t('projects.memory.save')}
            </Button>
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className='rd-12px border border-dashed border-2 px-16px py-28px text-center'>
          <div className='text-13px font-600 text-t-secondary'>{t('projects.memory.emptyTitle')}</div>
          <div className='text-12px text-t-tertiary mt-3px leading-relaxed max-w-380px mx-auto'>
            {t('projects.memory.emptyBody')}
          </div>
        </div>
      ) : (
        <div className={`px-16px py-14px text-13px text-t-primary ${styles.surface}`}>
          <Markdown>{decisions}</Markdown>
        </div>
      )}

      {/* IJFW's own project memory - detected, attributed, read-only. */}
      {ijfwFiles.length > 0 && (
        <div className='flex flex-col gap-10px mt-6px'>
          <div className='flex items-center justify-between gap-8px'>
            <div className='flex flex-col gap-2px'>
              <span className='flex items-center gap-7px text-13px font-700 text-t-primary'>
                <Sparkles size={14} style={{ color: 'rgb(var(--primary-6))' }} />
                {t('projects.memory.ijfwTitle')}
              </span>
              <span className='text-12px text-t-tertiary leading-relaxed'>{t('projects.memory.ijfwSubtitle')}</span>
            </div>
            <span
              className='flex items-center gap-5px text-11px font-600 px-9px py-3px rd-full flex-shrink-0'
              style={{ color: 'rgb(var(--primary-6))', background: 'rgb(var(--primary-6) / 0.12)' }}
            >
              {t('projects.memory.ijfwBadge')}
            </span>
          </div>
          {ijfwFiles.map((f) => (
            <div key={f.name} className={`flex flex-col ${styles.surface}`}>
              <div
                className='flex items-center justify-between px-14px py-9px'
                style={{ borderBottom: '1px solid var(--color-border-2)' }}
              >
                <span className='text-12px font-600 text-t-secondary'>{ijfwLabel(f.name)}</span>
                <span className='text-11px text-t-tertiary'>{t('projects.memory.ijfwReadonly')}</span>
              </div>
              <div className='px-14px py-12px text-12.5px text-t-secondary overflow-auto max-h-320px'>
                <Markdown>{f.content}</Markdown>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <KnowledgeEditDrawer
          visible={editing}
          projectId={projectId}
          kind='decisions'
          canGenerate={false}
          onClose={() => setEditing(false)}
          onSaved={() => void load()}
        />
      )}
    </div>
  );
};

export default ProjectMemoryPanel;
