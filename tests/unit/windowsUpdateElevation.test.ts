/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #492: a per-machine Windows install cannot be updated by a standard account,
 * because writing to %ProgramFiles% needs administrator rights and UAC raises a
 * credential prompt the user cannot satisfy. These tests pin the decision that
 * tells those two populations apart, and pin that the whole thing stays inert
 * on every non-Windows platform.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  assessWindowsElevation,
  hasAdministratorsGroup,
  canWriteDir,
  readCurrentUserGroups,
  defaultWindowsElevationIO,
  type WindowsElevationIO,
} from '@/process/services/windowsUpdateElevation';

/** Real `whoami /groups /fo csv /nh` output from a UAC-limited administrator. */
const ADMIN_GROUPS = [
  '"Everyone","S-1-1-0","Mandatory group, Enabled by default, Enabled group","Well-known group"',
  '"BUILTIN\\Administrators","S-1-5-32-544","Group used for deny only","Alias"',
  '"BUILTIN\\Users","S-1-5-32-545","Mandatory group, Enabled by default, Enabled group","Alias"',
].join('\r\n');

/** Real output from a standard account: no Administrators entry at all. */
const STANDARD_GROUPS = [
  '"Everyone","S-1-1-0","Mandatory group, Enabled by default, Enabled group","Well-known group"',
  '"BUILTIN\\Users","S-1-5-32-545","Mandatory group, Enabled by default, Enabled group","Alias"',
  '"NT AUTHORITY\\INTERACTIVE","S-1-5-4","Mandatory group, Enabled by default, Enabled group","Well-known group"',
].join('\r\n');

function io(overrides: Partial<WindowsElevationIO> = {}): WindowsElevationIO {
  return {
    platform: 'win32',
    installDir: 'C:\\Program Files\\Wayland',
    canWriteDir: () => false,
    readCurrentUserGroups: () => STANDARD_GROUPS,
    ...overrides,
  };
}

describe('hasAdministratorsGroup', () => {
  it('finds the BUILTIN\\Administrators SID on a UAC-limited admin token', () => {
    expect(hasAdministratorsGroup(ADMIN_GROUPS)).toBe(true);
  });

  it('is false for a standard account', () => {
    expect(hasAdministratorsGroup(STANDARD_GROUPS)).toBe(false);
  });

  it('is false for empty output', () => {
    expect(hasAdministratorsGroup('')).toBe(false);
  });

  it('does not match a longer SID that merely starts with the same digits', () => {
    expect(hasAdministratorsGroup('"X","S-1-5-32-5440","",""')).toBe(false);
    expect(hasAdministratorsGroup('"X","S-1-5-32-544-1001","",""')).toBe(false);
  });

  it('does not match a SID that merely ends with the same digits', () => {
    expect(hasAdministratorsGroup('"X","S-1-5-21-S-1-5-32-544","",""')).toBe(false);
  });
});

describe('assessWindowsElevation', () => {
  it('is unknown on every non-Windows platform, whatever the probes say', () => {
    for (const platform of ['darwin', 'linux', 'freebsd'] as NodeJS.Platform[]) {
      expect(assessWindowsElevation(io({ platform, canWriteDir: () => false }))).toBe('unknown');
      expect(assessWindowsElevation(io({ platform, canWriteDir: () => true }))).toBe('unknown');
    }
  });

  it('a writable install directory needs no elevation at all (per-user install)', () => {
    expect(
      assessWindowsElevation(
        io({ installDir: 'C:\\Users\\sean\\AppData\\Local\\Programs\\Wayland', canWriteDir: () => true })
      )
    ).toBe('not-required');
  });

  it('never probes the user when the install directory is already writable', () => {
    let probed = false;
    const cap = assessWindowsElevation(
      io({
        canWriteDir: () => true,
        readCurrentUserGroups: () => {
          probed = true;
          return STANDARD_GROUPS;
        },
      })
    );
    expect(cap).toBe('not-required');
    expect(probed).toBe(false);
  });

  it('unwritable install dir + administrator → elevation is available (UAC consent prompt)', () => {
    expect(assessWindowsElevation(io({ readCurrentUserGroups: () => ADMIN_GROUPS }))).toBe('available');
  });

  it('unwritable install dir + standard account → elevation is UNAVAILABLE (#492)', () => {
    expect(assessWindowsElevation(io({ readCurrentUserGroups: () => STANDARD_GROUPS }))).toBe('unavailable');
  });

  it('an unreadable group probe degrades to unknown, never to a wrong verdict', () => {
    expect(assessWindowsElevation(io({ readCurrentUserGroups: () => null }))).toBe('unknown');
  });
});

describe('canWriteDir (real filesystem)', () => {
  it('is true for a directory this process owns, and leaves no probe file behind', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-writeprobe-'));
    try {
      expect(canWriteDir(dir)).toBe(true);
      expect(fs.readdirSync(dir)).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('is false for a directory that does not exist, and never throws', () => {
    expect(canWriteDir(path.join(os.tmpdir(), 'wl-does-not-exist-9d4f2a', 'nested'))).toBe(false);
  });
});

describe('readCurrentUserGroups', () => {
  it('returns null off Windows instead of spawning a Windows-only binary', () => {
    // The suite runs on Linux/macOS; the guard is what keeps `whoami /groups`
    // from ever being reached there.
    if (process.platform === 'win32') return;
    expect(readCurrentUserGroups()).toBeNull();
  });
});

describe('defaultWindowsElevationIO', () => {
  it('reports the directory containing the app executable as the install dir', () => {
    const surface = defaultWindowsElevationIO(path.join(path.sep, 'opt', 'Wayland', 'wayland'));
    expect(surface.installDir).toBe(path.join(path.sep, 'opt', 'Wayland'));
    expect(surface.platform).toBe(process.platform);
  });
});
