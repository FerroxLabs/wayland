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
const { CAPABILITIES, expectedEvidence } = require('./collectRawAcceptanceEvidence');
const matrix = require('./verifyHardeningMatrix');

function parseArgs(argv) {
  const options = {};
  const known = new Map([
    ['--raw', 'raw'],
    ['--out', 'out'],
  ]);
  for (let index = 0; index < argv.length; index += 2) {
    const key = known.get(argv[index]);
    const value = argv[index + 1];
    if (!key || !value || value.startsWith('--')) fail('M8I_ARGUMENT_INVALID', argv[index] || 'missing-value');
    options[key] = value;
  }
  if (!options.raw || !options.out) fail('M8I_ARGUMENT_INVALID', 'raw-and-out-required');
  return options;
}

function verifyRawIndex(rawRoot) {
  const indexFile = readJsonFile(rawRoot, 'raw-evidence-index.json', 'M8I_RAW_INDEX_INVALID');
  const index = exactKeys(indexFile.value, ['contract', 'candidate', 'files', 'indexSha256'], 'M8I_RAW_INDEX_INVALID');
  if (index.contract !== 'wayland-raw-acceptance-evidence-index/1.0' || !Array.isArray(index.files)) {
    fail('M8I_RAW_INDEX_INVALID', 'unsupported-contract-or-files');
  }
  const candidate = candidateIdentity(index.candidate, 'M8I_RAW_INDEX_INVALID');
  if (index.indexSha256 !== sha256(Buffer.from(JSON.stringify(index.files)))) {
    fail('M8I_RAW_INDEX_INVALID', 'index-digest-mismatch');
  }
  const observed = new Set();
  for (const entry of index.files) {
    exactKeys(entry, ['path', 'sha256'], 'M8I_RAW_INDEX_INVALID');
    if (observed.has(entry.path)) fail('M8I_RAW_INDEX_INVALID', 'duplicate-path');
    observed.add(entry.path);
    const file = regularFile(rawRoot, entry.path, 'M8I_RAW_INDEX_INVALID');
    if (sha256(file.bytes) !== entry.sha256) fail('M8I_RAW_INDEX_INVALID', `file-digest-mismatch:${entry.path}`);
  }
  return { candidate, indexedPaths: observed };
}

function requireIndexed(indexedPaths, relative) {
  if (!indexedPaths.has(relative)) fail('M8I_RAW_INDEX_INVALID', `unindexed-required-file:${relative}`);
}

function generateTrustRootAcceptance(rawDirectory, outputDirectory) {
  const rawRoot = path.resolve(rawDirectory);
  const output = path.resolve(outputDirectory);
  if (fs.existsSync(output)) fail('M8I_OUTPUT_INVALID', 'already-exists');
  fs.mkdirSync(output, { recursive: false, mode: 0o700 });
  const { candidate, indexedPaths } = verifyRawIndex(rawRoot);
  const candidateRecord = readJsonFile(rawRoot, 'candidate.json', 'M8I_CANDIDATE_INVALID').value;
  exactKeys(candidateRecord, ['contract', 'candidate'], 'M8I_CANDIDATE_INVALID');
  const rawCandidate = candidateIdentity(candidateRecord.candidate, 'M8I_CANDIDATE_INVALID');
  if (rawCandidate.commit !== candidate.commit || rawCandidate.tree !== candidate.tree) {
    fail('M8I_CANDIDATE_INVALID', 'index-candidate-mismatch');
  }

  const evidenceEntries = [];
  for (const { kind, id } of expectedEvidence()) {
    const rawRelative = `proofs/release/${kind}/${id}.json`;
    requireIndexed(indexedPaths, rawRelative);
    const outputRelative = `evidence/release/${kind}/${id}.json`;
    const copied = copyRegularFile(rawRoot, rawRelative, output, outputRelative);
    evidenceEntries.push({ kind, id, evidencePath: outputRelative, evidenceSha256: copied.sha256 });
  }
  const evidenceManifestPath = path.join(output, 'release-evidence-manifest.json');
  writeJson(evidenceManifestPath, {
    contract: 'wayland-release-evidence-manifest/1.0',
    candidate,
    evidence: evidenceEntries,
  });

  const claims = [];
  for (const id of CAPABILITIES) {
    const rawRelative = `proofs/claims/${id}.json`;
    requireIndexed(indexedPaths, rawRelative);
    const proof = readJsonFile(rawRoot, rawRelative, 'M8I_RELEASE_CLAIM_INVALID').value;
    const outputRelative = `evidence/claims/${id}.json`;
    const copied = copyRegularFile(rawRoot, rawRelative, output, outputRelative);
    claims.push({ id, claimed: proof.claimed, evidencePath: outputRelative, evidenceSha256: copied.sha256 });
  }
  const claimsManifestPath = path.join(output, 'release-claims-manifest.json');
  writeJson(claimsManifestPath, {
    contract: 'wayland-release-claims-manifest/1.0',
    candidate,
    capabilities: claims,
  });

  const targetReceiptPaths = [];
  for (const requirement of matrix.TARGET_GATE_REQUIREMENTS) {
    const rawRelative = `proofs/target-gates/${requirement.target}/${requirement.gate}.json`;
    requireIndexed(indexedPaths, rawRelative);
    const evidenceRelative = `target-gates/evidence/${requirement.target}/${requirement.gate}.json`;
    const evidence = copyRegularFile(rawRoot, rawRelative, output, evidenceRelative);
    const receiptRelative = `target-gates/${requirement.target}/${requirement.gate}.json`;
    const receiptPath = path.join(output, receiptRelative);
    writeJson(receiptPath, {
      contract: requirement.contract,
      receiptId: requirement.receiptId,
      candidate,
      target: requirement.target,
      gate: requirement.gate,
      authority: matrix.TARGET_GATE_RECEIPT_SCHEMA.authority,
      evidencePath: path.posix.join('evidence', requirement.target, `${requirement.gate}.json`),
      evidenceSha256: evidence.sha256,
    });
    targetReceiptPaths.push(receiptPath);
  }

  const inputRoot = path.join(output, 'inputs');
  const capabilitySeal = readJsonFile(rawRoot, 'capability-seal.json', 'M8I_CAPABILITY_SEAL_INVALID');
  const sealCandidate = candidateIdentity(capabilitySeal.value.candidate, 'M8I_CAPABILITY_SEAL_INVALID');
  if (sealCandidate.commit !== candidate.commit || sealCandidate.tree !== candidate.tree) {
    fail('M8I_CAPABILITY_SEAL_INVALID', 'stale-or-foreign-candidate');
  }
  copyRegularFile(rawRoot, 'capability-seal.json', inputRoot, 'capability-seal.json');

  const packageSmokes = matrix.TARGETS.map((target) => {
    const relative = `package-smokes/${target}.json`;
    requireIndexed(indexedPaths, relative);
    const copied = copyRegularFile(rawRoot, relative, inputRoot, relative);
    return { target, receiptPath: copied.path };
  });

  const publisherIndex = readJsonFile(rawRoot, 'publisher-artifacts.json', 'M8I_PUBLISHER_INDEX_INVALID').value;
  const publisherArtifacts = publisherIndex.artifacts.map((artifact) => {
    requireIndexed(indexedPaths, artifact.path);
    const copied = copyRegularFile(rawRoot, artifact.path, inputRoot, artifact.path);
    if (copied.sha256 !== `sha256:${artifact.expectedSha256}`) {
      fail('M8I_PUBLISHER_INDEX_INVALID', `archive-digest-mismatch:${artifact.assetName}`);
    }
    return {
      artifactPath: copied.path,
      assetName: artifact.assetName,
      releaseTag: artifact.releaseTag,
      expectedSha256: artifact.expectedSha256,
    };
  });

  const findings = copyRegularFile(
    rawRoot,
    'release-findings-clearance.json',
    inputRoot,
    'release-findings-clearance.json'
  );
  const blockers = copyRegularFile(
    rawRoot,
    'release-blocker-clearance.json',
    inputRoot,
    'release-blocker-clearance.json'
  );

  const capabilityReceiptsDirectory = path.join(inputRoot, 'capability-receipts');
  const capabilityAuthorityPaths = [];
  const included = new Set(
    capabilitySeal.value.capabilities.filter((entry) => entry.mode === 'included').map((entry) => entry.id)
  );
  for (const relative of ['capability-receipts/manifest.json']) {
    requireIndexed(indexedPaths, relative);
    capabilityAuthorityPaths.push(copyRegularFile(rawRoot, relative, inputRoot, relative).path);
  }
  for (const id of CAPABILITIES.filter((capabilityId) => included.has(capabilityId))) {
    for (const relative of [
      `capability-receipts/${id}.json`,
      `capability-receipts/${id}.proof.json`,
      `capability-receipts/${id}.proof.log`,
    ]) {
      requireIndexed(indexedPaths, relative);
      capabilityAuthorityPaths.push(copyRegularFile(rawRoot, relative, inputRoot, relative).path);
    }
  }

  const conditionalReceiptPaths = [];
  const conditionalReceipts = CAPABILITIES.filter((id) => included.has(id)).map((capabilityId) => {
    const relative = `conditional/capability-release-acceptance-${capabilityId}.json`;
    requireIndexed(indexedPaths, relative);
    const copied = copyRegularFile(rawRoot, relative, inputRoot, relative);
    conditionalReceiptPaths.push(copied.path);
    return { capabilityId, receiptPath: copied.path };
  });

  const updaterIndex = readJsonFile(rawRoot, 'updater-observation.json', 'M8I_UPDATER_OBSERVATION_INVALID').value;
  const updaterObservations = [];
  for (const target of matrix.TARGETS) {
    const prefix = `updater-observations/${target}/`;
    const members = [...indexedPaths].filter((relative) => relative.startsWith(prefix)).sort();
    if (!members.includes(`${prefix}observation.json`)) {
      fail('M8I_UPDATER_OBSERVATION_INVALID', `missing-observation:${target}`);
    }
    for (const relative of members) copyRegularFile(rawRoot, relative, inputRoot, relative);
    const indexed = updaterIndex.observations.find((entry) => entry.target === target);
    if (!indexed || indexed.observationPath !== `${prefix}observation.json`) {
      fail('M8I_UPDATER_OBSERVATION_INVALID', `index-mismatch:${target}`);
    }
    updaterObservations.push({
      target,
      observationPath: path.join(inputRoot, indexed.observationPath),
    });
  }

  const hardeningMatrix = JSON.parse(fs.readFileSync(matrix.MATRIX_FILE, 'utf8'));
  const requestPath = path.join(output, 'final-acceptance-request.json');
  writeJson(requestPath, {
    contract: 'wayland-final-acceptance-request/1.0',
    candidate,
    hardeningMatrix,
    capabilitySeal: capabilitySeal.value,
    packageSmokes,
    targetGateReceipts: { receiptsDirectory: path.join(output, 'target-gates') },
    releaseEvidenceManifest: { manifestPath: evidenceManifestPath },
    releaseClaimsManifest: { manifestPath: claimsManifestPath },
    publisherArtifacts,
    updaterEvidence: { observations: updaterObservations },
    conditionalReceipts,
    findingsEvidence: { receiptPath: findings.path },
    releaseBlockersEvidence: { receiptPath: blockers.path },
  });

  const subjectPaths = [
    ...targetReceiptPaths,
    evidenceManifestPath,
    claimsManifestPath,
    requestPath,
    path.join(inputRoot, 'capability-seal.json'),
    ...packageSmokes.map((entry) => entry.receiptPath),
    ...updaterObservations.map((entry) => entry.observationPath),
    ...capabilityAuthorityPaths,
    ...conditionalReceiptPaths,
    findings.path,
    blockers.path,
  ];
  const subjects = subjectPaths.map((subjectPath) => ({
    path: subjectPath,
    sha256: sha256(fs.readFileSync(subjectPath)),
  }));
  if (new Set(subjects.map((subject) => subject.path)).size !== subjects.length) {
    fail('M8I_ACCEPTANCE_SUBJECT_INVALID', 'duplicate-subject-path');
  }
  writeJson(path.join(output, 'attestation-subjects.json'), {
    contract: 'wayland-release-acceptance-attestation-subjects/1.0',
    candidate,
    subjects,
  });
  return {
    candidate,
    requestPath,
    evidenceManifestPath,
    claimsManifestPath,
    targetReceiptsDirectory: path.join(output, 'target-gates'),
    capabilityReceiptsDirectory,
    subjects: subjects.length,
  };
}

module.exports = { generateTrustRootAcceptance };

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(generateTrustRootAcceptance(options.raw, options.out))}\n`);
  } catch (error) {
    process.stderr.write(`Trust-root acceptance generation rejected: ${error.message}\n`);
    process.exitCode = 1;
  }
}
