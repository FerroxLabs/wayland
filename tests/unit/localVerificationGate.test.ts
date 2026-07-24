import { describe, expect, it } from 'vitest';

import localVerificationGate = require('../../scripts/localVerificationGate.js');

const { isLocalVerificationBuild, isLocalVerificationDirBuild } = localVerificationGate as {
  isLocalVerificationBuild: (env: Record<string, string | undefined>) => boolean;
  isLocalVerificationDirBuild: (env: Record<string, string | undefined>, argv: string[]) => boolean;
};

// This encodes the core release-safety invariant: the capability seal is written
// (the RELEASE path) unless the operator explicitly opts into a local verification
// build with the exact string '1'. Any other value — unset, '0', 'true' — keeps
// the release path so a stray truthy env value can never silently skip the seal.
describe('isLocalVerificationBuild', () => {
  it('returns false when the flag is unset (RELEASE path — seal written)', () => {
    expect(isLocalVerificationBuild({})).toBe(false);
  });

  it('returns false when the flag is explicitly undefined (RELEASE path)', () => {
    expect(isLocalVerificationBuild({ WAYLAND_LOCAL_VERIFICATION: undefined })).toBe(false);
  });

  it("returns true only for the exact string '1' (seal SKIPPED)", () => {
    expect(isLocalVerificationBuild({ WAYLAND_LOCAL_VERIFICATION: '1' })).toBe(true);
  });

  it("returns false for '0' (default-OFF: any non-'1' keeps the release path)", () => {
    expect(isLocalVerificationBuild({ WAYLAND_LOCAL_VERIFICATION: '0' })).toBe(false);
  });

  it("returns false for 'true' (only the exact string '1' flips it)", () => {
    expect(isLocalVerificationBuild({ WAYLAND_LOCAL_VERIFICATION: 'true' })).toBe(false);
  });

  // No coercion: process.env only ever yields strings/undefined, but pin the strict
  // equality so a refactor can't loosen it into a truthy check.
  it('returns false for coercion look-alikes (numeric 1, whitespace, truthy objects)', () => {
    expect(isLocalVerificationBuild({ WAYLAND_LOCAL_VERIFICATION: 1 as unknown as string })).toBe(false);
    expect(isLocalVerificationBuild({ WAYLAND_LOCAL_VERIFICATION: ' 1 ' })).toBe(false);
    expect(isLocalVerificationBuild({ WAYLAND_LOCAL_VERIFICATION: {} as unknown as string })).toBe(false);
  });

  it('returns false for a null/undefined env object (fails safe to the RELEASE path)', () => {
    expect(isLocalVerificationBuild(undefined as unknown as Record<string, string | undefined>)).toBe(false);
  });
});

// The seal-skip is bound to BOTH the exact flag AND `--dir`, so a leaked env var can
// never deseal a distributable (dmg/zip/nsis) build — only an explicitly-local
// unpacked `--dir` build.
describe('isLocalVerificationDirBuild', () => {
  const ON = { WAYLAND_LOCAL_VERIFICATION: '1' };

  it("returns true only with the flag AND '--dir'", () => {
    expect(isLocalVerificationDirBuild(ON, ['auto', '--mac', '--dir'])).toBe(true);
  });

  it('returns false with the flag but NO --dir (a distributable build still seals)', () => {
    expect(isLocalVerificationDirBuild(ON, ['auto', '--mac'])).toBe(false);
  });

  it('returns false with --dir but the flag OFF (release path)', () => {
    expect(isLocalVerificationDirBuild({}, ['auto', '--mac', '--dir'])).toBe(false);
  });

  it('returns false when argv is missing or not an array', () => {
    expect(isLocalVerificationDirBuild(ON, undefined as unknown as string[])).toBe(false);
  });
});
