/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Every worked example in Smart Trader's bundled TV skills has to be callable.
 *
 * These files are not documentation: they are in `smart-trader.defaultEnabledSkills`, so
 * they are in the model's context the moment the assistant opens, and the model copies
 * the example verbatim. Five argument names in them named parameters TVControl 2.3.x
 * does not have.
 *
 * WHY NOTHING SCHEMA-SHAPED CAUGHT IT: the server validates with zod, which STRIPS an
 * unknown key rather than rejecting it. `chart_manage_indicator({action:"add", name:...})`
 * therefore passes validation, arrives at the handler with no `indicator`, and dies at
 * runtime with "indicator is required for add action". A -32602 never happens, so nothing
 * on the transport notices.
 *
 * THE FIXTURE IS NOT HAND-WRITTEN. tests/fixtures/tvcontrol-<ver>-tools.json is produced
 * by scripts/gen-tvcontrol-schema-fixture.mjs, which packs the connector as npm publish
 * would, installs the tarball, spawns the INSTALLED bin shim, and records the 109
 * `inputSchema` objects from a real `tools/list`. Its header version is pinned to the
 * catalog's pinned version below, so bumping the pin without regenerating fails here
 * instead of silently validating skills against a stale schema.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import tvcontrolEntry from '@/renderer/mcp-catalog/entries/com.ferroxlabs-tvcontrol.json';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SKILLS_ROOT = path.join(REPO_ROOT, 'src/process/resources/skills');

/** smart-trader's defaultEnabledSkills, i.e. everything live the moment the assistant opens. */
const TV_SKILL_DIRS = [
  'tvcontrol-setup',
  'morning-prep',
  'chart-analysis',
  'multi-symbol-scan',
  'multi-pane-analysis',
  'rebuild-from-screenshot',
  'replay-practice',
  'strategy-report',
  'strategy-ab-test',
  'learn-from-losses',
  'pine-develop',
  'porting-pine-versions',
];

type Fixture = {
  _header: { version: string; toolCount: number };
  tools: Record<string, { inputSchema: { properties?: Record<string, unknown>; required?: string[] } }>;
};

const PINNED_VERSION = (tvcontrolEntry as { packages: Array<{ version: string }> }).packages[0].version;
const FIXTURE_PATH = path.join(REPO_ROOT, 'tests/fixtures', `tvcontrol-${PINNED_VERSION}-tools.json`);
const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as Fixture;

function markdownFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith('.md')) out.push(p);
    }
  };
  for (const d of TV_SKILL_DIRS) walk(path.join(SKILLS_ROOT, d));
  out.push(path.join(REPO_ROOT, 'src/process/resources/assistant/smart-trader/smart-trader.md'));
  return out;
}

function fencedBlocks(text: string): string[] {
  return [...text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
}

/** Split an object-literal body on TOP-LEVEL commas, respecting nesting and strings. */
function topLevelKeys(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let seg = '';
  let quote: string | null = null;
  for (const ch of body) {
    if (quote) {
      seg += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      seg += ch;
      continue;
    }
    if (ch === '{' || ch === '[' || ch === '(') depth++;
    else if (ch === '}' || ch === ']' || ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(seg);
      seg = '';
    } else seg += ch;
  }
  parts.push(seg);
  return parts.map((p) => /^\s*([A-Za-z_]\w*)\s*:/.exec(p)?.[1]).filter((k): k is string => Boolean(k));
}

type CallSite = { file: string; tool: string; keys: string[] };

/** Find `tool_name({ ... })` call sites inside fenced blocks, brace-balanced. */
function callSites(file: string, text: string): CallSite[] {
  const out: CallSite[] = [];
  for (const block of fencedBlocks(text)) {
    for (const m of block.matchAll(/\b([a-z][a-z0-9_]*)\(\{/g)) {
      const tool = m[1];
      if (!(tool in fixture.tools)) continue;
      const open = m.index! + m[0].length - 1;
      let depth = 0;
      let quote: string | null = null;
      for (let j = open; j < block.length; j++) {
        const ch = block[j];
        if (quote) {
          if (ch === quote) quote = null;
          continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
          quote = ch;
          continue;
        }
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            out.push({ file: path.relative(REPO_ROOT, file), tool, keys: topLevelKeys(block.slice(open + 1, j)) });
            break;
          }
        }
      }
    }
  }
  return out;
}

const files = markdownFiles();
const sites = files.flatMap((f) => callSites(f, readFileSync(f, 'utf-8')));

describe('bundled TVControl skill examples are callable against the pinned connector', () => {
  it('the fixture was generated from the version the catalog pins', () => {
    // Bumping the pin without regenerating would validate skills against a stale schema
    // and report every call site green.
    expect(fixture._header.version).toBe(PINNED_VERSION);
    expect(fixture._header.toolCount).toBe(Object.keys(fixture.tools).length);
    expect(fixture._header.toolCount).toBe(109);
  });

  it('KNOWN-POSITIVE CONTROL: the parser actually finds call sites', () => {
    // A parser that finds nothing validates nothing and reports success. These floors are
    // measured, not aspirational: 16 call sites across 4 files, and chart_get_state named
    // in 7 of the 13 scanned files, on the corpus this test shipped with.
    expect(files.length).toBeGreaterThanOrEqual(13);
    expect(sites.length).toBeGreaterThanOrEqual(16);
    expect(new Set(sites.map((s) => s.file)).size).toBeGreaterThanOrEqual(4);

    const mentioning = files.filter((f) => readFileSync(f, 'utf-8').includes('chart_get_state'));
    expect(mentioning.length).toBeGreaterThanOrEqual(7);

    // And it resolves the arguments, not just the names.
    expect(sites.some((s) => s.keys.length > 0)).toBe(true);
  });

  it('every argument name exists on the tool it is passed to', () => {
    const bad = sites
      .map((s) => {
        const props = new Set(Object.keys(fixture.tools[s.tool].inputSchema.properties ?? {}));
        const unknown = s.keys.filter((k) => !props.has(k));
        return unknown.length ? `${s.file}: ${s.tool}({ ${unknown.join(', ')} }) - not in inputSchema` : null;
      })
      .filter(Boolean);
    expect(bad, `zod strips unknown keys, so these fail at RUNTIME, never as -32602:\n${bad.join('\n')}`).toEqual([]);
  });

  it('every required argument is present at every call site', () => {
    const bad = sites
      .map((s) => {
        const required = fixture.tools[s.tool].inputSchema.required ?? [];
        const missing = required.filter((r) => !s.keys.includes(r));
        return missing.length ? `${s.file}: ${s.tool} is missing required { ${missing.join(', ')} }` : null;
      })
      .filter(Boolean);
    expect(bad, `the model copies these verbatim:\n${bad.join('\n')}`).toEqual([]);
  });
});
