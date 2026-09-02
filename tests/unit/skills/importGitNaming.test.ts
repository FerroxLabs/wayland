/**
 * A git import installed under the name of the TEMP DIRECTORY it was cloned into.
 *
 * `_copyAndScan` takes the installed skill name from `path.basename(srcDir)`,
 * and `importGit` cloned straight into the `mkdtemp` root - so a repo landed as
 * `wayland-git-import-Ab3xYz`: unrecognisable in the picker, and different on
 * every retry, which also meant the "already installed" collision guard could
 * never fire for a repo imported twice. `importZip` did not have this problem
 * because it unwraps first; the two paths disagreed.
 *
 * The collision guard is what these tests read the name through. It throws
 * naming the basename, before any scan or register runs, so the assertion is on
 * the real derivation rather than on a re-implementation of it.
 */
import { describe, it, expect, vi } from 'vitest';

import { SkillImport, repoNameFromGitUrl, type SkillImportIo } from '@process/services/skills/SkillImport';

/** An IO that clones nothing and reports the destination as already taken. */
function ioReporting(cloned: { path?: string }, tree: string[] = ['SKILL.md']): SkillImportIo {
  return {
    lstat: vi.fn(async () => ({ isSymbolicLink: () => false, isDirectory: () => true }) as never),
    exists: vi.fn(async () => true), // force the collision throw, which names the basename
    readdir: vi.fn(async () => tree as never),
    readFile: vi.fn(async () => '' as never),
    copyFile: vi.fn(async () => {}),
    mkdir: vi.fn(async () => {}),
    writeFile: vi.fn(async () => {}),
    gitClone: vi.fn(async (_url: string, destDir: string) => {
      cloned.path = destDir;
    }),
    unzip: vi.fn(async () => []),
    mkdtemp: vi.fn(async (prefix: string) => `/tmp/${prefix}XXXX`),
    rmdir: vi.fn(async () => {}),
  };
}

describe('repoNameFromGitUrl', () => {
  it.each([
    ['https://github.com/org/my-skill.git', 'my-skill'],
    ['https://github.com/org/my-skill', 'my-skill'],
    ['https://github.com/org/my-skill/', 'my-skill'],
    ['git@github.com:org/my-skill.git', 'my-skill'],
    ['ssh://git@host/org/My.Skill_2.git', 'My.Skill_2'],
  ])('%s -> %s', (url, expected) => {
    expect(repoNameFromGitUrl(url)).toBe(expected);
  });

  it('refuses to let a URL steer the destination', () => {
    // Nothing that is not a plain name may become a directory component.
    expect(repoNameFromGitUrl('https://host/org/..')).toBe('git-import');
    expect(repoNameFromGitUrl('https://host/org/.')).toBe('git-import');
    expect(repoNameFromGitUrl('https://host/org/a b')).toBe('git-import');
    expect(repoNameFromGitUrl('https://host/org/x/../../etc')).toBe('etc'); // a plain name, not a path
    // A degenerate URL may yield an odd but HARMLESS name. The property under
    // test is that whatever comes back is a single plain directory component.
    for (const u of ['https://host/', 'https://host', 'git@host:', '']) {
      expect(repoNameFromGitUrl(u)).toMatch(/^[A-Za-z0-9._-]+$/);
      expect(repoNameFromGitUrl(u)).not.toMatch(/^\.+$/);
    }
  });
});

describe('importGit names the skill after the repo', () => {
  it('clones one level down, into a directory named for the repo', async () => {
    const cloned: { path?: string } = {};
    const importer = new SkillImport(
      ioReporting(cloned),
      undefined,
      async () => null,
      () => '/skills'
    );

    await expect(importer.importGit('https://github.com/org/my-skill.git')).rejects.toThrow(
      /a skill named "my-skill" is already installed/
    );
    expect(cloned.path).toBe('/tmp/wayland-git-import-XXXX/my-skill');
  });

  it('never installs under the temp directory name', async () => {
    const cloned: { path?: string } = {};
    const importer = new SkillImport(
      ioReporting(cloned),
      undefined,
      async () => null,
      () => '/skills'
    );

    await expect(importer.importGit('https://github.com/org/my-skill.git')).rejects.toThrow(/already installed/);
    // The exact regression: the name used to be the mkdtemp basename.
    await expect(importer.importGit('https://github.com/org/my-skill.git')).rejects.not.toThrow(/wayland-git-import/);
  });

  it('unwraps a single wrapping folder, exactly as the zip path does', async () => {
    // A repo whose root holds `inner/` and no SKILL.md installs `inner`, not the
    // clone directory - otherwise the wrapper installs and the skill inside it
    // is lost.
    const cloned: { path?: string } = {};
    const io = ioReporting(cloned, ['inner']);
    const importer = new SkillImport(
      io,
      undefined,
      async () => null,
      () => '/skills'
    );

    await expect(importer.importGit('https://github.com/org/wrapper.git')).rejects.toThrow(
      /a skill named "inner" is already installed/
    );
  });

  it('still refuses a disallowed scheme before cloning anything', async () => {
    const cloned: { path?: string } = {};
    const io = ioReporting(cloned);
    const importer = new SkillImport(
      io,
      undefined,
      async () => null,
      () => '/skills'
    );

    await expect(importer.importGit('file:///etc/passwd')).rejects.toThrow(/disallowed scheme/);
    expect(io.gitClone).not.toHaveBeenCalled();
  });
});
