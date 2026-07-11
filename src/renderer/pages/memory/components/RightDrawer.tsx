/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * RightDrawer - 480px push-content drawer shell for the Memory Archive.
 *
 * Renders nothing when entry === null.
 * Width transitions 0→480 over 0.22s via CSS - push-content, NOT overlay.
 * The list column must have a synchronized margin-right transition.
 *
 * Sections rendered (S4 fix): Summary, Why, How to apply,
 * Used in the wild (ref cards), Tags, Source path.
 * Why must be visible without scrolling (K3 fix).
 *
 * Promotion score bar (S5): track 6px + fill + 90% threshold marker.
 * Color: green ≥90, amber 80-89, muted <80 (per §4 token table).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Tag, Tooltip } from '@arco-design/web-react';
import { Close, Copy, LinkOne, FileCode, Help, Edit, Delete } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import type { MemoryEntry, MemoryType } from '@/common/types/memory';
import { ipcBridge } from '@/common';
import styles from './RightDrawer.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExtendedEntry = MemoryEntry & {
  body: string;
  dereferences?: Array<{
    source: string;
    line: number;
    preview: string;
    lastAt: number;
  }>;
};

export type RightDrawerProps = {
  entry: ExtendedEntry | null;
  promotionThreshold?: number;
  onClose: () => void;
  onPromote?: (id: string) => void;
  onOpenSource?: (path: string, line: number) => void;
  onCopy?: (text: string) => void;
  /** Open the editor for this entry (#414). */
  onEdit?: (entry: ExtendedEntry) => void;
  /** Delete this entry after confirmation (#414). */
  onDelete?: (entry: ExtendedEntry) => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatRelative = (ts: number): string => {
  const diff = Math.max(0, Date.now() - ts);
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const TYPE_COLORS: Record<MemoryType, string> = {
  decision: '#FF7A45',
  pattern: '#5EEAD4',
  session: '#7DD3FC',
  observation: '#94A3B8',
  wiki: '#C084FC',
  preference: '#FCD34D',
};

const SCORE_TOOLTIP =
  'Score = (referenced × 0.15) + (type weight) + (recency decay over 30d). Auto-promotes at threshold.';

// ---------------------------------------------------------------------------
// SourcePanel - expandable inline view of source file context
// ---------------------------------------------------------------------------

type SourcePanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | {
      status: 'ok';
      before: string;
      anchor: string;
      after: string;
      totalLines: number;
      fromLine: number;
      toLine: number;
    };

type SourcePanelProps = {
  path: string;
  line: number;
  autoExpand?: boolean;
};

const SourcePanel: React.FC<SourcePanelProps> = ({ path, line, autoExpand = false }) => {
  const [open, setOpen] = useState(autoExpand);
  const [state, setState] = useState<SourcePanelState>({ status: 'idle' });
  const fetchedRef = useRef(false);

  const filename = path.split('/').pop() ?? path;

  const fetchSource = useCallback(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setState({ status: 'loading' });
    ipcBridge.memory.readSourceContext
      .invoke({ path, line, contextLines: 50 })
      .then((result) => {
        const r = result as {
          ok: boolean;
          before?: string;
          anchor?: string;
          after?: string;
          totalLines?: number;
          error?: string;
        };
        if (r.ok) {
          const ctxLines = 50;
          const anchorLine = Math.max(1, line);
          const fromLine = Math.max(1, anchorLine - ctxLines);
          const toLine = Math.min(r.totalLines ?? 0, anchorLine + ctxLines);
          setState({
            status: 'ok',
            before: r.before ?? '',
            anchor: r.anchor ?? '',
            after: r.after ?? '',
            totalLines: r.totalLines ?? 0,
            fromLine,
            toLine,
          });
        } else {
          setState({ status: 'error', error: r.error ?? 'Unknown error' });
        }
      })
      .catch((err: unknown) => {
        setState({ status: 'error', error: (err as Error).message });
      });
  }, [path, line]);

  // Auto-expand: fetch immediately on mount
  useEffect(() => {
    if (autoExpand) {
      fetchSource();
    }
  }, [autoExpand, fetchSource]);

  const handleToggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    if (next) fetchSource();
  }, [open, fetchSource]);

  return (
    <div className={styles.sourcePanel} data-testid='source-panel'>
      <button
        type='button'
        className={styles.sourcePanelToggle}
        onClick={handleToggle}
        aria-expanded={open}
        data-testid='source-panel-toggle'
      >
        <span>📄 Read source · {filename}</span>
        <span className={styles.sourcePanelCaret}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.sourcePanelBody} data-testid='source-panel-body'>
          {state.status === 'loading' && (
            <div className={styles.sourcePanelLoading} data-testid='source-panel-loading'>
              Loading source…
            </div>
          )}
          {state.status === 'error' && (
            <div className={styles.sourcePanelError} data-testid='source-panel-error'>
              Couldn't read source: {state.error}
            </div>
          )}
          {state.status === 'ok' && (
            <>
              <div className={styles.sourcePanelBadge} data-testid='source-panel-badge'>
                Showing lines {state.fromLine}–{state.toLine} of {state.totalLines}
              </div>
              {state.before.length > 0 && (
                <div className={styles.sourcePanelContext} data-testid='source-panel-before'>
                  <ReactMarkdown>{state.before}</ReactMarkdown>
                </div>
              )}
              <div className={styles.sourcePanelAnchor} data-testid='source-panel-anchor'>
                <ReactMarkdown>{state.anchor}</ReactMarkdown>
              </div>
              {state.after.length > 0 && (
                <div className={styles.sourcePanelContext} data-testid='source-panel-after'>
                  <ReactMarkdown>{state.after}</ReactMarkdown>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RightDrawer: React.FC<RightDrawerProps> = ({
  entry,
  promotionThreshold = 90,
  onClose,
  onPromote,
  onOpenSource,
  onCopy,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation('memory');

  // Esc closes drawer
  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleCopySource = useCallback(
    (path: string, line: number) => {
      const text = `${path}:L${line}`;
      // Use Electron clipboard if available, else navigator.clipboard
      const win = window as unknown as { electronAPI?: { clipboard?: { writeText?: (s: string) => void } } };
      if (win.electronAPI?.clipboard?.writeText) {
        win.electronAPI.clipboard.writeText(text);
      } else {
        void navigator.clipboard.writeText(text);
      }
      onCopy?.(text);
    },
    [onCopy]
  );

  const isOpen = entry !== null;

  return (
    <div
      className={`${styles.drawer}${isOpen ? ` ${styles.drawerOpen}` : ''}`}
      data-testid='right-drawer'
      aria-hidden={!isOpen}
    >
      {isOpen && (
        <div className={styles.inner} data-testid='right-drawer-inner'>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <Button
                className={styles.closeBtn}
                shape='circle'
                size='mini'
                type='secondary'
                icon={<Close theme='outline' size='12' />}
                onClick={onClose}
                aria-label={t('archive.drawer.close', 'Close drawer')}
                data-testid='drawer-close-btn'
              />
              <h2 className={styles.title} data-testid='drawer-title'>
                {entry.summary}
              </h2>
            </div>

            {/* Meta row */}
            <div className={styles.meta} data-testid='drawer-meta'>
              <span
                className={styles.typeBadge}
                style={{
                  background: `${TYPE_COLORS[entry.type] ?? '#888'}22`,
                  color: TYPE_COLORS[entry.type] ?? '#888',
                }}
                data-testid='drawer-type-badge'
              >
                {entry.type}
              </span>
              <span className={styles.metaSep}>·</span>
              <span className={styles.metaDate}>{formatRelative(entry.storedAt)}</span>
              <span className={styles.metaSep}>·</span>
              <span className={styles.metaProject} data-testid='drawer-project'>
                {entry.projectPath.split('/').pop() ?? entry.project}
              </span>
              {entry.referencedBy > 0 && (
                <>
                  <span className={styles.metaSep}>·</span>
                  <span className={styles.refPill} data-testid='drawer-ref-pill'>
                    ↺ {t('archive.drawer.usedNTimes', 'Used {{count}}× this week', { count: entry.referencedBy })}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action row */}
          <div className={styles.actions} data-testid='drawer-actions'>
            <Button
              type='primary'
              size='small'
              disabled={entry.type === 'wiki'}
              onClick={() => {
                if (entry.type !== 'wiki') onPromote?.(entry.id);
              }}
              data-testid='drawer-promote-btn'
            >
              {entry.type === 'wiki'
                ? t('archive.drawer.alreadyPromoted', 'Already promoted ✓')
                : t('archive.drawer.promote', '↑ Promote to Wiki')}
            </Button>
            <Button
              type='text'
              size='small'
              icon={<LinkOne theme='outline' size='13' />}
              onClick={() => onOpenSource?.(entry.sourcePath, entry.sourceLine)}
              data-testid='drawer-open-btn'
            >
              {t('archive.drawer.openFile', 'Open file')}
            </Button>
            <Button
              type='text'
              size='small'
              icon={<Copy theme='outline' size='13' />}
              onClick={() => onCopy?.(entry.body)}
              data-testid='drawer-copy-btn'
            >
              {t('archive.drawer.copy', 'Copy')}
            </Button>
            <Button
              type='text'
              size='small'
              icon={<Edit theme='outline' size='13' />}
              onClick={() => onEdit?.(entry)}
              data-testid='drawer-edit-btn'
            >
              {t('archive.drawer.edit', 'Edit')}
            </Button>
            <Button
              type='text'
              size='small'
              status='danger'
              icon={<Delete theme='outline' size='13' />}
              onClick={() => onDelete?.(entry)}
              data-testid='drawer-delete-btn'
            >
              {t('archive.drawer.delete', 'Delete')}
            </Button>
          </div>

          {/* Promotion score bar */}
          <div className={styles.scoreWrap} data-testid='drawer-score-wrap'>
            <div className={styles.scoreLabel}>
              <span className={styles.scoreText} data-testid='drawer-score-text'>
                {t('archive.drawer.promotionScore', 'Promotion score')} {entry.promotionScore}/100
                {' - '}
                {t('archive.drawer.autoPromotesAt', 'auto-promotes at {{n}}', { n: promotionThreshold })}
              </span>
              <Tooltip content={SCORE_TOOLTIP} position='top'>
                {/* #751: wrap the icon so Arco gets a real DOM node. @icon-park
                    icons don't forwardRef, so an unwrapped trigger yields a null
                    getRootDOMNode/findDOMNode and Arco crashes while positioning
                    on hover - which blanked the whole app (no error boundary). */}
                <span style={{ display: 'inline-flex' }}>
                  <Help
                    theme='outline'
                    size='13'
                    style={{ cursor: 'help', opacity: 0.6 }}
                    aria-label={t('archive.drawer.scoreFormula', 'Score formula')}
                  />
                </span>
              </Tooltip>
            </div>
            <div className={styles.scoreTrack} data-testid='drawer-score-track'>
              <div
                className={[
                  styles.scoreFill,
                  entry.promotionScore >= promotionThreshold
                    ? styles.scoreGreen
                    : entry.promotionScore >= promotionThreshold - 10
                      ? styles.scoreAmber
                      : styles.scoreMuted,
                ].join(' ')}
                style={{ width: `${Math.min(100, Math.max(0, entry.promotionScore))}%` }}
                data-testid='drawer-score-fill'
              />
              {/* 90% threshold marker */}
              <div
                className={styles.scoreMarker}
                style={{ left: `${promotionThreshold}%` }}
                data-testid='drawer-score-marker'
              />
            </div>
          </div>

          {/* Scrollable body */}
          <div className={styles.body} data-testid='drawer-body'>
            {/* Why - must be visible without scrolling (K3 fix) - placed first */}
            <div className={styles.section} data-testid='drawer-section-why'>
              <h3 className={styles.sectionLabel}>{t('archive.drawer.why', 'Why')}</h3>
              <div className={styles.sectionContent}>
                {entry.why ? (
                  <p>{entry.why}</p>
                ) : (
                  <span className={styles.absent}>{t('archive.drawer.noWhy', 'No "Why" recorded')}</span>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className={styles.section} data-testid='drawer-section-summary'>
              <h3 className={styles.sectionLabel}>{t('archive.drawer.summary', 'Summary')}</h3>
              <div className={styles.sectionContent}>
                <p>{entry.summary}</p>
              </div>
            </div>

            {/* How to apply */}
            <div className={styles.section} data-testid='drawer-section-howto'>
              <h3 className={styles.sectionLabel}>{t('archive.drawer.howToApply', 'How to apply')}</h3>
              <div className={styles.sectionContent}>
                {entry.howToApply ? (
                  <p>{entry.howToApply}</p>
                ) : (
                  <span className={styles.absent}>{t('archive.drawer.noHowTo', 'No "How to apply" recorded')}</span>
                )}
              </div>
            </div>

            {/* Used in the wild (S4 fix) */}
            {Array.isArray(entry.dereferences) && entry.dereferences.length > 0 && (
              <div className={styles.section} data-testid='drawer-section-derefs'>
                <h3 className={styles.sectionLabel}>{t('archive.drawer.usedInWild', 'Used in the wild')}</h3>
                <p className={styles.derefHeader}>
                  {t('archive.drawer.usedNTimesWeek', 'Used {{count}}× this week', { count: entry.referencedBy })}
                </p>
                <div className={styles.derefList}>
                  {entry.dereferences.map((d, i) => (
                    <div
                      key={i}
                      className={styles.derefCard}
                      role='button'
                      tabIndex={0}
                      onClick={() => onOpenSource?.(d.source, d.line)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpenSource?.(d.source, d.line);
                        }
                      }}
                      aria-label={`Open ${d.source} at line ${d.line}`}
                      data-testid='drawer-deref-card'
                    >
                      <div className={styles.derefMeta}>
                        {d.source} · {t('archive.drawer.line', 'line')} {d.line} · {formatRelative(d.lastAt)}
                      </div>
                      <div className={styles.derefPreview}>"{d.preview}"</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {Array.isArray(entry.tags) && entry.tags.length > 0 && (
              <div className={styles.section} data-testid='drawer-section-tags'>
                <h3 className={styles.sectionLabel}>{t('archive.drawer.tags', 'Tags')}</h3>
                <div className={styles.tagRow}>
                  {entry.tags.map((tag) => (
                    <Tag key={tag} size='small' color='arcoblue'>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {/* Source path (Q5 acceptance) */}
            <div
              className={styles.sourcePath}
              role='button'
              tabIndex={0}
              onClick={() => handleCopySource(entry.sourcePath, entry.sourceLine)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCopySource(entry.sourcePath, entry.sourceLine);
                }
              }}
              aria-label={`Copy source path ${entry.sourcePath}:L${entry.sourceLine}`}
              data-testid='drawer-source-path'
            >
              <FileCode theme='outline' size='13' aria-hidden />
              <code className={`${styles.sourcePathText} source-path`}>
                {entry.sourcePath}:L{entry.sourceLine}
              </code>
            </div>

            {/* Inline source context */}
            <SourcePanel path={entry.sourcePath} line={entry.sourceLine} autoExpand={!entry.why && !entry.howToApply} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RightDrawer;
