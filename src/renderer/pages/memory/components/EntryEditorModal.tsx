/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * EntryEditorModal - edit a single memory entry in place (#414).
 *
 * Prefilled from the selected entry (summary/type/tags/body). On save it sends
 * only the CHANGED fields to `memory.update-entry` so untouched frontmatter is
 * left verbatim on disk. Changing the summary changes the entry id, so the
 * caller receives the new id via onSaved to re-select the row.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { InputTag, Message, Modal, Select } from '@arco-design/web-react';
import { Input } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { memory as memoryBridge } from '@/common/adapter/ipcBridge';
import type { MemoryEntry, MemoryType } from '@/common/types/memory';

const EDITABLE_TYPES: MemoryType[] = ['decision', 'pattern', 'observation', 'session', 'preference'];

export type EntryEditorTarget = MemoryEntry & { body: string };

export type EntryEditorModalProps = {
  open: boolean;
  entry: EntryEditorTarget | null;
  onClose: () => void;
  /** Called after a successful save with the entry's (possibly new) id. */
  onSaved: (newId: string) => void;
};

const EntryEditorModal: React.FC<EntryEditorModalProps> = ({ open, entry, onClose, onSaved }) => {
  const { t } = useTranslation('memory');

  const [summary, setSummary] = useState('');
  const [type, setType] = useState<MemoryType>('observation');
  const [tags, setTags] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset the form whenever a new entry is opened.
  useEffect(() => {
    if (entry) {
      setSummary(entry.summary);
      setType(entry.type);
      setTags(entry.tags ?? []);
      setBody(entry.body ?? '');
    }
  }, [entry]);

  const patch = useMemo(() => {
    if (!entry) return null;
    const trimmedSummary = summary.trim();
    const p: { summary?: string; type?: string; tags?: string[]; body?: string } = {};
    if (trimmedSummary && trimmedSummary !== entry.summary) p.summary = trimmedSummary;
    if (type !== entry.type) p.type = type;
    if (JSON.stringify(tags) !== JSON.stringify(entry.tags ?? [])) p.tags = tags;
    if (body !== (entry.body ?? '')) p.body = body;
    return p;
  }, [entry, summary, type, tags, body]);

  const hasChanges = !!patch && Object.keys(patch).length > 0;
  const summaryEmpty = summary.trim().length === 0;

  const handleSave = async (): Promise<void> => {
    if (!entry || !patch || !hasChanges || summaryEmpty || saving) return;
    setSaving(true);
    try {
      const result = await memoryBridge.updateEntry.invoke({ id: entry.id, ...patch });
      if (result.ok) {
        Message.success(t('archive.editor.toastSaved', 'Memory updated'));
        onSaved(result.newId ?? entry.id);
        onClose();
      } else if (result.error === 'summary_collision') {
        Message.error(
          t('archive.editor.toastCollision', 'Another memory already uses that summary. Choose a different one.')
        );
      } else {
        Message.error(t('archive.editor.toastError', 'Could not update memory'));
      }
    } catch {
      Message.error(t('archive.editor.toastError', 'Could not update memory'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={t('archive.editor.title', 'Edit memory')}
      visible={open}
      onCancel={onClose}
      onOk={() => {
        void handleSave();
      }}
      okButtonProps={{ disabled: !hasChanges || summaryEmpty, loading: saving }}
      okText={t('archive.editor.save', 'Save')}
      cancelText={t('archive.editor.cancel', 'Cancel')}
      unmountOnExit
      data-testid='entry-editor-modal'
    >
      <div className='flex flex-col gap-12px'>
        <label className='flex flex-col gap-4px'>
          <span className='text-12px text-[var(--color-text-3)]'>{t('archive.editor.summaryLabel', 'Summary')}</span>
          <Input
            value={summary}
            onChange={setSummary}
            maxLength={500}
            data-testid='entry-editor-summary'
            status={summaryEmpty ? 'error' : undefined}
          />
        </label>
        <label className='flex flex-col gap-4px'>
          <span className='text-12px text-[var(--color-text-3)]'>{t('archive.editor.typeLabel', 'Type')}</span>
          <Select value={type} onChange={(v) => setType(v as MemoryType)} data-testid='entry-editor-type'>
            {EDITABLE_TYPES.map((tp) => (
              <Select.Option key={tp} value={tp}>
                {tp}
              </Select.Option>
            ))}
          </Select>
        </label>
        <label className='flex flex-col gap-4px'>
          <span className='text-12px text-[var(--color-text-3)]'>{t('archive.editor.tagsLabel', 'Tags')}</span>
          <InputTag value={tags} onChange={(v) => setTags(v as string[])} data-testid='entry-editor-tags' allowClear />
        </label>
        <label className='flex flex-col gap-4px'>
          <span className='text-12px text-[var(--color-text-3)]'>{t('archive.editor.bodyLabel', 'Body')}</span>
          <Input.TextArea
            value={body}
            onChange={setBody}
            autoSize={{ minRows: 6, maxRows: 16 }}
            data-testid='entry-editor-body'
          />
        </label>
      </div>
    </Modal>
  );
};

export default EntryEditorModal;
