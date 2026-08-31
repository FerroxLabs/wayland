/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Run the SHIPPED Skill Guard rules over the bundled library and report what
 * they would say. A RULE-TUNING TOOL, not a product fix.
 *
 * READ THIS BEFORE ACTING ON THE OUTPUT. Bundled first-party skills are EXEMPT
 * from the guard at runtime: `isTrustedBundleSkill` (SkillLibrary.ts:158) is
 * source === 'wayland-library' AND a path inside the signed bundle, and the boot
 * sweep stamps those `clean` without reading a body or calling SkillGuard.scan
 * (SkillLibrary.ts:558, :636). That is #885, and it already shipped.
 *
 * So the `verdict: 'unscanned'` stored in index.json is NOT what a customer
 * sees, and the "blocked" entries this script prints are NOT blocked in the
 * product. An earlier version of this comment claimed both, and it was wrong.
 * This script deliberately calls SkillGuard.scan DIRECTLY, bypassing that
 * exemption, which is exactly why its output looks alarming and exactly why it
 * is useful: it shows how the rules behave on real first-party prose.
 *
 * Every current "blocked" line is a curated skill whose SUBJECT is the pattern -
 * ssh-key-manager naming `~/.ssh/`, security-auditor quoting `rm -rf /`, API
 * docs carrying an example `Bearer eyJ...`. Read them as false-positive
 * evidence for tuning the rules against UNTRUSTED imported skills, which is the
 * population the guard actually governs.
 *
 * DO NOT run --write to "fix" the unscanned field. It records verdicts the
 * runtime overrides anyway, and would stamp `blocked` onto curated skills.
 *
 *   bunx tsx scripts/scan-bundled-skills.ts              # report only
 *   bunx tsx scripts/scan-bundled-skills.ts --write      # write index.json (see above)
 *   bunx tsx scripts/scan-bundled-skills.ts --check      # fail on unscanned OR drift
 */ */
import path from 'path';
import { promises as fs } from 'fs';
import { SkillGuard } from '../src/process/services/skills/SkillGuard';
import type { SkillScanInput } from '../src/process/services/skills/skillGuardRules';

const ROOT = path.resolve(__dirname, '..', 'src/process/resources/skills-library');
const INDEX = path.join(ROOT, 'index.json');

type Entry = {
  name: string;
  description?: string;
  tags?: unknown;
  path: string;
  security?: { verdict?: string; scannerVersion?: number };
  [k: string]: unknown;
};

async function main() {
  const write = process.argv.includes('--write');
  const check = process.argv.includes('--check');

  const entries: Entry[] = JSON.parse(await fs.readFile(INDEX, 'utf8'));
  console.log(`[scan] ${entries.length} bundled entries`);

  // The body is what the rules actually read. An entry whose body is missing
  // must NOT quietly score clean on an empty string - that is how a whole
  // library gets a green tick it did not earn.
  const inputs: SkillScanInput[] = [];
  const missing: string[] = [];
  for (const e of entries) {
    const bodyPath = path.join(ROOT, 'bodies', e.path);
    let body = '';
    try {
      body = await fs.readFile(bodyPath, 'utf8');
    } catch {
      missing.push(e.name);
    }
    inputs.push({
      name: e.name,
      description: e.description ?? '',
      body,
      tags: Array.isArray(e.tags) ? (e.tags as string[]) : [],
    } as SkillScanInput);
  }
  if (missing.length) {
    console.error(`[scan] ${missing.length} entries have no body on disk, e.g. ${missing.slice(0, 5).join(', ')}`);
    process.exit(2);
  }

  const reports = await SkillGuard.scan(inputs, { llm: false });

  const tally: Record<string, number> = {};
  for (const r of reports) tally[r.verdict] = (tally[r.verdict] ?? 0) + 1;
  console.log('[scan] verdicts:', JSON.stringify(tally));

  const flagged = reports
    .map((r, i) => ({ name: entries[i].name, verdict: r.verdict, findings: r.findings }))
    .filter((r) => r.verdict !== 'clean');
  if (flagged.length) {
    console.log(`[scan] ${flagged.length} entries are NOT clean:`);
    for (const f of flagged.slice(0, 40)) {
      console.log(`  ${f.verdict.padEnd(8)} ${f.name}\n           ${f.findings.map((x) => `[${x.severity}] ${x.threat}: ${x.message} <<${String(x.evidence).replace(/\s+/g, ' ').slice(0, 90)}>>`).join('\n           ')}`);
    }
  }

  if (check) {
    // DRIFT, not just absence. An earlier version only failed on "unscanned",
    // which meant that after a single --write it passed forever no matter how
    // far the recorded verdicts had drifted from what the rules now say - a
    // check that cannot fail. Recompute and compare, so editing a skill body or
    // tightening a rule without re-recording is what turns this red.
    const stale = entries.filter((e) => (e.security?.verdict ?? 'unscanned') === 'unscanned');
    const drifted = entries
      .map((e, i) => ({ name: e.name, recorded: e.security?.verdict ?? 'unscanned', actual: reports[i].verdict }))
      .filter((r) => r.recorded !== 'unscanned' && r.recorded !== r.actual);

    if (stale.length || drifted.length) {
      if (stale.length) {
        console.error(`[scan] FAIL: ${stale.length} entries still ship as "unscanned". Run with --write.`);
      }
      for (const d of drifted.slice(0, 20)) {
        console.error(`[scan] FAIL: ${d.name} records "${d.recorded}" but scans as "${d.actual}"`);
      }
      if (drifted.length > 20) console.error(`[scan] ... and ${drifted.length - 20} more drifted entries`);
      process.exit(1);
    }
    console.log(`[scan] check passed: ${entries.length} entries scanned, recorded verdicts all match`);
    return;
  }

  if (!write) {
    console.log('[scan] report only - pass --write to record these verdicts');
    return;
  }

  for (let i = 0; i < entries.length; i++) entries[i].security = reports[i];
  await fs.writeFile(INDEX, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
  console.log(`[scan] wrote real verdicts for ${entries.length} entries into ${path.relative(process.cwd(), INDEX)}`);
}

main().catch((err) => {
  console.error('[scan] failed:', err);
  process.exit(1);
});
