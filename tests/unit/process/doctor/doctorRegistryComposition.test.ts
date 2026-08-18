/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The COMPOSITION ROOT, tested rather than assumed.
 *
 * Every other Doctor test injects its dependencies, which is what makes the checks
 * testable and is also a blind spot: `appManagedWorkspaceBase` could be bound to
 * `null` in `registry.ts` and the whole 169-test battery stayed green [executed].
 * `null` is a legal, handled value that means "withhold nothing", so that mutant is
 * a silent fail-open on the ONLY production wiring of the withholding fix -
 * `workspaceInventory` makes the field required precisely because "a caller that
 * forgets it re-opens the leak silently", and the type enforces presence while
 * nothing enforced the value.
 *
 * So this file imports the real `buildDoctorChecks` and runs the real
 * `defaultWorkspaceBaseDir` behind a mocked Electron `app`. It is the only Doctor
 * test that pulls the live singleton graph in, and that is the point.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { DoctorCheck } from '@process/doctor/types';

/** Base the mocked `app.getPath('documents')` reports. Assigned in `beforeAll`. */
let documentsDir = '';
/** Flipped by the memoization test to make the FIRST electron read fail. */
let failNextGetPath = false;

vi.mock('electron', () => ({
  app: {
    getPath: (): string => {
      if (failNextGetPath) {
        failNextGetPath = false;
        throw new Error('uv_os_get_documents failed');
      }
      return documentsDir;
    },
    runningUnderARM64Translation: false,
  },
}));

/**
 * A BARE credential used as a project NAME. A project's default workspace is
 * `<base>/<sanitised name>` (`allocateProjectWorkspace`), so the name IS the path's
 * leaf, and `redactSecrets` returns a value of this shape untouched.
 */
const BARE_SECRET = 'f0e9d8c7b6a5948372615041302f1e0d';

vi.mock('@process/services/projectServiceSingleton', () => ({
  projectServiceSingleton: {
    listProjects: async () => [
      // Under the app's own base dir, and deliberately NOT created on disk so the
      // drift check reports it and renders the path.
      { id: 'proj-1', name: BARE_SECRET, workspace: join(documentsDir, 'Wayland', BARE_SECRET) },
    ],
  },
}));

vi.mock('@process/services/conversationServiceSingleton', () => ({
  conversationServiceSingleton: { listAllConversations: async () => [] },
}));

describe('buildDoctorChecks — the composition root really supplies the workspace base', () => {
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'doctor-registry-'));
    documentsDir = root;
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  const drift = async (): Promise<DoctorCheck> => {
    const { buildDoctorChecks } = await import('@process/doctor/registry');
    const check = buildDoctorChecks().find((entry) => entry.id === 'workspace.drift');
    expect(check, 'workspace.drift must exist in the registry').toBeDefined();
    return check as DoctorCheck;
  };

  it('KNOWN POSITIVE: the real base resolver returns the mocked documents dir', async () => {
    // Without this the assertions below could pass because the base failed to
    // resolve to anything, which is the very fail-open they are guarding.
    const { defaultWorkspaceBaseDir } = await import('@process/services/projectWorkspace');
    expect(await defaultWorkspaceBaseDir()).toBe(join(root, 'Wayland'));
  });

  it('withholds the app-derived folder name in the wired workspace.drift check', async () => {
    const outcome = await (await drift()).run();

    expect(outcome.status).toBe('fail');
    // THE MUTANT KILLER: with `appManagedWorkspaceBase: null` this line is the
    // project name verbatim.
    expect(outcome.detail).not.toContain(BARE_SECRET);
    expect(outcome.detail).toContain('(folder name withheld)');
    // NOT VACUOUS: the base dir - the actionable half - still reaches the user, and
    // the row still names which project by its app-generated id.
    expect(outcome.detail).toContain(join(root, 'Wayland'));
    expect(outcome.detail).toContain('Project proj-1');
  });

  it('KNOWN POSITIVE: nothing masks a bare 32-hex path leaf, so the fix is structural', async () => {
    const { redactSecrets } = await import('@process/utils/secretRedaction');
    expect(redactSecrets(join(root, 'Wayland', BARE_SECRET))).toContain(BARE_SECRET);
  });
});

describe('defaultWorkspaceBaseDir — a transient failure must not be cached forever', () => {
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'doctor-memo-'));
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  /**
   * The memo used to cache the PROMISE unconditionally, so a single rejected
   * electron read was cached for the process lifetime: every later call rejected,
   * `registry.ts` mapped that to `null`, and the withholding above was disabled
   * permanently rather than for one run. `app.getPath` is not throw-free, so this
   * is a real degradation path and not merely a hostile one.
   */
  it('retries after a rejected resolve instead of failing open for the process lifetime', async () => {
    vi.resetModules();
    documentsDir = root;
    failNextGetPath = true;

    const { defaultWorkspaceBaseDir } = await import('@process/services/projectWorkspace');
    // KNOWN POSITIVE: the first call really does reject, so the retry below is a
    // retry and not a first attempt.
    await expect(defaultWorkspaceBaseDir()).rejects.toThrow('uv_os_get_documents failed');
    // And the very next call succeeds.
    expect(await defaultWorkspaceBaseDir()).toBe(join(root, 'Wayland'));
  });
});
