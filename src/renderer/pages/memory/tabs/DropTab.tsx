/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wave 5 — DropTab is the user-facing drop zone for queuing files into the
 * IJFW ingest pipeline. ALL file-safety logic (extension allowlist, size cap,
 * queue cap, ownership checks) lives in the main process via
 * `ijfwDropBridge` — the renderer only calls IPC providers and renders
 * results.
 *
 * Surface:
 *   - HTML5 drag/drop zone calling `dropIngest.invoke({ path })` per file.
 *     Electron 41+ deprecated `File.path`; we use `webUtils.getPathForFile`
 *     exposed via `window.electronAPI.getPathForFile` instead, with a
 *     `File.path` fallback for any non-Electron build path.
 *   - "Browse" Arco Button that opens a native multi-select file dialog via
 *     `dialog.showOpen.invoke()` and ingests each picked path.
 *   - Queued-files list backed by `dropList.invoke()`; refreshes on mount and
 *     after every ingest/quarantine. Each row has a red Quarantine button
 *     wired to `dropQuarantine.invoke({ name })`.
 *   - All error toasts go through `t('memory.error.<errorReason>')` with
 *     `memory.error.unknown` as the fallback so existing locale dictionaries
 *     keep working.
 */

import { Button, Empty, Message, Spin } from '@arco-design/web-react';
import { FileText, Trash2, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { IjfwDropEntry } from '@/common/adapter/ipcBridge';
import styles from './DropTab.module.css';

// Extended File shape exposed by older Electron builds — `path` is the
// absolute fs path. Modern Electron (>=41) deprecates this in favor of
// `webUtils.getPathForFile`; we still read `.path` as a defensive fallback.
type ElectronFile = File & { path?: string };

/**
 * Resolve an absolute filesystem path for a File from a DataTransfer using
 * Electron 41+'s `webUtils.getPathForFile` bridge. Falls back to the
 * deprecated `File.path` property if the bridge is unavailable. Returns
 * `null` when no path can be recovered (e.g. the file came from a browser
 * source and not the OS file picker / drag-drop).
 */
const resolveDroppedPath = (file: File): string | null => {
  const bridgeGet = window.electronAPI?.getPathForFile;
  if (typeof bridgeGet === 'function') {
    try {
      const viaBridge = bridgeGet(file);
      if (typeof viaBridge === 'string' && viaBridge.length > 0) {
        return viaBridge;
      }
    } catch {
      // Bridge errored; fall through to legacy path read.
    }
  }
  const legacy = (file as ElectronFile).path;
  if (typeof legacy === 'string' && legacy.length > 0) {
    return legacy;
  }
  return null;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatQueuedAt = (mtimeMs: number): string => {
  try {
    return new Date(mtimeMs).toLocaleString();
  } catch {
    return '';
  }
};

const DropTab: React.FC = () => {
  const { t } = useTranslation();
  // i18next's `t` is a new function reference per render under the
  // react-i18next mock used in tests. Capture it in a ref so async callbacks
  // can read the latest translator without forcing useEffect to re-fire on
  // every render (which would otherwise produce an infinite refresh loop).
  const tRef = useRef(t);
  tRef.current = t;

  const [files, setFiles] = useState<IjfwDropEntry[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ipcBridge.ijfw.dropList.invoke();
      setFiles(result.files);
    } catch {
      setFiles([]);
      Message.error(tRef.current('memory.error.unknown'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const ingestPath = useCallback(async (path: string): Promise<boolean> => {
    const result = await ipcBridge.ijfw.dropIngest.invoke({ path });
    if (result.ok === true) {
      Message.success(
        tRef.current('memory.drop.ingest_success', { name: result.name })
      );
      return true;
    }
    const reason = result.errorReason ?? 'unknown';
    Message.error(
      tRef.current(`memory.error.${reason}`, {
        defaultValue: tRef.current('memory.error.unknown'),
      })
    );
    return false;
  }, []);

  const ingestPaths = useCallback(
    async (paths: string[]) => {
      if (paths.length === 0) return;
      setBusy(true);
      try {
        for (const path of paths) {
          // Sequential so per-file Message toasts don't overlap and the
          // queue-cap check on the main side stays accurate.
          // eslint-disable-next-line no-await-in-loop
          await ingestPath(path);
        }
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [ingestPath, refresh]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      const dropped = Array.from(event.dataTransfer.files);
      const paths: string[] = [];
      let pathFailures = 0;
      for (const file of dropped) {
        const resolved = resolveDroppedPath(file);
        if (resolved !== null) {
          paths.push(resolved);
        } else {
          pathFailures += 1;
        }
      }
      if (pathFailures > 0) {
        Message.error(tRef.current('memory.drop.path_unavailable'));
      }
      if (paths.length > 0) {
        await ingestPaths(paths);
      }
    },
    [ingestPaths]
  );

  const handleBrowse = useCallback(async () => {
    const picked = await ipcBridge.dialog.showOpen.invoke({
      properties: ['openFile', 'multiSelections'],
    });
    if (picked === undefined || picked.length === 0) return;
    await ingestPaths(picked);
  }, [ingestPaths]);

  const handleQuarantine = useCallback(
    async (name: string) => {
      setBusy(true);
      try {
        const result = await ipcBridge.ijfw.dropQuarantine.invoke({ name });
        if (result.ok === true) {
          Message.success(
            tRef.current('memory.drop.quarantine_success', { name })
          );
          await refresh();
        } else {
          Message.error(tRef.current('memory.error.unknown'));
        }
      } catch {
        Message.error(tRef.current('memory.error.unknown'));
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  return (
    <div className={styles.root} data-testid='memory-tab-drop'>
      <div
        className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid='memory-drop-zone'
        role='region'
        aria-label={t('memory.drop.zone_title')}
        aria-busy={busy ? 'true' : 'false'}
      >
        <Upload size={28} className={styles.dropIcon} aria-hidden />
        <div className={styles.dropZoneTitle}>{t('memory.drop.zone_title')}</div>
        <div className={styles.dropZoneHint}>{t('memory.drop.zone_hint')}</div>
        <div className={styles.dropZoneActions}>
          <Button
            type='primary'
            size='small'
            loading={busy}
            onClick={handleBrowse}
            data-testid='memory-drop-browse'
          >
            {t('memory.drop.browse_button')}
          </Button>
        </div>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionHeader}>
          <FileText size={14} aria-hidden />
          {t('memory.drop.queue_title')}
        </h3>

        {loading === true ? (
          <div className={styles.loading} data-testid='memory-drop-loading'>
            <Spin />
          </div>
        ) : files === null || files.length === 0 ? (
          <div className={styles.empty} data-testid='memory-drop-empty'>
            <Empty description={t('memory.drop.queue_empty')} />
          </div>
        ) : (
          <div className={styles.list} data-testid='memory-drop-list'>
            {files.map((file) => (
              <div
                key={file.name}
                className={styles.row}
                data-testid={`memory-drop-row-${file.name}`}
              >
                <div className={styles.rowMain}>
                  <FileText size={14} aria-hidden />
                  <span className={styles.rowName} title={file.name}>
                    {file.name}
                  </span>
                  <span className={styles.rowMeta}>
                    {formatSize(file.size)} · {formatQueuedAt(file.mtimeMs)}
                  </span>
                </div>
                <Button
                  type='outline'
                  status='danger'
                  size='mini'
                  icon={<Trash2 size={12} aria-hidden />}
                  loading={busy}
                  onClick={() => handleQuarantine(file.name)}
                  data-testid={`memory-drop-quarantine-${file.name}`}
                >
                  {t('memory.drop.quarantine_button')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DropTab;
