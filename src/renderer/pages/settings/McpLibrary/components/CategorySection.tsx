import React from 'react';
import type { CatalogIndexEntry } from '../types';
import { McpCard } from './McpCard';

const labels: Record<string, string> = {
  communication: 'Communication',
  'files-and-docs': 'Files & Documents',
  calendar: 'Calendar & Scheduling',
  'developer-tools': 'Developer Tools',
  developer: 'Developer Tools',
  code: 'Code & Repos',
  'search-and-web': 'Search & Web',
  search: 'Search & Web',
  personal: 'Personal & Lifestyle',
  productivity: 'Productivity',
  automation: 'Automation',
  browser: 'Browser',
  crm: 'CRM',
  data: 'Data',
  devops: 'DevOps',
  'home-automation': 'Home Automation',
  infrastructure: 'Infrastructure',
  iot: 'IoT',
  knowledge: 'Knowledge',
  media: 'Media',
  news: 'News',
  observability: 'Observability',
  payments: 'Payments',
  research: 'Research',
  sales: 'Sales',
  tasks: 'Tasks',
};

interface Props {
  category: string;
  entries: CatalogIndexEntry[];
  installedIds: Set<string>;
  onSelect: (id: string) => void;
}

export function CategorySection({ category, entries, installedIds, onSelect }: Props) {
  if (entries.length === 0) return null;
  return (
    <section className="mcp-cat-section">
      <header className="mcp-cat-head">
        <h4>{labels[category] ?? category}</h4>
        <span className="mcp-cat-count">{entries.length} entries</span>
      </header>
      <div className="mcp-grid">
        {entries.map((e) => (
          <McpCard
            key={e.id}
            entry={e}
            installed={installedIds.has(e.id)}
            onClick={() => onSelect(e.id)}
          />
        ))}
      </div>
    </section>
  );
}
