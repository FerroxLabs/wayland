/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Inspector - right-pane detail view for the Memory Archive page.
 *
 * Pure presentational. Receives an extended MemoryEntry (with body +
 * optional dereferences) and emits action callbacks upward.
 *
 * Esc-to-close is registered via a keydown listener while mounted.
 */

import React, { useEffect, useCallback } from 'react';
import { Button, Tag, Tooltip } from '@arco-design/web-react';
import { Close, Copy, LinkOne, FileCode, Help } from '@icon-park/react';
import type { MemoryEntry, MemoryType } from '@/common/types/memory';
import styles from './Inspector.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Dereference = {
  source: string;
  line: number;
  preview: string;
  lastAt: number;
};

type ExtendedEntry = MemoryEntry & {
  body: string;
  dereferences?: Dereference[];
};

export type InspectorProps = {
  entry: ExtendedEntry | null;
  promotionThreshold: number;
  onClose?: () => void;
  onPromote?: (id: string) => void;
  onOpenSource?: (path: string, line: number) => void;
  onCopy?: (text: string) => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatRelative = (ts: number): string => {
  const diff = Math.max(0, Date.now() - ts);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const scoreBarClass = (score: number, threshold: number): string => {
  if (score >= threshold) return styles.green;
  if (score >= threshold - 10) return styles.orange;
  return styles.gray;
};

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState(): React.ReactElement {
  return (
    <div className={styles.empty} data-testid='inspector-empty'>
      <FileCode
        className={styles.emptyIcon}
        theme='outline'
        size='32'
        aria-hidden
        data-testid='inspector-empty-icon'
      />
      <span>Select a memory to inspect it</span>
      <div className={styles.emptyHint}>
        <span className={styles.kbdChip}>↑/↓ navigate</span>
        <span className={styles.kbdChip}>Enter select</span>
        <span className={styles.kbdChip}>Esc close</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inspector (exported)
// ---------------------------------------------------------------------------

const SCORE_TOOLTIP =
  'Score = (referenced × 0.15) + (type weight: decision 2×, wiki 3×, other 1×) + (recency decay over 30 days). Auto-promotes when score ≥ threshold.';

const Inspector: React.FC<InspectorProps> = ({
  entry,
  promotionThreshold,
  onClose,
  onPromote,
  onOpenSource,
  onCopy,
}) => {
  // Esc-to-close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleCopySource = useCallback(
    (path: string, line: number) => {
      const text = `${path}:L${line}`;
      onCopy?.(text);
      // Parent onCopy shows its own toast - do not add a second one here.
    },
    [onCopy],
  );

  if (entry === null) {
    return (
      <div className={styles.root}>
        <EmptyState />
      </div>
    );
  }

  const isAlreadyPromoted = entry.type === 'wiki';
  const scorePercent = Math.min(100, Math.max(0, entry.promotionScore));
  const barClass = scoreBarClass(entry.promotionScore, promotionThreshold);
  const projectBasename = entry.projectPath.split('/').pop() ?? entry.project;
  const hasDerefs = Array.isArray(entry.dereferences) && entry.dereferences.length > 0;
  const hasTags = Array.isArray(entry.tags) && entry.tags.length > 0;

  const typeBadgeClass = (t: MemoryType): string => {
    const map: Record<MemoryType, string> = {
      decision: styles.decision,
      pattern: styles.pattern,
      observation: styles.observation,
      session: styles.session,
      wiki: styles.wiki,
      preference: styles.preference,
    };
    return map[t] ?? '';
  };

  return (
    <div className={styles.root} data-testid='inspector-root'>
      {/* ---- Header ---- */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Button
            className={styles.closeBtn}
            shape='circle'
            size='mini'
            type='secondary'
            icon={<Close theme='outline' size='12' />}
            onClick={() => onClose?.()}
            aria-label='Close inspector'
            data-testid='inspector-close'
          />
          <h2 className={styles.title} data-testid='inspector-title'>
            {entry.summary}
          </h2>
          <div className={styles.meta}>
            <span>{formatRelative(entry.storedAt)}</span>
            <span>·</span>
            <span>{projectBasename}</span>
            <span
              className={[styles.typeBadge, typeBadgeClass(entry.type)].join(' ')}
              data-testid='inspector-type-badge'
            >
              {entry.type}
            </span>
          </div>
        </div>

        {/* ---- Actions ---- */}
        <div className={styles.actions}>
          <Button
            type='primary'
            size='small'
            disabled={isAlreadyPromoted}
            onClick={() => {
              if (!isAlreadyPromoted) onPromote?.(entry.id);
            }}
            data-testid='inspector-promote-btn'
          >
            {isAlreadyPromoted ? 'Already promoted ✓' : 'Promote to wiki'}
          </Button>
          <Button
            type='text'
            size='small'
            icon={<LinkOne theme='outline' size='13' />}
            onClick={() => onOpenSource?.(entry.sourcePath, entry.sourceLine)}
            data-testid='inspector-open-btn'
          >
            Open file
          </Button>
          <Button
            type='text'
            size='small'
            icon={<Copy theme='outline' size='13' />}
            onClick={() => onCopy?.(entry.body)}
            data-testid='inspector-copy-btn'
          >
            Copy
          </Button>
        </div>
      </div>

      {/* ---- Promotion score bar ---- */}
      <div className={styles.scoreWrap} data-testid='inspector-score-wrap'>
        <div className={styles.scoreLabel}>
          <span className={styles.scoreText} data-testid='inspector-score-text'>
            Promotion score {entry.promotionScore}/100 - auto-promotes at {promotionThreshold}
          </span>
          <Tooltip content={SCORE_TOOLTIP} position='top'>
            <Help
              theme='outline'
              size='13'
              style={{ cursor: 'help', opacity: 0.6 }}
              aria-label='Score formula'
            />
          </Tooltip>
        </div>
        <div className={styles.scoreBar} data-testid='inspector-score-bar'>
          <div
            className={[styles.scoreBarFill, barClass].join(' ')}
            style={{ width: `${scorePercent}%` }}
            data-testid='inspector-score-fill'
          />
        </div>
      </div>

      {/* ---- Scrollable body ---- */}
      <div className={styles.body}>
        {/* Summary */}
        <div className={styles.section} data-testid='inspector-section-summary'>
          <h3 className={styles.sectionLabel}>Summary</h3>
          <div className={styles.sectionContent}>
            <p>{entry.summary}</p>
          </div>
        </div>

        {/* Why */}
        <div className={styles.section} data-testid='inspector-section-why'>
          <h3 className={styles.sectionLabel}>Why</h3>
          <div className={styles.sectionContent}>
            {entry.why ? (
              <p>{entry.why}</p>
            ) : (
              <span className={styles.sectionAbsent}>No "Why" recorded</span>
            )}
          </div>
        </div>

        {/* How to apply */}
        <div className={styles.section} data-testid='inspector-section-howto'>
          <h3 className={styles.sectionLabel}>How to apply</h3>
          <div className={styles.sectionContent}>
            {entry.howToApply ? (
              <p>{entry.howToApply}</p>
            ) : (
              <span className={styles.sectionAbsent}>No "How to apply" recorded</span>
            )}
          </div>
        </div>

        {/* Use in the wild */}
        {hasDerefs && (
          <div className={styles.section} data-testid='inspector-section-derefs'>
            <h3 className={styles.sectionLabel}>Use in the wild</h3>
            <p className={styles.derefHeader}>Used {entry.referencedBy}× this week</p>
            <div className={styles.derefList}>
              {entry.dereferences!.map((d, i) => (
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
                  data-testid='inspector-deref-card'
                >
                  <div className={styles.derefCardMeta}>
                    {d.source} · line {d.line} · {formatRelative(d.lastAt)}
                  </div>
                  <div className={styles.derefCardPreview}>"{d.preview}"</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {hasTags && (
          <div className={styles.section} data-testid='inspector-section-tags'>
            <h3 className={styles.sectionLabel}>Tags</h3>
            <div className={styles.tagRow}>
              {entry.tags.map((tag) => (
                <Tag key={tag} size='small' color='arcoblue'>
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {/* Source path */}
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
          data-testid='inspector-source-path'
        >
          <FileCode theme='outline' size='13' aria-hidden />
          <span className={styles.sourcePathText}>
            {entry.sourcePath}:L{entry.sourceLine}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Inspector;
