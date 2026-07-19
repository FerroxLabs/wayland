import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkGate } from './packet-gate-lib.mjs';

const here = new URL('.', import.meta.url);
const gates = JSON.parse(await readFile(new URL('PACKET-GATES.json', here), 'utf8'));
const contracts = JSON.parse(await readFile(new URL('PACKET-CONTRACTS.json', here), 'utf8'));

const acceptanceGateIds = [
  'P1-M0B-COHORT',
  'P1-M0B-INSTRUMENTATION',
  'P1-M0B-DAY0',
  'P1-M0B-OBSERVATION',
  'P1-M0B',
  'P1-M0A',
  'P1-FLUX-PRODUCER',
  'P1-M1',
  'P1-M1F',
  'P1-M1M0',
  'P1-M1S0',
  'P1-C0A',
  'P1-AGGREGATE-ACCEPTANCE',
  'P5-M8-ACCEPTANCE',
];
const entryGateIds = [
  'P2-M2-BASE',
  'P2-M2-MCP',
  'P2-M3',
  'P2-C0B',
  'P3-M4',
  'P3-M5',
  'P3-MCP12',
  'P3-SBX1',
  'P3-IMG',
  'P4-M6',
  'P4-M7',
  'P4-MCP3',
  'P4-M5VA',
  'P4-C1',
  'P5-M8-CONSTRUCTION',
  'P6-M9',
  'P7-P1',
];

assert.equal(gates.schema_version, 2);
assert.deepEqual(
  Object.keys(gates.gates).toSorted(),
  [...acceptanceGateIds, ...entryGateIds].toSorted(),
  'every current gate must be explicitly enumerated'
);

function selectionPackets(selection) {
  return [...selection.all, ...(selection.any ?? []).flat(), ...(selection.one ?? []).flat()];
}

function selectionOpens(selection, receipts) {
  return (
    selection.all.every((packet) => receipts.has(packet)) &&
    (selection.any ?? []).every((group) => group.some((packet) => receipts.has(packet))) &&
    (selection.one ?? []).every((group) => group.filter((packet) => receipts.has(packet)).length === 1)
  );
}

for (const gateId of entryGateIds) {
  const gate = gates.gates[gateId];
  assert.equal(gate.mode, 'entry', `${gateId} must remain non-promoting`);
  assert.deepEqual(Object.keys(gate).toSorted(), ['mode', 'prerequisites']);
  assert.deepEqual(Object.keys(gate.prerequisites).toSorted(), ['all', 'any', 'one']);
}

for (const gateId of acceptanceGateIds) {
  const gate = gates.gates[gateId];
  assert.equal(gate.mode, 'acceptance', `${gateId} must authenticate a target`);
  assert.deepEqual(Object.keys(gate).toSorted(), ['accepts', 'mode', 'prerequisites']);
  assert.deepEqual(Object.keys(gate.prerequisites).toSorted(), ['all', 'any', 'one']);
  assert.deepEqual(Object.keys(gate.accepts).toSorted(), ['all', 'one']);
  assert.ok(gate.accepts.all.length > 0 || gate.accepts.one.length > 0, `${gateId} cannot have an empty target`);
}

for (const [gateId, gate] of Object.entries(gates.gates)) {
  const references = [
    ...selectionPackets(gate.prerequisites),
    ...(gate.accepts ? selectionPackets({ ...gate.accepts, any: [] }) : []),
  ];
  for (const packet of references)
    assert.ok(contracts.packets[packet], `${gateId} references unsealed packet ${packet}`);
}

const expectedAcceptance = {
  'P1-M0B-COHORT': [['M0B-COHORT-AUTHORITY'], []],
  'P1-M0B-INSTRUMENTATION': [['M0B-INSTRUMENTATION'], []],
  'P1-M0B-DAY0': [['M0B-DAY0'], []],
  'P1-M0B-OBSERVATION': [['M0B-OBSERVATION-COMPLETE'], []],
  'P1-M0B': [['M0B'], []],
  'P1-M0A': [['M0A'], []],
  'P1-FLUX-PRODUCER': [['FLUX-PRODUCER-ACCEPTANCE'], []],
  'P1-M1': [['M1'], []],
  'P1-M1F': [[], [['M1F', 'NO-FLUX-CLAIMS']]],
  'P1-M1M0': [['M1M-0'], []],
  'P1-M1S0': [['M1S-0'], []],
  'P1-C0A': [['C0-A'], []],
  'P1-AGGREGATE-ACCEPTANCE': [['PHASE1-AGGREGATE-ACCEPTANCE'], []],
  'P5-M8-ACCEPTANCE': [['M8'], []],
};
for (const [gateId, [all, one]] of Object.entries(expectedAcceptance)) {
  assert.deepEqual(gates.gates[gateId].accepts, { all, one }, `${gateId} target drifted`);
}

assert.deepEqual(gates.gates['P1-M1'].prerequisites.all, ['M0A']);
assert.deepEqual(gates.gates['P1-M1F'].prerequisites.all, ['M0A', 'FLUX-PRODUCER-ACCEPTANCE']);
assert.deepEqual(gates.gates['P2-M2-BASE'].prerequisites.any, [['M1F', 'NO-FLUX-DEGRADED']]);
assert.deepEqual(gates.gates['P5-M8-ACCEPTANCE'].prerequisites.one, [
  ['M1F', 'NO-FLUX-CLAIMS'],
  ['MCP-4', 'MCP-ABSENT'],
  ['SBX-2', 'SBX-ABSENT'],
  ['IMG-01', 'IMAGE-ABSENT'],
  ['M5V-A', 'VOICE-ABSENT'],
  ['C0-B', 'COWORK-ABSENT'],
  ['C1', 'COWORK-ABSENT'],
]);
assert.deepEqual(gates.gates['P6-M9'].prerequisites.one, [
  ['M1F', 'NO-FLUX-CLAIMS'],
  ['MCP-4', 'MCP-ABSENT'],
  ['SBX-2', 'SBX-ABSENT'],
  ['IMG-01', 'IMAGE-ABSENT'],
  ['M5V-B', 'VOICE-ABSENT'],
  ['C1', 'COWORK-ABSENT'],
  ['FINAL-C0-RELEASE-CLOSURE', 'COWORK-ABSENT'],
]);

const aggregate = gates.gates['P1-AGGREGATE-ACCEPTANCE'];
const aggregateBase = new Set(['M0A', 'M0B', 'M1', 'M1M-0', 'M1S-0', 'C0-A', 'PHASE5-PROOF-CLOSURE']);
assert.equal(selectionOpens(aggregate.prerequisites, new Set([...aggregateBase, 'M1F'])), true);
assert.equal(selectionOpens(aggregate.prerequisites, new Set([...aggregateBase, 'NO-FLUX-CLAIMS'])), true);
assert.equal(selectionOpens(aggregate.prerequisites, new Set([...aggregateBase, 'M1F', 'NO-FLUX-CLAIMS'])), false);

const release = gates.gates['P5-M8-ACCEPTANCE'];
const releaseBase = new Set([
  'M0A',
  'M0B',
  'M1',
  'M2',
  'M3',
  'M4',
  'M5',
  'M6',
  'M7',
  'MCP-ABSENT',
  'SBX-ABSENT',
  'IMAGE-ABSENT',
  'VOICE-ABSENT',
]);
assert.equal(selectionOpens(release.prerequisites, new Set([...releaseBase, 'M1F', 'C0-B', 'C1'])), true);
assert.equal(selectionOpens(release.prerequisites, new Set([...releaseBase, 'NO-FLUX-CLAIMS', 'COWORK-ABSENT'])), true);
assert.equal(selectionOpens(release.prerequisites, new Set([...releaseBase, 'M1F', 'C0-B'])), false);

assert.ok(contracts.packets['M0B-OBSERVATION-COMPLETE']);
assert.match(contracts.packets['M0B-OBSERVATION-COMPLETE'].terminal_claim, /elapsed completely/);
assert.match(contracts.packets.M8.terminal_claim, /J17 and J23/);
assert.match(contracts.packets['COWORK-ABSENT'].terminal_claim, /physically absent/);

const projectRoot = new URL('../..', import.meta.url).pathname;
const productionProof = await mkdtemp(join(tmpdir(), 'wayland-production-gate-manifest-'));
const trustRootPath = join(productionProof, 'trust.json');
const expectedIntegrationHead = spawnSync('git', ['-C', projectRoot, 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).stdout.trim();
await writeFile(trustRootPath, '{"schema_version":1,"keys":[]}\n');
try {
  const productionResults = await Promise.all(
    ['P5-M8-ACCEPTANCE', 'P6-M9'].map(async (gateId) => ({
      gateId,
      result: await checkGate({
        gateId,
        projectRoot,
        receiptDirectory: join(productionProof, 'absent-receipts'),
        manifestPath: new URL('PACKET-GATES.json', here),
        contractsPath: new URL('PACKET-CONTRACTS.json', here),
        trustRootPath,
        authorizedCandidates: {},
        expectedIntegrationHead,
      }),
    }))
  );
  for (const { gateId, result } of productionResults) {
    assert.equal(result.schema_version, 2, `${gateId} must emit the schema-v2 output contract`);
    assert.equal(result.gate_id, gateId, `${gateId} must pass real production schema validation`);
    assert.equal(result.ok, false, `${gateId} must remain red without external candidate authorization`);
  }
} finally {
  await rm(productionProof, { recursive: true, force: true });
}

console.log('packet gate manifest tests: PASS');
