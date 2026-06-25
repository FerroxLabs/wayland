/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ImportModal - shared 3-step import flow for Assistants and Workflows.
 *
 * Both surfaces reuse the same type-aware SkillImport pipeline: the importer
 * detects each SKILL.md's frontmatter `type:` and routes it (agent-profile ->
 * custom-assistant store, workflow/skill -> SkillLibrary). This modal is the
 * single front-end for that pipeline, parameterized by `kind` only for copy.
 *
 * Steps:
 *   1. Pick a source - local folder, git URL, or a single SKILL.md file.
 *   2. Run the import and show the SkillGuard verdict per item (clean / review
 *      / blocked) plus what surface each entry registered into.
 *   3. Confirm - the caller refreshes its list via onDone.
 */

import { Button, Input, Message, Spin } from '@arco-design/web-react';
import { AlertTriangle, Check, FileText, FolderOpen, GitBranch, ShieldAlert } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { ImportSummary } from '@/common/adapter/ipcBridge';
import type { SkillVerdict } from '@/common/types/skillTypes';
import WaylandModal from '@/renderer/components/base/WaylandModal';
import WaylandSteps from '@/renderer/components/base/WaylandSteps';
import { iconColors } from '@/renderer/styles/colors';

export type ImportKind = 'assistant' | 'workflow';

type ImportModalProps = {
  visible: boolean;
  kind: ImportKind;
  onCancel: () => void;
  /** Called after a successful import so the host can revalidate its list. */
  onDone: () => void;
};

type SourceKind = 'folder' | 'git' | 'singleSkillMd';

const verdictIcon = (verdict: SkillVerdict): React.ReactNode => {
  if (verdict === 'blocked') return <ShieldAlert size={16} color={iconColors.danger} />;
  if (verdict === 'review') return <AlertTriangle size={16} color={iconColors.warning} />;
  return <Check size={16} color={iconColors.success} />;
};

const ImportModal: React.FC<ImportModalProps> = ({ visible, kind, onCancel, onDone }) => {
  const { t } = useTranslation();
  const [message, messageContext] = Message.useMessage();
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<SourceKind>('folder');
  const [gitUrl, setGitUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const k = kind; // shorthand for the i18n key prefix segment
  const tk = useCallback(
    (suffix: string, fallback: string, opts?: Record<string, unknown>) =>
      t(`${k === 'assistant' ? 'assistants' : 'workflows'}.import.${suffix}`, { defaultValue: fallback, ...opts }),
    [k, t]
  );
  const ts = useCallback(
    (suffix: string, fallback: string, opts?: Record<string, unknown>) =>
      t(`common.importFlow.${suffix}`, { defaultValue: fallback, ...opts }),
    [t]
  );

  const reset = useCallback(() => {
    setStep(1);
    setSource('folder');
    setGitUrl('');
    setLoading(false);
    setSummary(null);
  }, []);

  const handleCancel = useCallback(() => {
    reset();
    onCancel();
  }, [onCancel, reset]);

  const runImport = useCallback(async () => {
    setLoading(true);
    setStep(2);
    try {
      let result: ImportSummary;
      if (source === 'git') {
        result = await ipcBridge.imports.git.invoke({ url: gitUrl.trim() });
      } else {
        const picked = await ipcBridge.dialog.showOpen.invoke({
          properties: source === 'folder' ? ['openDirectory'] : ['openFile'],
          ...(source === 'singleSkillMd'
            ? { filters: [{ name: 'SKILL.md', extensions: ['md'] }] }
            : {}),
        });
        const srcPath = picked?.[0];
        if (!srcPath) {
          // User dismissed the OS picker - return to step 1 without an error.
          setStep(1);
          setLoading(false);
          return;
        }
        result =
          source === 'folder'
            ? await ipcBridge.imports.folder.invoke({ srcPath })
            : await ipcBridge.imports.singleSkillMd.invoke({ srcPath });
      }
      setSummary(result);
    } catch (error) {
      console.error('Import failed:', error);
      message.error?.(ts('failed', 'Import failed. Check the source and try again.'));
      setStep(1);
    } finally {
      setLoading(false);
    }
  }, [source, gitUrl, message, ts]);

  const registeredCount = summary?.items.filter((i) => i.verdict !== 'blocked').length ?? 0;

  const handleConfirm = useCallback(() => {
    if (registeredCount > 0) onDone();
    reset();
    onCancel();
  }, [registeredCount, onDone, onCancel, reset]);

  const sourceButton = (value: SourceKind, icon: React.ReactNode, label: string) => (
    <Button
      long
      type={source === value ? 'primary' : 'secondary'}
      icon={icon}
      onClick={() => setSource(value)}
      style={{ borderRadius: 8, justifyContent: 'flex-start' }}
    >
      {label}
    </Button>
  );

  const renderStep1 = () => (
    <div className='flex flex-col gap-3 py-2'>
      <div className='text-t-secondary text-sm'>
        {tk('sourcePrompt', 'Choose where to import from. The file is scanned by Skill Guard before it lands.')}
      </div>
      {sourceButton('folder', <FolderOpen size={16} />, ts('sourceFolder', 'Local folder'))}
      {sourceButton('singleSkillMd', <FileText size={16} />, ts('sourceFile', 'Single SKILL.md file'))}
      {sourceButton('git', <GitBranch size={16} />, ts('sourceGit', 'Git repository URL'))}
      {source === 'git' && (
        <Input
          value={gitUrl}
          onChange={setGitUrl}
          placeholder='https://github.com/user/repo'
          style={{ borderRadius: 8 }}
        />
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className='py-2'>
      {loading ? (
        <div className='flex items-center gap-3 bg-fill-1 rounded-lg p-4'>
          <Spin size={20} />
          <div className='text-t-secondary text-sm'>{ts('scanning', 'Scanning and importing…')}</div>
        </div>
      ) : summary ? (
        <div className='flex flex-col gap-2'>
          {summary.items.length === 0 ? (
            <div className='text-center py-6 text-t-secondary'>
              {ts('empty', 'No importable items were found at that source.')}
            </div>
          ) : (
            summary.items.map((item) => (
              <div key={item.name} className='flex items-center gap-3 bg-base rounded-lg p-3'>
                {verdictIcon(item.verdict)}
                <div className='flex-1 min-w-0'>
                  <div className='font-medium text-t-primary truncate'>{item.name}</div>
                  <div className='text-xs text-t-secondary'>
                    {item.verdict === 'blocked'
                      ? ts('itemBlocked', 'Blocked by Skill Guard - quarantined, not imported')
                      : ts(`registeredAs.${item.registeredAs}`, item.registeredAs, {
                          defaultValue:
                            item.registeredAs === 'agent-profile'
                              ? 'Registered as Assistant'
                              : item.registeredAs === 'workflow'
                                ? 'Registered as Workflow'
                                : 'Registered as Skill',
                        })}
                  </div>
                </div>
              </div>
            ))
          )}
          {summary.warnings.map((w, i) => (
            <div key={i} className='flex items-center gap-2 text-xs text-warning px-1'>
              <AlertTriangle size={14} color={iconColors.warning} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  const renderStep3 = () => (
    <div className='flex flex-col items-center justify-center gap-3 py-8'>
      <Check size={32} color={iconColors.success} />
      <div className='text-t-primary text-center'>
        {tk('done', '{{count}} item imported.', { count: registeredCount })}
      </div>
    </div>
  );

  const canAdvanceStep1 = source !== 'git' || gitUrl.trim().length > 0;

  const renderFooter = () => (
    <div className='flex justify-end gap-2'>
      {step === 1 && (
        <>
          <Button onClick={handleCancel} className='min-w-100px' style={{ borderRadius: 8 }}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type='primary'
            onClick={() => void runImport()}
            disabled={!canAdvanceStep1}
            className='min-w-120px'
            style={{ borderRadius: 8 }}
          >
            {ts('run', 'Import')}
          </Button>
        </>
      )}
      {step === 2 && (
        <>
          <Button
            onClick={() => {
              setStep(1);
              setSummary(null);
            }}
            disabled={loading}
            className='min-w-100px'
            style={{ borderRadius: 8 }}
          >
            {t('common.back', { defaultValue: 'Back' })}
          </Button>
          <Button
            type='primary'
            onClick={() => setStep(3)}
            disabled={loading || registeredCount === 0}
            className='min-w-120px'
            style={{ borderRadius: 8 }}
          >
            {ts('confirm', 'Done')}
          </Button>
        </>
      )}
      {step === 3 && (
        <Button type='primary' onClick={handleConfirm} className='min-w-120px' style={{ borderRadius: 8 }}>
          {t('common.confirm', { defaultValue: 'Confirm' })}
        </Button>
      )}
    </div>
  );

  if (!visible) return null;

  return (
    <WaylandModal
      header={{
        title:
          kind === 'assistant'
            ? tk('title', 'Import assistant')
            : tk('title', 'Import workflow'),
        showClose: true,
      }}
      visible={visible}
      onCancel={handleCancel}
      footer={{ render: renderFooter }}
      style={{ width: 600 }}
      contentStyle={{ borderRadius: 16, padding: '24px', background: 'var(--dialog-fill-0)' }}
    >
      {messageContext}
      <div className='flex flex-col mt-2'>
        <div className='mb-6'>
          <WaylandSteps current={step} size='small'>
            <WaylandSteps.Step
              title={ts('stepSource', 'Source')}
              icon={step > 1 ? <Check size={16} color='rgb(var(--primary-6))' /> : undefined}
            />
            <WaylandSteps.Step
              title={ts('stepScan', 'Scan')}
              icon={step > 2 ? <Check size={16} color='rgb(var(--primary-6))' /> : undefined}
            />
            <WaylandSteps.Step title={ts('stepDone', 'Done')} />
          </WaylandSteps>
        </div>
        <div className='min-h-[200px]'>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </WaylandModal>
  );
};

export default ImportModal;
