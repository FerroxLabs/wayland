/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
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

/** The generator's fingerprints. Each appeared verbatim in the thin bodies. */
const FILLER_PATTERNS: readonly RegExp[] = [
  /Analyze the situation\./,
  /User needs guidance on /,
  /User asks about .* best practices or techniques/,
  /User wants a structured approach to /,
  /opportunities relevant to /,
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
