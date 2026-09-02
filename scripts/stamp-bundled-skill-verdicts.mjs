/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stamp the shipped verdict on first-party bundled skills and workflows.
 *
 * The runtime already treats these as trusted: `isTrustedBundleSkill` in
 * SkillLibrary.ts matches `source === 'wayland-library'` with a bundle-contained
 * path, and the startup sweep (skillsBridge.ts) stamps every match with
 * `trustedBundleReport()` - verdict `clean`, no body read, no model call. That
 * policy landed in #885 and is not changed here.
 *
 * What this fixes is the SHIPPED ARTIFACT. Both indexes go out carrying
 * `"verdict": "unscanned"` on every entry, so anyone reading the repository -
 * rather than running the app - sees 2,177 first-party skills reported as
 * never scanned, which is the opposite of what the product does with them on
 * first launch. This writes the same report the runtime would write, at pack
 * time, so the artifact and the runtime agree.
 *
 * Idempotent: entries already at the current scanner version are left alone, so
 * re-running produces no diff. Only `wayland-library` entries with a contained
 * relative path are eligible - anything else is left `unscanned` for the guard.
 *
 *   node scripts/stamp-bundled-skill-verdicts.mjs           # write
 *   node scripts/stamp-bundled-skill-verdicts.mjs --check    # CI: fail if stale
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Mirrors SKILL_SCANNER_VERSION in src/common/types/skillTypes.ts. Bump both
// together: a bump makes the runtime sweep re-evaluate every entry, and
// re-running this script re-stamps the artifact to match.
const SKILL_SCANNER_VERSION = 1;

// Fixed, not Date.now(): a build-time constant keeps the script idempotent and
// keeps 2,177 timestamps out of every unrelated diff. Update when re-stamping
// after a scanner-version bump.
const STAMPED_AT = Date.parse('2026-08-30T00:00:00Z');

const INDEXES = [
  'src/process/resources/skills-library/index.json',
  'src/process/resources/bundled-workflows/index.json',
];

/** Mirrors isTrustedBundleSkill: first-party source, path contained in the bundle. */
const isTrustedBundleEntry = (entry) => {
  const p = entry.path ?? '';
  if (entry.source !== 'wayland-library') return false;
  if (!p || path.isAbsolute(p)) return false;
  return !path.normalize(p).split(/[\\/]/).includes('..');
};

/** Mirrors trustedBundleReport() in SkillLibrary.ts - same fields, same order. */
const trustedBundleReport = () => ({
  verdict: 'clean',
  findings: [],
  scannedAt: STAMPED_AT,
  scannerVersion: SKILL_SCANNER_VERSION,
  llmScanned: false,
});

const check = process.argv.includes('--check');
let stale = 0;

// The shipped indexes are hand-maintained artifacts, not build output, and the
// two files do not share a serializer style (one uses inline arrays). So this
// rewrites the verdict block as TEXT rather than re-serializing the document -
// a JSON round-trip would reflow unrelated lines and bury the change.
const UNSCANNED_BLOCK = `"security": {
      "verdict": "unscanned",
      "findings": [],
      "scannedAt": 0,
      "scannerVersion": 0,
      "llmScanned": false
    }`;

const stampedBlock = () => {
  const r = trustedBundleReport();
  return `"security": {
      "verdict": "${r.verdict}",
      "findings": [],
      "scannedAt": ${r.scannedAt},
      "scannerVersion": ${r.scannerVersion},
      "llmScanned": ${r.llmScanned}
    }`;
};

for (const rel of INDEXES) {
  const file = path.resolve(rel);
  const raw = readFileSync(file, 'utf8');
  const entries = JSON.parse(raw);

  // Only first-party, bundle-contained entries may be stamped. A blanket text
  // replace is safe only while every entry qualifies, so refuse rather than
  // guess if that ever stops being true.
  const ineligible = entries.filter((e) => !isTrustedBundleEntry(e));
  if (ineligible.length > 0) {
    console.error(
      `${rel}: ${ineligible.length} entries are not first-party bundle content ` +
        `(e.g. ${ineligible[0].name}). Refusing to stamp - these must go through SkillGuard.`
    );
    process.exit(1);
  }

  const pending = raw.split(UNSCANNED_BLOCK).length - 1;
  stale += pending;

  if (check) {
    console.log(`${rel}: ${pending} unstamped of ${entries.length}`);
    continue;
  }

  if (pending > 0) writeFileSync(file, raw.split(UNSCANNED_BLOCK).join(stampedBlock()));
  console.log(`${rel}: ${pending} stamped, ${entries.length - pending} already current`);
}

if (check && stale > 0) {
  console.error(
    `\n${stale} bundled entries still ship "unscanned". Run: node scripts/stamp-bundled-skill-verdicts.mjs`
  );
  process.exit(1);
}
