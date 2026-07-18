#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

function verifySevereDependencyAudit(file) {
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    throw new Error('M8I_DEPENDENCY_AUDIT_INVALID:expected-object');
  }
  const findings = [];
  for (const [dependency, advisories] of Object.entries(report)) {
    if (!Array.isArray(advisories)) throw new Error(`M8I_DEPENDENCY_AUDIT_INVALID:${dependency}`);
    for (const advisory of advisories) {
      if (!advisory || typeof advisory !== 'object' || typeof advisory.severity !== 'string') {
        throw new Error(`M8I_DEPENDENCY_AUDIT_INVALID:${dependency}`);
      }
      if (advisory.severity === 'critical' || advisory.severity === 'high') {
        findings.push({ dependency, id: advisory.id, severity: advisory.severity });
      }
    }
  }
  if (findings.length) {
    throw new Error(`M8I_SEVERE_DEPENDENCY_FINDINGS:${findings.length}`);
  }
  return { contract: 'wayland-severe-dependency-clearance/1.0', critical: 0, high: 0 };
}

module.exports = { verifySevereDependencyAudit };

if (require.main === module) {
  try {
    if (process.argv.length !== 3) throw new Error('M8I_ARGUMENT_INVALID:expected-audit-json');
    process.stdout.write(`${JSON.stringify(verifySevereDependencyAudit(process.argv[2]))}\n`);
  } catch (error) {
    process.stderr.write(`Severe dependency audit rejected: ${error.message}\n`);
    process.exitCode = 1;
  }
}
