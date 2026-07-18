'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CONTRACT = 'wayland-candidate-capabilities/1.0';
const RECEIPT_CONTRACT = 'wayland-capability-acceptance/1.0';
const SEAL_CONTRACT = 'wayland-candidate-capability-seal/1.0';
const REQUIRED = new Map([
  ['cowork-office', ['C0-B', 'C1']],
  ['voice', ['M5V-A']],
  ['mcp', ['M1M', 'MCP-4']],
  ['sandbox', ['M1S', 'SBX-2']],
  ['flux', ['M1F']],
]);
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const COMMIT = /^[0-9a-f]{40,64}$/;

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

function sha256(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

function exactKeys(value, keys) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort())
  );
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
}

function candidateIdentity(root, overrides = {}) {
  const commit = overrides.commit || git(root, ['rev-parse', 'HEAD']);
  const tree = overrides.tree || git(root, ['rev-parse', 'HEAD^{tree}']);
  const status =
    overrides.status === undefined ? git(root, ['status', '--porcelain', '--untracked-files=all']) : overrides.status;
  if (!COMMIT.test(commit) || !COMMIT.test(tree)) throw new Error('Candidate commit/tree identity is malformed.');
  if (status) throw new Error('Candidate source tree is dirty; capability evidence cannot bind mutable source.');
  return {
    commit,
    tree,
    ancestors: overrides.ancestors || null,
    acceptedTrees: overrides.acceptedTrees || null,
  };
}

function validateSelection(selection) {
  if (!exactKeys(selection, ['contract', 'capabilities']) || selection.contract !== CONTRACT) {
    throw new Error(`Capability selection must use ${CONTRACT} with no unknown critical fields.`);
  }
  if (!Array.isArray(selection.capabilities) || selection.capabilities.length !== REQUIRED.size) {
    throw new Error('Capability selection coverage is incomplete.');
  }
  const seen = new Set();
  for (const capability of selection.capabilities) {
    if (!exactKeys(capability, ['id', 'packets', 'mode', 'receiptSha256', 'excludedPaths'])) {
      throw new Error('Capability selection contains unknown or missing critical fields.');
    }
    const expectedPackets = REQUIRED.get(capability.id);
    if (!expectedPackets || seen.has(capability.id))
      throw new Error(`Unknown or duplicate capability: ${capability.id}.`);
    seen.add(capability.id);
    if (JSON.stringify(capability.packets) !== JSON.stringify(expectedPackets)) {
      throw new Error(`Capability packet coverage mismatch: ${capability.id}.`);
    }
    if (!['included', 'excluded'].includes(capability.mode)) throw new Error(`Invalid mode for ${capability.id}.`);
    if (!Array.isArray(capability.excludedPaths) || capability.excludedPaths.length === 0) {
      throw new Error(`Capability ${capability.id} has no physical exclusion inventory.`);
    }
    for (const entry of capability.excludedPaths) {
      if (typeof entry !== 'string' || !entry || path.isAbsolute(entry) || entry.includes('..')) {
        throw new Error(`Capability ${capability.id} has an unsafe exclusion path.`);
      }
    }
    if (capability.mode === 'included' && !SHA256.test(String(capability.receiptSha256))) {
      throw new Error(`Capability ${capability.id} is present but has no exact accepted receipt digest.`);
    }
    if (capability.mode === 'excluded' && capability.receiptSha256 !== null) {
      throw new Error(`Excluded capability ${capability.id} must not claim an acceptance receipt.`);
    }
  }
  return selection;
}

function validateReceipt(receipt, capability, candidate, root) {
  const keys = ['contract', 'capabilityId', 'packets', 'status', 'acceptedCommit', 'acceptedTree', 'proof'];
  if (!exactKeys(receipt, keys) || receipt.contract !== RECEIPT_CONTRACT) {
    throw new Error(`Receipt for ${capability.id} has an invalid contract or critical fields.`);
  }
  if (
    receipt.capabilityId !== capability.id ||
    JSON.stringify(receipt.packets) !== JSON.stringify(capability.packets) ||
    receipt.status !== 'accepted'
  ) {
    throw new Error(`Receipt for ${capability.id} does not accept the exact required packet set.`);
  }
  if (!COMMIT.test(String(receipt.acceptedCommit)) || !COMMIT.test(String(receipt.acceptedTree))) {
    throw new Error(`Receipt for ${capability.id} has malformed accepted source identity.`);
  }
  const observedAcceptedTree =
    candidate.acceptedTrees?.[receipt.acceptedCommit] ||
    (() => {
      try {
        return git(root, ['rev-parse', `${receipt.acceptedCommit}^{tree}`]);
      } catch {
        return null;
      }
    })();
  if (observedAcceptedTree !== receipt.acceptedTree) {
    throw new Error(`Receipt for ${capability.id} accepted commit/tree identity does not exist or match.`);
  }
  const isAncestor = candidate.ancestors
    ? candidate.ancestors.includes(receipt.acceptedCommit)
    : (() => {
        try {
          execFileSync('git', ['-C', root, 'merge-base', '--is-ancestor', receipt.acceptedCommit, candidate.commit]);
          return true;
        } catch {
          return false;
        }
      })();
  if (!isAncestor) {
    throw new Error(`Receipt for ${capability.id} is stale or belongs to a source not present in this candidate.`);
  }
  if (!Array.isArray(receipt.proof) || receipt.proof.length === 0 || receipt.proof.some((item) => !SHA256.test(item))) {
    throw new Error(`Receipt for ${capability.id} has no exact proof digests.`);
  }
}

function createCapabilitySeal(options = {}) {
  const root = path.resolve(options.root || path.join(__dirname, '..', '..'));
  const selectionFile = path.resolve(options.selectionFile || path.join(__dirname, 'candidate-capabilities.json'));
  const receiptsDir = path.resolve(options.receiptsDir || process.env.WAYLAND_CAPABILITY_RECEIPTS_DIR || '');
  const selection = validateSelection(options.selection || readJson(selectionFile));
  const candidateContext = candidateIdentity(root, options.candidate);
  const candidate = { commit: candidateContext.commit, tree: candidateContext.tree };
  const capabilities = [];

  for (const capability of selection.capabilities) {
    if (capability.mode === 'excluded') {
      const present = capability.excludedPaths.filter((entry) => fs.existsSync(path.join(root, entry)));
      if (present.length) {
        throw new Error(
          `Capability ${capability.id} is marked excluded but remains physically present: ${present.join(', ')}.`
        );
      }
      capabilities.push({ id: capability.id, packets: capability.packets, mode: 'excluded', receiptSha256: null });
      continue;
    }

    if (!options.receiptsDir && !process.env.WAYLAND_CAPABILITY_RECEIPTS_DIR) {
      throw new Error('WAYLAND_CAPABILITY_RECEIPTS_DIR is required for included capabilities.');
    }
    const receiptFile = path.join(receiptsDir, `${capability.id}.json`);
    if (!fs.existsSync(receiptFile))
      throw new Error(`Missing acceptance receipt for ${capability.id}: ${receiptFile}.`);
    const bytes = fs.readFileSync(receiptFile);
    const digest = sha256(bytes);
    if (digest !== capability.receiptSha256)
      throw new Error(`Acceptance receipt digest mismatch for ${capability.id}.`);
    const receipt = JSON.parse(bytes.toString('utf8'));
    validateReceipt(receipt, capability, candidateContext, root);
    capabilities.push({
      id: capability.id,
      packets: capability.packets,
      mode: 'included',
      receiptSha256: digest,
      acceptedCommit: receipt.acceptedCommit,
      acceptedTree: receipt.acceptedTree,
    });
  }

  const payload = { contract: SEAL_CONTRACT, candidate, selectionSha256: sha256(canonical(selection)), capabilities };
  return { ...payload, sealSha256: sha256(canonical(payload)) };
}

function verifyCapabilitySeal(seal) {
  const keys = ['contract', 'candidate', 'selectionSha256', 'capabilities', 'sealSha256'];
  if (!exactKeys(seal, keys) || seal.contract !== SEAL_CONTRACT || !SHA256.test(String(seal.selectionSha256))) {
    throw new Error('Packaged capability seal has invalid identity or critical fields.');
  }
  if (
    !exactKeys(seal.candidate, ['commit', 'tree']) ||
    !COMMIT.test(String(seal.candidate?.commit)) ||
    !COMMIT.test(String(seal.candidate?.tree))
  ) {
    throw new Error('Packaged capability seal candidate identity is malformed.');
  }
  if (!Array.isArray(seal.capabilities) || seal.capabilities.length !== REQUIRED.size) {
    throw new Error('Packaged capability seal coverage is incomplete.');
  }
  for (const entry of seal.capabilities) {
    const expectedKeys =
      entry?.mode === 'included'
        ? ['id', 'packets', 'mode', 'receiptSha256', 'acceptedCommit', 'acceptedTree']
        : ['id', 'packets', 'mode', 'receiptSha256'];
    if (!exactKeys(entry, expectedKeys)) throw new Error('Packaged capability seal has invalid critical fields.');
    if (
      entry.mode === 'included' &&
      (!COMMIT.test(String(entry.acceptedCommit)) || !COMMIT.test(String(entry.acceptedTree)))
    ) {
      throw new Error(`Packaged capability ${String(entry.id)} has malformed accepted source identity.`);
    }
  }
  const { sealSha256, ...payload } = seal;
  if (sha256(canonical(payload)) !== sealSha256) throw new Error('Packaged capability seal digest mismatch.');
  validateSelection({
    contract: CONTRACT,
    capabilities: seal.capabilities.map((entry) => ({
      id: entry.id,
      packets: entry.packets,
      mode: entry.mode,
      receiptSha256: entry.receiptSha256,
      excludedPaths: ['sealed-at-source'],
    })),
  });
  return seal;
}

function writeCapabilitySeal(options = {}) {
  const outputFile = path.resolve(options.outputFile);
  const seal = createCapabilitySeal(options);
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(seal, null, 2)}\n`);
  return seal;
}

module.exports = {
  CONTRACT,
  RECEIPT_CONTRACT,
  SEAL_CONTRACT,
  createCapabilitySeal,
  sha256,
  validateSelection,
  verifyCapabilitySeal,
  writeCapabilitySeal,
};
