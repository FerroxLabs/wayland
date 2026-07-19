import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const here = new URL('.', import.meta.url)
const gates = JSON.parse(await readFile(new URL('PACKET-GATES.json', here), 'utf8'))
const contracts = JSON.parse(await readFile(new URL('PACKET-CONTRACTS.json', here), 'utf8'))

function exact(gate, all, any = []) {
  assert.deepEqual(gates.gates[gate], { all, any }, `${gate} drifted from the sealed master dependency contract`)
}

for (const [gateId, gate] of Object.entries(gates.gates)) {
  for (const packet of [...gate.all, ...gate.any.flat()]) {
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
exact('P5-M8-ACCEPTANCE', ['M0A', 'M0B', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'C0-B', 'C1'], [['M1F', 'NO-FLUX-CLAIMS'], ['MCP-4', 'MCP-ABSENT'], ['SBX-2', 'SBX-ABSENT'], ['IMG-01', 'IMAGE-ABSENT'], ['M5V-A', 'VOICE-ABSENT']])
exact('P6-M9', ['PHASE1-AGGREGATE-ACCEPTANCE', 'M0A', 'M0B', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'C1', 'M8', 'FINAL-C0-RELEASE-CLOSURE'], [['M1F', 'NO-FLUX-CLAIMS'], ['MCP-4', 'MCP-ABSENT'], ['SBX-2', 'SBX-ABSENT'], ['IMG-01', 'IMAGE-ABSENT'], ['M5V-B', 'VOICE-ABSENT']])
exact('P7-P1', ['M0A', 'M7', 'M9'])

assert.match(contracts.packets.M8.terminal_claim, /J17 and J23/)
assert.ok(contracts.packets['M5V-B'])
assert.ok(contracts.packets['FINAL-C0-RELEASE-CLOSURE'])
assert.ok(contracts.packets['PHASE1-AGGREGATE-ACCEPTANCE'])

console.log('packet gate manifest tests: PASS')
