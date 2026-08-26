#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bundle a new Wayland Core release. FIVE coupled edits, in one command.
 *
 * The descriptor check is exact-match on every field, so the corpus, the pin
 * constant and the bundled binary move together or 100% of conversations die on
 * frame one. Doing this by hand is how the fifth edit gets forgotten - the
 * v0.13.7 bump missed `publisher-attestations.json` and only the full suite
 * caught it.
 *
 *   1. DEFAULT_WCORE_VERSION            (via stage-wcore-bump)
 *   2. bundled-wcore-shasums.json       (via stage-wcore-bump)
 *   3. installer postinstall WCORE_VERSION (via stage-wcore-bump)
 *   4. contracts/wayland-desktop-core/v1 corpus + DESKTOP_CORE_V1_PIN
 *      + DESKTOP_CORE_V1_PRODUCER_COMMIT
 *   5. scripts/supply-chain/publisher-attestations.json
 *
 * Every value is READ from the signed release - the corpus from the release's
 * own `desktop-contract-v1` asset (whose sha256 is checked against the
 * attestation), the attestation fields from `gh attestation verify`. Nothing is
 * assumed or hand-transcribed.
 *
 * Usage:
 *   node scripts/bump-core-engine.mjs v0.13.8            # dry run - reports the delta
 *   node scripts/bump-core-engine.mjs v0.13.8 --write    # apply all five
 *
 * This does NOT touch tests. Test assertions that restate the pin are a
 * judgement call - they carry the reasoning for WHY the pin moved - so the run
 * ends by naming exactly which ones need re-deriving.
 */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const REPO = 'FerroxLabs/wayland-core';
const CORPUS = path.join(ROOT, 'contracts', 'wayland-desktop-core', 'v1');
const PIN_FILE = path.join(ROOT, 'src', 'process', 'agent', 'wcore', 'desktopContractV1.ts');
const ATTEST_FILE = path.join(ROOT, 'scripts', 'supply-chain', 'publisher-attestations.json');

const tag = process.argv[2];
const write = process.argv.includes('--write');
if (!tag || !/^v\d+\.\d+\.\d+$/.test(tag)) {
  console.error('usage: node scripts/bump-core-engine.mjs vX.Y.Z [--write]');
  process.exit(2);
}

const sh = (cmd, args, env) =>
  execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, ...env } });
const say = (m) => console.log(m);
const fail = (m) => {
  console.error(`bump-core-engine: ${m}`);
  process.exit(1);
};

// ── 1-3: the three edits stage-wcore-bump already owns ────────────────────
say(`\n=== 1-3. engine pin + checksums + installer (${tag}) ===`);
const stageArgs = [path.join(__dirname, 'stage-wcore-bump.mjs'), tag];
if (write) stageArgs.push('--write');
say(sh('node', stageArgs, { WCORE_BUMP_NESTED: '1' }).trim());

// ── 4: corpus re-import from the SIGNED asset ─────────────────────────────
say(`\n=== 4. contract corpus + pin ===`);
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'wcore-contract-'));
const asset = `wayland-core-${tag}-desktop-contract-v1.tar.gz`;
sh('gh', ['release', 'download', tag, '-R', REPO, '-p', asset, '-D', work, '--clobber']);
const assetPath = path.join(work, asset);
const assetSha = crypto.createHash('sha256').update(fs.readFileSync(assetPath)).digest('hex');

// The release's own checksums file is the trust anchor the engine archive uses.
// `gh release download` writes a FILE and prints nothing, so its stdout is the
// empty string. Chaining the read off it with && silently skipped the read and
// reported "the release publishes no checksum" against a release that publishes
// one - a false alarm that looks exactly like a real supply-chain refusal.
sh('gh', ['release', 'download', tag, '-R', REPO, '-p', 'wayland-core-checksums.txt', '-D', work, '--clobber']);
const checksums = fs.readFileSync(path.join(work, 'wayland-core-checksums.txt'), 'utf8');
const expected = checksums.split('\n').map((l) => l.trim().split(/\s+/)).find((p) => p[1]?.replace(/^\*/, '') === asset)?.[0];
if (!expected) fail(`the release publishes no checksum for ${asset}`);
if (expected !== assetSha) fail(`${asset} failed its checksum: expected ${expected}, got ${assetSha}`);
say(`  ${asset} checksum OK (${assetSha.slice(0, 16)}…)`);

sh('tar', ['xzf', assetPath, '-C', work]);
const src = path.join(work, 'desktop', 'v1');
if (!fs.existsSync(path.join(src, 'manifest.json'))) fail('asset carries no desktop/v1/manifest.json');
const manifest = JSON.parse(fs.readFileSync(path.join(src, 'manifest.json'), 'utf8'));

const current = JSON.parse(fs.readFileSync(path.join(CORPUS, 'manifest.json'), 'utf8'));
const names = (d, k) => {
  const v = d[k];
  if (Array.isArray(v)) return new Set(v.map((e) => (typeof e === 'string' ? e : (e?.name ?? JSON.stringify(e)))));
  if (v && typeof v === 'object') return new Set(Object.keys(v));
  return new Set();
};
say(`  contract ${current.contract.minor}/${current.generator}  ->  ${manifest.contract.minor}/${manifest.generator}`);
say(`  counts ${JSON.stringify(current.counts)} -> ${JSON.stringify(manifest.counts)}`);
for (const key of ['capabilities', 'commands', 'events', 'child_types']) {
  const before = names(current, key);
  const after = names(manifest, key);
  const added = [...after].filter((n) => !before.has(n));
  const removed = [...before].filter((n) => !after.has(n));
  if (added.length) say(`  ${key} ADDED:   ${JSON.stringify(added)}`);
  if (removed.length) say(`  ${key} REMOVED: ${JSON.stringify(removed)}  <-- NOT additive, read this carefully`);
}

// The ready fixture is the frame a real engine sends on line one. If it and the
// manifest disagree, the release is internally inconsistent and no pin is safe.
const ready = JSON.parse(fs.readFileSync(path.join(src, 'events', 'ready.json'), 'utf8'));
const findContract = (o) => {
  if (o && typeof o === 'object') {
    if ('fixture_digest' in o && 'generator' in o) return o;
    for (const v of Object.values(o)) {
      const r = findContract(v);
      if (r) return r;
    }
  }
  return null;
};
const rc = findContract(ready);
if (!rc) fail('the ready fixture carries no contract block');
const mismatched = ['minor', 'generator', 'fixture_digest', 'schema_digest', 'source_inputs_digest'].filter(
  (k) => (k === 'minor' ? rc.minor !== manifest.contract.minor : rc[k] !== manifest[k])
);
if (mismatched.length) fail(`ready fixture disagrees with manifest on ${mismatched.join(', ')} - refusing to pin`);
if (JSON.stringify(rc.capabilities) !== JSON.stringify(manifest.capabilities)) {
  fail('ready fixture capabilities disagree with the manifest - refusing to pin');
}
say('  ready fixture agrees with the manifest on every descriptor field');

// ── 5: publisher attestation, read from the real provenance ───────────────
say(`\n=== 5. publisher attestation ===`);
const att = JSON.parse(sh('gh', ['attestation', 'verify', assetPath, '--repo', REPO, '--format', 'json']));
const cert = att[0]?.verificationResult?.signature?.certificate;
if (!cert) fail('attestation carried no certificate - refusing to record a policy');
const policy = {
  id: `wayland-core-${tag}-release`,
  status: 'active',
  releaseTag: tag,
  repository: REPO,
  signerWorkflow: String(cert.buildSignerURI).replace('https://github.com/', '').split('@')[0],
  sourceRef: cert.sourceRepositoryRef,
  sourceDigest: cert.sourceRepositoryDigest,
  predicateType: 'https://slsa.dev/provenance/v1',
  oidcIssuer: cert.issuer,
  runner: cert.runnerEnvironment,
};
say(`  provenance verified: ${policy.sourceDigest} on ${policy.sourceRef}`);

if (!write) {
  say(`\nDRY RUN - nothing written. Re-run with --write to apply all five.`);
  process.exit(0);
}

// Apply 4: corpus (PRODUCER-PIN.md is Desktop-authored, preserve it).
const keep = fs.readFileSync(path.join(CORPUS, 'PRODUCER-PIN.md'), 'utf8');
sh('cp', ['-R', `${src}/.`, `${CORPUS}/`]);
fs.writeFileSync(path.join(CORPUS, 'PRODUCER-PIN.md'), keep);
let mismatches = 0;
const walk = (dir, rel = '') => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = path.join(rel, e.name);
    if (e.isDirectory()) walk(path.join(dir, e.name), r);
    else {
      const a = crypto.createHash('sha256').update(fs.readFileSync(path.join(src, r))).digest('hex');
      const b = crypto.createHash('sha256').update(fs.readFileSync(path.join(CORPUS, r))).digest('hex');
      if (a !== b) {
        mismatches += 1;
        console.error(`  MISMATCH ${r}`);
      }
    }
  }
};
walk(src);
if (mismatches) fail(`${mismatches} file(s) did not import byte-for-byte`);
say(`  corpus imported byte-for-byte`);

// Apply 4b: the pin constant + producer commit.
let pinSrc = fs.readFileSync(PIN_FILE, 'utf8');
const shortSha = policy.sourceDigest.slice(0, 8);
pinSrc = pinSrc.replace(/export const DESKTOP_CORE_V1_PRODUCER_COMMIT = '[0-9a-f]+' as const;/,
  `export const DESKTOP_CORE_V1_PRODUCER_COMMIT = '${shortSha}' as const;`);
const caps = Object.entries(manifest.capabilities).sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([k, v]) => `    ${k}: '${v}',\n`).join('');
const start = pinSrc.indexOf('export const DESKTOP_CORE_V1_PIN = {');
const end = pinSrc.indexOf('} as const;', start) + '} as const;'.length;
pinSrc = pinSrc.slice(0, start) +
  `export const DESKTOP_CORE_V1_PIN = {\n` +
  `  name: '${manifest.contract.name}',\n  major: ${manifest.contract.major},\n  minor: ${manifest.contract.minor},\n` +
  `  generator: '${manifest.generator}',\n  fixtureDigest: '${manifest.fixture_digest}',\n` +
  `  schemaDigest: '${manifest.schema_digest}',\n  sourceInputsDigest: '${manifest.source_inputs_digest}',\n` +
  `  capabilities: {\n${caps}  },\n} as const;` + pinSrc.slice(end);
fs.writeFileSync(PIN_FILE, pinSrc);
say(`  DESKTOP_CORE_V1_PIN -> ${manifest.contract.minor}/${manifest.generator}, producer ${shortSha}`);

// Apply 5: attestation policy, superseding the previous active core policy.
const attest = JSON.parse(fs.readFileSync(ATTEST_FILE, 'utf8'));
let lastCore = -1;
attest.policies.forEach((p, i) => {
  if (p.repository === REPO) {
    if (p.status === 'active') p.status = 'superseded';
    lastCore = i;
  }
});
if (attest.policies.some((p) => p.releaseTag === tag && p.repository === REPO)) {
  fail(`a policy for ${tag} already exists - refusing to add a duplicate (the verifier requires exactly one)`);
}
attest.policies.splice(lastCore + 1, 0, policy);
fs.writeFileSync(ATTEST_FILE, `${JSON.stringify(attest, null, 2)}\n`);
say(`  publisher-attestations: added ${policy.id}, previous core policy superseded`);

say(`\n=== ALL FIVE APPLIED. Now, in order: ===`);
say(`  1. Re-derive the pin restatements in`);
say(`     tests/unit/process/agent/wcore/desktopContractV1.test.ts`);
say(`     - DESKTOP_CORE_V1_PRODUCER_COMMIT -> '${shortSha}'`);
say(`     - manifest.contract minor -> ${manifest.contract.minor}`);
say(`     - counts -> ${JSON.stringify(manifest.counts)}`);
say(`     - the coupled-edit guard: DESKTOP_CORE_V1_PIN.minor -> ${manifest.contract.minor}`);
say(`       and DEFAULT_WCORE_VERSION -> '${tag}'`);
say(`     Carry the REASONING for why the pin moved, not just the numbers.`);
say(`  2. Update contracts/wayland-desktop-core/v1/PRODUCER-PIN.md`);
say(`  3. bun run typecheck`);
say(`  4. Full suite on Hetzner - a targeted run will NOT find every consumer.`);
say(`  5. Re-pack AND re-smoke BOTH platforms. The engine changed; prior passes do not carry.`);
