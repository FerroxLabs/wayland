/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * scripts/verify-windows-update-elevation.ps1 exists because the #492 elevation
 * verdict cannot be executed anywhere but Windows. Sean runs it on real hardware
 * and reads its answer as the app's answer - so the two must not drift. These
 * tests pin the parts of the script that reproduce
 * src/process/services/windowsUpdateElevation.ts, and prove the script's
 * Administrators-SID pattern classifies the same inputs the same way.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { hasAdministratorsGroup } from '@/process/services/windowsUpdateElevation';

const repoRoot = path.resolve(__dirname, '../../..');
const scriptPath = path.join(repoRoot, 'scripts', 'verify-windows-update-elevation.ps1');
const servicePath = path.join(repoRoot, 'src', 'process', 'services', 'autoUpdaterService.ts');

const script = fs.readFileSync(scriptPath, 'utf8');

const ADMIN_GROUPS = '"BUILTIN\\Administrators","S-1-5-32-544","Group used for deny only","Alias"';
const STANDARD_GROUPS = '"BUILTIN\\Users","S-1-5-32-545","Mandatory group, Enabled group","Alias"';
const LOOKALIKE_GROUPS = '"X","S-1-5-32-5440","",""';

/** The single-quoted regex literal the script hands to [regex]::IsMatch. */
function scriptSidPattern(): string {
  const m = script.match(/\[regex\]::IsMatch\(\$groupsRaw,\s*'([^']+)'\)/);
  return m ? m[1] : '';
}

describe('verify-windows-update-elevation.ps1', () => {
  it('exists and is a PowerShell script with a parameter block Sean can drive', () => {
    expect(script.startsWith('<#')).toBe(true);
    expect(script).toContain('[CmdletBinding()]');
    expect(script).toContain('param(');
  });

  it('documents an explicit pass criterion for every verdict the app can reach', () => {
    for (const verdict of ['not-required', 'available', 'unavailable', 'unknown']) {
      expect(script).toContain(verdict);
    }
    expect(script).toContain('RESULT: PASS');
    expect(script).toContain('RESULT: FAIL');
    expect(script).toContain('WHAT A PASS LOOKS LIKE');
  });

  it('is non-destructive: it installs, uninstalls and reconfigures nothing', () => {
    expect(script).not.toMatch(/Start-Process/);
    expect(script).not.toMatch(/msiexec/i);
    expect(script).not.toMatch(/Set-ItemProperty|New-ItemProperty|Remove-ItemProperty/);
    expect(script).not.toMatch(/Install-Package|winget\s+install|Uninstall-/);
    // The only thing it may delete is its own write probe.
    const removals = script.match(/Remove-Item[^\n]*/g) ?? [];
    for (const line of removals) expect(line).toContain('$probe');
  });

  it('keeps its own output off C:, per the seandesktop rule', () => {
    expect(script).toContain("$OutDir = 'F:\\wayland-verify'");
    // No hard-coded C: path anywhere; the only C: directory it touches is the
    // install location it discovers at runtime.
    expect(script.includes("'C:\\")).toBe(false);
    expect(script.includes('"C:\\')).toBe(false);
  });

  it("the script's SID pattern classifies exactly like the shipped module", () => {
    const pattern = scriptSidPattern();
    expect(pattern).not.toBe('');
    expect(pattern).toContain('S-1-5-32-544');

    // .NET and JS agree on these constructs, so running the script's own
    // pattern here is a real equivalence check, not a paraphrase.
    const scriptRe = new RegExp(pattern);
    for (const sample of [ADMIN_GROUPS, STANDARD_GROUPS, LOOKALIKE_GROUPS, '']) {
      expect(scriptRe.test(sample)).toBe(hasAdministratorsGroup(sample));
    }
    expect(hasAdministratorsGroup(ADMIN_GROUPS)).toBe(true);
    expect(hasAdministratorsGroup(LOOKALIKE_GROUPS)).toBe(false);
  });

  it('greps for a log line the app actually emits', () => {
    const marker = '[autoUpdater] Windows update elevation capability:';
    expect(script).toContain(marker);
    expect(fs.readFileSync(servicePath, 'utf8')).toContain(marker);
  });

  it('mirrors the module verdict order: writable dir first, then group membership', () => {
    const writableIdx = script.indexOf('} elseif ($canWrite) {');
    const adminIdx = script.indexOf('} elseif ($hasAdminSid) {');
    expect(writableIdx).toBeGreaterThan(-1);
    expect(adminIdx).toBeGreaterThan(writableIdx);
  });
});
