/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Platform Doctor checks — is the INSTALLED build the right one for this machine?
 *
 * We publish separate macOS x64 and arm64 builds. Nothing stops someone on an
 * Apple Silicon Mac from downloading the Intel one: macOS runs it silently under
 * Rosetta, so it works, it is just slower and burns more battery — and the user
 * has no way to know. (Windows blocks the wrong installer up front in
 * `resources/windows-installer-{x64,arm64}.nsh`; macOS has no such gate, and an
 * already-installed copy is never re-checked on either platform.)
 *
 * WARN, never FAIL: a translated build is degraded, not broken.
 */

import type { DoctorCheckOutcome } from '../types';

/** What the running app knows about itself — injected so the check stays pure. */
export type AppArchitecture = {
  /** `process.platform` of the running app. */
  platform: NodeJS.Platform;
  /** `process.arch` — the architecture the installed build was compiled for. */
  arch: string;
  /**
   * Electron's `app.runningUnderARM64Translation`: true when an x64 build is
   * running on an ARM64 machine through macOS Rosetta or Windows ARM64
   * emulation. Only meaningful on darwin/win32; `false` everywhere else.
   */
  runningUnderARM64Translation: boolean;
};

/**
 * App architecture — the installed build matches the machine's CPU. WARN when
 * the build is being translated, naming the native build to download instead.
 */
export async function checkAppArchitecture(info: AppArchitecture): Promise<DoctorCheckOutcome> {
  if (!info.runningUnderARM64Translation) {
    return { status: 'pass', detail: `Running natively (${info.platform} ${info.arch}).` };
  }

  const isMac = info.platform === 'darwin';
  const translator = isMac ? 'Rosetta' : 'Windows ARM64 emulation';
  const nativeBuild = isMac ? 'Apple Silicon (arm64)' : 'Arm64';
  return {
    status: 'warn',
    detail: `This is the ${info.arch} build of Wayland running on an ARM64 machine through ${translator}, not natively. Everything works, but it is slower and uses more battery.`,
    remediation: `Download the ${nativeBuild} build from https://github.com/FerroxLabs/wayland/releases and install it over this copy — your settings and chats are kept.`,
  };
}
