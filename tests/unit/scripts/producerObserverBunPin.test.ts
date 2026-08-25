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
 * THE PRODUCER AND THE OBSERVERS MUST INSTALL WITH THE SAME BUN.
 *
 * The tree that SHIPS as `resources/whatsapp-bridge` is built by
 * `prepareWhatsAppBridgeResources` in scripts/build-with-builder.js. It deletes
 * the bridge's node_modules and reinstalls it clean with `bun install
 * --frozen-lockfile --os <platform> --cpu <arch>`, running whatever `bun` the
 * build job put on PATH - so this pin is what decides those bytes. (The root
 * postinstall also installs the bridge, but that tree is discarded first; do not
 * mistake one for the other.) The protected observers then run their OWN
 * `bun install` and require the two inventories to be byte-identical -
 * `verifySourceMirror` in verify-packaged-resources.js. That is the whole point
 * of an independent observer: it re-derives the tree rather than trusting it.
 *
 * Byte equality only survives if both sides run the same bun, because bun's
 * output is not stable ACROSS versions. Measured on windows-2022 against this
 * exact lockfile: two 1.3.14 installs are byte-identical, while 1.3.14 vs 1.4.0
 * differ in exactly 16 files - every one a `node_modules/.bin/*.exe` launcher
 * stub, 15872 bytes against 8192 - with nothing added or removed.
 *
 * WHY THIS IS INVISIBLE UNTIL IT REACHES WINDOWS. On macOS and Linux bun writes
 * `.bin` entries as SYMLINKS, and `sourceInventory` records a symlink as
 * `link:<relative>:<target>` - a name and a target, no bytes. On Windows there
 * are no symlinks; bun writes real `.exe` stubs, which are hashed. So a bun
 * version skew cannot fail a POSIX leg and always fails BOTH Windows legs.
 *
 * WHAT THIS GUARDS. `bun-version: latest` in the build job is what broke
 * v0.12.2: it resolved to 1.3.14 on 2026-08-19 and all six observer legs passed,
 * then to 1.4.0 on 2026-08-24 and both Windows legs failed on a tree that had
 * not changed. Nothing in the repository moved - the toolchain did. A floating
 * version is therefore not a convenience here, it is a live release blocker, and
 * reverting this pin re-arms it. Bumping bun is still fine; it just has to be
 * done on the producer and BOTH observers together, which is exactly what this
 * test forces.
 */

const WORKFLOWS = join(__dirname, '../../../.github/workflows');

type Step = { uses?: string; with?: Record<string, unknown> };
type Job = { steps?: Step[] };

function bunVersion(file: string, jobName: string): string {
  const workflow = parse(readFileSync(join(WORKFLOWS, file), 'utf8')) as { jobs: Record<string, Job> };
  const job = workflow.jobs[jobName];
  expect(job, `${jobName} job must exist in ${file}`).toBeDefined();
  const steps = (job.steps ?? []).filter((step) => step.uses?.startsWith('oven-sh/setup-bun@'));
  // Exactly one: a second setup-bun step would silently decide the version by
  // order, and this guard would then be reading the wrong one.
  expect(steps, `${file}:${jobName} must set bun up exactly once`).toHaveLength(1);
  const version = steps[0].with?.['bun-version'];
  expect(typeof version, `${file}:${jobName} must declare bun-version`).toBe('string');
  return String(version);
}

describe('producer and observer bun pin', () => {
  const producer = () => bunVersion('_build-reusable.yml', 'build');

  it('pins the artifact-producing build job to an exact bun version', () => {
    const version = producer();
    expect(version).not.toBe('latest');
    // `1.3` is a floating minor and drifts exactly like `latest`, one patch at a time.
    expect(version, 'bun-version must be an exact x.y.z pin').toMatch(/^\d+\.\d+\.\d+$/);
  });

  it.each([
    ['protected-platform-package-observer.yml', 'observe'],
    ['protected-updater-journey-observer.yml', 'observe'],
  ])('installs with the same bun as %s', (file, jobName) => {
    expect(bunVersion(file, jobName)).toBe(producer());
  });
});
