/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { assembleCanonicalRawAcceptance: assemble } = require(
  '../../../scripts/release-acceptance/assembleCanonicalRawAcceptance.js'
) as {
  assembleCanonicalRawAcceptance: (
    artifactsDirectory: string,
    candidate: unknown,
    outputDirectory: string
  ) => unknown;
};

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

const COMMIT = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
const TARGET = 'darwin-arm64';
const SMOKE_NAME = `platform-package-smoke-${TARGET}.json`;
const INSTALLER_NAME = 'Wayland-9.9.9-mac-arm64.dmg';

function smokeReport() {
  return JSON.stringify({
    contract: 'wayland-platform-package-smoke/2',
    target: TARGET,
    sourceIdentity: { commit: COMMIT, tree: TREE },
  });
}

/**
 * The producer's `assemble` job downloads EVERY artifact in the run into one
 * directory, and three of them carry an identical `platform-package-smoke-<target>.json`:
 * the build artifact (`_build-reusable.yml` uploads `out/platform-package-smoke-*.json`),
 * the protected platform observation bundle, and the protected updater observation
 * bundle (which byte-binds its own copy, so it cannot be removed).
 *
 * The smoke lookup used to search all of them and died `count-3` on every target,
 * which would have blocked the release the FIRST time this job ran - with or
 * without the observers being green. Nothing caught it because this file had no
 * tests at all.
 */
function buildArtifactTree() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'wl-assemble-'));
  roots.push(root);

  // 1. the authoritative copy, inside the protected platform observation bundle
  const protectedRoot = path.join(root, 'protected-platform-observations', TARGET);
  mkdirSync(protectedRoot, { recursive: true });
  writeFileSync(
    path.join(protectedRoot, `protected-platform-observation-${TARGET}.json`),
    JSON.stringify({
      contract: 'wayland-protected-platform-package-observation/1.0',
      target: TARGET,
      candidate: { commit: COMMIT, tree: TREE },
      report: { fileName: SMOKE_NAME },
      installer: { fileName: INSTALLER_NAME },
    })
  );
  writeFileSync(path.join(protectedRoot, SMOKE_NAME), smokeReport());
  writeFileSync(path.join(protectedRoot, INSTALLER_NAME), 'installer-bytes');

  // 2. the build artifact's own copy
  const buildRoot = path.join(root, 'macos-build-arm64');
  mkdirSync(buildRoot, { recursive: true });
  writeFileSync(path.join(buildRoot, SMOKE_NAME), smokeReport());

  // 3. the updater observation bundle's byte-bound copy
  const updaterRoot = path.join(root, 'protected-updater-observations', TARGET);
  mkdirSync(updaterRoot, { recursive: true });
  writeFileSync(path.join(updaterRoot, SMOKE_NAME), smokeReport());

  return root;
}

describe('assembleCanonicalRawAcceptance smoke resolution', () => {
  it('resolves the protected smoke report even with three identical copies present', () => {
    const artifacts = buildArtifactTree();
    const out = path.join(artifacts, 'out');
    let error: Error | undefined;
    try {
      assemble(artifacts, { commit: COMMIT, tree: TREE }, out);
    } catch (thrown) {
      error = thrown as Error;
    }
    expect(error).toBeDefined();
    // It must NOT die on the ambiguous smoke lookup. The tree is deliberately
    // incomplete, so it is expected to fail LATER - at the updater observation
    // stage, which only runs once the platform smoke and installer have both
    // resolved for this target. Reaching that code is the proof.
    expect(error?.message).not.toMatch(/count-3/);
    expect(error?.message).not.toMatch(/M8I_PLATFORM_SMOKE_INVALID/);
    expect(error?.message).toMatch(/^M8I_UPDATER_OBSERVATION_INVALID:darwin-arm64/);
  });
});
