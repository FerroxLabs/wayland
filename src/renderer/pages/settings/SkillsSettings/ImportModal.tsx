/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Button, Input, Message, Modal, Tabs } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { ImportResult } from '@process/services/skills/SkillImport';
import type { SkillFinding, SkillSecurityReport } from '@/common/types/skillTypes';

type ImportTab = 'folder' | 'git' | 'zip' | 'singleSkillMd';

type ScannedEntry = {
  name: string;
  /** Absolute imported path - needed to confirm a held (review) skill. */
  destPath: string;
  report: SkillSecurityReport;
  /** Whether the skill is already live (clean) or held pending consent (review). */
  registered: boolean;
};

type ScanScreen = {
  entries: ScannedEntry[];
  quarantined: string[];
  warnings: string[];
};

type ImportModalProps = {
  visible: boolean;
  onClose: () => void;
  onImported: () => void;
};

const VerdictBadge: React.FC<{ verdict: SkillSecurityReport['verdict'] }> = ({ verdict }) => {
  const { t } = useTranslation();
  const colorMap: Record<string, string> = {
    clean: 'bg-[rgba(var(--success-6),0.10)] text-[rgb(var(--success-6))] border-[rgba(var(--success-6),0.2)]',
    review: 'bg-[rgba(var(--warning-6),0.10)] text-[rgb(var(--warning-6))] border-[rgba(var(--warning-6),0.2)]',
    blocked: 'bg-[rgba(var(--danger-6),0.10)] text-[rgb(var(--danger-6))] border-[rgba(var(--danger-6),0.2)]',
  };
  const cls = colorMap[verdict] ?? colorMap['review'];
  return (
    <span className={`inline-flex items-center px-8px py-2px rd-4px border text-11px font-medium ${cls}`}>
      {t(`skills.import.scan.verdict.${verdict}`, { defaultValue: verdict })}
    </span>
  );
};

/** Plain-English list of findings for a held (review) skill. */
const FindingList: React.FC<{ findings: SkillFinding[] }> = ({ findings }) => {
  const { t } = useTranslation();
  if (findings.length === 0) return null;
  return (
    <ul className='flex flex-col gap-2px m-0 pl-16px'>
      {findings.map((f, i) => (
        <li key={i} className='text-12px text-t-secondary'>
          {t(`skills.import.scan.threat.${f.threat}`, { defaultValue: f.threat })}
          {f.evidence ? <span className='text-t-tertiary'> — {f.evidence}</span> : null}
        </li>
      ))}
    </ul>
  );
};

const ScanResultsScreen: React.FC<{
  screen: ScanScreen;
  confirming: string | null;
  onConfirmReview: (entry: ScannedEntry) => void;
  onDone: () => void;
}> = ({ screen, confirming, onConfirmReview, onDone }) => {
  const { t } = useTranslation();
  const hasBlocked = screen.quarantined.length > 0;
  // Honesty (spec): if any non-blocked entry was NOT deep-swept, say so - never
  // imply "verified safe" off the heuristic scan alone.
  const heuristicOnly = screen.entries.some((e) => !e.report.llmScanned && e.report.verdict !== 'blocked');

  return (
    <div className='flex flex-col gap-16px'>
      <span className='text-15px font-semibold text-t-primary'>
        {t('skills.import.scan.title', { defaultValue: 'Scan results' })}
      </span>

      {heuristicOnly && (
        <div className='bg-[rgba(var(--warning-6),0.08)] border border-[rgba(var(--warning-6),0.2)] rd-8px px-12px py-10px'>
          <span className='text-12px text-[rgb(var(--warning-6))]'>
            {t('skills.import.scan.heuristicOnly', {
              defaultValue: 'Deep sweep unavailable — heuristic scan only.',
            })}
          </span>
        </div>
      )}

      {screen.warnings.length > 0 && (
        <div className='bg-[rgba(var(--warning-6),0.08)] border border-[rgba(var(--warning-6),0.2)] rd-8px px-12px py-10px flex flex-col gap-4px'>
          {screen.warnings.map((w, i) => (
            <span key={i} className='text-12px text-[rgb(var(--warning-6))]'>
              {w}
            </span>
          ))}
        </div>
      )}

      <div className='flex flex-col gap-8px max-h-[360px] overflow-y-auto custom-scrollbar'>
        {screen.entries.map((entry) => {
          const isReview = entry.report.verdict === 'review';
          return (
            <div key={entry.name} className='flex flex-col gap-8px p-12px bg-fill-1 rd-8px border border-b-base'>
              <div className='flex items-start justify-between gap-12px'>
                <div className='flex flex-col gap-4px min-w-0'>
                  <span className='text-13px font-medium text-t-primary truncate'>{entry.name}</span>
                  {entry.report.verdict === 'clean' ? (
                    <span className='text-12px text-t-tertiary'>
                      {t('skills.import.scan.clean', { defaultValue: 'Scanned — no red flags found.' })}
                    </span>
                  ) : (
                    <FindingList findings={entry.report.findings} />
                  )}
                </div>
                <VerdictBadge verdict={entry.report.verdict} />
              </div>
              {isReview && (
                <div className='flex justify-end'>
                  <Button
                    size='small'
                    status='warning'
                    loading={confirming === entry.name}
                    disabled={entry.registered}
                    onClick={() => onConfirmReview(entry)}
                  >
                    {entry.registered
                      ? t('skills.import.actions.imported', { defaultValue: 'Imported' })
                      : t('skills.import.actions.importAnyway', { defaultValue: 'Import anyway' })}
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {hasBlocked &&
          screen.quarantined.map((name) => (
            <div
              key={name}
              className='flex flex-col gap-4px p-12px bg-fill-1 rd-8px border border-[rgba(var(--danger-6),0.2)]'
            >
              <div className='flex items-start justify-between gap-12px'>
                <span className='text-13px font-medium text-t-primary truncate'>{name}</span>
                <VerdictBadge verdict='blocked' />
              </div>
              <span className='text-12px text-t-secondary'>
                {t('skills.import.scan.blocked', {
                  defaultValue: 'Blocked and quarantined — this skill will not be used.',
                })}
              </span>
            </div>
          ))}
      </div>

      <div className='flex items-center justify-end gap-12px pt-4px'>
        <Button type='primary' onClick={onDone} style={{ borderRadius: 8 }} className='px-16px'>
          {t('skills.import.actions.done', { defaultValue: 'Done' })}
        </Button>
      </div>
    </div>
  );
};

const ImportModal: React.FC<ImportModalProps> = ({ visible, onClose, onImported }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ImportTab>('folder');
  const [folderPath, setFolderPath] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [zipPath, setZipPath] = useState('');
  const [skillMdPath, setSkillMdPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanScreen, setScanScreen] = useState<ScanScreen | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const reset = () => {
    setFolderPath('');
    setGitUrl('');
    setZipPath('');
    setSkillMdPath('');
    setError('');
    setScanScreen(null);
    setConfirming(null);
    setLoading(false);
    setTab('folder');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const applyResult = (result: ImportResult) => {
    const entries: ScannedEntry[] = result.imported.map((r) => ({
      name: r.name,
      destPath: r.destPath,
      report: r.report,
      registered: r.registered,
    }));
    setScanScreen({ entries, quarantined: result.quarantined, warnings: result.warnings });
    // A clean skill is already live - refresh the underlying list immediately.
    if (entries.some((e) => e.registered)) onImported();
  };

  const handleImport = async () => {
    setError('');
    setLoading(true);
    try {
      let result: ImportResult;
      if (tab === 'folder') {
        result = await ipcBridge.skills.import.folder.invoke({ srcPath: folderPath });
      } else if (tab === 'git') {
        result = await ipcBridge.skills.import.git.invoke({ url: gitUrl });
      } else if (tab === 'zip') {
        result = await ipcBridge.skills.import.zip.invoke({ zipPath });
      } else {
        result = await ipcBridge.skills.import.singleSkillMd.invoke({ srcPath: skillMdPath });
      }
      applyResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('skills.import.error.failed', { defaultValue: 'Import failed' }));
    } finally {
      setLoading(false);
    }
  };

  // C3: user explicitly approves a held (review) skill. Keyed by the imported
  // path + the contentHash the user saw, so the approval can't be replayed
  // against different content.
  const handleConfirmReview = async (entry: ScannedEntry) => {
    setConfirming(entry.name);
    try {
      const res = await ipcBridge.skills.confirmImport.invoke({
        name: entry.name,
        destPath: entry.destPath,
        contentHash: entry.report.contentHash ?? '',
      });
      if (!('error' in res)) {
        setScanScreen((prev) =>
          prev
            ? { ...prev, entries: prev.entries.map((e) => (e.name === entry.name ? { ...e, registered: true } : e)) }
            : prev
        );
        onImported();
        Message.success(t('skills.import.confirm.done', { defaultValue: 'Skill imported' }));
      } else {
        const reason = res.error;
        Message.error(
          t(`skills.import.confirm.error.${reason}`, {
            defaultValue:
              reason === 'content-changed'
                ? 'The skill changed since it was scanned — re-import it.'
                : reason === 'blocked'
                  ? 'This skill is blocked and cannot be imported.'
                  : 'The imported skill could not be found.',
          })
        );
      }
    } catch {
      Message.error(t('skills.import.confirm.error.failed', { defaultValue: 'Import failed' }));
    } finally {
      setConfirming(null);
    }
  };

  const handleBrowseFolder = async () => {
    try {
      const paths = await ipcBridge.dialog.showOpen.invoke({ properties: ['openDirectory', 'createDirectory'] });
      if (paths && paths.length > 0) setFolderPath(paths[0]);
    } catch {
      /* dismissed */
    }
  };

  const handleBrowseZip = async () => {
    try {
      const paths = await ipcBridge.dialog.showOpen.invoke({
        properties: ['openFile'],
        filters: [{ name: 'ZIP archives', extensions: ['zip'] }],
      } as Parameters<typeof ipcBridge.dialog.showOpen.invoke>[0]);
      if (paths && paths.length > 0) setZipPath(paths[0]);
    } catch {
      /* dismissed */
    }
  };

  const handleBrowseSkillMd = async () => {
    try {
      const paths = await ipcBridge.dialog.showOpen.invoke({
        properties: ['openFile'],
        filters: [{ name: 'SKILL.md', extensions: ['md'] }],
      } as Parameters<typeof ipcBridge.dialog.showOpen.invoke>[0]);
      if (paths && paths.length > 0) setSkillMdPath(paths[0]);
    } catch {
      /* dismissed */
    }
  };

  const canImport =
    !loading &&
    ((tab === 'folder' && folderPath.trim().length > 0) ||
      (tab === 'git' && gitUrl.trim().length > 0) ||
      (tab === 'zip' && zipPath.trim().length > 0) ||
      (tab === 'singleSkillMd' && skillMdPath.trim().length > 0));

  if (scanScreen) {
    return (
      <Modal
        visible={visible}
        onCancel={handleClose}
        footer={null}
        title={t('skills.import.title', { defaultValue: 'Import skill' })}
        style={{ width: 640 }}
        focusLock
        autoFocus={false}
      >
        <ScanResultsScreen
          screen={scanScreen}
          confirming={confirming}
          onConfirmReview={(entry) => void handleConfirmReview(entry)}
          onDone={handleClose}
        />
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      onCancel={handleClose}
      footer={null}
      title={t('skills.import.title', { defaultValue: 'Import skill' })}
      focusLock
      autoFocus={false}
    >
      <div className='flex flex-col gap-16px'>
        <Tabs
          activeTab={tab}
          onChange={(k) => {
            setTab(k as ImportTab);
            setError('');
          }}
        >
          <Tabs.TabPane key='folder' title={t('skills.import.source.folder', { defaultValue: 'Folder' })}>
            <div className='flex flex-col gap-8px pt-12px'>
              <span className='text-13px font-medium text-t-primary'>
                {t('skills.import.folder.label', { defaultValue: 'Skill folder' })}
              </span>
              <div className='flex gap-8px'>
                <Input
                  value={folderPath}
                  onChange={setFolderPath}
                  placeholder={t('skills.import.folder.placeholder', { defaultValue: 'Click to choose a folder…' })}
                  className='flex-1'
                  readOnly
                />
                <Button onClick={() => void handleBrowseFolder()}>
                  {t('skills.import.folder.browse', { defaultValue: 'Browse' })}
                </Button>
              </div>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key='git' title={t('skills.import.source.git', { defaultValue: 'Git URL' })}>
            <div className='flex flex-col gap-8px pt-12px'>
              <span className='text-13px font-medium text-t-primary'>
                {t('skills.import.git.label', { defaultValue: 'Git URL' })}
              </span>
              <Input
                value={gitUrl}
                onChange={setGitUrl}
                placeholder={t('skills.import.git.placeholder', { defaultValue: 'https://github.com/user/my-skill' })}
              />
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key='zip' title={t('skills.import.source.zip', { defaultValue: 'ZIP file' })}>
            <div className='flex flex-col gap-8px pt-12px'>
              <span className='text-13px font-medium text-t-primary'>
                {t('skills.import.zip.label', { defaultValue: 'ZIP file' })}
              </span>
              <div className='flex gap-8px'>
                <Input
                  value={zipPath}
                  onChange={setZipPath}
                  placeholder={t('skills.import.zip.placeholder', { defaultValue: 'Click to choose a ZIP…' })}
                  className='flex-1'
                  readOnly
                />
                <Button onClick={() => void handleBrowseZip()}>
                  {t('skills.import.zip.browse', { defaultValue: 'Browse' })}
                </Button>
              </div>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane
            key='singleSkillMd'
            title={t('skills.import.source.singleSkillMd', { defaultValue: 'Single SKILL.md' })}
          >
            <div className='flex flex-col gap-8px pt-12px'>
              <span className='text-13px font-medium text-t-primary'>
                {t('skills.import.singleSkillMd.label', { defaultValue: 'SKILL.md file' })}
              </span>
              <div className='flex gap-8px'>
                <Input
                  value={skillMdPath}
                  onChange={setSkillMdPath}
                  placeholder={t('skills.import.singleSkillMd.placeholder', {
                    defaultValue: 'Click to choose a SKILL.md…',
                  })}
                  className='flex-1'
                  readOnly
                />
                <Button onClick={() => void handleBrowseSkillMd()}>
                  {t('skills.import.singleSkillMd.browse', { defaultValue: 'Browse' })}
                </Button>
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>

        {/* Marketplace tile — FEATURE-FLAGGED OFF.
            ClawHub has no public API yet; this tile is intentionally disabled.
            Re-enable when ClawHub integration is available (see wayland roadmap). */}
        <div
          aria-disabled='true'
          className='flex items-center gap-12px p-14px bg-fill-1 rd-10px border border-b-base border-dashed opacity-50 select-none cursor-not-allowed'
        >
          <div className='flex flex-col gap-2px'>
            <span className='text-13px font-medium text-t-secondary'>
              {t('skills.import.source.marketplace', { defaultValue: 'Marketplace (coming soon)' })}
            </span>
            <span className='text-12px text-t-tertiary'>
              {t('skills.import.source.marketplaceHint', { defaultValue: 'ClawHub integration is not yet available.' })}
            </span>
          </div>
        </div>

        {error && <span className='text-12px text-[rgb(var(--danger-6))]'>{error}</span>}

        <div className='flex items-center justify-end gap-12px'>
          <Button onClick={handleClose} style={{ borderRadius: 8 }} className='px-16px'>
            {t('skills.import.actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type='primary'
            loading={loading}
            disabled={!canImport}
            onClick={() => void handleImport()}
            className=''
          >
            {loading
              ? t('skills.import.actions.importing', { defaultValue: 'Importing…' })
              : t('skills.import.actions.import', { defaultValue: 'Import' })}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportModal;
