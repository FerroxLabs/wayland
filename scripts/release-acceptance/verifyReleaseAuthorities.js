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

function exactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())) {
    throw new Error(`${label} has missing or unknown critical fields`);
  }
  return value;
}

function sha256(bytes) {
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

function verifyCandidate(observed, expected, label) {
  exactKeys(observed, ['commit', 'tree'], `${label} candidate`);
  if (!COMMIT.test(String(observed.commit)) || !COMMIT.test(String(observed.tree))) {
    throw new Error(`${label} candidate is malformed`);
  }
  if (observed.commit !== expected.commit || observed.tree !== expected.tree) {
    throw new Error(`${label} belongs to a stale or foreign candidate`);
  }
}

function trustRootCommit(options = {}) {
  const commit = options.trustRootCommit || process.env.WAYLAND_RELEASE_TRUST_ROOT_SHA;
  if (!COMMIT.test(String(commit || ''))) throw new Error('Release acceptance trust root is unavailable');
  return String(commit);
}

function readAttestedJson(receiptPath, candidate, options, label) {
  if (typeof receiptPath !== 'string' || receiptPath.length === 0) throw new Error(`${label} path is missing`);
  let stat;
  try {
    stat = fs.lstatSync(receiptPath);
  } catch {
    throw new Error(`${label} path is missing`);
  }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} path is not a regular file`);
  const bytes = fs.readFileSync(receiptPath);
  const receiptSha256 = sha256(bytes);
  const run = options.execFileSyncImpl || execFileSync;
  const trustedCommit = trustRootCommit(options);
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
    throw new Error(`${label} attestation verification failed: ${error.message}`);
  }
  let attestations;
  try {
    attestations = JSON.parse(String(output));
  } catch {
    throw new Error(`${label} attestation returned invalid evidence`);
  }
  const expectedDigest = receiptSha256.slice('sha256:'.length);
  const exactBytesAttested =
    Array.isArray(attestations) &&
    attestations.some((entry) => {
      const statement = entry?.verificationResult?.statement;
      return (
        statement?.predicateType === PREDICATE_TYPE &&
        Array.isArray(statement.subject) &&
        statement.subject.some((subject) => subject?.digest?.sha256 === expectedDigest)
      );
    });
  if (!exactBytesAttested) throw new Error(`${label} attestation does not bind exact receipt bytes`);
  let receipt;
  try {
    receipt = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
  return { receipt, receiptSha256 };
}

function verifyConditionalCapability(input, context, options = {}) {
  exactKeys(input, ['capabilityId', 'receiptPath'], 'conditional capability input');
  if (input.capabilityId !== context.capabilityId) throw new Error('conditional capability input is misbound');
  const { receipt } = readAttestedJson(input.receiptPath, context.candidate, options, 'conditional capability receipt');
  exactKeys(
    receipt,
    ['contract', 'candidate', 'capabilityId', 'receiptIds', 'receiptDigests', 'authority'],
    'conditional capability receipt'
  );
  if (
    receipt.contract !== 'wayland-capability-release-acceptance/1.0' ||
    receipt.capabilityId !== context.capabilityId ||
    receipt.authority !== 'canonical-capability-acceptance-validator'
  ) {
    throw new Error('conditional capability receipt has an invalid contract or authority');
  }
  verifyCandidate(receipt.candidate, context.candidate, 'conditional capability receipt');
  if (JSON.stringify(receipt.receiptIds) !== JSON.stringify(context.expectedReceiptIds)) {
    throw new Error('conditional capability receipt coverage is invalid');
  }
  if (
    !Array.isArray(receipt.receiptDigests) ||
    receipt.receiptDigests.length !== context.expectedReceiptIds.length ||
    receipt.receiptDigests.some((value) => !SHA256.test(String(value))) ||
    new Set(receipt.receiptDigests).size !== receipt.receiptDigests.length
  ) {
    throw new Error('conditional capability receipt digests are invalid');
  }
  return receipt;
}

function verifyClearance(input, context, options = {}, kind) {
  exactKeys(input, ['receiptPath'], `${kind} clearance input`);
  const { receipt } = readAttestedJson(input.receiptPath, context.candidate, options, `${kind} clearance receipt`);
  const findings = kind === 'findings';
  const contract = findings ? 'wayland-release-findings-clearance/1.0' : 'wayland-release-blocker-clearance/1.0';
  const counters = findings ? ['blocker', 'critical', 'high'] : ['p0', 'p1'];
  exactKeys(
    receipt,
    ['contract', 'candidate', 'unresolved', 'authority', 'evidenceSha256'],
    `${kind} clearance receipt`
  );
  if (receipt.contract !== contract || receipt.authority !== 'automated-release-tracker') {
    throw new Error(`${kind} clearance receipt has an invalid contract or authority`);
  }
  verifyCandidate(receipt.candidate, context.candidate, `${kind} clearance receipt`);
  exactKeys(receipt.unresolved, counters, `${kind} clearance counters`);
  for (const counter of counters) {
    if (!Number.isSafeInteger(receipt.unresolved[counter]) || receipt.unresolved[counter] !== 0) {
      throw new Error(`${kind} clearance has unresolved ${counter}`);
    }
  }
  if (!SHA256.test(String(receipt.evidenceSha256))) throw new Error(`${kind} clearance evidence digest is invalid`);
  return receipt;
}

function verifyFindingsClearance(input, context, options = {}) {
  return verifyClearance(input, context, options, 'findings');
}

function verifyReleaseBlockers(input, context, options = {}) {
  return verifyClearance(input, context, options, 'release-blockers');
}

module.exports = {
  PREDICATE_TYPE,
  REPOSITORY,
  SIGNER_WORKFLOW,
  verifyConditionalCapability,
  verifyFindingsClearance,
  verifyReleaseBlockers,
};
