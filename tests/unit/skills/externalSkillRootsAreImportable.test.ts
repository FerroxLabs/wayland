/**
 * The Skills picker must never offer a skill it will then refuse to install.
 *
 * SHIPPED DEFECT (0.12.6 and earlier, found by driving a packaged build):
 * `detectAndCountExternalSkills` enumerated five well-known skill directories,
 * but none of them was an authorized root, so `gateSkillPath` refused every
 * import from them. The picker row flipped to "Added" and the assistant's skill
 * count incremented while `<userData>/config/skills` stayed empty and the save
 * aborted - the user saw a success shape and an error toast at the same time.
 *
 * This test pins the invariant that closes it: every directory the picker
 * enumerates is a directory the importer is allowed to read.
 */
import os from 'node:os';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { externalSkillRoots } from '@process/bridge/fsBridge';
import { confinePath, registerAuthorizedRoot } from '@process/bridge/pathConfinement';

describe('every enumerated external skill root is importable', () => {
  const roots = externalSkillRoots();

  it('CONTROL: the root list is real, and confinePath can still say no', async () => {
    // A zero-length list, or a confinePath that authorized everything, would
    // make the assertion below pass while proving nothing.
    expect(roots.length).toBeGreaterThanOrEqual(5);
    expect(await confinePath('/etc/passwd')).toBeNull();
  });

  it('names the five well-known skill directories, home-relative', () => {
    const home = os.homedir();
    expect(roots.map((r) => r.path)).toEqual([
      path.join(home, '.agents', 'skills'),
      path.join(home, '.gemini', 'skills'),
      path.join(home, '.claude', 'skills'),
      path.join(home, '.config', 'opencode', 'skills'),
      path.join(home, '.opencode', 'skills'),
    ]);
  });

  it('every enumerated root passes the same gate the importer applies', async () => {
    // initFsBridge() registers these at startup; register here so the unit under
    // test is the ROOT LIST, not the bridge's construction order.
    for (const root of roots) registerAuthorizedRoot(root.path);

    const refused: string[] = [];
    for (const root of roots) {
      const child = path.join(root.path, 'some-skill');
      if ((await confinePath(child)) === null) refused.push(child);
    }
    expect(refused, 'the picker offers these; the importer must accept them').toEqual([]);
  });

  it('authorizing the roots does NOT authorize the home directory itself', async () => {
    // The fix must not widen to "anything under ~". A sibling dotfile directory
    // that holds credentials must still be refused.
    for (const root of roots) registerAuthorizedRoot(root.path);
    expect(await confinePath(path.join(os.homedir(), '.ssh', 'id_rsa'))).toBeNull();
    expect(await confinePath(path.join(os.homedir(), '.aws', 'credentials'))).toBeNull();
  });
});
