import { createHash, createPublicKey, verify } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const oid = /^[0-9a-f]{40}([0-9a-f]{24})?$/
const digest = /^sha256:[0-9a-f]{64}$/
const safePacket = /^[A-Z0-9][A-Z0-9-]*$/

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function contractDigest(contract) {
  return `sha256:${createHash('sha256').update(canonicalJson(contract)).digest('hex')}`
}

function git(projectRoot, args) {
  return spawnSync('git', ['-C', projectRoot, ...args], { encoding: 'utf8' })
}

async function artifactDigest(path) {
  const bytes = await readFile(path)
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`
}

export async function checkGate({ gateId, projectRoot, receiptDirectory, manifestPath, contractsPath, trustRootPath, authorizedCandidates, expectedIntegrationHead }) {
  const [manifest, contracts, trustRoot] = await Promise.all([
    readFile(manifestPath, 'utf8').then(JSON.parse),
    readFile(contractsPath, 'utf8').then(JSON.parse),
    readFile(trustRootPath, 'utf8').then(JSON.parse),
  ])

  if (!gateId || !manifest.gates[gateId]) throw new Error(`Unknown or missing gate: ${gateId ?? '<none>'}`)
  if (manifest.schema_version !== 1 || contracts.schema_version !== 1 || trustRoot.schema_version !== 1) {
    throw new Error('Unsupported gate, contract, or trust-root schema')
  }
  if (!oid.test(expectedIntegrationHead ?? '')) throw new Error('Missing or invalid expected integration HEAD')
  if (!authorizedCandidates || typeof authorizedCandidates !== 'object') throw new Error('Missing external accepted-packet registry')
  const observedHead = git(projectRoot, ['rev-parse', 'HEAD'])
  if (observedHead.status !== 0 || observedHead.stdout.trim() !== expectedIntegrationHead) {
    throw new Error('Integration HEAD does not match the gate CAS')
  }

  const trustedKeys = new Map()
  for (const key of trustRoot.keys) {
    if (!key.key_id || trustedKeys.has(key.key_id)) throw new Error('Missing or duplicate acceptance key ID')
    trustedKeys.set(key.key_id, key)
  }

  async function validateReceipt(packet) {
    if (!safePacket.test(packet)) return { ok: false, packet, reason: 'unsafe packet identifier' }
    const contract = contracts.packets[packet]
    if (!contract) return { ok: false, packet, reason: 'packet contract is not sealed' }
    const authorization = authorizedCandidates[packet]
    if (!authorization) return { ok: false, packet, reason: 'packet candidate is not externally authorized' }

    try {
      const receipt = JSON.parse(await readFile(resolve(receiptDirectory, `${packet}.json`), 'utf8'))
      if (receipt.schema_version !== 2) return { ok: false, packet, reason: 'unsupported receipt schema' }
      if (!receipt.signed || !receipt.signature) return { ok: false, packet, reason: 'unsigned receipt' }

      const signed = receipt.signed
      if (signed.packet !== packet) return { ok: false, packet, reason: 'packet identity mismatch' }
      if (signed.status !== 'accepted') return { ok: false, packet, reason: 'receipt is not accepted' }
      if (signed.source_baseline !== manifest.source_baseline) return { ok: false, packet, reason: 'source baseline mismatch' }
      if (signed.gate_manifest_revision !== manifest.revision) return { ok: false, packet, reason: 'gate manifest revision mismatch' }
      if (signed.gate_manifest_digest !== contractDigest(manifest)) return { ok: false, packet, reason: 'gate manifest digest mismatch' }
      if (signed.gate_authorizations?.[gateId] !== contractDigest(manifest.gates[gateId])) {
        return { ok: false, packet, reason: 'receipt does not authorize this exact gate prerequisite set' }
      }
      if (signed.packet_contract_digest !== contractDigest(contract)) return { ok: false, packet, reason: 'packet contract digest mismatch' }
      if (!oid.test(signed.candidate?.commit ?? '')) return { ok: false, packet, reason: 'invalid exact commit' }
      if (!oid.test(signed.candidate?.tree ?? '')) return { ok: false, packet, reason: 'invalid exact tree' }
      if (!oid.test(signed.candidate?.integration_head ?? '')) return { ok: false, packet, reason: 'invalid accepted integration HEAD' }
      if (signed.candidate.commit !== authorization.commit || signed.candidate.tree !== authorization.tree || signed.candidate.integration_head !== authorization.integration_head) {
        return { ok: false, packet, reason: 'receipt candidate does not match external authorization' }
      }
      if (signed.candidate.commit !== signed.candidate.integration_head) {
        return { ok: false, packet, reason: 'packet was not accepted at its exact landed commit' }
      }
      if (!digest.test(signed.evidence?.log_digest ?? '')) return { ok: false, packet, reason: 'invalid log digest' }
      if (!digest.test(signed.evidence?.environment_digest ?? '')) return { ok: false, packet, reason: 'invalid environment digest' }
      if (!Number.isFinite(Date.parse(signed.accepted_at ?? ''))) return { ok: false, packet, reason: 'invalid acceptance timestamp' }

      const key = trustedKeys.get(receipt.signature.key_id)
      if (!key || key.issuer !== signed.issuer) return { ok: false, packet, reason: 'unknown acceptance signer' }
      if (key.revoked_at) return { ok: false, packet, reason: 'acceptance signer is revoked' }
      const acceptedAt = Date.parse(signed.accepted_at)
      const validFrom = Date.parse(key.valid_from)
      const validUntil = Date.parse(key.valid_until)
      if (!Number.isFinite(validFrom) || !Number.isFinite(validUntil) || validFrom > validUntil) {
        return { ok: false, packet, reason: 'signer validity window is malformed' }
      }
      if (acceptedAt < validFrom || acceptedAt > validUntil) {
        return { ok: false, packet, reason: 'signer was not valid at acceptance time' }
      }
      if (receipt.signature.algorithm !== 'ed25519') return { ok: false, packet, reason: 'unsupported signature algorithm' }
      const signatureOk = verify(null, Buffer.from(canonicalJson(signed)), createPublicKey(key.public_key_pem), Buffer.from(receipt.signature.value, 'base64'))
      if (!signatureOk) return { ok: false, packet, reason: 'acceptance signature mismatch' }

      const commitCheck = git(projectRoot, ['cat-file', '-e', `${signed.candidate.commit}^{commit}`])
      if (commitCheck.status !== 0) return { ok: false, packet, reason: 'signed commit does not exist in this repository' }
      const actualTree = git(projectRoot, ['rev-parse', `${signed.candidate.commit}^{tree}`])
      if (actualTree.status !== 0 || actualTree.stdout.trim() !== signed.candidate.tree) {
        return { ok: false, packet, reason: 'signed tree does not match signed commit' }
      }
      const ancestry = git(projectRoot, ['merge-base', '--is-ancestor', manifest.source_baseline, signed.candidate.commit])
      if (ancestry.status !== 0) return { ok: false, packet, reason: 'signed candidate does not descend from the declared source baseline' }
      const integrated = git(projectRoot, ['merge-base', '--is-ancestor', signed.candidate.integration_head, expectedIntegrationHead])
      if (integrated.status !== 0) return { ok: false, packet, reason: 'accepted packet is not integrated into the exact gate HEAD' }

      const actualLog = await artifactDigest(resolve(receiptDirectory, `${packet}.log`))
      const actualEnvironment = await artifactDigest(resolve(receiptDirectory, `${packet}.env.json`))
      if (actualLog !== signed.evidence.log_digest) return { ok: false, packet, reason: 'evidence log digest mismatch' }
      if (actualEnvironment !== signed.evidence.environment_digest) return { ok: false, packet, reason: 'environment evidence digest mismatch' }

      return { ok: true, packet, commit: signed.candidate.commit, tree: signed.candidate.tree, issuer: signed.issuer }
    } catch (error) {
      return { ok: false, packet, reason: error.code === 'ENOENT' ? 'receipt or evidence artifact missing' : error.message }
    }
  }

  const gate = manifest.gates[gateId]
  const required = await Promise.all(gate.all.map(validateReceipt))
  const alternatives = []
  for (const group of gate.any ?? []) {
    const results = await Promise.all(group.map(validateReceipt))
    alternatives.push({ ok: results.some((result) => result.ok), results })
  }
  const exclusiveAlternatives = []
  for (const group of gate.one ?? []) {
    const results = await Promise.all(group.map(validateReceipt))
    const acceptedCount = results.filter((result) => result.ok).length
    exclusiveAlternatives.push({ ok: acceptedCount === 1, accepted_count: acceptedCount, results })
  }

  return {
    gate: gateId,
    ok: required.every((result) => result.ok) && alternatives.every((group) => group.ok) && exclusiveAlternatives.every((group) => group.ok),
    source_baseline: manifest.source_baseline,
    gate_manifest_revision: manifest.revision,
    required,
    alternatives,
    exclusive_alternatives: exclusiveAlternatives,
  }
}
