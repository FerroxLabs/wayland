'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPOSITORY = 'FerroxLabs/wayland';
const SIGNER_WORKFLOW = 'FerroxLabs/wayland/.github/workflows/release-acceptance-trust-root.yml';
const SIGNER_SOURCE_REF = 'refs/heads/release-trust-v1';
const PREDICATE_TYPE = 'https://slsa.dev/provenance/v1';
const OBSERVATION_CONTRACT = 'wayland-updater-packaged-observation/1.0';
const EVENT_CONTRACT = 'wayland-updater-runtime-events/1.0';
const SNAPSHOT_CONTRACT = 'wayland-updater-state-snapshot/1.0';
const PACKAGE_SMOKE_CONTRACT = 'wayland-platform-package-smoke/2';
const RECEIPT_CONTRACT = 'wayland-updater-trusted-observation/1.0';
const AUTHORITY = 'nonce-bound-packaged-runtime-observer';
const COMMIT = /^[a-f0-9]{40,64}$/;
const NONCE = /^[a-f0-9]{64}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const TARGETS = new Set(['darwin-arm64', 'darwin-x64', 'win32-arm64', 'win32-x64', 'linux-arm64', 'linux-x64']);
const PHASES = ['initial', 'failedUpdate', 'rollback', 'reupgrade'];
const EVENT_TYPES = ['initial-boot', 'update-failed', 'rollback-boot', 'reupgrade-boot'];
const MAX_OBSERVATION_WINDOW_MS = 24 * 60 * 60 * 1000;

function fail(code, detail) {
  throw new Error(`${code}:${detail}`);
}

function exactKeys(value, expected, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code, 'expected-object');
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())) {
    fail(code, 'missing-or-unknown-critical-field');
  }
  return value;
}

function nonempty(value, code) {
  if (typeof value !== 'string' || value.length === 0) fail(code, 'expected-nonempty-string');
  return value;
}

function positiveInteger(value, code) {
  if (!Number.isSafeInteger(value) || value <= 0) fail(code, 'expected-positive-integer');
  return value;
}

function sha256(bytes) {
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

function sha512(bytes) {
  return crypto.createHash('sha512').update(bytes).digest('base64');
}

function digest(value, code) {
  if (!SHA256.test(String(value))) fail(code, 'invalid-sha256');
  return value;
}

function candidateIdentity(value, code) {
  const candidate = exactKeys(value, ['commit', 'tree'], code);
  if (!COMMIT.test(String(candidate.commit)) || !COMMIT.test(String(candidate.tree))) {
    fail(code, 'malformed-candidate');
  }
  return candidate;
}

function sameCandidate(value, expected, code) {
  const candidate = candidateIdentity(value, code);
  if (candidate.commit !== expected.commit || candidate.tree !== expected.tree) {
    fail(code, 'stale-or-foreign-candidate');
  }
  return candidate;
}

function timestamp(value, code) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    fail(code, 'invalid-utc-timestamp');
  }
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) fail(code, 'invalid-utc-timestamp');
  return milliseconds;
}

function verifyFreshness(manifest, now) {
  const startedAt = timestamp(manifest.startedAt, 'M8C_OBSERVATION_TIME_INVALID');
  const completedAt = timestamp(manifest.completedAt, 'M8C_OBSERVATION_TIME_INVALID');
  const expiresAt = timestamp(manifest.expiresAt, 'M8C_OBSERVATION_TIME_INVALID');
  if (startedAt > completedAt || completedAt > expiresAt) fail('M8C_OBSERVATION_TIME_INVALID', 'non-monotonic');
  if (expiresAt - completedAt > MAX_OBSERVATION_WINDOW_MS) {
    fail('M8C_OBSERVATION_TIME_INVALID', 'expiry-window-too-large');
  }
  if (now < completedAt || now > expiresAt) fail('M8C_OBSERVATION_STALE', 'outside-acceptance-window');
  return { startedAt, completedAt, expiresAt };
}

function regularFile(filePath, code) {
  let stat;
  try {
    stat = fs.lstatSync(filePath);
  } catch {
    fail(code, 'missing');
  }
  if (!stat.isFile() || stat.isSymbolicLink()) fail(code, 'not-regular-file');
  return { bytes: fs.readFileSync(filePath), size: stat.size };
}

function resolveEvidenceFile(root, reference, code) {
  const name = nonempty(reference, code);
  if (path.isAbsolute(name)) fail(code, 'absolute-path-forbidden');
  const resolved = path.resolve(root, name);
  if (!resolved.startsWith(`${root}${path.sep}`)) fail(code, 'path-escape');
  return resolved;
}

function readBoundEvidence(root, reference, code) {
  const item = exactKeys(reference, ['file', 'sha256', 'size'], code);
  const filePath = resolveEvidenceFile(root, item.file, code);
  const { bytes, size } = regularFile(filePath, code);
  if (sha256(bytes) !== digest(item.sha256, code)) fail(code, 'digest-mismatch');
  if (size !== positiveInteger(item.size, code)) fail(code, 'size-mismatch');
  return { bytes, filePath, sha256: item.sha256, size };
}

function parseJson(bytes, code) {
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    fail(code, 'invalid-json');
  }
}

function expectedPublisherGate(target, role) {
  if (target.startsWith('darwin-')) return 'macos-gatekeeper-developer-id-notarization';
  if (target.startsWith('win32-')) return 'windows-authenticode-ferrox-labs';
  if (role === 'rollback') return 'github-release-digest-only';
  return 'linux-detached-signature-pinned-keyring';
}

function verifyPublisher(value, target, role) {
  const code = `M8C_${role.toUpperCase()}_PUBLISHER_INVALID`;
  const publisher = exactKeys(value, ['gate', 'verified', 'verifierExitCode', 'identity'], code);
  if (
    publisher.gate !== expectedPublisherGate(target, role) ||
    publisher.verified !== true ||
    publisher.verifierExitCode !== 0
  ) {
    fail(code, 'publisher-evidence-not-proven');
  }
  const identity = nonempty(publisher.identity, code);
  if (target.startsWith('linux-') && role === 'rollback') {
    if (identity !== 'FerroxLabs/wayland@v0.11.8 compiled release catalog') {
      fail(code, 'unexpected-catalog-identity');
    }
  } else if (!target.startsWith('linux-') && !identity.includes('Ferrox Labs')) {
    fail(code, 'unexpected-publisher-identity');
  }
  return publisher;
}

function loadRollbackCatalog(options = {}) {
  if (options.rollbackCatalog) return options.rollbackCatalog;
  const catalogPath = path.resolve(__dirname, '../../contracts/recovery/classic-v0.11.8-release.json');
  return parseJson(regularFile(catalogPath, 'M8C_ROLLBACK_CATALOG_INVALID').bytes, 'M8C_ROLLBACK_CATALOG_INVALID');
}

function verifyRollbackCatalogArtifact(artifact, bound, target, catalog) {
  const value = exactKeys(
    catalog,
    ['contract', 'repository', 'releaseId', 'tag', 'tagCommit', 'version', 'publishedAt', 'artifacts'],
    'M8C_ROLLBACK_CATALOG_INVALID'
  );
  if (
    value.contract !== 'wayland-classic-recovery-release/1.0' ||
    value.repository !== REPOSITORY ||
    value.tag !== 'v0.11.8' ||
    value.version !== '0.11.8' ||
    !Array.isArray(value.artifacts)
  ) {
    fail('M8C_ROLLBACK_CATALOG_INVALID', 'identity-or-artifacts');
  }
  const [platform, arch] = target.split('-');
  const entry = value.artifacts.find((candidate) => candidate?.platform === platform && candidate?.arch === arch);
  if (!entry) fail('M8C_ROLLBACK_CATALOG_INVALID', 'target-absent');
  if (
    path.basename(artifact.file) !== entry.name ||
    bound.size !== entry.size ||
    bound.sha256 !== `sha256:${entry.sha256}`
  ) {
    fail('M8C_ROLLBACK_CATALOG_MISMATCH', 'filename-size-or-digest');
  }
  if (target.startsWith('linux-') && entry.publisherGate !== 'github-release-digest-only') {
    fail('M8C_ROLLBACK_CATALOG_INVALID', 'linux-publisher-gate');
  }
}

function verifyArtifact(value, root, candidate, target, role, options = {}) {
  const code = `M8C_${role.toUpperCase()}_ARTIFACT_INVALID`;
  const expectedKeys =
    role === 'candidate'
      ? ['file', 'version', 'sha256', 'size', 'publisher']
      : ['file', 'version', 'releaseTag', 'catalogVerified', 'sha256', 'size', 'publisher'];
  const artifact = exactKeys(value, expectedKeys, code);
  const bound = readBoundEvidence(root, { file: artifact.file, sha256: artifact.sha256, size: artifact.size }, code);
  const version = nonempty(artifact.version, code);
  const publisher = verifyPublisher(artifact.publisher, target, role);
  if (role === 'rollback') {
    if (version !== '0.11.8' || artifact.releaseTag !== 'v0.11.8' || artifact.catalogVerified !== true) {
      fail('M8C_ROLLBACK_IDENTITY_INVALID', 'expected-compiled-v0.11.8-catalog');
    }
    verifyRollbackCatalogArtifact(artifact, bound, target, loadRollbackCatalog(options));
  }
  return { ...bound, version, publisher, sourceCommit: candidate.commit };
}

function verifyPackageSmoke(value, candidate, target, candidateArtifact) {
  const smoke = exactKeys(
    value,
    ['contract', 'target', 'sourceCommit', 'installerDigest', 'booted', 'rendererReady', 'shutdownComplete'],
    'M8C_PACKAGE_SMOKE_INVALID'
  );
  if (
    smoke.contract !== PACKAGE_SMOKE_CONTRACT ||
    smoke.target !== target ||
    smoke.sourceCommit !== candidate.commit ||
    smoke.installerDigest !== candidateArtifact.sha256.slice('sha256:'.length) ||
    smoke.booted !== true ||
    smoke.rendererReady !== true ||
    smoke.shutdownComplete !== true
  ) {
    fail('M8C_PACKAGE_SMOKE_INVALID', 'identity-or-lifecycle-mismatch');
  }
  return smoke;
}

function verifyRuntimeEvents(value, manifest, candidateArtifact, rollbackArtifact, timeRange) {
  const eventsFile = exactKeys(
    value,
    ['contract', 'nonce', 'candidate', 'target', 'events'],
    'M8C_RUNTIME_EVENTS_INVALID'
  );
  if (
    eventsFile.contract !== EVENT_CONTRACT ||
    eventsFile.nonce !== manifest.nonce ||
    eventsFile.target !== manifest.target
  ) {
    fail('M8C_RUNTIME_EVENTS_INVALID', 'observation-binding-mismatch');
  }
  const eventCandidate = exactKeys(
    eventsFile.candidate,
    ['commit', 'tree', 'version', 'artifactSha256'],
    'M8C_RUNTIME_EVENTS_INVALID'
  );
  sameCandidate(
    { commit: eventCandidate.commit, tree: eventCandidate.tree },
    manifest.candidate,
    'M8C_RUNTIME_EVENTS_INVALID'
  );
  if (
    eventCandidate.version !== candidateArtifact.version ||
    eventCandidate.artifactSha256 !== candidateArtifact.sha256
  ) {
    fail('M8C_RUNTIME_EVENTS_INVALID', 'candidate-artifact-mismatch');
  }
  if (!Array.isArray(eventsFile.events) || eventsFile.events.length !== PHASES.length) {
    fail('M8C_RUNTIME_EVENTS_INVALID', 'event-coverage-mismatch');
  }
  let previous = timeRange.startedAt;
  return eventsFile.events.map((event, index) => {
    const phase = PHASES[index];
    const type = EVENT_TYPES[index];
    const item = exactKeys(
      event,
      [
        'sequence',
        'phase',
        'type',
        'observedAt',
        'runningVersion',
        'attemptedVersion',
        'outcome',
        'failureReason',
        'rollbackOffered',
        'isolatedState',
        'installedArtifactSha256',
        'supportedDataSetSha256',
      ],
      'M8C_RUNTIME_EVENTS_INVALID'
    );
    if (item.sequence !== index + 1 || item.phase !== phase || item.type !== type) {
      fail('M8C_RUNTIME_EVENTS_INVALID', 'sequence-or-phase-mismatch');
    }
    const observedAt = timestamp(item.observedAt, 'M8C_RUNTIME_EVENTS_INVALID');
    if (observedAt < previous || observedAt > timeRange.completedAt) {
      fail('M8C_RUNTIME_EVENTS_INVALID', 'event-time-outside-observation');
    }
    previous = observedAt;
    digest(item.supportedDataSetSha256, 'M8C_RUNTIME_EVENTS_INVALID');
    if (phase === 'initial') {
      if (
        item.runningVersion === candidateArtifact.version ||
        item.attemptedVersion !== null ||
        item.outcome !== 'booted' ||
        item.failureReason !== null ||
        item.rollbackOffered !== false ||
        item.isolatedState !== false ||
        item.installedArtifactSha256 !== null
      ) {
        fail('M8C_RUNTIME_EVENTS_INVALID', 'initial-event-invalid');
      }
    } else if (phase === 'failedUpdate') {
      if (
        item.attemptedVersion !== candidateArtifact.version ||
        item.runningVersion !== eventsFile.events[0].runningVersion ||
        item.outcome !== 'failed' ||
        typeof item.failureReason !== 'string' ||
        item.failureReason.length === 0 ||
        item.rollbackOffered !== true ||
        item.isolatedState !== false ||
        item.installedArtifactSha256 !== null
      ) {
        fail('M8C_RUNTIME_EVENTS_INVALID', 'failed-update-event-invalid');
      }
    } else if (phase === 'rollback') {
      if (
        item.runningVersion !== rollbackArtifact.version ||
        item.attemptedVersion !== null ||
        item.outcome !== 'booted' ||
        item.failureReason !== null ||
        item.rollbackOffered !== false ||
        item.isolatedState !== true ||
        item.installedArtifactSha256 !== rollbackArtifact.sha256
      ) {
        fail('M8C_RUNTIME_EVENTS_INVALID', 'rollback-event-invalid');
      }
    } else if (
      item.runningVersion !== candidateArtifact.version ||
      item.attemptedVersion !== null ||
      item.outcome !== 'booted' ||
      item.failureReason !== null ||
      item.rollbackOffered !== false ||
      item.isolatedState !== true ||
      item.installedArtifactSha256 !== candidateArtifact.sha256
    ) {
      fail('M8C_RUNTIME_EVENTS_INVALID', 'reupgrade-event-invalid');
    }
    return item;
  });
}

function verifySnapshots(references, root, manifest, events) {
  if (!Array.isArray(references) || references.length !== PHASES.length) {
    fail('M8C_STATE_SNAPSHOT_INVALID', 'snapshot-coverage-mismatch');
  }
  const observedDigests = new Set();
  return references.map((reference, index) => {
    const wrapper = exactKeys(reference, ['phase', 'file', 'sha256', 'size'], 'M8C_STATE_SNAPSHOT_INVALID');
    if (wrapper.phase !== PHASES[index]) fail('M8C_STATE_SNAPSHOT_INVALID', 'phase-order-mismatch');
    const bound = readBoundEvidence(
      root,
      { file: wrapper.file, sha256: wrapper.sha256, size: wrapper.size },
      'M8C_STATE_SNAPSHOT_INVALID'
    );
    if (observedDigests.has(bound.sha256)) fail('M8C_STATE_SNAPSHOT_INVALID', 'snapshot-digest-reused');
    observedDigests.add(bound.sha256);
    const snapshot = exactKeys(
      parseJson(bound.bytes, 'M8C_STATE_SNAPSHOT_INVALID'),
      [
        'contract',
        'nonce',
        'candidate',
        'target',
        'phase',
        'sequence',
        'observedAt',
        'runningVersion',
        'supportedDataSetSha256',
        'isolatedState',
        'installedArtifactSha256',
      ],
      'M8C_STATE_SNAPSHOT_INVALID'
    );
    if (
      snapshot.contract !== SNAPSHOT_CONTRACT ||
      snapshot.nonce !== manifest.nonce ||
      snapshot.target !== manifest.target ||
      snapshot.phase !== PHASES[index] ||
      snapshot.sequence !== index + 1
    ) {
      fail('M8C_STATE_SNAPSHOT_INVALID', 'observation-binding-mismatch');
    }
    sameCandidate(snapshot.candidate, manifest.candidate, 'M8C_STATE_SNAPSHOT_INVALID');
    const event = events[index];
    if (
      snapshot.observedAt !== event.observedAt ||
      snapshot.runningVersion !== event.runningVersion ||
      snapshot.supportedDataSetSha256 !== event.supportedDataSetSha256 ||
      snapshot.isolatedState !== event.isolatedState ||
      snapshot.installedArtifactSha256 !== event.installedArtifactSha256
    ) {
      fail('M8C_STATE_SNAPSHOT_INVALID', 'event-snapshot-mismatch');
    }
    return snapshot;
  });
}

function verifySemanticDataContinuity(snapshots) {
  const supported = snapshots.map((snapshot) => digest(snapshot.supportedDataSetSha256, 'M8C_SUPPORTED_DATA_INVALID'));
  if (supported.some((value) => value !== supported[0])) fail('M8C_SUPPORTED_DATA_LOSS', 'semantic-manifest-changed');
}

function candidateRepositoryRoot(options = {}) {
  const configured = options.candidateRoot || process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT;
  if (typeof configured !== 'string' || !configured || !path.isAbsolute(configured)) {
    fail('M8C_CANDIDATE_INVALID', 'candidate-root-unavailable');
  }
  const root = path.resolve(configured);
  let stat;
  try {
    stat = fs.lstatSync(root);
  } catch {
    fail('M8C_CANDIDATE_INVALID', 'candidate-root-missing');
  }
  if (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(root) !== root) {
    fail('M8C_CANDIDATE_INVALID', 'candidate-root-must-be-real-directory');
  }
  let topLevel;
  try {
    topLevel = fs.realpathSync(
      execFileSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim()
    );
  } catch {
    fail('M8C_CANDIDATE_INVALID', 'candidate-root-is-not-git-worktree');
  }
  if (topLevel !== root) fail('M8C_CANDIDATE_INVALID', 'candidate-root-is-not-worktree-top-level');
  return root;
}

function defaultVerifyCandidateInRepository(candidate, options = {}) {
  const repositoryRoot = candidateRepositoryRoot(options);
  let commit;
  let tree;
  try {
    commit = execFileSync('git', ['-C', repositoryRoot, 'rev-parse', '--verify', `${candidate.commit}^{commit}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    tree = execFileSync('git', ['-C', repositoryRoot, 'rev-parse', '--verify', `${candidate.commit}^{tree}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    fail('M8C_CANDIDATE_INVALID', 'commit-not-in-repository');
  }
  if (commit !== candidate.commit || tree !== candidate.tree) fail('M8C_CANDIDATE_INVALID', 'commit-tree-mismatch');
}

function trustRootCommit(options = {}) {
  const commit = options.trustRootCommit || process.env.WAYLAND_RELEASE_TRUST_ROOT_SHA;
  if (!COMMIT.test(String(commit || ''))) fail('M8C_OBSERVATION_ATTESTATION_INVALID', 'trust-root-unavailable');
  return String(commit);
}

function verifyAttestation(observationPath, observationSha256, trustedCommit, run) {
  let raw;
  try {
    raw = run(
      'gh',
      [
        'attestation',
        'verify',
        observationPath,
        '--repo',
        REPOSITORY,
        '--signer-workflow',
        SIGNER_WORKFLOW,
        '--signer-digest',
        trustedCommit,
        '--source-digest',
        trustedCommit,
        '--source-ref',
        SIGNER_SOURCE_REF,
        '--predicate-type',
        PREDICATE_TYPE,
        '--deny-self-hosted-runners',
        '--format',
        'json',
      ],
      { encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] }
    );
  } catch {
    fail('M8C_OBSERVATION_ATTESTATION_INVALID', 'verification-failed');
  }
  let attestations;
  try {
    attestations = JSON.parse(String(raw));
  } catch {
    fail('M8C_OBSERVATION_ATTESTATION_INVALID', 'invalid-verifier-output');
  }
  const expected = observationSha256.slice('sha256:'.length);
  if (
    !Array.isArray(attestations) ||
    !attestations.some((entry) => {
      const statement = entry && entry.verificationResult && entry.verificationResult.statement;
      return (
        statement &&
        statement.predicateType === PREDICATE_TYPE &&
        Array.isArray(statement.subject) &&
        statement.subject.some((subject) => subject && subject.digest && subject.digest.sha256 === expected)
      );
    })
  ) {
    fail('M8C_OBSERVATION_ATTESTATION_INVALID', 'subject-digest-mismatch');
  }
}

function verifyUpdaterObservation(input, options = {}) {
  const request = exactKeys(input, ['observationPath'], 'M8C_OBSERVATION_INPUT_INVALID');
  const observationPath = path.resolve(nonempty(request.observationPath, 'M8C_OBSERVATION_INPUT_INVALID'));
  const observationFile = regularFile(observationPath, 'M8C_OBSERVATION_INVALID');
  const observationSha256 = sha256(observationFile.bytes);
  const manifest = exactKeys(
    parseJson(observationFile.bytes, 'M8C_OBSERVATION_INVALID'),
    [
      'contract',
      'candidate',
      'target',
      'nonce',
      'startedAt',
      'completedAt',
      'expiresAt',
      'observer',
      'candidateArtifact',
      'rollbackArtifact',
      'packageSmoke',
      'runtimeEvents',
      'stateSnapshots',
    ],
    'M8C_OBSERVATION_INVALID'
  );
  if (manifest.contract !== OBSERVATION_CONTRACT) fail('M8C_OBSERVATION_INVALID', 'unsupported-contract');
  const candidate = candidateIdentity(manifest.candidate, 'M8C_CANDIDATE_INVALID');
  if (!TARGETS.has(manifest.target)) fail('M8C_OBSERVATION_INVALID', 'unsupported-target');
  if (!NONCE.test(String(manifest.nonce))) fail('M8C_OBSERVATION_INVALID', 'invalid-nonce');
  const observer = exactKeys(manifest.observer, ['authority', 'runId'], 'M8C_OBSERVER_INVALID');
  if (observer.authority !== AUTHORITY || !Number.isSafeInteger(observer.runId) || observer.runId <= 0) {
    fail('M8C_OBSERVER_INVALID', 'untrusted-observer');
  }
  const timeRange = verifyFreshness(manifest, options.now ? options.now() : Date.now());
  if (options.verifyCandidateInRepositoryImpl) options.verifyCandidateInRepositoryImpl(candidate);
  else defaultVerifyCandidateInRepository(candidate, options);
  verifyAttestation(
    observationPath,
    observationSha256,
    trustRootCommit(options),
    options.execFileSyncImpl || execFileSync
  );

  const root = path.dirname(observationPath);
  const candidateArtifact = verifyArtifact(
    manifest.candidateArtifact,
    root,
    candidate,
    manifest.target,
    'candidate',
    options
  );
  const rollbackArtifact = verifyArtifact(
    manifest.rollbackArtifact,
    root,
    candidate,
    manifest.target,
    'rollback',
    options
  );
  if (candidateArtifact.version === rollbackArtifact.version) {
    fail('M8C_CANDIDATE_VERSION_INVALID', 'candidate-must-advance-from-rollback');
  }
  const packageSmokeFile = readBoundEvidence(root, manifest.packageSmoke, 'M8C_PACKAGE_SMOKE_INVALID');
  verifyPackageSmoke(
    parseJson(packageSmokeFile.bytes, 'M8C_PACKAGE_SMOKE_INVALID'),
    candidate,
    manifest.target,
    candidateArtifact
  );
  const runtimeEventsFile = readBoundEvidence(root, manifest.runtimeEvents, 'M8C_RUNTIME_EVENTS_INVALID');
  const events = verifyRuntimeEvents(
    parseJson(runtimeEventsFile.bytes, 'M8C_RUNTIME_EVENTS_INVALID'),
    manifest,
    candidateArtifact,
    rollbackArtifact,
    timeRange
  );
  const snapshots = verifySnapshots(manifest.stateSnapshots, root, manifest, events);
  verifySemanticDataContinuity(snapshots);

  return {
    contract: RECEIPT_CONTRACT,
    candidate: { commit: candidate.commit, tree: candidate.tree },
    target: manifest.target,
    authority: AUTHORITY,
    receiptSha256: observationSha256,
  };
}

module.exports = {
  AUTHORITY,
  OBSERVATION_CONTRACT,
  PREDICATE_TYPE,
  RECEIPT_CONTRACT,
  REPOSITORY,
  SIGNER_WORKFLOW,
  verifyUpdaterObservation,
};
