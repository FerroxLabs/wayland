/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';

/**
 * Ignition pins six always-on experts and instructs itself to reach for the
 * pinned expert before doing that specialist work, and to work to its standard.
 * That only means something if the bodies contain a standard.
 *
 * Three of the six were generic scaffolds (#609): one template with the skill's
 * own name find-and-replaced into it, an empty "When to Use" heading, and a
 * Process step reading "Analyze the situation ... relevant to <skill name>".
 * A body like that instructs the model to do the job well, which is not
 * instruction.
 *
 * This guards the shape rather than the prose. It cannot judge whether advice is
 * good, but it does catch the specific way these went hollow -- and it would
 * have failed on three of six before the rewrite.
 */

const SKILLS_ROOT = join(__dirname, '../../src/process/resources/skills');

/**
 * Pinned skills that also ship a skills-library duplicate, and the category it
 * sits under. Only these three do -- the other three pinned skills have no
 * library copy, which is why they never drifted.
 */
const LIBRARY_CATEGORY: Readonly<Record<string, string>> = {
  copywriter: 'marketing-sales',
  'startup-advisor': 'business-strategy',
  'brand-identity-designer': 'creative-arts',
};

/**
 * The generator's fingerprints. Each appeared verbatim in the thin bodies.
 *
 * The last three were added after the first rewrite missed them: that pass
 * replaced the TOP of each file (When to Use, Persona, Critical Rules, Process)
 * and left the tail untouched, so all three skills still shipped an Example
 * reading "Help me with <name> for a mid-size project." -> "A complete <name>
 * framework tailored to the specific context." The suite passed anyway, because
 * it was only looking for the patterns the top of the file happened to contain.
 */
const FILLER_PATTERNS: readonly RegExp[] = [
  /Analyze the situation\./,
  /User needs guidance on /,
  /User asks about .* best practices or techniques/,
  /User wants a structured approach to /,
  /opportunities relevant to /,
  /for a mid-size project/,
  /framework tailored to the specific context/,
  /^- \*\*Incomplete information:\*\* Ask clarifying questions before proceeding/m,
];

/**
 * The spine every strong sibling follows. A skill missing these is not
 * necessarily bad prose, but it is measurably not finished to house standard --
 * and all three thin bodies were missing exactly this set.
 */
const REQUIRED_SECTIONS: readonly string[] = [
  'When to Use',
  'Persona & Identity',
  'Core Responsibilities',
  'Critical Rules',
  'Process',
  'Communication Style',
  'Success Metrics',
  'Tool Restrictions',
  'Edge Cases',
  'Example',
];

const ignition = ASSISTANT_PRESETS.find((preset) => preset.id === 'ignition');
const pinned = ignition?.defaultEnabledSkills ?? [];

function body(id: string): string {
  return readFileSync(join(SKILLS_ROOT, id, 'SKILL.md'), 'utf-8');
}

/** Text under `## When to Use`, up to the next heading. */
function whenToUse(text: string): string {
  const match = /^## When to Use\s*$([\s\S]*?)(?=^## )/m.exec(text);
  return (match?.[1] ?? '').trim();
}

describe('Ignition pinned skills carry real expertise', () => {
  it('the roster is non-empty (otherwise the rest of this file asserts nothing)', () => {
    expect(pinned.length).toBeGreaterThan(0);
  });

  it.each(pinned)('%s has no generator filler', (id) => {
    const text = body(id);
    const hits = FILLER_PATTERNS.filter((pattern) => pattern.test(text)).map(String);
    expect(hits, `${id} still contains template filler`).toEqual([]);
  });

  it.each(pinned)('%s states when to use it', (id) => {
    // The copywriter body shipped with this heading present and completely
    // empty, directly above ## Process.
    expect(whenToUse(body(id)).length, `${id} has an empty "When to Use" section`).toBeGreaterThan(80);
  });

  it.each(pinned)('%s says when NOT to use it, so the six can route between them', (id) => {
    expect(/Do NOT use/i.test(body(id)), `${id} never says when not to use it`).toBe(true);
  });

  it.each(pinned)('%s carries every section the house spine requires', (id) => {
    const headings = new Set(
      Array.from(body(id).matchAll(/^## (.+?)\s*$/gm), (m) => m[1].split(' -- ')[0].trim())
    );
    const missing = REQUIRED_SECTIONS.filter((s) => !headings.has(s));
    expect(missing, `${id} is missing house sections`).toEqual([]);
  });

  // NOT asserted: absence of {{placeholder}} templates. The three thin skills
  // carried ~470 lines of mustache mad-libs -- "Imagine {{desired_state}}. That
  // is exactly what {{product}} delivers." -- which copywriter's own Critical
  // Rules forbid producing, so the file instructed two incompatible things.
  // Those are gone. But a blanket {{...}} ban flags frontend-developer's
  // ProductCard example, where {{imageUrl}} is legitimate template syntax, and
  // there is no clean discriminator: the mad-libs sat inside fenced blocks too,
  // so a prose-only rule would not have caught them either. A guard that fails
  // on known-good work gets weakened rather than obeyed. The Step-section rule
  // below covers the same regression precisely.

  it.each(pinned)('%s does not restate what a dedicated library skill already owns', (id) => {
    // copywriter shipped inline "Step 1: Headlines", "Step 2: Landing Page
    // Structure" and so on while the product also ships 32 convert-* skills
    // that do the same work properly. Two sources of truth that drift apart.
    // The body routes; the library carries the depth.
    expect(/^## Step \d+:/m.test(body(id)), `${id} inlines numbered Step sections`).toBe(false);
  });

  it.each(pinned)('%s shows a worked example, not a description of one', (id) => {
    // The generator's Example was two lines restating the skill's own name. A
    // real one carries a concrete scenario, so it is substantially longer.
    //
    // Read to end of file rather than to the next `## `: `## Example` is the
    // last top-level section in all six, and a worked example legitimately
    // contains `##` sub-headings (the siblings render a full artifact inside it),
    // so stopping at the first one measures the preamble instead of the example.
    const text = body(id);
    const start = /^## Example\s*$/m.exec(text);
    const example = start ? text.slice(start.index + start[0].length).trim() : '';
    expect(example.length, `${id} has a stub Example`).toBeGreaterThan(400);
  });

  it.each(pinned)('%s matches its skills-library copy', (id) => {
    // Each of these ships twice: Ignition loads the pinned copy under
    // resources/skills/, while skills-search surfaces the duplicate under
    // skills-library/bodies/. Fixing only the pinned one left users browsing
    // the library still getting an empty When-to-Use, a filler Example and 132
    // mustache placeholders. Both are hand-authored source (build-skill-pack
    // packs them, it does not generate them), so nothing keeps them in step
    // except this assertion.
    const libraryPath = LIBRARY_CATEGORY[id];
    if (!libraryPath) return; // not every pinned skill has a library duplicate
    const library = join(SKILLS_ROOT, '../skills-library/bodies/skills', libraryPath, id, 'SKILL.md');
    if (!existsSync(library)) return;
    expect(readFileSync(library, 'utf-8'), `${id} has drifted from its library copy`).toBe(body(id));
  });

  it.each(pinned)('%s does not describe itself circularly', (id) => {
    // "Use when the user asks about copywriter" was the resident description --
    // the one line the model sees when deciding whether the skill is relevant.
    const description = /^description:\s*[|>]?-?\s*([\s\S]*?)^\w+:/m.exec(body(id))?.[1] ?? '';
    expect(
      new RegExp(`asks about ${id}\\b`, 'i').test(description),
      `${id} resident description is circular`
    ).toBe(false);
  });
});
