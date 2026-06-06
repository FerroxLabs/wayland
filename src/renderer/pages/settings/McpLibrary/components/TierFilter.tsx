import React from 'react';
import type { Tier } from '../types';

interface Props {
  active: Tier | 'all';
  counts: { all: number; core: number; worker: number; builder: number };
  onChange: (t: Tier | 'all') => void;
}

export function TierFilter({ active, counts, onChange }: Props) {
  const tiers: { key: Tier | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'core', label: 'Core' },
    { key: 'worker', label: 'Worker' },
    { key: 'builder', label: 'Builder' },
  ];
  return (
    <div className="mcp-tier-filter">
      {tiers.map((t) => (
        <button
          key={t.key}
          className={`mcp-chip ${active === t.key ? 'is-active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.key !== 'all' && <span className={`mcp-dot mcp-dot-${t.key}`} />}
          {t.label} <span className="mcp-chip-count">{counts[t.key]}</span>
        </button>
      ))}
    </div>
  );
}
