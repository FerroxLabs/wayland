/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/** Show every non-clean bundled skill WITH the surrounding body text, so a
 * false positive can be told from a real one by reading, not by assuming. */
import path from 'path';
import { promises as fs } from 'fs';
import { SkillGuard } from '../src/process/services/skills/SkillGuard';
import type { SkillScanInput } from '../src/process/services/skills/skillGuardRules';

const ROOT = path.resolve(__dirname, '..', 'src/process/resources/skills-library');

async function main() {
  const entries: any[] = JSON.parse(await fs.readFile(path.join(ROOT, 'index.json'), 'utf8'));
  const bodies = new Map<string, string>();
  const inputs: SkillScanInput[] = [];
  for (const e of entries) {
    const body = await fs.readFile(path.join(ROOT, 'bodies', e.path), 'utf8');
    bodies.set(e.name, body);
    inputs.push({ name: e.name, description: e.description ?? '', body, tags: [] } as SkillScanInput);
  }
  const reports = await SkillGuard.scan(inputs, { llm: false });

  const byThreat: Record<string, number> = {};
  let shown = 0;
  for (let i = 0; i < reports.length; i++) {
    const r = reports[i];
    if (r.verdict === 'clean') continue;
    const name = entries[i].name;
    const body = bodies.get(name) ?? '';
    console.log(`\n=== ${r.verdict.toUpperCase()}  ${name}  (${entries[i].path})`);
    for (const f of r.findings) {
      byThreat[f.threat] = (byThreat[f.threat] ?? 0) + 1;
      const ev = String(f.evidence);
      const at = body.indexOf(ev);
      const ctx = at >= 0 ? body.slice(Math.max(0, at - 160), at + ev.length + 160).replace(/\s+/g, ' ') : '(evidence not found verbatim in body)';
      console.log(`  [${f.severity}] ${f.threat} - ${f.message}`);
      console.log(`  evidence : ${ev.replace(/\s+/g, ' ').slice(0, 100)}`);
      console.log(`  context  : ...${ctx}...`);
    }
    shown++;
  }
  console.log(`\n--- ${shown} non-clean entries; findings by threat:`, JSON.stringify(byThreat));
}
main().catch((e) => { console.error(e); process.exit(1); });
