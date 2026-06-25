/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Greeting.module.css';

export type GreetingProps = {
  /** Overrides the wall-clock time used to pick the phrase (testing). */
  now?: Date;
  /**
   * Resolved display name to greet (e.g. the authenticated username). When
   * empty / nullish the greeting drops the name and renders the time-of-day
   * phrase on its own.
   */
  displayName?: string | null;
};

type TimeBucket = 'lateNight' | 'morning' | 'afternoon' | 'evening' | 'night';

/** Map a 0–23 hour to a time-of-day bucket. */
const resolveTimeBucket = (hour: number): TimeBucket => {
  if (hour < 5) return 'lateNight';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
};

/** Phrasings per bucket - kept in sync with guid.newChat.greeting.labels. */
const LABEL_POOL: Record<TimeBucket, string[]> = {
  lateNight: ['Working late', 'Burning the midnight oil', 'Up late'],
  morning: ['Morning', 'Good morning', 'Rise and shine'],
  afternoon: ['Afternoon', 'Good afternoon', 'Welcome back'],
  evening: ['Evening', 'Good evening', 'Welcome back'],
  night: ['Evening', 'Good evening', 'Winding down'],
};

/**
 * Serif greeting for the new-chat starter surface.
 *
 * Renders "<phrase>, <name>" when `displayName` is provided, otherwise just
 * "<phrase>". The phrase varies by time of day (lateNight <5, morning <12,
 * afternoon <17, evening <21, otherwise night). The phrasing is chosen
 * deterministically from the current date+hour so a remount (e.g. an upstream
 * re-render in headless mode) never visibly flips the text — it only changes
 * once per hour, never per mount.
 */
const Greeting: React.FC<GreetingProps> = ({ now, displayName }) => {
  const { t } = useTranslation();
  const resolvedName = (displayName ?? '').trim();
  const date = now ?? new Date();
  const bucket = resolveTimeBucket(date.getHours());

  // Deterministic, remount-stable selection: seed off the calendar day + hour
  // so the phrase is constant for any given hour but still rotates over time.
  const seed = date.getFullYear() * 1000000 + (date.getMonth() + 1) * 10000 + date.getDate() * 100 + date.getHours();
  const variantIndex = seed % LABEL_POOL[bucket].length;

  const timeLabel = t(`guid.newChat.greeting.labels.${bucket}.${variantIndex}`, {
    defaultValue: LABEL_POOL[bucket][variantIndex],
  });

  const heading = resolvedName
    ? t('guid.newChat.greeting.withName', {
        defaultValue: '{{timeLabel}}, {{name}}',
        timeLabel,
        name: resolvedName,
      })
    : timeLabel;

  return (
    <h1 className={styles.greeting} data-testid='new-chat-greeting'>
      {heading}
    </h1>
  );
};

export default Greeting;
