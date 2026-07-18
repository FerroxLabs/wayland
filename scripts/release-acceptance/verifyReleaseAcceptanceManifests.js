'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPOSITORY = 'FerroxLabs/wayland';
const SIGNER_WORKFLOW = 'FerroxLabs/wayland/.github/workflows/release-acceptance-trust-root.yml';
const SIGNER_SOURCE_REF = 'refs/heads/release-trust-v1';
const PREDICATE_TYPE = 'https://slsa.dev/provenance/v1';
const COMMIT = /^[a-f0-9]{40,64}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;

function exactKeys(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) {
    throw new Error(`${label} has missing or unknown critical fields`);
  }
  return value;
}

function verifyCandidate(candidate, expected, label) {
  exactKeys(candidate, ['commit', 'tree'], label);
  if (!COMMIT.test(String(candidate.commit)) || !COMMIT.test(String(candidate.tree))) {
    throw new Error(`${label} is malformed`);
  }
  if (candidate.commit !== expected.commit || candidate.tree !== expected.tree) {
    throw new Error(`${label} is stale or foreign`);
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

function verifyGitHubAttestation(manifestPath, manifestSha256, options = {}) {
  const run = options.execFileSyncImpl || execFileSync;
  const trustedCommit = trustRootCommit(options);
  if (typeof manifestPath !== 'string' || !manifestPath || !fs.statSync(manifestPath).isFile()) {
    throw new Error('Release acceptance manifest is missing');
  }
  let raw;
  try {
    raw = run(
      'gh',
      [
        'attestation',
        'verify',
        manifestPath,
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
    throw new Error(`Release acceptance manifest attestation failed: ${error.message}`);
  }
  let attestations;
  try {
    attestations = JSON.parse(String(raw));
  } catch {
    throw new Error('Release acceptance manifest attestation returned invalid evidence');
  }
  const expectedDigest = manifestSha256.slice('sha256:'.length);
  if (
    !Array.isArray(attestations) ||
    attestations.length === 0 ||
    !attestations.some((entry) => {
      const statement = entry && entry.verificationResult && entry.verificationResult.statement;
      return (
        statement &&
        statement.predicateType === PREDICATE_TYPE &&
        Array.isArray(statement.subject) &&
        statement.subject.some((subject) => subject && subject.digest && subject.digest.sha256 === expectedDigest)
      );
    })
  ) {
    throw new Error('Release acceptance manifest is unattested');
  }
}

function readAttestedManifest(input, candidate, options = {}) {
  exactKeys(input, ['manifestPath'], 'release acceptance manifest input');
  const bytes = fs.readFileSync(input.manifestPath);
  const manifestSha256 = sha256(bytes);
  verifyGitHubAttestation(input.manifestPath, manifestSha256, options);
  let manifest;
  try {
    manifest = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error('Release acceptance manifest is not valid JSON');
  }
  return { manifest, manifestSha256, manifestPath: path.resolve(input.manifestPath) };
}

function readEvidenceBytes(manifestPath, evidencePath, expectedSha256, label) {
  if (typeof evidencePath !== 'string' || !evidencePath || path.isAbsolute(evidencePath)) {
    throw new Error(`${label} path is invalid`);
  }
  const root = path.dirname(path.resolve(manifestPath));
  const resolved = path.resolve(root, evidencePath);
  if (resolved === root || !resolved.startsWith(`${root}${path.sep}`))
    throw new Error(`${label} escapes evidence root`);
  let stat;
  try {
    stat = fs.lstatSync(resolved);
  } catch {
    throw new Error(`${label} file is missing`);
  }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} is not a regular file`);
  const observed = sha256(fs.readFileSync(resolved));
  if (observed !== expectedSha256) throw new Error(`${label} digest mismatch`);
  return { evidencePath, evidenceSha256: observed };
}

function exactCoverage(entries, expectedByKind, manifestPath) {
  const expected = new Map();
  for (const [kind, ids] of Object.entries(expectedByKind)) {
    if (!Array.isArray(ids)) throw new Error(`Expected ${kind} coverage is unavailable`);
    for (const id of ids) {
      const key = `${kind}:${id}`;
      if (expected.has(key)) throw new Error(`Expected release evidence duplicated: ${key}`);
      expected.set(key, { kind, id });
    }
  }
  if (!Array.isArray(entries) || entries.length !== expected.size) {
    throw new Error('Release evidence coverage mismatch');
  }
  const observed = new Map();
  for (const entry of entries) {
    exactKeys(entry, ['kind', 'id', 'evidencePath', 'evidenceSha256'], 'release evidence entry');
    const key = `${entry.kind}:${entry.id}`;
    if (!expected.has(key) || observed.has(key)) {
      throw new Error(`Release evidence is unknown, misbound, or duplicated: ${key}`);
    }
    if (!SHA256.test(String(entry.evidenceSha256))) {
      throw new Error(`Release evidence digest is invalid: ${key}`);
    }
    const evidence = readEvidenceBytes(
      manifestPath,
      entry.evidencePath,
      entry.evidenceSha256,
      `release evidence ${key}`
    );
    observed.set(key, { kind: entry.kind, id: entry.id, ...evidence });
  }
  return [...expected.keys()].map((key) => observed.get(key));
}

function verifyReleaseEvidenceManifest(input, context, options = {}) {
  const { candidate, expectedByKind } = context;
  const { manifest, manifestSha256, manifestPath } = readAttestedManifest(input, candidate, options);
  exactKeys(manifest, ['contract', 'candidate', 'evidence'], 'release evidence manifest');
  if (manifest.contract !== 'wayland-release-evidence-manifest/1.0') {
    throw new Error('Unsupported release evidence manifest contract');
  }
  verifyCandidate(manifest.candidate, candidate, 'release evidence manifest candidate');
  return {
    contract: 'wayland-release-evidence-attestation/1.0',
    candidate: { commit: candidate.commit, tree: candidate.tree },
    evidence: exactCoverage(manifest.evidence, expectedByKind, manifestPath),
    manifestSha256,
    signerWorkflow: SIGNER_WORKFLOW,
    authority: 'github-attested-release-evidence',
  };
}

function verifyReleaseClaimsManifest(input, context, options = {}) {
  const { candidate, capabilityIds } = context;
  const { manifest, manifestSha256, manifestPath } = readAttestedManifest(input, candidate, options);
  exactKeys(manifest, ['contract', 'candidate', 'capabilities'], 'release claims manifest');
  if (manifest.contract !== 'wayland-release-claims-manifest/1.0') {
    throw new Error('Unsupported release claims manifest contract');
  }
  verifyCandidate(manifest.candidate, candidate, 'release claims manifest candidate');
  if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length !== capabilityIds.length) {
    throw new Error('Release claims capability coverage mismatch');
  }
  const claims = new Map();
  for (const capability of manifest.capabilities) {
    exactKeys(capability, ['id', 'claimed', 'evidencePath', 'evidenceSha256'], 'release claims capability');
    if (!capabilityIds.includes(capability.id) || claims.has(capability.id)) {
      throw new Error(`Release claims capability is unknown or duplicated: ${capability.id}`);
    }
    if (typeof capability.claimed !== 'boolean' || !SHA256.test(String(capability.evidenceSha256))) {
      throw new Error(`Release claims capability evidence is invalid: ${capability.id}`);
    }
    const evidence = readEvidenceBytes(
      manifestPath,
      capability.evidencePath,
      capability.evidenceSha256,
      `release claim ${capability.id}`
    );
    claims.set(capability.id, { id: capability.id, claimed: capability.claimed, ...evidence });
  }
  return {
    contract: 'wayland-release-claims-attestation/1.0',
    candidate: { commit: candidate.commit, tree: candidate.tree },
    capabilities: capabilityIds.map((id) => claims.get(id)),
    manifestSha256,
    signerWorkflow: SIGNER_WORKFLOW,
    authority: 'github-attested-release-claims',
  };
}

module.exports = {
  PREDICATE_TYPE,
  REPOSITORY,
  SIGNER_SOURCE_REF,
  SIGNER_WORKFLOW,
  verifyReleaseClaimsManifest,
  verifyReleaseEvidenceManifest,
};
