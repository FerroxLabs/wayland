import { describe, expect, it } from 'vitest';
import {
  getPackagedReleaseIdentity,
  getReleaseProtocolScheme,
  getReleaseUpdateChannel,
  parseReleaseTrack,
} from '@/common/releaseTrack';

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
});
