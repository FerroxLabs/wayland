/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1040 - Windows silently drops the Constitution and the specialist overlay.
 *
 * The Constitution FS helper is a unix-only Rust crate (`SUPPORTED_PLATFORMS` is
 * darwin + linux) and the packaging gate asserts its ABSENCE on win32. That part
 * is deliberate. The defect is what happened next: `composePrompt` dropped BOTH
 * the Constitution and the specialist overlay when the helper was unavailable,
 * computed a `constitutionSupported` flag, and then discarded it. Nothing
 * anywhere told the user, so a Windows user got a materially different agent
 * with no indication - the shape of defect that generates unfalsifiable bug
 * reports.
 *
 * This suite pins the disclosure: a Doctor check that says so in plain words,
 * wired into the real composition root.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp', runningUnderARM64Translation: false },
}));
vi.mock('@process/services/projectServiceSingleton', () => ({
  projectServiceSingleton: { listProjects: async () => [] },
}));
vi.mock('@process/services/conversationServiceSingleton', () => ({
  conversationServiceSingleton: { listAllConversations: async () => [] },
}));

import { checkConstitutionActive } from '@process/doctor/checks/constitutionChecks';

describe('checkConstitutionActive', () => {
  it('passes on a platform where the Constitution authority is present', async () => {
    const outcome = await checkConstitutionActive({ platform: 'darwin', capability: { supported: true } });
    expect(outcome.status).toBe('pass');
    expect(outcome.detail).toContain('Constitution');
    expect(outcome.remediation).toBeUndefined();
  });

  it('warns on win32 and names BOTH the Constitution and the specialist overlay', async () => {
    const outcome = await checkConstitutionActive({
      platform: 'win32',
      capability: {
        supported: false,
        code: 'CONSTITUTION_FS_UNSAFE_PLATFORM',
        reason: 'Constitution FS helper is not available on win32.',
      },
    });

    expect(outcome.status).toBe('warn');
    // The whole point of the issue: the user must be able to find out that BOTH
    // are missing, and that this is the platform, not their configuration.
    expect(outcome.detail).toContain('Constitution');
    expect(outcome.detail).toContain('specialist overlay');
    expect(outcome.detail).toContain('Windows');
    expect(outcome.remediation).toBeTruthy();
    // Never a fail: the app works, the agent is just missing that prefix.
    expect(outcome.status).not.toBe('fail');
  });

  it('warns rather than lying when the Constitution service was never initialised', async () => {
    const outcome = await checkConstitutionActive({ platform: 'darwin', capability: null });
    expect(outcome.status).toBe('warn');
    expect(outcome.detail).toContain('could not');
  });
});

describe('the Doctor composition root wires the Constitution check', () => {
  it('registers config.constitution and its run() never throws', async () => {
    const { buildDoctorChecks } = await import('@process/doctor/registry');
    const checks = buildDoctorChecks();

    // KNOWN POSITIVE: this registry really is the live one (an existing check
    // is present), so a missing Constitution check below is a real absence and
    // not an empty list.
    expect(checks.map((c) => c.id)).toContain('config.appArchitecture');

    const check = checks.find((c) => c.id === 'config.constitution');
    expect(check, 'config.constitution must exist in the Doctor registry').toBeDefined();
    expect(check!.category).toBe('config');
    expect(check!.titleKey).toBe('settings.doctor.checks.constitution');

    // The Constitution service singleton is deliberately NOT initialised in this
    // process. The check must report that, not throw into the runner's catch-all.
    const outcome = await check!.run();
    expect(outcome.status).toBe('warn');
  });
});
