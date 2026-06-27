/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import type { KickoffGridItem } from '@process/services/kickoff/types';
import styles from './KickoffGrid.module.css';

export type KickoffGridProps = {
  items: KickoffGridItem[];
  /** Click handler - receives the prefill text to drop (editable) into the composer. */
  onSelect: (prefill: string) => void;
};

/**
 * Split a kickoff's display text into a bold lead (the "Want me to ...?" ask)
 * and a muted supporting line (the "name the topic / paste the section"
 * instruction). Authoring convention puts the ask on line 1 and the
 * instruction on the following lines; when there is no break the whole string
 * is the title.
 */
function splitKickoffText(text: string): { title: string; body: string } {
  const trimmed = (text ?? '').trim();
  const nl = trimmed.indexOf('\n');
  if (nl === -1) return { title: trimmed, body: '' };
  return {
    title: trimmed.slice(0, nl).trim(),
    body: trimmed.slice(nl + 1).replace(/\s+/g, ' ').trim(),
  };
}

/**
 * #375 - per-assistant suggested-prompts grid for the assistant detail view
 * (restores the pre-v0.9.6 per-assistant starters, redesigned). Renders 4-6
 * capability-based starter cards below the composer; clicking a card prefills
 * the composer (editable, not auto-send) so the user can tweak before sending.
 *
 * Each card reads as an actionable starter: a bold ask, a muted one-line
 * instruction, and a trailing arrow affordance that brightens on hover so the
 * grid clearly signals "click to begin" rather than reading as a wall of text.
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
        {items.map((item, index) => {
          const { title, body } = splitKickoffText(item.text);
          return (
            /* eslint-disable-next-line wayland/no-raw-button */
            <button
              type='button'
              key={item.kickoffId ?? `${item.source}-${index}`}
              className={styles.card}
              data-testid='assistant-kickoff-card'
              onClick={() => onSelect(item.prefill)}
            >
              <span className={styles.cardText}>
                <span className={styles.cardTitle}>{title}</span>
                {body ? <span className={styles.cardBody}>{body}</span> : null}
              </span>
              <ArrowRight className={styles.cardArrow} size={16} aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default KickoffGrid;
