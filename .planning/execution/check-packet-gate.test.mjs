import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  ACCEPTANCE_FUTURE_SKEW_MS,
  canonicalJson,
  checkGate,
  checkGateAtTimeForTest,
  contractDigest,
} from './packet-gate-lib.mjs';
import { validateEntryReceipt } from './desktop-gsd-next.mjs';

const projectRoot = new URL('../..', import.meta.url).pathname;
const directory = await mkdtemp(join(tmpdir(), 'wayland-gate-'));
const receiptDirectory = join(directory, 'receipts');
const manifestPath = join(directory, 'gates.json');
const contractsPath = join(directory, 'contracts.json');
const trustRootPath = join(directory, 'keys.json');
await mkdir(receiptDirectory);

const head = spawnSync('git', ['-C', projectRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
const tree = spawnSync('git', ['-C', projectRoot, 'rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).stdout.trim();
const oldHead = spawnSync('git', ['-C', projectRoot, 'rev-parse', 'HEAD^'], { encoding: 'utf8' }).stdout.trim();
const oldTree = spawnSync('git', ['-C', projectRoot, 'rev-parse', 'HEAD^^{tree}'], { encoding: 'utf8' }).stdout.trim();
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const attacker = generateKeyPairSync('ed25519');
const publicPem = publicKey.export({ type: 'spki', format: 'pem' });
const contract = { requirements: ['TEST-01'], terminal_claim: 'A real acceptance contract.' };
const emptyPrerequisites = { all: [], any: [], one: [] };
const manifest = {
  schema_version: 2,
  source_baseline: head,
  revision: 'test-revision-2',
  gates: {
    ENTRY_OPEN: { mode: 'entry', prerequisites: emptyPrerequisites },
    ENTRY_REQUIRED: { mode: 'entry', prerequisites: { all: ['TEST'], any: [], one: [] } },
    ENTRY_ALTERNATIVE: { mode: 'entry', prerequisites: { all: [], any: [['TEST', 'OTHER']], one: [] } },
    ACCEPT_OPEN: { mode: 'acceptance', prerequisites: emptyPrerequisites, accepts: { all: ['TEST'], one: [] } },
    ACCEPT_REQUIRED: {
      mode: 'acceptance',
      prerequisites: { all: ['TEST'], any: [], one: [] },
      accepts: { all: ['TARGET'], one: [] },
    },
    ACCEPT_EXCLUSIVE: {
      mode: 'acceptance',
      prerequisites: emptyPrerequisites,
      accepts: { all: [], one: [['TEST', 'OTHER']] },
    },
  },
};
const contracts = { schema_version: 1, packets: { TEST: contract, OTHER: contract, TARGET: contract } };
const activeKey = {
  key_id: 'acceptance-1',
  issuer: 'test-acceptor',
  public_key_pem: publicPem,
  valid_from: '2026-01-01T00:00:00.000Z',
  valid_until: '2027-01-01T00:00:00.000Z',
};
const activeTrustRoot = { schema_version: 1, keys: [activeKey] };
const verifierNow = Date.parse('2026-07-20T00:00:00.000Z');

async function persistManifest(value = manifest) {
  await writeFile(manifestPath, `${JSON.stringify(value)}\n`);
}

await persistManifest();
await writeFile(contractsPath, `${JSON.stringify(contracts)}\n`);
await writeFile(trustRootPath, `${JSON.stringify(activeTrustRoot)}\n`);

function sha(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

async function writeReceipt(packet, options = {}) {
  const log = Buffer.from('proof log\n');
  const environment = Buffer.from('{"node":"test"}\n');
  await writeFile(join(receiptDirectory, `${packet}.log`), log);
  await writeFile(join(receiptDirectory, `${packet}.env.json`), environment);
  const signed = {
    packet,
    status: 'accepted',
    source_baseline: manifest.source_baseline,
    gate_manifest_revision: manifest.revision,
    gate_manifest_digest: contractDigest(manifest),
    gate_authorizations: Object.fromEntries(
      Object.entries(manifest.gates).map(([id, gate]) => [id, contractDigest(gate)])
    ),
    packet_contract_digest: contractDigest(contract),
    candidate: { commit: head, tree, integration_head: head },
    evidence: { log_digest: sha(log), environment_digest: sha(environment) },
    issuer: 'test-acceptor',
    acceptance_key_id: options.keyId ?? 'acceptance-1',
    accepted_at: '2026-07-19T00:00:00.000Z',
    ...options.signed,
  };
  const signature = sign(null, Buffer.from(canonicalJson(signed)), options.signingKey ?? privateKey).toString('base64');
  const receipt = {
    schema_version: 2,
    signed,
    signature: { algorithm: 'ed25519', key_id: options.keyId ?? 'acceptance-1', value: signature },
  };
  await writeFile(join(receiptDirectory, `${packet}.json`), `${JSON.stringify(receipt)}\n`);
  return receipt;
}

const authorizedCandidates = Object.fromEntries(
  ['TEST', 'OTHER', 'TARGET'].map((packet) => [packet, { commit: head, tree, integration_head: head }])
);

async function run(gate, options = {}) {
  const args = {
    gateId: gate,
    projectRoot,
    receiptDirectory,
    manifestPath,
    contractsPath,
    trustRootPath,
    authorizedCandidates: options.authorizedCandidates ?? authorizedCandidates,
    expectedIntegrationHead: options.expectedIntegrationHead ?? head,
  };
  return options.productionClock
    ? checkGate(args)
    : checkGateAtTimeForTest(args, options.verificationTime ?? verifierNow);
}

async function rejectsManifest(mutator, pattern) {
  const hostile = structuredClone(manifest);
  mutator(hostile);
  await persistManifest(hostile);
  await assert.rejects(run(Object.keys(hostile.gates)[0]), pattern);
  await persistManifest();
}

try {
  const open = await run('ENTRY_OPEN');
  assert.equal(open.ok, true, 'dependency-free entry gate should pass');
  assert.equal(open.mode, 'entry');
  assert.equal(open.prerequisites.ok, true);
  assert.deepEqual(open.accepted_targets, [], 'entry gate can never mint accepted targets');

  assert.equal((await run('ENTRY_REQUIRED')).ok, false, 'missing entry prerequisite must fail closed');
  assert.equal((await run('ACCEPT_OPEN')).ok, false, 'target-free evidence must not open an acceptance gate');

  await writeReceipt('TEST');
  assert.equal((await run('ENTRY_REQUIRED')).ok, true, 'trusted prerequisite opens only the entry gate');
  const producedEntry = await run('ENTRY_REQUIRED');
  assert.deepEqual(producedEntry.accepted_targets, [], 'green entry cannot be cited as acceptance');
  assert.deepEqual(
    validateEntryReceipt(producedEntry, 'ENTRY_REQUIRED'),
    { gate_id: 'ENTRY_REQUIRED', mode: 'entry', prerequisites: 'green', accepted_targets: [] },
    'schema-v2 producer output must satisfy the pinned selector contract'
  );
  assert.equal((await run('ENTRY_ALTERNATIVE')).ok, true, 'one trusted alternative should open an entry gate');
  assert.equal((await run('ACCEPT_OPEN')).ok, true, 'trusted exact target should open acceptance');

  const split = await run('ACCEPT_REQUIRED');
  assert.equal(split.prerequisites.ok, true, 'prerequisite should be independently green');
  assert.equal(split.accepted_targets.ok, false, 'missing target must remain independently red');
  assert.equal(split.accepted_targets.required[0].reason_code, 'RECEIPT_OR_EVIDENCE_MISSING');
  assert.equal(split.ok, false, 'green prerequisites cannot substitute for a red target');

  await writeReceipt('TARGET');
  assert.equal((await run('ACCEPT_REQUIRED')).ok, true, 'prerequisite and target together should open acceptance');

  const snapshotManifest = structuredClone(manifest);
  const snapshotContracts = structuredClone(contracts);
  const snapshotTrustRoot = structuredClone(activeTrustRoot);
  await writeReceipt('TEST');
  const snapshotCheck = checkGate({
    gateId: 'ACCEPT_OPEN',
    projectRoot,
    receiptDirectory,
    manifest: snapshotManifest,
    contracts: snapshotContracts,
    trustRoot: snapshotTrustRoot,
    authorizedCandidates,
    expectedIntegrationHead: head,
  });
  snapshotManifest.revision = 'caller-mutated-after-capture';
  snapshotContracts.packets = {};
  snapshotTrustRoot.keys = [];
  await Promise.all([
    writeFile(manifestPath, '{"schema_version":0}\n'),
    writeFile(contractsPath, '{"schema_version":0}\n'),
    writeFile(trustRootPath, '{"schema_version":0}\n'),
  ]);
  assert.equal((await snapshotCheck).ok, true, 'one captured authority snapshot must drive the complete check');
  await persistManifest();
  await writeFile(contractsPath, `${JSON.stringify(contracts)}\n`);
  await writeFile(trustRootPath, `${JSON.stringify(activeTrustRoot)}\n`);

  const secondKey = {
    ...activeKey,
    key_id: 'acceptance-2',
    public_key_pem: attacker.publicKey.export({ type: 'spki', format: 'pem' }),
  };
  await writeFile(trustRootPath, `${JSON.stringify({ schema_version: 1, keys: [activeKey, secondKey] })}\n`);
  const relabelledReceipt = await writeReceipt('TEST');
  relabelledReceipt.signature.key_id = secondKey.key_id;
  await writeFile(join(receiptDirectory, 'TEST.json'), `${JSON.stringify(relabelledReceipt)}\n`);
  assert.equal(
    (await run('ACCEPT_OPEN')).accepted_targets.required[0].reason_code,
    'ACCEPTANCE_KEY_ID_MISMATCH',
    'the authenticated key identity cannot be relabelled by its unsigned envelope'
  );

  await writeFile(
    trustRootPath,
    `${JSON.stringify({ schema_version: 1, keys: [activeKey, { ...activeKey, key_id: 'acceptance-alias' }] })}\n`
  );
  await assert.rejects(run('ACCEPT_OPEN'), /Duplicate acceptance public-key identity/);
  await writeFile(trustRootPath, `${JSON.stringify(activeTrustRoot)}\n`);

  async function assertInvalidTimestamp(invalidTimestamp) {
    await writeReceipt('TEST', { signed: { accepted_at: invalidTimestamp } });
    assert.equal(
      (await run('ACCEPT_OPEN')).accepted_targets.required[0].reason_code,
      'ACCEPTANCE_TIMESTAMP_INVALID',
      'non-canonical acceptance time must fail closed'
    );
  }
  await assertInvalidTimestamp('2026');
  await assertInvalidTimestamp('2026-02-31T00:00:00.000Z');
  await assertInvalidTimestamp(0);

  const futureTrustRoot = {
    schema_version: 1,
    keys: [{ ...activeKey, valid_until: '2100-01-01T00:00:00.000Z' }],
  };
  await writeFile(trustRootPath, `${JSON.stringify(futureTrustRoot)}\n`);

  async function futureReceiptAt(offsetMs) {
    const acceptedAt = new Date(verifierNow + offsetMs).toISOString();
    await writeReceipt('TEST', { signed: { accepted_at: acceptedAt } });
    return run('ACCEPT_OPEN');
  }

  assert.equal(
    (await futureReceiptAt(ACCEPTANCE_FUTURE_SKEW_MS - 1)).ok,
    true,
    'a receipt just inside the explicit clock-skew allowance remains valid'
  );
  assert.equal(
    (await futureReceiptAt(ACCEPTANCE_FUTURE_SKEW_MS)).ok,
    true,
    'the exact clock-skew boundary remains valid'
  );
  const justOutside = await futureReceiptAt(ACCEPTANCE_FUTURE_SKEW_MS + 1);
  assert.equal(justOutside.ok, false, 'a receipt just outside the clock-skew allowance must fail closed');
  assert.equal(
    justOutside.accepted_targets.required[0].reason_code,
    'ACCEPTANCE_TIMESTAMP_IN_FUTURE',
    'future rejection must use a stable reason code'
  );
  const farFuture = await futureReceiptAt(365 * 24 * 60 * 60 * 1000);
  assert.equal(farFuture.ok, false, 'a far-future receipt cannot authorize acceptance today');
  assert.equal(farFuture.accepted_targets.required[0].reason_code, 'ACCEPTANCE_TIMESTAMP_IN_FUTURE');

  await writeReceipt('TEST', { signed: { accepted_at: '2099-01-01T00:00:00.000Z' } });
  assert.equal(
    (await run('ACCEPT_OPEN', { productionClock: true, verificationTime: Date.parse('2100-01-01T00:00:00.000Z') })).ok,
    false,
    'production verification owns its clock and ignores attempted test-time injection'
  );

  const replayAcceptedAt = new Date(verifierNow + ACCEPTANCE_FUTURE_SKEW_MS + 1).toISOString();
  await writeReceipt('TEST', { signed: { accepted_at: replayAcceptedAt } });
  assert.equal((await run('ACCEPT_OPEN')).ok, false, 'future receipt replay remains red before its time');
  assert.equal(
    (await run('ACCEPT_OPEN', { verificationTime: verifierNow + 1 })).ok,
    true,
    'the identical signed receipt becomes valid only when verifier-owned time reaches the allowed boundary'
  );

  await writeFile(trustRootPath, `${JSON.stringify(activeTrustRoot)}\n`);

  await writeReceipt('TEST');
  await writeFile(
    trustRootPath,
    `${JSON.stringify({ schema_version: 1, keys: [{ ...activeKey, valid_from: '2026' }] })}\n`
  );
  assert.equal(
    (await run('ACCEPT_OPEN')).accepted_targets.required[0].reason_code,
    'SIGNER_VALIDITY_WINDOW_INVALID',
    'non-canonical key validity time must fail closed'
  );
  await writeFile(
    trustRootPath,
    `${JSON.stringify({ schema_version: 1, keys: [{ ...activeKey, revoked_at: '2026-07-19' }] })}\n`
  );
  assert.equal(
    (await run('ACCEPT_OPEN')).accepted_targets.required[0].reason_code,
    'SIGNER_REVOCATION_TIMESTAMP_INVALID',
    'non-canonical key revocation time must fail closed'
  );
  await writeFile(trustRootPath, `${JSON.stringify(activeTrustRoot)}\n`);
  await writeReceipt('TEST');

  await rm(join(receiptDirectory, 'OTHER.json'), { force: true });
  assert.equal((await run('ACCEPT_EXCLUSIVE')).ok, true, 'exactly one authenticated target should pass');
  await writeReceipt('OTHER');
  assert.equal((await run('ACCEPT_EXCLUSIVE')).ok, false, 'both exclusive targets must fail closed');
  await rm(join(receiptDirectory, 'TEST.json'));
  await rm(join(receiptDirectory, 'OTHER.json'));
  assert.equal((await run('ACCEPT_EXCLUSIVE')).ok, false, 'neither exclusive target must fail closed');
  await writeReceipt('OTHER');
  assert.equal((await run('ACCEPT_OPEN')).ok, false, 'a valid receipt for the wrong target must not open acceptance');
  await rm(join(receiptDirectory, 'OTHER.json'));

  await rejectsManifest((value) => {
    value.gates.ENTRY_OPEN = { prerequisites: emptyPrerequisites };
  }, /missing or unsupported mode/);
  await rejectsManifest((value) => {
    value.gates.ENTRY_OPEN.all = [];
  }, /unsupported or missing fields/);
  await rejectsManifest((value) => {
    value.gates.ENTRY_OPEN.accepts = { all: ['TEST'], one: [] };
  }, /unsupported or missing fields/);
  await rejectsManifest((value) => {
    value.gates.ACCEPT_OPEN.accepts = { all: [], one: [] };
  }, /has no target/);
  await rejectsManifest((value) => {
    delete value.gates.ACCEPT_OPEN.accepts;
  }, /unsupported or missing fields/);
  await rejectsManifest((value) => {
    value.gates.ACCEPT_OPEN.accepts.all = ['TEST', 'TEST'];
  }, /duplicate packet/);
  await rejectsManifest((value) => {
    value.gates.ENTRY_ALTERNATIVE.prerequisites.any = [
      ['TEST', 'OTHER'],
      ['TEST', 'TARGET'],
    ];
  }, /ambiguous duplicate packet TEST/);
  await rejectsManifest((value) => {
    value.gates.ENTRY_ALTERNATIVE.prerequisites.one = [['TEST', 'OTHER']];
  }, /ambiguous duplicate packet TEST/);
  const sharedExclusive = structuredClone(manifest);
  sharedExclusive.gates.ENTRY_SHARED_EXCLUSIVE = {
    mode: 'entry',
    prerequisites: {
      all: [],
      any: [],
      one: [
        ['TEST', 'OTHER'],
        ['TARGET', 'OTHER'],
      ],
    },
  };
  await persistManifest(sharedExclusive);
  assert.equal(
    (await run('ENTRY_SHARED_EXCLUSIVE')).ok,
    false,
    'a shared exact-one fallback is valid schema even when its receipts are absent'
  );
  await persistManifest();
  await rejectsManifest((value) => {
    value.gates.ACCEPT_REQUIRED.accepts.all = ['TEST'];
  }, /both prerequisite and target/);
  await rejectsManifest((value) => {
    value.gates.ACCEPT_OPEN.accepts.all = ['UNKNOWN'];
  }, /unsealed packet/);

  await writeReceipt('TEST', {
    signed: { gate_authorizations: { ACCEPT_OPEN: contractDigest({ all: [], any: [] }) } },
  });
  assert.equal((await run('ACCEPT_OPEN')).ok, false, 'stale v1 gate authorization must fail');
  await writeReceipt('TEST', { signingKey: attacker.privateKey });
  assert.equal((await run('ACCEPT_OPEN')).ok, false, 'recomputed local forgery must fail');
  await writeReceipt('TEST', {
    signed: { critical_extension: { receipt_authority: 'candidate-asserted' } },
  });
  assert.equal(
    (await run('ACCEPT_OPEN')).ok,
    false,
    'a correctly signed receipt with an unknown critical field must fail closed'
  );
  await writeReceipt('TEST', {
    signed: { candidate: { commit: 'a'.repeat(40), tree: 'b'.repeat(40), integration_head: 'a'.repeat(40) } },
  });
  assert.equal((await run('ACCEPT_OPEN')).ok, false, 'arbitrary commit and tree must fail');
  await writeReceipt('TEST', {
    signed: { candidate: { commit: head, tree: 'b'.repeat(tree.length), integration_head: head } },
  });
  assert.equal((await run('ACCEPT_OPEN')).ok, false, 'wrong tree for an existing commit must fail');
  await writeReceipt('TEST', { signed: { candidate: { commit: oldHead, tree: oldTree, integration_head: oldHead } } });
  assert.equal((await run('ACCEPT_OPEN')).ok, false, 'externally unapproved stale commit must fail');

  const siblingCommit = spawnSync('git', ['-C', projectRoot, 'commit-tree', tree, '-p', oldHead], {
    encoding: 'utf8',
    input: 'hostile sibling\n',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Gate Test',
      GIT_AUTHOR_EMAIL: 'gate@example.invalid',
      GIT_COMMITTER_NAME: 'Gate Test',
      GIT_COMMITTER_EMAIL: 'gate@example.invalid',
    },
  }).stdout.trim();
  await writeReceipt('TEST', {
    signed: { candidate: { commit: siblingCommit, tree, integration_head: siblingCommit } },
  });
  assert.equal(
    (
      await run('ACCEPT_OPEN', {
        authorizedCandidates: {
          ...authorizedCandidates,
          TEST: { commit: siblingCommit, tree, integration_head: siblingCommit },
        },
      })
    ).ok,
    false,
    'signed sibling not integrated into current HEAD must fail'
  );

  await assert.rejects(
    run('ENTRY_OPEN', { expectedIntegrationHead: oldHead }),
    /Integration HEAD does not match the gate CAS/
  );

  await writeReceipt('TEST');
  await writeFile(join(receiptDirectory, 'TEST.log'), 'substituted log\n');
  assert.equal((await run('ACCEPT_OPEN')).ok, false, 'substituted evidence bytes must fail');

  const receiptMarker = 'receipt-private-marker';
  await writeFile(join(receiptDirectory, 'TEST.json'), `[${receiptMarker}]\n`);
  const malformed = await run('ACCEPT_OPEN');
  assert.equal(malformed.accepted_targets.required[0].reason_code, 'RECEIPT_MALFORMED');
  assert.equal(JSON.stringify(malformed).includes(receiptMarker), false, 'hostile receipt excerpts must not escape');
  assert.equal(JSON.stringify(malformed).includes(receiptDirectory), false, 'receipt-store paths must not escape');

  const wrapperHome = join(directory, 'wrapper-home');
  const wrapperConfigDirectory = join(wrapperHome, '.config', 'wayland-gsd');
  await mkdir(wrapperConfigDirectory, { recursive: true });
  const configMarker = 'config-private-marker';
  await writeFile(join(wrapperConfigDirectory, 'desktop-control.json'), `[${configMarker}]\n`);
  const wrapper = spawnSync(
    process.execPath,
    [join(projectRoot, '.planning/execution/wayland-gsd-gate.mjs'), 'ENTRY_OPEN'],
    {
      cwd: projectRoot,
      encoding: 'utf8',
      env: { ...process.env, HOME: wrapperHome },
    }
  );
  assert.equal(wrapper.status, 2, 'unexpected wrapper failures must use the fail-closed exit');
  assert.deepEqual(JSON.parse(wrapper.stderr), { ok: false, error_code: 'GATE_INTERNAL_ERROR' });
  assert.equal(wrapper.stderr.includes(configMarker), false, 'hostile config excerpts must not escape');
  assert.equal(wrapper.stderr.includes(wrapperHome), false, 'external config paths must not escape');

  const verifierLibraryPath = join(projectRoot, '.planning/execution/packet-gate-lib.mjs');
  const gitCommonDirectory = spawnSync(
    'git',
    ['-C', projectRoot, 'rev-parse', '--path-format=absolute', '--git-common-dir'],
    { encoding: 'utf8' }
  ).stdout.trim();
  const validWrapperConfig = {
    schema_version: 1,
    keys: [],
    control_commit: head,
    controlled_paths: ['.planning/execution/PACKET-GATES.json', '.planning/execution/PACKET-CONTRACTS.json'],
    accepted_packets: {},
    receipt_store: { policy: 'external-absolute-read-only-cas', path: receiptDirectory },
    verifier_lib_path: verifierLibraryPath,
    verifier_lib_digest: sha(await readFile(verifierLibraryPath)),
    git_common_dir: gitCommonDirectory,
  };
  await writeFile(join(wrapperConfigDirectory, 'desktop-control.json'), `${JSON.stringify(validWrapperConfig)}\n`);
  const snapshotWrapper = spawnSync(
    process.execPath,
    [join(projectRoot, '.planning/execution/wayland-gsd-gate.mjs'), 'P2-M3'],
    { cwd: projectRoot, encoding: 'utf8', env: { ...process.env, HOME: wrapperHome } }
  );
  assert.equal(snapshotWrapper.status, 1, snapshotWrapper.stderr);
  const snapshotOutput = JSON.parse(snapshotWrapper.stdout);
  assert.equal(snapshotOutput.schema_version, 2);
  assert.equal(snapshotOutput.gate_id, 'P2-M3');
  assert.equal(
    snapshotOutput.ok,
    false,
    'immutable pinned snapshot must remain red without an authorized prerequisite'
  );

  console.log('authenticated packet gate tests: PASS');
} finally {
  await rm(directory, { recursive: true, force: true });
}
