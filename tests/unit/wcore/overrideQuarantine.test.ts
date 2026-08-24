/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * A NEWER ENGINE MUST NOT PERMANENTLY BREAK AN OLDER DESKTOP.
 *
 * Reported from the field: a Mac user on Desktop v0.12.0 accepted the in-app
 * engine update to Core v0.13.5 and every chat died with
 *
 *   Agent failed to start: wcore Desktop contract rejected ready:
 *   Core contract minor differs from the pin
 *
 * v0.12.0 pins contract minor 14 and bundles Core v0.13.0. v0.13.5 is minor 16,
 * and assertDescriptor compares minors with strict equality and fails closed.
 * resolveWCoreBinary checks the in-app override FIRST, so the update shadowed
 * the bundled binary that would have worked. The app offered the update,
 * installed it, and bricked itself.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import {
  isIncompatibleEngineCode,
  isOverrideBinary,
  quarantineOverride,
  describeQuarantine,
} from '@process/agent/wcore/overrideQuarantine';
import { WCORE_OVERRIDE_SUBDIR } from '@process/agent/wcore/binaryResolver';

let userData: string;
let overrideDir: string;

beforeEach(() => {
  userData = mkdtempSync(join(tmpdir(), 'wcore-override-'));
  overrideDir = join(userData, WCORE_OVERRIDE_SUBDIR);
  mkdirSync(join(overrideDir, 'darwin-arm64'), { recursive: true });
  writeFileSync(join(overrideDir, 'darwin-arm64', 'wayland-core'), 'not really a binary');
});
afterEach(() => rmSync(userData, { recursive: true, force: true }));

describe('an engine this build cannot talk to is undone, not endured', () => {
  it('treats the reported failure - contract_minor_mismatch - as incompatible', () => {
    expect(isIncompatibleEngineCode('contract_minor_mismatch')).toBe(true);
    for (const code of [
      'contract_name_mismatch',
      'contract_major_mismatch',
      'generator_mismatch',
      'fixture_digest_mismatch',
      'schema_digest_mismatch',
      'source_inputs_digest_mismatch',
    ]) {
      expect(isIncompatibleEngineCode(code)).toBe(true);
    }
  });

  it('does NOT quarantine on a transient or parser failure', () => {
    // Deliberately narrow. A stall, a bad frame or a one-off parse error can be
    // a bad session; throwing away a legitimate engine over a blip would be a
    // worse bug than the one being fixed.
    for (const code of ['unexpected_consumer_error', 'session_failed', 'schema_invalid', '', undefined, null]) {
      expect(isIncompatibleEngineCode(code)).toBe(false);
    }
  });

  it('recognises an override binary, and does not mistake the bundled one for it', () => {
    const overrideBin = join(overrideDir, 'darwin-arm64', 'wayland-core');
    expect(isOverrideBinary(overrideBin, overrideDir)).toBe(true);
    // The bundled binary must NEVER be quarantined - it is the thing we fall back to.
    expect(
      isOverrideBinary('/Applications/Wayland.app/Contents/Resources/bundled-wayland-core/x/wayland-core', overrideDir)
    ).toBe(false);
    expect(isOverrideBinary('/usr/local/bin/wayland-core', overrideDir)).toBe(false);
    expect(isOverrideBinary(null, overrideDir)).toBe(false);
  });

  it('matches on a path SEGMENT, so a lookalike directory name cannot trigger it', () => {
    const decoy = `${sep}Users${sep}me${sep}my-wayland-core-overrides-notes${sep}wayland-core`;
    expect(isOverrideBinary(decoy, overrideDir)).toBe(false);
  });

  it('moves the override aside and DELETES NOTHING', () => {
    const outcome = quarantineOverride(overrideDir, '1700000000000');
    expect(outcome.kind).toBe('quarantined');
    // The override is gone from the resolver's first search location...
    expect(existsSync(overrideDir)).toBe(false);
    // ...but the binary still exists, because it is evidence for a bug report.
    if (outcome.kind === 'quarantined') {
      expect(existsSync(join(outcome.movedTo, 'darwin-arm64', 'wayland-core'))).toBe(true);
    }
    expect(readdirSync(userData).some((e) => e.startsWith(`${WCORE_OVERRIDE_SUBDIR}.rejected-`))).toBe(true);
  });

  it('is a no-op when there is nothing installed', () => {
    rmSync(overrideDir, { recursive: true, force: true });
    expect(quarantineOverride(overrideDir, '1').kind).toBe('skipped');
    expect(quarantineOverride(null, '1').kind).toBe('skipped');
  });

  it('tells the user what happened and what to do, naming neither "contract" nor "pin"', () => {
    const outcome = quarantineOverride(overrideDir, '1700000000000');
    const msg = describeQuarantine(outcome, 'Core contract minor differs from the pin');
    expect(msg).toContain('Restart Wayland');
    expect(msg).toContain('nothing was deleted');
    // The shipped sentence named no product, no version and no action.
    expect(msg.startsWith('Core contract minor differs from the pin')).toBe(false);
  });

  it('still gives a manual recovery path when the move itself fails', () => {
    const msg = describeQuarantine({ kind: 'move-failed', error: 'EPERM' }, 'detail');
    expect(msg).toContain(WCORE_OVERRIDE_SUBDIR);
    expect(msg).toContain('EPERM');
  });
});
