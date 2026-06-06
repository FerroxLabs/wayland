import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMcpLibrary } from './hooks/useMcpLibrary';
import { useMcpServers } from '@renderer/hooks/mcp/useMcpServers';
import { RecommendedGrid } from './components/RecommendedGrid';
import { CategorySection } from './components/CategorySection';
import { TierFilter } from './components/TierFilter';
import type { Tier, CatalogIndexEntry } from './types';

export function BrowsePage() {
  const library = useMcpLibrary();
  const { mcpServers } = useMcpServers();
  const navigate = useNavigate();

  const installedIds = useMemo(
    // libraryEntryId is added in P8; cast to any for P7 forward-compat reads.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => new Set(mcpServers.map((s: any) => s.libraryEntryId).filter(Boolean) as string[]),
    [mcpServers],
  );

  const [tier, setTier] = useState<Tier | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return library.entries.filter(
      (e) =>
        (tier === 'all' || e.tier === tier) &&
        (q === '' ||
          e.name.toLowerCase().includes(q) ||
          e.shortDescription.toLowerCase().includes(q)),
    );
  }, [library.entries, tier, search]);

  const counts = {
    all: library.entries.length,
    core: library.byTier.core.length,
    worker: library.byTier.worker.length,
    builder: library.byTier.builder.length,
  };

  const categoryOrder = [
    'communication',
    'files-and-docs',
    'calendar',
    'developer',
    'code',
    'productivity',
    'search',
    'automation',
    'browser',
    'crm',
    'data',
    'devops',
    'home-automation',
    'infrastructure',
    'iot',
    'knowledge',
    'media',
    'news',
    'observability',
    'payments',
    'research',
    'sales',
    'tasks',
    'personal',
  ];

  const filteredByCategory = useMemo(() => {
    const map: Record<string, CatalogIndexEntry[]> = {};
    for (const e of filtered) {
      const primary = e.categories[0] ?? 'personal';
      (map[primary] ??= []).push(e);
    }
    return map;
  }, [filtered]);

  const onSelect = (id: string) =>
    navigate(`/settings/mcp-library/${encodeURIComponent(id)}`);

  return (
    <div className="mcp-library-page">
      <header className="mcp-page-head">
        <h2>MCP Library</h2>
        <p>
          Curated connectors. Browse, install with one click, and follow the setup guide.
        </p>
      </header>

      <div className="mcp-filter-bar">
        <input
          className="mcp-search"
          placeholder="Search MCPs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <TierFilter active={tier} counts={counts} onChange={setTier} />
      </div>

      {search === '' && tier === 'all' && (
        <RecommendedGrid
          entries={library.recommended}
          installedIds={installedIds}
          onSelect={onSelect}
        />
      )}

      {categoryOrder.map((cat) => (
        <CategorySection
          key={cat}
          category={cat}
          entries={filteredByCategory[cat] ?? []}
          installedIds={installedIds}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
