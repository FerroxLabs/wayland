'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const {
  CONTRACT,
  PROOF_CONTRACT,
  RECEIPT_CONTRACT,
  RECEIPT_MANIFEST_CONTRACT,
  SUITES,
  capabilitySourceDigest,
  selectionDigest,
  sha256,
  validateSelection,
} = require('./verifyCandidateCapabilitySeal');

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
}

function exactCandidate(root) {
  const candidate = { commit: git(root, 'rev-parse', 'HEAD'), tree: git(root, 'rev-parse', 'HEAD^{tree}') };
  if (git(root, 'status', '--porcelain=v1', '--untracked-files=all')) {
    throw new Error('Capability acceptance source tree is dirty.');
  }
  return candidate;
}

function runSuite(root, files) {
  return spawnSync('bun', ['run', 'test:vitest', '--', ...files], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: process.env,
  });
}

function writeExclusive(file, bytes) {
  fs.writeFileSync(file, bytes, { flag: 'wx', mode: 0o600 });
}

function generateCapabilityAcceptanceReceipts(options = {}) {
  const root = path.resolve(options.root || path.join(__dirname, '..', '..'));
  const outDir = path.resolve(options.outDir);
  if (!options.outDir) throw new Error('Capability acceptance output directory is required.');
  if (fs.existsSync(outDir)) throw new Error('Capability acceptance output directory already exists.');
  const selection = validateSelection(
    options.selection || JSON.parse(fs.readFileSync(path.join(__dirname, 'candidate-capabilities.json'), 'utf8'))
  );
  if (selection.contract !== CONTRACT) throw new Error('Capability selection contract is invalid.');
  const candidate = options.candidate || exactCandidate(root);
  const runner = options.runSuite || runSuite;
  fs.mkdirSync(outDir, { recursive: false, mode: 0o700 });
  const manifestEntries = [];

  for (const capability of selection.capabilities.filter((entry) => entry.mode === 'included')) {
    const files = SUITES[capability.id];
    if (!files || files.length === 0) throw new Error(`No canonical acceptance suite exists for ${capability.id}.`);
    const result = runner(root, files, capability.id);
    const logBytes = Buffer.from(
      [`stdout:`, '', String(result.stdout || ''), `stderr:`, '', String(result.stderr || '')].join('\n')
    );
    if (result.status !== 0) throw new Error(`Canonical capability acceptance suite failed: ${capability.id}.`);
    const sourceSha256 = capabilitySourceDigest(root, candidate.commit, capability.id);
    const logFile = `${capability.id}.proof.log`;
    const logSha256 = sha256(logBytes);
    writeExclusive(path.join(outDir, logFile), logBytes);
    const proof = {
      contract: PROOF_CONTRACT,
      candidate,
      capabilityId: capability.id,
      command: { executable: 'bun', arguments: ['run', 'test:vitest', '--', ...files] },
      exitCode: 0,
      log: { file: logFile, sha256: logSha256 },
      source: { sha256: sourceSha256, paths: capability.excludedPaths },
    };
    const proofFile = `${capability.id}.proof.json`;
    const proofBytes = Buffer.from(`${JSON.stringify(proof, null, 2)}\n`);
    const proofSha256 = sha256(proofBytes);
    writeExclusive(path.join(outDir, proofFile), proofBytes);
    const receipt = {
      contract: RECEIPT_CONTRACT,
      capabilityId: capability.id,
      packets: capability.packets,
      status: 'accepted',
      acceptedCommit: candidate.commit,
      acceptedTree: candidate.tree,
      sourceSha256,
      proof: [proofSha256],
    };
    const receiptFile = `${capability.id}.json`;
    const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
    const receiptSha256 = sha256(receiptBytes);
    writeExclusive(path.join(outDir, receiptFile), receiptBytes);
    manifestEntries.push({
      capabilityId: capability.id,
      receiptFile,
      receiptSha256,
      proofFile,
      proofSha256,
      logFile,
      logSha256,
    });
  }

  const manifest = {
    contract: RECEIPT_MANIFEST_CONTRACT,
    candidate,
    selectionSha256: selectionDigest(selection),
    receipts: manifestEntries,
  };
  writeExclusive(path.join(outDir, 'manifest.json'), Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`));
  return manifest;
}

function parseArgs(argv) {
  if (argv.length !== 2 || argv[0] !== '--out' || !argv[1]) {
    throw new Error('Usage: node generateCapabilityAcceptanceReceipts.js --out <directory>');
  }
  return { outDir: argv[1] };
}

if (require.main === module) {
  try {
    const manifest = generateCapabilityAcceptanceReceipts(parseArgs(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

module.exports = { SUITES, generateCapabilityAcceptanceReceipts };
