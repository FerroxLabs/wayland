import { describe, expect, it, vi } from 'vitest';

const {
  DARWIN_DEVELOPER_ID_REQUIREMENT,
  darwinSigningIdentifier,
  darwinDeveloperIdRequirementFor,
  resolveDarwinSigningIdentity,
  signDarwinStagedBinary,
  isDarwinDeveloperIdSigned,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require('../../scripts/signDarwinStagedBinary');

describe('darwin staged-binary signing', () => {
  it('pins the requirement to a Developer ID Application leaf, not merely our team', () => {
    // subject.OU alone also matches Apple Development and Mac Distribution
    // certificates from the same team, neither of which notarizes. The two
    // marker OIDs are what make this specifically Developer ID Application
    // issued under the Developer ID CA.
    expect(DARWIN_DEVELOPER_ID_REQUIREMENT).toContain('field.1.2.840.113635.100.6.2.6'); // Developer ID CA
    expect(DARWIN_DEVELOPER_ID_REQUIREMENT).toContain('field.1.2.840.113635.100.6.1.13'); // Developer ID Application
    expect(DARWIN_DEVELOPER_ID_REQUIREMENT).toContain('"PX6SP9GPWJ"');
  });

  it('starts the requirement with = so codesign parses it as text, not a file path', () => {
    // Without the '=' codesign exits 1 with "invalid requirement specification"
    // and fails closed on correctly signed binaries too.
    expect(DARWIN_DEVELOPER_ID_REQUIREMENT.startsWith('=')).toBe(true);
  });

  it('signs with the hardened runtime and a secure timestamp', () => {
    const execFileSync = vi.fn();
    signDarwinStagedBinary('/tmp/staged/wayland-core', { execFileSync, identity: 'Developer ID Application: X' });
    const [command, args] = execFileSync.mock.calls[0];
    expect(command).toBe('/usr/bin/codesign');
    // Apple checks all three during notarization.
    expect(args).toContain('--options');
    expect(args).toContain('runtime');
    expect(args).toContain('--timestamp');
    expect(args).toContain('--sign');
  });

  it('verifies the result satisfies the requirement before the caller digests it', () => {
    const calls: string[][] = [];
    const execFileSync = vi.fn((_cmd: string, args: string[]) => {
      calls.push(args);
      return '';
    });
    signDarwinStagedBinary('/tmp/staged/wayland-core', { execFileSync, identity: 'Developer ID Application: X' });
    // A signature that silently did not take would surface only at
    // notarization, long after the digest was pinned.
    expect(calls.some((args) => args.includes('--verify') && args.includes('-R'))).toBe(true);
  });

  it('refuses to treat ad-hoc as an identity', () => {
    // '-' is codesign's ad-hoc identity and is exactly the state Apple rejects.
    expect(resolveDarwinSigningIdentity({ WAYLAND_DARWIN_SIGN_IDENTITY: '-' })).toBeNull();
    expect(resolveDarwinSigningIdentity({ CSC_NAME: '   ' })).toBeNull();
    expect(resolveDarwinSigningIdentity({ CSC_NAME: 'Developer ID Application: Ferrox Labs, LLC' })).toBe(
      'Developer ID Application: Ferrox Labs, LLC'
    );
  });

  it('leaves the binary unsigned, and says so, when the build has no identity', () => {
    const execFileSync = vi.fn();
    expect(signDarwinStagedBinary('/tmp/staged/x', { execFileSync, identity: null })).toBe(false);
    expect(execFileSync).not.toHaveBeenCalled();
  });

  it('reports an unsatisfied requirement as not signed', () => {
    const execFileSync = vi.fn(() => {
      throw new Error('code failed to satisfy specified code requirement(s)');
    });
    expect(isDarwinDeveloperIdSigned('/tmp/staged/x', { execFileSync })).toBe(false);
  });

  it('binds the signature to the pinned upstream digest via the identifier', () => {
    const id = darwinSigningIdentifier('wayland-core', `sha256:${'a'.repeat(64)}`);
    expect(id).toBe(`wayland-core.${'a'.repeat(64)}`);
    const requirement = darwinDeveloperIdRequirementFor(id);
    // The identifier lives inside the signature, so it cannot be edited without
    // the signing key. This is what stops a different - or older, still validly
    // signed - binary being swapped in and the manifest rewritten to match.
    expect(requirement).toContain(`identifier "${id}"`);
    expect(requirement.startsWith('=')).toBe(true);
    expect(requirement).toContain('field.1.2.840.113635.100.6.1.13');
  });

  it('refuses to sign without a pinned upstream digest', () => {
    // Signing with no binding would produce a signature reusable on any binary.
    expect(() => darwinSigningIdentifier('wayland-core', '')).toThrow(/pinned upstream sha256/);
    expect(() => darwinSigningIdentifier('wayland-core', 'not-a-digest')).toThrow(/pinned upstream sha256/);
  });

  it('passes the identifier to codesign when signing', () => {
    const execFileSync = vi.fn();
    signDarwinStagedBinary('/tmp/staged/wayland-core', {
      execFileSync,
      identity: 'Developer ID Application: X',
      identifier: 'wayland-core.deadbeef',
    });
    const args = execFileSync.mock.calls[0][1] as string[];
    expect(args).toContain('--identifier');
    expect(args[args.indexOf('--identifier') + 1]).toBe('wayland-core.deadbeef');
  });
});
