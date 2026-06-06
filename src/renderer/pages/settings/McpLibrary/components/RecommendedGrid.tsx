import React from 'react';
import type { CatalogIndexEntry } from '../types';
import { McpCard } from './McpCard';

interface Props {
  entries: CatalogIndexEntry[];
  installedIds: Set<string>;
  onSelect: (id: string) => void;
}

export function RecommendedGrid({ entries, installedIds, onSelect }: Props) {
  return (
    <section className="mcp-rec-section">
      <h3 className="mcp-rec-title">★ Recommended for you</h3>
      <div className="mcp-rec-grid">
        {entries.map((e, i) => (
          <div key={e.id} className="mcp-rec-card-wrap">
            <div className="mcp-rec-rank">
              #{i + 1} · {Math.round(e.installRate * 100)}% installed
            </div>
            <McpCard
              entry={e}
              installed={installedIds.has(e.id)}
              onClick={() => onSelect(e.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
