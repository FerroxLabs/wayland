/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createCohortProductionController,
  type CohortConsentStore,
  type CohortProductionEnvironment,
} from '@process/services/cohort/ProductionCohortController';
import { M0B_DAY_MS } from '@process/services/cohort/types';

const NOW = Date.UTC(2026, 6, 19);
const roots: string[] = [];

async function fixture(initial: unknown = undefined) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-production-cohort-'));
  roots.push(root);
  let persisted = initial;
  const store: CohortConsentStore = {
    get: vi.fn(async () => persisted),
    set: vi.fn(async (value) => {
      persisted = structuredClone(value);
    }),
  };
  const environment: CohortProductionEnvironment = {
    userDataPath: path.join(root, 'user-data'),
    resourcesPath: path.join(root, 'resources'),
    isPackaged: false,
    appVersion: '0.12.0-dev',
    releaseTrack: 'preview',
    installIdentity: 'install-alpha',
    cohort: 'knowledge-work',
    consentStore: store,
    now: () => NOW,
  };
  return {
    root,
    store,
    environment,
    persisted: () => persisted,
    controller: await createCohortProductionController(environment),
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe('ProductionCohortController', () => {
  it('starts fail-closed and creates no evidence storage before explicit consent', async () => {
    const subject = await fixture({ enabled: true, acceptedAtMs: NOW, extraAuthority: true });

    await expect(subject.controller.consentStatus()).resolves.toEqual({
      enabled: false,
      acceptedAtMs: null,
      observationWindow: null,
    });
    await expect(subject.controller.recordShellReturn('reliability')).resolves.toEqual({
      status: 'consent-disabled',
    });
    await expect(fs.stat(path.join(subject.environment.userDataPath, 'cohort-evidence'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('persists one exact 14-day consent window and records only closed events', async () => {
    const subject = await fixture();

    await expect(subject.controller.setConsent(true)).resolves.toEqual({
      status: 'enabled',
      consent: {
        enabled: true,
        acceptedAtMs: NOW,
        observationWindow: { startMs: NOW, endMs: NOW + 14 * M0B_DAY_MS },
      },
    });
    expect(subject.persisted()).toEqual({
      schemaVersion: 1,
      enabled: true,
      acceptedAtMs: NOW,
      windowStartMs: NOW,
      windowEndMs: NOW + 14 * M0B_DAY_MS,
    });
    await expect(fs.stat(path.join(subject.environment.userDataPath, 'cohort-evidence'))).rejects.toMatchObject({
      code: 'ENOENT',
    });

    await expect(subject.controller.recordShellReturn('missing-capability')).resolves.toEqual({ status: 'recorded' });
    const windows = await fs.readdir(path.join(subject.environment.userDataPath, 'cohort-evidence'));
    expect(windows).toHaveLength(1);
    const eventFiles = await fs.readdir(path.join(subject.environment.userDataPath, 'cohort-evidence', windows[0]));
    expect(eventFiles.filter((entry) => entry.endsWith('.event.json'))).toHaveLength(3);
    const eventText = await Promise.all(
      eventFiles
        .filter((entry) => entry.endsWith('.event.json'))
        .map((entry) =>
          fs.readFile(path.join(subject.environment.userDataPath, 'cohort-evidence', windows[0], entry), 'utf8')
        )
    );
    expect(eventText.join('\n')).not.toMatch(/prompt|message|filename|path|url|toolArgument/i);
    expect(eventText.join('\n')).toContain('missing-capability');
  });

  it('rehydrates valid consent after restart and fails closed on malformed windows', async () => {
    const enabled = {
      schemaVersion: 1,
      enabled: true,
      acceptedAtMs: NOW,
      windowStartMs: NOW,
      windowEndMs: NOW + 14 * M0B_DAY_MS,
    } as const;
    const valid = await fixture(enabled);
    await expect(valid.controller.consentStatus()).resolves.toMatchObject({ enabled: true, acceptedAtMs: NOW });

    const malformed = await fixture({ ...enabled, windowEndMs: enabled.windowEndMs + 1 });
    await expect(malformed.controller.consentStatus()).resolves.toEqual({
      enabled: false,
      acceptedAtMs: null,
      observationWindow: null,
    });
  });

  it('serializes revocation ahead of later event writes and preserves state when persistence fails', async () => {
    const subject = await fixture();
    await subject.controller.setConsent(true);

    const revoked = subject.controller.setConsent(false);
    const afterRevocation = subject.controller.recordShellReturn('reliability');
    await expect(revoked).resolves.toMatchObject({ status: 'disabled' });
    await expect(afterRevocation).resolves.toEqual({ status: 'consent-disabled' });

    vi.mocked(subject.store.set).mockRejectedValueOnce(new Error('disk unavailable'));
    await expect(subject.controller.setConsent(true)).resolves.toEqual({
      status: 'storage-error',
      consent: { enabled: false, acceptedAtMs: null, observationWindow: null },
    });
    await expect(subject.controller.consentStatus()).resolves.toMatchObject({ enabled: false });
  });

  it('exposes unpackaged dogfood eligibility without weakening packaged authority', async () => {
    const subject = await fixture();
    await expect(subject.controller.rolloutStatus()).resolves.toEqual({
      eligible: true,
      stage: 'internal-dogfood',
      source: 'development',
      reason: 'development-build',
    });
  });
});
