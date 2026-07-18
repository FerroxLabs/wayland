import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const {
  MATRIX_FILE,
  TARGETS,
  TARGET_GATE_ATTESTATION_POLICY,
  TARGET_GATE_REQUIREMENTS,
  TARGET_GATE_RECEIPT_SCHEMA,
  TARGET_PROOF_GATES,
  TARGET_GATE_VERIFIED_SET_CONTRACT,
  resolveTargetGateReceiptPaths,
  validateClaimedTargetGateReceiptSet,
  verifyTargetGateReceiptFiles,
  verifyHardeningMatrix,
} = require('../../../scripts/release-acceptance/verifyHardeningMatrix');
const childProcess = require('node:child_process');
const originalExecFileSync = childProcess.execFileSync;

const COMMIT = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
const CANDIDATE = Object.freeze({ commit: COMMIT, tree: TREE });
const TRUST_COMMIT = 'c'.repeat(40);

function matrix() {
  return JSON.parse(fs.readFileSync(MATRIX_FILE, 'utf8'));
}

function targetGateReceipts(candidate = CANDIDATE) {
  return TARGET_GATE_REQUIREMENTS.map((requirement: Record<string, string>, index: number) => ({
    ...requirement,
    candidate: { ...candidate },
    authority: TARGET_GATE_RECEIPT_SCHEMA.authority,
    evidencePath: `evidence/${index}.json`,
    evidenceSha256: `sha256:${index.toString(16).padStart(64, '0')}`,
  }));
}

function repositoryCandidate() {
  const commit = String(originalExecFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' })).trim();
  const tree = String(originalExecFileSync('git', ['rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' })).trim();
  return { commit, tree };
}

function writeReceiptFiles(root: string, candidate: { commit: string; tree: string }) {
  const receiptPaths = resolveTargetGateReceiptPaths(root);
  const receipts = targetGateReceipts(candidate);
  for (let index = 0; index < receiptPaths.length; index += 1) {
    const evidencePath = path.join(root, receipts[index].evidencePath);
    fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
    fs.writeFileSync(evidencePath, JSON.stringify({ receiptId: receipts[index].receiptId, passed: true }));
    receipts[index].evidenceSha256 =
      `sha256:${crypto.createHash('sha256').update(fs.readFileSync(evidencePath)).digest('hex')}`;
    fs.mkdirSync(path.dirname(receiptPaths[index]), { recursive: true });
    fs.writeFileSync(receiptPaths[index], JSON.stringify(receipts[index]));
  }
  return receiptPaths;
}

function attestationFor(receiptPath: string, digestOverride?: string) {
  const digest = digestOverride || crypto.createHash('sha256').update(fs.readFileSync(receiptPath)).digest('hex');
  return JSON.stringify([
    {
      verificationResult: {
        statement: {
          predicateType: TARGET_GATE_ATTESTATION_POLICY.predicateType,
          subject: [{ digest: { sha256: digest } }],
        },
      },
    },
  ]);
}

function mockAttestationVerification(
  implementation: (receiptPath: string, args: string[]) => string = (receiptPath) => attestationFor(receiptPath)
) {
  return vi.spyOn(childProcess, 'execFileSync').mockImplementation((file: string, args: string[], options: object) => {
    if (file === 'git') return originalExecFileSync(file, args, options);
    if (file !== 'gh') throw new Error(`unexpected executable: ${file}`);
    return implementation(args[2], args);
  });
}

beforeEach(() => {
  process.env.WAYLAND_RELEASE_TRUST_ROOT_SHA = TRUST_COMMIT;
  process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT = process.cwd();
});

afterEach(() => {
  delete process.env.WAYLAND_RELEASE_TRUST_ROOT_SHA;
  delete process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT;
  vi.restoreAllMocks();
});

describe('M8 release hardening matrix', () => {
  it('pins every invariant, success criterion, mandatory journey, target and hardening gate', () => {
    expect(verifyHardeningMatrix()).toEqual({
      contract: 'wayland-release-hardening-matrix/1.0',
      invariants: 21,
      criteria: 31,
      journeys: 24,
      targets: 6,
      gates: 15,
      targetProofGates: 5,
      targetGateReceiptSchema: TARGET_GATE_RECEIPT_SCHEMA,
      targetGateRequirements: TARGET_GATE_REQUIREMENTS,
      conditionalCapabilities: 5,
    });
  });

  it.each([
    ['requiredInvariants', 'INV-21'],
    ['requiredCriteria', 'SC-21'],
    ['requiredJourneys', 'J25'],
    ['supportedTargets', 'linux-x64'],
    ['requiredHardeningGates', 'updater'],
  ])('rejects missing %s coverage', (field, member) => {
    const candidate = matrix();
    candidate[field] = candidate[field].filter((entry: string) => entry !== member);
    expect(() => verifyHardeningMatrix(candidate)).toThrow(/coverage or ordering mismatch/);
  });

  it('rejects unknown, duplicate and reordered coverage', () => {
    const unknown = matrix();
    unknown.requiredInvariants.push('INV-22');
    expect(() => verifyHardeningMatrix(unknown)).toThrow(/coverage or ordering mismatch/);

    const duplicate = matrix();
    duplicate.requiredCriteria.splice(1, 0, duplicate.requiredCriteria[0]);
    expect(() => verifyHardeningMatrix(duplicate)).toThrow(/coverage or ordering mismatch|duplicates/);

    const reordered = matrix();
    reordered.supportedTargets.reverse();
    expect(() => verifyHardeningMatrix(reordered)).toThrow(/coverage or ordering mismatch/);
  });

  it('keeps follow-on Cloud journey J22 outside first-preview acceptance', () => {
    const candidate = matrix();
    expect(candidate.requiredJourneys).not.toContain('J22');
    candidate.requiredJourneys.splice(21, 0, 'J22');
    expect(() => verifyHardeningMatrix(candidate)).toThrow(/coverage or ordering mismatch/);
  });

  it('rejects weakened capability-conditional gates and receipts', () => {
    for (const capability of Object.keys(matrix().capabilityConditional)) {
      const candidate = matrix();
      const gate = candidate.capabilityConditional[capability];
      const field = gate.receipts.length ? 'receipts' : gate.journeys.length ? 'journeys' : 'criteria';
      gate[field].pop();
      expect(() => verifyHardeningMatrix(candidate)).toThrow(/coverage or ordering mismatch/);
    }
  });

  it('requires the final C0 release-closure receipt without replacing C0-B or C1', () => {
    const candidate = matrix();
    expect(candidate.capabilityConditional['cowork-office'].receipts).toEqual(['C0-B', 'C1', 'C0-RELEASE-CLOSURE']);

    candidate.capabilityConditional['cowork-office'].receipts = ['C0-B', 'C1'];
    expect(() => verifyHardeningMatrix(candidate)).toThrow(
      /cowork-office conditional receipts coverage or ordering mismatch/
    );
  });

  it.each(
    TARGETS.flatMap((target: string) =>
      TARGET_PROOF_GATES.map((gate: string) => [`${target}/${gate}`, target, gate] as const)
    )
  )('rejects a missing target gate requirement and actual receipt for %s', (_label, target, gate) => {
    const candidateMatrix = matrix();
    candidateMatrix.targetGateRequirements = candidateMatrix.targetGateRequirements.filter(
      (requirement: { target: string; gate: string }) => requirement.target !== target || requirement.gate !== gate
    );
    expect(() => verifyHardeningMatrix(candidateMatrix)).toThrow(
      /target gate requirement coverage or ordering mismatch/
    );

    const receipts = targetGateReceipts().filter(
      (receipt: { target: string; gate: string }) => receipt.target !== target || receipt.gate !== gate
    );
    expect(() => validateClaimedTargetGateReceiptSet(receipts, CANDIDATE)).toThrow(
      /target gate receipt coverage or ordering mismatch/
    );
  });

  it('rejects duplicate requirement IDs and target-misbound requirements', () => {
    const duplicate = matrix();
    duplicate.targetGateRequirements[1].receiptId = duplicate.targetGateRequirements[0].receiptId;
    expect(() => verifyHardeningMatrix(duplicate)).toThrow(/requirement receipt ID duplicated/);

    const misbound = matrix();
    misbound.targetGateRequirements[0].target = 'linux-x64';
    expect(() => verifyHardeningMatrix(misbound)).toThrow(/coverage or ordering mismatch/);
  });

  it('rejects reordered target gates and a foreign receipt contract', () => {
    const reordered = matrix();
    [reordered.targetGateRequirements[0], reordered.targetGateRequirements[1]] = [
      reordered.targetGateRequirements[1],
      reordered.targetGateRequirements[0],
    ];
    expect(() => verifyHardeningMatrix(reordered)).toThrow(/coverage or ordering mismatch/);

    const foreign = matrix();
    foreign.targetGateRequirements[0].contract = 'caller-authored-proof/1.0';
    expect(() => verifyHardeningMatrix(foreign)).toThrow(/coverage or ordering mismatch/);
  });

  it('pins the M8-A target-gate receipt schema and authority', () => {
    const missingCandidateBinding = matrix();
    missingCandidateBinding.targetGateReceiptSchema.requiredFields =
      missingCandidateBinding.targetGateReceiptSchema.requiredFields.filter((field: string) => field !== 'candidate');
    expect(() => verifyHardeningMatrix(missingCandidateBinding)).toThrow(/schema fields coverage or ordering mismatch/);

    const callerAuthority = matrix();
    callerAuthority.targetGateReceiptSchema.authority = 'caller-authored-acceptance';
    expect(() => verifyHardeningMatrix(callerAuthority)).toThrow(/schema authority or contract mismatch/);
  });

  it('rejects unknown critical fields at every authority boundary', () => {
    const top = matrix();
    top.acceptAnyway = true;
    expect(() => verifyHardeningMatrix(top)).toThrow(/unknown critical fields/);

    const nested = matrix();
    nested.capabilityConditional.mcp.acceptAnyway = true;
    expect(() => verifyHardeningMatrix(nested)).toThrow(/unknown critical fields/);

    const receipt = matrix();
    receipt.targetGateRequirements[0].acceptAnyway = true;
    expect(() => verifyHardeningMatrix(receipt)).toThrow(/unknown critical fields/);

    const schema = matrix();
    schema.targetGateReceiptSchema.acceptAnyway = true;
    expect(() => verifyHardeningMatrix(schema)).toThrow(/unknown critical fields/);
  });

  it('accepts the exact canonical candidate-bound target gate receipt set', () => {
    expect(validateClaimedTargetGateReceiptSet(targetGateReceipts(), CANDIDATE)).toEqual({
      status: 'claimed-unverified',
      authoritative: false,
      candidate: CANDIDATE,
      claims: targetGateReceipts().map(
        ({ authority: _authority, candidate: _candidate, ...claim }: Record<string, unknown>) => claim
      ),
    });
  });

  it('rejects stale commit or tree bindings', () => {
    const staleCommit = targetGateReceipts();
    staleCommit[0].candidate.commit = 'd'.repeat(40);
    expect(() => validateClaimedTargetGateReceiptSet(staleCommit, CANDIDATE)).toThrow(/stale or foreign candidate/);

    const staleTree = targetGateReceipts();
    staleTree[0].candidate.tree = 'e'.repeat(40);
    expect(() => validateClaimedTargetGateReceiptSet(staleTree, CANDIDATE)).toThrow(/stale or foreign candidate/);
  });

  it('rejects malformed candidate identity, wrong authority, and bad evidence digest', () => {
    expect(() =>
      validateClaimedTargetGateReceiptSet(targetGateReceipts(), { commit: 'not-a-commit', tree: TREE })
    ).toThrow(/commit or tree is malformed/);

    const malformedReceiptCandidate = targetGateReceipts();
    malformedReceiptCandidate[0].candidate.commit = 'not-a-commit';
    expect(() => validateClaimedTargetGateReceiptSet(malformedReceiptCandidate, CANDIDATE)).toThrow(
      /commit or tree is malformed/
    );

    const wrongAuthority = targetGateReceipts();
    wrongAuthority[0].authority = 'caller-authored-acceptance';
    expect(() => validateClaimedTargetGateReceiptSet(wrongAuthority, CANDIDATE)).toThrow(/authority mismatch/);

    const badDigest = targetGateReceipts();
    badDigest[0].evidenceSha256 = `sha256:${'z'.repeat(64)}`;
    expect(() => validateClaimedTargetGateReceiptSet(badDigest, CANDIDATE)).toThrow(/evidence digest invalid/);
  });

  it('rejects duplicate, unknown, foreign, and target-misbound actual receipts', () => {
    const duplicate = targetGateReceipts();
    duplicate[1].receiptId = duplicate[0].receiptId;
    expect(() => validateClaimedTargetGateReceiptSet(duplicate, CANDIDATE)).toThrow(/receipt ID duplicated/);

    const unknown = targetGateReceipts();
    unknown[0].receiptId = 'M8-F:unknown-target:install';
    expect(() => validateClaimedTargetGateReceiptSet(unknown, CANDIDATE)).toThrow(/foreign or misbound/);

    const foreign = targetGateReceipts();
    foreign[0].contract = 'caller-authored-proof/1.0';
    expect(() => validateClaimedTargetGateReceiptSet(foreign, CANDIDATE)).toThrow(/foreign or misbound/);

    const misbound = targetGateReceipts();
    misbound[0].target = 'linux-x64';
    expect(() => validateClaimedTargetGateReceiptSet(misbound, CANDIDATE)).toThrow(/foreign or misbound/);

    const reordered = targetGateReceipts();
    [reordered[0], reordered[1]] = [reordered[1], reordered[0]];
    expect(() => validateClaimedTargetGateReceiptSet(reordered, CANDIDATE)).toThrow(/foreign or misbound/);
  });

  it('rejects unknown critical fields in actual receipts and candidate identities', () => {
    const receipt = targetGateReceipts();
    receipt[0].acceptAnyway = true;
    expect(() => validateClaimedTargetGateReceiptSet(receipt, CANDIDATE)).toThrow(/unknown critical fields/);

    const candidate = { ...CANDIDATE, acceptAnyway: true };
    expect(() => validateClaimedTargetGateReceiptSet(targetGateReceipts(), candidate)).toThrow(
      /unknown critical fields/
    );
  });
});

describe('M8 target-gate receipt authority', () => {
  it('resolves exactly 30 canonical target/gate receipt paths', () => {
    const root = path.join(os.tmpdir(), 'm8f-receipts');
    const receiptPaths = resolveTargetGateReceiptPaths(root);
    expect(receiptPaths).toHaveLength(30);
    expect(receiptPaths[0]).toBe(path.resolve(root, 'darwin-arm64', 'package-identity-signature.json'));
    expect(receiptPaths.at(-1)).toBe(path.resolve(root, 'linux-x64', 're-upgrade.json'));
    expect(new Set(receiptPaths).size).toBe(30);
  });

  it('authenticates exact files with a pinned policy and returns the only authority-bearing result', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm8f-receipts-'));
    const candidate = repositoryCandidate();
    const receiptPaths = writeReceiptFiles(root, candidate);
    const ghCalls: string[][] = [];
    mockAttestationVerification((receiptPath, args) => {
      ghCalls.push(args);
      return attestationFor(receiptPath);
    });

    const result = verifyTargetGateReceiptFiles(root, candidate);

    expect(result.contract).toBe(TARGET_GATE_VERIFIED_SET_CONTRACT);
    expect(result.authority).toBe(TARGET_GATE_RECEIPT_SCHEMA.authority);
    expect(result.candidate).toEqual(candidate);
    expect(result.receipts).toHaveLength(30);
    expect(result.receipts[0]).toMatchObject({
      receiptId: TARGET_GATE_REQUIREMENTS[0].receiptId,
      attestationVerified: true,
      receiptFile: { path: receiptPaths[0], sha256: expect.stringMatching(/^sha256:[a-f0-9]{64}$/) },
      evidenceFile: { path: expect.any(String), sha256: expect.stringMatching(/^sha256:[a-f0-9]{64}$/) },
    });
    expect(ghCalls).toHaveLength(30);
    for (const args of ghCalls) {
      expect(args).toEqual([
        'attestation',
        'verify',
        expect.any(String),
        '--repo',
        'FerroxLabs/wayland',
        '--signer-workflow',
        'FerroxLabs/wayland/.github/workflows/release-acceptance-trust-root.yml',
        '--signer-digest',
        TRUST_COMMIT,
        '--source-digest',
        TRUST_COMMIT,
        '--source-ref',
        'refs/heads/release-trust-v1',
        '--predicate-type',
        'https://slsa.dev/provenance/v1',
        '--deny-self-hosted-runners',
        '--format',
        'json',
      ]);
    }
    expect(verifyTargetGateReceiptFiles.length).toBe(2);
  });

  it('fails closed for an unsigned receipt file', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm8f-unsigned-'));
    const candidate = repositoryCandidate();
    writeReceiptFiles(root, candidate);
    mockAttestationVerification(() => {
      throw new Error('no attestation');
    });
    expect(() => verifyTargetGateReceiptFiles(root, candidate)).toThrow(/attestation verification failed/);
  });

  it('fails closed when attestation verification returns no valid signed result', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm8f-attestation-'));
    const candidate = repositoryCandidate();
    writeReceiptFiles(root, candidate);
    mockAttestationVerification(() => '[]');
    expect(() => verifyTargetGateReceiptFiles(root, candidate)).toThrow(/does not bind exact file bytes/);
  });

  it('rejects a fake candidate commit before querying GitHub attestations', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm8f-fake-candidate-'));
    const fake = { commit: 'f'.repeat(40), tree: 'e'.repeat(40) };
    writeReceiptFiles(root, fake);
    const gh = mockAttestationVerification();
    expect(() => verifyTargetGateReceiptFiles(root, fake)).toThrow(/does not exist in repository/);
    expect(gh.mock.calls.some(([file]: [string]) => file === 'gh')).toBe(false);
  });

  it('rejects a real commit paired with the wrong Git tree', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm8f-wrong-tree-'));
    const candidate = repositoryCandidate();
    const wrongTree = { ...candidate, tree: 'e'.repeat(40) };
    writeReceiptFiles(root, wrongTree);
    const gh = mockAttestationVerification();
    expect(() => verifyTargetGateReceiptFiles(root, wrongTree)).toThrow(/candidate tree mismatch/);
    expect(gh.mock.calls.some(([file]: [string]) => file === 'gh')).toBe(false);
  });

  it('rejects receipt-byte mutation not bound by the signed attestation', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm8f-mutated-'));
    const candidate = repositoryCandidate();
    const receiptPaths = writeReceiptFiles(root, candidate);
    const originalDigest = crypto.createHash('sha256').update(fs.readFileSync(receiptPaths[0])).digest('hex');
    fs.appendFileSync(receiptPaths[0], ' ');
    mockAttestationVerification((receiptPath) =>
      attestationFor(receiptPath, receiptPath === receiptPaths[0] ? originalDigest : undefined)
    );
    expect(() => verifyTargetGateReceiptFiles(root, candidate)).toThrow(/does not bind exact file bytes/);
  });

  it('rejects missing, mutated, symlinked, and escaping underlying target evidence bytes', () => {
    const candidate = repositoryCandidate();

    const mutatedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'm8f-evidence-mutated-'));
    const mutatedReceipts = writeReceiptFiles(mutatedRoot, candidate);
    const mutatedReceipt = JSON.parse(fs.readFileSync(mutatedReceipts[0], 'utf8'));
    fs.appendFileSync(path.join(mutatedRoot, mutatedReceipt.evidencePath), 'tamper');
    mockAttestationVerification();
    expect(() => verifyTargetGateReceiptFiles(mutatedRoot, candidate)).toThrow(/evidence digest mismatch/);
    vi.restoreAllMocks();

    const escapingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'm8f-evidence-escape-'));
    const escapingReceipts = writeReceiptFiles(escapingRoot, candidate);
    const escapingReceipt = JSON.parse(fs.readFileSync(escapingReceipts[0], 'utf8'));
    escapingReceipt.evidencePath = '../foreign.json';
    fs.writeFileSync(escapingReceipts[0], JSON.stringify(escapingReceipt));
    mockAttestationVerification();
    expect(() => verifyTargetGateReceiptFiles(escapingRoot, candidate)).toThrow(/evidence escapes receipt root/);
  });

  it('rejects signed JSON with unknown critical fields', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm8f-signed-fields-'));
    const candidate = repositoryCandidate();
    const receiptPaths = writeReceiptFiles(root, candidate);
    const receipt = JSON.parse(fs.readFileSync(receiptPaths[0], 'utf8'));
    receipt.acceptAnyway = true;
    fs.writeFileSync(receiptPaths[0], JSON.stringify(receipt));
    mockAttestationVerification();
    expect(() => verifyTargetGateReceiptFiles(root, candidate)).toThrow(/unknown critical fields/);
  });

  it('rejects evidence digest reuse across distinct requirements by default', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm8f-reuse-'));
    const candidate = repositoryCandidate();
    const receiptPaths = writeReceiptFiles(root, candidate);
    const first = JSON.parse(fs.readFileSync(receiptPaths[0], 'utf8'));
    const second = JSON.parse(fs.readFileSync(receiptPaths[1], 'utf8'));
    second.evidenceSha256 = first.evidenceSha256;
    fs.writeFileSync(receiptPaths[1], JSON.stringify(second));
    mockAttestationVerification();
    expect(() => verifyTargetGateReceiptFiles(root, candidate)).toThrow(/evidence digest reused/);
    expect(TARGET_GATE_ATTESTATION_POLICY.evidenceDigestReuseAllowlist).toEqual([]);
  });

  it('rejects missing, non-regular, and symlinked canonical receipt paths', () => {
    const candidate = repositoryCandidate();

    const missingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'm8f-missing-'));
    writeReceiptFiles(missingRoot, candidate);
    fs.unlinkSync(resolveTargetGateReceiptPaths(missingRoot)[0]);
    expect(() => verifyTargetGateReceiptFiles(missingRoot, candidate)).toThrow(/receipt file is missing/);

    const directoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'm8f-directory-'));
    const directoryPaths = writeReceiptFiles(directoryRoot, candidate);
    fs.unlinkSync(directoryPaths[0]);
    fs.mkdirSync(directoryPaths[0]);
    expect(() => verifyTargetGateReceiptFiles(directoryRoot, candidate)).toThrow(/not a regular file/);

    const symlinkRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'm8f-symlink-'));
    const symlinkPaths = writeReceiptFiles(symlinkRoot, candidate);
    const original = `${symlinkPaths[0]}.original`;
    fs.renameSync(symlinkPaths[0], original);
    fs.symlinkSync(original, symlinkPaths[0]);
    expect(() => verifyTargetGateReceiptFiles(symlinkRoot, candidate)).toThrow(/not a regular file/);
  });

  it('does not allow a caller to replace repository, workflow, runner, predicate, or source-digest policy', () => {
    expect(Object.isFrozen(TARGET_GATE_ATTESTATION_POLICY)).toBe(true);
    expect(TARGET_GATE_ATTESTATION_POLICY).toEqual({
      repository: 'FerroxLabs/wayland',
      signerWorkflow: 'FerroxLabs/wayland/.github/workflows/release-acceptance-trust-root.yml',
      sourceRef: 'refs/heads/release-trust-v1',
      predicateType: 'https://slsa.dev/provenance/v1',
      runner: 'github-hosted',
      evidenceDigestReuseAllowlist: [],
    });
    expect(verifyTargetGateReceiptFiles.length).toBe(2);
  });
});
