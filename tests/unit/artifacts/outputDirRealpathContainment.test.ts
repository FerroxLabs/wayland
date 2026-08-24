/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * `resolveOutputDir` IS THE SINGLE PRODUCER OF A HOST-BLESSED WRITE DESTINATION,
 * AND IT COMPARED TWO DIFFERENT SPELLINGS OF THE SAME DIRECTORY.
 *
 * `WCoreAgent.start` runs the non-raw spawn under `withWCoreProjectConfigLease`,
 * which hands it a REALPATHED workspace (`index.ts:520`), and that value reaches
 * `resolveOutputDir` at `:637`. The run's staging directory arrives from
 * `runOutputDir.ts:64`, which stores only `path.resolve(outputDir)` built from
 * the LEXICAL workspace. On macOS `~/.wayland` really is a symlink
 * (`-> ~/Library/Application Support/Wayland/wayland`), so every managed
 * `wcore-temp-*` workspace has two spellings.
 *
 * The containment check was lexical, so the two spellings read as "the staging
 * directory is outside the workspace" and it silently fell through to the CHAT
 * namespace: the scheduled run's deliverable written into `artifacts/chat/<id>`,
 * never staged, never published, and `commitTaskRun` reporting `no-output`.
 *
 * The fixture is a real diverging directory built by the filesystem - a
 * symlink (macOS/Linux) or a directory junction (Windows) planted by the test
 * itself, not by string surgery and not by hoping the host ships a symlinked
 * `/var`.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import { resolveOutputDir } from '@process/agent/wcore/envBuilder';

const cleanup: string[] = [];

afterEach(() => {
  for (const dir of cleanup.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

/**
 * A link to a directory that `realpathSync` resolves, on every platform this
 * ships to: a symlink on macOS/Linux, a DIRECTORY JUNCTION on Windows. Node
 * ignores `type` off win32, and `'junction'` is the one reparse point Windows
 * creates without Developer Mode or elevation - a plain `'dir'` symlink there
 * needs a privilege CI does not have.
 */
function linkDir(target: string, linkPath: string): void {
  fs.symlinkSync(target, linkPath, 'junction');
}

/**
 * A temp workspace whose lexical and physical spellings genuinely differ.
 *
 * THE DIVERGENCE IS MANUFACTURED HERE, NOT BORROWED FROM THE OS. It used to be
 * `mkdtemp` alone and rely on `/var -> /private/var`, which exists on macOS and
 * NOWHERE ELSE: on Linux `/tmp` is a real directory and on Windows
 * `realpathSync` does not expand 8.3 short names, so `real === raw`, the
 * precondition failed, and this containment guard measured NOTHING on two of
 * the three platforms it ships to. Planting our own link makes the two
 * spellings a property of the fixture instead of a property of the host.
 */
function divergingWorkspace(): { raw: string; real: string; staging: string } {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-div-'));
  cleanup.push(base);
  const physical = path.join(base, 'workspace');
  fs.mkdirSync(physical, { recursive: true });
  const raw = path.join(base, 'workspace-link');
  linkDir(physical, raw);
  const real = fs.realpathSync(raw);
  const staging = path.join(raw, 'artifacts', 'market', '.staging', 'run-1');
  fs.mkdirSync(staging, { recursive: true });
  return { raw, real, staging };
}

describe('resolveOutputDir containment survives a realpath/lexical divergence', () => {
  it('keeps the staging directory when the workspace arrives realpathed', () => {
    const { raw, real, staging } = divergingWorkspace();
    // The precondition. The fixture builds the divergence itself, so this now
    // holds on macOS, Linux and Windows alike - but it is still asserted,
    // because a guard that quietly stops diverging is a guard that stops
    // measuring.
    expect(real).not.toBe(raw);

    expect(resolveOutputDir(real, staging, 'conv1')).toBe(staging);
  });

  it('keeps it in the other direction too - realpathed staging, lexical workspace', () => {
    const { raw, real, staging } = divergingWorkspace();
    expect(real).not.toBe(raw);
    const realStaging = fs.realpathSync(staging);
    expect(realStaging).not.toBe(staging);

    expect(resolveOutputDir(raw, realStaging, 'conv1')).toBe(realStaging);
  });

  it('KNOWN-POSITIVE CONTROL: a non-diverging workspace is unaffected', () => {
    // The durable task workspace in Documents is its own realpath, which is why
    // this divergence is NOT what broke the morning report. Same shape here.
    const { real } = divergingWorkspace();
    const staging = path.join(real, 'artifacts', 'market', '.staging', 'run-2');
    fs.mkdirSync(staging, { recursive: true });
    expect(resolveOutputDir(real, staging, 'conv1')).toBe(staging);
  });

  it('KNOWN-NEGATIVE CONTROL: a genuinely outside directory is still refused', () => {
    const { real } = divergingWorkspace();
    const outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wl-outside-')));
    cleanup.push(outside);
    expect(resolveOutputDir(real, outside, 'conv1')).toBe(path.join(real, 'artifacts', 'chat', 'conv1'));
  });

  it('KNOWN-NEGATIVE CONTROL: a symlink planted inside the workspace pointing out is refused', () => {
    // The lexical check PASSED this: `path.relative` sees a child path and never
    // looks at what it is. Realpathing both sides is strictly narrower.
    const { real } = divergingWorkspace();
    const outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wl-escape-')));
    cleanup.push(outside);
    const trap = path.join(real, 'artifacts', 'escape');
    fs.mkdirSync(path.dirname(trap), { recursive: true });
    linkDir(outside, trap);

    expect(resolveOutputDir(real, trap, 'conv1')).toBe(path.join(real, 'artifacts', 'chat', 'conv1'));
  });

  it('a directory that does not exist yet is still contained lexically', () => {
    // `resolveOutputDir` is called before the run's directory necessarily
    // exists, so realpath has to degrade to the old comparison rather than
    // start refusing every not-yet-created destination.
    const { real } = divergingWorkspace();
    const future = path.join(real, 'artifacts', 'market', '.staging', 'not-created-yet');
    expect(fs.existsSync(future)).toBe(false);
    expect(resolveOutputDir(real, future, 'conv1')).toBe(future);
  });
});
