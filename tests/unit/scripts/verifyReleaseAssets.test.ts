/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #989: verify-release-assets.sh must assert the COMPLETE expected artifact set.
 *
 * The verifier previously checked a hand-picked subset (.exe/.dmg/.deb) and had
 * no zip expectation at all, so the Windows portable zip could vanish and the
 * gate still exited 0 - which is why #941 shipped unnoticed for several
 * releases. These tests drive the real fixture pipeline
 * (create-mock -> prepare -> verify) and assert the gate FAILS on the absence of
 * every declared artifact class, one at a time. A gate that cannot fail is the
 * defect, so the negative cases are the point of this file.
 *
 * The build half of that pipeline (create-mock -> prepare) is deterministic and
 * identical for every case, so it runs ONCE in beforeAll and each case mutates a
 * plain filesystem copy of its output. Running it per case cost ~1.9s per case on
 * Windows (vs ~0.2s on macOS) because each Git-Bash script forks dozens of msys
 * binaries; with the 10s default testTimeout and spawnSync blocking the event
 * loop so vitest cannot preempt it, one contended case on a windows-2022 shard
 * overran and reported "Test timed out in 10000ms". Only the assertion subject -
 * verify-release-assets.sh itself - is still spawned per case.
 */

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cpSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const VERSION = '1.0.0';
const roots: string[] = [];

/**
 * Every case spawns verify-release-assets.sh through spawnSync, which blocks the
 * event loop: vitest cannot preempt it, so a stalled spawn overruns whatever the
 * cap is and only reports afterwards. The default 10s left too little room on a
 * contended windows-2022 shard. Matches the explicit budget other subprocess
 * suites in this repo use.
 */
const SPAWN_TIMEOUT_MS = 30_000;

function run(script: string, args: string[]) {
  return spawnSync('bash', [script, ...args], { cwd: process.cwd(), encoding: 'utf8' });
}

/**
 * The one real run of the build pipeline. Every case reads or copies this; if the
 * pipeline itself breaks, beforeAll fails and no case can report a false pass.
 */
let pipelineRoot: string;
let pipelineOutput: string;

beforeAll(() => {
  pipelineRoot = mkdtempSync(path.join(os.tmpdir(), 'wayland-verify-assets-src-'));
  const input = path.join(pipelineRoot, 'build-artifacts');
  pipelineOutput = path.join(pipelineRoot, 'release-assets');

  const mock = run('scripts/create-mock-release-artifacts.sh', [input, VERSION]);
  expect(mock.status, `${mock.stdout}\n${mock.stderr}`).toBe(0);

  const prepared = run('scripts/prepare-release-assets.sh', [input, pipelineOutput]);
  expect(prepared.status, `${prepared.stdout}\n${prepared.stderr}`).toBe(0);
}, 60_000);

afterAll(() => {
  rmSync(pipelineRoot, { recursive: true, force: true });
});

/**
 * A private, complete copy of what the real release scripts produced, for cases
 * that delete or rewrite an entry. Byte-identical to the pipeline output.
 */
function preparedAssets(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'wayland-verify-assets-'));
  roots.push(root);
  const output = path.join(root, 'release-assets');
  cpSync(pipelineOutput, output, { recursive: true });
  return output;
}

function verify(output: string) {
  return run('scripts/verify-release-assets.sh', [output]);
}

/**
 * Every artifact the release is supposed to produce. Deliberately spelled out
 * rather than imported from the script: if someone deletes an expectation from
 * verify-release-assets.sh, this list still demands the gate fail on it.
 */
const EXPECTED_ARTIFACTS = [
  `Wayland-${VERSION}-win-x64.exe`,
  `Wayland-${VERSION}-win-x64.exe.blockmap`,
  `Wayland-${VERSION}-win-arm64.exe`,
  `Wayland-${VERSION}-win-arm64.exe.blockmap`,
  `Wayland-${VERSION}-win-x64.zip`,
  `Wayland-${VERSION}-win-arm64.zip`,
  `Wayland-${VERSION}-mac-x64.dmg`,
  `Wayland-${VERSION}-mac-x64.dmg.blockmap`,
  `Wayland-${VERSION}-mac-arm64.dmg`,
  `Wayland-${VERSION}-mac-arm64.dmg.blockmap`,
  `Wayland-${VERSION}-mac-x64.zip`,
  `Wayland-${VERSION}-mac-x64.zip.blockmap`,
  `Wayland-${VERSION}-mac-arm64.zip`,
  `Wayland-${VERSION}-mac-arm64.zip.blockmap`,
  `Wayland-${VERSION}-linux-x86_64.AppImage`,
  `Wayland-${VERSION}-linux-arm64.AppImage`,
  `Wayland-${VERSION}-linux-amd64.deb`,
  `Wayland-${VERSION}-linux-arm64.deb`,
  `Wayland-${VERSION}-linux-x86_64.rpm`,
  `Wayland-${VERSION}-linux-aarch64.rpm`,
];

const EXPECTED_METADATA = [
  ['latest.yml', 'missing canonical metadata'],
  ['latest-mac.yml', 'missing canonical metadata'],
  ['latest-linux.yml', 'missing canonical metadata'],
  ['latest-linux-arm64.yml', 'missing canonical metadata'],
  ['latest-win-arm64.yml', 'missing arch-specific updater metadata'],
  ['latest-arm64-mac.yml', 'missing arch-specific updater metadata'],
] as const;

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('verify-release-assets expected-set completeness', () => {
  it(
    'passes on the complete artifact set the mock pipeline produces',
    () => {
      // Deliberately the pipeline output itself, not a copy: this is the case that
      // proves the real scripts produce the complete declared set.
      const result = verify(pipelineOutput);
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(result.stdout).toContain('ALL CHECKS PASSED');
    },
    SPAWN_TIMEOUT_MS
  );

  it.each(EXPECTED_ARTIFACTS)(
    'fails closed when %s is absent',
    (artifact) => {
      const output = preparedAssets();
      unlinkSync(path.join(output, artifact));

      const result = verify(output);
      expect(result.status, `expected a non-zero exit, got:\n${result.stdout}`).toBe(1);
      expect(result.stdout).toContain(`FAIL: missing release artifact: ${artifact}`);
    },
    SPAWN_TIMEOUT_MS
  );

  it.each(EXPECTED_METADATA)(
    'fails closed when %s is absent',
    (metadata, message) => {
      const output = preparedAssets();
      unlinkSync(path.join(output, metadata));

      const result = verify(output);
      expect(result.status, `expected a non-zero exit, got:\n${result.stdout}`).toBe(1);
      expect(result.stdout).toContain(`FAIL: ${message}: ${metadata}`);
    },
    SPAWN_TIMEOUT_MS
  );

  /**
   * The version drives every expected filename, so an unresolvable version must
   * fail loudly rather than silently expand to a set of names nothing matches.
   */
  it(
    'fails closed when the release version cannot be resolved',
    () => {
      const output = preparedAssets();
      // Keep the feed present and pointing at a real file so the metadata checks
      // still pass - only the version: line, which the expected set is derived
      // from, is gone.
      writeFileSync(
        path.join(output, 'latest.yml'),
        `path: Wayland-${VERSION}-win-x64.exe\nsha512: fake\nreleaseDate: '2025-01-01'\n`
      );

      const result = verify(output);
      expect(result.status, `expected a non-zero exit, got:\n${result.stdout}`).toBe(1);
      expect(result.stdout).toContain('FAIL: cannot resolve release version');
    },
    SPAWN_TIMEOUT_MS
  );
});
