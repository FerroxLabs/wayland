/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Windows update-elevation capability (#492).
 *
 * Wayland's Windows installer is per-machine (UPD-04), so it lives under
 * %ProgramFiles% and applying an update means writing there — which needs
 * administrator rights. electron-updater handles that by launching the
 * downloaded installer through `elevate.exe`, which raises a UAC prompt.
 *
 * That works for an administrator (a consent prompt they can approve). It can
 * NEVER work for a standard account: UAC raises a *credential* prompt asking
 * for an administrator's password, which the user does not have. The install
 * silently no-ops, the version never advances, and the app re-offers the same
 * doomed update on every launch — the loop #492 reports.
 *
 * No client-side flag changes that: writing to %ProgramFiles% without admin is
 * an OS boundary, not a configuration option. What we CAN do is stop pretending
 * otherwise — decide up front whether this machine can complete the elevation,
 * and when it cannot, say so plainly instead of burning a download on an
 * install that is guaranteed to fail.
 *
 * Everything here is pure over an injected IO surface so the whole decision is
 * unit-testable on Linux/macOS CI, where the real Windows probes cannot run.
 */

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * What this machine can do about an update that needs to write to the install
 * directory.
 *
 * - `not-required` — the install directory is writable by this process, so the
 *   update applies with no elevation at all (a per-user install).
 * - `available`    — elevation is needed and the current user is a member of the
 *   local Administrators group, so UAC will raise a *consent* prompt they can
 *   approve.
 * - `unavailable`  — elevation is needed and the current user is NOT an
 *   administrator. UAC will raise a *credential* prompt they cannot satisfy.
 *   This is the stranded population in #492.
 * - `unknown`      — not Windows, or the probe could not reach a verdict. Callers
 *   MUST treat this exactly like today's behaviour and change nothing.
 */
export type WindowsElevationCapability = 'unknown' | 'not-required' | 'available' | 'unavailable';

/** Injected IO for {@link assessWindowsElevation}. Every reader is total. */
export type WindowsElevationIO = {
  platform: NodeJS.Platform;
  /** Directory the running app executable lives in. */
  installDir: string;
  /** True when this process can actually create a file in `dir`. Never throws. */
  canWriteDir: (dir: string) => boolean;
  /** Raw `whoami /groups` output, or null when it could not be read. Never throws. */
  readCurrentUserGroups: () => string | null;
};

/** Well-known SID of the BUILTIN\Administrators group. */
const ADMINISTRATORS_SID = 'S-1-5-32-544';

/**
 * True when the BUILTIN\Administrators SID appears in `whoami /groups` output.
 *
 * A UAC-limited ("split token") administrator still carries S-1-5-32-544 in the
 * token — listed as *Group used for deny only* — so its presence is exactly the
 * question we need answered: will UAC ask this user for consent (they are an
 * admin) or for someone else's credentials (they are not)?
 *
 * The lookaround guards stop a longer SID that merely starts with the same
 * digits (e.g. `S-1-5-32-5440`) from matching.
 */
export function hasAdministratorsGroup(whoamiGroupsOutput: string): boolean {
  if (!whoamiGroupsOutput) return false;
  return new RegExp(`(?:^|[^\\w-])${ADMINISTRATORS_SID}(?![\\w-])`).test(whoamiGroupsOutput);
}

/**
 * Decide what this machine can do about an update that must write to the
 * install directory. Pure; never throws.
 *
 * Order matters: a writable install directory settles the question before we
 * ever ask who the user is, so a per-user install never pays for a group probe.
 */
export function assessWindowsElevation(io: WindowsElevationIO): WindowsElevationCapability {
  // Off Windows there is no elevation model to reason about, and the probes
  // below do not exist. Stay silent rather than guess.
  if (io.platform !== 'win32') return 'unknown';

  if (io.canWriteDir(io.installDir)) return 'not-required';

  const groups = io.readCurrentUserGroups();
  if (groups === null) return 'unknown';

  return hasAdministratorsGroup(groups) ? 'available' : 'unavailable';
}

/**
 * Can this process create a file in `dir`?
 *
 * Deliberately an actual create/delete rather than `fs.accessSync(W_OK)`:
 * on Windows `access` only reports the read-only *attribute* and ignores ACLs
 * entirely, so it happily claims %ProgramFiles% is writable by a standard user.
 * A real write is the only truthful answer. 64-bit processes are exempt from
 * UAC file virtualisation, so the failure is not silently redirected.
 */
export function canWriteDir(dir: string): boolean {
  const probe = path.join(dir, `.wayland-write-probe-${process.pid}-${Date.now()}`);
  try {
    fs.writeFileSync(probe, '');
    return true;
  } catch {
    return false;
  } finally {
    try {
      fs.rmSync(probe, { force: true });
    } catch {
      // The probe either never existed or is not ours to remove; either way the
      // verdict above already stands.
    }
  }
}

/**
 * Read the current user's group SIDs via `whoami /groups`. Windows only;
 * returns null anywhere else, or on any spawn/exit failure, so an unreadable
 * probe degrades to `unknown` instead of a wrong verdict.
 */
export function readCurrentUserGroups(): string | null {
  if (process.platform !== 'win32') return null;
  try {
    const result = spawnSync('whoami', ['/groups', '/fo', 'csv', '/nh'], {
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    });
    if (result.error || result.status !== 0 || typeof result.stdout !== 'string') return null;
    return result.stdout;
  } catch {
    return null;
  }
}

/** Real IO surface wired to this process. */
export function defaultWindowsElevationIO(execPath: string = process.execPath): WindowsElevationIO {
  return {
    platform: process.platform,
    installDir: path.dirname(execPath),
    canWriteDir,
    readCurrentUserGroups,
  };
}
