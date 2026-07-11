/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * FullPanelShell - v0.6.4 Mail-style Memory Archive chrome.
 *
 * Layout (CSS Grid, 4 rows):
 *   1. topbar    - 56px: breadcrumb + TopbarChips + StreakPill + Import + QuickAdd + settings
 *   2. filterbar - 48px: search input + ProjectDropdown + TimeDropdown + TypeDropdown + result count
 *   3. main      - 1fr: horizontal flex { MemoryList (1fr) | RightDrawer (480px push-content) }
 *   4. statusbar - 28px: MemoryStatusBar
 *
 * Keyboard:
 *   ⌘K / "/" - focus search
 *   Esc       - close drawer (handled by useSelectedEntry + RightDrawer)
 *   J / K     - navigate rows via MemoryList keyboard handler
 *   ⌘N        - open quick-add
 *
 * Empty states:
 *   - Zero entries + no active filters → EmptyStateHero fills main area
 *   - Zero entries + filters active   → in-list zero state (K6)
 *
 * Drawer: push-content via CSS transition on width (NOT overlay).
 * List column margin-right transitions in sync with drawer opening.
 */

import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input, Message, Modal } from '@arco-design/web-react';
import type { RefInputType } from '@arco-design/web-react/es/Input/interface';
import { Archive, Search, Import as ImportIcon, Settings2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { ipcBridge } from '@/common';
import { formatModifierShortcut } from '@/renderer/utils/platform';
import { memory as memoryBridge, ijfw as ijfwBridge } from '@/common/adapter/ipcBridge';
import type { IjfwStatusPayload, IjfwLifecycleStatus } from '@/common/adapter/ipcBridge';
import IjfwSetupStatus from '@/renderer/pages/settings/components/IjfwSetupStatus';
import { ErrorBoundary } from '@/renderer/components/ErrorBoundary';
import type { LastDream, ListFilter, MemoryEntry, MemoryType } from '@/common/types/memory';
import { useTranslation } from 'react-i18next';
import MemoryList from '../components/MemoryList';
import RightDrawer from '../components/RightDrawer';
import TopbarChips from '../components/TopbarChips';
import StreakPill from '../components/StreakPill';
import ProjectDropdown from '../components/ProjectDropdown';
import TimeDropdown from '../components/TimeDropdown';
import TypeDropdown from '../components/TypeDropdown';
import EmptyStateHero from '../components/EmptyStateHero';
import MemoryStatusBar from '../components/MemoryStatusBar';
import ImportDrawer from '../components/ImportDrawer';
import ComposerModal from '../components/ComposerModal';
import EntryEditorModal from '../components/EntryEditorModal';
import { useMemoryIndex } from '../hooks/useMemoryIndex';
import { useSelectedEntry } from '../hooks/useSelectedEntry';
import type { TimeWindow } from '../components/TimeDropdown';
import styles from './FullPanelShell.module.css';

// ---------------------------------------------------------------------------
// Lazy-load PromotionThresholdModal
// ---------------------------------------------------------------------------

type PromotionThresholdModalModule = { default: React.ComponentType<{ onClose: () => void }> };

const PromotionThresholdModalLazy = lazy(
  () =>
    import('../components/PromotionThresholdModal').catch(
      (): PromotionThresholdModalModule => ({
        default: () => null,
      })
    ) as Promise<PromotionThresholdModalModule>
);

// ---------------------------------------------------------------------------
// Helpers - map TimeWindow → ListFilter.timeWindow
// ---------------------------------------------------------------------------

function timeWindowToFilter(tw: TimeWindow): ListFilter['timeWindow'] {
  if (typeof tw === 'object') return 'all'; // custom range - server doesn't support yet
  if (tw === 'today') return 'today';
  if (tw === '7d') return '7d';
  if (tw === '30d') return '30d';
  return 'all';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_FILTER: ListFilter = {
  project: 'all',
  types: [],
  tags: [],
  timeWindow: 'all',
  search: '',
  sort: 'recent',
  offset: 0,
  limit: 50,
};

const DEFAULT_THRESHOLD = 90;

/** Persisted expand/collapse state for the #414 setup-status health strip. */
const HEALTH_OPEN_KEY = 'wayland.memory.setupStatus.open';

/** Coarse health tone for the strip dot, derived from the install lifecycle. */
function statusTone(status: IjfwLifecycleStatus | null): 'ok' | 'warn' | 'checking' {
  if (status === 'installed_current' || status === 'installed_pending_activation') return 'ok';
  if (status === 'not_installed' || status === 'install_failed') return 'warn';
  return 'checking'; // installing / upgrading / unknown (null)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FullPanelShell: React.FC = () => {
  const { t } = useTranslation('memory');
  // Root-namespace t for the one string reused from #591 (memory.settings.*),
  // so the strip adds no new i18n keys.
  const { t: tRoot } = useTranslation();

  const [filter, setFilter] = useState<ListFilter>(DEFAULT_FILTER);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('all');

  const { stats, entries, projects, total, isLoading, reload } = useMemoryIndex(filter);
  const { selectedId, selected, selectEntry, clearSelection } = useSelectedEntry();

  // cliCount from IjfwStatusPayload (no-deferment #3)
  const [cliCount, setCliCount] = useState(0);
  // Install lifecycle status + collapse state for the #414 setup-status strip.
  const [ijfwStatus, setIjfwStatus] = useState<IjfwLifecycleStatus | null>(null);
  const [healthOpen, setHealthOpen] = useState<boolean>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(HEALTH_OPEN_KEY) : null;
    return saved === '1'; // default collapsed; the dot still conveys health
  });
  const [lastDream, setLastDream] = useState<LastDream | undefined>(undefined);
  const [promotionThreshold, setPromotionThreshold] = useState(DEFAULT_THRESHOLD);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<(MemoryEntry & { body: string }) | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const searchRef = useRef<RefInputType>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  // Fetch cliCount from ijfw status
  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async (): Promise<void> => {
      try {
        const status: IjfwStatusPayload = await ijfwBridge.getStatus.invoke();
        if (!cancelled) {
          setCliCount(status.cliCount ?? 0);
          setIjfwStatus(status.status);
        }
      } catch {
        // Non-fatal
      }
    };
    void fetchStatus();
    const unsub = ijfwBridge.onStatusChanged.on((payload: IjfwStatusPayload) => {
      if (!cancelled) {
        setCliCount(payload.cliCount ?? 0);
        setIjfwStatus(payload.status);
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  // Fetch promotion candidates + lastDream (no-deferment #4)
  useEffect(() => {
    let cancelled = false;
    const fetchCandidates = async (): Promise<void> => {
      try {
        const result = await memoryBridge.getPromotionCandidates.invoke();
        if (cancelled) return;
        setPromotionThreshold(result.threshold);
        if (result.lastDream) setLastDream(result.lastDream);
      } catch {
        // Non-fatal
      }
    };
    void fetchCandidates();
    const unsub = memoryBridge.onIndexChanged.on(() => {
      if (!cancelled) void fetchCandidates();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  // Keyboard: ⌘K / "/" focus search; ⌘N open quick-add
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // "/" focuses search (not in input)
      if (e.key === '/') {
        const active = document.activeElement;
        const isInput =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          (active instanceof HTMLElement && active.isContentEditable);
        if (!isInput) {
          e.preventDefault();
          searchRef.current?.focus();
        }
        return;
      }
      // ⌘K focuses search
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      // ⌘N opens composer modal
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setComposerOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // TopbarChips type filter
  const [activeChipType, setActiveChipType] = useState<MemoryType | null>(null);
  const handleChipFilter = useCallback((type: MemoryType | null) => {
    setActiveChipType(type);
    setFilter((prev) => ({
      ...prev,
      types: type ? [type] : [],
    }));
  }, []);

  // Project dropdown
  const handleProjectSelect = useCallback((projectId: string | null) => {
    setFilter((prev) => ({
      ...prev,
      project: projectId ?? 'all',
    }));
  }, []);

  // Time dropdown
  const handleTimeSelect = useCallback((tw: TimeWindow) => {
    setTimeWindow(tw);
    setFilter((prev) => ({
      ...prev,
      timeWindow: timeWindowToFilter(tw),
    }));
  }, []);

  // Type dropdown (multi-select - overrides chip single-select)
  const handleTypeFilter = useCallback((types: MemoryType[]) => {
    setActiveChipType(types.length === 1 ? (types[0] ?? null) : null);
    setFilter((prev) => ({ ...prev, types }));
  }, []);

  // Search
  const handleSearchChange = useCallback((val: string) => {
    setFilter((prev) => ({ ...prev, search: val, offset: 0 }));
  }, []);

  // Setup-status strip expand/collapse (#414), persisted.
  const toggleHealth = useCallback(() => {
    setHealthOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem(HEALTH_OPEN_KEY, next ? '1' : '0');
      } catch {
        // Non-fatal (private mode / storage disabled)
      }
      return next;
    });
  }, []);

  // Row select: click same row → deselect
  const handleSelectRow = useCallback(
    (id: string) => {
      if (id === selectedId) {
        clearSelection();
      } else {
        selectEntry(id);
      }
    },
    [selectedId, clearSelection, selectEntry]
  );

  // Promote entry
  const handlePromote = useCallback(
    async (id: string) => {
      const result = await memoryBridge.promote.invoke({ id });
      if (!result.ok) {
        const errMsg = 'error' in result ? result.error : 'Promotion failed';
        Message.error(errMsg);
      } else {
        Message.success(t('archive.toast.promoted', 'Promoted to wiki'));
        reload();
      }
    },
    [reload, t]
  );

  // Edit an entry (#414): the selected entry already carries its full body.
  const handleEdit = useCallback((entry: MemoryEntry & { body: string }) => {
    setEditTarget(entry);
  }, []);

  // After a successful edit, re-select by the (possibly new) id and refresh.
  const handleEditorSaved = useCallback(
    (newId: string) => {
      setEditTarget(null);
      reload();
      selectEntry(newId);
    },
    [reload, selectEntry]
  );

  // Delete an entry (#414) behind a confirm that states it cannot be undone.
  const handleDelete = useCallback(
    (entry: MemoryEntry & { body: string }) => {
      Modal.confirm({
        title: t('archive.delete.confirmTitle', 'Delete this memory?'),
        content: t(
          'archive.delete.confirmContent',
          'This permanently removes the memory from its file. It cannot be undone from the app.'
        ),
        okText: t('archive.delete.confirmOk', 'Delete'),
        cancelText: t('archive.delete.confirmCancel', 'Cancel'),
        okButtonProps: { status: 'danger' },
        onOk: async () => {
          const result = await memoryBridge.deleteEntry.invoke({ id: entry.id });
          if (result.ok) {
            Message.success(t('archive.delete.toastDeleted', 'Memory deleted'));
            clearSelection();
            reload();
          } else {
            Message.error(t('archive.delete.toastError', 'Could not delete memory'));
          }
        },
      });
    },
    [t, clearSelection, reload]
  );

  // Open source file
  const handleOpenSource = useCallback(
    (path: string, _line: number) => {
      ipcBridge.shell.openFile.invoke(path).catch(() => {
        void navigator.clipboard.writeText(path);
        Message.success(t('archive.toast.pathCopied', 'Path copied'));
      });
    },
    [t]
  );

  const handleCopy = useCallback(
    (text: string) => {
      void navigator.clipboard.writeText(text);
      Message.success(t('archive.toast.copied', 'Copied'));
    },
    [t]
  );

  // Cursor pagination (no-deferment #5)
  const handleEndReached = useCallback(() => {
    if (entries.length < total) {
      setFilter((prev) => ({ ...prev, offset: entries.length }));
    }
  }, [entries.length, total]);

  // Determine empty state
  const hasActiveFilters =
    (filter.types?.length ?? 0) > 0 ||
    (filter.search?.length ?? 0) > 0 ||
    filter.project !== 'all' ||
    filter.timeWindow !== 'all';

  const showEmptyHero = entries.length === 0 && !isLoading && !hasActiveFilters;

  // Result count for filter bar
  const resultCountLabel = isLoading ? '' : `${total.toLocaleString()} ${t('archive.filter.results', 'results')}`;

  const projectSelected = filter.project !== 'all' ? filter.project : null;
  const typeCounts = stats?.typeCounts ?? {
    decision: 0,
    pattern: 0,
    session: 0,
    observation: 0,
    wiki: 0,
    preference: 0,
  };

  // ── Drag-drop handlers ──────────────────────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Only reset if the pointer leaves the shell root entirely (not into a child).
    const related = e.relatedTarget as Node | null;
    if (shellRef.current && related && shellRef.current.contains(related)) return;
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);

      const ALLOWED = new Set(['.md', '.markdown', '.txt', '.json']);
      const files = Array.from(e.dataTransfer.files).filter((f) => {
        const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
        return ALLOWED.has(ext);
      });

      if (files.length === 0) return;

      try {
        const filePayloads = await Promise.all(files.map(async (f) => ({ name: f.name, content: await f.text() })));
        const result = await memoryBridge.ingestFiles.invoke({ files: filePayloads });
        if (result.ingested > 0) {
          Message.success(
            t('archive.dragDrop.toastIngested', `Ingested ${result.ingested} file${result.ingested === 1 ? '' : 's'}`)
          );
          reload();
        } else {
          Message.warning(t('archive.dragDrop.toastNoFiles', 'No files were ingested'));
        }
      } catch (err) {
        Message.error(t('archive.dragDrop.toastError', 'Drop ingest failed'));
        console.error('[FullPanelShell] drag-drop ingest error', err);
      }
    },
    [reload, t]
  );

  return (
    <div
      ref={shellRef}
      className={styles.shell}
      data-testid='memory-full-panel'
      role='region'
      aria-label='Memory Archive'
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => {
        void handleDrop(e);
      }}
    >
      {/* ---- Drag-drop overlay ---- */}
      {dragOver && (
        <div className={styles.dragOverlay} aria-hidden>
          <span className={styles.dragOverlayLabel}>📥 Drop to ingest</span>
        </div>
      )}
      {/* ---- Topbar (56px) ---- */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          {/* Breadcrumb */}
          <span className={styles.breadcrumb} data-testid='memory-full-panel-heading'>
            <span className={styles.breadcrumbIcon} aria-hidden>
              <Archive size={20} />
            </span>
            <span className={styles.breadcrumbPrimary}>{t('archive.topbar.archive', 'Archive')}</span>
            <span className={styles.breadcrumbSep} aria-hidden>
              ·
            </span>
            <span className={styles.breadcrumbProject}>
              {projects[0]?.basename ?? t('archive.topbar.allProjects', 'All projects')}
            </span>
          </span>

          {/* Type chips (no-deferment #1) */}
          <TopbarChips typeCounts={typeCounts} activeType={activeChipType} onFilterChange={handleChipFilter} />

          {/* Streak pill (no-deferment #2) */}
          {stats?.streak && <StreakPill sessions={stats.streak.sessions} longestDays={stats.streak.longestDays} />}
        </div>

        <div className={styles.topbarActions}>
          {/* Import button */}
          <Button
            type='text'
            size='small'
            icon={<ImportIcon size={15} aria-hidden />}
            onClick={() => setImportOpen(true)}
            data-testid='memory-btn-import'
            className={styles.iconBtn}
          />
          {/* Quick-add → opens ComposerModal */}
          <Button
            type='primary'
            size='small'
            icon={<Plus size={13} aria-hidden />}
            onClick={() => setComposerOpen(true)}
            data-testid='memory-btn-quickadd'
            className={styles.addBtn}
          >
            {t('archive.topbar.add', 'Add')}
          </Button>
          {/* Settings cog */}
          <Button
            type='text'
            size='small'
            icon={<Settings2 size={15} aria-hidden />}
            onClick={() => setShowThresholdModal(true)}
            data-testid='memory-btn-settings'
            className={styles.iconBtn}
          />
        </div>
      </header>

      {/* ---- Setup-status health strip (#414) ---- */}
      <section
        className={styles.healthStrip}
        data-testid='memory-setup-status-strip'
        data-open={healthOpen ? 'true' : 'false'}
      >
        <button
          type='button'
          className={styles.healthHeader}
          onClick={toggleHealth}
          aria-expanded={healthOpen}
          data-testid='memory-setup-status-toggle'
        >
          <span className={styles.healthDot} data-tone={statusTone(ijfwStatus)} aria-hidden />
          <span className={styles.healthTitle}>
            {tRoot('memory.settings.setup_status_title', { defaultValue: 'Setup status' })}
          </span>
          <span className={styles.healthChevron} aria-hidden>
            {healthOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
        {healthOpen && (
          <div className={styles.healthBody} data-testid='memory-setup-status-body'>
            <IjfwSetupStatus status={ijfwStatus} cliCount={cliCount} hideTitle />
          </div>
        )}
      </section>

      {/* ---- Filter bar (48px) ---- */}
      <div className={styles.filterBar} data-testid='memory-filter-bar'>
        <div className={styles.filterLeft}>
          <Input
            ref={searchRef}
            className={styles.searchInput}
            prefix={<Search size={14} />}
            suffix={
              <kbd className={styles.searchKbd} data-testid='memory-search-kbd'>
                {formatModifierShortcut('K')}
              </kbd>
            }
            placeholder={t('archive.filter.searchPlaceholder', 'Search memories… (type:decision tag:design)')}
            value={filter.search ?? ''}
            onChange={handleSearchChange}
            allowClear
            data-testid='memory-search-input'
          />
        </div>
        <div className={styles.filterDropdowns}>
          <ProjectDropdown projects={projects} selected={projectSelected} onSelect={handleProjectSelect} />
          <TimeDropdown selected={timeWindow} onSelect={handleTimeSelect} />
          <TypeDropdown typeCounts={typeCounts} selected={filter.types ?? []} onFilterChange={handleTypeFilter} />
        </div>
        <div className={styles.resultCount} data-testid='memory-result-count'>
          {resultCountLabel}
        </div>
      </div>

      {/* ---- Main area (1fr) ---- */}
      <div className={styles.main} data-testid='memory-body'>
        {showEmptyHero ? (
          <EmptyStateHero onImportComplete={reload} onSearchChange={handleSearchChange} />
        ) : (
          <>
            {/* List column - shrinks when drawer opens (push-content) */}
            <div
              className={`${styles.listCol}${selectedId ? ` ${styles.listColDrawerOpen}` : ''}`}
              data-testid='memory-list-col'
            >
              <MemoryList
                entries={entries}
                total={total}
                selectedId={selectedId ?? undefined}
                onSelect={handleSelectRow}
                search={filter.search ?? ''}
                onSearchChange={handleSearchChange}
                typeFilter={filter.types ?? []}
                onTypeFilterChange={handleTypeFilter}
                typeCounts={typeCounts}
                onEndReached={handleEndReached}
              />
            </div>

            {/* Right drawer - push-content, 480px.
              #792: contain a detail-panel render error (the #751 class) to the
              drawer so the list stays usable. resetKeys (not a React key) clears
              the fallback when the user picks another entry, so switching rows
              recovers from a crash tied to one entry's data - without remounting
              the drawer on open/close, which would break its width transition. */}
            <ErrorBoundary resetKeys={[selectedId]}>
              <RightDrawer
                entry={selected}
                promotionThreshold={promotionThreshold}
                onClose={clearSelection}
                onPromote={handlePromote}
                onOpenSource={handleOpenSource}
                onCopy={handleCopy}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </ErrorBoundary>
          </>
        )}
      </div>

      {/* ---- Status bar (28px) ---- */}
      <MemoryStatusBar brainLive={!isLoading && stats !== null} cliCount={cliCount} lastDream={lastDream} />

      {/* ---- Import drawer ---- */}
      <ImportDrawer open={importOpen} onClose={() => setImportOpen(false)} />

      {/* ---- Composer modal ---- */}
      <ComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} />

      {/* ---- Entry editor modal (#414) ---- */}
      <EntryEditorModal
        open={editTarget !== null}
        entry={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={handleEditorSaved}
      />

      {/* ---- Threshold modal ---- */}
      {showThresholdModal && (
        <Suspense fallback={null}>
          <PromotionThresholdModalLazy onClose={() => setShowThresholdModal(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default FullPanelShell;
