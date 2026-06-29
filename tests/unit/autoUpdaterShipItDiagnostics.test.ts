/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';

// The diagnostics helpers are pure (all IO injected), so we exercise the
// never-throws + zero-PII contract directly without electron. The module's
// singleton still constructs at import, so mock the electron surface it touches.

vi.mock('electron', () => ({
  app: { getVersion: vi.fn(() => '1.0.0'), isPackaged: true, exit: vi.fn() },
}));
vi.mock('electron-updater', () => ({
  autoUpdater: {
    logger: null,
    autoDownload: true,
    autoInstallOnAppQuit: true,
    channel: null,
    on: vi.fn(),
  },
}));
vi.mock('electron-log', () => ({
  default: { transports: { file: { level: 'info' } }, info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import {
  redactHome,
  buildShipItDiagnostics,
  type ShipItDiagIO,
  type ShipItStateFields,
} from '@/process/services/autoUpdaterService';

const HOME = '/Users/alice';

/** A baseline IO with present, populated artifacts. Tests override per case. */
function makeIO(overrides: Partial<ShipItDiagIO> = {}): ShipItDiagIO {
  return {
    homedir: HOME,
    execPath: `${HOME}/Applications/Wayland.app/Contents/MacOS/Wayland`,
    isInApplicationsFolder: true,
    listDir: () => ['com.ferroxlabs.wayland.ShipIt', 'unrelated-dir'],
    readText: () =>
      `Beginning installation\nMoving bundle ${HOME}/Library/Caches/x to /Applications\nInstallation completed successfully`,
    readPlistFields: (): ShipItStateFields => ({
      launchAfterInstallation: false,
      targetBundleURL: `file://${HOME}/Applications/Wayland.app`,
      updateBundleURL: `file://${HOME}/Library/Caches/com.ferroxlabs.wayland.ShipIt/update.app`,
    }),
    ...overrides,
  };
}

describe('redactHome', () => {
  it('replaces every home-dir occurrence with ~', () => {
    expect(redactHome(`${HOME}/Library/Caches/log`, HOME)).toBe('~/Library/Caches/log');
    expect(redactHome(`file://${HOME}/a and ${HOME}/b`, HOME)).toBe('file://~/a and ~/b');
  });

  it('is a no-op for empty value or empty home', () => {
    expect(redactHome('', HOME)).toBe('');
    expect(redactHome('/some/path', '')).toBe('/some/path');
  });
});

describe('buildShipItDiagnostics — PII redaction', () => {
  it('redacts the home dir from execPath, the log tail, and plist URLs', () => {
    const lines = buildShipItDiagnostics(makeIO());
    const joined = lines.join('\n');
    // No raw home path may leak anywhere.
    expect(joined).not.toContain(HOME);
    // The redacted marker must be present (proves the strings were actually emitted).
    expect(joined).toContain('execPath=~/Applications/Wayland.app');
    expect(joined).toContain('targetBundleURL=file://~/Applications/Wayland.app');
    expect(joined).toContain('launchAfterInstallation=false');
  });
});

describe('buildShipItDiagnostics — graceful absence', () => {
  it('never throws and reports "no *.ShipIt" when the Caches dir is empty/absent', () => {
    const lines = buildShipItDiagnostics(makeIO({ listDir: () => [] }));
    expect(lines.some((l) => l.includes('no *.ShipIt directory'))).toBe(true);
  });

  it('reports the log + plist as absent when both readers return null', () => {
    const lines = buildShipItDiagnostics(makeIO({ readText: () => null, readPlistFields: () => null }));
    const joined = lines.join('\n');
    expect(joined).toContain('ShipIt_stderr.log absent or unreadable');
    expect(joined).toContain('ShipItState.plist absent or unparseable');
    // Even with everything absent, still no PII and still the execPath header line.
    expect(joined).not.toContain(HOME);
  });

  it('only inspects *.ShipIt entries, ignoring unrelated cache dirs', () => {
    const seen: string[] = [];
    buildShipItDiagnostics(
      makeIO({
        listDir: () => ['unrelated', 'foo.ShipIt', 'bar'],
        readText: (file) => {
          seen.push(file);
          return null;
        },
      })
    );
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain('foo.ShipIt');
  });

  it('tails to the last 40 non-empty lines of a large log', () => {
    const big = Array.from({ length: 100 }, (_, i) => `line-${i}`).join('\n');
    const lines = buildShipItDiagnostics(makeIO({ readText: () => big }));
    const tailLine = lines.find((l) => l.includes('ShipIt_stderr.log (tail)'));
    expect(tailLine).toBeDefined();
    expect(tailLine).toContain('line-99');
    expect(tailLine).toContain('line-60');
    expect(tailLine).not.toContain('line-59');
  });
});
