import assert from 'node:assert/strict'
import { createHash, generateKeyPairSync, sign } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { canonicalJson, checkGate, contractDigest } from './packet-gate-lib.mjs'

const projectRoot = new URL('../..', import.meta.url).pathname
const directory = await mkdtemp(join(tmpdir(), 'wayland-gate-'))
const receiptDirectory = join(directory, 'receipts')
const manifestPath = join(directory, 'gates.json')
const contractsPath = join(directory, 'contracts.json')
const trustRootPath = join(directory, 'keys.json')
await import('node:fs/promises').then(({ mkdir }) => mkdir(receiptDirectory))

const head = spawnSync('git', ['-C', projectRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()
const tree = spawnSync('git', ['-C', projectRoot, 'rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).stdout.trim()
const { publicKey, privateKey } = generateKeyPairSync('ed25519')
const attacker = generateKeyPairSync('ed25519')
const publicPem = publicKey.export({ type: 'spki', format: 'pem' })
const contract = { requirements: ['TEST-01'], terminal_claim: 'A real acceptance contract.' }
const manifest = {
  schema_version: 1,
  source_baseline: head,
  revision: 'test-revision-1',
  gates: {
    OPEN: { all: [], any: [] },
    REQUIRED: { all: ['TEST'], any: [] },
    ALTERNATIVE: { all: [], any: [['TEST', 'OTHER']] },
  },
}
const contracts = { schema_version: 1, packets: { TEST: contract, OTHER: contract } }
const activeKey = { key_id: 'acceptance-1', issuer: 'test-acceptor', public_key_pem: publicPem, valid_from: '2026-01-01T00:00:00.000Z', valid_until: '2027-01-01T00:00:00.000Z' }

await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`)
await writeFile(contractsPath, `${JSON.stringify(contracts)}\n`)
await writeFile(trustRootPath, `${JSON.stringify({ schema_version: 1, keys: [activeKey] })}\n`)

function sha(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`
}

async function writeReceipt(packet, options = {}) {
  const log = Buffer.from('proof log\n')
  const environment = Buffer.from('{"node":"test"}\n')
  await writeFile(join(receiptDirectory, `${packet}.log`), log)
  await writeFile(join(receiptDirectory, `${packet}.env.json`), environment)
  const signed = {
    packet,
    status: 'accepted',
    source_baseline: manifest.source_baseline,
    gate_manifest_revision: manifest.revision,
    gate_manifest_digest: contractDigest(manifest),
    gate_authorizations: {
      REQUIRED: contractDigest(manifest.gates.REQUIRED),
      ALTERNATIVE: contractDigest(manifest.gates.ALTERNATIVE),
    },
    packet_contract_digest: contractDigest(contract),
    candidate: { commit: head, tree },
    evidence: { log_digest: sha(log), environment_digest: sha(environment) },
    issuer: 'test-acceptor',
    accepted_at: '2026-07-19T00:00:00.000Z',
    ...options.signed,
  }
  const signingKey = options.signingKey ?? privateKey
  const signature = sign(null, Buffer.from(canonicalJson(signed)), signingKey).toString('base64')
  const receipt = { schema_version: 2, signed, signature: { algorithm: 'ed25519', key_id: options.keyId ?? 'acceptance-1', value: signature } }
  await writeFile(join(receiptDirectory, `${packet}.json`), `${JSON.stringify(receipt)}\n`)
  return receipt
}

async function run(gate) {
  return checkGate({ gateId: gate, projectRoot, receiptDirectory, manifestPath, contractsPath, trustRootPath })
}

try {
  assert.equal((await run('OPEN')).ok, true, 'dependency-free construction gate should pass')
  assert.equal((await run('REQUIRED')).ok, false, 'missing receipt must fail closed')

  await writeReceipt('TEST')
  assert.equal((await run('REQUIRED')).ok, true, 'trusted signed exact receipt should open gate')
  assert.equal((await run('ALTERNATIVE')).ok, true, 'one trusted alternative should open gate')

  await writeReceipt('TEST', { signingKey: attacker.privateKey })
  assert.equal((await run('REQUIRED')).ok, false, 'recomputed local forgery must fail')

  await writeReceipt('TEST', { signed: { candidate: { commit: 'a'.repeat(40), tree: 'b'.repeat(40) } } })
  assert.equal((await run('REQUIRED')).ok, false, 'arbitrary commit and tree must fail')

  await writeReceipt('TEST', { signed: { source_baseline: 'f'.repeat(40) } })
  assert.equal((await run('REQUIRED')).ok, false, 'wrong baseline must fail')

  await writeReceipt('TEST', { signed: { gate_manifest_revision: 'sibling-revision' } })
  assert.equal((await run('REQUIRED')).ok, false, 'wrong plan revision must fail')

  await writeReceipt('TEST', { signed: { gate_authorizations: { REQUIRED: `sha256:${'0'.repeat(64)}` } } })
  assert.equal((await run('REQUIRED')).ok, false, 'wrong prerequisite-set authorization must fail')

  await writeReceipt('TEST', { signed: { candidate: { commit: head, tree: 'b'.repeat(tree.length) } } })
  assert.equal((await run('REQUIRED')).ok, false, 'wrong tree for an existing commit must fail')

  await writeReceipt('TEST', { keyId: 'unknown-key' })
  assert.equal((await run('REQUIRED')).ok, false, 'unknown signer must fail')

  await writeFile(trustRootPath, `${JSON.stringify({ schema_version: 1, keys: [{ ...activeKey, revoked_at: '2026-07-18T00:00:00.000Z' }] })}\n`)
  await writeReceipt('TEST')
  assert.equal((await run('REQUIRED')).ok, false, 'revoked signer must fail')
  await writeFile(trustRootPath, `${JSON.stringify({ schema_version: 1, keys: [activeKey] })}\n`)

  const receipt = await writeReceipt('TEST')
  receipt.signed.evidence.log_digest = `sha256:${'0'.repeat(64)}`
  await writeFile(join(receiptDirectory, 'TEST.json'), `${JSON.stringify(receipt)}\n`)
  assert.equal((await run('REQUIRED')).ok, false, 'modified signed evidence metadata must fail')

  const sibling = await writeReceipt('TEST')
  sibling.signed.candidate.commit = spawnSync('git', ['-C', projectRoot, 'rev-parse', 'HEAD^'], { encoding: 'utf8' }).stdout.trim()
  await writeFile(join(receiptDirectory, 'TEST.json'), `${JSON.stringify(sibling)}\n`)
  assert.equal((await run('REQUIRED')).ok, false, 'unsigned sibling-commit substitution must fail')

  await writeReceipt('TEST')
  await writeFile(join(receiptDirectory, 'TEST.log'), 'substituted log\n')
  assert.equal((await run('REQUIRED')).ok, false, 'substituted evidence bytes must fail')

  console.log('authenticated packet gate tests: PASS')
} finally {
  await rm(directory, { recursive: true, force: true })
}
