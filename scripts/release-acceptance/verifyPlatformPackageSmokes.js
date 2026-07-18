'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const REPOSITORY = 'FerroxLabs/wayland';
const SIGNER_WORKFLOW = 'FerroxLabs/wayland/.github/workflows/release-acceptance-trust-root.yml';
const SIGNER_SOURCE_REF = 'refs/heads/release-trust-v1';
const PREDICATE_TYPE = 'https://slsa.dev/provenance/v1';
const COMMIT = /^[a-f0-9]{40,64}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const REPORT_KEYS = [
  'contract',
  'target',
  'installer',
  'installerDigest',
  'installerSnapshotBytesSha256',
  'installedExecutable',
  'installedResources',
  'executableIdentity',
  'executableSha256',
  'appAsarSha256',
  'freshness',
  'candidateFreshness',
  'sourceIdentity',
  'releaseIdentity',
  'sandboxMode',
  'productionSandboxProof',
  'verifiedCandidateDigest',
  'criticalResources',
  'optionalCapabilities',
  'electron',
  'shutdown',
  'processTreeIdentitySha256',
];

function exactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())) {
    throw new Error(`${label} has missing or unknown critical fields`);
  }
  return value;
}

function digest(value, label) {
  if (!SHA256.test(String(value))) throw new Error(`${label} is not a SHA-256 digest`);
  return value;
}

function hexDigest(value, label) {
  if (!/^[a-f0-9]{64}$/.test(String(value))) throw new Error(`${label} is not a SHA-256 hex digest`);
  return value;
}

function nonempty(value, label) {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} is missing`);
  return value;
}

function safeRelativePath(value, label) {
  const reference = nonempty(value, label);
  if (require('node:path').isAbsolute(reference) || reference.split(/[\\/]+/).includes('..')) {
    throw new Error(`${label} escapes its evidence root`);
  }
  return reference;
}

function nonnegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} is not a non-negative integer`);
  return value;
}

function expectedReleaseIdentity(releaseTrack, platform, arch) {
  if (releaseTrack !== 'stable' && releaseTrack !== 'preview') {
    throw new Error('platform smoke release track is invalid');
  }
  const preview = releaseTrack === 'preview';
  const productName = preview ? 'Wayland Preview' : 'Wayland';
  const executableName =
    platform === 'win32'
      ? `${productName}.exe`
      : platform === 'linux'
        ? preview
          ? 'wayland-preview'
          : 'wayland'
        : productName;
  const baseChannel = preview ? 'preview' : 'latest';
  const updateChannel =
    platform === 'win32' && arch === 'arm64'
      ? `${baseChannel}-win-arm64`
      : platform === 'darwin' && arch === 'arm64'
        ? `${baseChannel}-arm64`
        : baseChannel;
  return {
    releaseTrack,
    productName,
    executableName,
    bundleName: `${productName}.app`,
    protocolScheme: preview ? 'wayland-preview' : 'wayland',
    updateChannel,
    shellExperience: 'classic',
  };
}

function verifyFreshness(report) {
  const freshness = exactKeys(
    report.freshness,
    ['artifactDigest', 'priorArtifactDigests', 'candidateStateDigest', 'captureNonce', 'sourceIdentity'],
    'platform smoke installer freshness'
  );
  const candidate = exactKeys(
    report.candidateFreshness,
    [
      'candidateDigest',
      'priorCandidateDigests',
      'candidateStateDigest',
      'captureNonce',
      'sourceIdentity',
      'diagnosticTimes',
    ],
    'platform smoke candidate freshness'
  );
  const priorArtifacts = freshness.priorArtifactDigests;
  const priorCandidates = candidate.priorCandidateDigests;
  if (!Array.isArray(priorArtifacts) || priorArtifacts.some((value) => !SHA256.test(String(value)))) {
    throw new Error('platform smoke prior installer freshness is malformed');
  }
  if (!Array.isArray(priorCandidates) || priorCandidates.some((value) => !SHA256.test(String(value)))) {
    throw new Error('platform smoke prior candidate freshness is malformed');
  }
  if (
    freshness.artifactDigest !== digest(report.installerDigest, 'platform smoke installer digest') ||
    candidate.candidateDigest !== digest(report.verifiedCandidateDigest, 'platform smoke candidate digest') ||
    priorArtifacts.includes(freshness.artifactDigest) ||
    priorCandidates.includes(candidate.candidateDigest) ||
    freshness.candidateStateDigest !== candidate.candidateStateDigest ||
    freshness.captureNonce !== candidate.captureNonce ||
    !/^[a-f0-9]{64}$/.test(String(freshness.captureNonce)) ||
    !SHA256.test(String(freshness.candidateStateDigest)) ||
    JSON.stringify(freshness.sourceIdentity) !== JSON.stringify(report.sourceIdentity) ||
    JSON.stringify(candidate.sourceIdentity) !== JSON.stringify(report.sourceIdentity)
  ) {
    throw new Error('platform smoke freshness evidence is misbound');
  }
  const times = exactKeys(
    candidate.diagnosticTimes,
    ['candidateMtimeMs', 'appAsarMtimeMs'],
    'platform smoke candidate diagnostic times'
  );
  if (
    typeof times.candidateMtimeMs !== 'number' ||
    !Number.isFinite(times.candidateMtimeMs) ||
    times.candidateMtimeMs < 0 ||
    typeof times.appAsarMtimeMs !== 'number' ||
    !Number.isFinite(times.appAsarMtimeMs) ||
    times.appAsarMtimeMs < 0
  ) {
    throw new Error('platform smoke candidate diagnostic times are malformed');
  }
}

function verifySemanticRuntime(report, platform, arch) {
  const releaseIdentity = exactKeys(
    report.releaseIdentity,
    ['releaseTrack', 'productName', 'executableName', 'bundleName', 'protocolScheme', 'updateChannel', 'shellExperience'],
    'platform smoke release identity'
  );
  if (JSON.stringify(releaseIdentity) !== JSON.stringify(expectedReleaseIdentity(releaseIdentity.releaseTrack, platform, arch))) {
    throw new Error('platform smoke release identity is misbound');
  }
  const optional = exactKeys(
    report.optionalCapabilities,
    ['hub', 'whatsapp-bridge', 'signal-cli-runtime'],
    'platform smoke optional capabilities'
  );
  if (Object.values(optional).some((state) => state !== 'available' && state !== 'unavailable')) {
    throw new Error('platform smoke optional capability state is invalid');
  }
  const electron = exactKeys(
    report.electron,
    [
      'booted',
      'rendererReady',
      'expectedRendererPath',
      'markerSha256',
      'readyState',
      'title',
      'url',
      'bodyChildren',
      'rootChildren',
      'smokeMarker',
      'shellExperience',
      'recoveryFallback',
      'fatalErrorBoundary',
    ],
    'platform smoke electron evidence'
  );
  safeRelativePath(electron.expectedRendererPath, 'platform smoke expected renderer path');
  hexDigest(electron.markerSha256, 'platform smoke marker digest');
  if (
    electron.booted !== true ||
    electron.rendererReady !== true ||
    electron.readyState !== 'complete' ||
    electron.title !== 'Wayland' ||
    !String(electron.url || '').startsWith('file:') ||
    !Number.isSafeInteger(electron.bodyChildren) ||
    electron.bodyChildren <= 0 ||
    !Number.isSafeInteger(electron.rootChildren) ||
    electron.rootChildren <= 0 ||
    electron.smokeMarker !== '<redacted>' ||
    electron.shellExperience !== releaseIdentity.shellExperience ||
    electron.recoveryFallback !== false ||
    electron.fatalErrorBoundary !== false
  ) {
    throw new Error('platform smoke renderer lifecycle is incomplete');
  }
  const shutdown = exactKeys(
    report.shutdown,
    ['parentExit', 'subsystemCleanup', 'eventEvidence', 'descendantsObserved', 'descendantsRemaining'],
    'platform smoke shutdown evidence'
  );
  const events = exactKeys(
    shutdown.eventEvidence,
    ['contract', 'eventCount', 'terminalSequence'],
    'platform smoke shutdown event evidence'
  );
  if (
    shutdown.parentExit !== 'zero' ||
    shutdown.subsystemCleanup !== 'completed-with-structured-proof' ||
    nonnegativeInteger(shutdown.descendantsObserved, 'platform smoke descendants observed') < 0 ||
    shutdown.descendantsRemaining !== 0 ||
    events.contract !== 'wayland-package-smoke-event/1' ||
    !Number.isSafeInteger(events.eventCount) ||
    events.eventCount < 7 ||
    events.terminalSequence !== events.eventCount
  ) {
    throw new Error('platform smoke shutdown lifecycle is incomplete');
  }
}

function verifyCandidate(observed, expected) {
  exactKeys(observed, ['commit', 'tree'], 'platform smoke source identity');
  if (!COMMIT.test(String(observed.commit)) || !COMMIT.test(String(observed.tree))) {
    throw new Error('platform smoke source identity is malformed');
  }
  if (observed.commit !== expected.commit || observed.tree !== expected.tree) {
    throw new Error('platform smoke belongs to a stale or foreign candidate');
  }
}

function sha256(bytes) {
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

function trustRootCommit(options = {}) {
  const commit = options.trustRootCommit || process.env.WAYLAND_RELEASE_TRUST_ROOT_SHA;
  if (!COMMIT.test(String(commit || ''))) throw new Error('Release acceptance trust root is unavailable');
  return String(commit);
}

function verifyAttestation(receiptPath, receiptSha256, trustedCommit, run) {
  let output;
  try {
    output = run(
      'gh',
      [
        'attestation',
        'verify',
        receiptPath,
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
  } catch (error) {
    throw new Error(`platform smoke attestation verification failed: ${error.message}`);
  }
  let attestations;
  try {
    attestations = JSON.parse(String(output));
  } catch {
    throw new Error('platform smoke attestation returned invalid evidence');
  }
  const expectedDigest = receiptSha256.slice('sha256:'.length);
  const exactBytesAttested =
    Array.isArray(attestations) &&
    attestations.some((entry) => {
      const statement = entry && entry.verificationResult && entry.verificationResult.statement;
      return (
        statement &&
        statement.predicateType === PREDICATE_TYPE &&
        Array.isArray(statement.subject) &&
        statement.subject.some((subject) => subject?.digest?.sha256 === expectedDigest)
      );
    });
  if (!exactBytesAttested) throw new Error('platform smoke attestation does not bind exact receipt bytes');
}

function verifyPlatformPackageSmoke(input, context, options = {}) {
  const rawInput = exactKeys(input, ['target', 'receiptPath'], 'platform smoke input');
  if (rawInput.target !== context.target) throw new Error('platform smoke target is misbound');
  const receiptPath = rawInput.receiptPath;
  if (typeof receiptPath !== 'string' || receiptPath.length === 0)
    throw new Error('platform smoke receipt path is missing');
  const stat = fs.lstatSync(receiptPath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('platform smoke receipt path is not a regular file');
  const bytes = fs.readFileSync(receiptPath);
  const receiptSha256 = sha256(bytes);
  verifyAttestation(
    receiptPath,
    receiptSha256,
    trustRootCommit(options),
    options.execFileSyncImpl || execFileSync
  );

  let report;
  try {
    report = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error('platform smoke receipt is not valid JSON');
  }
  exactKeys(report, REPORT_KEYS, 'platform smoke receipt');
  if (report.contract !== 'wayland-platform-package-smoke/2' || report.target !== context.target) {
    throw new Error('platform smoke contract or target is invalid');
  }
  verifyCandidate(report.sourceIdentity, context.candidate);
  const [platform, arch] = context.target.split('-');
  safeRelativePath(report.installer, 'platform smoke installer path');
  safeRelativePath(report.installedExecutable, 'platform smoke installed executable path');
  safeRelativePath(report.installedResources, 'platform smoke installed resources path');
  hexDigest(report.installerSnapshotBytesSha256, 'platform smoke installer snapshot digest');
  digest(report.processTreeIdentitySha256, 'platform smoke process tree identity');
  const executableIdentity = exactKeys(report.executableIdentity, ['platform', 'arch'], 'platform executable identity');
  if (executableIdentity.platform !== platform || executableIdentity.arch !== arch) {
    throw new Error('platform smoke executable identity is misbound');
  }
  verifyFreshness(report);
  verifySemanticRuntime(report, platform, arch);
  if (report.criticalResources !== 'verified') throw new Error('platform smoke critical resources are unverified');
  if (platform === 'linux') {
    if (
      report.sandboxMode !== 'smoke-only-disabled' ||
      report.productionSandboxProof !== 'not-proven-by-unprivileged-package-extraction'
    ) {
      throw new Error('platform smoke Linux sandbox claim is invalid');
    }
  } else if (report.sandboxMode !== 'production-default' || report.productionSandboxProof !== 'exercised') {
    throw new Error('platform smoke production sandbox was not exercised');
  }

  return {
    contract: 'wayland-platform-package-smoke-authority/1.0',
    target: context.target,
    candidate: { commit: context.candidate.commit, tree: context.candidate.tree },
    artifacts: {
      installerDigest: digest(report.installerDigest, 'platform smoke installer digest'),
      executableSha256: `sha256:${hexDigest(report.executableSha256, 'platform smoke executable digest')}`,
      appAsarSha256: `sha256:${hexDigest(report.appAsarSha256, 'platform smoke app.asar digest')}`,
      verifiedCandidateDigest: digest(report.verifiedCandidateDigest, 'platform smoke candidate digest'),
    },
    authority: 'canonical-packaged-runtime-observer',
  };
}

module.exports = {
  PREDICATE_TYPE,
  REPOSITORY,
  REPORT_KEYS,
  SIGNER_WORKFLOW,
  verifyPlatformPackageSmoke,
};
