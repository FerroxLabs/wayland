'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const REPOSITORY = 'FerroxLabs/wayland';
const SIGNER_WORKFLOW = 'FerroxLabs/wayland/.github/workflows/release-acceptance-trust-root.yml';
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

function verifyAttestation(receiptPath, receiptSha256, candidate, run) {
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
        '--source-digest',
        candidate.commit,
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
  verifyAttestation(receiptPath, receiptSha256, context.candidate, options.execFileSyncImpl || execFileSync);

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
  const executableIdentity = exactKeys(report.executableIdentity, ['platform', 'arch'], 'platform executable identity');
  if (executableIdentity.platform !== platform || executableIdentity.arch !== arch) {
    throw new Error('platform smoke executable identity is misbound');
  }
  const electron = report.electron;
  if (
    !electron ||
    typeof electron !== 'object' ||
    electron.booted !== true ||
    electron.rendererReady !== true ||
    electron.readyState !== 'complete' ||
    electron.recoveryFallback !== false ||
    electron.fatalErrorBoundary !== false
  ) {
    throw new Error('platform smoke renderer lifecycle is incomplete');
  }
  const shutdown = report.shutdown;
  if (
    !shutdown ||
    typeof shutdown !== 'object' ||
    shutdown.parentExit !== 'zero' ||
    shutdown.subsystemCleanup !== 'completed-with-structured-proof' ||
    shutdown.descendantsRemaining !== 0
  ) {
    throw new Error('platform smoke shutdown lifecycle is incomplete');
  }
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
      executableSha256: digest(report.executableSha256, 'platform smoke executable digest'),
      appAsarSha256: digest(report.appAsarSha256, 'platform smoke app.asar digest'),
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
