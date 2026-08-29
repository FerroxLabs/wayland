#!/usr/bin/env node
/**
 * Public counts guard.
 *
 * Wayland's README and getwayland.com both quote counts of what the product
 * ships. They drifted apart: the README said 177 workflows, the site said 107,
 * and the truth was 178 across two indexes that nobody was summing. A reviewer
 * diffed the two surfaces in public before we noticed.
 *
 * This script is the single source of those numbers. It measures the shipped
 * artifacts, writes public-counts.json for the website to consume, and fails
 * if any number quoted in readme.md no longer matches what we ship.
 *
 *   node scripts/check-public-counts.mjs            # verify, fail on drift
 *   node scripts/check-public-counts.mjs --write    # also emit public-counts.json
 *
 * When a count legitimately changes, re-run with --write and commit both the
 * README and public-counts.json. Never hand-edit a number in either.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const SKILLS_INDEX = 'src/process/resources/skills-library/index.json';
const BUNDLED_INDEX = 'src/process/resources/bundled-workflows/index.json';
const ASSISTANTS = 'src/process/resources/builtin-catalog/assistants.json';
const ACP_TYPES = 'src/common/types/acpTypes.ts';

function measure() {
  const index = read(SKILLS_INDEX);
  const byType = {};
  for (const entry of index) byType[entry.type] = (byType[entry.type] ?? 0) + 1;

  const bundled = read(BUNDLED_INDEX);
  const bundledArr = Array.isArray(bundled) ? bundled : (bundled.workflows ?? []);

  // The two workflow collections are separate packs with no shared names.
  // Assert that, so a future merge cannot silently double-count.
  const nameOf = (e) =>
    String(e.name ?? e.id ?? '')
      .trim()
      .toLowerCase();
  const indexWorkflowNames = new Set(index.filter((e) => e.type === 'workflow').map(nameOf));
  const overlap = bundledArr.filter((e) => indexWorkflowNames.has(nameOf(e)));
  if (overlap.length > 0) {
    throw new Error(
      `${overlap.length} workflow name(s) appear in BOTH ${SKILLS_INDEX} and ${BUNDLED_INDEX}. ` +
        `The totals below assume no overlap. Resolve the duplicates before trusting any count.`
    );
  }

  // Brace-match the ACP_BACKENDS_ALL object literal. A looser regex runs off the
  // end of the object and counts every 2-space-indented key in the rest of the
  // file - it reported 32 backends when there are 19.
  const acpSource = readFileSync(join(root, ACP_TYPES), 'utf8');
  const declEnd = acpSource.search(/ACP_BACKENDS_ALL\s*(?::[^=]*)?=\s*\{/);
  if (declEnd === -1) throw new Error(`ACP_BACKENDS_ALL not found in ${ACP_TYPES}`);
  const open = acpSource.indexOf('{', declEnd);
  let depth = 0;
  let close = -1;
  for (let i = open; i < acpSource.length; i += 1) {
    if (acpSource[i] === '{') depth += 1;
    else if (acpSource[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  if (close === -1) throw new Error(`Unbalanced braces in ${ACP_TYPES}`);
  const acpIds = [...acpSource.slice(open, close).matchAll(/^ {2}([a-zA-Z][\w-]*):\s*\{/gm)].map((m) => m[1]);
  const acpBackends = acpIds.filter((id) => id !== 'custom').length;

  return {
    measuredAt: new Date().toISOString().slice(0, 10),
    skills: byType.skill ?? 0,
    agentProfiles: byType['agent-profile'] ?? 0,
    skillsLibraryEntries: index.length,
    workflowsInSkillsLibrary: byType.workflow ?? 0,
    workflowsBundled: bundledArr.length,
    workflows: (byType.workflow ?? 0) + bundledArr.length,
    assistants: read(ASSISTANTS).length,
    acpBackends,
  };
}

// Numbers we actually print in public, and where. Each entry is checked against
// the measured value above. If you change the wording in readme.md, change the
// pattern here too - a pattern that matches nothing is a failure, not a pass.
const CLAIMS = [
  { file: 'readme.md', pattern: /(\d+) ready-to-run workflows/, key: 'workflows' },
  { file: 'readme.md', pattern: /(\d+) ACP CLI agents in all/, key: 'acpBackends' },
  { file: 'readme.md', pattern: /So: ([\d,]+) workflows total/, key: 'workflows' },
];

const counts = measure();
const failures = [];

for (const { file, pattern, key } of CLAIMS) {
  const text = readFileSync(join(root, file), 'utf8');
  const match = text.match(pattern);
  if (!match) {
    failures.push(`${file}: pattern ${pattern} matched nothing. The wording changed - update CLAIMS.`);
    continue;
  }
  const claimed = Number(match[1].replace(/,/g, ''));
  if (claimed !== counts[key]) {
    failures.push(`${file}: claims ${claimed} for "${key}", but we ship ${counts[key]}.`);
  }
}

if (process.argv.includes('--write')) {
  writeFileSync(join(root, 'public-counts.json'), `${JSON.stringify(counts, null, 2)}\n`);
  console.log('wrote public-counts.json');
}

console.log(JSON.stringify(counts, null, 2));

if (failures.length > 0) {
  console.error(`\n${failures.length} public count(s) out of date:\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error('\nRe-measure and update the surface. Do not hand-edit the number.\n');
  process.exit(1);
}

console.log('\nAll public counts match the shipped artifacts.');
