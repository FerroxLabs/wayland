/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Spin } from '@arco-design/web-react';
import styles from './WorkflowLaunchOverlay.module.css';

/**
 * Full-surface launch overlay shown while a workflow session is initializing.
 * Four-frame sequence (per SPEC §5.1) over ~1.6 seconds, then a brief fade-out
 * before handing control back to the workflow surface via `onComplete`.
 *
 * The frames are intentionally a *minimum* hold, not a wait - the real IPC
 * (workflow.start, parse, compose directive) runs in parallel and is expected
 * to finish well inside 1.6s on modern hardware. The hold makes the launch
 * register as a deliberate event rather than a sub-perceptual stutter.
 */

export type WorkflowLaunchOverlayProps = {
  /** Display name of the workflow being launched (shown in the small upper label). */
  workflowName: string;
  /** Number of parsed steps - surfaced in Frame 2 ("Parsing N steps"). */
  totalSteps: number;
  /** Fires after the overlay finishes its 4-frame sequence + fade-out (~1.85s total). */
  onComplete: () => void;
};

// Frame transition timings (ms) - match SPEC §5.1.
const FRAME_2_AT_MS = 200;
const FRAME_3_AT_MS = 800;
const FRAME_4_AT_MS = 1400;
const FADE_OUT_AT_MS = 1600;
// CSS transition duration on .overlay - keep in sync with the module's `transition`.
const FADE_OUT_DURATION_MS = 250;

type FrameIndex = 1 | 2 | 3 | 4;

export const WorkflowLaunchOverlay: React.FC<WorkflowLaunchOverlayProps> = ({
  workflowName,
  totalSteps,
  onComplete,
}) => {
  const [frame, setFrame] = useState<FrameIndex>(1);
  const [fadingOut, setFadingOut] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const schedule = (delay: number, fn: () => void) => {
      const handle = setTimeout(fn, delay);
      timersRef.current.push(handle);
    };

    schedule(FRAME_2_AT_MS, () => setFrame(2));
    schedule(FRAME_3_AT_MS, () => setFrame(3));
    schedule(FRAME_4_AT_MS, () => setFrame(4));
    schedule(FADE_OUT_AT_MS, () => {
      setFadingOut(true);
      schedule(FADE_OUT_DURATION_MS, () => onComplete());
    });

    return () => {
      for (const handle of timersRef.current) clearTimeout(handle);
      timersRef.current = [];
    };
    // onComplete is intentionally omitted from deps - the sequence must fire
    // exactly once for the lifetime of the overlay, regardless of parent
    // re-renders that might pass a new function identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overlayClassName = `${styles.overlay} ${fadingOut ? styles.fadeOut : ''}`.trim();

  return (
    <div
      className={overlayClassName}
      data-testid='workflow-launch-overlay'
      data-frame={frame}
      role='status'
      aria-live='polite'
    >
      <div className={styles.panel}>
        <div className={styles.workflowName}>{workflowName}</div>
        {frame === 1 && <Frame1 />}
        {frame === 2 && <Frame2 totalSteps={totalSteps} />}
        {frame === 3 && <Frame3 />}
        {frame === 4 && <Frame4 />}
      </div>
    </div>
  );
};

const Frame1: React.FC = () => (
  <>
    <div className={styles.headline}>
      <Spin />
      <span>Preparing workflow…</span>
    </div>
    <div className={styles.frameBody}>
      <span className={styles.detail}>Fetching workflow body</span>
    </div>
  </>
);

const Frame2: React.FC<{ totalSteps: number }> = ({ totalSteps }) => (
  <>
    <div className={styles.headline}>
      <span className={styles.check}>✓</span>
      <span>Body loaded</span>
    </div>
    <div className={styles.frameBody}>
      <span className={styles.detail}>Parsing {totalSteps} steps</span>
    </div>
  </>
);

const Frame3: React.FC = () => (
  <>
    <div className={styles.headline}>
      <span className={styles.check}>✓</span>
      <span>Steps detected</span>
    </div>
    <div className={styles.frameBody}>
      <span className={styles.detail}>Composing directive</span>
    </div>
  </>
);

const Frame4: React.FC = () => (
  <>
    <div className={styles.headline}>
      <span className={styles.check}>✓</span>
      <span>Workflow active</span>
    </div>
    <div className={styles.frameBody}>
      <span className={styles.ready}>Ready when you are →</span>
    </div>
  </>
);

export default WorkflowLaunchOverlay;
