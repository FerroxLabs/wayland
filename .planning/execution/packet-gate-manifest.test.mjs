import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const here = new URL('.', import.meta.url)
const gates = JSON.parse(await readFile(new URL('PACKET-GATES.json', here), 'utf8'))
const contracts = JSON.parse(await readFile(new URL('PACKET-CONTRACTS.json', here), 'utf8'))

function exact(gate, all, any = [], one = []) {
  assert.deepEqual(gates.gates[gate], one.length > 0 ? { all, any, one } : { all, any }, `${gate} drifted from the sealed master dependency contract`)
}

function opens(gateId, receipts) {
  const gate = gates.gates[gateId]
  return gate.all.every((packet) => receipts.has(packet)) && (gate.any ?? []).every((group) => group.some((packet) => receipts.has(packet))) && (gate.one ?? []).every((group) => group.filter((packet) => receipts.has(packet)).length === 1)
}

for (const [gateId, gate] of Object.entries(gates.gates)) {
  for (const packet of [...gate.all, ...(gate.any ?? []).flat(), ...(gate.one ?? []).flat()]) {
    assert.ok(contracts.packets[packet], `${gateId} references unsealed packet ${packet}`)
  }
}

exact('P1-M1', ['M0A'])
exact('P1-M1F', ['M0A', 'FLUX-PRODUCER-ACCEPTANCE'])
exact('P2-M2-BASE', ['M0A', 'M1'], [['M1F', 'NO-FLUX-DEGRADED']])
exact('P2-M3', ['M0A'])
exact('P3-M4', ['M3'])
exact('P3-M5', ['M2', 'M3', 'M4'])
exact('P3-IMG', ['M2', 'M5'])
exact('P4-M6', ['M1', 'M2', 'M5', 'RECEIPT-CONTRACT'])
exact('P4-M7', ['M4', 'M5', 'M6'])
exact('P5-M8-CONSTRUCTION', ['M0A', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'])
exact('P5-M8-ACCEPTANCE', ['M0A', 'M0B', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'], [], [['M1F', 'NO-FLUX-CLAIMS'], ['MCP-4', 'MCP-ABSENT'], ['SBX-2', 'SBX-ABSENT'], ['IMG-01', 'IMAGE-ABSENT'], ['M5V-A', 'VOICE-ABSENT'], ['C0-B', 'COWORK-ABSENT'], ['C1', 'COWORK-ABSENT']])
exact('P6-M9', ['PHASE1-AGGREGATE-ACCEPTANCE', 'M0A', 'M0B', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'], [], [['M1F', 'NO-FLUX-CLAIMS'], ['MCP-4', 'MCP-ABSENT'], ['SBX-2', 'SBX-ABSENT'], ['IMG-01', 'IMAGE-ABSENT'], ['M5V-B', 'VOICE-ABSENT'], ['C1', 'COWORK-ABSENT'], ['FINAL-C0-RELEASE-CLOSURE', 'COWORK-ABSENT']])
exact('P7-P1', ['M0A', 'M7', 'M9'])
exact('P1-AGGREGATE-ACCEPTANCE', ['M0A', 'M0B', 'M1', 'M1M-0', 'M1S-0', 'C0-A', 'PHASE5-PROOF-CLOSURE'], [], [['M1F', 'NO-FLUX-CLAIMS']])

const aggregateBase = new Set(['M0A', 'M0B', 'M1', 'M1M-0', 'M1S-0', 'C0-A', 'PHASE5-PROOF-CLOSURE'])
assert.equal(opens('P1-AGGREGATE-ACCEPTANCE', new Set([...aggregateBase, 'M1F'])), true, 'Flux-enabled Phase 1 path must remain reachable')
assert.equal(opens('P1-AGGREGATE-ACCEPTANCE', new Set([...aggregateBase, 'NO-FLUX-CLAIMS'])), true, 'physical no-Flux Phase 1 path must remain reachable')
assert.equal(opens('P1-AGGREGATE-ACCEPTANCE', new Set([...aggregateBase, 'M1F', 'NO-FLUX-CLAIMS'])), false, 'contradictory Flux receipts must fail closed')

const previewBase = new Set(['PHASE1-AGGREGATE-ACCEPTANCE', 'M0A', 'M0B', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'MCP-ABSENT', 'SBX-ABSENT', 'IMAGE-ABSENT', 'VOICE-ABSENT'])
const coworkPresent = new Set([...previewBase, 'M1F', 'C1', 'FINAL-C0-RELEASE-CLOSURE'])
const coworkAbsent = new Set([...previewBase, 'NO-FLUX-CLAIMS', 'COWORK-ABSENT'])
assert.equal(opens('P6-M9', coworkPresent), true, 'Cowork-present preview path must remain reachable')
assert.equal(opens('P6-M9', coworkAbsent), true, 'physically absent Cowork preview path must remain reachable')
assert.equal(opens('P6-M9', new Set([...coworkPresent, 'COWORK-ABSENT'])), false, 'contradictory Cowork present/absent receipts must fail closed')
assert.equal(opens('P6-M9', new Set([...previewBase, 'M1F', 'C1'])), false, 'partial Cowork path without final release closure must stay closed')
assert.equal(opens('P6-M9', new Set([...previewBase, 'M1F', 'FINAL-C0-RELEASE-CLOSURE'])), false, 'partial Cowork path without C1 must stay closed')

const releaseBase = new Set(['M0A', 'M0B', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'MCP-ABSENT', 'SBX-ABSENT', 'IMAGE-ABSENT', 'VOICE-ABSENT'])
assert.equal(opens('P5-M8-ACCEPTANCE', new Set([...releaseBase, 'M1F', 'C0-B', 'C1'])), true, 'Cowork-present release path must remain reachable')
assert.equal(opens('P5-M8-ACCEPTANCE', new Set([...releaseBase, 'NO-FLUX-CLAIMS', 'COWORK-ABSENT'])), true, 'physically absent Cowork release path must remain reachable')
assert.equal(opens('P5-M8-ACCEPTANCE', new Set([...releaseBase, 'M1F', 'C0-B'])), false, 'partial Cowork release path without C1 must stay closed')

assert.match(contracts.packets.M8.terminal_claim, /J17 and J23/)
assert.ok(contracts.packets['M5V-B'])
assert.ok(contracts.packets['FINAL-C0-RELEASE-CLOSURE'])
assert.ok(contracts.packets['PHASE1-AGGREGATE-ACCEPTANCE'])
assert.match(contracts.packets['COWORK-ABSENT'].terminal_claim, /physically absent/)

console.log('packet gate manifest tests: PASS')
