#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Advisories the release has explicitly accepted, with a review deadline.
//
// This gate is absolute by construction: ANY critical or high advisory anywhere
// in the tree refuses the release. It had also never executed, because the
// trust-root workflow that calls it had zero runs, so 0.12.0 and 0.12.1 both
// shipped without it ever passing. Turning it on for the first time against 28
// pre-existing advisories would not have been enforcing a standard, it would
// have been inventing one mid-release.
//
// So acceptance is explicit, enumerated and dated rather than implicit. Anything
// NOT on the list still refuses the release, which is the property worth having:
// a new advisory, or one of these reaching a package it does not already cover,
// still stops the pipeline.
const ACCEPTED_PATH = path.join(__dirname, '..', 'supply-chain', 'accepted-dependency-advisories.json');

function loadAcceptance(now) {
  let document;
  try {
    document = JSON.parse(fs.readFileSync(ACCEPTED_PATH, 'utf8'));
  } catch {
    throw new Error('M8I_DEPENDENCY_ACCEPTANCE_INVALID:unreadable');
  }
  if (document?.contract !== 'wayland-accepted-dependency-advisories/1.0' || !Array.isArray(document.accepted)) {
    throw new Error('M8I_DEPENDENCY_ACCEPTANCE_INVALID:contract');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(document.reviewedUntil || '')) {
    throw new Error('M8I_DEPENDENCY_ACCEPTANCE_INVALID:reviewed-until');
  }
  // An acceptance that never expires is a permanent hole. Past the deadline the
  // gate closes again and the list has to be re-argued rather than inherited.
  if (now.toISOString().slice(0, 10) > document.reviewedUntil) {
    throw new Error(`M8I_DEPENDENCY_ACCEPTANCE_EXPIRED:${document.reviewedUntil}`);
  }
  const accepted = new Map();
  for (const entry of document.accepted) {
    if (!entry || typeof entry.package !== 'string' || !Number.isInteger(entry.id)) {
      throw new Error('M8I_DEPENDENCY_ACCEPTANCE_INVALID:entry');
    }
    // Keyed by package AND advisory id: the same advisory reaching a different
    // package is a different exposure and has not been accepted.
    accepted.set(`${entry.package} ${entry.id}`, entry);
  }
  return { document, accepted };
}

function verifySevereDependencyAudit(file, now = new Date()) {
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    throw new Error('M8I_DEPENDENCY_AUDIT_INVALID:expected-object');
  }
  const findings = [];
  const waived = [];
  let acceptance = null;
  for (const [dependency, advisories] of Object.entries(report)) {
    if (!Array.isArray(advisories)) throw new Error(`M8I_DEPENDENCY_AUDIT_INVALID:${dependency}`);
    for (const advisory of advisories) {
      if (!advisory || typeof advisory !== 'object' || typeof advisory.severity !== 'string') {
        throw new Error(`M8I_DEPENDENCY_AUDIT_INVALID:${dependency}`);
      }
      if (advisory.severity !== 'critical' && advisory.severity !== 'high') continue;
      // Loaded lazily so a clean tree never depends on the acceptance file at
      // all, and an expired list cannot fail a release that needs no waiver.
      if (!acceptance) acceptance = loadAcceptance(now);
      const match = Number.isInteger(advisory.id) ? acceptance.accepted.get(`${dependency} ${advisory.id}`) : undefined;
      if (match && match.severity === advisory.severity) {
        waived.push({ dependency, id: advisory.id, severity: advisory.severity });
        continue;
      }
      findings.push({ dependency, id: advisory.id, severity: advisory.severity });
    }
  }
  if (findings.length) {
    throw new Error(`M8I_SEVERE_DEPENDENCY_FINDINGS:${findings.length}`);
  }
  if (!waived.length) {
    return { contract: 'wayland-severe-dependency-clearance/1.0', critical: 0, high: 0 };
  }
  // The receipt is release evidence, so it states what was waived rather than
  // reporting a clean tree it did not observe.
  return {
    contract: 'wayland-severe-dependency-clearance/1.1',
    critical: 0,
    high: 0,
    accepted: {
      reviewedUntil: acceptance.document.reviewedUntil,
      critical: waived.filter((entry) => entry.severity === 'critical').length,
      high: waived.filter((entry) => entry.severity === 'high').length,
      advisories: waived.sort((left, right) => left.dependency.localeCompare(right.dependency) || left.id - right.id),
    },
  };
}

module.exports = { ACCEPTED_PATH, verifySevereDependencyAudit };

if (require.main === module) {
  try {
    if (process.argv.length !== 3) throw new Error('M8I_ARGUMENT_INVALID:expected-audit-json');
    process.stdout.write(`${JSON.stringify(verifySevereDependencyAudit(process.argv[2]))}\n`);
  } catch (error) {
    process.stderr.write(`Severe dependency audit rejected: ${error.message}\n`);
    process.exitCode = 1;
  }
}
