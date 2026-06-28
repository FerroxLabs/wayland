/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import OrbitGlyph from './OrbitGlyph';
import styles from './OrbitThinking.module.css';

/**
 * Branded orbit "thinking" indicator. Rendered inline as the message-list footer
 * (under the last block, Claude-style) and ALWAYS present once a conversation has
 * content:
 *   - while processing: the orbit ANIMATES + shows a label (the real current
 *     action via `currentLabel`, else a rotating themed phrase) + an elapsed timer.
 *   - when done: the orbit holds STATIC (resting), no label - it stays put under
 *     the last response with padding beneath it.
 *
 * It never mounts/unmounts on state change (the parent keeps it stable to avoid
 * flicker), so the CSS animation runs continuously; only `paused` toggles.
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

type Props = {
  isProcessing: boolean;
  currentLabel?: string;
  /**
   * Epoch-ms timestamp of when the running turn actually started (the user's
   * submission). When provided, the elapsed timer counts from here so it shows
   * TOTAL running time and survives chat switches / remounts (#288). Falls back
   * to the mount time when absent.
   */
  startTime?: number;
};

const OrbitThinking: React.FC<Props> = ({ isProcessing, currentLabel, startTime }) => {
  const { t } = useTranslation();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);

  // Phrase rotation: every 3 seconds, only while processing.
  useEffect(() => {
    if (!isProcessing) return;
    setPhraseIndex(0);
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Elapsed time: tracked only while processing, reset when idle. Anchored to
  // the turn's real start (#288) so returning to a still-running chat shows the
  // TOTAL elapsed time, not time-since-reentry, and idle chats never tick.
  useEffect(() => {
    if (!isProcessing) {
      setElapsed(0);
      return;
    }
    startTimeRef.current = typeof startTime === 'number' ? startTime : Date.now();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isProcessing, startTime]);

  const sUnit = t('common.unit.second_short', { defaultValue: 's' });
  const hasRealLabel = typeof currentLabel === 'string' && currentLabel.length > 0;
  const label = hasRealLabel ? currentLabel : PHRASES[phraseIndex];

  return (
    <div className={styles.container} data-testid='orbit-thinking' data-processing={isProcessing ? 'true' : 'false'}>
      <div className={styles.activeStep}>
        <OrbitGlyph size={22} paused={!isProcessing} />
        {isProcessing && (
          <>
            <span
              className={classNames(styles.label, { [styles.labelReal]: hasRealLabel })}
              data-testid='orbit-thinking-label'
            >
              {label}
            </span>
            {elapsed >= 2 && (
              <span className={styles.elapsed}>
                {elapsed}
                {sUnit}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrbitThinking;
