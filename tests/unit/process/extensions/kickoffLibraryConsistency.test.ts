/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// v0.4.7.1 (B-L-3) — bundle-data consistency check between the canonical
// authoring source (.planning/kickoff-library/v3-consolidated.yaml) and
// the runtime-loaded JSON (src/process/extensions/data/bundle-vendored/
// assistants.json). The current ship has these in lockstep — when an
// assistant author touches the YAML, the JSON has to follow or the
// overlay's all-or-nothing validator will silently drop the new entries.
//
// js-yaml is NOT in this repo's dependencies. The test below is gated
// with `it.skip` and a comment explaining what it would assert if the
// parser were available. To enable: add `js-yaml` + `@types/js-yaml` to
// devDependencies, then change `it.skip` → `it`.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const YAML_PATH = path.join(REPO_ROOT, '.planning/kickoff-library/v3-consolidated.yaml');
const JSON_PATH = path.join(REPO_ROOT, 'src/process/extensions/data/bundle-vendored/assistants.json');

describe('kickoff library consistency (B-L-3)', () => {
  it('the runtime assistants.json bundle exists on disk', () => {
    // JSON_PATH is the committed, runtime-loaded artifact — it must always ship.
    expect(fs.existsSync(JSON_PATH)).toBe(true);

    // YAML_PATH is the authoring source under .planning/, which is gitignored
    // and therefore absent from CI checkouts. Only assert it when it has been
    // checked out locally so authors catch a missing source early.
    if (fs.existsSync(YAML_PATH)) {
      expect(fs.readFileSync(YAML_PATH, 'utf-8').length).toBeGreaterThan(0);
    }
  });

  // SKIPPED — see file header. Restore by replacing `it.skip` with `it`
  // and adding js-yaml to devDependencies.
  it.skip('every assistant kickoffs array in assistants.json matches the YAML source field-for-field', () => {
    // Pseudocode for the enable path:
    //
    //   import yaml from 'js-yaml';
    //   const yamlRaw = fs.readFileSync(YAML_PATH, 'utf-8');
    //   const yamlParsed = yaml.load(yamlRaw) as { [assistantId: string]: { kickoffs: Array<{
    //     id: string; text: string; prefill: string; scenario: string;
    //     timeBucket?: string; requiresRitualOutput?: boolean; beginnerSafe?: boolean;
    //   }> } };
    //   const jsonRaw = fs.readFileSync(JSON_PATH, 'utf-8');
    //   const jsonParsed = JSON.parse(jsonRaw) as Array<{ id: string; kickoffs?: Array<unknown> }>;
    //   const yamlAssistantIds = Object.keys(yamlParsed).filter((k) => k !== 'meta');
    //   for (const id of yamlAssistantIds) {
    //     const jsonEntry = jsonParsed.find((j) => j.id === id || j.id === `ext-${id}` || j.id === `builtin-${id}`);
    //     expect(jsonEntry, `assistants.json missing assistant ${id}`).toBeDefined();
    //     // Normalize prefill/text — YAML block scalars preserve trailing
    //     // newlines that JSON strings don't, so trim both before compare.
    //     const yamlKickoffs = yamlParsed[id].kickoffs;
    //     const jsonKickoffs = jsonEntry!.kickoffs ?? [];
    //     expect(jsonKickoffs).toHaveLength(yamlKickoffs.length);
    //     for (const yk of yamlKickoffs) {
    //       const jk = jsonKickoffs.find((k: any) => k.id === yk.id);
    //       expect(jk, `JSON missing kickoff id ${yk.id} for assistant ${id}`).toBeDefined();
    //       expect((jk as any).text.trim()).toBe(yk.text.trim());
    //       expect((jk as any).prefill.trim()).toBe(yk.prefill.trim());
    //       expect((jk as any).scenario).toBe(yk.scenario);
    //       expect((jk as any).timeBucket).toBe(yk.timeBucket);
    //       expect((jk as any).requiresRitualOutput).toBe(yk.requiresRitualOutput);
    //       expect((jk as any).beginnerSafe).toBe(yk.beginnerSafe);
    //     }
    //   }
  });
});
