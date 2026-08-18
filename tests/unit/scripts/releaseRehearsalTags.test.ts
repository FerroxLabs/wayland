/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(path.join(process.cwd(), '.github/workflows/build-and-release.yml'), 'utf8');

function jobCondition(job: string): string {
  const start = workflow.indexOf(`\n  ${job}:\n`);
  expect(start, `job ${job} not found`).toBeGreaterThan(-1);
  const body = workflow.slice(start, workflow.indexOf('\n    steps:', start));
  const at = body.indexOf('\n    if:');
  expect(at, `job ${job} has no if:`).toBeGreaterThan(-1);
  return body.slice(at, body.indexOf('\n    ', at + 8) === -1 ? undefined : undefined) ?? body.slice(at);
}

/**
 * Every acceptance job in this pipeline runs only on a tag, so before rehearsal
 * tags existed a defect in them could be found only by cutting a REAL release and
 * burning a two-hour six-platform matrix. Five separate release blockers
 * accumulated in that code precisely because nothing could execute it.
 *
 * A `-rehearsal-` tag must therefore run the whole chain and stop before
 * publishing. These assertions pin both halves of that contract.
 */
describe('release rehearsal tags', () => {
  it('never publishes a rehearsal tag to GitHub', () => {
    const condition = jobCondition('publish-release');
    expect(condition).toContain("!contains(github.ref, '-rehearsal-')");
    expect(condition).toContain("!contains(github.ref, '-dev-')");
  });

  it('never publishes a rehearsal tag to npm', () => {
    // npm is reached only through publish-release, so excluding it there is enough
    // - but only while that dependency holds.
    const npm = workflow.slice(workflow.indexOf('\n  publish-getwayland-npm:\n'));
    expect(npm).toContain('needs: [publish-release]');
    expect(npm).toMatch(/needs\.publish-release\.result == 'success'/);
  });

  it('still runs every acceptance job for a rehearsal tag', () => {
    // These jobs exclude `-dev-` only. A rehearsal tag contains no `-dev-`, so it
    // reaches all of them; adding a `-rehearsal-` exclusion here would silently
    // remove the ability to rehearse.
    for (const job of [
      'release',
      'release-smoke-gate',
      'release-smoke-gate-windows',
      'protected-platform-observations',
      'protected-updater-observations',
      'assemble-raw-release-acceptance',
    ]) {
      expect(jobCondition(job), `${job} must stay rehearsable`).not.toContain('-rehearsal-');
    }
  });

  it('keeps dev-branch auto tags out of the release path', () => {
    // create-tag pushes vX.Y.Z-dev-<sha> on every dev-branch build. Admitting those
    // would fire a second full build plus the entire acceptance matrix on every
    // dev push, and macOS runners are the pipeline's only bottleneck.
    expect(workflow).toContain('TAG_NAME="v${VERSION}-dev-${COMMIT_SHORT}"');
    for (const job of ['protected-platform-observations', 'protected-updater-observations']) {
      expect(jobCondition(job)).toContain("!contains(github.ref, '-dev-')");
    }
  });
});

/**
 * Every precondition asserted here is a blocker this pipeline has already hit, and
 * each was checkable in seconds but only surfaced hours into a six-platform matrix.
 */
describe('release preflight', () => {
  it('runs before anything is built', () => {
    expect(workflow).toContain('release-preflight:');
    const build = workflow.slice(workflow.indexOf('\n  build-pipeline:'));
    expect(build).toContain('needs: [release-preflight]');
  });

  it('asserts both observers are registered on the default branch', () => {
    // `gh workflow run <file>` resolves by filename against the DEFAULT branch, so
    // an observer absent from main 404s the dispatch mid-release.
    expect(workflow).toContain('protected-platform-package-observer.yml protected-updater-journey-observer.yml');
    expect(workflow).toContain('actions/workflows/$wf');
  });

  it('asserts the trust root pin still matches the protected verifier branch', () => {
    // A stale pin fails `gh attestation verify --signer-digest` for all six targets
    // at the very last step, after the whole matrix has been spent.
    expect(workflow).toContain('git/ref/heads/release-trust-v1');
    expect(workflow).toContain('every attestation would be rejected');
  });

  it('asserts the pinned engine release actually carries every required asset', () => {
    expect(workflow).toContain('DEFAULT_WCORE_VERSION');
    expect(workflow).toContain('is missing $asset');
  });

  it('lets dev-branch builds through even though preflight is tag-only', () => {
    const build = workflow.slice(workflow.indexOf('\n  build-pipeline:'));
    expect(build).toContain("needs.release-preflight.result == 'skipped'");
  });
});
