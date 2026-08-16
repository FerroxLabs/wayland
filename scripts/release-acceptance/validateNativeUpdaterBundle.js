#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { verifyUpdaterObservation } = require('./verifyUpdaterObservation.js');

const TARGETS = new Set(['darwin-arm64', 'darwin-x64', 'win32-arm64', 'win32-x64', 'linux-arm64', 'linux-x64']);
// The signing job feeds this basename straight into an attestation subject-path, so it
// is held to a strict allowlist rather than only to "contains no separator". A newline
// would otherwise smuggle a second subject through $GITHUB_OUTPUT.
const BUNDLE_LOCAL_NAME = /^[A-Za-z0-9][A-Za-z0-9._+-]*$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40,64}$/;

function sha256(bytes) {
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

function regularFile(filePath, label) {
  const resolved = path.resolve(filePath);
  const stat = fs.lstatSync(resolved);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size === 0) throw new Error(`${label} is not a regular file`);
  return { path: resolved, bytes: fs.readFileSync(resolved), size: stat.size };
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} is not an object`);
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())) {
    throw new Error(`${label} has missing or unknown fields`);
  }
  return value;
}

/**
 * The signing job runs before any provenance for these bytes exists, so the canonical
 * verifier's `gh attestation verify` calls cannot succeed here. This substitute bypasses
 * exactly that impossible precondition and nothing else.
 *
 * It is deliberately allowlist-driven and digest-aware. The canonical verifier now
 * attests two different files - the observation receipt and, on linux, the candidate
 * installer - through the same injected implementation, so a stub that always answers
 * with the observation digest would make the candidate check pass for the wrong bytes.
 * Instead each allowed path answers with the digest of its own bytes, read from disk at
 * construction time, and any other path is refused. Every publisher, catalog,
 * package-smoke, event, snapshot and continuity check is still replayed for real.
 */
function isBundleLocalName(value) {
  return (
    typeof value === 'string' &&
    BUNDLE_LOCAL_NAME.test(value) &&
    value !== '.' &&
    value !== '..' &&
    !path.isAbsolute(value) &&
    path.basename(value) === value
  );
}

function createLocalAttestationSubstitute(allowedPaths) {
  const subjects = new Map();
  for (const candidatePath of allowedPaths) {
    const resolved = path.resolve(candidatePath);
    const file = regularFile(resolved, 'attested subject');
    subjects.set(resolved, sha256(file.bytes).slice('sha256:'.length));
  }
  return (command, args) => {
    if (command !== 'gh' || !Array.isArray(args) || args[0] !== 'attestation' || args[1] !== 'verify') {
      throw new Error('local attestation substitute refused an unexpected command');
    }
    const requested = path.resolve(String(args[2] || ''));
    const digest = subjects.get(requested);
    if (!digest) throw new Error(`local attestation substitute refused unbound subject: ${args[2]}`);
    return JSON.stringify([
      {
        verificationResult: {
          statement: {
            predicateType: 'https://slsa.dev/provenance/v1',
            subject: [{ digest: { sha256: digest } }],
          },
        },
      },
    ]);
  };
}

function boundFile(root, reference, label) {
  exactKeys(reference, ['file', 'sha256', 'size'], `${label} reference`);
  if (path.isAbsolute(reference.file) || reference.file.split(/[\\/]+/).includes('..'))
    throw new Error(`${label} escapes bundle`);
  if (!SHA256.test(reference.sha256) || !Number.isSafeInteger(reference.size) || reference.size <= 0) {
    throw new Error(`${label} binding is malformed`);
  }
  const file = regularFile(path.join(root, reference.file), label);
  if (sha256(file.bytes) !== reference.sha256 || file.size !== reference.size)
    throw new Error(`${label} binding mismatch`);
  return file;
}

function validateNativeUpdaterBundle(input) {
  exactKeys(input, ['bundleRoot', 'candidate', 'target', 'runId'], 'validator input');
  if (!TARGETS.has(input.target) || !COMMIT.test(input.candidate.commit) || !COMMIT.test(input.candidate.tree)) {
    throw new Error('validator identity is malformed');
  }
  if (!Number.isSafeInteger(input.runId) || input.runId <= 0) throw new Error('validator run id is malformed');
  const root = fs.realpathSync(path.resolve(input.bundleRoot));
  const observationFile = regularFile(path.join(root, 'observation.json'), 'observation');
  const observation = JSON.parse(observationFile.bytes.toString('utf8'));
  exactKeys(
    observation,
    [
      'contract',
      'candidate',
      'target',
      'nonce',
      'startedAt',
      'completedAt',
      'expiresAt',
      'observer',
      'initialArtifact',
      'candidateArtifact',
      'rollbackArtifact',
      'packageSmoke',
      'runtimeEvents',
      'stateSnapshots',
    ],
    'observation'
  );
  if (
    observation.contract !== 'wayland-updater-packaged-observation/1.0' ||
    observation.target !== input.target ||
    observation.candidate.commit !== input.candidate.commit ||
    observation.candidate.tree !== input.candidate.tree ||
    observation.observer?.authority !== 'nonce-bound-packaged-runtime-observer' ||
    observation.observer?.runId !== input.runId
  ) {
    throw new Error('observation identity is stale or foreign');
  }
  const observationDigest = sha256(observationFile.bytes);
  const candidateArtifactFile = observation.candidateArtifact?.file;
  if (!isBundleLocalName(candidateArtifactFile)) {
    throw new Error('candidate artifact reference is not a bundle-local basename');
  }
  const candidateArtifactPath = path.join(root, candidateArtifactFile);
  verifyUpdaterObservation(
    { observationPath: observationFile.path },
    {
      now: () => Date.parse(observation.completedAt),
      trustRootCommit: '0000000000000000000000000000000000000000',
      verifyCandidateInRepositoryImpl: (candidate) => {
        if (candidate.commit !== input.candidate.commit || candidate.tree !== input.candidate.tree) {
          throw new Error('candidate identity changed during canonical validation');
        }
      },
      execFileSyncImpl: createLocalAttestationSubstitute([observationFile.path, candidateArtifactPath]),
    }
  );
  for (const [label, artifact] of [
    ['initial artifact', observation.initialArtifact],
    ['candidate artifact', observation.candidateArtifact],
    ['rollback artifact', observation.rollbackArtifact],
  ]) {
    boundFile(root, { file: artifact.file, sha256: artifact.sha256, size: artifact.size }, label);
  }
  const smokeFile = boundFile(root, observation.packageSmoke, 'package smoke');
  const smoke = JSON.parse(smokeFile.bytes.toString('utf8'));
  if (
    smoke.contract !== 'wayland-platform-package-smoke/2' ||
    smoke.target !== input.target ||
    smoke.sourceIdentity?.commit !== input.candidate.commit ||
    smoke.sourceIdentity?.tree !== input.candidate.tree ||
    `sha256:${smoke.installerSnapshotBytesSha256}` !== observation.candidateArtifact.sha256 ||
    smoke.electron?.booted !== true ||
    smoke.electron?.rendererReady !== true ||
    smoke.shutdown?.parentExit !== 'zero' ||
    smoke.shutdown?.descendantsRemaining !== 0
  ) {
    throw new Error('package smoke is not exact-byte native execution evidence');
  }
  boundFile(root, observation.runtimeEvents, 'runtime events');
  if (!Array.isArray(observation.stateSnapshots) || observation.stateSnapshots.length !== 4) {
    throw new Error('state snapshot coverage is incomplete');
  }
  observation.stateSnapshots.forEach((reference, index) => {
    const value = exactKeys(reference, ['phase', 'file', 'sha256', 'size'], 'snapshot reference');
    if (value.phase !== ['initial', 'failedUpdate', 'rollback', 'reupgrade'][index])
      throw new Error('snapshot phase order is invalid');
    boundFile(root, { file: value.file, sha256: value.sha256, size: value.size }, `snapshot ${value.phase}`);
  });
  const executionFile = regularFile(path.join(root, 'native-execution-receipt.json'), 'native execution receipt');
  const execution = JSON.parse(executionFile.bytes.toString('utf8'));
  exactKeys(
    execution,
    [
      'contract',
      'candidate',
      'target',
      'nonce',
      'runId',
      'initialCatalogAssetId',
      'rollbackCatalogAssetId',
      'supportedDataSetSha256',
      'phases',
    ],
    'native execution receipt'
  );
  exactKeys(execution.phases, ['initial', 'failedUpdate', 'rollback', 'reupgrade'], 'native execution phases');
  exactKeys(
    execution.phases.failedUpdate,
    ['actualExecution', 'corruptedInstallerRejected', 'installedPayloadUnchanged'],
    'failed update execution phase'
  );
  if (
    execution.contract !== 'wayland-native-updater-execution/1.0' ||
    execution.target !== input.target ||
    execution.candidate?.commit !== input.candidate.commit ||
    execution.candidate?.tree !== input.candidate.tree ||
    execution.nonce !== observation.nonce ||
    execution.runId !== input.runId ||
    execution.phases?.initial?.actualExecution !== true ||
    execution.phases?.initial?.booted !== true ||
    execution.phases?.failedUpdate?.corruptedInstallerRejected !== true ||
    execution.phases?.failedUpdate?.installedPayloadUnchanged !== true ||
    execution.phases?.rollback?.actualExecution !== true ||
    execution.phases?.rollback?.booted !== true ||
    execution.phases?.reupgrade?.actualExecution !== true ||
    execution.phases?.reupgrade?.booted !== true
  ) {
    throw new Error('native execution receipt is incomplete or synthetic');
  }
  return {
    contract: 'wayland-native-updater-bundle-validation/1.0',
    candidate: input.candidate,
    target: input.target,
    observationSha256: observationDigest,
    nativeExecutionSha256: sha256(executionFile.bytes),
    // The signing job attests this file alongside observation.json. The linux candidate
    // installer must carry its own provenance from this workflow or the trust root
    // fails M8C_CANDIDATE_ATTESTATION_INVALID.
    candidateArtifactFile,
  };
}

function parseArgs(argv) {
  const values = {};
  const expected = new Set(['bundle', 'commit', 'tree', 'target', 'run-id']);
  for (let index = 0; index < argv.length; index += 2) {
    const key = String(argv[index] || '').replace(/^--/, '');
    if (!expected.has(key) || !argv[index + 1] || values[key])
      throw new Error(`invalid argument ${argv[index] || '<missing>'}`);
    values[key] = argv[index + 1];
  }
  if (Object.keys(values).length !== expected.size) throw new Error('all validator arguments are required');
  return {
    bundleRoot: values.bundle,
    candidate: { commit: values.commit, tree: values.tree },
    target: values.target,
    runId: Number(values['run-id']),
  };
}

module.exports = { createLocalAttestationSubstitute, isBundleLocalName, validateNativeUpdaterBundle };

if (require.main === module) {
  try {
    process.stdout.write(`${JSON.stringify(validateNativeUpdaterBundle(parseArgs(process.argv.slice(2))), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`Native updater bundle rejected: ${error.message}\n`);
    process.exitCode = 1;
  }
}
