/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import Markdown from '@/renderer/components/Markdown';
import { Button, Input, Message, Modal, Spin, Tag } from '@arco-design/web-react';
import { FileText, RefreshCw, Sparkles, Upload, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type WizardKind = 'context' | 'rules';

/**
 * A small, AI-assisted wizard that turns a blank page into a best-practice
 * Instructions (`context`) or Rules document. It collects a little source
 * material (a sentence, pasted text, or uploaded files) and two quick chip
 * answers, then asks the best available model for a draft the user can accept,
 * regenerate, or edit. Reused by Project Settings and the new-project flow.
 *
 * All AI here is gated by the caller (only offered when a model is connected);
 * the draft call still degrades gracefully and never hangs.
 */
const KnowledgeWizard: React.FC<{
  visible: boolean;
  kind: WizardKind;
  projectName?: string;
  projectDescription?: string;
  /** Existing project knowledge (instructions + decisions) used to inform a Rules draft. */
  relatedKnowledge?: string;
  onClose: () => void;
  onAccept: (draftMarkdown: string) => void;
}> = ({ visible, kind, projectName, projectDescription, relatedKnowledge, onClose, onAccept }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0); // 0 source · 1 questions · 2 draft

  // Step 0 - source material
  const [sourceText, setSourceText] = useState('');
  const [files, setFiles] = useState<Array<{ name: string; path: string }>>([]);

  // Step 1 - chip answers
  const [audience, setAudience] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string[]>([]);
  const [extra, setExtra] = useState('');

  // Step 2 - draft
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<'no-model' | 'failed' | null>(null);

  const AUDIENCE_CHIPS = useMemo(
    () => [
      t('projects.wizard.audience.customers'),
      t('projects.wizard.audience.team'),
      t('projects.wizard.audience.me'),
      t('projects.wizard.audience.developers'),
      t('projects.wizard.audience.executives'),
      t('projects.wizard.audience.public'),
    ],
    [t]
  );
  const CONSTRAINT_CHIPS = useMemo(
    () => [
      t('projects.wizard.constraints.onBrand'),
      t('projects.wizard.constraints.concise'),
      t('projects.wizard.constraints.citeSources'),
      t('projects.wizard.constraints.noHype'),
      t('projects.wizard.constraints.matchStyle'),
      t('projects.wizard.constraints.factsLocked'),
    ],
    [t]
  );

  // Reset the whole wizard each time it opens, seeding source from the description.
  useEffect(() => {
    if (!visible) return;
    setStep(0);
    setSourceText(projectDescription || '');
    setFiles([]);
    setAudience([]);
    setConstraints([]);
    setExtra('');
    setDraft('');
    setGenError(null);
    setGenerating(false);
  }, [visible, projectDescription]);

  const toggle = (list: string[], value: string, set: (v: string[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const browse = useCallback(async () => {
    const paths = await ipcBridge.dialog.showOpen.invoke({ properties: ['openFile', 'multiSelections'] });
    if (paths && paths.length > 0) {
      setFiles((prev) => {
        const seen = new Set(prev.map((f) => f.path));
        const added = paths.filter((p) => !seen.has(p)).map((p) => ({ name: p.split(/[\\/]/).pop() || p, path: p }));
        return [...prev, ...added];
      });
    }
  }, []);

  const generate = useCallback(async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const constraintText = [...constraints, extra.trim()].filter(Boolean).join('; ');
      const { draft: out, error } = await ipcBridge.project.generateKnowledgeDraft.invoke({
        name: projectName,
        description: projectDescription,
        kind,
        sourceText: sourceText.trim() || undefined,
        filePaths: files.length > 0 ? files.map((f) => f.path) : undefined,
        relatedKnowledge: relatedKnowledge?.trim() || undefined,
        audience: audience.length > 0 ? audience.join(', ') : undefined,
        constraints: constraintText || undefined,
      });
      if (error) setGenError(error);
      else if (out) setDraft(out);
      else setGenError('failed');
    } catch {
      setGenError('failed');
    } finally {
      setGenerating(false);
    }
  }, [constraints, extra, projectName, projectDescription, relatedKnowledge, kind, sourceText, files, audience]);

  // Auto-generate when arriving at the draft step with no draft yet.
  useEffect(() => {
    if (visible && step === 2 && !draft && !generating && !genError) void generate();
  }, [visible, step, draft, generating, genError, generate]);

  const stepTitles = [
    t('projects.wizard.step.source'),
    t('projects.wizard.step.questions'),
    t('projects.wizard.step.draft'),
  ];
  const heading =
    kind === 'rules' ? t('projects.wizard.titleRules') : t('projects.wizard.titleInstructions');

  const next = () => setStep((s) => Math.min(2, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const accept = () => {
    if (!draft.trim()) return;
    onAccept(draft.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      title={null}
      footer={null}
      style={{ width: 640 }}
      maskClosable={false}
      autoFocus={false}
    >
      <div className='flex flex-col gap-14px'>
        {/* Header */}
        <div className='flex flex-col gap-2px'>
          <span className='flex items-center gap-6px text-11px font-700 uppercase tracking-wide text-primary'>
            <Sparkles size={12} />
            {heading}
          </span>
          <span className='text-13px text-t-secondary'>{t('projects.wizard.subtitle')}</span>
        </div>

        {/* Step progress */}
        <div className='flex items-center gap-6px'>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className='h-4px flex-1 rd-full transition-colors'
              style={{ background: i <= step ? 'var(--color-primary-6)' : 'var(--color-fill-3)' }}
            />
          ))}
        </div>

        {/* Body */}
        <div className='min-h-260px'>
          {step === 0 && (
            <div className='flex flex-col gap-10px'>
              <div className='text-14px font-600 text-t-primary'>{t('projects.wizard.source.q')}</div>
              <div className='text-12px text-t-tertiary'>{t('projects.wizard.source.hint')}</div>
              <Input.TextArea
                value={sourceText}
                onChange={setSourceText}
                placeholder={t('projects.wizard.source.placeholder')}
                autoSize={{ minRows: 4, maxRows: 9 }}
              />
              <div className='flex items-center gap-8px'>
                <Button size='small' icon={<Upload size={14} />} onClick={() => void browse()}>
                  {t('projects.wizard.source.upload')}
                </Button>
                <span className='text-11px text-t-tertiary'>{t('projects.wizard.source.uploadHint')}</span>
              </div>
              {files.length > 0 && (
                <div className='flex flex-col gap-4px'>
                  {files.map((f) => (
                    <div
                      key={f.path}
                      className='group flex items-center gap-8px px-10px py-6px rd-8px bg-fill-1 border border-solid border-2'
                    >
                      <FileText size={13} className='text-t-tertiary flex-shrink-0' />
                      <span className='text-12px text-t-primary truncate flex-1' title={f.path}>
                        {f.name}
                      </span>
                      <button
                        type='button'
                        aria-label={t('projects.knowledge.reference.remove')}
                        className='flex items-center justify-center w-18px h-18px rd-4px bg-transparent border-none cursor-pointer text-t-tertiary opacity-0 group-hover:opacity-100 transition-opacity hover:text-t-primary'
                        onClick={() => setFiles((prev) => prev.filter((x) => x.path !== f.path))}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className='flex flex-col gap-14px'>
              {kind === 'context' && (
                <div className='flex flex-col gap-8px'>
                  <div className='text-14px font-600 text-t-primary'>{t('projects.wizard.audience.q')}</div>
                  <div className='flex flex-wrap gap-8px'>
                    {AUDIENCE_CHIPS.map((c) => (
                      <Tag
                        key={c}
                        checkable
                        checked={audience.includes(c)}
                        onCheck={() => toggle(audience, c, setAudience)}
                        className='cursor-pointer'
                      >
                        {c}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
              <div className='flex flex-col gap-8px'>
                <div className='text-14px font-600 text-t-primary'>{t('projects.wizard.constraints.q')}</div>
                <div className='flex flex-wrap gap-8px'>
                  {CONSTRAINT_CHIPS.map((c) => (
                    <Tag
                      key={c}
                      checkable
                      checked={constraints.includes(c)}
                      onCheck={() => toggle(constraints, c, setConstraints)}
                      className='cursor-pointer'
                    >
                      {c}
                    </Tag>
                  ))}
                </div>
                <Input.TextArea
                  value={extra}
                  onChange={setExtra}
                  placeholder={t('projects.wizard.constraints.placeholder')}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className='flex flex-col gap-10px'>
              <div className='flex items-center justify-between'>
                <div className='text-14px font-600 text-t-primary'>{t('projects.wizard.draft.q')}</div>
                <span className='text-11px text-t-tertiary'>{t('projects.wizard.draft.modelNote')}</span>
              </div>
              <div className='rd-10px border border-solid border-2 bg-fill-1 min-h-200px max-h-360px overflow-auto px-14px py-12px'>
                {generating ? (
                  <div className='flex flex-col items-center justify-center gap-10px py-40px text-t-tertiary'>
                    <Spin />
                    <span className='text-12px'>{t('projects.wizard.draft.generating')}</span>
                  </div>
                ) : genError ? (
                  <div className='flex flex-col items-center justify-center gap-8px py-36px text-center'>
                    <span className='text-13px text-t-secondary'>
                      {genError === 'no-model'
                        ? t('projects.wizard.draft.noModel')
                        : t('projects.wizard.draft.failed')}
                    </span>
                    {genError === 'failed' && (
                      <Button size='small' icon={<RefreshCw size={13} />} onClick={() => void generate()}>
                        {t('projects.wizard.draft.retry')}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className='text-13px text-t-primary'>
                    <Markdown>{draft}</Markdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between gap-10px pt-4px'>
          <span className='text-11px text-t-tertiary'>{stepTitles[step]}</span>
          <div className='flex items-center gap-8px'>
            <Button type='text' onClick={onClose}>
              {t('common.cancel')}
            </Button>
            {step > 0 && <Button onClick={back}>{t('projects.wizard.back')}</Button>}
            {step < 2 && (
              <Button type='primary' onClick={next}>
                {step === 1 ? t('projects.wizard.generate') : t('projects.wizard.continue')}
              </Button>
            )}
            {step === 2 && !generating && !genError && (
              <>
                <Button icon={<RefreshCw size={13} />} onClick={() => void generate()}>
                  {t('projects.wizard.regenerate')}
                </Button>
                <Button type='primary' disabled={!draft.trim()} onClick={accept}>
                  {t('projects.wizard.useDraft')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default KnowledgeWizard;
