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

import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { checkConstitutionActive } from '@process/doctor/checks/constitutionChecks';
import { ConstitutionFsBinaryError } from '@process/services/constitution/constitutionFsBinary';
import { ConstitutionFsService } from '@process/services/constitution/constitutionFsService';

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

describe('the real service reports the win32 capability the check reads', () => {
  it('an unsafe-platform authority becomes a warn that names Windows', async () => {
    // Exactly what happens on win32: SUPPORTED_PLATFORMS is darwin + linux, so
    // verifyPackagedConstitutionFsBinary throws CONSTITUTION_FS_UNSAFE_PLATFORM
    // and createProduction returns a service in the degraded state. Wiring the
    // REAL service to the REAL check closes the last inferred step between "the
    // helper does not ship on Windows" and "the user can find that out".
    const parent = mkdtempSync(path.join(os.tmpdir(), 'doctor-constitution-'));
    const service = ConstitutionFsService.createProduction('ignored-resources', {
      root: path.join(parent, '.wayland'),
      secretBackend: {
        encryptString: (plaintext: string) => plaintext,
        decryptString: (ciphertext: string) => ciphertext,
      },
      verifyPackagedBinary: () => {
        throw new ConstitutionFsBinaryError(
          'CONSTITUTION_FS_UNSAFE_PLATFORM',
          'No packaged Constitution filesystem authority exists for win32-x64.'
        );
      },
    });

    const capability = service.capability();
    // KNOWN POSITIVE: the service really is in the degraded state, so the warn
    // below is not a default.
    expect(capability.supported).toBe(false);

    const outcome = await checkConstitutionActive({ platform: 'win32', capability });
    expect(outcome.status).toBe('warn');
    expect(outcome.detail).toContain('Windows');
    expect(outcome.detail).toContain('specialist overlay');
    expect(outcome.detail).toContain('win32-x64');
  });
});
