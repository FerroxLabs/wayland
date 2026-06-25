#!/usr/bin/env node
/**
 * Backfill `interactivity: auto` into the metadata frontmatter of workflows
 * that are software/devops/incident/deploy style (runs to completion without
 * collaborative stops). All other workflows remain at the runtime default
 * (step-by-step). Idempotent: skips files that already carry the field.
 *
 * Usage: node scripts/backfill-workflow-interactivity.mjs
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BODIES_DIR = join(HERE, '..', 'src', 'process', 'resources', 'skills-library', 'bodies', 'workflows');

// Conservative auto-run set: only clear pipeline/deploy/incident/release
// workflows where the run proceeds to completion without collaborative stops.
// When in doubt, leave a workflow as step (the runtime default).
const AUTO_RUN_NAMES = new Set([
  'deploy-to-production',
  'devops-pipeline-from-scratch',
  'handle-production-incident',
  'incident-response',
  'release-new-version',
  'set-up-monitoring',
  'setup-ci-cd-pipeline',
]);

function insertInteractivityIntoMetadata(content, value) {
  // Insert `  interactivity: <value>` as the last line before the closing
  // `---` of the frontmatter block, placed after the last metadata key.
  // Strategy: find the metadata block and append inside it, before the
  // next top-level key or the closing ---. We insert after the last
  // indented line in the metadata block (lines starting with "  ").

  const lines = content.split('\n');
  // Find opening and closing --- markers.
  let firstDash = -1;
  let closingDash = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimEnd() === '---') {
      if (firstDash === -1) {
        firstDash = i;
      } else {
        closingDash = i;
        break;
      }
    }
  }
  if (firstDash === -1 || closingDash === -1) {
    throw new Error('Could not locate YAML frontmatter delimiters');
  }

  const frontmatter = lines.slice(firstDash + 1, closingDash);

  // Find the metadata block: lines between "^metadata:" and the next
  // top-level key (line that starts with a non-space letter/quote).
  let metaStart = -1;
  let metaEnd = -1;
  for (let i = 0; i < frontmatter.length; i++) {
    if (/^metadata:/.test(frontmatter[i])) {
      metaStart = i;
      continue;
    }
    if (metaStart !== -1 && /^[a-zA-Z"']/.test(frontmatter[i])) {
      metaEnd = i;
      break;
    }
  }
  if (metaStart === -1) {
    throw new Error('Could not locate metadata: block in frontmatter');
  }
  // metaEnd is the line AFTER the metadata block (or end of frontmatter).
  const blockEnd = metaEnd === -1 ? frontmatter.length : metaEnd;

  // Find the last non-empty indented line within the metadata block.
  let insertAfter = metaStart;
  for (let i = metaStart + 1; i < blockEnd; i++) {
    if (frontmatter[i].trim() !== '') insertAfter = i;
  }

  // Insert the new line after insertAfter.
  const absoluteInsertAfter = firstDash + 1 + insertAfter;
  const newLine = `  interactivity: "${value}"`;
  lines.splice(absoluteInsertAfter + 1, 0, newLine);
  return lines.join('\n');
}

const entries = readdirSync(BODIES_DIR).filter((name) => {
  const full = join(BODIES_DIR, name);
  return !name.startsWith('_') && !name.startsWith('.') && statSync(full).isDirectory();
});

const changed = [];
const skipped = [];

for (const name of entries) {
  if (!AUTO_RUN_NAMES.has(name)) continue;

  const skillPath = join(BODIES_DIR, name, 'SKILL.md');
  let content;
  try {
    content = readFileSync(skillPath, 'utf8');
  } catch {
    console.error(`WARN: could not read ${skillPath}`);
    continue;
  }

  if (/^\s+interactivity:/m.test(content)) {
    skipped.push(name);
    continue;
  }

  const updated = insertInteractivityIntoMetadata(content, 'auto');
  writeFileSync(skillPath, updated, 'utf8');
  changed.push(name);
}

console.log('\nBackfill complete.');
console.log(`\nFiles modified (${changed.length}):`);
for (const name of changed) console.log(`  + ${name}`);
if (skipped.length) {
  console.log(`\nSkipped - already had interactivity (${skipped.length}):`);
  for (const name of skipped) console.log(`  = ${name}`);
}
console.log(`\nTotal auto-run workflows: ${changed.length + skipped.length}`);
