/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MemoryStatusBar - 28px bottom strip.
 *
 * Left: green pulse dot + "Brain live" + "N CLIs" + lastDream info.
 * Right: kbd hints ⌘K / J K / / / Esc (K9 fix).
 *
 * cliCount comes from IjfwStatusPayload.cliCount (no-deferment #3).
 * lastDream stats come from MemoryStats.factsExtracted / promoted count (no-deferment #4).
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import styles from './MemoryStatusBar.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LastDream = {
  factsExtracted: number;
  promoted: number;
  agoMs: number;
};

type DropFolderStatus = {
  path: string;
  watching: boolean;
  ingestedToday: number;
};

export type MemoryStatusBarProps = {
  brainLive: boolean;
  cliCount: number;
  lastDream?: LastDream;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMs(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

/** Replace leading $HOME with `~` for display. */
function abbreviatePath(p: string): string {
  try {
    // In the renderer we don't have `os` - fall back to matching common home
    // path prefixes. The server returns an absolute path; we just tidy it up.
    const homePatterns = ['/Users/', '/home/'];
    for (const prefix of homePatterns) {
      const idx = p.indexOf(prefix);
      if (idx !== 0) continue;
      const afterHome = p.slice(prefix.length).indexOf('/');
      if (afterHome === -1) return '~';
      return '~' + p.slice(prefix.length + afterHome);
    }
  } catch {
    // ignore
  }
  return p;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MemoryStatusBar: React.FC<MemoryStatusBarProps> = ({
  brainLive,
  cliCount,
  lastDream,
}) => {
  const { t } = useTranslation('memory');
  const [dropStatus, setDropStatus] = useState<DropFolderStatus | null>(null);
  const [openPathError, setOpenPathError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = (): void => {
      ipcBridge.memory.import.getDropFolderStatus
        .invoke()
        .then((status) => {
          if (!cancelled) setDropStatus(status);
        })
        .catch(() => {
          // Non-critical - silently ignore
        });
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleOpenDropFolder = (): void => {
    if (!dropStatus) return;
    setOpenPathError(null);
    ipcBridge.shell.openPath
      .invoke({ path: dropStatus.path })
      .then((result) => {
        if (!result.ok && result.error) {
          setOpenPathError(result.error);
        }
      })
      .catch((err: unknown) => {
        setOpenPathError(String(err));
      });
  };

  return (
    <div className={styles.bar} role='status' data-testid='memory-status-bar'>
      {/* Left: status info */}
      <div className={styles.left}>
        <span className={styles.pill} data-testid='status-brain-pill'>
          <span
            className={`${styles.dot} ${brainLive ? styles.dotLive : styles.dotOffline}`}
            aria-hidden
          />
          <span>{brainLive ? t('archive.status.brainLive', 'Brain live') : t('archive.status.brainOffline', 'Brain offline')}</span>
        </span>

        {cliCount > 0 && (
          <>
            <span className={styles.sep} aria-hidden>·</span>
            <span className={styles.pill} data-testid='status-cli-pill'>
              {cliCount} {t('archive.status.clis', 'CLIs')}
            </span>
          </>
        )}

        {lastDream && (
          <>
            <span className={styles.sep} aria-hidden>·</span>
            <span className={styles.pill} data-testid='status-dream-pill'>
              {t('archive.status.lastDream', 'Last dream {{ago}} · {{facts}} facts extracted · {{promoted}} candidates near threshold', {
                ago: formatMs(lastDream.agoMs),
                facts: lastDream.factsExtracted,
                promoted: lastDream.promoted,
              })}
            </span>
          </>
        )}

        {dropStatus !== null && (
          <>
            <span className={styles.sep} aria-hidden>·</span>
            <button
              type='button'
              className={styles.dropChip}
              data-testid='status-drop-folder-chip'
              title={openPathError
                ? openPathError
                : t('archive.statusbar.dropFolder.open', 'Open folder in Finder')}
              onClick={handleOpenDropFolder}
            >
              <span
                className={`${styles.dot} ${dropStatus.watching ? styles.dotLive : styles.dotOffline}`}
                aria-hidden
              />
              <span aria-hidden>📁</span>
              <span>{abbreviatePath(dropStatus.path)}</span>
              {dropStatus.ingestedToday > 0 && (
                <span className={styles.dropBadge} data-testid='status-drop-badge'>
                  {t('archive.statusbar.dropFolder.today', '{{count}} today', { count: dropStatus.ingestedToday })}
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* Right: kbd hints (K9) */}
      <div className={styles.right}>
        <span className={styles.kbd} data-testid='status-kbd-search'>⌘K</span>
        <span className={styles.kbdLabel}>{t('archive.status.kbd.search', 'search')}</span>
        <span className={styles.kbdSep} aria-hidden>·</span>
        <span className={styles.kbd} data-testid='status-kbd-nav-j'>J</span>
        <span className={styles.kbd} data-testid='status-kbd-nav-k'>K</span>
        <span className={styles.kbdLabel}>{t('archive.status.kbd.navigate', 'navigate')}</span>
        <span className={styles.kbdSep} aria-hidden>·</span>
        <span className={styles.kbd} data-testid='status-kbd-focus'>⌘K</span>
        <span className={styles.kbdLabel}>/</span>
        <span className={styles.kbdSep} aria-hidden>·</span>
        <span className={styles.kbd} data-testid='status-kbd-close'>Esc</span>
        <span className={styles.kbdLabel}>{t('archive.status.kbd.close', 'close')}</span>
      </div>
    </div>
  );
};

export default MemoryStatusBar;
