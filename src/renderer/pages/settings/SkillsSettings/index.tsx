/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Input } from '@arco-design/web-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';
import { ipcBridge } from '@/common';
import type { SkillStats } from '@/common/adapter/ipcBridge';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import LibraryHealth from './LibraryHealth';
import SkillRow from './SkillRow';

const SkillsSettings: React.FC = () => {
  const { t } = useTranslation('skills');

  const [entries, setEntries] = useState<SkillIndexEntry[]>([]);
  const [stats, setStats] = useState<SkillStats | null>(null);
  const [pinnedNames, setPinnedNames] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const fetchData = useCallback(async () => {
    const [list, s] = await Promise.all([
      ipcBridge.skills.list.invoke(),
      ipcBridge.skills.stats.invoke(),
    ]);
    setEntries(list);
    setStats(s);
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    const q = query.toLowerCase();
    return entries.filter(
      (e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
    );
  }, [entries, query]);

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

  const renderRow = useCallback(
    (_index: number, entry: SkillIndexEntry) => (
      <SkillRow
        key={entry.name}
        entry={entry}
        pinned={pinnedNames.has(entry.name)}
        onTogglePin={handleTogglePin}
      />
    ),
    [pinnedNames, handleTogglePin]
  );

  return (
    <SettingsPageShell
      title={t('title')}
      subtitle={t('subtitle')}
      contentClassName='md:max-w-[1200px]'
    >
      <LibraryHealth stats={stats} />

      <Input.Search
        placeholder={t('search.placeholder')}
        value={query}
        onChange={(v) => setQuery(v)}
        style={{ maxWidth: 320 }}
        allowClear
      />

      <div
        className='bg-base rd-12px border overflow-hidden'
        style={{ borderColor: 'var(--border-1)' }}
      >
        {filtered.length === 0 ? (
          <div
            className='text-center text-13px py-40px'
            style={{ color: 'var(--text-secondary)' }}
          >
            {query.trim() ? t('search.empty') : t('search.placeholder')}
          </div>
        ) : (
          <Virtuoso
            style={{ height: Math.min(filtered.length * 45, 600) }}
            totalCount={filtered.length}
            data={filtered}
            itemContent={renderRow}
          />
        )}
      </div>
    </SettingsPageShell>
  );
};

export default SkillsSettings;
