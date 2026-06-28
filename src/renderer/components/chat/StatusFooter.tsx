/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './StatusFooter.module.css';

/**
 * #252 - live "what's happening" footer. Port of Foundry's ThinkingFooter,
 * re-voiced for Wayland. Replaces ThoughtDisplay's running-only spinner branch:
 * the old spinner is driven by a single boolean and vanishes the instant any
 * message arrives, leaving the user staring at a frozen screen mid-turn. This
 * footer persists through the whole turn - elapsed timer, dot-pulse, rotating
 * phrases - driven by the existing `isProcessing` boolean, and fades out when
 * the turn ends. Renders a fixed-height spacer when idle so the Virtuoso layout
 * does not jump.
 *
 * The rotating phrases are brand/personality copy and intentionally
 * English-only (matches the Foundry precedent); the elapsed unit + the
 * "context loaded" label go through i18n with inline defaults.
 */

// Wayland-voiced status phrases - personality copy, intentionally English-only.
const PHRASES = [
  'Thinking it through...',
  'Working the problem...',
  'Lining up the approach...',
  'Connecting the dots...',
  'Reasoning carefully...',
  'Drafting the plan...',
  'Checking the details...',
  'Putting it together...',
  'Weighing the options...',
  'Tracing the path...',
  'Sharpening the answer...',
  'Almost there...',
];

type StatusFooterProps = {
  isProcessing: boolean;
  /**
   * Epoch-ms timestamp of when the running turn actually started. When provided,
   * the elapsed timer counts from here so it shows TOTAL running time and
   * survives chat switches / remounts (#288). Falls back to mount time if absent.
   */
  startTime?: number;
};

const StatusFooter: React.FC<StatusFooterProps> = ({ isProcessing, startTime }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);

  // Visibility: fade-out transition when isProcessing goes false.
  useEffect(() => {
    if (isProcessing) {
      setVisible(true);
      setFading(false);
    } else if (visible) {
      setFading(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setFading(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, visible]);

  // Phrase rotation: every 3 seconds while visible.
  useEffect(() => {
    if (!visible) return;
    setPhraseIndex(0);
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [visible]);

  // Elapsed time: start tracking when visible, update every 1s. Anchored to the
  // turn's real start (#288) so it shows TOTAL elapsed and survives remounts
  // instead of resetting to 0 when switching chats and returning.
  useEffect(() => {
    if (!visible) {
      setElapsed(0);
      return;
    }
    startTimeRef.current = typeof startTime === 'number' ? startTime : Date.now();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [visible, startTime]);

  // Idle: render a spacer to preserve Virtuoso layout (no jump).
  if (!visible) return <div className={styles.spacer} />;

  const sUnit = t('common.unit.second_short', { defaultValue: 's' });

  return (
    <div
      className={`${styles.container} ${fading ? styles.fading : ''}`}
      data-testid='status-footer'
      data-fading={fading ? 'true' : 'false'}
    >
      <div className={styles.activeStep}>
        <span className={styles.dotPulse} aria-hidden='true'>
          <span />
          <span />
          <span />
        </span>
        <span className={styles.phrase}>{PHRASES[phraseIndex]}</span>
        {elapsed >= 2 && (
          <span className={styles.elapsed}>
            {elapsed}
            {sUnit}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatusFooter;
