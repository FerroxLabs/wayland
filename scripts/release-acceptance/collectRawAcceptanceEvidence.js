#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  candidateIdentity,
  copyRegularFile,
  exactKeys,
  fail,
  readJsonFile,
  regularFile,
  sha256,
  writeJson,
} = require('./acceptanceBundle');
const matrix = require('./verifyHardeningMatrix');

const CAPABILITIES = ['cowork-office', 'voice', 'mcp', 'sandbox', 'flux'];

function parseArgs(argv) {
  const options = {};
  const known = new Map([
    ['--source', 'source'],
    ['--out', 'out'],
  ]);
  for (let index = 0; index < argv.length; index += 2) {
    const key = known.get(argv[index]);
    const value = argv[index + 1];
    if (!key || !value || value.startsWith('--')) fail('M8I_ARGUMENT_INVALID', argv[index] || 'missing-value');
    options[key] = value;
  }
  if (!options.source || !options.out) fail('M8I_ARGUMENT_INVALID', 'source-and-out-required');
  return options;
}

function expectedEvidence() {
  return [
    ...matrix.INVARIANTS.map((id) => ({ kind: 'invariant', id })),
    ...matrix.CRITERIA.map((id) => ({ kind: 'criterion', id })),
    ...matrix.JOURNEYS.map((id) => ({ kind: 'journey', id })),
    ...matrix.GATES.map((id) => ({ kind: 'hardening-gate', id })),
  ];
}

function validateCandidateBoundRecord(record, candidate, expected, code, extraKeys = []) {
  exactKeys(record, ['contract', 'candidate', ...Object.keys(expected), 'status', 'authority', ...extraKeys], code);
  const observedCandidate = candidateIdentity(record.candidate, code);
  if (observedCandidate.commit !== candidate.commit || observedCandidate.tree !== candidate.tree) {
    fail(code, 'stale-or-foreign-candidate');
  }
  for (const [key, value] of Object.entries(expected)) {
    if (record[key] !== value) fail(code, `misbound:${key}`);
  }
  if (record.status !== 'passed' || record.authority !== 'protected-release-trust-root-observer') {
    fail(code, 'not-passed-by-protected-release-trust-root-observer');
  }
}

function collectRawAcceptanceEvidence(sourceDirectory, outputDirectory) {
  const source = path.resolve(sourceDirectory);
  const output = path.resolve(outputDirectory);
  if (!fs.statSync(source).isDirectory()) fail('M8I_SOURCE_INVALID', 'not-directory');
  if (fs.existsSync(output)) fail('M8I_OUTPUT_INVALID', 'already-exists');
  fs.mkdirSync(output, { recursive: false, mode: 0o700 });

  const candidateFile = readJsonFile(source, 'candidate.json', 'M8I_CANDIDATE_INVALID');
  const candidateRecord = exactKeys(candidateFile.value, ['contract', 'candidate'], 'M8I_CANDIDATE_INVALID');
  if (candidateRecord.contract !== 'wayland-raw-acceptance-candidate/1.0') {
    fail('M8I_CANDIDATE_INVALID', 'unsupported-contract');
  }
  const candidate = candidateIdentity(candidateRecord.candidate);
  const files = [];
  const copy = (relative) => {
    const copied = copyRegularFile(source, relative, output);
    files.push({ path: relative, sha256: copied.sha256 });
    return copied;
  };
  copy('candidate.json');

  for (const { kind, id } of expectedEvidence()) {
    const relative = `proofs/release/${kind}/${id}.json`;
    const proof = readJsonFile(source, relative, 'M8I_RELEASE_EVIDENCE_INVALID');
    validateCandidateBoundRecord(proof.value, candidate, { kind, id }, 'M8I_RELEASE_EVIDENCE_INVALID', [
      'command',
      'exitCode',
      'logSha256',
    ]);
    if (
      proof.value.contract !== 'wayland-raw-release-evidence/1.0' ||
      typeof proof.value.command !== 'string' ||
      proof.value.command.length === 0 ||
      proof.value.exitCode !== 0 ||
      !/^sha256:[a-f0-9]{64}$/.test(String(proof.value.logSha256))
    ) {
      fail('M8I_RELEASE_EVIDENCE_INVALID', 'unsupported-contract');
    }
    copy(relative);
  }

  for (const id of CAPABILITIES) {
    const relative = `proofs/claims/${id}.json`;
    const proof = readJsonFile(source, relative, 'M8I_RELEASE_CLAIM_INVALID');
    exactKeys(
      proof.value,
      ['contract', 'candidate', 'id', 'claimed', 'status', 'authority', 'sourceEvidenceSha256'],
      'M8I_RELEASE_CLAIM_INVALID'
    );
    const observedCandidate = candidateIdentity(proof.value.candidate, 'M8I_RELEASE_CLAIM_INVALID');
    if (
      proof.value.contract !== 'wayland-raw-release-claim-evidence/1.0' ||
      proof.value.id !== id ||
      typeof proof.value.claimed !== 'boolean' ||
      proof.value.status !== 'passed' ||
      proof.value.authority !== 'protected-release-trust-root-observer' ||
      !/^sha256:[a-f0-9]{64}$/.test(String(proof.value.sourceEvidenceSha256)) ||
      observedCandidate.commit !== candidate.commit ||
      observedCandidate.tree !== candidate.tree
    ) {
      fail('M8I_RELEASE_CLAIM_INVALID', `invalid-or-misbound:${id}`);
    }
    copy(relative);
  }

  for (const requirement of matrix.TARGET_GATE_REQUIREMENTS) {
    const relative = `proofs/target-gates/${requirement.target}/${requirement.gate}.json`;
    const proof = readJsonFile(source, relative, 'M8I_TARGET_GATE_EVIDENCE_INVALID');
    validateCandidateBoundRecord(
      proof.value,
      candidate,
      { target: requirement.target, gate: requirement.gate },
      'M8I_TARGET_GATE_EVIDENCE_INVALID',
      ['sourceEvidencePath', 'sourceEvidenceSha256', 'observedPhase', 'trustedObservationSha256']
    );
    const sourceEvidence = regularFile(source, proof.value.sourceEvidencePath, 'M8I_TARGET_GATE_EVIDENCE_INVALID');
    if (
      proof.value.contract !== 'wayland-raw-target-hardening-evidence/1.0' ||
      sha256(sourceEvidence.bytes) !== proof.value.sourceEvidenceSha256 ||
      typeof proof.value.observedPhase !== 'string' ||
      (proof.value.trustedObservationSha256 !== null &&
        !/^sha256:[a-f0-9]{64}$/.test(String(proof.value.trustedObservationSha256)))
    ) {
      fail('M8I_TARGET_GATE_EVIDENCE_INVALID', 'unsupported-contract');
    }
    copy(relative);
  }

  const fixedFiles = [
    'capability-seal.json',
    'updater-observation.json',
    'release-findings-clearance.json',
    'release-blocker-clearance.json',
    'gate-logs/tests.log',
    'gate-logs/typecheck.log',
    'gate-logs/lint.log',
    'gate-logs/build.log',
    'gate-logs/dependency-security.log',
  ];
  for (const target of matrix.TARGETS) fixedFiles.push(`package-smokes/${target}.json`);
  const updaterIndex = readJsonFile(source, 'updater-observation.json', 'M8I_UPDATER_OBSERVATION_INVALID').value;
  exactKeys(updaterIndex, ['contract', 'candidate', 'authority', 'observations'], 'M8I_UPDATER_OBSERVATION_INVALID');
  const updaterCandidate = candidateIdentity(updaterIndex.candidate, 'M8I_UPDATER_OBSERVATION_INVALID');
  if (
    updaterIndex.contract !== 'wayland-updater-protected-observation-index/1.0' ||
    updaterIndex.authority !== 'protected-release-trust-root-observer' ||
    updaterCandidate.commit !== candidate.commit ||
    updaterCandidate.tree !== candidate.tree ||
    !Array.isArray(updaterIndex.observations) ||
    updaterIndex.observations.length !== matrix.TARGETS.length
  ) {
    fail('M8I_UPDATER_OBSERVATION_INVALID', 'index-contract-or-coverage');
  }
  for (let index = 0; index < matrix.TARGETS.length; index += 1) {
    const target = matrix.TARGETS[index];
    const entry = updaterIndex.observations[index];
    exactKeys(entry, ['target', 'observationPath', 'observationSha256'], 'M8I_UPDATER_OBSERVATION_INVALID');
    if (entry.target !== target || entry.observationPath !== `updater-observations/${target}/observation.json`) {
      fail('M8I_UPDATER_OBSERVATION_INVALID', `target-order-or-path:${target}`);
    }
    const observationFile = readJsonFile(source, entry.observationPath, 'M8I_UPDATER_OBSERVATION_INVALID');
    if (sha256(observationFile.bytes) !== entry.observationSha256) {
      fail('M8I_UPDATER_OBSERVATION_INVALID', `digest-mismatch:${target}`);
    }
    const observation = observationFile.value;
    const refs = [
      observation.initialArtifact?.file,
      observation.candidateArtifact?.file,
      observation.rollbackArtifact?.file,
      observation.packageSmoke?.file,
      observation.runtimeEvents?.file,
      ...(Array.isArray(observation.stateSnapshots) ? observation.stateSnapshots.map((snapshot) => snapshot.file) : []),
    ];
    if (refs.some((item) => typeof item !== 'string' || item.length === 0)) {
      fail('M8I_UPDATER_OBSERVATION_INVALID', `missing-bound-file:${target}`);
    }
    fixedFiles.push(entry.observationPath);
    for (const reference of refs) fixedFiles.push(`updater-observations/${target}/${reference}`);
  }
  const capabilitySeal = readJsonFile(source, 'capability-seal.json', 'M8I_CAPABILITY_SEAL_INVALID').value;
  if (!Array.isArray(capabilitySeal.capabilities)) fail('M8I_CAPABILITY_SEAL_INVALID', 'coverage');
  const capabilityModes = new Map(capabilitySeal.capabilities.map((entry) => [entry.id, entry.mode]));
  for (const capability of CAPABILITIES) {
    if (capabilityModes.get(capability) === 'included') {
      fixedFiles.push(`conditional/capability-release-acceptance-${capability}.json`);
    } else if (capabilityModes.get(capability) !== 'excluded') {
      fail('M8I_CAPABILITY_SEAL_INVALID', `unknown-mode:${capability}`);
    }
    if (capabilityModes.get(capability) === 'included') {
      fixedFiles.push(`capability-receipts/${capability}.json`);
      fixedFiles.push(`capability-receipts/${capability}.proof.json`);
      fixedFiles.push(`capability-receipts/${capability}.proof.log`);
    }
  }
  fixedFiles.push('capability-receipts/manifest.json');

  const publisherIndex = readJsonFile(source, 'publisher-artifacts.json', 'M8I_PUBLISHER_INDEX_INVALID');
  exactKeys(publisherIndex.value, ['contract', 'artifacts'], 'M8I_PUBLISHER_INDEX_INVALID');
  if (
    publisherIndex.value.contract !== 'wayland-raw-publisher-artifacts/1.0' ||
    !Array.isArray(publisherIndex.value.artifacts) ||
    publisherIndex.value.artifacts.length !== matrix.TARGETS.length
  ) {
    fail('M8I_PUBLISHER_INDEX_INVALID', 'coverage-mismatch');
  }
  const publisherPaths = new Set();
  for (const artifact of publisherIndex.value.artifacts) {
    exactKeys(artifact, ['assetName', 'releaseTag', 'expectedSha256', 'path'], 'M8I_PUBLISHER_INDEX_INVALID');
    if (
      artifact.releaseTag !== 'v0.12.25' ||
      typeof artifact.assetName !== 'string' ||
      !/^[a-f0-9]{64}$/.test(String(artifact.expectedSha256)) ||
      artifact.path !== `publisher-artifacts/${artifact.assetName}` ||
      publisherPaths.has(artifact.path)
    ) {
      fail('M8I_PUBLISHER_INDEX_INVALID', 'invalid-or-duplicate-artifact');
    }
    publisherPaths.add(artifact.path);
    fixedFiles.push(artifact.path);
  }
  fixedFiles.push('publisher-artifacts.json');

  for (const relative of new Set(fixedFiles)) copy(relative);
  files.sort((left, right) => left.path.localeCompare(right.path));
  const digestSet = new Set(files.map((entry) => `${entry.path}\0${entry.sha256}`));
  if (digestSet.size !== files.length) fail('M8I_RAW_BUNDLE_INVALID', 'duplicate-file-binding');
  writeJson(path.join(output, 'raw-evidence-index.json'), {
    contract: 'wayland-raw-acceptance-evidence-index/1.0',
    candidate,
    files,
    indexSha256: sha256(Buffer.from(JSON.stringify(files))),
  });
  return { candidate, files: files.length, output };
}

module.exports = { CAPABILITIES, collectRawAcceptanceEvidence, expectedEvidence };

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(collectRawAcceptanceEvidence(options.source, options.out))}\n`);
  } catch (error) {
    process.stderr.write(`Raw acceptance evidence rejected: ${error.message}\n`);
    process.exitCode = 1;
  }
}
