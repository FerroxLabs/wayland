/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Message, Switch } from '@arco-design/web-react';
import { Download, RefreshCw, Sparkles } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import { useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { ipcBridge } from '@/common';
import type { SkillStats } from '@/common/adapter/ipcBridge';
import type { SkillIndexEntry, SkillSource, SkillVerdict } from '@/common/types/skillTypes';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import BuildSkillModal from './BuildSkillModal';
import FilterRail from './FilterRail';
import ImportModal from './ImportModal';
import LibraryHealth from './LibraryHealth';
import SkillDetailDrawer from './SkillDetailDrawer';
import SkillRow from './SkillRow';
import './SkillsSettings.module.css';

const SkillsSettings: React.FC = () => {
  const { t } = useTranslation(undefined, { keyPrefix: 'skills' });
  const isMobile = useLayoutContext()?.isMobile ?? false;

  const [entries, setEntries] = useState<SkillIndexEntry[]>([]);
  const [stats, setStats] = useState<SkillStats | null>(null);
  const [pinnedNames, setPinnedNames] = useState<Set<string>>(new Set());
  // Initial query honors `?q=...` so the Workflows page's "Uses these
  // skills" chips can deep-link straight to a pre-filtered Skills view.
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [buildModalVisible, setBuildModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [scanningLibrary, setScanningLibrary] = useState(false);

  // CLI discovery flag (default off). Reads/writes via the skills bridge.
  // Flipping shows a restart-required hint - the discovery only fires once
  // at boot.
  const [cliDiscoveryEnabled, setCliDiscoveryEnabled] = useState(false);
  const [cliDiscoveryDirty, setCliDiscoveryDirty] = useState(false);

  // Filter rail state - empty set = all selected (no filter applied)
  const [selectedSources, setSelectedSources] = useState<Set<SkillSource>>(new Set());
  const [selectedVerdicts, setSelectedVerdicts] = useState<Set<SkillVerdict>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  // Detail drawer state
  const [selectedSkill, setSelectedSkill] = useState<SkillIndexEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const [list, s, pinned] = await Promise.all([
      ipcBridge.skills.list.invoke({ type: 'skill' }),
      ipcBridge.skills.stats.invoke(),
      ipcBridge.skills.getPinned.invoke(),
    ]);
    setEntries(list);
    setStats(s);
    // Hydrate the pin stars from persisted prefs. Without this the stars reset
    // to unchecked on every mount while the stats count still reflects the real
    // pinned total - the desync reported in #72.
    setPinnedNames(new Set(pinned));
  }, []);

  useEffect(() => {
    void fetchData();
    void ipcBridge.skills.getCliDiscoveryEnabled.invoke().then((v) => setCliDiscoveryEnabled(v));
  }, [fetchData]);

  // C4: manual "Scan library" re-run. The regex-only sweep also fires once on
  // app start; this lets the user re-flip any still-unscanned entries (and see
  // the verified counter move) without a restart.
  const handleScanLibrary = useCallback(async () => {
    setScanningLibrary(true);
    try {
      const { rescanned } = await ipcBridge.skills.scanLibrary.invoke();
      await fetchData();
      Message.success(t('scanLibrary.done', { count: rescanned, defaultValue: `Scanned ${rescanned} skills` }));
    } catch {
      Message.error(t('scanLibrary.failed', 'Library scan failed'));
    } finally {
      setScanningLibrary(false);
    }
  }, [fetchData, t]);

  const handleCliDiscoveryToggle = useCallback(async (next: boolean) => {
    setCliDiscoveryEnabled(next);
    setCliDiscoveryDirty(true);
    try {
      await ipcBridge.skills.setCliDiscoveryEnabled.invoke({ enabled: next });
    } catch {
      // Revert on failure - keep the dirty hint hidden since nothing landed.
      setCliDiscoveryEnabled(!next);
      setCliDiscoveryDirty(false);
    }
  }, []);

  const filtered = useMemo(() => {
    let result = entries;

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (e) => (e.name ?? '').toLowerCase().includes(q) || (e.description ?? '').toLowerCase().includes(q)
      );
    }

    // Source filter (empty = show all)
    if (selectedSources.size > 0) {
      result = result.filter((e) => selectedSources.has(e.source));
    }

    // Verdict filter (empty = show all)
    if (selectedVerdicts.size > 0) {
      result = result.filter((e) => selectedVerdicts.has(e.security?.verdict ?? 'unscanned'));
    }

    // Category filter (empty = show all)
    if (selectedCategories.size > 0) {
      result = result.filter((e) => e.metadata.category != null && selectedCategories.has(e.metadata.category));
    }

    return result;
  }, [entries, query, selectedSources, selectedVerdicts, selectedCategories]);

  const handleTogglePin = useCallback(async (name: string, pinned: boolean) => {
    // Optimistic update
    setPinnedNames((prev) => {
      const next = new Set(prev);
      if (pinned) next.add(name);
      else next.delete(name);
      return next;
    });
    try {
      await ipcBridge.skills.setPinned.invoke({ name, pinned });
      const s = await ipcBridge.skills.stats.invoke();
      setStats(s);
    } catch {
      // Revert on failure
      setPinnedNames((prev) => {
        const next = new Set(prev);
        if (pinned) next.delete(name);
        else next.add(name);
        return next;
      });
    }
  }, []);

  const handleRowClick = useCallback((entry: SkillIndexEntry) => {
    setSelectedSkill(entry);
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const renderRow = useCallback(
    (_index: number, entry: SkillIndexEntry) => (
      <SkillRow
        key={entry.name}
        entry={entry}
        pinned={pinnedNames.has(entry.name)}
        onTogglePin={handleTogglePin}
        onClick={handleRowClick}
      />
    ),
    [pinnedNames, handleTogglePin, handleRowClick]
  );

  return (
    <SettingsPageShell
      title={t('title')}
      subtitle={t(
        'lede',
        'Everything your agent can do. One library - built in, imported, and discovered from your other CLI tools. Skills load only when a task needs them, so a library this size never costs you context.'
      )}
      contentClassName='md:max-w-[1200px]'
    >
      <LibraryHealth stats={stats} />

      {/* Notice banner - explains the pinned/auto model so users don't try to
          toggle every skill on/off. Mirrors the mockup's amber-bordered hint
          ("You don't switch skills on and off ..."). Renders only once the
          library is loaded so a fresh install doesn't show a stat-free banner. */}
      {(stats?.total ?? 0) > 0 ? (
        <div
          className='rd-10px px-14px py-10px text-12px flex items-start gap-10px'
          style={{
            background: 'rgba(233,164,14,0.10)',
            border: '1px solid rgba(233,164,14,0.34)',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ color: 'var(--warning, #e9a40e)', fontSize: 16, lineHeight: 1 }}>⚡</span>
          <span>
            {t(
              'banner.howItWorks',
              "You don't switch skills on and off. Wayland reads each task and loads the skills that fit - out of all your skills. Pin the handful you always want at hand; leave the rest to us."
            )}
          </span>
        </div>
      ) : null}

      <div className='flex items-center gap-10px flex-wrap'>
        <Input.Search
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(v) => setQuery(v)}
          style={isMobile ? { flex: '1 1 100%', maxWidth: 'unset' } : { flex: 1, maxWidth: 'unset' }}
          allowClear
        />
        <Button
          type='secondary'
          icon={<RefreshCw size={14} />}
          loading={scanningLibrary}
          onClick={() => void handleScanLibrary()}
        >
          {t('actions.scanLibrary', 'Scan library')}
        </Button>
        <Button type='secondary' icon={<Download size={14} />} onClick={() => setImportModalVisible(true)}>
          {t('actions.import', 'Import skills')}
        </Button>
        <Button type='primary' icon={<Sparkles size={14} />} onClick={() => setBuildModalVisible(true)} className=''>
          {t('actions.build')}
        </Button>
      </div>

      {/* CLI discovery toggle - opt-in mirror of ~/.claude/skills,
          ~/.codex/skills, ~/.gemini/skills. Default off because surfacing
          third-party slash-command files without consent is bad form;
          flipping requires a restart to take effect (the discovery fires
          once at boot). */}
      <div
        className='flex items-center justify-between px-14px py-10px rd-10px'
        style={{
          background: 'var(--color-bg-2)',
          border: '1px solid var(--color-border-2)',
        }}
      >
        <div className='flex-1 min-w-0'>
          <div className='text-13px font-medium' style={{ color: 'var(--text-primary)' }}>
            {t('cliDiscovery.title', 'Mirror skills from installed CLI tools')}
          </div>
          <div className='text-12px mt-2px' style={{ color: 'var(--text-secondary)' }}>
            {t(
              'cliDiscovery.subtitle',
              'Surface skills from ~/.claude/skills, ~/.codex/skills, and ~/.gemini/skills so they show up on your Skills page. Opt-in. Restart required to take effect.'
            )}
            {cliDiscoveryDirty ? (
              <span style={{ color: 'var(--warning, #e9a40e)', marginLeft: 6 }}>
                {t('cliDiscovery.restartNeeded', '- restart the app to apply.')}
              </span>
            ) : null}
          </div>
        </div>
        <Switch
          checked={cliDiscoveryEnabled}
          onChange={(v) => {
            void handleCliDiscoveryToggle(v);
          }}
        />
      </div>

      <BuildSkillModal
        visible={buildModalVisible}
        onClose={() => setBuildModalVisible(false)}
        onSaved={() => {
          void fetchData();
          setBuildModalVisible(false);
        }}
      />

      <ImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onImported={() => void fetchData()}
      />

      <div
        className={
          isMobile ? 'skills-shell rd-12px overflow-hidden flex flex-col' : 'skills-shell rd-12px overflow-hidden flex'
        }
        style={{
          background: 'var(--color-bg-2)',
          border: '1px solid var(--color-border-2)',
        }}
      >
        <FilterRail
          entries={entries}
          selectedSources={selectedSources}
          selectedVerdicts={selectedVerdicts}
          selectedCategories={selectedCategories}
          onSourcesChange={setSelectedSources}
          onVerdictsChange={setSelectedVerdicts}
          onCategoriesChange={setSelectedCategories}
        />

        <div className='flex-1 min-w-0 flex flex-col' style={{ background: 'var(--color-bg-1)' }}>
          {/* Row-list header - count + filter summary, mirrors the mockup's
              "2,047 skills · showing all sources" affordance. */}
          {filtered.length > 0 ? (
            <div
              className='flex items-center justify-between px-16px py-10px text-11px uppercase font-semibold'
              style={{
                borderBottom: '1px solid var(--color-border-1)',
                color: 'var(--color-text-3)',
                letterSpacing: '0.08em',
              }}
            >
              <span>
                {filtered.length.toLocaleString()} {filtered.length === 1 ? 'skill' : 'skills'}
              </span>
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <div className='text-center text-13px py-40px' style={{ color: 'var(--text-secondary)' }}>
              {query.trim()
                ? t('search.empty')
                : entries.length === 0
                  ? t('search.emptyLibrary', 'No skills loaded yet - try importing one.')
                  : t('search.empty')}
            </div>
          ) : (
            <Virtuoso
              className='skills-virtuoso'
              style={{ height: Math.min(filtered.length * 84, 640) }}
              totalCount={filtered.length}
              data={filtered}
              itemContent={renderRow}
            />
          )}
        </div>
      </div>

      <SkillDetailDrawer
        entry={selectedSkill}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onTogglePin={handleTogglePin}
        pinned={selectedSkill ? pinnedNames.has(selectedSkill.name) : false}
      />
    </SettingsPageShell>
  );
};

export default SkillsSettings;
