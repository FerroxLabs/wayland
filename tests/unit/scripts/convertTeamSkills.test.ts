/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
// @ts-expect-error - .mjs script has no type declarations
import { buildFrontmatter, convertTeamBundle, inferCategory, toKebab } from '../../../scripts/convert-team-bundle.mjs';

describe('toKebab', () => {
  it('lowercases and dash-separates words', () => {
    expect(toKebab('My Skill Name')).toBe('my-skill-name');
  });

  it('strips leading and trailing dashes', () => {
    expect(toKebab('  Hello!  ')).toBe('hello');
  });

  it('collapses runs of non-alphanumeric characters', () => {
    expect(toKebab('a-b/c')).toBe('a-b-c');
  });
});

describe('inferCategory', () => {
  it('extracts the second segment from skills/<cat>/<slug>.md', () => {
    expect(inferCategory('skills/devops/setup.md')).toBe('devops');
  });

  it('returns general when the prefix is not "skills"', () => {
    expect(inferCategory('something/else.md')).toBe('general');
  });

  it('returns general when the path has fewer than three segments', () => {
    expect(inferCategory('skills/foo.md')).toBe('general');
  });

  it('handles deeper paths by taking the second segment', () => {
    expect(inferCategory('skills/research/sub/x.md')).toBe('research');
  });
});

describe('buildFrontmatter', () => {
  it('emits YAML stamping name, description, source=team, category, and security', () => {
    const fm = buildFrontmatter({ name: 'Foo Bar', description: 'Does foo.' }, 'devops');
    expect(fm).toContain("name: 'Foo Bar'");
    expect(fm).toContain("description: 'Does foo.'");
    expect(fm).toContain("source: 'team'");
    expect(fm).toContain("category: 'devops'");
    expect(fm).toContain("verdict: 'unscanned'");
    expect(fm).toContain('findings: []');
    expect(fm).toContain('scannerVersion: 0');
    expect(fm.startsWith('---')).toBe(true);
    expect(fm.endsWith('---')).toBe(true);
  });

  it('escapes single quotes by doubling them (YAML single-quoted style)', () => {
    const fm = buildFrontmatter({ name: "I'm", description: "it's" }, 'general');
    expect(fm).toContain("name: 'I''m'");
    expect(fm).toContain("description: 'it''s'");
  });
});

// convertTeamBundle builds each body path with `path.resolve(teamsRoot, entry.file)`,
// so the fixture Map below is keyed with the SAME `resolve(base, entry.file)`.
// This matters on win32: `'/fake/teams'` is drive-relative there, so `resolve`
// prepends the CWD drive (`D:\fake\teams\...`) while `join` would not (`\fake\teams\...`),
// and the keys must match prod exactly. On posix the base is absolute so resolve
// and join agree. Runs on windows as well as posix - no skip.
describe('convertTeamBundle', () => {
  let outDir: string;

  beforeEach(() => {
    outDir = mkdtempSync(join(tmpdir(), 'wayland-team-skills-'));
  });

  afterEach(() => {
    rmSync(outDir, { recursive: true, force: true });
  });

  it('writes one SKILL.md per entry with the canonical structure', () => {
    const entries = [
      { name: 'Setup Dev', description: 'Bootstrap a dev env.', file: 'skills/devops/setup.md' },
      { name: 'Write Spec', description: 'Author a spec.', file: 'skills/research/spec.md' },
      { name: 'Ship It', description: 'Release flow.', file: 'skills/devops/ship.md' },
    ];
    const bodies = new Map<string, string>([
      [resolve('/fake/teams', 'skills/devops/setup.md'), '# Setup\n\nDo the thing.'],
      [resolve('/fake/teams', 'skills/research/spec.md'), '# Spec\n\nWrite it well.'],
      [resolve('/fake/teams', 'skills/devops/ship.md'), '# Ship\n\nGo go go.'],
    ]);
    const readBody = (p: string): string => {
      const v = bodies.get(p);
      if (!v) throw new Error(`fixture missing: ${p}`);
      return v;
    };

    const result = convertTeamBundle(entries, '/fake/teams', outDir, { readBody });

    expect(result.count).toBe(3);
    expect(existsSync(join(outDir, 'setup-dev', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(outDir, 'write-spec', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(outDir, 'ship-it', 'SKILL.md'))).toBe(true);

    const setup = readFileSync(join(outDir, 'setup-dev', 'SKILL.md'), 'utf8');
    expect(setup).toContain("name: 'Setup Dev'");
    expect(setup).toContain("category: 'devops'");
    expect(setup).toContain("source: 'team'");
    expect(setup).toContain('Do the thing.');
  });

  it('is idempotent - re-running produces identical output', () => {
    const entries = [{ name: 'X', description: 'x', file: 'skills/general/x.md' }];
    const readBody = (): string => '# X\n\nbody';

    convertTeamBundle(entries, '/fake', outDir, { readBody });
    const first = readFileSync(join(outDir, 'x', 'SKILL.md'), 'utf8');

    convertTeamBundle(entries, '/fake', outDir, { readBody });
    const second = readFileSync(join(outDir, 'x', 'SKILL.md'), 'utf8');

    expect(second).toBe(first);
  });

  it('throws when a body cannot be read', () => {
    const entries = [{ name: 'Missing', description: 'm', file: 'skills/devops/missing.md' }];
    const readBody = (): string => {
      throw new Error('ENOENT');
    };
    expect(() => convertTeamBundle(entries, '/fake', outDir, { readBody })).toThrow(/Cannot read body/);
  });

  it('throws when a body is empty or whitespace-only', () => {
    const entries = [{ name: 'Empty', description: 'e', file: 'skills/devops/empty.md' }];
    const readBody = (): string => '   ';
    expect(() => convertTeamBundle(entries, '/fake', outDir, { readBody })).toThrow(/Empty body/);
  });
});
