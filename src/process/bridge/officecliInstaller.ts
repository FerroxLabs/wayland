/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * officecli installer (SEC-OFFICE-01).
 *
 * officecli is BUNDLED with the app (`node_modules/officecli`, asar-unpacked,
 * with `node_modules/.bin/officecli` on PATH via shellEnv). Normal runs spawn
 * the bundled binary directly - no network install is needed or performed.
 *
 * This module exists ONLY for the degraded case where the bundled binary is
 * missing/unresolvable (e.g. a stripped install). In that case we DO NOT pipe a
 * remote script straight into a shell. Instead we:
 *   1. Require EXPLICIT native user consent (renderer cannot spoof it).
 *   2. Download a VERSION-PINNED install script to a temp file.
 *   3. Verify its SHA-256 against a pinned constant - fail closed on mismatch
 *      or when the pin is unset.
 *   4. Execute the verified script via the interpreter with the file path as an
 *      argv element (no shell-string interpolation, no `curl | bash`).
 *
 * We deliberately drop the previous blanket `xattr -cr` + `codesign -s - --force`
 * step that stripped Gatekeeper quarantine from the downloaded binary.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { dialog, BrowserWindow } from 'electron';

/**
 * Pinned officecli release tag. The install scripts are fetched from this exact
 * tag (never a moving branch like `main`) so the fetched bytes are stable and a
 * checksum can be pinned against them.
 */
const OFFICECLI_INSTALL_TAG = 'v0.2.79';

const OFFICECLI_INSTALL_BASE = `https://raw.githubusercontent.com/iOfficeAI/OfficeCLI/${OFFICECLI_INSTALL_TAG}`;

/**
 * SHA-256 of the pinned install scripts. MUST be filled in by the owner with the
 * canonical hash of the script bytes served at the pinned tag (see
 * `ownerActionNeeded`). While empty, network install fails closed - the bundled
 * binary path is unaffected.
 *
 * To obtain:
 *   curl -fsSL <OFFICECLI_INSTALL_BASE>/install.sh  | shasum -a 256
 *   curl -fsSL <OFFICECLI_INSTALL_BASE>/install.ps1 | shasum -a 256
 */
const OFFICECLI_INSTALL_SHA256: { posix: string; windows: string } = {
  posix: '',
  windows: '',
};

export type InstallStatusEmitter = (payload: {
  state: 'starting' | 'installing' | 'ready' | 'error';
  message?: string;
}) => void;

/** Cache the per-session consent decision so we prompt at most once. */
let consentDecision: boolean | null = null;
/** Skip further attempts after a failure in this session. */
let installFailed = false;

/**
 * Show a native consent dialog. A compromised renderer cannot spoof this; the
 * dialog is driven entirely from the main process. Returns true only when the
 * user explicitly approves.
 */
async function requireInstallConsent(): Promise<boolean> {
  if (consentDecision !== null) return consentDecision;

  const parentWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  const options = {
    type: 'warning' as const,
    title: 'Install officecli?',
    message: 'Office/PPT preview needs the officecli helper, which was not found bundled.',
    detail:
      `Wayland can download and run the official, version-pinned officecli installer ` +
      `(${OFFICECLI_INSTALL_TAG}) from GitHub. The download is integrity-checked before it runs. ` +
      `Only proceed if you trust this source.`,
    buttons: ['Download and install', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
  };
  const result = parentWindow
    ? await dialog.showMessageBox(parentWindow, options)
    : await dialog.showMessageBox(options);

  consentDecision = result.response === 0;
  return consentDecision;
}

/**
 * Download a URL to a buffer using Node's built-in fetch (no shell).
 */
async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}) for ${url}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Auto-install officecli - consent-gated, pinned, and checksum-verified.
 *
 * Returns true only on a verified, executed install. Network install is the
 * fallback path; the bundled binary is preferred and requires no install.
 */
export async function installOfficecli(emitStatus?: InstallStatusEmitter): Promise<boolean> {
  if (installFailed) return false;

  const isWindows = process.platform === 'win32';
  const expectedHash = isWindows ? OFFICECLI_INSTALL_SHA256.windows : OFFICECLI_INSTALL_SHA256.posix;

  // Fail closed if no pinned checksum is configured: we will not run an
  // unverifiable remote script.
  if (!expectedHash) {
    installFailed = true;
    console.error(
      '[officecli] Network install blocked: no pinned install-script SHA-256 configured. ' +
        'Bundle officecli or set OFFICECLI_INSTALL_SHA256.'
    );
    emitStatus?.({ state: 'error', message: 'officecli is not bundled and auto-install is not configured.' });
    return false;
  }

  // Explicit user consent - no auto-run on first preview.
  const consented = await requireInstallConsent();
  if (!consented) {
    emitStatus?.({ state: 'error', message: 'officecli install was declined.' });
    return false;
  }

  emitStatus?.({ state: 'installing' });

  const scriptName = isWindows ? 'install.ps1' : 'install.sh';
  const scriptUrl = `${OFFICECLI_INSTALL_BASE}/${scriptName}`;

  let tmpScript: string | null = null;
  try {
    const bytes = await download(scriptUrl);
    const actualHash = sha256(bytes);
    if (actualHash !== expectedHash) {
      throw new Error(`Install-script checksum mismatch (expected ${expectedHash}, got ${actualHash})`);
    }

    // Write the verified script to a temp file and execute the interpreter with
    // the file PATH as an argv element - never via `sh -c`/`curl | bash`.
    tmpScript = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'officecli-install-')), scriptName);
    fs.writeFileSync(tmpScript, bytes, { mode: 0o600 });

    if (isWindows) {
      execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tmpScript], {
        stdio: 'inherit',
      });
    } else {
      execFileSync('bash', [tmpScript], { stdio: 'inherit' });
    }

    emitStatus?.({ state: 'ready' });
    return true;
  } catch (e) {
    installFailed = true;
    console.error('[officecli] Failed to install officecli:', e);
    emitStatus?.({ state: 'error', message: 'officecli install failed.' });
    return false;
  } finally {
    if (tmpScript) {
      try {
        fs.rmSync(path.dirname(tmpScript), { recursive: true, force: true });
      } catch {
        // best-effort temp cleanup
      }
    }
  }
}

/** Test-only: reset the per-session consent/failure state. */
export function _resetOfficecliInstallerForTests(): void {
  consentDecision = null;
  installFailed = false;
}
