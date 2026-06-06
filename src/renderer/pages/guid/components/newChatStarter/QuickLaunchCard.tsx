/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Zap,
  PenLine,
  Handshake,
  Rocket,
  BarChart3,
  Landmark,
  type LucideIcon,
} from 'lucide-react';
import type { QuickLaunchAnchorId } from '@/renderer/pages/guid/quickLaunchAnchors';
import AssistantIconTile, { type PaletteKey } from '@/renderer/pages/guid/components/AssistantIconTile';
import styles from './QuickLaunchCard.module.css';

/**
 * Single quick-launch card. Renders a Lucide glyph + label + sub-line.
 * The icon name is looked up in ICON_MAP (kebab-case keys matching
 * QuickLaunchAnchor.lucideIcon); unknown names fall back to Zap so the
 * card always renders something. Each anchor gets a category-colored
 * tile background via AssistantIconTile so flat-fill icons stay legible
 * on dark backgrounds. Cowork keeps its subtle orange gradient on the
 * card itself to mark it as the place-anchor button.
 */

const ICON_MAP: Record<string, LucideIcon> = {
  'zap': Zap,
  'pen-line': PenLine,
  'handshake': Handshake,
  'rocket': Rocket,
  'bar-chart-3': BarChart3,
  'landmark': Landmark,
};

const ANCHOR_PALETTE: Record<QuickLaunchAnchorId, PaletteKey> = {
  'cowork': 'cowork',
  'write-copy': 'write',
  'close-deal': 'sales',
  'launch-it': 'launch',
  'numbers': 'finance',
  'quiet-money': 'finance',
};

export type QuickLaunchCardProps = {
  id: QuickLaunchAnchorId;
  label: string;
  sub: string;
  lucideIcon: string;
  onSelect: (id: QuickLaunchAnchorId) => void;
};

const QuickLaunchCard: React.FC<QuickLaunchCardProps> = ({
  id,
  label,
  sub,
  lucideIcon,
  onSelect,
}) => {
  const IconComponent = ICON_MAP[lucideIcon] ?? Zap;
  const isCowork = id === 'cowork';
  return (
    <button
      type='button'
      data-quicklaunch-id={id}
      className={`${styles.card} ${isCowork ? styles.cowork : ''}`}
      onClick={() => onSelect(id)}
      aria-label={`${label} - ${sub}`}
    >
      <AssistantIconTile paletteKey={ANCHOR_PALETTE[id]} size='sm'>
        <IconComponent size={16} />
      </AssistantIconTile>
      <div className={styles.label}>{label}</div>
      <div className={styles.sub}>{sub}</div>
    </button>
  );
};

export default QuickLaunchCard;
