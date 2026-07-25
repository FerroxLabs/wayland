'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REQUEST_CONTRACT = 'wayland-final-acceptance-request/1.0';
const RECEIPT_CONTRACT = 'wayland-final-acceptance/1.0';
const TARGETS = ['darwin-arm64', 'darwin-x64', 'win32-arm64', 'win32-x64', 'linux-arm64', 'linux-x64'];
const CAPABILITIES = ['cowork-office', 'voice', 'mcp', 'sandbox', 'flux'];
const COMMIT = /^[a-f0-9]{40,64}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;

function fail(code, detail) {
  throw new Error(`${code}:${detail}`);
}

function exactKeys(value, expected, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code, 'expected-object');
  const actual = Object.keys(value).sort();
  if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) {
    fail(code, 'missing-or-unknown-critical-field');
  }
  return value;
}

function exactArray(value, expected, code) {
  if (!Array.isArray(value) || JSON.stringify(value) !== JSON.stringify(expected)) fail(code, 'coverage-mismatch');
}

function candidateIdentity(value, code = 'M8A_CANDIDATE_INVALID') {
  const candidate = exactKeys(value, ['commit', 'tree'], code);
  if (!COMMIT.test(String(candidate.commit)) || !COMMIT.test(String(candidate.tree))) fail(code, 'malformed-identity');
  return candidate;
}

function sameCandidate(observed, expected, code) {
  const candidate = candidateIdentity(observed, code);
  if (candidate.commit !== expected.commit || candidate.tree !== expected.tree)
    fail(code, 'stale-or-foreign-candidate');
  return candidate;
}

function digest(value, code) {
  if (!SHA256.test(String(value))) fail(code, 'invalid-sha256');
  return value;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function productionCandidateRoot() {
  const configured = process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT;
  if (!configured) fail('M8A_LIVE_CANDIDATE_INVALID', 'WAYLAND_ACCEPTANCE_CANDIDATE_ROOT-required');
  const root = path.resolve(configured);
  let stat;
  try {
    stat = fs.lstatSync(root);
  } catch {
    fail('M8A_LIVE_CANDIDATE_INVALID', 'candidate-root-missing');
  }
  if (!stat.isDirectory() || stat.isSymbolicLink() || path.resolve(fs.realpathSync(root)) !== root) {
    fail('M8A_LIVE_CANDIDATE_INVALID', 'candidate-root-must-be-real-directory');
  }
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  let topLevel;
  try {
    // path.resolve on both sides, because git reports Windows paths with
    // FORWARD slashes ('C:/Users/...') while path.resolve produces backslashes.
    // Comparing them raw meant this check could never pass on Windows and always
    // failed with candidate-root-is-not-worktree-top-level.
    topLevel = path.resolve(fs.realpathSync(git('rev-parse', '--show-toplevel')));
  } catch {
    fail('M8A_LIVE_CANDIDATE_INVALID', 'candidate-root-is-not-git-worktree');
  }
  if (topLevel !== root) fail('M8A_LIVE_CANDIDATE_INVALID', 'candidate-root-is-not-worktree-top-level');
  if (git('status', '--porcelain=v1', '--untracked-files=all')) {
    fail('M8A_LIVE_CANDIDATE_INVALID', 'dirty-source-tree');
  }
  return root;
}

function defaultObserveCandidateIdentity() {
  const root = productionCandidateRoot();
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  const candidate = { commit: git('rev-parse', 'HEAD'), tree: git('rev-parse', 'HEAD^{tree}') };
  candidateIdentity(candidate, 'M8A_LIVE_CANDIDATE_INVALID');
  return candidate;
}

function defaultVerifyHardeningMatrix(matrix) {
  let verifier;
  try {
    verifier = require('./verifyHardeningMatrix').verifyHardeningMatrix;
  } catch {
    fail('M8A_MATRIX_AUTHORITY_UNAVAILABLE', 'canonical-hardening-matrix-verifier-not-installed');
  }
  return verifier(matrix);
}

function defaultVerifyTargetGateReceiptFiles(input, candidate) {
  exactKeys(input, ['receiptsDirectory'], 'M8A_TARGET_GATE_RECEIPT_INVALID');
  let verifier;
  try {
    verifier = require('./verifyHardeningMatrix').verifyTargetGateReceiptFiles;
  } catch {
    fail('M8A_TARGET_GATE_RECEIPT_AUTHORITY_UNAVAILABLE', 'canonical-target-gate-validator-not-installed');
  }
  if (typeof verifier !== 'function') {
    fail('M8A_TARGET_GATE_RECEIPT_AUTHORITY_UNAVAILABLE', 'canonical-target-gate-validator-not-installed');
  }
  return verifier(input.receiptsDirectory, candidate);
}

function defaultExpectedReleaseEvidence() {
  let matrix;
  try {
    matrix = require('./verifyHardeningMatrix');
  } catch {
    fail('M8A_RELEASE_EVIDENCE_AUTHORITY_UNAVAILABLE', 'canonical-hardening-matrix-verifier-not-installed');
  }
  return {
    invariant: matrix.INVARIANTS,
    criterion: matrix.CRITERIA,
    journey: matrix.JOURNEYS,
    'hardening-gate': matrix.GATES,
  };
}

function defaultVerifyReleaseEvidenceManifest(input, context) {
  return require('./verifyReleaseAcceptanceManifests').verifyReleaseEvidenceManifest(input, context);
}

function defaultVerifyReleaseClaimsManifest(input, context) {
  return require('./verifyReleaseAcceptanceManifests').verifyReleaseClaimsManifest(input, context);
}

function defaultVerifyCapabilitySeal(seal) {
  const authority = require('../capability-seal/verifyCandidateCapabilitySeal');
  const verified = authority.verifyCapabilitySeal(seal);
  const root = productionCandidateRoot();
  const recreated = authority.createCapabilitySeal({
    root,
    selectionFile: path.join(root, 'scripts', 'capability-seal', 'candidate-capabilities.json'),
  });
  if (canonical(verified) !== canonical(recreated)) {
    fail('M8A_CAPABILITY_SEAL_INVALID', 'seal-was-not-recreated-from-authoritative-receipts');
  }
  return verified;
}

function defaultVerifyThirdPartyLedger() {
  const root = productionCandidateRoot();
  return require('../supply-chain/verifyThirdPartyExecutableLedger').verifyThirdPartyExecutableLedger({
    projectRoot: root,
    ledgerFile: path.join(root, 'scripts', 'supply-chain', 'third-party-executables.json'),
  });
}

function defaultVerifyPlatformSmoke(input, context) {
  return require('./verifyPlatformPackageSmokes').verifyPlatformPackageSmoke(input, context);
}

function defaultVerifyPublisherArtifact(artifact) {
  return require('../supply-chain/verifyPublisherAttestation').verifyPublisherAttestation(artifact);
}

function defaultVerifyUpdaterObservation(input) {
  return require('./verifyUpdaterObservation').verifyUpdaterObservation(input);
}

function defaultVerifyConditionalCapability(input, context) {
  return require('./verifyReleaseAuthorities').verifyConditionalCapability(input, context);
}

function defaultVerifyFindingsClearance(input, context) {
  return require('./verifyReleaseAuthorities').verifyFindingsClearance(input, context);
}

function defaultVerifyReleaseBlockers(input, context) {
  return require('./verifyReleaseAuthorities').verifyReleaseBlockers(input, context);
}

function defaultExpectedPublisherAssets() {
  const { readPolicy } = require('../supply-chain/verifyPublisherAttestation');
  const policy = readPolicy();
  const active = policy.policies.filter((entry) => entry.status === 'active');
  if (active.length !== 1) fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'no-unique-active-core-release');
  const shasums = JSON.parse(
    fs.readFileSync(path.join(productionCandidateRoot(), 'scripts', 'bundled-wcore-shasums.json'), 'utf8')
  );
  const assets = Object.entries(shasums[active[0].releaseTag] || {})
    .map(([asset, evidence]) => ({
      asset,
      sha256: typeof evidence === 'string' ? evidence : evidence?.archiveSha256,
    }))
    .sort((left, right) => left.asset.localeCompare(right.asset));
  if (assets.length !== TARGETS.length) {
    fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'core-release-target-coverage-mismatch');
  }
  for (const asset of assets) {
    exactKeys(asset, ['asset', 'sha256'], 'M8A_PUBLISHER_ATTESTATION_INVALID');
    if (typeof asset.asset !== 'string' || asset.asset.length === 0) {
      fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'invalid-authoritative-asset');
    }
    digest(asset.sha256, 'M8A_PUBLISHER_ATTESTATION_INVALID');
  }
  return assets;
}

const DEFAULT_VERIFIERS = Object.freeze({
  observeCandidateIdentity: defaultObserveCandidateIdentity,
  verifyHardeningMatrix: defaultVerifyHardeningMatrix,
  verifyCapabilitySeal: defaultVerifyCapabilitySeal,
  verifyPlatformSmoke: defaultVerifyPlatformSmoke,
  verifyTargetGateReceiptFiles: defaultVerifyTargetGateReceiptFiles,
  expectedReleaseEvidence: defaultExpectedReleaseEvidence,
  verifyReleaseEvidenceManifest: defaultVerifyReleaseEvidenceManifest,
  verifyReleaseClaimsManifest: defaultVerifyReleaseClaimsManifest,
  verifyThirdPartyLedger: defaultVerifyThirdPartyLedger,
  verifyPublisherArtifact: defaultVerifyPublisherArtifact,
  expectedPublisherAssets: defaultExpectedPublisherAssets,
  verifyUpdaterObservation: defaultVerifyUpdaterObservation,
  verifyConditionalCapability: defaultVerifyConditionalCapability,
  verifyFindingsClearance: defaultVerifyFindingsClearance,
  verifyReleaseBlockers: defaultVerifyReleaseBlockers,
});

function verifyMatrixReceipt(receipt) {
  const result = exactKeys(
    receipt,
    [
      'contract',
      'invariants',
      'criteria',
      'journeys',
      'targets',
      'gates',
      'targetProofGates',
      'targetGateReceiptSchema',
      'targetGateRequirements',
      'conditionalCapabilities',
    ],
    'M8A_MATRIX_RECEIPT_INVALID'
  );
  if (
    result.contract !== 'wayland-release-hardening-matrix/1.0' ||
    result.invariants !== 21 ||
    result.criteria !== 31 ||
    result.journeys !== 24 ||
    result.targets !== 6 ||
    result.gates !== 15 ||
    result.targetProofGates !== 5 ||
    result.conditionalCapabilities !== 5
  ) {
    fail('M8A_MATRIX_RECEIPT_INVALID', 'incomplete-coverage');
  }
  const schema = exactKeys(
    result.targetGateReceiptSchema,
    ['contract', 'requiredFields', 'authority'],
    'M8A_MATRIX_RECEIPT_INVALID'
  );
  if (
    schema.contract !== 'wayland-target-hardening-gate-receipt/1.0' ||
    schema.authority !== 'canonical-target-hardening-validator' ||
    JSON.stringify(schema.requiredFields) !==
      JSON.stringify([
        'contract',
        'receiptId',
        'candidate',
        'target',
        'gate',
        'authority',
        'evidencePath',
        'evidenceSha256',
      ])
  ) {
    fail('M8A_MATRIX_RECEIPT_INVALID', 'target-gate-schema-mismatch');
  }
  if (!Array.isArray(result.targetGateRequirements) || result.targetGateRequirements.length !== 30) {
    fail('M8A_MATRIX_RECEIPT_INVALID', 'target-gate-coverage-mismatch');
  }
  const ids = new Set();
  for (const requirement of result.targetGateRequirements) {
    exactKeys(requirement, ['receiptId', 'contract', 'target', 'gate'], 'M8A_MATRIX_RECEIPT_INVALID');
    if (
      requirement.contract !== 'wayland-target-hardening-gate-receipt/1.0' ||
      !TARGETS.includes(requirement.target) ||
      typeof requirement.receiptId !== 'string' ||
      requirement.receiptId !== `M8-F:${requirement.target}:${requirement.gate}` ||
      ids.has(requirement.receiptId)
    ) {
      fail('M8A_MATRIX_RECEIPT_INVALID', 'invalid-target-gate-requirement');
    }
    ids.add(requirement.receiptId);
  }
  return result;
}

function verifyCapabilitySealReceipt(seal, candidate) {
  const result = exactKeys(
    seal,
    ['contract', 'candidate', 'selectionSha256', 'receiptManifestSha256', 'capabilities', 'sealSha256'],
    'M8A_CAPABILITY_SEAL_INVALID'
  );
  if (result.contract !== 'wayland-candidate-capability-seal/3.0') {
    fail('M8A_CAPABILITY_SEAL_INVALID', 'unsupported-contract');
  }
  sameCandidate(result.candidate, candidate, 'M8A_CAPABILITY_SEAL_INVALID');
  digest(result.selectionSha256, 'M8A_CAPABILITY_SEAL_INVALID');
  digest(result.receiptManifestSha256, 'M8A_CAPABILITY_SEAL_INVALID');
  digest(result.sealSha256, 'M8A_CAPABILITY_SEAL_INVALID');
  if (!Array.isArray(result.capabilities) || result.capabilities.length !== CAPABILITIES.length) {
    fail('M8A_CAPABILITY_SEAL_INVALID', 'coverage-mismatch');
  }
  const byId = new Map();
  for (const capability of result.capabilities) {
    if (
      !capability ||
      typeof capability !== 'object' ||
      !CAPABILITIES.includes(capability.id) ||
      byId.has(capability.id)
    ) {
      fail('M8A_CAPABILITY_SEAL_INVALID', 'unknown-or-duplicate-capability');
    }
    if (!['included', 'excluded'].includes(capability.mode)) fail('M8A_CAPABILITY_SEAL_INVALID', 'invalid-mode');
    byId.set(capability.id, capability);
  }
  return byId;
}

function verifyPlatformReceipt(receipt, candidate, expectedTarget) {
  const result = exactKeys(
    receipt,
    ['contract', 'target', 'candidate', 'artifacts', 'authority'],
    'M8A_PLATFORM_SMOKE_INVALID'
  );
  if (result.contract !== 'wayland-platform-package-smoke-authority/1.0' || result.target !== expectedTarget) {
    fail('M8A_PLATFORM_SMOKE_INVALID', 'contract-or-target');
  }
  sameCandidate(result.candidate, candidate, 'M8A_PLATFORM_SMOKE_INVALID');
  const artifacts = exactKeys(
    result.artifacts,
    [
      'installerBytesSha256',
      'installerSizeBytes',
      'installerDigest',
      'executableSha256',
      'appAsarSha256',
      'verifiedCandidateDigest',
      'reportSha256',
      'observationSha256',
    ],
    'M8A_PLATFORM_SMOKE_INVALID'
  );
  for (const [key, value] of Object.entries(artifacts)) {
    if (key !== 'installerSizeBytes') digest(value, 'M8A_PLATFORM_SMOKE_INVALID');
  }
  if (!Number.isSafeInteger(artifacts.installerSizeBytes) || artifacts.installerSizeBytes <= 0) {
    fail('M8A_PLATFORM_SMOKE_INVALID', 'invalid-installer-size');
  }
  if (result.authority !== 'protected-native-package-observer') {
    fail('M8A_PLATFORM_SMOKE_INVALID', 'untrusted-authority');
  }
  return result;
}

function verifyPublisherReceipt(receipt) {
  const result = exactKeys(
    receipt,
    [
      'contract',
      'policyId',
      'repository',
      'signerWorkflow',
      'sourceRef',
      'sourceDigest',
      'predicateType',
      'runner',
      'asset',
      'sha256',
      'verified',
    ],
    'M8A_PUBLISHER_ATTESTATION_INVALID'
  );
  if (
    result.contract !== 'wayland-publisher-attestations/1.0' ||
    result.repository !== 'FerroxLabs/wayland-core' ||
    result.runner !== 'github-hosted' ||
    result.predicateType !== 'https://slsa.dev/provenance/v1' ||
    result.verified !== true
  ) {
    fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'untrusted-attestation');
  }
  digest(result.sha256, 'M8A_PUBLISHER_ATTESTATION_INVALID');
  if (typeof result.asset !== 'string' || result.asset.length === 0) {
    fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'missing-asset');
  }
  return result;
}

function verifyUpdaterReceipt(receipt, candidate, target) {
  const result = exactKeys(
    receipt,
    ['contract', 'candidate', 'target', 'authority', 'receiptSha256'],
    'M8A_UPDATER_RECEIPT_INVALID'
  );
  if (
    result.contract !== 'wayland-updater-trusted-observation/1.0' ||
    result.target !== target ||
    result.authority !== 'nonce-bound-packaged-runtime-observer'
  ) {
    fail('M8A_UPDATER_RECEIPT_INVALID', 'untrusted-authority');
  }
  sameCandidate(result.candidate, candidate, 'M8A_UPDATER_RECEIPT_INVALID');
  digest(result.receiptSha256, 'M8A_UPDATER_RECEIPT_INVALID');
  return result;
}

function verifyConditionalReceipt(receipt, candidate, capabilityId, expectedReceiptIds) {
  const result = exactKeys(
    receipt,
    ['contract', 'candidate', 'capabilityId', 'receiptIds', 'receiptDigests', 'authority'],
    'M8A_CONDITIONAL_RECEIPT_INVALID'
  );
  if (
    result.contract !== 'wayland-capability-release-acceptance/1.0' ||
    result.capabilityId !== capabilityId ||
    result.authority !== 'canonical-capability-acceptance-validator'
  ) {
    fail('M8A_CONDITIONAL_RECEIPT_INVALID', 'untrusted-authority');
  }
  sameCandidate(result.candidate, candidate, 'M8A_CONDITIONAL_RECEIPT_INVALID');
  exactArray(result.receiptIds, expectedReceiptIds, 'M8A_CONDITIONAL_RECEIPT_INVALID');
  if (!Array.isArray(result.receiptDigests) || result.receiptDigests.length !== expectedReceiptIds.length) {
    fail('M8A_CONDITIONAL_RECEIPT_INVALID', 'digest-coverage-mismatch');
  }
  for (const value of result.receiptDigests) digest(value, 'M8A_CONDITIONAL_RECEIPT_INVALID');
  return result;
}

function verifyClearance(receipt, candidate, kind) {
  const code = kind === 'findings' ? 'M8A_FINDINGS_NOT_CLEAR' : 'M8A_RELEASE_BLOCKERS_NOT_CLEAR';
  const contract =
    kind === 'findings' ? 'wayland-release-findings-clearance/1.0' : 'wayland-release-blocker-clearance/1.0';
  const counters = kind === 'findings' ? ['blocker', 'critical', 'high'] : ['p0', 'p1'];
  const result = exactKeys(receipt, ['contract', 'candidate', 'unresolved', 'authority', 'evidenceSha256'], code);
  if (result.contract !== contract || result.authority !== 'automated-release-tracker')
    fail(code, 'untrusted-authority');
  sameCandidate(result.candidate, candidate, code);
  const unresolved = exactKeys(result.unresolved, counters, code);
  for (const severity of counters) {
    if (!Number.isSafeInteger(unresolved[severity]) || unresolved[severity] !== 0) fail(code, `${severity}-unresolved`);
  }
  digest(result.evidenceSha256, code);
  return result;
}

function verifyReleaseEvidenceReceipt(receipt, candidate, expectedByKind) {
  const result = exactKeys(
    receipt,
    ['contract', 'candidate', 'evidence', 'manifestSha256', 'signerWorkflow', 'authority'],
    'M8A_RELEASE_EVIDENCE_INVALID'
  );
  if (
    result.contract !== 'wayland-release-evidence-attestation/1.0' ||
    result.signerWorkflow !== 'FerroxLabs/wayland/.github/workflows/release-acceptance-trust-root.yml' ||
    result.authority !== 'github-attested-release-evidence'
  ) {
    fail('M8A_RELEASE_EVIDENCE_INVALID', 'untrusted-manifest');
  }
  sameCandidate(result.candidate, candidate, 'M8A_RELEASE_EVIDENCE_INVALID');
  digest(result.manifestSha256, 'M8A_RELEASE_EVIDENCE_INVALID');
  const expected = new Map();
  for (const [kind, ids] of Object.entries(expectedByKind)) {
    if (!Array.isArray(ids)) fail('M8A_RELEASE_EVIDENCE_INVALID', `expected-${kind}-coverage-unavailable`);
    for (const id of ids) {
      const key = `${kind}:${id}`;
      if (expected.has(key)) fail('M8A_RELEASE_EVIDENCE_INVALID', `duplicate-expected-id:${key}`);
      expected.set(key, { kind, id });
    }
  }
  if (!Array.isArray(result.evidence) || result.evidence.length !== expected.size) {
    fail('M8A_RELEASE_EVIDENCE_INVALID', 'coverage-mismatch');
  }
  const observed = new Set();
  for (const evidence of result.evidence) {
    exactKeys(evidence, ['kind', 'id', 'evidencePath', 'evidenceSha256'], 'M8A_RELEASE_EVIDENCE_INVALID');
    const key = `${evidence.kind}:${evidence.id}`;
    if (!expected.has(key) || observed.has(key)) {
      fail('M8A_RELEASE_EVIDENCE_INVALID', `unknown-misbound-or-duplicate:${key}`);
    }
    if (typeof evidence.evidencePath !== 'string' || evidence.evidencePath.length === 0) {
      fail('M8A_RELEASE_EVIDENCE_INVALID', `missing-evidence-path:${key}`);
    }
    digest(evidence.evidenceSha256, 'M8A_RELEASE_EVIDENCE_INVALID');
    observed.add(key);
  }
  return result;
}

function verifyTargetGateReceiptSet(receipt, candidate, requirements) {
  const result = exactKeys(
    receipt,
    ['contract', 'authority', 'candidate', 'receipts'],
    'M8A_TARGET_GATE_RECEIPT_INVALID'
  );
  if (
    result.contract !== 'wayland-target-hardening-gate-verification/1.0' ||
    result.authority !== 'canonical-target-hardening-validator'
  ) {
    fail('M8A_TARGET_GATE_RECEIPT_INVALID', 'untrusted-verification-set');
  }
  sameCandidate(result.candidate, candidate, 'M8A_TARGET_GATE_RECEIPT_INVALID');
  if (!Array.isArray(result.receipts) || result.receipts.length !== requirements.length) {
    fail('M8A_TARGET_GATE_RECEIPT_INVALID', 'coverage-mismatch');
  }
  const evidence = new Set();
  return result.receipts.map((verified, index) => {
    const requirement = requirements[index];
    exactKeys(
      verified,
      [
        'contract',
        'receiptId',
        'candidate',
        'target',
        'gate',
        'authority',
        'evidencePath',
        'evidenceSha256',
        'receiptFile',
        'evidenceFile',
        'attestationVerified',
      ],
      'M8A_TARGET_GATE_RECEIPT_INVALID'
    );
    if (
      verified.contract !== requirement.contract ||
      verified.receiptId !== requirement.receiptId ||
      verified.target !== requirement.target ||
      verified.gate !== requirement.gate ||
      verified.authority !== 'canonical-target-hardening-validator' ||
      verified.attestationVerified !== true
    ) {
      fail('M8A_TARGET_GATE_RECEIPT_INVALID', `foreign-or-misbound:${requirement.receiptId}`);
    }
    sameCandidate(verified.candidate, candidate, 'M8A_TARGET_GATE_RECEIPT_INVALID');
    digest(verified.evidenceSha256, 'M8A_TARGET_GATE_RECEIPT_INVALID');
    if (evidence.has(verified.evidenceSha256)) {
      fail('M8A_TARGET_GATE_RECEIPT_INVALID', `evidence-digest-reused:${verified.evidenceSha256}`);
    }
    evidence.add(verified.evidenceSha256);
    const file = exactKeys(verified.receiptFile, ['path', 'sha256'], 'M8A_TARGET_GATE_RECEIPT_INVALID');
    if (typeof file.path !== 'string' || file.path.length === 0) {
      fail('M8A_TARGET_GATE_RECEIPT_INVALID', 'missing-receipt-file-path');
    }
    digest(file.sha256, 'M8A_TARGET_GATE_RECEIPT_INVALID');
    const evidenceFile = exactKeys(verified.evidenceFile, ['path', 'sha256'], 'M8A_TARGET_GATE_RECEIPT_INVALID');
    if (
      typeof verified.evidencePath !== 'string' ||
      verified.evidencePath.length === 0 ||
      evidenceFile.path !== verified.evidencePath ||
      evidenceFile.sha256 !== verified.evidenceSha256
    ) {
      fail('M8A_TARGET_GATE_RECEIPT_INVALID', 'evidence-file-does-not-bind-receipt-claim');
    }
    if (file.path === evidenceFile.path) {
      fail('M8A_TARGET_GATE_RECEIPT_INVALID', 'receipt-and-evidence-path-collide');
    }
    return verified;
  });
}

function verifyReleaseClaimsReceipt(receipt, candidate) {
  const result = exactKeys(
    receipt,
    ['contract', 'candidate', 'capabilities', 'manifestSha256', 'signerWorkflow', 'authority'],
    'M8A_RELEASE_CLAIMS_INVALID'
  );
  if (
    result.contract !== 'wayland-release-claims-attestation/1.0' ||
    result.signerWorkflow !== 'FerroxLabs/wayland/.github/workflows/release-acceptance-trust-root.yml' ||
    result.authority !== 'github-attested-release-claims'
  ) {
    fail('M8A_RELEASE_CLAIMS_INVALID', 'untrusted-manifest');
  }
  sameCandidate(result.candidate, candidate, 'M8A_RELEASE_CLAIMS_INVALID');
  digest(result.manifestSha256, 'M8A_RELEASE_CLAIMS_INVALID');
  if (!Array.isArray(result.capabilities) || result.capabilities.length !== CAPABILITIES.length) {
    fail('M8A_RELEASE_CLAIMS_INVALID', 'coverage-mismatch');
  }
  const claims = new Map();
  for (const claim of result.capabilities) {
    exactKeys(claim, ['id', 'claimed', 'evidencePath', 'evidenceSha256'], 'M8A_RELEASE_CLAIMS_INVALID');
    if (!CAPABILITIES.includes(claim.id) || claims.has(claim.id) || typeof claim.claimed !== 'boolean') {
      fail('M8A_RELEASE_CLAIMS_INVALID', 'unknown-or-duplicate-capability');
    }
    if (typeof claim.evidencePath !== 'string' || claim.evidencePath.length === 0) {
      fail('M8A_RELEASE_CLAIMS_INVALID', `missing-evidence-path:${claim.id}`);
    }
    digest(claim.evidenceSha256, 'M8A_RELEASE_CLAIMS_INVALID');
    claims.set(claim.id, claim);
  }
  return claims;
}

function verifyFinalAcceptanceWithAuthorities(input, verifiers) {
  const request = exactKeys(
    input,
    [
      'contract',
      'candidate',
      'hardeningMatrix',
      'capabilitySeal',
      'packageSmokes',
      'targetGateReceipts',
      'releaseEvidenceManifest',
      'releaseClaimsManifest',
      'publisherArtifacts',
      'updaterEvidence',
      'conditionalReceipts',
      'findingsEvidence',
      'releaseBlockersEvidence',
    ],
    'M8A_REQUEST_INVALID'
  );
  if (request.contract !== REQUEST_CONTRACT) fail('M8A_REQUEST_INVALID', 'unsupported-contract');
  const candidate = candidateIdentity(request.candidate);
  sameCandidate(verifiers.observeCandidateIdentity(), candidate, 'M8A_LIVE_CANDIDATE_INVALID');

  const matrixReceipt = verifyMatrixReceipt(verifiers.verifyHardeningMatrix(request.hardeningMatrix));
  const expectedReleaseEvidence = verifiers.expectedReleaseEvidence();
  const releaseEvidenceReceipt = verifyReleaseEvidenceReceipt(
    verifiers.verifyReleaseEvidenceManifest(request.releaseEvidenceManifest, {
      candidate,
      expectedByKind: expectedReleaseEvidence,
    }),
    candidate,
    expectedReleaseEvidence
  );
  const capabilitySeal = verifiers.verifyCapabilitySeal(request.capabilitySeal);
  const capabilities = verifyCapabilitySealReceipt(capabilitySeal, candidate);
  const releaseClaimsReceipt = verifiers.verifyReleaseClaimsManifest(request.releaseClaimsManifest, {
    candidate,
    capabilityIds: CAPABILITIES,
  });
  const releaseClaims = verifyReleaseClaimsReceipt(releaseClaimsReceipt, candidate);
  for (const capabilityId of CAPABILITIES) {
    if (capabilities.get(capabilityId).mode === 'excluded' && releaseClaims.get(capabilityId).claimed) {
      fail('M8A_RELEASE_CLAIMS_INVALID', `excluded-capability-still-claimed:${capabilityId}`);
    }
  }
  const ledgerReceipt = verifiers.verifyThirdPartyLedger();
  if (
    !ledgerReceipt ||
    ledgerReceipt.contract !== 'wayland-third-party-executables/1.0' ||
    ledgerReceipt.entries !== 4 ||
    JSON.stringify(ledgerReceipt.ids) !== JSON.stringify(['7zip-recovery', 'bun', 'officecli', 'signal-cli'])
  ) {
    fail('M8A_THIRD_PARTY_LEDGER_INVALID', 'incomplete-live-ledger');
  }

  if (!Array.isArray(request.packageSmokes) || request.packageSmokes.length !== TARGETS.length) {
    fail('M8A_PLATFORM_SMOKE_INVALID', 'target-coverage-mismatch');
  }
  const rawByTarget = new Map();
  for (const raw of request.packageSmokes) {
    const target = raw && typeof raw === 'object' ? raw.target : null;
    if (!TARGETS.includes(target) || rawByTarget.has(target))
      fail('M8A_PLATFORM_SMOKE_INVALID', 'unknown-or-duplicate-target');
    rawByTarget.set(target, raw);
  }
  const platformReceipts = TARGETS.map((target) =>
    verifyPlatformReceipt(
      verifiers.verifyPlatformSmoke(rawByTarget.get(target), { candidate, target }),
      candidate,
      target
    )
  );
  const artifactIdentities = new Set(platformReceipts.map((receipt) => JSON.stringify(receipt.artifacts)));
  if (artifactIdentities.size !== TARGETS.length) fail('M8A_PLATFORM_SMOKE_INVALID', 'duplicate-artifact-identity');
  const targetGateReceipts = verifyTargetGateReceiptSet(
    verifiers.verifyTargetGateReceiptFiles(request.targetGateReceipts, candidate),
    candidate,
    matrixReceipt.targetGateRequirements
  );

  const expectedPublisherAssets = verifiers.expectedPublisherAssets();
  if (
    !Array.isArray(expectedPublisherAssets) ||
    expectedPublisherAssets.length !== TARGETS.length ||
    expectedPublisherAssets.some(
      (asset) =>
        !asset ||
        typeof asset !== 'object' ||
        Array.isArray(asset) ||
        Object.keys(asset).length !== 2 ||
        typeof asset.asset !== 'string' ||
        asset.asset.length === 0 ||
        !SHA256.test(String(asset.sha256))
    )
  ) {
    fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'invalid-authoritative-asset-set');
  }
  const expectedPublisherByAsset = new Map(expectedPublisherAssets.map((asset) => [asset.asset, asset.sha256]));
  if (expectedPublisherByAsset.size !== expectedPublisherAssets.length) {
    fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'invalid-authoritative-asset-set');
  }
  if (
    !Array.isArray(request.publisherArtifacts) ||
    request.publisherArtifacts.length !== expectedPublisherAssets.length
  ) {
    fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'core-asset-coverage-mismatch');
  }
  const publisherReceipts = request.publisherArtifacts.map((artifact) =>
    verifyPublisherReceipt(verifiers.verifyPublisherArtifact(artifact))
  );
  const observedPublisherAssets = new Set();
  for (const receipt of publisherReceipts) {
    if (observedPublisherAssets.has(receipt.asset) || !expectedPublisherByAsset.has(receipt.asset)) {
      fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'missing-duplicate-or-unknown-core-asset');
    }
    observedPublisherAssets.add(receipt.asset);
    if (receipt.sha256 !== expectedPublisherByAsset.get(receipt.asset)) {
      fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'core-asset-digest-mismatch');
    }
  }
  if (observedPublisherAssets.size !== expectedPublisherByAsset.size) {
    fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'missing-duplicate-or-unknown-core-asset');
  }

  const updaterInput = exactKeys(request.updaterEvidence, ['observations'], 'M8A_UPDATER_RECEIPT_INVALID');
  if (!Array.isArray(updaterInput.observations) || updaterInput.observations.length !== TARGETS.length) {
    fail('M8A_UPDATER_RECEIPT_INVALID', 'target-coverage-mismatch');
  }
  const updaterByTarget = new Map();
  for (const raw of updaterInput.observations) {
    const observation = exactKeys(raw, ['target', 'observationPath'], 'M8A_UPDATER_RECEIPT_INVALID');
    if (
      !TARGETS.includes(observation.target) ||
      updaterByTarget.has(observation.target) ||
      typeof observation.observationPath !== 'string' ||
      observation.observationPath.length === 0
    ) {
      fail('M8A_UPDATER_RECEIPT_INVALID', 'unknown-duplicate-or-malformed-target');
    }
    updaterByTarget.set(observation.target, observation);
  }
  const updaterReceipts = TARGETS.map((target) =>
    verifyUpdaterReceipt(
      verifiers.verifyUpdaterObservation({ observationPath: updaterByTarget.get(target).observationPath }),
      candidate,
      target
    )
  );

  if (!Array.isArray(request.conditionalReceipts)) fail('M8A_CONDITIONAL_RECEIPT_INVALID', 'expected-array');
  const rawConditional = new Map();
  for (const raw of request.conditionalReceipts) {
    const capabilityId = raw && typeof raw === 'object' ? raw.capabilityId : null;
    if (!CAPABILITIES.includes(capabilityId) || rawConditional.has(capabilityId)) {
      fail('M8A_CONDITIONAL_RECEIPT_INVALID', 'unknown-or-duplicate-capability');
    }
    rawConditional.set(capabilityId, raw);
  }
  const conditionalReceipts = [];
  for (const capabilityId of CAPABILITIES) {
    const capability = capabilities.get(capabilityId);
    const expectedReceiptIds = request.hardeningMatrix?.capabilityConditional?.[capabilityId]?.receipts;
    if (!Array.isArray(expectedReceiptIds)) fail('M8A_CONDITIONAL_RECEIPT_INVALID', 'matrix-receipts-unavailable');
    if (capability.mode === 'included') {
      if (!rawConditional.has(capabilityId)) fail('M8A_CONDITIONAL_RECEIPT_INVALID', `missing:${capabilityId}`);
      conditionalReceipts.push(
        verifyConditionalReceipt(
          verifiers.verifyConditionalCapability(rawConditional.get(capabilityId), {
            candidate,
            capabilityId,
            expectedReceiptIds,
          }),
          candidate,
          capabilityId,
          expectedReceiptIds
        )
      );
    } else if (rawConditional.has(capabilityId)) {
      fail('M8A_CONDITIONAL_RECEIPT_INVALID', `evidence-for-excluded:${capabilityId}`);
    }
  }

  const findingsReceipt = verifyClearance(
    verifiers.verifyFindingsClearance(request.findingsEvidence, { candidate }),
    candidate,
    'findings'
  );
  const releaseBlockersReceipt = verifyClearance(
    verifiers.verifyReleaseBlockers(request.releaseBlockersEvidence, { candidate }),
    candidate,
    'release-blockers'
  );

  return {
    contract: RECEIPT_CONTRACT,
    candidate,
    matrix: matrixReceipt,
    releaseEvidenceManifestSha256: releaseEvidenceReceipt.manifestSha256,
    releaseClaimsManifestSha256: releaseClaimsReceipt.manifestSha256,
    capabilitySealSha256: capabilitySeal.sealSha256,
    targets: platformReceipts.map((receipt) => ({ target: receipt.target, artifacts: receipt.artifacts })),
    targetGates: targetGateReceipts.map((receipt) => ({
      receiptId: receipt.receiptId,
      target: receipt.target,
      gate: receipt.gate,
      evidenceSha256: receipt.evidenceSha256,
    })),
    publisherAssets: publisherReceipts.map((receipt) => ({ asset: receipt.asset, sha256: receipt.sha256 })),
    updaterReceipts: updaterReceipts.map((receipt) => ({
      target: receipt.target,
      receiptSha256: receipt.receiptSha256,
    })),
    capabilityReceipts: conditionalReceipts.map((receipt) => ({
      capabilityId: receipt.capabilityId,
      receiptIds: receipt.receiptIds,
      receiptDigests: receipt.receiptDigests,
    })),
    clearance: {
      findingsEvidenceSha256: findingsReceipt.evidenceSha256,
      releaseBlockersEvidenceSha256: releaseBlockersReceipt.evidenceSha256,
    },
    accepted: true,
  };
}

function verifyFinalAcceptance(input) {
  return verifyFinalAcceptanceWithAuthorities(input, DEFAULT_VERIFIERS);
}

function testOnlyVerifyFinalAcceptance(input, injected = {}) {
  const receipt = verifyFinalAcceptanceWithAuthorities(input, { ...DEFAULT_VERIFIERS, ...injected });
  return {
    ...receipt,
    contract: 'wayland-final-acceptance-test-only/1.0',
    accepted: false,
  };
}

module.exports = {
  CAPABILITIES,
  DEFAULT_VERIFIERS,
  RECEIPT_CONTRACT,
  REQUEST_CONTRACT,
  TARGETS,
  testOnlyVerifyFinalAcceptance,
  verifyFinalAcceptance,
};

if (require.main === module) {
  try {
    if (process.argv.length !== 3) fail('M8A_USAGE_INVALID', 'expected-one-acceptance-request-json-path');
    const requestFile = path.resolve(process.argv[2]);
    const request = JSON.parse(fs.readFileSync(requestFile, 'utf8'));
    process.stdout.write(`${JSON.stringify(verifyFinalAcceptance(request))}\n`);
  } catch (error) {
    process.stderr.write(`Final acceptance rejected: ${error.message}\n`);
    process.exitCode = 1;
  }
}
