/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  path.join(process.cwd(), '.github/workflows/build-and-release.yml'),
  'utf8'
);

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
