/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Constitution Doctor check — is the agent this install runs actually the agent
 * we document?
 *
 * The Constitution FS helper is a unix-only Rust crate: `SUPPORTED_PLATFORMS` in
 * `constitutionFsBinary.ts` is darwin + linux, and `verify-packaged-resources.js`
 * asserts its ABSENCE on win32. That part is deliberate.
 *
 * What was not deliberate (#1040) is the silence. `composePrompt` drops BOTH the
 * Constitution and the specialist overlay when the helper is unavailable, so a
 * Windows user gets a materially different agent - including a different
 * identity - and nothing in their diagnostics said so. That produces bug reports
 * nobody can reproduce: the user sees behaviour that does not match the docs, we
 * cannot repeat it on our machines, and no report names the cause.
 *
 * WARN, never FAIL: everything still works, the agent is simply missing a
 * prefix. There is nothing for the user to fix - only something they are owed
 * knowing, and something a support thread needs to see.
 */

import type { DoctorCheckOutcome } from '../types';

/**
 * Structurally the `ConstitutionFsCapability` the service reports. Declared here
 * rather than imported so this check stays free of the service module (and of
 * Electron's `safeStorage`, which it pulls in).
 */
export type ConstitutionCapability =
  | { supported: true }
  | { supported: false; code: string; reason: string };

export type ConstitutionCapabilityInfo = {
  /** `process.platform` of the running app. */
  platform: NodeJS.Platform;
  /** `null` when the Constitution service is not initialised in this process. */
  capability: ConstitutionCapability | null;
};

/** What a user calls their operating system. */
function platformName(platform: NodeJS.Platform): string {
  if (platform === 'win32') return 'Windows';
  if (platform === 'darwin') return 'macOS';
  if (platform === 'linux') return 'Linux';
  return platform;
}

export async function checkConstitutionActive(info: ConstitutionCapabilityInfo): Promise<DoctorCheckOutcome> {
  const os = platformName(info.platform);
  const capability = info.capability;

  if (capability === null) {
    return {
      status: 'warn',
      detail: `Wayland could not read whether the Constitution is active on this install (${os}), because the Constitution service is not running in this process.`,
      remediation:
        'Restart Wayland and run the Doctor again. If this keeps reporting the same thing, include this line when you report it.',
    };
  }

  // `=== false`, not `!capability.supported`: this project compiles without
  // strictNullChecks, where truthiness alone does not narrow the discriminant
  // and `capability.reason` is then unreachable. `composePrompt` writes the same
  // comparison for the same reason.
  if (capability.supported === false) {
    return {
      status: 'warn',
      // Both halves are named on purpose: a reader who only sees "Constitution"
      // will not connect it to a specialist behaving like a generic assistant.
      detail: `The Constitution and the specialist overlay are NOT applied on ${os}, so agents here run without Wayland's identity and behaviour rules and a specialist gets no per-specialist instructions. Everything else works normally. Reported reason: ${capability.reason}`,
      remediation: `This is a platform limitation, not a setting you got wrong - the component that supplies them ships for macOS and Linux only. Quote this line in any bug report about how an agent behaved on ${os}.`,
    };
  }

  return {
    status: 'pass',
    detail: `The Constitution and any specialist overlay are applied to every chat on this platform (${os}).`,
  };
}
