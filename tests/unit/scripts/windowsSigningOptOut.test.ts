/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * `build-matrix.yml` had never once completed a Windows build. Not slowness:
 * it holds no Azure credentials, and electron-builder's Azure Trusted Signing
 * falls through to an INTERACTIVE credential flow when they are absent, so every
 * Windows target sat silent for 107 minutes at "signing with Azure Trusted
 * Signing" - AFTER writing its output - until the job timeout killed it and
 * reported CANCELLED, which reds out identically to a real failure.
 *
 * Verification builds may therefore opt out of Windows signing. The danger is
 * the opt-out leaking onto the release path and quietly shipping an unsigned
 * installer, so it is guarded twice: refused at runtime on the two refs
 * `build-and-release.yml` fires on, and pinned here as absent from every release
 * workflow.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// `build-with-builder.js` is CommonJS and uses a top-level `return` inside its
// `require.main !== module` guard, which vitest's ESM transform cannot parse -
// which is why every other test in the repo reads it as text. createRequire
// loads it the way node does, so this can assert BEHAVIOUR instead of matching
// source strings.
const requireCjs = createRequire(import.meta.url);
const { resolveWindowsSigningOptOut } = requireCjs(
  path.resolve(__dirname, '../../../scripts/build-with-builder.js')
) as { resolveWindowsSigningOptOut: (env?: NodeJS.ProcessEnv) => boolean };

const WORKFLOWS = path.resolve(__dirname, '../../../.github/workflows');
const FLAG = 'WAYLAND_SKIP_WINDOWS_SIGNING';
const read = (file: string) => readFileSync(path.join(WORKFLOWS, file), 'utf-8');

describe('windows signing opt-out is a verification-only escape hatch', () => {
  it('is off unless explicitly set to 1', () => {
    expect(resolveWindowsSigningOptOut({})).toBe(false);
    expect(resolveWindowsSigningOptOut({ [FLAG]: '0' })).toBe(false);
    expect(resolveWindowsSigningOptOut({ [FLAG]: 'true' })).toBe(false);
    // Known positive, or every assertion below would pass vacuously.
    expect(resolveWindowsSigningOptOut({ [FLAG]: '1' })).toBe(true);
  });

  it('REFUSES a tag build, which is what publishes', () => {
    expect(() => resolveWindowsSigningOptOut({ [FLAG]: '1', GITHUB_REF: 'refs/tags/v0.12.1' })).toThrow(
      /Refusing to produce an unsigned Windows artifact/
    );
  });

  it('REFUSES a dev build, the other ref build-and-release fires on', () => {
    expect(() => resolveWindowsSigningOptOut({ [FLAG]: '1', GITHUB_REF: 'refs/heads/dev' })).toThrow(
      /Refusing to produce an unsigned Windows artifact/
    );
  });

  it('allows an ordinary branch or dispatch build', () => {
    expect(resolveWindowsSigningOptOut({ [FLAG]: '1', GITHUB_REF: 'refs/heads/main' })).toBe(true);
    expect(resolveWindowsSigningOptOut({ [FLAG]: '1', GITHUB_REF: '' })).toBe(true);
  });

  it('is set ONLY in the verification gate, never in a release workflow', () => {
    // The runtime refusal above is the second line of defence. This is the first:
    // the flag must not reach a release workflow's environment at all.
    expect(read('build-matrix.yml')).toContain(FLAG);
    for (const file of ['_build-reusable.yml', 'build-and-release.yml', 'publish-npm.yml']) {
      expect(read(file)).not.toContain(FLAG);
    }
  });

  it('leaves the release path asserting that Windows signing IS configured', () => {
    // Guards the other direction: the release must still refuse to ship unsigned.
    expect(read('_build-reusable.yml')).toContain('AZURE_CLIENT_SECRET');
    expect(read('_build-reusable.yml')).toContain('Windows signing not configured');
  });
});
