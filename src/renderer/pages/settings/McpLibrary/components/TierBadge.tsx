import React from 'react';
import type { Tier } from '../types';

const labels: Record<Tier, string> = { core: 'Core', worker: 'Worker', builder: 'Builder' };

export function TierBadge({ tier }: { tier: Tier }) {
  return <span className={`mcp-tier-badge mcp-tier-${tier}`}>● {labels[tier]}</span>;
}
