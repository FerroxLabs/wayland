'use strict';

const fs = require('node:fs');
const path = require('node:path');

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

function defaultVerifyHardeningMatrix(matrix) {
  let verifier;
  try {
    verifier = require('./verifyHardeningMatrix').verifyHardeningMatrix;
  } catch {
    fail('M8A_MATRIX_AUTHORITY_UNAVAILABLE', 'canonical-hardening-matrix-verifier-not-installed');
  }
  return verifier(matrix);
}

function defaultVerifyCapabilitySeal(seal) {
  return require('../capability-seal/verifyCandidateCapabilitySeal').verifyCapabilitySeal(seal);
}

function defaultVerifyThirdPartyLedger() {
  return require('../supply-chain/verifyThirdPartyExecutableLedger').verifyThirdPartyExecutableLedger();
}

function defaultVerifyPublisherArtifact(artifact) {
  return require('../supply-chain/verifyPublisherAttestation').verifyPublisherAttestation(artifact);
}

function defaultExpectedPublisherAssets() {
  const { readPolicy } = require('../supply-chain/verifyPublisherAttestation');
  const policy = readPolicy();
  const active = policy.policies.filter((entry) => entry.status === 'active');
  if (active.length !== 1) fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'no-unique-active-core-release');
  const shasums = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'bundled-wcore-shasums.json'), 'utf8'));
  const assets = Object.keys(shasums[active[0].releaseTag] || {}).sort();
  if (assets.length !== TARGETS.length) {
    fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'core-release-target-coverage-mismatch');
  }
  return assets;
}

function authorityUnavailable(name) {
  return () => fail(`M8A_${name}_AUTHORITY_UNAVAILABLE`, 'trusted-validator-not-installed');
}

const DEFAULT_VERIFIERS = Object.freeze({
  verifyHardeningMatrix: defaultVerifyHardeningMatrix,
  verifyCapabilitySeal: defaultVerifyCapabilitySeal,
  verifyPlatformSmoke: authorityUnavailable('PLATFORM_SMOKE'),
  verifyTargetGateReceipt: authorityUnavailable('TARGET_GATE_RECEIPT'),
  verifyThirdPartyLedger: defaultVerifyThirdPartyLedger,
  verifyPublisherArtifact: defaultVerifyPublisherArtifact,
  expectedPublisherAssets: defaultExpectedPublisherAssets,
  verifyUpdaterObservation: authorityUnavailable('UPDATER'),
  verifyConditionalCapability: authorityUnavailable('CONDITIONAL_CAPABILITY'),
  verifyFindingsClearance: authorityUnavailable('FINDINGS_CLEARANCE'),
  verifyReleaseBlockers: authorityUnavailable('RELEASE_BLOCKERS'),
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
      'targetGateReceipts',
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
  if (!Array.isArray(result.targetGateReceipts) || result.targetGateReceipts.length !== 30) {
    fail('M8A_MATRIX_RECEIPT_INVALID', 'target-gate-coverage-mismatch');
  }
  const ids = new Set();
  for (const requirement of result.targetGateReceipts) {
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
    ['contract', 'candidate', 'selectionSha256', 'capabilities', 'sealSha256'],
    'M8A_CAPABILITY_SEAL_INVALID'
  );
  if (result.contract !== 'wayland-candidate-capability-seal/2.0') {
    fail('M8A_CAPABILITY_SEAL_INVALID', 'unsupported-contract');
  }
  sameCandidate(result.candidate, candidate, 'M8A_CAPABILITY_SEAL_INVALID');
  digest(result.selectionSha256, 'M8A_CAPABILITY_SEAL_INVALID');
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
    ['installerDigest', 'executableSha256', 'appAsarSha256', 'verifiedCandidateDigest'],
    'M8A_PLATFORM_SMOKE_INVALID'
  );
  for (const value of Object.values(artifacts)) digest(value, 'M8A_PLATFORM_SMOKE_INVALID');
  if (result.authority !== 'canonical-packaged-runtime-observer') {
    fail('M8A_PLATFORM_SMOKE_INVALID', 'untrusted-authority');
  }
  return result;
}

function verifyTargetGateReceipt(receipt, candidate, requirement, artifacts) {
  const result = exactKeys(
    receipt,
    ['contract', 'receiptId', 'target', 'gate', 'candidate', 'artifacts', 'authority', 'evidenceSha256'],
    'M8A_TARGET_GATE_RECEIPT_INVALID'
  );
  if (
    result.contract !== requirement.contract ||
    result.receiptId !== requirement.receiptId ||
    result.target !== requirement.target ||
    result.gate !== requirement.gate ||
    result.authority !== 'canonical-target-hardening-observer'
  ) {
    fail('M8A_TARGET_GATE_RECEIPT_INVALID', 'requirement-mismatch');
  }
  sameCandidate(result.candidate, candidate, 'M8A_TARGET_GATE_RECEIPT_INVALID');
  const observedArtifacts = exactKeys(
    result.artifacts,
    ['installerDigest', 'executableSha256', 'appAsarSha256', 'verifiedCandidateDigest'],
    'M8A_TARGET_GATE_RECEIPT_INVALID'
  );
  for (const value of Object.values(observedArtifacts)) digest(value, 'M8A_TARGET_GATE_RECEIPT_INVALID');
  if (JSON.stringify(observedArtifacts) !== JSON.stringify(artifacts)) {
    fail('M8A_TARGET_GATE_RECEIPT_INVALID', 'artifact-identity-mismatch');
  }
  digest(result.evidenceSha256, 'M8A_TARGET_GATE_RECEIPT_INVALID');
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

function verifyUpdaterReceipt(receipt, candidate) {
  const result = exactKeys(
    receipt,
    ['contract', 'candidate', 'authority', 'receiptSha256'],
    'M8A_UPDATER_RECEIPT_INVALID'
  );
  if (
    result.contract !== 'wayland-updater-trusted-observation/1.0' ||
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
  if (result.contract !== contract || result.authority !== 'canonical-release-tracker')
    fail(code, 'untrusted-authority');
  sameCandidate(result.candidate, candidate, code);
  const unresolved = exactKeys(result.unresolved, counters, code);
  for (const severity of counters) {
    if (!Number.isSafeInteger(unresolved[severity]) || unresolved[severity] !== 0) fail(code, `${severity}-unresolved`);
  }
  digest(result.evidenceSha256, code);
  return result;
}

function verifyFinalAcceptance(input, injected = {}) {
  const request = exactKeys(
    input,
    [
      'contract',
      'candidate',
      'hardeningMatrix',
      'capabilitySeal',
      'packageSmokes',
      'targetGateReceipts',
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
  const verifiers = { ...DEFAULT_VERIFIERS, ...injected };

  const matrixReceipt = verifyMatrixReceipt(verifiers.verifyHardeningMatrix(request.hardeningMatrix));
  const capabilitySeal = verifiers.verifyCapabilitySeal(request.capabilitySeal);
  const capabilities = verifyCapabilitySealReceipt(capabilitySeal, candidate);
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
  const platformByTarget = new Map(platformReceipts.map((receipt) => [receipt.target, receipt]));

  if (!Array.isArray(request.targetGateReceipts) || request.targetGateReceipts.length !== 30) {
    fail('M8A_TARGET_GATE_RECEIPT_INVALID', 'coverage-mismatch');
  }
  const rawTargetGateReceipts = new Map();
  for (const raw of request.targetGateReceipts) {
    const receiptId = raw && typeof raw === 'object' ? raw.receiptId : null;
    if (typeof receiptId !== 'string' || rawTargetGateReceipts.has(receiptId)) {
      fail('M8A_TARGET_GATE_RECEIPT_INVALID', 'missing-or-duplicate-receipt-id');
    }
    rawTargetGateReceipts.set(receiptId, raw);
  }
  const targetGateReceipts = matrixReceipt.targetGateReceipts.map((requirement) => {
    const raw = rawTargetGateReceipts.get(requirement.receiptId);
    if (!raw) fail('M8A_TARGET_GATE_RECEIPT_INVALID', `missing:${requirement.receiptId}`);
    const platformReceipt = platformByTarget.get(requirement.target);
    return verifyTargetGateReceipt(
      verifiers.verifyTargetGateReceipt(raw, {
        candidate,
        requirement,
        artifacts: platformReceipt.artifacts,
      }),
      candidate,
      requirement,
      platformReceipt.artifacts
    );
  });
  if (rawTargetGateReceipts.size !== targetGateReceipts.length) {
    fail('M8A_TARGET_GATE_RECEIPT_INVALID', 'unknown-receipt-id');
  }

  const expectedPublisherAssets = verifiers.expectedPublisherAssets();
  if (
    !Array.isArray(expectedPublisherAssets) ||
    expectedPublisherAssets.length !== TARGETS.length ||
    new Set(expectedPublisherAssets).size !== expectedPublisherAssets.length ||
    expectedPublisherAssets.some((asset) => typeof asset !== 'string' || asset.length === 0)
  ) {
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
  const observedPublisherAssets = publisherReceipts.map((receipt) => receipt.asset).sort();
  if (JSON.stringify(observedPublisherAssets) !== JSON.stringify([...expectedPublisherAssets].sort())) {
    fail('M8A_PUBLISHER_ATTESTATION_INVALID', 'missing-duplicate-or-unknown-core-asset');
  }

  const updaterReceipt = verifyUpdaterReceipt(verifiers.verifyUpdaterObservation(request.updaterEvidence), candidate);

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
    capabilitySealSha256: capabilitySeal.sealSha256,
    targets: platformReceipts.map((receipt) => ({ target: receipt.target, artifacts: receipt.artifacts })),
    targetGates: targetGateReceipts.map((receipt) => ({
      receiptId: receipt.receiptId,
      target: receipt.target,
      gate: receipt.gate,
      evidenceSha256: receipt.evidenceSha256,
    })),
    publisherAssets: publisherReceipts.map((receipt) => ({ asset: receipt.asset, sha256: receipt.sha256 })),
    updaterReceiptSha256: updaterReceipt.receiptSha256,
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

module.exports = {
  CAPABILITIES,
  DEFAULT_VERIFIERS,
  RECEIPT_CONTRACT,
  REQUEST_CONTRACT,
  TARGETS,
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
