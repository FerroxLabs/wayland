import { createHash, createPublicKey, verify } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const oid = /^[0-9a-f]{40}([0-9a-f]{24})?$/;
const digest = /^sha256:[0-9a-f]{64}$/;
const safePacket = /^[A-Z0-9][A-Z0-9-]*$/;
const receiptFailureReasons = Object.freeze({
  UNSAFE_PACKET_IDENTIFIER: 'unsafe packet identifier',
  PACKET_CONTRACT_UNSEALED: 'packet contract is not sealed',
  PACKET_CANDIDATE_UNAUTHORIZED: 'packet candidate is not externally authorized',
  RECEIPT_SCHEMA_UNSUPPORTED: 'unsupported receipt schema',
  RECEIPT_UNSIGNED: 'unsigned receipt',
  PACKET_IDENTITY_MISMATCH: 'packet identity mismatch',
  RECEIPT_NOT_ACCEPTED: 'receipt is not accepted',
  SOURCE_BASELINE_MISMATCH: 'source baseline mismatch',
  GATE_MANIFEST_REVISION_MISMATCH: 'gate manifest revision mismatch',
  GATE_MANIFEST_DIGEST_MISMATCH: 'gate manifest digest mismatch',
  GATE_AUTHORIZATION_MISMATCH: 'receipt does not authorize this exact gate object',
  PACKET_CONTRACT_DIGEST_MISMATCH: 'packet contract digest mismatch',
  CANDIDATE_COMMIT_INVALID: 'invalid exact commit',
  CANDIDATE_TREE_INVALID: 'invalid exact tree',
  INTEGRATION_HEAD_INVALID: 'invalid accepted integration HEAD',
  EXTERNAL_AUTHORIZATION_MISMATCH: 'receipt candidate does not match external authorization',
  LANDED_COMMIT_MISMATCH: 'packet was not accepted at its exact landed commit',
  EVIDENCE_LOG_DIGEST_INVALID: 'invalid log digest',
  EVIDENCE_ENVIRONMENT_DIGEST_INVALID: 'invalid environment digest',
  ACCEPTANCE_TIMESTAMP_INVALID: 'invalid acceptance timestamp',
  ACCEPTANCE_SIGNER_UNKNOWN: 'unknown acceptance signer',
  ACCEPTANCE_SIGNER_REVOKED: 'acceptance signer is revoked',
  SIGNER_VALIDITY_WINDOW_INVALID: 'signer validity window is malformed',
  SIGNER_NOT_VALID_AT_ACCEPTANCE: 'signer was not valid at acceptance time',
  SIGNATURE_ALGORITHM_UNSUPPORTED: 'unsupported signature algorithm',
  SIGNATURE_MISMATCH: 'acceptance signature mismatch',
  CANDIDATE_COMMIT_NOT_FOUND: 'signed commit does not exist in this repository',
  CANDIDATE_TREE_MISMATCH: 'signed tree does not match signed commit',
  SOURCE_BASELINE_ANCESTRY_MISMATCH: 'signed candidate does not descend from the declared source baseline',
  INTEGRATION_ANCESTRY_MISMATCH: 'accepted packet is not integrated into the exact gate HEAD',
  EVIDENCE_LOG_DIGEST_MISMATCH: 'evidence log digest mismatch',
  EVIDENCE_ENVIRONMENT_DIGEST_MISMATCH: 'environment evidence digest mismatch',
  RECEIPT_OR_EVIDENCE_MISSING: 'receipt or evidence artifact missing',
  RECEIPT_MALFORMED: 'receipt is malformed',
  RECEIPT_VALIDATION_UNAVAILABLE: 'receipt validation is unavailable',
});

function receiptFailure(packet, reasonCode) {
  return { ok: false, packet, reason_code: reasonCode, reason: receiptFailureReasons[reasonCode] };
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, expected, label) {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  const actual = Object.keys(value).toSorted();
  const wanted = expected.toSorted();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} has unsupported or missing fields`);
  }
}

function packetList(value, label, { allowEmpty = true } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0))
    throw new Error(`${label} must be ${allowEmpty ? 'an' : 'a non-empty'} array`);
  const seen = new Set();
  for (const packet of value) {
    if (typeof packet !== 'string' || !safePacket.test(packet))
      throw new Error(`${label} contains an unsafe packet identifier`);
    if (seen.has(packet)) throw new Error(`${label} contains a duplicate packet`);
    seen.add(packet);
  }
  return value;
}

function packetGroups(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((group, index) => packetList(group, `${label}[${index}]`, { allowEmpty: false }));
}

function validateSelection(value, label, { allowAny }) {
  exactKeys(value, allowAny ? ['all', 'any', 'one'] : ['all', 'one'], label);
  const all = packetList(value.all, `${label}.all`);
  const any = allowAny ? packetGroups(value.any, `${label}.any`) : [];
  const one = packetGroups(value.one, `${label}.one`);
  const seen = new Set(all);
  for (const packet of any.flat()) {
    if (seen.has(packet)) throw new Error(`${label} contains ambiguous duplicate packet ${packet}`);
    seen.add(packet);
  }
  for (const packet of one.flat()) {
    if (seen.has(packet)) throw new Error(`${label} contains ambiguous duplicate packet ${packet}`);
  }
  return { all, any, one };
}

function validateGateSchema(gateId, gate, contracts) {
  if (!isRecord(gate) || (gate.mode !== 'entry' && gate.mode !== 'acceptance')) {
    throw new Error(`Gate ${gateId} has missing or unsupported mode`);
  }
  exactKeys(
    gate,
    gate.mode === 'entry' ? ['mode', 'prerequisites'] : ['mode', 'prerequisites', 'accepts'],
    `Gate ${gateId}`
  );
  const prerequisites = validateSelection(gate.prerequisites, `Gate ${gateId}.prerequisites`, { allowAny: true });
  const accepts =
    gate.mode === 'acceptance' ? validateSelection(gate.accepts, `Gate ${gateId}.accepts`, { allowAny: false }) : null;
  if (accepts && accepts.all.length === 0 && accepts.one.length === 0) {
    throw new Error(`Acceptance gate ${gateId} has no target`);
  }
  const prerequisitePackets = new Set([...prerequisites.all, ...prerequisites.any.flat(), ...prerequisites.one.flat()]);
  const targetPackets = accepts ? [...accepts.all, ...accepts.one.flat()] : [];
  const targetSeen = new Set();
  for (const packet of targetPackets) {
    if (targetSeen.has(packet)) throw new Error(`Gate ${gateId} contains duplicate target ${packet}`);
    targetSeen.add(packet);
    if (prerequisitePackets.has(packet))
      throw new Error(`Gate ${gateId} uses ${packet} as both prerequisite and target`);
  }
  for (const packet of [...prerequisitePackets, ...targetSeen]) {
    if (!contracts.packets[packet]) throw new Error(`Gate ${gateId} references unsealed packet ${packet}`);
  }
  return { mode: gate.mode, prerequisites, accepts };
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .toSorted()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function contractDigest(contract) {
  return `sha256:${createHash('sha256').update(canonicalJson(contract)).digest('hex')}`;
}

function git(projectRoot, args) {
  return spawnSync('git', ['-C', projectRoot, ...args], { encoding: 'utf8' });
}

async function artifactDigest(path) {
  const bytes = await readFile(path);
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

export async function checkGate({
  gateId,
  projectRoot,
  receiptDirectory,
  manifestPath,
  contractsPath,
  trustRootPath,
  authorizedCandidates,
  expectedIntegrationHead,
}) {
  const [manifest, contracts, trustRoot] = await Promise.all([
    readFile(manifestPath, 'utf8').then(JSON.parse),
    readFile(contractsPath, 'utf8').then(JSON.parse),
    readFile(trustRootPath, 'utf8').then(JSON.parse),
  ]);

  if (!gateId || !manifest.gates?.[gateId]) throw new Error(`Unknown or missing gate: ${gateId ?? '<none>'}`);
  if (manifest.schema_version !== 2 || contracts.schema_version !== 1 || trustRoot.schema_version !== 1) {
    throw new Error('Unsupported gate, contract, or trust-root schema');
  }
  if (!isRecord(manifest.gates) || !isRecord(contracts.packets)) throw new Error('Invalid gate or contract manifest');
  const validatedGates = new Map();
  for (const [id, gate] of Object.entries(manifest.gates)) {
    validatedGates.set(id, validateGateSchema(id, gate, contracts));
  }
  if (!oid.test(expectedIntegrationHead ?? '')) throw new Error('Missing or invalid expected integration HEAD');
  if (!authorizedCandidates || typeof authorizedCandidates !== 'object')
    throw new Error('Missing external accepted-packet registry');
  const observedHead = git(projectRoot, ['rev-parse', 'HEAD']);
  if (observedHead.status !== 0 || observedHead.stdout.trim() !== expectedIntegrationHead) {
    throw new Error('Integration HEAD does not match the gate CAS');
  }

  const trustedKeys = new Map();
  for (const key of trustRoot.keys) {
    if (!key.key_id || trustedKeys.has(key.key_id)) throw new Error('Missing or duplicate acceptance key ID');
    trustedKeys.set(key.key_id, key);
  }

  async function validateReceipt(packet) {
    if (!safePacket.test(packet)) return receiptFailure(packet, 'UNSAFE_PACKET_IDENTIFIER');
    const contract = contracts.packets[packet];
    if (!contract) return receiptFailure(packet, 'PACKET_CONTRACT_UNSEALED');
    const authorization = authorizedCandidates[packet];
    if (!authorization) return receiptFailure(packet, 'PACKET_CANDIDATE_UNAUTHORIZED');

    try {
      const receipt = JSON.parse(await readFile(resolve(receiptDirectory, `${packet}.json`), 'utf8'));
      if (receipt.schema_version !== 2) return receiptFailure(packet, 'RECEIPT_SCHEMA_UNSUPPORTED');
      if (!receipt.signed || !receipt.signature) return receiptFailure(packet, 'RECEIPT_UNSIGNED');

      const signed = receipt.signed;
      if (signed.packet !== packet) return receiptFailure(packet, 'PACKET_IDENTITY_MISMATCH');
      if (signed.status !== 'accepted') return receiptFailure(packet, 'RECEIPT_NOT_ACCEPTED');
      if (signed.source_baseline !== manifest.source_baseline)
        return receiptFailure(packet, 'SOURCE_BASELINE_MISMATCH');
      if (signed.gate_manifest_revision !== manifest.revision)
        return receiptFailure(packet, 'GATE_MANIFEST_REVISION_MISMATCH');
      if (signed.gate_manifest_digest !== contractDigest(manifest))
        return receiptFailure(packet, 'GATE_MANIFEST_DIGEST_MISMATCH');
      if (signed.gate_authorizations?.[gateId] !== contractDigest(manifest.gates[gateId])) {
        return receiptFailure(packet, 'GATE_AUTHORIZATION_MISMATCH');
      }
      if (signed.packet_contract_digest !== contractDigest(contract))
        return receiptFailure(packet, 'PACKET_CONTRACT_DIGEST_MISMATCH');
      if (!oid.test(signed.candidate?.commit ?? '')) return receiptFailure(packet, 'CANDIDATE_COMMIT_INVALID');
      if (!oid.test(signed.candidate?.tree ?? '')) return receiptFailure(packet, 'CANDIDATE_TREE_INVALID');
      if (!oid.test(signed.candidate?.integration_head ?? ''))
        return receiptFailure(packet, 'INTEGRATION_HEAD_INVALID');
      if (
        signed.candidate.commit !== authorization.commit ||
        signed.candidate.tree !== authorization.tree ||
        signed.candidate.integration_head !== authorization.integration_head
      ) {
        return receiptFailure(packet, 'EXTERNAL_AUTHORIZATION_MISMATCH');
      }
      if (signed.candidate.commit !== signed.candidate.integration_head) {
        return receiptFailure(packet, 'LANDED_COMMIT_MISMATCH');
      }
      if (!digest.test(signed.evidence?.log_digest ?? '')) return receiptFailure(packet, 'EVIDENCE_LOG_DIGEST_INVALID');
      if (!digest.test(signed.evidence?.environment_digest ?? ''))
        return receiptFailure(packet, 'EVIDENCE_ENVIRONMENT_DIGEST_INVALID');
      if (!Number.isFinite(Date.parse(signed.accepted_at ?? '')))
        return receiptFailure(packet, 'ACCEPTANCE_TIMESTAMP_INVALID');

      const key = trustedKeys.get(receipt.signature.key_id);
      if (!key || key.issuer !== signed.issuer) return receiptFailure(packet, 'ACCEPTANCE_SIGNER_UNKNOWN');
      if (key.revoked_at) return receiptFailure(packet, 'ACCEPTANCE_SIGNER_REVOKED');
      const acceptedAt = Date.parse(signed.accepted_at);
      const validFrom = Date.parse(key.valid_from);
      const validUntil = Date.parse(key.valid_until);
      if (!Number.isFinite(validFrom) || !Number.isFinite(validUntil) || validFrom > validUntil) {
        return receiptFailure(packet, 'SIGNER_VALIDITY_WINDOW_INVALID');
      }
      if (acceptedAt < validFrom || acceptedAt > validUntil) {
        return receiptFailure(packet, 'SIGNER_NOT_VALID_AT_ACCEPTANCE');
      }
      if (receipt.signature.algorithm !== 'ed25519') return receiptFailure(packet, 'SIGNATURE_ALGORITHM_UNSUPPORTED');
      const signatureOk = verify(
        null,
        Buffer.from(canonicalJson(signed)),
        createPublicKey(key.public_key_pem),
        Buffer.from(receipt.signature.value, 'base64')
      );
      if (!signatureOk) return receiptFailure(packet, 'SIGNATURE_MISMATCH');

      const commitCheck = git(projectRoot, ['cat-file', '-e', `${signed.candidate.commit}^{commit}`]);
      if (commitCheck.status !== 0) return receiptFailure(packet, 'CANDIDATE_COMMIT_NOT_FOUND');
      const actualTree = git(projectRoot, ['rev-parse', `${signed.candidate.commit}^{tree}`]);
      if (actualTree.status !== 0 || actualTree.stdout.trim() !== signed.candidate.tree) {
        return receiptFailure(packet, 'CANDIDATE_TREE_MISMATCH');
      }
      const ancestry = git(projectRoot, [
        'merge-base',
        '--is-ancestor',
        manifest.source_baseline,
        signed.candidate.commit,
      ]);
      if (ancestry.status !== 0) return receiptFailure(packet, 'SOURCE_BASELINE_ANCESTRY_MISMATCH');
      const integrated = git(projectRoot, [
        'merge-base',
        '--is-ancestor',
        signed.candidate.integration_head,
        expectedIntegrationHead,
      ]);
      if (integrated.status !== 0) return receiptFailure(packet, 'INTEGRATION_ANCESTRY_MISMATCH');

      const actualLog = await artifactDigest(resolve(receiptDirectory, `${packet}.log`));
      const actualEnvironment = await artifactDigest(resolve(receiptDirectory, `${packet}.env.json`));
      if (actualLog !== signed.evidence.log_digest) return receiptFailure(packet, 'EVIDENCE_LOG_DIGEST_MISMATCH');
      if (actualEnvironment !== signed.evidence.environment_digest)
        return receiptFailure(packet, 'EVIDENCE_ENVIRONMENT_DIGEST_MISMATCH');

      return { ok: true, packet, commit: signed.candidate.commit, tree: signed.candidate.tree, issuer: signed.issuer };
    } catch (error) {
      if (error?.code === 'ENOENT') return receiptFailure(packet, 'RECEIPT_OR_EVIDENCE_MISSING');
      if (error instanceof SyntaxError) return receiptFailure(packet, 'RECEIPT_MALFORMED');
      return receiptFailure(packet, 'RECEIPT_VALIDATION_UNAVAILABLE');
    }
  }

  async function evaluateSelection(selection) {
    const required = await Promise.all(selection.all.map(validateReceipt));
    const alternatives = await Promise.all(
      selection.any.map(async (group) => {
        const results = await Promise.all(group.map(validateReceipt));
        return { ok: results.some((result) => result.ok), results };
      })
    );
    const exclusiveAlternatives = await Promise.all(
      selection.one.map(async (group) => {
        const results = await Promise.all(group.map(validateReceipt));
        const acceptedCount = results.filter((result) => result.ok).length;
        return { ok: acceptedCount === 1, accepted_count: acceptedCount, results };
      })
    );
    return {
      ok:
        required.every((result) => result.ok) &&
        alternatives.every((group) => group.ok) &&
        exclusiveAlternatives.every((group) => group.ok),
      required,
      alternatives,
      exclusive_alternatives: exclusiveAlternatives,
    };
  }

  const gate = validatedGates.get(gateId);
  const prerequisites = await evaluateSelection(gate.prerequisites);
  const acceptedTargets = gate.mode === 'acceptance' ? await evaluateSelection(gate.accepts) : [];
  const targetsOk = gate.mode === 'entry' || acceptedTargets.ok;

  return {
    gate: gateId,
    mode: gate.mode,
    ok: prerequisites.ok && targetsOk,
    source_baseline: manifest.source_baseline,
    gate_manifest_revision: manifest.revision,
    prerequisites,
    accepted_targets: acceptedTargets,
  };
}
