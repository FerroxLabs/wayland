'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CONTRACT = 'wayland-release-hardening-matrix/1.0';
const MATRIX_FILE = path.resolve(__dirname, 'hardening-matrix.json');
const COMMIT = /^[a-f0-9]{40,64}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const INVARIANTS = Array.from({ length: 21 }, (_, index) => `INV-${String(index + 1).padStart(2, '0')}`);
const CRITERIA = [
  'SC-01',
  'SC-02',
  'SC-03',
  'SC-04',
  'SC-05',
  'SC-06',
  'SC-06A',
  'SC-06B',
  'SC-06C',
  'SC-06D',
  'SC-06E',
  'SC-06F',
  'SC-07',
  'SC-08',
  'SC-09',
  'SC-10',
  'SC-10A',
  'SC-11',
  'SC-12',
  'SC-13',
  'SC-14',
  'SC-14A',
  'SC-14B',
  'SC-14C',
  'SC-15',
  'SC-16',
  'SC-17',
  'SC-18',
  'SC-19',
  'SC-20',
  'SC-21',
];
const JOURNEYS = Array.from({ length: 25 }, (_, index) => `J${index + 1}`).filter((id) => id !== 'J22');
const TARGETS = ['darwin-arm64', 'darwin-x64', 'win32-arm64', 'win32-x64', 'linux-arm64', 'linux-x64'];
const TARGET_GATE_RECEIPT_CONTRACT = 'wayland-target-hardening-gate-receipt/1.0';
const TARGET_GATE_RECEIPT_SCHEMA = Object.freeze({
  contract: TARGET_GATE_RECEIPT_CONTRACT,
  requiredFields: Object.freeze([
    'contract',
    'receiptId',
    'candidate',
    'target',
    'gate',
    'authority',
    'evidenceSha256',
  ]),
  authority: 'canonical-target-hardening-validator',
});
const TARGET_PROOF_GATES = ['package-identity-signature', 'install', 'updater', 'rollback', 're-upgrade'];
const TARGET_GATE_REQUIREMENTS = TARGETS.flatMap((target) =>
  TARGET_PROOF_GATES.map((gate) =>
    Object.freeze({
      receiptId: `M8-F:${target}:${gate}`,
      contract: TARGET_GATE_RECEIPT_CONTRACT,
      target,
      gate,
    })
  )
);
const GATES = [
  'accessibility',
  'bundle',
  'crash-recovery',
  'dependency-security',
  'extension-isolation',
  'localization',
  'memory',
  'offline-partial-service',
  'packaging',
  'performance',
  'process-cleanup',
  'rollback',
  'security',
  'support-doctor',
  'updater',
];
const CONDITIONAL = {
  'cowork-office': {
    criteria: [],
    journeys: ['J17', 'J23'],
    receipts: ['C0-B', 'C1', 'C0-RELEASE-CLOSURE'],
  },
  voice: { criteria: ['SC-06E'], journeys: [], receipts: ['M5V-A', 'M5V-B'] },
  mcp: { criteria: ['SC-14A'], journeys: ['J9'], receipts: ['M1M', 'MCP-4'] },
  sandbox: { criteria: ['SC-06F'], journeys: ['J10', 'J25'], receipts: ['M1S', 'SBX-2'] },
  flux: { criteria: ['SC-14', 'SC-14B', 'SC-14C'], journeys: ['J24'], receipts: ['M1F'] },
};

function exactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const observed = Object.keys(value).sort();
  if (JSON.stringify(observed) !== JSON.stringify([...expected].sort())) {
    throw new Error(`${label} has missing or unknown critical fields`);
  }
}

function exactArray(observed, expected, label) {
  if (!Array.isArray(observed) || JSON.stringify(observed) !== JSON.stringify(expected)) {
    throw new Error(`${label} coverage or ordering mismatch`);
  }
  if (new Set(observed).size !== observed.length) throw new Error(`${label} contains duplicates`);
}

function readMatrix(file = MATRIX_FILE) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function verifyTargetGateReceiptSchema(schema) {
  exactKeys(schema, ['contract', 'requiredFields', 'authority'], 'target gate receipt schema');
  if (
    schema.contract !== TARGET_GATE_RECEIPT_SCHEMA.contract ||
    schema.authority !== TARGET_GATE_RECEIPT_SCHEMA.authority
  ) {
    throw new Error('target gate receipt schema authority or contract mismatch');
  }
  exactArray(schema.requiredFields, TARGET_GATE_RECEIPT_SCHEMA.requiredFields, 'target gate receipt schema fields');
}

function verifyCandidate(candidate, label) {
  exactKeys(candidate, ['commit', 'tree'], label);
  if (!COMMIT.test(String(candidate.commit)) || !COMMIT.test(String(candidate.tree))) {
    throw new Error(`${label} commit or tree is malformed`);
  }
  return candidate;
}

function verifyTargetGateRequirements(requirements) {
  if (!Array.isArray(requirements) || requirements.length !== TARGET_GATE_REQUIREMENTS.length) {
    throw new Error('target gate requirement coverage or ordering mismatch');
  }
  const receiptIds = new Set();
  for (let index = 0; index < TARGET_GATE_REQUIREMENTS.length; index += 1) {
    const observed = requirements[index];
    const expected = TARGET_GATE_REQUIREMENTS[index];
    exactKeys(observed, ['receiptId', 'contract', 'target', 'gate'], `target gate requirement ${index}`);
    if (receiptIds.has(observed.receiptId)) {
      throw new Error(`target gate requirement receipt ID duplicated: ${observed.receiptId}`);
    }
    receiptIds.add(observed.receiptId);
    if (
      observed.receiptId !== expected.receiptId ||
      observed.contract !== expected.contract ||
      observed.target !== expected.target ||
      observed.gate !== expected.gate
    ) {
      throw new Error(`target gate requirement coverage or ordering mismatch at ${expected.target}/${expected.gate}`);
    }
  }
}

function validateTargetGateReceiptSet(receipts, candidate) {
  const expectedCandidate = verifyCandidate(candidate, 'target gate expected candidate');
  if (!Array.isArray(receipts) || receipts.length !== TARGET_GATE_REQUIREMENTS.length) {
    throw new Error('target gate receipt coverage or ordering mismatch');
  }
  const receiptIds = new Set();
  const validated = [];
  for (let index = 0; index < TARGET_GATE_REQUIREMENTS.length; index += 1) {
    const receipt = receipts[index];
    const requirement = TARGET_GATE_REQUIREMENTS[index];
    exactKeys(receipt, TARGET_GATE_RECEIPT_SCHEMA.requiredFields, `target gate receipt ${index}`);
    if (receiptIds.has(receipt.receiptId)) throw new Error(`target gate receipt ID duplicated: ${receipt.receiptId}`);
    receiptIds.add(receipt.receiptId);
    if (
      receipt.contract !== requirement.contract ||
      receipt.receiptId !== requirement.receiptId ||
      receipt.target !== requirement.target ||
      receipt.gate !== requirement.gate
    ) {
      throw new Error(`target gate receipt foreign or misbound at ${requirement.target}/${requirement.gate}`);
    }
    const receiptCandidate = verifyCandidate(receipt.candidate, `target gate receipt candidate ${receipt.receiptId}`);
    if (receiptCandidate.commit !== expectedCandidate.commit || receiptCandidate.tree !== expectedCandidate.tree) {
      throw new Error(`target gate receipt stale or foreign candidate: ${receipt.receiptId}`);
    }
    if (receipt.authority !== TARGET_GATE_RECEIPT_SCHEMA.authority) {
      throw new Error(`target gate receipt authority mismatch: ${receipt.receiptId}`);
    }
    if (!SHA256.test(String(receipt.evidenceSha256))) {
      throw new Error(`target gate receipt evidence digest invalid: ${receipt.receiptId}`);
    }
    validated.push({
      contract: receipt.contract,
      receiptId: receipt.receiptId,
      candidate: { commit: receiptCandidate.commit, tree: receiptCandidate.tree },
      target: receipt.target,
      gate: receipt.gate,
      authority: receipt.authority,
      evidenceSha256: receipt.evidenceSha256,
    });
  }
  return validated;
}

function verifyHardeningMatrix(matrix = readMatrix()) {
  exactKeys(
    matrix,
    [
      'contract',
      'requiredInvariants',
      'requiredCriteria',
      'requiredJourneys',
      'supportedTargets',
      'requiredHardeningGates',
      'targetGateReceiptSchema',
      'targetGateRequirements',
      'capabilityConditional',
    ],
    'hardening matrix'
  );
  if (matrix.contract !== CONTRACT) throw new Error(`Unsupported hardening matrix contract: ${matrix.contract}`);
  exactArray(matrix.requiredInvariants, INVARIANTS, 'invariant');
  exactArray(matrix.requiredCriteria, CRITERIA, 'success criterion');
  exactArray(matrix.requiredJourneys, JOURNEYS, 'mandatory journey');
  exactArray(matrix.supportedTargets, TARGETS, 'supported target');
  exactArray(matrix.requiredHardeningGates, GATES, 'hardening gate');
  verifyTargetGateReceiptSchema(matrix.targetGateReceiptSchema);
  verifyTargetGateRequirements(matrix.targetGateRequirements);
  exactKeys(matrix.capabilityConditional, Object.keys(CONDITIONAL), 'conditional capability map');
  for (const [capability, expected] of Object.entries(CONDITIONAL)) {
    const observed = matrix.capabilityConditional[capability];
    exactKeys(observed, ['criteria', 'journeys', 'receipts'], `${capability} conditional gate`);
    exactArray(observed.criteria, expected.criteria, `${capability} conditional criteria`);
    exactArray(observed.journeys, expected.journeys, `${capability} conditional journeys`);
    exactArray(observed.receipts, expected.receipts, `${capability} conditional receipts`);
  }
  return {
    contract: CONTRACT,
    invariants: INVARIANTS.length,
    criteria: CRITERIA.length,
    journeys: JOURNEYS.length,
    targets: TARGETS.length,
    gates: GATES.length,
    targetProofGates: TARGET_PROOF_GATES.length,
    targetGateReceiptSchema: TARGET_GATE_RECEIPT_SCHEMA,
    targetGateRequirements: TARGET_GATE_REQUIREMENTS,
    conditionalCapabilities: Object.keys(CONDITIONAL).length,
  };
}

module.exports = {
  CONTRACT,
  CRITERIA,
  GATES,
  INVARIANTS,
  JOURNEYS,
  MATRIX_FILE,
  TARGETS,
  TARGET_GATE_RECEIPT_CONTRACT,
  TARGET_GATE_RECEIPT_SCHEMA,
  TARGET_GATE_REQUIREMENTS,
  TARGET_PROOF_GATES,
  validateTargetGateReceiptSet,
  verifyHardeningMatrix,
};

if (require.main === module) {
  try {
    console.log(JSON.stringify(verifyHardeningMatrix()));
  } catch (error) {
    console.error(`Release hardening matrix invalid: ${error.message}`);
    process.exit(1);
  }
}
