/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * BuildWorkflowModal - workflow-flavored clone of BuildSkillModal.
 *
 * Workstream H1+H2: gives the Workflows library page a working "Build a
 * workflow" button instead of the placeholder window.alert that used to
 * sit on it. The modal mirrors BuildSkillModal 1:1 (same WaylandModal /
 * Arco Modal recipe, same width 720, same canonical pill primary footer,
 * same TipTap markdown editor body) and routes through the same
 * `ipcBridge.skills.save` IPC, since skills and workflows share the
 * SkillLibrary storage under a `type` discriminator.
 *
 * NOTE on the `type` discriminator: the current save IPC schema in
 * `ipcBridge.ts` does not yet accept an explicit `type: 'workflow'` field
 * - the backend handler (`skillsBridge.ts`) hardcodes `type: 'skill'` on
 * registerSource. Bridging that gap is out of scope for this workstream
 * (the brief explicitly forbids editing `ipcBridge.ts` and the bridge
 * handler, and instructs me to mirror BuildSkillModal verbatim). The
 * resulting entry will currently register as a skill; a follow-up wave
 * needs to extend the save IPC + handler to honor a `type` argument.
 * Tracking comment lives below where the save call is made.
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
  const { t } = useTranslation(undefined, { keyPrefix: 'workflows' });
  const colorMap: Record<string, string> = {
    clean: 'bg-[rgba(var(--success-6),0.10)] text-[rgb(var(--success-6))] border-[rgba(var(--success-6),0.2)]',
    review: 'bg-[rgba(var(--warning-6),0.10)] text-[rgb(var(--warning-6))] border-[rgba(var(--warning-6),0.2)]',
    blocked: 'bg-[rgba(var(--danger-6),0.10)] text-[rgb(var(--danger-6))] border-[rgba(var(--danger-6),0.2)]',
    unscanned: 'bg-fill-2 text-t-secondary border-b-base',
  };
  const cls = colorMap[verdict] ?? colorMap['unscanned'];
  const messageMap: Record<string, string> = {
    clean: `"${name}" looks safe - verified clean and saved to your workflow library.`,
    review: `"${name}" saved - Skill Guard flagged it for review. Open it from the library to see findings.`,
    blocked: `"${name}" was blocked by Skill Guard and quarantined. Review the findings before retrying.`,
    unscanned: `"${name}" saved without a scan verdict.`,
  };
  return (
    <div className={`p-12px rd-8px border text-12px ${cls}`}>
      <span className='font-medium'>
        {t(`builder.verdict.${verdict}`, messageMap[verdict] ?? messageMap['unscanned'], { name })}
      </span>
    </div>
  );
};

type BuildWorkflowModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const EMPTY_BODY =
  '# my-workflow\n\n## Use when\n\n- \n\n## Do NOT use when\n\n- \n\n## Steps\n\n1. \n\n## Depends on (skills)\n\n- \n';

const BuildWorkflowModal: React.FC<BuildWorkflowModalProps> = ({ visible, onClose, onSaved }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'workflows' });

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
      // Reuse the same draft IPC - it produces a SKILL.md template that
      // workflows can adopt 1:1; the body section structure is identical.
      const { skillMd } = await ipcBridge.skills.build.draft.invoke({ description: describePrompt });
      setBody(skillMd);
      if (!description.trim()) setDescription(describePrompt.trim());
      setTab('write');
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : t('builder.error.generateFailed', 'Failed to generate workflow draft.')
      );
    } finally {
      setGenerating(false);
    }
  };

  const canSave =
    !saving && name.trim().length > 0 && description.trim().length > 0 && body.trim().length > 0;

  const handleSave = async () => {
    setSaveError('');
    setSaving(true);
    setSavedVerdict(null);
    try {
      const tags = tagsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      // Save as a workflow so it lands in the workflows partition and shows
      // on the Workflows page (which lists skills.list({ type: 'workflow' })).
      const result = await ipcBridge.skills.save.invoke({
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        tags,
        body,
        type: 'workflow',
      });
      setSavedVerdict(result);
      if (result.verdict !== 'blocked') {
        onSaved();
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : t('builder.error.saveFailed', 'Failed to save workflow.')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDoneAfterSave = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onCancel={handleClose}
      footer={null}
      title={t('builder.title', 'Build a workflow')}
      style={{ width: 720 }}
      focusLock
      autoFocus={false}
    >
      <div className='flex flex-col gap-16px'>
        <Tabs activeTab={tab} onChange={(k) => setTab(k as BuildTab)}>
          {/* ----------------------------------------------------------------
              Write it myself tab
          ---------------------------------------------------------------- */}
          <Tabs.TabPane key='write' title={t('builder.tab.write', 'Write it myself')}>
            <div className='flex flex-col gap-14px pt-12px'>
              {/* Name */}
              <div className='flex flex-col gap-6px'>
                <label className='text-13px font-medium text-t-primary'>
                  {t('builder.form.name.label', 'Name')}
                  <span className='text-[rgb(var(--danger-6))] ml-2px'>*</span>
                </label>
                <Input
                  value={name}
                  onChange={setName}
                  placeholder={t('builder.form.name.placeholder', 'launch-newsletter')}
                />
              </div>

              {/* Description */}
              <div className='flex flex-col gap-6px'>
                <label className='text-13px font-medium text-t-primary'>
                  {t('builder.form.description.label', 'Description')}
                  <span className='text-[rgb(var(--danger-6))] ml-2px'>*</span>
                </label>
                <Input.TextArea
                  value={description}
                  onChange={setDescription}
                  placeholder={t(
                    'builder.form.description.placeholder',
                    'A short summary of what this workflow does and when to run it.'
                  )}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
                <span className='text-11px text-t-tertiary'>
                  {t(
                    'builder.form.description.hint',
                    'Shown on the workflow card and in the run picker. Be specific about the trigger.'
                  )}
                </span>
              </div>

              {/* Category + Tags */}
              <div className='flex gap-12px'>
                <div className='flex flex-col gap-6px flex-1'>
                  <label className='text-13px font-medium text-t-primary'>
                    {t('builder.form.category.label', 'Category')}
                  </label>
                  <Input
                    value={category}
                    onChange={setCategory}
                    placeholder={t(
                      'builder.form.category.placeholder',
                      'business-operations, content-creation, life-event…'
                    )}
                  />
                </div>
                <div className='flex flex-col gap-6px flex-1'>
                  <label className='text-13px font-medium text-t-primary'>
                    {t('builder.form.tags.label', 'Tags')}
                  </label>
                  <Input
                    value={tagsRaw}
                    onChange={setTagsRaw}
                    placeholder={t('builder.form.tags.placeholder', 'comma, separated, list')}
                  />
                </div>
              </div>

              {/* Body editor */}
              <div className='flex flex-col gap-6px'>
                <label className='text-13px font-medium text-t-primary'>
                  {t('builder.form.body.label', 'Workflow steps')}
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
          <Tabs.TabPane key='describe' title={t('builder.tab.describe', 'Describe it')}>
            <div className='flex flex-col gap-14px pt-12px'>
              <div className='flex flex-col gap-6px'>
                <label className='text-13px font-medium text-t-primary'>
                  {t(
                    'builder.describe.label',
                    'Describe the workflow in plain language - we will draft the SKILL.md.'
                  )}
                </label>
                <Input.TextArea
                  value={describePrompt}
                  onChange={setDescribePrompt}
                  placeholder={t(
                    'builder.describe.placeholder',
                    'Every Monday at 9am, draft a weekly newsletter from the past week\'s notes…'
                  )}
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
                    ? t('builder.describe.generating', 'Generating…')
                    : t('builder.describe.generate', 'Generate draft')}
                </Button>
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>

        {/* Scan verdict after save */}
        {savedVerdict && <VerdictAlert verdict={savedVerdict.verdict} name={savedVerdict.name} />}

        {/* Save error */}
        {saveError && <span className='text-12px text-[rgb(var(--danger-6))]'>{saveError}</span>}

        {/* Footer actions - canonical pill primary recipe (matches BuildSkillModal post-G0). */}
        <div className='flex items-center justify-end gap-12px pt-4px'>
          <Button onClick={handleClose} style={{ borderRadius: 8 }} className='px-16px'>
            {t('builder.actions.cancel', 'Cancel')}
          </Button>
          {savedVerdict && savedVerdict.verdict !== 'blocked' ? (
            <Button
              type='primary'
              onClick={handleDoneAfterSave}
              className=''
            >
              {t('builder.actions.done', 'Done')}
            </Button>
          ) : (
            <Button
              type='primary'
              loading={saving}
              disabled={!canSave}
              onClick={() => void handleSave()}
              className=''
            >
              {saving
                ? t('builder.actions.saving', 'Saving…')
                : t('builder.actions.save', 'Save workflow')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BuildWorkflowModal;
