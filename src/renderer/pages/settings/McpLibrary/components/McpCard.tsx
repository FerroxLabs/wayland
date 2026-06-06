import React from 'react';
import { Check, Plus } from 'lucide-react';
import type { CatalogIndexEntry } from '../types';
import { TierBadge } from './TierBadge';
import { MaintainerBadge } from './MaintainerBadge';

interface Props {
  entry: CatalogIndexEntry;
  installed: boolean;
  onClick: () => void;
}

export function McpCard({ entry, installed, onClick }: Props) {
  const isWaylandBuilt = entry.maintainerType === 'wayland';
  return (
    <div
      className={`mcp-card ${installed ? 'is-installed' : ''} ${isWaylandBuilt ? 'is-wayland-built' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="mcp-card-top">
        <img className="mcp-card-logo" src={entry.iconUrl} alt="" />
        <div className="mcp-card-meta">
          <div className="mcp-card-name">
            {entry.name}
            {entry.verifiedByWayland && (
              <Check className="mcp-card-verified-tick" size={13} />
            )}
          </div>
          <div className="mcp-card-publisher">{entry.id}</div>
        </div>
      </div>
      <div className="mcp-card-desc">{entry.shortDescription}</div>
      <div className="mcp-card-tags">
        <TierBadge tier={entry.tier} />
        <MaintainerBadge type={entry.maintainerType} />
      </div>
      <div className="mcp-card-footer">
        <button
          className={`mcp-install-btn ${installed ? 'is-installed' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          {installed ? (
            <>
              <Check size={12} /> Installed
            </>
          ) : (
            <>
              <Plus size={12} /> Install
            </>
          )}
        </button>
      </div>
    </div>
  );
}
