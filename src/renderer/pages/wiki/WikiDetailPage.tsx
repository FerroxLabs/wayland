/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * WikiDetailPage - concept detail page.
 * Body: 880px max-width, TL;DR block, body sections with WikilinkRenderer,
 * Sources block, Linked from, Related concepts, Footer.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@arco-design/web-react';
import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { wiki as wikiBridge } from '@/common/adapter/ipcBridge';
import type { WikiConcept } from '@/common/types/memory';
import MarkdownView from '@/renderer/components/Markdown';
import { WikilinkRenderer } from './components/WikilinkRenderer';
import { SourcesBlock } from './components/SourcesBlock';
import type { SourceEntry } from './components/SourcesBlock';
import { RelatedConcepts } from './components/RelatedConcepts';
import styles from './WikiDetailPage.module.css';

// ─── Types ──────────────────────────────────────────────────────────────────

export type WikiDetailPageProps = {
  slug: string;
  onBack?: () => void;
  onNavigate?: (slug: string) => void;
  onSettings?: () => void;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Convert `[[X]]` / `[[X|alias]]` wikilinks into markdown links with a
 * `#wikilink:` href. The body intercepts clicks on those hrefs to navigate
 * in-app, so wikilinks keep working once the body renders as real markdown.
 */
const WIKILINK_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;
const wikilinksToMarkdown = (text: string): string =>
  text.replace(WIKILINK_RE, (_m, target: string, alias?: string) => {
    const label = (alias ?? target).trim();
    return `[${label}](#wikilink:${encodeURIComponent(target.trim())})`;
  });

function formatDate(ms: number): string {
  const diff = Date.now() - ms;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function formatDateFull(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFreshnessLabel(
  f: WikiConcept['freshness'],
  t: (key: string, defaultVal: string) => string,
): string {
  if (f === 'fresh') return t('wiki.detail.freshness.fresh', 'Fresh');
  if (f === 'stale') return t('wiki.detail.freshness.stale', 'Stale');
  return t('wiki.detail.freshness.neverReviewed', 'Never reviewed');
}

/** Build mock sources from sourceMemoryIds. In W2 these come from ipcBridge. */
function buildMockSources(concept: WikiConcept): SourceEntry[] {
  const types: SourceEntry['type'][] = ['Decision', 'Memory', 'Plan', 'Feedback'];
  return concept.sourceMemoryIds.map((id, i) => ({
    memoryId: id,
    type: types[i % types.length],
    project: concept.tags[0]?.replace('#', '') ?? 'wayland',
    date: new Date(concept.lastSynthesizedAt - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    title: `Source memory ${i + 1} for ${concept.name}`,
    quote: `Relevant excerpt from memory ${id} that informed the synthesis of this concept page.`,
  }));
}

// ─── Route wrapper ──────────────────────────────────────────────────────────

/** Mounted by the router at /wiki/:slug. Pulls slug from URL params. */
export function WikiDetailPageRoute(): React.ReactElement {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  return (
    <WikiDetailPage
      slug={slug}
      onBack={() => navigate('/wiki')}
      onNavigate={(s) => navigate(`/wiki/${s}`)}
      onSettings={() => navigate('/settings/ijfw')}
    />
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function WikiDetailPage({
  slug,
  onBack,
  onNavigate,
  onSettings,
}: WikiDetailPageProps): React.ReactElement {
  const { t } = useTranslation('memory');
  const [concept, setConcept] = useState<WikiConcept | null>(null);
  const [loading, setLoading] = useState(true);
  const [reSynthesizing, setReSynthesizing] = useState(false);
  // Cache resolved backlink slugs: name → slug|null
  const backlinkCache = useRef<Map<string, string | null>>(new Map());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async (): Promise<void> => {
      try {
        const result = await wikiBridge.getConcept.invoke({ slug });
        if (!cancelled) setConcept(result);
      } catch {
        // Non-fatal - show not-found state
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const resolveBacklink = useCallback(
    async (name: string): Promise<{ slug: string | null }> => {
      if (backlinkCache.current.has(name)) {
        return { slug: backlinkCache.current.get(name) ?? null };
      }
      try {
        const result = await wikiBridge.resolveBacklink.invoke({ wikilinkText: name });
        backlinkCache.current.set(name, result.slug);
        return { slug: result.slug };
      } catch {
        return { slug: null };
      }
    },
    [],
  );

  // Synchronous resolver backed by the cache (for WikilinkRenderer prop)
  const resolveBacklinkSync = useCallback(
    (name: string): { slug: string | null } => {
      if (backlinkCache.current.has(name)) {
        return { slug: backlinkCache.current.get(name) ?? null };
      }
      // Trigger async resolution for future renders (fire-and-forget)
      void resolveBacklink(name);
      return { slug: null };
    },
    [resolveBacklink],
  );

  const handleReSynthesize = useCallback(async (): Promise<void> => {
    if (!concept) return;
    setReSynthesizing(true);
    try {
      await wikiBridge.reSynthesize.invoke({ slug: concept.slug });
      // Reload concept after re-synthesis
      const updated = await wikiBridge.getConcept.invoke({ slug: concept.slug });
      if (updated) setConcept(updated);
    } catch {
      // Non-fatal
    } finally {
      setReSynthesizing(false);
    }
  }, [concept]);

  // Must be above all early returns - rules of hooks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sources = useMemo(() => (concept ? buildMockSources(concept) : []), [concept]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>{t('wiki.detail.loading', 'Loading…')}</div>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className={styles.page}>
        <header className={styles.topbar}>
          <button className={styles.backLink} onClick={onBack} aria-label='Back to wiki'>
            <div className={styles.logoDot} aria-hidden />
            {t('wiki.detail.back', '← Wiki')}
          </button>
        </header>
        <div className={styles.notFoundState}>
          <p>{t('wiki.detail.notFound', 'Concept not found.')}</p>
          <button onClick={onBack}>{t('wiki.detail.notFoundBack', '← Back to Wiki')}</button>
        </div>
      </div>
    );
  }

  const linkedFrom = concept.linkedFromConcepts;
  const filePath = `~/dev/wayland/.ijfw/wiki/${concept.slug}.md`;

  return (
    <div className={styles.page}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <button className={styles.backLink} onClick={onBack} aria-label='Back to wiki'>
          <div className={styles.logoDot} aria-hidden />
          {t('wiki.detail.back', '← Wiki')}
        </button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbTitle}>{concept.name}</span>
        <div className={styles.topbarSpacer} />
        <div className={styles.actionRow}>
          <Button
            className={styles.editBtn}
            size='small'
            style={{ background: 'var(--surface-2, #1C1F23)', borderColor: 'var(--border-2, #2E3238)' }}
          >
            <svg width='12' height='12' viewBox='0 0 12 12' fill='none' aria-hidden='true'>
              <path
                d='M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z'
                stroke='currentColor'
                strokeWidth='1.2'
                strokeLinejoin='round'
              />
            </svg>
            {t('wiki.detail.edit', 'Edit')}
          </Button>
          <Button className={styles.updateBtn} size='small'>
            {t('wiki.detail.updateFromSources', 'Update from sources')}
          </Button>
          <button
            className={styles.iconBtn}
            title={t('wiki.detail.settings', 'Settings')}
            aria-label={t('wiki.detail.settings', 'Settings')}
            onClick={onSettings}
          >
            <Settings size={14} />
          </button>
        </div>
      </header>

      {/* Page body */}
      <div className={styles.pageWrap}>
        {/* Meta row */}
        <div className={styles.pageMeta}>
          <span className={styles.catBadge} data-testid='topic-badge'>
            ◆ {concept.topicTag}
          </span>
          <span className={styles.metaSep}>&middot;</span>
          <span className={styles.metaText}>{t('wiki.detail.updatedAgo', 'Updated {{when}}', { when: formatDate(concept.lastSynthesizedAt) })}</span>
          <span className={styles.metaSep}>&middot;</span>
          <span className={styles.metaText}>{t('wiki.detail.synthesizedFromMem', 'Synthesized from {{count}} memories', { count: concept.sourceMemoryIds.length })}</span>
          <span className={styles.metaSep}>&middot;</span>
          <span className={styles.freshnessBadge} data-testid='freshness-badge'>
            <span className={styles.freshnessDot} />
            {formatFreshnessLabel(concept.freshness, t)}
          </span>
        </div>

        {/* Title */}
        <h1 className={styles.pageTitle} data-testid='concept-title'>
          {concept.name}
        </h1>

        {/* TL;DR */}
        <div className={styles.tldrBlock} data-testid='tldr-block'>
          <div className={styles.tldrLabel}>{t('wiki.detail.tldr', 'TL;DR')}</div>
          <div className={styles.tldrText}>
            <WikilinkRenderer
              text={concept.tldr}
              resolveBacklink={resolveBacklinkSync}
              onNavigate={onNavigate}
            />
          </div>
        </div>

        <hr className={styles.sectionRule} />

        {/* Body - full markdown (headings, lists, tables, code). Wikilinks are
            converted to in-app links and intercepted on click (capture phase,
            before MarkdownView's external-link handler) so [[X]] still
            navigates without leaving the app. */}
        <div
          className={styles.prose}
          onClickCapture={(e) => {
            const anchor = (e.target as HTMLElement).closest('a');
            const href = anchor?.getAttribute('href') ?? '';
            if (!href.startsWith('#wikilink:')) return;
            e.preventDefault();
            e.stopPropagation();
            const { slug } = resolveBacklinkSync(decodeURIComponent(href.slice('#wikilink:'.length)));
            if (slug) onNavigate?.(slug);
          }}
        >
          <MarkdownView>{wikilinksToMarkdown(concept.body)}</MarkdownView>
        </div>

        <hr className={styles.sectionRule} />

        {/* Sources */}
        <h2 className={styles.sectionHeading} data-testid='sources-heading'>
          {t('wiki.detail.sources', 'Sources')}{' '}
          <span className={styles.sectionCount}>({sources.length})</span>
        </h2>
        <SourcesBlock sources={sources} />

        <hr className={styles.sectionRule} />

        {/* Linked from */}
        <h2 className={styles.sectionHeading} data-testid='linked-from-heading'>
          {t('wiki.detail.linkedFrom', 'Linked from')}
        </h2>
        {linkedFrom.length > 0 ? (
          <ul className={styles.linkedFromList} data-testid='linked-from-list'>
            {linkedFrom.map((fromSlug) => (
              <li key={fromSlug}>
                <a
                  className={styles.linkedFromItem}
                  href={`#/wiki/${fromSlug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.(fromSlug);
                  }}
                >
                  <span className={styles.linkedFromArrow}>←</span>
                  <span className={styles.linkedFromName}>{fromSlug}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyMsg}>No concepts link to this page yet.</p>
        )}

        {/* Related concepts */}
        <h2 className={styles.sectionHeading} data-testid='related-heading'>
          {t('wiki.detail.relatedConcepts', 'Related concepts')}
        </h2>
        <RelatedConcepts
          concepts={concept.relatedConcepts}
          onNavigate={(name) => {
            // Resolve name → slug via cache, fall back to slugifying the name
            const cached = backlinkCache.current.get(name);
            const targetSlug = cached ?? name.toLowerCase().replace(/\s+/g, '-');
            onNavigate?.(targetSlug);
          }}
        />

        {/* Page footer */}
        <div className={styles.pageFooter} data-testid='page-footer'>
          <div className={styles.pageFooterMeta}>
            Source file: <code className={styles.filePath}>{filePath}</code>
            <br />
            {t('wiki.detail.autoSynthesized', 'Auto-synthesized')} &middot; {t('wiki.detail.lastReviewedNever', 'last reviewed by you: never')}
            <br />
            {t('wiki.detail.lastSynthesized', 'Last synthesized: {{when}}', { when: formatDateFull(concept.lastSynthesizedAt) })}
          </div>
          <div className={styles.footerActions}>
            <button className={`${styles.footerBtn} ${styles.footerBtnReviewed}`}>
              <svg width='12' height='12' viewBox='0 0 12 12' fill='none' aria-hidden='true'>
                <path
                  d='M2 6l3 3 5-5'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              {t('wiki.detail.markAsReviewed', 'Mark as reviewed')}
            </button>
            <button className={styles.footerBtn}>{t('wiki.detail.editThisPage', 'Edit this page')}</button>
            <button className={styles.footerBtn} onClick={() => void handleReSynthesize()} disabled={reSynthesizing}>
              {reSynthesizing ? 'Re-synthesizing…' : t('wiki.detail.reSynthesizeFromSources', 'Re-synthesize from sources')}
            </button>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className={styles.statusBar} data-testid='wiki-detail-status-bar'>
        <div className={styles.statusItem}>
          <svg width='10' height='10' viewBox='0 0 10 10' fill='none' aria-hidden='true'>
            <circle cx='5' cy='5' r='4' stroke='currentColor' strokeWidth='1' />
          </svg>
          {concept.slug}.md
        </div>
        <div className={styles.statusSep} />
        <div className={styles.statusItem}>{t('wiki.detail.statusTotalConcepts', '{{count}} concepts total', { count: 0 })}</div>
        <div className={styles.statusSep} />
        <div className={styles.statusNotReviewed}>{t('wiki.detail.statusNotReviewedYet', 'Not reviewed yet')}</div>
        <div className={styles.statusSep} />
        <div className={styles.statusItem}>{t('wiki.detail.statusLastSync', 'last sync {{when}} ago', { when: '8m' })}</div>
      </div>
    </div>
  );
}
