import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { canonicalJson, checkGate, contractDigest } from './packet-gate-lib.mjs';

const sourceRoot = new URL('../..', import.meta.url).pathname;
const parent = await mkdtemp(join(tmpdir(), 'wayland-gsd-shared-receipts-'));
const worktreeA = join(parent, 'worktree-a');
const worktreeB = join(parent, 'worktree-b');
const receiptStore = join(parent, 'external-receipt-cas');
const manifestPath = join(parent, 'gates.json');
const contractsPath = join(parent, 'contracts.json');
const trustRootPath = join(parent, 'trust.json');

function git(root, args, options = {}) {
  return spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', ...options });
}

function sha(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

try {
  for (const target of [worktreeA, worktreeB]) {
    const add = git(sourceRoot, ['worktree', 'add', '--detach', target, 'HEAD']);
    assert.equal(add.status, 0, add.stderr || add.stdout);
  }
  await mkdir(receiptStore);
  await mkdir(join(worktreeA, '.planning/receipts'), { recursive: true });

  const head = git(worktreeB, ['rev-parse', 'HEAD']).stdout.trim();
  const tree = git(worktreeB, ['rev-parse', 'HEAD^{tree}']).stdout.trim();
  const contract = { requirements: ['TEST-01'], terminal_claim: 'Shared cross-worktree receipt proof.' };
  const manifest = {
    schema_version: 2,
    source_baseline: head,
    revision: 'cross-worktree-test-2',
    gates: {
      REQUIRED: {
        mode: 'acceptance',
        prerequisites: { all: [], any: [], one: [] },
        accepts: { all: ['TEST'], one: [] },
      },
    },
  };
  const contracts = { schema_version: 1, packets: { TEST: contract } };
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const key = {
    key_id: 'cross-worktree-key',
    issuer: 'cross-worktree-acceptor',
    public_key_pem: publicKey.export({ type: 'spki', format: 'pem' }),
    valid_from: '2026-01-01T00:00:00.000Z',
    valid_until: '2027-01-01T00:00:00.000Z',
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
  await writeFile(contractsPath, `${JSON.stringify(contracts)}\n`);
  await writeFile(trustRootPath, `${JSON.stringify({ schema_version: 1, keys: [key] })}\n`);

  const log = Buffer.from('shared proof log\n');
  const environment = Buffer.from('{"runtime":"cross-worktree-test"}\n');
  const signed = {
    packet: 'TEST',
    status: 'accepted',
    source_baseline: head,
    gate_manifest_revision: manifest.revision,
    gate_manifest_digest: contractDigest(manifest),
    gate_authorizations: { REQUIRED: contractDigest(manifest.gates.REQUIRED) },
    packet_contract_digest: contractDigest(contract),
    candidate: { commit: head, tree, integration_head: head },
    evidence: { log_digest: sha(log), environment_digest: sha(environment) },
    issuer: key.issuer,
    accepted_at: '2026-07-19T00:00:00.000Z',
  };
  const receipt = {
    schema_version: 2,
    signed,
    signature: {
      algorithm: 'ed25519',
      key_id: key.key_id,
      value: sign(null, Buffer.from(canonicalJson(signed)), privateKey).toString('base64'),
    },
  };

  async function writeBundle(directory) {
    await writeFile(join(directory, 'TEST.log'), log);
    await writeFile(join(directory, 'TEST.env.json'), environment);
    await writeFile(join(directory, 'TEST.json'), `${JSON.stringify(receipt)}\n`);
  }

  const args = {
    gateId: 'REQUIRED',
    projectRoot: worktreeB,
    receiptDirectory: receiptStore,
    manifestPath,
    contractsPath,
    trustRootPath,
    authorizedCandidates: { TEST: { commit: head, tree, integration_head: head } },
    expectedIntegrationHead: head,
  };

  await writeBundle(join(worktreeA, '.planning/receipts'));
  assert.equal((await checkGate(args)).ok, false, 'a worktree-local receipt must not satisfy another worktree');

  await writeBundle(receiptStore);
  assert.equal(
    (await checkGate(args)).ok,
    true,
    'an externally shared accepted receipt must satisfy a clean successor worktree'
  );

  await writeFile(join(worktreeA, '.planning/receipts/TEST.log'), 'hostile local substitution\n');
  assert.equal((await checkGate(args)).ok, true, 'mutation in either worktree must not alter shared evidence');

  await writeFile(join(receiptStore, 'TEST.log'), 'hostile shared substitution\n');
  assert.equal((await checkGate(args)).ok, false, 'substitution in the shared store must fail its signed digest');

  console.log('cross-worktree shared receipt tests: PASS');
} finally {
  for (const target of [worktreeA, worktreeB]) git(sourceRoot, ['worktree', 'remove', '--force', target]);
  await rm(parent, { recursive: true, force: true });
}
