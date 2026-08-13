/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Side-by-side Classic / Cockpit picker.
 *
 * Shared by both surfaces that offer the choice: a step in first-run onboarding
 * for new installs, and a one-time prompt for existing ones. Presentation only —
 * it renders two options and reports the pick upward. Persisting the shell and
 * recording that the user was asked belong to the callers, because the two
 * surfaces finish differently (onboarding continues to its next screen, the
 * prompt closes).
 *
 * The preview images are captured from a throwaway profile by
 * `scripts/capture-shell-choice-shots.mjs`. Re-run it whenever either shell's
 * navigation changes: a stale pair is worse than none, because it promises a
 * layout the app no longer has.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import type { ShellExperience } from '@/common/shellExperience';
import classicShot from '@/renderer/assets/shell-choice/classic.png';
import cockpitShot from '@/renderer/assets/shell-choice/cockpit.png';
import styles from './ShellChoiceCards.module.css';

export type ShellChoiceCardsProps = {
  /** Which card reads as selected. */
  value: ShellExperience;
  /** Fired when the user picks a card. */
  onChange: (shell: ShellExperience) => void;
  /** Disables interaction while a pick is being persisted. */
  busy?: boolean;
};

type CardSpec = {
  shell: ShellExperience;
  image: string;
  titleKey: string;
  titleFallback: string;
  blurbKey: string;
  blurbFallback: string;
};

const CARDS: CardSpec[] = [
  {
    shell: 'classic',
    image: classicShot,
    titleKey: 'shellChoice.classic.title',
    titleFallback: 'Classic',
    blurbKey: 'shellChoice.classic.blurb',
    blurbFallback: 'Every destination listed down the side. Nothing moves, nothing is hidden.',
  },
  {
    shell: 'cockpit',
    image: cockpitShot,
    titleKey: 'shellChoice.cockpit.title',
    titleFallback: 'Cockpit',
    blurbKey: 'shellChoice.cockpit.blurb',
    blurbFallback: 'A shorter list that groups the same things under Library, Automations and Activity.',
  },
];

const ShellChoiceCards: React.FC<ShellChoiceCardsProps> = ({ value, onChange, busy = false }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.grid} role='radiogroup' aria-label={t('shellChoice.groupLabel', { defaultValue: 'Interface layout' })}>
      {CARDS.map((card) => {
        const selected = value === card.shell;
        const title = t(card.titleKey, { defaultValue: card.titleFallback });
        return (
          <button
            key={card.shell}
            type='button'
            role='radio'
            aria-checked={selected}
            disabled={busy}
            data-testid={`shell-choice-card-${card.shell}`}
            className={`${styles.card} ${selected ? styles.cardSelected : ''}`}
            onClick={() => onChange(card.shell)}
          >
            <img
              className={styles.shot}
              src={card.image}
              /*
               * The screenshot is decorative: the heading and blurb beside it
               * already carry the same information in text, so describing the
               * image again would make a screen reader read each option twice.
               */
              alt=''
              aria-hidden='true'
              draggable={false}
            />
            <span className={styles.title}>{title}</span>
            <span className={styles.blurb}>{t(card.blurbKey, { defaultValue: card.blurbFallback })}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ShellChoiceCards;
