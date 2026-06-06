/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Unit tests for the CLI skill discovery (2026-05-21, step #4 of the
// four-source split). Confirms (a) each valid `<dir>/SKILL.md` becomes
// a SkillIndexEntry tagged source='cli-discovered' with the right
// sourceLabel, (b) missing roots and missing SKILL.md files are skipped
// silently, (c) malformed frontmatter is rejected, (d) the function is
// idempotent across calls, and (e) the feature-flag check is bypassed
// via the `force` option (production callers respect the user's opt-in).

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import {
  loadCliSkills,
  __resetCliSkillDiscoveryForTests,
} from '@process/services/skills/CliSkillDiscovery';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';

type CliRoot = {
  path: string;
  sourceLabel: 'Claude Code' | 'Codex' | 'Gemini CLI';
};

function makeRoot(label: 'Claude Code' | 'Codex' | 'Gemini CLI'): CliRoot {
  const dir = mkdtempSync(path.join(tmpdir(), `cli-skill-${label.replace(/\s+/g, '-')}-`));
  return { path: dir, sourceLabel: label };
}

function stageSkill(root: CliRoot, dirName: string, frontmatterBody: string): void {
  const skillDir = path.join(root.path, dirName);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(path.join(skillDir, 'SKILL.md'), frontmatterBody, 'utf-8');
}

function newLib(): SkillLibrary {
  // Resource dir is fake; readFile returns an empty index so `load()` resolves
  // without hitting disk. CLI discovery uses absolute paths exclusively, so
  // the resourceDir never matters here.
  return SkillLibrary.getInstance({
    resourceDir: '/nonexistent',
    readFile: async () => '[]',
  });
}

describe('loadCliSkills', () => {
  const tempRoots: CliRoot[] = [];

  beforeEach(() => {
    __resetCliSkillDiscoveryForTests();
    SkillLibrary.resetInstance();
  });

  afterEach(() => {
    for (const r of tempRoots) {
      rmSync(r.path, { recursive: true, force: true });
    }
    tempRoots.length = 0;
  });

  it('registers one entry per <dir>/SKILL.md with correct source + sourceLabel', async () => {
    const claudeRoot = makeRoot('Claude Code');
    tempRoots.push(claudeRoot);
    stageSkill(
      claudeRoot,
      'gsd-audit-milestone',
      '---\nname: gsd-audit-milestone\ndescription: "Audit milestone completion before archiving"\n---\nbody',
    );
    stageSkill(
      claudeRoot,
      'gsd-execute-phase',
      '---\nname: gsd-execute-phase\ndescription: "Execute phase plan with atomic commits"\n---\nbody',
    );

    const total = await loadCliSkills({ force: true, rootsOverride: [claudeRoot] });
    expect(total).toBe(2);

    const lib = newLib();
    const entries = await lib.list({ source: 'cli-discovered' });
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.sourceLabel === 'Claude Code')).toBe(true);
    expect(entries.every((e) => e.type === 'skill')).toBe(true);
    expect(entries.map((e) => e.name).sort()).toEqual(['gsd-audit-milestone', 'gsd-execute-phase']);
  });

  it('skips roots that do not exist on disk (CLI not installed)', async () => {
    const total = await loadCliSkills({
      force: true,
      rootsOverride: [{ path: '/var/empty/no-such-cli-skills', sourceLabel: 'Gemini CLI' }],
    });
    expect(total).toBe(0);

    const lib = newLib();
    expect(await lib.list({ source: 'cli-discovered' })).toHaveLength(0);
  });

  it('skips child entries that lack a SKILL.md (loose files or wrong-shape dirs)', async () => {
    const codexRoot = makeRoot('Codex');
    tempRoots.push(codexRoot);
    // Loose file at the root - not a directory, must be skipped.
    writeFileSync(path.join(codexRoot.path, 'not-a-skill.txt'), 'noise', 'utf-8');
    // Directory with no SKILL.md - must be skipped silently.
    mkdirSync(path.join(codexRoot.path, 'half-baked'), { recursive: true });
    // Valid skill - should be the only one registered.
    stageSkill(
      codexRoot,
      'ijfw-commit',
      '---\nname: ijfw-commit\ndescription: "Commit with IJFW conventions"\n---\nbody',
    );

    const total = await loadCliSkills({ force: true, rootsOverride: [codexRoot] });
    expect(total).toBe(1);
    const lib = newLib();
    const entries = await lib.list({ source: 'cli-discovered' });
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('ijfw-commit');
    expect(entries[0].sourceLabel).toBe('Codex');
  });

  it('rejects malformed frontmatter (no --- block, missing name) without throwing', async () => {
    const root = makeRoot('Claude Code');
    tempRoots.push(root);
    stageSkill(root, 'no-frontmatter', 'just markdown body, no frontmatter block');
    stageSkill(root, 'missing-name', '---\ndescription: "no name field"\n---\nbody');
    stageSkill(
      root,
      'valid',
      '---\nname: valid\ndescription: "this one is fine"\n---\nbody',
    );

    const total = await loadCliSkills({ force: true, rootsOverride: [root] });
    expect(total).toBe(1);
    const lib = newLib();
    const entries = await lib.list({ source: 'cli-discovered' });
    expect(entries.map((e) => e.name)).toEqual(['valid']);
  });

  it('aggregates across multiple CLI roots with distinct sourceLabels', async () => {
    const claude = makeRoot('Claude Code');
    const codex = makeRoot('Codex');
    tempRoots.push(claude, codex);
    stageSkill(claude, 'c1', '---\nname: c1\ndescription: ""\n---\nbody');
    stageSkill(codex, 'x1', '---\nname: x1\ndescription: ""\n---\nbody');
    stageSkill(codex, 'x2', '---\nname: x2\ndescription: ""\n---\nbody');

    const total = await loadCliSkills({ force: true, rootsOverride: [claude, codex] });
    expect(total).toBe(3);

    const lib = newLib();
    const all = await lib.list({ source: 'cli-discovered' });
    const byLabel = new Map<string, number>();
    for (const e of all) {
      byLabel.set(e.sourceLabel ?? '', (byLabel.get(e.sourceLabel ?? '') ?? 0) + 1);
    }
    expect(byLabel.get('Claude Code')).toBe(1);
    expect(byLabel.get('Codex')).toBe(2);
  });

  it('is idempotent - second call returns 0 and does not re-register', async () => {
    const root = makeRoot('Claude Code');
    tempRoots.push(root);
    stageSkill(root, 'one', '---\nname: one\ndescription: ""\n---\nbody');

    const first = await loadCliSkills({ force: true, rootsOverride: [root] });
    const second = await loadCliSkills({ force: true, rootsOverride: [root] });
    expect(first).toBe(1);
    expect(second).toBe(0);

    const lib = newLib();
    expect(await lib.list({ source: 'cli-discovered' })).toHaveLength(1);
  });

  it('produces absolute path values pointing at the staged SKILL.md', async () => {
    const root = makeRoot('Claude Code');
    tempRoots.push(root);
    stageSkill(root, 'pathed', '---\nname: pathed\ndescription: "body check"\n---\n# body content');

    await loadCliSkills({ force: true, rootsOverride: [root] });
    const lib = newLib();
    const entries = await lib.list({ source: 'cli-discovered' });
    expect(entries[0].path).toBe(path.join(root.path, 'pathed', 'SKILL.md'));

    // loadBody must resolve through the absolute path (not via resourceDir).
    // Force a real fs read for the absolute body path.
    SkillLibrary.resetInstance();
    __resetCliSkillDiscoveryForTests();
    const realLib = SkillLibrary.getInstance({
      resourceDir: '/nonexistent',
      readFile: async (p) => {
        if (p === path.join('/nonexistent', 'index.json')) return '[]';
        return (await import('fs/promises')).readFile(p, 'utf-8');
      },
    });
    await loadCliSkills({ force: true, rootsOverride: [root] });
    const body = await realLib.loadBody('pathed');
    expect(body).toContain('# body content');
  });
});
