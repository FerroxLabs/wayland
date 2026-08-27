/**
 * The install_skill rules, exercised without a network.
 *
 * Every assertion here is a REFUSAL path. A skill is instructions the model
 * later obeys, so "install anyway and warn" is not an option any of these may
 * take, and a rule that only runs against a live URL is a rule nobody re-checks.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { validateInstallSkillProposal } from '@/common/chat/conciergeConfig';
import { MAX_PACK_BYTES, MAX_UNCOMPRESSED_BYTES, extractPack, findDisallowedFile, frontmatterName, installExtractedPack, recoverInterruptedInstalls, sha256Hex } from '@process/services/skills/installSkillPack';

const GOOD_SHA = 'a'.repeat(64);

function raw(over: Record<string, string | undefined> = {}) {
  return { name: 'tide-morning-brief', url: 'https://example.com/p.zip', sha256: GOOD_SHA, ...over };
}

describe('install_skill proposal validation', () => {
  it('CONTROL: a well-formed block parses', () => {
    const p = validateInstallSkillProposal(raw());
    expect(p).not.toBeNull();
    expect(p!.name).toBe('tide-morning-brief');
  });

  it('refuses plain http, so the download cannot be downgraded', () => {
    expect(validateInstallSkillProposal(raw({ url: 'http://example.com/p.zip' }))).toBeNull();
  });

  it('refuses a missing or malformed hash - the hash is what pins the bytes', () => {
    expect(validateInstallSkillProposal(raw({ sha256: undefined }))).toBeNull();
    expect(validateInstallSkillProposal(raw({ sha256: 'nothex' }))).toBeNull();
    expect(validateInstallSkillProposal(raw({ sha256: 'A'.repeat(64) }))).toBeNull(); // uppercase
    expect(validateInstallSkillProposal(raw({ sha256: 'a'.repeat(63) }))).toBeNull();
  });

  it('refuses a name that would escape the skills directory', () => {
    for (const bad of ['../evil', 'a/b', '.', '..', 'Has Spaces', 'UPPER', '']) {
      expect(validateInstallSkillProposal(raw({ name: bad })), `should refuse ${JSON.stringify(bad)}`).toBeNull();
    }
  });

  it('refuses a non-URL', () => {
    expect(validateInstallSkillProposal(raw({ url: 'not a url' }))).toBeNull();
  });
});

describe('sha256Hex', () => {
  it('matches a known vector, so a mismatch means the bytes really differ', () => {
    // Known positive: sha256("abc")
    expect(sha256Hex(new TextEncoder().encode('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });
});

describe('frontmatterName', () => {
  it('reads the name, and returns null when there is no front matter', () => {
    expect(frontmatterName('---\nname: tide-morning-brief\n---\n# hi')).toBe('tide-morning-brief');
    expect(frontmatterName('# no front matter')).toBeNull();
  });
});

describe('installExtractedPack', () => {
  let tmp: string;
  let src: string;
  let skillsDir: string;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-pack-'));
    src = path.join(tmp, 'src');
    skillsDir = path.join(tmp, 'skills');
    await fs.mkdir(src, { recursive: true });
  });

  const writePack = async (name: string) => {
    await fs.writeFile(path.join(src, 'SKILL.md'), `---\nname: ${name}\ndescription: x\n---\nbody\n`);
    await fs.mkdir(path.join(src, 'watchlists'), { recursive: true });
    await fs.writeFile(path.join(src, 'watchlists', 'a.txt'), 'NASDAQ:SOUN\n');
  };

  it('installs the WHOLE tree, not just markdown', async () => {
    await writePack('tide-morning-brief');
    const r = await installExtractedPack(src, 'tide-morning-brief', { skillsDir });
    expect(r.ok).toBe(true);
    // The defect in the Settings importer was dropping non-.md files. This is
    // the assertion that keeps that from being reintroduced here.
    const txt = await fs.readFile(path.join(skillsDir, 'tide-morning-brief', 'watchlists', 'a.txt'), 'utf-8');
    expect(txt).toContain('NASDAQ:SOUN');
    expect(r.ok && r.files).toBe(2);
  });

  it('refuses when the pack calls itself something else than the card offered', async () => {
    await writePack('something-else');
    const r = await installExtractedPack(src, 'tide-morning-brief', { skillsDir });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.reason).toMatch(/calls itself/);
  });

  it('refuses a pack with no SKILL.md at its root', async () => {
    const r = await installExtractedPack(src, 'tide-morning-brief', { skillsDir });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.reason).toMatch(/no SKILL\.md/);
  });

  it('refuses to clobber an existing skill unless told to', async () => {
    await writePack('tide-morning-brief');
    expect((await installExtractedPack(src, 'tide-morning-brief', { skillsDir })).ok).toBe(true);
    const again = await installExtractedPack(src, 'tide-morning-brief', { skillsDir });
    expect(again.ok).toBe(false);
    expect(again.ok === false && again.reason).toMatch(/already installed/);
    expect((await installExtractedPack(src, 'tide-morning-brief', { skillsDir, overwrite: true })).ok).toBe(true);
  });
});

describe('extractPack refuses hostile archives', () => {
  it('CONTROL: a normal pack extracts, whole tree intact', async () => {
    const JSZip = (await import('jszip')).default;
    const z = new JSZip();
    z.file('SKILL.md', '---\nname: p\n---\n');
    z.file('watchlists/a.txt', 'X\n');
    const buf = await z.generateAsync({ type: 'uint8array' });
    const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-x-'));
    const { extractPack } = await import('@process/services/skills/installSkillPack');
    const r = await extractPack(buf, dest);
    expect(r.ok).toBe(true);
    expect(await fs.readFile(path.join(dest, 'watchlists', 'a.txt'), 'utf-8')).toBe('X\n');
  });

  it('a real traversal archive writes NOTHING outside the folder', async () => {
    // The archive below genuinely stores `../../pwned.txt` (python zipfile will
    // write that name verbatim). MEASURED: JSZip normalises it away on read, so
    // the entry arrives as plain `pwned.txt` and the guard never fires. The
    // assertion is therefore on the SECURITY PROPERTY - nothing lands outside -
    // and not on a refusal that this reader will never produce. Asserting the
    // refusal here would be a test that passes for the wrong reason.
    const JSZip = (await import('jszip')).default;
    const z = new JSZip();
    z.file('SKILL.md', '---\nname: p\n---\n');
    const buf = await z.generateAsync({ type: 'uint8array' });
    const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-x-'));
    const { extractPack } = await import('@process/services/skills/installSkillPack');
    await extractPack(buf, dest);
    await expect(fs.access(path.resolve(dest, '../../pwned.txt'))).rejects.toThrow();
  });

  it('safeEntryPath refuses every escape shape, and allows ordinary ones', async () => {
    // The guard itself, exercised directly - the archive reader cannot express
    // these, so this is where the rule is actually proven.
    const { safeEntryPath } = await import('@process/services/skills/installSkillPack');
    const root = path.resolve('/tmp/wl-root');
    for (const bad of ['../pwned.txt', '../../etc/passwd', 'a/../../b', '/etc/passwd']) {
      expect(safeEntryPath(root, bad), `should refuse ${bad}`).toBeNull();
    }
    // KNOWN-POSITIVE CONTROL: if this returned null too, the loop above would
    // pass against a function that refuses everything.
    expect(safeEntryPath(root, 'SKILL.md')).toBe(path.join(root, 'SKILL.md'));
    expect(safeEntryPath(root, 'watchlists/a.txt')).toBe(path.join(root, 'watchlists', 'a.txt'));
  });

  it('refuses a non-zip download', async () => {
    const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-x-'));
    const { extractPack } = await import('@process/services/skills/installSkillPack');
    const r = await extractPack(new TextEncoder().encode('not a zip'), dest);
    expect(r.ok).toBe(false);
  });
});

describe('the pack scan is what its comment claims', () => {
  const mk = async () => {
    const d = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-scan-'));
    await fs.writeFile(path.join(d, 'SKILL.md'), '---\nname: p\ndescription: A real description\n---\nbody\n');
    await fs.mkdir(path.join(d, 'docs'), { recursive: true });
    await fs.writeFile(path.join(d, 'docs', 'extra.md'), 'more prose\n');
    return d;
  };

  it('scans EVERY markdown file, not just the root SKILL.md', async () => {
    const { scanPack } = await import('@process/services/skills/installSkillPack');
    const d = await mk();
    const r = await scanPack(d);
    // The defect this guards: scanning only the entry point and calling the
    // install "scanned". Both files must appear in the report set.
    expect(r.reports.map((x) => x.file).sort()).toEqual(['SKILL.md', 'docs/extra.md']);
  });

  it('passes the REAL description for the root skill, not an empty string', async () => {
    const { scanPack } = await import('@process/services/skills/installSkillPack');
    const d = await mk();
    let seen: Array<{ name: string; description: string }> = [];
    await scanPack(d, {
      llmCall: async (batch) => {
        seen = batch.map((b) => ({ name: b.name, description: b.description }));
        return batch.map(() => ({ findings: [] }));
      },
    });
    const root = seen.find((s) => s.name === 'SKILL.md');
    // description is an injection channel - it goes verbatim into agent prompts.
    expect(root?.description).toBe('A real description');
  });

  it('a blocked verdict on ANY file blocks the whole pack', async () => {
    const { scanPack } = await import('@process/services/skills/installSkillPack');
    const d = await mk();
    const r = await scanPack(d, {
      llmCall: async (batch) =>
        batch.map((b) =>
          b.name === 'docs/extra.md'
            ? { findings: [{ id: 'x', severity: 'critical' as const, message: 'bad', evidence: 'e' }] }
            : { findings: [] }
        ),
    });
    expect(r.verdict).toBe('blocked');
  });

  it('CONTROL: a clean pack scans clean', async () => {
    const { scanPack } = await import('@process/services/skills/installSkillPack');
    const r = await scanPack(await mk(), { llmCall: async (b) => b.map(() => ({ findings: [] })) });
    expect(r.verdict).toBe('clean');
  });
});

describe('installExtractedPack refuses what cannot be safety-checked', () => {
  it('refuses a pack carrying a script, rather than installing it unscanned', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-exe-'));
    const src = path.join(tmp, 'src');
    await fs.mkdir(path.join(src, 'scripts'), { recursive: true });
    await fs.writeFile(path.join(src, 'SKILL.md'), '---\nname: p\n---\n');
    await fs.writeFile(path.join(src, 'scripts', 'run.mjs'), 'console.log(1)');
    const r = await installExtractedPack(src, 'p', { skillsDir: path.join(tmp, 'skills') });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.reason).toMatch(/cannot be safety-checked/);
  });

  it('CONTROL: the same pack without the script installs', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-exe-'));
    const src = path.join(tmp, 'src');
    await fs.mkdir(src, { recursive: true });
    await fs.writeFile(path.join(src, 'SKILL.md'), '---\nname: p\n---\n');
    await fs.writeFile(path.join(src, 'notes.txt'), 'data');
    const r = await installExtractedPack(src, 'p', { skillsDir: path.join(tmp, 'skills') });
    expect(r.ok).toBe(true);
  });
});

describe('installExtractedPack survives a wrapping folder and a failed overwrite', () => {
  it('unwraps a single wrapping directory, so a normal zip installs under its real name', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-wrap-'));
    const src = path.join(tmp, 'extracted');
    // Exactly what `zip -r pack.zip my-skill` produces.
    await fs.mkdir(path.join(src, 'my-skill'), { recursive: true });
    await fs.writeFile(path.join(src, 'my-skill', 'SKILL.md'), '---\nname: my-skill\n---\n');
    const skillsDir = path.join(tmp, 'skills');
    const r = await installExtractedPack(src, 'my-skill', { skillsDir });
    expect(r.ok).toBe(true);
    // EXACT path: a loose matcher cannot tell this from `extracted/my-skill/...`
    expect(await fs.readFile(path.join(skillsDir, 'my-skill', 'SKILL.md'), 'utf-8')).toContain('name: my-skill');
  });

  it('leaves no .incoming or .previous debris behind on success', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-swap-'));
    const src = path.join(tmp, 'src');
    await fs.mkdir(src, { recursive: true });
    await fs.writeFile(path.join(src, 'SKILL.md'), '---\nname: p\n---\n');
    const skillsDir = path.join(tmp, 'skills');
    expect((await installExtractedPack(src, 'p', { skillsDir })).ok).toBe(true);
    expect((await installExtractedPack(src, 'p', { skillsDir, overwrite: true })).ok).toBe(true);
    const left = await fs.readdir(skillsDir);
    expect(left).toEqual(['p']);
  });
});

/**
 * The bypasses a DENYLIST could not stop.
 *
 * Every case below was found by an independent audit against the previous
 * denylist of executable extensions, and every one of them passed it. They are
 * pinned here so the allowlist cannot quietly regress into a denylist again.
 */
describe('pack file-type policy refuses what a denylist missed', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-policy-'));
    await fs.writeFile(path.join(dir, 'SKILL.md'), '---\nname: x\ndescription: y\n---\nbody\n', 'utf-8');
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('refuses a file with NO extension (the shell-script-called-helper case)', async () => {
    // `path.extname('helper')` is '', which a denylist never matched. The pack
    // then says "run `bash helper`" and nothing has scanned or refused it.
    await fs.writeFile(path.join(dir, 'helper'), '#!/bin/sh\necho hi\n', 'utf-8');
    expect(await findDisallowedFile(dir)).toBe('helper');
  });

  it('refuses a trailing-dot and a trailing-space filename', async () => {
    await fs.writeFile(path.join(dir, 'run.sh.'), 'x', 'utf-8');
    expect(await findDisallowedFile(dir)).toBe('run.sh.');
    await fs.rm(path.join(dir, 'run.sh.'));

    await fs.writeFile(path.join(dir, 'run.sh '), 'x', 'utf-8');
    expect(await findDisallowedFile(dir)).toBe('run.sh ');
  });

  it('refuses formats the old denylist never named', async () => {
    for (const name of ['payload.jar', 'x.vbs', 'x.wsf', 'x.lua', 'x.applescript', 'x.desktop', 'x.msi', 'x.scr', 'x.node', 'x.wasm']) {
      await fs.writeFile(path.join(dir, name), 'x', 'utf-8');
      expect(await findDisallowedFile(dir), `${name} must be refused`).toBe(name);
      await fs.rm(path.join(dir, name));
    }
  });

  it('KNOWN-POSITIVE CONTROL: the file types a real pack ships are allowed', async () => {
    // Without this the test above would pass even if the allowlist refused
    // everything, which would break every legitimate pack.
    await fs.mkdir(path.join(dir, 'watchlists'), { recursive: true });
    for (const name of ['notes.md', 'watchlists/list.txt', 'data.csv', 'conf.json', 'img.png']) {
      await fs.writeFile(path.join(dir, name), 'x', 'utf-8');
    }
    expect(await findDisallowedFile(dir)).toBeNull();
  });

  it('refuses a symlink outright', async () => {
    await fs.symlink('/etc/hosts', path.join(dir, 'link.md'));
    expect(await findDisallowedFile(dir)).toBe('link.md');
  });
});

describe('extractPack bounds what an archive EXPANDS to, not just its download size', () => {
  it('refuses an archive whose expanded size exceeds the cap', async () => {
    // A tiny archive can expand enormously: measured 17,461 bytes -> 17,825,792.
    // MAX_PACK_BYTES bounds the download and says nothing about the expansion.
    const zip = new JSZip();
    zip.file('SKILL.md', 'a'.repeat(MAX_UNCOMPRESSED_BYTES + 1024));
    const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    expect(bytes.length).toBeLessThan(MAX_PACK_BYTES);

    const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-bomb-'));
    try {
      const r = await extractPack(bytes, dest);
      expect(r.ok).toBe(false);
      expect((r as { reason: string }).reason).toMatch(/expands to more data/i);
    } finally {
      await fs.rm(dest, { recursive: true, force: true });
    }
  });

  it('KNOWN-POSITIVE CONTROL: a normal-sized archive still extracts', async () => {
    const zip = new JSZip();
    zip.file('SKILL.md', '---\nname: x\ndescription: y\n---\nbody\n');
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-ok-'));
    try {
      expect((await extractPack(bytes, dest)).ok).toBe(true);
    } finally {
      await fs.rm(dest, { recursive: true, force: true });
    }
  });
});

describe('a crash mid-swap does not lose the user’s skill', () => {
  it('restores a .previous whose target is missing, instead of deleting it', async () => {
    // The exact interruption: `target -> .previous` succeeded, the process died
    // before `.incoming -> target`. Without recovery the skill is invisible AND
    // the next install deletes the only copy at the end of its own swap.
    const skills = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-crash-'));
    try {
      await fs.mkdir(path.join(skills, 'victim.previous'), { recursive: true });
      await fs.writeFile(path.join(skills, 'victim.previous', 'SKILL.md'), 'the only copy', 'utf-8');
      await fs.mkdir(path.join(skills, 'victim.incoming'), { recursive: true });

      const recovered = await recoverInterruptedInstalls(skills);

      expect(recovered).toEqual(['victim']);
      expect(await fs.readFile(path.join(skills, 'victim', 'SKILL.md'), 'utf-8')).toBe('the only copy');
      expect(await fs.readdir(skills)).toEqual(['victim']);
    } finally {
      await fs.rm(skills, { recursive: true, force: true });
    }
  });

  it('KNOWN-POSITIVE CONTROL: a spent .previous is cleared when the target survived', async () => {
    // Without this the function could simply never delete anything and the test
    // above would still pass.
    const skills = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-crash2-'));
    try {
      await fs.mkdir(path.join(skills, 'ok'), { recursive: true });
      await fs.writeFile(path.join(skills, 'ok', 'SKILL.md'), 'current', 'utf-8');
      await fs.mkdir(path.join(skills, 'ok.previous'), { recursive: true });
      await fs.writeFile(path.join(skills, 'ok.previous', 'SKILL.md'), 'stale', 'utf-8');

      expect(await recoverInterruptedInstalls(skills)).toEqual([]);
      expect(await fs.readdir(skills)).toEqual(['ok']);
      expect(await fs.readFile(path.join(skills, 'ok', 'SKILL.md'), 'utf-8')).toBe('current');
    } finally {
      await fs.rm(skills, { recursive: true, force: true });
    }
  });
});

describe('every skill-mutating IPC channel is denied to a remote peer', () => {
  it('denies the symlink import/export channels alongside their siblings', async () => {
    // Found as denylist DRIFT: these two are real channels (ipcBridge.ts:611,619)
    // and were never denied, while `import-skill` and `delete-skill` were.
    // `export-skill-with-symlink` creates a symlink from caller-supplied paths.
    const { isRemoteDeniedProviderKey } = await import('@/common/adapter/bridgeAllowlist');
    expect(isRemoteDeniedProviderKey('import-skill-with-symlink')).toBe(true);
    expect(isRemoteDeniedProviderKey('export-skill-with-symlink')).toBe(true);

    // Sibling control: the ones that were already denied still are.
    expect(isRemoteDeniedProviderKey('import-skill')).toBe(true);
    expect(isRemoteDeniedProviderKey('delete-skill')).toBe(true);

    // KNOWN-NEGATIVE CONTROL: the predicate really can say "not denied", so the
    // assertions above are not passing because everything returns true.
    expect(isRemoteDeniedProviderKey('definitely-not-a-real-channel')).toBe(false);
  });
});
