/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit tests for the startup bundle-integrity self-check (#755/#738).
 * Exercises the pure codesign-output parser and bundle-root resolution on
 * captured sample output - never shells out to codesign.
 */

import { describe, expect, it } from 'vitest';
import { findBundleRoot, parseCodesignVerifyOutput } from '@process/services/integrity/bundleIntegrity';

// Captured from the live #755 repro (codesign --verify --deep --strict
// --verbose=2, macOS arm64, Wayland v0.11.17 with a broken seal).
const BROKEN_SEAL_OUTPUT = [
  '/Applications/Wayland.app: a sealed resource is missing or invalid',
  'file added: /Applications/Wayland.app/Contents/Resources/app.asar.unpacked/.ijfw/.layout-version',
  'file added: /Applications/Wayland.app/Contents/Resources/app.asar.unpacked/.ijfw/tmp/.keep',
].join('\n');

describe('parseCodesignVerifyOutput', () => {
  it('treats exit 0 as a valid seal with no violations', () => {
    // On success codesign prints nothing at --verbose=2 (or a bare progress
    // line); exit code is the verdict.
    const report = parseCodesignVerifyOutput('', 0);
    expect(report.valid).toBe(true);
    expect(report.violations).toEqual([]);
  });

  it('extracts "file added:" lines and the sealed-resource summary from the #755 repro output', () => {
    const report = parseCodesignVerifyOutput(BROKEN_SEAL_OUTPUT, 1);
    expect(report.valid).toBe(false);
    expect(report.violations).toEqual([
      '/Applications/Wayland.app: a sealed resource is missing or invalid',
      'file added: /Applications/Wayland.app/Contents/Resources/app.asar.unpacked/.ijfw/.layout-version',
      'file added: /Applications/Wayland.app/Contents/Resources/app.asar.unpacked/.ijfw/tmp/.keep',
    ]);
  });

  it('extracts "file modified:" and "file missing:" lines', () => {
    const stderr = [
      '/Applications/Wayland.app: a sealed resource is missing or invalid',
      'file modified: /Applications/Wayland.app/Contents/Resources/app.asar',
      'file missing: /Applications/Wayland.app/Contents/Resources/app.png',
    ].join('\n');
    const report = parseCodesignVerifyOutput(stderr, 1);
    expect(report.valid).toBe(false);
    expect(report.violations).toContain('file modified: /Applications/Wayland.app/Contents/Resources/app.asar');
    expect(report.violations).toContain('file missing: /Applications/Wayland.app/Contents/Resources/app.png');
  });

  it('recognizes an unsigned bundle', () => {
    const stderr = '/Applications/Wayland.app: code object is not signed at all';
    const report = parseCodesignVerifyOutput(stderr, 1);
    expect(report.valid).toBe(false);
    expect(report.violations).toEqual(['/Applications/Wayland.app: code object is not signed at all']);
  });

  it('ignores noise lines and blank lines around the diagnostics', () => {
    const stderr = [
      '',
      'In subcomponent: /Applications/Wayland.app/Contents/Frameworks/Foo.framework',
      BROKEN_SEAL_OUTPUT,
      '',
    ].join('\n');
    const report = parseCodesignVerifyOutput(stderr, 1);
    expect(report.violations).toHaveLength(3);
  });

  it('reports a synthetic violation when output is unrecognized but exit is non-zero', () => {
    const report = parseCodesignVerifyOutput('something inscrutable', 3);
    expect(report.valid).toBe(false);
    expect(report.violations).toEqual(['codesign verification failed (exit 3) with unrecognized output']);
  });
});

describe('findBundleRoot', () => {
  it('resolves the .app root from the packaged execPath', () => {
    expect(findBundleRoot('/Applications/Wayland.app/Contents/MacOS/Wayland')).toBe('/Applications/Wayland.app');
  });

  it('resolves nested install locations', () => {
    expect(findBundleRoot('/Users/me/Apps/Wayland.app/Contents/MacOS/Wayland')).toBe('/Users/me/Apps/Wayland.app');
  });

  it('returns null outside a bundle (dev builds)', () => {
    expect(findBundleRoot('/usr/local/bin/node')).toBeNull();
    expect(findBundleRoot('/Users/me/dev/wayland/node_modules/electron/dist/Electron')).toBeNull();
  });
});
