/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * "Preview is in its own window" (SPEC-PREVIEW-PANE §2 decision 2).
 *
 * Popping the preview out frees the rail, and an empty 340px column beside a
 * document that is no longer in it wastes both the reading space and the
 * writing space. But a hole is not an answer either: a popped window sitting
 * BEHIND the main one reads as a lost deliverable, and the recovery people
 * reach for is asking the assistant to make it again - a real API call and a
 * dent in trust. So the pane leaves a marker with a way home.
 *
 * Presentational on purpose: every transition lives in `usePreviewAway`, so
 * this can be mounted in a test without Arco, SWR, the voice session or the
 * IPC bridge coming with it.
 */

import classNames from 'classnames';
import { ExternalLink } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

/** One-shot pulse. Long enough to catch the eye, short enough not to nag. */
const PULSE_MS = 600;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Read in JS rather than left to a `motion-reduce:` utility because the count
 * has to stay VISIBLE while the motion goes away - "no animation" is not "no
 * state". A CSS-only suppression also cannot be proven: jsdom evaluates no
 * media queries, so the class would be present either way and the test would
 * assert nothing.
 */
const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = React.useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    setReduced(query.matches);
    // Safari below 14 only has the deprecated listener API.
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }
    query.addListener?.(onChange);
    return () => query.removeListener?.(onChange);
  }, []);

  return reduced;
};

const PreviewAwayStrip: React.FC<{
  /** Deliverables that arrived since the pop-out. Zero hides the badge. */
  arrivals: number;
  /** Bumped once per arrival; a change starts the one-shot pulse. */
  pulseToken: number;
  onBringBack: () => void;
}> = ({ arrivals, pulseToken, onBringBack }) => {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();
  const [pulsing, setPulsing] = React.useState(false);

  React.useEffect(() => {
    if (pulseToken === 0 || reducedMotion) return;
    setPulsing(true);
    const timer = window.setTimeout(() => setPulsing(false), PULSE_MS);
    return () => window.clearTimeout(timer);
  }, [pulseToken, reducedMotion]);

  return (
    <div
      className='preview-away flex items-center gap-8px px-10px py-6px rounded-8px text-13px text-t-secondary'
      // `status` and not `alert`: an arrival is worth announcing, not worth
      // interrupting. It is also what keeps the count perceivable when the
      // pulse is suppressed.
      role='status'
      data-testid='preview-away-strip'
    >
      <ExternalLink size={14} aria-hidden='true' className='shrink-0' />
      <span className='min-w-0 truncate'>
        {t('preview.awayTitle', { defaultValue: 'Preview is in its own window' })}
      </span>
      {arrivals > 0 && (
        <span
          className={classNames('preview-away__count shrink-0', pulsing && 'preview-away__count--pulse')}
          data-testid='preview-away-count'
          data-pulsing={pulsing ? 'true' : 'false'}
          aria-label={t('preview.awayNewCount', {
            count: arrivals,
            defaultValue: 'New in that window: {{count}}',
          })}
        >
          {arrivals}
        </span>
      )}
      <button
        type='button'
        className='preview-away__action shrink-0 border-0 bg-transparent cursor-pointer text-t-primary underline-offset-2 hover:underline'
        data-testid='preview-away-bring-back'
        onClick={onBringBack}
      >
        {t('preview.awayBringBack', { defaultValue: 'Bring it back' })}
      </button>
    </div>
  );
};

export default PreviewAwayStrip;
