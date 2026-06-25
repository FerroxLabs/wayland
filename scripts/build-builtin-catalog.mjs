#!/usr/bin/env node
// build-builtin-catalog.mjs
//
// Transforms the vendored waylandteams content tree into a single native
// catalog JSON the app ships at build time.
//
// SOURCE OF TRUTH: ~/dev/waylandteams
//   It is vendored into this repo at:
//     resources/builtin-extensions/waylandteams/
//   (contributes/assistants.json + assistants/{roles,launchers}/*.md + icons/*.svg)
//
// This script is idempotent: it reads the vendored tree, inlines each record's
// SVG avatar (as a data URI) and markdown context (as UTF-8 text), and writes a
// flat catalog array. Re-run after updating the vendored tree:
//
//     node scripts/build-builtin-catalog.mjs   (from the app/ dir)
//
// It FAILS LOUDLY (non-zero exit) if any avatar/context file is missing or if
// the record/kind counts drift from the expected invariants.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(APP_ROOT, 'resources/builtin-extensions/waylandteams');
const SOURCE_JSON = path.join(SOURCE_DIR, 'contributes/assistants.json');
const OUT_DIR = path.join(APP_ROOT, 'src/process/resources/builtin-catalog');
const OUT_JSON = path.join(OUT_DIR, 'assistants.json');

const EXPECTED_TOTAL = 88;
const EXPECTED_TEAMS = 60;
const EXPECTED_SPECIALISTS = 28;

function fail(msg) {
  console.error(`\nERROR: ${msg}`);
  process.exit(1);
}

function readSourceRecords() {
  if (!fs.existsSync(SOURCE_JSON)) fail(`source not found: ${SOURCE_JSON}`);
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(SOURCE_JSON, 'utf8'));
  } catch (e) {
    fail(`could not parse ${SOURCE_JSON}: ${e.message}`);
  }
  if (!Array.isArray(parsed)) fail(`expected an array in ${SOURCE_JSON}`);
  return parsed;
}

function encodeAvatar(avatarRel, id) {
  if (!avatarRel) fail(`record "${id}" has no avatar`);
  const abs = path.join(SOURCE_DIR, avatarRel);
  if (!fs.existsSync(abs)) fail(`missing icon for "${id}": ${abs}`);
  const svg = fs.readFileSync(abs);
  return `data:image/svg+xml;base64,${svg.toString('base64')}`;
}

function readContext(contextRel, id) {
  if (!contextRel) fail(`record "${id}" has no contextFile`);
  const abs = path.join(SOURCE_DIR, contextRel);
  if (!fs.existsSync(abs)) fail(`missing context for "${id}": ${abs}`);
  return fs.readFileSync(abs, 'utf8');
}

function nonEmptyArray(v) {
  return Array.isArray(v) && v.length > 0;
}

function transform(record) {
  const id = record.id;
  if (!id) fail(`a record is missing "id": ${JSON.stringify(record).slice(0, 120)}`);

  // Field order is intentional and preserved by insertion order.
  const out = {
    id,
    name: record.name,
    description: record.description,
    avatar: encodeAvatar(record.avatar, id),
    presetAgentType: record.presetAgentType,
    category: record.category,
    kind: record.kind,
  };

  if (nonEmptyArray(record.enabledSkills)) out.enabledSkills = record.enabledSkills;
  if (nonEmptyArray(record.prompts)) out.prompts = record.prompts;
  if (record.teammates !== undefined) out.teammates = record.teammates;
  if (record.rituals !== undefined) out.rituals = record.rituals;
  if (record.standing !== undefined && record.standing !== false) out.standing = record.standing;
  if (nonEmptyArray(record.kickoffs)) out.kickoffs = record.kickoffs;

  out.context = readContext(record.contextFile, id);
  return out;
}

function main() {
  const source = readSourceRecords();
  const catalog = source.map(transform);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(catalog, null, 2) + '\n';
  fs.writeFileSync(OUT_JSON, json);

  const total = catalog.length;
  const teams = catalog.filter((r) => r.kind === 'team').length;
  const specialists = catalog.filter((r) => r.kind === 'specialist').length;
  const bytes = Buffer.byteLength(json, 'utf8');

  console.log('builtin catalog build');
  console.log(`  output:       ${OUT_JSON}`);
  console.log(`  total:        ${total}`);
  console.log(`  teams:        ${teams}`);
  console.log(`  specialists:  ${specialists}`);
  console.log(`  bytes:        ${bytes}`);

  const failures = [];
  if (total !== EXPECTED_TOTAL) failures.push(`total ${total} !== ${EXPECTED_TOTAL}`);
  if (teams !== EXPECTED_TEAMS) failures.push(`teams ${teams} !== ${EXPECTED_TEAMS}`);
  if (specialists !== EXPECTED_SPECIALISTS) {
    failures.push(`specialists ${specialists} !== ${EXPECTED_SPECIALISTS}`);
  }

  // Context/icon presence is enforced eagerly in transform() (fails fast), so a
  // catalog that reached here has 0 missing — assert it explicitly for the log.
  const missingContext = catalog.filter((r) => typeof r.context !== 'string' || r.context.length === 0).length;
  const missingIcon = catalog.filter((r) => !r.avatar || !r.avatar.startsWith('data:image/svg+xml;base64,')).length;
  if (missingContext !== 0) failures.push(`missing context: ${missingContext}`);
  if (missingIcon !== 0) failures.push(`missing icons: ${missingIcon}`);

  console.log(`  missing context: ${missingContext}`);
  console.log(`  missing icons:   ${missingIcon}`);

  if (failures.length > 0) {
    console.error('\nASSERTION FAILURES:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log('\nall assertions passed.');
}

main();
