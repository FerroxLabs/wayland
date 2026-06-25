/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure-logic contract for the in-app Wayland Core updater: the release-asset
 * naming, the version comparison that decides "update available", and the
 * checksum parsing that anchors install trust. (Network + filesystem install
 * are integration concerns, not covered here.)
 */

import { describe, expect, it } from 'vitest';
import {
  assetNameFor,
  isNewerVersion,
  isValidReleaseTag,
  parseChecksum,
  runtimeKey,
} from '../../src/process/agent/wcore/wcoreUpdater';

describe('wcoreUpdater - runtimeKey', () => {
  it('joins platform and arch', () => {
    expect(runtimeKey('darwin', 'arm64')).toBe('darwin-arm64');
    expect(runtimeKey('win32', 'x64')).toBe('win32-x64');
  });
});

describe('wcoreUpdater - assetNameFor', () => {
  it('maps each platform/arch to the signed-release archive name', () => {
    expect(assetNameFor('v0.12.2', 'darwin', 'arm64')).toBe('wayland-core-v0.12.2-aarch64-apple-darwin.tar.gz');
    expect(assetNameFor('v0.12.2', 'darwin', 'x64')).toBe('wayland-core-v0.12.2-x86_64-apple-darwin.tar.gz');
    expect(assetNameFor('v0.12.2', 'linux', 'arm64')).toBe('wayland-core-v0.12.2-aarch64-unknown-linux-gnu.tar.gz');
    expect(assetNameFor('v0.12.2', 'linux', 'x64')).toBe('wayland-core-v0.12.2-x86_64-unknown-linux-gnu.tar.gz');
    expect(assetNameFor('v0.12.2', 'win32', 'arm64')).toBe('wayland-core-v0.12.2-aarch64-pc-windows-msvc.zip');
    expect(assetNameFor('v0.12.2', 'win32', 'x64')).toBe('wayland-core-v0.12.2-x86_64-pc-windows-msvc.zip');
  });

  it('returns null for an unsupported platform or arch', () => {
    expect(assetNameFor('v0.12.2', 'sunos', 'x64')).toBeNull();
    expect(assetNameFor('v0.12.2', 'darwin', 'ppc64')).toBeNull();
  });
});

describe('wcoreUpdater - isNewerVersion', () => {
  it('is true only when latest is strictly higher', () => {
    expect(isNewerVersion('0.12.3', '0.12.2')).toBe(true);
    expect(isNewerVersion('0.13.0', '0.12.9')).toBe(true);
    expect(isNewerVersion('1.0.0', '0.99.99')).toBe(true);
    expect(isNewerVersion('0.12.2', '0.12.2')).toBe(false);
    expect(isNewerVersion('0.12.1', '0.12.2')).toBe(false);
  });

  it('tolerates a leading v and ignores prerelease/build suffixes', () => {
    expect(isNewerVersion('v0.12.3', 'v0.12.2')).toBe(true);
    expect(isNewerVersion('0.12.3-rc.1', '0.12.2')).toBe(true);
    // Same base version with a prerelease tag is NOT treated as newer.
    expect(isNewerVersion('0.12.2-rc.2', '0.12.2')).toBe(false);
  });
});

describe('wcoreUpdater - isValidReleaseTag', () => {
  it('accepts well-formed release tags', () => {
    expect(isValidReleaseTag('v0.12.2')).toBe(true);
    expect(isValidReleaseTag('0.12.3')).toBe(true);
    expect(isValidReleaseTag('v1.0.0-rc.1')).toBe(true);
  });

  it('rejects tags carrying shell/path metacharacters (injection guard)', () => {
    // The single-quote breakout the security review flagged.
    expect(isValidReleaseTag("v1.0.0'; Remove-Item C:\\ -Recurse #")).toBe(false);
    expect(isValidReleaseTag('v1.0.0 && rm -rf /')).toBe(false);
    expect(isValidReleaseTag('../../etc/passwd')).toBe(false);
    expect(isValidReleaseTag('v1.0.0/../..')).toBe(false);
    expect(isValidReleaseTag('')).toBe(false);
    expect(isValidReleaseTag('latest')).toBe(false);
  });
});

describe('wcoreUpdater - parseChecksum', () => {
  const body = [
    'be6bc58a7d5123ba88f9d377465b1543ee0a32e15086b54ebd828d504a39b28d  wayland-core-v0.12.2-aarch64-apple-darwin.tar.gz',
    '9d7fe741cef936c1dc49d2ce11b02865091247d87392c6c187d71d76b4cc9137  wayland-core-v0.12.2-x86_64-apple-darwin.tar.gz',
  ].join('\n');

  it('returns the digest for a matching asset', () => {
    expect(parseChecksum(body, 'wayland-core-v0.12.2-aarch64-apple-darwin.tar.gz')).toBe(
      'be6bc58a7d5123ba88f9d377465b1543ee0a32e15086b54ebd828d504a39b28d'
    );
  });

  it('returns null when the asset is not listed', () => {
    expect(parseChecksum(body, 'wayland-core-v0.12.2-x86_64-pc-windows-msvc.zip')).toBeNull();
  });

  it('does not match on a filename substring (exact filename only)', () => {
    // A prefix of a real entry must not match.
    expect(parseChecksum(body, 'wayland-core-v0.12.2-aarch64-apple-darwin')).toBeNull();
  });
});
