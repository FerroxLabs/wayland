/**
 * WIRING, in its own file on purpose.
 *
 * `authorizedRoots` is module-level state, so a test that registers the roots
 * itself proves only that the mechanism works - a mutation run showed exactly
 * that: deleting the startup loop from `initFsBridge` left the mechanism test
 * green. Vitest isolates the module registry per FILE, so this file gets a
 * pristine confinement set and can assert the thing that actually matters:
 * booting the bridge is what makes the picker's directories importable.
 */
import os from 'node:os';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { externalSkillRoots, initFsBridge } from '@process/bridge/fsBridge';
import { confinePath } from '@process/bridge/pathConfinement';

describe('initFsBridge authorizes what the Skills picker enumerates', () => {
  it('refuses a picker root BEFORE the bridge boots, accepts it after', async () => {
    const probe = path.join(externalSkillRoots()[2].path, 'some-skill'); // ~/.claude/skills
    // Known-positive control on the method: if confinePath authorized everything
    // this test could not tell a fix from a regression.
    expect(await confinePath('/etc/passwd')).toBeNull();

    const before = await confinePath(probe);
    initFsBridge();
    const after = await confinePath(probe);

    expect(before, 'nothing should authorize this root before boot').toBeNull();
    expect(after, 'initFsBridge must authorize every enumerated root').not.toBeNull();
  });
});
