/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #490: the Windows uninstaller left two per-user (HKCU) registry residues the
 * running app writes at runtime - the `wayland://` protocol handler
 * (setAsDefaultProtocolClient) and the start-on-boot Run entry
 * (setLoginItemSettings) - because electron-builder's `customUnInstall` hook was
 * never defined. NSIS scripts are not unit-runnable here, so this parses both
 * arch include files and pins that the cleanup directives exist, target the exact
 * keys the app writes, and stay byte-identical between x64 and arm64.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');
const NSH_FILES = ['resources/windows-installer-x64.nsh', 'resources/windows-installer-arm64.nsh'];

/** Extract the body between `!macro customUnInstall` and its `!macroend`. */
function customUnInstallBody(nsh: string): string | null {
  const m = nsh.match(/!macro\s+customUnInstall\b([\s\S]*?)!macroend/);
  return m ? m[1] : null;
}

describe('#490 Windows uninstaller registry cleanup', () => {
  const bodies = NSH_FILES.map((rel) => ({
    rel,
    body: customUnInstallBody(fs.readFileSync(path.join(ROOT, rel), 'utf-8')),
  }));

  it.each(bodies)('$rel defines a customUnInstall macro', ({ body }) => {
    expect(body).not.toBeNull();
  });

  // Line-anchored (multiline) so a commented-out `; DeleteReg...` cannot false-pass.
  it.each(bodies)('$rel removes the wayland:// protocol handler key', ({ body }) => {
    // DeleteRegKey removes the whole HKCU\Software\Classes\wayland tree
    // (URL Protocol value + shell\open\command) written every launch.
    expect(body).toMatch(/^\s*DeleteRegKey\s+HKCU\s+"Software\\Classes\\wayland"/m);
  });

  it.each(bodies)('$rel removes the start-on-boot Run value + StartupApproved marker', ({ body }) => {
    // Electron names the Run value with the app's AppUserModelID; with no
    // setAppUserModelId call it defaults to electron.app.<Name> = electron.app.Wayland.
    expect(body).toMatch(
      /^\s*DeleteRegValue\s+HKCU\s+"Software\\Microsoft\\Windows\\CurrentVersion\\Run"\s+"electron\.app\.Wayland"/m
    );
    expect(body).toMatch(
      /^\s*DeleteRegValue\s+HKCU\s+"Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run"\s+"electron\.app\.Wayland"/m
    );
  });

  it.each(bodies)('$rel gates all removals on a genuine uninstall (not --updated)', ({ body }) => {
    // electron-builder reruns the old uninstaller in update mode on every app
    // update, and customUnInstall fires there too. The deletions MUST sit inside
    // ${IfNot} ${isUpdated} ... ${EndIf}, or an update silently wipes the
    // start-on-boot entry (which has no self-heal). Guard the gate, not just presence.
    expect(body).toMatch(
      /\$\{IfNot\}\s+\$\{isUpdated\}[\s\S]*DeleteRegValue[\s\S]*CurrentVersion\\Run[\s\S]*\$\{EndIf\}/
    );
  });

  it('keeps the customUnInstall body identical across x64 and arm64 (no arch drift)', () => {
    const [x64, arm64] = bodies.map((b) => b.body);
    expect(x64).toBe(arm64);
  });

  it('the cleaned protocol scheme matches PROTOCOL_SCHEME in source (rename guard)', () => {
    const deepLink = fs.readFileSync(path.join(ROOT, 'src/process/utils/deepLink.ts'), 'utf-8');
    const scheme = deepLink.match(/PROTOCOL_SCHEME\s*=\s*'([^']+)'/)?.[1];
    expect(scheme).toBe('wayland');
    // If the scheme is ever renamed, the .nsh DeleteRegKey below must move with it.
    for (const { body } of bodies) {
      expect(body).toContain(`Software\\Classes\\${scheme}`);
    }
  });
});
