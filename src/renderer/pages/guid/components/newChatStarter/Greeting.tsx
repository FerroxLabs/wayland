/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Greeting.module.css';

export type GreetingProps = {
  /** Overrides the wall-clock hour used to pick the time-of-day phrase (testing). */
  now?: Date;
  /**
   * Resolved display name to greet (e.g. the authenticated username). When
   * empty / nullish the greeting drops the name and renders the time-of-day
   * label on its own.
   */
  displayName?: string | null;
};

/** Pick a time-of-day greeting key from a 0–23 hour. */
const resolveTimeOfDayKey = (hour: number): 'morning' | 'afternoon' | 'evening' | 'night' => {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
};

/**
 * Serif greeting for the new-chat starter surface.
 *
 * Renders "<TimeOfDay>, <name>" when `displayName` is provided, otherwise
 * just "<TimeOfDay>". Time-of-day windows: <12 morning, <17 afternoon,
 * <21 evening, otherwise night.
 */
const Greeting: React.FC<GreetingProps> = ({ now, displayName }) => {
  const { t } = useTranslation();
  const resolvedName = (displayName ?? '').trim();
  const date = now ?? new Date();
  const timeKey = resolveTimeOfDayKey(date.getHours());

  const timeLabel = t(`guid.newChat.greeting.${timeKey}`, {
    defaultValue: {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      night: 'Night',
    }[timeKey],
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
