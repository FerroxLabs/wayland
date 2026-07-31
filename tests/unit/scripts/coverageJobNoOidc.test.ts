/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

/**
 * The Coverage Test job asked GitHub for an OIDC token it could never be given.
 *
 * `use_oidc: ${{ secrets.CODECOV_TOKEN == '' }}` evaluated true (no such secret
 * exists), codecov-action's nested `actions/github-script` step called
 * `core.getIDToken()`, and the runner had no `ACTIONS_ID_TOKEN_REQUEST_URL`
 * because the workflow's permissions block grants no `id-token`. The throw
 * happens before the Codecov CLI runs, so `fail_ci_if_error: false` — which
 * governs only the upload phase — cannot catch it, and the job goes red on a
 * run whose coverage suite passed.
 *
 * The fix is to stop asking. It must NOT be to grant the permission: this job
 * runs PR-authored code (`bun install`, `postinstall`, `bun run test:coverage`),
 * and `trustRootJobSeparation.test.ts` already pins the invariant that jobs
 * running the test suite must not hold `id-token`.
 */

const WORKFLOW = join(__dirname, '../../../.github/workflows/pr-checks.yml');

type Step = { name?: string; uses?: string; with?: Record<string, unknown> };
type Job = { steps?: Step[]; permissions?: Record<string, unknown> };

function coverageJob(): Job {
  const workflow = parse(readFileSync(WORKFLOW, 'utf8')) as { jobs: Record<string, Job> };
  const job = workflow.jobs['coverage-tests'];
  expect(job, 'coverage-tests job must exist in pr-checks.yml').toBeDefined();
  return job;
}

function codecovStep(job: Job): Step {
  const step = (job.steps ?? []).find((s) => (s.uses ?? '').startsWith('codecov/codecov-action'));
  // Asserted before use so a renamed/removed step fails legibly rather than
  // throwing a TypeError on the next line.
  expect(step, 'coverage-tests must still upload via codecov/codecov-action').toBeDefined();
  return step as Step;
}

describe('coverage job never requests an OIDC token', () => {
  it('the Codecov step sets no use_oidc', () => {
    // Negative control: fails on the pre-fix file, which carried
    // `use_oidc: ${{ secrets.CODECOV_TOKEN == '' }}`.
    expect(Object.hasOwn(codecovStep(coverageJob()).with ?? {}, 'use_oidc')).toBe(false);
  });

  it('the job holds no id-token permission', () => {
    // Forward guard, NOT a negative control — this also passes on the unfixed
    // file. It exists so that "just add the permission" cannot quietly become
    // the fix later: that would hand any PR author an OIDC token asserting this
    // repository's identity.
    const job = coverageJob();
    expect(Object.hasOwn(job.permissions ?? {}, 'id-token')).toBe(false);
  });
});
