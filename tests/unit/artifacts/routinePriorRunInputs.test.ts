/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * P2-6, second half. Phase 1 fixed the morning report's OUTPUT path and missed
 * four INPUTS of the same shape.
 *
 * Four bundled routines feed the agent a PRIOR RUN'S OWN OUTPUT so the new run
 * can diff against it - the whole point of a recurring task:
 *
 *   weekly-competitor-watch.last_scan_path   ~/wayland/outbox/marketing/last-competitor-scan.md
 *   friday-weekly-review.prior_review_path   ~/wayland/outbox/ops/last-weekly-review.md
 *   month-end-review.prior_review_path       ~/wayland/outbox/ops/last-monthly-review.md
 *   monthly-investor-update.prior_update_path ~/wayland/outbox/investor-updates/last.md
 *
 * `~/wayland/outbox/` is under NO confinement root and nothing in the product
 * has ever written there, so every one of those reads resolves to a file that
 * cannot exist. The routine is not merely reading the wrong file - it is
 * structurally incapable of ever reading the right one, which is the headline
 * bug of this milestone ("a recurring task that compares against its own
 * history cannot work") wearing its input-side face.
 *
 * The existing Phase 1 suite waves these through: it classifies every `~/`
 * input as a "documented read" and only polices WRITE targets. That taxonomy
 * has a hole - a prior-run output is a read of something WE wrote, so its
 * location is our responsibility, not the user's. This suite closes it.
 *
 * The fix is a pure repoint into the task's own `artifacts/` series. Nothing
 * crosses the sandbox boundary, so no new permission is involved.
 */

const REPO_ROOT = path.resolve(__dirname, '../../..');
const ROUTINES = path.join(REPO_ROOT, 'src/process/resources/bundled-workflows/routines.json');

type Routine = { id: string; inputs?: Record<string, string> };

const routines = JSON.parse(readFileSync(ROUTINES, 'utf-8')) as Routine[];

/**
 * Inputs whose value is a PRIOR RUN'S OWN DELIVERABLE. Established by reading
 * each routine's description and the workflow it dispatches: every one of these
 * is handed to the agent as "here is what you produced last time, diff against
 * it". They are ours to place, so they must live in the workspace series.
 */
const PRIOR_RUN_INPUT_KEYS = new Set(['last_scan_path', 'prior_review_path', 'prior_update_path']);

/** The output space no code has ever written to, on either side of the sandbox. */
const UNREACHABLE_OUTBOX = '~/wayland/outbox';

describe('recurring routines can actually read their own history', () => {
  it('the corpus under test is the real one', () => {
    expect(routines.length).toBeGreaterThan(5);
    const priorRunInputs = routines.flatMap((routine) =>
      Object.keys(routine.inputs ?? {}).filter((key) => PRIOR_RUN_INPUT_KEYS.has(key))
    );
    // A known positive: this assertion is what proves the zero below is real
    // and not a mis-keyed scan finding nothing.
    expect(priorRunInputs.length).toBe(4);
  });

  it('no bundled routine reads a prior run from the unreachable outbox', () => {
    const offenders: string[] = [];
    for (const routine of routines) {
      for (const [key, value] of Object.entries(routine.inputs ?? {})) {
        if (value.includes(UNREACHABLE_OUTBOX)) offenders.push(`${routine.id}.${key} = ${value}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every prior-run input resolves inside the workspace artifacts/ series', () => {
    const offenders: string[] = [];
    for (const routine of routines) {
      for (const [key, value] of Object.entries(routine.inputs ?? {})) {
        if (!PRIOR_RUN_INPUT_KEYS.has(key)) continue;
        const segments = value.split('/').filter(Boolean);
        if (
          value.startsWith('~') ||
          path.isAbsolute(value) ||
          segments.some((segment) => segment.startsWith('.')) ||
          segments[0] !== 'artifacts'
        ) {
          offenders.push(`${routine.id}.${key} = ${value}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
