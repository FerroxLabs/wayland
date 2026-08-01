'use strict';

const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const POLICY_FILE = path.resolve(__dirname, 'publisher-attestations.json');
const CONTRACT = 'wayland-publisher-attestations/1.0';
const SHA256 = /^[0-9a-f]{64}$/;
const SOURCE_DIGEST = /^[0-9a-f]{40}$/;

function readPolicy(filePath = POLICY_FILE) {
  let policy;
  try {
    policy = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Publisher attestation policy is unreadable: ${error.message}`);
  }
  if (policy?.contract !== CONTRACT || !Array.isArray(policy.policies) || policy.policies.length === 0) {
    throw new Error(`Unsupported or empty publisher attestation policy: expected ${CONTRACT}`);
  }
  return policy;
}

function selectPolicy(releaseTag, policyDocument = readPolicy()) {
  const matches = policyDocument.policies.filter((item) => item?.releaseTag === releaseTag);
  if (matches.length !== 1) throw new Error(`No unique publisher attestation policy for ${releaseTag}`);
  const policy = matches[0];
  const requiredStrings = [
    'id',
    'repository',
    'signerWorkflow',
    'sourceRef',
    'sourceDigest',
    'predicateType',
    'oidcIssuer',
    'runner',
  ];
  if (policy.status !== 'active') throw new Error(`Publisher attestation policy for ${releaseTag} is stale`);
  for (const key of requiredStrings) {
    if (typeof policy[key] !== 'string' || policy[key].length === 0) {
      throw new Error(`Publisher attestation policy for ${releaseTag} is missing ${key}`);
    }
  }
  if (!SOURCE_DIGEST.test(policy.sourceDigest)) throw new Error(`Invalid publisher source digest for ${releaseTag}`);
  if (policy.predicateType !== 'https://slsa.dev/provenance/v1') {
    throw new Error(`Unsupported publisher predicate for ${releaseTag}`);
  }
  if (policy.oidcIssuer !== 'https://token.actions.githubusercontent.com' || policy.runner !== 'github-hosted') {
    throw new Error(`Unsupported publisher identity for ${releaseTag}`);
  }
  return policy;
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function verifyPublisherAttestation(options) {
  const { artifactPath, assetName, releaseTag, expectedSha256 } = options || {};
  const run = options?.execFileSyncImpl || execFileSync;
  if (!artifactPath || !fs.statSync(artifactPath).isFile())
    throw new Error('Publisher attestation artifact is missing');
  if (!assetName || path.basename(artifactPath) !== assetName)
    throw new Error('Publisher attestation executable/archive identity mismatch');
  if (!SHA256.test(expectedSha256 || '')) throw new Error('Publisher attestation expected digest is malformed');
  const actualSha256 = sha256(artifactPath);
  if (actualSha256 !== expectedSha256) {
    throw new Error(`Publisher attestation digest mismatch: expected ${expectedSha256}, got ${actualSha256}`);
  }
  const policy = selectPolicy(releaseTag, options?.policyDocument);
  let raw;
  try {
    raw = run(
      'gh',
      [
        'attestation',
        'verify',
        artifactPath,
        '--repo',
        policy.repository,
        '--signer-workflow',
        policy.signerWorkflow,
        '--source-ref',
        policy.sourceRef,
        '--source-digest',
        policy.sourceDigest,
        '--predicate-type',
        policy.predicateType,
        '--deny-self-hosted-runners',
        '--format',
        'json',
      ],
      { encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] }
    );
  } catch (error) {
    throw new Error(`Core publisher authentication failed for ${assetName}: ${error.message}`);
  }
  let attestations;
  try {
    attestations = JSON.parse(String(raw));
  } catch {
    throw new Error(`Core publisher authentication returned invalid evidence for ${assetName}`);
  }
  if (!Array.isArray(attestations) || attestations.length === 0) {
    throw new Error(`Core publisher authentication returned no signed attestation for ${assetName}`);
  }
  return {
    contract: CONTRACT,
    policyId: policy.id,
    repository: policy.repository,
    signerWorkflow: policy.signerWorkflow,
    sourceRef: policy.sourceRef,
    sourceDigest: policy.sourceDigest,
    predicateType: policy.predicateType,
    runner: policy.runner,
    asset: assetName,
    sha256: `sha256:${actualSha256}`,
    verified: true,
  };
}

module.exports = { CONTRACT, POLICY_FILE, readPolicy, selectPolicy, verifyPublisherAttestation };
