/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { Button, Drawer, Input, Message } from '@arco-design/web-react';
import { Sparkles } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TipTapMarkdownEditor from '@/renderer/pages/conversation/Preview/components/editors/TipTapMarkdownEditor';

export type KnowledgeKind = 'context' | 'rules' | 'decisions';

/**
 * Full-screen-ish editor for one knowledge doc: an editable one-line summary
 * (optionally AI-drafted) at the top, then the document body with an Edit /
 * Preview toggle so the user sees exactly how the markdown renders. Saving
 * persists both the body (injected into chats) and the summary (the at-a-glance).
 */
const KnowledgeEditDrawer: React.FC<{
  visible: boolean;
  projectId: string;
  kind: KnowledgeKind;
  canGenerate: boolean;
  onClose: () => void;
  onSaved: () => void;
}> = ({ visible, projectId, kind, canGenerate, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [body, setBody] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    void (async () => {
      try {
        const [knowledge, summaries] = await Promise.all([
          ipcBridge.project.readKnowledge.invoke({ id: projectId }),
          ipcBridge.project.readSummaries.invoke({ id: projectId }),
        ]);
        setBody(knowledge[kind] || '');
        setSummary((summaries as Record<string, string>)[kind] || '');
      } catch (err) {
        console.error('[KnowledgeEditDrawer] load failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, projectId, kind]);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      // Persist the body first so the summary reflects what the user just wrote.
      await ipcBridge.project.writeKnowledge.invoke({ id: projectId, kind, content: body });
      const { summary: draft, error } = await ipcBridge.project.generateSummary.invoke({ id: projectId, kind });
      if (error)
        Message.error(
          error === 'no-model' ? t('projects.knowledge.noModelHint') : t('projects.knowledge.summaryFailed')
        );
      else if (draft) setSummary(draft);
      else Message.info(t('projects.knowledge.summaryEmpty'));
    } catch {
      Message.error(t('projects.knowledge.summaryFailed'));
    } finally {
      setGenerating(false);
    }
  }, [projectId, kind, body, t]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await ipcBridge.project.writeKnowledge.invoke({ id: projectId, kind, content: body });
      await ipcBridge.project.writeSummary.invoke({ id: projectId, kind, summary });
      Message.success(t('projects.knowledge.saved'));
      onSaved();
      onClose();
    } catch {
      Message.error(t('projects.knowledge.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [projectId, kind, body, summary, onSaved, onClose, t]);

  return (
    <Drawer
      width={Math.min(760, typeof window !== 'undefined' ? window.innerWidth - 80 : 760)}
      visible={visible}
      onCancel={onClose}
      title={t(`projects.knowledge.${kind}.label`)}
      footer={
        <div className='flex items-center justify-end gap-8px'>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type='primary' loading={saving} onClick={() => void save()}>
            {t('projects.knowledge.save')}
          </Button>
        </div>
      }
    >
      {loading ? null : (
        <div className='flex flex-col gap-16px h-full'>
          {/* Summary */}
          <div className='flex flex-col gap-6px'>
            <div className='flex items-center justify-between'>
              <span className='text-12px font-600 text-t-secondary'>{t('projects.knowledge.summaryLabel')}</span>
              <Button
                size='mini'
                type='text'
                loading={generating}
                disabled={!canGenerate || !body.trim()}
                icon={<Sparkles size={13} />}
                onClick={() => void generate()}
              >
                {t('projects.knowledge.generate')}
              </Button>
            </div>
            <Input
              value={summary}
              placeholder={t('projects.knowledge.summaryPlaceholder')}
              onChange={setSummary}
              maxLength={160}
              showWordLimit
            />
            {!canGenerate && <span className='text-11px text-t-tertiary'>{t('projects.knowledge.noModelHint')}</span>}
          </div>

          {/* Body - TipTap WYSIWYG markdown editor (keyed by kind so it remounts per doc) */}
          <span className='text-12px font-600 text-t-secondary'>{t('projects.knowledge.bodyLabel')}</span>
          <div className='flex-1 overflow-auto rd-8px border border-solid border-2 min-h-320px'>
            <TipTapMarkdownEditor key={kind} value={body} onChange={setBody} />
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default KnowledgeEditDrawer;
