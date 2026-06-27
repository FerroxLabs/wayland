/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { KickoffGridItem } from '@process/services/kickoff/types';
import styles from './KickoffGrid.module.css';

export type KickoffGridProps = {
  items: KickoffGridItem[];
  /** Click handler - receives the prefill text to drop (editable) into the composer. */
  onSelect: (prefill: string) => void;
};

/**
 * #375 - per-assistant suggested-prompts grid for the assistant detail view
 * (restores the pre-v0.9.6 per-assistant starters, redesigned). Renders 4-6
 * capability-based starter cards below the composer; clicking a card prefills
 * the composer (editable, not auto-send) so the user can tweak before sending.
 *
 * Card styling mirrors KickoffCard (same elevated surface tokens) so the grid
 * reads as the same family as the single yes-bias card. Raw <button> is used
 * intentionally (lint-disabled) - an Arco Button forces a filled/outlined
 * visual that competes with the composer's primary send affordance, the same
 * precedent KickoffCard set for its peer-weighted controls.
 */
const KickoffGrid: React.FC<KickoffGridProps> = ({ items, onSelect }) => {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  return (
    <div className={styles.wrap} data-testid='assistant-kickoff-grid'>
      <div className={styles.heading}>
        {t('guid.assistantDetail.kickoffGrid.heading', { defaultValue: 'Try one of these' })}
      </div>
      <div className={styles.grid}>
        {items.map((item, index) => (
          /* eslint-disable-next-line wayland/no-raw-button */
          <button
            type='button'
            key={item.kickoffId ?? `${item.source}-${index}`}
            className={styles.card}
            data-testid='assistant-kickoff-card'
            onClick={() => onSelect(item.prefill)}
          >
            {item.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default KickoffGrid;
