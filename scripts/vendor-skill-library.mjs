#!/usr/bin/env node
/**
 * vendor-skill-library.mjs
 *
 * Clones TradeCanyon/FoundrySkills at a pinned SHA and materialises the
 * library into src/process/resources/skills-library/.
 *
 * Usage:
 *   node scripts/vendor-skill-library.mjs
 *   bun  scripts/vendor-skill-library.mjs
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

// ── Pinned commit ────────────────────────────────────────────────────────────
// Update this SHA when you want to pull a newer snapshot of FoundrySkills.
const PINNED_SHA = 'facb8dce314ce0146774feb43ef92710910851cb';

// ── Paths ────────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'src', 'process', 'resources', 'skills-library');
const BODIES_DIR = join(OUT_DIR, 'bodies');

// ── Required frontmatter fields in index.json entries ────────────────────────
const REQUIRED_FIELDS = ['name', 'description', 'category', 'tags', 'metadata', 'path'];

// ── Helpers ──────────────────────────────────────────────────────────────────
function run(cmd, cwd, opts = {}) {
  const result = spawnSync(cmd, { shell: true, cwd, encoding: 'utf8', ...opts });
  if (result.status !== 0) {
    const msg = result.stderr?.trim() || result.stdout?.trim() || '(no output)';
    throw new Error(`Command failed (exit ${result.status}): ${cmd}\n${msg}`);
  }
  return result.stdout?.trim() ?? '';
}

function typeFromDir(dir) {
  if (dir === 'skills') return 'skill';
  if (dir === 'workflows') return 'workflow';
  if (dir === 'agents') return 'agent-profile';
  throw new Error(`Unknown source directory: ${dir}`);
}

// ── Clone ─────────────────────────────────────────────────────────────────────
const tmpDir = join(os.tmpdir(), `foundry-skills-${Date.now()}`);
console.log(`Cloning FoundrySkills into ${tmpDir} …`);

// Try SSH first, fall back to HTTPS
let cloneUrl = 'git@github.com:TradeCanyon/FoundrySkills.git';
let cloneResult = spawnSync(
  `GIT_TERMINAL_PROMPT=0 git clone --no-local "${cloneUrl}" "${tmpDir}"`,
  { shell: true, encoding: 'utf8' },
);

if (cloneResult.status !== 0) {
  console.log('SSH clone failed, falling back to HTTPS …');
  cloneUrl = 'https://github.com/TradeCanyon/FoundrySkills.git';
  cloneResult = spawnSync(
    `GIT_TERMINAL_PROMPT=0 git clone --no-local "${cloneUrl}" "${tmpDir}"`,
    { shell: true, encoding: 'utf8' },
  );
  if (cloneResult.status !== 0) {
    const msg = cloneResult.stderr?.trim() || '(no output)';
    console.error('BLOCKED: Could not clone FoundrySkills.\n' + msg);
    process.exit(1);
  }
}

// Checkout pinned SHA
try {
  run(`git checkout ${PINNED_SHA}`, tmpDir);
} catch (err) {
  console.error(`BLOCKED: Could not checkout pinned SHA ${PINNED_SHA}.\n${err.message}`);
  process.exit(1);
}

// Verify HEAD matches
const actualSha = run('git rev-parse HEAD', tmpDir);
if (actualSha !== PINNED_SHA) {
  console.error(`BLOCKED: HEAD SHA mismatch — got ${actualSha}, expected ${PINNED_SHA}`);
  process.exit(1);
}
console.log(`Pinned SHA verified: ${PINNED_SHA}`);

// ── Load index.json ───────────────────────────────────────────────────────────
const indexSrc = join(tmpDir, '_build', 'index.json');
if (!existsSync(indexSrc)) {
  console.error('BLOCKED: _build/index.json not found in FoundrySkills.');
  process.exit(1);
}
const rawIndex = JSON.parse(readFileSync(indexSrc, 'utf8'));

// ── Validate all entries ──────────────────────────────────────────────────────
console.log(`Validating ${rawIndex.length} index entries …`);
const errors = [];
for (const entry of rawIndex) {
  for (const field of REQUIRED_FIELDS) {
    if (entry[field] === undefined || entry[field] === null) {
      errors.push(`Entry "${entry.name ?? '(unknown)'}" is missing required field: ${field}`);
    }
  }
  // path must start with a known source dir
  const srcDir = entry.path?.split('/')[0];
  if (!['skills', 'workflows', 'agents'].includes(srcDir)) {
    errors.push(`Entry "${entry.name}" has unrecognised path prefix: ${entry.path}`);
  }
}
if (errors.length > 0) {
  console.error('BLOCKED: Frontmatter validation failed:\n' + errors.slice(0, 10).join('\n'));
  process.exit(1);
}
console.log('Validation passed.');

// ── Assert entry count ────────────────────────────────────────────────────────
const MIN_ENTRIES = 2000;
if (rawIndex.length < MIN_ENTRIES) {
  console.error(
    `BLOCKED: index.json has only ${rawIndex.length} entries — expected ≥ ${MIN_ENTRIES}.`,
  );
  process.exit(1);
}

// ── Clean output ──────────────────────────────────────────────────────────────
if (existsSync(OUT_DIR)) {
  console.log(`Cleaning ${OUT_DIR} …`);
  rmSync(OUT_DIR, { recursive: true, force: true });
}
mkdirSync(BODIES_DIR, { recursive: true });

// ── Copy body files ───────────────────────────────────────────────────────────
for (const srcDir of ['skills', 'workflows', 'agents']) {
  const src = join(tmpDir, srcDir);
  if (!existsSync(src)) continue;
  const dest = join(BODIES_DIR, srcDir);
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}
console.log('Body files copied.');

// ── Rewrite index.json ────────────────────────────────────────────────────────
const rewritten = rawIndex.map((entry) => {
  const srcDir = entry.path.split('/')[0];
  return {
    ...entry,
    source: 'wayland-library',
    type: typeFromDir(srcDir),
    metadata: {
      ...entry.metadata,
      author: 'wayland',
    },
    security: {
      verdict: 'unscanned',
      findings: [],
      scannedAt: 0,
      scannerVersion: 0,
      llmScanned: false,
    },
  };
});

writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(rewritten, null, 2) + '\n', 'utf8');
console.log(`index.json written (${rewritten.length} entries).`);

// ── Copy discovery-queries.json ───────────────────────────────────────────────
const queriesSrc = join(tmpDir, '_tests', 'discovery-queries.json');
if (!existsSync(queriesSrc)) {
  console.error('BLOCKED: _tests/discovery-queries.json not found in FoundrySkills.');
  process.exit(1);
}
cpSync(queriesSrc, join(OUT_DIR, 'discovery-queries.json'));
console.log('discovery-queries.json copied.');

// ── Cleanup temp dir ──────────────────────────────────────────────────────────
rmSync(tmpDir, { recursive: true, force: true });

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\nDone. Vendored ${rewritten.length} entries from ${PINNED_SHA}.`);
console.log(`Output: ${OUT_DIR}`);
