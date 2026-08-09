/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * The empty state a workbench section shows before it has anything to report.
 *
 * Two rules it exists to enforce.
 *
 * First, an empty lane should look DELIBERATE rather than broken. A bare line of
 * grey text reads as a failure to load; a faded illustration above a plain
 * sentence reads as "nothing yet, and that is fine". The glyph is drawn inline
 * from `currentColor` at low opacity rather than shipped as an asset, so it
 * inherits the theme in both light and dark and cannot 404 behind the CSP.
 *
 * Second, the caption says what WILL appear here, not that nothing is here. "No
 * data" tells the user only that they failed; "Steps appear here as the run
 * works through them" tells them what this part of the window is for.
 */
const GLYPHS = {
  /** Stacked sheets - progress, plans, step lists. */
  steps: (
    <>
      <rect x='9' y='7' width='26' height='32' rx='3' />
      <path d='M15 16h14M15 23h14M15 30h9' />
    </>
  ),
  /** An open folder - files and working directories. */
  files: (
    <>
      <path d='M6 34V12a2 2 0 0 1 2-2h9l4 5h13a2 2 0 0 1 2 2v17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z' />
      <path d='M6 20h32' />
    </>
  ),
  /** Overlapping cards - tools, context, references. */
  context: (
    <>
      <rect x='6' y='12' width='20' height='24' rx='3' />
      <rect x='20' y='8' width='20' height='24' rx='3' />
    </>
  ),
} as const;

export type WorkbenchEmptyGlyph = keyof typeof GLYPHS;

const WorkbenchEmptyState: React.FC<{
  /** One sentence naming what will appear here once the run produces it. */
  caption: string;
  glyph?: WorkbenchEmptyGlyph;
  testId?: string;
}> = ({ caption, glyph = 'steps', testId }) => (
  <div
    className='flex flex-col items-center justify-center text-center gap-8px py-20px px-12px'
    data-testid={testId}
    data-empty-glyph={glyph}
  >
    <svg
      width='46'
      height='46'
      viewBox='0 0 46 46'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      // Faded well back: decoration that sets a mood, never something competing
      // with the caption for the eye.
      className='text-t-tertiary opacity-30'
      aria-hidden='true'
      focusable='false'
    >
      {GLYPHS[glyph]}
    </svg>
    <p className='m-0 text-12px leading-relaxed text-t-tertiary max-w-220px'>{caption}</p>
  </div>
);

export default WorkbenchEmptyState;
