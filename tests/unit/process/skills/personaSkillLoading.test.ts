/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A persona must never tell the model to READ a skill's `SKILL.md` by its
 * workspace-relative path.
 *
 * The engine's file reader takes ABSOLUTE paths only. Handed
 * `.wayland-core/skills/<name>/SKILL.md` it answers
 * `Refused to read ...: path must be absolute`, and that refusal is
 * indistinguishable from a missing file. Measured live, twice in a row, on
 * wayland-core v0.13.9: Smart Trader was told "that skill is a FILE IN YOUR
 * WORKSPACE at `.wayland-core/skills/tvcontrol-setup/SKILL.md`. Read that file",
 * generalised it to the freshly imported `tide-morning-brief`, got the refusal,
 * and told the user "the skill file is not present in this workspace" - having
 * been handed a correctly installed, correctly enabled skill whose files were
 * sitting in the workspace the whole time.
 *
 * The engine ships the mechanism that has no path in it at all: a `Skill` tool
 * that "invokes a named skill by name". Personas must use it.
 *
 * The SHELL is the exception and stays as it is: `cd .wayland-core/skills/<x>`
 * runs with the workspace as its working directory, so a relative path resolves
 * there. This test therefore targets `SKILL.md` reads specifically, not the
 * `.wayland-core/skills/` prefix in general.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ASSISTANT_DIR = path.resolve(__dirname, '../../../../src/process/resources/assistant');

const personaFiles = (): string[] => {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.name.endsWith('.md')) out.push(f);
    }
  };
  walk(ASSISTANT_DIR);
  return out;
};

describe('bundled personas load skills the way the engine supports', () => {
  it('has personas to check, so a green result is never vacuous', () => {
    expect(personaFiles().length).toBeGreaterThan(0);
  });

  it.each(personaFiles().map((f) => [path.relative(ASSISTANT_DIR, f), f] as const))(
    '%s never tells the model to read a workspace-relative SKILL.md',
    (_name, file) => {
      const body = fs.readFileSync(file, 'utf8');
      // A relative `.wayland-core/skills/<x>/SKILL.md` reference - i.e. one not
      // preceded by a path root - is the exact string the reader refuses.
      const offenders = [...body.matchAll(/(.{0,60})\.wayland-core\/skills\/[^\s`'"]*SKILL\.md/g)]
        .filter((m) => !/[/~]$/.test(m[1]))
        .map((m) => m[0].trim());
      expect(offenders).toEqual([]);
    }
  );

  it('Smart Trader names the Skill tool as the way to load its rules', () => {
    const body = fs.readFileSync(path.join(ASSISTANT_DIR, 'smart-trader/smart-trader.md'), 'utf8');
    for (const skill of ['rebel-trader-rules', 'tvcontrol-setup', 'morning-prep']) {
      expect(body).toMatch(new RegExp(`\`Skill\` tool[^\\n]*\\n?[^\\n]*${skill}|${skill}[^\\n]*\`Skill\` tool`));
    }
  });
});
