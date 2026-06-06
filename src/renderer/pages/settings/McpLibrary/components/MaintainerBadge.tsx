import React from 'react';
import type { MaintainerType } from '../types';

const labels: Record<MaintainerType, string> = {
  official: 'Official',
  community: 'Community',
  wayland: 'Built by Wayland',
};

export function MaintainerBadge({ type }: { type: MaintainerType }) {
  return (
    <span className={`mcp-maintainer-badge mcp-maintainer-${type}`}>{labels[type]}</span>
  );
}
