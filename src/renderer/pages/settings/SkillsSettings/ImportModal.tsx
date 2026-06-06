/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Button, Input, Modal, Tabs } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { ImportResult } from '@process/services/skills/SkillImport';
import type { SkillSecurityReport } from '@/common/types/skillTypes';

type ImportTab = 'folder' | 'git' | 'zip' | 'singleSkillMd';

type ScannedEntry = {
  name: string;
  report: SkillSecurityReport;
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

const ScanResultsScreen: React.FC<{
  screen: ScanScreen;
  onImportAllClean: () => void;
  onReviewAndSelect: () => void;
  onCancel: () => void;
}> = ({ screen, onImportAllClean, onReviewAndSelect, onCancel }) => {
  const { t } = useTranslation();
  const hasBlocked = screen.quarantined.length > 0;
  const hasReview = screen.entries.some((e) => e.report.verdict === 'review');

  return (
    <div className='flex flex-col gap-16px'>
      <span className='text-15px font-semibold text-t-primary'>
        {t('skills.import.scan.title', { defaultValue: 'Scan results' })}
      </span>

      {screen.warnings.length > 0 && (
        <div className='bg-[rgba(var(--warning-6),0.08)] border border-[rgba(var(--warning-6),0.2)] rd-8px px-12px py-10px flex flex-col gap-4px'>
          {screen.warnings.map((w, i) => (
            <span key={i} className='text-12px text-[rgb(var(--warning-6))]'>{w}</span>
          ))}
        </div>
      )}

      <div className='flex flex-col gap-8px max-h-[320px] overflow-y-auto custom-scrollbar'>
        {screen.entries.map((entry) => (
          <div
            key={entry.name}
            className='flex items-start justify-between gap-12px p-12px bg-fill-1 rd-8px border border-b-base'
          >
            <div className='flex flex-col gap-4px min-w-0'>
              <span className='text-13px font-medium text-t-primary truncate'>{entry.name}</span>
              {entry.report.findings.length > 0 ? (
                <span className='text-12px text-t-secondary'>
                  {t('skills.import.scan.finding_other', {
                    count: entry.report.findings.length,
                    defaultValue: `${entry.report.findings.length} findings`,
                  })}
                </span>
              ) : (
                <span className='text-12px text-t-tertiary'>
                  {t('skills.import.scan.noFindings', { defaultValue: 'No issues found' })}
                </span>
              )}
            </div>
            <VerdictBadge verdict={entry.report.verdict} />
          </div>
        ))}

        {hasBlocked && screen.quarantined.map((name) => (
          <div
            key={name}
            className='flex items-start justify-between gap-12px p-12px bg-fill-1 rd-8px border border-[rgba(var(--danger-6),0.2)]'
          >
            <span className='text-13px font-medium text-t-primary truncate'>{name}</span>
            <VerdictBadge verdict='blocked' />
          </div>
        ))}
      </div>

      <div className='flex items-center justify-end gap-12px pt-4px'>
        <Button onClick={onCancel} style={{ borderRadius: 8 }} className='px-16px'>
          {t('skills.import.actions.cancel', { defaultValue: 'Cancel' })}
        </Button>
        {hasReview && (
          <Button onClick={onReviewAndSelect} style={{ borderRadius: 8 }} className='px-16px'>
            {t('skills.import.actions.reviewAndSelect', { defaultValue: 'Review and select' })}
          </Button>
        )}
        <Button
          type='primary'
          onClick={onImportAllClean}
          className=''
        >
          {t('skills.import.actions.importAllClean', { defaultValue: 'Import all clean' })}
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

  const reset = () => {
    setFolderPath('');
    setGitUrl('');
    setZipPath('');
    setSkillMdPath('');
    setError('');
    setScanScreen(null);
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
      report: r.report,
    }));
    setScanScreen({ entries, quarantined: result.quarantined, warnings: result.warnings });
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

  const handleBrowseFolder = async () => {
    try {
      const paths = await ipcBridge.dialog.showOpen.invoke({ properties: ['openDirectory', 'createDirectory'] });
      if (paths && paths.length > 0) setFolderPath(paths[0]);
    } catch { /* dismissed */ }
  };

  const handleBrowseZip = async () => {
    try {
      const paths = await ipcBridge.dialog.showOpen.invoke({
        properties: ['openFile'],
        filters: [{ name: 'ZIP archives', extensions: ['zip'] }],
      } as Parameters<typeof ipcBridge.dialog.showOpen.invoke>[0]);
      if (paths && paths.length > 0) setZipPath(paths[0]);
    } catch { /* dismissed */ }
  };

  const handleBrowseSkillMd = async () => {
    try {
      const paths = await ipcBridge.dialog.showOpen.invoke({
        properties: ['openFile'],
        filters: [{ name: 'SKILL.md', extensions: ['md'] }],
      } as Parameters<typeof ipcBridge.dialog.showOpen.invoke>[0]);
      if (paths && paths.length > 0) setSkillMdPath(paths[0]);
    } catch { /* dismissed */ }
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
          onImportAllClean={() => { onImported(); handleClose(); }}
          onReviewAndSelect={() => { onImported(); handleClose(); }}
          onCancel={handleClose}
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
        <Tabs activeTab={tab} onChange={(k) => { setTab(k as ImportTab); setError(''); }}>
          <Tabs.TabPane
            key='folder'
            title={t('skills.import.source.folder', { defaultValue: 'Folder' })}
          >
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

          <Tabs.TabPane
            key='git'
            title={t('skills.import.source.git', { defaultValue: 'Git URL' })}
          >
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

          <Tabs.TabPane
            key='zip'
            title={t('skills.import.source.zip', { defaultValue: 'ZIP file' })}
          >
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
                  placeholder={t('skills.import.singleSkillMd.placeholder', { defaultValue: 'Click to choose a SKILL.md…' })}
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

        {/* Marketplace tile - FEATURE-FLAGGED OFF.
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
              ClawHub integration is not yet available.
            </span>
          </div>
        </div>

        {error && (
          <span className='text-12px text-[rgb(var(--danger-6))]'>{error}</span>
        )}

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
