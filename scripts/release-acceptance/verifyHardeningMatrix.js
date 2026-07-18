'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CONTRACT = 'wayland-release-hardening-matrix/1.0';
const MATRIX_FILE = path.resolve(__dirname, 'hardening-matrix.json');
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
