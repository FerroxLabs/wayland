/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit tests for the startup bundle-integrity self-check (#755/#738).
 * Exercises the pure codesign-output parser and bundle-root resolution on
 * captured sample output - never shells out to codesign.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  checkBundleSealBeforeUpdate,
  findBundleRoot,
  parseCodesignVerifyOutput,
  runBundleIntegrityCheck,
  type BundleIntegrityDeps,
} from '@process/services/integrity/bundleIntegrity';

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

// OfficeCLI's self-updater rewrote the bundled binary (OFFICECLI-SEAL-BREAK-ROOT-CAUSE):
// the seal broke and every macOS update failed silently.
const VALID = { valid: true, violations: [] };
const BROKEN = parseCodesignVerifyOutput(
  [
    '/Applications/Wayland.app: a sealed resource is missing or invalid',
    'file modified: /Applications/Wayland.app/Contents/Resources/bundled-officecli/darwin-arm64/officecli',
  ].join('\n'),
  1
);

function makeDeps(overrides: Partial<BundleIntegrityDeps> = {}) {
  const calls: string[] = [];
  const deps: BundleIntegrityDeps = {
    isMacPackaged: vi.fn(async () => true),
    bundleRoot: () => '/Applications/Wayland.app',
    verify: vi.fn(async () => {
      calls.push('verify');
      return VALID;
    }),
    repairOfficeCli: vi.fn(async () => {
      calls.push('repair');
      return { status: 'intact' as const };
    }),
    notify: vi.fn(async () => {}),
    setSealInvalid: vi.fn(async () => {}),
    ...overrides,
  };
  return { deps, calls };
}

describe('runBundleIntegrityCheck (startup)', () => {
  it('restores a self-updated OfficeCLI before verifying the seal, then logs a clean verdict', async () => {
    const { deps, calls } = makeDeps({
      repairOfficeCli: vi.fn(async () => {
        calls.push('repair');
        return {
          status: 'repaired' as const,
          url: 'https://github.com/iOfficeAI/OfficeCLI/releases/download/v1.0.136/x',
        };
      }),
    });
    await expect(runBundleIntegrityCheck(deps)).resolves.toEqual(VALID);
    expect(calls).toEqual(['repair', 'verify']);
    expect(deps.notify).not.toHaveBeenCalled();
    expect(deps.setSealInvalid).toHaveBeenCalledWith(false);
  });

  it('surfaces reinstall guidance and blocks updates when the repair cannot complete', async () => {
    const { deps } = makeDeps({
      repairOfficeCli: vi.fn(async () => ({
        status: 'failed' as const,
        reason: 'not-writable' as const,
        detail: 'read-only',
      })),
      verify: vi.fn(async () => BROKEN),
    });
    await expect(runBundleIntegrityCheck(deps)).resolves.toEqual(BROKEN);
    expect(deps.notify).toHaveBeenCalledWith(
      'Wayland installation is damaged',
      expect.stringMatching(/tried to repair it automatically but could not.*reinstall Wayland/s)
    );
    expect(deps.setSealInvalid).toHaveBeenCalledWith(true);
  });

  it('does nothing outside a packaged macOS build', async () => {
    const { deps } = makeDeps({ isMacPackaged: vi.fn(async () => false) });
    await expect(runBundleIntegrityCheck(deps)).resolves.toBeNull();
    expect(deps.repairOfficeCli).not.toHaveBeenCalled();
    expect(deps.verify).not.toHaveBeenCalled();
  });
});

describe('checkBundleSealBeforeUpdate', () => {
  it('lets the install proceed on an intact seal without touching OfficeCLI', async () => {
    const { deps } = makeDeps();
    await expect(checkBundleSealBeforeUpdate(deps)).resolves.toEqual({ ok: true });
    expect(deps.repairOfficeCli).not.toHaveBeenCalled();
  });

  it('repairs OfficeCLI and re-verifies when the seal is broken, then proceeds', async () => {
    const verify = vi.fn().mockResolvedValueOnce(BROKEN).mockResolvedValueOnce(VALID);
    const { deps } = makeDeps({
      verify,
      repairOfficeCli: vi.fn(async () => ({ status: 'repaired' as const, url: 'u' })),
    });
    await expect(checkBundleSealBeforeUpdate(deps)).resolves.toEqual({ ok: true });
    expect(verify).toHaveBeenCalledTimes(2);
    expect(deps.setSealInvalid).toHaveBeenLastCalledWith(false);
  });

  it('refuses the install when the seal stays broken after a failed repair', async () => {
    const { deps } = makeDeps({
      verify: vi.fn(async () => BROKEN),
      repairOfficeCli: vi.fn(async () => ({
        status: 'failed' as const,
        reason: 'download-failed' as const,
        detail: 'offline',
      })),
    });
    await expect(checkBundleSealBeforeUpdate(deps)).resolves.toEqual({
      ok: false,
      repairAttempted: true,
      violations: BROKEN.violations,
    });
    expect(deps.setSealInvalid).toHaveBeenLastCalledWith(true);
  });

  it('refuses without claiming a repair when something other than OfficeCLI broke the seal', async () => {
    const { deps } = makeDeps({ verify: vi.fn(async () => BROKEN) });
    await expect(checkBundleSealBeforeUpdate(deps)).resolves.toMatchObject({ ok: false, repairAttempted: false });
    expect(deps.verify).toHaveBeenCalledTimes(1);
  });

  it('does not block when codesign cannot give a verdict', async () => {
    const { deps } = makeDeps({ verify: vi.fn(async () => null) });
    await expect(checkBundleSealBeforeUpdate(deps)).resolves.toEqual({ ok: true });
  });
});
