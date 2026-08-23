#!/usr/bin/env node

'use strict';

/**
 * The Constitution fixture corpus under tests/fixtures/constitution-fs/ carries a
 * supply-chain authenticity assertion: constitutionFsService.test.ts re-derives the
 * producer commit's tree, archive digest, source region and harness-patch fit
 * straight out of git history. That is the right assertion - the fixture's whole
 * claim is "these bytes were produced by that commit" - and it cannot be satisfied
 * from vendored data, because the tree hash is a hash of the entire 140MB tree.
 *
 * The producer commit is reachable from NO ref on origin: 0 of 151 remote branches
 * and 0 of 48 tags contain it (a control commit on main is contained in 59). It
 * survives only as an unreferenced object that GitHub still serves by SHA. So a
 * clone, a `git fetch`, and a `git fetch --tags` all leave it absent, and both
 * provenance tests fail with a bare `git rev-parse ... unknown revision` that names
 * no remedy.
 *
 * This script is that remedy, in one place: check for the object, and fetch it by
 * SHA if it is missing. postinstall calls it (non-fatal, and a no-op once the
 * object is present) so a fresh clone heals itself, and the test names this script
 * when the object is still absent. Network I/O stays out of the unit suite and the
 * assertion keeps demanding real history.
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(
  ROOT,
  'tests',
  'fixtures',
  'constitution-fs',
  'base-991c502-committed',
  'fixture-manifest.json'
);

const REMEDY_COMMAND = 'node scripts/ensureConstitutionProducerCommit.js';

function readProducerCommit(manifestPath = MANIFEST_PATH) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const commit = manifest.producerCommit;
  if (typeof commit !== 'string' || !/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error(`fixture manifest ${manifestPath} has no 40-hex producerCommit`);
  }
  return commit;
}

/**
 * True only when the object is present locally as a commit. `git cat-file -e`
 * exits non-zero for a missing object and for a non-repository, and spawnSync
 * reports status null when git itself is unavailable - all of which are "absent".
 */
function hasProducerCommit(commit, cwd = ROOT) {
  const probe = spawnSync('git', ['cat-file', '-e', `${commit}^{commit}`], { cwd, stdio: 'ignore' });
  return probe.status === 0;
}

function fetchProducerCommit(commit, cwd = ROOT, stdio = 'ignore') {
  // depth=1 carries the trees and blobs the assertion reads. It grafts a shallow
  // boundary for this commit alone; the commit is an ancestor of nothing, so no
  // other history in the clone is affected.
  const fetched = spawnSync('git', ['fetch', '--depth=1', '--no-tags', 'origin', commit], { cwd, stdio });
  return fetched.status === 0;
}

function ensureConstitutionProducerCommit(options = {}) {
  const cwd = options.cwd || ROOT;
  const manifestPath = options.manifestPath || MANIFEST_PATH;
  const commit = readProducerCommit(manifestPath);

  if (hasProducerCommit(commit, cwd)) {
    return { commit, present: true, fetched: false };
  }
  const fetched = fetchProducerCommit(commit, cwd, options.stdio || 'ignore');
  return { commit, present: fetched && hasProducerCommit(commit, cwd), fetched };
}

function main() {
  let result;
  try {
    result = ensureConstitutionProducerCommit({ stdio: 'inherit' });
  } catch (error) {
    console.error(`[constitution-producer] ${error.message}`);
    process.exit(1);
  }
  if (result.present && !result.fetched) {
    console.log(`[constitution-producer] ${result.commit} already present`);
    return;
  }
  if (result.present) {
    console.log(`[constitution-producer] fetched ${result.commit} from origin`);
    return;
  }
  console.error(
    `[constitution-producer] could not obtain ${result.commit} from origin.\n` +
      `It is reachable from no ref on origin, so it can only be fetched by SHA:\n` +
      `  git fetch --depth=1 --no-tags origin ${result.commit}\n` +
      `Check network access to github.com and that 'origin' points at the Wayland repository.`
  );
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = ensureConstitutionProducerCommit;
module.exports.ensureConstitutionProducerCommit = ensureConstitutionProducerCommit;
module.exports.readProducerCommit = readProducerCommit;
module.exports.hasProducerCommit = hasProducerCommit;
module.exports.fetchProducerCommit = fetchProducerCommit;
module.exports.MANIFEST_PATH = MANIFEST_PATH;
module.exports.REMEDY_COMMAND = REMEDY_COMMAND;
