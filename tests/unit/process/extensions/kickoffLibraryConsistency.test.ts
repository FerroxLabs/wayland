/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// v0.4.7.1 (B-L-3) - bundle-data consistency check between the canonical
// authoring source (.planning/kickoff-library/v3-consolidated.yaml) and
// the runtime-loaded JSON (src/process/extensions/data/bundle-vendored/
// assistants.json). The current ship has these in lockstep - when an
// assistant author touches the YAML, the JSON has to follow or the
// overlay's all-or-nothing validator will silently drop the new entries.
//
// js-yaml is now a dependency, so the field-for-field comparison below runs for
// real whenever the authoring YAML is on disk. The YAML lives under .planning/
// (gitignored), so it is absent on CI checkouts - there the test still asserts
// the JSON bundle's internal validity, so it never silently passes without an
// assertion.

import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

type YamlKickoff = {
  id: string;
  text: string;
  prefill: string;
  scenario: string;
  timeBucket?: string;
  requiresRitualOutput?: boolean;
  beginnerSafe?: boolean;
};
type JsonAssistant = { id: string; kickoffs?: Array<{ id: string } & Record<string, unknown>> };

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const YAML_PATH = path.join(REPO_ROOT, '.planning/kickoff-library/v3-consolidated.yaml');
const JSON_PATH = path.join(REPO_ROOT, 'src/process/extensions/data/bundle-vendored/assistants.json');

describe('kickoff library consistency (B-L-3)', () => {
  it('the runtime assistants.json bundle exists on disk', () => {
    // JSON_PATH is the committed, runtime-loaded artifact - it must always ship.
    expect(fs.existsSync(JSON_PATH)).toBe(true);

    // YAML_PATH is the authoring source under .planning/, which is gitignored
    // and therefore absent from CI checkouts. Only assert it when it has been
    // checked out locally so authors catch a missing source early.
    if (fs.existsSync(YAML_PATH)) {
      expect(fs.readFileSync(YAML_PATH, 'utf-8').length).toBeGreaterThan(0);
    }
  });

  it('the runtime assistants.json bundle is internally well-formed (every entry + kickoff has an id)', () => {
    // CI-safe assertion that always runs regardless of the gitignored YAML:
    // the shipped JSON must parse to a non-empty array whose entries (and any
    // kickoffs) carry stable string ids - the overlay validator keys off these.
    const jsonParsed = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8')) as JsonAssistant[];
    expect(Array.isArray(jsonParsed)).toBe(true);
    expect(jsonParsed.length).toBeGreaterThan(0);

    for (const entry of jsonParsed) {
      expect(typeof entry.id, `assistant entry missing string id: ${JSON.stringify(entry).slice(0, 80)}`).toBe(
        'string'
      );
      for (const k of entry.kickoffs ?? []) {
        expect(typeof k.id, `kickoff missing string id in assistant ${entry.id}`).toBe('string');
      }
    }
  });

  it('every assistant kickoffs array in assistants.json matches the YAML source field-for-field', () => {
    // The authoring YAML is gitignored, so it is absent on CI checkouts. When it
    // is not present we have nothing to compare against - assert that explicitly
    // (the well-formedness test above is the always-on guard) and return.
    if (!fs.existsSync(YAML_PATH)) {
      expect(fs.existsSync(JSON_PATH)).toBe(true);
      return;
    }

    const yamlParsed = yaml.load(fs.readFileSync(YAML_PATH, 'utf-8')) as Record<string, { kickoffs?: YamlKickoff[] }>;
    const jsonParsed = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8')) as JsonAssistant[];
    const yamlAssistantIds = Object.keys(yamlParsed).filter((k) => k !== 'meta');

    for (const id of yamlAssistantIds) {
      const jsonEntry = jsonParsed.find((j) => j.id === id || j.id === `ext-${id}` || j.id === `builtin-${id}`);
      expect(jsonEntry, `assistants.json missing assistant ${id}`).toBeDefined();

      const yamlKickoffs = yamlParsed[id].kickoffs ?? [];
      const jsonKickoffs = jsonEntry!.kickoffs ?? [];
      expect(jsonKickoffs, `kickoff count mismatch for assistant ${id}`).toHaveLength(yamlKickoffs.length);

      for (const yk of yamlKickoffs) {
        const jk = jsonKickoffs.find((k) => k.id === yk.id) as (Record<string, unknown> & YamlKickoff) | undefined;
        expect(jk, `JSON missing kickoff id ${yk.id} for assistant ${id}`).toBeDefined();
        // YAML block scalars preserve trailing newlines JSON strings drop, so
        // trim both sides of free-text fields before comparing.
        expect(jk!.text.trim()).toBe(yk.text.trim());
        expect(jk!.prefill.trim()).toBe(yk.prefill.trim());
        expect(jk!.scenario).toBe(yk.scenario);
        expect(jk!.timeBucket).toBe(yk.timeBucket);
        expect(jk!.requiresRitualOutput).toBe(yk.requiresRitualOutput);
        expect(jk!.beginnerSafe).toBe(yk.beginnerSafe);
      }
    }
  });
});
