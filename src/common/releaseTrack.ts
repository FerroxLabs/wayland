/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type WaylandReleaseTrack = 'stable' | 'preview';

export function parseReleaseTrack(value: unknown): WaylandReleaseTrack {
  if (value === undefined || value === null || value === '' || value === 'stable') return 'stable';
  if (value === 'preview') return 'preview';
  throw new Error(`Unsupported Wayland release track: ${String(value)}`);
}

/**
 * electron-vite replaces this environment expression with a build-time literal.
 * Packaged builds therefore cannot be redirected to another track by changing
 * the launch environment.
 */
export function getReleaseTrack(): WaylandReleaseTrack {
  return parseReleaseTrack(process.env.WAYLAND_RELEASE_TRACK);
}

export type PackagedReleaseIdentity = {
  appName: string;
  userDataDirectoryName: string;
};

export function getPackagedReleaseIdentity(track: WaylandReleaseTrack): PackagedReleaseIdentity {
  return track === 'preview'
    ? { appName: 'Wayland Preview', userDataDirectoryName: 'Wayland Preview' }
    : { appName: 'Wayland', userDataDirectoryName: 'Wayland' };
}

export function getReleaseProtocolScheme(track: WaylandReleaseTrack): 'wayland' | 'wayland-preview' {
  return track === 'preview' ? 'wayland-preview' : 'wayland';
}

/**
 * The basename of the packaged launcher for a track on a platform.
 *
 * electron-builder writes `executableName` verbatim, and both configs set it to
 * the product name, so Linux ships `Wayland` / `Wayland Preview` - it is never
 * sanitized into a lowercase hyphenated name. Assuming otherwise is what made
 * both Linux Preview legs of Build Matrix report an empty packaged inventory.
 *
 * This is the single source the packaged runtime derives its boot-start
 * `releaseIdentity.executableName` from. That event is compared byte-for-byte
 * against `expectedReleaseIdentity` in scripts/platform-package-smoke.mjs, so
 * the two derivations must never drift; tests/unit/releaseTrack.test.ts binds
 * them together.
 */
export function getPackagedExecutableName(track: WaylandReleaseTrack, platform: NodeJS.Platform): string {
  const { appName } = getPackagedReleaseIdentity(track);
  return platform === 'win32' ? `${appName}.exe` : appName;
}

export type ReleaseRuntime = {
  platform: NodeJS.Platform;
  arch: string;
};

export function getReleaseUpdateChannel(track: WaylandReleaseTrack, runtime: ReleaseRuntime): string | undefined {
  const baseChannel = track === 'preview' ? 'preview' : 'latest';
  if (runtime.platform === 'win32' && runtime.arch === 'arm64') return `${baseChannel}-win-arm64`;
  if (runtime.platform === 'darwin' && runtime.arch === 'arm64') return `${baseChannel}-arm64`;
  // Stable keeps electron-updater's default latest channel. Preview is always
  // explicit so a missing preview feed fails closed instead of consuming stable.
  return track === 'preview' ? baseChannel : undefined;
}
