/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Button, Input, Modal, Tabs } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { SkillVerdict } from '@/common/types/skillTypes';
import TipTapMarkdownEditor from '@renderer/pages/conversation/Preview/components/editors/TipTapMarkdownEditor';

type BuildTab = 'write' | 'describe';

type VerdictAlertProps = {
  verdict: SkillVerdict;
  name: string;
};

const VerdictAlert: React.FC<VerdictAlertProps> = ({ verdict, name }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'skills' });
  const colorMap: Record<string, string> = {
    clean: 'bg-[rgba(var(--success-6),0.10)] text-[rgb(var(--success-6))] border-[rgba(var(--success-6),0.2)]',
    review: 'bg-[rgba(var(--warning-6),0.10)] text-[rgb(var(--warning-6))] border-[rgba(var(--warning-6),0.2)]',
    blocked: 'bg-[rgba(var(--danger-6),0.10)] text-[rgb(var(--danger-6))] border-[rgba(var(--danger-6),0.2)]',
    unscanned: 'bg-fill-2 text-t-secondary border-b-base',
  };
  const cls = colorMap[verdict] ?? colorMap['unscanned'];
  return (
    <div className={`p-12px rd-8px border text-12px ${cls}`}>
      <span className='font-medium'>{t(`builder.verdict.${verdict}`, { name })}</span>
    </div>
  );
};

type BuildSkillModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const EMPTY_BODY = '# my-skill\n\n## Use when\n\n- \n\n## Do NOT use when\n\n- \n\n## Instructions\n\n';

const BuildSkillModal: React.FC<BuildSkillModalProps> = ({ visible, onClose, onSaved }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'skills' });

  const [tab, setTab] = useState<BuildTab>('write');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [body, setBody] = useState(EMPTY_BODY);

  const [describePrompt, setDescribePrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedVerdict, setSavedVerdict] = useState<{ verdict: SkillVerdict; name: string } | null>(null);

  const reset = () => {
    setTab('write');
    setName('');
    setDescription('');
    setCategory('');
    setTagsRaw('');
    setBody(EMPTY_BODY);
    setDescribePrompt('');
    setGenerating(false);
    setGenerateError('');
    setSaving(false);
    setSaveError('');
    setSavedVerdict(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleGenerate = async () => {
    if (!describePrompt.trim()) return;
    setGenerateError('');
    setGenerating(true);
    try {
      const { skillMd } = await ipcBridge.skills.build.draft.invoke({ description: describePrompt });
      setBody(skillMd);
      // Pre-fill description from the prompt if not yet set
      if (!description.trim()) setDescription(describePrompt.trim());
      setTab('write');
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : t('builder.error.generateFailed')
      );
    } finally {
      setGenerating(false);
    }
  };

  const canSave = !saving && name.trim().length > 0 && description.trim().length > 0 && body.trim().length > 0;

  const handleSave = async () => {
    setSaveError('');
    setSaving(true);
    setSavedVerdict(null);
    try {
      const tags = tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const result = await ipcBridge.skills.save.invoke({
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        tags,
        body,
      });
      setSavedVerdict(result);
      if (result.verdict !== 'blocked') {
        onSaved();
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : t('builder.error.saveFailed')
      );
    } finally {
      setSaving(false);
    }
  };

  // After a successful non-blocked save, offer to close.
  const handleDoneAfterSave = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onCancel={handleClose}
      footer={null}
      title={t('builder.title')}
      style={{ width: 720 }}
      focusLock
      autoFocus={false}
    >
      <div className='flex flex-col gap-16px'>
        <Tabs activeTab={tab} onChange={(k) => setTab(k as BuildTab)}>
          {/* ----------------------------------------------------------------
              Write it myself tab
          ---------------------------------------------------------------- */}
          <Tabs.TabPane key='write' title={t('builder.tab.write')}>
            <div className='flex flex-col gap-14px pt-12px'>
              {/* Name */}
              <div className='flex flex-col gap-6px'>
                <label className='text-13px font-medium text-t-primary'>
                  {t('builder.form.name.label')}
                  <span className='text-[rgb(var(--danger-6))] ml-2px'>*</span>
                </label>
                <Input
                  value={name}
                  onChange={setName}
                  placeholder={t('builder.form.name.placeholder')}
                />
              </div>

              {/* Description */}
              <div className='flex flex-col gap-6px'>
                <label className='text-13px font-medium text-t-primary'>
                  {t('builder.form.description.label')}
                  <span className='text-[rgb(var(--danger-6))] ml-2px'>*</span>
                </label>
                <Input.TextArea
                  value={description}
                  onChange={setDescription}
                  placeholder={t('builder.form.description.placeholder')}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
                <span className='text-11px text-t-tertiary'>{t('builder.form.description.hint')}</span>
              </div>

              {/* Category + Tags */}
              <div className='flex gap-12px'>
                <div className='flex flex-col gap-6px flex-1'>
                  <label className='text-13px font-medium text-t-primary'>
                    {t('builder.form.category.label')}
                  </label>
                  <Input
                    value={category}
                    onChange={setCategory}
                    placeholder={t('builder.form.category.placeholder')}
                  />
                </div>
                <div className='flex flex-col gap-6px flex-1'>
                  <label className='text-13px font-medium text-t-primary'>
                    {t('builder.form.tags.label')}
                  </label>
                  <Input
                    value={tagsRaw}
                    onChange={setTagsRaw}
                    placeholder={t('builder.form.tags.placeholder')}
                  />
                </div>
              </div>

              {/* Body editor */}
              <div className='flex flex-col gap-6px'>
                <label className='text-13px font-medium text-t-primary'>
                  {t('builder.form.body.label')}
                  <span className='text-[rgb(var(--danger-6))] ml-2px'>*</span>
                </label>
                <div
                  className='rd-8px border overflow-hidden'
                  style={{ borderColor: 'var(--color-border-1)', minHeight: 240 }}
                >
                  <TipTapMarkdownEditor value={body} onChange={setBody} />
                </div>
              </div>
            </div>
          </Tabs.TabPane>

          {/* ----------------------------------------------------------------
              Describe it tab
          ---------------------------------------------------------------- */}
          <Tabs.TabPane key='describe' title={t('builder.tab.describe')}>
            <div className='flex flex-col gap-14px pt-12px'>
              <div className='flex flex-col gap-6px'>
                <label className='text-13px font-medium text-t-primary'>
                  {t('builder.describe.label')}
                </label>
                <Input.TextArea
                  value={describePrompt}
                  onChange={setDescribePrompt}
                  placeholder={t('builder.describe.placeholder')}
                  autoSize={{ minRows: 4, maxRows: 8 }}
                />
              </div>

              {generateError && (
                <span className='text-12px text-[rgb(var(--danger-6))]'>{generateError}</span>
              )}

              <div className='flex justify-end'>
                <Button
                  type='primary'
                  loading={generating}
                  disabled={!describePrompt.trim() || generating}
                  onClick={() => void handleGenerate()}
                >
                  {generating
                    ? t('builder.describe.generating')
                    : t('builder.describe.generate')}
                </Button>
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>

        {/* Scan verdict after save */}
        {savedVerdict && (
          <VerdictAlert verdict={savedVerdict.verdict} name={savedVerdict.name} />
        )}

        {/* Save error */}
        {saveError && (
          <span className='text-12px text-[rgb(var(--danger-6))]'>{saveError}</span>
        )}

        {/* Footer actions */}
        <div className='flex items-center justify-end gap-12px pt-4px'>
          <Button onClick={handleClose} style={{ borderRadius: 8 }} className='px-16px'>
            {t('builder.actions.cancel')}
          </Button>
          {savedVerdict && savedVerdict.verdict !== 'blocked' ? (
            <Button
              type='primary'
              onClick={handleDoneAfterSave}
              className=''
            >
              {t('builder.actions.done')}
            </Button>
          ) : (
            <Button
              type='primary'
              loading={saving}
              disabled={!canSave}
              onClick={() => void handleSave()}
              className=''
            >
              {saving ? t('builder.actions.saving') : t('builder.actions.save')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BuildSkillModal;
