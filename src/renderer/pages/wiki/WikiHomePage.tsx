/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * WikiHomePage - 3-column wiki concept browser.
 * Columns: By Topic (40%) | Updated this week (30%) | Emerging (30%)
 * Below: Most Referenced 6-column strip.
 * Graph toggle: SVG force graph via KnowledgeGraph.
 *
 * TODO(W2): replace MOCK_CONCEPTS / MOCK_ORPHANS with await ipcBridge.wiki.listConcepts({...})
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spin, Message } from '@arco-design/web-react';
import { BookOpen, Search, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { wiki as wikiBridge } from '@/common/adapter/ipcBridge';
import type { WikiConcept, WikiState, WikiTopicTag } from '@/common/types/memory';
import { ConceptCard } from './components/ConceptCard';
import { OrphanCard } from './components/OrphanCard';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import styles from './WikiHomePage.module.css';

// ─── Types ──────────────────────────────────────────────────────────────────

type View = 'list' | 'graph';

const TOPIC_CHIPS: Array<WikiTopicTag | 'All'> = [
  'All',
  'Architecture',
  'Design',
  'Decisions',
  'Process',
  'Brand',
  'Patterns',
];

const TOPIC_DOT_COLORS: Record<WikiTopicTag, string> = {
  Architecture: 'var(--orange, #FF7A45)',
  Design: 'var(--blue, #60A5FA)',
  Decisions: 'var(--yellow, #FBBF24)',
  Patterns: 'var(--purple, #A78BFA)',
  Process: 'var(--green, #4ADE80)',
  Brand: 'var(--orange, #FF7A45)',
};

function formatAgoShort(ms: number): string {
  const diff = Date.now() - ms;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  return `${days}d ago`;
}

function formatLastSync(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function WikiHomePage(): React.ReactElement {
  const navigate = useNavigate();
  const { t } = useTranslation('memory');
  const [view, setView] = useState<View>('list');
  const [activeTopic, setActiveTopic] = useState<WikiTopicTag | 'All'>('All');
  const [search, setSearch] = useState('');
  const [allConcepts, setAllConcepts] = useState<WikiConcept[]>([]);
  const [orphans, setOrphans] = useState<WikiState['orphanCandidates']>([]);
  const [backlinkGraph, setBacklinkGraph] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [synthesizing, setSynthesizing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | undefined>(undefined);
  // Re-render status bar every minute to keep "Xm ago" fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        // Use getState to get concepts + backlinkGraph + orphanCandidates in one call (Fix 8).
        const state = await wikiBridge.getState.invoke(undefined);
        if (cancelled) return;
        setAllConcepts(state?.concepts ?? []);
        setBacklinkGraph(state?.backlinkGraph ?? {});
        setOrphans(state?.orphanCandidates ?? []);
        if (state?.lastSyncAt != null) setLastSyncAt(state.lastSyncAt);
      } catch (err) {
        console.warn('wiki.getState failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const unsub = wikiBridge.stateChanged.on((state: WikiState) => {
      if (cancelled) return;
      setAllConcepts(state.concepts);
      setBacklinkGraph(state.backlinkGraph);
      setOrphans(state.orphanCandidates);
      if (state.lastSyncAt != null) setLastSyncAt(state.lastSyncAt);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const filtered = useMemo(() => {
    return allConcepts.filter((c) => {
      const matchTopic = activeTopic === 'All' || c.topicTag === activeTopic;
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.tldr.toLowerCase().includes(q);
      return matchTopic && matchSearch;
    });
  }, [allConcepts, activeTopic, search]);

  const byTopic = useMemo(() => {
    const map = new Map<WikiTopicTag, WikiConcept[]>();
    for (const c of filtered) {
      const arr = map.get(c.topicTag) ?? [];
      arr.push(c);
      map.set(c.topicTag, arr);
    }
    return map;
  }, [filtered]);

  // Updated this week = last 7 days
  const updatedThisWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return filtered.filter((c) => c.lastSynthesizedAt >= cutoff);
  }, [filtered]);

  // Most referenced = top 6 by sourceMemoryIds count
  const mostReferenced = useMemo(() => {
    return [...allConcepts]
      .sort((a, b) => b.sourceMemoryIds.length - a.sourceMemoryIds.length)
      .slice(0, 6);
  }, [allConcepts]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearch('');
    }
  };

  const handleSynthesize = async (memoryIds: string[]): Promise<void> => {
    try {
      await wikiBridge.synthesizeOrphan.invoke({ memoryIds });
      // State will update via stateChanged emitter
    } catch (err) {
      console.warn('wiki.synthesizeOrphan failed', err);
    }
  };

  const handleSynthesizeNow = async (): Promise<void> => {
    if (synthesizing) return;
    setSynthesizing(true);
    try {
      const result = await wikiBridge.synthesizeNow.invoke(undefined);
      if (result?.ok) {
        Message.success(
          t('wiki.home.synthesizeNow.success', 'Synthesized {{count}} new concepts', {
            count: result.newConcepts,
          }),
        );
      } else {
        Message.error(result?.error ?? t('wiki.home.synthesizeNow.error', 'Synthesis failed'));
      }
    } catch (err) {
      console.warn('wiki.synthesizeNow failed', err);
      Message.error(t('wiki.home.synthesizeNow.error', 'Synthesis failed'));
    } finally {
      setSynthesizing(false);
    }
  };

  const handleNavigate = (slug: string): void => {
    navigate(`/wiki/${slug}`);
  };

  const handleOpenSettings = (): void => {
    navigate('/settings/ijfw');
  };

  return (
    <div className={styles.page}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.logoWrap}>
          <span className={styles.logoIcon} aria-hidden>
            <BookOpen size={20} />
          </span>
          <span className={styles.logoLabel}>{t('wiki.home.title', 'Wiki')}</span>
        </div>
        <span className={styles.countLabel}>
          {t('wiki.home.conceptCount', '{{count}} concepts synthesized from {{memories}} memories', {
            count: allConcepts.length,
            memories: allConcepts.reduce((n, c) => n + c.sourceMemoryIds.length, 0),
          })}
        </span>
        <div className={styles.topbarSpacer} />
        <div className={styles.viewToggle} role='group' aria-label='View toggle'>
          <button
            className={view === 'list' ? `${styles.viewBtn} ${styles.viewBtnActive}` : styles.viewBtn}
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
          >
            <svg width='13' height='13' viewBox='0 0 13 13' fill='none' aria-hidden='true'>
              <rect x='0' y='1' width='13' height='2' rx='1' fill='currentColor' />
              <rect x='0' y='5.5' width='13' height='2' rx='1' fill='currentColor' />
              <rect x='0' y='10' width='13' height='2' rx='1' fill='currentColor' />
            </svg>
            {t('wiki.home.viewList', 'List')}
          </button>
          <button
            className={view === 'graph' ? `${styles.viewBtn} ${styles.viewBtnActive}` : styles.viewBtn}
            onClick={() => setView('graph')}
            aria-pressed={view === 'graph'}
          >
            <svg width='13' height='13' viewBox='0 0 13 13' fill='none' aria-hidden='true'>
              <circle cx='6.5' cy='6.5' r='2' fill='currentColor' />
              <circle cx='1.5' cy='2' r='1.5' fill='currentColor' opacity='0.6' />
              <circle cx='11.5' cy='2' r='1.5' fill='currentColor' opacity='0.6' />
              <circle cx='1.5' cy='11' r='1.5' fill='currentColor' opacity='0.6' />
              <circle cx='11.5' cy='11' r='1.5' fill='currentColor' opacity='0.6' />
            </svg>
            {t('wiki.home.viewGraph', 'Graph')}
          </button>
        </div>
        <Button
          size='small'
          className={styles.synthesizeBtn}
          onClick={() => void handleSynthesizeNow()}
          disabled={synthesizing}
          icon={synthesizing ? <Spin size={12} /> : undefined}
        >
          {synthesizing
            ? t('wiki.home.synthesizing', 'Synthesizing…')
            : t('wiki.home.synthesizeNow', 'Synthesize now')}
        </Button>
        <Button type='primary' size='small' className={styles.newBtn}>
          {t('wiki.home.newConcept', '+ New concept')}
        </Button>
        <button
          className={styles.iconBtn}
          title={t('wiki.home.settings', 'Settings')}
          aria-label={t('wiki.home.settings', 'Settings')}
          onClick={handleOpenSettings}
        >
          <Settings size={15} />
        </button>
      </header>

      {/* Search hero */}
      <div className={styles.searchHero}>
        <div className={styles.searchWrap}>
          <div className={styles.searchInputWrap}>
            <Search size={15} className={styles.searchIcon} aria-hidden />
            <input
              className={styles.searchInput}
              type='text'
              placeholder={t('wiki.home.search.placeholder', 'Search concepts…')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              aria-label={t('wiki.home.search.placeholder', 'Search concepts…')}
            />
            <div className={styles.searchKbd} aria-hidden>
              <span className={styles.kbd}>⌘</span>
              <span className={styles.kbd}>K</span>
            </div>
          </div>
          <div className={styles.topicChips} role='group' aria-label='Topic filter'>
            {TOPIC_CHIPS.map((topic) => (
              <button
                key={topic}
                className={
                  activeTopic === topic
                    ? `${styles.chip} ${styles.chipActive}`
                    : styles.chip
                }
                onClick={() => setActiveTopic(topic)}
                aria-pressed={activeTopic === topic}
                data-testid={`topic-chip-${topic.toLowerCase()}`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {view === 'graph' ? (
          <div className={styles.graphView} data-testid='graph-view'>
            <KnowledgeGraph
              concepts={filtered}
              backlinkGraph={backlinkGraph}
              onNavigate={handleNavigate}
            />
          </div>
        ) : (
          <>
            {/* 3-column grid */}
            <div className={styles.grid} data-testid='list-view'>
              {/* Column 1: By Topic */}
              <div>
                <div className={styles.colHeader} data-testid='col-by-topic'>
                  {t('wiki.home.columns.byTopic', 'By Topic')}
                </div>
                {Array.from(byTopic.entries()).map(([topic, concepts]) => (
                  <div key={topic} className={styles.topicGroup} data-testid={`topic-group-${topic.toLowerCase()}`}>
                    <div className={styles.topicGroupHeader}>
                      <span className={styles.topicGroupName}>{topic}</span>
                      <span className={styles.topicGroupCount}>{concepts.length}</span>
                    </div>
                    <ul className={styles.conceptList}>
                      {concepts.map((c) => (
                        <li key={c.id}>
                          <a
                            className={styles.conceptItem}
                            href={`#/wiki/${c.slug}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavigate(c.slug);
                            }}
                            data-testid='concept-item'
                          >
                            <div
                              className={styles.conceptDot}
                              style={{ background: TOPIC_DOT_COLORS[c.topicTag] }}
                            />
                            <span className={styles.conceptName}>{c.name}</span>
                            <span className={styles.conceptRefCount}>
                              {c.sourceMemoryIds.length}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {byTopic.size === 0 && !loading && (
                  <p className={styles.emptyMsg}>
                    {allConcepts.length === 0
                      ? t('wiki.home.empty', 'Your wiki is empty. Promote a memory or wait for auto-sync.')
                      : 'No concepts match your filters.'}
                  </p>
                )}
              </div>

              {/* Column 2: Updated this week */}
              <div>
                <div className={styles.colHeader} data-testid='col-updated'>
                  {t('wiki.home.columns.updatedThisWeek', 'Updated this week')}
                </div>
                {updatedThisWeek.length > 0 ? (
                  updatedThisWeek.map((c) => (
                    <ConceptCard key={c.id} concept={c} onClick={handleNavigate} />
                  ))
                ) : !loading ? (
                  <p className={styles.emptyMsg}>
                    {allConcepts.length === 0
                      ? 'No concepts yet.'
                      : 'No concepts updated this week.'}
                  </p>
                ) : null}
              </div>

              {/* Column 3: Emerging */}
              <div>
                <div className={styles.colHeader} data-testid='col-emerging'>
                  {t('wiki.home.columns.emerging', 'Emerging - should be concept pages')}
                </div>
                {orphans.length > 0 ? (
                  orphans.map((o, i) => (
                    <OrphanCard
                      key={i}
                      suggestedName={o.suggestedName}
                      citationCount={o.citationCount}
                      memoryIds={o.memoryIds}
                      onSynthesize={handleSynthesize}
                    />
                  ))
                ) : (
                  <p className={styles.emptyMsg}>No emerging concepts detected yet.</p>
                )}
              </div>
            </div>

            {/* Most Referenced strip */}
            <div className={styles.mostReferenced} data-testid='most-referenced'>
              <div className={styles.sectionLabel}>{t('wiki.home.mostReferenced', 'Most Referenced')}</div>
              <div className={styles.refStrip}>
                {mostReferenced.map((c) => (
                  <a
                    key={c.id}
                    className={styles.refTile}
                    href={`#/wiki/${c.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate(c.slug);
                    }}
                    data-testid='ref-tile'
                  >
                    <div className={styles.refTileName}>{c.name}</div>
                    <div className={styles.refTileCount}>{c.sourceMemoryIds.length}</div>
                    <div className={styles.refTileLabel}>
                      {t('wiki.home.references', 'references')} &middot; {formatAgoShort(c.lastSynthesizedAt)}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Status bar */}
      <div className={styles.statusBar} data-testid='wiki-status-bar'>
        <div className={styles.statusItem}>
          <div className={styles.statusDot} aria-hidden />
          {t('wiki.home.status.concepts', '{{count}} concepts', { count: allConcepts.length })}
        </div>
        <div className={styles.statusSep} />
        <div className={styles.statusItem}>
          {t('wiki.home.status.memoriesSynthesized', '{{count}} memories synthesized', {
            count: allConcepts.reduce((n, c) => n + c.sourceMemoryIds.length, 0),
          })}
        </div>
        <div className={styles.statusSep} />
        <div className={styles.statusItem}>{t('wiki.home.status.autoSync', 'auto-sync every 30m')}</div>
        <div className={styles.statusSep} />
        <div className={styles.statusItem}>
          {lastSyncAt != null
            ? t('wiki.home.status.lastSync', 'last sync {{when}} ago', {
                when: formatLastSync(lastSyncAt),
              })
            : t('wiki.home.status.lastSyncNever', 'never synced')}
        </div>
      </div>
    </div>
  );
}
