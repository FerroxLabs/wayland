/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ImportDrawer - 480px push-content right drawer surfacing 4 import sources.
 *
 * Width transitions 0→480 over 0.22s via CSS (push-content, NOT overlay).
 * Wire-up to the topbar Import icon is Wave 2's job - this component is
 * standalone and self-contained.
 *
 * Sources:
 *   1. claude-mem   - imports from ~/.claude-mem/claude-mem.db
 *   2. Obsidian     - detects vault list, user picks one, imports .md files
 *   3. ~/dev scan   - scans dev directory for IJFW memory dirs
 *   4. Drop folder  - ~/Documents/Wayland-Memory/ watcher + one-shot process
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Message } from '@arco-design/web-react';
import { Close } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import styles from './ImportDrawer.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImportDrawerProps = {
  open: boolean;
  onClose: () => void;
};

type ImportStatus = 'idle' | 'checking' | 'ready' | 'unavailable' | 'importing';

type VaultEntry = {
  path: string;
  mdCount: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImportDrawer({ open, onClose }: ImportDrawerProps): React.ReactElement | null {
  const { t } = useTranslation('memory');

  // ── claude-mem state ────────────────────────────────────────────────────
  const [claudeMemStatus, setClaudeMemStatus] = useState<ImportStatus>('idle');
  const [claudeMemCount, setClaudeMemCount] = useState<number | null>(null);

  // ── obsidian state ──────────────────────────────────────────────────────
  const [obsidianStatus, setObsidianStatus] = useState<ImportStatus>('idle');
  const [obsidianVaults, setObsidianVaults] = useState<VaultEntry[]>([]);
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const [obsidianCount, setObsidianCount] = useState<number | null>(null);

  // ── dev scan state ──────────────────────────────────────────────────────
  const [devStatus, setDevStatus] = useState<ImportStatus>('idle');
  const [devCount, setDevCount] = useState<number | null>(null);

  // ── drop folder state ───────────────────────────────────────────────────
  const [dropStatus, setDropStatus] = useState<ImportStatus>('idle');
  const [dropCount, setDropCount] = useState<number | null>(null);

  const DROP_FOLDER_PATH = '~/Documents/Wayland-Memory/';

  // Track mount to avoid setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Esc closes drawer
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // On open: probe obsidian vaults (best-effort)
  useEffect(() => {
    if (!open) return;

    // Probe obsidian - the obsidianDetectVaults verb is NOT exposed in ipcBridge,
    // so we fall back to "idle" (show "Click to scan").
    // DEVIATION: ipcBridge.memory.import.obsidianDetectVaults does not exist.
    // Wave 2 / W1b must add this verb if vault detection is needed.
    setObsidianStatus('idle');
    setObsidianVaults([]);
    setSelectedVault(null);
  }, [open]);

  // ── claude-mem import ────────────────────────────────────────────────────
  const handleClaudeMemImport = useCallback(async () => {
    setClaudeMemStatus('importing');
    try {
      const result = await ipcBridge.memory.import.claudeMem.invoke();
      if (!mountedRef.current) return;
      setClaudeMemStatus('ready');
      setClaudeMemCount(result.count);
      Message.success(
        t(
          'archive.import.claudeMem.success',
          `Imported ${result.count} entries · ${result.errors.length} errors`,
        ),
      );
      // Fire refresh event for any listening list components
      window.dispatchEvent(new CustomEvent('wayland:memory:imported'));
    } catch {
      if (!mountedRef.current) return;
      setClaudeMemStatus('idle');
      Message.error(t('archive.import.claudeMem.error', 'Import failed. Try again.'));
    }
  }, [t]);

  // ── obsidian import ──────────────────────────────────────────────────────
  const handleObsidianImport = useCallback(async () => {
    if (!selectedVault) return;
    setObsidianStatus('importing');
    try {
      const result = await ipcBridge.memory.import.obsidianVault.invoke({ vaultPath: selectedVault });
      if (!mountedRef.current) return;
      setObsidianStatus('ready');
      setObsidianCount(result.count);
      Message.success(
        t(
          'archive.import.obsidian.success',
          `Imported ${result.count} entries · ${result.errors.length} errors`,
        ),
      );
      window.dispatchEvent(new CustomEvent('wayland:memory:imported'));
    } catch {
      if (!mountedRef.current) return;
      setObsidianStatus('idle');
      Message.error(t('archive.import.obsidian.error', 'Obsidian import failed. Try again.'));
    }
  }, [selectedVault, t]);

  // ── dev scan import ──────────────────────────────────────────────────────
  const handleDevScanImport = useCallback(async () => {
    setDevStatus('importing');
    try {
      const result = await ipcBridge.memory.import.scanDevDir.invoke();
      if (!mountedRef.current) return;
      setDevStatus('ready');
      setDevCount(result.count);
      Message.success(
        t(
          'archive.import.devScan.success',
          `Imported ${result.count} entries from ${result.projectsFound ?? 0} projects`,
        ),
      );
      window.dispatchEvent(new CustomEvent('wayland:memory:imported'));
    } catch {
      if (!mountedRef.current) return;
      setDevStatus('idle');
      Message.error(t('archive.import.devScan.error', 'Dev scan import failed. Try again.'));
    }
  }, [t]);

  // ── drop folder ──────────────────────────────────────────────────────────
  const handleOpenFolder = useCallback(() => {
    // ipcBridge.shell.openExternal takes a string arg - use it for folder paths too
    void ipcBridge.shell.openExternal.invoke(DROP_FOLDER_PATH).catch(() => {
      // Best-effort; if it fails, fall back silently.
    });
  }, []);

  const handleProcessDropFolder = useCallback(async () => {
    setDropStatus('importing');
    try {
      const result = await ipcBridge.memory.import.processDropFolder.invoke();
      if (!mountedRef.current) return;
      setDropStatus('ready');
      setDropCount(result.count);
      Message.success(
        t(
          'archive.import.dropFolder.success',
          `Processed ${result.count} files · ${result.errors.length} errors`,
        ),
      );
      window.dispatchEvent(new CustomEvent('wayland:memory:imported'));
    } catch {
      if (!mountedRef.current) return;
      setDropStatus('idle');
      Message.error(t('archive.import.dropFolder.error', 'Processing failed. Try again.'));
    }
  }, [t]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function statusPillClass(status: ImportStatus): string {
    if (status === 'ready') return `${styles.statusPill} ${styles.pillReady}`;
    if (status === 'checking' || status === 'importing') return `${styles.statusPill} ${styles.pillChecking}`;
    if (status === 'unavailable') return `${styles.statusPill} ${styles.pillUnavailable}`;
    return `${styles.statusPill} ${styles.pillChecking}`;
  }

  function statusPillLabel(status: ImportStatus): string {
    switch (status) {
      case 'ready': return t('archive.import.status.ready', 'ready');
      case 'checking': return t('archive.import.status.checking', 'checking');
      case 'importing': return t('archive.import.status.importing', 'importing');
      case 'unavailable': return t('archive.import.status.unavailable', 'unavailable');
      default: return t('archive.import.status.idle', 'idle');
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className={`${styles.drawer}${open ? ` ${styles.drawerOpen}` : ''}`}
      data-testid='import-drawer'
      aria-hidden={!open}
    >
      {open && (
        <div className={styles.inner} data-testid='import-drawer-inner'>
          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title} data-testid='import-drawer-title'>
              {t('archive.import.title', 'Import memories')}
            </h2>
            <Button
              className={styles.closeBtn}
              shape='circle'
              size='mini'
              type='secondary'
              icon={<Close theme='outline' size='12' />}
              onClick={onClose}
              aria-label={t('archive.import.close', 'Close import drawer')}
              data-testid='import-drawer-close-btn'
            />
          </div>

          {/* Body - 4 source cards */}
          <div className={styles.body} data-testid='import-drawer-body'>
            {/* Card 1 - claude-mem */}
            <div className={styles.card} data-testid='import-card-claudemem'>
              <div className={styles.cardTopRow}>
                <div className={styles.iconTile} aria-hidden>🧠</div>
                <span className={styles.cardTitle}>
                  {t('archive.import.claudeMem.title', 'claude-mem')}
                </span>
                {claudeMemStatus !== 'idle' && (
                  <span className={statusPillClass(claudeMemStatus)} data-testid='import-pill-claudemem'>
                    {statusPillLabel(claudeMemStatus)}
                  </span>
                )}
              </div>
              <p className={styles.subline} data-testid='import-subline-claudemem'>
                {claudeMemCount !== null
                  ? t('archive.import.claudeMem.count', `~${claudeMemCount} entries imported`)
                  : t('archive.import.claudeMem.hint', 'Click to import from ~/.claude-mem/claude-mem.db')}
              </p>
              <Button
                type='primary'
                long
                loading={claudeMemStatus === 'importing'}
                disabled={claudeMemStatus === 'importing'}
                onClick={() => { void handleClaudeMemImport(); }}
                data-testid='import-btn-claudemem'
              >
                {claudeMemStatus === 'importing'
                  ? t('archive.import.importing', 'Importing…')
                  : t('archive.import.claudeMem.btn', 'Import')}
              </Button>
            </div>

            {/* Card 2 - Obsidian vault */}
            <div className={styles.card} data-testid='import-card-obsidian'>
              <div className={styles.cardTopRow}>
                <div className={styles.iconTile} aria-hidden>📓</div>
                <span className={styles.cardTitle}>
                  {t('archive.import.obsidian.title', 'Obsidian vault')}
                </span>
                {obsidianStatus !== 'idle' && (
                  <span className={statusPillClass(obsidianStatus)} data-testid='import-pill-obsidian'>
                    {statusPillLabel(obsidianStatus)}
                  </span>
                )}
              </div>
              <p className={styles.subline} data-testid='import-subline-obsidian'>
                {obsidianCount !== null
                  ? t('archive.import.obsidian.count', `~${obsidianCount} entries imported`)
                  : t('archive.import.obsidian.hint', 'Click to scan for vaults')}
              </p>

              {/* Vault list (populated if detection wire-up lands in Wave 2) */}
              {obsidianVaults.length > 0 && (
                <div className={styles.vaultList} data-testid='import-vault-list'>
                  {obsidianVaults.map((v) => (
                    <div
                      key={v.path}
                      className={`${styles.vaultRow}${selectedVault === v.path ? ` ${styles.vaultRowSelected}` : ''}`}
                      role='button'
                      tabIndex={0}
                      onClick={() => setSelectedVault(v.path)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedVault(v.path);
                        }
                      }}
                      data-testid='import-vault-row'
                    >
                      <input
                        type='radio'
                        className={styles.vaultRadio}
                        checked={selectedVault === v.path}
                        onChange={() => setSelectedVault(v.path)}
                        aria-label={v.path}
                        readOnly
                      />
                      <span className={styles.vaultPath}>{v.path}</span>
                      <span className={styles.vaultMdCount}>{v.mdCount} .md</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type='primary'
                long
                loading={obsidianStatus === 'importing'}
                disabled={obsidianStatus === 'importing' || (obsidianVaults.length > 0 && !selectedVault)}
                onClick={() => { void handleObsidianImport(); }}
                data-testid='import-btn-obsidian'
              >
                {obsidianStatus === 'importing'
                  ? t('archive.import.importing', 'Importing…')
                  : t('archive.import.obsidian.btn', 'Import')}
              </Button>
            </div>

            {/* Card 3 - ~/dev scan */}
            <div className={styles.card} data-testid='import-card-devscan'>
              <div className={styles.cardTopRow}>
                <div className={styles.iconTile} aria-hidden>📁</div>
                <span className={styles.cardTitle}>
                  {t('archive.import.devScan.title', '~/dev scan')}
                </span>
                {devStatus !== 'idle' && (
                  <span className={statusPillClass(devStatus)} data-testid='import-pill-devscan'>
                    {statusPillLabel(devStatus)}
                  </span>
                )}
              </div>
              <p className={styles.subline} data-testid='import-subline-devscan'>
                {devCount !== null
                  ? t('archive.import.devScan.count', `~${devCount} entries imported`)
                  : t('archive.import.devScan.hint', 'Scans ~/dev for IJFW memory directories')}
              </p>
              <Button
                type='primary'
                long
                loading={devStatus === 'importing'}
                disabled={devStatus === 'importing'}
                onClick={() => { void handleDevScanImport(); }}
                data-testid='import-btn-devscan'
              >
                {devStatus === 'importing'
                  ? t('archive.import.importing', 'Importing…')
                  : t('archive.import.devScan.btn', 'Import')}
              </Button>
            </div>

            {/* Card 4 - Drop folder */}
            <div className={styles.card} data-testid='import-card-dropfolder'>
              <div className={styles.cardTopRow}>
                <div className={styles.iconTile} aria-hidden>📥</div>
                <span className={styles.cardTitle}>
                  {t('archive.import.dropFolder.title', 'Drop folder')}
                </span>
                {dropStatus !== 'idle' && (
                  <span className={statusPillClass(dropStatus)} data-testid='import-pill-dropfolder'>
                    {statusPillLabel(dropStatus)}
                  </span>
                )}
              </div>
              <p className={styles.subline} data-testid='import-subline-dropfolder'>
                {dropCount !== null
                  ? t('archive.import.dropFolder.count', `${dropCount} files processed`)
                  : t('archive.import.dropFolder.hint', `Drop .md / .txt / .json files into ${DROP_FOLDER_PATH}`)}
              </p>
              <p className={styles.dropPath} data-testid='import-dropfolder-path'>
                {DROP_FOLDER_PATH}
              </p>
              <div className={styles.cardBottomRow}>
                <Button
                  type='secondary'
                  long
                  onClick={handleOpenFolder}
                  data-testid='import-btn-openfolder'
                >
                  {t('archive.import.dropFolder.openBtn', 'Open folder')}
                </Button>
                <Button
                  type='primary'
                  loading={dropStatus === 'importing'}
                  disabled={dropStatus === 'importing'}
                  onClick={() => { void handleProcessDropFolder(); }}
                  data-testid='import-btn-dropfolder'
                >
                  {dropStatus === 'importing'
                    ? t('archive.import.importing', 'Importing…')
                    : t('archive.import.dropFolder.processBtn', 'Process now')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportDrawer;
