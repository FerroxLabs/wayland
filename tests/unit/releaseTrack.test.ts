import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import {
  getPackagedExecutableName,
  getPackagedReleaseIdentity,
  getReleaseProtocolScheme,
  getReleaseUpdateChannel,
  parseReleaseTrack,
} from '@/common/releaseTrack';

const require = createRequire(import.meta.url);

describe('release track isolation', () => {
  it('defaults to stable and rejects unknown build tracks', () => {
    expect(parseReleaseTrack(undefined)).toBe('stable');
    expect(parseReleaseTrack('stable')).toBe('stable');
    expect(() => parseReleaseTrack('nightly')).toThrow('Unsupported Wayland release track');
  });

  it('gives preview builds a separate packaged identity and userData namespace', () => {
    expect(getPackagedReleaseIdentity('stable')).toEqual({ appName: 'Wayland', userDataDirectoryName: 'Wayland' });
    expect(getPackagedReleaseIdentity('preview')).toEqual({
      appName: 'Wayland Preview',
      userDataDirectoryName: 'Wayland Preview',
    });
    expect(getReleaseProtocolScheme('stable')).toBe('wayland');
    expect(getReleaseProtocolScheme('preview')).toBe('wayland-preview');
  });

  it.each([
    ['stable', 'win32', 'x64', undefined],
    ['stable', 'win32', 'arm64', 'latest-win-arm64'],
    ['stable', 'darwin', 'x64', undefined],
    ['stable', 'darwin', 'arm64', 'latest-arm64'],
    ['stable', 'linux', 'arm64', undefined],
    ['preview', 'win32', 'x64', 'preview'],
    ['preview', 'win32', 'arm64', 'preview-win-arm64'],
    ['preview', 'darwin', 'x64', 'preview'],
    ['preview', 'darwin', 'arm64', 'preview-arm64'],
    ['preview', 'linux', 'arm64', 'preview'],
  ] as const)('maps %s %s/%s to an isolated updater channel', (track, platform, arch, expected) => {
    expect(getReleaseUpdateChannel(track, { platform, arch })).toBe(expected);
  });
  // The packaged runtime emits releaseIdentity.executableName in its boot-start
  // event and scripts/platform-package-smoke.mjs compares that object
  // byte-for-byte, case-sensitively, against expectedReleaseIdentity. Two
  // independent derivations of the same string is exactly how Build Matrix ended
  // up with an app emitting "wayland-preview" while the gate demanded
  // "Wayland Preview". Bind them so they cannot drift again.
  it.each([
    ['stable', 'win32', 'x64'],
    ['stable', 'win32', 'arm64'],
    ['stable', 'darwin', 'x64'],
    ['stable', 'darwin', 'arm64'],
    ['stable', 'linux', 'x64'],
    ['stable', 'linux', 'arm64'],
    ['preview', 'win32', 'x64'],
    ['preview', 'win32', 'arm64'],
    ['preview', 'darwin', 'x64'],
    ['preview', 'darwin', 'arm64'],
    ['preview', 'linux', 'x64'],
    ['preview', 'linux', 'arm64'],
  ] as const)(
    'binds the packaged %s %s/%s launcher name to the release gate expectation',
    async (track, platform, arch) => {
      const { expectedReleaseIdentity } = (await import(
        require.resolve('../../scripts/platform-package-smoke.mjs')
      )) as {
        expectedReleaseIdentity: (
          track: string,
          platform: string,
          arch: string
        ) => { executableName: string; productName: string };
      };
      const gate = expectedReleaseIdentity(track, platform, arch);
      expect(getPackagedExecutableName(track, platform)).toBe(gate.executableName);
      expect(gate.productName).toBe(getPackagedReleaseIdentity(track).appName);
    }
  );
});
