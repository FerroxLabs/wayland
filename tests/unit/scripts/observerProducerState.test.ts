/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const OBSERVERS = [
  '.github/workflows/protected-platform-package-observer.yml',
  '.github/workflows/protected-updater-journey-observer.yml',
];

/**
 * The producer dispatches these observers and then WAITS on them, so while an observer
 * runs the producer is in flight by definition. GitHub reports that as queued, waiting,
 * pending or requested as well as in_progress, depending on whether the producer's
 * remaining jobs have runners yet.
 *
 * The original guard admitted only in_progress, which made these gates a race. Measured
 * on run 32153073848: three of six platform legs and five of six updater legs failed with
 * "not an admissible exact build state: queued:null", while the legs that happened to
 * start during an in_progress window passed. Nothing about the candidate was wrong.
 */
describe('observer producer-state admissibility', () => {
  it.each(OBSERVERS)('%s no longer admits only in_progress', (file) => {
    const text = readFileSync(path.join(process.cwd(), file), 'utf8');
    expect(text).not.toContain('in_progress:null|completed:success');
  });

  it.each(OBSERVERS)('%s rejects a producer that concluded anything but success', (file) => {
    const text = readFileSync(path.join(process.cwd(), file), 'utf8');
    // The security property: never observe a producer that has already concluded
    // unsuccessfully. That must survive the widening above.
    expect(text).toContain('"$producer_status" == "completed" && "$producer_conclusion" != "success"');
    expect(text).toContain('refusing to observe it');
  });

  it.each(OBSERVERS)('%s rejects a conclusion reported while still in flight', (file) => {
    const text = readFileSync(path.join(process.cwd(), file), 'utf8');
    expect(text).toContain('"$producer_status" != "completed" && "$producer_conclusion" != "null"');
  });
});
