/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { ICreateProjectParams } from '@/common/types/project';
import { Button, Input, Message, Modal } from '@arco-design/web-react';
import { Check, FolderOpen, Sparkles, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import KnowledgeWizard from './KnowledgeWizard';

const PROJECT_COLORS = ['#FF6A00', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];

/**
 * The guided "new project" flow. Two light steps - basics, then optional
 * AI-drafted instructions - with an always-visible "skip" so it never blocks
 * (Sutherland: never force; Krug: one obvious exit). The instructions step is
 * the same KnowledgeWizard used in Settings, so there's one way to write them.
 */
const NewProjectWizard: React.FC<{
  visible: boolean;
  canGenerate: boolean;
  onClose: () => void;
  /** Create the project, optionally writing drafted instructions, then navigate. */
  onComplete: (params: ICreateProjectParams, instructions?: string) => Promise<void>;
}> = ({ visible, canGenerate, onClose, onComplete }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0); // 0 basics · 1 instructions
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [iconColor, setIconColor] = useState(PROJECT_COLORS[0]);
  const [instructions, setInstructions] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStep(0);
    setName('');
    setDescription('');
    setWorkspace('');
    setIconColor(PROJECT_COLORS[0]);
    setInstructions('');
    setWizardOpen(false);
    setSubmitting(false);
  }, [visible]);

  const chooseFolder = useCallback(() => {
    ipcBridge.dialog.showOpen
      .invoke({ properties: ['openDirectory', 'createDirectory'] })
      .then((dirs) => {
        if (dirs && dirs[0]) setWorkspace(dirs[0]);
      })
      .catch((err) => console.error('Folder dialog failed:', err));
  }, []);

  const finish = useCallback(async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onComplete(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          workspace: workspace.trim() || undefined,
          iconColor,
        },
        instructions.trim() || undefined
      );
      // onComplete navigates away; closing keeps state clean if it doesn't.
      onClose();
    } catch {
      Message.error(t('projects.toast.saveFailed'));
      setSubmitting(false);
    }
  }, [name, description, workspace, iconColor, instructions, onComplete, onClose, t]);

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      title={null}
      footer={null}
      style={{ width: 600 }}
      maskClosable={false}
      autoFocus={false}
    >
      <div className='flex flex-col gap-14px'>
        <div className='flex flex-col gap-2px'>
          <span className='flex items-center gap-6px text-11px font-700 uppercase tracking-wide text-primary'>
            <Sparkles size={12} />
            {t('projects.newWizard.eyebrow')}
          </span>
          <span className='text-18px font-700 text-t-primary'>
            {step === 0 ? t('projects.newWizard.basicsTitle') : t('projects.newWizard.instructionsTitle')}
          </span>
          <span className='text-13px text-t-secondary'>
            {step === 0 ? t('projects.newWizard.basicsSub') : t('projects.newWizard.instructionsSub')}
          </span>
        </div>

        <div className='flex items-center gap-6px'>
          {[0, 1].map((i) => (
            <div
              key={i}
              className='h-4px flex-1 rd-full transition-colors'
              style={{ background: i <= step ? 'var(--color-primary-6)' : 'var(--color-fill-3)' }}
            />
          ))}
        </div>

        <div className='min-h-200px'>
          {step === 0 && (
            <div className='flex flex-col gap-14px'>
              <div className='flex flex-col gap-6px'>
                <span className='text-13px font-500 text-t-secondary'>{t('projects.modal.nameLabel')}</span>
                <Input
                  autoFocus
                  value={name}
                  onChange={setName}
                  placeholder={t('projects.modal.namePlaceholder')}
                  maxLength={80}
                  showWordLimit
                />
              </div>
              <div className='flex flex-col gap-6px'>
                <span className='text-13px font-500 text-t-secondary'>
                  {t('projects.newWizard.whatLabel')}{' '}
                  <span className='text-t-tertiary font-400'>{t('projects.newWizard.whatHint')}</span>
                </span>
                <Input.TextArea
                  value={description}
                  onChange={setDescription}
                  placeholder={t('projects.modal.descriptionPlaceholder')}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  maxLength={400}
                />
              </div>
              <div className='flex flex-col gap-6px'>
                <span className='text-13px font-500 text-t-secondary'>
                  {t('projects.modal.workspaceLabel')}{' '}
                  <span className='text-t-tertiary font-400'>{t('projects.newWizard.workspaceOptional')}</span>
                </span>
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
              </div>
            </div>
          )}

          {step === 1 && (
            <div className='flex flex-col gap-12px'>
              {!canGenerate ? (
                <div className='rd-10px border border-solid border-2 bg-fill-1 px-16px py-16px text-center'>
                  <div className='text-13px font-600 text-t-secondary'>{t('projects.newWizard.noModelTitle')}</div>
                  <div className='text-12px text-t-tertiary mt-3px leading-relaxed'>
                    {t('projects.newWizard.noModelBody')}
                  </div>
                </div>
              ) : instructions ? (
                <div className='flex flex-col gap-8px'>
                  <span
                    className='flex items-center gap-6px text-12px font-600'
                    style={{ color: 'var(--color-success-6)' }}
                  >
                    <Check size={14} /> {t('projects.newWizard.instructionsReady')}
                  </span>
                  <div className='rd-10px border border-solid border-2 bg-fill-1 px-14px py-12px max-h-200px overflow-auto text-12px text-t-secondary whitespace-pre-wrap'>
                    {instructions}
                  </div>
                  <Button size='small' type='text' icon={<Sparkles size={13} />} onClick={() => setWizardOpen(true)}>
                    {t('projects.newWizard.redo')}
                  </Button>
                </div>
              ) : (
                <div className='rd-10px border border-dashed border-2 px-16px py-20px text-center flex flex-col items-center gap-10px'>
                  <div className='text-13px text-t-secondary leading-relaxed max-w-380px'>
                    {t('projects.newWizard.instructionsPrompt')}
                  </div>
                  <Button type='primary' icon={<Sparkles size={14} />} onClick={() => setWizardOpen(true)}>
                    {t('projects.newWizard.draftInstructions')}
                  </Button>
                  <span className='text-11px text-t-tertiary'>{t('projects.newWizard.orSkipBelow')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className='flex items-center justify-between gap-10px pt-4px'>
          <span className='text-12px text-t-tertiary cursor-pointer underline underline-offset-2 hover:text-t-secondary' onClick={() => void finish()}>
            {t('projects.newWizard.skip')}
          </span>
          <div className='flex items-center gap-8px'>
            {step === 1 && <Button onClick={() => setStep(0)}>{t('projects.wizard.back')}</Button>}
            {step === 0 ? (
              <Button type='primary' disabled={!name.trim()} onClick={() => setStep(1)}>
                {t('projects.wizard.continue')}
              </Button>
            ) : (
              <Button type='primary' loading={submitting} disabled={!name.trim()} onClick={() => void finish()}>
                {t('projects.newWizard.create')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {wizardOpen && (
        <KnowledgeWizard
          visible={wizardOpen}
          kind='context'
          projectName={name}
          projectDescription={description}
          onClose={() => setWizardOpen(false)}
          onAccept={(draft) => setInstructions(draft)}
        />
      )}
    </Modal>
  );
};

export default NewProjectWizard;
