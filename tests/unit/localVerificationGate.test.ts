import { describe, expect, it } from 'vitest';

import localVerificationGate = require('../../scripts/localVerificationGate.js');

const { isLocalVerificationBuild } = localVerificationGate as {
  isLocalVerificationBuild: (env: Record<string, string | undefined>) => boolean;
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
});
